
import { watchAuthState } from "./auth.js";
import { getPublishedProducts } from "./product-service.js";
import { createProductCard } from "./product-card.js";
import { createMembership } from "./membership.js";
import { createWishlist } from "./wishlist.js";
import { createAccountDrawer } from "./account-drawer.js";

document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  const collection = document.querySelector("#collection");
  const hero = document.querySelector(".hero");
  const heroInner = document.querySelector(".hero-inner");
  const productsArea = collection?.querySelector(".products");

  if (!main || !collection || !hero || !heroInner || !productsArea) {
    console.error("Homepage setup failed: required HTML elements are missing.");
    return;
  }

  productsArea.replaceChildren();

  let products = [];
  const savedProducts = new Set();
  let wishlistMode = false;
  let activeCategory = "All";
  let drawerOpen = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let directionAnchorY = window.scrollY;
  let scrollDirection = "down";
  let ticking = false;
  let hideBarTimer = null;

  const SCROLL_THRESHOLD = 35;
  const ANIMATION_DURATION = 650;

  // --------------------------------------------------
  // WELCOME GREETING
  // --------------------------------------------------

  const greetingBox = document.createElement("div");
  greetingBox.className = "vf-welcome";
  greetingBox.innerHTML = `
    <p class="vf-greeting" id="vf-greeting">Hey there!</p>
    <p class="vf-welcome-message">
      We're really glad you've come again.
    </p>
  `;

  heroInner.appendChild(greetingBox);

  try {
    watchAuthState((user) => {
      const greeting = document.querySelector("#vf-greeting");
      if (!greeting) return;

      const firstName = user?.displayName?.trim()?.split(/\s+/)[0];
      greeting.textContent = firstName
        ? `Hey, ${firstName}!`
        : "Hey there!";
    });
  } catch (error) {
    console.warn("Could not load the customer greeting.", error);
  }

  // --------------------------------------------------
  // CATEGORY NAVIGATION
  // --------------------------------------------------

  const categories = document.createElement("nav");
  categories.className = "vf-categories";
  categories.setAttribute("aria-label", "Product categories");

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "vf-category-menu";
  menuButton.setAttribute("aria-label", "Open menu");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = "<span></span><span></span><span></span>";

  const categoryNames = [
    "All",
    "Shirts",
    "T-shirts",
    "Jeans",
    "Trousers"
  ];

  categoryNames.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vf-category";
    button.textContent = category;
    button.classList.toggle("active", category === "All");

    button.addEventListener("click", () => {
      activeCategory = category;
      wishlistMode = false;

      categories.querySelectorAll(".vf-category").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderProducts();
    });

    categories.appendChild(button);
  });

  categories.prepend(menuButton);

  collection.querySelector(".section-head")?.after(categories);

  const categorySpacer = document.createElement("div");
  categorySpacer.className = "vf-category-spacer";
  categories.before(categorySpacer);

  // ACCOUNT DRAWER MODULE WILL BE INITIALIZED AFTER BOTTOM NAV
  // --------------------------------------------------
  // FLOATING CATEGORY BAR
  // --------------------------------------------------

  function updateMenuVisibility() {
    const currentScrollY = window.scrollY;
    const movement = currentScrollY - directionAnchorY;

    if (Math.abs(movement) >= SCROLL_THRESHOLD) {
      scrollDirection = movement < 0 ? "up" : "down";
      directionAnchorY = currentScrollY;
    }

    const pastIntro = hero.getBoundingClientRect().bottom <= 0;
    const showBar = pastIntro && scrollDirection === "up";

    menuButton.classList.add("is-visible");

    if (showBar) {
      if (hideBarTimer !== null) {
        clearTimeout(hideBarTimer);
        hideBarTimer = null;
      }

      if (!categories.classList.contains("vf-categories-floating")) {
        categorySpacer.style.height = `${categories.offsetHeight}px`;
        categorySpacer.classList.add("is-active");
        categories.classList.remove("vf-categories-hiding");
        categories.classList.add("vf-categories-floating");
      } else {
        categories.classList.remove("vf-categories-hiding");
      }
    } else if (
      categories.classList.contains("vf-categories-floating") &&
      !categories.classList.contains("vf-categories-hiding")
    ) {
      categories.classList.add("vf-categories-hiding");

      hideBarTimer = window.setTimeout(() => {
        categories.classList.remove(
          "vf-categories-floating",
          "vf-categories-hiding"
        );

        categorySpacer.classList.remove("is-active");
        categorySpacer.style.height = "0px";
        hideBarTimer = null;
      }, ANIMATION_DURATION);
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateMenuVisibility);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateMenuVisibility);
  updateMenuVisibility();
  // PREMIUM MEMBERSHIP MODULE
  const { showMembership, showHome, membership } = createMembership({
    collection,
    hero
  });
  // WISHLIST MODULE
  const { openWishlist } = createWishlist({
    getProducts: () => products,
    savedProducts,
    updateHearts,
    renderProducts,
    membership,
    showMembership,
    showHome
  });

  // --------------------------------------------------
  // BOTTOM NAVIGATION
  // --------------------------------------------------

  const bottomNav = document.createElement("nav");
  bottomNav.className = "vf-bottom-nav";
  bottomNav.setAttribute("aria-label", "Bottom navigation");

  const navItems = [
    { label: "Home", icon: "⌂" },
    { label: "Membership", icon: "♛" },
    { label: "Cart", icon: "🛍" },
    { label: "Wishlist", icon: "♡" },
    { label: "Profile", icon: "♙" }
  ];

  navItems.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML =
      `<span aria-hidden="true">${item.icon}</span>${item.label}`;
    button.dataset.navItem = item.label;
    button.classList.toggle("active", index === 0);

    button.addEventListener("click", () => {
      bottomNav.querySelectorAll("button").forEach((navButton) => {
        navButton.classList.toggle("active", navButton === button);
      });

      if (item.label === "Home") {
        showHome();
        wishlistMode = false;
        activeCategory = "All";

        categories.querySelectorAll(".vf-category").forEach((categoryButton) => {
          categoryButton.classList.toggle(
            "active",
            categoryButton.textContent === "All"
          );
        });

        renderProducts();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (item.label === "Membership") {
  showMembership();
      }

      if (item.label === "Cart") {
        document.querySelector("[data-open-cart]")?.click();
      }

      if (item.label === "Wishlist") {
  openWishlist();
}

      if (item.label === "Profile") {
        window.location.href = "login.html";
      }
    });

    bottomNav.appendChild(button);
  });

  document.body.appendChild(bottomNav);
        const { openAccountDrawer, closeAccountDrawer } =
    createAccountDrawer({
      menuButton,
      openWishlist,
      showMembership,
      bottomNav
    });

  // --------------------------------------------------
  // PRODUCT HELPERS
  // --------------------------------------------------

  function inferCategory(product) {
    const category = String(product.dataset.category || "").toLowerCase();
    const id = String(product.dataset.id || "").toLowerCase();
    const name = String(product.dataset.name || "").toLowerCase();
    const combined = `${category} ${id} ${name}`;

    if (combined.includes("jean")) return "Jeans";

    if (
      combined.includes("t-shirt") ||
      combined.includes("tshirt") ||
      combined.includes("t shirt")
    ) {
      return "T-shirts";
    }

    if (combined.includes("trouser")) return "Trousers";
    if (combined.includes("shirt")) return "Shirts";

    return "Other";
  }

  function updateHearts() {
    products.forEach((product) => {
      const isSaved = savedProducts.has(product.dataset.id);
      const heart = product.querySelector(".vf-heart");

      if (!heart) return;

      heart.classList.toggle("saved", isSaved);
      heart.classList.toggle("is-saved", isSaved);
      heart.textContent = isSaved ? "♥" : "♡";
      heart.setAttribute("aria-pressed", String(isSaved));
      heart.setAttribute(
        "aria-label",
        isSaved ? "Remove from wishlist" : "Add to wishlist"
      );
    });
  }

  function renderProducts() {
    let visibleCount = 0;

    products.forEach((product) => {
      const matchesCategory =
        activeCategory === "All" ||
        inferCategory(product) === activeCategory;

      const matchesWishlist =
        !wishlistMode || savedProducts.has(product.dataset.id);

      const visible = matchesCategory && matchesWishlist;
      product.hidden = !visible;

      if (visible) visibleCount++;
    });

    let emptyMessage = collection.querySelector(".vf-empty");

    if (visibleCount === 0) {
      if (!emptyMessage) {
        emptyMessage = document.createElement("p");
        emptyMessage.className = "vf-empty";
        productsArea.after(emptyMessage);
      }

      emptyMessage.textContent = wishlistMode
        ? "Your wishlist is empty. Tap ♡ on a product to save it."
        : activeCategory === "All"
          ? "No published products are available yet."
          : `No ${activeCategory.toLowerCase()} products are available yet.`;
    } else {
      emptyMessage?.remove();
    }

    updateHearts();
  }

    // --------------------------------------------------
  // PRODUCT CARD
  // --------------------------------------------------

  // --------------------------------------------------
  // LOAD PRODUCTS FROM FIRESTORE
  // --------------------------------------------------
      
  async function loadProducts() {
    productsArea.replaceChildren();

for (let i = 0; i < 4; i++) {
  const skeleton = document.createElement("article");
  skeleton.className = "product vf-skeleton-card";
  skeleton.setAttribute("aria-hidden", "true");

  const media = document.createElement("div");
  media.className = "product-media vf-skeleton-block vf-skeleton-media";

  const details = document.createElement("div");
  details.className = "product-details";

  const category = document.createElement("div");
  category.className = "vf-skeleton-block vf-skeleton-category";

  const title = document.createElement("div");
  title.className = "vf-skeleton-block vf-skeleton-title";

  const price = document.createElement("div");
  price.className = "vf-skeleton-block vf-skeleton-price";

  details.append(category, title, price);
  skeleton.append(media, details);
  productsArea.appendChild(skeleton);
}

    try {
      const publishedProducts = await getPublishedProducts();

            products = publishedProducts
        .filter((item) => item && item.id)
        .map((item) =>
          createProductCard(item, {
            isSaved: savedProducts.has(String(item.id)),
            onWishlistToggle: (product, button) => {
              const productId = String(product.id);

              if (savedProducts.has(productId)) {
                savedProducts.delete(productId);
              } else {
                savedProducts.add(productId);
                button.classList.remove("heart-pop");
                void button.offsetWidth;
                button.classList.add("heart-pop");
              }

              updateHearts();
              renderProducts();
            }
          })
        );

      productsArea.replaceChildren();

      if (products.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "vf-empty";
        emptyMessage.textContent =
          "No published products are available yet.";

        productsArea.appendChild(emptyMessage);
        return;
      }

      products.forEach((product) => {
        productsArea.appendChild(product);
      });

      renderProducts();
    } catch (error) {
      console.error("Could not load products from Firestore:", error);

      productsArea.replaceChildren();

      const errorMessage = document.createElement("p");
      errorMessage.className = "vf-error";
      errorMessage.textContent =
        "We couldn't load the collection. Please refresh and try again.";

      productsArea.appendChild(errorMessage);
    }
      loadProducts();
});
  }


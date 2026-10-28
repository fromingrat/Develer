
import { watchAuthState } from "./auth.js";
import { getPublishedProducts } from "./product-service.js";

document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  const collection = document.querySelector("#collection");
  const hero = document.querySelector(".hero");
  const heroInner = document.querySelector(".hero-inner");
  const productsArea = collection?.querySelector(".products");

  if (!main || !collection || !hero || !heroInner || !productsArea) return;

  // Firestore is the source of truth for the product catalogue.
  // Remove the hardcoded demo cards from the rendered catalogue.
  productsArea.replaceChildren();

  let products = [];
  let firestoreProducts = [];
  const savedProducts = new Set();

  let wishlistMode = false;
  let activeCategory = "All";

  // Welcome greeting
  const greetingBox = document.createElement("div");
  greetingBox.className = "vf-welcome";
  greetingBox.innerHTML = `
    <p class="vf-greeting" id="vf-greeting">Hey there!</p>
    <p class="vf-welcome-message">We're really glad you've come again.</p>
  `;
  heroInner.appendChild(greetingBox);

  try {
    watchAuthState((user) => {
      const greeting = document.querySelector("#vf-greeting");
      if (!greeting) return;

      const name = user?.displayName?.trim()?.split(/\s+/)[0];
      greeting.textContent = name ? `Hey, ${name}!` : "Hey there!";
    });
  } catch (error) {
    console.warn("Could not load the customer greeting.", error);
  }

  // Category bar
  const categories = document.createElement("nav");
  categories.className = "vf-categories";
  categories.setAttribute("aria-label", "Product categories");

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "vf-category-menu";
  menuButton.setAttribute("aria-label", "Open menu");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;

  // Account drawer
  const menuOverlay = document.createElement("div");
  menuOverlay.className = "vf-menu-overlay";
  menuOverlay.setAttribute("aria-hidden", "true");

  const accountDrawer = document.createElement("aside");
  accountDrawer.className = "vf-account-drawer";
  accountDrawer.setAttribute("aria-label", "Account menu");
  accountDrawer.setAttribute("aria-hidden", "true");
  accountDrawer.innerHTML = `
    <div class="vf-drawer-header">
      <div class="vf-profile-avatar" id="vf-profile-avatar">V</div>
      <div class="vf-profile-info">
        <p class="vf-profile-name" id="vf-profile-name">Welcome</p>
        <p class="vf-profile-email" id="vf-profile-email">Sign in to your account</p>
      </div>
      <button class="vf-drawer-close" type="button"
        aria-label="Close menu">×</button>
    </div>

    <div class="vf-drawer-greeting">
      <p id="vf-drawer-greeting">Hey there!</p>
      <span>Welcome to Velform</span>
    </div>

    <nav class="vf-drawer-links" aria-label="Account options">
      <a href="setup.html" data-menu-item="info">
        <span>My Info</span><span aria-hidden="true">›</span>
      </a>
      <button type="button" data-menu-item="orders">
        <span>Orders</span><span aria-hidden="true">›</span>
      </button>
      <button type="button" data-menu-item="membership">
        <span>Membership</span><span aria-hidden="true">›</span>
      </button>
      <button type="button" data-menu-item="cart">
        <span>Cart</span><span aria-hidden="true">›</span>
      </button>
      <button type="button" data-menu-item="wishlist">
        <span>Wishlist</span><span aria-hidden="true">›</span>
      </button>
      <a href="#about" data-menu-item="about">
        <span>About Us</span><span aria-hidden="true">›</span>
      </a>
      <a href="privacy.html" data-menu-item="privacy">
        <span>Privacy Policy</span><span aria-hidden="true">›</span>
      </a>
      <button type="button" data-menu-item="account">
        <span>Account Details</span><span aria-hidden="true">›</span>
      </button>
    </nav>

    <button class="vf-drawer-logout" type="button" id="vf-drawer-logout">
      Log Out
    </button>

    <div class="vf-drawer-footer">VELFORM</div>
  `;

  document.body.append(menuOverlay, accountDrawer);

  let drawerOpen = false;
  let touchStartX = 0;
  let touchStartY = 0;

  function openAccountDrawer() {
    drawerOpen = true;
    menuOverlay.classList.add("is-open");
    accountDrawer.classList.add("is-open");
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close menu");
    menuOverlay.setAttribute("aria-hidden", "false");
    accountDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("vf-menu-open");
  }

  function closeAccountDrawer() {
    drawerOpen = false;
    menuOverlay.classList.remove("is-open");
    accountDrawer.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
    menuOverlay.setAttribute("aria-hidden", "true");
    accountDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("vf-menu-open");
  }

  menuButton.addEventListener("click", () => {
    if (drawerOpen) closeAccountDrawer();
    else openAccountDrawer();
  });

  accountDrawer.querySelector(".vf-drawer-close")
    .addEventListener("click", closeAccountDrawer);

  menuOverlay.addEventListener("click", closeAccountDrawer);

  // Swipe right to close the account drawer.
  accountDrawer.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  accountDrawer.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    if (deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY)) {
      closeAccountDrawer();
    }
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawerOpen) {
      closeAccountDrawer();
    }
  });

  // Update account information when authentication changes.
  try {
    watchAuthState((user) => {
      const name = user?.displayName?.trim() || "";
      const firstName = name.split(/\s+/)[0];

      accountDrawer.querySelector("#vf-profile-name").textContent =
        name || "Welcome";

      accountDrawer.querySelector("#vf-profile-email").textContent =
        user?.email || "Sign in to your account";

      accountDrawer.querySelector("#vf-profile-avatar").textContent =
        firstName ? firstName.charAt(0).toUpperCase() : "V";

      accountDrawer.querySelector("#vf-drawer-greeting").textContent =
        firstName ? `Hey, ${firstName}!` : "Hey there!";

      accountDrawer.querySelector("#vf-drawer-logout").textContent =
        user ? "Log Out" : "Sign In";
    });
  } catch (error) {
    console.warn("Could not update account information.", error);
  }

  accountDrawer.querySelector("#vf-drawer-logout")
    .addEventListener("click", async () => {
      try {
        const { signOutUser } = await import("./auth.js");
        const { auth } = await import("./firebase.js");

        if (auth.currentUser) {
          await signOutUser();
          closeAccountDrawer();
          window.location.href = "index.html";
        } else {
          window.location.href = "login.html";
        }
      } catch (error) {
        console.error("Account action failed:", error);
        alert("Unable to complete this action. Please try again.");
      }
    });

  // Categories
  categories.appendChild(menuButton);

  ["All", "Shirts", "T-shirts", "Jeans", "Trousers"].forEach((category) => {
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

  collection.querySelector(".section-head")?.after(categories);

  // Floating category bar
  const categorySpacer = document.createElement("div");
  categorySpacer.className = "vf-category-spacer";
  categories.before(categorySpacer);

  let directionAnchorY = window.scrollY;
  let scrollDirection = "down";
  let ticking = false;
  let hideBarTimer = null;

  const SCROLL_THRESHOLD = 35;
  const ANIMATION_DURATION = 650;

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

  // Membership preview
  const membership = document.createElement("section");
  membership.className = "vf-membership";
  membership.id = "vf-membership";
  membership.innerHTML = `
    <div class="vf-member-icon" aria-hidden="true">♛</div>
    <h2>Velform Membership</h2>
    <p>Discover member benefits, exclusive offers and a more rewarding way to shop.</p>
    <button type="button" id="vf-membership-info">Explore membership</button>
  `;

  collection.after(membership);

  document.querySelector("#vf-membership-info")?.addEventListener("click", () => {
    alert("Membership is a preview. Registration and member benefits are not active yet.");
  });

  // Connect account menu actions.
  accountDrawer.querySelectorAll("[data-menu-item]").forEach((item) => {
    item.addEventListener("click", (event) => {
      const action = item.dataset.menuItem;

      if (action === "orders") {
        event.preventDefault();
        closeAccountDrawer();
        alert("Your Orders page will be connected in the next step.");
      }

      if (action === "membership") {
        event.preventDefault();
        closeAccountDrawer();
        membership.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (action === "cart") {
        event.preventDefault();
        closeAccountDrawer();
        document.querySelector("[data-open-cart]")?.click();
      }

      if (action === "wishlist") {
        event.preventDefault();
        closeAccountDrawer();
        wishlistMode = true;
        renderProducts();
        collection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (action === "account") {
        event.preventDefault();
        closeAccountDrawer();
        window.location.href = "login.html";
      }

      if (action === "about" || action === "info" || action === "privacy") {
        closeAccountDrawer();
      }
    });
  });

  // Bottom navigation
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
    button.classList.toggle("active", index === 0);

    button.addEventListener("click", () => {
      bottomNav.querySelectorAll("button").forEach((navButton) => {
        navButton.classList.toggle("active", navButton === button);
      });

      if (item.label === "Home") {
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
        membership.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (item.label === "Cart") {
        document.querySelector("[data-open-cart]")?.click();
      }

      if (item.label === "Wishlist") {
        wishlistMode = true;
        renderProducts();
        collection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (item.label === "Profile") {
        window.location.href = "login.html";
      }
    });

    bottomNav.appendChild(button);
  });

  document.body.appendChild(bottomNav);

  // Category matching uses the Firestore category field first.
  function inferCategory(product) {
    const category = (product.dataset.category || "").toLowerCase();
    const id = (product.dataset.id || "").toLowerCase();
    const name = (product.dataset.name || "").toLowerCase();
    const combined = `${category} ${id} ${name}`;

    if (combined.includes("jean")) return "Jeans";
    if (combined.includes("t-shirt") || combined.includes("tshirt")) {
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

  // Build a product card safely from Firestore data.
  function createProductCard(item) {
    const card = document.createElement("article");
    card.className = "product";

    card.dataset.id = item.id;
    card.dataset.name = item.name || "Unnamed product";
    card.dataset.price = String(Number(item.price) || 0);
    card.dataset.category = item.category || "";

    const media = document.createElement("div");
    media.className = "product-media";

    const fallback = document.createElement("span");
    fallback.className = "fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.appendChild(document.createTextNode("VELFORM"));

    const fallbackLabel = document.createElement("small");
    fallbackLabel.textContent = item.category || "Clothing";
    fallback.appendChild(fallbackLabel);
    media.appendChild(fallback);

    // Supports imageUrl or image in the Firestore document.
    const imageUrl = item.imageUrl || item.image || "";

    if (imageUrl) {
      try {
        const url = new URL(imageUrl);

        if (url.protocol === "https:" || url.protocol === "http:") {
          const image = document.createElement("img");
          image.src = url.href;
          image.alt = item.name || "Velform product";
          image.loading = "lazy";
          image.width = 900;
          image.height = 1125;

          image.addEventListener("error", () => {
            image.classList.add("is-hidden");
          });

          media.appendChild(image);
        }
      } catch {
        // Keep the fallback if the image URL is invalid.
      }
    }

    const top = document.createElement("div");
    top.className = "product-top";

    const heading = document.createElement("h3");
    heading.textContent = item.name || "Unnamed product";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(item.price) || 0);

    top.append(heading, price);

    const description = document.createElement("p");
    description.className = "product-note";
    description.textContent = item.description || "";

    const sizes = document.createElement("fieldset");
    sizes.className = "sizes";

    const legend = document.createElement("legend");
    legend.textContent = "Size";

    const options = document.createElement("div");
    options.className = "size-options";

    // Temporary options only. Real variant inventory is not connected yet.
    ["S", "M", "L", "XL"].forEach((size) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      const span = document.createElement("span");

      input.type = "radio";
      input.name = `size-${item.id}`;
      input.value = size;
      span.textContent = size;

      label.append(input, span);
      options.appendChild(label);
    });

    sizes.append(legend, options);

    const error = document.createElement("p");
    error.className = "size-error";
    error.setAttribute("role", "alert");
    error.hidden = true;
    error.textContent = "Please choose a size first.";

    const addButton = document.createElement("button");
    addButton.className = "btn btn-dark add-to-cart";
    addButton.type = "button";
    addButton.textContent = "Add to cart";

    card.append(media, top);

    if (description


import { watchAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  const collection = document.querySelector("#collection");
  const hero = document.querySelector(".hero");
  const heroInner = document.querySelector(".hero-inner");
  const products = [...document.querySelectorAll(".product")];

  if (!main || !collection || !hero || !heroInner) return;

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

  // Three-line menu button before All
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

  menuButton.addEventListener("click", () => {
    // Menu actions can be added later.
  });

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

  // Show the category bar only while scrolling up after the intro.

  // Show the category bar while scrolling up after the intro.
  let previousScrollY = window.scrollY;
  let scrollDirection = "down";
  let ticking = false;
  let hideBarTimer = null;

  function updateMenuVisibility() {
    const currentScrollY = window.scrollY;
    const heroBottom = hero.getBoundingClientRect().bottom;

    if (currentScrollY < previousScrollY) {
      scrollDirection = "up";
    } else if (currentScrollY > previousScrollY) {
      scrollDirection = "down";
    }

    const pastIntro = heroBottom <= 0;
    const showBar = pastIntro && scrollDirection === "up";

    // Keep the menu button visible beside All at all times.
    menuButton.classList.add("is-visible");

    if (showBar) {
      // Cancel a pending exit if the user scrolls up again.
      if (hideBarTimer !== null) {
        clearTimeout(hideBarTimer);
        hideBarTimer = null;
      }

      categories.classList.remove("vf-categories-hiding");

      if (!categories.classList.contains("vf-categories-floating")) {
        categories.classList.add("vf-categories-floating");
      }
    } else if (categories.classList.contains("vf-categories-floating")) {
      // Play the exit animation before returning the bar to its normal place.
      categories.classList.add("vf-categories-hiding");

      if (hideBarTimer === null) {
        hideBarTimer = window.setTimeout(() => {
          if (
            categories.classList.contains("vf-categories-hiding") &&
            !(hero.getBoundingClientRect().bottom <= 0 &&
              scrollDirection === "up")
          ) {
            categories.classList.remove(
              "vf-categories-floating",
              "vf-categories-hiding"
            );
          }

          hideBarTimer = null;
        }, 340);
      }
    }

    previousScrollY = currentScrollY;
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


  // Product ratings and wishlist buttons
  products.forEach((product) => {
    const id = product.dataset.id;
    const media = product.querySelector(".product-media");
    const tools = document.createElement("div");
    tools.className = "vf-product-tools";

    tools.innerHTML = `
      <span class="vf-rating" aria-label="Sample rating">★ 4.8 <small>(Sample)</small></span>
      <button class="vf-heart" type="button"
        aria-label="Add to wishlist" aria-pressed="false">♡</button>
    `;

    if (media) media.after(tools);

    tools.querySelector(".vf-heart").addEventListener("click", () => {
      if (savedProducts.has(id)) {
        savedProducts.delete(id);
      } else {
        savedProducts.add(id);
      }

      updateHearts();
      if (wishlistMode) renderProducts();
    });
  });

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
    button.innerHTML = `<span aria-hidden="true">${item.icon}</span>${item.label}`;
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

  function inferCategory(product) {
    const id = (product.dataset.id || "").toLowerCase();
    const name = (product.dataset.name || "").toLowerCase();

    if (id.includes("jean") || name.includes("jean")) return "Jeans";
    if (name.includes("t-shirt") || name.includes("tshirt")) return "T-shirts";
    if (name.includes("trouser")) return "Trousers";
    return "Shirts";
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
        collection.querySelector(".products")?.after(emptyMessage);
      }

      emptyMessage.textContent = wishlistMode
        ? "Your wishlist is empty. Tap ♡ on a product to save it."
        : `No ${activeCategory.toLowerCase()} products are available yet.`;
    } else {
      emptyMessage?.remove();
    }

    updateHearts();
  }

  renderProducts();
});

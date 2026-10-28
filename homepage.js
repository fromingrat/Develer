
import { watchAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  const topMenu = document.querySelector(".site-top");
  const collection = document.querySelector("#collection");
  const products = [...document.querySelectorAll(".product")];

  if (!main || !collection) return;

  const savedProducts = new Set();
  let wishlistMode = false;
  let lastScrollY = window.scrollY;
  let activeCategory = "All";

  // Homepage introduction
  const intro = document.createElement("section");
  intro.className = "vf-intro";
  intro.innerHTML = `
    <p class="vf-greeting" id="vf-greeting">Hey there!</p>
    <h2>Wear your own standard.</h2>
    <p class="vf-tagline">Thoughtful menswear. Everyday confidence.</p>
  `;
  main.insertBefore(intro, collection);

  // Update greeting when Firebase authentication changes
  try {
    watchAuthState((user) => {
      const greeting = document.querySelector("#vf-greeting");
      if (!greeting) return;

      const name = user?.displayName?.trim()?.split(" ")[0];
      greeting.textContent = name ? `Hey, ${name}!` : "Hey there!";
    });
  } catch (error) {
    console.warn("Could not load the user greeting.", error);
  }

  // Hide the top menu while scrolling down; restore while scrolling up
  window.addEventListener("scroll", () => {
    const currentY = window.scrollY;
    const scrollingDown = currentY > lastScrollY;

    if (topMenu && currentY > 150) {
      topMenu.classList.toggle("vf-hidden", scrollingDown);
    } else if (topMenu) {
      topMenu.classList.remove("vf-hidden");
    }

    lastScrollY = currentY;
  }, { passive: true });

  // Category filters
  const categories = document.createElement("nav");
  categories.className = "vf-categories";
  categories.setAttribute("aria-label", "Product categories");

  ["All", "Shirts", "T-shirts", "Jeans", "Trousers"].forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vf-category";
    button.textContent = category;
    button.classList.toggle("active", category === "All");

    button.addEventListener("click", () => {
      activeCategory = category;
      wishlistMode = false;

      categories.querySelectorAll("button").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderProducts();
    });

    categories.appendChild(button);
  });

  collection.querySelector(".section-head")?.after(categories);

  // Product rating and wishlist buttons
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
    else product.prepend(tools);

    const heart = tools.querySelector(".vf-heart");

    heart.addEventListener("click", () => {
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

  document.querySelector("#vf-membership-info").addEventListener("click", () => {
    alert("Membership is a preview. Member registration and benefits are not active yet.");
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
        renderProducts();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (item.label === "Membership") {
        document.querySelector("#vf-membership").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      if (item.label === "Cart") {
        document.querySelector("#open-cart")?.click();
      }

      if (item.label === "Wishlist") {
        wishlistMode = true;
        renderProducts();
        collection.scrollIntoView({ behavior: "smooth" });
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
                          


import { watchAuthState } from "./auth.js";
import { getPublishedProducts } from "./product-service.js";

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

  // --------------------------------------------------
  // ACCOUNT DRAWER
  // --------------------------------------------------

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
        <p class="vf-profile-email" id="vf-profile-email">
          Sign in to your account
        </p>
      </div>

      <button
        class="vf-drawer-close"
        type="button"
        aria-label="Close menu"
      >×</button>
    </div>

    <div class="vf-drawer-greeting">
      <p id="vf-drawer-greeting">Hey there!</p>
      <span>Welcome to Velform</span>
    </div>

    <nav class="vf-drawer-links" aria-label="Account options">
      <a href="setup.html" data-menu-item="info">
        <span>My Info</span><span>›</span>
      </a>

      <button type="button" data-menu-item="orders">
        <span>Orders</span><span>›</span>
      </button>

      <button type="button" data-menu-item="membership">
        <span>Membership</span><span>›</span>
      </button>

      <button type="button" data-menu-item="cart">
        <span>Cart</span><span>›</span>
      </button>

      <button type="button" data-menu-item="wishlist">
        <span>Wishlist</span><span>›</span>
      </button>

      <a href="#about" data-menu-item="about">
        <span>About Us</span><span>›</span>
      </a>

      <a href="privacy.html" data-menu-item="privacy">
        <span>Privacy Policy</span><span>›</span>
      </a>

      <button type="button" data-menu-item="account">
        <span>Account Details</span><span>›</span>
      </button>
    </nav>

    <button
      class="vf-drawer-logout"
      type="button"
      id="vf-drawer-logout"
    >Sign In</button>

    <div class="vf-drawer-footer">VELFORM</div>
  `;

  document.body.append(menuOverlay, accountDrawer);

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
    if (drawerOpen) {
      closeAccountDrawer();
    } else {
      openAccountDrawer();
    }
  });

  accountDrawer
    .querySelector(".vf-drawer-close")
    .addEventListener("click", closeAccountDrawer);

  menuOverlay.addEventListener("click", closeAccountDrawer);

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

  try {
    watchAuthState((user) => {
      const fullName = user?.displayName?.trim() || "";
      const firstName = fullName.split(/\s+/)[0];

      accountDrawer.querySelector("#vf-profile-name").textContent =
        fullName || "Welcome";

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

  accountDrawer
    .querySelector("#vf-drawer-logout")
    .addEventListener("click", async () => {
      try {
        const { signOutUser } = await import("./auth.js");
const { auth } = await import("../firebase.js");

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

  // --------------------------------------------------
  // MEMBERSHIP PREVIEW
  // --------------------------------------------------

  const membership = document.createElement("section");
  membership.className = "vf-membership";
  membership.id = "vf-membership";

  membership.innerHTML = `
    <div class="vf-member-icon" aria-hidden="true">♛</div>
    <h2>Velform Membership</h2>
    <p>
      Discover member benefits, exclusive offers and a more rewarding
      way to shop.
    </p>
    <button type="button" id="vf-membership-info">
      Explore membership
    </button>
  `;

  collection.after(membership);

  document.querySelector("#vf-membership-info")
    ?.addEventListener("click", () => {
      alert(
        "Membership is a preview. Registration and member benefits " +
        "are not active yet."
      );
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
        membership.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      if (item.label === "Cart") {
        document.querySelector("[data-open-cart]")?.click();
      }

      if (item.label === "Wishlist") {
        wishlistMode = true;
        renderProducts();

        collection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      if (item.label === "Profile") {
        window.location.href = "login.html";
      }
    });

    bottomNav.appendChild(button);
  });

  document.body.appendChild(bottomNav);

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
  // STOCK AND VARIANTS
  // --------------------------------------------------

  function getAvailableVariants(item) {
    if (!Array.isArray(item.variants)) return [];

    return item.variants.filter((variant) => {
      if (!variant || typeof variant !== "object") return false;

      const color = String(variant.color || "").trim();
      const size = String(variant.size || "").trim();
      const stock = Number(variant.stock);

      return color !== "" && size !== "" &&
        Number.isFinite(stock) && stock > 0;
    });
  }

  function formatPrice(value) {
    const price = Number(value);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number.isFinite(price) && price >= 0 ? price : 0);
  }

  function createProductCard(item) {
    const card = document.createElement("article");
    card.className = "product";

    card.dataset.id = String(item.id);
    card.dataset.name = String(item.name || "Unnamed product");
    card.dataset.price = String(Number(item.price) || 0);
    card.dataset.category = String(item.category || "");

   
    // Product images: support an array or a single image URL.
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

    const rawImages = Array.isArray(item.images)
      ? item.images
      : Array.isArray(item.imageUrls)
        ? item.imageUrls
        : [item.imageUrl || item.image || ""];

    
    const imageUrls = rawImages
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => {
        try {
          const url = new URL(value.trim());

          return url.protocol === "https:" || url.protocol === "http:"
            ? url.href
            : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (imageUrls.length > 0) {
      const image = document.createElement("img");
      image.className = "product-image";
      image.src = imageUrls[0];
      image.alt = item.name || "Velform product";
      image.loading = "lazy";
      image.width = 900;
      image.height = 1125;

      image.addEventListener("error", () => {
        image.classList.add("is-hidden");
        fallback.hidden = false;
      });

      fallback.hidden = true;
      media.appendChild(image);

      if (imageUrls.length > 1) {
        const dots = document.createElement("div");
        dots.className = "product-image-dots";
        dots.setAttribute("aria-label", "Product image navigation");

        imageUrls.forEach((url, index) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "product-image-dot";
          dot.setAttribute("aria-label", `Show image ${index + 1}`);
          dot.setAttribute("aria-current", String(index === 0));

          dot.addEventListener("click", () => {
            image.src = url;
            image.classList.remove("is-hidden");
            fallback.hidden = true;

            dots.querySelectorAll("button").forEach((button, buttonIndex) => {
              button.setAttribute(
                "aria-current",
                String(buttonIndex === index)
              );
            });
          });

          dots.appendChild(dot);
        });

        media.appendChild(dots);
      }
    }

    const details = document.createElement("div");
    details.className = "product-details";

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = item.category || "Clothing";

    const heading = document.createElement("h3");
    heading.className = "product-title";
    heading.textContent = item.name || "Unnamed product";

    const priceRow = document.createElement("div");
    priceRow.className = "product-price-row";

    const price = document.createElement("span");
    price.className = "price";
    price.textContent = formatPrice(item.price);
    priceRow.appendChild(price);

    const originalPriceValue = Number(item.originalPrice);
    const sellingPrice = Number(item.price);

    if (
      Number.isFinite(originalPriceValue) &&
      originalPriceValue > sellingPrice &&
      sellingPrice > 0
    ) {
      const originalPrice = document.createElement("span");
      originalPrice.className = "product-original-price";
      originalPrice.textContent = formatPrice(originalPriceValue);

      const discount = document.createElement("span");
      discount.className = "product-discount";
      discount.textContent =
        `${Math.round(
          ((originalPriceValue - sellingPrice) / originalPriceValue) * 100
        )}% OFF`;

      priceRow.append(originalPrice, discount);
    }

    details.append(category, heading, priceRow);

    // Colour and size selector
    const sizes = document.createElement("fieldset");
    sizes.className = "sizes";

    const legend = document.createElement("legend");
    legend.textContent = "Colour / size";

    const options = document.createElement("div");
    options.className = "size-options";

    const variantsExist =
      Array.isArray(item.variants) && item.variants.length > 0;

    const availableVariants = getAvailableVariants(item);
    let hasSelectableVariant = false;

    if (variantsExist) {
      if (availableVariants.length === 0) {
        const soldOut = document.createElement("p");
        soldOut.className = "product-note";
        soldOut.textContent = "Currently out of stock";

        sizes.append(legend, soldOut);
      } else {
        availableVariants.forEach((variant, index) => {
          const label = document.createElement("label");
          const input = document.createElement("input");
          const span = document.createElement("span");

          input.type = "radio";
          input.name = `size-${item.id}`;
          input.value = `${variant.color} / ${variant.size}`;
          input.dataset.color = String(variant.color).trim();
          input.dataset.size = String(variant.size).trim();
          input.dataset.stock = String(Number(variant.stock));

          span.textContent =
            `${String(variant.color).trim()} · ` +
            `${String(variant.size).trim()}`;

          if (index === 0) {
            input.checked = true;
          }

          input.addEventListener("change", () => {
            options.querySelectorAll("label").forEach((optionLabel) => {
              optionLabel.classList.toggle(
                "selected",
                optionLabel.querySelector("input") === input
              );
            });
          });

          label.append(input, span);
          label.classList.toggle("selected", index === 0);
          options.appendChild(label);
        });

        sizes.append(legend, options);
        hasSelectableVariant = true;
      }
    } else {
      // Temporary fallback for older products without inventory.
      // Add real variants in the admin page for stock tracking.
      ["S", "M", "L", "XL"].forEach((size, index) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        const span = document.createElement("span");

        input.type = "radio";
        input.name = `size-${item.id}`;
        input.value = size;
        input.dataset.size = size;
        input.dataset.color = "";
        input.dataset.stock = "1";

        span.textContent = size;

        if (index === 0) input.checked = true;

        input.addEventListener("change", () => {
          options.querySelectorAll("label").forEach((optionLabel) => {
            optionLabel.classList.toggle(
              "selected",
              optionLabel.querySelector("input") === input
            );
          });
        });

        label.append(input, span);
        label.classList.toggle("selected", index === 0);
        options.appendChild(label);
      });

      sizes.append(legend, options);
      hasSelectableVariant = true;
    }

    // Product actions
    const actions = document.createElement("div");
    actions.className = "vf-product-actions";

    const wishlistButton = document.createElement("button");
    wishlistButton.type = "button";
    wishlistButton.className = "vf-heart";
    wishlistButton.textContent = "♡";
    wishlistButton.setAttribute("aria-pressed", "false");
    wishlistButton.setAttribute("aria-label", "Add to wishlist");
    wishlistButton.title = "Wishlist";

    wishlistButton.addEventListener("click", () => {
      const productId = card.dataset.id;

      if (savedProducts.has(productId)) {
        savedProducts.delete(productId);
      } else {
        savedProducts.add(productId);
      }

      renderProducts();
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-to-cart";
    addButton.textContent = "Add to Cart";
    addButton.disabled = !hasSelectableVariant;

    if (!hasSelectableVariant) {
      addButton.textContent = "Out of Stock";
    }

    addButton.addEventListener("click", () => {
      const selected = sizes.querySelector('input[type="radio"]:checked');

      if (!selected) {
        alert("Please select a colour and size first.");
        return;
      }

      // Make the chosen variant available to the existing cart handler.
      card.dataset.selectedSize = selected.dataset.size || selected.value;
      card.dataset.selectedColor = selected.dataset.color || "";
      card.dataset.selectedVariant = selected.value;

      // The existing script.js handles cart operations.
      // Dispatch a normal click only once, after validating selection.
      card.dataset.cartSelectionReady = "true";

      // Keep the original .add-to-cart selector for script.js.
      // The event listener in script.js can read the checked radio.
      if (typeof window.addToCart === "function") {
        window.addToCart(card, selected);
      } else {
        card.dispatchEvent(new CustomEvent("vf:add-to-cart", {
          bubbles: true,
          detail: {
            productId: item.id,
            name: item.name || "Unnamed product",
            price: Number(item.price) || 0,
            color: selected.dataset.color || "",
            size: selected.dataset.size || selected.value,
            variant: selected.value,
            stock: Number(selected.dataset.stock) || 0
          }
        }));

        // Let the existing cart click handler run, if it is installed.
        // Prevent recursive handling by using a separate internal flag.
        if (!card.dataset.cartHandlerActive) {
          card.dataset.cartHandlerActive = "true";
          addButton.dispatchEvent(new CustomEvent("vf:cart-click", {
            bubbles: true,
            detail: { card, selected }
          }));
          delete card.dataset.cartHandlerActive;
        }
      }
    });

    actions.append(wishlistButton, addButton);

    card.append(media, details);

        const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = String(item.description || "");

    if (description.textContent.trim()) {
      card.appendChild(description);
    }

    card.append(sizes, actions);

    return card;
  }

  // --------------------------------------------------
  // LOAD PRODUCTS FROM FIRESTORE
  // --------------------------------------------------

  async function loadProducts() {
    productsArea.replaceChildren();

    const loadingMessage = document.createElement("p");
    loadingMessage.className = "vf-loading";
    loadingMessage.textContent = "Loading collection...";
    productsArea.appendChild(loadingMessage);

    try {
      const publishedProducts = await getPublishedProducts();

      products = publishedProducts
        .filter((item) => item && item.id)
        .map((item) => createProductCard(item));

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
  }

  // --------------------------------------------------
  // ACCOUNT DRAWER ACTIONS
  // --------------------------------------------------

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

        membership.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
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

        collection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      if (action === "account") {
        event.preventDefault();
        closeAccountDrawer();
        window.location.href = "login.html";
      }

      if (["about", "info", "privacy"].includes(action)) {
        closeAccountDrawer();
      }
    });
  });

  // Start loading the published products.
  loadProducts();
});

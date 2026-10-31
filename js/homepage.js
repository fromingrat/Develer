
import { watchAuthState } from "./auth.js";
import { getPublishedProducts } from "./product-service.js";
import { createProductCard } from "./product-card.js";
import { createMembership } from "./membership.js";

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
// PREMIUM MEMBERSHIP PAGE
// --------------------------------------------------

const membership = document.createElement("section");
membership.className = "vf-membership vf-membership-page";
membership.id = "vf-membership";
membership.hidden = true;

membership.innerHTML = `
  <div class="vf-membership-hero">
    <p class="vf-membership-eyebrow">THE VELFORM CLUB</p>
    <div class="vf-membership-crown">♛</div>
    <h2>More than membership.</h2>
    <p>
      A more rewarding way to experience VELFORM.
      Exclusive prices, early access and priority service.
    </p>
  </div>

  <div class="vf-membership-content">

    <div class="vf-membership-heading">
      <p class="vf-membership-label">CHOOSE YOUR PLAN</p>
      <h3>Premium Membership</h3>
      <p>Choose the membership duration that suits you.</p>
    </div>

    <div class="vf-plan-grid">

      <button type="button"
        class="vf-plan-card"
        data-membership-plan="1 Month"
        aria-pressed="false">
        <span class="vf-plan-duration">1 MONTH</span>
        <strong>₹99</strong>
        <span class="vf-plan-note">One month of premium benefits</span>
        <span class="vf-plan-select">Select plan</span>
      </button>

      <button type="button"
        class="vf-plan-card"
        data-membership-plan="3 Months"
        aria-pressed="false">
        <span class="vf-plan-duration">3 MONTHS</span>
        <strong>₹249</strong>
        <span class="vf-plan-note">Three months of premium benefits</span>
        <span class="vf-plan-select">Select plan</span>
      </button>

      <button type="button"
        class="vf-plan-card"
        data-membership-plan="1 Year"
        aria-pressed="false">
        <span class="vf-plan-duration">1 YEAR</span>
        <strong>₹899</strong>
        <span class="vf-plan-note">Twelve months of premium benefits</span>
        <span class="vf-plan-select">Select plan</span>
      </button>

    </div>

    <button type="button"
      class="vf-membership-continue"
      id="vf-membership-continue"
      disabled>
      Select a plan to continue
    </button>

    <p class="vf-membership-status"
      id="vf-membership-status"
      role="status"
      aria-live="polite"></p>

    <div class="vf-benefits-section">
      <p class="vf-membership-label">YOUR PRIVILEGES</p>
      <h3>Premium benefits</h3>

      <div class="vf-benefit-list">

        <div class="vf-benefit">
          <span class="vf-benefit-number">01</span>
          <div>
            <h4>Exclusive Member Prices</h4>
            <p>
              See a special Premium price alongside the regular
              selling price on every in-stock product.
            </p>
          </div>
        </div>

        <div class="vf-benefit">
          <span class="vf-benefit-number">02</span>
          <div>
            <h4>Priority Delivery</h4>
            <p>
              Premium members receive priority in our
              delivery scheduling and order handling.
            </p>
          </div>
        </div>

        <div class="vf-benefit">
          <span class="vf-benefit-number">03</span>
          <div>
            <h4>Early Access to New Arrivals</h4>
            <p>
              Get the first opportunity to shop new arrivals
              before they become available to everyone.
            </p>
          </div>
        </div>

        <div class="vf-benefit">
          <span class="vf-benefit-number">04</span>
          <div>
            <h4>Festival Season Coupons</h4>
            <p>
              Enjoy exclusive coupons and special offers
              during festival seasons.
            </p>
          </div>
        </div>

        <div class="vf-benefit">
          <span class="vf-benefit-number">05</span>
          <div>
            <h4>Priority Customer Support</h4>
            <p>
              Get priority assistance from our customer
              support team.
            </p>
          </div>
        </div>

      </div>
    </div>

    <p class="vf-membership-footer">
      VELFORM PREMIUM · EXCLUSIVELY FOR MEMBERS
    </p>

  </div>
`;

collection.after(membership);

// Show and hide the membership page.
function showMembership() {
  hero.hidden = true;
  collection.hidden = true;
  document.querySelector("#about").hidden = true;
  document.querySelector("#contact").hidden = true;
  document.querySelector(".site-footer").hidden = true;

  membership.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
  hero.hidden = false;
  collection.hidden = false;
  document.querySelector("#about").hidden = false;
  document.querySelector("#contact").hidden = false;
  document.querySelector(".site-footer").hidden = false;

  membership.hidden = true;
}
  // --------------------------------------------------
// WISHLIST PANEL
// --------------------------------------------------

let pageBeforeWishlist = "home";

const wishlistPanel = document.createElement("aside");
wishlistPanel.className = "cart wishlist-panel";
wishlistPanel.setAttribute("aria-label", "Your wishlist");
wishlistPanel.setAttribute("aria-hidden", "true");

wishlistPanel.innerHTML = `
  <div class="cart-head">
    <h2>Your wishlist</h2>
    <button class="cart-close" id="close-wishlist" type="button">
      Close
    </button>
  </div>

  <p class="cart-demo">Your saved VELFORM pieces</p>

  <div class="cart-body">
    <p class="cart-empty" id="wishlist-empty">
      Your wishlist is empty. Tap ♡ on a product to save it.
    </p>
    <ul class="cart-items" id="wishlist-items"></ul>
  </div>
`;

document.body.appendChild(wishlistPanel);

const wishlistOverlay = document.getElementById("overlay");
const wishlistList = wishlistPanel.querySelector("#wishlist-items");
const wishlistEmpty = wishlistPanel.querySelector("#wishlist-empty");

function renderWishlist() {
  wishlistList.replaceChildren();

  const savedItems = products.filter((product) =>
    savedProducts.has(product.dataset.id)
  );

  wishlistEmpty.hidden = savedItems.length > 0;

  savedItems.forEach((product) => {
    const item = document.createElement("li");
    item.className = "cart-item wishlist-item";

    const image = document.createElement("img");
    image.className = "wishlist-item-image";

    const productImage = product.querySelector(".product-image");

    if (productImage) {
      image.src = productImage.src;
      image.alt = product.dataset.name || "Saved product";
    } else {
      image.hidden = true;
    }

    const details = document.createElement("div");
    details.className = "wishlist-item-details";

    const name = document.createElement("h3");
    name.className = "cart-item-name";
    name.textContent = product.dataset.name || "Product";

    const price = document.createElement("p");
    price.className = "cart-item-meta";
    price.textContent = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(product.dataset.price) || 0);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      savedProducts.delete(product.dataset.id);
      updateHearts();
      renderProducts();
      renderWishlist();
    });

    details.append(name, price, remove);
    item.append(image, details);
    wishlistList.appendChild(item);
  });
}

function openWishlist() {
  pageBeforeWishlist = membership.hidden ? "home" : "membership";

  renderWishlist();

  wishlistPanel.classList.add("open");
  wishlistPanel.setAttribute("aria-hidden", "false");

  wishlistOverlay.classList.add("show");
  document.body.classList.add("no-scroll", "vf-panel-open");
}

function closeWishlist() {
  wishlistPanel.classList.remove("open");
  wishlistPanel.setAttribute("aria-hidden", "true");

  if (!document.querySelector("#cart")?.classList.contains("open")) {
    wishlistOverlay.classList.remove("show");
    document.body.classList.remove("no-scroll", "vf-panel-open");
  }

  if (pageBeforeWishlist === "membership") {
    showMembership();
  } else {
    showHome();
  }
}

wishlistPanel.querySelector("#close-wishlist").addEventListener(
  "click",
  closeWishlist
);

wishlistOverlay.addEventListener("click", closeWishlist);

// Plan selection.
let selectedMembershipPlan = "";

const planCards = membership.querySelectorAll("[data-membership-plan]");
const continueButton = membership.querySelector("#vf-membership-continue");
const membershipStatus = membership.querySelector("#vf-membership-status");

planCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedMembershipPlan = card.dataset.membershipPlan;

    planCards.forEach((plan) => {
      const isSelected = plan === card;

      plan.classList.toggle("selected", isSelected);
      plan.setAttribute("aria-pressed", String(isSelected));
      plan.querySelector(".vf-plan-select").textContent =
        isSelected ? "Selected ✓" : "Select plan";
    });

    continueButton.disabled = false;
    continueButton.textContent = "Continue with " + selectedMembershipPlan;

    membershipStatus.textContent = "";
  });
});

// Payment will be connected later.
continueButton.addEventListener("click", () => {
  if (!selectedMembershipPlan) return;

  membershipStatus.textContent =
    selectedMembershipPlan +
    " plan selected. Membership payments will be available soon.";
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

        showMembership();

bottomNav.querySelectorAll("button").forEach((navButton) => {
  navButton.classList.toggle(
    "active",
    navButton.dataset.navItem === "Membership"
  );
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
  openWishlist();
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

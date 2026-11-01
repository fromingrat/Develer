
/* ==========================================================
   VELFORM — Shared Shopping Cart
   Shared between homepage and product details page.
   Demo only: checkout and payments are not enabled.
   ========================================================== */

(function () {
  "use strict";

  const CART_KEY = "velform_cart_v1";
  const MAX_QTY = 10;

  let cart = [];
  let toastTimer = null;
  let lastFocused = null;

  const cartPanel = document.getElementById("cart");
  const overlay = document.getElementById("overlay");
  const closeCartBtn = document.getElementById("close-cart");
  const clearCartBtn = document.getElementById("clear-cart");
  const cartList = document.getElementById("cart-items");
  const cartEmpty = document.getElementById("cart-empty");
  const cartTotal = document.getElementById("cart-total");
  const toast = document.getElementById("toast");
  const productsArea = document.querySelector(".products");

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
  }

  function loadCart() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      );

      cart = Array.isArray(saved)
        ? saved.filter(item =>
            item &&
            item.id &&
            item.key &&
            Number(item.price) >= 0 &&
            Number(item.qty) > 0
          )
        : [];
    } catch (error) {
      console.error("Could not load cart:", error);
      cart = [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function findItem(key) {
    return cart.find(item => item.key === key) || null;
  }

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  function addToCart(product, size) {
    const key = `${product.id}--${size}`;
    const existing = findItem(key);

    if (existing) {
      if (existing.qty >= MAX_QTY) {
        showToast("Maximum quantity reached.");
        return;
      }

      existing.qty += 1;
    } else {
      cart.push({
        key,
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        size,
        color: "",
        qty: 1,
        image: product.image || ""
      });
    }

    saveCart();
    renderCart();

    showToast(product.name + " added to cart.");
  }

  function changeQuantity(key, change) {
    const item = findItem(key);
    if (!item) return;

    const newQty = item.qty + change;

    if (newQty < 1 || newQty > MAX_QTY) return;

    item.qty = newQty;

    saveCart();
    renderCart();
  }

  function removeItem(key) {
    cart = cart.filter(item => item.key !== key);

    saveCart();
    renderCart();

    showToast("Item removed from cart.");
  }

  function clearCart() {
    cart = [];

    saveCart();
    renderCart();

    showToast("Cart cleared.");
  }

  function renderCart() {
    if (!cartList || !cartEmpty || !cartTotal || !clearCartBtn) {
      return;
    }

    let totalPrice = 0;
    let totalItems = 0;

    cartList.replaceChildren();

    cart.forEach(item => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 1;

      totalPrice += price * qty;
      totalItems += qty;

      const li = makeElement("li", "cart-item");
      const top = makeElement("div", "cart-item-top");

      top.append(
        makeElement("h3", "cart-item-name", item.name),
        makeElement(
          "span",
          "cart-item-total",
          formatPrice(price * qty)
        )
      );

      const details = [
        item.color ? "Colour " + item.color : "",
        item.size ? "Size " + item.size : ""
      ].filter(Boolean).join(" · ");

      const meta = makeElement(
        "p",
        "cart-item-meta",
        (details ? details + " · " : "") +
          formatPrice(price) + " each"
      );

      const controls = makeElement("div", "cart-item-controls");
      const quantityControls = makeElement("div", "qty");

      const minus = makeElement("button", "", "−");
      minus.type = "button";
      minus.dataset.action = "decrease";
      minus.dataset.key = item.key;
      minus.disabled = qty <= 1;

      const value = makeElement("span", "qty-value", String(qty));

      const plus = makeElement("button", "", "+");
      plus.type = "button";
      plus.dataset.action = "increase";
      plus.dataset.key = item.key;
      plus.disabled = qty >= MAX_QTY;

      quantityControls.append(minus, value, plus);

      const remove = makeElement("button", "remove-btn", "Remove");
      remove.type = "button";
      remove.dataset.action = "remove";
      remove.dataset.key = item.key;

      controls.append(quantityControls, remove);
      li.append(top, meta, controls);

      cartList.appendChild(li);
    });

    const isEmpty = cart.length === 0;

    cartEmpty.hidden = !isEmpty;
    cartList.hidden = isEmpty;
    clearCartBtn.hidden = isEmpty;

    cartTotal.textContent = formatPrice(totalPrice);

    const cartCount = document.getElementById("cart-count");

    if (cartCount) {
      cartCount.textContent = String(totalItems);
      cartCount.hidden = totalItems === 0;
    }

    document.querySelectorAll("[data-open-cart]").forEach(button => {
      button.setAttribute(
        "aria-label",
        "Open cart, " + totalItems +
        (totalItems === 1 ? " item" : " items")
      );
    });
  }

  function openCart() {
    if (!cartPanel || !overlay) return;

    lastFocused = document.activeElement;

    cartPanel.classList.add("open");
    overlay.classList.add("show");

    cartPanel.setAttribute("aria-hidden", "false");

    document.body.classList.add("no-scroll", "vf-panel-open");

    if (closeCartBtn) closeCartBtn.focus();
  }

  function closeCart() {
    if (!cartPanel || !overlay) return;

    cartPanel.classList.remove("open");
    overlay.classList.remove("show");

    cartPanel.setAttribute("aria-hidden", "true");

    document.body.classList.remove("no-scroll", "vf-panel-open");

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function isCartOpen() {
    return !!cartPanel && cartPanel.classList.contains("open");
  }

  // Cart opening controls.
  document.querySelectorAll("[data-open-cart]").forEach(button => {
    button.addEventListener("click", openCart);
  });

  const oldOpenCartBtn = document.getElementById("open-cart");

  if (oldOpenCartBtn) {
    oldOpenCartBtn.addEventListener("click", openCart);
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", closeCart);
  }

  if (overlay) {
    overlay.addEventListener("click", closeCart);
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      clearCart();
      closeCart();
    });
  }

  // Existing homepage product-card cart behaviour.
  if (productsArea) {
    productsArea.addEventListener("click", event => {
      const button = event.target.closest(".add-to-cart");
      if (!button) return;

      const card = button.closest(".product");
      if (!card) return;

      const chosenSize = card.querySelector(
        'input[type="radio"]:checked'
      );

      const errorMessage = card.querySelector(".size-error");

      if (!chosenSize) {
        if (errorMessage) errorMessage.hidden = false;

        const firstSize = card.querySelector(
          'input[type="radio"]'
        );

        if (firstSize) firstSize.focus();

        return;
      }

      if (errorMessage) errorMessage.hidden = true;

      addToCart(
        {
          id: card.dataset.id,
          name: card.dataset.name,
          price: Number.parseInt(card.dataset.price, 10)
        },
        chosenSize.value
      );
    });

    productsArea.addEventListener("change", event => {
      if (!event.target.matches('input[type="radio"]')) return;

      const card = event.target.closest(".product");
      const errorMessage =
        card && card.querySelector(".size-error");

      if (errorMessage) errorMessage.hidden = true;
    });
  }

  // Cart quantity and remove controls.
  if (cartList) {
    cartList.addEventListener("click", event => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const action = button.dataset.action;
      const key = button.dataset.key;

      if (action === "increase") changeQuantity(key, 1);
      if (action === "decrease") changeQuantity(key, -1);
      if (action === "remove") removeItem(key);
    });
  }

  // Refresh if another tab changes the cart.
  window.addEventListener("storage", event => {
    if (event.key === CART_KEY) {
      loadCart();
      renderCart();
    }
  });

  // Keyboard support.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isCartOpen()) {
      closeCart();
      return;
    }

    if (event.key !== "Tab" || !isCartOpen() || !cartPanel) return;

    const focusable = cartPanel.querySelectorAll(
      'button:not(:disabled):not([hidden]), a[href], input:not(:disabled)'
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  });

  // Hide broken homepage product images.
  document.querySelectorAll(".product-media img").forEach(img => {
    function hideImage() {
      img.classList.add("is-hidden");
    }

    img.addEventListener("error", hideImage);

    if (img.complete && img.naturalWidth === 0) {
      hideImage();
    }
  });

  // Initial cart loading.
  loadCart();
  renderCart();

  // Open cart when returning through the product page Bag link.
  const params = new URLSearchParams(window.location.search);

  if (params.get("openCart") === "1") {
    openCart();

    window.history.replaceState(
      {},
      "",
      window.location.pathname
    );
  }
})();

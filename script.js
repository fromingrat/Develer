/* ==========================================================
   NOIR FORM demo store: cart logic
   Plain JavaScript, no libraries.
   The cart lives only in this page's memory. Nothing is saved
   or sent anywhere, and refreshing the page empties the cart.
   ========================================================== */

(function () {
  'use strict';

  // ---------- Settings ----------
  var MAX_QTY = 10; // most units of one item (same product + size)

  // ---------- State ----------
  // Each cart item looks like:
  // { key: 'poplin-shirt-M', name: 'Classic Poplin Shirt', price: 2499, size: 'M', qty: 1 }
  var cart = [];
  var toastTimer = null;
  var lastFocused = null;

  // ---------- Page elements ----------
  var cartPanel = document.getElementById('cart');
  var overlay = document.getElementById('overlay');
  var openCartBtn = document.getElementById('open-cart');
  var closeCartBtn = document.getElementById('close-cart');
  var clearCartBtn = document.getElementById('clear-cart');
  var cartList = document.getElementById('cart-items');
  var cartEmpty = document.getElementById('cart-empty');
  var cartTotal = document.getElementById('cart-total');
  var cartCount = document.getElementById('cart-count');
  var toast = document.getElementById('toast');
  var menuToggle = document.getElementById('menu-toggle');
  var siteNav = document.getElementById('site-nav');
  var productsArea = document.querySelector('.products');

  // ---------- Helpers ----------

  // 2499 becomes "₹2,499" (Indian number format)
  function formatPrice(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Small helper to build an element with a class and text
  function makeElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }

  function findItem(key) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].key === key) {
        return cart[i];
      }
    }
    return null;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }

  // ---------- Cart actions ----------

  function addToCart(product, size) {
    var key = product.id + '-' + size;
    var existing = findItem(key);

    if (existing) {
      if (existing.qty >= MAX_QTY) {
        showToast('You can add up to ' + MAX_QTY + ' of the same item.');
        return;
      }
      existing.qty += 1;
    } else {
      cart.push({
        key: key,
        name: product.name,
        price: product.price,
        size: size,
        qty: 1
      });
    }

    renderCart();
    showToast('Added to cart: ' + product.name + ', size ' + size);
  }

  function changeQuantity(key, change) {
    var item = findItem(key);
    if (!item) {
      return;
    }
    var newQty = item.qty + change;
    if (newQty < 1 || newQty > MAX_QTY) {
      return;
    }
    item.qty = newQty;
    renderCart();
  }

  function removeItem(key) {
    cart = cart.filter(function (item) {
      return item.key !== key;
    });
    renderCart();
  }

  function clearCart() {
    cart = [];
    renderCart();
  }

  // ---------- Drawing the cart ----------

  function renderCart() {
    var totalPrice = 0;
    var totalItems = 0;

    cartList.innerHTML = '';

    cart.forEach(function (item) {
      totalPrice += item.price * item.qty;
      totalItems += item.qty;

      var li = makeElement('li', 'cart-item');

      // Name and line total
      var top = makeElement('div', 'cart-item-top');
      top.appendChild(makeElement('h3', 'cart-item-name', item.name));
      top.appendChild(makeElement('span', 'cart-item-total', formatPrice(item.price * item.qty)));
      li.appendChild(top);

      // Size and price per item
      li.appendChild(
        makeElement('p', 'cart-item-meta', 'Size ' + item.size + ', ' + formatPrice(item.price) + ' each')
      );

      // Quantity buttons and remove
      var controls = makeElement('div', 'cart-item-controls');

      var qty = makeElement('div', 'qty');

      var minus = makeElement('button', '', '\u2212'); // minus sign
      minus.type = 'button';
      minus.setAttribute('data-action', 'decrease');
      minus.setAttribute('data-key', item.key);
      minus.setAttribute('aria-label', 'Decrease quantity of ' + item.name + ', size ' + item.size);
      minus.disabled = item.qty <= 1;

      var value = makeElement('span', 'qty-value', String(item.qty));
      value.setAttribute('aria-label', 'Quantity ' + item.qty);

      var plus = makeElement('button', '', '+');
      plus.type = 'button';
      plus.setAttribute('data-action', 'increase');
      plus.setAttribute('data-key', item.key);
      plus.setAttribute('aria-label', 'Increase quantity of ' + item.name + ', size ' + item.size);
      plus.disabled = item.qty >= MAX_QTY;

      qty.appendChild(minus);
      qty.appendChild(value);
      qty.appendChild(plus);

      var remove = makeElement('button', 'remove-btn', 'Remove');
      remove.type = 'button';
      remove.setAttribute('data-action', 'remove');
      remove.setAttribute('data-key', item.key);
      remove.setAttribute('aria-label', 'Remove ' + item.name + ', size ' + item.size + ' from cart');

      controls.appendChild(qty);
      controls.appendChild(remove);
      li.appendChild(controls);

      cartList.appendChild(li);
    });

    // Empty message, total, clear button
    var isEmpty = cart.length === 0;
    cartEmpty.hidden = !isEmpty;
    cartList.hidden = isEmpty;
    clearCartBtn.hidden = isEmpty;
    cartTotal.textContent = formatPrice(totalPrice);

    // Count badge on the header Cart button
    cartCount.textContent = String(totalItems);
    cartCount.hidden = totalItems === 0;
    openCartBtn.setAttribute(
      'aria-label',
      'Open cart, ' + totalItems + (totalItems === 1 ? ' item' : ' items')
    );
  }

  // ---------- Opening and closing the cart ----------

  function openCart() {
    lastFocused = document.activeElement;
    cartPanel.classList.add('open');
    overlay.classList.add('show');
    cartPanel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    closeMenu();
    // Move focus into the cart after it starts sliding in
    setTimeout(function () {
      closeCartBtn.focus();
    }, 50);
  }

  function closeCart() {
    cartPanel.classList.remove('open');
    overlay.classList.remove('show');
    cartPanel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function isCartOpen() {
    return cartPanel.classList.contains('open');
  }

  // ---------- Phone menu ----------

  function closeMenu() {
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  menuToggle.addEventListener('click', function () {
    var isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      closeMenu();
    }
  });

  // ---------- Events ----------

  openCartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  clearCartBtn.addEventListener('click', function () {
    clearCart();
    closeCartBtn.focus();
  });

  // Any other button marked data-open-cart (for example in the footer)
  document.querySelectorAll('[data-open-cart]').forEach(function (btn) {
    btn.addEventListener('click', openCart);
  });

  // "Add to cart" buttons
  productsArea.addEventListener('click', function (event) {
    var button = event.target.closest('.add-to-cart');
    if (!button) {
      return;
    }

    var card = button.closest('.product');
    var chosenSize = card.querySelector('input[type="radio"]:checked');
    var errorMessage = card.querySelector('.size-error');

    if (!chosenSize) {
      errorMessage.hidden = false;
      card.querySelector('input[type="radio"]').focus();
      return;
    }

    errorMessage.hidden = true;

    addToCart(
      {
        id: card.getAttribute('data-id'),
        name: card.getAttribute('data-name'),
        price: parseInt(card.getAttribute('data-price'), 10)
      },
      chosenSize.value
    );
  });

  // Hide the "choose a size" message once a size is picked
  productsArea.addEventListener('change', function (event) {
    if (event.target.matches('input[type="radio"]')) {
      var card = event.target.closest('.product');
      card.querySelector('.size-error').hidden = true;
    }
  });

  // Plus, minus and remove buttons inside the cart
  cartList.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }

    var action = button.getAttribute('data-action');
    var key = button.getAttribute('data-key');

    if (action === 'increase') {
      changeQuantity(key, 1);
    } else if (action === 'decrease') {
      changeQuantity(key, -1);
    } else if (action === 'remove') {
      removeItem(key);
    }

    // The list is redrawn, so put keyboard focus back on a sensible button
    var sameButton = cartList.querySelector(
      '[data-action="' + action + '"][data-key="' + key + '"]:not(:disabled)'
    );
    if (sameButton) {
      sameButton.focus();
    } else {
      closeCartBtn.focus();
    }
  });

  // Keyboard: Escape closes things, Tab stays inside the open cart
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (isCartOpen()) {
        closeCart();
      } else {
        closeMenu();
      }
      return;
    }

    if (event.key === 'Tab' && isCartOpen()) {
      var focusable = cartPanel.querySelectorAll('button:not(:disabled):not([hidden])');
      if (focusable.length === 0) {
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // ---------- Product image fallback ----------
  // If a photo cannot load, hide it so the grey "NOIR FORM" placeholder shows instead.
  document.querySelectorAll('.product-media img').forEach(function (img) {
    function hideImage() {
      img.classList.add('is-hidden');
    }
    img.addEventListener('error', hideImage);
    // The image may have already failed before this script ran
    if (img.complete && img.naturalWidth === 0) {
      hideImage();
    }
  });

  // ---------- Start ----------
  renderCart();
})();
    


export function createWishlist({
  getProducts,
  savedProducts,
  updateHearts,
  renderProducts,
  membership,
  showMembership,
  showHome
}) {
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

    const savedItems = getProducts().filter((product) =>
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

  return { openWishlist };
                  }

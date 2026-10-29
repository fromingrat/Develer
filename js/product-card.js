
/**
 * Velform Product Card
 * Creates a product card for the homepage.
 *
 * Supports:
 * - Multiple product images
 * - Product sizes
 * - Wishlist button
 * - Existing cart selectors and data attributes
 */

export function createProductCard(
  item,
  { isSaved = false, onWishlistToggle = null } = {}
) {
  const product = document.createElement("article");

  product.className = "product";
  product.dataset.id = item.id || "";
  product.dataset.name = item.name || item.title || "Product";
  product.dataset.price = String(item.price ?? 0);

  const title = item.name || item.title || "Product";
  const price = Number(item.price ?? 0);

  // Support both the new images array and older single-image products.
  const images = Array.isArray(item.images)
    ? item.images.filter(
        (image) => typeof image === "string" && image.trim()
      )
    : [];

  const singleImage = item.imageUrl || item.image || "";

  if (images.length === 0 && singleImage) {
    images.push(singleImage);
  }

  const media = document.createElement("div");
  media.className = "product-media";

  const image = document.createElement("img");
  image.className = "product-image";
  image.alt = title;
  image.loading = "lazy";
  image.src = images[0] || "";
  image.dataset.images = JSON.stringify(images);
  image.dataset.imageIndex = "0";

  if (!images.length) {
    image.alt = `${title} image unavailable`;
  }

  media.appendChild(image);

  // Add image navigation only when multiple images exist.
  if (images.length > 1) {
    const previousButton = document.createElement("button");
    previousButton.type = "button";
    previousButton.className = "product-image-nav product-image-prev";
    previousButton.setAttribute("aria-label", "Previous product image");
    previousButton.textContent = "‹";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "product-image-nav product-image-next";
    nextButton.setAttribute("aria-label", "Next product image");
    nextButton.textContent = "›";

    const imageCount = document.createElement("span");
    imageCount.className = "product-image-count";
    imageCount.textContent = `1 / ${images.length}`;

    function showImage(index) {
      const nextIndex = (index + images.length) % images.length;

      image.src = images[nextIndex];
      image.dataset.imageIndex = String(nextIndex);
      imageCount.textContent = `${nextIndex + 1} / ${images.length}`;
    }

    previousButton.addEventListener("click", () => {
      showImage(Number(image.dataset.imageIndex) - 1);
    });

    nextButton.addEventListener("click", () => {
      showImage(Number(image.dataset.imageIndex) + 1);
    });

    // Allow touch users to swipe between images.
    let touchStartX = null;

    media.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX ?? null;
      },
      { passive: true }
    );

    media.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;

        const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
        const difference = touchEndX - touchStartX;

        if (Math.abs(difference) > 40) {
          showImage(
            Number(image.dataset.imageIndex) +
              (difference < 0 ? 1 : -1)
          );
        }

        touchStartX = null;
      },
      { passive: true }
    );

    media.append(previousButton, nextButton, imageCount);
  }

  const top = document.createElement("div");
  top.className = "product-top";

  const wishlistButton = document.createElement("button");
  wishlistButton.type = "button";
  wishlistButton.className = "vf-heart";
  wishlistButton.setAttribute("aria-label", "Toggle wishlist");
  wishlistButton.setAttribute("aria-pressed", String(isSaved));
  wishlistButton.textContent = isSaved ? "♥" : "♡";

  if (isSaved) {
    wishlistButton.classList.add("is-saved");
  }

  wishlistButton.addEventListener("click", () => {
    if (typeof onWishlistToggle === "function") {
      onWishlistToggle(item, wishlistButton);
    }
  });

  top.appendChild(wishlistButton);

  const heading = document.createElement("h3");
  heading.textContent = title;

  const priceElement = document.createElement("p");
  priceElement.className = "price";
  priceElement.textContent = `₹${price.toLocaleString("en-IN")}`;

  const note = document.createElement("p");
  note.className = "product-note";
  note.textContent = item.description || item.note || "";

  const sizesFieldset = document.createElement("fieldset");
  sizesFieldset.className = "sizes";

  const legend = document.createElement("legend");
  legend.textContent = "Select size";
  sizesFieldset.appendChild(legend);

  const variants = Array.isArray(item.variants) ? item.variants : [];
  const sizes = variants.length
    ? variants
        .map((variant) =>
          typeof variant === "string" ? variant : variant.size
        )
        .filter(Boolean)
    : ["S", "M", "L", "XL"];

  sizes.forEach((size, index) => {
    const label = document.createElement("label");
    label.className = "size-option";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `size-${item.id || "product"}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    radio.value = size;
    radio.checked = index === 0;

    const sizeText = document.createElement("span");
    sizeText.textContent = size;

    label.append(radio, sizeText);
    sizesFieldset.appendChild(label);
  });

  const sizeError = document.createElement("p");
  sizeError.className = "size-error";
  sizeError.hidden = true;

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-to-cart";
  addButton.textContent = "Add to cart";

  product.append(
    media,
    top,
    heading,
    priceElement,
    note,
    sizesFieldset,
    sizeError,
    addButton
  );

    return product;
}

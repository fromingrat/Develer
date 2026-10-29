
const COLOR_MAP = {
  black: "#171717",
  white: "#ffffff",
  red: "#c62828",
  blue: "#2457a7",
  navy: "#172747",
  green: "#287447",
  olive: "#777b35",
  beige: "#d8c5a4",
  cream: "#f4ead5",
  brown: "#795548",
  grey: "#858585",
  gray: "#858585",
  pink: "#e9a3b5",
  purple: "#784b91",
  yellow: "#f1cf45",
  orange: "#e78332",
  maroon: "#702632"
};

function getColorValue(color) {
  const key = String(color || "").trim().toLowerCase();
  return COLOR_MAP[key] || key;
}

function getAvailableVariants(item) {
  if (!Array.isArray(item.variants)) return [];

  return item.variants.filter((variant) => {
    if (!variant || typeof variant !== "object") return false;

    return (
      String(variant.color || "").trim() !== "" &&
      String(variant.size || "").trim() !== "" &&
      Number.isFinite(Number(variant.stock)) &&
      Number(variant.stock) > 0
    );
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

export function createProductCard(
  item,
  { isSaved = false, onWishlistToggle = null } = {}
) {
  const card = document.createElement("article");
  card.className = "product";

  card.dataset.id = String(item.id || "");
  card.dataset.name = String(item.name || item.title || "Unnamed product");
  card.dataset.price = String(Number(item.price) || 0);
  card.dataset.category = String(item.category || "");

  // Product image and fallback.
  const media = document.createElement("div");
  media.className = "product-media";

  const fallback = document.createElement("span");
  fallback.className = "fallback";
  fallback.setAttribute("aria-hidden", "true");
  fallback.textContent = "VELFORM";

  const rawImages = Array.isArray(item.images)
    ? item.images
    : Array.isArray(item.imageUrls)
      ? item.imageUrls
      : [item.imageUrl || item.image || ""];

  const imageUrls = rawImages.filter((value) => {
    if (typeof value !== "string" || !value.trim()) return false;

    try {
      const url = new URL(value.trim());
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }).map((value) => new URL(value.trim()).href);

  
if (imageUrls.length) {
  const image = document.createElement("img");
  image.className = "product-image";
  image.src = imageUrls[0];
  image.alt = item.name || item.title || "VELFORM product";
  image.loading = "lazy";
  image.width = 900;
  image.height = 1200;

  image.addEventListener("error", () => {
    image.classList.add("is-hidden");
    fallback.hidden = false;
  });

  fallback.hidden = true;
  media.append(image);

  let currentImageIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const dots = document.createElement("div");
  dots.className = "product-image-dots";
  dots.setAttribute("aria-label", "Product image navigation");

  function changeImage(nextIndex, direction = "next") {
    currentImageIndex =
      (nextIndex + imageUrls.length) % imageUrls.length;

    image.classList.remove(
      "is-hidden",
      "image-swipe-next",
      "image-swipe-prev"
    );

    fallback.hidden = true;
    image.src = imageUrls[currentImageIndex];

    // Restart the animation for every image change.
    void image.offsetWidth;
    image.classList.add(
      direction === "prev" ? "image-swipe-prev" : "image-swipe-next"
    );

    dots.querySelectorAll("button").forEach((button, index) => {
      button.setAttribute(
        "aria-current",
        String(index === currentImageIndex)
      );
    });
  }

  if (imageUrls.length > 1) {
    imageUrls.forEach((url, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "product-image-dot";
      dot.setAttribute("aria-label", `Show image ${index + 1}`);
      dot.setAttribute("aria-current", String(index === 0));

      dot.addEventListener("click", () => {
        if (index === currentImageIndex) return;

        changeImage(
          index,
          index > currentImageIndex ? "next" : "prev"
        );
      });

      dots.append(dot);
    });

    media.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    media.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      // Ignore vertical scrolling and short accidental movements.
      if (
        Math.abs(deltaX) < 45 ||
        Math.abs(deltaX) < Math.abs(deltaY)
      ) {
        return;
      }

      if (deltaX < 0) {
        changeImage(currentImageIndex + 1, "next");
      } else {
        changeImage(currentImageIndex - 1, "prev");
      }
    }, { passive: true });

    media.append(dots);
  }
}

  media.append(fallback);

  // Wishlist heart overlays the top-right of the image.
  const wishlistButton = document.createElement("button");
  wishlistButton.type = "button";
  wishlistButton.className = "vf-heart";
  wishlistButton.textContent = isSaved ? "♥" : "♡";
  wishlistButton.setAttribute("aria-pressed", String(isSaved));
  wishlistButton.setAttribute(
    "aria-label",
    isSaved ? "Remove from wishlist" : "Add to wishlist"
  );

  if (isSaved) wishlistButton.classList.add("is-saved");

  wishlistButton.addEventListener("click", () => {
    if (typeof onWishlistToggle === "function") {
      onWishlistToggle(item, wishlistButton);
    }
  });

  media.append(wishlistButton);

  // Product details.
  const details = document.createElement("div");
  details.className = "product-details";

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = item.category || "Clothing";

  const heading = document.createElement("h3");
  heading.className = "product-title";
  heading.textContent = item.name || item.title || "Unnamed product";

  const priceRow = document.createElement("div");
  priceRow.className = "product-price-row";

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatPrice(item.price);
  priceRow.append(price);

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

  // One swatch per available colour. Sizes stay on the product page.
  const availableVariants = getAvailableVariants(item);
  const colors = [
    ...new Map(
      availableVariants.map((variant) => [
        String(variant.color).trim().toLowerCase(),
        String(variant.color).trim()
      ])
    ).values()
  ];

  if (colors.length) {
    const colorGroup = document.createElement("fieldset");
    colorGroup.className = "product-colors";

    const legend = document.createElement("legend");
    legend.textContent = "Colours";

    const options = document.createElement("div");
    options.className = "color-options";

    colors.forEach((color, index) => {
      const label = document.createElement("label");
      label.className = "color-option";
      label.title = color;

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `color-${item.id}`;
      radio.value = color;
      radio.checked = index === 0;
      radio.setAttribute("aria-label", color);

      const swatch = document.createElement("span");
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = getColorValue(color);

      if (color.toLowerCase() === "white" ||
          color.toLowerCase() === "cream" ||
          color.toLowerCase() === "beige" ||
          color.toLowerCase() === "yellow") {
        swatch.classList.add("light-swatch");
      }

      label.append(radio, swatch);
      options.append(label);
    });

    colorGroup.append(legend, options);
    details.append(colorGroup);
  }

  card.append(media, details);

  return card;
}

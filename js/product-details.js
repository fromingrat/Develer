import { getPublishedProduct } from "./product-service.js";

const elements = {
  loading: document.getElementById("product-loading"),
  error: document.getElementById("product-error"),
  content: document.getElementById("product-content"),
  images: document.getElementById("product-images"),
  category: document.getElementById("product-category"),
  name: document.getElementById("product-name"),
  price: document.getElementById("product-price"),
  originalPrice: document.getElementById("product-original-price"),
  discount: document.getElementById("product-discount"),
  description: document.getElementById("product-description"),
  colors: document.getElementById("product-colors"),
  sizes: document.getElementById("product-sizes")
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function showError() {
  elements.loading.hidden = true;
  elements.content.hidden = true;
  elements.error.hidden = false;
}

function renderImages(product) {
  const rawImages = Array.isArray(product.images)
    ? product.images
    : Array.isArray(product.imageUrls)
      ? product.imageUrls
      : [product.imageUrl || product.image || ""];

  const imageUrls = rawImages.filter((value) => {
    if (typeof value !== "string" || !value.trim()) return false;

    try {
      const url = new URL(value.trim());
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  });

  if (!imageUrls.length) {
    const fallback = document.createElement("div");
    fallback.textContent = "VELFORM";
    fallback.className = "product-image-fallback";
    elements.images.append(fallback);
    return;
  }

  imageUrls.forEach((url) => {
    const image = document.createElement("img");
    image.src = url;
    image.alt = product.name || product.title || "VELFORM product";
    image.loading = "lazy";
    elements.images.append(image);
  });
}

function renderVariants(product) {
  const variants = Array.isArray(product.variants)
    ? product.variants.filter((variant) =>
        variant &&
        typeof variant === "object" &&
        String(variant.color || "").trim() &&
        String(variant.size || "").trim() &&
        Number(variant.stock) > 0
      )
    : [];

  const colors = [...new Set(
    variants.map((variant) => String(variant.color).trim())
  )];

  const sizes = [...new Set(
    variants.map((variant) => String(variant.size).trim())
  )];

  if (colors.length) {
    const heading = document.createElement("h3");
    heading.textContent = "Available Colours";
    elements.colors.append(heading);

    const list = document.createElement("p");
    list.textContent = colors.join(" · ");
    elements.colors.append(list);
  }

  if (sizes.length) {
    const heading = document.createElement("h3");
    heading.textContent = "Available Sizes";
    elements.sizes.append(heading);

    const list = document.createElement("p");
    list.textContent = sizes.join(" · ");
    elements.sizes.append(list);
  }

  if (!colors.length && !sizes.length) {
    const message = document.createElement("p");
    message.textContent = "Variant information is currently unavailable.";
    elements.colors.append(message);
  }
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    showError();
    return;
  }

  try {
    const product = await getPublishedProduct(productId);

    if (!product) {
      showError();
      return;
    }

    document.title =
      `${product.name || product.title || "Product"} | VELFORM`;

    elements.category.textContent = product.category || "Clothing";
    elements.name.textContent =
      product.name || product.title || "Unnamed product";

    elements.price.textContent = formatPrice(product.price);

    const originalPrice = Number(product.originalPrice);
    const sellingPrice = Number(product.price);

    if (
      Number.isFinite(originalPrice) &&
      originalPrice > sellingPrice &&
      sellingPrice > 0
    ) {
      elements.originalPrice.textContent = formatPrice(originalPrice);

      elements.discount.textContent =
        `${Math.round(
          ((originalPrice - sellingPrice) / originalPrice) * 100
        )}% OFF`;
    }

    elements.description.textContent =
      product.description || "Discover this VELFORM piece.";

    renderImages(product);
    renderVariants(product);

    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.content.hidden = false;

  } catch (error) {
    console.error("Could not load product details:", error);
    showError();
  }
}

loadProduct();

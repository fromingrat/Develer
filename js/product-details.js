
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
  sizes: document.getElementById("product-sizes"),
  quantityMinus: document.getElementById("quantity-minus"),
  quantityPlus: document.getElementById("quantity-plus"),
  quantityValue: document.getElementById("quantity-value"),
  stockMessage: document.getElementById("variant-stock-message"),
  addToCart: document.getElementById("add-to-cart")
};

const MAX_QUANTITY = 10;

let product = null;
let availableVariants = [];
let selectedColor = "";
let selectedSize = "";
let quantity = 1;

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

function renderImages(item) {
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
    image.alt = item.name || item.title || "VELFORM product";
    image.loading = "lazy";
    elements.images.append(image);
  });
}

function getAvailableVariants(item) {
  if (!Array.isArray(item.variants)) return [];

  return item.variants.filter((variant) =>
    variant &&
    typeof variant === "object" &&
    String(variant.color || "").trim() &&
    String(variant.size || "").trim() &&
    Number.isFinite(Number(variant.stock)) &&
    Number(variant.stock) > 0
  );
}

function createSelect(container, labelText, id) {
  const wrapper = document.createElement("div");
  wrapper.className = "variant-selector";

  const label = document.createElement("label");
  label.textContent = labelText;
  label.htmlFor = id;

  const select = document.createElement("select");
  select.id = id;
  select.className = "variant-select";

  wrapper.append(label, select);
  container.replaceChildren(wrapper);

  return select;
}

function getSelectedVariant() {
  return availableVariants.find((variant) =>
    String(variant.color).trim() === selectedColor &&
    String(variant.size).trim() === selectedSize
  ) || null;
}

function updateVariantStatus() {
  const variant = getSelectedVariant();

  if (!selectedColor || !selectedSize) {
    elements.stockMessage.textContent = "Select a colour and size.";
    elements.quantityMinus.disabled = true;
    elements.quantityPlus.disabled = true;
    return;
  }

  if (!variant) {
    elements.stockMessage.textContent =
      "This colour and size combination is unavailable.";
    elements.quantityMinus.disabled = true;
    elements.quantityPlus.disabled = true;
    return;
  }

  const stock = Number(variant.stock);
  const maxAllowed = Math.min(stock, MAX_QUANTITY);

  if (quantity > maxAllowed) {
    quantity = maxAllowed;
    elements.quantityValue.textContent = String(quantity);
  }

  elements.stockMessage.textContent =
    stock + (stock === 1 ? " item available" : " items available");

  elements.quantityMinus.disabled = quantity <= 1;
  elements.quantityPlus.disabled = quantity >= maxAllowed;
}

function renderVariants() {
  availableVariants = getAvailableVariants(product);

  if (!availableVariants.length) {
    elements.colors.textContent = "No available colours.";
    elements.sizes.textContent = "No available sizes.";
    elements.stockMessage.textContent = "Currently out of stock.";
    elements.quantityMinus.disabled = true;
    elements.quantityPlus.disabled = true;
    return;
  }

  const colors = [
    ...new Set(
      availableVariants.map((variant) =>
        String(variant.color).trim()
      )
    )
  ];

  const colorSelect = createSelect(
    elements.colors,
    "Choose Colour",
    "selected-product-color"
  );

  const colorPlaceholder = document.createElement("option");
  colorPlaceholder.value = "";
  colorPlaceholder.textContent = "Select colour";
  colorSelect.append(colorPlaceholder);

  colors.forEach((color) => {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = color;
    colorSelect.append(option);
  });

  const sizeSelect = createSelect(
    elements.sizes,
    "Choose Size",
    "selected-product-size"
  );

  function updateSizes() {
    selectedSize = "";
    sizeSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select size";
    sizeSelect.append(placeholder);

    const sizes = [
      ...new Set(
        availableVariants
          .filter((variant) =>
            String(variant.color).trim() === selectedColor
          )
          .map((variant) => String(variant.size).trim())
      )
    ];

    sizes.forEach((size) => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size;
      sizeSelect.append(option);
    });

    updateVariantStatus();
  }

  colorSelect.addEventListener("change", () => {
    selectedColor = colorSelect.value;
    quantity = 1;
    elements.quantityValue.textContent = "1";
    updateSizes();
  });

  sizeSelect.addEventListener("change", () => {
    selectedSize = sizeSelect.value;
    quantity = 1;
    elements.quantityValue.textContent = "1";
    updateVariantStatus();
  });

  updateSizes();
}

function updateQuantity(change) {
  const variant = getSelectedVariant();
  if (!variant) return;

  const maxAllowed = Math.min(
    Number(variant.stock),
    MAX_QUANTITY
  );

  quantity = Math.max(
    1,
    Math.min(maxAllowed, quantity + change)
  );

  elements.quantityValue.textContent = String(quantity);
  updateVariantStatus();
}

elements.quantityMinus.addEventListener("click", () => {
  updateQuantity(-1);
});

elements.quantityPlus.addEventListener("click", () => {
  updateQuantity(1);
});

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    showError();
    return;
  }

  try {
    product = await getPublishedProduct(productId);

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
    renderVariants();

    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.content.hidden = false;

  } catch (error) {
    console.error("Could not load product details:", error);
    showError();
  }
}

loadProduct();

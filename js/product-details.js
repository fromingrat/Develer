
import { getPublishedProduct } from "./product-service.js";

const $ = (id) => document.getElementById(id);

const el = {
  loading: $("product-loading"),
  error: $("product-error"),
  content: $("product-content"),
  images: $("product-images"),
  category: $("product-category"),
  name: $("product-name"),
  description: $("product-description"),
  price: $("product-price"),
  original: $("product-original-price"),
  discount: $("product-discount"),
  premium: $("product-premium-price"),
  premiumValue: $("premium-price-value"),
  add: $("add-to-cart"),
  selection: $("variant-selection"),
  colors: $("product-colors"),
  sizes: $("product-sizes"),
  minus: $("quantity-minus"),
  plus: $("quantity-plus"),
  quantity: $("quantity-value"),
  stock: $("variant-stock-message"),
  confirm: $("confirm-add-to-cart"),
  message: $("cart-message"),
  details: $("product-details-text")
};

const CART_KEY = "velform_cart_v1";
const MAX_QUANTITY = 10;

let product;
let variants = [];
let selectedColor = "";
let selectedSize = "";
let quantity = 1;

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getImages(item) {
  if (Array.isArray(item.images)) return item.images;
  if (Array.isArray(item.imageUrls)) return item.imageUrls;
  return [item.imageUrl || item.image || ""];
}

function renderImages(item) {
  const urls = getImages(item).filter((value) => {
    if (typeof value !== "string") return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  });

  if (!urls.length) {
    const fallback = document.createElement("div");
    fallback.className = "product-image-fallback";
    fallback.textContent = "VELFORM";
    el.images.append(fallback);
    return;
  }

  urls.forEach((url, index) => {
    const image = document.createElement("img");
    image.src = url;
    image.alt = `${item.name || item.title || "Product"} image ${index + 1}`;
    image.loading = index === 0 ? "eager" : "lazy";
    el.images.append(image);
  });
}

function getAvailableVariants() {
  if (!Array.isArray(product.variants)) return [];

  return product.variants.filter((variant) =>
    variant &&
    String(variant.color || "").trim() &&
    String(variant.size || "").trim() &&
    Number.isFinite(Number(variant.stock)) &&
    Number(variant.stock) > 0
  );
}

function selectedVariant() {
  return variants.find((variant) =>
    String(variant.color).trim() === selectedColor &&
    String(variant.size).trim() === selectedSize
  ) || null;
}

function makeSelect(container, labelText, id) {
  const wrapper = document.createElement("div");
  wrapper.className = "variant-selector";

  const label = document.createElement("label");
  label.textContent = labelText;
  label.htmlFor = id;

  const select = document.createElement("select");
  select.id = id;

  wrapper.append(label, select);
  container.replaceChildren(wrapper);

  return select;
}

function updateSelection() {
  const variant = selectedVariant();

  if (!variant) {
    el.stock.textContent = "Please select a colour and size.";
    el.confirm.disabled = true;
    el.minus.disabled = true;
    el.plus.disabled = true;
    return;
  }

  const stock = Number(variant.stock);
  const max = Math.min(stock, MAX_QUANTITY);

  quantity = Math.min(quantity, max);
  el.quantity.textContent = String(quantity);
  el.stock.textContent = `${stock} available`;
  el.minus.disabled = quantity <= 1;
  el.plus.disabled = quantity >= max;
  el.confirm.disabled = false;
}

function renderSelectors() {
  variants = getAvailableVariants();

  if (!variants.length) {
    el.colors.textContent = "Currently out of stock.";
    el.sizes.replaceChildren();
    el.stock.textContent = "This product is currently unavailable.";
    el.confirm.disabled = true;
    return;
  }

  const colors = [...new Set(variants.map((v) => String(v.color).trim()))];

  const colorSelect = makeSelect(el.colors, "Colour", "chosen-color");
  const colorPlaceholder = new Option("Select colour", "");
  colorSelect.add(colorPlaceholder);

  colors.forEach((color) => colorSelect.add(new Option(color, color)));

  const sizeSelect = makeSelect(el.sizes, "Size", "chosen-size");

  function refreshSizes() {
    selectedSize = "";
    sizeSelect.replaceChildren(new Option("Select size", ""));

    const sizes = [...new Set(
      variants
        .filter((v) => String(v.color).trim() === selectedColor)
        .map((v) => String(v.size).trim())
    )];

    sizes.forEach((size) => sizeSelect.add(new Option(size, size)));
    updateSelection();
  }

  colorSelect.addEventListener("change", () => {
    selectedColor = colorSelect.value;
    selectedSize = "";
    quantity = 1;
    el.quantity.textContent = "1";
    refreshSizes();
  });

  sizeSelect.addEventListener("change", () => {
    selectedSize = sizeSelect.value;
    quantity = 1;
    el.quantity.textContent = "1";
    updateSelection();
  });

  refreshSizes();
}

function updateQuantity(change) {
  const variant = selectedVariant();
  if (!variant) return;

  const max = Math.min(Number(variant.stock), MAX_QUANTITY);
  quantity = Math.max(1, Math.min(max, quantity + change));
  updateSelection();
}

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCartItem() {
  const variant = selectedVariant();
  if (!variant) return;

  const cart = readCart();
  const key = `${product.id}-${selectedColor}-${selectedSize}`;
  const existing = cart.find((item) => item.key === key);

  const item = {
    key,
    id: product.id,
    name: product.name || product.title || "Product",
    price: Number(product.price) || 0,
    color: selectedColor,
    size: selectedSize,
    qty: quantity,
    image: getImages(product)[0] || ""
  };

  if (existing) {
    existing.qty = Math.min(
      Number(variant.stock),
      MAX_QUANTITY,
      Number(existing.qty || 0) + quantity
    );
  } else {
    cart.push(item);
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  el.message.textContent = "Added to your cart. Open your bag from the homepage to view it.";
  el.confirm.textContent = "ADDED TO CART ✓";
}

el.add.addEventListener("click", () => {
  el.selection.hidden = false;
  el.add.hidden = true;

  renderSelectors();
  el.selection.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

el.minus.addEventListener("click", () => updateQuantity(-1));
el.plus.addEventListener("click", () => updateQuantity(1));
el.confirm.addEventListener("click", saveCartItem);

async function loadProduct() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return showError();

  try {
    product = await getPublishedProduct(id);
    if (!product) return showError();

    document.title = `${product.name || product.title || "Product"} | VELFORM`;

    el.category.textContent = product.category || "VELFORM COLLECTION";
    el.name.textContent = product.name || product.title || "Product";
    el.description.textContent = product.description || "";
    el.price.textContent = money(product.price);
    el.details.textContent = product.description || "More product details coming soon.";

    const original = Number(product.originalPrice);
    const selling = Number(product.price);

    if (original > selling && selling > 0) {
      el.original.textContent = money(original);
      el.discount.textContent =
        `${Math.round((original - selling) / original * 100)}% OFF`;
    }

    const premium = Number(product.premiumPrice);
    if (premium > 0 && premium <= selling) {
      el.premium.hidden = false;
      el.premiumValue.textContent = money(premium);
    }

    renderImages(product);
    variants = getAvailableVariants();

    if (!variants.length) {
      el.add.disabled = true;
      el.add.textContent = "OUT OF STOCK";
    }

    el.loading.hidden = true;
    el.content.hidden = false;
  } catch (error) {
    console.error("Product loading failed:", error);
    showError();
  }
}

function showError() {
  el.loading.hidden = true;
  el.error.hidden = false;
}

loadProduct();

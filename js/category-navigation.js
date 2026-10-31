
export function createCategoryNavigation({
  collection,
  renderProducts,
  setActiveCategory,
  setWishlistMode
}) {
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
      setActiveCategory(category);
      setWishlistMode(false);

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

  return {
    categories,
    menuButton,
    categorySpacer
  };
}

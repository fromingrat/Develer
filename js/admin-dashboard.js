import {
  auth,
  db
} from "./firebase.js";

import {
  signInWithGoogleChooser,
  signOutUser
} from "./auth.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const ADMIN_UID = "kIeZUNa0kOZzeRPxddrq8V86qS02";
const $ = id => document.getElementById(id);

let isAdmin = false;
let products = [];
let tickets = [];
let ticketTab = "all";
let activeTicket = null;
let stopTickets = null;
let stopReplies = null;

function message(id, text, success = false) {
  const el = $(id);
  el.textContent = text;
  el.classList.toggle("success", success);
}

function dateText(value) {
  if (!value) return "Date unavailable";
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function requireAdmin() {
  return Boolean(
    isAdmin &&
    auth.currentUser &&
    auth.currentUser.uid === ADMIN_UID
  );
}

/* GOOGLE AUTHENTICATION */

$("sign-in").addEventListener("click", async () => {
  const button = $("sign-in");

  try {
    button.disabled = true;
    message("login-message", "Opening Google account chooser...");

    await signInWithGoogleChooser();

    // onAuthStateChanged will verify the admin UID
  } catch (error) {
    console.error("Admin Google sign-in:", error);

    let errorMessage = error.code || error.message;

    if (error.code === "auth/popup-blocked") {
      errorMessage = "Popup blocked. Please allow popups and try again.";
    } else if (error.code === "auth/popup-closed-by-user") {
      errorMessage = "Sign-in cancelled. Please try again.";
    } else if (error.code === "auth/unauthorized-domain") {
      errorMessage = "This website is not authorized for Google sign-in.";
    } else if (error.code === "auth/operation-not-allowed") {
      errorMessage = "Google sign-in is not enabled in Firebase.";
    }

    message("login-message", `Sign-in failed: ${errorMessage}`);
  } finally {
    button.disabled = false;
  }
});

$("sign-out").addEventListener("click", async () => {
  await signOutUser();
});

$("denied-signout").addEventListener("click", async () => {
  await signOutUser();
});

onAuthStateChanged(auth, async user => {
  isAdmin = Boolean(user && user.uid === ADMIN_UID);

  $("signed-out").hidden = Boolean(user);
  $("denied").hidden = !user || isAdmin;
  $("admin-area").hidden = !isAdmin;

  if (!user) return;

  if (!isAdmin) {
    await signOutUser();
    $("denied").hidden = false;
    $("signed-out").hidden = true;
    return;
  }

  $("account-info").textContent =
    `Signed in as ${user.email || "Administrator"}`;

  loadProducts();
  listenToTickets();
});

/* DASHBOARD NAVIGATION */

document.querySelectorAll("[data-section]").forEach(button => {
  button.addEventListener("click", () => {
    const selected = button.dataset.section;

    document.querySelectorAll("[data-section]").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    ["products", "tickets", "users", "orders"].forEach(name => {
      $(`section-${name}`).hidden = name !== selected;
    });

    if (selected === "users") loadUsers();
  });
});

/* PRODUCT VARIANTS */

function updateStockSummary() {
  const rows = [...$("variant-list").querySelectorAll(".variant-row")];
  let total = 0;
  let valid = true;

  rows.forEach(row => {
    const value = row.querySelector('[data-field="stock"]').value.trim();
    const quantity = Number(value);

    if (value === "" || !Number.isSafeInteger(quantity) || quantity < 0) {
      valid = false;
    } else {
      total += quantity;
    }
  });

  $("stock-summary").textContent =
    `${rows.length} combinations · ` +
    (valid ? `${total} total items in stock` : "Check stock quantities");
}

function addVariantRow(variant = {}) {
  const row = document.createElement("div");
  row.className = "variant-row";

  [
    ["color", "Colour", variant.color || "", "Black"],
    ["size", "Size", variant.size || "", "M"],
    ["stock", "Quantity", variant.stock ?? 0, "0"]
  ].forEach(([key, labelText, value, placeholder]) => {
    const wrap = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");

    label.textContent = labelText;
    input.dataset.field = key;
    input.value = value;
    input.placeholder = placeholder;
    input.required = true;

    if (key === "stock") {
      input.type = "number";
      input.min = "0";
      input.step = "1";
    } else {
      input.type = "text";
      input.maxLength = 40;
    }

    input.addEventListener("input", updateStockSummary);
    wrap.append(label, input);
    row.append(wrap);
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "danger";
  remove.textContent = "REMOVE";
  remove.addEventListener("click", () => {
    row.remove();
    updateStockSummary();
  });

  row.append(remove);
  $("variant-list").append(row);
  updateStockSummary();
}

function fillVariants(variants = []) {
  $("variant-list").replaceChildren();

  if (variants.length) {
    variants.forEach(addVariantRow);
  } else {
    addVariantRow();
  }
}

function readVariants() {
  const rows = [...$("variant-list").querySelectorAll(".variant-row")];

  if (!rows.length) throw new Error("Add at least one colour and size.");

  const result = rows.map(row => {
    const get = key => row.querySelector(`[data-field="${key}"]`).value.trim();
    const color = get("color");
    const size = get("size");
    const stockText = get("stock");
    const stock = Number(stockText);

    if (!color || !size) throw new Error("Enter colour and size for every row.");
    if (stockText === "" || !Number.isSafeInteger(stock) || stock < 0) {
      throw new Error("Stock must be a whole number of zero or more.");
    }

    return { color, size, stock };
  });

  const keys = result.map(v => `${v.color.toLowerCase()}|${v.size.toLowerCase()}`);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Duplicate colour and size combinations are not allowed.");
  }

  return result;
}

$("add-variant").addEventListener("click", () => addVariantRow());
fillVariants();

/* PRODUCT CREATE / UPDATE */

function resetProductForm() {
  $("product-form").reset();
  $("product-id").value = "";
  $("form-title").textContent = "Add a product";
  $("save-button").textContent = "SAVE PRODUCT";
  $("cancel-edit").hidden = true;
  fillVariants();
}

$("cancel-edit").addEventListener("click", resetProductForm);
$("refresh-products").addEventListener("click", loadProducts);

$("product-form").addEventListener("submit", async event => {
  event.preventDefault();

  if (!requireAdmin()) {
    message("product-message", "Admin access required.");
    return;
  }

  const name = $("name").value.trim();
  const category = $("category").value;
  const price = Number($("price").value);
  const premiumPrice = Number($("premium-price").value);
  const originalPrice = Number($("original-price").value);

  if (
    !name ||
    !Number.isSafeInteger(price) || price < 1 ||
    !Number.isSafeInteger(premiumPrice) ||
    premiumPrice < 1 || premiumPrice > price ||
    !Number.isSafeInteger(originalPrice) ||
    originalPrice < price
  ) {
    message(
      "product-message",
      "Check prices. Premium price cannot exceed selling price, and MRP cannot be lower than selling price."
    );
    return;
  }

  const images = $("images").value
    .split("\n")
    .map(value => value.trim())
    .filter(Boolean);

  for (const image of images) {
    try {
      const url = new URL(image);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
    } catch {
      message("product-message", `Invalid image URL: ${image}`);
      return;
    }
  }

  let variants;
  try {
    variants = readVariants();
  } catch (error) {
    message("product-message", error.message);
    return;
  }

  const id = $("product-id").value;
  const save = $("save-button");
  save.disabled = true;
  message("product-message", "Saving product...");

  try {
    const data = {
      name,
      category,
      price,
      premiumPrice,
      originalPrice,
      imageUrl: images[0] || "",
      images,
      description: $("description").value.trim(),
      published: $("published").checked,
      variants,
      updatedAt: serverTimestamp()
    };

    if (id) {
      await updateDoc(doc(db, "products", id), data);
      message("product-message", "Product updated successfully.", true);
    } else {
      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp()
      });
      message("product-message", "Product added successfully.", true);
    }

    resetProductForm();
    await loadProducts();
  } catch (error) {
    console.error("Product save:", error);
    message("product-message", `Could not save: ${error.code || error.message}`);
  } finally {
    save.disabled = false;
  }
});

/* PRODUCT LIST / EDIT / DELETE */

async function loadProducts() {
  if (!requireAdmin()) return;

  $("product-list").innerHTML =
    '<div class="skeleton"></div><div class="skeleton"></div>';

  try {
    const snap = await getDocs(
      query(collection(db, "products"), orderBy("name"))
    );

    products = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    const list = $("product-list");
    list.replaceChildren();

    if (!products.length) {
      list.textContent = "No products have been added yet.";
      return;
    }

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "item-card";

      const title = document.createElement("strong");
      title.textContent = product.name || "Unnamed product";

      const info = document.createElement("p");
      info.className = "muted";
      info.textContent =
        `${product.category || "Uncategorised"} · ₹${product.price ?? 0} · ` +
        (product.published ? "Published" : "Draft");

      const stock = document.createElement("p");
      stock.className = "muted";
      stock.textContent = (product.variants || []).map(v =>
        `${v.color}/${v.size}: ${v.stock}`
      ).join(" · ") || "No variants saved";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "EDIT";
      edit.addEventListener("click", () => {
        $("product-id").value = product.id;
        $("name").value = product.name || "";
        $("category").value = product.category || "Shirts";
        $("price").value = product.price ?? "";
        $("premium-price").value = product.premiumPrice ?? "";
        $("original-price").value = product.originalPrice ?? product.price ?? "";
        $("images").value = Array.isArray(product.images)
          ? product.images.join("\n")
          : product.imageUrl || product.image || "";
        $("description").value = product.description || "";
        $("published").checked = product.published === true;

        fillVariants(product.variants || []);
        $("form-title").textContent = "Edit product";
        $("save-button").textContent = "UPDATE PRODUCT";
        $("cancel-edit").hidden = false;

        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "secondary";
      toggle.textContent = product.published ? "UNPUBLISH" : "PUBLISH";
      toggle.addEventListener("click", async () => {
        if (!requireAdmin()) return;
        try {
          await updateDoc(doc(db, "products", product.id), {
            published: !product.published,
            updatedAt: serverTimestamp()
          });
          await loadProducts();
        } catch (error) {
          message("product-message", `Update failed: ${error.code || error.message}`);
        }
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "DELETE";
      remove.addEventListener("click", async () => {
        if (!requireAdmin()) return;
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

        try {
          await deleteDoc(doc(db, "products", product.id));
          message("product-message", "Product deleted.", true);
          await loadProducts();
        } catch (error) {
          message("product-message", `Delete failed: ${error.code || error.message}`);
        }
      });

      card.append(title, info, stock, edit, toggle, remove);
      list.append(card);
    });
  } catch (error) {
    console.error("Product list:", error);
    $("product-list").textContent =
      `Could not load products: ${error.code || error.message}`;
  }
}

/* TICKET MANAGEMENT */

function stopTicketReplies() {
  if (stopReplies) stopReplies();
  stopReplies = null;
}

function ticketSolved(ticket) {
  return ticket.status === "solved";
}

function showTicketList() {
  activeTicket = null;
  stopTicketReplies();
  $("ticket-detail-panel").hidden = true;
  $("ticket-list-panel").hidden = false;
}

$("back-tickets").addEventListener("click", showTicketList);

document.querySelectorAll("[data-ticket-tab]").forEach(button => {
  button.addEventListener("click", () => {
    ticketTab = button.dataset.ticketTab;
    document.querySelectorAll("[data-ticket-tab]").forEach(item => {
      item.classList.toggle("active", item === button);
    });
    renderTickets();
  });
});

function renderTickets() {
  const list = $("ticket-list");
  list.replaceChildren();

  const filtered = tickets.filter(ticket => {
    if (ticketTab === "pending") return !ticketSolved(ticket);
    if (ticketTab === "solved") return ticketSolved(ticket);
    return true;
  });

  if (!filtered.length) {
    list.textContent = "No tickets in this section.";
    return;
  }

  filtered.forEach(ticket => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ticket-card";

    const title = document.createElement("strong");
    title.textContent = ticket.subject || "Support request";

    const customer = document.createElement("small");
    customer.textContent =
      `${ticket.customerName || "Customer"} · ${ticket.email || "No email"}`;

    const state = document.createElement("small");
    state.textContent =
      `${ticketSolved(ticket) ? "Solved" : "Pending"} · ${dateText(ticket.createdAt)}`;

    button.append(title, customer, state);
    button.addEventListener("click", () => openTicket(ticket));
    list.append(button);
  });
}

function listenToTickets() {
  if (stopTickets) stopTickets();

  $("ticket-list").innerHTML =
    '<div class="skeleton"></div><div class="skeleton"></div>';

  stopTickets = onSnapshot(
    query(collection(db, "supportTickets"), orderBy("createdAt", "desc")),
    snapshot => {
      tickets = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      renderTickets();
    },
    error => {
      console.error("Ticket list:", error);
      message("ticket-list-message", `Could not load tickets: ${error.code}`);
    }
  );
}

function openTicket(ticket) {
  activeTicket = ticket;
  $("ticket-list-panel").hidden = true;
  $("ticket-detail-panel").hidden = false;

  $("ticket-title").textContent = ticket.subject || "Support request";
  $("ticket-meta").textContent =
    `Customer: ${ticket.customerName || "Unknown"} · ${ticket.email || "No email"}\n` +
    `Category: ${ticket.category || "General"} · Submitted: ${dateText(ticket.createdAt)}` +
    (ticket.orderId ? `\nOrder ID: ${ticket.orderId}` : "");

  $("ticket-description").textContent = ticket.description || "";
  updateTicketStatus(ticket);

  stopTicketReplies();

  $("ticket-replies").innerHTML = '<div class="skeleton"></div>';

  stopReplies = onSnapshot(
    collection(db, "supportTickets", ticket.id, "replies"),
    snapshot => {
      const replies = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      replies.sort((a, b) => {
        const x = a.createdAt?.toMillis?.() || 0;
        const y = b.createdAt?.toMillis?.() || 0;
        return x - y;
      });

      const area = $("ticket-replies");
      area.replaceChildren();

      if (!replies.length) {
        area.textContent = "No replies yet.";
        return;
      }

      replies.forEach(reply => {
        const block = document.createElement("div");
        block.className = "conversation";

        const author = document.createElement("strong");
        author.textContent = "VELFORM Support";

        const text = document.createElement("p");
        text.textContent = reply.message || "";

        const time = document.createElement("small");
        time.textContent = dateText(reply.createdAt);

        block.append(author, text, time);
        area.append(block);
      });
    },
    error => {
      console.error("Ticket replies:", error);
      $("ticket-replies").textContent =
        `Could not load replies: ${error.code || error.message}`;
    }
  );
}

function updateTicketStatus(ticket) {
  const solved = ticketSolved(ticket);
  $("ticket-badge").textContent = solved ? "Solved" : "Pending";
  $("ticket-badge").className = `badge ${solved ? "solved" : "pending"}`;
  $("solve-ticket").hidden = solved;
  $("reopen-ticket").hidden = !solved;
}

$("send-reply").addEventListener("click", async () => {
  if (!requireAdmin() || !activeTicket) return;

  const text = $("reply-message").value.trim();
  if (!text) {
    message("ticket-detail-message", "Write a reply first.");
    return;
  }

  const button = $("send-reply");
  button.disabled = true;

  try {
    await addDoc(
      collection(db, "supportTickets", activeTicket.id, "replies"),
      {
        message: text,
        senderRole: "admin",
        senderUid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      }
    );

    $("reply-message").value = "";
    message("ticket-detail-message", "Reply sent.", true);
  } catch (error) {
    console.error("Reply failed:", error);
    message("ticket-detail-message", `Reply failed: ${error.code || error.message}`);
  } finally {
    button.disabled = false;
  }
});

async function changeTicketStatus(status) {
  if (!requireAdmin() || !activeTicket) return;

  try {
    await updateDoc(doc(db, "supportTickets", activeTicket.id), {
      status,
      updatedAt: serverTimestamp()
    });

    activeTicket.status = status;
    updateTicketStatus(activeTicket);
    message("ticket-detail-message", status === "solved" ? "Ticket solved." : "Ticket reopened.", true);
  } catch (error) {
    console.error("Status update:", error);
    message("ticket-detail-message", `Could not update status: ${error.code || error.message}`);
  }
}

$("solve-ticket").addEventListener("click", () => changeTicketStatus("solved"));
$("reopen-ticket").addEventListener("click", () => changeTicketStatus("pending"));

/* REGISTERED USERS */

$("refresh-users").addEventListener("click", loadUsers);

async function loadUsers() {
  if (!requireAdmin()) return;

  $("users-list").innerHTML =
    '<div class="skeleton"></div><div class="skeleton"></div>';
  message("users-message", "Loading registered users...");

  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    users.sort((a, b) => {
      const x = a.createdAt?.toMillis?.() || 0;
      const y = b.createdAt?.toMillis?.() || 0;
      return y - x;
    });

    const list = $("users-list");
    list.replaceChildren();

    if (!users.length) {
      list.textContent = "No registered profile records found.";
      message("users-message", "");
      return;
    }

    users.forEach(user => {
      const card = document.createElement("article");
      card.className = "item-card";

      const name = document.createElement("strong");
      name.textContent = user.name || "Name not provided";

      
      const email = document.createElement("p");
      email.className = "muted";
      email.textContent = `Email: ${user.email || "Not available"}`;

      const phone = document.createElement("p");
      phone.className = "muted";
      phone.textContent = `Phone: ${user.phone || "Not provided"}`;

      const address = document.createElement("p");
      address.className = "muted";
      address.textContent = `Address: ${[
        user.address,
        user.area,
        user.landmark
      ].filter(Boolean).join(", ") || "Not provided"}`;

      const extra = document.createElement("p");
      extra.className = "muted";
      extra.textContent =
        `Alternate phone: ${user.alternatePhone || "Not provided"} · ` +
        `Profile complete: ${user.profileComplete ? "Yes" : "No"}`;

      const registered = document.createElement("p");
      registered.className = "muted";
      registered.textContent = `Registered: ${dateText(user.createdAt)}`;

      card.append(name, email, phone, address, extra, registered);
      list.append(card);
    });

    message("users-message", `${users.length} registered users found.`, true);
  } catch (error) {
    console.error("Registered users:", error);
    $("users-list").textContent =
      `Could not load users: ${error.code || error.message}`;
    message("users-message", "Could not load registered users.");
  }
}



import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const loading = $("orders-loading");
const content = $("orders-content");
const errorPanel = $("orders-error");
const detailPanel = $("order-detail");

let orders = [];
let selectedOrder = null;
let stopOrders = null;

const stages = [
  ["verification_pending", "Call verification", "Our team will contact you to verify your order."],
  ["verified", "Order verified", "Your order details have been verified."],
  ["confirmed", "Order confirmed", "Your order has been confirmed."],
  ["preparing", "Preparing your order", "Your selected pieces are being prepared."],
  ["partner_assigned", "Delivery partner assigned", "A delivery partner has been assigned."],
  ["picked_up", "Picked up", "Your order has been picked up."],
  ["out_for_delivery", "Out for delivery", "Your order is on its way."],
  ["delivered", "Delivered", "Your order has been delivered."]
];

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = value?.toDate
    ? value.toDate()
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function setMessage(message) {
  $("orders-error-message").textContent = message;
}

function showError(message) {
  loading.hidden = true;
  content.hidden = true;
  detailPanel.hidden = true;
  errorPanel.hidden = false;
  setMessage(message);
}

function hideError() {
  errorPanel.hidden = true;
}

function getOrderNumber(order) {
  return order.orderNumber || order.orderId || order.id;
}

function getOrderDate(order) {
  return order.createdAt || order.orderDate;
}

function getOrderTotal(order) {
  return order.total ?? order.totalAmount ?? order.amount ?? 0;
}

function getStatusLabel(status) {
  const labels = {
    verification_pending: "Verification pending",
    verified: "Verified",
    confirmed: "Confirmed",
    preparing: "Preparing",
    partner_assigned: "Partner assigned",
    picked_up: "Picked up",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered"
  };

  return labels[normalizeStatus(status)] || "Order received";
}

function isDelivered(order) {
  return normalizeStatus(order.status) === "delivered";
}

function createOrderCard(order) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "order-card";

  const top = document.createElement("div");
  top.className = "order-card-top";

  const info = document.createElement("div");

  const number = document.createElement("p");
  number.className = "order-number";
  number.textContent = `Order #${getOrderNumber(order)}`;

  const date = document.createElement("p");
  date.className = "order-date";
  date.textContent = formatDate(getOrderDate(order));

  info.append(number, date);

  const badge = document.createElement("span");
  badge.className = `status-badge ${isDelivered(order) ? "delivered" : "active"}`;
  badge.textContent = getStatusLabel(order.status);

  top.append(info, badge);

  const bottom = document.createElement("div");
  bottom.className = "order-card-bottom";

  const meta = document.createElement("span");
  meta.className = "order-card-meta";

  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((total, item) => total + Number(item.quantity || 1), 0)
    : 0;

  meta.textContent = itemCount
    ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
    : "View order details";

  const total = document.createElement("strong");
  total.className = "order-card-total";
  total.textContent = formatMoney(getOrderTotal(order));

  const arrow = document.createElement("span");
  arrow.className = "order-card-arrow";
  arrow.textContent = "→";

  bottom.append(meta, total, arrow);
  button.append(top, bottom);

  button.addEventListener("click", () => openOrderDetails(order));

  return button;
}

function renderOrders() {
  const active = orders.filter(order => !isDelivered(order));
  const delivered = orders.filter(isDelivered);

  const activeList = $("active-orders");
  const deliveredList = $("delivered-orders");

  activeList.replaceChildren();
  deliveredList.replaceChildren();

  active.forEach(order => {
    activeList.append(createOrderCard(order));
  });

  delivered.forEach(order => {
    deliveredList.append(createOrderCard(order));
  });

  $("active-count").textContent = active.length;
  $("delivered-count").textContent = delivered.length;

  $("active-empty").hidden = active.length > 0;
  $("delivered-empty").hidden = delivered.length > 0;
}

function createTimeline(order) {
  const timeline = $("order-timeline");
  timeline.replaceChildren();

  const currentStatus = normalizeStatus(order.status);
  const currentIndex = stages.findIndex(stage => stage[0] === currentStatus);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;

  stages.forEach((stage, index) => {
    const row = document.createElement("div");
    row.className = "timeline-step";

    if (index < safeIndex || currentStatus === "delivered") {
      row.classList.add("complete");
    } else if (index === safeIndex) {
      row.classList.add("current");
    }

    const title = document.createElement("strong");
    title.textContent = stage[1];

    const description = document.createElement("small");
    description.textContent = stage[2];

    row.append(title, description);
    timeline.append(row);
  });
}

function addItemLine(container, label, value) {
  const row = document.createElement("div");
  row.className = "item-line";

  const left = document.createElement("span");
  left.textContent = label;

  const right = document.createElement("strong");
  right.textContent = value;

  row.append(left, right);
  container.append(row);
}

function openOrderDetails(order) {
  selectedOrder = order;

  content.hidden = true;
  detailPanel.hidden = false;

  $("detail-order-number").textContent =
    `Order #${getOrderNumber(order)}`;

  $("detail-date").textContent =
    `Placed on ${formatDate(getOrderDate(order))}`;

  const status = normalizeStatus(order.status);
  const statusBadge = $("detail-status");

  statusBadge.textContent = getStatusLabel(status);
  statusBadge.className =
    `status-badge ${status === "delivered" ? "delivered" : "active"}`;

  createTimeline(order);

  $("detail-delivery-type").textContent =
    order.deliveryType || order.deliveryMethod || "Not confirmed yet";

  $("detail-eta").textContent =
    order.estimatedDelivery || order.eta || "Awaiting confirmation";

  $("detail-address").textContent =
    order.deliveryAddress || order.address || "Not available";

  const partner = order.deliveryPartner || {};

  $("partner-name").textContent =
    partner.name || "Not assigned yet";

  $("partner-activity").textContent =
    partner.activity ||
    order.partnerActivity ||
    "Your delivery partner details will appear here when assigned.";

  const callButton = $("partner-call");
  const phone = String(partner.phone || "").replace(/[^\d+]/g, "");

  if (phone && /^[+]?\d{8,15}$/.test(phone)) {
    callButton.href = `tel:${phone}`;
    callButton.hidden = false;
  } else {
    callButton.hidden = true;
    callButton.removeAttribute("href");
  }

  const itemList = $("detail-items");
  itemList.replaceChildren();

  if (Array.isArray(order.items) && order.items.length) {
    order.items.forEach(item => {
      const name = item.name || item.productName || "Product";
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || item.sellingPrice || 0);

      addItemLine(
        itemList,
        `${name} × ${quantity}`,
        formatMoney(price * quantity)
      );
    });
  } else {
    addItemLine(itemList, "Order items", "Details unavailable");
  }

  $("detail-total").textContent = formatMoney(getOrderTotal(order));
}

$("back-to-orders").addEventListener("click", () => {
  selectedOrder = null;
  detailPanel.hidden = true;
  content.hidden = false;
});

function listenToOrders(user) {
  if (stopOrders) stopOrders();

  loading.hidden = false;
  content.hidden = true;
  detailPanel.hidden = true;
  hideError();

  // This UID filter is required by the Firestore security rules.
  const ordersQuery = query(
    collection(db, "orders"),
    where("uid", "==", user.uid)
  );

  stopOrders = onSnapshot(
    ordersQuery,
    snapshot => {
      orders = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      orders.sort((a, b) => {
        const aDate = getOrderDate(a)?.toMillis?.() || 0;
        const bDate = getOrderDate(b)?.toMillis?.() || 0;
        return bDate - aDate;
      });

      loading.hidden = true;
      errorPanel.hidden = true;

      if (selectedOrder) {
        const updated = orders.find(item => item.id === selectedOrder.id);

        if (updated) {
          openOrderDetails(updated);
        } else {
          selectedOrder = null;
          detailPanel.hidden = true;
          content.hidden = false;
          renderOrders();
        }
      } else {
        content.hidden = false;
        renderOrders();
      }
    },
    error => {
      console.error("Orders loading error:", error);

      showError(
        error.code === "permission-denied"
          ? "You do not have permission to view these orders."
          : "Please check your internet connection and try again."
      );
    }
  );
}

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  listenToOrders(user);
});

$("retry-orders").addEventListener("click", () => {
  const user = auth.currentUser;

  if (user) {
    listenToOrders(user);
  }
});

window.addEventListener("beforeunload", () => {
  if (stopOrders) stopOrders();
});

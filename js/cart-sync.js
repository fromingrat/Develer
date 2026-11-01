
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  loadCloudCart,
  saveCloudCartItem,
  removeCloudCartItem
} from "./cart-service.js";

const CART_KEY = "velform_cart_v1";

let currentUser = null;
let knownCloudKeys = new Set();
let applyingCloudCart = false;
let syncQueue = Promise.resolve();

function readLocalCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function writeLocalCart(cart) {
  applyingCloudCart = true;

  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  window.dispatchEvent(new CustomEvent("velform-cart-updated"));

  applyingCloudCart = false;
}

async function syncCartToCloud() {
  if (!currentUser) return;

  const userId = currentUser.uid;
  const localCart = readLocalCart();
  const localKeys = new Set(localCart.map(item => item.key));

  for (const item of localCart) {
    await saveCloudCartItem(userId, item);
  }

  for (const key of knownCloudKeys) {
    if (!localKeys.has(key)) {
      await removeCloudCartItem(userId, key);
    }
  }

  knownCloudKeys = localKeys;
}

function queueSync() {
  if (!currentUser || applyingCloudCart) return;

  syncQueue = syncQueue
    .then(syncCartToCloud)
    .catch(error => {
      console.error("Cart sync failed:", error);
    });
}

window.addEventListener("velform-cart-updated", queueSync);

window.addEventListener("storage", event => {
  if (event.key === CART_KEY) queueSync();
});

onAuthStateChanged(auth, async user => {
  currentUser = user;
  knownCloudKeys.clear();

  if (!user) return;

  try {
    const cloudCart = await loadCloudCart(user.uid);

    if (currentUser?.uid !== user.uid) return;

    const localCart = readLocalCart();
    const merged = new Map();

    cloudCart.forEach(item => {
      if (item?.key) merged.set(item.key, item);
    });

    localCart.forEach(item => {
      if (item?.key) merged.set(item.key, item);
    });

    const mergedCart = [...merged.values()];

    knownCloudKeys = new Set(
      cloudCart.map(item => item.key).filter(Boolean)
    );

    writeLocalCart(mergedCart);

    await syncCartToCloud();

    console.log("Cart loaded and synced for signed-in user.");
  } catch (error) {
    console.error("Could not load cloud cart:", error);
  }
});

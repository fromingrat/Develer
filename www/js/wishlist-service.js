
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import { db } from "./firebase.js";

// Load a customer's saved wishlist product IDs
export async function loadWishlist(userId) {
  const wishlistRef = collection(db, "users", userId, "wishlist");
  const snapshot = await getDocs(wishlistRef);

  return snapshot.docs.map((item) => item.id);
}

// Save a product to the customer's wishlist
export async function saveWishlistItem(userId, productId) {
  const itemRef = doc(
    db,
    "users",
    userId,
    "wishlist",
    productId
  );

  await setDoc(itemRef, {
    productId,
    createdAt: serverTimestamp()
  });
}

// Remove a product from the customer's wishlist
export async function removeWishlistItem(userId, productId) {
  const itemRef = doc(
    db,
    "users",
    userId,
    "wishlist",
    productId
  );

  await deleteDoc(itemRef);
}

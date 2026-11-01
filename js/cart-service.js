import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import { db } from "./firebase.js";

function getCartRef(userId) {
  return collection(db, "users", userId, "cart");
}

export async function loadCloudCart(userId) {
  if (!userId) return [];

  const snapshot = await getDocs(getCartRef(userId));

  return snapshot.docs.map((item) => ({
    ...item.data(),
    key: item.id
  }));
}

export async function saveCloudCartItem(userId, item) {
  if (!userId || !item?.key) {
    throw new Error("A signed-in user and valid cart item are required.");
  }

  const itemRef = doc(getCartRef(userId), item.key);

  await setDoc(itemRef, {
    key: item.key,
    id: String(item.id),
    name: String(item.name || ""),
    price: Number(item.price) || 0,
    color: String(item.color || ""),
    size: String(item.size || ""),
    qty: Number(item.qty) || 1,
    image: String(item.image || "")
  });
}

export async function removeCloudCartItem(userId, itemKey) {
  if (!userId || !itemKey) return;

  await deleteDoc(doc(getCartRef(userId), itemKey));
}

export async function clearCloudCart(userId) {
  if (!userId) return;

  const snapshot = await getDocs(getCartRef(userId));
  const batch = writeBatch(db);

  snapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  await batch.commit();
    }


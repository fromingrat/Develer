import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import { db } from "./firebase.js";
/**
 * Fetch products that are published in Firestore.
 * Expected collection: products
 */
export async function getPublishedProducts() {
  const productsQuery = query(
    collection(db, "products"),
    where("published", "==", true)
  );

  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data()
  }));
}

/**
 * Fetch one published product by its document ID.
 */
export async function getPublishedProduct(productId) {
  const products = await getPublishedProducts();

  return products.find((product) => product.id === productId) || null;
}

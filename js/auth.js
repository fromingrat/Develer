
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import { auth, googleProvider } from "./firebase.js";

// Existing Google sign-in for customer login
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
}

// Redirect-based Google sign-in for admin pages
export async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

// Read Google's response after returning to the admin page
export async function getGoogleRedirectResult() {
  return getRedirectResult(auth);
}

// Email and Password Sign-In
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  return result.user;
}

// Create Email Account
export async function createEmailAccount(name, email, password) {
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  await updateProfile(result.user, {
    displayName: name.trim()
  });

  return result.user;
}

// Send Password Reset Email
export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

// Monitor Authentication
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// Sign Out
export async function signOutUser() {
  await signOut(auth);
}


import {
  signInWithGoogle,
  watchAuthState,
  signOutUser
} from "./auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import { db } from "./firebase.js";

const signInButton = document.getElementById("sign-in-btn");

if (signInButton) {
  signInButton.addEventListener("click", async () => {
    signInButton.disabled = true;

    try {
      if (signInButton.dataset.signedIn === "true") {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      console.error("Authentication error:", error.code);
      alert("Sign-in nahi hua. Please dobara try karo.");
    } finally {
      signInButton.disabled = false;
    }
  });

  watchAuthState(async (user) => {
    if (!user) {
      signInButton.textContent = "Sign in";
      signInButton.dataset.signedIn = "false";
      signInButton.setAttribute("aria-label", "Sign in with Google");
      return;
    }

    signInButton.textContent = user.displayName || user.email || "Account";
    signInButton.dataset.signedIn = "true";
    signInButton.setAttribute("aria-label", "Sign out");

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          profileComplete: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Profile save failed:", error.code);
      alert("Login ho gaya, lekin profile save nahi hua. Please try again.");
    }
  });
}

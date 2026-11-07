import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const avatar = document.getElementById("profile-avatar");
const loading = document.getElementById("profile-loading");
const details = document.getElementById("profile-details");
const nameElement = document.getElementById("profile-name");
const emailElement = document.getElementById("profile-email");
const logoutButton = document.getElementById("logout-button");
const message = document.getElementById("profile-message");

function showError(text) {
  message.textContent = text;
}

async function loadProfile(user) {
  try {
    let name = user.displayName?.trim() || "VELFORM Customer";

    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const profile = snapshot.data();

      if (profile.name?.trim()) {
        name = profile.name.trim();
      }
    }

    nameElement.textContent = name;
    emailElement.textContent = user.email || "";

    const firstLetter = name.charAt(0).toUpperCase();
    avatar.textContent = firstLetter;

    loading.hidden = true;
    details.hidden = false;

  } catch (error) {
    console.error("Profile loading error:", error);

    loading.hidden = true;
    nameElement.textContent =
      user.displayName?.trim() || "VELFORM Customer";
    emailElement.textContent = user.email || "";
    avatar.textContent =
      nameElement.textContent.charAt(0).toUpperCase();
    details.hidden = false;

    showError("Some profile information could not be loaded.");
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  await loadProfile(user);
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "LOGGING OUT...";

  try {
    await signOut(auth);
    window.location.replace("index.html");
  } catch (error) {
    console.error("Logout error:", error);

    logoutButton.disabled = false;
    logoutButton.textContent = "LOG OUT";

    showError("Could not log out. Please try again.");
  }
});

// Temporary actions until their pages are connected
document.querySelectorAll("[data-profile-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.profileAction;

    if (action === "orders") {
      showError("Your Orders page will be available soon.");
    }

    if (action === "membership") {
      window.location.href = "index.html?view=membership";
    }

    if (action === "privacy") {
      showError("Privacy & Security page will be connected next.");
    }
  });
});
  

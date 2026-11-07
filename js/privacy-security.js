import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const emailElement = document.getElementById("account-email");
const methodElement = document.getElementById("sign-in-method");
const passwordSection = document.getElementById("password-section");
const resetButton = document.getElementById("reset-password-button");
const statusElement = document.getElementById("security-status");

let currentUser = null;

function showStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  currentUser = user;

  emailElement.textContent = user.email || "Not available";

  const providers = user.providerData.map(
    (provider) => provider.providerId
  );

  const methods = [];

  if (providers.includes("google.com")) {
    methods.push("Google");
  }

  if (providers.includes("password")) {
    methods.push("Email & Password");
  }

  methodElement.textContent = methods.length
    ? methods.join(" + ")
    : "Other sign-in method";

  passwordSection.hidden = !providers.includes("password");
});

resetButton.addEventListener("click", async () => {
  if (!currentUser?.email) {
    showStatus("Your registered email address is unavailable.", "error");
    return;
  }

  resetButton.disabled = true;
  resetButton.textContent = "SENDING...";

  try {
    await sendPasswordResetEmail(auth, currentUser.email);

    showStatus(
      "Password reset email sent. Please check your inbox.",
      "success"
    );

    resetButton.textContent = "EMAIL SENT";
  } catch (error) {
    console.error("Password reset error:", error);

    showStatus(
      "Could not send the reset email. Please try again later.",
      "error"
    );

    resetButton.disabled = false;
    resetButton.textContent = "SEND PASSWORD RESET EMAIL";
  }
});

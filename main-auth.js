import {
  signInWithGoogle,
  watchAuthState,
  signOutUser
} from "./auth.js";

const signInButton = document.getElementById("sign-in-btn");

if (signInButton) {
  signInButton.addEventListener("click", async () => {
    try {
      if (signInButton.dataset.signedIn === "true") {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      console.error("Authentication error:", error.code);
      alert("Sign-in nahi hua. Please dobara try karo.");
    }
  });

  watchAuthState((user) => {
    if (user) {
      signInButton.textContent =
        user.displayName || user.email || "Sign out";
      signInButton.dataset.signedIn = "true";
      signInButton.setAttribute("aria-label", "Sign out");
    } else {
      signInButton.textContent = "Sign in";
      signInButton.dataset.signedIn = "false";
      signInButton.setAttribute("aria-label", "Sign in with Google");
    }
  });
}

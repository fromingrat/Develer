
import {
  watchAuthState,
  signOutUser
} from "./auth.js";

const signInButton = document.getElementById("sign-in-btn");

if (signInButton) {
  watchAuthState((user) => {
    if (user) {
      const firstName = user.displayName
        ? user.displayName.split(" ")[0]
        : "Account";

      signInButton.textContent = `Hi, ${firstName}`;
      signInButton.setAttribute("aria-label", "Open sign-in page or sign out");
      signInButton.dataset.signedIn = "true";
    } else {
      signInButton.textContent = "Sign in";
      signInButton.setAttribute("aria-label", "Sign in with Google");
      signInButton.dataset.signedIn = "false";
    }
  });

  signInButton.addEventListener("click", async (event) => {
    if (signInButton.dataset.signedIn === "true") {
      event.preventDefault();

      try {
        await signOutUser();
      } catch (error) {
        console.error("Sign-out failed:", error.code);
        alert("Sign out nahi hua. Please dobara try karo.");
      }
    }
    // If signed out, the link opens login.html normally.
  });
}

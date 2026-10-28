
import {
  watchAuthState,
  signOutUser
} from "./auth.js";

const signInButton = document.getElementById("sign-in-btn");

if (signInButton) {
  watchAuthState((user) => {
    signInButton.hidden = !!user;
    console.log("Auth user:", !!user, "Button hidden:", signInButton.hidden);
    signInButton.dataset.signedIn = user ? "true" : "false";

    if (!user) {
      signInButton.textContent = "Sign in";
    }
  });

  signInButton.addEventListener("click", async (event) => {
    if (signInButton.dataset.signedIn === "true") {
      event.preventDefault();

      try {
        await signOutUser();
      } catch (error) {
        console.error("Sign-out failed:", error);
        alert("Sign out nahi hua. Please dobara try karo.");
      }
    }
  });
}

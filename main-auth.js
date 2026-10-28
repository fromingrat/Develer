
import {
  watchAuthState,
  signOutUser
} from "./auth.js";

const signInButton = document.getElementById("sign-in-btn");

if (signInButton) {
  watchAuthState((user) => {
    
if (user) {
  signInButton.hidden = true;
} else {
  signInButton.hidden = false;
  signInButton.textContent = "Sign in";
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

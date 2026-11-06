import { watchAuthState } from "./auth.js";

export function createAccountDrawer({
  menuButton,
  openWishlist,
  showMembership,
  bottomNav
}) {
    let drawerOpen = false;
  let touchStartX = 0;
  let touchStartY = 0;
  const menuOverlay = document.createElement("div");
  menuOverlay.className = "vf-menu-overlay";
  menuOverlay.setAttribute("aria-hidden", "true");

  const accountDrawer = document.createElement("aside");
  accountDrawer.className = "vf-account-drawer";
  accountDrawer.setAttribute("aria-label", "Account menu");
  accountDrawer.setAttribute("aria-hidden", "true");

  accountDrawer.innerHTML = `
    <div class="vf-drawer-header">
      <div class="vf-profile-avatar" id="vf-profile-avatar">V</div>
      <div class="vf-profile-info">
        <p class="vf-profile-name" id="vf-profile-name">Welcome</p>
        <p class="vf-profile-email" id="vf-profile-email">
          Sign in to your account
        </p>
      </div>
      <button class="vf-drawer-close" type="button"
        aria-label="Close menu">×</button>
    </div>

    <div class="vf-drawer-greeting">
      <p id="vf-drawer-greeting">Hey there!</p>
      <span>Welcome to Velform</span>
    </div>

    <nav class="vf-drawer-links" aria-label="Account options">
      <a href="my-info.html" data-menu-item="info">
        <span>My Info</span><span>›</span>
      </a>
      <button type="button" data-menu-item="orders">
        <span>Orders</span><span>›</span>
      </button>
      <button type="button" data-menu-item="membership">
        <span>Membership</span><span>›</span>
      </button>
      <button type="button" data-menu-item="cart">
        <span>Cart</span><span>›</span>
      </button>
      <button type="button" data-menu-item="wishlist">
        <span>Wishlist</span><span>›</span>
      </button>
      <a href="support.html" data-menu-item="support">
       <span>Raise a Ticket</span><span>›</span>
      </a>
      <a href="#about" data-menu-item="about">
        <span>About Us</span><span>›</span>
      </a>
      <a href="privacy.html" data-menu-item="privacy">
        <span>Privacy Policy</span><span>›</span>
      </a>
      <button type="button" data-menu-item="account">
        <span>Account Details</span><span>›</span>
      </button>
    </nav>

    <button class="vf-drawer-logout" type="button"
      id="vf-drawer-logout">Sign In</button>
    <div class="vf-drawer-footer">VELFORM</div>
  `;

  document.body.append(menuOverlay, accountDrawer);

  function openAccountDrawer() {
    drawerOpen = true;
    menuOverlay.classList.add("is-open");
    accountDrawer.classList.add("is-open");
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close menu");
    menuOverlay.setAttribute("aria-hidden", "false");
    accountDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("vf-menu-open");
  }

  function closeAccountDrawer() {
    drawerOpen = false;
    menuOverlay.classList.remove("is-open");
    accountDrawer.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
    menuOverlay.setAttribute("aria-hidden", "true");
    accountDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("vf-menu-open");
  }

  menuButton.addEventListener("click", () => {
    if (drawerOpen) closeAccountDrawer();
    else openAccountDrawer();
  });

  accountDrawer.querySelector(".vf-drawer-close")
    .addEventListener("click", closeAccountDrawer);

  menuOverlay.addEventListener("click", closeAccountDrawer);

  accountDrawer.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  accountDrawer.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    if (deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY)) {
      closeAccountDrawer();
    }
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawerOpen) {
      closeAccountDrawer();
    }
  });

  try {
    watchAuthState((user) => {
      const fullName = user?.displayName?.trim() || "";
      const firstName = fullName.split(/\s+/)[0];

      accountDrawer.querySelector("#vf-profile-name").textContent =
        fullName || "Welcome";
      accountDrawer.querySelector("#vf-profile-email").textContent =
        user?.email || "Sign in to your account";
      accountDrawer.querySelector("#vf-profile-avatar").textContent =
        firstName ? firstName.charAt(0).toUpperCase() : "V";
      accountDrawer.querySelector("#vf-drawer-greeting").textContent =
        firstName ? `Hey, ${firstName}!` : "Hey there!";
      accountDrawer.querySelector("#vf-drawer-logout").textContent =
        user ? "Log Out" : "Sign In";
    });
  } catch (error) {
    console.warn("Could not update account information.", error);
  }

  accountDrawer.querySelector("#vf-drawer-logout")
    .addEventListener("click", async () => {
      try {
        const { signOutUser } = await import("./auth.js");
        const { auth } = await import("./firebase.js");

        if (auth.currentUser) {
          await signOutUser();
          closeAccountDrawer();
          window.location.href = "index.html";
        } else {
          window.location.href = "login.html";
        }
      } catch (error) {
        console.error("Account action failed:", error);
        alert("Unable to complete this action. Please try again.");
      }
    });

  accountDrawer.querySelectorAll("[data-menu-item]").forEach((item) => {
    item.addEventListener("click", (event) => {
      const action = item.dataset.menuItem;

      if (action === "orders") {
        event.preventDefault();
        closeAccountDrawer();
        alert("Your Orders page will be connected in the next step.");
      }

      if (action === "membership") {
        event.preventDefault();
        closeAccountDrawer();
        showMembership();

        bottomNav.querySelectorAll("button").forEach((navButton) => {
          navButton.classList.toggle(
            "active",
            navButton.dataset.navItem === "Membership"
          );
        });
      }

      if (action === "cart") {
        event.preventDefault();
        closeAccountDrawer();
        document.querySelector("[data-open-cart]")?.click();
      }

      if (action === "wishlist") {
        event.preventDefault();
        closeAccountDrawer();
        openWishlist();
      }

      if (action === "account") {
        event.preventDefault();
        closeAccountDrawer();
        window.location.href = "login.html";
      }

      if (["about", "info", "privacy", "support"].includes(action)) {
        closeAccountDrawer();
      }
    });
  });

  return { openAccountDrawer, closeAccountDrawer };
}

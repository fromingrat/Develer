
/* VELFORM — Premium Opening Intro */

(() => {
  const intro = document.getElementById("vf-intro");

  if (!intro) return;

  const taglines = [
    "NOT MADE TO BLEND.",
    "BEYOND THE ORDINARY.",
    "THE ART OF PRESENCE."
  ];

  const taglineElement = document.getElementById("vf-intro-tagline");

  const randomIndex = Math.floor(Math.random() * taglines.length);
  taglineElement.textContent = taglines[randomIndex];

  let hasVisited = false;

  try {
    hasVisited = sessionStorage.getItem("vf_intro_seen") === "1";
  } catch (error) {
    hasVisited = false;
  }

  const navigation = performance.getEntriesByType("navigation")[0];
  const isReload = navigation?.type === "reload";

  if (hasVisited && !isReload) {
    intro.remove();
    return;
  }

  try {
    sessionStorage.setItem("vf_intro_seen", "1");
  } catch (error) {
    // Intro still works if session storage is unavailable.
  }

  document.body.style.overflow = "hidden";

  // Keep intro visible for approximately 4 seconds.
  setTimeout(() => {
    intro.classList.add("is-exiting");

    document.body.style.overflow = "";

    // Remove after the smooth fade-out finishes.
    setTimeout(() => {
      intro.remove();
    }, 950);

  }, 4000);
})();

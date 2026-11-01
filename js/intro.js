/* VELFORM — Opening intro */

(() => {
  const intro = document.getElementById("vf-intro");

  if (!intro) return;

  const taglines = [
    "NOT MADE TO BLEND.",
    "BEYOND THE ORDINARY.",
    "THE ART OF PRESENCE."
  ];

  const taglineElement = document.getElementById("vf-intro-tagline");

  // Select one random tagline for this opening.
  const randomIndex = Math.floor(Math.random() * taglines.length);

  taglineElement.textContent = taglines[randomIndex];

  // Show on a fresh tab/session or when the homepage is reloaded.
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
    // Intro can still work if session storage is unavailable.
  }

  // Hide the page behind the intro from scrolling.
  document.body.style.overflow = "hidden";

  // Keep the intro visible for approximately 2.5 seconds.
  setTimeout(() => {
    intro.classList.add("is-exiting");

    document.body.style.overflow = "";

    setTimeout(() => {
      intro.remove();
    }, 500);

  }, 2050);
})();

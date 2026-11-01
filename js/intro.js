
/* VELFORM — Cinematic Luxury Intro */

(() => {
  const intro = document.getElementById("vf-intro");

  if (!intro) {
    document.body.classList.add("vf-intro-finished");
    return;
  }

  const taglines = [
    "BEYOND THE ORDINARY.",
    "THE ART OF PRESENCE."
  ];

  const taglineElement = document.getElementById("vf-intro-tagline");

  const randomIndex = Math.floor(Math.random() * taglines.length);
  const selectedTagline = taglines[randomIndex];

  taglineElement.textContent = "";
  taglineElement.setAttribute("aria-label", selectedTagline);

  [...selectedTagline].forEach((character, index) => {
    const letter = document.createElement("span");

    letter.textContent = character;
    letter.style.animationDelay = `${700 + index * 35}ms`;

    taglineElement.appendChild(letter);
  });

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
    document.body.classList.add("vf-intro-finished");
    return;
  }

  try {
    sessionStorage.setItem("vf_intro_seen", "1");
  } catch (error) {
    // Intro still works without session storage.
  }

  document.body.style.overflow = "hidden";

  // Keep the opening intro timing unchanged.
  setTimeout(() => {
    intro.classList.add("is-exiting");
    document.body.style.overflow = "";

    setTimeout(() => {
      intro.remove();

      // Start homepage animations after the intro disappears.
      document.body.classList.add("vf-intro-finished");
    }, 1000);

  }, 4000);
})();

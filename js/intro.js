
/* VELFORM — Cinematic Luxury Intro */

(() => {
  const intro = document.getElementById("vf-intro");

  if (!intro) return;

  const taglines = [
    "NOT MADE TO BLEND.",
    "BEYOND THE ORDINARY.",
    "THE ART OF PRESENCE."
  ];

  const taglineElement = document.getElementById("vf-intro-tagline");

  // Select a random tagline.
  const randomIndex = Math.floor(Math.random() * taglines.length);
  const selectedTagline = taglines[randomIndex];

  // Reveal tagline letters one by one.
  taglineElement.textContent = "";
  taglineElement.setAttribute("aria-label", selectedTagline);

  [...selectedTagline].forEach((character, index) => {
    const letter = document.createElement("span");

    letter.textContent = character;
    letter.style.animationDelay = `${700 + index * 35}ms`;

    taglineElement.appendChild(letter);
  });

  // Check whether the intro should play.
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
    // Intro still works without session storage.
  }

  document.body.style.overflow = "hidden";

  // Keep the intro visible for approximately 4 seconds.
  setTimeout(() => {
    intro.classList.add("is-exiting");
    document.body.style.overflow = "";

    // Remove after fade-out.
    setTimeout(() => {
      intro.remove();
    }, 1000);

  }, 4000);
})();

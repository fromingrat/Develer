
export function createMembership({ collection, hero, heroInner }) {
  const membership = document.createElement("section");

  membership.className = "vf-membership vf-membership-page";
  membership.id = "vf-membership";
  membership.hidden = true;

  const plans = [
    { name: "1 Month", months: 1, price: 99 },
    { name: "3 Months", months: 3, price: 249 },
    { name: "1 Year", months: 12, price: 899 }
  ];

  membership.innerHTML = `
    <div class="vf-membership-hero">
      <p class="vf-membership-eyebrow">THE VELFORM CLUB</p>
      <div class="vf-membership-crown">♛</div>
      <h2>More than membership.</h2>
      <p>
        A more rewarding way to experience VELFORM.
        Exclusive prices, early access and priority service.
      </p>
      <div class="vf-membership-hero-line"></div>
    </div>

    <div class="vf-membership-content">

      <section class="vf-benefits-section">
        <div class="vf-membership-heading">
          <p class="vf-membership-label">THE PRIVILEGES</p>
          <h3>A little more, in every experience.</h3>
          <p>Thoughtful benefits. A more rewarding way to shop.</p>
        </div>

        <div class="vf-benefit-grid">

          <article class="vf-benefit">
            <span class="vf-benefit-icon">✦</span>
            <span class="vf-benefit-number">01 / EXCLUSIVE</span>
            <h4>Member-only prices</h4>
            <p>
              Enjoy special Premium prices on eligible
              in-stock VELFORM pieces.
            </p>
          </article>

          <article class="vf-benefit">
            <span class="vf-benefit-icon">🛵</span>
            <span class="vf-benefit-number">02 / PRIORITY</span>
            <h4>Priority delivery</h4>
            <p>
              Receive priority in our delivery scheduling
              and order handling.
            </p>
          </article>

          <article class="vf-benefit">
            <span class="vf-benefit-icon">🎟️</span>
            <span class="vf-benefit-number">03 / FIRST ACCESS</span>
            <h4>Early access</h4>
            <p>
              Discover selected new arrivals before
              they become available to everyone.
            </p>
          </article>

          <article class="vf-benefit">
            <span class="vf-benefit-icon">🎁</span>
            <span class="vf-benefit-number">04 / SEASONAL</span>
            <h4>Festival privileges</h4>
            <p>
              Get access to exclusive coupons and
              special seasonal offers.
            </p>
          </article>

          <article class="vf-benefit">
            <span class="vf-benefit-icon">💬</span>
            <span class="vf-benefit-number">05 / PERSONAL</span>
            <h4>Priority customer support</h4>
            <p>
              Get priority assistance whenever you
              need help with your VELFORM experience.
            </p>
          </article>

        </div>
      </section>

      <section class="vf-plan-section">
        <div class="vf-membership-heading">
          <p class="vf-membership-label">YOUR MEMBERSHIP</p>
          <h3>Choose your time.</h3>
          <p>
            Stay longer and enjoy a lower membership
            cost per month.
          </p>
        </div>

        <div class="vf-plan-selector">
          <button
            type="button"
            class="vf-period-trigger"
            id="vf-period-trigger"
            aria-expanded="false"
            aria-controls="vf-period-options">

            <span>
              <small>MEMBERSHIP DURATION</small>
              <strong id="vf-period-current">
                Choose a time period
              </strong>
            </span>

            <span class="vf-period-arrow">⌄</span>
          </button>

          <div
            class="vf-period-options"
            id="vf-period-options"
            hidden>

            <button type="button" data-membership-plan="1 Month">
              <span>1 Month</span>
              <strong>₹99</strong>
            </button>

            <button type="button" data-membership-plan="3 Months">
              <span>3 Months</span>
              <strong>₹249</strong>
              <small>Save ₹48</small>
            </button>

            <button type="button" data-membership-plan="1 Year">
              <span>1 Year</span>
              <strong>₹899</strong>
              <small>Save ₹289</small>
            </button>
          </div>
        </div>

        <div class="vf-price-summary" id="vf-price-summary" hidden>

          <p class="vf-price-label">YOUR MEMBERSHIP PRICE</p>

          <div class="vf-price-main">
            <strong id="vf-plan-price">₹0</strong>
            <span id="vf-plan-duration"></span>
          </div>

          <div class="vf-price-divider"></div>

          <div class="vf-price-comparison">

            <div>
              <span>Equivalent per month</span>
              <strong id="vf-monthly-price"></strong>
            </div>

            <div>
              <span>Your savings</span>
              <strong id="vf-plan-saving"></strong>
            </div>

          </div>

          <p class="vf-price-note" id="vf-price-note"></p>
        </div>

        <button
          type="button"
          class="vf-membership-continue"
          id="vf-membership-continue"
          disabled>
          Choose a period to continue
        </button>

        <p
          class="vf-membership-status"
          id="vf-membership-status"
          role="status"
          aria-live="polite">
        </p>
      </section>

      <p class="vf-membership-footer">
        VELFORM PREMIUM · EXCLUSIVELY FOR MEMBERS
      </p>

    </div>
  `;

  collection.after(membership);

  function replayHeroAnimation() {
    const animatedElements = heroInner.querySelectorAll(
      ".wordmark, .vf-hero-divider, .vf-greeting, .vf-welcome-message"
    );

    animatedElements.forEach((element) => {
      element.style.animation = "none";
    });

    void heroInner.offsetWidth;

    animatedElements.forEach((element) => {
      element.style.animation = "";
    });
  }

  function showMembership() {
    hero.hidden = true;
    collection.hidden = true;

    document.querySelector("#about").hidden = true;
    document.querySelector("#contact").hidden = true;
    document.querySelector(".site-footer").hidden = true;

    membership.hidden = false;
    membership.classList.remove("is-visible");

    void membership.offsetWidth;
    membership.classList.add("is-visible");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function showHome() {
    hero.hidden = false;
    collection.hidden = false;

    document.querySelector("#about").hidden = false;
    document.querySelector("#contact").hidden = false;
    document.querySelector(".site-footer").hidden = false;

    membership.hidden = true;

    replayHeroAnimation();
  }

  const trigger = membership.querySelector("#vf-period-trigger");
  const options = membership.querySelector("#vf-period-options");
  const currentPeriod = membership.querySelector("#vf-period-current");
  const priceSummary = membership.querySelector("#vf-price-summary");

  const continueButton = membership.querySelector(
    "#vf-membership-continue"
  );

  const membershipStatus = membership.querySelector(
    "#vf-membership-status"
  );

  let selectedPlan = null;

  function closePeriodOptions() {
    options.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.classList.remove("is-open");
  }

  trigger.addEventListener("click", () => {
    const isOpening = options.hidden;

    options.hidden = !isOpening;

    trigger.setAttribute(
      "aria-expanded",
      String(isOpening)
    );

    trigger.classList.toggle("is-open", isOpening);
  });

  options.querySelectorAll("[data-membership-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      const planName = button.dataset.membershipPlan;

      selectedPlan = plans.find(
        (plan) => plan.name === planName
      );

      if (!selectedPlan) return;

      currentPeriod.textContent = selectedPlan.name;

      closePeriodOptions();

      const monthlyEquivalent =
        selectedPlan.price / selectedPlan.months;

      const regularTotal =
        99 * selectedPlan.months;

      const savings =
        regularTotal - selectedPlan.price;

      const savingPercent =
        regularTotal > 0
          ? Math.round((savings / regularTotal) * 100)
          : 0;

      membership.querySelector("#vf-plan-price").textContent =
        `₹${selectedPlan.price}`;

      membership.querySelector("#vf-plan-duration").textContent =
        `for ${selectedPlan.name}`;

      membership.querySelector("#vf-monthly-price").textContent =
        `₹${monthlyEquivalent.toFixed(2)}`;

      membership.querySelector("#vf-plan-saving").textContent =
        savings > 0
          ? `₹${savings} (${savingPercent}%)`
          : "—";

      membership.querySelector("#vf-price-note").textContent =
        savings > 0
          ? `You save ₹${savings} compared with paying ₹99 every month.`
          : "Choose a longer period to reduce your monthly cost.";

      priceSummary.hidden = false;
      priceSummary.classList.remove("is-updating");

      void priceSummary.offsetWidth;

      priceSummary.classList.add("is-updating");

      continueButton.disabled = false;

      continueButton.textContent =
        `Continue with ${selectedPlan.name}`;

      membershipStatus.textContent = "";
    });
  });

  document.addEventListener("click", (event) => {
    if (
      !membership.hidden &&
      !event.target.closest(".vf-plan-selector")
    ) {
      closePeriodOptions();
    }
  });

  membership.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePeriodOptions();
    }
  });

  continueButton.addEventListener("click", () => {
    if (!selectedPlan) return;

    membershipStatus.textContent =
      `${selectedPlan.name} membership selected. ` +
      "Membership payments will be available soon.";
  });

  return {
    showMembership,
    showHome,
    membership
  };
}

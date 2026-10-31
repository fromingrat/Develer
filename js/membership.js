
export function createMembership({ collection, hero }) {
  const membership = document.createElement("section");

  membership.className = "vf-membership vf-membership-page";
  membership.id = "vf-membership";
  membership.hidden = true;

  membership.innerHTML = `
    <div class="vf-membership-hero">
      <p class="vf-membership-eyebrow">THE VELFORM CLUB</p>
      <div class="vf-membership-crown">♛</div>
      <h2>More than membership.</h2>
      <p>
        A more rewarding way to experience VELFORM.
        Exclusive prices, early access and priority service.
      </p>
    </div>

    <div class="vf-membership-content">
      <div class="vf-membership-heading">
        <p class="vf-membership-label">CHOOSE YOUR PLAN</p>
        <h3>Premium Membership</h3>
        <p>Choose the membership duration that suits you.</p>
      </div>

      <div class="vf-plan-grid">
        <button type="button" class="vf-plan-card"
          data-membership-plan="1 Month" aria-pressed="false">
          <span class="vf-plan-duration">1 MONTH</span>
          <strong>₹99</strong>
          <span class="vf-plan-note">One month of premium benefits</span>
          <span class="vf-plan-select">Select plan</span>
        </button>

        <button type="button" class="vf-plan-card"
          data-membership-plan="3 Months" aria-pressed="false">
          <span class="vf-plan-duration">3 MONTHS</span>
          <strong>₹249</strong>
          <span class="vf-plan-note">Three months of premium benefits</span>
          <span class="vf-plan-select">Select plan</span>
        </button>

        <button type="button" class="vf-plan-card"
          data-membership-plan="1 Year" aria-pressed="false">
          <span class="vf-plan-duration">1 YEAR</span>
          <strong>₹899</strong>
          <span class="vf-plan-note">Twelve months of premium benefits</span>
          <span class="vf-plan-select">Select plan</span>
        </button>
      </div>

      <button type="button" class="vf-membership-continue"
        id="vf-membership-continue" disabled>
        Select a plan to continue
      </button>

      <p class="vf-membership-status" id="vf-membership-status"
        role="status" aria-live="polite"></p>

      <div class="vf-benefits-section">
        <p class="vf-membership-label">YOUR PRIVILEGES</p>
        <h3>Premium benefits</h3>

        <div class="vf-benefit-list">
          <div class="vf-benefit">
            <span class="vf-benefit-number">01</span>
            <div>
              <h4>Exclusive Member Prices</h4>
              <p>See a special Premium price alongside the regular
              selling price on every in-stock product.</p>
            </div>
          </div>

          <div class="vf-benefit">
            <span class="vf-benefit-number">02</span>
            <div>
              <h4>Priority Delivery</h4>
              <p>Premium members receive priority in our
              delivery scheduling and order handling.</p>
            </div>
          </div>

          <div class="vf-benefit">
            <span class="vf-benefit-number">03</span>
            <div>
              <h4>Early Access to New Arrivals</h4>
              <p>Get the first opportunity to shop new arrivals
              before they become available to everyone.</p>
            </div>
          </div>

          <div class="vf-benefit">
            <span class="vf-benefit-number">04</span>
            <div>
              <h4>Festival Season Coupons</h4>
              <p>Enjoy exclusive coupons and special offers
              during festival seasons.</p>
            </div>
          </div>

          <div class="vf-benefit">
            <span class="vf-benefit-number">05</span>
            <div>
              <h4>Priority Customer Support</h4>
              <p>Get priority assistance from our customer
              support team.</p>
            </div>
          </div>
        </div>
      </div>

      <p class="vf-membership-footer">
        VELFORM PREMIUM · EXCLUSIVELY FOR MEMBERS
      </p>
    </div>
  `;

  collection.after(membership);

  function showMembership() {
    hero.hidden = true;
    collection.hidden = true;
    document.querySelector("#about").hidden = true;
    document.querySelector("#contact").hidden = true;
    document.querySelector(".site-footer").hidden = true;

    membership.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showHome() {
    hero.hidden = false;
    collection.hidden = false;
    document.querySelector("#about").hidden = false;
    document.querySelector("#contact").hidden = false;
    document.querySelector(".site-footer").hidden = false;

    membership.hidden = true;
  }

  let selectedMembershipPlan = "";

  const planCards = membership.querySelectorAll(
    "[data-membership-plan]"
  );
  const continueButton = membership.querySelector(
    "#vf-membership-continue"
  );
  const membershipStatus = membership.querySelector(
    "#vf-membership-status"
  );

  planCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectedMembershipPlan = card.dataset.membershipPlan;

      planCards.forEach((plan) => {
        const isSelected = plan === card;

        plan.classList.toggle("selected", isSelected);
        plan.setAttribute("aria-pressed", String(isSelected));

        plan.querySelector(".vf-plan-select").textContent =
          isSelected ? "Selected ✓" : "Select plan";
      });

      continueButton.disabled = false;
      continueButton.textContent =
        "Continue with " + selectedMembershipPlan;

      membershipStatus.textContent = "";
    });
  });

  continueButton.addEventListener("click", () => {
    if (!selectedMembershipPlan) return;

    membershipStatus.textContent =
      selectedMembershipPlan +
      " plan selected. Membership payments will be available soon.";
  });

  return { showMembership, showHome, membership };
  }

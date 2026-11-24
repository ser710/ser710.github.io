/* Aerion store links. Each plan has a Stripe payment link for monthly and one for yearly; every "Start free trial"
   and "Pay yearly" button on the site takes its address from here (data-buy="pro-month" and so on). An empty link sends
   the button to the pricing table. portal: the Stripe customer portal login link (billing.stripe.com/p/login/...),
   where customers cancel, change card or get receipts. download: the installer customers get after checkout. */
window.AERION_STORE = {
  license: "https://aerion-license.srnoobie.workers.dev",
  links: {
    "design-month": "https://buy.stripe.com/6oU00lfIW5uL6OtcM5bEA0g",
    "design-year": "https://buy.stripe.com/3cI9AV40e8GXegVh2lbEA0h",
    "pro-month": "https://buy.stripe.com/bJe7sNcwK3mD8WB6nHbEA0i",
    "pro-year": "https://buy.stripe.com/cNiaEZ40e6yP7SxaDXbEA0j",
    "commercial-month": "https://buy.stripe.com/00w7sNcwKf5l4Gl13nbEA0k",
    "commercial-year": "https://buy.stripe.com/aFa3cxgN08GX5Kp4fzbEA0l",
    "complete-month": "https://buy.stripe.com/4gMdRbdAO4qH8WB8vPbEA0m",
    "complete-year": "https://buy.stripe.com/00w3cx8gu8GXc8N13nbEA0n",
  },
  portal: "https://billing.stripe.com/p/login/8x2fZjgN00ar6Oth2lbEA00",
  download: { res: "https://github.com/ser710/ser710.github.io/releases/download/aerion-1.5.66/Aerion-HVAC-Design-Studio-Setup-1.5.66.exe", com: "https://github.com/ser710/ser710.github.io/releases/download/aerion-1.5.66/Aerion-Commercial-Setup-1.5.66.exe" },
};
(function () {
  const S = window.AERION_STORE;
  function wire() {
    for (const a of document.querySelectorAll("[data-buy]")) {
      const url = S.links[a.dataset.buy];
      a.href = url || "./#pricing";
      if (url) a.rel = "noopener";
    }
    for (const a of document.querySelectorAll("[data-portal]")) if (S.portal) a.href = S.portal;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();

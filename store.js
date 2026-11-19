/* Aerion store links. Each plan has a Stripe payment link for monthly and one for yearly; every "Start free trial"
   and "Pay yearly" button on the site takes its address from here (data-buy="pro-month" and so on). An empty link sends
   the button to the pricing table. portal: the Stripe customer portal login link (billing.stripe.com/p/login/...),
   where customers cancel, change card or get receipts. download: the installer customers get after checkout. */
window.AERION_STORE = {
  license: "https://aerion-license.srnoobie.workers.dev",
  links: {
    "design-month": "https://buy.stripe.com/8x2fZjgN00ar6Oth2lbEA00",
    "design-year": "https://buy.stripe.com/28E4gB2Wag9pc8NdQ9bEA01",
    "pro-month": "https://buy.stripe.com/bJe4gBcwK9L13Ch3bvbEA02",
    "pro-year": "https://buy.stripe.com/4gMfZj1S69L11u97rLbEA03",
    "commercial-month": "https://buy.stripe.com/fZu8wRaoC3mD3CheUdbEA04",
    "commercial-year": "https://buy.stripe.com/eVq8wRdAO8GX0q57rLbEA05",
    "complete-month": "https://buy.stripe.com/14A4gB9ky3mD0q5eUdbEA06",
    "complete-year": "https://buy.stripe.com/4gM7sNeES9L1fkZaDXbEA07",
  },
  portal: "https://billing.stripe.com/p/login/8x2fZjgN00ar6Oth2lbEA00",
  download: { res: "https://github.com/ser710/ser710.github.io/releases/download/aerion-1.5.52/Aerion-HVAC-Design-Studio-Setup-1.5.52.exe", com: "https://github.com/ser710/ser710.github.io/releases/download/aerion-1.5.52/Aerion-Commercial-Setup-1.5.52.exe" },
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

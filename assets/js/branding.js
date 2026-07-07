// assets/js/branding.js
// One place for company identity used by the public site, admin console, estimates, and invoices.
window.JJC_BRANDING = {
  companyName: "Jeff Jones Consulting",
  shortName: "JJC",
  tagline: "Working Genius Facilitation",
  email: "jeff@jeffjonesconsulting.com",
  phone: "(559) 978-7598",
  address: "",
  primaryColor: "#263860",
  logoPathPublic: "assets/images/JJC_Logo.png",
  logoPathAdmin: "../assets/images/JJC_Logo.png",
  website: "https://jeffjonesconsulting.com"
};

window.JJC_applyBranding = function applyBranding(context = "public") {
  const b = window.JJC_BRANDING;
  const logoPath = context === "admin" ? b.logoPathAdmin : b.logoPathPublic;

  document.querySelectorAll("[data-brand-logo]").forEach(img => {
    img.src = logoPath;
    img.alt = b.companyName + " logo";
  });

  document.querySelectorAll("[data-brand-company]").forEach(el => el.textContent = b.companyName);
  document.querySelectorAll("[data-brand-tagline]").forEach(el => el.textContent = b.tagline);
  document.querySelectorAll("[data-brand-email]").forEach(el => {
    el.textContent = b.email;
    if (el.tagName.toLowerCase() === "a") el.href = "mailto:" + b.email;
  });
  document.querySelectorAll("[data-brand-phone]").forEach(el => {
    el.textContent = b.phone;
    if (el.tagName.toLowerCase() === "a") el.href = "tel:15599787598";
  });
};

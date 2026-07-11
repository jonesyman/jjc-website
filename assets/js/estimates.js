// assets/js/estimates.js
// Estimate-specific helpers.
window.Estimates = {
  createSheetRow(estimate) {
return {
  id: estimate.id,
  ClientID: estimate.clientId || "",
  createdAt: (estimate.createdAt || new Date().toISOString()).slice(0, 10),
  orgType: estimate.orgType,
  hours: estimate.hours,
  participants: estimate.participants,
  subtotal: estimate.subtotal,
  discounts: estimate.discounts || 0,
  total: estimate.total,
  status: estimate.status || "Draft",
  workshopDate: estimate.workshopDate || "",
  name: estimate.name || "",
  probability: estimate.probability || "",
  consultingGross: estimate.consultingGross || 0,
  prepGross: estimate.prepGross || 0,
  assessmentGross: estimate.assessmentGross || 0,
  consultingNet: estimate.consultingNet || 0,
  prepNet: estimate.prepNet || 0,
  assessmentNet: estimate.assessmentNet || 0,
  hourly: estimate.hourly || 0,
  prepRate: estimate.prepRate || 0,
  assessmentRate: estimate.assessmentRate || 0,
  isIndividual: estimate.isIndividual ? "TRUE" : "FALSE",
  pdfUrl: estimate.pdfUrl || "",
  pdfFileId: estimate.pdfFileId || "",
  pdfGeneratedDate: estimate.pdfGeneratedDate || "",
  sentDate: estimate.sentDate || "",
  firstSentDate: estimate.firstSentDate || "",
  lastSentDate: estimate.lastSentDate || "",
  sentTo: estimate.sentTo || "",
  sentCc: estimate.sentCc || "",
  sentSubject: estimate.sentSubject || "",
  sendCount: estimate.sendCount || 0
};
  },

  saveToLocal(estimate) {
    const key = "jjc_saved_estimates";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.unshift(estimate);
    localStorage.setItem(key, JSON.stringify(current));
    return current;
  },

  loadLocal() {
    return JSON.parse(localStorage.getItem("jjc_saved_estimates") || "[]");
  }
};

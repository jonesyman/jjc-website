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
  total: estimate.total,
  status: estimate.status || "Draft",
  discounts: estimate.discounts || 0,
  workshopDate: estimate.workshopDate || "",
  name: estimate.name || "",
  probability: estimate.probability || ""
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

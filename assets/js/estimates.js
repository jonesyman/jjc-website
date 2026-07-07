// assets/js/estimates.js
// Estimate-specific helpers.
window.Estimates = {
  createSheetRow(estimate) {
    return {
      EstimateID: estimate.id,
      ClientID: estimate.clientId || "",
      Date: (estimate.createdAt || new Date().toISOString()).slice(0, 10),
      Type: estimate.orgType,
      Hours: estimate.hours,
      Participants: estimate.participants,
      Total: estimate.total,
      Status: estimate.status || "Draft",
      Discount: estimate.discounts || 0,
      "Workshop Date": estimate.workshopDate || "",
      Notes: estimate.notes || estimate.name || "",
      Probability: estimate.probability || ""
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

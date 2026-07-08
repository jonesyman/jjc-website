// assets/js/invoices.js
// Invoice-specific helpers, including branded print rendering.
window.Invoices = {
  nextNumber(existingCount = 0) {
    const year = new Date().getFullYear();
    return "JJC-" + year + "-" + String(existingCount + 1).padStart(3, "0");
  },

  createSheetRow(invoice) {
return {
  invoiceNo: invoice.invoiceNo,
  estimateId: invoice.estimateId || "",
  clientName: invoice.clientName || "",
  clientEmail: invoice.clientEmail || "",
  terms: invoice.terms || "Net 30",
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  subtotal: invoice.subtotal || 0,
  discounts: invoice.discounts || 0,
  total: invoice.total,
  orgType: invoice.orgType || "",
  hours: invoice.hours || "",
  participants: invoice.participants || "",
  consultingGross: invoice.consultingGross || 0,
  prepGross: invoice.prepGross || 0,
  assessmentGross: invoice.assessmentGross || 0,
  consultingNet: invoice.consultingNet || 0,
  prepNet: invoice.prepNet || 0,
  assessmentNet: invoice.assessmentNet || 0,
  hourly: invoice.hourly || 0,
  prepRate: invoice.prepRate || 0,
  assessmentRate: invoice.assessmentRate || 0,
  isIndividual: invoice.isIndividual ? "TRUE" : "FALSE",
  paid: invoice.paid || "No",
  paidDate: invoice.paidDate || "",
  checkNumber: invoice.checkNumber || "",
  achNumber: invoice.achNumber || "",
  stripeId: invoice.stripeId || ""
};
  },

  saveToLocal(invoice) {
    const key = "jjc_saved_invoices";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.unshift(invoice);
    localStorage.setItem(key, JSON.stringify(current));
    return current;
  },

  loadLocal() {
    return JSON.parse(localStorage.getItem("jjc_saved_invoices") || "[]");
  }
};

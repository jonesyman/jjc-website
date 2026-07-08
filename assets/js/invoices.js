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
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  total: invoice.total,
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

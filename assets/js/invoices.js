// assets/js/invoices.js
// Invoice-specific helpers, including branded print rendering.
window.Invoices = {
  nextNumber(existingCount = 0) {
    const year = new Date().getFullYear();
    return "JJC-" + year + "-" + String(existingCount + 1).padStart(3, "0");
  },

  createSheetRow(invoice) {
    return {
      "Invoice_#": invoice.invoiceNo,
      EstimateID: invoice.estimateId || "",
      Date: invoice.issueDate,
      Due: invoice.dueDate,
      Amount: invoice.total,
      Paid: invoice.paid || "No",
      PaidDate: invoice.paidDate || "",
      "Check_#": invoice.checkNumber || "",
      "ACH_#": invoice.achNumber || "",
      StripeID: invoice.stripeId || ""
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

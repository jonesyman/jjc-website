// assets/js/googleSheets.js
// Google Sheets backend adapter. If you ever replace Google Sheets later, keep the same Database methods.
window.Database = {
  apiUrl: "https://script.google.com/macros/s/AKfycbzf8ywN8yb8y6CIdo3xngoHkhHNiW0ZMQO2nKtfqh4OTSW5Ciet1Eczi24YmHP6Kf3b/exec",

  async getRates() {
    const response = await fetch(this.apiUrl + "?action=rates");
    if (!response.ok) throw new Error("Unable to load rates.");
    return await response.json();
  },

  async getEstimates() {
    const response = await fetch(this.apiUrl + "?action=estimates");
    if (!response.ok) throw new Error("Unable to load estimates.");
    return await response.json();
  },

  async getInvoices() {
    const response = await fetch(this.apiUrl + "?action=invoices");
    if (!response.ok) throw new Error("Unable to load invoices.");
    return await response.json();
  },

  saveEstimate(data) {
    return this.postNoCors("saveEstimate", data);
  },

  saveInvoice(data) {
    return this.postNoCors("saveInvoice", data);
  },

  postNoCors(action, data) {
    // Apps Script often has CORS friction. no-cors submits the row but does not expose the response.
    return fetch(this.apiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, data })
    });
  }
};

// assets/js/googleSheets.js
// ======================================================
// Jeff Jones Consulting
// Google Sheets Database Layer
// ======================================================

window.Database = {

    // Replace this only if your Apps Script URL changes
    apiUrl: "https://script.google.com/macros/s/AKfycbzf8ywN8yb8y6CIdo3xngoHkhHNiW0ZMQO2nKtfqh4OTSW5Ciet1Eczi24YmHP6Kf3b/exec",

    //----------------------------------------------------
    // Generic GET
    //----------------------------------------------------

    async get(action) {

        const url = `${this.apiUrl}?action=${action}&_=${Date.now()}`;

        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Unable to load ${action}. Status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.error) {
            throw new Error(data.error);
        }

        console.log(`Loaded ${action}:`, data);

        return data;
    },

    //----------------------------------------------------
    // Generic POST
    //----------------------------------------------------

    post(action, data) {

        return this.postNoCors(action, data);

    },

    postNoCors(action, data) {

        return fetch(this.apiUrl, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify({
                action,
                data
            })

        });

    },

    //----------------------------------------------------
    // Settings
    //----------------------------------------------------
    async getSettings() {
  return this.get("settings");
},

saveSettings(data) {
  return this.post("saveSettings", data);
},
    
    //----------------------------------------------------
    // Rates
    //----------------------------------------------------

    async getRates() {
        return this.get("rates");
    },

    //----------------------------------------------------
    // Clients
    //----------------------------------------------------

    async getClients() {
        return this.get("clients");
    },

    saveClient(data) {
        return this.post("saveClient", data);
    },

    //----------------------------------------------------
    // Workshops
    //----------------------------------------------------

    async getWorkshops() {
        return this.get("workshops");
    },

    saveWorkshop(data) {
        return this.post("saveWorkshop", data);
    },

    //----------------------------------------------------
    // Estimates
    //----------------------------------------------------

    async getEstimates() {
        return this.get("estimates");
    },

    saveEstimate(data) {
        return this.post("saveEstimate", data);
    },

    //----------------------------------------------------
    // Invoices
    //----------------------------------------------------

    async getInvoices() {
        return this.get("invoices");
    },

    saveInvoice(data) {
        return this.post("saveInvoice", data);
    }

};

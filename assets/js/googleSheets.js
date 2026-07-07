// assets/js/googleSheets.js
// =====================================================
// Jeff Jones Consulting
// Google Sheets Data Access Layer
// =====================================================

window.Database = {

    apiUrl: "https://script.google.com/macros/s/AKfycbzf8ywN8yb8y6CIdo3xngoHkhHNiW0ZMQO2nKtfqh4OTSW5Ciet1Eczi24YmHP6Kf3b/exec",

    //--------------------------------------------------
    // Generic GET
    //--------------------------------------------------

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

    console.log(`Loaded ${action} from Google Sheets:`, data);

    return data;
},

    //--------------------------------------------------
    // Rates
    //--------------------------------------------------

    async getRates() {
        return this.get("rates");
    },

    //--------------------------------------------------
    // Clients
    //--------------------------------------------------

    async getClients() {
        return this.get("clients");
    },

    //--------------------------------------------------
    // Workshops
    //--------------------------------------------------

    async getWorkshops() {
        return this.get("workshops");
    },

    //--------------------------------------------------
    // Estimates
    //--------------------------------------------------

    async getEstimates() {
        return this.get("estimates");
    },

    //--------------------------------------------------
    // Invoices
    //--------------------------------------------------

    async getInvoices() {
        return this.get("invoices");
    },

    //--------------------------------------------------
    // Saves
    //--------------------------------------------------

    saveClient(data) {
        return this.post("saveClient", data);
    },

    saveWorkshop(data) {
        return this.post("saveWorkshop", data);
    },

    saveEstimate(data) {
        return this.post("saveEstimate", data);
    },

    saveInvoice(data) {
        return this.post("saveInvoice", data);
    },

    //--------------------------------------------------
    // Generic POST
    //--------------------------------------------------

    post(action, data) {

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

    }

};

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

    async post(action, data) {

        await this.postNoCors(action, data);
        return this.verifyWrite(action, data);

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

    async verifyWrite(action, data) {

        const rule = this.writeVerification[action];
        if (!rule) {
            return { ok: true, verified: false };
        }

        let lastError = null;

        for (let attempt = 1; attempt <= 4; attempt++) {
            await this.wait(attempt * 450);

            try {
                const rows = await this.get(rule.readAction);
                const verified = rule.verify(rows, data);

                if (verified) {
                    return { ok: true, verified: true, action };
                }
            } catch (error) {
                lastError = error;
            }
        }

        throw new Error(
            `Google Sheets did not confirm ${action}. ` +
            (lastError ? lastError.message : "The update was not visible after saving.")
        );

    },

    wait(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

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

    deleteClient(id) {
        return this.post("deleteClient", { id });
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

    deleteWorkshop(id) {
        return this.post("deleteWorkshop", { id });
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

    generateEstimatePdf(id) {
        return this.post("generateEstimatePdf", { id });
    },

    deleteEstimate(id) {
        return this.post("deleteEstimate", { id });
    },

    //----------------------------------------------------
    // Invoices
    //----------------------------------------------------

    async getInvoices() {
        return this.get("invoices");
    },

    saveInvoice(data) {
        return this.post("saveInvoice", data);
    },

    generateInvoicePdf(invoiceNo) {
        return this.post("generateInvoicePdf", { invoiceNo });
    },

    deleteInvoice(invoiceNo) {
        return this.post("deleteInvoice", { invoiceNo });
    }

};

window.Database.writeVerification = {
    saveSettings: {
        readAction: "settings",
        verify(settings, data) {
            if (!settings || typeof settings !== "object") return false;
            return Object.keys(data || {}).every(key => normalizeValue(settings[key]) === normalizeValue(data[key]));
        }
    },
    saveClient: {
        readAction: "clients",
        verify(rows, data) {
            return hasVerifiedRow(rows, data, ["id", "clientId", "ClientID"]);
        }
    },
    deleteClient: {
        readAction: "clients",
        verify(rows, data) {
            return !hasMatchingRow(rows, data, ["id", "clientId", "ClientID"]);
        }
    },
    saveWorkshop: {
        readAction: "workshops",
        verify(rows, data) {
            return hasVerifiedRow(rows, data, ["id", "workshopId", "WorkshopID"]);
        }
    },
    deleteWorkshop: {
        readAction: "workshops",
        verify(rows, data) {
            return !hasMatchingRow(rows, data, ["id", "workshopId", "WorkshopID"]);
        }
    },
    saveEstimate: {
        readAction: "estimates",
        verify(rows, data) {
            return hasVerifiedRow(rows, data, ["id", "estimateId", "EstimateID"]);
        }
    },
    generateEstimatePdf: {
        readAction: "estimates",
        verify(rows, data) {
            return hasPdfMetadata(rows, data, ["id", "estimateId", "EstimateID"]);
        }
    },
    deleteEstimate: {
        readAction: "estimates",
        verify(rows, data) {
            return !hasMatchingRow(rows, data, ["id", "estimateId", "EstimateID"]);
        }
    },
    saveInvoice: {
        readAction: "invoices",
        verify(rows, data) {
            return hasVerifiedRow(rows, data, ["invoiceNo", "InvoiceNo", "invoiceId", "InvoiceID"]);
        }
    },
    generateInvoicePdf: {
        readAction: "invoices",
        verify(rows, data) {
            return hasPdfMetadata(rows, data, ["invoiceNo", "InvoiceNo", "invoiceId", "InvoiceID"]);
        }
    },
    deleteInvoice: {
        readAction: "invoices",
        verify(rows, data) {
            return !hasMatchingRow(rows, data, ["invoiceNo", "InvoiceNo", "invoiceId", "InvoiceID"]);
        }
    }
};

function hasMatchingRow(rows, data, keys) {
    if (!Array.isArray(rows) || !data) return false;

    const expected = firstValue(data, keys);
    if (!expected) return false;

    return rows.some(row => String(firstValue(row, keys) || "") === String(expected));
}

function hasVerifiedRow(rows, data, keys) {
    if (!Array.isArray(rows) || !data) return false;

    const expected = firstValue(data, keys);
    if (!expected) return false;

    const row = rows.find(candidate => String(firstValue(candidate, keys) || "") === String(expected));
    if (!row) return false;

    return rowMatchesData(row, data);
}

function hasPdfMetadata(rows, data, keys) {
    if (!Array.isArray(rows) || !data) return false;

    const expected = firstValue(data, keys);
    if (!expected) return false;

    const row = rows.find(candidate => String(firstValue(candidate, keys) || "") === String(expected));
    return !!(row && row.pdfUrl && row.pdfFileId);
}

function rowMatchesData(row, data) {
    let compared = 0;

    Object.keys(data || {}).forEach(key => {
        const rowKey = findComparableKey(row, key);
        if (!rowKey) return;

        compared++;
        if (normalizeValue(row[rowKey]) !== normalizeValue(data[key])) {
            compared = -Infinity;
        }
    });

    return compared >= 1;
}

function findComparableKey(row, key) {
    if (!row || row[key] !== undefined) return key;

    const normalizedKey = key.toLowerCase();
    return Object.keys(row).find(rowKey => rowKey.toLowerCase() === normalizedKey);
}

function firstValue(source, keys) {
    for (const key of keys) {
        if (source && source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== "") {
            return source[key];
        }
    }
    return "";
}

function normalizeValue(value) {
    return String(value || "").replace(/\r\n/g, "\n").trim();
}

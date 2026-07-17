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

    async get(action, params = {}) {

        const query = new URLSearchParams({ action, _: Date.now(), ...params });
        const url = `${this.apiUrl}?${query.toString()}`;

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

    async reserveNumber(type) {
        const result = await this.get("reserveNumber", { type });
        if (!result || !result.value) throw new Error("Apps Script did not return a reserved number.");
        return result.value;
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

    async saveWorkshop(data) {
        const payload = { ...data, SaveToken: `WSV-${crypto.randomUUID()}` };
        await this.post("saveWorkshop", payload);
        return data;
    },

    deleteWorkshop(id) {
        return this.post("deleteWorkshop", { id });
    },

    //----------------------------------------------------
    // Email Templates
    //----------------------------------------------------

    getEmailTemplates() {
        return this.get("getEmailTemplates");
    },

    async saveEmailTemplate(data) {
        const before = await this.getEmailTemplates();
        const beforeIds = new Set(before.map(row => String(row.EmailTemplateID)));
        await this.postNoCors("saveEmailTemplate", data);
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            const rows = await this.getEmailTemplates();
            const saved = data.EmailTemplateID
                ? rows.find(row => String(row.EmailTemplateID) === String(data.EmailTemplateID) && String(row.TemplateName) === String(data.TemplateName) && String(row.Subject) === String(data.Subject) && String(row.Body) === String(data.Body))
                : rows.find(row => !beforeIds.has(String(row.EmailTemplateID)) && String(row.TemplateName) === String(data.TemplateName) && String(row.Subject) === String(data.Subject) && String(row.Body) === String(data.Body));
            if (saved) return { rows, saved };
        }
        throw new Error("Google Sheets did not confirm the email template save.");
    },

    async setEmailTemplateActive(id, active) {
        await this.postNoCors(active ? "restoreEmailTemplate" : "archiveEmailTemplate", { EmailTemplateID:id });
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            const rows = await this.getEmailTemplates();
            const saved = rows.find(row => String(row.EmailTemplateID) === String(id));
            if (saved && (String(saved.Active).toLowerCase() !== "false") === Boolean(active)) return rows;
        }
        throw new Error(`Google Sheets did not confirm the template ${active ? "restore" : "archive"}.`);
    },

    async duplicateEmailTemplate(id) {
        const before = await this.getEmailTemplates();
        const beforeIds = new Set(before.map(row => String(row.EmailTemplateID)));
        await this.postNoCors("duplicateEmailTemplate", { EmailTemplateID:id });
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            const rows = await this.getEmailTemplates();
            const saved = rows.find(row => !beforeIds.has(String(row.EmailTemplateID)));
            if (saved) return { rows, saved };
        }
        throw new Error("Google Sheets did not confirm the template duplication.");
    },

    async deleteEmailTemplate(id) {
        await this.postNoCors("deleteEmailTemplate", { EmailTemplateID:id });
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            const rows = await this.getEmailTemplates();
            if (!rows.some(row => String(row.EmailTemplateID) === String(id))) return rows;
        }
        throw new Error("Google Sheets did not confirm permanent template deletion.");
    },

    getWorkshopAssessment(workshopId) {
        return this.get("getWorkshopAssessment", { workshopId });
    },

    getAllActiveAssessmentResults() {
        return this.get("getAllActiveAssessmentResults");
    },

    getAssessmentWorkspace() {
        return this.get("getAssessmentWorkspace");
    },

    async saveAdHocAssessment(data) {
        await this.postNoCors("saveAdHocAssessment", data);
        for (let attempt = 1; attempt <= 5; attempt++) {
            await this.wait(attempt * 450);
            const workspace = await this.getAssessmentWorkspace();
            if (workspace?.people?.some(person => String(person.PersonID) === String(data.personId))) return workspace;
        }
        throw new Error("Google Sheets did not confirm the individual assessment.");
    },

    async saveAssessmentGroup(data) {
        await this.postNoCors("saveAssessmentGroup", data);
        let lastError = null;
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            try {
                const workspace = await this.getAssessmentWorkspace();
                const saved = workspace?.groups?.find(group => String(group.GroupID) === String(data.groupId) && String(group.GroupName) === String(data.groupName));
                const groupMemberships = (workspace?.memberships || []).filter(member => String(member.GroupID) === String(data.groupId));
                const memberIds = new Set(groupMemberships.map(member => String(member.PersonID)));
                const membersMatch = data.personIds.length === memberIds.size && data.personIds.every(personId => memberIds.has(String(personId)));
                const activeLeaders = groupMemberships.filter(member => String(member.IsLeader).toLowerCase() === "true");
                const leaderMatches = data.leaderPersonId ? activeLeaders.length === 1 && String(activeLeaders[0].PersonID) === String(data.leaderPersonId) : activeLeaders.length === 0;
                if (saved && membersMatch && leaderMatches) return workspace;
            } catch (error) { lastError = error; }
        }
        throw new Error(`Google Sheets did not confirm the assessment group.${lastError ? " " + lastError.message : ""}`);
    },

    async deleteAssessmentGroup(groupId) {
        await this.postNoCors("deleteAssessmentGroup", { groupId });
        let lastError = null;
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            try {
                const workspace = await this.getAssessmentWorkspace();
                if (!workspace?.groups?.some(group => String(group.GroupID) === String(groupId))) return workspace;
            } catch (error) { lastError = error; }
        }
        throw new Error(`Google Sheets did not confirm group removal.${lastError ? " " + lastError.message : ""}`);
    },

    async restoreAssessmentGroup(groupId) {
        await this.postNoCors("restoreAssessmentGroup", { groupId });
        let lastError = null;
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            try {
                const workspace = await this.getAssessmentWorkspace();
                if (workspace?.groups?.some(group => String(group.GroupID) === String(groupId))) return workspace;
            } catch (error) { lastError = error; }
        }
        throw new Error(`Google Sheets did not confirm group restoration.${lastError ? " " + lastError.message : ""}`);
    },

    async addPeopleToWorkshopAssessment(data) {
        const personIds = Array.from(new Set((data.personIds || []).map(value => String(value || "").trim()).filter(Boolean)));
        if (!data.workshopId || !personIds.length) throw new Error("Choose a workshop and at least one person.");
        await this.postNoCors("addPeopleToWorkshopAssessment", { ...data, personIds });
        let lastError = null;
        for (let attempt = 1; attempt <= 8; attempt++) {
            await this.wait(attempt * 500);
            try {
                const assessment = await this.getWorkshopAssessment(data.workshopId);
                const savedIds = new Set((assessment?.results || []).map(row => String(row.PersonID || "")));
                if (assessment?.import && personIds.every(personId => savedIds.has(personId))) return assessment;
            } catch (error) { lastError = error; }
        }
        throw new Error(`Google Sheets did not confirm the workshop roster update.${lastError ? " " + lastError.message : ""}`);
    },

    async resolveAssessmentDuplicate(data) {
        await this.postNoCors("resolveAssessmentDuplicate", data);
        for (let attempt = 1; attempt <= 5; attempt++) {
            await this.wait(attempt * 450);
            const workspace = await this.getAssessmentWorkspace();
            const remains = workspace?.duplicates?.some(item => {
                const ids = [String(item.person1?.PersonID), String(item.person2?.PersonID)];
                return ids.includes(String(data.personId1)) && ids.includes(String(data.personId2));
            });
            if (!remains) return workspace;
        }
        throw new Error("Google Sheets did not confirm the duplicate decision.");
    },

    getAssessmentImportHistory(workshopId) {
        return this.get("getAssessmentImportHistory", { workshopId });
    },

    async saveWorkshopAssessment(data) {
        const startedAt = Date.now();
        await this.postNoCors("saveWorkshopAssessment", data);
        for (let attempt = 1; attempt <= 5; attempt++) {
            await this.wait(attempt * 500);
            const assessment = await this.getWorkshopAssessment(data.workshopId);
            const eventDate = data.mode === "Merge" ? assessment?.import?.UpdatedDate : assessment?.import?.ImportedDate;
            const savedAt = eventDate ? new Date(eventDate).getTime() : 0;
            if (assessment && assessment.import && savedAt >= startedAt - 2000 && (data.mode === "Merge" || Number(assessment.import.ParticipantCount) === data.participants.length)) return assessment;
        }
        throw new Error("Google Sheets did not confirm the assessment import.");
    },

    async updateAssessmentLeader(data) {
        await this.postNoCors("updateAssessmentLeader", data);
        for (let attempt = 1; attempt <= 5; attempt++) {
            await this.wait(attempt * 450);
            const assessment = await this.getWorkshopAssessment(data.workshopId);
            if (String(assessment?.import?.LeaderAssessmentResultID || "") === String(data.assessmentResultId)) return assessment;
        }
        throw new Error("Google Sheets did not confirm the selected leader.");
    },

    async deactivateWorkshopAssessment(workshopId) {
        await this.postNoCors("deactivateWorkshopAssessment", { workshopId });
        for (let attempt = 1; attempt <= 5; attempt++) {
            await this.wait(attempt * 450);
            const assessment = await this.getWorkshopAssessment(workshopId);
            if (!assessment?.import) return assessment;
        }
        throw new Error("Google Sheets did not confirm removal of the assessment data.");
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
        return this.get("generateEstimatePdf", { id });
    },

    sendEstimateEmail(data) {
        return this.get("sendEstimateEmail", data);
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
        return this.get("generateInvoicePdf", { invoiceNo });
    },

    sendInvoiceEmail(data) {
        return this.get("sendInvoiceEmail", data);
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
            return hasVerifiedToken(rows, data, ["id", "workshopId", "WorkshopID"], "SaveToken");
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
    sendEstimateEmail: {
        readAction: "estimates",
        verify(rows, data) {
            return hasSentMetadata(rows, data, ["id", "estimateId", "EstimateID"]);
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
    sendInvoiceEmail: {
        readAction: "invoices",
        verify(rows, data) {
            return hasSentMetadata(rows, data, ["invoiceNo", "InvoiceNo", "invoiceId", "InvoiceID"]);
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

function hasVerifiedToken(rows, data, keys, tokenKey) {
    if (!Array.isArray(rows) || !data || !data[tokenKey]) return false;
    const expected = firstValue(data, keys);
    if (!expected) return false;
    const row = rows.find(candidate => String(firstValue(candidate, keys) || "") === String(expected));
    return !!row && String(row[tokenKey] || "") === String(data[tokenKey]);
}

function hasPdfMetadata(rows, data, keys) {
    if (!Array.isArray(rows) || !data) return false;

    const expected = firstValue(data, keys);
    if (!expected) return false;

    const row = rows.find(candidate => String(firstValue(candidate, keys) || "") === String(expected));
    return !!(row && row.pdfUrl && row.pdfFileId);
}

function hasSentMetadata(rows, data, keys) {
    if (!Array.isArray(rows) || !data) return false;

    const expected = firstValue(data, keys);
    if (!expected) return false;

    const row = rows.find(candidate => String(firstValue(candidate, keys) || "") === String(expected));
    return !!(row && row.lastSentDate && row.sentTo);
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
    if (value === undefined || value === null || value === "") return "";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (typeof value === "number") return String(Number(value));
    const text = String(value).replace(/\r\n/g, "\n").trim();
    if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text)) return text.slice(0, 10);
    if (/^(true|false)$/i.test(text)) return text.toUpperCase();
    if (/^-?\d+(?:\.\d+)?$/.test(text)) return String(Number(text));
    return text;
}

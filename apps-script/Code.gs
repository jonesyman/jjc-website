const SHEET_NAMES = {
  settings: "Settings",
  rates: "Rates",
  clients: "Clients",
  estimates: "Estimates",
  invoices: "Invoices",
  workshops: "Workshops"
};

const PDF_HEADERS = ["pdfUrl", "pdfFileId", "pdfGeneratedDate"];
const EMAIL_HEADERS = ["sentDate", "firstSentDate", "lastSentDate", "sentTo", "sentCc", "sentSubject", "sendCount"];
const WORKSHOP_HEADERS = ["WorkshopDate", "StartTime", "EndTime", "Location", "DeliveryFormat", "Participants", "PrimaryContact", "ContactEmail", "Notes", "EstimateID", "InvoiceID", "FollowUpDate", "Status", "Type", "ClientID", "Organization"];
const ARCHIVE_HEADERS = ["archived", "archivedDate"];
const INVOICE_LIFECYCLE_HEADERS = ["amountPaid", "balanceDue", "paidDate", "paymentMethod", "paymentReference", "voidReason"];
const PDF_ROOT_FOLDER = "Jeff Jones Consulting PDFs";
const PDF_ESTIMATE_FOLDER = "Estimates";
const PDF_INVOICE_FOLDER = "Invoices";
const LOGO_URL = "https://jeffjonesconsulting.com/assets/images/JJC_Logo.png";
const ZOHO_DEFAULT_ACCOUNTS_URL = "https://accounts.zoho.com";
const ZOHO_DEFAULT_MAIL_API_URL = "https://mail.zoho.com/api";

function authorizeDriveAccess() {
  getOrCreatePdfFolder(PDF_ESTIMATE_FOLDER);
  getOrCreatePdfFolder(PDF_INVOICE_FOLDER);
  return "Drive access authorized for Jeff Jones Consulting PDF generation.";
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";

  try {
    if (action === "settings") return jsonResponse(getSettings());
    if (action === "rates") return jsonResponse(getRates());
    if (action === "clients") return jsonResponse(getRows(SHEET_NAMES.clients));
    if (action === "estimates") return jsonResponse(getRows(SHEET_NAMES.estimates));
    if (action === "invoices") return jsonResponse(getRows(SHEET_NAMES.invoices));
    if (action === "workshops") return jsonResponse(getRows(SHEET_NAMES.workshops));
    if (action === "reserveNumber") return jsonResponse(reserveRecordNumber(e.parameter.type));
    if (action === "generateEstimatePdf") return jsonResponse(generatePdfForRecord("estimate", e.parameter.id));
    if (action === "generateInvoicePdf") return jsonResponse(generatePdfForRecord("invoice", e.parameter.invoiceNo));
    if (action === "sendEstimateEmail") return jsonResponse(sendEmailForRecord("estimate", e.parameter));
    if (action === "sendInvoiceEmail") return jsonResponse(sendEmailForRecord("invoice", e.parameter));

    return jsonResponse({ error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ error: String(err && err.message ? err.message : err) });
  }
}

function reserveRecordNumber(type) {
  const configs = {
    client: { sheet: SHEET_NAMES.clients, header: "ClientID", prefix: "CLI", digits: 4 },
    workshop: { sheet: SHEET_NAMES.workshops, header: "WorkshopID", prefix: "WRK", digits: 4 },
    estimate: { sheet: SHEET_NAMES.estimates, header: "id", prefix: "EST", digits: 4 },
    invoice: { sheet: SHEET_NAMES.invoices, header: "invoiceNo", prefix: "INV", digits: 4 }
  };
  const config = configs[String(type || "").toLowerCase()];
  if (!config) throw new Error("Unknown number type: " + type);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = getRows(config.sheet);
    const pattern = new RegExp("^" + config.prefix + "-(\\d+)$", "i");
    const highestSaved = rows.reduce((highest, row) => {
      const match = String(row[config.header] || "").match(pattern);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    const properties = PropertiesService.getScriptProperties();
    const propertyKey = "NEXT_NUMBER_" + String(type).toUpperCase();
    const lastReserved = Number(properties.getProperty(propertyKey) || 0);
    const next = Math.max(highestSaved, lastReserved) + 1;
    properties.setProperty(propertyKey, String(next));
    return { value: config.prefix + "-" + String(next).padStart(config.digits, "0") };
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;

    if (action === "saveSettings") {
      saveSettings(body.data || {});
      return jsonResponse({ success: true });
    }

    if (action === "saveClient") {
      ensureHeaders(SHEET_NAMES.clients, ARCHIVE_HEADERS);
      upsertRow(SHEET_NAMES.clients, "ClientID", body.data || {});
      return jsonResponse({ success: true });
    }

    if (action === "deleteClient") {
      deleteRowById(SHEET_NAMES.clients, "ClientID", (body.data || {}).id);
      return jsonResponse({ success: true });
    }

    if (action === "saveEstimate") {
      ensureHeaders(SHEET_NAMES.estimates, PDF_HEADERS.concat(EMAIL_HEADERS, ARCHIVE_HEADERS));
      upsertRow(SHEET_NAMES.estimates, "id", body.data || {});
      return jsonResponse({ success: true });
    }

    if (action === "generateEstimatePdf") {
      return jsonResponse(generatePdfForRecord("estimate", (body.data || {}).id));
    }

    if (action === "saveInvoice") {
      ensureHeaders(SHEET_NAMES.invoices, [
        "status",
        "consultingDiscount",
        "prepDiscount",
        "assessmentDiscount",
        "invoiceFooter",
        "paymentInstructions",
        "checksPayableTo"
      ].concat(PDF_HEADERS, EMAIL_HEADERS, ARCHIVE_HEADERS, INVOICE_LIFECYCLE_HEADERS));
      upsertRow(SHEET_NAMES.invoices, "invoiceNo", body.data || {});
      return jsonResponse({ success: true });
    }

    if (action === "generateInvoicePdf") {
      return jsonResponse(generatePdfForRecord("invoice", (body.data || {}).invoiceNo));
    }

    if (action === "saveWorkshop") {
      ensureHeaders(SHEET_NAMES.workshops, WORKSHOP_HEADERS.concat(ARCHIVE_HEADERS));
      upsertRow(SHEET_NAMES.workshops, "WorkshopID", body.data || {});
      return jsonResponse({ success: true });
    }

    if (action === "deleteWorkshop") {
      deleteRowById(SHEET_NAMES.workshops, "WorkshopID", (body.data || {}).id);
      return jsonResponse({ success: true });
    }

    if (action === "deleteEstimate") {
      deleteRowById(SHEET_NAMES.estimates, "id", (body.data || {}).id);
      return jsonResponse({ success: true });
    }

    if (action === "deleteInvoice") {
      deleteRowById(SHEET_NAMES.invoices, "invoiceNo", (body.data || {}).invoiceNo);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ error: String(err && err.message ? err.message : err) });
  }
}

function getRates() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.rates);
  if (!sheet) return {};

  const rows = sheet.getDataRange().getValues();
  const rates = {};

  rows.slice(1).forEach(row => {
    const item = row[0];
    const amount = row[1];
    if (item) rates[item] = Number(amount);
  });

  return rates;
}

function getSettings() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.settings);
  if (!sheet) return {};

  const rows = sheet.getDataRange().getValues();
  const settings = {};

  rows.slice(1).forEach(row => {
    const key = row[0];
    const value = row[1];
    if (key) settings[key] = value;
  });

  settings.businessName = settings.businessName || settings["Business Name"] || settings.Company || settings.company || "";
  settings.email = settings.email || settings.Email || "";
  settings.phone = settings.phone || settings.Phone || "";
  settings.address = settings.address || settings.Address || "";
  settings.invoiceFooter = settings.invoiceFooter || settings["Invoice Footer"] || "";
  settings.paymentInstructions = settings.paymentInstructions || settings["Payment Instructions"] || "";
  settings.checksPayableTo = settings.checksPayableTo || settings["Checks Payable To"] || "";

  return settings;
}

function saveSettings(data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.settings);
  if (!sheet) throw new Error("Missing sheet tab: " + SHEET_NAMES.settings);

  const values = sheet.getDataRange().getValues();

  Object.keys(data).forEach(key => {
    let found = false;

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === key) {
        sheet.getRange(i + 1, 2).setValue(data[key]);
        found = true;
        break;
      }
    }

    if (!found) sheet.appendRow([key, data[key]]);
  });
}

function getRows(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];

  return values.slice(1).filter(row => row.some(cell => cell !== "")).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header) obj[header] = row[i];
    });
    return obj;
  });
}

function ensureHeaders(sheetName, requiredHeaders) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet tab: " + sheetName);

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  requiredHeaders.forEach(header => {
    if (headers.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      headers.push(header);
    }
  });
}

function appendRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet tab: " + sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => data[header] ?? "");
  sheet.appendRow(row);
}

function upsertRow(sheetName, idHeader, data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet tab: " + sheetName);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idColIndex = headers.indexOf(idHeader);
  const idValue = data[idHeader];

  if (idColIndex === -1 || !idValue) {
    appendRow(sheetName, data);
    return;
  }

  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]) === String(idValue)) {
      const row = headers.map(header => data[header] ?? "");
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return;
    }
  }

  appendRow(sheetName, data);
}

function deleteRowById(sheetName, idHeader, idValue) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet tab: " + sheetName);
  if (!idValue) throw new Error("Missing id value for delete.");

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = values[0];
  const idColIndex = headers.indexOf(idHeader);
  if (idColIndex === -1) throw new Error("Missing id header: " + idHeader + " on " + sheetName);

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][idColIndex]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

function generatePdfForRecord(type, idValue) {
  if (!idValue) throw new Error("Missing record id for PDF generation.");

  const config = getPdfConfig(type);
  ensureHeaders(config.sheetName, PDF_HEADERS);

  const recordInfo = getRowById(config.sheetName, config.idHeader, idValue);
  if (!recordInfo) throw new Error(config.label + " not found: " + idValue);

  const settings = getSettings();
  const record = recordInfo.row;
  const previousFileId = record.pdfFileId || "";
  const fileName = buildPdfFileName(config.prefix, idValue, config.nameFor(record));
  const folder = getOrCreatePdfFolder(config.folderName);
  const html = buildDocumentHtml(type, record, settings);
  const pdfBlob = HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF).setName(fileName);
  const file = folder.createFile(pdfBlob);

  if (previousFileId) {
    safelyTrashFile(previousFileId);
  }

  const metadata = {
    pdfUrl: file.getUrl(),
    pdfFileId: file.getId(),
    pdfGeneratedDate: new Date().toISOString()
  };

  updateRowFields(config.sheetName, recordInfo.rowNumber, metadata);
  return { success: true, type: type, id: idValue, ...metadata };
}

function sendEmailForRecord(type, params) {
  const config = getPdfConfig(type);
  const idValue = type === "invoice" ? params.invoiceNo : params.id;
  if (!idValue) throw new Error("Missing record id for email send.");

  ensureHeaders(config.sheetName, PDF_HEADERS.concat(EMAIL_HEADERS));

  let recordInfo = getRowById(config.sheetName, config.idHeader, idValue);
  if (!recordInfo) throw new Error(config.label + " not found: " + idValue);

  let record = recordInfo.row;
  if (!record.pdfFileId) {
    generatePdfForRecord(type, idValue);
    recordInfo = getRowById(config.sheetName, config.idHeader, idValue);
    record = recordInfo.row;
  }

  if (!record.pdfFileId) throw new Error("A PDF could not be generated for " + idValue + ".");

  const to = String(params.to || "").trim();
  const cc = String(params.cc || "").trim();
  const subject = String(params.subject || defaultEmailSubject(type, record)).trim();
  const body = String(params.body || defaultEmailBody(type, record, getSettings())).trim();

  if (!to) throw new Error("Recipient email is required.");
  if (!isValidEmailList(to)) throw new Error("Recipient email is invalid.");
  if (cc && !isValidEmailList(cc)) throw new Error("CC email is invalid.");
  if (!subject) throw new Error("Email subject is required.");
  if (!body) throw new Error("Email body is required.");

  const file = DriveApp.getFileById(record.pdfFileId);
  const attachment = uploadZohoAttachment(file.getBlob().setName(file.getName()));
  const sendResult = sendZohoMail({
    to: to,
    cc: cc,
    subject: subject,
    body: body,
    attachments: [attachment]
  });

  const now = new Date().toISOString();
  const sendCount = Number(record.sendCount || 0) + 1;
  const metadata = {
    sentDate: now,
    firstSentDate: record.firstSentDate || now,
    lastSentDate: now,
    sentTo: to,
    sentCc: cc,
    sentSubject: subject,
    sendCount: sendCount,
    status: type === "invoice" && record.status && record.status !== "Draft" ? record.status : "Sent"
  };

  updateRowFields(config.sheetName, recordInfo.rowNumber, metadata);

  return {
    success: true,
    type: type,
    id: idValue,
    messageId: sendResult.messageId || sendResult.data?.messageId || "",
    ...metadata
  };
}

function getZohoConfig() {
  const props = PropertiesService.getScriptProperties();
  const config = {
    clientId: props.getProperty("ZOHO_CLIENT_ID"),
    clientSecret: props.getProperty("ZOHO_CLIENT_SECRET"),
    refreshToken: props.getProperty("ZOHO_REFRESH_TOKEN"),
    accountId: props.getProperty("ZOHO_ACCOUNT_ID"),
    fromEmail: props.getProperty("ZOHO_FROM_EMAIL") || "jeff@jeffjonesconsulting.com",
    accountsUrl: props.getProperty("ZOHO_ACCOUNTS_URL") || ZOHO_DEFAULT_ACCOUNTS_URL,
    mailApiUrl: props.getProperty("ZOHO_MAIL_API_URL") || ZOHO_DEFAULT_MAIL_API_URL
  };

  ["clientId", "clientSecret", "refreshToken", "accountId", "fromEmail"].forEach(key => {
    if (!config[key]) throw new Error("Missing Zoho script property: " + key);
  });

  return config;
}

function getZohoAccessToken() {
  const config = getZohoConfig();
  const response = UrlFetchApp.fetch(config.accountsUrl + "/oauth/v2/token", {
    method: "post",
    muteHttpExceptions: true,
    payload: {
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token"
    }
  });

  const status = response.getResponseCode();
  const data = JSON.parse(response.getContentText() || "{}");
  if (status < 200 || status >= 300 || !data.access_token) {
    throw new Error("Zoho token refresh failed: " + response.getContentText());
  }

  return data.access_token;
}

function uploadZohoAttachment(blob) {
  const config = getZohoConfig();
  const token = getZohoAccessToken();
  const fileName = blob.getName() || "document.pdf";
  const bytes = blob.getBytes();
  if (!bytes.length) throw new Error("PDF attachment is empty before Zoho upload: " + fileName);

  const url = config.mailApiUrl + "/accounts/" + encodeURIComponent(config.accountId) + "/messages/attachments?uploadType=multipart&isInline=false";
  const response = UrlFetchApp.fetch(url, {
    method: "post",
    muteHttpExceptions: true,
    headers: {
      Accept: "application/json",
      Authorization: "Zoho-oauthtoken " + token
    },
    payload: {
      attach: blob.setName(fileName)
    }
  });

  const status = response.getResponseCode();
  const data = JSON.parse(response.getContentText() || "{}");
  if (status < 200 || status >= 300 || data.status?.code >= 300) {
    throw new Error("Zoho attachment upload failed: " + response.getContentText());
  }

  const attachment = data.data && (Array.isArray(data.data) ? data.data[0] : data.data);
  if (!attachment) throw new Error("Zoho attachment upload returned no attachment data.");
  return attachment;
}

function sendZohoMail(message) {
  const config = getZohoConfig();
  const token = getZohoAccessToken();
  const payload = {
    fromAddress: config.fromEmail,
    toAddress: message.to,
    subject: message.subject,
    content: textToHtml(message.body),
    mailFormat: "html",
    attachments: message.attachments || []
  };

  if (message.cc) payload.ccAddress = message.cc;

  const response = UrlFetchApp.fetch(config.mailApiUrl + "/accounts/" + encodeURIComponent(config.accountId) + "/messages", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: { Authorization: "Zoho-oauthtoken " + token },
    payload: JSON.stringify(payload)
  });

  const status = response.getResponseCode();
  const data = JSON.parse(response.getContentText() || "{}");
  if (status < 200 || status >= 300 || data.status?.code >= 300) {
    throw new Error("Zoho email send failed: " + response.getContentText());
  }

  return data;
}

function defaultEmailSubject(type, record) {
  if (type === "invoice") return "Invoice " + record.invoiceNo + " from Jeff Jones Consulting";
  return "Estimate " + record.id + " from Jeff Jones Consulting";
}

function defaultEmailBody(type, record, settings) {
  const name = type === "invoice" ? record.clientName : record.name;
  const number = type === "invoice" ? record.invoiceNo : record.id;
  const docLabel = type === "invoice" ? "invoice" : "estimate";
  return "Hello,\n\nPlease find attached " + docLabel + " " + number + " from " + (settings.businessName || "Jeff Jones Consulting") + ".\n\nThank you,\n" + (settings.businessName || "Jeff Jones Consulting");
}

function textToHtml(text) {
  return escHtml(text).replace(/\n/g, "<br>");
}

function isValidEmailList(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .every(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

function getPdfConfig(type) {
  if (type === "estimate") {
    return {
      sheetName: SHEET_NAMES.estimates,
      idHeader: "id",
      prefix: "EST",
      label: "Estimate",
      folderName: PDF_ESTIMATE_FOLDER,
      nameFor: record => record.name || record.Organization || "Estimate"
    };
  }

  if (type === "invoice") {
    return {
      sheetName: SHEET_NAMES.invoices,
      idHeader: "invoiceNo",
      prefix: "INV",
      label: "Invoice",
      folderName: PDF_INVOICE_FOLDER,
      nameFor: record => record.clientName || record.Organization || "Invoice"
    };
  }

  throw new Error("Unknown PDF type: " + type);
}

function getRowById(sheetName, idHeader, idValue) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet tab: " + sheetName);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return null;

  const headers = values[0];
  const idColIndex = headers.indexOf(idHeader);
  if (idColIndex === -1) throw new Error("Missing id header: " + idHeader + " on " + sheetName);

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]) === String(idValue)) {
      const row = {};
      headers.forEach((header, index) => {
        if (header) row[header] = values[i][index];
      });
      return { row: row, rowNumber: i + 1, headers: headers };
    }
  }

  return null;
}

function updateRowFields(sheetName, rowNumber, fields) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet tab: " + sheetName);

  ensureHeaders(sheetName, Object.keys(fields));
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  Object.keys(fields).forEach(key => {
    const colIndex = headers.indexOf(key);
    if (colIndex === -1) throw new Error("Missing header after ensureHeaders: " + key);
    sheet.getRange(rowNumber, colIndex + 1).setValue(fields[key]);
  });
}

function getOrCreatePdfFolder(childName) {
  const root = getOrCreateFolder(DriveApp, PDF_ROOT_FOLDER);
  return getOrCreateFolder(root, childName);
}

function getOrCreateFolder(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function safelyTrashFile(fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (err) {
    console.warn("Unable to trash old PDF file: " + err);
  }
}

function buildPdfFileName(prefix, idValue, name) {
  return sanitizeFileName(idValue + " - " + (name || prefix) + ".pdf");
}

function sanitizeFileName(name) {
  return String(name || "Document.pdf").replace(/[\\/:*?\"<>|#%{}~&]/g, "-").replace(/\s+/g, " ").trim();
}

function buildDocumentHtml(type, record, settings) {
  const isInvoice = type === "invoice";
  const title = isInvoice ? "Invoice" : "Estimate";
  const number = isInvoice ? record.invoiceNo : record.id;
  const clientName = isInvoice ? record.clientName : record.name;
  const issueDate = isInvoice ? record.issueDate : record.createdAt;
  const terms = isInvoice ? record.terms : "";
  const dueDate = isInvoice ? record.dueDate : "";
  const lines = buildServiceLines(record, isInvoice);
  const paymentInstructions = record.paymentInstructions || settings.paymentInstructions || "";
  const invoiceFooter = record.invoiceFooter || settings.invoiceFooter || "";

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 34px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; }
    .brand { display: flex; gap: 14px; align-items: flex-start; }
    .brand img { width: 72px; height: 72px; object-fit: contain; }
    .brand h2 { margin: 0 0 4px; color: #111827; }
    .muted { color: #64748b; font-size: 13px; white-space: pre-wrap; }
    .title { text-align: right; color: #263860; }
    .title h1 { margin: 0 0 8px; font-size: 38px; text-transform: uppercase; letter-spacing: .04em; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 30px 0; }
    .label { color: #64748b; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; color: #475569; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding: 10px 8px; }
    td { border-bottom: 1px solid #e5e7eb; padding: 12px 8px; vertical-align: top; }
    th:nth-child(n+2), td:nth-child(n+2) { text-align: right; }
    .totals { margin-left: auto; width: 280px; margin-top: 24px; }
    .line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .grand { font-size: 20px; font-weight: 800; color: #263860; border-bottom: 0; padding-top: 14px; }
    .note { margin-top: 32px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; color: #475569; white-space: pre-wrap; font-size: 13px; }
    .footer { border-top: 1px solid #e2e8f0; margin-top: 44px; padding-top: 18px; color: #64748b; text-align: center; font-size: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="${LOGO_URL}" alt="Jeff Jones Consulting logo">
      <div>
        <h2>${escHtml(settings.businessName || "Jeff Jones Consulting")}</h2>
        <div class="muted">Working Genius Facilitation & Consulting</div>
        <div class="muted" style="margin-top:8px;">${escHtml(settings.address || "")}</div>
        <div class="muted">${escHtml(settings.email || "")}${settings.phone ? " • " + escHtml(settings.phone) : ""}</div>
      </div>
    </div>
    <div class="title">
      <h1>${title}</h1>
      <div>No: <strong>${escHtml(number || "-")}</strong></div>
      <div>Issue: <strong>${escHtml(formatDisplayDate(issueDate))}</strong></div>
      ${isInvoice ? `<div>Due: <strong>${escHtml(formatDisplayDate(dueDate))}</strong></div><div>Terms: <strong>${escHtml(terms || "")}</strong></div>` : ""}
    </div>
  </div>
  <div class="parties">
    <div>
      <div class="label">Prepared By</div>
      <strong>${escHtml(settings.businessName || "Jeff Jones Consulting")}</strong>
    </div>
    <div>
      <div class="label">${isInvoice ? "Billed To" : "Prepared For"}</div>
      <strong>${escHtml(clientName || "-")}</strong>
      <div class="muted">${escHtml(record.clientEmail || "")}</div>
    </div>
  </div>
  <table>
    <thead><tr><th>Service Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>${lines.map(line => `<tr><td>${escHtml(line.description)}</td><td>${escHtml(line.qty)}</td><td>${money(line.rate)}</td><td>${money(line.amount)}</td></tr>`).join("")}</tbody>
  </table>
  <div class="totals">
    <div class="line"><span>Subtotal</span><strong>${money(record.subtotal)}</strong></div>
    ${Number(record.discounts || 0) > 0 ? `<div class="line"><span>Discounts</span><strong>-${money(record.discounts)}</strong></div>` : ""}
    <div class="line grand"><span>Total Due</span><span>${money(record.total)}</span></div>
  </div>
  ${paymentInstructions ? `<div class="note">${escHtml(paymentInstructions)}</div>` : ""}
  ${invoiceFooter ? `<div class="footer">${escHtml(invoiceFooter)}</div>` : ""}
</body>
</html>`;
}

function buildServiceLines(record, isInvoice) {
  if (String(record.isIndividual).toUpperCase() === "TRUE") {
    return [{
      description: isInvoice ? "Individual Working Genius debrief" : "Individual debrief estimate",
      qty: 1,
      rate: record.consultingGross || record.total || 0,
      amount: record.consultingNet || record.total || 0
    }];
  }

  const lines = [];
  if (Number(record.consultingGross || 0) || Number(record.consultingNet || 0)) {
    lines.push({
      description: "Working Genius facilitation / consulting",
      qty: record.hours || 1,
      rate: record.hourly || 0,
      amount: record.consultingNet || record.consultingGross || 0
    });
  }
  if (Number(record.prepGross || 0) || Number(record.prepNet || 0)) {
    lines.push({
      description: "Preparation and planning",
      qty: Math.max(1, Math.ceil(Number(record.participants || 1) / 12)),
      rate: record.prepRate || 0,
      amount: record.prepNet || record.prepGross || 0
    });
  }
  if (Number(record.assessmentGross || 0) || Number(record.assessmentNet || 0)) {
    lines.push({
      description: "Assessment / administration",
      qty: record.participants || 1,
      rate: record.assessmentRate || 0,
      amount: record.assessmentNet || record.assessmentGross || 0
    });
  }

  if (!lines.length) {
    lines.push({ description: "Working Genius services", qty: 1, rate: record.total || 0, amount: record.total || 0 });
  }

  return lines;
}

function money(value) {
  return "$" + Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDisplayDate(value) {
  if (!value) return "-";
  return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "MMM d, yyyy");
}

function escHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

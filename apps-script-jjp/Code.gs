const JJP_CONFIG = Object.freeze({
  SPREADSHEET_ID: "1awuRVwSa7hy4rAoC21fKvB1ctMNmZi82dwDhe6WTxYw",
  DOCUMENT_FOLDER_ID: "1Q2B7z4q-HZdVX-wEP9L5XchEUacurgxZ",
  TIMEZONE: "America/Los_Angeles"
});

const JJP_SHEETS = Object.freeze({
  Clients: ["ClientID","Name","Company","Email","Phone","ShippingAddress","Notes","Active","CreatedDate","UpdatedDate"],
  Projects: ["ProjectID","ClientID","ProjectName","Description","Status","DueDate","Notes","Active","CreatedDate","UpdatedDate"],
  Filaments: ["FilamentID","Name","MaterialType","Color","SpoolWeightG","SpoolCost","CostPerGram","Supplier","Active","CreatedDate","UpdatedDate"],
  AdditionalCosts: ["CostID","Name","Category","UnitType","DefaultUnitCost","Description","Active","CreatedDate","UpdatedDate"],
  Documents: ["DocumentID","Type","Status","ClientID","ProjectID","IssueDate","DueDate","ValidUntil","Notes","Subtotal","FailureBufferPercent","FailureBufferAmount","Discount","TaxPercent","TaxAmount","Shipping","GrandTotal","AmountPaid","BalanceDue","SourceQuoteID","PdfFileID","PdfUrl","PdfGeneratedDate","Active","CreatedDate","UpdatedDate"],
  DocumentItems: ["ItemID","DocumentID","ItemType","ReferenceID","Description","Quantity","Unit","UnitCost","Amount","SortOrder","CreatedDate","UpdatedDate"],
  Settings: ["Key","Value","Description","UpdatedDate"],
  Counters: ["Key","NextNumber","UpdatedDate"]
});

const JJP_DEFAULT_SETTINGS = Object.freeze({
  BusinessName: ["Jeff Jones Prints", "Business name shown on quotes and invoices"],
  BusinessSubtitle: ["Custom 3D Printing & Prototypes", "Subtitle shown below the business name"],
  BusinessEmail: ["", "Primary business email"],
  BusinessPhone: ["", "Primary business phone"],
  BusinessAddress: ["", "Business mailing address"],
  PaymentInstructions: ["Payment due according to the terms shown on this invoice.", "Invoice payment instructions"],
  DefaultLaborRate: ["30.00", "Default labor and assembly rate per hour"],
  DefaultMachineRate: ["1.00", "Default machine wear and electricity rate per hour"],
  DefaultFailureBufferPercent: ["10", "Default print failure and waste allowance"],
  DefaultTaxPercent: ["0", "Default sales tax percentage"],
  QuoteValidityDays: ["30", "Default quote validity period"],
  LogoFileID: ["", "Optional Google Drive PNG file ID for PDF branding"]
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu("JJP Setup")
    .addItem("Initialize / Repair JJP Database", "initializeJjpDatabase")
    .addItem("Open Generated Documents Folder", "showGeneratedDocumentsFolder")
    .addToUi();
}

function showGeneratedDocumentsFolder() {
  const url = "https://drive.google.com/drive/folders/" + JJP_CONFIG.DOCUMENT_FOLDER_ID;
  const html = HtmlService.createHtmlOutput('<p><a href="' + url + '" target="_blank">Open JJP Generated Documents</a></p>').setWidth(360).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, "JJP Generated Documents");
}

function initializeJjpDatabase() {
  Object.keys(JJP_SHEETS).forEach(name => ensureSheet_(name, JJP_SHEETS[name]));
  seedSettings_();
  seedCounters_();
  seedLibrary_();
  ensureDocumentFolders_();
  try { SpreadsheetApp.getActive().toast("JJP database is ready.", "JJP Setup", 6); } catch (ignored) {}
  return { ok: true };
}

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "");
    if (action === "health") return json_({ ok: true, service: "JJP Operations Backend" });
    if (action === "initialize") { initializeJjpDatabase(); return json_({ ok: true }); }
    if (action === "getWorkspace") return json_({ ok: true, data: getWorkspace_() });
    if (action === "generatePdf") return json_(generatePdf_(String(e.parameter.id || "")));
    return json_({ ok: false, error: "Unknown action: " + action });
  } catch (error) {
    return json_({ ok: false, error: error.message, stack: error.stack || "" });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = String(payload.action || "");
    if (action === "saveRecord") saveRecord_(payload.data || {});
    else if (action === "saveDocument") saveDocument_(payload.data || {});
    else if (action === "convertQuote") convertQuote_(payload.data || {});
    else if (action === "saveSettings") saveSettings_(payload.data || {});
    else throw new Error("Unknown action: " + action);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function getWorkspace_() {
  initializeJjpDatabase();
  const documents = rows_("Documents");
  const items = rows_("DocumentItems");
  const itemsByDocument = {};
  items.forEach(item => {
    if (!itemsByDocument[item.DocumentID]) itemsByDocument[item.DocumentID] = [];
    itemsByDocument[item.DocumentID].push(item);
  });
  documents.forEach(document => {
    document.Items = (itemsByDocument[document.DocumentID] || []).sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
  });
  return {
    clients: rows_("Clients"),
    projects: rows_("Projects"),
    documents: documents.sort((a, b) => String(b.CreatedDate).localeCompare(String(a.CreatedDate))),
    filaments: rows_("Filaments"),
    additionalCosts: rows_("AdditionalCosts"),
    settings: settingsObject_()
  };
}

function saveRecord_(input) {
  initializeJjpDatabase();
  const entity = String(input.entity || "");
  const map = {
    client: ["Clients", "ClientID", "CLI"],
    project: ["Projects", "ProjectID", "PRJ"],
    filament: ["Filaments", "FilamentID", "FIL"],
    cost: ["AdditionalCosts", "CostID", "CST"]
  };
  if (!map[entity]) throw new Error("Unsupported record type.");
  const config = map[entity], sheetName = config[0], idField = config[1], prefix = config[2];
  const record = Object.assign({}, input.record || {});
  validateRecord_(entity, record);
  const now = isoNow_();
  if (!record[idField]) {
    record[idField] = nextId_(prefix);
    record.CreatedDate = now;
    record.Active = true;
  }
  record.UpdatedDate = now;
  if (entity === "filament") {
    const weight = number_(record.SpoolWeightG);
    record.CostPerGram = weight > 0 ? round_(number_(record.SpoolCost) / weight, 6) : 0;
  }
  upsert_(sheetName, idField, record);
  return record;
}

function saveDocument_(input) {
  initializeJjpDatabase();
  const record = Object.assign({}, input);
  const items = Array.isArray(record.Items) ? record.Items : [];
  delete record.Items;
  if (record.Type !== "QUOTE" && record.Type !== "INVOICE") throw new Error("Document type must be QUOTE or INVOICE.");
  if (!record.ClientID) throw new Error("Select a client.");
  if (!items.length) throw new Error("Add at least one cost item.");
  const now = isoNow_();
  if (!record.DocumentID) {
    record.DocumentID = nextId_(record.Type === "QUOTE" ? "JJP-Q" : "JJP-INV");
    record.CreatedDate = now;
    record.Active = true;
  }
  const totals = calculateDocumentTotals_(record, items);
  Object.assign(record, totals);
  record.AmountPaid = number_(record.AmountPaid);
  record.BalanceDue = Math.max(0, round_(record.GrandTotal - record.AmountPaid, 2));
  record.UpdatedDate = now;
  upsert_("Documents", "DocumentID", record);
  deleteWhere_("DocumentItems", "DocumentID", record.DocumentID);
  items.forEach((item, index) => {
    const saved = Object.assign({}, item, {
      ItemID: Utilities.getUuid(),
      DocumentID: record.DocumentID,
      Quantity: number_(item.Quantity),
      UnitCost: number_(item.UnitCost),
      Amount: round_(number_(item.Quantity) * number_(item.UnitCost), 2),
      SortOrder: index + 1,
      CreatedDate: now,
      UpdatedDate: now
    });
    appendObject_("DocumentItems", saved);
  });
  return record;
}

function convertQuote_(input) {
  const quote = rowById_("Documents", "DocumentID", String(input.DocumentID || ""));
  if (!quote || quote.Type !== "QUOTE") throw new Error("Quote not found.");
  const items = rows_("DocumentItems").filter(item => item.DocumentID === quote.DocumentID);
  const invoice = Object.assign({}, quote, {
    DocumentID: "",
    Type: "INVOICE",
    Status: "Draft",
    SourceQuoteID: quote.DocumentID,
    DueDate: addDays_(today_(), 14),
    ValidUntil: "",
    PdfFileID: "",
    PdfUrl: "",
    PdfGeneratedDate: "",
    Items: items
  });
  const saved = saveDocument_(invoice);
  quote.Status = "Accepted";
  quote.UpdatedDate = isoNow_();
  upsert_("Documents", "DocumentID", quote);
  return saved;
}

function saveSettings_(input) {
  initializeJjpDatabase();
  const sheet = sheet_("Settings");
  const values = rows_("Settings");
  const descriptions = {};
  values.forEach(row => descriptions[row.Key] = row.Description || "");
  Object.keys(input || {}).forEach(key => {
    upsert_("Settings", "Key", {
      Key: key,
      Value: String(input[key] == null ? "" : input[key]),
      Description: descriptions[key] || (JJP_DEFAULT_SETTINGS[key] && JJP_DEFAULT_SETTINGS[key][1]) || "",
      UpdatedDate: isoNow_()
    });
  });
}

function calculateDocumentTotals_(record, items) {
  const subtotal = round_(items.reduce((sum, item) => sum + number_(item.Quantity) * number_(item.UnitCost), 0), 2);
  const failureBufferPercent = number_(record.FailureBufferPercent);
  const failureBufferAmount = round_(subtotal * failureBufferPercent / 100, 2);
  const discount = Math.max(0, number_(record.Discount));
  const taxable = Math.max(0, subtotal + failureBufferAmount - discount);
  const taxPercent = number_(record.TaxPercent);
  const taxAmount = round_(taxable * taxPercent / 100, 2);
  const shipping = Math.max(0, number_(record.Shipping));
  return {
    Subtotal: subtotal,
    FailureBufferPercent: failureBufferPercent,
    FailureBufferAmount: failureBufferAmount,
    Discount: discount,
    TaxPercent: taxPercent,
    TaxAmount: taxAmount,
    Shipping: shipping,
    GrandTotal: round_(taxable + taxAmount + shipping, 2)
  };
}

function generatePdf_(documentId) {
  initializeJjpDatabase();
  const record = rowById_("Documents", "DocumentID", documentId);
  if (!record) throw new Error("Document not found.");
  const client = rowById_("Clients", "ClientID", record.ClientID) || {};
  const project = rowById_("Projects", "ProjectID", record.ProjectID) || {};
  const items = rows_("DocumentItems").filter(item => item.DocumentID === documentId).sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
  const settings = settingsObject_();
  const doc = DocumentApp.create(documentId + " Working File");
  const body = doc.getBody();
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(42).setMarginRight(42);
  const headerTable = body.appendTable([["", ""]]);
  headerTable.setBorderWidth(0);
  const left = headerTable.getCell(0, 0), right = headerTable.getCell(0, 1);
  insertLogo_(left, settings);
  left.appendParagraph(settings.BusinessName || "Jeff Jones Prints").setHeading(DocumentApp.ParagraphHeading.HEADING1).setForegroundColor("#145c3b");
  left.appendParagraph(settings.BusinessSubtitle || "Custom 3D Printing & Prototypes").setForegroundColor("#4b6357");
  right.appendParagraph(record.Type === "QUOTE" ? "QUOTE" : "INVOICE").setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.RIGHT).setForegroundColor("#145c3b");
  right.appendParagraph(record.DocumentID).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  right.appendParagraph("Issued: " + formatDate_(record.IssueDate)).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  if (record.Type === "QUOTE") right.appendParagraph("Valid until: " + formatDate_(record.ValidUntil)).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  else right.appendParagraph("Due: " + formatDate_(record.DueDate)).setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendHorizontalRule();
  const parties = body.appendTable([["BILL TO", "PROJECT"], [
    [client.Name || client.Company || "", client.Company && client.Company !== client.Name ? client.Company : "", client.Email || "", client.Phone || "", client.ShippingAddress || ""].filter(Boolean).join("\n"),
    [project.ProjectName || "General 3D Printing", project.Description || ""].filter(Boolean).join("\n")
  ]]);
  styleHeaderRow_(parties, "#dcefe4");
  body.appendParagraph("");
  const rows = [["DESCRIPTION", "QTY", "UNIT", "RATE", "AMOUNT"]];
  items.forEach(item => rows.push([
    item.Description || item.ItemType || "",
    formatNumber_(item.Quantity),
    item.Unit || "",
    currency_(item.UnitCost),
    currency_(item.Amount)
  ]));
  const itemTable = body.appendTable(rows);
  styleHeaderRow_(itemTable, "#145c3b", "#ffffff");
  [1,2,3,4].forEach(column => {
    for (let row = 1; row < itemTable.getNumRows(); row++) itemTable.getCell(row, column).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  });
  body.appendParagraph("");
  const totalRows = [
    ["Subtotal", currency_(record.Subtotal)],
    ["Failure / waste buffer (" + formatNumber_(record.FailureBufferPercent) + "%)", currency_(record.FailureBufferAmount)]
  ];
  if (number_(record.Discount)) totalRows.push(["Discount", "-" + currency_(record.Discount)]);
  if (number_(record.TaxAmount)) totalRows.push(["Tax (" + formatNumber_(record.TaxPercent) + "%)", currency_(record.TaxAmount)]);
  if (number_(record.Shipping)) totalRows.push(["Shipping", currency_(record.Shipping)]);
  totalRows.push([record.Type === "QUOTE" ? "QUOTE TOTAL" : "BALANCE DUE", currency_(record.Type === "INVOICE" ? record.BalanceDue : record.GrandTotal)]);
  const totals = body.appendTable(totalRows);
  totals.setBorderWidth(0);
  for (let row = 0; row < totals.getNumRows(); row++) {
    totals.getCell(row, 0).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    totals.getCell(row, 1).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  }
  const lastRow = totals.getRow(totals.getNumRows() - 1);
  lastRow.setBackgroundColor("#dcefe4");
  lastRow.getCell(0).editAsText().setBold(true).setForegroundColor("#145c3b");
  lastRow.getCell(1).editAsText().setBold(true).setForegroundColor("#145c3b");
  if (record.Notes) {
    body.appendParagraph("PROJECT NOTES").setBold(true).setForegroundColor("#145c3b");
    body.appendParagraph(String(record.Notes));
  }
  if (record.Type === "INVOICE" && settings.PaymentInstructions) {
    body.appendParagraph("PAYMENT INSTRUCTIONS").setBold(true).setForegroundColor("#145c3b");
    body.appendParagraph(String(settings.PaymentInstructions));
  }
  body.appendParagraph("");
  body.appendHorizontalRule();
  body.appendParagraph([settings.BusinessName, settings.BusinessEmail, settings.BusinessPhone, settings.BusinessAddress].filter(Boolean).join(" • ")).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setForegroundColor("#65786e").setFontSize(8);
  doc.saveAndClose();

  const folders = ensureDocumentFolders_();
  const destination = record.Type === "QUOTE" ? folders.Quotes : folders.Invoices;
  const pdfBlob = DriveApp.getFileById(doc.getId()).getAs(MimeType.PDF).setName(documentId + ".pdf");
  if (record.PdfFileID) {
    try { DriveApp.getFileById(record.PdfFileID).setTrashed(true); } catch (ignored) {}
  }
  const pdfFile = destination.createFile(pdfBlob);
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  record.PdfFileID = pdfFile.getId();
  record.PdfUrl = pdfFile.getUrl();
  record.PdfGeneratedDate = isoNow_();
  record.UpdatedDate = isoNow_();
  upsert_("Documents", "DocumentID", record);
  return { ok: true, id: documentId, url: pdfFile.getUrl(), fileId: pdfFile.getId() };
}

function insertLogo_(cell, settings) {
  if (!settings.LogoFileID) return;
  try {
    const image = cell.appendImage(DriveApp.getFileById(settings.LogoFileID).getBlob());
    const width = image.getWidth(), height = image.getHeight(), maxWidth = 120;
    if (width > maxWidth) image.setWidth(maxWidth).setHeight(Math.round(height * maxWidth / width));
  } catch (ignored) {}
}

function styleHeaderRow_(table, background, foreground) {
  const row = table.getRow(0);
  row.setBackgroundColor(background);
  for (let column = 0; column < row.getNumCells(); column++) {
    row.getCell(column).editAsText().setBold(true);
    if (foreground) row.getCell(column).editAsText().setForegroundColor(foreground);
  }
}

function ensureDocumentFolders_() {
  const parent = DriveApp.getFolderById(JJP_CONFIG.DOCUMENT_FOLDER_ID);
  return {
    Quotes: childFolder_(parent, "Quotes"),
    Invoices: childFolder_(parent, "Invoices"),
    ProjectFiles: childFolder_(parent, "Project Files"),
    ArchivedDocuments: childFolder_(parent, "Archived Documents")
  };
}

function childFolder_(parent, name) {
  const matches = parent.getFoldersByName(name);
  return matches.hasNext() ? matches.next() : parent.createFolder(name);
}

function validateRecord_(entity, record) {
  if (entity === "client" && !String(record.Name || record.Company || "").trim()) throw new Error("Client name is required.");
  if (entity === "project" && (!record.ClientID || !String(record.ProjectName || "").trim())) throw new Error("Client and project name are required.");
  if (entity === "filament" && (!String(record.Name || "").trim() || number_(record.SpoolWeightG) <= 0)) throw new Error("Filament name and a positive spool weight are required.");
  if (entity === "cost" && !String(record.Name || "").trim()) throw new Error("Cost name is required.");
}

function seedSettings_() {
  const existing = settingsObject_();
  Object.keys(JJP_DEFAULT_SETTINGS).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(existing, key)) return;
    appendObject_("Settings", { Key: key, Value: JJP_DEFAULT_SETTINGS[key][0], Description: JJP_DEFAULT_SETTINGS[key][1], UpdatedDate: isoNow_() });
  });
}

function seedCounters_() {
  const existing = {};
  rows_("Counters").forEach(row => existing[row.Key] = true);
  ["CLI","PRJ","FIL","CST","JJP-Q","JJP-INV"].forEach(key => {
    if (!existing[key]) appendObject_("Counters", { Key: key, NextNumber: 1001, UpdatedDate: isoNow_() });
  });
}

function seedLibrary_() {
  if (!rows_("Filaments").length) {
    [
      { Name: "PLA Baseline", MaterialType: "PLA", Color: "Natural", SpoolWeightG: 1000, SpoolCost: 25, Supplier: "" },
      { Name: "PETG Baseline", MaterialType: "PETG", Color: "Natural", SpoolWeightG: 1000, SpoolCost: 30, Supplier: "" }
    ].forEach(record => {
      const now = isoNow_();
      appendObject_("Filaments", Object.assign({}, record, { FilamentID: nextId_("FIL"), CostPerGram: round_(record.SpoolCost / record.SpoolWeightG, 6), Active: true, CreatedDate: now, UpdatedDate: now }));
    });
  }
  if (!rows_("AdditionalCosts").length) {
    [
      { Name: "Magnets", Category: "Magnets", UnitType: "each", DefaultUnitCost: 0.50, Description: "Embedded or attached magnets" },
      { Name: "Threaded Inserts", Category: "Hardware", UnitType: "each", DefaultUnitCost: 0.35, Description: "Heat-set threaded inserts" },
      { Name: "Packaging", Category: "Packaging", UnitType: "package", DefaultUnitCost: 3.00, Description: "Protective customer packaging" }
    ].forEach(record => {
      const now = isoNow_();
      appendObject_("AdditionalCosts", Object.assign({}, record, { CostID: nextId_("CST"), Active: true, CreatedDate: now, UpdatedDate: now }));
    });
  }
}

function nextId_(key) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = sheet_("Counters"), data = sheet.getDataRange().getValues(), headers = data[0];
    const keyColumn = headers.indexOf("Key"), numberColumn = headers.indexOf("NextNumber"), updatedColumn = headers.indexOf("UpdatedDate");
    for (let row = 1; row < data.length; row++) {
      if (String(data[row][keyColumn]) !== key) continue;
      const number = Number(data[row][numberColumn]) || 1001;
      sheet.getRange(row + 1, numberColumn + 1).setValue(number + 1);
      sheet.getRange(row + 1, updatedColumn + 1).setValue(isoNow_());
      return key + "-" + number;
    }
    appendObject_("Counters", { Key: key, NextNumber: 1002, UpdatedDate: isoNow_() });
    return key + "-1001";
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(name, headers) {
  const spreadsheet = spreadsheet_();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const width = Math.max(sheet.getLastColumn(), 1);
  const existing = sheet.getLastRow() ? sheet.getRange(1, 1, 1, width).getValues()[0].filter(String) : [];
  const merged = existing.slice();
  headers.forEach(header => { if (merged.indexOf(header) === -1) merged.push(header); });
  if (!merged.length) return sheet;
  sheet.getRange(1, 1, 1, merged.length).setValues([merged]).setFontWeight("bold").setBackground("#dcefe4");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, merged.length);
  return sheet;
}

function spreadsheet_() { return SpreadsheetApp.openById(JJP_CONFIG.SPREADSHEET_ID); }
function sheet_(name) { return spreadsheet_().getSheetByName(name) || ensureSheet_(name, JJP_SHEETS[name]); }
function rows_(name) {
  const sheet = sheet_(name), data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(String);
  return data.slice(1).filter(row => row.some(value => value !== "")).map(row => {
    const object = {};
    headers.forEach((header, index) => object[header] = normalizeCell_(row[index]));
    return object;
  });
}
function rowById_(sheetName, idField, id) { return rows_(sheetName).find(row => String(row[idField]) === String(id)); }
function appendObject_(sheetName, object) {
  const sheet = sheet_(sheetName), headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(header => object[header] == null ? "" : object[header]));
}
function upsert_(sheetName, idField, object) {
  const sheet = sheet_(sheetName), data = sheet.getDataRange().getValues(), headers = data[0], idColumn = headers.indexOf(idField);
  if (idColumn < 0) throw new Error("Missing key column " + idField + " in " + sheetName + ".");
  let rowNumber = 0;
  for (let row = 1; row < data.length; row++) {
    if (String(data[row][idColumn]) === String(object[idField])) { rowNumber = row + 1; break; }
  }
  const current = rowNumber ? data[rowNumber - 1] : headers.map(() => "");
  const values = headers.map((header, index) => Object.prototype.hasOwnProperty.call(object, header) ? object[header] : current[index]);
  if (rowNumber) sheet.getRange(rowNumber, 1, 1, headers.length).setValues([values]);
  else sheet.appendRow(values);
}
function deleteWhere_(sheetName, field, value) {
  const sheet = sheet_(sheetName), data = sheet.getDataRange().getValues(), column = data[0].indexOf(field);
  for (let row = data.length - 1; row >= 1; row--) if (String(data[row][column]) === String(value)) sheet.deleteRow(row + 1);
}
function settingsObject_() {
  const object = {};
  const existing = spreadsheet_().getSheetByName("Settings");
  if (!existing) return object;
  rows_("Settings").forEach(row => object[row.Key] = row.Value);
  return object;
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function isoNow_() { return Utilities.formatDate(new Date(), JJP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function today_() { return Utilities.formatDate(new Date(), JJP_CONFIG.TIMEZONE, "yyyy-MM-dd"); }
function addDays_(date, days) { const value = new Date(String(date) + "T12:00:00"); value.setDate(value.getDate() + Number(days || 0)); return Utilities.formatDate(value, JJP_CONFIG.TIMEZONE, "yyyy-MM-dd"); }
function number_(value) { const number = Number(value); return isFinite(number) ? number : 0; }
function round_(value, places) { const factor = Math.pow(10, places || 2); return Math.round((number_(value) + Number.EPSILON) * factor) / factor; }
function currency_(value) { return "$" + number_(value).toFixed(2); }
function formatNumber_(value) { return number_(value).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
function formatDate_(value) { if (!value) return ""; const date = new Date(String(value).slice(0, 10) + "T12:00:00"); return Utilities.formatDate(date, JJP_CONFIG.TIMEZONE, "MMM d, yyyy"); }
function normalizeCell_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") return Utilities.formatDate(value, JJP_CONFIG.TIMEZONE, "yyyy-MM-dd");
  return value;
}

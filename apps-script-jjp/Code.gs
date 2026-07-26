const JJP_CONFIG = Object.freeze({
  SPREADSHEET_ID: "1awuRVwSa7hy4rAoC21fKvB1ctMNmZi82dwDhe6WTxYw",
  DOCUMENT_FOLDER_ID: "1Q2B7z4q-HZdVX-wEP9L5XchEUacurgxZ",
  TIMEZONE: "America/Los_Angeles"
});

const JJP_SHEETS = Object.freeze({
  Clients: ["ClientID","Name","Company","Email","Phone","ShippingAddress","Notes","Active","CreatedDate","UpdatedDate"],
  Projects: ["ProjectID","ClientID","ProjectName","Description","Status","DueDate","ModelLinks","FileReferences","Notes","Active","CreatedDate","UpdatedDate"],
  ProjectFiles: ["ProjectFileID","ProjectID","Name","MimeType","DriveFileID","Url","CreatedDate"],
  Filaments: ["FilamentID","Name","Brand","ProductLine","MaterialType","Color","ColorsJson","ProductUrl","SpoolWeightG","SpoolCost","CostPerGram","Supplier","Active","CreatedDate","UpdatedDate"],
  AdditionalCosts: ["CostID","Name","Category","UnitType","DefaultUnitCost","Description","Active","CreatedDate","UpdatedDate"],
  Documents: ["DocumentID","Type","Status","ClientID","ProjectID","IssueDate","DueDate","ValidUntil","ProductionQuantity","PublicDescription","PricingMarkupPercent","RecommendedSubtotal","TargetSubtotal","PricingAdjustment","Notes","Subtotal","FailureBufferPercent","FailureBufferAmount","Discount","TaxPercent","TaxAmount","Shipping","GrandTotal","AmountPaid","BalanceDue","SourceQuoteID","PdfFileID","PdfUrl","PdfGeneratedDate","Active","CreatedDate","UpdatedDate"],
  DocumentItems: ["ItemID","DocumentID","ItemType","ReferenceID","Description","Quantity","Unit","UnitCost","PerUnit","DetailsJson","Amount","SortOrder","CreatedDate","UpdatedDate"],
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
  DefaultMachineRate: ["2.00", "Default machine wear and electricity rate per hour"],
  DefaultFailureBufferPercent: ["10", "Default print failure and waste allowance"],
  DefaultMarkupPercent: ["60", "Default markup applied to production cost when suggesting a selling price"],
  DefaultTaxPercent: ["0", "Default sales tax percentage"],
  QuoteValidityDays: ["30", "Default quote validity period"],
  LogoFileID: ["", "Optional Google Drive PNG file ID for PDF branding"],
  LogoUrl: ["https://jeffjonesconsulting.com/assets/images/JJP_Logo.png", "Automatic fallback logo URL for generated PDFs"]
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
  ensureLogoFile_();
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
    else if (action === "uploadProjectFile") uploadProjectFile_(payload.data || {});
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
    projectFiles: rows_("ProjectFiles"),
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
    const duplicate = rows_("Filaments").find(existing =>
      String(existing.Active).toLowerCase() !== "false" &&
      String(existing.FilamentID) !== String(record.FilamentID || "") &&
      normalizeKey_(existing.Brand) === normalizeKey_(record.Brand) &&
      normalizeKey_(existing.ProductLine) === normalizeKey_(record.ProductLine) &&
      normalizeKey_(existing.MaterialType) === normalizeKey_(record.MaterialType)
    );
    if (duplicate) throw new Error("That brand, product line, and material combination already exists.");
    record.CostPerGram = weight > 0 ? round_(number_(record.SpoolCost) / weight, 6) : 0;
    record.Name = [record.Brand, record.ProductLine].filter(String).join(" ") || record.Name;
    if (!record.ColorsJson && record.Color) record.ColorsJson = JSON.stringify(String(record.Color).split(",").map(value => value.trim()).filter(Boolean));
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
  record.ProductionQuantity = Math.max(1, Math.round(number_(record.ProductionQuantity) || 1));
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
      PerUnit: String(item.PerUnit == null ? true : item.PerUnit).toLowerCase() !== "false",
      DetailsJson: item.DetailsJson || "{}",
      Amount: round_(number_(item.Quantity) * number_(item.UnitCost) * (String(item.PerUnit == null ? true : item.PerUnit).toLowerCase() !== "false" ? record.ProductionQuantity : 1), 2),
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

function uploadProjectFile_(input) {
  initializeJjpDatabase();
  const projectId = String(input.ProjectID || "");
  const project = rowById_("Projects", "ProjectID", projectId);
  if (!project) throw new Error("Save the project before uploading images.");
  const mimeType = String(input.MimeType || "");
  if (mimeType.indexOf("image/") !== 0) throw new Error("Only image uploads are supported.");
  const bytes = Utilities.base64Decode(String(input.Base64 || ""));
  if (!bytes.length) throw new Error("The uploaded image was empty.");
  if (bytes.length > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
  const folders = ensureDocumentFolders_();
  const folderName = projectId + " - " + String(project.ProjectName || "Project").replace(/[\\/:*?\"<>|]/g, "-").slice(0, 70);
  const projectFolder = childFolder_(folders.ProjectFiles, folderName);
  const name = String(input.Name || "Client reference image").replace(/[\\/:*?\"<>|]/g, "-");
  const file = projectFolder.createFile(Utilities.newBlob(bytes, mimeType, name));
  const record = {
    ProjectFileID: "PFL-" + Utilities.getUuid(),
    ProjectID: projectId,
    Name: name,
    MimeType: mimeType,
    DriveFileID: file.getId(),
    Url: file.getUrl(),
    CreatedDate: isoNow_()
  };
  appendObject_("ProjectFiles", record);
  return record;
}

function calculateDocumentTotals_(record, items) {
  const productionQuantity = Math.max(1, Math.round(number_(record.ProductionQuantity) || 1));
  const subtotal = round_(items.reduce((sum, item) => {
    const perUnit = String(item.PerUnit == null ? true : item.PerUnit).toLowerCase() !== "false";
    return sum + number_(item.Quantity) * number_(item.UnitCost) * (perUnit ? productionQuantity : 1);
  }, 0), 2);
  const failureBufferPercent = number_(record.FailureBufferPercent);
  const failureBufferAmount = round_(subtotal * failureBufferPercent / 100, 2);
  const costBasis = subtotal + failureBufferAmount;
  const markupPercent = Math.max(0, number_(record.PricingMarkupPercent));
  const recommendedSubtotal = round_(costBasis * (1 + markupPercent / 100), 2);
  const requestedTarget = number_(record.TargetSubtotal);
  const targetSubtotal = round_(requestedTarget > 0 ? requestedTarget : recommendedSubtotal, 2);
  const pricingAdjustment = round_(targetSubtotal - recommendedSubtotal, 2);
  const discount = Math.max(0, -pricingAdjustment);
  const taxable = Math.max(0, targetSubtotal);
  const taxPercent = number_(record.TaxPercent);
  const taxAmount = round_(taxable * taxPercent / 100, 2);
  const shipping = Math.max(0, number_(record.Shipping));
  return {
    Subtotal: subtotal,
    FailureBufferPercent: failureBufferPercent,
    FailureBufferAmount: failureBufferAmount,
    PricingMarkupPercent: markupPercent,
    RecommendedSubtotal: recommendedSubtotal,
    TargetSubtotal: targetSubtotal,
    PricingAdjustment: pricingAdjustment,
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
    [client.Company || client.Name || "", client.Company && client.Name && client.Name !== client.Company ? client.Name : "", client.ShippingAddress || "", client.Phone || "", client.Email || ""].filter(Boolean).join("\n"),
    project.ProjectName || "General 3D Printing"
  ]]);
  styleHeaderRow_(parties, "#dcefe4");
  const productionQuantity = Math.max(1, number_(record.ProductionQuantity) || 1);
  const quoteSubtotal = number_(record.TargetSubtotal) || number_(record.RecommendedSubtotal) || number_(record.GrandTotal);
  body.appendParagraph("ORDER QUANTITY").setAlignment(DocumentApp.HorizontalAlignment.CENTER).setBold(true).setForegroundColor("#4b6357").setSpacingBefore(12);
  body.appendParagraph(formatNumber_(productionQuantity)).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setBold(true).setFontSize(24).setForegroundColor("#145c3b").setSpacingAfter(12);
  const description = record.PublicDescription || project.ProjectName || "Custom 3D printing";
  const unitPrice = productionQuantity ? quoteSubtotal / productionQuantity : quoteSubtotal;
  const rows = [
    ["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"],
    [description, formatNumber_(productionQuantity), currency_(unitPrice), currency_(quoteSubtotal)]
  ];
  const itemTable = body.appendTable(rows);
  styleHeaderRow_(itemTable, "#145c3b", "#ffffff");
  styleCustomerItemTable_(itemTable);
  [1,2,3].forEach(column => {
    for (let row = 1; row < itemTable.getNumRows(); row++) itemTable.getCell(row, column).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  });
  const totalRows = [["Subtotal", currency_(quoteSubtotal)]];
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
  const sources = [];
  if (settings.LogoFileID) sources.push(() => DriveApp.getFileById(settings.LogoFileID).getBlob());
  sources.push(() => UrlFetchApp.fetch("https://raw.githubusercontent.com/jonesyman/jjc-website/main/assets/images/JJP_Logo.png", { muteHttpExceptions: false }).getBlob());
  if (settings.LogoUrl) sources.push(() => UrlFetchApp.fetch(settings.LogoUrl, { muteHttpExceptions: false }).getBlob());
  for (let index = 0; index < sources.length; index++) {
    try {
      const image = cell.appendImage(sources[index]());
      const width = image.getWidth(), height = image.getHeight(), maxWidth = 120;
      if (width > maxWidth) image.setWidth(maxWidth).setHeight(Math.round(height * maxWidth / width));
      return;
    } catch (ignored) {}
  }
}

function styleHeaderRow_(table, background, foreground) {
  const row = table.getRow(0);
  row.setBackgroundColor(background);
  for (let column = 0; column < row.getNumCells(); column++) {
    row.getCell(column).editAsText().setBold(true);
    if (foreground) row.getCell(column).editAsText().setForegroundColor(foreground);
  }
}

function styleCustomerItemTable_(table) {
  table.setBorderColor("#a9cbb7").setBorderWidth(1);
  [270, 55, 85, 90].forEach((width, column) => {
    table.getCell(0, column).setWidth(width);
    table.getCell(1, column).setWidth(width);
  });
  for (let row = 0; row < table.getNumRows(); row++) {
    for (let column = 0; column < table.getRow(row).getNumCells(); column++) {
      const cell = table.getCell(row, column);
      cell.setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(9).setPaddingRight(9);
      if (row > 0) cell.setBackgroundColor("#f3f8f5");
      cell.editAsText().setFontSize(row === 0 ? 9 : 10);
    }
  }
  table.getCell(1, 0).editAsText().setBold(true).setForegroundColor("#213b2e");
  table.getCell(1, 3).editAsText().setBold(true).setForegroundColor("#145c3b");
}

function ensureLogoFile_() {
  const settings = settingsObject_();
  if (settings.LogoFileID) {
    try { DriveApp.getFileById(settings.LogoFileID).getBlob(); return settings.LogoFileID; } catch (ignored) {}
  }
  const parent = DriveApp.getFolderById(JJP_CONFIG.DOCUMENT_FOLDER_ID);
  const existing = parent.getFilesByName("JJP_Logo.png");
  let file;
  if (existing.hasNext()) {
    file = existing.next();
  } else {
    const blob = UrlFetchApp.fetch("https://raw.githubusercontent.com/jonesyman/jjc-website/main/assets/images/JJP_Logo.png", { muteHttpExceptions: false }).getBlob().setName("JJP_Logo.png");
    file = parent.createFile(blob);
  }
  upsert_("Settings", "Key", {
    Key: "LogoFileID",
    Value: file.getId(),
    Description: JJP_DEFAULT_SETTINGS.LogoFileID[1],
    UpdatedDate: isoNow_()
  });
  return file.getId();
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
  if (String(existing.DefaultMachineRate || "") === "1" || String(existing.DefaultMachineRate || "") === "1.00") {
    upsert_("Settings", "Key", { Key: "DefaultMachineRate", Value: "2.00", Description: JJP_DEFAULT_SETTINGS.DefaultMachineRate[1], UpdatedDate: isoNow_() });
  }
}

function seedCounters_() {
  const existing = {};
  rows_("Counters").forEach(row => existing[row.Key] = true);
  ["CLI","PRJ","FIL","CST","JJP-Q","JJP-INV"].forEach(key => {
    if (!existing[key]) appendObject_("Counters", { Key: key, NextNumber: 1001, UpdatedDate: isoNow_() });
  });
}

function seedLibrary_() {
  const existingFilaments = rows_("Filaments");
  if (!existingFilaments.length) {
    [
      { Name: "PLA Baseline", MaterialType: "PLA", Color: "Natural", SpoolWeightG: 1000, SpoolCost: 25, Supplier: "" },
      { Name: "PETG Baseline", MaterialType: "PETG", Color: "Natural", SpoolWeightG: 1000, SpoolCost: 30, Supplier: "" }
    ].forEach(record => {
      const now = isoNow_();
      appendObject_("Filaments", Object.assign({}, record, { FilamentID: nextId_("FIL"), CostPerGram: round_(record.SpoolCost / record.SpoolWeightG, 6), Active: true, CreatedDate: now, UpdatedDate: now }));
    });
  }
  consolidateBambuPlaBasic_(existingFilaments);
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

function consolidateBambuPlaBasic_(filaments) {
  const officialColors = [
    "Jade White (10100)","Beige (10201)","Light Gray (10104)","Yellow (10400)","Sunflower Yellow (10402)",
    "Pumpkin Orange (10301)","Orange (10300)","Gold (10401)","Bright Green (10503)","Bambu Green (10501)",
    "Mistletoe Green (10502)","Pink (10203)","Hot Pink (10204)","Magenta (10202)","Red (10200)",
    "Maroon Red (10205)","Purple (10700)","Indigo Purple (10701)","Turquoise (10605)","Cyan (10603)",
    "Cobalt Blue (10604)","Blue (10601)","Brown (10800)","Cocoa Brown (10802)","Bronze (10801)",
    "Gray (10103)","Silver (10102)","Blue Grey (10602)","Dark Gray (10105)","Black (10101)"
  ];
  const matches = filaments.filter(record => {
    if (String(record.Active).toLowerCase() === "false") return false;
    const namedMatch = normalizeKey_(record.Name) === "bambu lab pla basic";
    const fieldsMatch = normalizeKey_(record.Brand) === "bambu lab" && normalizeKey_(record.ProductLine) === "pla basic";
    return namedMatch || fieldsMatch;
  });
  const now = isoNow_();
  const primary = matches[0] || {
    FilamentID: nextId_("FIL"),
    CreatedDate: now
  };
  const mergedColors = officialColors.slice();
  matches.forEach(record => {
    parseJsonArray_(record.ColorsJson).forEach(color => {
      if (!mergedColors.some(existing => normalizeKey_(existing) === normalizeKey_(color))) mergedColors.push(color);
    });
  });
  const primaryColors = parseJsonArray_(primary.ColorsJson);
  const isCurrent = matches.length === 1 &&
    normalizeKey_(primary.Brand) === "bambu lab" &&
    normalizeKey_(primary.ProductLine) === "pla basic" &&
    normalizeKey_(primary.MaterialType) === "pla" &&
    officialColors.every(color => primaryColors.some(existing => normalizeKey_(existing) === normalizeKey_(color)));
  if (isCurrent) return;
  upsert_("Filaments", "FilamentID", Object.assign({}, primary, {
    Name: "Bambu Lab PLA Basic", Brand: "Bambu Lab", ProductLine: "PLA Basic", MaterialType: "PLA",
    ColorsJson: JSON.stringify(mergedColors),
    ProductUrl: primary.ProductUrl || "https://us.store.bambulab.com/products/pla-basic-filament",
    SpoolWeightG: number_(primary.SpoolWeightG) || 1000,
    SpoolCost: number_(primary.SpoolCost) || 19.99,
    CostPerGram: round_((number_(primary.SpoolCost) || 19.99) / (number_(primary.SpoolWeightG) || 1000), 6),
    Supplier: primary.Supplier || "Bambu Lab", Active: true, UpdatedDate: now
  }));
  matches.slice(1).forEach(record => {
    upsert_("Filaments", "FilamentID", Object.assign({}, record, { Active: false, UpdatedDate: now }));
  });
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
function normalizeKey_(value) { return String(value || "").trim().toLowerCase().replace(/\s+/g, " "); }
function parseJsonArray_(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch (error) {
    return String(value || "").split(",").map(item => item.trim()).filter(Boolean);
  }
}
function currency_(value) { return "$" + number_(value).toFixed(2); }
function formatNumber_(value) { return number_(value).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
function formatDate_(value) { if (!value) return ""; const date = new Date(String(value).slice(0, 10) + "T12:00:00"); return Utilities.formatDate(date, JJP_CONFIG.TIMEZONE, "MMM d, yyyy"); }
function normalizeCell_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") return Utilities.formatDate(value, JJP_CONFIG.TIMEZONE, "yyyy-MM-dd");
  return value;
}

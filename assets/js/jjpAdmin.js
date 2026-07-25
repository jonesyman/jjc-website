(() => {
  "use strict";

  const state = {
    clients: [], projects: [], documents: [], filaments: [], additionalCosts: [],
    settings: {}, lines: [], editingEntity: "", editingId: ""
  };
  const entityConfig = {
    client: {
      collection: "clients", id: "ClientID", title: "Client",
      fields: [
        ["Name", "Client name", "text", true], ["Company", "Company", "text"],
        ["Email", "Email", "email"], ["Phone", "Phone", "tel"],
        ["ShippingAddress", "Shipping address", "textarea"], ["Notes", "Notes", "textarea"]
      ]
    },
    project: {
      collection: "projects", id: "ProjectID", title: "Project",
      fields: [
        ["ClientID", "Client", "client", true], ["ProjectName", "Project name", "text", true],
        ["Status", "Status", "select:Inquiry|Quoting|Approved|Printing|Finishing|Ready|Delivered|Canceled"],
        ["DueDate", "Target date", "date"], ["Description", "Description", "textarea"],
        ["Notes", "Production notes", "textarea"]
      ]
    },
    filament: {
      collection: "filaments", id: "FilamentID", title: "Filament",
      fields: [
        ["Name", "Filament name", "text", true], ["MaterialType", "Material", "select:PLA|PETG|ASA|ABS|TPU|Nylon|Resin|Other"],
        ["Color", "Color", "text"], ["SpoolWeightG", "Spool weight (g)", "number", true],
        ["SpoolCost", "Spool cost", "money", true], ["Supplier", "Supplier", "text"]
      ]
    },
    cost: {
      collection: "additionalCosts", id: "CostID", title: "Additional Cost",
      fields: [
        ["Name", "Cost name", "text", true], ["Category", "Category", "select:Hardware|Magnets|Finishing|Packaging|Design|Delivery|Rush|Other"],
        ["UnitType", "Unit", "select:each|set|hour|job|package|mile"], ["DefaultUnitCost", "Default unit cost", "money", true],
        ["Description", "Description", "textarea"]
      ]
    }
  };
  const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value) || 0);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (date, days) => {
    const value = new Date(`${date || today()}T12:00:00`);
    value.setDate(value.getDate() + Number(days || 0));
    return value.toISOString().slice(0, 10);
  };
  const byId = id => document.getElementById(id);
  const active = collection => state[collection].filter(record => String(record.Active ?? "true").toLowerCase() !== "false");
  const findClient = id => state.clients.find(record => record.ClientID === id);
  const findProject = id => state.projects.find(record => record.ProjectID === id);
  const findDocument = id => state.documents.find(record => record.DocumentID === id);

  function toast(message) {
    const element = byId("toast");
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
  }

  function loading(label, detail = "", percent = "") {
    byId("loadingStatus").classList.remove("hidden");
    byId("loadingLabel").textContent = label;
    byId("loadingDetail").textContent = detail;
    byId("loadingPercent").textContent = percent === "" ? "" : `${percent}%`;
    byId("loadingBar").style.width = `${percent || 35}%`;
  }
  function loadingDone() { byId("loadingStatus").classList.add("hidden"); }

  function showView(name) {
    document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
    document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === name));
    const labels = {
      dashboard: ["Dashboard", "3D printing operations at a glance"],
      clients: ["Clients", "Customer contact and delivery information"],
      projects: ["Projects", "Track jobs from request through delivery"],
      quotes: ["Quotes", "Build transparent, itemized printing estimates"],
      invoices: ["Invoices", "Track billing and payment status"],
      filaments: ["Filament Library", "Material pricing and cost per gram"],
      costs: ["Additional Costs", "Reusable hardware, finishing, and service charges"],
      settings: ["Settings", "JJP business identity and pricing defaults"]
    };
    const [title, subtitle] = labels[name] || labels.dashboard;
    byId("pageTitle").textContent = title;
    byId("pageSubtitle").textContent = subtitle;
    location.hash = name;
    closeSidebar();
  }

  function openSidebar() { byId("sidebar").classList.add("open"); byId("sidebarBackdrop").classList.add("open"); }
  function closeSidebar() { byId("sidebar").classList.remove("open"); byId("sidebarBackdrop").classList.remove("open"); }

  async function loadWorkspace({ quiet = false } = {}) {
    if (!JJP_API.configured) {
      byId("connectionNotice").classList.remove("hidden");
      byId("connectionNotice").innerHTML = "<strong>Setup preview:</strong> Deploy the JJP Apps Script, then paste its web-app URL into <code>assets/js/jjpApi.js</code>. The page is ready for live data.";
      renderAll();
      return;
    }
    if (!quiet) loading("Loading JJP Admin", "Reading clients, projects, pricing, and documents…", 25);
    try {
      const payload = await JJP_API.get("getWorkspace");
      Object.assign(state, payload.data || payload);
      state.clients ||= []; state.projects ||= []; state.documents ||= [];
      state.filaments ||= []; state.additionalCosts ||= []; state.settings ||= {};
      byId("connectionNotice").classList.add("hidden");
      if (!quiet) loading("Loading JJP Admin", "Rendering your printing workspace…", 85);
      renderAll();
    } catch (error) {
      byId("connectionNotice").classList.remove("hidden");
      byId("connectionNotice").textContent = error.message;
      renderAll();
    } finally { loadingDone(); }
  }

  function renderAll() {
    renderDashboard();
    renderClients();
    renderProjects();
    renderDocuments("QUOTE");
    renderDocuments("INVOICE");
    renderFilaments();
    renderCosts();
    renderSettings();
  }

  function renderDashboard() {
    const quotes = state.documents.filter(record => record.Type === "QUOTE");
    const invoices = state.documents.filter(record => record.Type === "INVOICE");
    const outstanding = invoices.reduce((total, record) => total + Number(record.BalanceDue || record.GrandTotal || 0), 0);
    byId("metrics").innerHTML = [
      ["Active Clients", active("clients").length],
      ["Open Projects", state.projects.filter(record => !["Delivered", "Canceled"].includes(record.Status)).length],
      ["Open Quotes", quotes.filter(record => !["Accepted", "Declined", "Void"].includes(record.Status)).length],
      ["Outstanding", money(outstanding)]
    ].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${esc(value)}</strong></div>`).join("");
    byId("recentQuotes").innerHTML = quotes.slice(0, 5).map(record => {
      const client = findClient(record.ClientID);
      return `<div class="row"><span><strong>${esc(record.DocumentID)}</strong><br><small>${esc(client?.Name || client?.Company || "Unassigned")}</small></span><strong>${money(record.GrandTotal)}</strong></div>`;
    }).join("") || empty("No quotes yet");
    byId("activeProjects").innerHTML = state.projects.filter(record => !["Delivered", "Canceled"].includes(record.Status)).slice(0, 5).map(record =>
      `<div class="row"><span><strong>${esc(record.ProjectName)}</strong><br><small>${esc(findClient(record.ClientID)?.Name || "Unassigned")}</small></span><span class="pill">${esc(record.Status || "Inquiry")}</span></div>`
    ).join("") || empty("No active projects");
  }

  function empty(message) { return `<div class="empty">${esc(message)}</div>`; }
  function cardActions(entity, id, extra = "") {
    return `<div class="record-actions"><button class="button secondary" data-edit="${entity}" data-id="${esc(id)}">Edit</button>${extra}</div>`;
  }
  function renderClients() {
    byId("clientsList").innerHTML = active("clients").map(record =>
      `<article class="record-card"><div><h3>${esc(record.Name || record.Company)}</h3><p>${esc(record.Company && record.Company !== record.Name ? record.Company : "")}</p></div><div class="record-meta">${record.Email ? `<span class="pill">${esc(record.Email)}</span>` : ""}${record.Phone ? `<span class="pill">${esc(record.Phone)}</span>` : ""}</div>${cardActions("client", record.ClientID)}</article>`
    ).join("") || empty("Create your first JJP client.");
  }
  function renderProjects() {
    byId("projectsList").innerHTML = state.projects.map(record =>
      `<article class="record-card"><div><h3>${esc(record.ProjectName)}</h3><p>${esc(findClient(record.ClientID)?.Name || "No client selected")}</p></div><div class="record-meta"><span class="pill">${esc(record.Status || "Inquiry")}</span>${record.DueDate ? `<span class="pill">Due ${esc(record.DueDate)}</span>` : ""}</div>${cardActions("project", record.ProjectID, `<button class="button" data-project-quote="${esc(record.ProjectID)}">Create Quote</button>`)}</article>`
    ).join("") || empty("Create a project to organize a print request.");
  }
  function renderDocuments(type) {
    const target = type === "QUOTE" ? byId("quotesList") : byId("invoicesList");
    const records = state.documents.filter(record => record.Type === type);
    target.innerHTML = records.map(record => {
      const client = findClient(record.ClientID), project = findProject(record.ProjectID);
      const conversion = type === "QUOTE" && record.Status !== "Void" ? `<button class="button" data-convert="${esc(record.DocumentID)}">Convert to Invoice</button>` : "";
      const pdf = `<button class="button secondary" data-pdf="${esc(record.DocumentID)}">Generate PDF</button>`;
      return `<article class="record-card"><div class="section-head"><div><h3>${esc(record.DocumentID)}</h3><p>${esc(project?.ProjectName || client?.Name || "Unassigned")}</p></div><strong>${money(record.GrandTotal)}</strong></div><div class="record-meta"><span class="pill">${esc(record.Status || "Draft")}</span><span class="pill">${esc(record.IssueDate || "")}</span>${record.PdfUrl ? `<a class="pill" href="${esc(record.PdfUrl)}" target="_blank" rel="noopener">Open PDF</a>` : ""}</div>${cardActions("document", record.DocumentID, `${conversion}${pdf}`)}</article>`;
    }).join("") || empty(`No ${type === "QUOTE" ? "quotes" : "invoices"} yet.`);
  }
  function renderFilaments() {
    byId("filamentsList").innerHTML = active("filaments").map(record => {
      const perGram = Number(record.CostPerGram || (Number(record.SpoolCost) / Number(record.SpoolWeightG)));
      return `<article class="record-card"><div><h3>${esc(record.Name)}</h3><p>${esc(record.MaterialType || "")} · ${esc(record.Color || "Unspecified color")}</p></div><div class="record-meta"><span class="pill">${money(record.SpoolCost)} / ${esc(record.SpoolWeightG)}g</span><span class="pill">${money(perGram)}/g</span></div>${cardActions("filament", record.FilamentID)}</article>`;
    }).join("") || empty("Add filament spools to calculate material costs.");
  }
  function renderCosts() {
    byId("costsList").innerHTML = active("additionalCosts").map(record =>
      `<article class="record-card"><div><h3>${esc(record.Name)}</h3><p>${esc(record.Description || record.Category || "")}</p></div><div class="record-meta"><span class="pill">${money(record.DefaultUnitCost)} / ${esc(record.UnitType || "each")}</span><span class="pill">${esc(record.Category || "Other")}</span></div>${cardActions("cost", record.CostID)}</article>`
    ).join("") || empty("Add magnets, hardware, finishing, packaging, and other reusable costs.");
  }
  function renderSettings() {
    const form = byId("settingsForm");
    Array.from(form.elements).forEach(element => { if (element.name) element.value = state.settings[element.name] ?? ""; });
  }

  function fieldMarkup(field, value = "") {
    const [name, label, type, required] = field;
    if (type === "textarea") return `<label class="wide">${label}<textarea name="${name}" ${required ? "required" : ""}>${esc(value)}</textarea></label>`;
    if (type === "client") return `<label>${label}<select name="${name}" ${required ? "required" : ""}><option value="">Select client</option>${active("clients").map(record => `<option value="${esc(record.ClientID)}" ${record.ClientID === value ? "selected" : ""}>${esc(record.Name || record.Company)}</option>`).join("")}</select></label>`;
    if (type.startsWith("select:")) {
      const options = type.slice(7).split("|");
      return `<label>${label}<select name="${name}">${options.map(option => `<option ${option === value ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></label>`;
    }
    const inputType = type === "money" ? "number" : type;
    const step = ["money", "number"].includes(type) ? 'step=".01" min="0"' : "";
    return `<label>${label}<input name="${name}" type="${inputType}" value="${esc(value)}" ${step} ${required ? "required" : ""}></label>`;
  }

  function openRecord(entity, id = "") {
    if (entity === "quote" || entity === "invoice" || entity === "document") return openDocument(entity === "quote" ? "QUOTE" : entity === "invoice" ? "INVOICE" : findDocument(id)?.Type, id);
    const config = entityConfig[entity];
    const record = id ? state[config.collection].find(item => item[config.id] === id) || {} : {};
    state.editingEntity = entity; state.editingId = id;
    byId("dialogTitle").textContent = `${id ? "Edit" : "New"} ${config.title}`;
    byId("recordForm").innerHTML = `<input type="hidden" name="${config.id}" value="${esc(id)}"><div class="form-grid">${config.fields.map(field => fieldMarkup(field, record[field[0]] ?? "")).join("")}</div><div class="actions end"><button type="button" class="button secondary" id="cancelRecord">Cancel</button><button class="button" type="submit">Save ${config.title}</button></div>`;
    byId("dialogBackdrop").classList.remove("hidden");
    byId("cancelRecord").onclick = closeRecord;
  }
  function closeRecord() { byId("dialogBackdrop").classList.add("hidden"); }

  async function saveRecord(event) {
    event.preventDefault();
    const config = entityConfig[state.editingEntity];
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    loading(`Saving ${config.title}`, "Writing to the JJP spreadsheet…", 45);
    try {
      await JJP_API.post("saveRecord", { entity: state.editingEntity, record: data });
      closeRecord();
      await waitAndReload();
      toast(`${config.title} saved.`);
    } catch (error) { toast(error.message); } finally { loadingDone(); }
  }

  function openDocument(type = "QUOTE", id = "", projectId = "") {
    const record = id ? findDocument(id) || {} : {};
    const settings = state.settings;
    const form = byId("documentForm");
    form.reset();
    form.elements.DocumentID.value = id;
    form.elements.Type.value = type;
    form.elements.ClientID.innerHTML = `<option value="">Select client</option>${active("clients").map(client => `<option value="${esc(client.ClientID)}">${esc(client.Name || client.Company)}</option>`).join("")}`;
    form.elements.ProjectID.innerHTML = `<option value="">Optional project</option>${state.projects.map(project => `<option value="${esc(project.ProjectID)}">${esc(project.ProjectName)}</option>`).join("")}`;
    form.elements.ClientID.value = record.ClientID || (findProject(projectId)?.ClientID || "");
    form.elements.ProjectID.value = record.ProjectID || projectId || "";
    form.elements.Status.value = record.Status || "Draft";
    form.elements.IssueDate.value = record.IssueDate || today();
    form.elements.ValidUntil.value = record.ValidUntil || addDays(today(), settings.QuoteValidityDays || 30);
    form.elements.DueDate.value = record.DueDate || addDays(today(), 14);
    form.elements.FailureBufferPercent.value = record.FailureBufferPercent ?? settings.DefaultFailureBufferPercent ?? 10;
    form.elements.Discount.value = record.Discount || 0;
    form.elements.TaxPercent.value = record.TaxPercent ?? settings.DefaultTaxPercent ?? 0;
    form.elements.Shipping.value = record.Shipping || 0;
    form.elements.Notes.value = record.Notes || "";
    state.lines = (record.Items || record.items || []).map(item => ({ ...item }));
    if (!state.lines.length) addLine("filament", false);
    byId("documentTitle").textContent = `${id ? "Edit" : "New"} ${type === "QUOTE" ? "Quote" : "Invoice"}`;
    byId("documentNumberHint").textContent = id || "The number is assigned when saved.";
    document.querySelectorAll(".quote-only").forEach(element => element.classList.toggle("hidden", type !== "QUOTE"));
    document.querySelectorAll(".invoice-only").forEach(element => element.classList.toggle("hidden", type !== "INVOICE"));
    renderLines();
    byId("documentBackdrop").classList.remove("hidden");
  }
  function closeDocument() { byId("documentBackdrop").classList.add("hidden"); state.lines = []; }

  function addLine(kind, render = true) {
    const defaults = {
      filament: { ItemType: "FILAMENT", Description: active("filaments")[0]?.Name || "Filament", Quantity: 0, Unit: "g", UnitCost: Number(active("filaments")[0]?.CostPerGram || 0), ReferenceID: active("filaments")[0]?.FilamentID || "" },
      machine: { ItemType: "MACHINE", Description: "3D printer machine time", Quantity: 0, Unit: "hour", UnitCost: Number(state.settings.DefaultMachineRate || 1) },
      labor: { ItemType: "LABOR", Description: "Post-processing and assembly", Quantity: 0, Unit: "hour", UnitCost: Number(state.settings.DefaultLaborRate || 30) },
      extra: { ItemType: "EXTRA", Description: active("additionalCosts")[0]?.Name || "Additional cost", Quantity: 1, Unit: active("additionalCosts")[0]?.UnitType || "each", UnitCost: Number(active("additionalCosts")[0]?.DefaultUnitCost || 0), ReferenceID: active("additionalCosts")[0]?.CostID || "" },
      custom: { ItemType: "CUSTOM", Description: "Custom item", Quantity: 1, Unit: "job", UnitCost: 0 }
    };
    state.lines.push(defaults[kind] || defaults.custom);
    if (render) renderLines();
  }
  function renderLines() {
    byId("documentLines").innerHTML = state.lines.map((line, index) =>
      `<div class="document-line" data-line="${index}">
        <label>Type<select data-field="ItemType">${["FILAMENT","MACHINE","LABOR","EXTRA","CUSTOM"].map(value => `<option ${value === line.ItemType ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <label>Description<input data-field="Description" value="${esc(line.Description)}"></label>
        <label>Quantity<input data-field="Quantity" type="number" min="0" step=".01" value="${esc(line.Quantity)}"></label>
        <label>Unit<input data-field="Unit" value="${esc(line.Unit)}"></label>
        <label>Unit cost<input data-field="UnitCost" type="number" min="0" step=".0001" value="${esc(line.UnitCost)}"></label>
        <strong class="line-total">${money(Number(line.Quantity) * Number(line.UnitCost))}</strong>
        <button type="button" class="remove-line" data-remove-line="${index}" aria-label="Remove line">×</button>
      </div>`
    ).join("") || empty("Add at least one cost item.");
    recalculate();
  }
  function syncLines() {
    document.querySelectorAll("[data-line]").forEach(row => {
      const index = Number(row.dataset.line);
      row.querySelectorAll("[data-field]").forEach(input => state.lines[index][input.dataset.field] = input.value);
    });
  }
  function calculateTotals() {
    syncLines();
    const form = byId("documentForm");
    const subtotal = state.lines.reduce((sum, line) => sum + Number(line.Quantity || 0) * Number(line.UnitCost || 0), 0);
    const buffer = subtotal * Number(form.elements.FailureBufferPercent.value || 0) / 100;
    const discount = Number(form.elements.Discount.value || 0);
    const taxable = Math.max(0, subtotal + buffer - discount);
    const tax = taxable * Number(form.elements.TaxPercent.value || 0) / 100;
    const shipping = Number(form.elements.Shipping.value || 0);
    return { Subtotal: subtotal, FailureBufferAmount: buffer, Discount: discount, TaxAmount: tax, Shipping: shipping, GrandTotal: taxable + tax + shipping };
  }
  function recalculate() {
    const totals = calculateTotals();
    byId("documentTotals").innerHTML = [
      ["Subtotal", totals.Subtotal], ["Failure buffer", totals.FailureBufferAmount],
      ["Discount", -totals.Discount], ["Tax", totals.TaxAmount], ["Shipping", totals.Shipping]
    ].map(([label, value]) => `<div class="total-row"><span>${label}</span><strong>${money(value)}</strong></div>`).join("") +
      `<div class="total-row grand"><span>Grand Total</span><strong>${money(totals.GrandTotal)}</strong></div>`;
    document.querySelectorAll("[data-line]").forEach((row, index) => {
      const target = row.querySelector(".line-total");
      if (target) target.textContent = money(Number(state.lines[index]?.Quantity || 0) * Number(state.lines[index]?.UnitCost || 0));
    });
  }
  async function saveDocument(event) {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    const totals = calculateTotals();
    const record = { ...formData, ...totals, Items: state.lines.map((line, index) => ({ ...line, Amount: Number(line.Quantity || 0) * Number(line.UnitCost || 0), SortOrder: index + 1 })) };
    loading(`Saving ${record.Type === "QUOTE" ? "quote" : "invoice"}`, "Writing the document and itemized costs…", 45);
    try {
      await JJP_API.post("saveDocument", record);
      closeDocument();
      await waitAndReload();
      toast("Document saved.");
    } catch (error) { toast(error.message); } finally { loadingDone(); }
  }
  async function convertQuote(id) {
    loading("Converting quote", "Creating an invoice from the accepted itemization…", 45);
    try { await JJP_API.post("convertQuote", { DocumentID: id }); await waitAndReload(); showView("invoices"); toast("Invoice created."); }
    catch (error) { toast(error.message); } finally { loadingDone(); }
  }
  async function generatePdf(id) {
    loading("Generating PDF", "Building the branded document in Google Drive…", 35);
    try { const result = await JJP_API.get("generatePdf", { id }); await loadWorkspace({ quiet: true }); if (result.url) window.open(result.url, "_blank", "noopener"); toast("PDF generated."); }
    catch (error) { toast(error.message); } finally { loadingDone(); }
  }
  async function saveSettings(event) {
    event.preventDefault();
    const settings = Object.fromEntries(new FormData(event.currentTarget).entries());
    loading("Saving settings", "Updating JJP defaults…", 50);
    try { await JJP_API.post("saveSettings", settings); await waitAndReload(); toast("Settings saved."); }
    catch (error) { toast(error.message); } finally { loadingDone(); }
  }
  async function waitAndReload() {
    await new Promise(resolve => setTimeout(resolve, 1200));
    await loadWorkspace({ quiet: true });
  }

  document.addEventListener("click", event => {
    const nav = event.target.closest("[data-view]"); if (nav) showView(nav.dataset.view);
    const go = event.target.closest("[data-go]"); if (go) showView(go.dataset.go);
    const create = event.target.closest("[data-new]"); if (create) openRecord(create.dataset.new);
    const edit = event.target.closest("[data-edit]"); if (edit) openRecord(edit.dataset.edit, edit.dataset.id);
    const projectQuote = event.target.closest("[data-project-quote]"); if (projectQuote) openDocument("QUOTE", "", projectQuote.dataset.projectQuote);
    const add = event.target.closest("[data-add-line]"); if (add) addLine(add.dataset.addLine);
    const remove = event.target.closest("[data-remove-line]"); if (remove) { syncLines(); state.lines.splice(Number(remove.dataset.removeLine), 1); renderLines(); }
    const convert = event.target.closest("[data-convert]"); if (convert && confirm("Create an invoice from this quote?")) convertQuote(convert.dataset.convert);
    const pdf = event.target.closest("[data-pdf]"); if (pdf) generatePdf(pdf.dataset.pdf);
  });
  byId("navigation").addEventListener("click", event => { const button = event.target.closest("[data-view]"); if (button) showView(button.dataset.view); });
  byId("menuButton").addEventListener("click", openSidebar);
  byId("sidebarBackdrop").addEventListener("click", closeSidebar);
  byId("refreshButton").addEventListener("click", () => loadWorkspace());
  byId("closeDialog").addEventListener("click", closeRecord);
  byId("closeDocument").addEventListener("click", closeDocument);
  byId("cancelDocument").addEventListener("click", closeDocument);
  byId("recordForm").addEventListener("submit", saveRecord);
  byId("documentForm").addEventListener("submit", saveDocument);
  byId("documentForm").addEventListener("input", recalculate);
  byId("settingsForm").addEventListener("submit", saveSettings);
  byId("dialogBackdrop").addEventListener("click", event => { if (event.target === event.currentTarget) closeRecord(); });
  byId("documentBackdrop").addEventListener("click", event => { if (event.target === event.currentTarget) closeDocument(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") { closeRecord(); closeDocument(); closeSidebar(); } });

  showView((location.hash || "#dashboard").slice(1));
  loadWorkspace();
})();

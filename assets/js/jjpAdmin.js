(() => {
  "use strict";

  const state = {
    clients: [], projects: [], projectFiles: [], documents: [], filaments: [], additionalCosts: [],
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
        ["ModelLinks", "Model links (one URL per line)", "textarea"],
        ["FileReferences", "Design files / .3mf project names", "textarea"],
        ["Notes", "Project notes", "textarea"]
      ]
    },
    filament: {
      collection: "filaments", id: "FilamentID", title: "Filament",
      fields: [
        ["Brand", "Brand / maker", "text", true], ["ProductLine", "Product line", "text", true],
        ["MaterialType", "Material", "select:PLA|PETG|ASA|ABS|TPU|Nylon|Resin|Other"],
        ["Colors", "Available colors (one per line)", "textarea", true],
        ["ProductUrl", "Manufacturer product URL", "url"],
        ["SpoolWeightG", "Spool weight (g)", "number", true],
        ["SpoolCost", "Spool cost", "money", true], ["Supplier", "Supplier / store", "text"]
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
  const parseColors = record => {
    try {
      const value = JSON.parse(record?.ColorsJson || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return String(record?.Color || "").split(/\r?\n|,/).map(value => value.trim()).filter(Boolean);
    }
  };
  const parseLines = value => String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);

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
      state.clients ||= []; state.projects ||= []; state.projectFiles ||= []; state.documents ||= [];
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
    byId("projectsList").innerHTML = state.projects.map(record => {
      const files = state.projectFiles.filter(file => file.ProjectID === record.ProjectID);
      const links = parseLines(record.ModelLinks);
      const references = parseLines(record.FileReferences);
      const resources = [
        ...links.slice(0, 2).map((url, index) => `<a class="pill" href="${esc(url)}" target="_blank" rel="noopener">Model link ${index + 1}</a>`),
        ...files.slice(0, 3).map(file => `<a class="pill" href="${esc(file.Url)}" target="_blank" rel="noopener">${esc(file.Name)}</a>`)
      ].join("");
      return `<article class="record-card"><div><h3>${esc(record.ProjectName)}</h3><p>${esc(findClient(record.ClientID)?.Name || "No client selected")}</p></div><div class="record-meta"><span class="pill">${esc(record.Status || "Inquiry")}</span>${record.DueDate ? `<span class="pill">Due ${esc(record.DueDate)}</span>` : ""}${references.length ? `<span class="pill">${references.length} design file${references.length === 1 ? "" : "s"}</span>` : ""}${files.length ? `<span class="pill">${files.length} sketch${files.length === 1 ? "" : "es"}</span>` : ""}</div>${resources ? `<div class="resource-links">${resources}</div>` : ""}${record.Notes ? `<p class="project-note">${esc(record.Notes)}</p>` : ""}${cardActions("project", record.ProjectID, `<button class="button" data-project-quote="${esc(record.ProjectID)}">Create Quote</button>`)}</article>`;
    }).join("") || empty("Create a project to organize a print request.");
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
      const colors = parseColors(record);
      const name = [record.Brand, record.ProductLine || record.Name].filter(Boolean).join(" ");
      return `<article class="record-card"><div><h3>${esc(name)}</h3><p>${esc(record.MaterialType || "")} · ${colors.length} available color${colors.length === 1 ? "" : "s"}</p></div><div class="record-meta"><span class="pill">${money(record.SpoolCost)} / ${esc(record.SpoolWeightG)}g</span><span class="pill">${money(perGram)}/g</span></div><div class="color-summary">${colors.slice(0, 8).map(color => `<span>${esc(color.replace(/\s*\(\d+\)$/, ""))}</span>`).join("")}${colors.length > 8 ? `<span>+${colors.length - 8} more</span>` : ""}</div>${cardActions("filament", record.FilamentID)}</article>`;
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
    if (entity === "filament") record.Colors = parseColors(record).join("\n");
    state.editingEntity = entity; state.editingId = id;
    byId("dialogTitle").textContent = `${id ? "Edit" : "New"} ${config.title}`;
    const projectFiles = entity === "project" && id ? state.projectFiles.filter(file => file.ProjectID === id) : [];
    const attachmentMarkup = entity !== "project" ? "" : `<div class="project-upload-panel"><h3>Client Sketches &amp; Reference Images</h3>${id ? `<div class="project-file-list">${projectFiles.map(file => `<a href="${esc(file.Url)}" target="_blank" rel="noopener">${esc(file.Name)}</a>`).join("") || "<p class='muted'>No images uploaded yet.</p>"}</div><label>Upload images (5 MB each maximum)<input id="projectFileInput" type="file" accept="image/*" multiple></label><button class="button secondary" id="uploadProjectFilesButton" type="button">Upload Selected Images</button>` : `<p class="notice">Save the project first, then edit it to upload client sketches or reference images.</p>`}</div>`;
    byId("recordForm").innerHTML = `<input type="hidden" name="${config.id}" value="${esc(id)}"><div class="form-grid">${config.fields.map(field => fieldMarkup(field, record[field[0]] ?? "")).join("")}</div>${attachmentMarkup}<div class="actions end"><button type="button" class="button secondary" id="cancelRecord">Cancel</button><button class="button" type="submit">Save ${config.title}</button></div>`;
    byId("dialogBackdrop").classList.remove("hidden");
    byId("cancelRecord").onclick = closeRecord;
    const uploadButton = byId("uploadProjectFilesButton");
    if (uploadButton) uploadButton.onclick = uploadProjectFiles;
  }
  function closeRecord() { byId("dialogBackdrop").classList.add("hidden"); }

  async function saveRecord(event) {
    event.preventDefault();
    const config = entityConfig[state.editingEntity];
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (state.editingEntity === "filament") {
      data.ColorsJson = JSON.stringify(parseLines(data.Colors));
      data.Name = [data.Brand, data.ProductLine].filter(Boolean).join(" ");
      delete data.Colors;
    }
    loading(`Saving ${config.title}`, "Writing to the JJP spreadsheet…", 45);
    try {
      await JJP_API.post("saveRecord", { entity: state.editingEntity, record: data });
      closeRecord();
      await waitAndReload();
      toast(`${config.title} saved.`);
    } catch (error) { toast(error.message); } finally { loadingDone(); }
  }

  async function uploadProjectFiles() {
    const input = byId("projectFileInput");
    const files = Array.from(input?.files || []);
    if (!state.editingId || !files.length) return toast("Choose one or more images first.");
    const oversized = files.find(file => file.size > 5 * 1024 * 1024);
    if (oversized) return toast(`${oversized.name} is larger than 5 MB.`);
    loading("Uploading project images", `Preparing ${files.length} image${files.length === 1 ? "" : "s"}…`, 20);
    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        loading("Uploading project images", file.name, Math.round(((index + .5) / files.length) * 90));
        await JJP_API.post("uploadProjectFile", {
          ProjectID: state.editingId,
          Name: file.name,
          MimeType: file.type || "application/octet-stream",
          Base64: String(dataUrl).split(",")[1] || ""
        });
      }
      await new Promise(resolve => setTimeout(resolve, 1800));
      await loadWorkspace({ quiet: true });
      closeRecord();
      openRecord("project", state.editingId);
      toast("Project images uploaded.");
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
    form.elements.PublicDescription.value = record.PublicDescription || findProject(record.ProjectID || projectId)?.ProjectName || "";
    form.elements.PricingMarkupPercent.value = record.PricingMarkupPercent ?? settings.DefaultMarkupPercent ?? 60;
    form.elements.TargetSubtotal.value = record.TargetSubtotal || "";
    form.elements.FailureBufferPercent.value = record.FailureBufferPercent ?? settings.DefaultFailureBufferPercent ?? 10;
    form.elements.TaxPercent.value = record.TaxPercent ?? settings.DefaultTaxPercent ?? 0;
    form.elements.Shipping.value = record.Shipping || 0;
    form.elements.Notes.value = record.Notes || "";
    const savedItems = (record.Items || record.items || []).map(item => {
      let details = {};
      try { details = JSON.parse(item.DetailsJson || "{}"); } catch (_) {}
      return { ...item, Details: details };
    });
    state.lines = savedItems.filter(item => !["MACHINE", "LABOR"].includes(item.ItemType));
    const machine = savedItems.find(item => item.ItemType === "MACHINE") || {};
    const labor = savedItems.find(item => item.ItemType === "LABOR") || {};
    byId("machineHours").value = machine.Quantity || 0;
    byId("machineRate").value = machine.UnitCost ?? settings.DefaultMachineRate ?? 2;
    byId("laborHours").value = labor.Quantity || 0;
    byId("laborRate").value = labor.UnitCost ?? settings.DefaultLaborRate ?? 30;
    const productionQuantity = Math.max(1, Number(record.ProductionQuantity || 1));
    form.elements.ProductionQuantity.value = productionQuantity;
    byId("massProduction").checked = savedItems.some(item => String(item.PerUnit).toLowerCase() !== "false") && productionQuantity > 1;
    updateProductionMode();
    if (!state.lines.some(item => item.ItemType === "FILAMENT")) addStructuredLine("filament", false);
    byId("documentTitle").textContent = `${id ? "Edit" : "New"} ${type === "QUOTE" ? "Quote" : "Invoice"}`;
    byId("documentNumberHint").textContent = id || "The number is assigned when saved.";
    document.querySelectorAll(".quote-only").forEach(element => element.classList.toggle("hidden", type !== "QUOTE"));
    document.querySelectorAll(".invoice-only").forEach(element => element.classList.toggle("hidden", type !== "INVOICE"));
    renderStructuredLines();
    byId("documentBackdrop").classList.remove("hidden");
  }
  function closeDocument() { byId("documentBackdrop").classList.add("hidden"); state.lines = []; }

  function addStructuredLine(kind, render = true) {
    const defaults = {
      filament: { ItemType: "FILAMENT", Description: active("filaments")[0]?.ProductLine || active("filaments")[0]?.Name || "Filament", Quantity: 0, Unit: "g", UnitCost: Number(active("filaments")[0]?.CostPerGram || 0), ReferenceID: active("filaments")[0]?.FilamentID || "", Details: { colors: [] }, PerUnit: true },
      extra: { ItemType: "EXTRA", Description: active("additionalCosts")[0]?.Name || "Additional cost", Quantity: 1, Unit: active("additionalCosts")[0]?.UnitType || "each", UnitCost: Number(active("additionalCosts")[0]?.DefaultUnitCost || 0), ReferenceID: active("additionalCosts")[0]?.CostID || "", Details: {}, PerUnit: true },
      custom: { ItemType: "CUSTOM", Description: "Custom item", Quantity: 1, Unit: "each", UnitCost: 0, Details: {}, PerUnit: true }
    };
    state.lines.push(defaults[kind] || defaults.custom);
    if (render) renderStructuredLines();
  }

  function renderStructuredLines() {
    const filamentOptions = active("filaments").map(record => `<option value="${esc(record.FilamentID)}">${esc([record.Brand, record.ProductLine || record.Name].filter(Boolean).join(" · "))}</option>`).join("");
    byId("filamentUsageList").innerHTML = state.lines.map((line, index) => {
      if (line.ItemType !== "FILAMENT") return "";
      const filament = state.filaments.find(record => record.FilamentID === line.ReferenceID) || active("filaments")[0] || {};
      const colors = parseColors(filament), selected = line.Details?.colors || [];
      return `<div class="structured-row filament-row" data-line="${index}"><div class="structured-fields"><label>Filament<select data-field="ReferenceID" data-filament-select>${filamentOptions}</select></label><label>Grams used<input data-field="Quantity" type="number" min="0" step=".1" value="${esc(line.Quantity)}"></label><label>Cost / gram<input data-field="UnitCost" type="number" min="0" step=".000001" value="${esc(line.UnitCost)}" readonly></label></div><fieldset class="color-picker"><legend>Colors used</legend>${colors.map(color => `<label><input type="checkbox" data-line-color value="${esc(color)}" ${selected.includes(color) ? "checked" : ""}>${esc(color)}</label>`).join("") || "<span class='muted'>Add colors to this filament library record first.</span>"}</fieldset><div class="structured-footer"><strong>${money(Number(line.Quantity) * Number(line.UnitCost) * costMultiplier())}</strong><button type="button" class="remove-line" data-remove-line="${index}">Remove</button></div></div>`;
    }).join("") || empty("Add a filament to this document.");
    document.querySelectorAll("[data-filament-select]").forEach(select => { select.value = state.lines[Number(select.closest("[data-line]").dataset.line)]?.ReferenceID || ""; });

    const costOptions = active("additionalCosts").map(record => `<option value="${esc(record.CostID)}">${esc(record.Name)} · ${money(record.DefaultUnitCost)} / ${esc(record.UnitType || "each")}</option>`).join("");
    byId("additionalUsageList").innerHTML = state.lines.map((line, index) => {
      if (line.ItemType !== "EXTRA") return "";
      return `<div class="structured-row compact-row" data-line="${index}"><label>Cost<select data-field="ReferenceID" data-cost-select>${costOptions}</select></label><label>Quantity<input data-field="Quantity" type="number" min="0" step=".01" value="${esc(line.Quantity)}"></label><label>Unit<input data-field="Unit" value="${esc(line.Unit)}" readonly></label><label>Unit cost<input data-field="UnitCost" type="number" min="0" step=".01" value="${esc(line.UnitCost)}" readonly></label><strong>${money(Number(line.Quantity) * Number(line.UnitCost) * costMultiplier())}</strong><button type="button" class="remove-line" data-remove-line="${index}">Remove</button></div>`;
    }).join("") || empty("No additional costs selected.");
    document.querySelectorAll("[data-cost-select]").forEach(select => { select.value = state.lines[Number(select.closest("[data-line]").dataset.line)]?.ReferenceID || ""; });

    byId("customUsageList").innerHTML = state.lines.map((line, index) => line.ItemType === "CUSTOM" ? `<div class="structured-row compact-row" data-line="${index}"><label>Description<input data-field="Description" value="${esc(line.Description)}"></label><label>Quantity<input data-field="Quantity" type="number" min="0" step=".01" value="${esc(line.Quantity)}"></label><label>Unit<input data-field="Unit" value="${esc(line.Unit)}"></label><label>Unit cost<input data-field="UnitCost" type="number" min="0" step=".01" value="${esc(line.UnitCost)}"></label><strong>${money(Number(line.Quantity) * Number(line.UnitCost) * costMultiplier())}</strong><button type="button" class="remove-line" data-remove-line="${index}">Remove</button></div>` : "").join("") || empty("No custom costs.");
    recalculate();
  }

  function syncStructuredLines() {
    document.querySelectorAll("[data-line]").forEach(row => {
      const index = Number(row.dataset.line);
      row.querySelectorAll("[data-field]").forEach(input => state.lines[index][input.dataset.field] = input.value);
      if (state.lines[index].ItemType === "FILAMENT") {
        state.lines[index].Details ||= {};
        state.lines[index].Details.colors = Array.from(row.querySelectorAll("[data-line-color]:checked")).map(input => input.value);
      }
    });
  }

  function orderQuantity() { return Math.max(1, Number(byId("documentForm").elements.ProductionQuantity.value || 1)); }
  function costMultiplier() { return byId("massProduction").checked ? orderQuantity() : 1; }

  function updateProductionMode() {
    const enabled = byId("massProduction").checked;
    const wording = enabled ? "Enter costs for one finished item. The calculator will multiply them by the customer quantity." : "Enter costs for the complete order; they will not be multiplied.";
    byId("productionHelp").textContent = wording;
    byId("standardCostHelp").textContent = enabled ? "Hours entered below are for one finished item." : "Standard job-level time and rates";
    renderStructuredLines();
  }

  function allDocumentLines() {
    syncStructuredLines();
    const lines = state.lines.map(line => {
      const filament = state.filaments.find(record => record.FilamentID === line.ReferenceID);
      const cost = state.additionalCosts.find(record => record.CostID === line.ReferenceID);
      const details = { ...(line.Details || {}) };
      if (filament) {
        details.brand = filament.Brand || "";
        details.productLine = filament.ProductLine || filament.Name || "";
        details.materialType = filament.MaterialType || "";
        line.Description = [filament.Brand, filament.ProductLine || filament.Name].filter(Boolean).join(" ");
        line.Unit = "g";
        line.UnitCost = Number(filament.CostPerGram || 0);
      }
      if (cost) {
        line.Description = cost.Name;
        line.Unit = cost.UnitType || "each";
        line.UnitCost = Number(cost.DefaultUnitCost || 0);
      }
      return { ...line, DetailsJson: JSON.stringify(details), PerUnit: byId("massProduction").checked };
    });
    const machineHours = Number(byId("machineHours").value || 0);
    const laborHours = Number(byId("laborHours").value || 0);
    if (machineHours) lines.push({ ItemType: "MACHINE", Description: "3D printer machine time", Quantity: machineHours, Unit: "hour", UnitCost: Number(byId("machineRate").value || 0), PerUnit: byId("massProduction").checked, DetailsJson: "{}" });
    if (laborHours) lines.push({ ItemType: "LABOR", Description: "Post-processing and assembly", Quantity: laborHours, Unit: "hour", UnitCost: Number(byId("laborRate").value || 0), PerUnit: byId("massProduction").checked, DetailsJson: "{}" });
    return lines;
  }

  function calculateTotals() {
    const form = byId("documentForm");
    const lines = allDocumentLines();
    const multiplier = costMultiplier();
    const subtotal = lines.reduce((sum, line) => sum + Number(line.Quantity || 0) * Number(line.UnitCost || 0) * multiplier, 0);
    const buffer = subtotal * Number(form.elements.FailureBufferPercent.value || 0) / 100;
    const costBasis = subtotal + buffer;
    const markupPercent = Math.max(0, Number(form.elements.PricingMarkupPercent.value || 0));
    const recommended = costBasis * (1 + markupPercent / 100);
    const requestedTarget = Number(form.elements.TargetSubtotal.value || 0);
    const target = requestedTarget > 0 ? requestedTarget : recommended;
    const adjustment = target - recommended;
    const discount = Math.max(0, -adjustment);
    const taxable = Math.max(0, target);
    const tax = taxable * Number(form.elements.TaxPercent.value || 0) / 100;
    const shipping = Number(form.elements.Shipping.value || 0);
    return { Subtotal: subtotal, FailureBufferAmount: buffer, PricingMarkupPercent: markupPercent, RecommendedSubtotal: recommended, TargetSubtotal: target, PricingAdjustment: adjustment, Discount: discount, TaxAmount: tax, Shipping: shipping, GrandTotal: taxable + tax + shipping };
  }
  function recalculate() {
    const totals = calculateTotals();
    byId("documentTotals").innerHTML = [
      ["Private production cost", totals.Subtotal], ["Failure / waste allowance", totals.FailureBufferAmount],
      ["Recommended selling subtotal", totals.RecommendedSubtotal], ["Customer subtotal", totals.TargetSubtotal],
      ["Tax", totals.TaxAmount], ["Shipping", totals.Shipping]
    ].map(([label, value]) => `<div class="total-row"><span>${label}</span><strong>${money(value)}</strong></div>`).join("") +
      `<div class="total-row grand"><span>Grand Total</span><strong>${money(totals.GrandTotal)}</strong></div>`;
    const difference = totals.PricingAdjustment;
    const costBasis = totals.Subtotal + totals.FailureBufferAmount;
    const margin = totals.TargetSubtotal > 0 ? (totals.TargetSubtotal - costBasis) / totals.TargetSubtotal * 100 : 0;
    const effectiveMarkup = costBasis > 0 ? (totals.TargetSubtotal / costBasis - 1) * 100 : 0;
    const laborRate = Number(byId("laborRate").value || 0);
    const direction = Math.abs(difference) < .01 ? "matches the recommendation" : difference > 0 ? `adds ${money(difference)} above the recommendation` : `applies an implied ${money(Math.abs(difference))} discount`;
    const coverage = totals.TargetSubtotal >= costBasis ? "Your production costs remain covered." : "Warning: this price does not cover the calculated production cost.";
    let adjustmentAdvice = `This is an effective markup of ${effectiveMarkup.toFixed(1)}% on the cost basis.`;
    if (difference > .01 && laborRate > 0) adjustmentAdvice += ` You could treat the extra ${money(difference)} as a complexity/design allowance equal to ${(difference / laborRate).toFixed(2)} hours at ${money(laborRate)}/hour.`;
    if (difference < -.01 && totals.TargetSubtotal >= costBasis) adjustmentAdvice += ` The lower effective markup preserves costs without changing your private inputs.`;
    byId("pricingRecommendation").innerHTML = `<div><span>Suggested subtotal</span><strong>${money(totals.RecommendedSubtotal)}</strong><small>${money(totals.RecommendedSubtotal / orderQuantity())} per item</small></div><div><span>Your price</span><strong>${money(totals.TargetSubtotal)}</strong><small>${money(totals.TargetSubtotal / orderQuantity())} per item</small></div><p>Your price ${direction}. Estimated gross margin: <strong>${margin.toFixed(1)}%</strong>. ${coverage} ${adjustmentAdvice}</p>`;
  }
  async function saveDocument(event) {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    const totals = calculateTotals();
    const multiplier = costMultiplier();
    formData.ProductionQuantity = orderQuantity();
    const record = { ...formData, ...totals, Items: allDocumentLines().map((line, index) => ({ ...line, Amount: Number(line.Quantity || 0) * Number(line.UnitCost || 0) * multiplier, SortOrder: index + 1 })) };
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
    const add = event.target.closest("[data-add-structured]"); if (add) addStructuredLine(add.dataset.addStructured);
    const remove = event.target.closest("[data-remove-line]"); if (remove) { syncStructuredLines(); state.lines.splice(Number(remove.dataset.removeLine), 1); renderStructuredLines(); }
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
  byId("documentForm").addEventListener("change", event => {
    if (event.target.id === "massProduction") return updateProductionMode();
    if (event.target.name === "ProjectID") {
      const project = findProject(event.target.value);
      if (project) {
        byId("documentForm").elements.ClientID.value = project.ClientID || byId("documentForm").elements.ClientID.value;
        byId("documentForm").elements.PublicDescription.value = project.ProjectName || "";
      }
      return recalculate();
    }
    const row = event.target.closest("[data-line]");
    if (!row) return recalculate();
    const index = Number(row.dataset.line);
    if (event.target.matches("[data-filament-select]")) {
      const filament = state.filaments.find(record => record.FilamentID === event.target.value);
      if (filament) Object.assign(state.lines[index], { ReferenceID: filament.FilamentID, Description: [filament.Brand, filament.ProductLine || filament.Name].filter(Boolean).join(" "), Unit: "g", UnitCost: Number(filament.CostPerGram || 0), Details: { colors: [] } });
      renderStructuredLines();
    } else if (event.target.matches("[data-cost-select]")) {
      const cost = state.additionalCosts.find(record => record.CostID === event.target.value);
      if (cost) Object.assign(state.lines[index], { ReferenceID: cost.CostID, Description: cost.Name, Unit: cost.UnitType || "each", UnitCost: Number(cost.DefaultUnitCost || 0) });
      renderStructuredLines();
    } else recalculate();
  });
  byId("settingsForm").addEventListener("submit", saveSettings);
  byId("dialogBackdrop").addEventListener("click", event => { if (event.target === event.currentTarget) closeRecord(); });
  byId("documentBackdrop").addEventListener("click", event => { if (event.target === event.currentTarget) closeDocument(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") { closeRecord(); closeDocument(); closeSidebar(); } });

  showView((location.hash || "#dashboard").slice(1));
  loadWorkspace();
})();

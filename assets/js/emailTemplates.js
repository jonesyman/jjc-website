// Jeff Jones Consulting — reusable plain-text email template library.

const EMAIL_TEMPLATE_CATEGORIES = [
  "Assessment Invitation", "Existing Assessment Request", "Assessment Already Available",
  "Workshop Preparation", "Workshop Follow-up", "Estimate", "Invoice", "General"
];
const EMAIL_TEMPLATE_VARIABLES = [
  "firstName", "lastName", "fullName", "clientName", "organization", "workshopName",
  "workshopDate", "workshopTime", "workshopLocation", "leaderName", "assessmentDeadline",
  "participantCount", "primaryContact", "consultantName", "consultantEmail"
];

let emailTemplatesState = [];
let emailTemplatesLoaded = false;
let emailTemplatePreviewReturnFocus = null;
let emailTemplatePreviewSource = null;
let emailTemplatePreviewWorkshopId = "";
let emailTemplatePreviewValues = {};
let emailTemplatePreviewDirty = false;

function emailTemplateActive(template) {
  return String(template?.Active).toLowerCase() !== "false";
}

async function loadEmailTemplates(force = false) {
  if (emailTemplatesLoaded && !force) return renderEmailTemplates();
  const loading = document.getElementById("emailTemplatesLoading");
  const content = document.getElementById("emailTemplatesContent");
  loading.classList.remove("hidden");
  loading.textContent = "Loading email templates...";
  content.classList.add("hidden");
  try {
    emailTemplatesState = await Database.getEmailTemplates();
    emailTemplatesLoaded = true;
    populateEmailTemplateCategories();
    renderEmailTemplates();
    if (!dirtyFormViews.has("email-templates") && !document.getElementById("emailTemplateId").value && !document.getElementById("emailTemplateName").value) resetEmailTemplateEditor(true);
    loading.classList.add("hidden");
    content.classList.remove("hidden");
  } catch (error) {
    loading.textContent = error.message || "Unable to load email templates.";
  }
}

function populateEmailTemplateCategories() {
  const categories = [...new Set([...EMAIL_TEMPLATE_CATEGORIES, ...emailTemplatesState.map(item => String(item.Category || "General").trim()).filter(Boolean)])].sort();
  document.getElementById("emailTemplateCategoryOptions").innerHTML = categories.map(category => `<option value="${esc(category)}"></option>`).join("");
  const filter = document.getElementById("emailTemplateCategoryFilter");
  const selected = filter.value;
  filter.innerHTML = '<option value="">All categories</option>' + categories.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
  if (categories.includes(selected)) filter.value = selected;
}

function markEmailTemplateDirty() {
  dirtyFormViews.add("email-templates");
}

function resetEmailTemplateEditor(force = false) {
  if (!force && dirtyFormViews.has("email-templates") && !confirm("Discard the unsaved email template changes?")) return false;
  dirtyFormViews.delete("email-templates");
  document.getElementById("emailTemplateId").value = "";
  document.getElementById("emailTemplateName").value = "";
  document.getElementById("emailTemplateCategory").value = "General";
  document.getElementById("emailTemplateSubject").value = "";
  document.getElementById("emailTemplateBody").value = "";
  document.getElementById("emailTemplateDescription").value = "";
  document.getElementById("emailTemplateActive").checked = true;
  document.getElementById("emailTemplateSortOrder").value = (emailTemplatesState.length + 1) * 10;
  document.getElementById("emailTemplateEditorMode").textContent = "Creating a new template";
  return true;
}

function editEmailTemplate(id) {
  if (dirtyFormViews.has("email-templates") && !confirm("Discard the current unsaved template changes?")) return;
  const template = emailTemplatesState.find(item => String(item.EmailTemplateID) === String(id));
  if (!template) return toast("Email template not found.");
  dirtyFormViews.delete("email-templates");
  document.getElementById("emailTemplateId").value = template.EmailTemplateID || "";
  document.getElementById("emailTemplateName").value = template.TemplateName || "";
  document.getElementById("emailTemplateCategory").value = template.Category || "General";
  document.getElementById("emailTemplateSubject").value = template.Subject || "";
  document.getElementById("emailTemplateBody").value = template.Body || "";
  document.getElementById("emailTemplateDescription").value = template.Description || "";
  document.getElementById("emailTemplateActive").checked = emailTemplateActive(template);
  document.getElementById("emailTemplateSortOrder").value = Number(template.SortOrder || 0);
  document.getElementById("emailTemplateEditorMode").textContent = `Editing: ${template.TemplateName}`;
  document.getElementById("emailTemplateEditorCard").scrollIntoView({ behavior:"smooth", block:"start" });
  document.getElementById("emailTemplateName").focus({ preventScroll:true });
}

function emailTemplateFromEditor() {
  return {
    EmailTemplateID:document.getElementById("emailTemplateId").value.trim(),
    TemplateName:document.getElementById("emailTemplateName").value.trim(),
    Category:document.getElementById("emailTemplateCategory").value.trim() || "General",
    Subject:document.getElementById("emailTemplateSubject").value.trim(),
    Body:document.getElementById("emailTemplateBody").value,
    Description:document.getElementById("emailTemplateDescription").value,
    Active:document.getElementById("emailTemplateActive").checked,
    SortOrder:Number(document.getElementById("emailTemplateSortOrder").value || 0)
  };
}

async function saveEmailTemplate(button) {
  const template = emailTemplateFromEditor();
  if (!template.TemplateName) return focusRequiredField("emailTemplateName", "Template Name is required.");
  if (!template.Subject) return focusRequiredField("emailTemplateSubject", "Subject is required.");
  if (!template.Body.trim()) return focusRequiredField("emailTemplateBody", "Body is required.");
  const finish = beginSave(button, "Saving Template...");
  if (!finish) return;
  try {
    const result = await Database.saveEmailTemplate(template);
    emailTemplatesState = result.rows;
    emailTemplatesLoaded = true;
    dirtyFormViews.delete("email-templates");
    populateEmailTemplateCategories();
    renderEmailTemplates();
    resetEmailTemplateEditor(true);
    toast("Email template saved.");
  } catch (error) { toast(error.message || "Unable to save the email template."); }
  finally { finish(); }
}

function renderEmailTemplates() {
  const query = String(document.getElementById("emailTemplateSearch")?.value || "").trim().toLowerCase();
  const category = document.getElementById("emailTemplateCategoryFilter")?.value || "";
  const includeArchived = Boolean(document.getElementById("includeArchivedEmailTemplates")?.checked);
  const sort = document.getElementById("emailTemplateSort")?.value || "updated";
  const rows = emailTemplatesState.filter(template => {
    const haystack = [template.TemplateName, template.Category, template.Subject, template.Body, template.Description].join(" ").toLowerCase();
    return (includeArchived || emailTemplateActive(template)) && (!query || haystack.includes(query)) && (!category || String(template.Category) === category);
  }).sort((a, b) => {
    if (sort === "name") return String(a.TemplateName).localeCompare(String(b.TemplateName));
    if (sort === "category") return `${a.Category}|${a.TemplateName}`.localeCompare(`${b.Category}|${b.TemplateName}`);
    if (sort === "order") return Number(a.SortOrder || 0) - Number(b.SortOrder || 0) || String(a.TemplateName).localeCompare(String(b.TemplateName));
    return new Date(b.UpdatedDate || b.CreatedDate || 0) - new Date(a.UpdatedDate || a.CreatedDate || 0);
  });
  document.getElementById("emailTemplateMatchCount").textContent = `${rows.length} matching`;
  document.getElementById("emailTemplatesEmpty").classList.toggle("hidden", rows.length > 0);
  const list = document.getElementById("emailTemplatesList");
  list.innerHTML = rows.map(template => {
    const active = emailTemplateActive(template);
    const bodyPreview = String(template.Body || "").replace(/\s+/g, " ").trim().slice(0, 180);
    return `<article class="record-card email-template-card"><div class="section-title"><div><div class="record-title">${esc(template.TemplateName)}</div><div class="tiny muted">${esc(template.Category || "General")} • Updated ${esc(formatDate(template.UpdatedDate || template.CreatedDate))}</div></div><span class="status-badge">${active ? "Active" : "Archived"}</span></div><div class="small"><strong>Subject:</strong> ${esc(template.Subject)}</div><div class="small muted email-template-body-preview">${esc(bodyPreview)}${String(template.Body || "").length > bodyPreview.length ? "…" : ""}</div><div class="actions"><button class="button small-btn" type="button" onclick="openEmailTemplatePreview('${jsEsc(template.EmailTemplateID)}')">Use</button><button class="button secondary small-btn" type="button" onclick="openEmailTemplatePreview('${jsEsc(template.EmailTemplateID)}')">Preview</button><button class="button secondary small-btn" type="button" onclick="editEmailTemplate('${jsEsc(template.EmailTemplateID)}')">Edit</button><button class="button secondary small-btn" type="button" onclick="duplicateEmailTemplate('${jsEsc(template.EmailTemplateID)}',this)">Duplicate</button>${active ? `<button class="button ghost small-btn" type="button" onclick="setEmailTemplateArchived('${jsEsc(template.EmailTemplateID)}',true,this)">Archive</button>` : `<button class="button secondary small-btn" type="button" onclick="setEmailTemplateArchived('${jsEsc(template.EmailTemplateID)}',false,this)">Restore</button><button class="button danger small-btn" type="button" onclick="permanentlyDeleteEmailTemplate('${jsEsc(template.EmailTemplateID)}',this)">Delete Permanently</button>`}</div></article>`;
  }).join("");
  prepareMobileActionMenus(list);
}

async function duplicateEmailTemplate(id, button) {
  const finish = beginSave(button, "Duplicating...");
  if (!finish) return;
  try {
    const result = await Database.duplicateEmailTemplate(id);
    emailTemplatesState = result.rows;
    populateEmailTemplateCategories();
    renderEmailTemplates();
    editEmailTemplate(result.saved.EmailTemplateID);
    toast("Template duplicated. Review and edit the copy.");
  } catch (error) { toast(error.message || "Unable to duplicate the template."); }
  finally { finish(); }
}

async function setEmailTemplateArchived(id, archive, button) {
  const finish = beginSave(button, archive ? "Archiving..." : "Restoring...");
  if (!finish) return;
  try {
    emailTemplatesState = await Database.setEmailTemplateActive(id, !archive);
    populateEmailTemplateCategories();
    renderEmailTemplates();
    if (String(document.getElementById("emailTemplateId").value) === String(id)) resetEmailTemplateEditor(true);
    toast(archive ? "Template archived." : "Template restored.");
  } catch (error) { toast(error.message || "Unable to update the template status."); }
  finally { finish(); }
}

async function permanentlyDeleteEmailTemplate(id, button) {
  const template = emailTemplatesState.find(item => String(item.EmailTemplateID) === String(id));
  if (!template || emailTemplateActive(template)) return toast("Archive the template before permanently deleting it.");
  if (!confirm(`Permanently delete “${template.TemplateName}”?\n\nThis cannot be undone.`)) return;
  const finish = beginSave(button, "Deleting...");
  if (!finish) return;
  try {
    emailTemplatesState = await Database.deleteEmailTemplate(id);
    populateEmailTemplateCategories();
    renderEmailTemplates();
    toast("Template permanently deleted.");
  } catch (error) { toast(error.message || "Unable to delete the template."); }
  finally { finish(); }
}

function insertEmailTemplateVariable(name) {
  const body = document.getElementById("emailTemplateBody");
  const token = `{{${name}}}`;
  const start = body.selectionStart ?? body.value.length;
  const end = body.selectionEnd ?? start;
  body.value = body.value.slice(0, start) + token + body.value.slice(end);
  body.setSelectionRange(start + token.length, start + token.length);
  body.focus();
  markEmailTemplateDirty();
}

function emailTemplateVariableNames(subject, body) {
  const names = [];
  `${subject}\n${body}`.replace(/{{\s*([A-Za-z0-9_]+)\s*}}/g, (_, name) => { if (!names.includes(name)) names.push(name); return _; });
  return names;
}

function substituteEmailTemplateText(text, values) {
  const unresolved = [];
  const output = String(text || "").replace(/{{\s*([A-Za-z0-9_]+)\s*}}/g, (token, name) => {
    const value = String(values[name] ?? "").trim();
    if (!value) { if (!unresolved.includes(name)) unresolved.push(name); return token; }
    return value;
  });
  return { output, unresolved };
}

function emailTemplateVariableLabel(name) {
  return String(name).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, letter => letter.toUpperCase());
}

async function workshopEmailTemplateValues(workshopId) {
  const workshop = workshops.find(item => String(item.WorkshopID) === String(workshopId)) || {};
  const client = clients.find(item => String(item.ClientID) === String(workshop.ClientID)) || {};
  const contact = String(workshop.PrimaryContact || client.Contact || "").trim();
  const parts = contact.split(/\s+/).filter(Boolean);
  let leaderName = "";
  try {
    const assessment = await Database.getWorkshopAssessment(workshopId);
    const leader = assessment?.results?.find(row => String(row.AssessmentResultID) === String(assessment.import?.LeaderAssessmentResultID));
    leaderName = leader ? String(leader.DisplayName || `${leader.FirstName || ""} ${leader.LastName || ""}`).trim() : "";
  } catch (_) {}
  const timeParts = [workshop.StartTime ? formatTime(workshop.StartTime) : "", workshop.EndTime ? formatTime(workshop.EndTime) : ""].filter(Boolean);
  return {
    firstName:parts[0] || "", lastName:parts.length > 1 ? parts.slice(1).join(" ") : "", fullName:contact,
    clientName:client.Organization || workshop.Organization || "", organization:workshop.Organization || client.Organization || "",
    workshopName:workshop.Organization || workshop.Type || "", workshopDate:workshop.WorkshopDate ? formatDate(workshop.WorkshopDate) : (workshop.DateDescription || ""),
    workshopTime:timeParts.join(" – "), workshopLocation:workshop.Location || "", leaderName,
    assessmentDeadline:"", participantCount:String(workshop.Participants || ""), primaryContact:contact,
    consultantName:"Jeff Jones", consultantEmail:"jeffrey.g.jones@gmail.com"
  };
}

function defaultEmailTemplateValues() {
  return Object.fromEntries(EMAIL_TEMPLATE_VARIABLES.map(name => [name, name === "consultantName" ? "Jeff Jones" : name === "consultantEmail" ? "jeffrey.g.jones@gmail.com" : ""]));
}

async function openWorkshopEmailTemplates(workshopId) {
  if (!emailTemplatesLoaded) await loadEmailTemplates(true);
  const active = emailTemplatesState.filter(emailTemplateActive).sort((a, b) => Number(a.SortOrder || 0) - Number(b.SortOrder || 0));
  if (!active.length) return toast("Create an active email template first.");
  const values = await workshopEmailTemplateValues(workshopId);
  openEmailTemplatePreview(active[0].EmailTemplateID, workshopId, values);
}

function previewEmailTemplateEditor() {
  const template = emailTemplateFromEditor();
  if (!template.TemplateName || !template.Subject || !template.Body.trim()) return toast("Enter a template name, subject, and body before previewing.");
  openEmailTemplatePreviewRecord(template, "", defaultEmailTemplateValues());
}

function openEmailTemplatePreview(id, workshopId = "", values = null) {
  const template = emailTemplatesState.find(item => String(item.EmailTemplateID) === String(id));
  if (!template) return toast("Email template not found.");
  openEmailTemplatePreviewRecord(template, workshopId, values || defaultEmailTemplateValues());
}

function openEmailTemplatePreviewRecord(template, workshopId, values) {
  emailTemplatePreviewReturnFocus = document.activeElement;
  emailTemplatePreviewSource = { ...template };
  emailTemplatePreviewWorkshopId = String(workshopId || "");
  emailTemplatePreviewValues = { ...defaultEmailTemplateValues(), ...(values || {}) };
  emailTemplatePreviewDirty = false;
  document.getElementById("emailPreviewName").textContent = template.TemplateName || "Email Template";
  document.getElementById("emailPreviewCategory").textContent = template.Category || "General";
  const chooserWrap = document.getElementById("emailPreviewTemplateChooserWrap");
  chooserWrap.classList.toggle("hidden", !emailTemplatePreviewWorkshopId);
  if (emailTemplatePreviewWorkshopId) {
    const chooser = document.getElementById("emailPreviewTemplateChooser");
    chooser.innerHTML = emailTemplatesState.filter(emailTemplateActive).sort((a,b) => Number(a.SortOrder || 0) - Number(b.SortOrder || 0)).map(item => `<option value="${esc(item.EmailTemplateID)}">${esc(item.TemplateName)}</option>`).join("");
    chooser.value = template.EmailTemplateID;
  }
  renderEmailTemplateVariableFields();
  applyEmailTemplatePersonalization();
  document.getElementById("emailTemplatePreviewBackdrop").classList.add("open");
  setTimeout(() => document.getElementById("closeEmailTemplatePreviewButton").focus(), 0);
}

function renderEmailTemplateVariableFields() {
  const names = emailTemplateVariableNames(emailTemplatePreviewSource.Subject, emailTemplatePreviewSource.Body);
  document.getElementById("emailPreviewVariableFields").innerHTML = names.length ? names.map(name => `<div class="field"><label for="emailVariable_${esc(name)}">${esc(emailTemplateVariableLabel(name))}</label><input id="emailVariable_${esc(name)}" data-email-variable="${esc(name)}" value="${esc(emailTemplatePreviewValues[name] || "")}" oninput="markEmailTemplatePreviewDirty()"></div>`).join("") : '<p class="muted small">This template does not use personalization placeholders.</p>';
}

function collectEmailTemplatePreviewValues() {
  document.querySelectorAll("[data-email-variable]").forEach(input => { emailTemplatePreviewValues[input.dataset.emailVariable] = input.value; });
  return emailTemplatePreviewValues;
}

function applyEmailTemplatePersonalization() {
  const values = collectEmailTemplatePreviewValues();
  const subject = substituteEmailTemplateText(emailTemplatePreviewSource.Subject, values);
  const body = substituteEmailTemplateText(emailTemplatePreviewSource.Body, values);
  const unresolved = [...new Set([...subject.unresolved, ...body.unresolved])];
  document.getElementById("emailPreviewSubject").value = subject.output;
  document.getElementById("emailPreviewBody").value = body.output;
  document.getElementById("emailPreviewUnresolved").classList.toggle("hidden", unresolved.length === 0);
  document.getElementById("emailPreviewUnresolved").textContent = unresolved.length ? `Unresolved placeholders: ${unresolved.map(name => `{{${name}}}`).join(", ")}. Enter values above or copy the placeholders as written.` : "";
  const used = Object.entries(values).filter(([name, value]) => value && emailTemplateVariableNames(emailTemplatePreviewSource.Subject, emailTemplatePreviewSource.Body).includes(name));
  document.getElementById("emailPreviewSubstitutions").textContent = used.length ? `Applied: ${used.map(([name, value]) => `${emailTemplateVariableLabel(name)} = ${value}`).join(" • ")}` : "No personalization values were applied.";
  emailTemplatePreviewDirty = false;
}

function selectEmailPreviewTemplate(id) {
  const template = emailTemplatesState.find(item => String(item.EmailTemplateID) === String(id));
  if (!template) return;
  emailTemplatePreviewSource = { ...template };
  document.getElementById("emailPreviewName").textContent = template.TemplateName;
  document.getElementById("emailPreviewCategory").textContent = template.Category || "General";
  renderEmailTemplateVariableFields();
  applyEmailTemplatePersonalization();
}

function markEmailTemplatePreviewDirty() {
  emailTemplatePreviewDirty = true;
  const unresolved = emailTemplateVariableNames(document.getElementById("emailPreviewSubject").value, document.getElementById("emailPreviewBody").value);
  const warning = document.getElementById("emailPreviewUnresolved");
  warning.classList.toggle("hidden", unresolved.length === 0);
  warning.textContent = unresolved.length ? `Unresolved placeholders: ${unresolved.map(name => `{{${name}}}`).join(", ")}. Enter values above or copy the placeholders as written.` : "";
}

function closeEmailTemplatePreview(force = false) {
  if (!force && emailTemplatePreviewDirty && !confirm("Close this personalized message without copying or saving it?")) return false;
  document.getElementById("emailTemplatePreviewBackdrop").classList.remove("open");
  emailTemplatePreviewSource = null;
  emailTemplatePreviewWorkshopId = "";
  emailTemplatePreviewDirty = false;
  if (emailTemplatePreviewReturnFocus?.focus) emailTemplatePreviewReturnFocus.focus();
  emailTemplatePreviewReturnFocus = null;
  return true;
}

function editEmailPreviewBeforeCopying() {
  document.getElementById("emailPreviewBody").focus();
  toast("Edit the generated subject or message directly, then copy it.");
}

async function copyPlainEmailText(text, successMessage) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const fallback = document.createElement("textarea");
      fallback.value = text;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      if (!document.execCommand("copy")) throw new Error("Copy command was rejected.");
      fallback.remove();
    }
    toast(successMessage);
    return true;
  } catch (error) {
    toast("Clipboard access failed. Select the text and copy it manually.");
    return false;
  }
}

async function copyEmailPreview(kind) {
  const subject = document.getElementById("emailPreviewSubject").value;
  const body = document.getElementById("emailPreviewBody").value;
  const text = kind === "subject" ? subject : kind === "both" ? `Subject: ${subject}\n\n${body}` : body;
  const message = kind === "subject" ? "Subject copied to clipboard." : kind === "both" ? "Subject and message copied to clipboard." : "Message copied to clipboard.";
  if (await copyPlainEmailText(text, message)) emailTemplatePreviewDirty = false;
}

function copyEmailTemplateEditor(kind) {
  const subject = document.getElementById("emailTemplateSubject").value;
  const body = document.getElementById("emailTemplateBody").value;
  const text = kind === "subject" ? subject : kind === "both" ? `Subject: ${subject}\n\n${body}` : body;
  const message = kind === "subject" ? "Subject copied to clipboard." : kind === "both" ? "Subject and message copied to clipboard." : "Message copied to clipboard.";
  copyPlainEmailText(text, message);
}

function saveEmailPreviewAsNewTemplate() {
  const subject = document.getElementById("emailPreviewSubject").value;
  const body = document.getElementById("emailPreviewBody").value;
  const name = `${emailTemplatePreviewSource?.TemplateName || "Email Template"} — Personalized Copy`;
  const category = emailTemplatePreviewSource?.Category || "General";
  closeEmailTemplatePreview(true);
  showView("email-templates");
  resetEmailTemplateEditor(true);
  document.getElementById("emailTemplateName").value = name;
  document.getElementById("emailTemplateCategory").value = category;
  document.getElementById("emailTemplateSubject").value = subject;
  document.getElementById("emailTemplateBody").value = body;
  markEmailTemplateDirty();
  document.getElementById("emailTemplateName").focus();
  toast("Personalized message loaded as a new template. Review and save it.");
}

function trapEmailTemplatePreviewFocus(event) {
  if (event.key !== "Tab" || !document.getElementById("emailTemplatePreviewBackdrop").classList.contains("open")) return false;
  const dialog = document.getElementById("emailTemplatePreviewDialog");
  const focusable = [...dialog.querySelectorAll('button,input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter(element => !element.disabled && !element.classList.contains("hidden") && element.offsetParent !== null);
  if (!focusable.length) return false;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); return true; }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); return true; }
  return false;
}

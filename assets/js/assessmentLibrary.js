// Jeff Jones Consulting — canonical assessment library and reusable groups.

let assessmentLibraryState = null;
let assessmentLibraryLoaded = false;
let assessmentGroupDraftMembers = [];
let assessmentGroupLeaderId = "";

async function loadAssessmentLibrary(force = false) {
  if (assessmentLibraryLoaded && !force) return renderAssessmentLibrary();
  const loading = document.getElementById("assessmentLibraryLoading");
  const content = document.getElementById("assessmentLibraryContent");
  if (!loading || !content) return;
  loading.classList.remove("hidden");
  loading.textContent = "Loading assessment library and checking historical imports...";
  content.classList.add("hidden");
  try {
    assessmentLibraryState = await Database.getAssessmentWorkspace();
    assessmentLibraryLoaded = true;
    loading.classList.add("hidden");
    content.classList.remove("hidden");
    renderAssessmentLibrary();
  } catch (error) {
    console.warn("Unable to load assessment library.", error);
    loading.textContent = error.message || "Unable to load the assessment library.";
  }
}

function assessmentLibraryPeople() {
  return Array.isArray(assessmentLibraryState?.people) ? assessmentLibraryState.people : [];
}

function assessmentLibraryGroups() {
  return Array.isArray(assessmentLibraryState?.groups) ? assessmentLibraryState.groups : [];
}

function assessmentLibraryMemberships() {
  return Array.isArray(assessmentLibraryState?.memberships) ? assessmentLibraryState.memberships : [];
}

function assessmentPersonName(person) {
  return String(person?.DisplayName || `${person?.FirstName || ""} ${person?.LastName || ""}`).trim();
}

function assessmentPersonById(personId) {
  return assessmentLibraryPeople().find(person => String(person.PersonID) === String(personId));
}

function renderAssessmentLibrary() {
  if (!assessmentLibraryState) return;
  document.getElementById("libraryPeopleCount").textContent = assessmentLibraryPeople().length;
  document.getElementById("libraryGroupCount").textContent = assessmentLibraryGroups().length;
  document.getElementById("libraryDuplicateCount").textContent = (assessmentLibraryState.duplicates || []).length;
  populateAssessmentLibraryOptions();
  renderAssessmentPeople();
  renderAssessmentGroups();
  renderAssessmentDuplicates();
  renderAssessmentGroupMembers();
}

function populateAssessmentLibraryOptions() {
  const selectedPerson = document.getElementById("assessmentGroupPerson").value;
  const people = assessmentLibraryPeople().slice().sort((a, b) => `${a.LastName}|${a.FirstName}`.localeCompare(`${b.LastName}|${b.FirstName}`));
  document.getElementById("assessmentGroupPerson").innerHTML = '<option value="">Choose a person...</option>' + people.map(person => `<option value="${esc(person.PersonID)}">${esc(assessmentPersonName(person))} — ${esc(person.Genius1)}, ${esc(person.Genius2)}</option>`).join("");
  if (people.some(person => String(person.PersonID) === selectedPerson)) document.getElementById("assessmentGroupPerson").value = selectedPerson;

  const selectedClient = document.getElementById("assessmentGroupClient").value;
  document.getElementById("assessmentGroupClient").innerHTML = '<option value="">No linked client</option>' + clients.filter(client => !isArchived(client)).slice().sort((a, b) => String(a.Organization).localeCompare(String(b.Organization))).map(client => `<option value="${esc(client.ClientID)}">${esc(client.Organization || client.ClientID)}</option>`).join("");
  if (clients.some(client => String(client.ClientID) === selectedClient)) document.getElementById("assessmentGroupClient").value = selectedClient;

  const workshopIds = new Set((assessmentLibraryState.workshopMembers || []).map(item => String(item.WorkshopID)));
  const selectedWorkshop = document.getElementById("assessmentGroupWorkshop").value;
  const availableWorkshops = workshops.filter(workshop => workshopIds.has(String(workshop.WorkshopID))).slice().sort((a, b) => (normalizeDateInput(b.WorkshopDate) || "").localeCompare(normalizeDateInput(a.WorkshopDate) || ""));
  document.getElementById("assessmentGroupWorkshop").innerHTML = '<option value="">Choose a workshop...</option>' + availableWorkshops.map(workshop => {
    const when = workshop.WorkshopDate ? formatDate(workshop.WorkshopDate) : (workshop.DateDescription || "Date not recorded");
    return `<option value="${esc(workshop.WorkshopID)}">${esc(workshop.Organization || workshop.WorkshopID)} — ${esc(when)}</option>`;
  }).join("");
  if (availableWorkshops.some(workshop => String(workshop.WorkshopID) === selectedWorkshop)) document.getElementById("assessmentGroupWorkshop").value = selectedWorkshop;

  const selectedSourceGroup = document.getElementById("assessmentGroupSourceGroup").value;
  const currentGroupId = document.getElementById("assessmentGroupId").value;
  const sourceGroups = assessmentLibraryGroups().filter(group => String(group.GroupID) !== String(currentGroupId)).slice().sort((a, b) => String(a.GroupName).localeCompare(String(b.GroupName)));
  document.getElementById("assessmentGroupSourceGroup").innerHTML = '<option value="">Choose a saved group...</option>' + sourceGroups.map(group => `<option value="${esc(group.GroupID)}">${esc(group.GroupName)}</option>`).join("");
  if (sourceGroups.some(group => String(group.GroupID) === selectedSourceGroup)) document.getElementById("assessmentGroupSourceGroup").value = selectedSourceGroup;
}

function renderAssessmentPeople() {
  if (!assessmentLibraryState) return;
  const query = String(document.getElementById("libraryPersonSearch")?.value || "").trim().toLowerCase();
  const workshopCounts = {};
  (assessmentLibraryState.workshopMembers || []).forEach(item => {
    const key = String(item.PersonID);
    if (!workshopCounts[key]) workshopCounts[key] = new Set();
    workshopCounts[key].add(String(item.WorkshopID));
  });
  const groupCounts = {};
  assessmentLibraryMemberships().forEach(item => { groupCounts[String(item.PersonID)] = (groupCounts[String(item.PersonID)] || 0) + 1; });
  const people = assessmentLibraryPeople().filter(person => !query || `${assessmentPersonName(person)} ${person.Genius1} ${person.Genius2} ${person.Competency1} ${person.Competency2} ${person.Frustration1} ${person.Frustration2}`.toLowerCase().includes(query)).sort((a, b) => `${a.LastName}|${a.FirstName}`.localeCompare(`${b.LastName}|${b.FirstName}`));
  const list = document.getElementById("libraryPeopleList");
  list.innerHTML = people.map(person => `<article class="record-card"><div class="record-title">${esc(assessmentPersonName(person))}</div><div class="small"><strong>Genius:</strong> <span class="team-genius-label">${esc(person.Genius1)}, ${esc(person.Genius2)}</span></div><div class="small"><strong>Competency:</strong> ${esc(person.Competency1)}, ${esc(person.Competency2)}</div><div class="small"><strong>Frustration:</strong> <span class="team-frustration-label">${esc(person.Frustration1)}, ${esc(person.Frustration2)}</span></div><div class="tiny muted">${workshopCounts[String(person.PersonID)]?.size || 0} workshop${workshopCounts[String(person.PersonID)]?.size === 1 ? "" : "s"} • ${groupCounts[String(person.PersonID)] || 0} custom group${groupCounts[String(person.PersonID)] === 1 ? "" : "s"}</div><div class="actions"><button class="button secondary small-btn" onclick="addPersonIdToAssessmentGroup('${jsEsc(person.PersonID)}')">Add to Current Group</button></div></article>`).join("");
  document.getElementById("libraryPeopleEmpty").classList.toggle("hidden", people.length > 0);
  prepareMobileActionMenus(list);
}

function addPersonIdToAssessmentGroup(personId) {
  if (!assessmentPersonById(personId)) return;
  if (!assessmentGroupDraftMembers.includes(String(personId))) assessmentGroupDraftMembers.push(String(personId));
  renderAssessmentGroupMembers();
  document.getElementById("assessmentGroupName").scrollIntoView({ behavior: "smooth", block: "center" });
}

function addPersonToAssessmentGroup() {
  const personId = document.getElementById("assessmentGroupPerson").value;
  if (!personId) return toast("Choose a person to add.");
  addPersonIdToAssessmentGroup(personId);
  document.getElementById("assessmentGroupPerson").value = "";
}

function addWorkshopToAssessmentGroup() {
  const workshopId = document.getElementById("assessmentGroupWorkshop").value;
  if (!workshopId) return toast("Choose a workshop to add.");
  const personIds = (assessmentLibraryState.workshopMembers || []).filter(item => String(item.WorkshopID) === String(workshopId)).map(item => String(item.PersonID));
  const before = assessmentGroupDraftMembers.length;
  personIds.forEach(personId => { if (!assessmentGroupDraftMembers.includes(personId)) assessmentGroupDraftMembers.push(personId); });
  renderAssessmentGroupMembers();
  toast(`${assessmentGroupDraftMembers.length - before} ${assessmentGroupDraftMembers.length - before === 1 ? "person" : "people"} added from the workshop.`);
}

function addSavedGroupToAssessmentGroup() {
  const sourceGroupId = document.getElementById("assessmentGroupSourceGroup").value;
  if (!sourceGroupId) return toast("Choose a saved group to add.");
  if (String(sourceGroupId) === String(document.getElementById("assessmentGroupId").value)) return toast("Choose a different saved group.");
  const personIds = assessmentLibraryMemberships().filter(item => String(item.GroupID) === String(sourceGroupId)).map(item => String(item.PersonID));
  const before = assessmentGroupDraftMembers.length;
  personIds.forEach(personId => { if (!assessmentGroupDraftMembers.includes(personId)) assessmentGroupDraftMembers.push(personId); });
  renderAssessmentGroupMembers();
  toast(`${assessmentGroupDraftMembers.length - before} ${assessmentGroupDraftMembers.length - before === 1 ? "person" : "people"} added from the saved group.`);
}

function setAssessmentGroupLeader(personId) {
  assessmentGroupLeaderId = String(personId);
  renderAssessmentGroupMembers();
}

function removeAssessmentGroupMember(personId) {
  assessmentGroupDraftMembers = assessmentGroupDraftMembers.filter(id => String(id) !== String(personId));
  if (String(assessmentGroupLeaderId) === String(personId)) assessmentGroupLeaderId = "";
  renderAssessmentGroupMembers();
}

function renderAssessmentGroupMembers() {
  const rows = assessmentGroupDraftMembers.map(assessmentPersonById).filter(Boolean).sort((a, b) => `${a.LastName}|${a.FirstName}`.localeCompare(`${b.LastName}|${b.FirstName}`));
  document.getElementById("assessmentGroupMemberCount").textContent = `${rows.length} ${rows.length === 1 ? "person" : "people"}`;
  document.getElementById("assessmentGroupMembersEmpty").classList.toggle("hidden", rows.length > 0);
  document.getElementById("assessmentGroupMembers").innerHTML = rows.map(person => `<div class="group-member-row"><input type="radio" name="assessmentGroupLeader" aria-label="Make ${esc(assessmentPersonName(person))} the leader" ${String(person.PersonID) === String(assessmentGroupLeaderId) ? "checked" : ""} onchange="setAssessmentGroupLeader('${jsEsc(person.PersonID)}')"><div><strong>${esc(assessmentPersonName(person))}</strong><div class="tiny muted">${esc(person.Genius1)}, ${esc(person.Genius2)}${String(person.PersonID) === String(assessmentGroupLeaderId) ? " • Leader" : ""}</div></div><button class="button ghost small-btn" onclick="removeAssessmentGroupMember('${jsEsc(person.PersonID)}')">Remove</button></div>`).join("");
}

function selectAssessmentGroupClient() {}

function resetAssessmentGroupForm() {
  document.getElementById("assessmentGroupId").value = "";
  document.getElementById("assessmentGroupName").value = "";
  document.getElementById("assessmentGroupClient").value = "";
  document.getElementById("assessmentGroupDescription").value = "";
  document.getElementById("assessmentGroupPerson").value = "";
  document.getElementById("assessmentGroupWorkshop").value = "";
  document.getElementById("assessmentGroupSourceGroup").value = "";
  assessmentGroupDraftMembers = [];
  assessmentGroupLeaderId = "";
  renderAssessmentGroupMembers();
}

async function saveAssessmentGroup(button) {
  const groupName = document.getElementById("assessmentGroupName").value.trim();
  if (!groupName) return focusRequiredField("assessmentGroupName", "Group name is required.");
  if (!assessmentGroupDraftMembers.length) return toast("Add at least one person to this group.");
  const clientId = document.getElementById("assessmentGroupClient").value;
  const client = clients.find(item => String(item.ClientID) === String(clientId)) || {};
  const finish = beginSave(button, "Saving Group...");
  if (!finish) return;
  try {
    const groupId = document.getElementById("assessmentGroupId").value || `GRP-${crypto.randomUUID()}`;
    assessmentLibraryState = await Database.saveAssessmentGroup({
      groupId,
      groupName,
      clientId,
      organization: client.Organization || "",
      description: document.getElementById("assessmentGroupDescription").value.trim(),
      personIds: assessmentGroupDraftMembers,
      leaderPersonId: assessmentGroupLeaderId
    });
    assessmentLibraryLoaded = true;
    resetAssessmentGroupForm();
    renderAssessmentLibrary();
    toast("Assessment group saved.");
  } catch (error) {
    toast(error.message || "Unable to save the group.");
  } finally { finish(); }
}

function editAssessmentGroup(groupId) {
  const group = assessmentLibraryGroups().find(item => String(item.GroupID) === String(groupId));
  if (!group) return toast("Group not found.");
  document.getElementById("assessmentGroupId").value = group.GroupID;
  document.getElementById("assessmentGroupName").value = group.GroupName || "";
  document.getElementById("assessmentGroupClient").value = group.ClientID || "";
  document.getElementById("assessmentGroupDescription").value = group.Description || "";
  populateAssessmentLibraryOptions();
  const members = assessmentLibraryMemberships().filter(item => String(item.GroupID) === String(groupId));
  assessmentGroupDraftMembers = members.map(item => String(item.PersonID));
  assessmentGroupLeaderId = String(members.find(item => String(item.IsLeader).toLowerCase() === "true")?.PersonID || "");
  renderAssessmentGroupMembers();
  document.getElementById("assessmentGroupName").scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("assessmentGroupName").focus({ preventScroll: true });
}

function renderAssessmentGroups() {
  const groups = assessmentLibraryGroups().slice().sort((a, b) => String(a.GroupName).localeCompare(String(b.GroupName)));
  document.getElementById("assessmentGroupMatchCount").textContent = `${groups.length} saved`;
  document.getElementById("assessmentGroupsEmpty").classList.toggle("hidden", groups.length > 0);
  const list = document.getElementById("assessmentGroupsList");
  list.innerHTML = groups.map(group => {
    const members = assessmentLibraryMemberships().filter(item => String(item.GroupID) === String(group.GroupID));
    const leaderMembership = members.find(item => String(item.IsLeader).toLowerCase() === "true");
    const leader = leaderMembership ? assessmentPersonById(leaderMembership.PersonID) : null;
    return `<article class="record-card"><div class="record-title">${esc(group.GroupName)}</div><div class="tiny muted">${esc(group.Organization || "Independent group")} • ${members.length} ${members.length === 1 ? "person" : "people"}</div>${group.Description ? `<div class="small">${esc(group.Description)}</div>` : ""}<div class="small"><strong>Leader:</strong> ${leader ? esc(assessmentPersonName(leader)) : '<span class="muted">Not selected</span>'}</div><div class="actions"><button class="button secondary small-btn" onclick="editAssessmentGroup('${jsEsc(group.GroupID)}')">Edit</button><button class="button small-btn" onclick="previewAssessmentGroup('${jsEsc(group.GroupID)}')">Preview Team Map</button><button class="button danger small-btn" onclick="deleteAssessmentGroup('${jsEsc(group.GroupID)}')">Delete</button></div></article>`;
  }).join("");
  prepareMobileActionMenus(list);
}

function previewAssessmentGroup(groupId) {
  const group = assessmentLibraryGroups().find(item => String(item.GroupID) === String(groupId));
  const memberships = assessmentLibraryMemberships().filter(item => String(item.GroupID) === String(groupId));
  const leaderId = String(memberships.find(item => String(item.IsLeader).toLowerCase() === "true")?.PersonID || "");
  if (!group || !memberships.length) return toast("This group does not have any members.");
  if (!leaderId) return toast("Edit this group and select a leader before previewing the Team Map.");
  const results = memberships.map(item => assessmentPersonById(item.PersonID)).filter(Boolean).map(person => ({
    AssessmentResultID: person.PersonID,
    PersonID: person.PersonID,
    FirstName: person.FirstName,
    LastName: person.LastName,
    DisplayName: assessmentPersonName(person),
    GroupName: group.GroupName,
    Genius1: person.Genius1,
    Genius2: person.Genius2,
    Competency1: person.Competency1,
    Competency2: person.Competency2,
    Frustration1: person.Frustration1,
    Frustration2: person.Frustration2
  }));
  currentAssessmentData = { import: { GroupName: group.GroupName, LeaderAssessmentResultID: leaderId }, results };
  assessmentWorkshopId = "";
  teamMapContext = { groupId: group.GroupID, title: group.GroupName, organization: group.Organization || "", identifier: "Custom Group", dateLabel: "" };
  openTeamMapPreview();
}

async function deleteAssessmentGroup(groupId) {
  const group = assessmentLibraryGroups().find(item => String(item.GroupID) === String(groupId));
  if (!group || !confirm(`Delete the group “${group.GroupName}”?\n\nThe people and their workshop assessments will remain available.`)) return;
  try {
    assessmentLibraryState = await Database.deleteAssessmentGroup(groupId);
    if (String(document.getElementById("assessmentGroupId").value) === String(groupId)) resetAssessmentGroupForm();
    renderAssessmentLibrary();
    toast("Group deleted. Assessment records were preserved.");
  } catch (error) { toast(error.message || "Unable to delete the group."); }
}

function duplicatePersonSummary(person) {
  return `<div class="person-summary"><strong>${esc(assessmentPersonName(person))}</strong><div class="small"><span class="team-genius-label">Genius: ${esc(person.Genius1)}, ${esc(person.Genius2)}</span></div><div class="small">Competency: ${esc(person.Competency1)}, ${esc(person.Competency2)}</div><div class="small"><span class="team-frustration-label">Frustration: ${esc(person.Frustration1)}, ${esc(person.Frustration2)}</span></div></div>`;
}

function renderAssessmentDuplicates() {
  const duplicates = assessmentLibraryState.duplicates || [];
  document.getElementById("assessmentDuplicateMatchCount").textContent = `${duplicates.length} to review`;
  document.getElementById("assessmentDuplicatesEmpty").classList.toggle("hidden", duplicates.length > 0);
  document.getElementById("assessmentDuplicateList").innerHTML = duplicates.map(item => `<article class="duplicate-card"><strong>Are these the same person?</strong><div class="duplicate-people">${duplicatePersonSummary(item.person1)}${duplicatePersonSummary(item.person2)}</div><div class="actions"><button class="button small-btn" onclick="resolveAssessmentDuplicate('${jsEsc(item.person1.PersonID)}','${jsEsc(item.person2.PersonID)}','merge','${jsEsc(item.person1.PersonID)}')">Same — keep first</button><button class="button secondary small-btn" onclick="resolveAssessmentDuplicate('${jsEsc(item.person1.PersonID)}','${jsEsc(item.person2.PersonID)}','merge','${jsEsc(item.person2.PersonID)}')">Same — keep second</button><button class="button ghost small-btn" onclick="resolveAssessmentDuplicate('${jsEsc(item.person1.PersonID)}','${jsEsc(item.person2.PersonID)}','different','')">Different people</button></div></article>`).join("");
}

async function resolveAssessmentDuplicate(personId1, personId2, resolution, keepPersonId) {
  const message = resolution === "different" ? "Confirm these are different people with the same name?" : "Merge these records? Workshop and group memberships will be combined, and the selected assessment will be retained.";
  if (!confirm(message)) return;
  try {
    assessmentLibraryState = await Database.resolveAssessmentDuplicate({ personId1, personId2, resolution, keepPersonId });
    assessmentAnalyticsLoaded = false;
    renderAssessmentLibrary();
    toast(resolution === "different" ? "Marked as different people." : "Duplicate records merged.");
  } catch (error) { toast(error.message || "Unable to save the duplicate decision."); }
}

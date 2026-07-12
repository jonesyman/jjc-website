// Working Genius assessment import helpers. Workbooks are parsed locally in /admin/.
window.Assessments = (() => {
  const TYPES = ["Wonder", "Invention", "Discernment", "Galvanizing", "Enablement", "Tenacity"];
  const normalizedTypes = new Map(TYPES.map(type => [type.toLowerCase(), type]));

  function normalizeType(value) {
    return normalizedTypes.get(String(value || "").trim().toLowerCase()) || "";
  }

  function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ").replace(/[’‘]/g, "'").replace(/\s*-\s*/g, "-");
  }

  function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function participantKey(row) {
    return `${normalizeName(row.firstName).toLowerCase()}|${normalizeName(row.lastName).toLowerCase()}`;
  }

  async function parseFile(file) {
    if (!file || !/\.xlsx$/i.test(file.name)) throw new Error("Choose an .xlsx assessment export.");
    if (!window.XLSX) throw new Error("The XLSX parser did not load.");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    if (!workbook.SheetNames.includes("Individual Results")) throw new Error('Missing required worksheet: "Individual Results".');
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Individual Results"], { header: 1, defval: "", raw: false });
    return validateRows(rows, file.name);
  }

  function validateRows(rows, fileName) {
    const errors = [];
    const warnings = [];
    const participants = [];
    let headerIndex = rows.findIndex(row => String(row[0] || "").toLowerCase().includes("first") && String(row[1] || "").toLowerCase().includes("last"));
    if (headerIndex < 0) {
      headerIndex = 0;
      warnings.push("Expected headings were not found; column positions were used.");
    }
    const seen = new Map();
    rows.slice(headerIndex + 1).forEach((row, offset) => {
      if (!row.some(value => String(value || "").trim())) return;
      const line = headerIndex + offset + 2;
      const participant = {
        firstName: normalizeName(row[0]), lastName: normalizeName(row[1]), groupName: normalizeText(row[2]),
        genius1: normalizeType(row[3]), genius2: normalizeType(row[4]),
        competency1: normalizeType(row[5]), competency2: normalizeType(row[6]),
        frustration1: normalizeType(row[7]), frustration2: normalizeType(row[8]), sortOrder: participants.length + 1
      };
      if ([row[0], row[1], row[2]].some(value => String(value || "") !== String(value || "").trim() || /\s{2,}/.test(String(value || "")))) warnings.push(`Row ${line}: unexpected whitespace was normalized.`);
      if (!participant.firstName || !participant.lastName) errors.push(`Row ${line}: first and last name are required.`);
      if (!participant.groupName) warnings.push(`Row ${line}: group name is blank.`);
      const rawResults = row.slice(3, 9).map(value => String(value || "").trim());
      const results = [participant.genius1, participant.genius2, participant.competency1, participant.competency2, participant.frustration1, participant.frustration2];
      rawResults.forEach((value, index) => { if (value && !results[index]) errors.push(`Row ${line}: invalid Working Genius value "${value}".`); });
      if (results.some(value => !value)) errors.push(`Row ${line}: exactly two Geniuses, Competencies, and Frustrations are required.`);
      if (new Set(results.filter(Boolean)).size !== 6) errors.push(`Row ${line}: all six Working Genius types must appear exactly once.`);
      const key = participantKey(participant);
      if (seen.has(key)) {
        const previous = seen.get(key);
        if (JSON.stringify(results) === JSON.stringify(previous.results)) warnings.push(`Row ${line}: duplicate ${participant.firstName} ${participant.lastName} was ignored.`);
        else errors.push(`Row ${line}: conflicting duplicate results for ${participant.firstName} ${participant.lastName}.`);
        return;
      }
      seen.set(key, { results });
      participants.push(participant);
    });
    if (!participants.length) errors.push("No participant rows were found.");
    const groups = [...new Set(participants.map(row => row.groupName).filter(Boolean))];
    if (groups.length > 1) warnings.push(`Multiple group names found: ${groups.join(", ")}.`);
    return { fileName, worksheet: "Individual Results", participants, groups, groupName: groups[0] || "", errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
  }

  function deriveTeamView(results, leaderId) {
    const normalized = results.map(row => ({
      id: row.AssessmentResultID || row.id, firstName: row.FirstName || row.firstName, lastName: row.LastName || row.lastName,
      genius1: row.Genius1 || row.genius1, genius2: row.Genius2 || row.genius2,
      competency1: row.Competency1 || row.competency1, competency2: row.Competency2 || row.competency2,
      frustration1: row.Frustration1 || row.frustration1, frustration2: row.Frustration2 || row.frustration2
    }));
    const leader = normalized.find(row => String(row.id) === String(leaderId)) || null;
    const cards = TYPES.map(type => {
      const geniusActual = normalized.filter(row => row.genius1 === type || row.genius2 === type);
      const frustrationActual = normalized.filter(row => row.frustration1 === type || row.frustration2 === type);
      const competencyActual = normalized.filter(row => row.competency1 === type || row.competency2 === type);
      const geniusWeighted = [...geniusActual];
      const frustrationWeighted = [...frustrationActual];
      if (leader && geniusActual.some(row => row.id === leader.id)) geniusWeighted.push(leader);
      if (leader && frustrationActual.some(row => row.id === leader.id)) frustrationWeighted.push(leader);
      const sortPeople = people => people.sort((a, b) => `${a.lastName}|${a.firstName}`.localeCompare(`${b.lastName}|${b.firstName}`));
      return { type, abbreviation: type[0], geniusActual: sortPeople(geniusActual), geniusWeighted: sortPeople(geniusWeighted), frustrationActual: sortPeople(frustrationActual), frustrationWeighted: sortPeople(frustrationWeighted), competencyCount: competencyActual.length };
    });
    return {
      actualParticipants: normalized.length, leader, cards,
      weightedGeniusPlacements: normalized.length * 2 + (leader ? 2 : 0),
      weightedFrustrationPlacements: normalized.length * 2 + (leader ? 2 : 0),
      geniusCoverage: cards.every(card => card.geniusActual.length > 0)
    };
  }

  function compareParticipants(existingRows, uploadedRows) {
    const fields = ["groupName", "genius1", "genius2", "competency1", "competency2", "frustration1", "frustration2"];
    const normalizedExisting = existingRows.map(row => ({
      source: row, firstName: row.FirstName, lastName: row.LastName, groupName: row.GroupName,
      genius1: row.Genius1, genius2: row.Genius2, competency1: row.Competency1, competency2: row.Competency2, frustration1: row.Frustration1, frustration2: row.Frustration2
    }));
    const existingByKey = new Map(normalizedExisting.map(row => [participantKey(row), row]));
    const uploadedKeys = new Set();
    const comparison = { newParticipants: [], unchanged: [], updated: [], omitted: [] };
    uploadedRows.forEach(row => {
      const key = participantKey(row);
      uploadedKeys.add(key);
      const existing = existingByKey.get(key);
      if (!existing) comparison.newParticipants.push(row);
      else {
        const changes = fields.filter(field => String(existing[field] || "") !== String(row[field] || "")).map(field => ({ field, before: existing[field] || "", after: row[field] || "" }));
        if (changes.length) comparison.updated.push({ existing: existing.source, uploaded: row, changes });
        else comparison.unchanged.push(row);
      }
    });
    normalizedExisting.forEach(row => { if (!uploadedKeys.has(participantKey(row))) comparison.omitted.push(row.source); });
    comparison.finalMergeCount = existingRows.length + comparison.newParticipants.length;
    comparison.finalReplaceCount = uploadedRows.length;
    return comparison;
  }

  return { TYPES, parseFile, validateRows, normalizeName, participantKey, deriveTeamView, compareParticipants };
})();

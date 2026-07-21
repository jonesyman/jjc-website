const fs = require("fs");
const vm = require("vm");
global.window = global;
vm.runInThisContext(fs.readFileSync("assets/js/teamMapAnalysis.js", "utf8"));

let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; } }
function assert(value, message) { if (!value) throw new Error(message); }
const types = TeamMapAnalysis.TYPES;
const person = (id, genius, frustration, competency) => ({ AssessmentResultID:id, FirstName:`Person${id}`, Genius1:genius[0], Genius2:genius[1], Frustration1:frustration[0], Frustration2:frustration[1], ...(competency ? {Competency1:competency[0],Competency2:competency[1]} : {}) });
const complement = (genius, frustration) => types.filter(type=>![...genius,...frustration].includes(type));
const make = (id, genius, frustration) => person(id,genius,frustration,complement(genius,frustration));
const metric = (distribution,type) => distribution.metrics.find(item=>item.type===type);

test("defaults normalize",()=>assert(TeamMapAnalysis.normalizeSettings({}).MaximumAutomaticObservations===8,"defaults missing"));
test("competencies derive from G and F",()=>{const row=person(1,["Wonder","Invention"],["Enablement","Tenacity"]);assert(TeamMapAnalysis.deriveParticipantCompetencies(row).join(",")==="Discernment,Galvanizing","derive failed");});
test("valid participant has 2G 2C 2F",()=>assert(TeamMapAnalysis.validateTeamMapAnalysisData([make(1,["Wonder","Invention"],["Enablement","Tenacity"])]).valid,"should validate"));
test("invalid overlapping placements are rejected",()=>assert(!TeamMapAnalysis.validateTeamMapAnalysisData([person(1,["Wonder","Wonder"],["Enablement","Tenacity"],["Invention","Discernment"])]).valid,"should reject"));
test("duplicates are rejected",()=>assert(!TeamMapAnalysis.validateTeamMapAnalysisData([make(1,["Wonder","Invention"],["Enablement","Tenacity"]),make(1,["Wonder","Invention"],["Enablement","Tenacity"])]).valid,"duplicate not rejected"));
const base=[make(1,["Wonder","Invention"],["Enablement","Tenacity"]),make(2,["Wonder","Discernment"],["Galvanizing","Tenacity"]),make(3,["Enablement","Tenacity"],["Wonder","Invention"]),make(4,["Galvanizing","Tenacity"],["Wonder","Discernment"])];
test("actual team size counts unique participants",()=>assert(TeamMapAnalysis.calculateTeamMapDistribution(base,"",{}).actualTeamSize===4,"wrong actual size"));
test("missing leader leaves denominator unweighted",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"missing",{});assert(d.weightedTeamSize===4&&!d.leaderWeightingApplied,"unexpected weighting");});
test("leader adds one Genius and Frustration influence point only",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"1",{});assert(d.weightedTeamSize===5,"wrong denominator");assert(metric(d,"Wonder").weightedGeniusCount===metric(d,"Wonder").actualGeniusCount+1,"G not weighted");assert(metric(d,"Enablement").weightedFrustrationCount===metric(d,"Enablement").actualFrustrationCount+1,"F not weighted");const geniusAdds=d.metrics.reduce((n,m)=>n+m.weightedGeniusCount-m.actualGeniusCount,0),frustrationAdds=d.metrics.reduce((n,m)=>n+m.weightedFrustrationCount-m.actualFrustrationCount,0);assert(geniusAdds===2&&frustrationAdds===2,"leader should add exactly 2G and 2F");});
test("leader weighting can be disabled",()=>assert(TeamMapAnalysis.calculateTeamMapDistribution(base,"1",{IncludeLeaderWeighting:false}).weightedTeamSize===4,"disable ignored"));
test("absent Genius is classified",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"",{});assert(metric(d,"Discernment").actualGeniusCount>0,"fixture wrong");const x=[make(1,["Wonder","Invention"],["Enablement","Tenacity"]),make(2,["Galvanizing","Tenacity"],["Wonder","Invention"])];const dx=TeamMapAnalysis.calculateTeamMapDistribution(x,"",{});assert(metric(dx,"Discernment").classifications.includes("Absent Genius"),"absent not classified");});
test("high frustration is classified",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"",{});assert(metric(d,"Wonder").classifications.some(x=>x.includes("Frustration")),"high F absent");});
test("competency-heavy is classified",()=>{const rows=[1,2,3].map(id=>make(id,["Wonder","Invention"],["Enablement","Tenacity"]));const d=TeamMapAnalysis.calculateTeamMapDistribution(rows,"",{});assert(metric(d,"Discernment").classifications.some(x=>x.includes("competency-heavy")),"competency-heavy absent");});
test("small team remains calculable",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution([base[0]],"",{});assert(d.validation.valid&&d.actualTeamSize===1,"small team failed");});
test("observation cap is honored",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"",{MaximumAutomaticObservations:2});assert(TeamMapAnalysis.generateTeamObservations(d).length<=2,"cap ignored");});
test("consultant questions can be disabled",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"",{IncludeConsultantQuestions:false});assert(TeamMapAnalysis.generateConsultantQuestions(d).length===0,"questions not disabled");});
test("suggestions provide all editable fields",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"1",{});const s=TeamMapAnalysis.suggestedAnalysis(d);assert(Object.keys(s).length===7&&s.LeaderInfluence,"suggestions incomplete");});
test("automatic language is cautious",()=>{const d=TeamMapAnalysis.calculateTeamMapDistribution(base,"1",{});const text=TeamMapAnalysis.generateTeamObservations(d).map(x=>x.text).join(" ");assert(/may|possible|suggest|could/i.test(text),"caution missing");});
test("admin inline scripts parse",()=>{const html=fs.readFileSync("admin/index.html","utf8");const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(Boolean);scripts.forEach(source=>new Function(source));assert(scripts.length>0,"no inline script found");});
test("Apps Script backend parses",()=>{new Function(fs.readFileSync("apps-script/Code.gs","utf8"));});
test("analysis persistence actions are wired",()=>{const backend=fs.readFileSync("apps-script/Code.gs","utf8"),transport=fs.readFileSync("assets/js/googleSheets.js","utf8");assert(backend.includes('action === "getTeamMapAnalysis"')&&backend.includes('action === "saveTeamMapAnalysis"')&&transport.includes("getTeamMapAnalysis")&&transport.includes("saveTeamMapAnalysis"),"persistence wiring missing");});
test("Team Map pages share balanced column flow",()=>{const html=fs.readFileSync("admin/index.html","utf8");assert(html.includes("--team-map-name-size:15px")&&html.includes("const useTwoColumns = people.length > 8")&&!html.includes("firstColumnCapacity")&&!html.includes("balanceColumns"),"shared page flow missing");});

console.log(`${passed} Team Map analysis tests passed.`);

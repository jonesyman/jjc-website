// Jeff Jones Consulting - centralized Working Genius Team Map analysis.
window.TeamMapAnalysis = (() => {
  const TYPES = ["Wonder", "Invention", "Discernment", "Galvanizing", "Enablement", "Tenacity"];
  const DEFAULTS = Object.freeze({
    AnalysisEnabled:true, MissingGeniusThresholdPercent:15, UnderrepresentedGeniusThresholdPercent:15,
    WellRepresentedGeniusThresholdPercent:35, HighlyRepresentedGeniusThresholdPercent:50,
    HighFrustrationThresholdPercent:35, VeryHighFrustrationThresholdPercent:50,
    CompetencyHeavyThresholdPercent:40, StronglyCompetencyHeavyThresholdPercent:60,
    BalancedSpreadThresholdPercent:10, OveruseGeniusThresholdPercent:50,
    OveruseFrustrationMaximumPercent:15, MinimumTeamSizeForAnalysis:3,
    IncludeLeaderWeighting:true, IncludeCompetencyAnalysis:true, IncludeConsultantQuestions:true,
    IncludeMethodologyNote:true, MaximumAutomaticObservations:8
  });
  const CONTENT = {
    Wonder:{ healthy:"noticing opportunities, concerns, and unmet needs", missing:"Important changes or unmet needs may receive too little attention while the team stays busy executing.", overuse:"Possibility-thinking may continue too long or reopen settled questions.", competency:"The team may be able to question current approaches without finding that work consistently energizing.", question:"Where does the team intentionally pause to identify opportunities, concerns, or unmet needs?" },
    Invention:{ healthy:"generating original ideas and new solutions", missing:"The team may rely on familiar answers when persistent problems call for new options.", overuse:"New solutions may continue after the team has moved into implementation.", competency:"Idea generation may be available when required, but sustaining it could demand extra energy.", question:"When the team encounters a recurring problem, how does it create genuinely new options?" },
    Discernment:{ healthy:"evaluating and refining ideas through judgment and pattern recognition", missing:"Weak ideas may advance too far, while promising ideas may receive too little refinement.", overuse:"Analysis or unexplained judgment may slow decisions or dismiss ideas too quickly.", competency:"Evaluation may be broadly available but could become tiring when the team depends on it repeatedly.", question:"How does this team determine whether an idea is good enough to pursue?" },
    Galvanizing:{ healthy:"building enthusiasm and shared commitment", missing:"Strong ideas may struggle to gain momentum or visible sponsorship.", overuse:"The team may mobilize around too many initiatives before alignment exists.", competency:"People may be able to rally others when needed without wanting to carry that demand continuously.", question:"Who creates shared commitment after the team chooses a direction?" },
    Enablement:{ healthy:"providing practical, responsive support", missing:"Initiatives may stall when collaboration or timely support is unavailable.", overuse:"Support may spread too thin or keeping everyone satisfied may outrank strategic priorities.", competency:"The team may depend on capable helpers whose support work is not consistently energizing.", question:"How does the team decide what to support and what not to support?" },
    Tenacity:{ healthy:"driving work to completion with standards and accountability", missing:"Projects may remain incomplete or follow-through may depend on external pressure.", overuse:"Execution may begin before ideas are sufficiently explored, or completion may override needed input.", competency:"Finishing work may be possible for many people without being a sustainable source of energy.", question:"What helps this team carry its most important work all the way through completion?" }
  };
  const FACILITATOR_CONTENT = {
    Wonder:{ balanced:"The team appears able to notice needs and possibilities without remaining in question mode too long.", geniusHigh:"A strong pull toward Wonder may keep the team exploring needs or reopening settled questions.", geniusLow:"The team may move forward without pausing long enough to notice unmet needs, risks, or opportunities.", frustrationHigh:"Questioning assumptions may be resisted, so important concerns can be missed or surfaced too late.", frustrationLow:"Few people are drained by Wonder, which can make reflective questioning broadly accessible.", competency:"Wonder is available when needed, but the team may not have much natural energy or strong resistance around it." },
    Invention:{ balanced:"The team appears to have workable access to new ideas without continually reinventing solutions.", geniusHigh:"A strong pull toward Invention may generate more ideas than the team can evaluate or implement.", geniusLow:"The team may revisit the same problems, rely on familiar answers, or remain stuck in the status quo.", frustrationHigh:"Creating original options may be difficult to sustain, increasing the risk of recycling familiar solutions.", frustrationLow:"Few people are drained by generating ideas, so invention may be accessible even when it is not prominent.", competency:"Invention is available as a capability, but repeatedly asking for new ideas may consume more energy than it creates." },
    Discernment:{ balanced:"The team appears able to evaluate ideas without allowing judgment to dominate forward movement.", geniusHigh:"A strong pull toward Discernment can create analysis paralysis, unexplained judgment, or slow decisions.", geniusLow:"Ideas may advance without enough intuitive evaluation, pattern recognition, or refinement.", frustrationHigh:"The team may avoid evaluation or experience judgment as friction, allowing weak ideas to travel too far.", frustrationLow:"Few people are drained by evaluation, which may make careful judgment easier to access.", competency:"Discernment is broadly available, but sustained evaluation may become tiring if the team relies on it too heavily." },
    Galvanizing:{ balanced:"The team appears able to build commitment without creating unnecessary urgency around every initiative.", geniusHigh:"A strong pull toward Galvanizing may mobilize the team before sufficient alignment or prioritization exists.", geniusLow:"Good ideas may struggle to gain sponsorship, enthusiasm, or visible momentum.", frustrationHigh:"Rallying others may be avoided or exhausting, leaving initiatives without the energy needed to move.", frustrationLow:"Few people are drained by mobilizing others, so momentum-building may be relatively accessible.", competency:"Galvanizing can be supplied when needed, but repeatedly carrying group energy may not be sustainable." },
    Enablement:{ balanced:"The team appears able to provide support while maintaining reasonable boundaries and priorities.", geniusHigh:"A strong pull toward Enablement may spread support too thin or place responsiveness ahead of strategic priorities.", geniusLow:"Plans may stall because timely support, collaboration, or practical help is not naturally supplied.", frustrationHigh:"Requests for help may meet resistance or fatigue, creating bottlenecks when execution requires collaboration.", frustrationLow:"Few people are drained by helping, which may make support readily available across the team.", competency:"Enablement is available as a skill, but frequent support demands may quietly deplete the people providing it." },
    Tenacity:{ balanced:"The team appears able to finish work without allowing execution pressure to dominate every decision.", geniusHigh:"The team may rush to tactics and execution early or overemphasize projects at the expense of the team.", geniusLow:"Work may lose momentum near completion, and accountability may depend on outside pressure.", frustrationHigh:"Sustained follow-through may be draining, increasing the risk that projects remain unfinished.", frustrationLow:"Few people are drained by completion work, which may make follow-through easier to distribute.", competency:"Tenacity is available when required, but repeated execution and finishing demands may not be energizing." }
  };
  const STAGES = [
    {name:"Ideation",types:["Wonder","Invention"],purpose:"noticing needs and creating new options"},
    {name:"Activation",types:["Discernment","Galvanizing"],purpose:"evaluating ideas and building commitment"},
    {name:"Implementation",types:["Enablement","Tenacity"],purpose:"supporting the work and carrying it through completion"}
  ];
  const bool = (value, fallback) => value === undefined || value === "" ? fallback : ![false,"false",0,"0","no"].includes(typeof value === "string" ? value.toLowerCase() : value);
  const num = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  function normalizeSettings(source={}) { const out={}; Object.entries(DEFAULTS).forEach(([key,value]) => out[key]=typeof value === "boolean" ? bool(source[key],value) : num(source[key],value)); return out; }
  function participantName(row) { return String(row.DisplayName || `${row.FirstName || row.firstName || ""} ${row.LastName || row.lastName || ""}`).trim() || "Unnamed participant"; }
  function normalizedPair(row, upper, lower) { return [row[upper+"1"] || row[lower+"1"], row[upper+"2"] || row[lower+"2"]].map(value=>String(value||"").trim()).filter(Boolean); }
  function participantKey(row,index=0) { return String(row.AssessmentResultID||row.PersonID||row.id||participantName(row).toLowerCase()||`participant-${index}`).trim(); }
  function deriveParticipantCompetencies(row) {
    const explicit=normalizedPair(row,"Competency","competency");
    if(explicit.length===2 && new Set(explicit).size===2 && explicit.every(type=>TYPES.includes(type))) return explicit;
    const occupied=new Set([...normalizedPair(row,"Genius","genius"),...normalizedPair(row,"Frustration","frustration")]);
    return TYPES.filter(type=>!occupied.has(type));
  }
  function validateTeamMapAnalysisData(results) {
    const errors=[], seen=new Set(); (results||[]).forEach((row,index)=>{
      const key=participantKey(row,index);
      if(seen.has(key)) errors.push(`${participantName(row)}: appears more than once; each participant must be unique.`);
      seen.add(key);
      const genius=normalizedPair(row,"Genius","genius"), frustration=normalizedPair(row,"Frustration","frustration"), competency=deriveParticipantCompetencies(row);
      const all=[...genius,...competency,...frustration];
      if(genius.length!==2 || competency.length!==2 || frustration.length!==2 || all.some(type=>!TYPES.includes(type)) || new Set(all).size!==6) errors.push(`${participantName(row)}: requires two unique Geniuses, Competencies, and Frustrations covering all six types.`);
    });
    return { valid:errors.length===0, errors };
  }
  function classifyGeniusDistribution(metric,s) {
    const labels=[];
    if(metric.actualGeniusCount===0) labels.push("Absent Genius");
    else if(metric.weightedGeniusRate<s.UnderrepresentedGeniusThresholdPercent) labels.push("Underrepresented Genius");
    if(metric.weightedGeniusRate>=s.HighlyRepresentedGeniusThresholdPercent) labels.push("Highly represented");
    else if(metric.weightedGeniusRate>=s.WellRepresentedGeniusThresholdPercent) labels.push("Well represented");
    if(metric.weightedFrustrationRate>=s.VeryHighFrustrationThresholdPercent) labels.push("Very high Frustration");
    else if(metric.weightedFrustrationRate>=s.HighFrustrationThresholdPercent) labels.push("High Frustration");
    if(metric.weightedGeniusRate<s.MissingGeniusThresholdPercent && metric.weightedFrustrationRate>=s.HighFrustrationThresholdPercent) labels.unshift("Likely missing");
    if(metric.weightedGeniusRate>=s.OveruseGeniusThresholdPercent && metric.weightedFrustrationRate<=s.OveruseFrustrationMaximumPercent) labels.unshift("Potential overuse risk");
    if(Math.abs(metric.spread)<=s.BalancedSpreadThresholdPercent && metric.weightedGeniusCount && metric.weightedFrustrationCount) labels.push("Balanced / monitor");
    if(s.IncludeCompetencyAnalysis && metric.actualCompetencyRate>=s.StronglyCompetencyHeavyThresholdPercent) labels.push("Strongly competency-heavy");
    else if(s.IncludeCompetencyAnalysis && metric.actualCompetencyRate>=s.CompetencyHeavyThresholdPercent) labels.push("Competency-heavy");
    return [...new Set(labels)];
  }
  function calculateTeamMapDistribution(results,leaderResultId,sourceSettings={}) {
    const settings=normalizeSettings(sourceSettings), validation=validateTeamMapAnalysisData(results); if(!validation.valid) return {validation,settings,metrics:[],actualTeamSize:0,weightedTeamSize:0};
    const unique=new Map(); (results||[]).forEach((row,index)=>{const key=participantKey(row,index);if(!unique.has(key))unique.set(key,row);});
    const rows=[...unique.values()].map((row,index)=>({row,id:String(row.AssessmentResultID||row.PersonID||row.id||participantKey(row,index)),genius:normalizedPair(row,"Genius","genius"),competency:deriveParticipantCompetencies(row),frustration:normalizedPair(row,"Frustration","frustration")}));
    const leader=rows.find(item=>item.id===String(leaderResultId||""))||null, weighted=settings.IncludeLeaderWeighting&&leader;
    const actualTeamSize=rows.length, weightedTeamSize=actualTeamSize+(weighted?1:0), pct=(n,d)=>d?Math.round(n/d*100):0;
    const metrics=TYPES.map(type=>{ const ag=rows.filter(x=>x.genius.includes(type)).length, ac=rows.filter(x=>x.competency.includes(type)).length, af=rows.filter(x=>x.frustration.includes(type)).length; const wg=ag+(weighted&&leader.genius.includes(type)?1:0), wf=af+(weighted&&leader.frustration.includes(type)?1:0); const metric={type,actualGeniusCount:ag,actualGeniusRate:pct(ag,actualTeamSize),actualCompetencyCount:ac,actualCompetencyRate:pct(ac,actualTeamSize),actualFrustrationCount:af,actualFrustrationRate:pct(af,actualTeamSize),weightedGeniusCount:wg,weightedGeniusRate:pct(wg,weightedTeamSize),weightedFrustrationCount:wf,weightedFrustrationRate:pct(wf,weightedTeamSize)}; metric.spread=metric.weightedGeniusRate-metric.weightedFrustrationRate; metric.classifications=classifyGeniusDistribution(metric,settings); return metric; });
    return {validation,settings,metrics,actualTeamSize,weightedTeamSize,leader:leader?.row||null,leaderWeightingApplied:Boolean(weighted)};
  }
  const priorities={"Likely missing":1,"Absent Genius":2,"Very high Frustration":3,"Potential overuse risk":4,"Strongly competency-heavy":5,"Highly represented":6,"Balanced / monitor":7,"Competency-heavy":8,"Well represented":9,"High Frustration":10,"Underrepresented Genius":11};
  function generateGeniusDiagnostic(metric) { const c=metric.classifications, content=CONTENT[metric.type]; let label=c[0]||"Distribution note", text=""; if(c.includes("Likely missing")) text=`No or limited weighted Genius influence is paired with ${metric.weightedFrustrationRate}% weighted Frustration. ${content.missing}`; else if(c.includes("Absent Genius")) text=`No participant has ${metric.type} as a Genius. ${content.missing}`; else if(c.includes("Potential overuse risk")) text=`${metric.weightedGeniusRate}% weighted Genius influence and ${metric.weightedFrustrationRate}% weighted Frustration suggest a strong directional pull. ${content.overuse}`; else if(c.includes("Very high Frustration")||c.includes("High Frustration")) text=`${metric.weightedFrustrationRate}% weighted Frustration indicates a possible risk worth exploring. ${content.missing}`; else if(c.includes("Strongly competency-heavy")||c.includes("Competency-heavy")) text=`${metric.actualCompetencyRate}% of participants hold ${metric.type} as a Competency. ${content.competency}`; else if(c.includes("Highly represented")||c.includes("Well represented")) text=`${metric.weightedGeniusRate}% weighted Genius influence may strengthen ${content.healthy}. ${content.overuse}`; else if(c.includes("Balanced / monitor")) text=`Genius and Frustration influence are close. This may provide healthy tension, inconsistent use, or differing team experiences.`; else return null; return {type:metric.type,label,text,priority:Math.min(...c.map(x=>priorities[x]||99))}; }
  function rankAnalysisObservations(items) { return [...items].sort((a,b)=>a.priority-b.priority||a.type.localeCompare(b.type)); }
  function generateTeamObservations(distribution) { return rankAnalysisObservations(distribution.metrics.map(generateGeniusDiagnostic).filter(Boolean)).slice(0,distribution.settings.MaximumAutomaticObservations); }
  function generateConsultantQuestions(distribution) { if(!distribution.settings.IncludeConsultantQuestions)return[]; const types=generateTeamObservations(distribution).slice(0,4).map(x=>x.type); return [...new Set(types)].map(type=>CONTENT[type].question).slice(0,4); }
  function suggestedAnalysis(distribution) { const obs=generateTeamObservations(distribution), contribution=obs.find(x=>/represented|overuse/i.test(x.label)), risk=obs[0], competency=obs.find(x=>/competency/i.test(x.label)); return { OverallTeamPattern:obs.slice(0,2).map(x=>`${x.type}: ${x.label}`).join("; "), MostSignificantStrength:contribution?`${contribution.type}: ${contribution.text}`:"No single Working Genius contribution rose above the configured thresholds; consider exploring where the team experiences its most reliable energy.", MostSignificantRisk:risk?`${risk.type}: ${risk.text}`:"No major automatic area to explore rose above the configured thresholds.", CompetencySustainabilityObservation:competency?`${competency.type}: ${competency.text}`:"No single competency-heavy type rose above the configured thresholds. Review whether frequently requested competency work is sustainable for the people providing it.", AdditionalConsultantNotes:"" }; }
  function distributionDirection(rate,low,high) { return rate<low?"low":rate>=high?"high":"balanced"; }
  function facilitatorTypeAnalysis(metric,settings) {
    const content=FACILITATOR_CONTENT[metric.type], genius=distributionDirection(metric.weightedGeniusRate,settings.UnderrepresentedGeniusThresholdPercent,settings.HighlyRepresentedGeniusThresholdPercent), frustration=distributionDirection(metric.weightedFrustrationRate,settings.UnderrepresentedGeniusThresholdPercent,settings.HighFrustrationThresholdPercent);
    const competencyHeavy=metric.actualCompetencyRate>=settings.CompetencyHeavyThresholdPercent&&genius!=="high"&&frustration!=="high";
    const candidates=[];
    if(genius==="high")candidates.push({subject:metric.type,area:"Genius",color:"green",status:"Overuse",note:content.geniusHigh,rate:metric.weightedGeniusRate,severity:Math.abs(metric.weightedGeniusRate-33)});
    else if(genius==="low")candidates.push({subject:metric.type,area:"Genius",color:"green",status:"Missing / low Genius",note:content.geniusLow,rate:metric.weightedGeniusRate,severity:Math.abs(metric.weightedGeniusRate-33)});
    if(frustration==="high")candidates.push({subject:metric.type,area:"Frustration",color:"red",status:"High Frustration",note:content.frustrationHigh,rate:metric.weightedFrustrationRate,severity:Math.abs(metric.weightedFrustrationRate-33)});
    else if(frustration==="low")candidates.push({subject:metric.type,area:"Frustration",color:"red",status:"Low Frustration",note:content.frustrationLow,rate:metric.weightedFrustrationRate,severity:Math.abs(metric.weightedFrustrationRate-33)});
    if(competencyHeavy)candidates.push({subject:metric.type,area:"Competency",color:"yellow",status:"Competency-heavy",note:content.competency,rate:metric.actualCompetencyRate,severity:Math.abs(metric.actualCompetencyRate-33)});
    const highlight=candidates.sort((a,b)=>b.severity-a.severity)[0]||null;
    return {type:metric.type,abbreviation:metric.type[0],status:highlight?.status||"Balance",note:highlight?.note||content.balanced,highlights:highlight?[highlight]:[],rates:{genius:metric.weightedGeniusRate,competency:metric.actualCompetencyRate,frustration:metric.weightedFrustrationRate}};
  }
  function aggregateDimension(distribution,label,types,shareTarget) {
    const metrics=distribution.metrics.filter(metric=>types.includes(metric.type)), denominator=Math.max(1,distribution.weightedTeamSize*2);
    const geniusRate=Math.round(metrics.reduce((sum,metric)=>sum+metric.weightedGeniusCount,0)/denominator*100), frustrationRate=Math.round(metrics.reduce((sum,metric)=>sum+metric.weightedFrustrationCount,0)/denominator*100);
    const margin=shareTarget===50?10:8, classify=rate=>rate<shareTarget-margin?"underrepresented":rate>shareTarget+margin?"overrepresented":"balanced";
    return {label,types,geniusRate,frustrationRate,geniusStatus:classify(geniusRate),frustrationStatus:classify(frustrationRate)};
  }
  function generateFacilitatorAnalysis(distribution) {
    if(!distribution?.validation?.valid)return {valid:false,errors:distribution?.validation?.errors||["Team Map data is invalid."]};
    const typeAnalyses=distribution.metrics.map(metric=>facilitatorTypeAnalysis(metric,distribution.settings));
    const stages=STAGES.map(stage=>({...aggregateDimension(distribution,stage.name,stage.types,33),purpose:stage.purpose}));
    const orientations=[
      aggregateDimension(distribution,"Responsive",["Wonder","Discernment","Enablement"],50),
      aggregateDimension(distribution,"Disruptive",["Invention","Galvanizing","Tenacity"],50)
    ];
    const typeHighlights=typeAnalyses.flatMap(item=>item.highlights);
    const dominantDimensionHighlight=(items,minimum,target)=>{
      const candidates=[];
      items.forEach(item=>{
        if(item.geniusRate>=minimum)candidates.push({subject:item.label,area:"Genius",color:"green",rate:item.geniusRate,severity:item.geniusRate-target});
        if(item.frustrationRate>=minimum)candidates.push({subject:item.label,area:"Frustration",color:"red",rate:item.frustrationRate,severity:item.frustrationRate-target});
      });
      return candidates.sort((a,b)=>b.severity-a.severity).slice(0,1);
    };
    const stageHighlights=dominantDimensionHighlight(stages,50,33);
    const orientationHighlights=dominantDimensionHighlight(orientations,75,50);
    const highlightGroups={types:typeHighlights,stages:stageHighlights,orientations:orientationHighlights};
    return {valid:true,highlights:[...typeHighlights,...stageHighlights,...orientationHighlights],highlightGroups,typeAnalyses,stages,orientations};
  }
  function facilitatorNotesText(distribution,title="Team") {
    const analysis=generateFacilitatorAnalysis(distribution);
    if(!analysis.valid)return `Unable to generate facilitator notes for ${title}:\n${analysis.errors.join("\n")}`;
    const highlightLine=item=>`- ${item.subject}: outline ${item.area} in ${item.color[0].toUpperCase()+item.color.slice(1)}`;
    const highlightSection=(label,items)=>[label,...(items.length?items.map(highlightLine):["- No highlight recommended."])];
    const typeLines=analysis.typeAnalyses.map(item=>`[${item.abbreviation}] ${item.type.toUpperCase()} — ${item.status}: ${item.note} Distribution: ${item.rates.genius}% Genius, ${item.rates.competency}% Competency, ${item.rates.frustration}% Frustration.`);
    const stageLines=analysis.stages.map(stage=>`[${stage.label.toUpperCase()}] (${stage.types.map(type=>type[0]).join("/")}): Genius ${stage.geniusStatus} (${stage.geniusRate}%); Frustration ${stage.frustrationStatus} (${stage.frustrationRate}%). Watch how the team handles ${stage.purpose}.`);
    const orientationLines=analysis.orientations.map(item=>`[${item.label.toUpperCase()}] (${item.types.map(type=>type[0]).join("/")}): Genius ${item.geniusStatus} (${item.geniusRate}%); Frustration ${item.frustrationStatus} (${item.frustrationRate}%).`);
    return [`${title} — Team Map Facilitation Notes`,"","SUGGESTED HIGHLIGHTS",...highlightSection("Working Geniuses",analysis.highlightGroups.types),"",...highlightSection("Stages of Work",analysis.highlightGroups.stages),"",...highlightSection("Responsive / Disruptive",analysis.highlightGroups.orientations),"","SIX WORKING GENIUSES",...typeLines,"","STAGES OF WORK",...stageLines,"","RESPONSIVE / DISRUPTIVE",...orientationLines].join("\n");
  }
  return {TYPES,DEFAULTS,CONTENT,FACILITATOR_CONTENT,STAGES,normalizeSettings,deriveParticipantCompetencies,validateTeamMapAnalysisData,calculateTeamMapDistribution,classifyGeniusDistribution,generateTeamObservations,generateGeniusDiagnostic,generateConsultantQuestions,rankAnalysisObservations,suggestedAnalysis,generateFacilitatorAnalysis,facilitatorNotesText};
})();

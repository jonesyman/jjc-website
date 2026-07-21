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
  return {TYPES,DEFAULTS,CONTENT,normalizeSettings,deriveParticipantCompetencies,validateTeamMapAnalysisData,calculateTeamMapDistribution,classifyGeniusDistribution,generateTeamObservations,generateGeniusDiagnostic,generateConsultantQuestions,rankAnalysisObservations,suggestedAnalysis};
})();

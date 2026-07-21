// Global, responsive loading status with real step progress and learned time estimates.
window.LoadingStatus = (() => {
  const STORAGE_KEY = "jjc_loading_timings_v1";
  const labels = {
    settings:"Loading settings", rates:"Loading rates", clients:"Loading clients",
    workshops:"Loading workshops", estimates:"Loading estimates", invoices:"Loading invoices",
    getAssessmentWorkspace:"Loading people and groups", getAllActiveAssessmentResults:"Loading assessment analytics",
    getWorkshopAssessment:"Loading workshop assessment", getAssessmentImportHistory:"Loading assessment history",
    getEmailTemplates:"Loading email templates", getTeamMapAnalysis:"Loading Team Map analysis",
    generateEstimatePdf:"Generating estimate PDF", generateInvoicePdf:"Generating invoice PDF",
    sendEstimateEmail:"Sending estimate email", sendInvoiceEmail:"Sending invoice email"
  };
  let operation=null, requests=new Map(), timer=null, hideTimer=null, sequence=0;
  function timings(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");}catch{return{};} }
  function remember(key,elapsed){ if(!key||elapsed<150)return;const all=timings(),old=Number(all[key]||0);all[key]=Math.round(old?old*.7+elapsed*.3:elapsed);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(all));}catch{} }
  function ensure(){
    if(document.getElementById("globalLoadingStatus"))return;
    const el=document.createElement("aside"); el.id="globalLoadingStatus"; el.className="global-loading-status hidden"; el.setAttribute("role","status"); el.setAttribute("aria-live","polite");
    el.innerHTML='<div class="global-loading-head"><span class="global-loading-spinner" aria-hidden="true"></span><div><strong id="globalLoadingTitle">Loading</strong><div id="globalLoadingDetail" class="global-loading-detail"></div></div><span id="globalLoadingPercent" class="global-loading-percent"></span></div><div class="global-loading-track"><span id="globalLoadingBar"></span></div><div id="globalLoadingTime" class="global-loading-time"></div>';
    document.body.appendChild(el);
  }
  function seconds(ms){return Math.max(1,Math.ceil(ms/1000));}
  function render(){
    ensure(); const el=document.getElementById("globalLoadingStatus"); if(!el)return;
    const request=[...requests.values()].sort((a,b)=>b.id-a.id)[0], active=operation||request;
    if(!active){ clearInterval(timer);timer=null;hideTimer=setTimeout(()=>el.classList.add("hidden"),350);return; }
    clearTimeout(hideTimer);el.classList.remove("hidden");
    const elapsed=Date.now()-active.started, known=active.total>0, progress=known?Math.min(100,Math.round(active.completed/active.total*100)):null;
    document.getElementById("globalLoadingTitle").textContent=active.title;
    document.getElementById("globalLoadingDetail").textContent=active.detail|| (requests.size>1?`${requests.size} items loading in parallel`:"Working in the background");
    document.getElementById("globalLoadingPercent").textContent=progress===null?"":`${progress}%`;
    const bar=document.getElementById("globalLoadingBar");bar.style.width=progress===null?"35%":`${Math.max(4,progress)}%`;bar.classList.toggle("indeterminate",progress===null);
    let timeText="";
    if(known&&active.completed<active.total){ const remaining=active.estimate?Math.max(0,active.estimate-elapsed):(active.completed>=2?(elapsed/active.completed)*(active.total-active.completed):0);timeText=remaining?`About ${seconds(remaining)} sec remaining`:(active.estimate?"Finishing up…":"Estimating time remaining…"); }
    else if(active.estimate){ const remaining=Math.max(0,active.estimate-elapsed);timeText=remaining?`About ${seconds(remaining)} sec remaining`:`Finishing up…`; }
    else timeText=elapsed<1200?"Estimating time remaining…":"Still working…";
    document.getElementById("globalLoadingTime").textContent=timeText;
    if(!timer)timer=setInterval(render,500);
  }
  function start(title,total=0,key=""){ const estimate=key?Number(timings()[key]||0):0;operation={id:++sequence,title,detail:"Starting…",total:Number(total)||0,completed:0,started:Date.now(),estimate,key};render();return{
    step(detail,count=1){if(!operation)return;operation.detail=detail;operation.completed=Math.min(operation.total||Infinity,operation.completed+count);render();},
    done(detail="Complete"){if(!operation)return;if(operation.key)remember(operation.key,Date.now()-operation.started);operation.detail=detail;operation.completed=operation.total;render();operation=null;setTimeout(render,250);},
    fail(detail="Unable to finish"){if(!operation)return;operation.title="Loading problem";operation.detail=detail;render();operation=null;setTimeout(render,1800);}
  }; }
  function requestStart(action){ const id=++sequence,key=String(action||"request"),stored=Number(timings()[key]||0);requests.set(id,{id,key,title:labels[key]||`Loading ${key.replace(/([a-z])([A-Z])/g,"$1 $2").toLowerCase()}`,detail:"Contacting the secure data service",started:Date.now(),estimate:stored,total:0,completed:0});render();return id; }
  function requestEnd(id,ok=true){const item=requests.get(id);if(!item)return;if(ok)remember(item.key,Date.now()-item.started);requests.delete(id);render();}
  return {start,requestStart,requestEnd};
})();

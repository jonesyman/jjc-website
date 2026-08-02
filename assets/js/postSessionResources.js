(function(){
  let workspace={resources:[],workshopGroupLinks:[],packageFiles:[],packages:[]};
  let loaded=false;
  let pendingGroupId="";

  const byId=id=>document.getElementById(id);
  const cleanTitle=name=>String(name||"").replace(/\.[^.]+$/,"").replace(/^Working Genius\s*/i,"").trim();
  const safe=value=>typeof esc==="function"?esc(value):String(value||"");
  const active=row=>!([false,"false",0,"0","inactive","archived"].includes(row?.Active));
  const currentContextId=()=>byId("postSessionWorkshop").value||byId("postSessionStandaloneId").value;
  const currentMode=()=>byId("postSessionMode").value;
  const groups=()=>typeof assessmentLibraryGroups==="function"?assessmentLibraryGroups():[];

  function resourceDescription(name){
    const key=String(name||"").toLowerCase();
    if(key.includes("activating"))return "Practical prompts for engaging a Genius that is missing or underrepresented on a team.";
    if(key.includes("collaborating"))return "Guidance and useful questions for collaborating effectively with each Working Genius.";
    if(key.includes("playbook"))return "A fillable team playbook for turning Working Genius insights into ongoing team practices.";
    if(key.includes("hiring"))return "A guide for applying Working Genius appropriately during role design and hiring conversations.";
    if(key.includes("misconception"))return "Clarifies common misunderstandings about each of the six Working Geniuses.";
    if(key.includes("missing or misuse"))return "Shows the risks created when each Genius is absent, ignored, or overused.";
    if(key.includes("pairings"))return "An overview of the fifteen Working Genius pairings and their characteristic contributions.";
    if(key.includes("meeting"))return "A guide for matching meeting types to the appropriate stages and Geniuses of work.";
    if(key.includes("norm"))return "An editable starting point for developing practical team norms and commitments.";
    if(key.includes("data")||key.includes("research"))return "Reference data about Genius frequency, pairings, stages of work, and related patterns.";
    return "A Working Genius resource for continued learning and team application.";
  }

  function categoryFor(name){
    const key=String(name||"").toLowerCase();
    if(key.includes("hiring"))return "Hiring";
    if(key.includes("meeting"))return "Meetings";
    if(key.includes("playbook")||key.includes("norm"))return "Team Development";
    if(key.includes("data")||key.includes("research"))return "Research";
    if(key.includes("pairings"))return "Genius Reference";
    return "Team Application";
  }

  async function filePayload(file){
    const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});
    return {fileName:file.name,mimeType:file.type||"application/octet-stream",base64:String(dataUrl).split(",")[1]||""};
  }

  async function refresh(force=false){
    if(loaded&&!force)return render();
    byId("postSessionLoading").classList.remove("hidden");
    try{workspace=await Database.getPostSessionWorkspace();loaded=true;render();}
    catch(err){toast(err.message||"Unable to load post-session resources.");}
    finally{byId("postSessionLoading").classList.add("hidden");}
  }

  function render(){renderResources();renderWorkshopOptions();renderGroups();renderUploadedFiles();renderHistory();}

  function renderResources(){
    const rows=(workspace.resources||[]).filter(active).sort((a,b)=>String(a.Category||"").localeCompare(String(b.Category||""))||String(a.Title||"").localeCompare(String(b.Title||"")));
    byId("postSessionResourceCount").textContent=`${rows.length} active`;
    byId("postSessionResourceLibrary").innerHTML=rows.map(row=>`<div class="record-card"><div class="record-title">${safe(row.Title)}</div><div class="tiny muted">${safe(row.Category||"General")} • ${safe(row.FileName||"")}</div><div class="small muted">${safe(row.Description||"")}</div><div class="actions"><a class="button secondary small-btn" href="https://drive.google.com/open?id=${encodeURIComponent(row.FileId||"")}" target="_blank" rel="noopener">Open</a><button class="button ghost small-btn" type="button" onclick="archivePostSessionResource('${safe(row.ResourceID)}')">Archive</button></div></div>`).join("")||'<p class="muted small">Upload your reusable resources to begin.</p>';
    byId("postSessionResourceChoices").innerHTML=rows.map(row=>{const description=row.Description||row.FileName||"";return `<label class="archive-toggle package-choice"><input type="checkbox" value="${safe(row.ResourceID)}" ${String(row.DefaultSelected).toLowerCase()==="true"?"checked":""}> <span><strong>${safe(row.Title)}</strong><small title="${safe(description)}">${safe(description)}</small></span></label>`;}).join("")||'<p class="muted small">No active resources are available.</p>';
  }

  function renderWorkshopOptions(){
    const select=byId("postSessionWorkshop"),previous=select.value;
    select.innerHTML='<option value="">Choose a workshop...</option>'+workshops.filter(w=>typeof isArchived==="function"?!isArchived(w):String(w.archived).toLowerCase()!=="true").map(w=>`<option value="${safe(w.WorkshopID)}">${safe(w.Organization||w.WorkshopID)}${w.WorkshopDate?" • "+safe(formatDate(w.WorkshopDate)):""}</option>`).join("");
    if([...select.options].some(o=>o.value===previous))select.value=previous;
  }

  function renderGroups(){
    const workshopId=byId("postSessionWorkshop").value;
    const linked=new Set((workspace.workshopGroupLinks||[]).filter(row=>String(row.WorkshopID)===workshopId).map(row=>String(row.GroupID)));
    if(pendingGroupId)linked.add(String(pendingGroupId));
    byId("postSessionGroupChoices").innerHTML=groups().filter(active).map(group=>`<label class="archive-toggle package-choice"><input type="checkbox" value="${safe(group.GroupID)}" ${linked.has(String(group.GroupID))?"checked":""} onchange="renderPostSessionAssessmentSlots()"> <span><strong>${safe(group.GroupName||group.GroupID)}</strong><small>${safe([group.Organization,group.TeamFunction].filter(Boolean).join(" • "))}</small></span></label>`).join("")||'<p class="muted small">No saved groups are available.</p>';
    renderAssessmentSlots();
  }

  function selectedGroupIds(){return [...byId("postSessionGroupChoices").querySelectorAll('input:checked')].map(input=>input.value);}

  function renderAssessmentSlots(){
    const context=currentContextId(); if(!context){byId("postSessionAssessmentSlots").innerHTML='<p class="muted small">Choose a workshop or enter a standalone package name first.</p>';return;}
    const selected=selectedGroupIds(),items=[...(currentMode()==="workshop"?[{id:"Overall",name:"Overall Team"}]:[]),...groups().filter(group=>selected.includes(String(group.GroupID))).map(group=>({id:group.GroupID,name:group.GroupName||group.GroupID}))];
    byId("postSessionAssessmentSlots").innerHTML=items.map(item=>`<div class="package-upload-row"><div><strong>${safe(item.name)}</strong><div class="tiny muted">Generated automatically from the latest saved assessment results</div></div><span class="status-badge">Automatic PDF</span></div>`).join("")||'<p class="muted small">Select a saved group to include its automatically generated Assessment Results PDF.</p>';
  }

  function renderUploadedFiles(){
    const context=currentContextId(),stored=(workspace.packageFiles||[]).filter(row=>active(row)&&String(row.ContextID)===context),presentation=stored.find(row=>String(row.FileRole)==="Presentation");
    byId("postSessionPresentationStatus").textContent=presentation?`Saved: ${presentation.DisplayName||presentation.FileName}`:"No presentation PDF saved for this package.";
  }

  function renderHistory(){
    byId("postSessionPackageHistory").innerHTML=(workspace.packages||[]).map(row=>`<div class="record-card"><div class="record-title">${safe(row.PackageName)}</div><div class="tiny muted">${safe(row.Mode||"")} • ${safe(row.CreatedDate?new Date(row.CreatedDate).toLocaleString():"")}</div><div class="actions"><a class="button small-btn" href="${safe(row.ZipUrl)}" target="_blank" rel="noopener">Open ZIP</a></div></div>`).join("")||'<p class="muted small">Generated packages will appear here.</p>';
  }

  async function poll(predicate,message){
    for(let attempt=1;attempt<=12;attempt++){await Database.wait(Math.min(3000,500+attempt*250));workspace=await Database.getPostSessionWorkspace();const value=predicate(workspace);if(value)return value;}
    throw new Error(message);
  }

  window.loadPostSessionWorkspace=refresh;
  window.renderPostSessionAssessmentSlots=renderAssessmentSlots;
  window.changePostSessionMode=function(){
    const standalone=currentMode()==="standalone";
    byId("postSessionWorkshopFields").classList.toggle("hidden",standalone);
    byId("postSessionStandaloneFields").classList.toggle("hidden",!standalone);
    byId("postSessionSaveGroups").classList.toggle("hidden",standalone);
    if(standalone&&!byId("postSessionStandaloneId").value)byId("postSessionStandaloneId").value="STANDALONE-"+crypto.randomUUID();
    renderGroups();renderUploadedFiles();
  };
  window.changePostSessionWorkshop=function(){
    const workshop=workshops.find(w=>String(w.WorkshopID)===byId("postSessionWorkshop").value)||{};
    byId("postSessionPackageName").value=workshop.Organization||"";
    byId("postSessionDateLabel").value=workshop.WorkshopDate?formatDate(workshop.WorkshopDate):(workshop.DateDescription||"");
    renderGroups();renderUploadedFiles();
  };
  window.changeStandalonePackageName=function(){renderAssessmentSlots();};

  window.openResourcePackageBuilder=async function(workshopId="",groupId=""){
    pendingGroupId=groupId||"";showView("post-session");await refresh();byId("postSessionMode").value=workshopId||groupId?"workshop":"standalone";changePostSessionMode();if(workshopId){byId("postSessionWorkshop").value=workshopId;changePostSessionWorkshop();}
    byId("postSessionBuilder").scrollIntoView({behavior:"smooth",block:"start"});
  };

  window.uploadPostSessionResources=async function(button){
    const files=[...byId("postSessionResourceFiles").files];if(!files.length)return toast("Choose one or more resource files.");
    const finish=beginSave(button,"Uploading Resources...");try{
      for(const file of files){const token="RSU-"+crypto.randomUUID(),payload=await filePayload(file);if(file.name.toLowerCase().endsWith(".zip"))await Database.importPostSessionResourceZip({...payload,uploadToken:token});else await Database.uploadPostSessionResource({...payload,title:cleanTitle(file.name),category:categoryFor(file.name),description:resourceDescription(file.name),defaultSelected:false,uploadToken:token});await poll(data=>(data.resources||[]).find(row=>String(row.UploadToken)===token),`Upload was not confirmed for ${file.name}.`);}
      byId("postSessionResourceFiles").value="";render();toast("Resource library updated.");
    }catch(err){toast(err.message||"Unable to upload resources.");}finally{finish();}
  };

  window.archivePostSessionResource=async function(id){if(!confirm("Archive this resource? Existing packages will not be changed."))return;await Database.setPostSessionResourceActive({resourceId:id,active:false});await refresh(true);toast("Resource archived.");};

  window.savePostSessionGroupLinks=async function(button){
    const workshopId=byId("postSessionWorkshop").value;if(!workshopId)return toast("Choose a workshop first.");
    const finish=beginSave(button,"Saving Groups...");try{await Database.saveWorkshopGroupLinks({workshopId,groupIds:selectedGroupIds()});pendingGroupId="";await refresh(true);toast("Workshop group associations saved.");}catch(err){toast(err.message||"Unable to save group associations.");}finally{finish();}
  };

  async function uploadPackageFile(file,contextId,role,displayName){
    const token="PSF-"+crypto.randomUUID(),payload=await filePayload(file);await Database.uploadPostSessionPackageFile({...payload,contextType:currentMode()==="workshop"?"Workshop":"Standalone",contextId,fileRole:role,displayName,uploadToken:token});return poll(data=>(data.packageFiles||[]).find(row=>String(row.UploadToken)===token),`Upload was not confirmed for ${file.name}.`);
  }

  async function renderAssessmentPdf(payload){
    if(typeof html2canvas!=="function"||!window.jspdf?.jsPDF)throw new Error("The PDF renderer did not load. Refresh the page and try again.");
    if(!payload?.assessment?.import?.LeaderAssessmentResultID)throw new Error(`${payload?.title||"This team"} needs a saved team leader before its Assessment Results PDF can be generated.`);
    const previous={data:currentAssessmentData,workshopId:assessmentWorkshopId,context:teamMapContext,distribution:currentTeamMapDistribution,analysis:currentTeamMapAnalysis,suggested:suggestedTeamMapAnalysis,stale:teamMapAnalysisStale};
    const preview=byId("teamMapPreview"),wasHidden=preview.classList.contains("hidden"),oldStyle=preview.getAttribute("style");
    try{
      currentAssessmentData=payload.assessment;assessmentWorkshopId=payload.workshopId||"";teamMapContext=payload.context||null;
      currentTeamMapDistribution=TeamMapAnalysis.calculateTeamMapDistribution(currentAssessmentData.results,currentAssessmentData.import.LeaderAssessmentResultID,settings);
      if(!currentTeamMapDistribution.validation.valid)throw new Error(`${payload.title} has invalid assessment results and cannot be packaged.`);
      renderTeamMapPreview();await loadCurrentTeamMapAnalysis();renderTeamMapAnalysisPage();
      preview.classList.remove("hidden");preview.style.position="fixed";preview.style.left="0";preview.style.top="0";preview.style.zIndex="-9999";preview.style.pointerEvents="none";preview.style.display="block";
      await document.fonts?.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));fitTeamMapNames();
      const sheets=[byId("teamMapSheet"),byId("teamMapAnalysisSheet")].filter(sheet=>sheet&&!sheet.classList.contains("hidden"));
      const pdf=new window.jspdf.jsPDF({orientation:"portrait",unit:"in",format:"letter",compress:true});
      for(let index=0;index<sheets.length;index++){const canvas=await html2canvas(sheets[index],{scale:2,useCORS:true,backgroundColor:"#ffffff",logging:false,scrollX:0,scrollY:0});if(index)pdf.addPage("letter","portrait");pdf.addImage(canvas.toDataURL("image/jpeg",.96),"JPEG",0,0,8.5,11,undefined,"FAST");}
      return pdf.output("blob");
    }finally{
      currentAssessmentData=previous.data;assessmentWorkshopId=previous.workshopId;teamMapContext=previous.context;currentTeamMapDistribution=previous.distribution;currentTeamMapAnalysis=previous.analysis;suggestedTeamMapAnalysis=previous.suggested;teamMapAnalysisStale=previous.stale;
      if(wasHidden)preview.classList.add("hidden");if(oldStyle===null)preview.removeAttribute("style");else preview.setAttribute("style",oldStyle);
    }
  }

  async function generateAssessmentFiles(workshopId,groupIds,contextId,packageName){
    const jobs=[];
    if(workshopId){const workshop=workshops.find(item=>String(item.WorkshopID)===String(workshopId))||{},assessment=await Database.getWorkshopAssessment(workshopId);if(!assessment?.import||!(assessment.results||[]).length)throw new Error("The selected workshop does not have saved assessment results.");jobs.push({role:"Assessment:Overall",name:`${packageName} - Assessment Results.pdf`,payload:{assessment,workshopId,title:workshop.Organization||packageName,context:{title:workshop.Organization||packageName,organization:workshop.Organization||"",identifier:workshopId,dateLabel:workshop.WorkshopDate?formatDate(workshop.WorkshopDate):(workshop.DateDescription||"")}}});}
    groupIds.forEach(groupId=>{const payload=assessmentGroupTeamMapPayload(groupId),groupName=payload.title||groupId;jobs.push({role:`Assessment:${groupId}`,name:`${packageName} - ${groupName} - Assessment Results.pdf`,payload});});
    for(const job of jobs){const blob=await renderAssessmentPdf(job.payload),file=new File([blob],job.name,{type:"application/pdf"});await uploadPackageFile(file,contextId,job.role,job.name);}
  }

  window.generatePostSessionPackage=async function(button){
    const contextId=currentContextId(),workshopId=currentMode()==="workshop"?byId("postSessionWorkshop").value:"",name=byId("postSessionPackageName").value.trim();
    if(!contextId)return toast("Choose a workshop or create a standalone package.");if(!name)return focusRequiredField("postSessionPackageName","Package name is required.");
    const finish=beginSave(button,"Building Package...");try{
      const presentation=byId("postSessionPresentation").files[0];if(presentation)await uploadPackageFile(presentation,contextId,"Presentation",`${name} - Workshop Presentation.pdf`);
      const groupIds=selectedGroupIds();if(workshopId)await Database.saveWorkshopGroupLinks({workshopId,groupIds});
      await generateAssessmentFiles(workshopId,groupIds,contextId,name);
      const resourceIds=[...byId("postSessionResourceChoices").querySelectorAll('input:checked')].map(input=>input.value),generationToken="PSG-"+crypto.randomUUID();
      await Database.generatePostSessionPackage({generationToken,workshopId,contextId,packageName:name,dateLabel:byId("postSessionDateLabel").value.trim(),groupIds,resourceIds,includeReadme:byId("postSessionIncludeReadme").checked});
      const generated=await poll(data=>(data.packages||[]).find(row=>String(row.GenerationToken)===generationToken),"The ZIP package was not confirmed.");render();toast("Post-session package created.");window.open(generated.ZipUrl,"_blank","noopener");
    }catch(err){toast(err.message||"Unable to generate package.");}finally{finish();}
  };
})();

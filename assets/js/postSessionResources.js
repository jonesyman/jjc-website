(function(){
  let workspace={resources:[],workshopGroupLinks:[],packageFiles:[],packages:[],operations:[]};
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
    if(!assessmentLibraryLoaded)await loadAssessmentLibrary();
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
    const pending=(workspace.operations||[]).filter(row=>String(row.OperationType)==="Package"&&String(row.Status).toLowerCase()!=="complete").slice(0,5).map(row=>`<div class="record-card"><div class="record-title">${String(row.Status).toLowerCase()==="error"?"Package generation needs attention":"Package is still processing"}</div><div class="tiny muted">${safe(row.Message||"")}</div><span class="status-badge">${safe(row.Status||"Processing")}</span></div>`).join("");
    const packages=(workspace.packages||[]).map(row=>`<div class="record-card"><div class="record-title">${safe(row.PackageName)}</div><div class="tiny muted">${safe(row.Mode||"")} • ${safe(row.CreatedDate?new Date(row.CreatedDate).toLocaleString():"")}</div><div class="actions"><a class="button small-btn" href="${safe(row.ZipUrl)}" target="_blank" rel="noopener">Open ZIP</a></div></div>`).join("");
    byId("postSessionPackageHistory").innerHTML=pending+packages||'<p class="muted small">Generated packages will appear here.</p>';
  }

  async function poll(predicate,message,attempts=30){
    let lastError=null;
    for(let attempt=1;attempt<=attempts;attempt++){await Database.wait(Math.min(4000,500+attempt*250));try{workspace=await Database.getPostSessionWorkspace();const value=predicate(workspace);if(value)return value;}catch(error){if(String(error?.message||"").startsWith("Package generation failed:")||String(error?.message||"").startsWith("File upload failed:"))throw error;lastError=error;}}
    throw new Error(`${message}${lastError?" "+lastError.message:""}`);
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

  async function queuePackageFile(file,contextId,role,displayName){
    const token="PSF-"+crypto.randomUUID(),payload=await filePayload(file);await Database.uploadPostSessionPackageFile({...payload,contextType:currentMode()==="workshop"?"Workshop":"Standalone",contextId,fileRole:role,displayName,uploadToken:token});return token;
  }

  async function uploadPackageFiles(entries,contextId){
    const tokens=[];
    for(const entry of entries)tokens.push(await queuePackageFile(entry.file,contextId,entry.role,entry.displayName));
    if(!tokens.length)return;
    await poll(data=>{
      const operations=data.operations||[],failed=operations.find(row=>tokens.includes(String(row.OperationToken))&&String(row.Status).toLowerCase()==="error");
      if(failed)throw new Error(`File upload failed: ${failed.Message||"Google Drive could not save a package file."}`);
      const completed=new Set((data.packageFiles||[]).filter(row=>tokens.includes(String(row.UploadToken))).map(row=>String(row.UploadToken)));
      return tokens.every(token=>completed.has(token));
    },"Google Drive is still processing the generated assessment files. Refresh Package History before trying again.",24);
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

  async function buildAssessmentFiles(workshopId,groupIds,packageName){
    const jobs=[];
    if(workshopId){const workshop=workshops.find(item=>String(item.WorkshopID)===String(workshopId))||{},assessment=await Database.getWorkshopAssessment(workshopId);if(!assessment?.import||!(assessment.results||[]).length)throw new Error("The selected workshop does not have saved assessment results.");jobs.push({role:"Assessment:Overall",name:`${packageName} - Assessment Results.pdf`,payload:{assessment,workshopId,title:workshop.Organization||packageName,context:{title:workshop.Organization||packageName,organization:workshop.Organization||"",identifier:workshopId,dateLabel:workshop.WorkshopDate?formatDate(workshop.WorkshopDate):(workshop.DateDescription||"")}}});}
    groupIds.forEach(groupId=>{const payload=assessmentGroupTeamMapPayload(groupId),groupName=payload.title||groupId;jobs.push({role:`Assessment:${groupId}`,name:`${packageName} - ${groupName} - Assessment Results.pdf`,payload});});
    const files=[];for(const job of jobs){const blob=await renderAssessmentPdf(job.payload),file=new File([blob],job.name,{type:"application/pdf"});files.push({file,role:job.role,displayName:job.name});}return files;
  }

  function buildReadmeFile(packageName,dateLabel,presentationName,groupIds,resourceIds,workshopId){
    const PDF=window.jspdf?.jsPDF;if(!PDF)throw new Error("The PDF renderer did not load. Refresh the page and try again.");
    const doc=new PDF({orientation:"portrait",unit:"pt",format:"letter"}),margin=54,width=504,pageBottom=738;let y=58;
    const ensure=height=>{if(y+height<=pageBottom)return;doc.addPage();y=58;};
    const lines=(text,size=10,maxWidth=width)=>{doc.setFontSize(size);return doc.splitTextToSize(String(text||""),maxWidth);};
    const paragraph=(text,size=10,indent=0)=>{const rows=lines(text,size,width-indent);ensure(rows.length*(size+4)+8);doc.setFont("helvetica","normal");doc.setFontSize(size);doc.text(rows,margin+indent,y);y+=rows.length*(size+4)+8;};
    const heading=text=>{ensure(28);doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setTextColor(36,63,114);doc.text(String(text),margin,y);doc.setTextColor(23,32,51);y+=22;};
    const bullet=text=>paragraph(`• ${text}`,10,10);
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(36,63,114);doc.text("POST-SESSION RESOURCE PACKAGE",margin,y);y+=24;doc.setFontSize(22);doc.text(packageName,margin,y);y+=24;doc.setTextColor(82,96,119);if(dateLabel){doc.setFont("helvetica","normal");doc.setFontSize(10);doc.text(dateLabel,margin,y);y+=22;}doc.setTextColor(23,32,51);
    paragraph("Thank you for participating in your Working Genius session. This package brings together the presentation, team assessment materials, and selected follow-up resources so your team can continue applying the framework.");
    heading("WHERE TO BEGIN");["Review the workshop presentation and revisit the key ideas from the session.","Open the assessment PDF for the overall team and any relevant subgroup.","Discuss the Team Map observations and choose one or two practical changes.","Use the selected resources during meetings, hiring, planning, and team-development conversations."].forEach(bullet);
    if(presentationName){heading("WORKSHOP PRESENTATION");paragraph(`${presentationName} — A PDF copy of the presentation used during the session.`);}
    const assessmentNames=[...(workshopId?[`${packageName} - Assessment Results.pdf`]:[]),...groups().filter(group=>groupIds.includes(String(group.GroupID))).map(group=>`${packageName} - ${group.GroupName||group.GroupID} - Assessment Results.pdf`)];
    if(assessmentNames.length){heading("TEAM MAP ASSESSMENTS");assessmentNames.forEach(name=>bullet(`${name} — Includes the Team Map and Team Map Analysis for this team.`));}
    const selectedResources=(workspace.resources||[]).filter(row=>resourceIds.includes(String(row.ResourceID)));
    if(selectedResources.length){heading("POST-SESSION RESOURCES");selectedResources.forEach(row=>bullet(`${row.Title} — ${row.Description||"A Working Genius reference for continued team application."}`));}
    heading("SUGGESTED NEXT STEPS");["Complete or revisit the Team Playbook.","Establish a small set of Team Norms.","Use the collaboration and meeting guides in regular work.","Revisit the Team Map when roles, staffing, or priorities change."].forEach(bullet);
    return new File([doc.output("blob")],"00 - READ ME FIRST.pdf",{type:"application/pdf"});
  }

  window.generatePostSessionPackage=async function(button){
    const contextId=currentContextId(),workshopId=currentMode()==="workshop"?byId("postSessionWorkshop").value:"",name=byId("postSessionPackageName").value.trim();
    if(!contextId)return toast("Choose a workshop or create a standalone package.");if(!name)return focusRequiredField("postSessionPackageName","Package name is required.");
    const errorBox=byId("postSessionGenerationError");errorBox.classList.add("hidden");errorBox.textContent="";
    const finish=beginSave(button,"Building Package...");try{
      const entries=[],presentation=byId("postSessionPresentation").files[0];if(presentation)entries.push({file:presentation,role:"Presentation",displayName:`${name} - Workshop Presentation.pdf`});
      const groupIds=selectedGroupIds();if(workshopId)await Database.saveWorkshopGroupLinks({workshopId,groupIds});
      button.textContent="Generating Assessment PDFs...";entries.push(...await buildAssessmentFiles(workshopId,groupIds,name));
      const resourceIds=[...byId("postSessionResourceChoices").querySelectorAll('input:checked')].map(input=>input.value);
      if(byId("postSessionIncludeReadme").checked){const savedPresentation=(workspace.packageFiles||[]).find(row=>active(row)&&String(row.ContextID)===contextId&&String(row.FileRole)==="Presentation");const presentationName=presentation?`${name} - Workshop Presentation.pdf`:(savedPresentation?.DisplayName||"");entries.push({file:buildReadmeFile(name,byId("postSessionDateLabel").value.trim(),presentationName,groupIds,resourceIds,workshopId),role:"Readme",displayName:"00 - READ ME FIRST.pdf"});}
      button.textContent="Saving Package Files...";await uploadPackageFiles(entries,contextId);
      const generationToken="PSG-"+crypto.randomUUID();
      button.textContent="Creating ZIP...";
      await Database.generatePostSessionPackage({generationToken,workshopId,contextId,packageName:name,dateLabel:byId("postSessionDateLabel").value.trim(),groupIds,resourceIds,includeReadme:byId("postSessionIncludeReadme").checked});
      button.textContent="Confirming ZIP...";
      const generated=await poll(data=>{const operation=(data.operations||[]).find(row=>String(row.OperationToken)===generationToken);if(String(operation?.Status).toLowerCase()==="error")throw new Error(`Package generation failed: ${operation.Message||"Google Drive could not create the ZIP."}`);const history=(data.packages||[]).find(row=>String(row.GenerationToken)===generationToken);if(history)return history;if(String(operation?.Status).toLowerCase()==="complete"&&operation.ResultUrl)return {ZipUrl:operation.ResultUrl};return null;},"Google Drive is still finalizing the ZIP. Use Refresh Package History in a moment; do not generate a duplicate package.",36);render();toast("Post-session package created.");window.open(generated.ZipUrl,"_blank","noopener");
    }catch(err){const message=err.message||"Unable to generate package.";errorBox.innerHTML=`<strong>Package generation stopped.</strong><br>${safe(message)}`;errorBox.classList.remove("hidden");errorBox.scrollIntoView({behavior:"smooth",block:"center"});toast("Package generation stopped. The full error remains on this page.");}finally{finish();}
  };
})();

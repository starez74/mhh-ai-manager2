"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import NeedsAttention from "@/components/dashboard/NeedsAttention";
import UpcomingJobs from "@/components/dashboard/UpcomingJobs";
import QuickActions from "@/components/dashboard/QuickActions";
import OperationsCentre from "@/components/dashboard/OperationsCentre";
import ResourceCentre from "@/components/dashboard/ResourceCentre";
import { getBrowserSession, signOut as signOutUser } from "@/lib/services/authService";
import { convertEnquiryToCustomer, createCustomer, listCustomers } from "@/lib/services/customerService";
import { listEnquiries, updateEnquiryFollowUp, updateEnquiryStatus } from "@/lib/services/enquiryService";
import { createQuote, listQuotes, updateQuoteField as updateQuoteFieldService, updateQuoteStatus as updateQuoteStatusService } from "@/lib/services/quoteService";
import { createJobFromQuote, listJobs, updateJobField as updateJobFieldService, updateJobStatus as updateJobStatusService } from "@/lib/services/jobService";
import { listActivities, recordActivity } from "@/lib/services/activityService";
import { calculateDashboardStats } from "@/lib/services/dashboardService";
import {
  buildDispatchSummary,
  buildOperationsSchedule,
} from "@/lib/services/operationsService";
import { deleteRecord, setArchived } from "@/lib/services/recordService";
import { saveDispatchAssignment } from "@/lib/services/dispatchService";
import { listCrews } from "@/lib/services/crewService";
import { listVehicles } from "@/lib/services/vehicleService";
import { buildResourceSummary } from "@/lib/services/resourceService";
import type { QuoteEditableField } from "@/lib/types/quote";
import type { JobEditableField } from "@/lib/types/job";
import type { Customer } from "@/lib/types/customer";
import type { Enquiry } from "@/lib/types/enquiry";
import type { Quote, QuoteDraft } from "@/lib/types/quote";
import type { Job } from "@/lib/types/job";
import type { Activity, ActivityInput } from "@/lib/types/activity";
import type { DashboardView as View, HealthCheck } from "@/lib/types/dashboard";
import type { DispatchAssignmentInput } from "@/lib/types/operations";
import type { Crew } from "@/lib/types/crew";
import type { Vehicle } from "@/lib/types/vehicle";

type Campaign={id:string;created_at:string;title:string;facebook_post?:string;content:string;status:string};
type MetaPost={id:string;created_time:string;message?:string;permalink_url?:string};

const money=(value?:number)=>value==null||Number.isNaN(Number(value))?"Not set":new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(Number(value));
const localInput=(iso?:string)=>iso?new Date(iso).toISOString().slice(0,16):"";
const makeNumber=(prefix:string)=>`${prefix}-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;

export default function Dashboard(){
 const router=useRouter();
 const [view,setView]=useState<View>("dashboard");
 const [userId,setUserId]=useState("");
 const [campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [customers,setCustomers]=useState<Customer[]>([]);
 const [enquiries,setEnquiries]=useState<Enquiry[]>([]);
 const [quotes,setQuotes]=useState<Quote[]>([]);
 const [jobs,setJobs]=useState<Job[]>([]);
 const [crews,setCrews]=useState<Crew[]>([]);
 const [vehicles,setVehicles]=useState<Vehicle[]>([]);
 const [resourcesLoading,setResourcesLoading]=useState(true);
 const [resourcesError,setResourcesError]=useState("");
 const [activities,setActivities]=useState<Activity[]>([]);
 const [selected,setSelected]=useState<Enquiry|null>(null);
 const [selectedQuote,setSelectedQuote]=useState<Quote|null>(null);
 const [selectedJob,setSelectedJob]=useState<Job|null>(null);
 const [message,setMessage]=useState("");
 const [metaPosts,setMetaPosts]=useState<MetaPost[]>([]);
 const [metaConnected,setMetaConnected]=useState(false);
 const [metaLoading,setMetaLoading]=useState(false);
 const [lastSync,setLastSync]=useState("");
 const [metaStatus,setMetaStatus]=useState("");
 const [metaPageName,setMetaPageName]=useState("");
 const [metaPageLink,setMetaPageLink]=useState("");
 const [metaGraphVersion,setMetaGraphVersion]=useState("");
 const [metaPostsReadable,setMetaPostsReadable]=useState(false);
 const [healthChecks,setHealthChecks]=useState<HealthCheck[]>([]);
 const [healthLoading,setHealthLoading]=useState(false);
 const [customerForm,setCustomerForm]=useState({name:"",phone:"",email:"",preferred_contact:"phone",address:"",notes:""});
 const [search,setSearch]=useState("");
 const [showArchived,setShowArchived]=useState(false);
 const [quoteLoading,setQuoteLoading]=useState(false);
 const [quoteSaving,setQuoteSaving]=useState(false);
 const quoteWorkspaceRef=useRef<HTMLDivElement|null>(null);
 const [quoteDraft,setQuoteDraft]=useState<QuoteDraft|null>(null);
 const [quotePrice,setQuotePrice]=useState("");
 const [quoteDeposit,setQuoteDeposit]=useState("");
 const [quoteValidUntil,setQuoteValidUntil]=useState("");
 const [quoteNotes,setQuoteNotes]=useState("");
 const [jobForm,setJobForm]=useState({scheduled_start:"",scheduled_end:"",pickup_address:"",delivery_address:"",crew:"",vehicle:"",special_instructions:""});

 useEffect(()=>{(async()=>{const session=await getBrowserSession();if(!session){router.replace('/login');return}setUserId(session.user.id);await Promise.all([loadAll(),syncFacebook(),runHealthChecks()]);})();},[]);
 async function loadAll(){await Promise.all([loadCampaigns(),loadCustomers(),loadEnquiries(),loadQuotes(),loadJobs(),loadActivities(),loadResources()])}
 async function loadCampaigns(){const {data}=await supabase.from('campaigns').select('*').order('created_at',{ascending:false});setCampaigns(data||[])}
 async function loadCustomers(){setCustomers(await listCustomers())}
 async function loadEnquiries(){setEnquiries(await listEnquiries())}
 async function loadQuotes(){setQuotes(await listQuotes())}
 async function loadJobs(){setJobs(await listJobs())}
 async function loadActivities(){setActivities(await listActivities())}
 async function loadResources(){
   setResourcesLoading(true);
   setResourcesError("");
   try{
     const [crewRows,vehicleRows]=await Promise.all([listCrews(),listVehicles()]);
     setCrews(crewRows);
     setVehicles(vehicleRows);
   }catch(error){
     setResourcesError(error instanceof Error?error.message:"Unable to load resources.");
   }finally{
     setResourcesLoading(false);
   }
 }
 async function logActivity(values:ActivityInput){await recordActivity(userId,values);await loadActivities()}
 async function syncFacebook(){
   setMetaLoading(true);setMetaStatus('');
   const {data}=await supabase.auth.getSession();
   const token=data.session?.access_token;
   if(!token){setMetaLoading(false);setMetaConnected(false);setMetaStatus('No active login session.');return}
   try{
     const r=await fetch('/api/meta',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
     const j=await r.json();
     setLastSync(j.syncedAt||new Date().toISOString());
     setMetaConnected(Boolean(j.connected));
     setMetaPostsReadable(Boolean(j.postsReadable));
     setMetaPosts(j.posts||[]);
     setMetaPageName(j.pageName||'');
     setMetaPageLink(j.pageLink||'');
     setMetaGraphVersion(j.graphVersion||'');
     setMetaStatus(j.message||j.error||(r.ok?'Facebook check completed.':'Facebook check failed.'));
   }catch(error){
     setMetaConnected(false);setMetaPostsReadable(false);setMetaPosts([]);
     setMetaStatus(error instanceof Error?error.message:'Facebook check failed.');
   }finally{
     setMetaLoading(false);
   }
 }
 async function setEnquiryStatus(id:string,status:string){try{await updateEnquiryStatus(id,status);await logActivity({enquiry_id:id,event_type:'enquiry_status',title:`Enquiry marked ${status}`});await loadEnquiries();if(selected?.id===id)setSelected({...selected,status});}catch(error){setMessage(error instanceof Error?error.message:'Unable to update enquiry.');}}
 async function setFollowUp(id:string,value:string){try{await updateEnquiryFollowUp(id,value);await logActivity({enquiry_id:id,event_type:'follow_up',title:'Follow-up updated',details:value||'Follow-up cleared'});await loadEnquiries();}catch(error){setMessage(error instanceof Error?error.message:'Unable to update follow-up.');}}
 async function convertToCustomer(e:Enquiry){
   try{
     const customer=await convertEnquiryToCustomer(userId,e);
     await logActivity({enquiry_id:e.id,event_type:'customer_created',title:'Converted to customer',details:customer.name});
     setMessage(`${e.customer_name} added to Customers.`);await Promise.all([loadCustomers(),loadEnquiries()]);setSelected({...e,customer_id:customer.id,status:e.status==='new'?'contacted':e.status});
   }catch(error){setMessage(error instanceof Error?error.message:'Unable to convert enquiry.');}
 }
 async function addCustomer(){if(!customerForm.name||!customerForm.phone){setMessage('Customer name and phone are required.');return}try{await createCustomer(userId,customerForm);setCustomerForm({name:'',phone:'',email:'',preferred_contact:'phone',address:'',notes:''});setMessage('Customer saved.');await loadCustomers();}catch(error){setMessage(error instanceof Error?error.message:'Unable to save customer.');}}
 async function archiveRecord(table:'enquiries'|'quotes'|'jobs'|'customers',id:string,restore=false){
   try{await setArchived(table,id,restore)}catch(error){setMessage(error instanceof Error?error.message:'Unable to update record.');return}
   setMessage(restore?'Record restored.':'Record archived.');
   if(table==='enquiries'){setSelected(null);await loadEnquiries()}
   if(table==='quotes'){setSelectedQuote(null);await loadQuotes()}
   if(table==='jobs'){setSelectedJob(null);await loadJobs()}
   if(table==='customers')await loadCustomers()
 }
 async function permanentlyDelete(table:'enquiries'|'quotes'|'jobs'|'customers',id:string,label:string){
   if(table==='quotes'&&jobs.some(j=>j.quote_id===id)){
     setMessage('This quote has a linked job. Delete or archive the job first.');
     return;
   }
   const typed=window.prompt(`Permanently delete ${label}? This cannot be undone. Type DELETE to continue.`);
   if(typed!=='DELETE')return;
   try{await deleteRecord(table,id)}catch(error){setMessage(error instanceof Error?error.message:'Unable to delete record.');return}
   setMessage(`${label} permanently deleted.`);
   if(table==='enquiries'){setSelected(null);await Promise.all([loadEnquiries(),loadActivities()])}
   if(table==='quotes'){setSelectedQuote(null);await Promise.all([loadQuotes(),loadActivities()])}
   if(table==='jobs'){setSelectedJob(null);await Promise.all([loadJobs(),loadActivities()])}
   if(table==='customers')await loadCustomers()
 }

 async function generateQuote(e:Enquiry){
   setQuoteLoading(true);setQuoteDraft(null);setMessage("");
   try{
     const {data}=await supabase.auth.getSession();
     const token=data.session?.access_token;
     if(!token)throw new Error("Your session has expired. Please sign in again.");
     const r=await fetch('/api/quotes/generate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({enquiry:e})});
     const j=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(j.error||'Quote generation failed.');
     if(!j.quote)throw new Error('The quote draft was not returned.');
     setQuoteDraft(j.quote);setQuotePrice("");setQuoteDeposit("");setQuoteNotes("");setQuoteValidUntil("");
     setMessage("AI quote draft generated. Review it below, then save the quote.");
     window.setTimeout(()=>quoteWorkspaceRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),0);
   }catch(error){
     setMessage(error instanceof Error?error.message:'Quote generation failed.');
   }finally{
     setQuoteLoading(false);
   }
 }
 async function saveQuote(e:Enquiry){
   if(!quoteDraft){setMessage('Generate the quote draft first.');return}
   if(quoteSaving)return;
   const quote_number=makeNumber('MHH-Q');
   setQuoteSaving(true);
   try{
     const quote=await createQuote({
       userId,
       enquiry:e,
       draft:quoteDraft,
       quoteNumber:quote_number,
       priceAmount:quotePrice?Number(quotePrice):null,
       depositAmount:quoteDeposit?Number(quoteDeposit):null,
       validUntil:quoteValidUntil||null,
       internalNotes:quoteNotes,
     });
     await logActivity({enquiry_id:e.id,quote_id:quote.id,event_type:'quote_created',title:`Quote ${quote_number} created`,details:quotePrice?`Price ${money(Number(quotePrice))}`:'Price not set'});
     setMessage(`Quote ${quote_number} saved.`);setQuoteDraft(null);await Promise.all([loadQuotes(),loadEnquiries()]);setSelectedQuote(quote);setView('quotes');
   }catch(error){setMessage(error instanceof Error?error.message:'Unable to save quote.');}
   finally{setQuoteSaving(false);}
 }
 async function updateQuoteStatus(q:Quote,status:string){
   try{await updateQuoteStatusService(q.id,status);await logActivity({quote_id:q.id,enquiry_id:q.enquiry_id,event_type:'quote_status',title:`Quote marked ${status}`,details:q.quote_number});await loadQuotes();setSelectedQuote({...q,status});}
   catch(error){setMessage(error instanceof Error?error.message:'Unable to update quote.');}
 }
 async function updateQuoteField(q:Quote,field:QuoteEditableField,value:string|number|null){
   try{await updateQuoteFieldService(q.id,field,value);await loadQuotes();setSelectedQuote({...q,[field]:value});}
   catch(error){setMessage(error instanceof Error?error.message:'Unable to update quote.');}
 }
 async function convertQuoteToJob(q:Quote){
   if(!jobForm.scheduled_start){setMessage('Set the scheduled start before creating the job.');return}
   const job_number=makeNumber('MHH-J');
   try{
     const job=await createJobFromQuote({userId,quote:q,form:jobForm,jobNumber:job_number});
     await logActivity({job_id:job.id,quote_id:q.id,enquiry_id:q.enquiry_id,event_type:'job_created',title:`Job ${job_number} created`,details:`${q.pickup_suburb} to ${q.delivery_suburb}`});
     setMessage(`Job ${job_number} created.`);setJobForm({scheduled_start:"",scheduled_end:"",pickup_address:"",delivery_address:"",crew:"",vehicle:"",special_instructions:""});
     await Promise.all([loadJobs(),loadQuotes(),loadEnquiries()]);setSelectedJob(job);setView('jobs');
   }catch(error){setMessage(error instanceof Error?error.message:'Unable to create job.');}
 }
 async function updateJobStatus(j:Job,status:string){
   try{await updateJobStatusService(j.id,status);await logActivity({job_id:j.id,quote_id:j.quote_id,enquiry_id:j.enquiry_id,event_type:'job_status',title:`Job marked ${status}`,details:j.job_number});await loadJobs();setSelectedJob({...j,status});}
   catch(error){setMessage(error instanceof Error?error.message:'Unable to update job.');}
 }
 async function updateJobField(j:Job,field:JobEditableField,value:string|number|null){
   try{const finalValue=await updateJobFieldService(j.id,field,value);await loadJobs();setSelectedJob({...j,[field]:finalValue});}
   catch(error){setMessage(error instanceof Error?error.message:'Unable to update job.');}
 }
 async function saveDispatch(j:Job,assignment:DispatchAssignmentInput){
   const updated=await saveDispatchAssignment(j.id,assignment);
   await logActivity({job_id:j.id,quote_id:j.quote_id,enquiry_id:j.enquiry_id,event_type:'dispatch_updated',title:`Dispatch updated for ${j.job_number}`,details:`${updated.crew} · ${updated.vehicle}`});
   await loadJobs();
   setMessage(`Dispatch updated for ${j.job_number}.`);
   if(selectedJob?.id===j.id)setSelectedJob({...j,...updated,scheduled_start:updated.scheduled_start??undefined,scheduled_end:updated.scheduled_end??undefined});
 }
 async function runHealthChecks(){
   setHealthLoading(true);
   const {data}=await supabase.auth.getSession();
   const token=data.session?.access_token;
   if(!token){setHealthLoading(false);return}
   try{
     const r=await fetch('/api/health',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
     const j=await r.json();
     if(!r.ok){setMessage(j.error||'Connection check failed.');return}
     setHealthChecks(j.checks||[]);
   }catch(error){
     setMessage(error instanceof Error?error.message:'Connection check failed.');
   }finally{
     setHealthLoading(false);
   }
 }
 async function runAllConnectionChecks(){
   setMessage('');
   await Promise.all([runHealthChecks(),syncFacebook()]);
 }
 async function signOut(){await signOutUser();router.replace('/login')}

 const {newLeads,followUps,openQuotes,upcomingJobs}=calculateDashboardStats(enquiries,quotes,jobs);
 const operationsSchedule=useMemo(()=>buildOperationsSchedule(jobs),[jobs]);
 const dispatchSummary=useMemo(()=>buildDispatchSummary(jobs),[jobs]);
 const resourceSummary=useMemo(()=>buildResourceSummary(crews,vehicles),[crews,vehicles]);
 function openOperationsJob(job:Job){setSelectedJob(job);setSearch("");setShowArchived(false);setView("jobs");}
 const filteredCustomers=useMemo(()=>customers.filter(c=>Boolean(c.archived_at)===showArchived).filter(c=>(c.name+' '+c.phone+' '+c.email).toLowerCase().includes(search.toLowerCase())),[customers,search]);
 const filteredEnquiries=useMemo(()=>enquiries.filter(e=>Boolean(e.archived_at)===showArchived).filter(e=>(e.customer_name+' '+e.pickup_suburb+' '+e.delivery_suburb+' '+e.status).toLowerCase().includes(search.toLowerCase())),[enquiries,search]);
 const filteredQuotes=useMemo(()=>quotes.filter(q=>Boolean(q.archived_at)===showArchived).filter(q=>(q.quote_number+' '+q.customer_name+' '+q.pickup_suburb+' '+q.delivery_suburb+' '+q.status).toLowerCase().includes(search.toLowerCase())),[quotes,search]);
 const filteredJobs=useMemo(()=>jobs.filter(j=>Boolean(j.archived_at)===showArchived).filter(j=>(j.job_number+' '+j.customer_name+' '+j.pickup_suburb+' '+j.delivery_suburb+' '+j.status).toLowerCase().includes(search.toLowerCase())),[jobs,search]);
 const relevantActivity=(enquiryId?:string,quoteId?:string,jobId?:string)=>activities.filter(a=>(enquiryId&&a.enquiry_id===enquiryId)||(quoteId&&a.quote_id===quoteId)||(jobId&&a.job_id===jobId)).slice(0,20);

 return <div className="shell">
  <aside className="sidebar"><h2 className="brand">MHH AI Manager</h2><div className="tagline">FROM OUR HANDS TO YOUR HOME</div><div className="nav">{([['dashboard','Dashboard'],['operations','Operations'],['resources','Resources'],['enquiries','Enquiries'],['quotes','Quotes'],['jobs','Jobs'],['customers','Customers'],['receptionist','AI Receptionist'],['marketing','Marketing'],['facebook','Facebook'],['connections','Connections'],['settings','Settings']] as [View,string][]).map(([id,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);setMessage('')}}>{label}</button>)}</div><div className="muted version">Version 5.2.0</div></aside>
  <main className="main"><div className="top"><div><h1>MHH AI Business Manager</h1><div className="muted">Enquiry → quote → booking → job completion</div></div><div className="pill">{newLeads} new · {openQuotes} open quotes · {upcomingJobs} upcoming jobs</div></div>
  {message&&<div className="notice">{message}</div>}

  <section className={view==='dashboard'?'view active':'view'}>
   <DashboardHeader message={message} />
   <DashboardStats newLeads={newLeads} openQuotes={openQuotes} upcomingJobs={upcomingJobs} followUps={followUps} />
   <div className="grid two" style={{marginTop:18}}>
    <NeedsAttention enquiries={enquiries} quotes={quotes} />
    <UpcomingJobs jobs={jobs} />
    <RecentActivity items={activities} />
    <QuickActions onOpenEnquiries={()=>setView('enquiries')} onOpenQuotes={()=>setView('quotes')} onOpenJobs={()=>setView('jobs')} />
   </div>
  </section>

  <section className={view==='operations'?'view active':'view'}>
   <OperationsCentre
    jobs={jobs}
    dispatch={dispatchSummary}
    schedule={operationsSchedule}
    crews={crews}
    vehicles={vehicles}
    onOpenJob={openOperationsJob}
    onSaveDispatch={saveDispatch}
   />
  </section>

  <section className={view==='resources'?'view active':'view'}>
   <ResourceCentre
    userId={userId}
    crews={crews}
    vehicles={vehicles}
    summary={resourceSummary}
    loading={resourcesLoading}
    error={resourcesError}
    onRetry={loadResources}
   />
  </section>

  <section className={view==='enquiries'?'view active':'view'}><div className="grid two"><div className="card"><div className="sectionHead"><h3>Enquiry Pipeline</h3><div className="listTools"><button className="btn secondary small" onClick={()=>{setShowArchived(!showArchived);setSelected(null)}}>{showArchived?"Show active":"Show archived"}</button><input className="searchBox" placeholder="Search enquiries" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>{filteredEnquiries.map(e=><button key={e.id} className={`leadRow ${selected?.id===e.id?'selected':''}`} onClick={()=>{setSelected(e);setQuoteDraft(null)}}><div><strong>{e.customer_name}</strong><span className="badge">{e.status}</span></div><span>{e.pickup_suburb} → {e.delivery_suburb}</span><span>{new Date(e.created_at).toLocaleString('en-AU')}</span></button>)}{!filteredEnquiries.length&&<p className="muted">No enquiries found.</p>}</div><div className="card">{!selected?<p className="muted">Select an enquiry to review it.</p>:<div><div className="sectionHead"><h3>{selected.customer_name}</h3><span className="badge">{selected.status}</span></div><p><strong>Phone:</strong> <a href={`tel:${selected.phone}`}>{selected.phone}</a></p><p><strong>Email:</strong> {selected.email||'Not supplied'}</p><div className="notice"><strong>Enquiry summary</strong><br/>{selected.ai_summary}</div><p><strong>Move:</strong> {selected.pickup_suburb} → {selected.delivery_suburb}</p><p><strong>Date:</strong> {selected.preferred_date||'Flexible / not supplied'}</p><p><strong>Property:</strong> {selected.property_size||'Not supplied'}</p><p><strong>Stairs:</strong> {selected.stairs} · <strong>Steep driveway:</strong> {selected.steep_driveway}</p><p><strong>Heavy items:</strong> {selected.heavy_items||'None listed'}</p><p><strong>Items:</strong> {selected.item_summary||'Not supplied'}</p><label>Status</label><select value={selected.status} onChange={e=>setEnquiryStatus(selected.id,e.target.value)}><option>new</option><option>contacted</option><option>quoted</option><option>booked</option><option>closed</option><option>declined</option></select><label>Follow-up date and time</label><input type="datetime-local" defaultValue={localInput(selected.follow_up_at)} onBlur={e=>setFollowUp(selected.id,e.target.value)}/><div className="actions"><a className="btn linkBtn" href={`tel:${selected.phone}`}>Call</a><a className="btn secondary linkBtn" href={`sms:${selected.phone}`}>SMS</a>{!selected.customer_id&&<button className="btn secondary" onClick={()=>convertToCustomer(selected)}>Convert to customer</button>}<button className="btn" onClick={()=>generateQuote(selected)} disabled={quoteLoading}>{quoteLoading?'Drafting…':'Generate quote'}</button></div><div className="recordControls">{selected.archived_at?<button className="btn secondary" onClick={()=>archiveRecord('enquiries',selected.id,true)}>Restore enquiry</button>:<button className="btn secondary" onClick={()=>archiveRecord('enquiries',selected.id)}>Archive enquiry</button>}<button className="btn danger" onClick={()=>permanentlyDelete('enquiries',selected.id,`enquiry for ${selected.customer_name}`)}>Delete permanently</button></div>
       {quoteDraft&&<div className="quoteEditor" ref={quoteWorkspaceRef}><h3>AI Quote Workspace</h3><div className="notice"><strong>Draft ready.</strong><br/>Review the AI draft, add pricing details, then save it to Quotes.</div><div className="notice"><strong>Scope:</strong><br/>{quoteDraft.scope_summary}</div><p><strong>Risk flags:</strong> {quoteDraft.risk_flags}</p><p><strong>Missing information:</strong> {quoteDraft.missing_information}</p><label>Customer-facing draft</label><textarea value={quoteDraft.draft_message} onChange={e=>setQuoteDraft({...quoteDraft,draft_message:e.target.value})}/><div className="grid two"><div><label>Final price (AUD)</label><input type="number" min="0" step="0.01" value={quotePrice} onChange={e=>setQuotePrice(e.target.value)}/></div><div><label>Deposit (AUD)</label><input type="number" min="0" step="0.01" value={quoteDeposit} onChange={e=>setQuoteDeposit(e.target.value)}/></div></div><label>Valid until</label><input type="date" value={quoteValidUntil} onChange={e=>setQuoteValidUntil(e.target.value)}/><label>Internal notes</label><textarea value={quoteNotes} onChange={e=>setQuoteNotes(e.target.value)}/><button className="btn" onClick={()=>saveQuote(selected)} disabled={quoteSaving}>{quoteSaving?"Saving quote…":"Save quote"}</button></div>}
       <Timeline items={relevantActivity(selected.id)} />
      </div>}</div></div></section>

  <section className={view==='quotes'?'view active':'view'}><div className="grid two"><div className="card"><div className="sectionHead"><h3>Quotes</h3><div className="listTools"><button className="btn secondary small" onClick={()=>{setShowArchived(!showArchived);setSelectedQuote(null)}}>{showArchived?"Show active":"Show archived"}</button><input className="searchBox" placeholder="Search quotes" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>{filteredQuotes.map(q=><button key={q.id} className={`leadRow ${selectedQuote?.id===q.id?'selected':''}`} onClick={()=>setSelectedQuote(q)}><div><strong>{q.quote_number}</strong><span className="badge">{q.status}</span></div><span>{q.customer_name}</span><span>{money(q.price_amount)}</span></button>)}{!filteredQuotes.length&&<p className="muted">No quotes yet.</p>}</div><div className="card">{!selectedQuote?<p className="muted">Select a quote.</p>:<div><div className="sectionHead"><h3>{selectedQuote.quote_number}</h3><span className="badge">{selectedQuote.status}</span></div><p><strong>Customer:</strong> {selectedQuote.customer_name}</p><p><strong>Move:</strong> {selectedQuote.pickup_suburb} → {selectedQuote.delivery_suburb}</p><div className="notice">{selectedQuote.scope_summary}</div><p><strong>Risk flags:</strong> {selectedQuote.risk_flags}</p><p><strong>Missing information:</strong> {selectedQuote.missing_information}</p><label>Draft message</label><textarea defaultValue={selectedQuote.draft_message} onBlur={e=>updateQuoteField(selectedQuote,'draft_message',e.target.value)}/><div className="grid two"><div><label>Price</label><input type="number" defaultValue={selectedQuote.price_amount||''} onBlur={e=>updateQuoteField(selectedQuote,'price_amount',e.target.value?Number(e.target.value):null)}/></div><div><label>Deposit</label><input type="number" defaultValue={selectedQuote.deposit_amount||''} onBlur={e=>updateQuoteField(selectedQuote,'deposit_amount',e.target.value?Number(e.target.value):null)}/></div></div><label>Status</label><select value={selectedQuote.status} onChange={e=>updateQuoteStatus(selectedQuote,e.target.value)}><option>draft</option><option>approved</option><option>sent</option><option>accepted</option><option>declined</option><option>expired</option></select><div className="actions"><a className="btn secondary linkBtn" href={`sms:${selectedQuote.phone}?body=${encodeURIComponent(selectedQuote.draft_message)}`}>Open SMS draft</a>{selectedQuote.email&&<a className="btn secondary linkBtn" href={`mailto:${selectedQuote.email}?subject=${encodeURIComponent('Ma’s Helping Hand Quote '+selectedQuote.quote_number)}&body=${encodeURIComponent(selectedQuote.draft_message)}`}>Open email draft</a>}</div>
       {!jobs.some(j=>j.quote_id===selectedQuote.id)&&<div className="jobCreate"><h3>Convert accepted quote to job</h3><div className="grid two"><div><label>Scheduled start *</label><input type="datetime-local" value={jobForm.scheduled_start} onChange={e=>setJobForm({...jobForm,scheduled_start:e.target.value})}/></div><div><label>Scheduled end</label><input type="datetime-local" value={jobForm.scheduled_end} onChange={e=>setJobForm({...jobForm,scheduled_end:e.target.value})}/></div></div><label>Pickup address</label><input value={jobForm.pickup_address} onChange={e=>setJobForm({...jobForm,pickup_address:e.target.value})}/><label>Delivery address</label><input value={jobForm.delivery_address} onChange={e=>setJobForm({...jobForm,delivery_address:e.target.value})}/><div className="grid two"><div><label>Crew</label><input value={jobForm.crew} onChange={e=>setJobForm({...jobForm,crew:e.target.value})}/></div><div><label>Vehicle</label><input value={jobForm.vehicle} onChange={e=>setJobForm({...jobForm,vehicle:e.target.value})}/></div></div><label>Special instructions</label><textarea value={jobForm.special_instructions} onChange={e=>setJobForm({...jobForm,special_instructions:e.target.value})}/><button className="btn" onClick={()=>convertQuoteToJob(selectedQuote)}>Create scheduled job</button></div>}
       <div className="recordControls">{selectedQuote.archived_at?<button className="btn secondary" onClick={()=>archiveRecord('quotes',selectedQuote.id,true)}>Restore quote</button>:<button className="btn secondary" onClick={()=>archiveRecord('quotes',selectedQuote.id)}>Archive quote</button>}<button className="btn danger" onClick={()=>permanentlyDelete('quotes',selectedQuote.id,selectedQuote.quote_number)}>Delete permanently</button></div>
       <Timeline items={relevantActivity(selectedQuote.enquiry_id,selectedQuote.id)} />
      </div>}</div></div></section>

  <section className={view==='jobs'?'view active':'view'}><div className="grid two"><div className="card"><div className="sectionHead"><h3>Jobs</h3><div className="listTools"><button className="btn secondary small" onClick={()=>{setShowArchived(!showArchived);setSelectedJob(null)}}>{showArchived?"Show active":"Show archived"}</button><input className="searchBox" placeholder="Search jobs" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>{filteredJobs.map(j=><button key={j.id} className={`leadRow ${selectedJob?.id===j.id?'selected':''}`} onClick={()=>setSelectedJob(j)}><div><strong>{j.job_number}</strong><span className="badge">{j.status}</span></div><span>{j.customer_name}</span><span>{j.scheduled_start?new Date(j.scheduled_start).toLocaleString('en-AU'):'Unscheduled'}</span></button>)}{!filteredJobs.length&&<p className="muted">No jobs yet.</p>}</div><div className="card">{!selectedJob?<p className="muted">Select a job.</p>:<div><div className="sectionHead"><h3>{selectedJob.job_number}</h3><span className="badge">{selectedJob.status}</span></div><p><strong>{selectedJob.customer_name}</strong> · <a href={`tel:${selectedJob.phone}`}>{selectedJob.phone}</a></p><p><strong>Route:</strong> {selectedJob.pickup_suburb} → {selectedJob.delivery_suburb}</p><div className="notice">{selectedJob.scope_summary}</div><label>Status</label><select value={selectedJob.status} onChange={e=>updateJobStatus(selectedJob,e.target.value)}><option>booked</option><option>confirmed</option><option>in_progress</option><option>completed</option><option>cancelled</option></select><div className="grid two"><div><label>Scheduled start</label><input type="datetime-local" defaultValue={localInput(selectedJob.scheduled_start)} onBlur={e=>updateJobField(selectedJob,'scheduled_start',e.target.value)}/></div><div><label>Scheduled end</label><input type="datetime-local" defaultValue={localInput(selectedJob.scheduled_end)} onBlur={e=>updateJobField(selectedJob,'scheduled_end',e.target.value)}/></div></div><label>Pickup address</label><input defaultValue={selectedJob.pickup_address} onBlur={e=>updateJobField(selectedJob,'pickup_address',e.target.value)}/><label>Delivery address</label><input defaultValue={selectedJob.delivery_address} onBlur={e=>updateJobField(selectedJob,'delivery_address',e.target.value)}/><div className="grid two"><div><label>Crew</label><input defaultValue={selectedJob.crew} onBlur={e=>updateJobField(selectedJob,'crew',e.target.value)}/></div><div><label>Vehicle</label><input defaultValue={selectedJob.vehicle} onBlur={e=>updateJobField(selectedJob,'vehicle',e.target.value)}/></div></div><label>Special instructions</label><textarea defaultValue={selectedJob.special_instructions} onBlur={e=>updateJobField(selectedJob,'special_instructions',e.target.value)}/><p><strong>Quoted amount:</strong> {money(selectedJob.quoted_amount)}</p><div className="actions"><a className="btn linkBtn" href={`tel:${selectedJob.phone}`}>Call customer</a><a className="btn secondary linkBtn" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedJob.pickup_address||selectedJob.pickup_suburb)}`} target="_blank">Navigate to pickup</a></div><div className="recordControls">{selectedJob.archived_at?<button className="btn secondary" onClick={()=>archiveRecord('jobs',selectedJob.id,true)}>Restore job</button>:<button className="btn secondary" onClick={()=>archiveRecord('jobs',selectedJob.id)}>Archive job</button>}<button className="btn danger" onClick={()=>permanentlyDelete('jobs',selectedJob.id,selectedJob.job_number)}>Delete permanently</button></div><Timeline items={relevantActivity(selectedJob.enquiry_id,selectedJob.quote_id,selectedJob.id)} /></div>}</div></div></section>

  <section className={view==='customers'?'view active':'view'}><div className="grid two"><div className="card"><h3>Add Customer</h3><label>Name *</label><input value={customerForm.name} onChange={e=>setCustomerForm({...customerForm,name:e.target.value})}/><label>Phone *</label><input value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm,phone:e.target.value})}/><label>Email</label><input value={customerForm.email} onChange={e=>setCustomerForm({...customerForm,email:e.target.value})}/><label>Preferred contact</label><select value={customerForm.preferred_contact} onChange={e=>setCustomerForm({...customerForm,preferred_contact:e.target.value})}><option value="phone">Phone</option><option value="sms">SMS</option><option value="email">Email</option><option value="facebook">Facebook</option></select><label>Address</label><input value={customerForm.address} onChange={e=>setCustomerForm({...customerForm,address:e.target.value})}/><label>Notes</label><textarea value={customerForm.notes} onChange={e=>setCustomerForm({...customerForm,notes:e.target.value})}/><button className="btn" onClick={addCustomer}>Save customer</button></div><div className="card"><div className="sectionHead"><h3>Customer Database</h3><div className="listTools"><button className="btn secondary small" onClick={()=>setShowArchived(!showArchived)}>{showArchived?"Show active":"Show archived"}</button><input className="searchBox" placeholder="Search customers" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>{filteredCustomers.map(c=><div className="campaign" key={c.id}><div className="sectionHead"><div><strong>{c.name}</strong><div className="muted">{c.phone} · {c.email||'No email'}</div></div><div className="customerControls">{c.archived_at?<button className="btn secondary small" onClick={()=>archiveRecord('customers',c.id,true)}>Restore</button>:<button className="btn secondary small" onClick={()=>archiveRecord('customers',c.id)}>Archive</button>}<button className="btn danger small" onClick={()=>permanentlyDelete('customers',c.id,`customer ${c.name}`)}>Delete permanently</button></div></div><p>{c.address}</p><p>{c.notes}</p><div className="actions"><a className="btn secondary linkBtn" href={`tel:${c.phone}`}>Call</a><a className="btn secondary linkBtn" href={`sms:${c.phone}`}>SMS</a></div></div>)}</div></div></section>

  <section className={view==='receptionist'?'view active':'view'}><div className="grid two"><div className="card"><h3>Website Receptionist</h3><p>The guided assistant collects removal details and adds requests directly to the enquiry pipeline.</p><a className="btn linkBtn" href="/reception" target="_blank">Open public receptionist</a></div><div className="card"><h3>Workflow now connected</h3><p>Receptionist submission → enquiry review → AI quote draft → approved quote → scheduled job.</p><div className="notice">The AI never sets the final price. You enter and approve it.</div></div></div></section>

  <section className={view==='marketing'?'view active':'view'}><div className="card"><h3>Marketing Module</h3><p>Saved campaigns: <strong>{campaigns.length}</strong></p>{campaigns.slice(0,8).map(c=><div className="campaign" key={c.id}><strong>{c.title}</strong><span className="badge" style={{marginLeft:10}}>{c.status}</span><div className="result" style={{marginTop:10}}>{c.facebook_post||c.content}</div></div>)}</div></section>

  <section className={view==='facebook'?'view active':'view'}><div className="grid two"><div className="card"><h3>Facebook Connection Diagnostic</h3><p>Overall connection: <strong className={metaConnected?'success':'error'}>{metaConnected?'Connected':'Not connected'}</strong></p><p>Recent-post access: <strong className={metaPostsReadable?'success':'error'}>{metaPostsReadable?'Working':'Not verified'}</strong></p><p>Configured Page: <strong>{metaPageName||'Not verified'}</strong></p>{metaPageLink&&<p><a href={metaPageLink} target="_blank" rel="noreferrer">Open connected Facebook Page</a></p>}<p>Graph API setting: <strong>{metaGraphVersion||'Not reported'}</strong></p><p>Last check: {lastSync?new Date(lastSync).toLocaleString('en-AU'):'Never'}</p>{metaStatus&&<div className={metaConnected?'notice':'notice diagnosticError'}><strong>{metaConnected?'Check passed':'Check result'}</strong><br/>{metaStatus}</div>}<button className="btn" disabled={metaLoading} onClick={syncFacebook}>{metaLoading?'Checking…':'Run Facebook Connection Check'}</button></div><div className="card"><div className="sectionHead"><h3>Recent Page Posts</h3><span className="badge">{metaPosts.length} loaded</span></div>{metaPosts.map(p=><div className="campaign" key={p.id}><div className="muted">{new Date(p.created_time).toLocaleString('en-AU')}</div><p>{p.message||'(Post without text)'}</p>{p.permalink_url&&<a href={p.permalink_url} target="_blank" rel="noreferrer">Open post on Facebook</a>}</div>)}{!metaPosts.length&&<p className="muted">Run the connection check to load recent posts.</p>}</div></div></section>

  <section className={view==='connections'?'view active':'view'}>
   <div className="sectionHead"><div><h2>Connection Centre</h2><p className="muted">Live health checks for services used by MHH AI Business Manager.</p></div><button className="btn" disabled={healthLoading||metaLoading} onClick={runAllConnectionChecks}>{healthLoading||metaLoading?'Checking…':'Run all checks'}</button></div>
   <div className="grid two">
    <ConnectionCard label="Facebook" status={metaConnected&&metaPostsReadable?'healthy':'error'} message={metaStatus||'Run the Facebook check.'} details={[metaPageName?`Page: ${metaPageName}`:'Page not verified',metaGraphVersion?`Graph API: ${metaGraphVersion}`:'Graph API not reported',lastSync?`Checked: ${new Date(lastSync).toLocaleString('en-AU')}`:'Not checked yet']} />
    {healthChecks.map(check=><ConnectionCard key={check.key} label={check.label} status={check.status} message={check.message} details={[`Checked: ${new Date(check.checkedAt).toLocaleString('en-AU')}`]} />)}
    <ConnectionCard label="Instagram" status="warning" message="The Instagram account is assigned in Meta, but Instagram API access is not configured in this application yet." details={["Planned integration"]} />
    <ConnectionCard label="Email delivery" status="warning" message="The application currently opens email and SMS drafts rather than sending through a dedicated delivery provider." details={["Manual send remains enabled"]} />
   </div>
   <div className="card" style={{marginTop:18}}><h3>Security</h3><div className="notice">Tokens and API keys are checked securely on the server and are never displayed by this screen.</div></div>
  </section>

  <section className={view==='settings'?'view active':'view'}><div className="card"><h3>System</h3><p>Application version: <strong>5.2.0</strong></p><p>Operational tables: <strong className="success">enquiries + customers + quotes + jobs + activity</strong></p><p>Quote AI: <strong className="success">Owner-controlled pricing</strong></p><div className="notice">Run supabase/v5.1-migration.sql before using archive or restore.</div><button className="btn danger" onClick={signOut}>Sign out</button></div></section>
  </main>
 </div>
}

function ConnectionCard({label,status,message,details}:{label:string;status:"healthy"|"warning"|"error";message:string;details:string[]}){
 const text=status==="healthy"?"Healthy":status==="warning"?"Not configured":"Needs attention";
 return <div className={`card connectionCard ${status}`}><div className="sectionHead"><h3>{label}</h3><span className={`healthBadge ${status}`}>{text}</span></div><p>{message}</p>{details.map((detail,index)=><div className="muted" key={index}>{detail}</div>)}</div>
}

function Timeline({items}:{items:Activity[]}){
 return <div className="timeline"><h3>Activity timeline</h3>{items.length===0?<p className="muted">No activity recorded yet.</p>:items.map(item=><div className="timelineItem" key={item.id}><div className="timelineDot"/><div><strong>{item.title}</strong><div className="muted">{new Date(item.created_at).toLocaleString('en-AU')}</div>{item.details&&<p>{item.details}</p>}</div></div>)}</div>
}

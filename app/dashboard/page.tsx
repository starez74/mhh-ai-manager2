'use client';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Campaign={id:string;created_at:string;title:string;facebook_post?:string;content:string;status:string};
type Customer={id:string;created_at:string;archived_at?:string|null;name:string;phone:string;email:string;preferred_contact:string;address:string;notes:string;status:string};
type Enquiry={id:string;created_at:string;archived_at?:string|null;status:string;source:string;customer_name:string;phone:string;email:string;preferred_contact:string;pickup_suburb:string;delivery_suburb:string;preferred_date:string;property_size:string;stairs:string;steep_driveway:string;heavy_items:string;item_summary:string;extra_notes:string;ai_summary:string;follow_up_at?:string;customer_id?:string};
type Quote={id:string;created_at:string;archived_at?:string|null;quote_number:string;status:string;enquiry_id?:string;customer_id?:string;customer_name:string;phone:string;email:string;pickup_suburb:string;delivery_suburb:string;preferred_date:string;scope_summary:string;risk_flags:string;missing_information:string;draft_message:string;price_amount?:number;deposit_amount?:number;valid_until?:string;internal_notes:string};
type Job={id:string;created_at:string;archived_at?:string|null;job_number:string;status:string;quote_id?:string;enquiry_id?:string;customer_id?:string;customer_name:string;phone:string;email:string;scheduled_start?:string;scheduled_end?:string;pickup_address:string;delivery_address:string;pickup_suburb:string;delivery_suburb:string;crew:string;vehicle:string;scope_summary:string;special_instructions:string;quoted_amount?:number;paid_amount:number};
type Activity={id:string;created_at:string;enquiry_id?:string;quote_id?:string;job_id?:string;event_type:string;title:string;details:string};
type QuoteDraft={scope_summary:string;risk_flags:string;missing_information:string;draft_message:string;suggested_follow_up:string};
type View="dashboard"|"enquiries"|"quotes"|"jobs"|"customers"|"receptionist"|"marketing"|"facebook"|"settings";

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
 const [activities,setActivities]=useState<Activity[]>([]);
 const [selected,setSelected]=useState<Enquiry|null>(null);
 const [selectedQuote,setSelectedQuote]=useState<Quote|null>(null);
 const [selectedJob,setSelectedJob]=useState<Job|null>(null);
 const [message,setMessage]=useState("");
 const [metaPosts,setMetaPosts]=useState<any[]>([]);
 const [metaConnected,setMetaConnected]=useState(false);
 const [metaLoading,setMetaLoading]=useState(false);
 const [lastSync,setLastSync]=useState("");
 const [customerForm,setCustomerForm]=useState({name:"",phone:"",email:"",preferred_contact:"phone",address:"",notes:""});
 const [search,setSearch]=useState("");
 const [showArchived,setShowArchived]=useState(false);
 const [quoteLoading,setQuoteLoading]=useState(false);
 const [quoteDraft,setQuoteDraft]=useState<QuoteDraft|null>(null);
 const [quotePrice,setQuotePrice]=useState("");
 const [quoteDeposit,setQuoteDeposit]=useState("");
 const [quoteValidUntil,setQuoteValidUntil]=useState("");
 const [quoteNotes,setQuoteNotes]=useState("");
 const [jobForm,setJobForm]=useState({scheduled_start:"",scheduled_end:"",pickup_address:"",delivery_address:"",crew:"",vehicle:"",special_instructions:""});

 useEffect(()=>{(async()=>{const {data}=await supabase.auth.getSession();if(!data.session){router.replace('/login');return}setUserId(data.session.user.id);await Promise.all([loadAll(),syncFacebook()]);})();},[]);
 async function loadAll(){await Promise.all([loadCampaigns(),loadCustomers(),loadEnquiries(),loadQuotes(),loadJobs(),loadActivities()])}
 async function loadCampaigns(){const {data}=await supabase.from('campaigns').select('*').order('created_at',{ascending:false});setCampaigns(data||[])}
 async function loadCustomers(){const {data}=await supabase.from('customers').select('*').order('created_at',{ascending:false});setCustomers(data||[])}
 async function loadEnquiries(){const {data}=await supabase.from('enquiries').select('*').order('created_at',{ascending:false});setEnquiries(data||[])}
 async function loadQuotes(){const {data}=await supabase.from('quotes').select('*').order('created_at',{ascending:false});setQuotes(data||[])}
 async function loadJobs(){const {data}=await supabase.from('jobs').select('*').order('scheduled_start',{ascending:true});setJobs(data||[])}
 async function loadActivities(){const {data}=await supabase.from('activity_events').select('*').order('created_at',{ascending:false}).limit(500);setActivities(data||[])}
 async function logActivity(values:Partial<Activity>){await supabase.from('activity_events').insert({user_id:userId,event_type:values.event_type||'update',title:values.title||'Updated',details:values.details||'',enquiry_id:values.enquiry_id||null,quote_id:values.quote_id||null,job_id:values.job_id||null});await loadActivities()}
 async function syncFacebook(){setMetaLoading(true);const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token){setMetaLoading(false);return}const r=await fetch('/api/meta',{headers:{Authorization:`Bearer ${token}`}});const j=await r.json();setMetaLoading(false);setLastSync(j.syncedAt||new Date().toISOString());if(r.ok){setMetaConnected(Boolean(j.connected));setMetaPosts(j.posts||[])}}
 async function setEnquiryStatus(id:string,status:string){const {error}=await supabase.from('enquiries').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error){setMessage(error.message);return}await logActivity({enquiry_id:id,event_type:'enquiry_status',title:`Enquiry marked ${status}`});await loadEnquiries();if(selected?.id===id)setSelected({...selected,status});}
 async function setFollowUp(id:string,value:string){const follow_up_at=value?new Date(value).toISOString():null;const {error}=await supabase.from('enquiries').update({follow_up_at}).eq('id',id);if(error){setMessage(error.message);return}await logActivity({enquiry_id:id,event_type:'follow_up',title:'Follow-up updated',details:value||'Follow-up cleared'});await loadEnquiries();}
 async function convertToCustomer(e:Enquiry){
   const {data,error}=await supabase.from('customers').insert({user_id:userId,name:e.customer_name,phone:e.phone,email:e.email||'',preferred_contact:e.preferred_contact||'phone',address:'',notes:e.ai_summary||e.extra_notes||'',status:'active'}).select('*').single();
   if(error){setMessage(error.message);return}
   await supabase.from('enquiries').update({customer_id:data.id,converted_at:new Date().toISOString(),status:e.status==='new'?'contacted':e.status}).eq('id',e.id);
   await logActivity({enquiry_id:e.id,event_type:'customer_created',title:'Converted to customer',details:data.name});
   setMessage(`${e.customer_name} added to Customers.`);await Promise.all([loadCustomers(),loadEnquiries()]);setSelected({...e,customer_id:data.id,status:e.status==='new'?'contacted':e.status});
 }
 async function addCustomer(){if(!customerForm.name||!customerForm.phone){setMessage('Customer name and phone are required.');return}const {error}=await supabase.from('customers').insert({user_id:userId,...customerForm,status:'active'});if(error){setMessage(error.message);return}setCustomerForm({name:'',phone:'',email:'',preferred_contact:'phone',address:'',notes:''});setMessage('Customer saved.');await loadCustomers();}
 async function archiveRecord(table:'enquiries'|'quotes'|'jobs'|'customers',id:string,restore=false){
   const archived_at=restore?null:new Date().toISOString();
   const {error}=await supabase.from(table).update({archived_at}).eq('id',id);
   if(error){setMessage(error.message);return}
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
   const {error}=await supabase.from(table).delete().eq('id',id);
   if(error){setMessage(error.message);return}
   setMessage(`${label} permanently deleted.`);
   if(table==='enquiries'){setSelected(null);await Promise.all([loadEnquiries(),loadActivities()])}
   if(table==='quotes'){setSelectedQuote(null);await Promise.all([loadQuotes(),loadActivities()])}
   if(table==='jobs'){setSelectedJob(null);await Promise.all([loadJobs(),loadActivities()])}
   if(table==='customers')await loadCustomers()
 }

 async function generateQuote(e:Enquiry){
   setQuoteLoading(true);setQuoteDraft(null);setMessage("");
   const {data}=await supabase.auth.getSession();
   const token=data.session?.access_token;
   const r=await fetch('/api/quotes/generate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({enquiry:e})});
   const j=await r.json();setQuoteLoading(false);
   if(!r.ok){setMessage(j.error||'Quote generation failed.');return}
   setQuoteDraft(j.quote);setQuotePrice("");setQuoteDeposit("");setQuoteNotes("");setQuoteValidUntil("");
 }
 async function saveQuote(e:Enquiry){
   if(!quoteDraft){setMessage('Generate the quote draft first.');return}
   const quote_number=makeNumber('MHH-Q');
   const {data,error}=await supabase.from('quotes').insert({
     user_id:userId,enquiry_id:e.id,customer_id:e.customer_id||null,quote_number,status:'draft',
     customer_name:e.customer_name,phone:e.phone,email:e.email||'',pickup_suburb:e.pickup_suburb,delivery_suburb:e.delivery_suburb,
     preferred_date:e.preferred_date||'',scope_summary:quoteDraft.scope_summary,risk_flags:quoteDraft.risk_flags,
     missing_information:quoteDraft.missing_information,draft_message:quoteDraft.draft_message,
     price_amount:quotePrice?Number(quotePrice):null,deposit_amount:quoteDeposit?Number(quoteDeposit):null,
     valid_until:quoteValidUntil||null,internal_notes:quoteNotes
   }).select('*').single();
   if(error){setMessage(error.message);return}
   await supabase.from('enquiries').update({status:'quoted',updated_at:new Date().toISOString()}).eq('id',e.id);
   await logActivity({enquiry_id:e.id,quote_id:data.id,event_type:'quote_created',title:`Quote ${quote_number} created`,details:quotePrice?`Price ${money(Number(quotePrice))}`:'Price not set'});
   setMessage(`Quote ${quote_number} saved.`);setQuoteDraft(null);await Promise.all([loadQuotes(),loadEnquiries()]);setSelectedQuote(data);setView('quotes');
 }
 async function updateQuoteStatus(q:Quote,status:string){
   const {error}=await supabase.from('quotes').update({status,updated_at:new Date().toISOString()}).eq('id',q.id);
   if(error){setMessage(error.message);return}
   await logActivity({quote_id:q.id,enquiry_id:q.enquiry_id,event_type:'quote_status',title:`Quote marked ${status}`,details:q.quote_number});
   await loadQuotes();setSelectedQuote({...q,status});
 }
 async function updateQuoteField(q:Quote,field:string,value:any){
   const {error}=await supabase.from('quotes').update({[field]:value,updated_at:new Date().toISOString()}).eq('id',q.id);
   if(error){setMessage(error.message);return}
   await loadQuotes();setSelectedQuote({...q,[field]:value});
 }
 async function convertQuoteToJob(q:Quote){
   if(!jobForm.scheduled_start){setMessage('Set the scheduled start before creating the job.');return}
   const job_number=makeNumber('MHH-J');
   const {data,error}=await supabase.from('jobs').insert({
     user_id:userId,enquiry_id:q.enquiry_id||null,quote_id:q.id,customer_id:q.customer_id||null,job_number,status:'booked',
     customer_name:q.customer_name,phone:q.phone,email:q.email||'',scheduled_start:new Date(jobForm.scheduled_start).toISOString(),
     scheduled_end:jobForm.scheduled_end?new Date(jobForm.scheduled_end).toISOString():null,
     pickup_address:jobForm.pickup_address,delivery_address:jobForm.delivery_address,pickup_suburb:q.pickup_suburb,
     delivery_suburb:q.delivery_suburb,crew:jobForm.crew,vehicle:jobForm.vehicle,scope_summary:q.scope_summary,
     special_instructions:jobForm.special_instructions,quoted_amount:q.price_amount||null,paid_amount:0
   }).select('*').single();
   if(error){setMessage(error.message);return}
   await supabase.from('quotes').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',q.id);
   if(q.enquiry_id)await supabase.from('enquiries').update({status:'booked',updated_at:new Date().toISOString()}).eq('id',q.enquiry_id);
   await logActivity({job_id:data.id,quote_id:q.id,enquiry_id:q.enquiry_id,event_type:'job_created',title:`Job ${job_number} created`,details:`${q.pickup_suburb} to ${q.delivery_suburb}`});
   setMessage(`Job ${job_number} created.`);setJobForm({scheduled_start:"",scheduled_end:"",pickup_address:"",delivery_address:"",crew:"",vehicle:"",special_instructions:""});
   await Promise.all([loadJobs(),loadQuotes(),loadEnquiries()]);setSelectedJob(data);setView('jobs');
 }
 async function updateJobStatus(j:Job,status:string){
   const {error}=await supabase.from('jobs').update({status,updated_at:new Date().toISOString()}).eq('id',j.id);
   if(error){setMessage(error.message);return}
   await logActivity({job_id:j.id,quote_id:j.quote_id,enquiry_id:j.enquiry_id,event_type:'job_status',title:`Job marked ${status}`,details:j.job_number});
   await loadJobs();setSelectedJob({...j,status});
 }
 async function updateJobField(j:Job,field:string,value:any){
   const finalValue=(field==='scheduled_start'||field==='scheduled_end')&&value?new Date(value).toISOString():value;
   const {error}=await supabase.from('jobs').update({[field]:finalValue,updated_at:new Date().toISOString()}).eq('id',j.id);
   if(error){setMessage(error.message);return}
   await loadJobs();setSelectedJob({...j,[field]:finalValue});
 }
 async function signOut(){await supabase.auth.signOut();router.replace('/login')}

 const newLeads=enquiries.filter(e=>!e.archived_at&&e.status==='new').length;
 const followUps=enquiries.filter(e=>!e.archived_at&&e.follow_up_at&&new Date(e.follow_up_at)<=new Date(Date.now()+86400000)&&!['closed','declined','booked'].includes(e.status)).length;
 const openQuotes=quotes.filter(q=>!q.archived_at&&['draft','approved','sent'].includes(q.status)).length;
 const upcomingJobs=jobs.filter(j=>!j.archived_at&&j.scheduled_start&&new Date(j.scheduled_start)>=new Date()&&!['completed','cancelled'].includes(j.status)).length;
 const filteredCustomers=useMemo(()=>customers.filter(c=>Boolean(c.archived_at)===showArchived).filter(c=>(c.name+' '+c.phone+' '+c.email).toLowerCase().includes(search.toLowerCase())),[customers,search]);
 const filteredEnquiries=useMemo(()=>enquiries.filter(e=>Boolean(e.archived_at)===showArchived).filter(e=>(e.customer_name+' '+e.pickup_suburb+' '+e.delivery_suburb+' '+e.status).toLowerCase().includes(search.toLowerCase())),[enquiries,search]);
 const filteredQuotes=useMemo(()=>quotes.filter(q=>Boolean(q.archived_at)===showArchived).filter(q=>(q.quote_number+' '+q.customer_name+' '+q.pickup_suburb+' '+q.delivery_suburb+' '+q.status).toLowerCase().includes(search.toLowerCase())),[quotes,search]);
 const filteredJobs=useMemo(()=>jobs.filter(j=>Boolean(j.archived_at)===showArchived).filter(j=>(j.job_number+' '+j.customer_name+' '+j.pickup_suburb+' '+j.delivery_suburb+' '+j.status).toLowerCase().includes(search.toLowerCase())),[jobs,search]);
 const relevantActivity=(enquiryId?:string,quoteId?:string,jobId?:string)=>activities.filter(a=>(enquiryId&&a.enquiry_id===enquiryId)||(quoteId&&a.quote_id===quoteId)||(jobId&&a.job_id===jobId)).slice(0,20);

 return <div className="shell">
  <aside className="sidebar"><h2 className="brand">MHH AI Manager</h2><div className="tagline">FROM OUR HANDS TO YOUR HOME</div><div className="nav">{([['dashboard','Dashboard'],['enquiries','Enquiries'],['quotes','Quotes'],['jobs','Jobs'],['customers','Customers'],['receptionist','AI Receptionist'],['marketing','Marketing'],['facebook','Facebook'],['settings','Settings']] as [View,string][]).map(([id,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);setMessage('')}}>{label}</button>)}</div><div className="muted version">Version 5.1.0</div></aside>
  <main className="main"><div className="top"><div><h1>MHH AI Business Manager</h1><div className="muted">Enquiry → quote → booking → job completion</div></div><div className="pill">{newLeads} new · {openQuotes} open quotes · {upcomingJobs} upcoming jobs</div></div>
  {message&&<div className="notice">{message}</div>}

  <section className={view==='dashboard'?'view active':'view'}>
   <div className="grid four"><div className="card"><div className="muted">New enquiries</div><div className="metric">{newLeads}</div></div><div className="card"><div className="muted">Open quotes</div><div className="metric">{openQuotes}</div></div><div className="card"><div className="muted">Upcoming jobs</div><div className="metric">{upcomingJobs}</div></div><div className="card"><div className="muted">Follow-ups due</div><div className="metric">{followUps}</div></div></div>
   <div className="grid two" style={{marginTop:18}}>
    <div className="card"><h3>Needs attention</h3>{enquiries.filter(e=>e.status==='new').slice(0,5).map(e=><button className="leadRow" key={e.id} onClick={()=>{setSelected(e);setView('enquiries')}}><strong>{e.customer_name}</strong><span>{e.pickup_suburb} → {e.delivery_suburb}</span><span>{new Date(e.created_at).toLocaleDateString('en-AU')}</span></button>)}{!newLeads&&<p className="muted">No new enquiries.</p>}</div>
    <div className="card"><h3>Next jobs</h3>{jobs.filter(j=>j.scheduled_start&&new Date(j.scheduled_start)>=new Date()&&!['completed','cancelled'].includes(j.status)).slice(0,5).map(j=><button className="leadRow" key={j.id} onClick={()=>{setSelectedJob(j);setView('jobs')}}><strong>{j.customer_name}</strong><span>{new Date(j.scheduled_start!).toLocaleString('en-AU')}</span><span>{j.pickup_suburb} → {j.delivery_suburb}</span></button>)}{!upcomingJobs&&<p className="muted">No upcoming jobs scheduled.</p>}</div>
   </div>
  </section>

  <section className={view==='enquiries'?'view active':'view'}><div className="grid two"><div className="card"><div className="sectionHead"><h3>Enquiry Pipeline</h3><div className="listTools"><button className="btn secondary small" onClick={()=>{setShowArchived(!showArchived);setSelected(null)}}>{showArchived?"Show active":"Show archived"}</button><input className="searchBox" placeholder="Search enquiries" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>{filteredEnquiries.map(e=><button key={e.id} className={`leadRow ${selected?.id===e.id?'selected':''}`} onClick={()=>{setSelected(e);setQuoteDraft(null)}}><div><strong>{e.customer_name}</strong><span className="badge">{e.status}</span></div><span>{e.pickup_suburb} → {e.delivery_suburb}</span><span>{new Date(e.created_at).toLocaleString('en-AU')}</span></button>)}{!filteredEnquiries.length&&<p className="muted">No enquiries found.</p>}</div><div className="card">{!selected?<p className="muted">Select an enquiry to review it.</p>:<div><div className="sectionHead"><h3>{selected.customer_name}</h3><span className="badge">{selected.status}</span></div><p><strong>Phone:</strong> <a href={`tel:${selected.phone}`}>{selected.phone}</a></p><p><strong>Email:</strong> {selected.email||'Not supplied'}</p><div className="notice"><strong>Enquiry summary</strong><br/>{selected.ai_summary}</div><p><strong>Move:</strong> {selected.pickup_suburb} → {selected.delivery_suburb}</p><p><strong>Date:</strong> {selected.preferred_date||'Flexible / not supplied'}</p><p><strong>Property:</strong> {selected.property_size||'Not supplied'}</p><p><strong>Stairs:</strong> {selected.stairs} · <strong>Steep driveway:</strong> {selected.steep_driveway}</p><p><strong>Heavy items:</strong> {selected.heavy_items||'None listed'}</p><p><strong>Items:</strong> {selected.item_summary||'Not supplied'}</p><label>Status</label><select value={selected.status} onChange={e=>setEnquiryStatus(selected.id,e.target.value)}><option>new</option><option>contacted</option><option>quoted</option><option>booked</option><option>closed</option><option>declined</option></select><label>Follow-up date and time</label><input type="datetime-local" defaultValue={localInput(selected.follow_up_at)} onBlur={e=>setFollowUp(selected.id,e.target.value)}/><div className="actions"><a className="btn linkBtn" href={`tel:${selected.phone}`}>Call</a><a className="btn secondary linkBtn" href={`sms:${selected.phone}`}>SMS</a>{!selected.customer_id&&<button className="btn secondary" onClick={()=>convertToCustomer(selected)}>Convert to customer</button>}<button className="btn" onClick={()=>generateQuote(selected)} disabled={quoteLoading}>{quoteLoading?'Drafting…':'Generate quote'}</button></div><div className="recordControls">{selected.archived_at?<button className="btn secondary" onClick={()=>archiveRecord('enquiries',selected.id,true)}>Restore enquiry</button>:<button className="btn secondary" onClick={()=>archiveRecord('enquiries',selected.id)}>Archive enquiry</button>}<button className="btn danger" onClick={()=>permanentlyDelete('enquiries',selected.id,`enquiry for ${selected.customer_name}`)}>Delete permanently</button></div>
       {quoteDraft&&<div className="quoteEditor"><h3>AI Quote Workspace</h3><div className="notice"><strong>Scope:</strong><br/>{quoteDraft.scope_summary}</div><p><strong>Risk flags:</strong> {quoteDraft.risk_flags}</p><p><strong>Missing information:</strong> {quoteDraft.missing_information}</p><label>Customer-facing draft</label><textarea value={quoteDraft.draft_message} onChange={e=>setQuoteDraft({...quoteDraft,draft_message:e.target.value})}/><div className="grid two"><div><label>Final price (AUD)</label><input type="number" min="0" step="0.01" value={quotePrice} onChange={e=>setQuotePrice(e.target.value)}/></div><div><label>Deposit (AUD)</label><input type="number" min="0" step="0.01" value={quoteDeposit} onChange={e=>setQuoteDeposit(e.target.value)}/></div></div><label>Valid until</label><input type="date" value={quoteValidUntil} onChange={e=>setQuoteValidUntil(e.target.value)}/><label>Internal notes</label><textarea value={quoteNotes} onChange={e=>setQuoteNotes(e.target.value)}/><button className="btn" onClick={()=>saveQuote(selected)}>Save quote</button></div>}
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

  <section className={view==='facebook'?'view active':'view'}><div className="grid two"><div className="card"><h3>Facebook Connection</h3><p>Read access: <strong className={metaConnected?'success':'error'}>{metaConnected?'Connected':'Not connected'}</strong></p><p>Last sync: {lastSync?new Date(lastSync).toLocaleString('en-AU'):'Never'}</p><button className="btn" disabled={metaLoading} onClick={syncFacebook}>{metaLoading?'Syncing…':'Refresh Facebook Posts'}</button></div><div className="card"><h3>Recent Page Posts</h3>{metaPosts.map((p:any)=><div className="campaign" key={p.id}><div className="muted">{new Date(p.created_time).toLocaleString('en-AU')}</div><p>{p.message||'(Post without text)'}</p></div>)}</div></div></section>

  <section className={view==='settings'?'view active':'view'}><div className="card"><h3>System</h3><p>Application version: <strong>5.1.0</strong></p><p>Operational tables: <strong className="success">enquiries + customers + quotes + jobs + activity</strong></p><p>Quote AI: <strong className="success">Owner-controlled pricing</strong></p><div className="notice">Run supabase/v5.1-migration.sql before using archive or restore.</div><button className="btn danger" onClick={signOut}>Sign out</button></div></section>
  </main>
 </div>
}

function Timeline({items}:{items:Activity[]}){
 return <div className="timeline"><h3>Activity timeline</h3>{items.length===0?<p className="muted">No activity recorded yet.</p>:items.map(item=><div className="timelineItem" key={item.id}><div className="timelineDot"/><div><strong>{item.title}</strong><div className="muted">{new Date(item.created_at).toLocaleString('en-AU')}</div>{item.details&&<p>{item.details}</p>}</div></div>)}</div>
}

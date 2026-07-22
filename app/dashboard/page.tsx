'use client';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Campaign={id:string;created_at:string;title:string;objective:string;audience:string;offer:string;content:string;status:string};
type View="dashboard"|"create"|"campaigns"|"facebook"|"calendar"|"settings";

export default function Dashboard(){
 const router=useRouter(); const [view,setView]=useState<View>("dashboard"); const [userId,setUserId]=useState(""); const [campaigns,setCampaigns]=useState<Campaign[]>([]);
 const [objective,setObjective]=useState("Generate furniture-removal quote enquiries"); const [audience,setAudience]=useState("Adults in Nanango, Kingaroy and the South Burnett"); const [offer,setOffer]=useState("Reliable local furniture removals handled with care"); const [notes,setNotes]=useState("");
 const [draft,setDraft]=useState(""); const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
 const [metaConnected,setMetaConnected]=useState(false);
 const [metaPublishing,setMetaPublishing]=useState(false);
 const [metaMessage,setMetaMessage]=useState("Not checked");
 const [metaPosts,setMetaPosts]=useState<any[]>([]);
 const [metaLoading,setMetaLoading]=useState(false);


 useEffect(()=>{(async()=>{const {data}=await supabase.auth.getSession();if(!data.session){router.replace("/login");return}setUserId(data.session.user.id);await loadCampaigns();})();},[]);
 async function loadCampaigns(){const {data,error}=await supabase.from("campaigns").select("*").order("created_at",{ascending:false});if(!error)setCampaigns(data||[]);}
 async function generate(){setLoading(true);setMessage("");setDraft("");const {data}=await supabase.auth.getSession();const token=data.session?.access_token;
  const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({objective,audience,offer,notes})});const j=await r.json();setLoading(false);if(!r.ok){setMessage(j.error||"Generation failed");return}setDraft(j.text);
 }
 async function save(){if(!draft)return;const title=(draft.match(/Campaign name[:\\s]*([^\\n]+)/i)?.[1]||objective).slice(0,120);const {error}=await supabase.from("campaigns").insert({user_id:userId,title,objective,audience,offer,content:draft,status:"draft"});if(error){setMessage(error.message);return}setMessage("Campaign saved permanently.");await loadCampaigns();}
 async function updateStatus(id:string,status:string){await supabase.from("campaigns").update({status}).eq("id",id);await loadCampaigns();}
 async function remove(id:string){if(!confirm("Delete this campaign?"))return;await supabase.from("campaigns").delete().eq("id",id);await loadCampaigns();}

 async function checkFacebook(){
  setMetaLoading(true);setMetaMessage("Checking connection…");
  const {data}=await supabase.auth.getSession();
  const token=data.session?.access_token;
  const r=await fetch("/api/meta",{headers:{Authorization:`Bearer ${token}`}});
  const j=await r.json();
  setMetaLoading(false);
  if(!r.ok){setMetaConnected(false);setMetaMessage(j.error||"Connection failed");return}
  setMetaConnected(Boolean(j.connected));
  setMetaPublishing(Boolean(j.publishingEnabled));
  setMetaMessage(j.connected?"Facebook Page connected.":(j.message||"Not connected"));
  setMetaPosts(j.posts||[]);
 }
 async function publishCampaign(id:string){
  if(!confirm("Publish this approved campaign to the connected Facebook Page now?"))return;
  const {data}=await supabase.auth.getSession();
  const token=data.session?.access_token;
  const r=await fetch("/api/meta/publish",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({campaignId:id})});
  const j=await r.json();
  if(!r.ok){alert(j.error||"Publishing failed");return}
  alert(j.message||"Published");
  await loadCampaigns();
 }
 async function signOut(){await supabase.auth.signOut();router.replace("/login");}
 const approved=campaigns.filter(c=>c.status==="approved").length;
 const monthCount=campaigns.filter(c=>new Date(c.created_at).getMonth()===new Date().getMonth()).length;

 return <div className="shell">
 <aside className="sidebar"><h2 className="brand">MHH AI Manager</h2><div className="tagline">FROM OUR HANDS TO YOUR HOME</div><div className="nav">
 {([["dashboard","Dashboard"],["create","Create Campaign"],["campaigns","Campaign Library"],["facebook","Facebook"],["calendar","Content Plan"],["settings","Settings"]] as [View,string][]).map(([id,label])=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}>{label}</button>)}
 </div></aside>
 <main className="main"><div className="top"><div><h1>Marketing Manager v2</h1><div className="muted">Secure login · permanent memory · approval workflow</div></div><div className="pill">Publishing disabled</div></div>

 <section className={view==="dashboard"?"view active":"view"}><div className="grid"><div className="card"><div className="muted">Saved campaigns</div><div className="metric">{campaigns.length}</div></div><div className="card"><div className="muted">Approved drafts</div><div className="metric">{approved}</div></div><div className="card"><div className="muted">Created this month</div><div className="metric">{monthCount}</div></div></div>
 <div className="card" style={{marginTop:18}}><h3>Next action</h3><p>Create a campaign, save it to the permanent library, then mark it approved after you review it.</p><button className="btn" onClick={()=>setView("create")}>Create campaign</button></div></section>

 <section className={view==="create"?"view active":"view"}><div className="grid two"><div className="card"><h3>Campaign Brief</h3><label>Objective</label><select value={objective} onChange={e=>setObjective(e.target.value)}><option>Generate furniture-removal quote enquiries</option><option>Generate phone calls</option><option>Increase local Facebook engagement</option><option>Promote Marketplace pickups</option><option>Promote small house moves</option></select><label>Audience</label><input value={audience} onChange={e=>setAudience(e.target.value)}/><label>Offer or message</label><input value={offer} onChange={e=>setOffer(e.target.value)}/><label>Extra instructions</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Example: Friday evening engagement post."/><div className="actions"><button className="btn" onClick={generate} disabled={loading}>{loading?"Generating…":"Generate draft"}</button><button className="btn secondary" onClick={save} disabled={!draft}>Save campaign</button></div>{message&&<p className={message.includes("saved")?"success":"error"}>{message}</p>}</div><div className="card"><h3>Campaign Draft</h3><div className="result muted">{draft||"Your campaign will appear here."}</div></div></div></section>

 <section className={view==="campaigns"?"view active":"view"}><div className="card"><h3>Campaign Library</h3>{campaigns.length===0?<p className="muted">No campaigns saved yet.</p>:campaigns.map(c=><div className="campaign" key={c.id}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><strong>{c.title}</strong><div className="muted">{new Date(c.created_at).toLocaleString("en-AU")}</div></div><span className="badge">{c.status}</span></div><details style={{marginTop:12}}><summary>View campaign</summary><div className="result" style={{marginTop:12}}>{c.content}</div></details><div className="actions"><button className="btn secondary" onClick={()=>updateStatus(c.id,"approved")}>Approve</button><button className="btn secondary" onClick={()=>updateStatus(c.id,"draft")}>Return to draft</button><button className="btn danger" onClick={()=>remove(c.id)}>Delete</button>{c.status==="approved"&&metaPublishing&&<button className="btn" onClick={()=>publishCampaign(c.id)}>Publish to Facebook</button>}</div></div>)}</div></section>


 <section className={view==="facebook"?"view active":"view"}><div className="grid two">
  <div className="card"><h3>Facebook Business Page</h3>
   <p>Connect the dashboard to your Ma's Helping Hand Page to read recent posts and, after you deliberately enable it, publish approved campaigns.</p>
   <div className="notice">Publishing remains off by default. The Meta Page token is stored only in Vercel and is never exposed in the browser.</div>
   <div className="actions"><button className="btn" onClick={checkFacebook} disabled={metaLoading}>{metaLoading?"Checking…":"Test Facebook Connection"}</button></div>
   <p className={metaConnected?"success":"error"}>{metaMessage}</p>
   <p>Read access: <strong>{metaConnected?"Connected":"Not connected"}</strong></p>
   <p>Publishing: <strong>{metaPublishing?"Enabled":"Disabled"}</strong></p>
  </div>
  <div className="card"><h3>Recent Page Posts</h3>
   {!metaPosts.length?<p className="muted">Connect Facebook to load the ten most recent Page posts.</p>:metaPosts.map((p:any)=><div className="campaign" key={p.id}><div className="muted">{new Date(p.created_time).toLocaleString("en-AU")}</div><p>{p.message||"(Post without text)"}</p>{p.permalink_url&&<a href={p.permalink_url} target="_blank" rel="noreferrer" style={{color:"var(--gold2)"}}>Open on Facebook</a>}</div>)}
  </div>
 </div></section>

 <section className={view==="calendar"?"view active":"view"}><div className="card"><h3>Recommended Weekly Content Plan</h3><p><strong>Monday:</strong> Marketplace pickup engagement post</p><p><strong>Wednesday:</strong> Removal quote lead-generation post</p><p><strong>Friday:</strong> Weekend availability or moving tip</p><div className="notice">Calendar scheduling and Facebook publishing will be added after Meta authorisation.</div></div></section>

 <section className={view==="settings"?"view active":"view"}><div className="card"><h3>Security & Connections</h3><p>Signed in with Supabase authentication.</p><p>Campaigns are protected by Row Level Security and belong only to the signed-in account.</p><p>Facebook Page: <strong className={metaConnected?"success":"error"}>{metaConnected?"Connected":"Not connected"}</strong></p><p>Facebook publishing: <strong className={metaPublishing?"success":"error"}>{metaPublishing?"Enabled":"Disabled"}</strong></p><p>GitHub website editing: <strong className="error">Not connected</strong></p><div className="notice">Do not add Facebook or GitHub passwords to Vercel. Those connections must use OAuth or restricted tokens.</div><button className="btn danger" onClick={signOut}>Sign out</button></div></section>
 </main></div>;
}

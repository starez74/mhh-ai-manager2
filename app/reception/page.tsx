'use client';
import { useMemo, useState } from "react";

const steps = [
  "Contact details",
  "Move locations",
  "Access and items",
  "Review"
];

export default function ReceptionPage(){
  const [step,setStep]=useState(0);
  const [sending,setSending]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState("");
  const [form,setForm]=useState({
    customer_name:"",phone:"",email:"",preferred_contact:"phone",
    pickup_suburb:"",delivery_suburb:"",preferred_date:"",property_size:"",
    stairs:"No",steep_driveway:"No",heavy_items:"",item_summary:"",extra_notes:""
  });
  const set=(key:string,value:string)=>setForm(f=>({...f,[key]:value}));
  const canNext=useMemo(()=>{
    if(step===0)return Boolean(form.customer_name&&form.phone);
    if(step===1)return Boolean(form.pickup_suburb&&form.delivery_suburb);
    return true;
  },[step,form]);
  async function submit(){
    setSending(true);setError("");
    const r=await fetch("/api/reception/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const j=await r.json();setSending(false);
    if(!r.ok){setError(j.error||"Could not submit your request.");return}
    setDone(true);
  }
  if(done)return <div className="loginWrap"><div className="card login"><h1>Thank you</h1><p>Your removal enquiry has been sent to Ma&apos;s Helping Hand.</p><p>Mick will review the details and contact you using your preferred method.</p><div className="notice">For urgent enquiries, call <strong>0412 144 297</strong>.</div></div></div>;
  return <div className="loginWrap"><div className="card" style={{width:"min(760px,100%)"}}>
    <div className="tagline">MA&apos;S HELPING HAND · FROM OUR HANDS TO YOUR HOME</div>
    <h1>Removal Quote Assistant</h1>
    <p className="muted">I&apos;ll collect the details Mick needs to prepare your quote. This usually takes about two minutes.</p>
    <div className="progress"><div style={{width:`${((step+1)/steps.length)*100}%`}}/></div>
    <p><strong>Step {step+1} of {steps.length}:</strong> {steps[step]}</p>
    {step===0&&<div className="grid two"><div><label>Your name *</label><input value={form.customer_name} onChange={e=>set("customer_name",e.target.value)}/><label>Phone *</label><input value={form.phone} onChange={e=>set("phone",e.target.value)}/></div><div><label>Email</label><input value={form.email} onChange={e=>set("email",e.target.value)}/><label>Preferred contact</label><select value={form.preferred_contact} onChange={e=>set("preferred_contact",e.target.value)}><option value="phone">Phone call</option><option value="sms">Text message</option><option value="email">Email</option><option value="facebook">Facebook</option></select></div></div>}
    {step===1&&<div className="grid two"><div><label>Pickup suburb *</label><input value={form.pickup_suburb} onChange={e=>set("pickup_suburb",e.target.value)}/><label>Delivery suburb *</label><input value={form.delivery_suburb} onChange={e=>set("delivery_suburb",e.target.value)}/></div><div><label>Preferred moving date</label><input type="date" value={form.preferred_date} onChange={e=>set("preferred_date",e.target.value)}/><label>Property size</label><select value={form.property_size} onChange={e=>set("property_size",e.target.value)}><option value="">Select</option><option>Single item</option><option>Studio / room</option><option>1 bedroom</option><option>2 bedrooms</option><option>3 bedrooms</option><option>4+ bedrooms</option></select></div></div>}
    {step===2&&<div><div className="grid two"><div><label>Are there stairs?</label><select value={form.stairs} onChange={e=>set("stairs",e.target.value)}><option>No</option><option>At pickup</option><option>At delivery</option><option>At both</option></select></div><div><label>Steep incline driveway?</label><select value={form.steep_driveway} onChange={e=>set("steep_driveway",e.target.value)}><option>No</option><option>At pickup</option><option>At delivery</option><option>At both</option></select></div></div><label>Heavy or special items</label><input value={form.heavy_items} onChange={e=>set("heavy_items",e.target.value)} placeholder="Example: piano, safe, large fridge"/><label>What needs to be moved?</label><textarea value={form.item_summary} onChange={e=>set("item_summary",e.target.value)} placeholder="A brief list is fine."/><label>Anything else Mick should know?</label><textarea value={form.extra_notes} onChange={e=>set("extra_notes",e.target.value)}/></div>}
    {step===3&&<div className="result"><h3>Enquiry summary</h3><p><strong>{form.customer_name}</strong> · {form.phone}</p><p>{form.pickup_suburb} → {form.delivery_suburb}</p><p>Date: {form.preferred_date||"Flexible / not supplied"}</p><p>Property: {form.property_size||"Not supplied"}</p><p>Stairs: {form.stairs} · Steep driveway: {form.steep_driveway}</p><p>Heavy items: {form.heavy_items||"None listed"}</p><p>{form.item_summary}</p><p>{form.extra_notes}</p></div>}
    {error&&<p className="error">{error}</p>}
    <div className="actions">{step>0&&<button className="btn secondary" onClick={()=>setStep(s=>s-1)}>Back</button>}{step<3?<button className="btn" disabled={!canNext} onClick={()=>setStep(s=>s+1)}>Continue</button>:<button className="btn" disabled={sending} onClick={submit}>{sending?"Sending…":"Send quote request"}</button>}</div>
    <p className="muted" style={{fontSize:12}}>Your details are sent securely to Ma&apos;s Helping Hand and are used only to respond to your enquiry.</p>
  </div></div>;
}

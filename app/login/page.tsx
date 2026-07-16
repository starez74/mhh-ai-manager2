'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
export default function Login(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [mode,setMode]=useState<"login"|"signup">("login"); const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setError("");
  const result=mode==="login"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
  if(result.error){setError(result.error.message);return}
  if(mode==="signup"&&!result.data.session){setError("Check your email to confirm the account, then sign in.");return}
  router.replace("/dashboard");
 }
 return <div className="loginWrap"><div className="card login"><h1 className="serif">MHH AI Manager</h1><p className="tagline">FROM OUR HANDS TO YOUR HOME</p>
 <h2>{mode==="login"?"Secure sign in":"Create owner account"}</h2>
 <form onSubmit={submit}><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/><label>Password</label><input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/>
 {error&&<p className={error.startsWith("Check")?"success":"error"}>{error}</p>}<div className="actions"><button className="btn" type="submit">{mode==="login"?"Sign in":"Create account"}</button><button className="btn secondary" type="button" onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"First-time setup":"Back to sign in"}</button></div></form>
 </div></div>
}

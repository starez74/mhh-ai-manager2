import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const prompt=`You are the private marketing manager for Ma's Helping Hand, a furniture removals business in Nanango, Queensland.
Business facts: website https://mhhremoval.com.au; phone 0412 144 297; address 62 Drayton St, Nanango QLD; ABN 70 051 256 598; tagline FROM OUR HANDS TO YOUR HOME.
Furniture removals are primary. Second-hand furniture sales are secondary.
Brand colours are deep navy #031529, navy #071F37, gold #D7A941 and pale gold #F1D370. Never recolour or redesign the original truck logo.
Use Australian English. Never claim insurance, invent reviews, qualifications, prices or guarantees. Produce drafts only and include a clear call to action.`;

export async function POST(req:NextRequest){
 try{
  const auth=req.headers.get("authorization")||""; const token=auth.replace(/^Bearer\\s+/,"");
  if(!token)return NextResponse.json({error:"Please sign in again."},{status:401});
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const {data,error}=await supabase.auth.getUser(token); if(error||!data.user)return NextResponse.json({error:"Your login session is invalid."},{status:401});
  const {objective,audience,offer,notes}=await req.json();
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const response=await client.responses.create({model:process.env.OPENAI_MODEL||"gpt-5-mini",instructions:prompt,input:`Create a complete Facebook marketing campaign draft.
Objective: ${objective}
Audience: ${audience}
Offer/message: ${offer}
Owner notes: ${notes||"None"}
Return: Campaign name; objective; audience; primary Facebook copy; headline; description; CTA; branded image brief; posting time; optional paid budget and duration; website support; measurement plan; compliance check.`});
  return NextResponse.json({text:response.output_text});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unexpected error"},{status:500})}
}

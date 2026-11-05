// Optional AI itinerary endpoint. Disabled by default. No paid API calls unless
// both server-side env vars are explicitly configured by the owner.
const send=(res,code,data)=>res.status(code).json(data);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Method not allowed'});}
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return send(res,415,{error:'JSON required'});
 if(process.env.TRIPSOLVED_AI_ENABLED!=='true'||!process.env.OPENAI_API_KEY)return send(res,503,{status:'ai_disabled',message:'AI plánovanie zatiaľ nie je aktivované.'});
 const b=req.body;
 if(!b||typeof b!=='object'||Array.isArray(b)||typeof b.description!=='string'||b.description.trim().length<8||b.description.length>3000)return send(res,400,{error:'Invalid description'});
 const travelers=Number(b.travelers??2);
 const departure=typeof b.departure==='string'?b.departure.slice(0,160):'';
 const dates=typeof b.dates==='string'?b.dates.slice(0,160):'';
 const budget=b.budgetEur==null?null:Number(b.budgetEur);
 if(!Number.isInteger(travelers)||travelers<1||travelers>30||(budget!==null&&(!Number.isFinite(budget)||budget<1||budget>1000000)))return send(res,400,{error:'Invalid constraints'});
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch('https://api.openai.com/v1/responses',{
   method:'POST',signal:controller.signal,
   headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({model:'gpt-4.1-mini',max_output_tokens:650,store:false,
    instructions:'You are TripSolved, a Slovak travel planner. Return concise Slovak plain text. Give a realistic personalized itinerary based ONLY on user constraints. Never fabricate specific prices, live availability, schedules, hotel vacancies, flight offers, bookings or verified facts. If destination is missing, ask for it and provide only a conditional illustrative outline. Do not claim to have checked providers. State that prices and reservations are not verified.',
    input:JSON.stringify({description:b.description.trim(),departure,dates,travelers,budgetEur:budget})})
  });
  if(!response.ok)return send(res,502,{status:'ai_unavailable',message:'AI služba momentálne neodpovedá.'});
  const data=await response.json();
  const text=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim();
  if(!text)return send(res,502,{status:'ai_unavailable',message:'AI služba nevrátila plán.'});
  return send(res,200,{status:'ai_ready',text:text.slice(0,6000),verifiedPrices:[],bookingAvailable:false,disclaimer:'AI návrh nie je overenou ponukou. Ceny, dostupnosť a rezervácie nie sú overené.'});
 }catch{return send(res,502,{status:'ai_unavailable',message:'AI služba momentálne nie je dostupná.'});}
 finally{clearTimeout(timer);}
}

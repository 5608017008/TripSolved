// Transactional travel inquiry endpoint. Disabled until anti-abuse infrastructure
// and a verified transactional mail key are explicitly configured.
const respond=(res,status,data)=>res.status(status).json(data);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(res,405,{error:'Method not allowed'});}
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return respond(res,415,{error:'JSON required'});
 if(process.env.TRIPSOLVED_INQUIRIES_ENABLED!=='true'||!process.env.RESEND_API_KEY||process.env.TRIPSOLVED_INQUIRY_SECURITY_READY!=='true'||!process.env.TURNSTILE_SECRET_KEY||!process.env.TRIPSOLVED_INQUIRY_TO||!process.env.TRIPSOLVED_TURNSTILE_HOSTNAME)return respond(res,503,{status:'inquiries_disabled'});
 const b=req.body;
 const recipient=process.env.TRIPSOLVED_INQUIRY_TO;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))return respond(res,503,{status:'inquiries_disabled'});
 if(!b||typeof b!=='object'||Array.isArray(b))return respond(res,400,{error:'Invalid request'});
 const description=typeof b.description==='string'?b.description.trim():'';
 const email=typeof b.email==='string'?b.email.trim():'';
 const departure=typeof b.departure==='string'?b.departure.trim():'';
 const dates=typeof b.dates==='string'?b.dates.trim():'';
 const travelers=Number(b.travelers);
 const budget=b.budgetEur==null||b.budgetEur===''?null:Number(b.budgetEur);
 if(description.length<8||description.length>3000||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||departure.length>160||dates.length>160||!Number.isInteger(travelers)||travelers<1||travelers>30||(budget!==null&&(!Number.isFinite(budget)||budget<1||budget>1000000)))return respond(res,400,{error:'Invalid trip inquiry'});
 // Turnstile tokens are verified server-side. A client-supplied header is not security.
 const token=typeof b.turnstileToken==='string'?b.turnstileToken:'';
 if(!token||token.length>2048)return respond(res,403,{error:'Security verification required'});
 try{
  const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:token})});
  const result=await verification.json();
  if(!result.success||result.hostname!==process.env.TRIPSOLVED_TURNSTILE_HOSTNAME)return respond(res,403,{error:'Security verification failed'});
 }catch{return respond(res,503,{error:'Security verification unavailable'});}
 const text=['TripSolved — nový nezáväzný cestovný dopyt','Kontakt: '+email,'Počet osôb: '+travelers,'Odchod: '+departure,'Termín: '+dates,'Rozpočet EUR: '+(budget??'neuvedený'),'Zadanie:',description].join('\n');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
 try{
  const upstream=await fetch('https://api.resend.com/emails',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:'TripSolved <tripsolved@nexisdata.eu>',to:[recipient],reply_to:email,subject:'TripSolved — nový nezáväzný dopyt',text})});
  if(!upstream.ok)return respond(res,502,{status:'delivery_unconfirmed'});
  const data=await upstream.json();
  if(!data.id)return respond(res,502,{status:'delivery_unconfirmed'});
  return respond(res,202,{status:'inquiry_accepted',message:'Dopyt bol prijatý na odoslanie. Potvrdenie doručenia ešte nie je k dispozícii.'});
 }catch{return respond(res,502,{status:'delivery_unconfirmed'});}
 finally{clearTimeout(timer);}
}

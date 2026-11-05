// Transparent rule-based draft planner. No AI model, live suppliers or prices.
const json=(res,status,data)=>res.status(status).json(data);
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Method not allowed'});}
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'JSON required'});
 const b=req.body;
 if(!b||typeof b!=='object'||Array.isArray(b))return json(res,400,{error:'Invalid request'});
 const description=typeof b.description==='string'?b.description.trim():'';
 const departure=typeof b.departure==='string'?b.departure.trim():'';
 const dates=typeof b.dates==='string'?b.dates.trim():'';
 const travelers=Number(b.travelers??1);
 const budget=b.budgetEur==null||b.budgetEur===''?null:Number(b.budgetEur);
 if(!description||description.length>3000||departure.length>160||dates.length>160||!Number.isInteger(travelers)||travelers<1||travelers>30||(budget!==null&&(!Number.isFinite(budget)||budget<1||budget>1000000)))return json(res,400,{error:'Invalid trip constraints'});
 const t=description.toLocaleLowerCase('sk');
 const seaside=/mor[eiua]|pláž|plaz|beach|more|oceán|ocean/.test(t);
 const city=/mest|city|pamiatk|múze|muze|galéri|galeri/.test(t);
 const mountain=/hor[ay]|turistik|tatry|hiking|prírod|prirod/.test(t);
 const flight=/letieť|leten|lietadl|odlet|flight|airport/.test(t+' '+departure.toLocaleLowerCase('sk'));
 const interests=[...(seaside?['Pláž a kúpanie']:[]),...(city?['Pamiatky a mesto']:[]),...(mountain?['Príroda a turistika']:[])];
 const steps=[
  'Upresni cieľovú destináciu a počet nocí, ak ešte nie sú uvedené.',
  'Over dostupné termíny a podmienky zrušenia priamo u poskytovateľov.',
  flight?'Porovnaj lety vrátane batožiny, prestupov a dopravy z letiska.':'Porovnaj vhodnú dopravu vrátane času cesty a prestupov.',
  seaside?'Vyber ubytovanie podľa skutočnej vzdialenosti od pláže a typu stravy.':mountain?'Over náročnosť trás, počasie a dostupnosť dopravy.':'Vyber ubytovanie podľa polohy, dostupnosti a podmienok.',
  'Pred platbou over konečnú cenu, storno podmienky a cestovné doklady.'
 ];
 return json(res,200,{status:'draft_ready',kind:'rule_based_draft',title:'Predbežný plán tvojej cesty',summary:`Cesta pre ${travelers} ${travelers===1?'osobu':'osoby/osôb'}${departure?' z '+departure:''}${dates?' v termíne '+dates:''}.`,interests,steps,budgetEur:budget,verifiedPrices:[],bookingAvailable:false,liveSearchAvailable:false,disclaimer:'Toto je orientačný plán podľa pravidiel, nie AI itinerár. Ceny, dostupnosť ani rezervácie nie sú overené.'});
}

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
 const people=travelers===1?'1 osobu':travelers>=2&&travelers<=4?travelers+' osoby':travelers+' osôb';
 const durationMatch=t.match(/(\\d{1,2})\\s*(?:dní|dni|dňa|nocí|noci|týždň|tyzdn)/);
 const weeks=/dva\\s+týžd|dva\\s+tyzd|2\\s*týžd|2\\s*tyzd/.test(t);
 const days=durationMatch?Math.min(14,Math.max(2,Number(durationMatch[1])*(/týžd|tyzd/.test(durationMatch[0])?7:1))):weeks?14:/týždeň|tyzden|týždňa|tyzdna/.test(t)?7:4;
 const focus=seaside?'sea':mountain?'nature':city?'city':'general';
 const themes={
  sea:['Príchod, ubytovanie a pokojná orientácia v okolí','Oddych pri mori a preskúmanie pláží','Nenáročný výlet v okolí','Voľný deň podľa počasia','Miestna kultúra a gastronómia','Rezervný deň na obľúbené aktivity','Odchod a návrat'],
  nature:['Príchod a kontrola predpovede počasia','Nenáročná trasa podľa kondície','Prírodné zaujímavosti v okolí','Oddych a alternatíva pri zlom počasí','Celodenný výlet s bezpečnou rezervou','Voľný deň alebo kratšia prechádzka','Odchod a návrat'],
  city:['Príchod a orientácia v meste','Historické centrum a hlavné pamiatky','Múzeá alebo galérie podľa záujmu','Miestne štvrte a gastronómia','Výlet do okolia','Voľný program a rezervné vstupy','Odchod a návrat'],
  general:['Príchod a orientácia v destinácii','Hlavné zaujímavosti podľa záujmu','Aktívny program alebo výlet','Oddychový deň','Miestna kultúra a gastronómia','Voľný program podľa počasia','Odchod a návrat']
 };
 const itinerary=Array.from({length:days},(_,i)=>({day:i+1,activity:i===days-1?'Odchod a návrat':themes[focus][Math.min(i,5)]}));
 const steps=[
  'Upresni cieľovú destináciu a počet nocí, ak ešte nie sú uvedené.',
  'Over dostupné termíny a podmienky zrušenia priamo u poskytovateľov.',
  flight?'Porovnaj lety vrátane batožiny, prestupov a dopravy z letiska.':'Porovnaj vhodnú dopravu vrátane času cesty a prestupov; pri vzdialenej destinácii over aj letecké spojenia.',
  seaside?'Vyber ubytovanie podľa skutočnej vzdialenosti od pláže a typu stravy.':mountain?'Over náročnosť trás, počasie a dostupnosť dopravy.':'Vyber ubytovanie podľa polohy, dostupnosti a podmienok.',
  'Pred platbou over konečnú cenu, storno podmienky a cestovné doklady.'
 ];
 return json(res,200,{status:'draft_ready',kind:'rule_based_draft',title:'Predbežný plán tvojej cesty',summary:`Cesta pre ${people}${departure?' s odchodom z miesta '+departure:''}${dates?' v termíne '+dates:''}.`,interests,steps,itinerary,estimatedDays:days,budgetEur:budget,verifiedPrices:[],bookingAvailable:false,liveSearchAvailable:false,disclaimer:'Toto je ilustračný itinerár podľa pravidiel, nie AI plán. Dĺžka môže byť odhadnutá zo zadania. Aktivity nie sú rezervované; ceny a dostupnosť nie sú overené.'});
}

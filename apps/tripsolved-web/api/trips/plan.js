import { locales, normalizeLocale } from '../../planner-locales.js';
// Transparent rule-based draft planner. No AI model, live suppliers or prices.
const json=(res,status,data)=>res.status(status).json(data);
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Method not allowed'});}
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return json(res,415,{error:'JSON required'});
 const b=req.body;
 if(!b||typeof b!=='object'||Array.isArray(b))return json(res,400,{error:'Invalid request'});

 const locale=normalizeLocale(b.locale);
 const english=locale==='en';
 const description=typeof b.description==='string'?b.description.trim():'';
 const departure=typeof b.departure==='string'?b.departure.trim():'';
 const dates=typeof b.dates==='string'?b.dates.trim():'';
 const travelers=Number(b.travelers??1);
 const budget=b.budgetEur==null||b.budgetEur===''?null:Number(b.budgetEur);
 if(!description||description.length>3000||departure.length>160||dates.length>160||!Number.isInteger(travelers)||travelers<1||travelers>30||(budget!==null&&(!Number.isFinite(budget)||budget<1||budget>1000000)))return json(res,400,{error:'Invalid trip constraints'});
 const t=description.toLocaleLowerCase('sk');
 const seaside=/mor[eiua]|pláž|plaz|beach|seaside|sea|ocean|coast|beachfront|mare|strand|plage|playa|plaża|tenger|moře|oceán/.test(t);
 const city=/mest|city|cities|museum|museums|sightseeing|historic|landmark|múze|muze|galéri|galeri|stadt|miasto|ville|ciudad|città|város/.test(t);
 const mountain=/hor[ay]|turistik|tatry|hiking|mountain|nature|trail|trekking|prírod|prirod|berg|montagne|montaña|góry|natura/.test(t);
 const flight=/letieť|leten|lietadl|odlet|flight|airport/.test(t+' '+departure.toLocaleLowerCase('sk'));
 const interests=[...(seaside?['Pláž a kúpanie']:[]),...(city?['Pamiatky a mesto']:[]),...(mountain?['Príroda a turistika']:[])];
 const people=travelers===1?'1 osobu':travelers>=2&&travelers<=4?travelers+' osoby':travelers+' osôb';
 const durationMatch=t.match(/\b(\d{1,2})\s*(dní|dni|dňa|nocí|noci|týžd\S*|tyzd\S*|days?|nights?|weeks?|tagen?|tage?|nächte\S*|wochen?|jours?|nuits?|semaines?|días?|noches?|semanas?|giorni|notti|settimane?|tygodni\S*|nocy|nap(?:ra|ot)?|éjszaka\S*|hét(?:re|ig)?|dny|nocí)(?=$|[^\p{L}])/u);
 const unit=durationMatch?.[2]||'';
 const weekUnit=/týžd|tyzd|week|woche|semaine|semana|settiman|tygod|hét/u.test(unit);
 const nightUnit=/noc|night|nächt|nuit|nott|éjszaka/u.test(unit);
 const twoWeeks=/dva\s+týžd|dva\s+tyzd|two\s+weeks|zwei\s+wochen|deux\s+semaines|dos\s+semanas|due\s+settimane|dwa\s+tygodnie|két\s+hét/u.test(t);
 const oneWeek=/týždeň|tyzden|týd(?:en|ne)|a week|one week|eine woche|une semaine|una semana|una settimana|tydzień|egy hét/u.test(t);
 const requestedDays=durationMatch?Number(durationMatch[1])*(weekUnit?7:1)+(nightUnit?1:0):twoWeeks?14:oneWeek?7:4;
 const days=Math.min(14,Math.max(2,requestedDays));
 const focus=seaside?'sea':mountain?'nature':city?'city':'general';
 const destinationPresets=[
  {match:/\blond[ýy]n|\blondon/i,label:'Londýn',days:['Westminster, Big Ben a prechádzka popri Temži','British Museum a Covent Garden','Tower of London a Tower Bridge','Hyde Park, Kensington a voľný program']},
  {match:/\brovinj/i,label:'Rovinj',days:['Historické centrum Rovinja a prístav','Pláže a pobrežná prechádzka pri Zlatnom myse','Výlet do Puly podľa dopravy a záujmu','Oddych pri mori a miestna gastronómia']},
  {match:/\bgda[ňn]sk|\bgdansk/i,label:'Gdansk',days:['Historické centrum a Dlhý trh','Nábrežie Motławy a Múzeum druhej svetovej vojny','Výlet do Sopotu podľa dopravy','Európske centrum Solidarity a voľný program']},
  {match:/\bedinburgh/i,label:'Edinburgh',days:['Royal Mile a historické centrum','Edinburgh Castle a Grassmarket','Arthur’s Seat podľa počasia a kondície','National Museum of Scotland a voľný program']}
 ];
 const destination=destinationPresets.find(p=>p.match.test(t));
 const themes={
  sea:['Príchod, ubytovanie a pokojná orientácia v okolí','Oddych pri mori a preskúmanie pláží','Nenáročný výlet v okolí','Voľný deň podľa počasia','Miestna kultúra a gastronómia','Rezervný deň na obľúbené aktivity','Odchod a návrat'],
  nature:['Príchod a kontrola predpovede počasia','Nenáročná trasa podľa kondície','Prírodné zaujímavosti v okolí','Oddych a alternatíva pri zlom počasí','Celodenný výlet s bezpečnou rezervou','Voľný deň alebo kratšia prechádzka','Odchod a návrat'],
  city:['Príchod a orientácia v meste','Historické centrum a hlavné pamiatky','Múzeá alebo galérie podľa záujmu','Miestne štvrte a gastronómia','Výlet do okolia','Voľný program a rezervné vstupy','Odchod a návrat'],
  general:['Príchod a orientácia v destinácii','Hlavné zaujímavosti podľa záujmu','Aktívny program alebo výlet','Oddychový deň','Miestna kultúra a gastronómia','Voľný program podľa počasia','Odchod a návrat']
 };
 const itinerary=Array.from({length:days},(_,i)=>({day:i+1,activity:i===days-1?'Odchod a návrat':i===0?themes[focus][0]:themes[focus][1+((i-1)%5)]}));
 if(destination){for(let i=1;i<days-1;i++)itinerary[i].activity=destination.days[(i-1)%destination.days.length];}
 const steps=[
  'Upresni cieľovú destináciu a počet nocí, ak ešte nie sú uvedené.',
  'Over dostupné termíny a podmienky zrušenia priamo u poskytovateľov.',
  flight?'Porovnaj lety vrátane batožiny, prestupov a dopravy z letiska.':'Porovnaj vhodnú dopravu vrátane času cesty a prestupov; pri vzdialenej destinácii over aj letecké spojenia.',
  seaside?'Vyber ubytovanie podľa skutočnej vzdialenosti od pláže a typu stravy.':mountain?'Over náročnosť trás, počasie a dostupnosť dopravy.':'Vyber ubytovanie podľa polohy, dostupnosti a podmienok.',
  'Pred platbou over konečnú cenu, storno podmienky a cestovné doklady.'
 ];
 const enPresets={
 'Londýn':['Westminster, Big Ben and a walk along the Thames','British Museum and Covent Garden','Tower of London and Tower Bridge','Hyde Park, Kensington and free time'],
 'Rovinj':['Rovinj old town and harbour','Beaches and coastal walk at Golden Cape','Optional excursion to Pula','Relaxing by the sea and local cuisine'],
 'Gdansk':['Old town and Long Market','Motława waterfront and World War II Museum','Optional trip to Sopot','European Solidarity Centre and free time'],
 'Edinburgh':['Royal Mile and historic centre','Edinburgh Castle and Grassmarket','Arthur’s Seat, weather permitting','National Museum of Scotland and free time']
 };
 const enThemes={
 sea:['Arrival, check-in and explore the surroundings','Relax at the beach and explore the coastline','An easy excursion nearby','Flexible day depending on weather','Local culture and cuisine','Extra day for favourite activities','Departure and return'],
 nature:['Arrival and check the weather forecast','Easy hike suited to your fitness','Natural attractions nearby','Rest day and wet-weather alternative','Full-day excursion with a safety margin','Free day or short walk','Departure and return'],
 city:['Arrival and orientation in the city','Historic centre and main sights','Museums or galleries of interest','Neighbourhoods and local cuisine','Day trip nearby','Flexible sightseeing and advance bookings','Departure and return'],
 general:['Arrival and orientation at destination','Main sights based on your interests','Activities or an excursion','Relaxed day','Local culture and cuisine','Flexible programme depending on weather','Departure and return']
 };
 if(locale!=='sk' && !english){
   const l=locales[locale];
   const named={
    'Londýn':['Westminster · Big Ben · Thames','British Museum · Covent Garden','Tower of London · Tower Bridge','Hyde Park · Kensington'],
    'Rovinj':['Rovinj','Zlatni rt','Pula','Rovinj'],
    'Gdansk':['Gdańsk · Długi Targ','Motława · Muzeum II Wojny Światowej','Sopot','Europejskie Centrum Solidarności'],
    'Edinburgh':['Royal Mile','Edinburgh Castle · Grassmarket','Arthur’s Seat','National Museum of Scotland']
   };
   const middle=[l[focus],l.excursion,l.rest,l.culture,l.flexible];
   const translatedItinerary=Array.from({length:days},(_,i)=>({day:i+1,activity:i===0?l.arrival:i===days-1?l.return:destination?named[destination.label][(i-1)%4]:middle[(i-1)%5]}));
   return json(res,200,{status:'draft_ready',kind:'rule_based_draft',locale,title:l.title,summary:[l.people+': '+travelers,departure&&l.departure+': '+departure,dates&&l.dates+': '+dates].filter(Boolean).join(' · '),interests:[],destination:destination?({'Londýn':'London'}[destination.label]||destination.label):null,steps:[l.destinationCheck,l.availabilityCheck,l.transportCheck,seaside?l.beachCheck:mountain?l.trailCheck:l.hotelCheck,l.paymentCheck],itinerary:translatedItinerary,estimatedDays:days,budgetEur:budget,verifiedPrices:[],bookingAvailable:false,liveSearchAvailable:false,disclaimer:l.disclaimer});
 }
 if(english){
   for(let i=0;i<itinerary.length;i++){
     const index=i;
     itinerary[i].activity=index===days-1?'Departure and return':index===0?enThemes[focus][0]:destination?enPresets[destination.label][(index-1)%4]:enThemes[focus][1+((index-1)%5)];
   }
   const enSteps=[
     'Confirm the destination and number of nights if not specified.',
     'Check dates, availability and cancellation policies directly with providers.',
     flight?'Compare flights including luggage, connections and airport transfers.':'Compare transport options, journey times and connections; check flights for longer distances.',
     seaside?'Choose accommodation based on actual beach distance and meal plan.':mountain?'Check trail difficulty, weather and local transport.':'Choose accommodation based on location, transport and terms.',
     'Before paying, verify the final price, cancellation terms and travel documents.'
   ];
   return json(res,200,{status:'draft_ready',kind:'rule_based_draft',locale:'en',title:'Preliminary travel itinerary',summary:'Trip '+(destination?'to '+({Londýn:'London',Rovinj:'Rovinj',Gdansk:'Gdansk',Edinburgh:'Edinburgh'}[destination.label]||destination.label)+' ':'')+'for '+travelers+' traveler(s)'+(departure?' departing from '+departure:'')+(dates?' during '+dates:'')+'.',interests:[],destination:destination?.label??null,steps:enSteps,itinerary,estimatedDays:days,budgetEur:budget,verifiedPrices:[],bookingAvailable:false,liveSearchAvailable:false,disclaimer:'This is an illustrative rule-based itinerary, not an AI-generated plan. Attractions are suggestions, not verified open venues. Duration may be estimated. Nothing has been booked; prices and availability have not been checked.'});
 }
 return json(res,200,{status:'draft_ready',kind:'rule_based_draft',locale:'sk',title:'Predbežný plán tvojej cesty',summary:`Cesta ${destination?'do destinácie '+destination.label+' ':''}pre ${people}${departure?' s odchodom z miesta '+departure:''}${dates?' v termíne '+dates:''}.`,interests,destination:destination?.label??null,steps,itinerary,estimatedDays:days,budgetEur:budget,verifiedPrices:[],bookingAvailable:false,liveSearchAvailable:false,disclaimer:'Toto je ilustračný itinerár podľa pravidiel, nie AI plán. Konkrétne miesta sú návrhy na návštevu, nie overené otvorené prevádzky. Dĺžka môže byť odhadnutá zo zadania. Aktivity nie sú rezervované; ceny a dostupnosť nie sú overené.'});
}


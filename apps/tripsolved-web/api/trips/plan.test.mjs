import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './plan.js';
function invoke(method,body,contentType='application/json'){
 const result={code:200,body:null};
 const res={setHeader(){},status(code){result.code=code;return this;},json(data){result.body=data;return this;}};
 handler({method,body,headers:{'content-type':contentType}},res);
 return result;
}
test('creates seaside draft with clear no-live-prices disclaimer',()=>{
 const r=invoke('POST',{description:'Týždeň pri mori',departure:'Krakov',dates:'jún 2027',travelers:2,budgetEur:1500});
 assert.equal(r.code,200);
 assert.equal(r.body.status,'draft_ready');
 assert.match(r.body.summary,/2 osoby/);
 assert.match(r.body.summary,/Krakov/);
 assert.ok(r.body.steps.some(x=>x.includes('pláže')));
 assert.deepEqual(r.body.verifiedPrices,[]);
 assert.equal(r.body.bookingAvailable,false);
 assert.equal(r.body.liveSearchAvailable,false);
});
test('singular grammar',()=>assert.match(invoke('POST',{description:'Mesto',travelers:1}).body.summary,/1 osobu/));
test('plural grammar',()=>assert.match(invoke('POST',{description:'Hory',travelers:5}).body.summary,/5 osôb/));
test('rejects empty',()=>assert.equal(invoke('POST',{description:''}).code,400));
test('rejects invalid traveler count',()=>assert.equal(invoke('POST',{description:'Trip',travelers:0}).code,400));
test('rejects wrong method',()=>assert.equal(invoke('GET',{}).code,405));
test('rejects non JSON',()=>assert.equal(invoke('POST',{description:'Trip'},'text/plain').code,415));

test('seven-day seaside itinerary has arrival and departure',()=>{const r=invoke('POST',{description:'Týždeň pri mori',travelers:2});assert.equal(r.body.itinerary.length,7);assert.match(r.body.itinerary[0].activity,/Príchod/);assert.match(r.body.itinerary[6].activity,/Odchod/);});
test('four-day default itinerary',()=>assert.equal(invoke('POST',{description:'Mestský pobyt',travelers:2}).body.itinerary.length,4));

test('explicit 10 days are respected',()=>assert.equal(invoke('POST',{description:'Chceme 10 dní pri mori',travelers:2}).body.itinerary.length,10));
test('two weeks produce 14 days',()=>assert.equal(invoke('POST',{description:'Chceme dva týždne pri mori',travelers:2}).body.itinerary.length,14));
test('numeric two weeks produce 14 days',()=>assert.equal(invoke('POST',{description:'Chceme 2 týždne pri mori',travelers:2}).body.itinerary.length,14));

test('London landmarks appear when destination is named',()=>{const r=invoke('POST',{description:'Chceme 4 dni v Londýne',travelers:2});assert.equal(r.body.destination,'Londýn');assert.match(r.body.itinerary[1].activity,/Westminster/);});
test('Rovinj landmarks appear when destination is named',()=>{const r=invoke('POST',{description:'Chceme 7 dní v Rovinji',travelers:2});assert.equal(r.body.destination,'Rovinj');assert.match(r.body.itinerary[1].activity,/Rovinja/);});


const samples={sk:'7 dní pri mori',cs:'7 dní u moře',en:'7 days at the beach',de:'7 Tage am Strand',pl:'7 dni nad morzem',hu:'7 nap a tenger mellett',fr:'7 jours à la plage',es:'7 días en la playa',it:'7 giorni al mare'};
for(const [locale,description] of Object.entries(samples)){
 test('localized itinerary and constraints: '+locale,()=>{
  const r=invoke('POST',{locale,description,departure:'Berlin',dates:'June 2027',travelers:3,budgetEur:1800});
  assert.equal(r.code,200);assert.equal(r.body.locale,locale);assert.equal(r.body.itinerary.length,7);
  assert.match(r.body.summary,/Berlin/);assert.match(r.body.summary,/June 2027/);assert.equal(r.body.budgetEur,1800);
  if(locale!=='sk'){
   assert.doesNotMatch(JSON.stringify(r.body),/Príchod|Odchod a návrat|Orientačný|Over dostupné/);
  }
  assert.equal(r.body.bookingAvailable,false);assert.deepEqual(r.body.verifiedPrices,[]);
 });
}
for(const description of ['2 weeks at the beach','2 Wochen am Strand','2 semaines à la plage','2 semanas en la playa','2 settimane al mare','2 tygodnie nad morzem','2 hét a tenger mellett']){
 test('international two-week duration: '+description,()=>assert.equal(invoke('POST',{locale:'en',description}).body.estimatedDays,14));
}
for(const description of ['6 nights','6 Nächte','6 nuits','6 noches','6 notti','6 éjszaka','6 nocí']){
 test('nights include departure day: '+description,()=>assert.equal(invoke('POST',{description}).body.estimatedDays,7));
}
test('regional locales normalize and unsupported locales use English',()=>{
 assert.equal(invoke('POST',{description:'7 Tage',locale:'de-DE'}).body.locale,'de');
 assert.equal(invoke('POST',{description:'Trip',locale:'unknown'}).body.locale,'en');
});

test('Polish, French and Spanish seaside requests select beach activities',()=>{
 for(const [locale,description,expected] of [['pl','7 dni nad morzem',/plaż/],['fr','7 jours à la mer',/plage/],['es','7 días junto al mar',/playa/]]){
  assert.match(invoke('POST',{locale,description}).body.itinerary[1].activity,expected);
 }
});

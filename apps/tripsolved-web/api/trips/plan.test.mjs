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

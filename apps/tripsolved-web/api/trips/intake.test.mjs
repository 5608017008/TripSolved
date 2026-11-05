import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './intake.js';
function invoke(method, body, contentType='application/json') {
  const result={statusCode:200,headers:{},body:null};
  const res={
    setHeader(name,value){result.headers[name]=value;},
    status(code){result.statusCode=code;return this;},
    json(payload){result.body=payload;return this;}
  };
  handler({method,body,headers:{'content-type':contentType}},res);
  return result;
}
test('accepts valid trip with no fabricated prices',()=>{
  const r=invoke('POST',{description:'Two people in the mountains',travelers:2,budgetEur:900});
  assert.equal(r.statusCode,200);
  assert.equal(r.body.status,'intake_accepted');
  assert.equal(r.body.bookingAvailable,false);
  assert.equal(r.body.searchAvailable,false);
  assert.deepEqual(r.body.prices,[]);
});
test('rejects invalid trip',()=>assert.equal(invoke('POST',{description:''}).statusCode,400));
test('rejects oversized trip',()=>assert.equal(invoke('POST',{description:'x'.repeat(3001)}).statusCode,400));
test('rejects invalid travelers',()=>assert.equal(invoke('POST',{description:'Trip',travelers:31}).statusCode,400));
test('rejects invalid budget',()=>assert.equal(invoke('POST',{description:'Trip',budgetEur:-1}).statusCode,400));
test('rejects non JSON',()=>assert.equal(invoke('POST',{description:'Trip'},'text/plain').statusCode,415));
test('rejects GET',()=>assert.equal(invoke('GET',null).statusCode,405));

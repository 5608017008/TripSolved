import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './inquiry.js';
async function invoke(method,body,contentType='application/json'){
 const result={code:200,body:null};
 const res={setHeader(){},status(code){result.code=code;return this;},json(data){result.body=data;return this;}};
 await handler({method,body,headers:{'content-type':contentType}},res);
 return result;
}
test('inquiries disabled unless owner enables configured delivery and security',async()=>{
 const keys=['TRIPSOLVED_INQUIRIES_ENABLED','RESEND_API_KEY','TRIPSOLVED_INQUIRY_SECURITY_READY','TURNSTILE_SECRET_KEY'];
 const previous=keys.map(k=>process.env[k]);
 try{for(const key of keys)delete process.env[key];const r=await invoke('POST',{description:'Seven days by the sea',travelers:2,email:'test@example.org'});assert.equal(r.code,503);assert.equal(r.body.status,'inquiries_disabled');}
 finally{keys.forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];});}
});
test('reject GET',async()=>assert.equal((await invoke('GET',{})).code,405));
test('reject non-JSON',async()=>assert.equal((await invoke('POST',{},'text/plain')).code,415));

test('enabled inquiry rejects missing bot verification before any delivery',async()=>{
 const env={TRIPSOLVED_INQUIRIES_ENABLED:'true',RESEND_API_KEY:'placeholder-test-key',TRIPSOLVED_INQUIRY_SECURITY_READY:'true',TURNSTILE_SECRET_KEY:'placeholder-test-secret',TRIPSOLVED_INQUIRY_TO:'sales@example.org',TRIPSOLVED_TURNSTILE_HOSTNAME:'preview.example.org'};
 const old=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));
 try{
  Object.assign(process.env,env);
  const valid={description:'Seven days by the sea',travelers:2,email:'customer@example.org'};
  const result=await invoke('POST',valid);
  assert.equal(result.code,403);
  assert.equal(result.body.error,'Security verification required');
  assert.equal((await invoke('POST',{...valid,email:'not-an-email'})).code,400);
 }finally{
  for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
 }
});

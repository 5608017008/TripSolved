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

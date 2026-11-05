import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './ai.js';

async function invoke(method,body,contentType='application/json'){
 const result={code:200,body:null};
 const res={setHeader(){},status(code){result.code=code;return this;},json(data){result.body=data;return this;}};
 await handler({method,body,headers:{'content-type':contentType}},res);
 return result;
}

test('AI remains disabled with no provider key or activation',async()=>{
 const priorEnabled=process.env.TRIPSOLVED_AI_ENABLED;
 const priorKey=process.env.OPENAI_API_KEY;
 try{
  delete process.env.TRIPSOLVED_AI_ENABLED;
  delete process.env.OPENAI_API_KEY;
  const r=await invoke('POST',{description:'Chceme desať dní pri mori',travelers:2});
  assert.equal(r.code,503);
  assert.equal(r.body.status,'ai_disabled');
 }finally{
  if(priorEnabled===undefined)delete process.env.TRIPSOLVED_AI_ENABLED;else process.env.TRIPSOLVED_AI_ENABLED=priorEnabled;
  if(priorKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=priorKey;
 }
});
test('GET is rejected before any provider call',async()=>assert.equal((await invoke('GET',{})).code,405));
test('non JSON is rejected before any provider call',async()=>assert.equal((await invoke('POST',{},'text/plain')).code,415));

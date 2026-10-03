import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createMobileBridge, openMobile, sealMobile } from '../server/mobile-bridge';
import { pairingSchema } from '../src/shared/mobile-protocol';
import { minimize } from '../src/shared/request';
import { compareDocuments } from '../src/shared/documents';
import { pair } from './helpers';
const servers:ReturnType<typeof createMobileBridge>[]=[];
afterEach(async()=>{await Promise.all(servers.splice(0).map(s=>new Promise<void>(r=>s.close(()=>r()))));});
async function setup(expiresAt=Date.now()+60_000){
  const key=randomBytes(32),transport=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({available:true}),{status:200}));
  const server=createMobileBridge(key,'127.0.0.1:test',transport,expiresAt);servers.push(server);
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const port=(server.address() as AddressInfo).port;
  function post(body:unknown,headers:Record<string,string>={}){return new Promise<{status:number;body:string}>((resolve,reject)=>{
    const req=request({host:'127.0.0.1',port,path:'/paired',method:'POST',headers:{Host:'127.0.0.1:test','Content-Type':'application/json',...headers}},res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>resolve({status:res.statusCode!,body:data}));});req.on('error',reject);req.end(JSON.stringify(body));
  });}
  const message=(command:unknown,overrides={})=>({version:1,requestId:randomUUID(),createdAt:Date.now(),command,...overrides});
  const envelope=(value:unknown,k=key)=>({version:1,data:sealMobile(value,k)});
  return {key,transport,post,message,envelope};
}
describe('paired mobile boundary',()=>{
  it('roundtrips AES-GCM and rejects ciphertext changes/wrong keys',()=>{
    const key=randomBytes(32),data=sealMobile({action:'health'},key);
    expect(openMobile(data,key)).toEqual({action:'health'});expect(()=>openMobile(data,randomBytes(32))).toThrow();
    const bytes=Buffer.from(data,'base64');bytes[14]^=1;expect(()=>openMobile(bytes.toString('base64'),key)).toThrow();
  });
  it('matches standard WebCrypto AES-GCM combined IV/ciphertext/tag format',async()=>{
    const key=randomBytes(32),iv=randomBytes(12),aad=new TextEncoder().encode('document-review-mobile-v1');
    const imported=await crypto.subtle.importKey('raw',key,{name:'AES-GCM'},false,['encrypt','decrypt']);
    const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},imported,new TextEncoder().encode('{"standard":true}'));
    expect(openMobile(Buffer.concat([iv,Buffer.from(encrypted)]).toString('base64'),key)).toEqual({standard:true});
    const data=Buffer.from(sealMobile({server:true},key),'base64');
    const decrypted=await crypto.subtle.decrypt({name:'AES-GCM',iv:data.subarray(0,12),additionalData:aad},imported,data.subarray(12));
    expect(JSON.parse(new TextDecoder().decode(decrypted))).toEqual({server:true});
  });
  it('forwards only to existing loopback API and encrypts response with request correlation',async()=>{
    const s=await setup(),message=s.message({action:'health'}),r=await s.post(s.envelope(message));
    expect(r.status).toBe(200);expect(r.body).not.toContain('available');expect(openMobile(JSON.parse(r.body).data,s.key)).toEqual({requestId:message.requestId,status:200,result:{available:true}});
    expect(s.transport.mock.calls[0][0]).toBe('http://127.0.0.1:8787/api/health');
  });
  it('rejects document fields inside minimized context before any forwarding',async()=>{
    const s=await setup(),docs=await pair('address-conflict');const context={...minimize(compareDocuments(docs),docs),name:'PRIVATE NAME',pdf:'raw PDF'};
    expect((await s.post(s.envelope(s.message({action:'preview',context})))).status).toBe(400);expect(s.transport).not.toHaveBeenCalled();
  });
  it('forwards the validated reduced context without original literal values',async()=>{
    const s=await setup(),docs=await pair('malicious-text'),context=minimize(compareDocuments(docs),docs);
    expect((await s.post(s.envelope(s.message({action:'preview',context})))).status).toBe(200);
    const body=s.transport.mock.calls[0][1]?.body as string;expect(JSON.parse(body)).toEqual(context);expect(body).not.toMatch(/Avery Example|DEMO-ACCT|exfiltration.invalid|Fiction Lane/);
    expect(s.transport.mock.calls[0][1]?.headers).toEqual({'Content-Type':'application/json','X-Document-Review':'1',Origin:'http://127.0.0.1:8787'});
  });
  it('rejects replay and stale messages',async()=>{
    const s=await setup(),packet=s.envelope(s.message({action:'health'}));expect((await s.post(packet)).status).toBe(200);expect((await s.post(packet)).status).toBe(409);
    expect((await s.post(s.envelope(s.message({action:'health'},{createdAt:Date.now()-31_000})))).status).toBe(409);expect(s.transport).toHaveBeenCalledTimes(1);
  });
  it('rejects an expired pairing',async()=>{const s=await setup(Date.now()-1);expect((await s.post(s.envelope(s.message({action:'health'})))).status).toBe(403);expect(s.transport).not.toHaveBeenCalled();});
  it('rejects wrong keys and unknown commands/provider URLs',async()=>{
    const s=await setup();expect((await s.post(s.envelope(s.message({action:'health'}),randomBytes(32)))).status).toBe(400);
    expect((await s.post(s.envelope(s.message({action:'upload',url:'https://example.com'})))).status).toBe(400);expect(s.transport).not.toHaveBeenCalled();
  });
  it('rejects browser Origin and incorrect Host',async()=>{
    const s=await setup(),packet=s.envelope(s.message({action:'health'}));expect((await s.post(packet,{Origin:'http://evil.invalid'})).status).toBe(403);expect((await s.post(packet,{Host:'evil.invalid'})).status).toBe(403);expect(s.transport).not.toHaveBeenCalled();
  });
  it('rejects unowned preview IDs and oversized envelopes',async()=>{
    const s=await setup();expect((await s.post(s.envelope(s.message({action:'send',id:randomUUID(),hash:'a'.repeat(64)})))).status).toBe(409);
    expect((await s.post({version:1,data:'a'.repeat(49000)})).status).toBe(413);expect(s.transport).not.toHaveBeenCalled();
  });
  it('restricts pairing to a private IPv4 companion route and strict key fields',()=>{
    const base={version:1,key:'a'.repeat(64),expiresAt:Date.now()+60_000,url:'http://192.168.1.2:8790/paired'};
    expect(pairingSchema.parse(base).url).toBe(base.url);
    for(const url of ['http://8.8.8.8:8790/paired','http://127.0.0.1:8790/paired','http://0.0.0.0:8790/paired','http://192.168.1.2:11434/paired','https://cloud.invalid','http://192.168.999.2:8790/paired'])expect(pairingSchema.safeParse({...base,url}).success).toBe(false);
    expect(pairingSchema.safeParse({...base,notes:'private'}).success).toBe(false);
  });
});

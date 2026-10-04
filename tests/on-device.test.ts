import {createHash,randomUUID} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import {OnDeviceGateway,PHONE_MODEL,phoneMessages,type PhoneCompletion,type PhoneRuntime} from '../src/shared/on-device';
import {minimize,ruleSummary} from '../src/shared/request';
import {compareDocuments,correctField} from '../src/shared/documents';
import {pair} from './helpers';
const digest=async(body:string)=>createHash('sha256').update(body).digest('hex');
async function setup(scenario='address-conflict',override:Partial<PhoneRuntime>={},timeout=1000){
  const docs=await pair(scenario),context=minimize(compareDocuments(docs),docs);
  const complete=vi.fn(async(_params:PhoneCompletion,_signal:AbortSignal)=>JSON.stringify(ruleSummary(context)));
  const runtime:PhoneRuntime={format:async messages=>messages.map(m=>m.role+':'+m.content).join('\n'),complete,...override};
  let now=1000;
  const gateway=new OnDeviceGateway(runtime,digest,randomUUID,()=>now,timeout);
  return {docs,context,runtime,complete,gateway,tick:(ms:number)=>{now+=ms;}};
}
describe('on-device approval/privacy boundary (runtime doubles, not real AI)',()=>{
  it('sends the exact approved completion arguments in-process once',async()=>{
    const {gateway,context,complete}=await setup();
    const preview=await gateway.preview(context);
    expect(preview.destination).toBe('on-device://llama.rn/completion');
    expect(preview.hash).toBe(await digest(preview.serializedBody));
    const result=await gateway.send(preview.id,preview.hash,true);
    const body=JSON.parse(preview.serializedBody);
    const schema=JSON.parse(body.completion.json_schema);
    expect(schema.properties.findings.prefixItems.map((item:{properties:{id:{enum:string[]}}})=>item.properties.id.enum[0])).toEqual(context.findings.map(f=>f.id));
    expect(complete.mock.calls[0]?.[0]).toEqual(body.completion);
    expect(body.model).toEqual(PHONE_MODEL);
    expect(result.requestHash).toBe(preview.hash);
    expect(result.source).toBe('qwen');
    await expect(gateway.send(preview.id,preview.hash,true)).rejects.toThrow('expired or changed');
    expect(complete).toHaveBeenCalledTimes(1);
  });
  for(const scenario of ['matching','address-conflict','missing-field','malicious-text']){
    it(`excludes raw PDF fields and notes for ${scenario}`,async()=>{
      const {gateway,context,docs}=await setup(scenario);const p=await gateway.preview(context);
      for(const doc of docs){
        expect(p.serializedBody).not.toContain(doc.filename);
        for(const field of Object.values(doc.fields))if(field?.value&&field.value.length>3)expect(p.serializedBody).not.toContain(field.value);
      }
      for(const excluded of ['Avery Example','Fiction Lane','Imaginary Avenue','DEMO-ACCT','4200.00','2026-09-30','ignore previous'])expect(p.serializedBody).not.toContain(excluded);
      expect(phoneMessages(context).length).toBe(2);
    });
  }
  it('requires explicit approval and rejects a changed hash without invoking native inference',async()=>{
    const {gateway,context,complete}=await setup();const p=await gateway.preview(context);
    await expect(gateway.send(p.id,p.hash,false)).rejects.toThrow('approve');
    await expect(gateway.send(p.id,'0'.repeat(64),true)).rejects.toThrow('changed');
    expect(complete).not.toHaveBeenCalled();
  });
  it('rejects expired approval',async()=>{
    const {gateway,context,tick,complete}=await setup();const p=await gateway.preview(context);tick(300_000);
    await expect(gateway.send(p.id,p.hash,true)).rejects.toThrow('expired');expect(complete).not.toHaveBeenCalled();
  });
  it('invalidates old approval after corrections and prepares different bytes',async()=>{
    const {gateway,context,docs}=await setup();const old=await gateway.preview(context);gateway.invalidate();
    const updated=docs.map(d=>d.template==='bank-statement-v1'?correctField(d,'address','14 Fiction Lane, Sampleton, ZZ 00000'):d);
    const next=await gateway.preview(minimize(compareDocuments(updated),updated));
    expect(next.hash).not.toBe(old.hash);await expect(gateway.send(old.id,old.hash,true)).rejects.toThrow('changed');
  });
  it('does not accept mutation of the returned preview as the stored approved body',async()=>{
    const {gateway,context,complete}=await setup();const p=await gateway.preview(context),original=p.serializedBody;
    p.serializedBody='PRIVATE RAW DOCUMENT';await gateway.send(p.id,p.hash,true);
    expect(complete.mock.calls[0]?.[0]).toEqual(JSON.parse(original).completion);
  });
  it('rejects extra private values before formatting',async()=>{
    const format=vi.fn(async()=>''),{gateway,context}=await setup('matching',{format});
    await expect(gateway.preview({...context,passport:'SECRET'})).rejects.toThrow();expect(format).not.toHaveBeenCalled();
  });
  it('rejects unsupported claims or duplicate finding IDs, consuming approval',async()=>{
    const {gateway,context,complete}=await setup('matching',{complete:async()=>'{"overview":"Client is eligible"}'});
    const p=await gateway.preview(context);await expect(gateway.send(p.id,p.hash,true)).rejects.toThrow('could not be accepted');
    await expect(gateway.send(p.id,p.hash,true)).rejects.toThrow('expired');expect(complete).not.toHaveBeenCalled();
  });
  it('rejects delayed preview after reset',async()=>{
    let finish!:(s:string)=>void;
    const {gateway,context}=await setup('matching',{format:()=>new Promise(resolve=>{finish=resolve;})});
    const pending=gateway.preview(context);gateway.invalidate();finish('stale');
    await expect(pending).rejects.toThrow('changed');
  });
  it('cancels native inference and rejects output after reset',async()=>{
    let finish!:(s:string)=>void,signal:AbortSignal|undefined;
    const {gateway,context}=await setup('matching',{complete:async(_params,s)=>{signal=s;return new Promise(resolve=>{finish=resolve;});}});
    const p=await gateway.preview(context),pending=gateway.send(p.id,p.hash,true);
    await new Promise(resolve=>setTimeout(resolve,0));gateway.invalidate();expect(signal?.aborted).toBe(true);
    finish(JSON.stringify(ruleSummary(context)));await expect(pending).rejects.toThrow('cancelled');
  });
  it('limits one active generation and enforces a native abort deadline',async()=>{
    const {gateway,context}=await setup('matching',{complete:async(_params,signal)=>new Promise((_,reject)=>{signal.addEventListener('abort',()=>reject(new Error('stopped')));})},10);
    const p=await gateway.preview(context),pending=gateway.send(p.id,p.hash,true);
    await expect(gateway.send(p.id,p.hash,true)).rejects.toThrow('already running');
    await expect(pending).rejects.toThrow('timed out');
  });
});

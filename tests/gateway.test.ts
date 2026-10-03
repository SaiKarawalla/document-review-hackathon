import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { ModelGateway, DESTINATION, OLLAMA } from '../server/gateway';
import { contextSchema, minimize, ruleSummary, validateSummary, type ReducedContext } from '../src/shared/request';
import { compareDocuments } from '../src/shared/documents';
import { pair } from './helpers';
async function context(): Promise<ReducedContext> { const docs=await pair('address-conflict'); return minimize(compareDocuments(docs),docs); }
function fake(ctx: ReducedContext) { return vi.fn<typeof fetch>(async url=> url===OLLAMA+'/api/tags' ? Response.json({models:[{name:'qwen2.5:1.5b'}]}) : Response.json({done:true,response:JSON.stringify(ruleSummary(ctx))})); }
describe('gateway approval and privacy boundary (controlled test provider)',()=>{
  it('approved serialized body equals intercepted provider body byte for byte',async()=>{
    const ctx=await context(), transport=fake(ctx);const gateway=new ModelGateway(undefined,transport); const preview=gateway.preview(ctx);
    expect(preview.hash).toBe(createHash('sha256').update(preview.serializedBody).digest('hex'));
    const result=await gateway.send(preview.id,preview.hash);
    const call=transport.mock.calls.find(([url])=>url===DESTINATION)!;
    expect(call[1]?.body).toBe(preview.serializedBody);expect(call[1]?.redirect).toBe('error');expect(result.requestHash).toBe(preview.hash);
    for(const literal of ['Avery Example','14 Fiction Lane','82 Imaginary','DEMO-ACCT','DEMO-APPLICANT','4200.00','2026-09-30','exfiltration.invalid','.pdf'])expect(preview.serializedBody).not.toContain(literal);
    expect(transport.mock.calls.map(([url])=>url)).toEqual([OLLAMA+'/api/tags',DESTINATION]);
  });
  it('rejects unknown/raw top-level fields',async()=>{const ctx=await context();expect(()=>contextSchema.parse({...ctx,address:'secret'})).toThrow();});
  it('rejects arbitrary sensitive values in field enums',async()=>{const ctx=await context();ctx.findings[0].missing=['DEMO-PASSPORT-666' as never];expect(()=>contextSchema.parse(ctx)).toThrow();});
  it('rejects arbitrary finding IDs',async()=>{const ctx=await context();ctx.findings[0].id='secret' as never;expect(()=>contextSchema.parse(ctx)).toThrow();});
  it('rejects impossible missing relationships',async()=>{const ctx=await context();ctx.findings[0].missing=['balance'];expect(()=>contextSchema.parse(ctx)).toThrow();});
  it('rejects modified hash without calling provider',async()=>{const ctx=await context(),fetcher=fake(ctx),gateway=new ModelGateway(undefined,fetcher),p=gateway.preview(ctx);await expect(gateway.send(p.id,'0'.repeat(64))).rejects.toThrow('expired or changed');expect(fetcher).not.toHaveBeenCalled();});
  it('approval is one use',async()=>{const ctx=await context(),g=new ModelGateway(undefined,fake(ctx)),p=g.preview(ctx);await g.send(p.id,p.hash);await expect(g.send(p.id,p.hash)).rejects.toThrow('expired');});
  it('discarded approvals cannot send',async()=>{const ctx=await context(),g=new ModelGateway(undefined,fake(ctx)),p=g.preview(ctx);g.discard(p.id);await expect(g.send(p.id,p.hash)).rejects.toThrow('expired');});
  it('preview expires after five minutes',async()=>{let now=0;const ctx=await context(),g=new ModelGateway(undefined,fake(ctx),60000,()=>now),p=g.preview(ctx);now=300001;await expect(g.send(p.id,p.hash)).rejects.toThrow('expired');});
  it('model URL and cloud tags rejected',()=>{expect(()=>new ModelGateway('https://example.com')).toThrow('local model');expect(()=>new ModelGateway('qwen:cloud')).toThrow('local model');});
  it('remote-hosted entry is unavailable and generation is never called',async()=>{const ctx=await context(),f=vi.fn<typeof fetch>(async()=>Response.json({models:[{name:'qwen2.5:1.5b',remote_host:'https://ollama.com'}]})),g=new ModelGateway(undefined,f),p=g.preview(ctx);await expect(g.send(p.id,p.hash)).rejects.toThrow('not downloaded');expect(f).toHaveBeenCalledTimes(1);});
  it('unavailable model stays an honest error',async()=>{const ctx=await context(),f=vi.fn<typeof fetch>(async()=>{throw new Error('offline');}),g=new ModelGateway(undefined,f),p=g.preview(ctx);await expect(g.send(p.id,p.hash)).rejects.toThrow('unavailable');expect(f).toHaveBeenCalledTimes(1);});
  it('model timeout cancels provider work',async()=>{const ctx=await context(),f=vi.fn<typeof fetch>(async(url,options)=>{if(url===OLLAMA+'/api/tags')return Response.json({models:[{name:'qwen2.5:1.5b'}]});return await new Promise<Response>((_,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('aborted'))));}),g=new ModelGateway(undefined,f,30),p=g.preview(ctx);await expect(g.send(p.id,p.hash)).rejects.toThrow('timed out');expect(f.mock.calls[1][1]?.signal?.aborted).toBe(true);});
  it('one request at a time and cancellation works',async()=>{const ctx=await context();let generated!:()=>void;const running=new Promise<void>(resolve=>generated=resolve);const f=vi.fn<typeof fetch>(async(url,options)=>{if(url===OLLAMA+'/api/tags')return Response.json({models:[{name:'qwen2.5:1.5b'}]});generated();return await new Promise<Response>((_,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('cancelled'))));});const g=new ModelGateway(undefined,f),a=g.preview(ctx),b=g.preview(ctx);const send=g.send(a.id,a.hash);const rejection=expect(send).rejects.toThrow('cancelled');await running;await expect(g.send(b.id,b.hash)).rejects.toThrow('already running');g.cancel(a.id);await rejection;});
  it('rate limit bounds generation attempts',async()=>{const ctx=await context(),g=new ModelGateway(undefined,fake(ctx));for(let i=0;i<6;i++){const p=g.preview(ctx);await g.send(p.id,p.hash);}const p=g.preview(ctx);await expect(g.send(p.id,p.hash)).rejects.toThrow('limit reached');});
  it('pending previews bounded',async()=>{const ctx=await context(),g=new ModelGateway(undefined,fake(ctx));for(let i=0;i<16;i++)g.preview(ctx);expect(()=>g.preview(ctx)).toThrow('pending previews');});
  it('oversize provider output rejected',async()=>{const ctx=await context(),f=fake(ctx);f.mockImplementationOnce(async()=>Response.json({models:[{name:'qwen2.5:1.5b'}]}));f.mockImplementationOnce(async()=>new Response('x'.repeat(66000)));const g=new ModelGateway(undefined,f),p=g.preview(ctx);await expect(g.send(p.id,p.hash)).rejects.toThrow('exceeded');});
  it('malformed model output rejected',async()=>{const ctx=await context(),f=fake(ctx);f.mockImplementationOnce(async()=>Response.json({models:[{name:'qwen2.5:1.5b'}]}));f.mockImplementationOnce(async()=>Response.json({done:true,response:'not JSON'}));const g=new ModelGateway(undefined,f),p=g.preview(ctx);await expect(g.send(p.id,p.hash)).rejects.toThrow('failed validation');});
});
describe('output cannot introduce factual claims',()=>{
  it('unknown ID rejected',async()=>{const ctx=await context(),s=ruleSummary(ctx);s.findings[0].id='invented' as never;expect(()=>validateSummary(s,ctx)).toThrow();});
  it('duplicate/omitted ID rejected',async()=>{const ctx=await context(),s=ruleSummary(ctx);s.findings[1].id=s.findings[0].id;expect(()=>validateSummary(s,ctx)).toThrow('duplicate');});
  it('unseen raw factual prose rejected',async()=>{const ctx=await context(),s=ruleSummary(ctx);s.findings[0].explanation='The account is fraudulent.' as never;expect(()=>validateSummary(s,ctx)).toThrow();});
  it('contradictory explanation rejected',async()=>{const ctx=await context(),s=ruleSummary(ctx);s.findings[1].explanation='The compared information is consistent.';expect(()=>validateSummary(s,ctx)).toThrow('contradicts');});
  it('all-clear overview cannot clear unresolved flags',async()=>{const ctx=await context(),s=ruleSummary(ctx);s.overview='The available consistency checks are complete with no differences found.';expect(()=>validateSummary(s,ctx)).toThrow('contradicts');});
});

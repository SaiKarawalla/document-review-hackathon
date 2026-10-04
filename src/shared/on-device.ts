import { contextSchema, EXPLANATIONS, FOLLOW_UPS, OVERVIEWS, validateSummary, type ReducedContext, type RequestPreview } from './request';

export const PHONE_MODEL = Object.freeze({
  name: 'Qwen2.5-0.5B-Instruct', quantization: 'Q4_K_M',
  filename: 'qwen2.5-0.5b-instruct-q4_k_m.gguf', bytes: 491400032,
  revision: '9217f5db79a29953eb74d5343926648285ec7e67',
  sha256: '74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db',
});
export interface PhoneCompletion {
  prompt: string; json_schema: string; n_predict: number; temperature: number; seed: number; stop: string[];
}
export interface PhoneRuntime {
  format(messages: {role: 'system'|'user'; content: string}[]): Promise<string>;
  complete(params: PhoneCompletion, signal: AbortSignal): Promise<string>;
}
export function phoneMessages(context: ReducedContext): {role:'system'|'user';content:string}[] {
  return [
    {role:'system',content:'You assist a human document reviewer. Only reduced consistency facts are provided. Deterministic statuses are authoritative. Return JSON only. Choose exact sentences allowed for each finding. Include all six IDs once in the given order. Do not invent values, tools, actions, authenticity, fraud or eligibility claims.'},
    {role:'user',content:JSON.stringify({instruction:'Explain each finding in context order using only its allowed sentences.',context,
      choices:context.findings.map(f=>({id:f.id,explanation:EXPLANATIONS[f.status],follow_up:FOLLOW_UPS[f.status]}))})},
  ];
}
export function phoneResponseSchema(context: ReducedContext) {
  return {type:'object',additionalProperties:false,required:['overview','findings'],properties:{
    overview:{type:'string',enum:[context.findings.every(f=>f.status==='consistent')?OVERVIEWS[1]:OVERVIEWS[0]]},
    findings:{type:'array',minItems:6,maxItems:6,prefixItems:context.findings.map(f=>({
      type:'object',additionalProperties:false,required:['id','explanation','follow_up'],properties:{
        id:{type:'string',enum:[f.id]},explanation:{type:'string',enum:EXPLANATIONS[f.status]},follow_up:{type:'string',enum:FOLLOW_UPS[f.status]},
      },
    }))},
  }};
}

/** In-process boundary: no fetch, server, provider URL, document input or silent fallback. */
export class OnDeviceGateway {
  private pending?: {preview:RequestPreview; context:ReducedContext};
  private active?: AbortController;
  private revision=0;
  constructor(private runtime:PhoneRuntime,private hash:(body:string)=>Promise<string>,private uuid:()=>string,
    private now=Date.now,private timeout=120_000) {}
  invalidate(){this.revision++;this.pending=undefined;this.active?.abort();}
  async preview(input:unknown):Promise<RequestPreview> {
    if(this.active)throw new Error('A phone model request is already running.');
    this.pending=undefined;const revision=++this.revision;
    const context=contextSchema.parse(input);
    const prompt=await this.runtime.format(phoneMessages(context));
    if(prompt.length>24_000)throw new Error('Model prompt exceeds the local limit.');
    const completion:PhoneCompletion={prompt,json_schema:JSON.stringify(phoneResponseSchema(context)),n_predict:768,temperature:0,seed:42,stop:['<|im_end|>','<|endoftext|>']};
    const serializedBody=JSON.stringify({model:PHONE_MODEL,completion});
    const hash=await this.hash(serializedBody);
    if(revision!==this.revision)throw new Error('Review changed while preparing the request.');
    const preview:RequestPreview={id:this.uuid(),hash,serializedBody,destination:'on-device://llama.rn/completion',model:PHONE_MODEL.name,expiresAt:this.now()+300_000};
    this.pending={preview:{...preview},context};return {...preview};
  }
  async send(id:string,hash:string,approved:boolean) {
    if(!approved)throw new Error('Review and approve the exact request first.');
    if(this.active)throw new Error('A phone model request is already running.');
    const pending=this.pending;
    if(!pending||pending.preview.id!==id||pending.preview.hash!==hash||pending.preview.expiresAt<=this.now())throw new Error('Request expired or changed. Preview and approve again.');
    this.pending=undefined; // Consume approval before awaiting hashing or native inference.
    const controller=new AbortController();this.active=controller;
    const timer=setTimeout(()=>controller.abort(),this.timeout),started=this.now();
    try {
      if(await this.hash(pending.preview.serializedBody)!==hash)throw new Error('Approved request hash changed.');
      if(controller.signal.aborted)throw new Error('Cancelled');
      const {completion}=JSON.parse(pending.preview.serializedBody) as {completion:PhoneCompletion};
      const output=await this.runtime.complete(completion,controller.signal);
      if(controller.signal.aborted)throw new Error('Cancelled');
      if(output.length>32_768)throw new Error('Model output exceeded the limit.');
      const summary=validateSummary(JSON.parse(output),pending.context);
      return {summary,source:'qwen' as const,model:PHONE_MODEL.name,latencyMs:this.now()-started,requestHash:hash};
    } catch(error) {
      if(controller.signal.aborted)throw new Error('Phone AI cancelled or timed out. Findings remain available.');
      throw new Error(`Phone AI response could not be accepted: ${(error as Error).message}`);
    } finally {clearTimeout(timer);this.active=undefined;}
  }
}

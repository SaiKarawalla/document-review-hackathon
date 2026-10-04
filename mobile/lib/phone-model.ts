import { File, Paths } from 'expo-file-system';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { OnDeviceGateway, PHONE_MODEL, type PhoneCompletion } from '../../src/shared/on-device';

export class PhoneModel {
  private gateway?:OnDeviceGateway;
  private context?:import('llama.rn').LlamaContext;
  private loading=false;
  private closing?:Promise<void>;
  private completion?:Promise<unknown>;
  private preparation?:Promise<unknown>;
  private revision=0;
  get ready(){return !!this.gateway;}
  async load(){
    if(this.loading)throw new Error('Phone model is already loading.');
    if(this.closing)await this.closing;
    if(this.ready)return;
    this.loading=true;const revision=this.revision;
    try {
      const file=new File(Paths.bundle,PHONE_MODEL.filename);
      if(!file.exists||file.size!==PHONE_MODEL.bytes)throw new Error('Install the standalone iPhone build with bundled Qwen. Expo Go cannot run this native model.');
      const {initLlama}=await import('llama.rn');
      const context=await initLlama({model:file.uri,n_ctx:4096,n_batch:256,n_ubatch:128,n_threads:2,n_gpu_layers:99,use_mmap:true,use_mlock:false});
      if(revision!==this.revision){await context.release();throw new Error('Model loading cancelled.');}
      this.context=context;
      this.gateway=new OnDeviceGateway({
        format:async messages=>(await context.getFormattedChat(messages,null,{jinja:false})).prompt,
        complete:async (params:PhoneCompletion,signal:AbortSignal)=>{
          if(signal.aborted)throw new Error('Cancelled');
          const cancel=()=>{void context.stopCompletion().catch(()=>{});};
          signal.addEventListener('abort',cancel,{once:true});
          try {const response=await context.completion(params);return response.text;}
          finally {signal.removeEventListener('abort',cancel);}
        },
      },body=>digestStringAsync(CryptoDigestAlgorithm.SHA256,body),randomUUID);
    } finally {this.loading=false;}
  }
  invalidate(){if(this.loading)this.revision++;this.gateway?.invalidate();}
  async preview(input:unknown){
    if(!this.gateway)throw new Error('Load Qwen on this iPhone first.');
    const task=this.gateway.preview(input);this.preparation=task;
    try{return await task;}finally{if(this.preparation===task)this.preparation=undefined;}
  }
  async send(id:string,hash:string,approved:boolean){
    if(!this.gateway)throw new Error('Load Qwen on this iPhone first.');
    const task=this.gateway.send(id,hash,approved);this.completion=task;
    try{return await task;}finally{if(this.completion===task)this.completion=undefined;}
  }
  close(){
    this.revision++;this.gateway?.invalidate();this.gateway=undefined;
    const context=this.context;this.context=undefined;
    if(!context)return this.closing??Promise.resolve();
    const task=(async()=>{await this.preparation?.catch(()=>{});await this.completion?.catch(()=>{});await context.release();})();
    this.closing=task;
    void task.finally(()=>{if(this.closing===task)this.closing=undefined;}).catch(()=>{});
    return task;
  }
}

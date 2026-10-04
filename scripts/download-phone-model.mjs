import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {mkdir,stat,rename,unlink} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';
const filename='qwen2.5-0.5b-instruct-q4_k_m.gguf';
const bytes=491400032,sha='74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db';
const url='https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/9217f5db79a29953eb74d5343926648285ec7e67/'+filename;
const folder=fileURLToPath(new URL('../mobile/models/',import.meta.url)),target=folder+filename,temp=target+'.download';
async function valid(path){
  try{if((await stat(path)).size!==bytes)return false;const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex')===sha;}catch{return false;}
}
await mkdir(folder,{recursive:true});
if(await valid(target)){console.log('Official Qwen model already present; SHA-256 verified.');}
else {
  try {
    const response=await fetch(url,{signal:AbortSignal.timeout(300_000)});
    if(!response.ok||!response.body)throw new Error('Official Qwen download failed: '+response.status);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(temp));
    if(!await valid(temp))throw new Error('Qwen model size/checksum mismatch.');
    await rename(temp,target);console.log('Official Qwen downloaded and SHA-256 verified (491 MB). No paid API or account used.');
  } finally {await unlink(temp).catch(()=>{});}
}

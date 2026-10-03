import { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync, randomUUID, digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { z } from 'zod';
import { mobileCommand, pairingSchema, type Pairing, type MobileCommand } from '../../src/shared/mobile-protocol';
import type { RequestPreview } from '../../src/shared/request';
const AAD=new TextEncoder().encode('document-review-mobile-v1');
export function readPairing(value:string):Pairing {
  const pairing=pairingSchema.parse(JSON.parse(value));
  if(pairing.expiresAt<=Date.now())throw new Error('Pairing expired. Restart the Mac companion and scan its new QR.');
  return pairing;
}
export async function companion<T>(pairing:Pairing,command:MobileCommand,signal?:AbortSignal):Promise<T> {
  const bounded=mobileCommand.parse(command);
  if(pairing.expiresAt<=Date.now())throw new Error('Pairing expired. Pair again.');
  const key=await AESEncryptionKey.import(pairing.key,'hex');
  const requestId=randomUUID();
  const encrypted=await aesEncryptAsync(new TextEncoder().encode(JSON.stringify({version:1,requestId,createdAt:Date.now(),command:bounded})),key,{additionalData:AAD});
  const data=await encrypted.combined('base64');
  const controller=new AbortController();
  const cancel=()=>controller.abort();
  signal?.addEventListener('abort',cancel,{once:true});
  if(signal?.aborted)controller.abort();
  const timer=setTimeout(cancel,bounded.action==='send'?70_000:8_000);
  try {
  const response=await fetch(pairing.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:1,data}),signal:controller.signal});
  if(!response.ok)throw new Error('Paired Mac rejected the request. Check pairing and the same Wi-Fi/hotspot.');
  const outer=z.strictObject({version:z.literal(1),data:z.string().max(100_000)}).parse(await response.json());
  const sealed=AESSealedData.fromCombined(outer.data);
  const bytes=await aesDecryptAsync(sealed,key,{additionalData:AAD});
  const result=z.strictObject({requestId:z.uuid(),status:z.number().int(),result:z.unknown()}).parse(JSON.parse(new TextDecoder().decode(bytes as Uint8Array)));
  if(result.requestId!==requestId)throw new Error('Paired response did not match this request.');
  if(result.status>=400)throw new Error(z.object({error:z.string().max(300)}).parse(result.result).error);
  return result.result as T;
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
export async function verifyPreview(value:unknown):Promise<RequestPreview> {
  const preview=z.strictObject({id:z.uuid(),hash:z.string().regex(/^[a-f0-9]{64}$/),serializedBody:z.string().max(32_768),
    destination:z.literal('http://127.0.0.1:11434/api/generate'),model:z.string().max(100),expiresAt:z.number().int()}).parse(value);
  const hash=await digestStringAsync(CryptoDigestAlgorithm.SHA256,preview.serializedBody);
  if(hash!==preview.hash || preview.expiresAt<=Date.now())throw new Error('Preview hash/expiry invalid. Request a new preview.');
  return preview;
}

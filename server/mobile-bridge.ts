import { createServer } from 'node:http';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { mobileMessage } from '../src/shared/mobile-protocol';
export function sealMobile(value: unknown, key: Buffer): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('document-review-mobile-v1'));
  return Buffer.concat([iv, cipher.update(JSON.stringify(value), 'utf8'), cipher.final(), cipher.getAuthTag()]).toString('base64');
}
export function openMobile(data: string, key: Buffer): unknown {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length > 48_000) throw new Error('Invalid envelope');
  const bytes = Buffer.from(data, 'base64');
  if (bytes.length < 29) throw new Error('Invalid envelope');
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0,12));
  decipher.setAAD(Buffer.from('document-review-mobile-v1')); decipher.setAuthTag(bytes.subarray(-16));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(12,-16)), decipher.final()]).toString('utf8'));
}
// Separate paired, encrypted adapter; existing API and Ollama stay loopback-only.
// No file upload route and no provider destination setting.
export function createMobileBridge(key: Buffer, host: string, transport: typeof fetch = fetch, expiresAt = Date.now()+60*60_000) {
  const used = new Set<string>(); let count=0, windowStart=Date.now(); let active=0;
  const ownedPreviews = new Set<string>();
  return createServer(async (req, res) => {
    const plain = (status: number) => {res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'});res.end('{"error":"Pairing request rejected."}');};
    try {
      if (req.method !== 'POST' || req.url !== '/paired' || req.headers.host !== host || req.headers.origin
        || req.headers['content-type'] !== 'application/json' || Date.now() >= expiresAt) {plain(403);return;}
      if (Date.now()-windowStart > 60_000) {count=0;windowStart=Date.now();}
      if (++count > 90 || active >= 4 || used.size >= 4096) {plain(429);return;}
      let bytes=0, body='';
      for await (const chunk of req) {bytes+=chunk.length;if(bytes>48_000){plain(413);return;}body+=chunk;}
      const envelope=z.strictObject({version:z.literal(1),data:z.string().max(48_000)}).parse(JSON.parse(body));
      const message=mobileMessage.parse(openMobile(envelope.data,key));
      if (Math.abs(Date.now()-message.createdAt)>30_000 || used.has(message.requestId)) {plain(409);return;}
      used.add(message.requestId); active++;
      try {
        const command=message.command;
        if ('id' in command && !ownedPreviews.has(command.id)) {plain(409);return;}
        const path=command.action;
        const payload=command.action==='preview' ? command.context : 'id' in command ? {id:command.id,...('hash' in command ? {hash:command.hash}: {})} : undefined;
        const response=await transport('http://127.0.0.1:8787/api/'+path, {
          method: payload ? 'POST':'GET', redirect:'error', signal:AbortSignal.timeout(70_000),
          // This authenticated local adapter is the initiating API client;
          // preserve the loopback API's origin/header checks unchanged.
          headers: payload ? {'Content-Type':'application/json','X-Document-Review':'1',Origin:'http://127.0.0.1:8787'} : undefined,
          body: payload ? JSON.stringify(payload) : undefined,
        });
        const resultText=await response.text();
        if (Buffer.byteLength(resultText)>64*1024) throw new Error('Response limit');
        const result=JSON.parse(resultText);
        if (command.action==='preview' && response.ok && typeof result.id==='string') ownedPreviews.add(result.id);
        if ('id' in command && ['send','discard','cancel'].includes(command.action)) ownedPreviews.delete(command.id);
        res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
        res.end(JSON.stringify({version:1,data:sealMobile({requestId:message.requestId,status:response.status,result},key)}));
      } finally {active--;}
    } catch {if(!res.headersSent)plain(400);else res.end();}
  });
}

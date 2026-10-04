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
export function createMobileBridge(key: Buffer, host: string, transport: typeof fetch = fetch, expiresAt: number | null = null) {
  const used = new Set<string>(); let count=0, windowStart=Date.now(); let active=0;
  const ownedPreviews = new Set<string>();
  return createServer(async (req, res) => {
    const plain = (status: number) => {res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'});res.end('{"error":"Pairing request rejected."}');};
    try {
      // Camera/Safari can open the companion address by mistake. This page is
      // public setup guidance only: never expose the pairing key or API data.
      if (req.method === 'GET' && ['/','/paired'].includes(req.url ?? '') && req.headers.host === host && !req.headers.origin) {
        const address=host.split(':')[0];
        if (!/^[0-9.]+$/.test(address)) {plain(403);return;}
        const expoURL=`exp://${address}:8082`;
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});
        res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open Document Review</title><style>body{font:18px system-ui;background:#faf9f6;color:#202827;margin:0;padding:48px 24px}main{max-width:520px;margin:auto}h1{font-size:32px}p,li{line-height:1.5}a{display:block;background:#202827;color:white;text-align:center;padding:18px;border-radius:14px;text-decoration:none;font-weight:700}code{overflow-wrap:anywhere}li{margin:14px 0}</style><main><h1>Open your app</h1><p>This is the Mac connection address. Your documents are reviewed inside Expo Go.</p><a href="${expoURL}">Open in Expo Go</a><p>If the button does not open the app, scan the <strong>Step 1 — Open app</strong> QR displayed on your Mac using the iPhone Camera.</p><ol><li>Open Expo Go on this phone. Keep it on the same Wi-Fi as your awake Mac.</li><li>Inside Document Review, open <strong>Settings → Pair Mac for local AI → Scan Mac pairing QR</strong>.</li><li>Scan the separate <strong>Step 2 — Private pairing</strong> QR using that scanner inside the app.</li></ol><p>App address: <code>${expoURL}</code></p><p>No pairing secret or document information is shown on this page.</p></main></html>`);
        return;
      }
      if (req.method !== 'POST' || req.url !== '/paired' || req.headers.host !== host || req.headers.origin
        || req.headers['content-type'] !== 'application/json' || (expiresAt !== null && Date.now() >= expiresAt)) {plain(403);return;}
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

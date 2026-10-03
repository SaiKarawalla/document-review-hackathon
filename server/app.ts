import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { z } from 'zod';
import { ModelGateway, GatewayError } from './gateway';
const actionSchema = z.strictObject({ id: z.uuid(), hash: z.string().regex(/^[a-f0-9]{64}$/) });
const idSchema = z.strictObject({ id: z.uuid() });
export function createApp(gateway: ModelGateway, production = false, port = 8787) {
  const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`, ...(!production ? ['http://127.0.0.1:5173', 'http://localhost:5173'] : [])]);
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  function json(res: ServerResponse, status: number, data: unknown) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
  async function readBody(req: IncomingMessage) {
    if (req.headers['content-type'] !== 'application/json') throw new GatewayError(415, 'Use application/json.');
    const declared = Number(req.headers['content-length'] ?? 0);
    if (declared > 32768) throw new GatewayError(413, 'Request body limit is 32 KiB.');
    let size = 0; const chunks: Buffer[] = [];
    for await (const chunk of req) { size += chunk.length; if (size > 32768) throw new GatewayError(413, 'Request body limit is 32 KiB.'); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; } catch { throw new GatewayError(400, 'Invalid JSON.'); }
  }
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
    const origin = req.headers.origin;
    if (!hosts.has(req.headers.host ?? '') || (origin && !origins.has(origin))) { json(res, 403, { error: 'Only the local application may access this server.' }); return; }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Document-Review', 'Access-Control-Max-Age': '600' }); res.end(); return; }
    try {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
      if (url.pathname === '/api/health' && req.method === 'GET') { json(res, 200, await gateway.health()); return; }
      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'POST') throw new GatewayError(405, 'Use POST.');
        if (!origin || !origins.has(origin) || req.headers['x-document-review'] !== '1') throw new GatewayError(403, 'The approved local app origin and request header are required.');
        const input = await readBody(req);
        if (url.pathname === '/api/preview') { json(res, 200, gateway.preview(input)); return; }
        if (url.pathname === '/api/send') { const { id, hash } = actionSchema.parse(input); json(res, 200, await gateway.send(id, hash)); return; }
        if (url.pathname === '/api/cancel' || url.pathname === '/api/discard') { const { id } = idSchema.parse(input); url.pathname.endsWith('cancel') ? gateway.cancel(id) : gateway.discard(id); json(res, 200, { ok: true }); return; }
        throw new GatewayError(404, 'Unknown endpoint.');
      }
      if (!production || req.method !== 'GET') throw new GatewayError(404, 'Unknown route.');
      const root = resolve('dist');
      const pathname = decodeURIComponent(url.pathname);
      const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + '/')) throw new GatewayError(403, 'Invalid path.');
      const content = await readFile(file).catch(() => { throw new GatewayError(404, 'File not found.'); });
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.pdf': 'application/pdf', '.json': 'application/json', '.svg': 'image/svg+xml' };
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' blob: data:; style-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(content);
    } catch (error) {
      // Never log request bodies, document data, provider output or validation details.
      if (error instanceof GatewayError) json(res, error.status, { error: error.message });
      else if (error instanceof z.ZodError) json(res, 400, { error: 'Request does not match the approved reduced schema.' });
      else json(res, 500, { error: 'The local server could not complete this request.' });
    }
  });
  server.requestTimeout = 90_000; server.headersTimeout = 10_000;
  return server;
}

import { createApp } from './app';
import { ModelGateway } from './gateway';
import { existsSync, readFileSync } from 'node:fs';
// Only these two settings are read. No configurable provider URL or cloud credentials.
if (existsSync('.env')) for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const match = /^(OLLAMA_MODEL|MODEL_TIMEOUT_MS)=([A-Za-z0-9:._-]+)$/.exec(line.trim());
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}
const timeout = Number(process.env.MODEL_TIMEOUT_MS ?? 60000);
if (!Number.isFinite(timeout) || timeout < 1000 || timeout > 120000) throw new Error('MODEL_TIMEOUT_MS must be 1000–120000.');
const gateway = new ModelGateway(process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b', fetch, timeout);
const production = process.argv.includes('--production');
createApp(gateway, production).listen(8787, '127.0.0.1', () => {
  console.log(production ? 'Document Review: http://127.0.0.1:8787' : 'Local document-review API ready on 127.0.0.1:8787');
});

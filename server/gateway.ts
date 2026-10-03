import { createHash, randomUUID } from 'node:crypto';
import { contextSchema, validateSummary, EXPLANATIONS, FOLLOW_UPS, OVERVIEWS, type ReducedContext, type RequestPreview } from '../src/shared/request';
export const OLLAMA = 'http://127.0.0.1:11434';
export const DESTINATION = OLLAMA + '/api/generate';
const SYSTEM = 'You assist a human document reviewer. You receive only reduced consistency facts for a synthetic case. Deterministic statuses are authoritative. Return JSON only. Choose exact sentences from the allowed vocabulary appropriate to each status. Include every existing finding ID exactly once. Do not claim document authenticity, fraud, legal validity or eligibility. Do not invent values, tools, actions or findings.';
export class GatewayError extends Error { constructor(public status: number, message: string) { super(message); } }
interface Pending { preview: RequestPreview; context: ReducedContext }
export class ModelGateway {
  private pending = new Map<string, Pending>();
  private active?: { id: string; controller: AbortController };
  private sends: number[] = [];
  constructor(readonly model = 'qwen2.5:1.5b', private transport: typeof fetch = fetch, private timeout = 60_000, private now = Date.now) {
    if (!/^[a-z0-9][a-z0-9._-]*:[a-z0-9._-]+$/.test(model) || /cloud/i.test(model)) throw new Error('Configure a local model tag, not a URL or cloud model.');
  }
  private prune() { for (const [id, p] of this.pending) if (p.preview.expiresAt <= this.now()) this.pending.delete(id); }
  preview(input: unknown): RequestPreview {
    const context = contextSchema.parse(input);
    this.prune();
    if (this.pending.size >= 16) throw new GatewayError(429, 'Too many pending previews. Discard one or wait for expiry.');
    const body = {
      model: this.model, system: SYSTEM,
      prompt: JSON.stringify({ instruction: 'Explain each finding in context order. Include all six unique IDs exactly once. Choose only sentences allowed for that ID. The response schema enforces authoritative statuses.',
        context, choices: context.findings.map(f => ({ id: f.id, explanation: EXPLANATIONS[f.status], follow_up: FOLLOW_UPS[f.status] })) }),
      format: {
        type: 'object', additionalProperties: false, required: ['overview', 'findings'],
        properties: {
          overview: { type: 'string', enum: [context.findings.every(f => f.status === 'consistent') ? OVERVIEWS[1] : OVERVIEWS[0]] },
          findings: { type: 'array', minItems: 6, maxItems: 6, items: { anyOf: context.findings.map(f => ({
            type: 'object', additionalProperties: false, required: ['id','explanation','follow_up'],
            properties: { id: { type: 'string', enum: [f.id] },
              explanation: { type: 'string', enum: EXPLANATIONS[f.status] }, follow_up: { type: 'string', enum: FOLLOW_UPS[f.status] } },
          })) } },
        },
      }, stream: false,
      options: { temperature: 0, seed: 42, num_ctx: 4096, num_predict: 768 }, keep_alive: '5m',
    };
    const serializedBody = JSON.stringify(body);
    const preview: RequestPreview = { id: randomUUID(), hash: createHash('sha256').update(serializedBody).digest('hex'), serializedBody,
      destination: DESTINATION, model: this.model, expiresAt: this.now() + 5 * 60_000 };
    this.pending.set(preview.id, { preview, context });
    return preview;
  }
  discard(id: string) { this.pending.delete(id); }
  cancel(id: string) {
    if (this.active?.id === id) this.active.controller.abort();
    this.discard(id);
  }
  async health() {
    try {
      const response = await this.transport(OLLAMA + '/api/tags', { signal: AbortSignal.timeout(2500), redirect: 'error' });
      if (!response.ok) throw new Error();
      const data = await response.json() as { models?: { name: string; remote_host?: string; remote_model?: string }[] };
      const entry = data.models?.find(m => m.name === this.model && !m.remote_host && !m.remote_model);
      return { available: !!entry, model: this.model, destination: DESTINATION, message: entry ? 'Downloaded local model is ready.' : 'The configured local model is not downloaded. Run ollama pull ' + this.model + '.' };
    } catch { return { available: false, model: this.model, destination: DESTINATION, message: 'Ollama is unavailable. Start Ollama with cloud disabled on 127.0.0.1:11434.' }; }
  }
  async send(id: string, hash: string) {
    this.prune();
    const p = this.pending.get(id);
    if (!p || p.preview.hash !== hash) throw new GatewayError(409, 'Preview is missing, expired or changed. Create a new preview.');
    if (this.active) throw new GatewayError(429, 'One model request is already running.');
    this.sends = this.sends.filter(t => this.now() - t < 60_000);
    if (this.sends.length >= 6) throw new GatewayError(429, 'Model request limit reached. Wait a minute.');
    this.sends.push(this.now());
    this.pending.delete(id); // One-use approval.
    const controller = new AbortController(); this.active = { id, controller };
    const timer = setTimeout(() => controller.abort(), this.timeout);
    const started = this.now();
    try {
      const health = await this.health();
      if (controller.signal.aborted) throw new Error('Cancelled');
      if (!health.available) throw new GatewayError(503, health.message);
      // Send the stored bytes, never rebuild or append content after approval.
      const response = await this.transport(DESTINATION, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: p.preview.serializedBody, signal: controller.signal, redirect: 'error' });
      if (!response.ok) throw new GatewayError(502, 'Ollama could not complete the request. Check the model and available memory.');
      const reader = response.body?.getReader();
      if (!reader) throw new GatewayError(502, 'Ollama returned an empty response.');
      const decoder = new TextDecoder(); let result = ''; let size = 0;
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 64 * 1024) { await reader.cancel(); throw new GatewayError(502, 'Ollama response exceeded the limit.'); }
        result += decoder.decode(value, { stream: true });
      }
      result += decoder.decode();
      const envelope = JSON.parse(result) as { response?: string; done?: boolean };
      if (!envelope.done || typeof envelope.response !== 'string') throw new Error('Incomplete response');
      const summary = validateSummary(JSON.parse(envelope.response), p.context);
      return { summary, model: this.model, latencyMs: this.now() - started, requestHash: p.preview.hash, source: 'ollama' as const };
    } catch (error) {
      if (error instanceof GatewayError) throw error;
      if (controller.signal.aborted) throw new GatewayError(504, 'AI request cancelled or timed out. Findings remain available; create a new preview to retry.');
      throw new GatewayError(502, 'The AI response failed validation or the local connection failed. Deterministic findings remain authoritative.');
    } finally { clearTimeout(timer); this.active = undefined; }
  }
}

// Synthetic-only real integration test. Never accepts uploaded documents.
import { writeFile } from 'node:fs/promises';
import { ModelGateway, DESTINATION } from '../server/gateway';
import { minimize, validateSummary } from '../src/shared/request';
import { compareDocuments } from '../src/shared/documents';
import { pair } from '../tests/helpers';
const scenario = process.argv[2] ?? 'address-conflict';
if (!['address-conflict','matching','missing-field','malicious-text'].includes(scenario)) throw new Error('Use a supported synthetic fixture scenario.');
const docs = await pair(scenario);
const context = minimize(compareDocuments(docs), docs);
let providerResponse: { response: string } | undefined;
const transport: typeof fetch = async (url, options) => {
  const response = await fetch(url, options);
  if (url === DESTINATION) providerResponse = await response.clone().json() as { response: string };
  return response;
};
const gateway = new ModelGateway(undefined, transport);
const preview = gateway.preview(context);
try {
  const result = await gateway.send(preview.id, preview.hash);
  console.log(JSON.stringify({ ok: true, scenario, model: result.model, latencyMs: result.latencyMs, requestHash: result.requestHash }));
  await writeFile(`artifacts/real-model-${scenario}.json`, JSON.stringify(result, null, 2));
} catch (error) {
  console.log((error as Error).message);
  if (providerResponse) {
    await writeFile(`artifacts/real-model-debug-${scenario}.json`, JSON.stringify({response:providerResponse.response}, null, 2));
    try { validateSummary(JSON.parse(providerResponse.response), context); } catch (e) { console.log('Synthetic integration validation reason:', (e as Error).message); }
  }
  process.exitCode = 1;
}

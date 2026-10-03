// Synthetic-only real integration test. Never accepts uploaded documents.
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ModelGateway, DESTINATION, OLLAMA } from '../server/gateway';
import { minimize, validateSummary } from '../src/shared/request';
import { compareDocuments } from '../src/shared/documents';
import { pair } from '../tests/helpers';
const scenario = process.argv[2] ?? 'address-conflict';
if (!['address-conflict','matching','missing-field','malicious-text'].includes(scenario)) throw new Error('Use a supported synthetic fixture scenario.');
const docs = await pair(scenario);
const context = minimize(compareDocuments(docs), docs);
let providerResponse: { response: string } | undefined;
const requests: { destination: string; method: string; body?: string }[] = [];
const transport: typeof fetch = async (url, options) => {
  requests.push({ destination: String(url), method: options?.method ?? 'GET', body: typeof options?.body === 'string' ? options.body : undefined });
  const response = await fetch(url, options);
  if (url === DESTINATION) providerResponse = await response.clone().json() as { response: string };
  return response;
};
const gateway = new ModelGateway(undefined, transport);
const preview = gateway.preview(context);
try {
  const result = await gateway.send(preview.id, preview.hash);
  assert.deepEqual(requests.map(r=>r.destination),[OLLAMA+'/api/tags',DESTINATION]);
  assert.equal(requests[1].body,preview.serializedBody);
  assert.equal(createHash('sha256').update(requests[1].body!).digest('hex'),preview.hash);
  for (const literal of ['Avery Example','14 Fiction Lane','82 Imaginary','DEMO-ACCT','DEMO-PASSPORT','exfiltration.invalid']) assert(!requests[1].body!.includes(literal));
  const sourceFields=docs.flatMap(d=>Object.values(d.fields)).filter(f=>f !== undefined);
  const sourceValuesInRequest=sourceFields.filter(f=>f.value && preview.serializedBody.includes(f.value)).length;
  assert.equal(sourceValuesInRequest,0);
  console.log(JSON.stringify({ ok: true, scenario, model: result.model, latencyMs: result.latencyMs, requestHash: result.requestHash }));
  await writeFile(`artifacts/real-model-${scenario}.json`, JSON.stringify(result, null, 2));
  await writeFile(`artifacts/real-network-${scenario}.json`,JSON.stringify({destinations:requests.map(r=>({url:r.destination,method:r.method})),approvedBytesMatch:true,rawIdentifiersExcluded:true,supportedSourceFields:sourceFields.length,sourceValuesInRequest,derivedFindingCount:context.findings.length,requestHash:preview.hash,requestBytes:Buffer.byteLength(preview.serializedBody)},null,2));
} catch (error) {
  console.log((error as Error).message);
  if (providerResponse) {
    await writeFile(`artifacts/real-model-debug-${scenario}.json`, JSON.stringify({response:providerResponse.response}, null, 2));
    try { validateSummary(JSON.parse(providerResponse.response), context); } catch (e) { console.log('Synthetic integration validation reason:', (e as Error).message); }
  }
  process.exitCode = 1;
}

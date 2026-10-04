import { z } from 'zod';
import { contextSchema } from './request';
export const mobileCommand = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('health') }),
  z.strictObject({ action: z.literal('preview'), context: contextSchema }),
  z.strictObject({ action: z.literal('send'), id: z.uuid(), hash: z.string().regex(/^[a-f0-9]{64}$/) }),
  z.strictObject({ action: z.enum(['discard', 'cancel']), id: z.uuid() }),
]);
export const mobileMessage = z.strictObject({version:z.literal(1),requestId:z.uuid(),createdAt:z.number().int(),command:mobileCommand});
// null means service-lifetime pairing; numeric expiry supports older QR codes.
export const pairingSchema=z.strictObject({version:z.literal(1),key:z.string().regex(/^[a-f0-9]{64}$/),expiresAt:z.number().int().nullable(),
  url:z.string().refine(value=>{
    const match=/^http:\/\/(\d+\.\d+\.\d+\.\d+):8790\/paired$/.exec(value);
    if(!match)return false;
    const p=match[1].split('.').map(Number);
    return p.every(n=>n>=0&&n<=255) && (p[0]===10 || p[0]===192&&p[1]===168 || p[0]===172&&p[1]>=16&&p[1]<=31);
  },'Use the private pairing QR from this Mac, not a public server URL.')});
export type MobileCommand=z.infer<typeof mobileCommand>;
export type Pairing=z.infer<typeof pairingSchema>;
export function pairingExpired(pairing: Pick<Pairing, 'expiresAt'>, now=Date.now()): boolean {
  return pairing.expiresAt !== null && pairing.expiresAt <= now;
}

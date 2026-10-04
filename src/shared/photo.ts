import { z } from 'zod';
import { FIELD_NAMES, TEMPLATE_FIELDS, fieldStatus, type FieldName } from './documents';

export interface Box { x0:number; y0:number; x1:number; y1:number }
export interface PhotoLine { text:string; bbox:Box; confidence:number }
export const PHOTO_LIMITS={bytes:8*1024*1024,pixels:20_000_000,side:1600,lines:300,text:20_000,timeout:45_000,masks:2000};
export const boxSchema=z.strictObject({x0:z.number().finite().min(0),y0:z.number().finite().min(0),x1:z.number().finite().min(0),y1:z.number().finite().min(0)}).refine(b=>b.x1>=b.x0&&b.y1>=b.y0);
export const photoLineSchema=z.strictObject({text:z.string().max(1000),bbox:boxSchema,confidence:z.number().finite().min(0).max(100)});
export function overlaps(a:Box,b:Box,padding=3){return a.x0<=b.x1+padding&&a.x1>=b.x0-padding&&a.y0<=b.y1+padding&&a.y1>=b.y0-padding;}
export function visibleLines(lines:PhotoLine[],masks:Box[]):PhotoLine[]{
  if(lines.length>PHOTO_LIMITS.lines||masks.length>PHOTO_LIMITS.masks)throw new Error('This photo has too much text or too many covers. Use one clear page.');
  const checked=z.array(photoLineSchema).parse(lines),covers=z.array(boxSchema).parse(masks);
  const result=checked.filter(l=>!covers.some(m=>overlaps(l.bbox,m)));
  if(result.reduce((n,l)=>n+l.text.length,0)>PHOTO_LIMITS.text)throw new Error('This page has too much text.');
  return result;
}
export type PhotoKind='bank-statement-v1'|'client-intake-v1';
export function detectPhoto(lines:PhotoLine[]):PhotoKind|undefined{
  const text=lines.map(l=>l.text.toLowerCase().replace(/\s+/g,' ')).join('\n');
  // Multiple independent labels, not a filename or a title alone. No legal/SSI workflow claim.
  const bank=/bank statement/.test(text)&&/account holder/.test(text)&&/closing balance/.test(text)&&/period (start|end)/.test(text);
  const intake=/client intake/.test(text)&&/applicant name/.test(text)&&/mailing address/.test(text)&&/financial declaration/.test(text);
  return bank===intake?undefined:bank?'bank-statement-v1':'client-intake-v1';
}
export function photoFields(kind:PhotoKind,lines:PhotoLine[]){
  return Object.entries(TEMPLATE_FIELDS[kind]).map(([field,label])=>{
    const pattern=new RegExp('^'+label!.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[:：]\\s*(.*)$','i');
    const matches=lines.map(l=>({line:l,match:l.text.trim().match(pattern)})).filter(v=>v.match);
    const value=matches.length===1?matches[0].match![1].trim():'';
    return {field:field as FieldName,label:label!,value,status:fieldStatus(field as FieldName,value)==='extracted'&&matches.length===1?'read' as const:'unread' as const};
  });
}
export const photoContextSchema=z.strictObject({
  case:z.literal('CASE-A'),source:z.literal('redacted-photo'),template:z.enum(['bank-statement-v1','client-intake-v1']),
  covered_regions:z.number().int().min(0).max(PHOTO_LIMITS.masks),
  field_states:z.array(z.strictObject({field:z.enum(FIELD_NAMES),status:z.enum(['read','unread'])})).min(1).max(7),
  confirmed_fields:z.number().int().min(0).max(7),
  findings:z.tuple([
    z.strictObject({id:z.literal('photo_fields'),status:z.enum(['consistent','needs_review']),missing:z.tuple([])}),
    z.strictObject({id:z.literal('photo_quality'),status:z.enum(['consistent','needs_review']),missing:z.tuple([])}),
  ]),
}).superRefine((v,ctx)=>{
  const fields=Object.keys(TEMPLATE_FIELDS[v.template]);
  const count=v.field_states.filter(f=>f.status==='read').length;
  if(v.field_states.length!==fields.length||new Set(v.field_states.map(f=>f.field)).size!==fields.length||v.field_states.some(f=>!fields.includes(f.field))||v.confirmed_fields>count||v.findings[0].status!==(count===fields.length?'consistent':'needs_review')||v.findings[1].status!==(v.confirmed_fields===count&&count>0?'consistent':'needs_review'))
    ctx.addIssue({code:'custom',message:'Photo review facts do not match the supported field states.'});
});
export function photoContext(kind:PhotoKind,lines:PhotoLine[],covers:number,confirmed:boolean):z.infer<typeof photoContextSchema>{
  const fields=photoFields(kind,lines),read=fields.filter(f=>f.status==='read').length;
  return photoContextSchema.parse({case:'CASE-A',source:'redacted-photo',template:kind,covered_regions:covers,
    field_states:fields.map(({field,status})=>({field,status})),confirmed_fields:confirmed?read:0,
    findings:[{id:'photo_fields',status:read===fields.length?'consistent':'needs_review',missing:[]},{id:'photo_quality',status:confirmed&&read>0?'consistent':'needs_review',missing:[]}]});
}
export const GLOSSARY=[
  {id:'account-holder',term:'Account holder',definition:'The person or organization named as the owner of the account.'},
  {id:'account-number',term:'Account number',definition:'An identifier for a specific bank account. Cover it if it is not needed for your review.'},
  {id:'closing-balance',term:'Closing balance',definition:'The balance shown at the end of this statement period. It is not monthly income or a promise of money available today.'},
  {id:'currency',term:'Currency',definition:'The money unit used for an amount, such as USD. Amounts in different currencies cannot be compared directly.'},
  {id:'period-start',term:'Period start',definition:'The first date covered by the statement.'},
  {id:'period-end',term:'Period end',definition:'The last date covered by the statement.'},
  {id:'declared-balance',term:'Declared balance',definition:'An amount the applicant reports. Check the account, currency and date before comparing it with a bank statement.'},
  {id:'as-of',term:'Balance as of',definition:'The date the reported balance refers to. It may differ from the date the document was created.'},
  {id:'ssi',term:'Supplemental Security Income',definition:'SSI is a US program providing monthly payments to eligible people with disabilities and older adults who have little or no income or resources.',source:'https://www.ssa.gov/ssi'},
] as const;
export function termsIn(text:string){const normalized=text.replace(/\s+/g,' ');return GLOSSARY.filter(t=>new RegExp('\\b'+t.term+'\\b','i').test(normalized));}

import { fieldStatus, normalize, type Field, type FieldName, type ReviewDocument } from './documents';

export interface PositionedText { text: string; page: number; x: number; y: number }
export interface PageSize { width: number; height: number }
// PDF user-space points (bottom-left origin), measured against the preserved official DE/EN reference.
export const VISA_REGIONS = {
  surname: [1, 175, 487, 607, 632], first: [1, 175, 487, 537, 565],
  birth_date: [1, 175, 487, 509, 536], passport: [1, 175, 487, 89, 116],
  passport_issued: [1, 175, 487, 60, 87], passport_expires: [1, 175, 487, 31, 58],
  destination: [2, 175, 561, 170, 218], arrival: [2, 175, 561, 65, 104], departure: [2, 175, 561, 15, 60],
} as const;
const anchors: [number, number, number, string][] = [
  [1,124,801,'Einheitliches Antragsformular'], [1,47,624,'Name (Familienname)'],
  [1,47,557,'Vorname(n)'], [1,47,108,'Nummer des Reisedokuments'],
  [2,47,570,'Wohnanschrift und E-Mail-Adresse des'], [2,47,100,'Datum der geplanten Ankunft des ersten'],
];
function date(raw: string) {
  const match=/^(\d{2})[/.](\d{2})[/.](\d{4})$/.exec(raw.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : raw.trim();
}
export function parseVisa(items: PositionedText[], sizes: PageSize[], id: string, filename: string): ReviewDocument {
  if(sizes.length!==4 || sizes.some(s=>Math.abs(s.width-594.96)>1 || Math.abs(s.height-842.04)>1)
    || !anchors.every(([p,x,y,text])=>items.some(i=>i.page===p&&Math.abs(i.x-x)<2&&Math.abs(i.y-y)<2&&i.text.trim()===text))
    || !items.some(i=>i.page===3 && /Kosten|Cost/.test(i.text)) || !items.some(i=>i.page===4 && /Unterschrift|Signature/.test(i.text)))
    throw new Error('Unsupported visa layout. Use the selected four-page German/English Schengen reference with typed text. Scans, handwriting and other editions are unsupported.');
  const read=(key: keyof typeof VISA_REGIONS)=>{
    const [page,x1,x2,y1,y2]=VISA_REGIONS[key];
    const matches=items.filter(i=>i.page===page&&i.x>=x1&&i.x<x2&&i.y>=y1&&i.y<y2&&i.text.trim()).sort((a,b)=>b.y-a.y||a.x-b.x);
    return {raw:matches.map(i=>i.text.trim()).join(' '),ambiguous:matches.some(i=>Math.abs(i.y-(matches[0]?.y??i.y))>3),page};
  };
  const fields: ReviewDocument['fields']={};
  const surname=read('surname'), first=read('first');
  const combined=[first.raw,surname.raw].filter(Boolean).join(' ');
  fields.name={documentId:id,template:'schengen-de-demo-v1',field:'name',raw:combined,value:combined,normalized:normalize(combined),page:1,
    excerpt:`1. Surname: ${surname.raw||'[blank]'}\n3. First name(s): ${first.raw||'[blank]'}`,
    status:!first.raw||!surname.raw?'absent':first.ambiguous||surname.ambiguous?'needs_review':fieldStatus('name',combined),confirmed:false,corrected:false};
  for(const key of ['birth_date','passport','passport_issued','passport_expires','destination','arrival','departure'] as const){
    const {raw,ambiguous,page}=read(key); const value=['birth_date','passport_issued','passport_expires','arrival','departure'].includes(key)?date(raw):raw;
    const field:Field={documentId:id,template:'schengen-de-demo-v1',field:key as FieldName,raw,value,normalized:normalize(value),page,
      excerpt:`${key.replaceAll('_',' ')}: ${raw||'[blank field region]'}`,status:ambiguous?'needs_review':fieldStatus(key,value),confirmed:false,corrected:false};
    fields[key]=field;
  }
  return {id,template:'schengen-de-demo-v1',filename,pages:4,fields};
}

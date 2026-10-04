import {GLOSSARY,PHOTO_LIMITS,visibleLines,termsIn,type Box,type PhotoLine} from '../../src/shared/photo';
declare global{interface Window{__OCR_WORKER:string;ReactNativeWebView?:{postMessage:(s:string)=>void};photo:{load:(src:string)=>Promise<void>;analyze:()=>Promise<void>;setTheme:(dark:boolean)=>void}}}
declare const Tesseract:{createWorker:(lang:string,oem:number,options:Record<string,unknown>)=>Promise<{setParameters:(p:Record<string,unknown>)=>Promise<unknown>;recognize:(image:HTMLCanvasElement,options:object,output:object)=>Promise<{data:{blocks:{paragraphs:{lines:(PhotoLine&{words:{text:string;bbox:Box}[]})[]}[]}[]}}>;terminate:()=>Promise<void>}>};
const canvas=document.querySelector<HTMLCanvasElement>('#canvas')!,ctx=canvas.getContext('2d')!;
const page=document.querySelector<HTMLElement>('#page')!,terms=document.querySelector<HTMLElement>('#terms')!;
const status=document.querySelector<HTMLElement>('#status')!,tip=document.querySelector<HTMLElement>('#tip')!;
const undo=document.querySelector<HTMLButtonElement>('#undo')!,analyze=document.querySelector<HTMLButtonElement>('#analyse')!,brush=document.querySelector<HTMLButtonElement>('#brush')!,highlight=document.querySelector<HTMLButtonElement>('#highlights')!;
let original:HTMLCanvasElement|undefined,locked=false,working=false,width=56,dragging=false;
let strokes:{points:{x:number;y:number}[];width:number}[]=[],masks:Box[]=[],allLines:PhotoLine[]=[];
let termBoxes:{id:string;term:string;bbox:Box}[]=[];
function emit(value:unknown){window.ReactNativeWebView?.postMessage(JSON.stringify(value));}
function stage(label:string,progress?:number){status.textContent=label;emit({type:'progress',label,progress});}
function draw(){if(!original)return;ctx.drawImage(original,0,0);ctx.fillStyle='#000';ctx.strokeStyle='#000';ctx.lineCap='round';ctx.lineJoin='round';for(const stroke of strokes){ctx.lineWidth=stroke.width;ctx.beginPath();stroke.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();const p=stroke.points[0];ctx.beginPath();ctx.arc(p.x,p.y,stroke.width/2,0,Math.PI*2);ctx.fill();}}
function point(e:PointerEvent){const r=canvas.getBoundingClientRect();return {x:Math.min(canvas.width,Math.max(0,(e.clientX-r.left)*canvas.width/r.width)),y:Math.min(canvas.height,Math.max(0,(e.clientY-r.top)*canvas.height/r.height))};}
function rebuildMasks(){masks=[];for(const stroke of strokes)for(let i=0;i<stroke.points.length;i++){const a=stroke.points[Math.max(0,i-1)],b=stroke.points[i],r=stroke.width/2;masks.push({x0:Math.max(0,Math.min(a.x,b.x)-r),y0:Math.max(0,Math.min(a.y,b.y)-r),x1:Math.min(canvas.width,Math.max(a.x,b.x)+r),y1:Math.min(canvas.height,Math.max(a.y,b.y)+r)});}}
canvas.addEventListener('pointerdown',e=>{if(locked||working||!original)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);dragging=true;strokes.push({points:[point(e)],width});draw();undo.disabled=false;});
canvas.addEventListener('pointermove',e=>{if(!dragging||locked)return;const stroke=strokes[strokes.length-1],p=point(e),last=stroke.points.at(-1)!;if(Math.hypot(p.x-last.x,p.y-last.y)>5&&strokes.reduce((n,s)=>n+s.points.length,0)<PHOTO_LIMITS.masks-1){stroke.points.push(p);draw();}});
function end(){dragging=false;rebuildMasks();emit({type:'covers',count:strokes.length});}
canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
undo.onclick=()=>{if(locked)return;strokes.pop();draw();rebuildMasks();undo.disabled=!strokes.length;emit({type:'covers',count:strokes.length});};
brush.onclick=()=>{width=width===56?100:56;brush.textContent=width===56?'Wide brush':'Extra-wide brush';};
async function load(src:string){
  if(working)throw new Error('Wait for the current photo or cancel first.');
  if(!/^data:image\/(jpeg|jpg|png);base64,/.test(src)||src.length>PHOTO_LIMITS.bytes*1.4)throw new Error('Use a JPEG or PNG under 8 MiB.');
  const image=new Image();image.src=src;await image.decode();
  if(image.width*image.height>PHOTO_LIMITS.pixels){image.src='';throw new Error('This photo is too large. Choose a smaller image.');}
  const scale=Math.min(1,PHOTO_LIMITS.side/Math.max(image.width,image.height));canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
  original=document.createElement('canvas');original.width=canvas.width;original.height=canvas.height;original.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);image.src='';src='';
  strokes=[];masks=[];locked=false;allLines=[];termBoxes=[];terms.replaceChildren();highlight.style.display='none';highlight.textContent='Show terms';draw();
  document.querySelector<HTMLElement>('#placeholder')!.style.display='none';undo.disabled=true;brush.disabled=false;analyze.disabled=false;analyze.textContent='Analyze visible photo';status.textContent='';
  tip.textContent='Drag over private information. Cover the entire value, including its edges. Covers are applied before text recognition.';emit({type:'loaded'});
}
function renderTerms(){
  terms.replaceChildren();
  if(highlight.textContent==='Show terms')return;
  for(const term of termBoxes){
    // Real OCR word boxes, merged only across the words comprising this glossary term.
    const button=document.createElement('button');button.className='term';button.setAttribute('aria-label','Explain '+term.term);button.title=term.term;
    const b=term.bbox;Object.assign(button.style,{left:`${100*b.x0/canvas.width}%`,top:`${100*b.y0/canvas.height}%`,width:`${100*(b.x1-b.x0)/canvas.width}%`,height:`${100*(b.y1-b.y0)/canvas.height}%`});
    button.onclick=()=>emit({type:'term',id:term.id});terms.append(button);
  }
}
highlight.onclick=()=>{highlight.textContent=highlight.textContent==='Show terms'?'Hide terms':'Show terms';renderTerms();};
async function recognize(){
  if(!original||locked||working)return;working=true;locked=true;analyze.disabled=true;undo.disabled=true;brush.disabled=true;
  const started=performance.now();draw();rebuildMasks();
  // Destructively replace the original backing canvas before any OCR call.
  original.width=0;original.height=0;original=undefined;strokes=[];
  tip.textContent='Covered photo locked. OCR sees only the visible pixels. Start a new photo to change covers.';
  stage('Covers applied · preparing phone-local OCR');
  const url=URL.createObjectURL(new Blob([window.__OCR_WORKER],{type:'application/javascript'}));
  let worker:Awaited<ReturnType<typeof Tesseract.createWorker>>|undefined;
  try{
    worker=await Tesseract.createWorker('eng',1,{workerPath:url,workerBlobURL:false,corePath:'memory://core.js',langPath:'memory://ocr',cacheMethod:'none',logging:false,
      logger:(p:{status:string;progress:number})=>stage(p.status==='recognizing text'?'Reading visible text on this phone':'Preparing phone-local OCR',p.progress),errorHandler:()=>{}});
    await worker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1',user_defined_dpi:'150'});
    const {data}=await worker.recognize(canvas,{}, {text:false,blocks:true});
    const rawLines=(data.blocks??[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines));
    const lines=rawLines.map(l=>({text:l.text.trim(),bbox:l.bbox,confidence:l.confidence}));
    // Discard whole lines touching covers, even if OCR recognized fragments at their edges.
    allLines=visibleLines(lines,masks);
    termBoxes=[];
    const clean=(word:string)=>word.toLowerCase().replace(/[^a-z]/g,'');
    for(const line of allLines){const raw=rawLines.find(l=>l.bbox.x0===line.bbox.x0&&l.bbox.y0===line.bbox.y0);if(!raw?.words)continue;for(const term of termsIn(line.text)){
      const tokens=term.term.split(' ').map(clean),start=raw.words.findIndex((_,i)=>tokens.every((t,j)=>raw.words[i+j]&&clean(raw.words[i+j].text)===t));
      if(start<0)continue;const boxes=raw.words.slice(start,start+tokens.length).map(w=>w.bbox);
      termBoxes.push({id:term.id,term:term.term,bbox:{x0:Math.min(...boxes.map(b=>b.x0)),y0:Math.min(...boxes.map(b=>b.y0)),x1:Math.max(...boxes.map(b=>b.x1)),y1:Math.max(...boxes.map(b=>b.y1))}});
    }}
    stage('Visible text ready · review before AI');highlight.style.display='inline-block';
    emit({type:'result',lines:allLines,masks,latencyMs:Math.round(performance.now()-started),width:canvas.width,height:canvas.height});
  }catch{stage('Could not read this photo. Try a clearer, upright page.');emit({type:'error',message:'Phone-local OCR could not read this photo. Retake a clearer page or use the supported PDF flow.'});}
  finally{working=false;await worker?.terminate();URL.revokeObjectURL(url);}
}
analyze.onclick=()=>void recognize();
window.photo={load,analyze:recognize,setTheme:dark=>{document.documentElement.dataset.theme=dark?'dark':'light';}};
// No networking beyond embedded data/blob resources. CSP also blocks external requests.
window.fetch=()=>Promise.reject(new Error('Photo network access blocked'));
emit({type:'ready',glossary:GLOSSARY.length});

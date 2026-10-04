import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Modal, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View, type TextProps } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { correctField, LABELS, LIMITS, type ReviewDocument, type Field, type FieldName } from '../../src/shared/documents';
import { minimize, ruleSummary, validateSummary, type RequestPreview, type ReviewSummary } from '../../src/shared/request';
import { reviewCase, evidenceDecisions, type Purpose } from '../../src/shared/workflow';
import { LOCALES, translateDisplay, type Locale } from '../../src/shared/locales';
import type { Pairing } from '../../src/shared/mobile-protocol';
import { companion, readPairing, verifyPreview } from '../lib/companion';
import { PdfEngine, type PdfEngineHandle } from '../components/PdfEngine';
import { FIXTURES } from '../generated/fixtures';
import PhotoLens from '../components/PhotoLens';
const LocaleContext=createContext<Locale>('en');
function Text({raw=false,children,...props}:TextProps & {raw?:boolean}){
  const locale=useContext(LocaleContext);const parts=React.Children.toArray(children);
  const display=!raw&&parts.every(p=>typeof p==='string'||typeof p==='number')?translateDisplay(parts.join(''),locale):children;
  return <NativeText {...props}>{display}</NativeText>;
}
type LocalDoc=ReviewDocument & {base64:string};
type Summary={summary:ReviewSummary;source:'ollama'|'rules';model?:string;latencyMs?:number;requestHash?:string};
const scenarios=[['address-conflict','Address conflict'],['matching','Matching'],['missing-field','Missing fields'],['malicious-text','Embedded instruction'],['visa-matching','Visa + statement'],['visa-name-conflict','Visa name conflict'],['visa-missing','Visa missing passport'],['visa-only','Visa only']];
function Button({title,onPress,disabled=false,secondary=false,testID}:{title:string;onPress:()=>void;disabled?:boolean;secondary?:boolean;testID?:string}){
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} testID={testID} onPress={onPress} disabled={disabled} style={[s.button,secondary&&s.secondary,disabled&&s.disabled]}><Text style={[s.buttonText,secondary&&s.secondaryText]}>{title}</Text></Pressable>;
}
export default function ReviewScreen(){
  const engine=useRef<PdfEngineHandle>(null), sourceEngine=useRef<PdfEngineHandle>(null);
  const [docs,setDocs]=useState<LocalDoc[]>([]), docsRef=useRef<LocalDoc[]>([]);
  const [scenario,setScenario]=useState('address-conflict'),[busy,setBusy]=useState(''),[error,setError]=useState('');
  const [pairing,setPairing]=useState<Pairing>(),pairingRef=useRef<Pairing|undefined>(undefined);
  const [health,setHealth]=useState<{available:boolean;model:string;message:string}>();
  const [preview,setPreview]=useState<RequestPreview>(),previewRef=useRef<RequestPreview|undefined>(undefined);
  const [expanded,setExpanded]=useState<string[]>([]),[fullRequest,setFullRequest]=useState(false),[showConsistent,setShowConsistent]=useState(false);
  const [approved,setApproved]=useState(false),[result,setResult]=useState<Summary>();
  const [edit,setEdit]=useState<{id:string;field:FieldName;value:string}>(),[source,setSource]=useState<{doc:LocalDoc;field:Field}>();
  const [pairModal,setPairModal]=useState(false),[scan,setScan]=useState(false),[pairText,setPairText]=useState('');
  const [permission,requestPermission]=useCameraPermissions();
  const revision=useRef(0),operation=useRef<AbortController|undefined>(undefined);
  const [evidenceOpen,setEvidenceOpen]=useState(false);
  const [photoOpen,setPhotoOpen]=useState(false);
  const [locale,setLocale]=useState<Locale>('en'),[purpose,setPurpose]=useState<Purpose>('consistency-review');
  const findings=reviewCase(docs,purpose),context=findings.length?minimize(findings,docs,purpose):undefined;
  const decisions=evidenceDecisions(docs,purpose),selected=decisions.filter(d=>d.included);
  function confirmSelected(){invalidate();replace(docsRef.current.map(doc=>{let next=doc;for(const d of selected.filter(d=>d.field.documentId===doc.id)){next={...correctField(next,d.field.field,d.field.value),base64:doc.base64};}return next;}));}
  const t=(text:string)=>translateDisplay(text,locale);
  function replace(next:LocalDoc[]){docsRef.current=next;setDocs(next);}
  function invalidate(){
    revision.current++;operation.current?.abort();operation.current=undefined;engine.current?.cancel();
    const p=previewRef.current;previewRef.current=undefined;
    if(p && pairingRef.current)void companion(pairingRef.current,{action:'cancel',id:p.id}).catch(()=>{});
    setPreview(undefined);setApproved(false);setResult(undefined);setBusy('');setFullRequest(false);
  }
  function reset(){invalidate();sourceEngine.current?.cancel();replace([]);setSource(undefined);setEdit(undefined);setError('');setExpanded([]);setShowConsistent(false);setEvidenceOpen(false);setPurpose('consistency-review');setPhotoOpen(false);}
  useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state==='background'){reset();setPairing(undefined);pairingRef.current=undefined;setHealth(undefined);}});return ()=>sub.remove();},[]);
  useEffect(()=>{if(source){void sourceEngine.current?.run({mode:'render',base64:source.doc.base64,id:source.doc.id,filename:source.doc.filename,page:source.field.page??1}).catch(e=>setError(e.message));}},[source]);
  async function localFiles(files:{filename:string;base64:string}[],append=false){
    if((append?docsRef.current.length:0)+files.length>2){setError('A case supports two PDFs. Reset to start another case.');return;}
    invalidate();setError('');setBusy('Reading PDFs on this iPhone…');const rev=revision.current;
    try {
      const added:LocalDoc[]=[];
      for(const file of files){
        if(!/\.pdf$/i.test(file.filename))throw new Error('Choose a PDF file.');
        const document=await engine.current!.run({mode:'parse',...file,id:randomUUID()});
        if(rev!==revision.current)return;
        if(!document)throw new Error('Local PDF parser did not return a document.');
        if([...added,...(append?docsRef.current:[])].some(d=>d.template===document.template))throw new Error('Use one intake or visa and one statement; duplicate types are unsupported.');
        if(document.template==='client-intake-v1'&&[...added,...(append?docsRef.current:[])].some(d=>d.template==='schengen-de-demo-v1')||document.template==='schengen-de-demo-v1'&&[...added,...(append?docsRef.current:[])].some(d=>d.template==='client-intake-v1'))throw new Error('Use a visa or an intake with a statement, not visa plus intake.');
        added.push({...document,base64:file.base64});
      }
      replace(append?[...docsRef.current,...added]:added);
    }catch(e){if(rev===revision.current)setError((e as Error).message);}finally{if(rev===revision.current)setBusy('');}
  }
  async function choose(){
    try {
      const picked=await DocumentPicker.getDocumentAsync({type:'application/pdf',multiple:true,copyToCacheDirectory:true});
      if(picked.canceled)return;
      const files:{filename:string;base64:string}[]=[];
      try {
        if(docsRef.current.length+picked.assets.length>2)throw new Error('A case supports two PDFs.');
        for(const asset of picked.assets){
          const file=new File(asset.uri);
          if(asset.mimeType && asset.mimeType!=='application/pdf')throw new Error('Choose a PDF file.');
          if(file.size>LIMITS.bytes)throw new Error('This PDF exceeds the 5 MiB file limit.');
          files.push({filename:asset.name,base64:await file.base64()});
        }
      } finally {
        for(const asset of picked.assets){const file=new File(asset.uri);if(asset.uri.startsWith(Paths.cache.uri)&&file.exists)file.delete();}
      }
      await localFiles(files,true);
    }catch(e){setError((e as Error).message);}
  }
  async function connect(text:string){
    try{const p=readPairing(text);invalidate();setPairing(p);pairingRef.current=p;setPairModal(false);setScan(false);setPairText('');setError('');
      const rev=revision.current;const h=await companion<{available:boolean;model:string;message:string}>(p,{action:'health'});if(rev===revision.current)setHealth(h);
    }catch{setError('Could not pair. Scan the private QR from your Mac and use the same Wi-Fi/hotspot.');}
  }
  async function makePreview(){
    if(!context || !pairing)return;invalidate();const rev=revision.current;setBusy('Preparing minimized request…');setError('');
    const controller=new AbortController();operation.current=controller;
    try{const raw=await companion(pairing,{action:'preview',context},controller.signal);const p=await verifyPreview(raw);
      if(rev===revision.current){setPreview(p);previewRef.current=p;}else void companion(pairing,{action:'discard',id:p.id}).catch(()=>{});
    }catch(e){if(rev===revision.current)setError((e as Error).message);}finally{if(rev===revision.current)setBusy('');}
  }
  async function send(){
    if(!preview||!approved||!pairing||!context)return;const rev=revision.current;setBusy('Ollama is explaining on your Mac…');setError('');
    const controller=new AbortController();operation.current=controller;
    try{const response=await companion<Summary>(pairing,{action:'send',id:preview.id,hash:preview.hash},controller.signal);
      if(response.source!=='ollama'||response.requestHash!==preview.hash)throw new Error('Model receipt did not match the approved request.');
      const validated=validateSummary(response.summary,context);if(rev===revision.current)setResult({...response,summary:validated});
    }catch(e){if(rev===revision.current)setError((e as Error).message);}finally{if(rev===revision.current){setBusy('');setApproved(false);setPreview(undefined);previewRef.current=undefined;operation.current=undefined;}}
  }
  function save(){if(!edit)return;invalidate();replace(docsRef.current.map(d=>d.id===edit.id?{...correctField(d,edit.field,edit.value),base64:d.base64}:d));setEdit(undefined);}
  if(photoOpen)return <PhotoLens pairing={pairing} onClose={()=>setPhotoOpen(false)}/>;
  return <LocaleContext.Provider value={locale}><SafeAreaView style={s.safe}><StatusBar style="dark"/><View style={s.header}><Text style={s.brand}>Document Review</Text><Pressable accessibilityRole="button" onPress={reset} testID="reset"><Text style={s.link}>Reset</Text></Pressable></View>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.chips}><Text style={s.small}>Language</Text>{LOCALES.map(([id,label])=><Pressable key={id} testID={`locale-${id}`} accessibilityRole="button" accessibilityState={{selected:locale===id}} onPress={()=>setLocale(id)} style={[s.chip,locale===id&&s.selected]}><Text raw style={locale===id?s.selectedText:s.chipText}>{label}</Text></Pressable>)}</View><Text style={s.small}>Five display languages. Original documents stay in their original language.</Text>
      <Text style={s.eyebrow}>PRIVATE DOCUMENT REVIEW</Text><Text style={s.title}>Find the gaps.{"\n"}Keep the details here.</Text>
      <Text style={s.body}>Read supported PDFs on your iPhone. Check the evidence. Decide what AI receives.</Text>
      <View style={s.card}><Text style={s.heading}>1. Add documents</Text><Text style={s.small}>Synthetic intake v1 / selected DE–EN Schengen layout + statement v1 • two text PDFs, 5 MiB each</Text>
        <View style={s.chips}>{scenarios.map(([id,label])=><Pressable key={id} accessibilityRole="button" onPress={()=>setScenario(id)} disabled={!!busy} style={[s.chip,scenario===id&&s.selected]}><Text style={scenario===id?s.selectedText:s.chipText}>{label}</Text></Pressable>)}</View>
        <Button title="Load demo pair" testID="load-demo" disabled={!!busy} onPress={()=>void localFiles(FIXTURES[scenario])}/>
        <Button title="Choose PDFs from Files" secondary disabled={!!busy||docs.length===2} onPress={()=>void choose()}/>
        <Button title="Scan and cover a photo" secondary testID="open-photo" disabled={!!busy} onPress={()=>{invalidate();setPhotoOpen(true);}}/>
      </View>
      {!!busy&&<View style={s.card}><ActivityIndicator color="#245449"/><Text style={s.body}>{busy}</Text><Button title="Cancel" secondary onPress={invalidate}/></View>}
      {docs.map(doc=><View key={doc.id} style={s.card}><Text style={s.eyebrow}>{doc.template==='client-intake-v1'?'CLIENT INTAKE':doc.template==='schengen-de-demo-v1'?'SCHENGEN APPLICATION':'BANK STATEMENT'}</Text><Text raw style={s.small}>{doc.filename} • {doc.pages} page(s) • phone-local</Text>
        {Object.values(doc.fields).filter(field=>field&&(['name','address','passport'].includes(field.field)||expanded.includes(doc.id))).map(field=>field&&<View key={field.field} style={s.field}><Text style={s.small}>{LABELS[field.field]}{field.confirmed?' • confirmed':''}</Text>{field.value?<Text raw selectable style={s.value}>{field.value}</Text>:<Text style={s.value}>Not supplied</Text>}<View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel={`Review ${LABELS[field.field]} ${doc.template==='client-intake-v1'?'intake':doc.template==='schengen-de-demo-v1'?'visa':'statement'}`} onPress={()=>setEdit({id:doc.id,field:field.field,value:field.value})}><Text style={s.link}>Review</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Source ${LABELS[field.field]} ${doc.template==='client-intake-v1'?'intake':doc.template==='schengen-de-demo-v1'?'visa':'statement'}`} onPress={()=>setSource({doc,field})}><Text style={s.link}>Source {field.page?`· p. ${field.page}`:'· absent'}</Text></Pressable></View></View>)}
        <Button title={expanded.includes(doc.id)?'Hide other fields':'Account, dates & other fields'} secondary onPress={()=>setExpanded(ids=>ids.includes(doc.id)?ids.filter(id=>id!==doc.id):[...ids,doc.id])}/>
      </View>)}
      <View style={s.card}><Text style={s.heading}>Proof Mode</Text><View style={s.chips}>{(['consistency-review','financial-resources'] as const).map(id=><Button key={id} title={id==='consistency-review'?'Consistency review':'Prove Financial Resources'} secondary={purpose!==id} disabled={!!busy} onPress={()=>{invalidate();setPurpose(id);}}/>)}</View>{purpose==='financial-resources'&&<><Text style={s.small}>Fictional sample policy: USD 3,000 minimum; statement ends within 45 days of 2026-10-03. Not a visa requirement.</Text><Text style={s.small}>{`${decisions.length} source fields • ${selected.length} selected locally • ${decisions.length-selected.length} excluded • ${findings.length} derived findings prepared • 0 literal values in AI context`}</Text><Button title={evidenceOpen?'Hide evidence decisions':'Inspect included and excluded fields'} secondary onPress={()=>setEvidenceOpen(!evidenceOpen)}/>{evidenceOpen&&decisions.map(d=><View key={`${d.field.documentId}-${d.field.field}`} style={s.field}><Text style={s.findingTitle}>{LABELS[d.field.field]}</Text><Text style={s.small}>{d.included?d.reason==='identity'?'Identity consistency; literal name stays on phone.':'Financial context evaluated locally; literal value stays on phone.':'Excluded from this purpose and AI.'}</Text>{d.included&&<><Text raw selectable style={s.value}>{d.field.value||'[blank]'}</Text><Button title="Source" secondary onPress={()=>setSource({doc:docs.find(doc=>doc.id===d.field.documentId)!,field:d.field})}/></>}</View>)}<Button title="Confirm selected evidence" disabled={!selected.length||!!busy} onPress={confirmSelected}/></>}</View>
      <View style={s.card}><Text style={s.heading}>2. Review the differences</Text>{!findings.length?<Text style={s.body}>Load a supported intake/visa and statement, or a visa alone for its own checks.</Text>:findings.filter(f=>f.status!=='consistent'||showConsistent||findings.every(i=>i.status==='consistent')).map(f=><View key={f.id} style={[s.finding,f.status==='consistent'?s.match:s.issue]}><Text style={s.findingTitle}>{f.label} • {f.status.replace('_',' ')}</Text><Text style={s.body}>{f.explanation}</Text>{f.status!=='consistent'&&f.evidence.slice(0,2).map((field,i)=>{
        const doc=docs.find(d=>d.id===field.documentId)!;return <Pressable key={i} accessibilityRole="button" onPress={()=>setSource({doc,field})}><Text raw style={s.quote}>{field.excerpt}</Text><Text style={s.link}>{field.template==='client-intake-v1'?'Intake':field.template==='schengen-de-demo-v1'?'Visa':'Statement'} source {field.page?`· p. ${field.page}`:'· absent'}</Text></Pressable>;
      })}</View>)}{findings.length>0&&<Button title={`${findings.filter(f=>f.status==='consistent').length} consistent checks • ${showConsistent?'hide':'show'}`} secondary onPress={()=>setShowConsistent(!showConsistent)}/>}<Text style={s.small}>Sample consistency checks. Human decisions; no authenticity or eligibility determination.</Text></View>
      <View style={s.card}><Text style={s.heading}>3. Inspect. Then explain.</Text><Text style={s.body}>PDFs and literal values stay on this phone. Only template names, field/status enums and derived findings can leave it for the paired Mac.</Text>
        <Text style={s.small}>Withheld from AI: names, addresses, IDs, accounts, amounts, dates, notes, original filenames and source excerpts.</Text>
        <Button title={pairing?'Pair a different Mac':'Pair Mac for local AI'} secondary onPress={()=>{invalidate();setPairModal(true);}}/>
        {pairing&&<><Text selectable style={s.small}>Paired Mac: {pairing.url}{"\n"}Encrypted minimized facts cross Wi-Fi. Model inference runs on that Mac.</Text><Button title="Check AI connection" secondary onPress={()=>void companion<typeof health>(pairing,{action:'health'}).then(setHealth).catch(()=>setHealth({available:false,model:'qwen2.5:1.5b',message:'Paired Mac unreachable.'}))}/><Text style={s.small}>{health?.available?`${health.model} • ready on Mac`:health?.message??'Checking Mac…'}</Text></>}
        {!preview&&<Button title="Preview exact AI request" disabled={!context||!pairing||!!busy} onPress={()=>void makePreview()}/>}
        {preview&&<><Text style={s.small}>Model destination on Mac: {preview.destination}{"\n"}SHA-256 • five-minute, one-use approval</Text><Text raw selectable style={s.code}>{preview.hash}</Text><Button title="View full exact request" secondary onPress={()=>setFullRequest(true)}/><Text style={s.small}>Exact API body; installed model also applies its own template. Any correction or reset clears approval.</Text><Pressable accessibilityRole="checkbox" accessibilityLabel={locale==='en'?'Approve minimized request to paired Mac':t('Send approved request')} accessibilityState={{checked:approved}} onPress={()=>setApproved(!approved)} disabled={!!busy} style={s.approval}><Text style={s.body}>{approved?'☑':'☐'} {t('I reviewed this request and approve sending it to Ollama on the paired Mac.')}</Text></Pressable><Button title="Send approved request" disabled={!approved||!!busy} onPress={()=>void send()}/></>}
        {context&&!busy&&<Button title="Show rule-based summary (no AI)" secondary onPress={()=>{invalidate();setResult({source:'rules',summary:ruleSummary(context)});}}/>}
      </View>
      {result&&<View style={s.card}><Text style={s.heading}>{result.source==='ollama'?'AI explanation • Ollama on Mac':'Rule-based summary • no AI response'}</Text>{result.source==='ollama'&&locale!=='en'&&<Text style={s.small}>Translated display of the validated model response. Exact request and canonical response remain unchanged.</Text>}<Text style={s.body}>{result.summary.overview}</Text>{result.summary.findings.filter(f=>findings.every(i=>i.status==='consistent')||findings.find(i=>i.id===f.id)?.status!=='consistent').map(f=><View key={f.id} style={s.field}><Text style={s.findingTitle}>{findings.find(i=>i.id===f.id)?.label}</Text><Text style={s.body}>{f.explanation}</Text><Text style={s.small}>{f.follow_up}</Text></View>)}<Text style={s.small}>{result.source==='ollama'?`Real Ollama response • ${result.model} • ${((result.latencyMs??0)/1000).toFixed(1)} s • validated`:'Generated by comparison rules. No model response.'}</Text>{result.requestHash&&<Text raw selectable style={s.code}>Request receipt: {result.requestHash}</Text>}</View>}
      <Text style={s.small}>No stored cases. Reset clears this workspace. Original documents are visible to you; this prototype does not visually redact the source PDF.</Text>
    </ScrollView>
    <PdfEngine ref={engine}/>
    <Modal visible={fullRequest&&!!preview} animationType="slide" onRequestClose={()=>setFullRequest(false)}><SafeAreaProvider><SafeAreaView style={s.safe}><View style={s.header}><Text style={s.brand}>Exact model request</Text><Button title="Close request" secondary onPress={()=>setFullRequest(false)}/></View><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text raw selectable style={s.code}>{preview?.serializedBody}</Text></ScrollView></SafeAreaView></SafeAreaProvider></Modal>
    <Modal visible={!!edit} animationType="slide" onRequestClose={()=>setEdit(undefined)}><SafeAreaProvider><SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.heading}>Confirm {edit?LABELS[edit.field]:''}</Text><Text style={s.body}>This changes the comparison value. The original PDF stays unchanged.</Text><TextInput accessibilityLabel="Confirmed value" multiline value={edit?.value??''} onChangeText={value=>setEdit(e=>e?{...e,value}:e)} style={s.input}/><Button title="Confirm value" onPress={save}/><Button title="Cancel" secondary onPress={()=>setEdit(undefined)}/></ScrollView></SafeAreaView></SafeAreaProvider></Modal>
    <Modal visible={!!source} animationType="slide" onRequestClose={()=>setSource(undefined)}><SafeAreaProvider><SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Button title="Close source" secondary onPress={()=>{sourceEngine.current?.cancel();setSource(undefined);}}/><Text style={s.heading}>Original PDF • page {source?.field.page??1}</Text><Text raw selectable style={s.quote}>{source?.field.excerpt}</Text><Text style={s.small}>Real source page and excerpt; no guessed highlight. Original private values remain visible to the human.</Text><PdfEngine ref={sourceEngine} visible/></ScrollView></SafeAreaView></SafeAreaProvider></Modal>
    <Modal visible={pairModal} animationType="slide" onRequestClose={()=>{setPairModal(false);setScan(false);}}><SafeAreaProvider><SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.heading}>Pair with your Mac</Text><Text style={s.body}>Keep the iPhone and Mac on the same Wi-Fi/hotspot. Open the private pairing QR generated on your Mac. No account or paid service needed.</Text><Button title="Scan Mac pairing QR" onPress={()=>{void requestPermission().then(p=>p.granted?setScan(true):Alert.alert(t('Camera permission'),t('Allow camera access to scan, or paste the pairing code.')));}}/>{scan&&permission?.granted&&<CameraView style={{height:300}} barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={({data})=>{setScan(false);void connect(data);}}/>}<Text style={s.small}>Or paste the private pairing JSON from the Mac (simulator/manual).</Text><TextInput accessibilityLabel="Private pairing code" value={pairText} onChangeText={setPairText} multiline autoCapitalize="none" autoCorrect={false} style={s.input}/><Button title="Connect Mac" disabled={!pairText} onPress={()=>void connect(pairText)}/><Button title="Close pairing" secondary onPress={()=>{setPairText('');setPairModal(false);setScan(false);}}/></ScrollView></SafeAreaView></SafeAreaProvider></Modal>
  </SafeAreaView></LocaleContext.Provider>;
}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#f5f7f2'},header:{paddingHorizontal:22,paddingVertical:14,flexDirection:'row',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#d9e2d4'},brand:{fontSize:18,fontWeight:'700',color:'#193e34'},link:{fontSize:14,fontWeight:'600',color:'#245449',paddingVertical:8},content:{padding:20,gap:16,paddingBottom:50},eyebrow:{fontSize:11,letterSpacing:2,fontWeight:'700',color:'#50664b'},title:{fontSize:34,lineHeight:40,fontWeight:'700',color:'#214638'},body:{fontSize:15,lineHeight:23,color:'#344d3f'},small:{fontSize:12,lineHeight:19,color:'#52614c'},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#dce4d5',borderRadius:18,padding:18,gap:12},heading:{fontSize:20,fontWeight:'700',color:'#234536'},button:{backgroundColor:'#245449',padding:15,borderRadius:10,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700',fontSize:15},secondary:{backgroundColor:'#eef3e8',borderWidth:1,borderColor:'#d2dec7'},secondaryText:{color:'#244b3b'},disabled:{opacity:0.5},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingVertical:9,paddingHorizontal:12,borderRadius:20,backgroundColor:'#f0f3eb'},selected:{backgroundColor:'#245449'},chipText:{fontSize:12,color:'#3d5a44'},selectedText:{fontSize:12,color:'#fff'},field:{paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#e5ebdf',gap:5},value:{fontSize:15,lineHeight:22,color:'#183d2c'},row:{flexDirection:'row',gap:20},finding:{padding:12,borderRadius:10,gap:8},match:{backgroundColor:'#f0f5eb'},issue:{backgroundColor:'#fff5e8',borderLeftWidth:3,borderLeftColor:'#b88032'},findingTitle:{fontSize:14,fontWeight:'700',color:'#244734'},quote:{fontSize:13,lineHeight:21,padding:12,backgroundColor:'#f4f7ef',color:'#3b523f'},error:{fontSize:14,lineHeight:22,color:'#8d2e1d',backgroundColor:'#fff0eb',padding:14,borderRadius:10},input:{minHeight:100,borderWidth:1,borderColor:'#99ad91',borderRadius:10,padding:12,color:'#223e2d',textAlignVertical:'top'},code:{fontFamily:'Menlo',fontSize:10,lineHeight:16,padding:10,backgroundColor:'#f4f6ee',color:'#304b39'},approval:{padding:10,borderWidth:1,borderColor:'#a8bca0',borderRadius:8},
});

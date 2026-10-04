import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { compareDocuments, correctField, LABELS, LIMITS, type ReviewDocument, type Field, type FieldName } from '../../src/shared/documents';
import { minimize, ruleSummary, type RequestPreview, type ReviewSummary } from '../../src/shared/request';
import { PHONE_MODEL } from '../../src/shared/on-device';
import { PhoneModel } from '../lib/phone-model';
import { PdfEngine, type PdfEngineHandle } from '../components/PdfEngine';
import { FIXTURES } from '../generated/fixtures';
type LocalDoc=ReviewDocument & {base64:string};
type Summary={summary:ReviewSummary;source:'qwen'|'rules';model?:string;latencyMs?:number;requestHash?:string};
const scenarios=[['address-conflict','Address conflict'],['matching','Matching'],['missing-field','Missing fields'],['malicious-text','Embedded instruction']];
function Button({title,onPress,disabled=false,secondary=false,testID}:{title:string;onPress:()=>void;disabled?:boolean;secondary?:boolean;testID?:string}){
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} testID={testID} onPress={onPress} disabled={disabled} style={[s.button,secondary&&s.secondary,disabled&&s.disabled]}><Text style={[s.buttonText,secondary&&s.secondaryText]}>{title}</Text></Pressable>;
}
export default function ReviewScreen(){
  const engine=useRef<PdfEngineHandle>(null), sourceEngine=useRef<PdfEngineHandle>(null);
  const [docs,setDocs]=useState<LocalDoc[]>([]), docsRef=useRef<LocalDoc[]>([]);
  const [scenario,setScenario]=useState('address-conflict'),[busy,setBusy]=useState(''),[error,setError]=useState('');
  const [phoneModel]=useState(()=>new PhoneModel());
  const [modelReady,setModelReady]=useState(false);
  const [preview,setPreview]=useState<RequestPreview>(),previewRef=useRef<RequestPreview|undefined>(undefined);
  const [expanded,setExpanded]=useState<string[]>([]),[fullRequest,setFullRequest]=useState(false),[showConsistent,setShowConsistent]=useState(false);
  const [approved,setApproved]=useState(false),[result,setResult]=useState<Summary>();
  const [edit,setEdit]=useState<{id:string;field:FieldName;value:string}>(),[source,setSource]=useState<{doc:LocalDoc;field:Field}>();
  const revision=useRef(0);
  const findings=compareDocuments(docs),context=findings.length?minimize(findings,docs):undefined;
  function replace(next:LocalDoc[]){docsRef.current=next;setDocs(next);}
  function invalidate(){
    revision.current++;phoneModel.invalidate();engine.current?.cancel();previewRef.current=undefined;
    setPreview(undefined);setApproved(false);setResult(undefined);setBusy('');setFullRequest(false);
  }
  function reset(){invalidate();sourceEngine.current?.cancel();replace([]);setSource(undefined);setEdit(undefined);setError('');setExpanded([]);setShowConsistent(false);}
  useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state==='background'){reset();setModelReady(false);void phoneModel.close().catch(()=>{});}});return ()=>{sub.remove();void phoneModel.close().catch(()=>{});};},[]);
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
        if([...added,...(append?docsRef.current:[])].some(d=>d.template===document.template))throw new Error('Use one intake and one statement; duplicate types are unsupported.');
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
  async function loadModel(){
    invalidate();const rev=revision.current;setBusy('Loading Qwen on this iPhone…');setError('');
    try{await phoneModel.load();if(rev===revision.current)setModelReady(true);}
    catch(e){if(rev===revision.current)setError((e as Error).message);}
    finally{if(rev===revision.current)setBusy('');}
  }
  async function makePreview(){
    if(!context || !modelReady)return;invalidate();const rev=revision.current;setBusy('Preparing minimized request on this iPhone…');setError('');
    try{const p=await phoneModel.preview(context);
      if(rev===revision.current){setPreview(p);previewRef.current=p;}
    }catch(e){if(rev===revision.current)setError((e as Error).message);}finally{if(rev===revision.current)setBusy('');}
  }
  async function send(){
    if(!preview||!approved||!modelReady||!context)return;const rev=revision.current;setBusy('Qwen is explaining on this iPhone…');setError('');
    try{const response=await phoneModel.send(preview.id,preview.hash,approved);
      if(response.requestHash!==preview.hash)throw new Error('Model receipt did not match the approved request.');
      if(rev===revision.current)setResult(response);
    }catch(e){if(rev===revision.current)setError((e as Error).message);}finally{if(rev===revision.current){setBusy('');setApproved(false);setPreview(undefined);previewRef.current=undefined;}}
  }
  function save(){if(!edit)return;invalidate();replace(docsRef.current.map(d=>d.id===edit.id?{...correctField(d,edit.field,edit.value),base64:d.base64}:d));setEdit(undefined);}
  return <SafeAreaView style={s.safe}><StatusBar style="dark"/><View style={s.header}><Text style={s.brand}>Document Review</Text><Pressable accessibilityRole="button" onPress={reset} testID="reset"><Text style={s.link}>Reset</Text></Pressable></View>
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>PRIVATE DOCUMENT REVIEW</Text><Text style={s.title}>Find the gaps.{"\n"}Keep the details here.</Text>
      <Text style={s.body}>Read supported PDFs on your iPhone. Check the evidence. Decide what AI receives.</Text>
      <View style={s.card}><Text style={s.heading}>1. Add documents</Text><Text style={s.small}>Synthetic intake v1 + statement v1 • two PDFs, 5 MiB each</Text>
        <View style={s.chips}>{scenarios.map(([id,label])=><Pressable key={id} accessibilityRole="button" onPress={()=>setScenario(id)} disabled={!!busy} style={[s.chip,scenario===id&&s.selected]}><Text style={scenario===id?s.selectedText:s.chipText}>{label}</Text></Pressable>)}</View>
        <Button title="Load demo pair" testID="load-demo" disabled={!!busy} onPress={()=>void localFiles(FIXTURES[scenario])}/>
        <Button title="Choose PDFs from Files" secondary disabled={!!busy||docs.length===2} onPress={()=>void choose()}/>
      </View>
      {!!busy&&<View style={s.card}><ActivityIndicator color="#245449"/><Text style={s.body}>{busy}</Text><Button title="Cancel" secondary onPress={invalidate}/></View>}
      {docs.map(doc=><View key={doc.id} style={s.card}><Text style={s.eyebrow}>{doc.template==='client-intake-v1'?'CLIENT INTAKE':'BANK STATEMENT'}</Text><Text style={s.small}>{doc.filename} • {doc.pages} page(s) • phone-local</Text>
        {Object.values(doc.fields).filter(field=>field&&(['name','address'].includes(field.field)||expanded.includes(doc.id))).map(field=>field&&<View key={field.field} style={s.field}><Text style={s.small}>{LABELS[field.field]}{field.confirmed?' • confirmed':''}</Text><Text selectable style={s.value}>{field.value||'Not supplied'}</Text><View style={s.row}><Pressable accessibilityRole="button" accessibilityLabel={`Review ${LABELS[field.field]} ${doc.template==='client-intake-v1'?'intake':'statement'}`} onPress={()=>setEdit({id:doc.id,field:field.field,value:field.value})}><Text style={s.link}>Review</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Source ${LABELS[field.field]} ${doc.template==='client-intake-v1'?'intake':'statement'}`} onPress={()=>setSource({doc,field})}><Text style={s.link}>Source {field.page?`· p. ${field.page}`:'· absent'}</Text></Pressable></View></View>)}
        <Button title={expanded.includes(doc.id)?'Hide other fields':'Account, dates & other fields'} secondary onPress={()=>setExpanded(ids=>ids.includes(doc.id)?ids.filter(id=>id!==doc.id):[...ids,doc.id])}/>
      </View>)}
      <View style={s.card}><Text style={s.heading}>2. Review the differences</Text>{!findings.length?<Text style={s.body}>Load one supported intake and one statement. Visa-form support is the next feature phase.</Text>:findings.filter(f=>f.status!=='consistent'||showConsistent||findings.every(i=>i.status==='consistent')).map(f=><View key={f.id} style={[s.finding,f.status==='consistent'?s.match:s.issue]}><Text style={s.findingTitle}>{f.label} • {f.status.replace('_',' ')}</Text><Text style={s.body}>{f.explanation}</Text>{f.status!=='consistent'&&f.evidence.slice(0,2).map((field,i)=>{
        const doc=docs.find(d=>d.id===field.documentId)!;return <Pressable key={i} accessibilityRole="button" onPress={()=>setSource({doc,field})}><Text style={s.quote}>{field.excerpt}</Text><Text style={s.link}>{field.template==='client-intake-v1'?'Intake':'Statement'} source {field.page?`· p. ${field.page}`:'· absent'}</Text></Pressable>;
      })}</View>)}{findings.length>0&&<Button title={`${findings.filter(f=>f.status==='consistent').length} consistent checks • ${showConsistent?'hide':'show'}`} secondary onPress={()=>setShowConsistent(!showConsistent)}/>}<Text style={s.small}>Sample consistency checks. Human decisions; no authenticity or eligibility determination.</Text></View>
      <View style={s.card}><Text style={s.heading}>3. Inspect. Then explain.</Text><Text style={s.body}>Documents stay on this iPhone. Qwen runs here too, with only minimized review facts. No Mac, Wi-Fi or cloud is needed after installation.</Text>
        <Text style={s.small}>Withheld from AI: names, addresses, IDs, accounts, amounts, dates, notes, original filenames and source excerpts.</Text>
        {!modelReady?<Button title="Load Qwen on this iPhone" disabled={!!busy} onPress={()=>void loadModel()}/>:<Text style={s.small}>{PHONE_MODEL.name} • ready on this iPhone</Text>}
        <Text style={s.small}>Bundled Q4_K_M model • 491 MB • native standalone app required. Expo Go cannot run this model.</Text>
        {!preview&&<Button title="Preview exact AI request" disabled={!context||!modelReady||!!busy} onPress={()=>void makePreview()}/>}
        {preview&&<><Text style={s.small}>Model runs in this app: {preview.destination}{"\n"}SHA-256 • five-minute, one-use approval</Text><Text selectable style={s.code}>{preview.hash}</Text><Button title="View full exact request" secondary onPress={()=>setFullRequest(true)}/><Text style={s.small}>Exact local completion arguments, including the model-formatted prompt and output schema. Model weights and runtime defaults are identified separately. Corrections or reset clear approval.</Text><Pressable accessibilityRole="checkbox" accessibilityLabel="Approve minimized request to on-device Qwen" accessibilityState={{checked:approved}} onPress={()=>setApproved(!approved)} disabled={!!busy} style={s.approval}><Text style={s.body}>{approved?'☑':'☐'} I reviewed this request and approve giving these minimized facts to Qwen on this iPhone.</Text></Pressable><Button title="Explain on this iPhone" disabled={!approved||!!busy} onPress={()=>void send()}/></>}
        {context&&!busy&&<Button title="Show rule-based summary (no AI)" secondary onPress={()=>{invalidate();setResult({source:'rules',summary:ruleSummary(context)});}}/>}
      </View>
      {result&&<View style={s.card}><Text style={s.heading}>{result.source==='qwen'?'AI explanation • Qwen on this iPhone':'Rule-based summary • no AI response'}</Text><Text style={s.body}>{result.summary.overview}</Text>{result.summary.findings.filter(f=>findings.every(i=>i.status==='consistent')||findings.find(i=>i.id===f.id)?.status!=='consistent').map(f=><View key={f.id} style={s.field}><Text style={s.findingTitle}>{findings.find(i=>i.id===f.id)?.label}</Text><Text style={s.body}>{f.explanation}</Text><Text style={s.small}>{f.follow_up}</Text></View>)}<Text style={s.small}>{result.source==='qwen'?`Real on-device model response • ${result.model} • ${((result.latencyMs??0)/1000).toFixed(1)} s • validated`:'Generated by comparison rules. No model response.'}</Text>{result.requestHash&&<Text selectable style={s.code}>Request receipt: {result.requestHash}</Text>}</View>}
      <Text style={s.small}>No stored cases. Reset clears this workspace. Original documents are visible to you; this prototype does not visually redact the source PDF.</Text>
    </ScrollView>
    <PdfEngine ref={engine}/>
    <Modal visible={fullRequest&&!!preview} animationType="slide" onRequestClose={()=>setFullRequest(false)}><SafeAreaProvider><SafeAreaView style={s.safe}><View style={s.header}><Text style={s.brand}>Exact model request</Text><Button title="Close request" secondary onPress={()=>setFullRequest(false)}/></View><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text selectable style={s.code}>{preview?.serializedBody}</Text></ScrollView></SafeAreaView></SafeAreaProvider></Modal>
    <Modal visible={!!edit} animationType="slide" onRequestClose={()=>setEdit(undefined)}><SafeAreaProvider><SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.heading}>Confirm {edit?LABELS[edit.field]:''}</Text><Text style={s.body}>This changes the comparison value. The original PDF stays unchanged.</Text><TextInput accessibilityLabel="Confirmed value" multiline value={edit?.value??''} onChangeText={value=>setEdit(e=>e?{...e,value}:e)} style={s.input}/><Button title="Confirm value" onPress={save}/><Button title="Cancel" secondary onPress={()=>setEdit(undefined)}/></ScrollView></SafeAreaView></SafeAreaProvider></Modal>
    <Modal visible={!!source} animationType="slide" onRequestClose={()=>setSource(undefined)}><SafeAreaProvider><SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Button title="Close source" secondary onPress={()=>{sourceEngine.current?.cancel();setSource(undefined);}}/><Text style={s.heading}>Original PDF • page {source?.field.page??1}</Text><Text selectable style={s.quote}>{source?.field.excerpt}</Text><Text style={s.small}>Real source page and excerpt; no guessed highlight. Original private values remain visible to the human.</Text><PdfEngine ref={sourceEngine} visible/></ScrollView></SafeAreaView></SafeAreaProvider></Modal>

  </SafeAreaView>;
}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#f5f7f2'},header:{paddingHorizontal:22,paddingVertical:14,flexDirection:'row',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#d9e2d4'},brand:{fontSize:18,fontWeight:'700',color:'#193e34'},link:{fontSize:14,fontWeight:'600',color:'#245449',paddingVertical:8},content:{padding:20,gap:16,paddingBottom:50},eyebrow:{fontSize:11,letterSpacing:2,fontWeight:'700',color:'#50664b'},title:{fontSize:34,lineHeight:40,fontWeight:'700',color:'#214638'},body:{fontSize:15,lineHeight:23,color:'#344d3f'},small:{fontSize:12,lineHeight:19,color:'#52614c'},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#dce4d5',borderRadius:18,padding:18,gap:12},heading:{fontSize:20,fontWeight:'700',color:'#234536'},button:{backgroundColor:'#245449',padding:15,borderRadius:10,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700',fontSize:15},secondary:{backgroundColor:'#eef3e8',borderWidth:1,borderColor:'#d2dec7'},secondaryText:{color:'#244b3b'},disabled:{opacity:0.5},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingVertical:9,paddingHorizontal:12,borderRadius:20,backgroundColor:'#f0f3eb'},selected:{backgroundColor:'#245449'},chipText:{fontSize:12,color:'#3d5a44'},selectedText:{fontSize:12,color:'#fff'},field:{paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#e5ebdf',gap:5},value:{fontSize:15,lineHeight:22,color:'#183d2c'},row:{flexDirection:'row',gap:20},finding:{padding:12,borderRadius:10,gap:8},match:{backgroundColor:'#f0f5eb'},issue:{backgroundColor:'#fff5e8',borderLeftWidth:3,borderLeftColor:'#b88032'},findingTitle:{fontSize:14,fontWeight:'700',color:'#244734'},quote:{fontSize:13,lineHeight:21,padding:12,backgroundColor:'#f4f7ef',color:'#3b523f'},error:{fontSize:14,lineHeight:22,color:'#8d2e1d',backgroundColor:'#fff0eb',padding:14,borderRadius:10},input:{minHeight:100,borderWidth:1,borderColor:'#99ad91',borderRadius:10,padding:12,color:'#223e2d',textAlignVertical:'top'},code:{fontFamily:'Menlo',fontSize:10,lineHeight:16,padding:10,backgroundColor:'#f4f6ee',color:'#304b39'},approval:{padding:10,borderWidth:1,borderColor:'#a8bca0',borderRadius:8},
});

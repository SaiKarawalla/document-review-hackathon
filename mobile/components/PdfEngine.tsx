import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { randomUUID } from 'expo-crypto';
import { ENGINE_HTML } from '../generated/engine';
import type { ReviewDocument } from '../../src/shared/documents';
type Input={mode:'parse'|'render';base64:string;id:string;filename:string;page?:number};
export interface PdfEngineHandle {run:(input:Input)=>Promise<ReviewDocument|undefined>;cancel:()=>void}
export const PdfEngine=forwardRef<PdfEngineHandle,{visible?:boolean}>(({visible=false},ref)=>{
  const web=useRef<WebView>(null), ready=useRef(false);
  const pending=useRef<{token:string;input:Input;resolve:(doc:ReviewDocument|undefined)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}|undefined>(undefined);
  const [epoch,setEpoch]=useState(0);
  useEffect(()=>()=>{const p=pending.current;if(p){clearTimeout(p.timer);p.reject(new Error('PDF engine closed.'));}pending.current=undefined;},[]);
  function cancel(){const p=pending.current;pending.current=undefined;if(p){clearTimeout(p.timer);p.reject(new Error('PDF operation cancelled.'));}ready.current=false;setEpoch(n=>n+1);}
  function send(){const p=pending.current;if(p && ready.current)web.current?.injectJavaScript(`window.reviewEngine(${JSON.stringify(JSON.stringify({...p.input,token:p.token}))});true;`);}
  useImperativeHandle(ref,()=>({cancel,run(input){if(pending.current)return Promise.reject(new Error('PDF operation already running.'));return new Promise((resolve,reject)=>{
    const token=randomUUID();const timer=setTimeout(()=>{cancel();},15000);
    pending.current={token,input,resolve,reject,timer};send();
  });}}));
  return <View style={visible?styles.viewer:styles.hidden} pointerEvents={visible?'auto':'none'} accessibilityElementsHidden={!visible}>
    <WebView key={epoch} ref={web} source={{html:ENGINE_HTML}} originWhitelist={['about:blank']} javaScriptEnabled
      incognito setSupportMultipleWindows={false} allowFileAccess={false} allowUniversalAccessFromFileURLs={false}
      onShouldStartLoadWithRequest={request=>request.url==='about:blank'}
      onMessage={event=>{
        try{const result=JSON.parse(event.nativeEvent.data);if(result.ready){ready.current=true;send();return;}
          const p=pending.current;if(!p || result.token!==p.token)return;clearTimeout(p.timer);pending.current=undefined;
          if(result.error)p.reject(new Error(result.error));else p.resolve(result.document);
        }catch{const p=pending.current;if(p){clearTimeout(p.timer);pending.current=undefined;p.reject(new Error('Local PDF engine failed.'));}}
      }} onError={()=>cancel()} onContentProcessDidTerminate={()=>cancel()}/>
  </View>;
});
PdfEngine.displayName='PdfEngine';
const styles=StyleSheet.create({hidden:{position:'absolute',width:1,height:1,opacity:0},viewer:{height:500,backgroundColor:'#fff'}});

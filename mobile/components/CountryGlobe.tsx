import React,{useMemo,useRef,useState,useEffect} from 'react';
import {Pressable,Text,View} from 'react-native';
import Svg,{Circle,Path,Defs,RadialGradient,Stop,ClipPath} from 'react-native-svg';
import land from '../assets/land.json';
import {COUNTRIES,project,type CountryId} from '../lib/countries';
import {useAppearance} from '../lib/appearance';

export default function CountryGlobe(props:{size?:number;onSelect?:(id:CountryId)=>void}){const {country}=useAppearance();return <Globe key={country} {...props} country={country}/>;}
function Globe({size=280,onSelect,country}:{size?:number;onSelect?:(id:CountryId)=>void;country:CountryId}){
  const {colors}=useAppearance(),chosen=COUNTRIES.find(c=>c.id===country)!;
  const [center,setCenter]=useState<{lat:number;lon:number}>({lat:chosen.lat,lon:chosen.lon});
  const current=useRef(center),start=useRef(center),frame=useRef<number|undefined>(undefined);
  useEffect(()=>()=>{if(frame.current!==undefined)cancelAnimationFrame(frame.current);},[]);
  const touch=useRef({x:0,y:0});
  const r=size*.43,c=size/2;
  const paths=useMemo(()=>land.map(ring=>{let path='',drawing=false;for(const [lon,lat] of ring){const p=project(lat,lon,center.lat,center.lon,r);if(p.visible){path+=`${drawing?'L':'M'}${(c+p.x).toFixed(1)},${(c+p.y).toFixed(1)}`;drawing=true;}else if(drawing){path+='Z';drawing=false;}}return path+(drawing?'Z':'');}),[center,c,r]);
  const grid=useMemo(()=>{const lines:string[]=[];for(const lat of [-60,-30,0,30,60]){let pth='',draw=false;for(let lon=-180;lon<=180;lon+=4){const p=project(lat,lon,center.lat,center.lon,r);if(p.visible){pth+=`${draw?'L':'M'}${c+p.x},${c+p.y}`;draw=true;}else draw=false;}lines.push(pth);}for(let lon=-180;lon<180;lon+=30){let pth='',draw=false;for(let lat=-90;lat<=90;lat+=4){const p=project(lat,lon,center.lat,center.lon,r);if(p.visible){pth+=`${draw?'L':'M'}${c+p.x},${c+p.y}`;draw=true;}else draw=false;}lines.push(pth);}return lines;},[center,c,r]);
  return <View style={{width:size,height:size,alignSelf:'center'}} onTouchStart={e=>{touch.current={x:e.nativeEvent.pageX,y:e.nativeEvent.pageY};}} onMoveShouldSetResponder={e=>{const dx=e.nativeEvent.pageX-touch.current.x,dy=e.nativeEvent.pageY-touch.current.y;return Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy);}} onResponderGrant={()=>{start.current=current.current;}} onResponderMove={e=>{current.current={lat:Math.max(-55,Math.min(65,start.current.lat+(e.nativeEvent.pageY-touch.current.y)*.25)),lon:start.current.lon-(e.nativeEvent.pageX-touch.current.x)*.45};if(frame.current===undefined)frame.current=requestAnimationFrame(()=>{frame.current=undefined;setCenter(current.current);});}} accessibilityLabel="Country globe. Drag horizontally to rotate; use the country list to select any country.">
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Defs><RadialGradient id="ocean" cx="35%" cy="28%" rx="75%" ry="75%"><Stop offset="0" stopColor={colors.ocean}/><Stop offset="1" stopColor={colors.land} stopOpacity=".35"/></RadialGradient><ClipPath id="globeClip"><Circle cx={c} cy={c} r={r}/></ClipPath></Defs><Circle cx={c} cy={c+5} r={r} fill={colors.text} opacity={.045}/><Circle cx={c} cy={c} r={r} fill="url(#ocean)" stroke={colors.border} strokeWidth={1}/><Path d={paths.join('')} fill={colors.land} stroke={colors.ocean} strokeWidth={.5} clipPath="url(#globeClip)"/>{grid.map((p,i)=><Path key={i} d={p} stroke={colors.text} strokeOpacity={.07} strokeWidth={.65} fill="none"/>)}</Svg>
    {COUNTRIES.map(item=>{const p=project(item.lat,item.lon,center.lat,center.lon,r);return p.visible?<Pressable key={item.id} testID={`globe-${item.id}`} accessibilityRole="button" accessibilityLabel={`Select ${item.name} on globe`} accessibilityState={{selected:country===item.id}} onPress={()=>onSelect?.(item.id)} style={{position:'absolute',left:c+p.x-18,top:c+p.y-18,width:36,height:36,alignItems:'center',justifyContent:'center'}}><View style={{width:country===item.id?30:13,height:country===item.id?30:13,borderRadius:20,backgroundColor:country===item.id?colors.card:colors.accent,borderWidth:country===item.id?1:2,borderColor:country===item.id?colors.border:colors.card,alignItems:'center',justifyContent:'center'}}>{country===item.id&&<Text style={{fontSize:19}}>{item.flag}</Text>}</View></Pressable>:null;})}
  </View>;
}

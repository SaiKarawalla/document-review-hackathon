import React,{useMemo,useRef,useState,useEffect} from 'react';
import {AppState,PanResponder,Pressable,Text,View} from 'react-native';
import Svg,{Circle,Path,Defs,RadialGradient,Stop,ClipPath} from 'react-native-svg';
import {COUNTRIES,project,type CountryId} from '../lib/countries';
import {dragCenter,globePaths,type GlobeCenter} from '../lib/globe-geometry';
import {useAppearance} from '../lib/appearance';

type Props={size?:number;onSelect?:(id:CountryId)=>void;onDrag?:(active:boolean)=>void};
export default function CountryGlobe(props:Props){const {country}=useAppearance();return <Globe key={country} {...props} country={country}/>;}
function Globe({size=280,onSelect,onDrag,country}:Props&{country:CountryId}){
  const {colors}=useAppearance(),chosen=COUNTRIES.find(c=>c.id===country)!;
  const [center,setCenter]=useState<GlobeCenter>({lat:chosen.lat,lon:chosen.lon});
  const current=useRef(center),start=useRef(center),frame=useRef<number|undefined>(undefined);
  const r=size*.43,c=size/2;
  const paths=useMemo(()=>globePaths(center,size),[center,size]);
  function stop(){if(frame.current!==undefined)cancelAnimationFrame(frame.current);frame.current=undefined;}
  function publish(){if(frame.current===undefined)frame.current=requestAnimationFrame(()=>{frame.current=undefined;setCenter({...current.current});});}
  function settle(vx:number,vy:number){
    stop();onDrag?.(false);
    const scale=140/size;
    let x=Math.max(-.22,Math.min(.22,-vx*scale)),y=Math.max(-.12,Math.min(.12,vy*scale)),previous=0;
    const tick=(time:number)=>{
      const dt=previous?Math.min(32,time-previous):16;previous=time;
      const p=current.current;
      current.current={lat:Math.max(-80,Math.min(80,p.lat+y*dt)),lon:((p.lon+x*dt+180)%360+360)%360-180};
      setCenter({...current.current});
      const decay=Math.exp(-dt/170);x*=decay;y*=decay;
      if(Math.abs(x)+Math.abs(y)>.003)frame.current=requestAnimationFrame(tick);else frame.current=undefined;
    };
    if(Math.abs(x)+Math.abs(y)>.003)frame.current=requestAnimationFrame(tick);else setCenter({...current.current});
  }
  // Preserve PanResponder's gesture state across frame renders.
  // create stores these callbacks; ref reads occur only in later touch events.
  // eslint-disable-next-line react-hooks/refs
  const [responder]=useState(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>false,
    onMoveShouldSetPanResponderCapture:(_,g)=>g.numberActiveTouches===1&&Math.hypot(g.dx,g.dy)>4,
    onPanResponderGrant:()=>{stop();start.current=current.current;onDrag?.(true);},
    onPanResponderMove:(_,g)=>{current.current=dragCenter(start.current,g.dx,g.dy,size);publish();},
    onPanResponderRelease:(_,g)=>settle(g.vx,g.vy),
    onPanResponderTerminationRequest:()=>false,
    onPanResponderTerminate:()=>{stop();setCenter({...current.current});onDrag?.(false);},
    onShouldBlockNativeResponder:()=>true,
  }));
  useEffect(()=>{const sub=AppState.addEventListener('change',state=>{if(state!=='active'){if(frame.current!==undefined)cancelAnimationFrame(frame.current);frame.current=undefined;onDrag?.(false);}});return ()=>{if(frame.current!==undefined)cancelAnimationFrame(frame.current);sub.remove();};},[onDrag]);
  return <View testID="country-globe" {...responder.panHandlers} onTouchStart={stop} style={{width:size,height:size,alignSelf:'center'}} accessibilityLabel="Country globe. Drag in any direction to rotate; use the country list to select any country." accessibilityValue={{text:`${Math.round(center.lon)} degrees longitude, ${Math.round(center.lat)} degrees latitude`}}>
    <Svg pointerEvents="none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Defs><RadialGradient id="ocean" cx="35%" cy="28%" rx="75%" ry="75%"><Stop offset="0" stopColor={colors.ocean}/><Stop offset="1" stopColor={colors.land} stopOpacity=".35"/></RadialGradient><ClipPath id="globeClip"><Circle cx={c} cy={c} r={r}/></ClipPath></Defs><Circle cx={c} cy={c+5} r={r} fill={colors.text} opacity={.045}/><Circle cx={c} cy={c} r={r} fill="url(#ocean)" stroke={colors.border} strokeWidth={1}/><Path d={paths.land} fill={colors.land} stroke={colors.ocean} strokeWidth={.5} clipPath="url(#globeClip)"/><Path d={paths.grid} stroke={colors.text} strokeOpacity={.07} strokeWidth={.65} fill="none"/></Svg>
    {COUNTRIES.map(item=>{const p=project(item.lat,item.lon,center.lat,center.lon,r);return p.visible?<Pressable key={item.id} testID={`globe-${item.id}`} accessibilityRole="button" accessibilityLabel={`Select ${item.name} on globe`} accessibilityState={{selected:country===item.id}} onPress={()=>onSelect?.(item.id)} style={{position:'absolute',left:c+p.x-18,top:c+p.y-18,width:36,height:36,alignItems:'center',justifyContent:'center'}}><View style={{width:country===item.id?30:13,height:country===item.id?30:13,borderRadius:20,backgroundColor:country===item.id?colors.card:colors.accent,borderWidth:country===item.id?1:2,borderColor:country===item.id?colors.border:colors.card,alignItems:'center',justifyContent:'center'}}>{country===item.id&&<Text style={{fontSize:19}}>{item.flag}</Text>}</View></Pressable>:null;})}
  </View>;
}

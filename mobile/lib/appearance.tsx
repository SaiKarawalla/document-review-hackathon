import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';
import type { Locale } from '../../src/shared/locales';
import type { Pairing } from '../../src/shared/mobile-protocol';
import { COUNTRIES, type CountryId } from './countries';

const light = { background:'#FFFFFF', surface:'#F7F7F7', card:'#FFFFFF', text:'#222222', muted:'#646464', border:'#E8E8E8', accent:'#D92D50', onAccent:'#FFFFFF', soft:'#FFF1F3', land:'#D3C8B9', ocean:'#F1EDE7', success:'#26744B', issue:'#FFF6E8', error:'#9B2525' };
const dark = { background:'#151515', surface:'#222222', card:'#1B1B1B', text:'#F5F5F5', muted:'#B4B4B4', border:'#373737', accent:'#FF718B', onAccent:'#191919', soft:'#342128', land:'#796F65', ocean:'#282623', success:'#83CCA0', issue:'#352C1F', error:'#FF9B9B' };
export type Palette = typeof light;
type Appearance = { colors:Palette; dark:boolean; mode:'system'|'light'|'dark'; setMode:(m:'system'|'light'|'dark')=>void; locale:Locale; setLocale:(l:Locale)=>void; country:CountryId; selectCountry:(c:CountryId)=>void; pairing?:Pairing; setPairing:(p:Pairing|undefined)=>void };
const Context = createContext<Appearance | null>(null);
export function AppearanceProvider({children}:{children:React.ReactNode}) {
  const system=useColorScheme(), [mode,setMode]=useState<Appearance['mode']>('system');
  const [locale,setLocale]=useState<Locale>('en'),[country,setCountry]=useState<CountryId>('US'),[pairing,setPairing]=useState<Pairing>();
  const isDark=mode==='dark'||mode==='system'&&system==='dark';
  useEffect(()=>{const sub=AppState.addEventListener('change',s=>{if(s==='background')setPairing(undefined);});return ()=>sub.remove();},[]);
  function selectCountry(id:CountryId){setCountry(id);setLocale(COUNTRIES.find(c=>c.id===id)!.locale);}
  return <Context.Provider value={{colors:isDark?dark:light,dark:isDark,mode,setMode,locale,setLocale,country,selectCountry,pairing,setPairing}}>{children}</Context.Provider>;
}
export function useAppearance(){const value=useContext(Context);if(!value)throw new Error('AppearanceProvider required');return value;}

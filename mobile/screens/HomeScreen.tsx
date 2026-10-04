import React from 'react';
import {Pressable,ScrollView,View,Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useAppearance} from '../lib/appearance';
import {COUNTRIES} from '../lib/countries';
import {LOCALES} from '../../src/shared/locales';
import CountryGlobe from '../components/CountryGlobe';
import {ActionButton,Copy,Icon,styles} from '../components/UI';

export default function HomeScreen(){
  const {colors,country,locale,selectCountry,pairing}=useAppearance(),selected=COUNTRIES.find(c=>c.id===country)!;
  return <SafeAreaView edges={['top']} style={{flex:1,backgroundColor:colors.background}}><ScrollView contentContainerStyle={styles.page}>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Copy bold size={17}>Document Review</Copy><Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={()=>router.navigate('/settings')} style={styles.iconButton}><Icon name="settings"/></Pressable></View>
    <Pressable testID="country-picker" accessibilityRole="button" accessibilityLabel="Choose country and language" onPress={()=>router.push('/countries')} style={{borderRadius:28,borderWidth:1,borderColor:colors.border,padding:15,flexDirection:'row',gap:12,alignItems:'center',backgroundColor:colors.card,boxShadow:'0px 3px 12px rgba(0,0,0,0.05)'}}><Icon name="globe" size={22}/><View style={{flex:1}}><Copy bold>{selected.name}</Copy><Copy size={12} muted>{LOCALES.find(l=>l[0]===locale)![1]}</Copy></View><Icon name="arrow" size={19}/></Pressable>
    <View style={{gap:8}}><Copy size={34} bold>{'Paperwork,\nmade clearer.'}</Copy><Copy muted>Find what needs attention. Keep private details in your hands.</Copy></View>
    <View style={{gap:14}}><Copy size={22} bold>How can we help?</Copy><Task icon="document" title="Compare documents" subtitle="Spot missing or conflicting information." onPress={()=>router.navigate({pathname:'/review',params:{entry:'compare',nonce:Date.now().toString()}})}/><Task icon="camera" title="Read a document photo" subtitle="Cover private details, then read the rest." onPress={()=>router.navigate({pathname:'/review',params:{entry:'photo',nonce:Date.now().toString()}})}/></View>
    <View style={{backgroundColor:colors.surface,borderRadius:24,padding:18,gap:2}}><View style={{gap:4}}><Copy bold>Your world. Your language.</Copy><Copy muted size={12}>10 countries · 5 languages</Copy></View><CountryGlobe size={260} onSelect={selectCountry}/><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:15,color:colors.text}}>{selected.flag}  {selected.name}</Text><Pressable accessibilityRole="button" onPress={()=>router.push('/countries')} style={{padding:10}}><Copy bold size={13}>Change</Copy></Pressable></View><Copy muted size={11}>Country sets a language preference, not visa rules.</Copy></View>
    <View style={{flexDirection:'row',gap:12,paddingVertical:8}}><Icon name="shield" size={20}/><View style={{flex:1,gap:4}}><Copy bold size={13}>Your documents stay on your phone.</Copy><Copy muted size={12}>AI gets only the reduced facts you inspect and approve.</Copy></View></View>
    {!pairing&&<ActionButton title="Connect Mac for AI" secondary icon="link" onPress={()=>router.navigate('/settings')}/>}
  </ScrollView></SafeAreaView>;
}
function Task({icon,title,subtitle,onPress}:{icon:'document'|'camera';title:string;subtitle:string;onPress:()=>void}){const {colors}=useAppearance();return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={{flexDirection:'row',alignItems:'center',gap:16,paddingVertical:18,borderBottomWidth:1,borderColor:colors.border}}><View style={{width:56,height:56,borderRadius:16,backgroundColor:colors.soft,alignItems:'center',justifyContent:'center'}}><Icon name={icon} size={27} color={colors.accent}/></View><View style={{flex:1,gap:4}}><Copy bold>{title}</Copy><Copy size={13} muted>{subtitle}</Copy></View><Icon name="arrow" size={20}/></Pressable>;}

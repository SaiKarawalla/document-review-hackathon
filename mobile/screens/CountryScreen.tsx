import React from 'react';
import {Pressable,ScrollView,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {useAppearance} from '../lib/appearance';
import {COUNTRIES} from '../lib/countries';
import {LOCALES} from '../../src/shared/locales';
import CountryGlobe from '../components/CountryGlobe';
import {ActionButton,Copy,Icon,PageHeader,styles} from '../components/UI';
export default function CountryScreen(){const {colors,country,selectCountry}=useAppearance();return <SafeAreaView style={{flex:1,backgroundColor:colors.background}}><PageHeader title="Country & language" onBack={()=>router.back()}/><ScrollView contentContainerStyle={{...styles.page,gap:12}}><Copy size={26} bold>Make yourself at home.</Copy><Copy muted>Drag the globe or choose a country below.</Copy><CountryGlobe onSelect={selectCountry}/>{COUNTRIES.map(item=><Pressable key={item.id} testID={`country-${item.id}`} accessibilityRole="button" accessibilityLabel={`Choose ${item.name}`} accessibilityState={{selected:item.id===country}} onPress={()=>selectCountry(item.id)} style={{paddingVertical:14,paddingHorizontal:16,borderRadius:14,flexDirection:'row',alignItems:'center',gap:14,borderWidth:1,borderColor:country===item.id?colors.accent:colors.border,backgroundColor:country===item.id?colors.soft:colors.card}}><Text style={{fontSize:26}}>{item.flag}</Text><View style={{flex:1}}><Copy bold>{item.name}</Copy><Copy muted size={12}>{LOCALES.find(l=>l[0]===item.locale)![1]}</Copy></View>{country===item.id&&<Icon name="check" color={colors.accent}/>}</Pressable>)}<Copy muted size={12}>These are display preferences. You can choose any of the five languages in Settings. No country-specific visa rules are added.</Copy></ScrollView><View style={{padding:20,borderTopWidth:1,borderColor:colors.border}}><ActionButton title="Done" onPress={()=>router.back()}/></View></SafeAreaView>;}

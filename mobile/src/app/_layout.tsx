import React from 'react';
import { Tabs } from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {AppearanceProvider,useAppearance} from '../../lib/appearance';
import {Icon} from '../../components/UI';
import {translateDisplay} from '../../../src/shared/locales';
function Navigation(){const {colors,dark,locale}=useAppearance();return <><StatusBar style={dark?'light':'dark'}/><Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:colors.accent,tabBarInactiveTintColor:colors.muted,tabBarStyle:{backgroundColor:colors.background,borderTopColor:colors.border},tabBarLabelStyle:{fontSize:11,fontWeight:'600'},animation:'none'}}><Tabs.Screen name="index" options={{title:translateDisplay('Home',locale),tabBarAccessibilityLabel:'Home tab',tabBarIcon:({color})=><Icon name="home" color={color}/>}}/><Tabs.Screen name="review" options={{title:translateDisplay('Review',locale),tabBarAccessibilityLabel:'Review tab',tabBarIcon:({color})=><Icon name="document" color={color}/>}}/><Tabs.Screen name="settings" options={{title:translateDisplay('Settings',locale),tabBarAccessibilityLabel:'Settings tab',tabBarIcon:({color})=><Icon name="settings" color={color}/>}}/><Tabs.Screen name="countries" options={{href:null,tabBarStyle:{display:'none'}}}/></Tabs></>;}
export default function Layout(){return <AppearanceProvider><Navigation/></AppearanceProvider>;}

import type { Locale } from '../../src/shared/locales';

// Display preferences, not country-specific document adapters or eligibility rules.
export const COUNTRIES = [
  { id: 'US', name: 'United States', flag: '🇺🇸', locale: 'en', lat: 39, lon: -98 },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧', locale: 'en', lat: 54, lon: -2 },
  { id: 'ES', name: 'Spain', flag: '🇪🇸', locale: 'es', lat: 40, lon: -4 },
  { id: 'MX', name: 'Mexico', flag: '🇲🇽', locale: 'es', lat: 23, lon: -102 },
  { id: 'MU', name: 'Mauritius', flag: '🇲🇺', locale: 'fr', lat: -20.2, lon: 57.5 },
  { id: 'IN', name: 'India', flag: '🇮🇳', locale: 'hi', lat: 22, lon: 79 },
  { id: 'CN', name: 'China', flag: '🇨🇳', locale: 'zh-Hans', lat: 35, lon: 104 },
  { id: 'SG', name: 'Singapore', flag: '🇸🇬', locale: 'en', lat: 1.35, lon: 103.82 },
  { id: 'FR', name: 'France', flag: '🇫🇷', locale: 'fr', lat: 47, lon: 2 },
  { id: 'CA', name: 'Canada', flag: '🇨🇦', locale: 'en', lat: 57, lon: -106 },
] as const satisfies readonly { id: string; name: string; flag: string; locale: Locale; lat: number; lon: number }[];
export type Country = typeof COUNTRIES[number];
export type CountryId = Country['id'];

export function project(lat: number, lon: number, centerLat: number, centerLon: number, radius = 130) {
  const rad = Math.PI / 180, p = lat * rad, c = centerLat * rad, l = (lon - centerLon) * rad;
  return { x: radius * Math.cos(p) * Math.sin(l), y: -radius * (Math.cos(c) * Math.sin(p) - Math.sin(c) * Math.cos(p) * Math.cos(l)), visible: Math.sin(c) * Math.sin(p) + Math.cos(c) * Math.cos(p) * Math.cos(l) > 0.015 };
}

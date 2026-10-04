import {geoArea,geoGraticule,geoOrthographic,geoPath} from 'd3-geo';
import type {MultiPolygon} from 'geojson';
import land from '../assets/land.json';

// Convert planar GeoJSON winding to D3's small spherical polygon winding.
export const globeLand:MultiPolygon={type:'MultiPolygon',coordinates:land.map(ring=>{
  const coordinates=ring.map(point=>[point[0],point[1]]);
  if(geoArea({type:'Polygon',coordinates:[coordinates]})>2*Math.PI)coordinates.reverse();
  return [coordinates];
})};
const graticule=geoGraticule().step([30,30])();
export type GlobeCenter={lat:number;lon:number};
export function globePaths(center:GlobeCenter,size:number){
  const projection=geoOrthographic().rotate([-center.lon,-center.lat]).translate([size/2,size/2]).scale(size*.43).precision(.8);
  const path=geoPath(projection).digits(1);
  return {land:path(globeLand)??'',grid:path(graticule)??''};
}
export function dragCenter(start:GlobeCenter,dx:number,dy:number,size:number):GlobeCenter{
  const scale=140/size;
  return {lat:Math.max(-80,Math.min(80,start.lat+dy*scale)),lon:((start.lon-dx*scale+180)%360+360)%360-180};
}

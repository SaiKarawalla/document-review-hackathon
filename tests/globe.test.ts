import {describe,expect,it} from 'vitest';
import {geoArea,geoContains,geoOrthographic,geoPath} from 'd3-geo';
import {globeLand,globePaths,dragCenter} from '../mobile/lib/globe-geometry';
import {COUNTRIES,project} from '../mobile/lib/countries';

describe('spherical globe rendering',()=>{
  it('uses small land polygons and keeps the oceans outside land',()=>{
    for(const coordinates of globeLand.coordinates)expect(geoArea({type:'Polygon',coordinates})).toBeLessThan(2*Math.PI);
    expect(geoContains(globeLand,[-98,39])).toBe(true);
    expect(geoContains(globeLand,[79,22])).toBe(true);
    expect(geoContains(globeLand,[-140,0])).toBe(false);
  });
  it('clips correctly at the horizon through a complete rotation',()=>{
    for(let lon=-180;lon<180;lon+=15){const center={lon,lat:40},p=geoOrthographic().rotate([-lon,-40]).translate([140,140]).scale(120.4),bounds=geoPath(p).bounds(globeLand),paths=globePaths(center,280);
      expect(paths.land).not.toMatch(/NaN|Infinity/);expect(paths.grid).not.toMatch(/NaN|Infinity/);
      expect(bounds[0][0]).toBeGreaterThanOrEqual(19.59);expect(bounds[0][1]).toBeGreaterThanOrEqual(19.59);
      expect(bounds[1][0]).toBeLessThanOrEqual(260.41);expect(bounds[1][1]).toBeLessThanOrEqual(260.41);
    }
  });
  it('keeps tappable markers aligned with the spherical map',()=>{
    for(const center of COUNTRIES){const p=geoOrthographic().rotate([-center.lon,-center.lat]).translate([140,140]).scale(120.4);
      for(const point of COUNTRIES){const a=project(point.lat,point.lon,center.lat,center.lon,120.4),b=p([point.lon,point.lat])!;
        expect(a.x+140).toBeCloseTo(b[0],6);expect(a.y+140).toBeCloseTo(b[1],6);
      }
    }
  });
  it('wraps longitudes and bounds vertical drags without losing movement',()=>{
    expect(dragCenter({lat:0,lon:0},100,100,280)).toEqual({lat:50,lon:-50});
    expect(dragCenter({lat:0,lon:179},-20,1000,280)).toEqual({lat:80,lon:-171});
    expect(dragCenter({lat:0,lon:0},10000,-10000,280)).toEqual({lat:-80,lon:40});
  });
});

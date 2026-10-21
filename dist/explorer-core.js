'use strict';
(() => {
  const MAX_STOPS = 4;
  const COMPACT_WIDTH = 1023;
  const validPoint = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
  function distance(a, b) {
    const rad = Math.PI / 180, dlat = (b.lat-a.lat)*rad, dlon = (b.lon-a.lon)*rad;
    const x = Math.sin(dlat/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
    return 3958.8*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
  }
  function inside(p, b) {
    return !b || (p.lat >= b.south && p.lat <= b.north && (b.west <= b.east ? p.lon >= b.west && p.lon <= b.east : p.lon >= b.west || p.lon <= b.east));
  }
  function bounds(south,north,west,east) {
    const wrap = n => ((n+180)%360+360)%360-180;
    return {south,north,west:east-west>=360?-180:wrap(west),east:east-west>=360?180:wrap(east)};
  }
  function mapFrame(width,height,{compact=false,cover=0,detailWidth=0}={}) {
    const right=Math.min(24,width*.1);
    const left=Math.min(compact?20:detailWidth?detailWidth+40:24,Math.max(20,width-right-100));
    const top=Math.min(compact?112:80,height*.32);
    const bottom=Math.min(compact?Math.max(24,cover+16):48,Math.max(24,height-top-56));
    return {topLeft:[left,top],bottomRight:[right,bottom],center:[left+(width-left-right)/2,top+(height-top-bottom)/2]};
  }
  function tripIds(value, merchants) {
    const available = new Set(merchants.map(m=>m.id));
    return [...new Set(Array.isArray(value) ? value : [])].filter(id=>typeof id==='string' && available.has(id)).slice(0,MAX_STOPS);
  }
  function parseTrip(hash, merchants) {
    if (!hash.startsWith('#trip=')) return [];
    try { return tripIds(decodeURIComponent(hash.slice(6)).split(','),merchants); } catch { return []; }
  }
  function shareTrip(ids, merchants, base) {
    const url = new URL(base); url.search=''; url.hash='trip='+tripIds(ids,merchants).join(',');
    return url.href;
  }
  function mapsUrl(stops, origin) {
    if (!stops.length || stops.length > MAX_STOPS || !stops.every(validPoint) || (origin && !validPoint(origin))) throw Error('Choose up to four valid stops.');
    const make = coordinates => {
      const point = p => coordinates || !p.address ? `${p.lat},${p.lon}` : p.address;
      const url = new URL('https://www.google.com/maps/dir/');
      url.search = new URLSearchParams({api:'1',travelmode:'driving',destination:point(stops.at(-1))});
      if (origin) url.searchParams.set('origin',point(origin));
      else if (stops.length>1) url.searchParams.set('origin',point(stops[0]));
      const middle = origin ? stops.slice(0,-1) : stops.slice(1,-1);
      if (middle.length) url.searchParams.set('waypoints',middle.map(point).join('|'));
      return url.href;
    };
    const url = make(false);
    return url.length <= 2048 ? url : make(true);
  }
  function areas(merchants, query) {
    const q = String(query).trim().toLowerCase();
    if (q.length<2) return [];
    const zip = /^\d{5}$/.test(q), groups = new Map();
    for (const m of merchants) {
      const code = (m.address || '').match(/\b[A-Z]{2}\s+(\d{5})(?:-\d{4})?(?:,?\s+(?:USA|United States))?\s*$/i)?.[1];
      const label = `${m.city}, ${m.state}${zip ? ' '+code : ''}`;
      if (zip ? code!==q : !label.toLowerCase().includes(q)) continue;
      const group = groups.get(label) || {label,lat:0,lon:0,count:0};
      group.lat+=m.lat; group.lon+=m.lon; group.count++; groups.set(label,group);
    }
    return [...groups.values()].map(g=>({...g,lat:g.lat/g.count,lon:g.lon/g.count,type:'area'})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).slice(0,8);
  }
  globalThis.BitcoinExplorer = Object.freeze({MAX_STOPS,COMPACT_WIDTH,mapFrame,validPoint,distance,inside,bounds,tripIds,parseTrip,shareTrip,mapsUrl,areas});
})();

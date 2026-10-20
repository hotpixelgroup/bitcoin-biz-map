"""Regenerate the lightweight shared state sanity-check helper from Census polygons. Run from the repository root."""
import json
from pathlib import Path
geo=json.loads(Path('scripts/data/us-states.geojson').read_text())
states={}
for f in geo['features']:
 boxes=[]
 for p in f['geometry']['coordinates']:
  r=p[0]; boxes.append([round(min(c[0] for c in r)-.035,4),round(min(c[1] for c in r)-.035,4),round(max(c[0] for c in r)+.035,4),round(max(c[1] for c in r)+.035,4)])
 states[f['properties']['code']]={'name':f['properties']['name'],'boxes':boxes}
text="""'use strict';
// Public-domain US Census 2025 state boundaries, simplified to padded component
// bounds for coordinate sanity checks. Maintainers still review the exact pin.
(() => {
  const states = STATES;
  const validId = id => /^(?:az-\\d{3,8}|us-(?:btc\\d+|research-[a-f0-9]{12}|[a-z]{2}-\\d{7,10}))$/.test(id || '');
  const coordinates = (lat, lon, state) => Number.isFinite(lat) && Number.isFinite(lon) && (state ? [states[state]].filter(Boolean) : Object.values(states)).some(s => s.boxes.some(b => lon >= b[0] && lat >= b[1] && lon <= b[2] && lat <= b[3]));
  const stateFromAddress = address => String(address || '').match(/\\b([A-Z]{2})\\s+\\d{5}(?:-\\d{4})?\\b/)?.[1] || '';
  globalThis.BitcoinGeo = Object.freeze({ states, validId, coordinates, stateFromAddress });
})();
""".replace('STATES',json.dumps(dict(sorted(states.items())),separators=(',',':')))
Path('dist/geography.js').write_text(text)

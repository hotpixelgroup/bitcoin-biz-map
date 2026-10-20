"""Check the source directory's completeness and geographic integrity."""
import json
from pathlib import Path
rows=json.loads(Path('dist/merchants.json').read_text())['merchants']
assert len(rows)==219, 'Article contains 219 merchants'
assert len({r['id'] for r in rows})==219, 'IDs must be unique'
assert len({(r['name'],r['address']) for r in rows})==219, 'Duplicate merchant entries'
for r in rows:
 assert 31<r['lat']<37.1 and -115<r['lon']<-109, f"Invalid Arizona coordinates: {r['name']}"
 assert r['category'] and r['city'], f"Missing filter metadata: {r['name']}"
 assert r['osmId'] or r.get('coordinateSource'), f"Missing coordinate source: {r['name']}"
assert sum(r['name']=='Pita Cafe' for r in rows)==1
assert sum(r['name']=='Echo Coffee' for r in rows)==1
print('Validated all 219 merchants: unique listings, Arizona coordinates, categories, cities, and coordinate sources.')

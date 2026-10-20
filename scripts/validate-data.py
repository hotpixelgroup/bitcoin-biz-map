"""Check the source directory's completeness and geographic integrity."""
import json
import importlib.util
import re
from pathlib import Path
spec=importlib.util.spec_from_file_location('national', 'scripts/national-directory.py')
national=importlib.util.module_from_spec(spec)
spec.loader.exec_module(national)
rows=json.loads(Path('dist/merchants.json').read_text())['merchants']
assert rows, 'The directory must not be empty'
assert len({r['id'] for r in rows})==len(rows), 'IDs must be unique'
assert len({(r['name'],r['address']) for r in rows})==len(rows), 'Duplicate merchant entries'
for r in rows:
 assert r.get('state') in national.STATES, f"Missing US state: {r['name']}"
 assert national.locate(r['lat'],r['lon'])==r['state'], f"Invalid state coordinates: {r['name']}"
 assert re.fullmatch(r'(?:az-\d{3,8}|us-(?:btc\d+|research-[a-f0-9]{12}|[a-z]{2}-\d{7,10}))',r['id']), 'Invalid listing ID'
 assert r.get('verification',{}).get('type') in ('merchant-confirmed','community-dated','article-listed','maintainer-reviewed'), 'Missing provenance'
 assert isinstance(r['lightning'],bool) and isinstance(r['onchain'],bool), f"Invalid payment flags: {r['name']}"
 assert r['category'] and r['city'], f"Missing filter metadata: {r['name']}"
 assert r['osmId'] or r.get('coordinateSource'), f"Missing coordinate source: {r['name']}"
print(f'Validated all {len(rows)} merchants: unique listings, US state coordinates, categories, cities, and coordinate sources.')

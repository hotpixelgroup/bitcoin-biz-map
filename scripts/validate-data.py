"""Check the source directory's completeness and geographic integrity."""
import json
from datetime import date
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
 assert isinstance(r.get('paymentNotes',''),str) and len(r.get('paymentNotes',''))<=500, 'Invalid payment conditions'
 for key in ('lastPayment','latestPaymentReport'):
  if key not in r: continue
  report=r[key]
  assert report['outcome'] in (('paid',) if key=='lastPayment' else ('paid','failed')), 'Invalid payment outcome'
  assert report['rail'] in ('lightning','onchain','unknown'), 'Invalid payment rail'
  assert '2009-01-03'<=report['date']<=date.today().isoformat() and date.fromisoformat(report['date']).isoformat()==report['date'], 'Invalid payment date'
  assert re.fullmatch(r'https://github.com/hotpixelgroup/bitcoin-biz-map/issues/[1-9]\d*',report['reviewIssue']), 'Missing payment review provenance'
 assert r['category'] and r['city'], f"Missing filter metadata: {r['name']}"
 assert r['osmId'] or r.get('coordinateSource'), f"Missing coordinate source: {r['name']}"
print(f'Validated all {len(rows)} merchants: unique listings, US state coordinates, categories, cities, and coordinate sources.')

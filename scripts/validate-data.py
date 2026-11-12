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

catalog=json.loads(Path('dist/merchants.json').read_text())
assert catalog.get('schemaVersion',1) in (1,2), 'Unsupported catalog version'
review_url=r'https://github.com/hotpixelgroup/bitcoin-biz-map/issues/[1-9]\d*'
active={r['id'] for r in rows}
removed=catalog.get('removals',[])
assert len({r['id'] for r in removed})==len(removed), 'Duplicate removal decisions'
for removal in removed:
 assert removal['id'] not in active, 'Removed ID cannot remain active'
 assert removal['id'] in removal['aliases'], 'Removal must retain its stable ID'
 assert re.fullmatch(review_url,removal['reviewIssue']), 'Removal requires reviewed provenance'
 assert removal.get('reason') and removal.get('merchant',{}).get('name'), 'Removal must explain the branch and reason'
for r in rows:
 for field,override in r.get('reviewedOverrides',{}).items():
  assert field in ('name','address','city','state','category','lat','lon','website','phone','lightning','onchain','osmId','coordinateSource','verified','paymentNotes'), 'Unsupported reviewed override'
  assert override['value']==r[field], 'Reviewed override must agree with published field'
  assert re.fullmatch(review_url,override['reviewIssue']), 'Override requires review provenance'
 for observation in r.get('sourceObservations',[]):
  assert observation['datePrecision'] in ('day','month','year','unknown'), 'Invalid source date precision'
  assert observation.get('sourceUrl','').startswith(('https://','http://')), 'Source observation requires a public source'
 for event in r.get('evidenceEvents',[]):
  assert event['kind']=='visitor-payment' and event['outcome'] in ('paid','failed'), 'Invalid evidence event'
  assert event['rail'] in ('lightning','onchain','unknown') and event['datePrecision']=='day', 'Invalid event precision or rail'
  assert date.fromisoformat(event['observedAt']).isoformat()==event['date'] and event['date']<=date.today().isoformat(), 'Invalid event date'
  assert re.fullmatch(review_url,event['reviewIssue']), 'Event requires review provenance'
print('Catalog v2 override, removal and evidence-event contracts passed.')

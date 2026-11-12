import datetime
import importlib.util
spec=importlib.util.spec_from_file_location('national','scripts/national-directory.py')
national=importlib.util.module_from_spec(spec)
spec.loader.exec_module(national)
m={'name':'Fixture Cafe','osm:currency:XBT':'yes','verified_at':'2026-10-20','osm:addr:city':'Phoenix','osm:addr:street':'Fixture St','osm:addr:housenumber':'1'}
today=datetime.date(2026,10,20)
assert not national.reason(m,today)
for changes in ({'verified_at':'2027-01-01'},{'verified_at':'2023-01-01'},{'verified_at':''},{'osm:amenity':'atm'},{'osm:currency:XBT':'no'},{'osm:addr:street':''}):
 assert national.reason(m|changes,today),changes
assert national.locate(21.31,-157.86)=='HI'
assert national.locate(61.22,-149.9)=='AK'
assert national.locate(51.5,-.1) is None
print('National import policy checks passed: recency, future dates, acceptance, ATMs, address completeness, Alaska and Hawaii.')

# Identical public addresses must merge despite approximate locator pins.
a={'name':"Steak 'n Shake",'state':'IA','city':'Davenport','address':'5229 Elmore Avenue, Davenport, IA 52807','lat':41.573891,'lon':-90.525978}
b={'name':"Steak 'n Shake",'state':'IA','city':'Davenport','address':'5229 Elmore Avenue, Davenport, IA 52807','lat':41.57338365,'lon':-90.52798615}
assert national.same_place(a,b)
assert not national.same_place(a,b|{'address':'5239 Elmore Avenue','lat':42,'lon':-92})

# Imports cannot undo reviewed decisions, including old removal-ledger entries.
import contextlib, io, json, tempfile
from pathlib import Path
original_root = national.ROOT
with tempfile.TemporaryDirectory() as directory:
 root = Path(directory)
 (root/'dist').mkdir(); (root/'research').mkdir()
 national.ROOT = root
 upstream = m | {'id':999, 'osm_id':'node:999', 'lat':33.5, 'lon':-112.1, 'address':'1 Fixture St, Phoenix, AZ 85001', 'osm:addr:state':'AZ'}
 snapshot=root/'upstream.json'; snapshot.write_text(json.dumps([upstream]))
 base={'source':'https://example.org/article','merchants':[],'appliedReviews':[{'action':'remove','listingId':'us-btc999'}]}
 (root/'dist/merchants.json').write_text(json.dumps(base))
 with contextlib.redirect_stdout(io.StringIO()): result=national.build(snapshot,today=today,dry_run=True)
 assert not result['merchants'], 'Legacy removal must suppress source ID'
 original={'id':'us-btc999','name':'Fixture Cafe','address':'1 Fixture St, Phoenix, AZ 85001','city':'Phoenix','state':'AZ','lat':33.5,'lon':-112.1,'website':'https://example.org','osmId':'node:999','phone':'reviewed','reviewIssue':'https://github.com/hotpixelgroup/bitcoin-biz-map/issues/99','verification':{'type':'maintainer-reviewed','sourceUrl':'https://example.org/review','checkedAt':'2026-10-01'},'reviewedOverrides':{'phone':{'value':'reviewed'}}}
 (root/'dist/merchants.json').write_text(json.dumps(base | {'merchants':[original],'appliedReviews':[]}))
 research=original | {'confidence':'merchant-confirmed','checkedAt':'2026-10-20','evidenceUrl':'https://example.org/payment','evidenceSummary':'Merchant policy','evidenceDate':'2026-10-01'}
 (root/'research/test-primary.json').write_text(json.dumps([research]))
 with contextlib.redirect_stdout(io.StringIO()): result=national.build(snapshot,today=today,dry_run=True)
 assert result['merchants'][0]['verification']==original['verification'], 'Do not replace reviewed provenance'
 assert result['merchants'][0]['phone']=='reviewed'
 assert result['merchants'][0]['sourceObservations'][0]['datePrecision']=='unknown'
 original['verification']['date']='2026-09'
 original['sourceObservations']=[{'type':'article-listed','date':'2020','datePrecision':'year','sourceUrl':'https://example.org/history'}]
 (root/'dist/merchants.json').write_text(json.dumps(base | {'merchants':[original],'appliedReviews':[]}))
 with contextlib.redirect_stdout(io.StringIO()): result=national.build(snapshot,today=today,dry_run=True)
 assert [e['datePrecision'] for e in result['merchants'][0]['sourceObservations']]==['year','month'], 'Source history retains partial dates'
 removed=base | {'removals':[{'id':'us-btc999','aliases':['us-btc999','node:999'],'merchant':original}]}
 (root/'dist/merchants.json').write_text(json.dumps(removed))
 with contextlib.redirect_stdout(io.StringIO()): result=national.build(snapshot,today=today,dry_run=True)
 assert not result['merchants'], 'Research aliases must not resurrect removed branch'
 assert json.loads((root/'dist/merchants.json').read_text())==removed, 'Dry-run must not write'
 national.ROOT=original_root
print('Reviewed removal, alias, provenance, override and dry-run regression checks passed.')

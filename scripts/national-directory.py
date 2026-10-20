"""Build a reviewable US snapshot. Never infer Bitcoin acceptance from Square alone.

Usage: python3 scripts/national-directory.py BTCMAP_V4_JSON [--geocode]
Raw upstream snapshot stays outside the repository; its digest is in the audit.
Existing IDs, maintainer edits and applied-review ledger are preserved.
"""
import argparse
import collections
import datetime
import hashlib
import gzip
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEO = json.loads((ROOT / 'scripts/data/us-states.geojson').read_text())
STATES = {f['properties']['code']: f['properties']['name'] for f in GEO['features']}
SHAPES = []
for feature in GEO['features']:
    for polygon in feature['geometry']['coordinates']:
        ring = polygon[0]
        SHAPES.append((feature['properties']['code'], [min(p[0] for p in ring), min(p[1] for p in ring), max(p[0] for p in ring), max(p[1] for p in ring)], polygon))

def in_ring(x, y, ring):
    inside = False
    for a, b in zip(ring, ring[1:] + ring[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0]-a[0]) * (y-a[1]) / (b[1]-a[1]) + a[0]:
            inside = not inside
    return inside

def locate(lat, lon):
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return None
    for code, box, polygon in SHAPES:
        if box[0] <= lon <= box[2] and box[1] <= lat <= box[3] and in_ring(lon, lat, polygon[0]) and not any(in_ring(lon, lat, r) for r in polygon[1:]):
            return code
    return None

def norm(value):
    return re.sub(r'[^a-z0-9]', '', (value or '').lower())

def url(value):
    try:
        parsed = urllib.parse.urlsplit(value or '')
        return value if parsed.scheme in ('http', 'https') and parsed.netloc and not parsed.username else ''
    except ValueError:
        return ''

def category(m):
    kind = m.get('osm:amenity') or m.get('osm:shop') or m.get('icon', '')
    if kind in ('cafe', 'local_cafe', 'coffee', 'tea'): return 'Coffee Shops & Cafés'
    if kind in ('restaurant', 'fast_food', 'pub', 'bar', 'ice_cream', 'bakery', 'convenience', 'supermarket', 'farm', 'deli', 'butcher', 'food_court', 'lunch_dining', 'restaurant_menu'): return 'Restaurants, Markets & Bars'
    if kind in ('hotel', 'motel', 'guest_house', 'camp_site', 'hostel'): return 'Hotels & Stays'
    if kind in ('dentist', 'doctors', 'clinic', 'medical_services', 'pharmacy'): return 'Health & Dental'
    if m.get('osm:shop'): return 'Shopping & Services'
    return 'Local Services & Experiences'

def reason(m, today):
    claimed = str(m.get('osm:addr:state','')).upper()
    if claimed in STATES and m.get('state') and claimed != m['state']: return 'Address state conflicts with the coordinate state'
    if not m.get('name') or m['name'].lower() == 'unnamed': return 'Unnamed place'
    if m.get('osm:amenity') in ('atm', 'payment_terminal', 'bank', 'bureau_de_change', 'place_of_worship', 'vending_machine') or m.get('icon') in ('local_atm', 'currency_exchange') or re.search(r'\b(bitcoin atm|bitcoin depot|coinflip atm|coinhub atm|coinme atm)\b', m['name'], re.I): return 'ATM, exchange, vending, or non-merchant location'
    if m.get('osm:currency:XBT') != 'yes': return 'No explicit Bitcoin acceptance tag'
    verified = m.get('verified_at', '')
    try: date = datetime.date.fromisoformat(verified)
    except ValueError: return 'No valid dated community verification'
    if date > today: return 'Verification date is in the future'
    if (today - date).days > 365: return 'Community verification is over 12 months old'
    if not m.get('osm:addr:city') or not m.get('osm:addr:street') or not m.get('osm:addr:housenumber'): return 'Incomplete street address or city'
    return ''

def same_place(primary, row):
    if primary['state'] != row['state']: return False
    a, b = norm(primary['name'].split('—')[0]), norm(row['name'])
    host = urllib.parse.urlsplit(primary.get('website') or '').hostname
    website_match = bool(host) and host not in ('facebook.com','www.facebook.com','instagram.com','www.instagram.com','x.com') and host == urllib.parse.urlsplit(row.get('website', '')).hostname
    names = a == b or (min(len(a), len(b)) > 8 and (a in b or b in a)) or website_match
    if not names: return False
    if primary.get('lat') is not None and row.get('lat') is not None and abs(primary['lat']-row['lat']) < .002 and abs(primary['lon']-row['lon']) < .002:
        return True
    street = re.match(r'\d+', primary.get('address') or '')
    def canonical(value):
        value = re.split(r'[#]|\bsuite\b|\bunit\b', (value or '').split(',')[0], flags=re.I)[0].lower()
        words = {'n':'north','s':'south','e':'east','w':'west','rd':'road','st':'street','ave':'avenue','blvd':'boulevard','dr':'drive','hwy':'highway','ln':'lane','pkwy':'parkway','sw':'southwest','nw':'northwest','ne':'northeast','se':'southeast'}
        return norm(' '.join(words.get(w,w) for w in re.findall(r'[a-z0-9]+',value)))
    a,b = canonical(primary.get('address')),canonical(row.get('address'))
    return norm(primary.get('city')) == norm(row.get('city')) and bool(street and row.get('address', '').startswith(street[0])) and (a.startswith(b) or b.startswith(a))

def build(snapshot, geocode=False, today=None):
    today = today or datetime.date.today()
    stamp = today.isoformat()
    raw = Path(snapshot).read_bytes()
    if str(snapshot).endswith('.gz'): raw = gzip.decompress(raw)
    upstream = json.loads(raw)
    catalog = json.loads((ROOT / 'dist/merchants.json').read_text())
    # Source snapshot on initial expansion; subsequent imports preserve the current catalog.
    existing = [m for m in catalog['merchants'] if m['id'].startswith('az-') or m.get('reviewIssue')]
    research = [r for p in sorted((ROOT / 'research').glob('*-primary.json')) for r in json.loads(p.read_text())]
    conflicts = json.loads((ROOT/'research/chain-conflicts.json').read_text()) if (ROOT/'research/chain-conflicts.json').exists() else []
    overrides = [r for r in conflicts if r.get('confidence') == 'excluded']
    exclusions = [r for r in research if r.get('confidence') == 'excluded' and not r.get('reason','').startswith('Duplicate of')]
    cache_path = ROOT / 'research/geocoded-addresses.json'
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    candidates, rejected, us = [], collections.Counter(), []
    for m in upstream:
        code = locate(m.get('lat'), m.get('lon'))
        if code:
            m['state'] = code
            us.append(m)
    rows = []
    for m in existing:
        m.setdefault('state', 'AZ')
        m.setdefault('verification', {'type': 'article-listed', 'sourceUrl': catalog['source'], 'checkedAt': '2026-10-20', 'summary': 'Original Arizona article listing. A recent merchant payment has not been independently tested.'})
        if m['verification']['type'] == 'article-listed': m['verification'].setdefault('date','2026-10-19')
        rows.append(m)
    seen = {(norm(m['name']), norm(m['address'])) for m in rows}
    by_osm = {m.get('osmId'): m for m in rows if m.get('osmId')}
    for m in us:
        blocked = next((r for r in overrides if r.get('osmId') == m.get('osm_id')), None) or next((r for r in exclusions if same_place(r, {'name':m['name'], 'state':m['state'], 'address':m.get('address',''), 'city':m.get('osm:addr:city',''), 'website':m.get('website',''), 'lat':m['lat'],'lon':m['lon']}) or (not r.get('address') and r['state'] == m['state'] and norm(r['name']) == norm(m['name']))), None)
        why = blocked.get('reason', blocked['evidenceSummary']) if blocked else reason(m, today)
        source = f"https://btcmap.org/merchant/{m.get('osm_id') or m['id']}"
        street = ' '.join(filter(None, [m.get('osm:addr:housenumber'), m.get('osm:addr:street')]))
        city = m.get('osm:addr:city', '')
        address = ', '.join(filter(None, [street, city, m['state'] + ' ' + m.get('osm:addr:postcode','')]))
        if why:
            rejected[why] += 1
            if why not in ('Unnamed place', 'ATM, exchange, vending, or non-merchant location'):
                candidates.append({'name':m['name'], 'state':m['state'], 'city':city, 'address':address or m.get('address',''), 'website':url(m.get('website')), 'sourceUrl':source, 'verified':m.get('verified_at',''), 'reason':why, 'status':'excluded' if blocked else 'needs-review'})
            continue
        verification = {'type':'community-dated', 'date':m['verified_at'], 'checkedAt':stamp, 'sourceUrl':source, 'summary':'BTC Map / OpenStreetMap reports Bitcoin acceptance. Community dated, not a merchant checkout test.'}
        if m.get('osm_id') in by_osm:
            current = by_osm[m['osm_id']]
            # Never overwrite reviewed contact details or the acceptance provenance of a primary source.
            if current['verification']['type'] == 'article-listed': current['verification'] = verification
            continue
        row = {'id':f"us-btc{m['id']}", 'name':m['name'], 'address':address, 'city':city, 'state':m['state'], 'category':category(m), 'lat':round(m['lat'],7), 'lon':round(m['lon'],7), 'osmId':m.get('osm_id',''), 'website':url(m.get('website')), 'phone':m.get('phone',''), 'lightning':m.get('osm:payment:lightning') == 'yes', 'onchain':m.get('osm:payment:onchain') == 'yes', 'verified':m['verified_at'], 'verification':verification}
        if not row['osmId']: row['coordinateSource'] = source
        key = (norm(row['name']), norm(row['address']))
        if key not in seen:
            rows.append(row)
            seen.add(key)
    for r in research:
        override = next((item for item in overrides if item.get('sourceId') and item['sourceId'] == r.get('sourceId')), None)
        if override:
            candidates.append({**r, 'status':'excluded', 'sourceUrl':override['evidenceUrl'], 'reason':override['reason']})
            continue
        if r.get('confidence') == 'merchant-confirmed' and (datetime.date.fromisoformat(r['checkedAt']) < today-datetime.timedelta(days=365) or r['name'] in ('Golden Gate Hotel & Casino','The D Las Vegas','DryLand Salon') or (r.get('evidenceDate') and r['evidenceDate'] < (today-datetime.timedelta(days=365)).isoformat() and any(token in r['evidenceUrl'] for token in ('/blog','/news','case-studies')))):
            candidates.append({**r,'status':'needs-review','sourceUrl':r['evidenceUrl'],'reason':'Historical announcement needs fresher acceptance evidence. A still-live old page is not a new checkout confirmation.'})
            continue
        if r.get('confidence') != 'merchant-confirmed':
            candidates.append({**r, 'status':r.get('confidence','needs-review'), 'sourceUrl':r['evidenceUrl'], 'reason':r.get('reason') or r['evidenceSummary']})
            continue
        match = next((m for m in rows if same_place(r, m)), None)
        if not match:
            # A directory coordinate can corroborate the location while the merchant page supplies acceptance.
            raw_match = next((m for m in us if same_place(r, {'name':m['name'], 'address':m.get('address',''), 'city':m.get('osm:addr:city',''), 'state':m['state'], 'website':m.get('website',''),'lat':m['lat'],'lon':m['lon']})), None)
            coords = cache.get(r['address'])
            if r.get('lat') is not None and r.get('lon') is not None:
                coords = {'lat':r['lat'], 'lon':r['lon'], 'source':r.get('coordinateSource') or r.get('addressSource') or r['evidenceUrl']}
            elif raw_match:
                coords = {'lat':raw_match['lat'], 'lon':raw_match['lon'], 'source':f"https://www.openstreetmap.org/{raw_match['osm_id'].replace(':','/')}"}
            if not coords and geocode:
                query = urllib.parse.urlencode({'address':r['address'], 'benchmark':'Public_AR_Current', 'format':'json'})
                try:
                    with urllib.request.urlopen('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?' + query, timeout=20) as response: result = json.load(response)
                    hits = result.get('result',{}).get('addressMatches',[])
                    if len(hits) == 1 and hits[0]['addressComponents']['state'] == r['state']:
                        coords = {'lat':hits[0]['coordinates']['y'], 'lon':hits[0]['coordinates']['x'], 'source':'US Census Geocoder / Public_AR_Current (address-range estimate)', 'matchedAddress':hits[0]['matchedAddress']}
                        cache[r['address']] = coords
                except Exception as error: print(f"Geocode unavailable for {r['name']}: {type(error).__name__}")
            if not coords or locate(coords['lat'], coords['lon']) != r['state']:
                candidates.append({**r,'status':'needs-review','sourceUrl':r['evidenceUrl'],'reason':'Merchant acceptance source found; physical pin still needs confirmation.'})
                continue
            match = {'id':'us-research-' + hashlib.sha256((r['name']+'|'+r['address']).encode()).hexdigest()[:12], 'name':r['name'], 'address':r['address'], 'city':r['city'], 'state':r['state'], 'category':'Health & Dental' if re.search('dent|orthodont',r['name'],re.I) else 'Restaurants & Quick Bites' if r.get('chainLocationId') else 'Coffee Shops & Cafés' if re.search('coffee|brewing|deli',r['name'],re.I) else 'Local Services & Experiences', 'lat':round(coords['lat'],7), 'lon':round(coords['lon'],7), 'coordinateSource':coords['source'], 'osmId':raw_match.get('osm_id','') if raw_match else '', 'website':url(r.get('website')), 'phone':'', 'lightning':r.get('lightning') is True, 'onchain':r.get('onchain') is True, 'verified':''}
            rows.append(match)
        if r.get('chainLocationId') and not match.get('reviewIssue'):
            match.update(name=r['name'],address=r['address'],city=r['city'],website=r['website'],category='Restaurants & Quick Bites',lightning=True,onchain=False)
            # Retain a matched OSM building pin when an official locator's pin
            # differs substantially. Acceptance is corroborated by the address.
            if not match.get('osmId'):
                match.update(lat=round(r['lat'],7),lon=round(r['lon'],7),coordinateSource=r['coordinateSource'])
        summary = r['evidenceSummary'] if not r.get('chainLocationId') else 'Current official branch plus nationwide Lightning policy. In-store or drive-through; branch checkout not tested. Venue access rules may apply.'
        if r['name'].startswith('Palm Valley'): summary = 'Practice-wide Bitcoin policy for dental and orthodontic services. Current office address checked; branch checkout and payment rail untested.'
        match['verification'] = {'type':'merchant-confirmed', 'checkedAt':r['checkedAt'], 'sourceUrl':r.get('paymentEvidenceUrls',[r['evidenceUrl']])[0], 'summary':summary, 'date':r.get('evidenceDate') or ''}
    # Keep a stable sort and all historic IDs/reviews. The UI and CSV derive counts live.
    rows.sort(key=lambda m:(m['state'], m['name'].casefold(), m['address']))
    catalog['merchants'] = rows
    catalog['nationalResearch'] = {'checkedAt':stamp,'upstream':'https://api.btcmap.org/v4/places','sha256':hashlib.sha256(raw).hexdigest(),'communityRecencyDays':365,'scope':'50 states and Washington, DC. Sourced directory, not an exhaustive census of businesses.'}
    (ROOT/'dist/merchants.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'dist/research-candidates.json').write_text(json.dumps({'checkedAt':stamp,'description':'Unverified, stale, incomplete or excluded leads. These are not new verified map listings.','candidates':candidates},ensure_ascii=False,indent=2)+'\n')
    audit = {'checkedAt':stamp,'upstreamSha256':hashlib.sha256(raw).hexdigest(),'globalPlaces':len(upstream),'withinUSBoundaries':len(us),'mapped':len(rows),'verificationCounts':dict(collections.Counter(m['verification']['type'] for m in rows)),'withheldReasons':dict(rejected),'researchRecords':len(research),'stateCounts':{s:sum(m['state']==s for m in rows) for s in sorted(STATES)},'originalIDsPreserved':all(any(m['id']==r['id'] for m in rows) for r in existing)}
    (ROOT/'research/national-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
    print(json.dumps(audit,indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot')
    parser.add_argument('--geocode',action='store_true')
    parser.add_argument('--as-of',type=datetime.date.fromisoformat,help='Use the original snapshot date for reproducible research builds')
    args = parser.parse_args()
    build(args.snapshot,args.geocode,args.as_of)

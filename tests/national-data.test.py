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

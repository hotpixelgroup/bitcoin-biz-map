"""Import the article's factual directory and match it to BTC Map/OSM coordinates.
Usage: python3 scripts/import-merchants.py ARTICLE_HTML BTCMAP_ELEMENTS_JSON
"""
from html.parser import HTMLParser
import json,re,sys,unicodedata,difflib
from pathlib import Path
class Directory(HTMLParser):
 def __init__(self):super().__init__();self.tag=None;self.buf='';self.category=None;self.rows=[]
 def handle_starttag(self,t,a):
  if t in ['h2','li']:self.tag=t;self.buf=''
 def handle_data(self,d):
  if self.tag:self.buf+=d
 def handle_endtag(self,t):
  if t!=self.tag:return
  s=self.buf.strip()
  if t=='h2':self.category=s if any(x in s for x in ['☕','🍽','🍦','🍺','🛒','💈','💅','🩺','🥊','🛍','🚗','💻','🔧','💼','🐾','🎭']) else None
  if t=='li' and self.category and s not in ['Tags','Adoption','arizona','bitcoin purchase']:self.rows.append((self.category,s))
  self.tag=None
p=Directory();p.feed(Path(sys.argv[1]).read_text())
def norm(v):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',v.lower()).encode('ascii','ignore').decode())
allrows=json.load(open(sys.argv[2]));az=[]
for e in allrows:
 o=e['osm_json'];lat=o.get('lat',o.get('center',{}).get('lat'));lon=o.get('lon',o.get('center',{}).get('lon'))
 if lat is None and o.get('geometry'):
  lat=sum(x['lat'] for x in o['geometry'])/len(o['geometry']);lon=sum(x['lon'] for x in o['geometry'])/len(o['geometry'])
 if lat and 31<lat<37.1 and -115<lon<-109 and not e.get('deleted_at'):
  az.append((e,lat,lon))
rows=[];unmatched=[]
overrides=json.loads(Path(__file__).with_name('coordinate-overrides.json').read_text())
for i,(cat,s) in enumerate(p.rows):
 parts=s.split('—',1);name=parts[0].strip();addr=parts[1].strip() if len(parts)>1 else ''
 city=addr.split(',')[-2].strip() if addr.count(',')>=2 else ''
 candidates=[]
 for e,lat,lon in az:
  t=e['osm_json'].get('tags',{});n=t.get('name','');score=difflib.SequenceMatcher(None,norm(name),norm(n)).ratio()
  hn=t.get('addr:housenumber','');target=re.match(r'\d+',addr)
  if target and hn==target[0]:score+=.35
  if norm(t.get('addr:city',''))==norm(city) and city:score+=.12
  candidates.append((score,e,lat,lon))
 score,e,lat,lon=max(candidates,key=lambda x:x[0]);t=e['osm_json'].get('tags',{})
 match=score>=.92
 if not match:unmatched.append({'name':name,'address':addr,'best':t.get('name'),'score':round(score,2)})
 rows.append({'id':f'az-{i+1:03d}','name':name,'address':addr,'city':city,'category':cat[2:].strip() if cat[1:2]=='️' else re.sub(r'^[^A-Za-z]+','',cat),'lat':lat if match else None,'lon':lon if match else None,'osmId':e['id'] if match else None,'website':t.get('website',t.get('contact:website','')) if match else '', 'phone':t.get('phone',t.get('contact:phone','')) if match else '', 'lightning':t.get('payment:lightning')=='yes' if match else False,'onchain':t.get('payment:onchain')=='yes' if match else False,'verified':t.get('check_date:currency:XBT',t.get('survey:date','')) if match else ''})
for row in rows:
 if row['name'] in overrides:row.update(overrides[row['name']])
 if row['name']=='Jay Lewis Architectural Design':row['city']='Goodyear'
 if row['name']=='Gover Property Management':row['city']='Tucson'
Path('dist/merchants.json').write_text(json.dumps({'source':'https://bitcoinmagazine.com/culture/pita-cafe-arizona-bitcoin','imported':'2026-10-20','merchants':rows},ensure_ascii=False,indent=2))
print('Article rows:',len(rows),'BTC Map AZ:',len(az),'Matched:',len(rows)-len(unmatched));print(json.dumps(unmatched,indent=2))

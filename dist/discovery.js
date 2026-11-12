'use strict';
(() => {
  const defaults = Object.freeze({query:'',region:'',city:'',category:'all',verification:'',payment:'',sort:'name',radius:null,area:null,savedOnly:false,selected:null});
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const categories={coffee:'coffee cafe cafes tea',food:'food restaurant restaurants dining lunch dinner breakfast bakery bar grocery groceries market markets',shops:'shop shops shopping retail',stays:'hotel hotels motel stays lodging',health:'health dentist dental clinic',services:'services experiences repair professional'};
  function group(m) {
    if(/Coffee|Cafés/.test(m.category))return 'coffee';
    if(/Restaurants|Bakeries|Bars|Groceries|Markets/.test(m.category))return 'food';
    if(/Hotels|Stays/.test(m.category))return 'stays';
    if(/Health|Dental/.test(m.category))return 'health';
    if(/Shopping|Pets|Tech/.test(m.category))return 'shops';
    return 'services';
  }
  const cache=new WeakMap();
  function matches(m,query){
    const tokens=normalize(query).split(' ').filter(t=>t&&!['in','near','the','and'].includes(t));
    let text=cache.get(m);
    if(!text){text=normalize([m.name,m.address,m.city,m.state,globalThis.BitcoinGeo?.states[m.state]?.name,m.category,categories[group(m)]].join(' '));cache.set(m,text);}
    return tokens.every(token=>text.split(' ').some(word=>word===token || word.startsWith(token)));
  }
  const cityKey=m=>`${m.city}|${m.state}`;
  function query(rows,state,saved=new Set()){
    const f=state.savedOnly?{...defaults,sort:state.sort}:state;
    return rows.filter(m=>(!state.savedOnly||saved.has(m.id))&&(f.category==='all'||group(m)===f.category||m.category===f.category)&&(!f.region||m.state===f.region)&&(!f.city||cityKey(m)===f.city)&&(!f.verification||m.verification?.type===f.verification)&&(!f.payment||m[f.payment]===true)&&BitcoinExplorer.inside(m,f.area)&&(!f.radius||!state.user||BitcoinExplorer.distance(state.user,m)<=f.radius)&&matches(m,f.query)).sort((a,b)=>f.sort==='distance'&&state.user?BitcoinExplorer.distance(state.user,a)-BitcoinExplorer.distance(state.user,b)||a.name.localeCompare(b.name):a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  }
  function parse(value){
    const url=new URL(value),p=url.searchParams, result={...defaults};
    if(globalThis.BitcoinGeo?.states[p.get('state')])result.region=p.get('state');
    for(const [param,key] of [['city','city'],['category','category'],['evidence','verification'],['payment','payment']])if(p.has(param))result[key]=p.get(param).slice(0,120);
    result.savedOnly=p.get('view')==='saved';
    if(globalThis.BitcoinGeo?.validId(url.hash.slice(1)))result.selected=url.hash.slice(1);
    return result;
  }
  function url(state,base){
    const u=new URL(base);u.search='';u.hash='';
    for(const [param,key] of [['state','region'],['city','city'],['category','category'],['evidence','verification'],['payment','payment']])if(state[key]&&state[key]!=='all')u.searchParams.set(param,state[key]);
    if(state.savedOnly)u.searchParams.set('view','saved');
    if(state.selected)u.hash=state.selected;
    return u.href;
  }
  function action(state,event){
    if(event.type==='reset')return {...state,...defaults,savedOnly:state.savedOnly};
    if(event.type==='filters')return {...state,...event.values,selected:null,limit:60};
    if(event.type==='select')return {...state,selected:event.id};
    if(event.type==='saved')return {...state,savedOnly:event.value,selected:null};
    return state;
  }
  globalThis.BitcoinDiscovery=Object.freeze({defaults,normalize,group,matches,cityKey,query,parse,url,action});
})();

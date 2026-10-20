const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../dist/explorer-core.js');require('../dist/location.js');
const core=globalThis.BitcoinExplorer;
const merchants=Array.from({length:5},(_,i)=>({id:`az-00${i+1}`,address:`12345 Test St, Phoenix, AZ 85001`,city:'Phoenix',state:'AZ',lat:33.5+i*.001,lon:-112.1}));
test('map area filtering handles the date line and world-wrapped views',()=>{
 assert(core.inside({lat:20,lon:-175},core.bounds(10,30,170,190)));
 assert(core.inside({lat:20,lon:175},core.bounds(10,30,170,190)));
 assert(!core.inside({lat:20,lon:0},core.bounds(10,30,170,190)));
 assert(core.inside({lat:20,lon:0},core.bounds(10,30,-250,250)));
 assert(!core.inside({lat:40,lon:-112},core.bounds(10,30,-120,-100)));
 assert.equal(core.distance(merchants[0],merchants[0]),0);
});
test('shared trails contain validated unique stops and never a private origin',()=>{
 const ids=merchants.map(m=>m.id);
 assert.equal(core.tripIds([...ids,'bad',ids[0]],merchants).length,4);
 assert.deepEqual(core.parseTrip('#trip=bad,az-001,az-001,az-002',merchants),['az-001','az-002']);
 assert.deepEqual(core.parseTrip('#trip=%ZZ',merchants),[]);
 const url=core.shareTrip(ids,merchants,'https://example.com/map/?origin=33.1,-112.2#private');
 assert.equal(new URL(url).search,'');assert(!url.includes('33.1'));assert.equal(core.parseTrip(new URL(url).hash,merchants).length,4);
});
test('navigation respects mobile waypoint and URL limits with and without a chosen origin',()=>{
 const origin={lat:33.4,lon:-112.2};
 const four=merchants.slice(0,4);let url=new URL(core.mapsUrl(four,origin));
 assert.equal(url.searchParams.get('waypoints').split('|').length,3);
 assert.equal(url.searchParams.get('origin'),'33.4,-112.2');
 url=new URL(core.mapsUrl(four));assert.equal(url.searchParams.get('origin'),four[0].address);
 assert.equal(new URL(core.mapsUrl([four[0]])).searchParams.has('origin'),false);
 assert(core.mapsUrl(four.map(m=>({...m,address:'A'.repeat(1000)})),origin).length<2048);
 assert.throws(()=>core.mapsUrl(merchants,origin));assert.throws(()=>core.mapsUrl([{lat:NaN,lon:0}]));
});
test('offline city and ZIP suggestions distinguish street numbers from ZIP codes',()=>{
 assert.equal(core.areas([...merchants,{...merchants[0],address:'12345 Test St, Phoenix, AZ'}],'12345').length,0);
 assert.equal(core.areas(merchants,'85001')[0].count,5);
 assert.equal(core.areas(merchants,'phoenix, az')[0].type,'area');
 assert.equal(core.areas(merchants,'x').length,0);
});
const position={coords:{latitude:33.5,longitude:-112.1,accuracy:50}};
test('location retries transient errors with fresh high accuracy, caches, and refreshes',async()=>{
 let calls=[];let clock=1000;
 const locator=BitcoinLocation.createLocator({permissions:{query:async()=>({state:'prompt'})},now:()=>clock,geolocation:{getCurrentPosition(ok,fail,options){calls.push(options);if(calls.length===1)fail({code:2});else ok(position);}}});
 const p=await locator.locate();assert.equal(p.lat,33.5);assert.equal(calls.length,2);
 assert.equal(calls[0].enableHighAccuracy,false);assert.equal(calls[1].enableHighAccuracy,true);assert.equal(calls[1].maximumAge,0);
 await locator.locate();assert.equal(calls.length,2);
 await locator.locate({refresh:true});assert.equal(calls.length,3);
 clock+=300001;await locator.locate();assert.equal(calls.length,4);
});
test('permission denial does not retry and provides useful location alternatives',async()=>{
 let calls=0;const geolocation={getCurrentPosition(ok,fail){calls++;fail({code:1});}};
 for(const permission of ['denied','prompt']){
  const locator=BitcoinLocation.createLocator({geolocation,permissions:{query:async()=>({state:permission})}});
  await assert.rejects(locator.locate(),e=>e.reason==='denied'&&/ZIP/.test(e.message));
 }
 assert.equal(calls,1);
});
test('location requests share one pending operation and unsupported devices get a fallback',async()=>{
 let finish,calls=0;
 const locator=BitcoinLocation.createLocator({geolocation:{getCurrentPosition(ok){calls++;finish=ok;}}});
 const one=locator.locate(),two=locator.locate();await new Promise(resolve=>setImmediate(resolve));finish(position);
 assert.deepEqual(await one,await two);assert.equal(calls,1);
 await assert.rejects(BitcoinLocation.createLocator().locate(),e=>e.reason==='unsupported');
 await assert.rejects(BitcoinLocation.createLocator({secure:false}).locate(),e=>e.reason==='insecure');
});
test('timeouts and invalid GPS coordinates never become a usable origin',async()=>{
 for(const [failure,reason] of [[true,'timeout'],[false,'unavailable']]){
  let calls=0;const locator=BitcoinLocation.createLocator({geolocation:{getCurrentPosition(ok,fail){calls++;failure?fail({code:3}):ok({coords:{latitude:100,longitude:200}});}}});
  await assert.rejects(locator.locate(),e=>e.reason===reason);assert.equal(calls,2);
 }
});
test('an embedded browser that never responds still returns timeout fallback',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const locator=BitcoinLocation.createLocator({geolocation:{getCurrentPosition(){}}});
 const pending=assert.rejects(locator.locate(),e=>e.reason==='timeout');
 await new Promise(resolve=>setImmediate(resolve));t.mock.timers.tick(9500);
 await new Promise(resolve=>setImmediate(resolve));t.mock.timers.tick(13500);
 await pending;
});

const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../dist/geography.js');require('../dist/explorer-core.js');require('../dist/directory-tools.js');require('../dist/discovery.js');
const catalog=JSON.parse(fs.readFileSync('dist/merchants.json')),d=BitcoinDiscovery;
test('category plus city and typed intent return the same coffee businesses',()=>{
 const typed=d.query(catalog.merchants,{...d.defaults,query:'coffee in Chicago'}).map(m=>m.id);
 const controls=d.query(catalog.merchants,{...d.defaults,query:'Chicago',category:'coffee'}).map(m=>m.id);
 assert.deepEqual(typed,controls);assert.equal(typed.length,7);
 assert.ok(d.matches({name:'Café Éclair',city:'Paris',category:'Coffee Shops & Cafés'},'cafe eclair'));
});
test('Saved ignores exploration restrictions and public URLs never contain a private origin or typed address',()=>{
 const id=catalog.merchants.find(m=>m.city==='Chicago').id,saved=new Set([id]);
 const state={...d.defaults,savedOnly:true,region:'AZ',query:'private home address',area:{south:0,north:1,west:0,east:1},user:{lat:1,lon:2},radius:1};
 assert.deepEqual(d.query(catalog.merchants,state,saved).map(m=>m.id),[id]);
 const url=d.url(state,'https://example.org/map/');assert.ok(!url.includes('private'));assert.ok(!url.includes('lat'));assert.equal(d.parse(url).region,'AZ');
 const cities=catalog.merchants.filter(m=>m.city==='Springfield');assert.equal(new Set(cities.map(d.cityKey)).size,7);
});
test('evidence summaries distinguish source checks, partial dates, old claims and same-day failure',()=>{
 const summarize=m=>BitcoinDirectory.summary(m,'2026-11-11');
 assert.match(summarize({verification:{type:'merchant-confirmed',date:'2020-10',checkedAt:'2026-10-20'}}).detail,/2020-10/);
 assert.equal(summarize({verification:{type:'community-dated',date:'2025-01-01'}}).tone,'caution');
 assert.equal(summarize({lastPayment:{date:'2026-11-10',rail:'lightning',outcome:'paid'}}).tone,'recent');
 assert.equal(summarize({lastPayment:{date:'2026-11-10',rail:'lightning'},latestPaymentReport:{date:'2026-11-10',outcome:'failed'}}).tone,'caution');
 assert.equal(BitcoinDirectory.paymentMethod({onchain:false},'onchain'),'unknown');
 assert.equal(catalog.merchants.filter(m=>m.lastPayment).length,0);
});

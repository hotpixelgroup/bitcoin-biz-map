const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../dist/geography.js');
require('../dist/directory-tools.js');
test('US state bounds include Alaska and Hawaii and reject mismatched states', () => {
  assert.equal(Object.keys(BitcoinGeo.states).length, 51);
  for (const [lat,lon,state] of [[33.45,-112.07,'AZ'],[61.22,-149.9,'AK'],[21.31,-157.86,'HI'],[40.71,-74.01,'NY'],[38.90,-77.03,'DC']]) assert.ok(BitcoinGeo.coordinates(lat,lon,state));
  assert.ok(!BitcoinGeo.coordinates(40.71,-74.01,'AZ'));
  assert.ok(!BitcoinGeo.coordinates(51.5,-.1));
  assert.ok(!BitcoinGeo.coordinates(NaN,-112,'AZ'));
  assert.ok(!BitcoinGeo.coordinates(33.5,-112,'XX'));
});
test('public listing IDs support old links and national records without URL fragments', () => {
  for (const id of ['az-008','us-btc13234','us-research-123abc456def','us-ca-1000099']) assert.ok(BitcoinGeo.validId(id));
  for (const id of ['us-../main','az-1','<script>','us-btc123?x=1','us-btc123#x']) assert.ok(!BitcoinGeo.validId(id));
});
test('CSV exports preserve evidence and quote special characters without spreadsheet formulas', () => {
  const text = BitcoinDirectory.csv([{id:'us-btc1',name:'=HYPERLINK("bad")',address:'One, Two\nThree',state:'CA',phone:'+123',lat:34,lon:-118,verification:{type:'merchant-confirmed',sourceUrl:'https://example.com/bitcoin',checkedAt:'2026-10-20'}}]);
  assert.ok(text.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(text.includes('"One, Two\nThree"'));
  assert.ok(text.includes('Merchant source'));
  assert.ok(text.includes('"-118"')); assert.ok(!text.includes("'-118"));
  assert.ok(text.includes('https://example.com/bitcoin'));
  assert.ok(text.includes('/bitcoin-biz-map/#us-btc1'));
});
test('CSV includes reviewed payment history and escapes payment conditions',()=>{
 const csv=BitcoinDirectory.csv([{id:'az-008',name:'Cafe',lat:33.5,lon:-112.1,lastPayment:{date:'2026-10-18',rail:'lightning'},latestPaymentReport:{date:'2026-10-19',outcome:'failed'},paymentNotes:'=malicious()'}]);
 for(const value of ['last_reviewed_payment_date','latest_payment_outcome','2026-10-18','lightning','failed',"'=malicious()"])assert.ok(csv.includes(value));
});

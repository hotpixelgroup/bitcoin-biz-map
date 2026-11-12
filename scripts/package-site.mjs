import {readFile,writeFile,mkdir,rm,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import '../dist/directory-tools.js';
const out=path.resolve(process.env.SITE_DIR || '.publish');
if(!['.publish'].includes(path.basename(out)))throw Error('Publish directory must be named .publish.');
const raw=await readFile('dist/merchants.json','utf8'),catalog=JSON.parse(raw);
const asOf=process.env.BUILD_DATE || new Date().toISOString().slice(0,10);
if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf))throw Error('BUILD_DATE must be YYYY-MM-DD.');
const revision=createHash('sha256').update(raw).digest('hex').slice(0,20);
await rm(out,{recursive:true,force:true});await cp('dist',out,{recursive:true});
const base=`catalog/${revision}`;await mkdir(path.join(out,base),{recursive:true});
const write=async(file,value)=>writeFile(path.join(out,file),typeof value==='string'?value:JSON.stringify(value));
const fields=['id','name','address','city','state','category','lat','lon','lightning','onchain','lastPayment','latestPaymentReport'];
const index={revision,updated:catalog.updated,nationalResearch:catalog.nationalResearch,removals:(catalog.removals || []).map(r=>({id:r.id,reason:r.reason,reviewIssue:r.reviewIssue})),merchants:catalog.merchants.map(m=>({...Object.fromEntries(fields.filter(k=>m[k]!==undefined).map(k=>[k,m[k]])),verification:Object.fromEntries(['type','date','checkedAt'].filter(k=>m.verification?.[k]!==undefined).map(k=>[k,m.verification[k]]))}))};
await write(`${base}/index.json`,index);await write(`${base}/full.json`,raw);
const details={},groups=Map.groupBy(catalog.merchants,m=>m.state);
for(const [state,merchants] of groups){details[state]=`${base}/${state}.json`;await write(details[state],{revision,merchants});}
await write('catalog-manifest.json',{schemaVersion:2,revision,index:`${base}/index.json`,full:`${base}/full.json`,details});
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const publicBase='https://hotpixelgroup.github.io/bitcoin-biz-map/';
const safe=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)&&!u.username?u.href:'';}catch{return '';}};
const page=(title,description,route,body)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Sats in the Sun</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${publicBase+route}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${publicBase+route}"><meta property="og:image" content="${publicBase}assets/sats-in-the-sun-us-social.png"><meta name="twitter:card" content="summary_large_image"><script>try{document.documentElement.dataset.theme=localStorage.getItem('sun-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}</script><link rel="stylesheet" href="../../styles.css?v=mobile-a11y-1"><link rel="stylesheet" href="../../experience.css?v=mobile-a11y-2"></head><body class="place-page"><a class="skip-link" href="#content">Skip to content</a><header><a class="brand" href="../../">₿ sats in the sun</a><a href="../../directory.html">All states</a></header><main id="content" tabindex="-1">${body}</main><footer>Data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> via <a href="https://btcmap.org">BTC Map</a> · <a href="https://github.com/hotpixelgroup/bitcoin-biz-map/blob/main/DATA_LICENSE.md">Sources and license</a></footer></body></html>`;
const urls=[publicBase,publicBase+'directory.html'];
for(const m of catalog.merchants){
 const route=`places/${m.id}/`,confidence=BitcoinDirectory.summary(m,asOf),source=safe(BitcoinDirectory.source(m));
 const navigation='https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',travelmode:'driving',destination:m.address});
 const description=`${m.name} in ${m.city}, ${m.state}. ${BitcoinDirectory.dateLabel(m)}. Check payment details before visiting.`;
 const method=[m.lightning?'Lightning reported':'',m.onchain?'On-chain reported':''].filter(Boolean).join(' · ')||'Bitcoin reported; payment network unknown';
 const confidenceLabel=confidence.tone==='recent'?`Visitor reported paying ${m.lastPayment.date}`:confidence.label;
 const body=`<span class="eyebrow">${esc(m.city)}, ${esc(m.state)} · ${esc(m.category)}</span><h1>${esc(m.name)}</h1><p>${esc(m.address)}</p><p class="confidence">${esc(method)}</p><div class="confidence confidence-${confidence.tone}"><strong>${esc(confidenceLabel)}</strong><p>${esc(BitcoinDirectory.dateLabel(m))}</p></div><p>${esc(m.paymentNotes || m.verification?.summary || confidence.detail)}</p><p>Hours not supplied. Contact the business before a special trip.</p><div class="place-actions"><a class="primary-button" href="${esc(navigation)}" target="_blank" rel="noopener">Get directions · Google Maps ↗</a><a href="../../#${m.id}">View on map</a>${safe(m.website)?`<a href="${esc(safe(m.website))}" rel="noopener">Business website ↗</a>`:''}${m.phone?`<a href="tel:${esc(m.phone.replace(/[^+\d]/g,''))}">Call business</a>`:''}</div><details><summary>Payment evidence and reports</summary><p>${esc(confidence.detail)}</p>${m.lastPayment?`<p>Visitor reported paying ${esc(m.lastPayment.date)} · ${esc(m.lastPayment.rail)}</p>`:''}${m.latestPaymentReport?.outcome==='failed'?`<p>Payment difficulty reported ${esc(m.latestPaymentReport.date)}</p>`:''}<a href="${esc(source)}" rel="noopener">Read source ↗</a><p>Source checks are not test purchases. Visitor reports require human review. Page generated ${asOf}; confirm current acceptance before visiting.</p></details>`;
 await mkdir(path.join(out,route),{recursive:true});await write(route+'index.html',page(m.name,description,route,body));urls.push(publicBase+route);
}
for(const r of catalog.removals || []){const route=`places/${r.id}/`;await mkdir(path.join(out,route),{recursive:true});await write(route+'index.html',page('Listing removed','This place is no longer listed.',route,`<h1>This listing was removed</h1><p>${esc(r.reason)}</p><a href="${esc(safe(r.reviewIssue))}">Read the reviewed change</a><p><a href="../../">Find another place</a></p>`));}
const cityGroups=Map.groupBy(catalog.merchants,m=>`${m.city}|${m.state}`);
for(const [key,rows] of cityGroups){
 if(rows.length<3)continue;
 const [city,state]=key.split('|'),slug=`${city.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${state.toLowerCase()}-${createHash('sha256').update(key).digest('hex').slice(0,6)}`,route=`cities/${slug}/`;
 await mkdir(path.join(out,route),{recursive:true});
 await write(route+'index.html',page(`Bitcoin businesses in ${city}, ${state}`,`${rows.length} sourced listings with payment evidence and directions.`,route,`<h1>Bitcoin businesses in ${esc(city)}, ${state}</h1><p>${rows.length} sourced listings. Check current acceptance before visiting.</p><a class="primary-button" href="../../?state=${state}&city=${encodeURIComponent(key)}">Explore this area</a><ul class="city-places">${rows.map(m=>`<li><a href="../../places/${m.id}/">${esc(m.name)}</a><p>${esc(m.address)} · ${esc(m.category)}</p></li>`).join('')}</ul>`));urls.push(publicBase+route);
}
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${esc(url)}</loc></url>`).join('')}</urlset>`);
await write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${publicBase}sitemap.xml\n`);
await write('.nojekyll','');
const assets=(await readdir('dist')).filter(f=>/\.(js|css)$/.test(f)).concat(['vendor/leaflet.js','vendor/leaflet.css','vendor/leaflet.markercluster.js','vendor/MarkerCluster.css','index.html','directory.html']);
const version=createHash('sha256').update((await Promise.all(assets.map(f=>readFile(path.join(out,f))))).map(b=>b.toString()).join('')).update(revision).digest('hex').slice(0,16);
const sw=`'use strict';
const CACHE='sats-offline-${version}',ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type!=='SAVE')return;event.waitUntil((async()=>{try{const cache=await caches.open(CACHE);for(const p of [...ASSETS,...event.data.paths]){const url=new URL(p,self.registration.scope);if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))throw Error();const response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error();await cache.put(url,response);}event.ports[0]?.postMessage({ok:true});const keys=await caches.keys();for(const key of keys.filter(k=>k.startsWith('sats-offline-')&&k!==CACHE).slice(0,-1))await caches.delete(key);}catch{event.ports[0]?.postMessage({ok:false});}})());});
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;const rel=u.pathname.slice(new URL(self.registration.scope).pathname.length);if(rel && !/^(catalog\\/|catalog-manifest\\.json$|index\\.html$|directory\\.html$|[^/]+\\.(js|css)$|vendor\\/)/.test(rel))return;event.respondWith((async()=>{try{const response=await fetch(event.request);return response;}catch{const keys=await caches.keys();for(const key of [CACHE,...keys.filter(k=>k.startsWith('sats-offline-')&&k!==CACHE).reverse()]){const hit=await (await caches.open(key)).match(event.request,{ignoreSearch:true});if(hit){const headers=new Headers(hit.headers);headers.set('X-Sats-Offline','1');return new Response(await hit.arrayBuffer(),{status:hit.status,headers});}}return Response.error();}})());});`;
await write('sw.js',sw);
const initial=['index.html','styles.css','responsive.css','experience.css','app.js','explorer-core.js','discovery.js','catalog.js','directory-tools.js','location.js','community.js','community-config.js','geography.js','vendor/leaflet.js','vendor/leaflet.markercluster.js','vendor/leaflet.css','vendor/MarkerCluster.css'];
const bytes=gzipSync(JSON.stringify(index)).length+(await Promise.all(initial.map(f=>readFile(path.join(out,f)).then(b=>gzipSync(b).length)))).reduce((a,b)=>a+b,0);
if(bytes>650*1024)throw Error(`Initial app transfer ${bytes} exceeds 650 KiB budget`);
await write('build-info.json',{revision,version,asOf,merchants:catalog.merchants.length,initialGzipBytes:bytes,generatedPages:urls.length});
console.log(`Packaged ${catalog.merchants.length} merchants, ${urls.length} pages; initial app estimate ${(bytes/1024).toFixed(1)} KiB gzip.`);

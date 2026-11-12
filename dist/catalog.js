'use strict';
(() => {
  let data,manifest,root,offline=false,shards=new Map();
  const request=async path=>{const response=await fetch(new URL(path,root),{signal:AbortSignal.timeout(15000)});if(response.headers.get('X-Sats-Offline'))offline=true;if(!response.ok)throw Error(`Directory request failed (${response.status}).`);return response.json();};
  async function load(base='./'){
    root=new URL(base,location.href);offline=false;
    const response=await fetch(new URL('catalog-manifest.json',root),{cache:'no-cache',signal:AbortSignal.timeout(15000)});
    if(response.status===404){data=await request('merchants.json');manifest=null;return data;}
    if(!response.ok)throw Error('The directory could not load. Please retry.');
    if(response.headers.get('X-Sats-Offline'))offline=true;manifest=await response.json();
    data=await request(manifest.index);
    if(data.revision!==manifest.revision)throw Error('The directory is updating. Please retry.');
    data.offline=offline;return data;
  }
  async function detail(id){
    const row=data?.merchants.find(m=>m.id===id);if(!row)return null;
    if(!manifest)return row;
    if(!shards.has(row.state))shards.set(row.state,request(manifest.details[row.state]).then(part=>{if(part.revision!==manifest.revision)throw Error('Details are updating. Please retry.');return part.merchants;}).catch(error=>{shards.delete(row.state);throw error;}));
    const full=(await shards.get(row.state)).find(m=>m.id===id);
    if(!full)throw Error('This listing is no longer in this directory revision.');
    Object.assign(row,full);return row;
  }
  async function full(){if(!manifest)return data;return request(manifest.full);}
  async function saveOffline(ids){
    if(!('serviceWorker' in navigator))throw Error('Offline saving is unavailable in this browser.');
    await navigator.serviceWorker.register(new URL('sw.js',root),{scope:root.pathname});
    const registration=await navigator.serviceWorker.ready;
    for(const id of ids)await detail(id);
    const paths=['./','index.html','directory.html','catalog-manifest.json',...(manifest?[manifest.index,...new Set(ids.map(id=>data.merchants.find(m=>m.id===id)?.state).filter(Boolean).map(code=>manifest.details[code]))]:['merchants.json'])];
    await new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=setTimeout(()=>reject(Error('Offline saving timed out. Please retry.')),30000);channel.port1.onmessage=e=>{clearTimeout(timer);e.data.ok?resolve():reject(Error('Some files could not be saved. Please retry.'));};registration.active.postMessage({type:'SAVE',paths},[channel.port2]);});
    return data.updated || data.nationalResearch?.checkedAt;
  }
  async function clearOffline(){
    if('serviceWorker' in navigator)for(const r of await navigator.serviceWorker.getRegistrations())if(r.scope===root.href)await r.unregister();
    if('caches' in globalThis)for(const key of await caches.keys())if(key.startsWith('sats-offline-'))await caches.delete(key);
  }
  globalThis.BitcoinCatalog=Object.freeze({load,detail,full,saveOffline,clearOffline,revision:()=>manifest?.revision || 'source'});
})();

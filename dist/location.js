'use strict';
(() => {
  class LocationError extends Error {
    constructor(reason,message) { super(message); this.reason=reason; }
  }
  const errors = {
    denied:'Location access is blocked. You can choose a city or ZIP, or set a starting point on the map. To use GPS, allow location for this site in your browser and device settings, then try again.',
    timeout:'Your device took too long to find a location. Choose a city or ZIP, set a map point, or try again outdoors.',
    unavailable:'Your device could not find a location. Choose a city or ZIP, or set a starting point on the map.',
    unsupported:'This browser cannot provide a location. Choose a city or ZIP, set a map point, or open the map in your regular browser.',
    insecure:'Location needs a secure browser connection. Open the HTTPS map in your regular browser, or choose a starting point below.',
  };
  function createLocator({geolocation,permissions,secure=true,now=Date.now}={}) {
    let cached=null, pending=null;
    const failure = code => new LocationError(code,errors[code]);
    async function permission() {
      let timer;
      try { return (await Promise.race([permissions?.query({name:'geolocation'}),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),1200);})]))?.state || 'unknown'; }
      catch { return 'unknown'; } finally { clearTimeout(timer); }
    }
    function request(options) {
      let timer;
      return new Promise((resolve,reject)=> {
        // Some embedded browsers leave their permission prompt pending beyond
        // the native timeout. Always return the user to our fallback choices.
        timer=setTimeout(()=>reject({code:3}),options.timeout+1500);
        geolocation.getCurrentPosition(pos=> {
        const c=pos.coords;
        if (!Number.isFinite(c?.latitude) || !Number.isFinite(c?.longitude) || Math.abs(c.latitude)>90 || Math.abs(c.longitude)>180) { reject({code:2}); return; }
        resolve({lat:c.latitude,lon:c.longitude,accuracy:Number.isFinite(c.accuracy)?c.accuracy:null,type:'gps',label:'Device location',at:now()});
      },reject,options);
      }).finally(()=>clearTimeout(timer));
    }
    async function locate({refresh=false}={}) {
      if (!secure) throw failure('insecure');
      if (!geolocation) throw failure('unsupported');
      if (!refresh && cached && now()-cached.at<300000) return cached;
      if (pending) return pending;
      pending=(async()=> {
        if (await permission()==='denied') throw failure('denied');
        try {
          // A coarse/cached fix is often faster indoors. Retry fresh high
          // accuracy only for transient failures, never a permission denial.
          try { cached=await request({enableHighAccuracy:false,timeout:8000,maximumAge:120000}); }
          catch (error) {
            if (error.code===1) throw error;
            cached=await request({enableHighAccuracy:true,timeout:12000,maximumAge:0});
          }
          return cached;
        } catch (error) { throw failure(error.code===1?'denied':error.code===3?'timeout':'unavailable'); }
      })();
      try { return await pending; } finally { pending=null; }
    }
    return Object.freeze({locate,permission});
  }
  globalThis.BitcoinLocation=Object.freeze({createLocator,LocationError});
})();

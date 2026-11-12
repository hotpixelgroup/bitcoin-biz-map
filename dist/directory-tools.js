'use strict';
(() => {
  const labels = { 'merchant-confirmed':'Merchant source', 'community-dated':'Dated community', 'article-listed':'Original article', 'maintainer-reviewed':'Maintainer reviewed' };
  const evidence = m => labels[m.verification?.type] || (m.reviewIssue ? labels['maintainer-reviewed'] : labels['article-listed']);
  const source = m => m.verification?.sourceUrl || m.reviewIssue || 'https://bitcoinmagazine.com/culture/pita-cafe-arizona-bitcoin';
  const date = m => m.verification?.date || m.reviewedAt || '';
  const dateLabel = m => m.verification?.type === 'community-dated' ? `Community verified ${date(m)}` : m.verification?.type === 'article-listed' ? `Article dated ${date(m)}` : m.verification?.type === 'maintainer-reviewed' ? `Reviewed ${m.reviewedAt || m.verification.checkedAt}` : `${date(m) ? 'Source dated '+date(m)+' · ' : ''}Source checked ${m.verification?.checkedAt || ''}`;

  function summary(m, today = new Date().toISOString().slice(0,10)) {
    const last=m.lastPayment, latest=m.latestPaymentReport, v=m.verification || {};
    const days=value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? Math.floor((Date.parse(today)-Date.parse(value))/86400000) : null;
    if(latest?.outcome==='failed' && (!last || latest.date>=last.date)) return {tone:'caution',label:`Payment difficulty reported ${latest.date}`,detail:'A reviewed visitor report. Check with this branch before visiting.'};
    if(last && days(last.date)!==null && days(last.date)>=0 && days(last.date)<=90) return {tone:'recent',label:`Visitor reported paying ${days(last.date)===0?'today':days(last.date)===1?'yesterday':days(last.date)+' days ago'}`,detail:`${last.rail==='unknown'?'Payment network not supplied':last.rail==='onchain'?'On-chain':'Lightning'} · reviewed visitor claim, not a guarantee.`};
    if(v.type==='community-dated') return {tone:days(v.date)>365?'caution':'source',label:days(v.date)>365?'Needs a fresh check':`Community report · ${v.date || 'date unknown'}`,detail:`Acceptance reported ${v.date || 'on an unknown date'}. A source check is not a test purchase.`};
    if(v.type==='merchant-confirmed') return {tone:'source',label:`Merchant policy checked ${v.checkedAt || 'date unknown'}`,detail:`${v.date?'Source dated '+v.date+'. ':''}Branch checkout has not been tested by this directory.`};
    if(last) return {tone:'source',label:`Visitor reported paying ${last.date}`,detail:'Older reviewed visitor history. Confirm current acceptance.'};
    return {tone:'source',label:v.type==='maintainer-reviewed'?`Listing reviewed ${m.reviewedAt || v.checkedAt || 'date unknown'}`:`Article · ${v.date || 'date unknown'}`,detail:'No recent payment report. Check with the business before a special trip.'};
  }
  const paymentMethod = (m, rail) => m[rail]===true ? 'reported' : 'unknown';
  function csv(rows) {
    // Spreadsheet programs can execute cells beginning with formula characters.
    const cell = value => '"' + (typeof value === 'number' ? String(value) : String(value ?? '').replace(/^[\s]*[=+@-]/, "'$&")).replace(/"/g, '""') + '"';
    const fields = ['name','address','city','state','category','latitude','longitude','lightning_reported','onchain_reported','evidence_type','source_date','source_checked_at','source_url','map_url','last_reviewed_payment_date','last_reviewed_payment_rail','latest_payment_outcome','latest_payment_date','payment_conditions','payment_confidence','payment_confidence_note'];
    return '\ufeff' + [fields, ...rows.map(m => [m.name,m.address,m.city,m.state,m.category,m.lat,m.lon,paymentMethod(m,'lightning'),paymentMethod(m,'onchain'),evidence(m),date(m),m.verification?.checkedAt || '',source(m),`https://hotpixelgroup.github.io/bitcoin-biz-map/#${m.id}`,m.lastPayment?.date || '',m.lastPayment?.rail || '',m.latestPaymentReport?.outcome || '',m.latestPaymentReport?.date || '',m.paymentNotes || '',summary(m).label,summary(m).detail])].map(row => row.map(cell).join(',')).join('\r\n');
  }
  function download(rows, filename) {
    const href = URL.createObjectURL(new Blob([csv(rows)], {type:'text/csv;charset=utf-8'}));
    const a = Object.assign(document.createElement('a'), {href, download:filename});
    a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  globalThis.BitcoinDirectory = Object.freeze({ evidence, source, date, dateLabel, summary, paymentMethod, csv, download });
})();

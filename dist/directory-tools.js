'use strict';
(() => {
  const labels = { 'merchant-confirmed':'Merchant source', 'community-dated':'Dated community', 'article-listed':'Original article', 'maintainer-reviewed':'Maintainer reviewed' };
  const evidence = m => labels[m.verification?.type] || (m.reviewIssue ? labels['maintainer-reviewed'] : labels['article-listed']);
  const source = m => m.verification?.sourceUrl || m.reviewIssue || 'https://bitcoinmagazine.com/culture/pita-cafe-arizona-bitcoin';
  const date = m => m.verification?.date || m.reviewedAt || '';
  const dateLabel = m => m.verification?.type === 'community-dated' ? `Community verified ${date(m)}` : m.verification?.type === 'article-listed' ? `Article dated ${date(m)}` : m.verification?.type === 'maintainer-reviewed' ? `Reviewed ${m.reviewedAt || m.verification.checkedAt}` : `${date(m) ? 'Source dated '+date(m)+' · ' : ''}Source checked ${m.verification?.checkedAt || ''}`;
  function csv(rows) {
    // Spreadsheet programs can execute cells beginning with formula characters.
    const cell = value => '"' + (typeof value === 'number' ? String(value) : String(value ?? '').replace(/^[\s]*[=+@-]/, "'$&")).replace(/"/g, '""') + '"';
    const fields = ['name','address','city','state','category','latitude','longitude','lightning_reported','onchain_reported','evidence_type','source_date','source_checked_at','source_url','map_url'];
    return '\ufeff' + [fields, ...rows.map(m => [m.name,m.address,m.city,m.state,m.category,m.lat,m.lon,m.lightning,m.onchain,evidence(m),date(m),m.verification?.checkedAt || '',source(m),`https://hotpixelgroup.github.io/bitcoin-biz-map/#${m.id}`])].map(row => row.map(cell).join(',')).join('\r\n');
  }
  function download(rows, filename) {
    const href = URL.createObjectURL(new Blob([csv(rows)], {type:'text/csv;charset=utf-8'}));
    const a = Object.assign(document.createElement('a'), {href, download:filename});
    a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  globalThis.BitcoinDirectory = Object.freeze({ evidence, source, date, dateLabel, csv, download });
})();

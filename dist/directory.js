'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = value => { try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) && !u.username ? u.href : ''; } catch { return ''; } };
  const states = Object.entries(BitcoinGeo.states).sort((a,b) => a[1].name.localeCompare(b[1].name));
  let merchants = [], query = '', evidence = '';
  function selected(code) { return merchants.filter(m => m.state === code && (!evidence || m.verification?.type === evidence) && (!query || `${m.name} ${m.address} ${m.city}`.toLowerCase().includes(query))); }
  function render() {
    $('#state-index').innerHTML = states.map(([code,state]) => `<a href="#state-${code}">${esc(state.name)} <span>${selected(code).length}</span></a>`).join('');
    $('#state-directory').innerHTML = states.map(([code,state]) => {
      const rows = selected(code);
      return `<section class="state-section" id="state-${code}"><div class="state-heading"><div><span class="eyebrow">${code}</span><h2>${esc(state.name)} <span>${rows.length}</span></h2></div><div><a href="./?state=${code}">View map ↗</a><button data-download="${code}" ${rows.length?'':'disabled'}>CSV ↓</button></div></div>${rows.length ? `<details><summary>Browse ${rows.length.toLocaleString()} sourced listing${rows.length===1?'':'s'}</summary><div data-state-rows="${code}"></div></details>` : '<p class="coverage-note">No records match this selection. This is a coverage gap, not evidence that no businesses accept Bitcoin here.</p>'}</section>`;
    }).join('');
    // Populate a state's rows only when opened, keeping the national page fast.
    document.querySelectorAll('.state-section details').forEach(details => details.addEventListener('toggle', () => {
      const target = details.querySelector('[data-state-rows]');
      if (!details.open || target.children.length) return;
      target.innerHTML = selected(target.dataset.stateRows).sort((a,b)=>a.name.localeCompare(b.name)||a.address.localeCompare(b.address)).map(m => `<article class="directory-row"><div><a class="directory-name" href="./#${esc(m.id)}">${esc(m.name)} ↗</a><p>${esc(m.address)}</p><span>${esc(m.category)}${m.lightning?' · Lightning reported':''}${m.onchain?' · On-chain reported':''}</span>${m.lastPayment?`<p>Reviewed visitor payment: ${esc(m.lastPayment.date)} · ${esc(m.lastPayment.rail)}</p>`:''}${m.latestPaymentReport?.outcome==='failed'?`<p>Reviewed payment difficulty: ${esc(m.latestPaymentReport.date)}</p>`:''}${m.paymentNotes?`<p>${esc(m.paymentNotes)}</p>`:''}</div><div class="directory-evidence"><a href="${esc(url(BitcoinDirectory.source(m)))}" target="_blank" rel="noopener">${esc(BitcoinDirectory.evidence(m))} ↗</a><span>${esc(BitcoinDirectory.dateLabel(m))}</span>${m.verification?.summary?`<details><summary>Evidence notes</summary><p>${esc(m.verification.summary)}</p></details>`:''}</div></article>`).join('');
    }));
  }
  $('#directory-theme').onclick = () => { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; try { localStorage.setItem('sun-theme',theme); } catch {} };
  let searchTimer;
  $('#directory-search').oninput = event => { query = event.target.value.trim().toLowerCase(); clearTimeout(searchTimer); searchTimer = setTimeout(render,180); };
  $('#directory-evidence').onchange = event => { evidence = event.target.value; render(); };
  $('#download-all').onclick = () => BitcoinDirectory.download(merchants,'sats-in-the-sun-us-directory.csv');
  $('#state-directory').onclick = event => { const button = event.target.closest('[data-download]'); if (button) BitcoinDirectory.download(selected(button.dataset.download),`sats-in-the-sun-${button.dataset.download.toLowerCase()}.csv`); };
  fetch('merchants.json').then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => {
    merchants = data.merchants;
    $('#directory-summary').textContent = `${merchants.length.toLocaleString()} mapped locations · 50 states + DC · Research snapshot ${data.nationalResearch?.checkedAt || '2026-10-20'}. Approved community changes appear here automatically.`;
    $('#download-all').disabled = false; render();
    if (/^#state-[A-Z]{2}$/.test(location.hash)) document.querySelector(location.hash)?.scrollIntoView();
  }).catch(() => { $('#directory-summary').textContent = 'The directory could not load. Please check your connection and refresh.'; });
})();

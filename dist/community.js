'use strict';

// Keep issue links free of labels/assignees query parameters: visitors may not
// have repository permissions. Templates apply the review labels instead.
(() => {
  const issueBase = 'https://github.com/hotpixelgroup/bitcoin-biz-map/issues/new';
  const mapBase = 'https://hotpixelgroup.github.io/bitcoin-biz-map/';

  function issueUrl(kind, merchant) {
    if (kind !== 'suggestion' && kind !== 'correction') {
      throw new TypeError('Unknown community submission type');
    }
    const url = new URL(issueBase);
    url.searchParams.set('template', kind === 'suggestion'
      ? 'suggest_business.yml' : 'merchant_correction.yml');
    if (kind === 'correction' && merchant) {
      url.searchParams.set('title', `[Listing correction] ${merchant.name}`);
      url.searchParams.set('merchant', [merchant.name, merchant.address || merchant.city].filter(Boolean).join(' — '));
      const listing = new URL(mapBase);
      listing.hash = merchant.id;
      url.searchParams.set('listing_url', listing.href);
    }
    return url.href;
  }

  let merchants = [];
  globalThis.BitcoinCommunity = Object.freeze({ issueUrl, setMerchants: list => { merchants = list; } });
  if (typeof document === 'undefined') return;
  const query = selector => document.querySelector(selector);
  const dialog = query('#submission-dialog');
  const form = query('#submission-form');
  const send = query('#submission-send');
  const status = query('#submission-status');
  const drafts=new Map();let draftKey='',currentMerchant=null;
  let challenge = null, challengeAt = 0, session = 0, sending = false, returnFocus = null;
  const field = name => form.elements.namedItem(name);
  field('state').innerHTML = '<option value="">Choose a state</option>' + Object.entries(BitcoinGeo.states).sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([code,s]) => `<option value="${code}">${s.name}</option>`).join('');
  const explainError=error=>error.name==='TypeError'?'The connection failed. Your draft is still here. Retry when you are connected.':error.name==='TimeoutError'?'The connection timed out. Your draft is still here. Please retry.':error.message;
  function message(value) { status.textContent = value; status.hidden = !value; }
  function endpoint() {
    const value = globalThis.BitcoinCommunityConfig?.endpoint;
    if (!value) throw new Error('Submissions are temporarily unavailable. Please try again later.');
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.pathname !== '/api/submissions') throw new Error('Submissions are temporarily unavailable.');
    return url.href;
  }
  async function ready(current) {
    const response = await fetch(endpoint(), { mode: 'cors', credentials: 'omit', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('Submissions are temporarily unavailable. Please try again later.');
    const data = await response.json();
    if (typeof data.challenge !== 'string') throw new Error('Could not prepare your form. Please reopen it.');
    if (current !== session) return false;
    challenge = data.challenge; challengeAt = Date.now();
    return true;
  }
  async function open(kind, merchant, outcome = '', trigger = null) {
    returnFocus = trigger || document.activeElement;
    const current = ++session;
    challenge = null; sending = false;
    form.reset(); form.hidden = false;draftKey=[kind,merchant?.id||'',outcome].join(':');currentMerchant=merchant;query('#submission-retry').hidden=true;
    query('#submission-success').hidden = true;
    field('kind').value = kind;
    field('listingId').value = merchant?.id || '';
    field('name').value = merchant?.name || '';
    field('state').value = merchant?.state || '';
    field('city').value=merchant?.city||'';field('category').value=merchant?.category||'';
    field('address').value = merchant?.address || merchant?.city || '';
    field('website').value = /^https?:\/\//.test(merchant?.website || '') ? merchant.website : '';
    const correction = kind === 'correction';
    const visit = correction && merchant && ['paid','failed'].includes(outcome);
    field('visitOutcome').value = visit ? outcome : '';
    query('#submission-business').hidden=Boolean(visit);query('#submission-context').hidden=!visit;query('#submission-context').textContent=visit?[merchant.name,merchant.address].join(' · '):'';
    field('kind').value=visit?'payment':kind;
    field('notes').closest('label').hidden=Boolean(visit);
    field('city').required=!correction;field('category').required=!correction;
    query('#submission-visit').hidden = !visit;
    query('#submission-visit').disabled = !visit;
    const localDay = new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
    field('visitDate').value = visit ? localDay : '';
    field('visitDate').max = localDay;
    field('visitDate').min = '2009-01-03';
    field('visitDate').required = Boolean(visit);
    query('#submission-title').textContent = correction ? 'Help keep the map right.' : 'Suggest a business.';
    query('#submission-intro').textContent = correction ? 'A wrong address or a place that no longer takes bitcoin? Let us know.' : 'Know a US spot that takes bitcoin? Help another Bitcoiner find it.';
    query('#submission-evidence-label').textContent = correction ? 'What is incorrect, and what should it say?' : 'How do you know they accept bitcoin?';
    if (visit) {
      query('#submission-title').textContent = outcome === 'paid' ? 'You spent sats here.' : 'Help the next visitor.';
      query('#submission-intro').textContent = 'Your payment experience goes to a public GitHub issue for maintainer review before any listing changes. No account needed.';
      query('#submission-evidence-label').textContent = 'What happened? Include useful details or a public source.';
    }
    query('#submission-payment-label').hidden = correction;
    query('#submission-problem-label').hidden = !correction || visit;
    send.disabled = true;
    const draft=drafts.get(draftKey);if(draft)for(const [name,value] of Object.entries(draft)){const control=field(name);if(control&&name!=='consent')control.value=value;}
    field('consent').checked=false;
    message('Getting the form ready…');
    dialog.showModal();
    try { if (await ready(current)) { send.disabled = false; message(''); } }
    catch (error) { if (current === session) {message(explainError(error));query('#submission-retry').hidden=false;} }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-community]');
    if (!link) return;
    event.preventDefault();
    const merchant = merchants.find(item => item.id === link.dataset.listingId);
    open(link.dataset.community, merchant, link.dataset.outcome, link);
  });
  query('#submission-retry').onclick=async()=>{const current=session;query('#submission-retry').disabled=true;try{if(await ready(current)){send.disabled=false;message('');query('#submission-retry').hidden=true;}}catch(error){message(explainError(error));}finally{query('#submission-retry').disabled=false;}};
  query('#submission-close').onclick = () => dialog.close();
  query('#submission-done').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    if(!form.hidden&&draftKey)drafts.set(draftKey,Object.fromEntries(new FormData(form)));
    session++; challenge = null;
    const trigger = returnFocus;
    returnFocus = null;
    // Safari does not focus links on a pointer click, so the native dialog
    // cannot reliably restore focus to the link that opened it.
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const current = session;
    sending = true; send.disabled = true;
    message('Sending your submission for review…');
    try {
      if (!challenge || Date.now() - challengeAt > 480000) {
        if (!await ready(current)) return;
      }
      const remaining = 1700 - (Date.now() - challengeAt);
      if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
      if (current !== session) return;
      const body = Object.fromEntries(new FormData(form));
      body.consent = field('consent').checked;
      body.challenge = challenge;
      if(currentMerchant&&body.kind==='payment')Object.assign(body,{name:currentMerchant.name,address:currentMerchant.address,state:currentMerchant.state,city:currentMerchant.city,category:currentMerchant.category});
      const response = await fetch(endpoint(), { method: 'POST', mode: 'cors', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) { challenge = null; throw new Error(data.error || 'Your submission could not be saved. Please try again.'); }
      if (current !== session) return;
      if (!/^[a-f0-9]{32,64}$/.test(data.receipt || '')) throw new Error('Your submission could not be confirmed. Please try again.');
      drafts.delete(draftKey);form.hidden = true;
      query('#submission-success').hidden = false;
      query('#submission-success-text').textContent = data.state === 'published' || data.state === 'awaiting-review' ? 'This suggestion is already in the review queue. Thanks for helping keep the map accurate.' : `Your submission is saved for review. It will appear in the public GitHub review queue after processing, which may take several minutes. Reference: ${data.receipt.slice(0, 12)}.`;
      const receiptLink=query('#submission-receipt');receiptLink.hidden=!/^[a-f0-9]{64}$/.test(data.statusToken||'');if(!receiptLink.hidden)receiptLink.href='status.html#'+data.statusToken;
      const issueLink=query('#submission-issue');if(/^https:\/\/github\.com\/hotpixelgroup\/bitcoin-biz-map\/issues\/[1-9]\d*$/.test(data.issueUrl||''))issueLink.href=data.issueUrl;
      query('#submission-done').focus();
    } catch (error) {
      if (current === session) message(error.name === 'TimeoutError' ? 'The connection timed out. Please try again; repeat submissions are deduplicated.' : explainError(error));
    } finally { if (current === session) { sending = false; send.disabled = false; } }
  });
})();

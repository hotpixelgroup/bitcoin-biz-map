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

  globalThis.BitcoinCommunity = Object.freeze({ issueUrl });
})();

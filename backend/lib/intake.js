import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export const ORIGIN = 'https://hotpixelgroup.github.io';
export const MAP = `${ORIGIN}/bitcoin-biz-map/`;
export const REPO = 'hotpixelgroup/bitcoin-biz-map';
const hash = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function text(value, label, max, required = false) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new InputError(`${label} must be text.`);
  value = value.trim().replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');
  if ((required && !value) || value.length > max) throw new InputError(`${label} ${required && !value ? 'is required' : `must be at most ${max} characters`}.`);
  return value;
}
export function validateSubmission(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new InputError('Please complete the form.');
  if (!['suggestion', 'correction'].includes(data.kind)) throw new InputError('Choose a submission type.');
  if (data.consent !== true) throw new InputError('Please confirm that your submission can be shared publicly.');
  const result = {
    kind: data.kind,
    name: text(data.name, 'Business name', 120, true),
    address: text(data.address, 'Business address', 300, true),
    website: text(data.website, 'Website', 500),
    evidence: text(data.evidence, 'Payment evidence or correction', 2000, true),
    notes: text(data.notes, 'Additional notes', 1000),
    payment: text(data.payment, 'Payment method', 80),
    problem: text(data.problem, 'Correction type', 100),
    listingId: text(data.listingId, 'Listing ID', 30),
  };
  if (result.website) {
    let url;
    try { url = new URL(result.website); } catch { throw new InputError('Enter a complete website URL, starting with https://.'); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new InputError('Enter a public http or https business website.');
    result.website = url.href;
  }
  if (result.listingId && !/^az-\d{3,8}$/.test(result.listingId)) throw new InputError('The selected listing is invalid.');
  return result;
}
async function readBody(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new InputError('Send JSON data.', 415);
  if (Number(request.headers.get('content-length')) > 12000) throw new InputError('The submission is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('Please complete the form.');
  const chunks = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 12000) { await reader.cancel(); throw new InputError('The submission is too large.', 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new InputError('The submission could not be read.'); }
}
export function createIntake({ store, secret, now = Date.now, origin = ORIGIN, ready = true, log = console.error }) {
  const sign = value => createHmac('sha256', secret).update(value).digest('hex');
  const configured = () => ready && typeof secret === 'string' && secret.length >= 32;
  const ipKey = request => sign((request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim());
  function json(request, value, status = 200) {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
    if (request.headers.get('origin') === origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
    }
    return new Response(JSON.stringify(value), { status, headers });
  }
  function verifyChallenge(token, request) {
    if (typeof token !== 'string' || token.length > 200) return false;
    const [time, nonce, signature] = token.split('.');
    const age = now() - Number(time);
    return /^\d+$/.test(time || '') && /^[a-f0-9]{32}$/.test(nonce || '') && age >= 1500 && age <= 600000 && equal(signature, sign(`${time}.${nonce}.${ipKey(request)}`));
  }
  async function budget(prefix, limit) {
    for (let slot = 0; slot < limit; slot++) {
      if (await store.claim(`${prefix}/${slot}.json`, { createdAt: new Date(now()).toISOString() })) return true;
    }
    return false;
  }
  async function publicHandler(request) {
    if (request.headers.get('origin') !== origin) return json(request, { error: 'This endpoint only accepts submissions from the map.' }, 403);
    if (request.method === 'OPTIONS') return json(request, {});
    if (!configured()) return json(request, { error: 'Submissions are temporarily unavailable. Please try again later.' }, 503);
    if (request.method === 'GET') {
      const time = now(); const nonce = randomBytes(16).toString('hex');
      return json(request, { challenge: `${time}.${nonce}.${sign(`${time}.${nonce}.${ipKey(request)}`)}` });
    }
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed.' }, 405);
    try {
      const data = await readBody(request);
      if (data.contact) return json(request, { receipt: randomBytes(16).toString('hex'), state: 'queued' }, 202);
      if (!verifyChallenge(data.challenge, request)) throw new InputError('Your form has expired or was submitted too quickly. Please reopen it and try again.');
      const submission = validateSubmission(data);
      const date = new Date(now()).toISOString();
      const id = hash(`${date.slice(0, 10)}:${JSON.stringify(submission)}`);
      const published = await store.read(`processed/${id}.json`);
      if (published) return json(request, { receipt: id, state: 'published', issueUrl: published.issueUrl });
      if (await store.read(`pending/${id}.json`)) return json(request, { receipt: id, state: 'queued' }, 202);
      if (!(await budget(`rate/${date.slice(0, 13)}/${ipKey(request)}`, 3))) throw new InputError('Too many submissions. Please try again in an hour.', 429);
      if (!(await budget(`daily/${date.slice(0, 10)}`, 50))) throw new InputError('The review queue has reached today’s limit. Please try again tomorrow.', 429);
      await store.claim(`pending/${id}.json`, { id, receivedAt: date, submission });
      return json(request, { receipt: id, state: 'queued' }, 202);
    } catch (error) {
      if (error instanceof InputError) return json(request, { error: error.message }, error.status);
      log('Anonymous intake storage failure');
      return json(request, { error: 'Your submission could not be saved. Please try again later.' }, 503);
    }
  }
  async function queueHandler(request) {
    if (!configured()) return json(request, { error: 'Service unavailable.' }, 503);
    if (!equal(request.headers.get('authorization'), `Bearer ${secret}`)) return json(request, { error: 'Unauthorized.' }, 401);
    try {
      if (request.method === 'GET') {
        if (new Date(now()).getUTCHours() === 0 && store.prune) {
          await Promise.all([store.prune('rate/', now() - 172800000), store.prune('daily/', now() - 172800000), store.prune('processed/', now() - 2592000000)]);
        }
        const entries = await store.list('pending/', 20);
        const items = (await Promise.all(entries.map(entry => store.read(entry.pathname)))).filter(Boolean);
        return json(request, { submissions: items });
      }
      if (request.method === 'POST') {
        const data = await readBody(request);
        if (!/^[a-f0-9]{64}$/.test(data.id || '') || !Number.isSafeInteger(data.issueNumber) || data.issueNumber <= 0) throw new InputError('Invalid acknowledgment.');
        const issueUrl = `https://github.com/${REPO}/issues/${data.issueNumber}`;
        await store.claim(`processed/${data.id}.json`, { issueUrl, createdAt: new Date(now()).toISOString() });
        await store.remove(`pending/${data.id}.json`);
        return json(request, { acknowledged: true });
      }
      return json(request, { error: 'Method not allowed.' }, 405);
    } catch (error) {
      if (error instanceof InputError) return json(request, { error: error.message }, error.status);
      log('Submission queue processing failure');
      return json(request, { error: 'Queue operation failed.' }, 503);
    }
  }
  return { publicHandler, queueHandler };
}

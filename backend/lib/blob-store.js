import { get, put, list, del } from '@vercel/blob';
export const store = {
  async read(path) {
    const response = await get(path, { access: 'private', useCache: false });
    if (!response) return null;
    return new Response(response.stream).json();
  },
  async claim(path, data) {
    try {
      await put(path, JSON.stringify(data), { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json' });
      return true;
    } catch (error) {
      // Confirm a collision by reading, rather than treating storage outages as
      // successful writes. Create-only writes serialize budget slots globally.
      if (await this.read(path)) return false;
      throw error;
    }
  },
  async prune(prefix, cutoff) {
    let cursor;
    do {
      const result = await list({ prefix, limit: 1000, cursor });
      const expired = result.blobs.filter(blob => new Date(blob.uploadedAt).getTime() < cutoff).map(blob => blob.pathname);
      if (expired.length) await del(expired);
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
  },
  async list(prefix, limit) { return (await list({ prefix, limit })).blobs; },
  async remove(path) { await del(path); },
};

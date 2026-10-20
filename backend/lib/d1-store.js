/** Private, strongly consistent queue storage using the Cloudflare D1 binding. */
export function createD1Store(db, now = Date.now) {
  // Prefix ranges use the primary-key index rather than scanning the database.
  const range = prefix => [prefix, prefix.slice(0, -1) + String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1)];
  return {
    async read(path) {
      const value = await db.prepare('SELECT value FROM intake_records WHERE pathname = ?').bind(path).first('value');
      return value === null ? null : JSON.parse(value);
    },
    async claim(path, data) {
      const result = await db.prepare('INSERT OR IGNORE INTO intake_records (pathname, value, created_at) VALUES (?, ?, ?)').bind(path, JSON.stringify(data), now()).run();
      return result.meta.changes === 1;
    },
    async list(prefix, limit) {
      const { results } = await db.prepare('SELECT pathname FROM intake_records WHERE pathname >= ? AND pathname < ? ORDER BY pathname LIMIT ?').bind(...range(prefix), Math.min(100, limit)).all();
      return results;
    },
    async remove(path) {
      await db.prepare('DELETE FROM intake_records WHERE pathname = ?').bind(path).run();
    },
    async prune(prefix, cutoff) {
      await db.prepare('DELETE FROM intake_records WHERE pathname >= ? AND pathname < ? AND created_at < ?').bind(...range(prefix), cutoff).run();
    },
  };
}

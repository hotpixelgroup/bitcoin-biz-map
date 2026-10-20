import { createIntake } from './lib/intake.js';
import { createD1Store } from './lib/d1-store.js';
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!['/api/submissions', '/api/queue'].includes(path)) return new Response('Not found', { status: 404 });
    const app = createIntake({
      store: env.DB ? createD1Store(env.DB) : null,
      secret: env.SUBMISSION_QUEUE_SECRET,
      ready: Boolean(env.DB),
    });
    return path === '/api/submissions' ? app.publicHandler(request) : app.queueHandler(request);
  },
};

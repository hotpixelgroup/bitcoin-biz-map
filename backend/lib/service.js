import { store } from './blob-store.js';
import { createIntake } from './intake.js';
export function service() {
  return createIntake({ store, secret: process.env.SUBMISSION_QUEUE_SECRET, ready: Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) });
}

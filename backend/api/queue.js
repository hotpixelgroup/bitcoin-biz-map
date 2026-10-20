import { service } from '../lib/service.js';
export const GET = request => service().queueHandler(request);
export const POST = request => service().queueHandler(request);

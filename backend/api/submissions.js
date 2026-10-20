import { service } from '../lib/service.js';
export const GET = request => service().publicHandler(request);
export const POST = request => service().publicHandler(request);
export const OPTIONS = request => service().publicHandler(request);

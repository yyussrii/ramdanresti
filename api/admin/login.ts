import { handleAdminLogin, type RequestWithBody } from '../_lib/mediaHandlers.js';
import type { ServerResponse } from 'node:http';

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  await handleAdminLogin(req, res);
}

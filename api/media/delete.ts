import { handleMediaDelete, type RequestWithBody } from '../_lib/mediaHandlers';
import type { ServerResponse } from 'node:http';

export default async function handler(req: RequestWithBody, res: ServerResponse) {
  await handleMediaDelete(req, res);
}

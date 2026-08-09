import { createServer } from 'node:http';
import { route } from './router';

const port = 3001;

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const response = await route({
    method: req.method ?? 'GET',
    path: url.pathname,
    body: chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined,
  });

  res.writeHead(response.statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(response.body));
}).listen(port, () => {
  console.log(`Local lambdalith API: http://localhost:${port}`);
});

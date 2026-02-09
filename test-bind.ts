import { createServer } from "node:http";

const server = createServer((_req, res) => {
  res.writeHead(200);
  res.end("ok");
});

server.listen(5002, () => {
  const _addr = server.address();
});

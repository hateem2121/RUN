import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("ok");
});

server.listen(5002, () => {
  const addr = server.address();
  console.log("Bound to:", addr);
});

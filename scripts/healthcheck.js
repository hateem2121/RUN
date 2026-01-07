import http from "node:http";

const options = {
  host: "localhost",
  port: process.env.PORT || 5001,
  path: "/api/health",
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", (_err) => {
  process.exit(1);
});

request.end();

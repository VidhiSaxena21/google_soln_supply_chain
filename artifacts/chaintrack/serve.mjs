import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { request as httpRequest } from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);
const API_PORT = parseInt(process.env.API_PORT || "5000", 10);
const DIST_DIR = path.join(__dirname, "dist", "public");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url?.split("?")[0] ?? "/";

  if (urlPath.startsWith("/api")) {
    const proxyReq = httpRequest(
      {
        hostname: "127.0.0.1",
        port: API_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Backend unavailable" }));
    });

    req.pipe(proxyReq);
    return;
  }

  let filePath = path.join(DIST_DIR, urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`ChainTrack serving at http://0.0.0.0:${PORT}/`);
});

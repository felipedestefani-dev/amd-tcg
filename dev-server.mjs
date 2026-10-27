import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchSealed } from "./lib/sealed.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = 5173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webp": "image/webp",
};

function sendFile(res, file) {
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Não encontrado");
      return;
    }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/sealed") {
    try {
      const items = await searchSealed(url.searchParams.get("q") || "");
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ items }));
    } catch {
      res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Falha ao consultar os lacrados." }));
    }
    return;
  }

  if (url.pathname === "/api/tcg") {
    const q = url.searchParams.get("q") || "";
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize")) || 12, 1), 200);
    const target = "https://api.pokemontcg.io/v2/cards?pageSize=" + pageSize + "&select=id,name,number,rarity,set,images&q=" + encodeURIComponent(q);
    try {
      const response = await fetch(target, { headers: { Accept: "application/json", "User-Agent": "AMD-TCG/1.0" } });
      const body = await response.text();
      res.writeHead(response.ok ? 200 : 502, { "content-type": "application/json; charset=utf-8" });
      res.end(body);
    } catch {
      res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Falha ao consultar o catálogo." }));
    }
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/admin") pathname = "/admin/index.html";
  const file = path.normalize(path.join(root, pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.stat(file, (error, stat) => {
    if (error) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Não encontrado");
      return;
    }
    sendFile(res, stat.isDirectory() ? path.join(file, "index.html") : file);
  });
});

server.listen(port, () => {
  console.log(`http://localhost:${port}`);
});

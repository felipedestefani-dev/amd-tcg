export default async function handler(req, res) {
  const q = req.query.q || "";
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 1), 200);
  const target = "https://api.pokemontcg.io/v2/cards?pageSize=" + pageSize + "&select=id,name,number,rarity,set,images&q=" + encodeURIComponent(q);
  try {
    const response = await fetch(target, {
      headers: { Accept: "application/json", "User-Agent": "AMD-TCG/1.0" },
    });
    const body = await response.text();
    res.status(response.ok ? 200 : 502).setHeader("content-type", "application/json; charset=utf-8").send(body);
  } catch {
    res.status(502).json({ error: "Falha ao consultar o catálogo." });
  }
}

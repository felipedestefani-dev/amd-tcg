export default async function handler(req, res) {
  try {
    const url = new URL(req.url || "/", "https://amdtcg.vercel.app");
    const q = (req.query && req.query.q) || url.searchParams.get("q") || "";
    const rawSize = (req.query && req.query.pageSize) || url.searchParams.get("pageSize");
    const pageSize = Math.min(Math.max(Number(rawSize) || 12, 1), 200);
    const target = "https://api.pokemontcg.io/v2/cards?pageSize=" + pageSize + "&select=id,name,number,rarity,set,images&q=" + encodeURIComponent(q);
    const response = await fetch(target, {
      headers: { Accept: "application/json", "User-Agent": "AMD-TCG/1.0" },
    });
    const body = await response.text();
    res.status(response.ok ? 200 : 502).setHeader("content-type", "application/json; charset=utf-8").send(body);
  } catch (error) {
    res.status(502).json({ error: "Falha ao consultar o catálogo." });
  }
}

import { searchSealed } from "../lib/sealed.mjs";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url || "/", "https://amdtcg.vercel.app");
    const q = (req.query && req.query.q) || url.searchParams.get("q") || "";
    const items = await searchSealed(q);
    res.status(200).json({ items });
  } catch (error) {
    res.status(502).json({ error: "Falha ao consultar os lacrados." });
  }
}

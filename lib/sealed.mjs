const ALIASES = [
  ["evolucoes prismaticas", "prismatic evolutions"],
  ["fagulhas impetuosas", "surging sparks"],
  ["coroa estelar", "stellar crown"],
  ["mega evolucao", "mega evolution"],
  ["escuridao absoluta", "pitch black"],
  ["caos ascendente", "chaos rising"],
  ["equilibrio perfeito", "perfect order"],
  ["herois excelsos", "ascended heroes"],
  ["fogo fantasmagorico", "phantasmal flames"],
  ["megaevolucao", "mega evolution"],
  ["mega evolucao", "mega evolution"],
  ["fogo branco", "white flare"],
  ["rivais predestinados", "destined rivals"],
  ["jornada conjunta", "journey together"],
];

const LABEL_ORDER = ["BB", "Mini BB", "ETB", "UPC", "Bundle", "Box", "Mini Tin", "Coleção"];

let groupsCache = null;
const productsCache = new Map();

function norm(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function labelOf(name) {
  const text = name.toLowerCase();
  if (/code card|digital bundle|sam's club|costco/.test(text)) return "";
  if (/\bcase\b/.test(text) || /\bdisplay\b/.test(text)) return "";
  if (/\[set of|set of \d/.test(text)) return "";
  if (/half booster box|mini booster box/.test(text)) return "Mini BB";
  if (/booster box/.test(text)) return "BB";
  if (/elite trainer box/.test(text)) return "ETB";
  if (/ultra[- ]premium collection/.test(text)) return "UPC";
  if (/booster bundle/.test(text)) return "Bundle";
  if (/mini tin/.test(text)) return "Mini Tin";
  if (/premium collection|super-premium collection|poster collection/.test(text)) return "Coleção";
  if (/\bbox\b/.test(text) && !/booster pack/.test(text)) return "Box";
  return "";
}

function needles(query) {
  const base = norm(query);
  const extra = [];
  for (const [from, to] of ALIASES) {
    if (base.includes(from) || (base.length >= 3 && from.includes(base))) extra.push(to);
  }
  return [...new Set([base, ...extra].filter((item) => item.length >= 2))];
}

function score(group, needle) {
  const name = norm(group.name);
  const abbr = norm(group.abbreviation || "");
  if (abbr && abbr === needle) return 120;
  if (name === needle) return 100;
  const tail = name.split(":").pop().trim();
  if (tail === needle) return 90;
  if (name.includes(needle)) return 40 + Math.min(needle.length, 24);
  return 0;
}

async function readJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "AMD-TCG/1.0" } });
  if (!response.ok) throw new Error("Falha ao consultar os lacrados.");
  return response.json();
}

async function groups() {
  if (!groupsCache) {
    const payload = await readJson("https://tcgcsv.com/tcgplayer/3/groups");
    groupsCache = (payload.results || []).filter((group) => !group.isSupplemental);
  }
  return groupsCache;
}

async function products(groupId) {
  if (!productsCache.has(groupId)) {
    const payload = await readJson("https://tcgcsv.com/tcgplayer/3/" + groupId + "/products");
    productsCache.set(groupId, payload.results || []);
  }
  return productsCache.get(groupId);
}

export async function searchSealed(query) {
  const terms = needles(query);
  if (!terms.length) return [];
  const list = await groups();
  const ranked = list
    .map((group) => ({ group, score: Math.max(...terms.map((term) => score(group, term))) }))
    .filter((item) => item.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const items = [];
  for (const { group } of ranked) {
    const rows = await products(group.groupId);
    for (const row of rows) {
      const label = labelOf(row.name || "");
      if (!label || !row.imageUrl) continue;
      items.push({
        productId: row.productId,
        name: row.name,
        label,
        image: row.imageUrl,
        group: group.name,
      });
    }
  }
  items.sort((a, b) => LABEL_ORDER.indexOf(a.label) - LABEL_ORDER.indexOf(b.label) || a.name.localeCompare(b.name));
  return items.slice(0, 48);
}

(function () {
  const root = document.getElementById("app");
  const shop = window.AMD_SHOP;
  const localSets = shop.sets.map((set, index) => ({ id: set.id, name: set.name, code: set.code, sort: index }));
  const localProducts = shop.products.map((product) => ({ ...product }));
  let sb = null;
  let session = null;
  let editing = null;
  let pickedSet = null;
  let searchTimer = 0;
  let view = "home";
  let catalog = [];
  let catalogError = "";
  let stockQuery = "";
  let stockKind = "all";
  let draftImage = "";
  let printings = [];
  let nameCards = [];
  let chosenName = "";
  let stockLevel = "all";
  let visitRange = "month";
  let visitFrom = "";
  let visitTo = "";
  let visits = [];
  let visitsError = "";
  let sealedItems = [];
  let sealedType = "Todos";
  let sealedTimer = 0;

  const RARITY = {
    Common: "Comum",
    Uncommon: "Incomum",
    Rare: "Rara",
    "Double Rare": "Dupla rara",
    "Illustration Rare": "Ilustração rara",
    "Special Illustration Rare": "Ilustração especial",
    "Ultra Rare": "Ultra rara",
    "Hyper Rare": "Hiper rara",
    "Rare Holo": "Rara holográfica",
  };

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(value) {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function setLogo(id) {
    return `https://images.pokemontcg.io/${id}/logo.png`;
  }

  function fitSetImage(img) {
    const symbol = () => {
      if (img.dataset.symbol) { img.hidden = true; return; }
      img.dataset.symbol = "1";
      img.src = img.src.replace("/logo.png", "/symbol.png");
    };
    img.onload = () => {
      const card = img.naturalHeight > img.naturalWidth * 1.05;
      if (!card) { img.hidden = false; return; }
      symbol();
    };
    img.onerror = symbol;
  }

  function fold(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function edits(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      }
    }
    return rows[a.length][b.length];
  }

  function setHits(query) {
    const words = fold(query).split(/\s+/).filter((word) => word.length > 1);
    if (!words.length) return [];
    return shop.sets.filter((set) => {
      const parts = fold(`${set.name} ${set.en || ""} ${set.code} ${set.id}`).split(/\s+/).filter(Boolean);
      const blob = parts.join(" ");
      return words.every((word) => blob.includes(word) || parts.some((part) => edits(part, word) <= (word.length >= 6 ? 2 : 1)));
    }).slice(0, 8);
  }

  function setHitHtml(set) {
    return `<button class="set-hit" type="button" data-set="${esc(set.id)}"><img src="${esc(setLogo(set.id))}" alt="" /><span><strong>${esc(set.name)}</strong><small>${esc(set.code)}</small></span></button>`;
  }

  function bindSetSearch(input, box, onPick) {
    const paint = () => {
      const found = setHits(input.value);
      if (!input.value.trim()) { box.hidden = true; box.innerHTML = ""; return; }
      box.hidden = false;
      box.innerHTML = found.length ? found.map(setHitHtml).join("") : `<p class="set-empty">Nenhuma coleção.</p>`;
      box.querySelectorAll("img").forEach(fitSetImage);
      box.querySelectorAll("[data-set]").forEach((button) => {
        button.onclick = () => onPick(shop.sets.find((set) => set.id === button.dataset.set));
      });
    };
    input.addEventListener("input", paint);
  }

  function field(name, label, value, type) {
    return `<label>${esc(label)}<input name="${esc(name)}" type="${type || "text"}" value="${esc(value)}" /></label>`;
  }

  function loginScreen() {
    return `
      <div class="login-wrap">
        <section class="login-card">
          <a class="brand" href="/">
            <img src="/assets/logo-mark.png?v=8" alt="A.M.D TCG" width="140" height="96" />
          </a>
          <h1>Painel</h1>
          <p>Entre com o e-mail e a senha do administrador.</p>
          <form id="login" class="fields">
            ${field("email", "E-mail", "", "email")}
            ${field("password", "Senha", "", "password")}
            <button class="solid" type="submit">Entrar</button>
          </form>
          <p class="msg" id="login-msg"></p>
          <a class="login-back" href="/">Voltar para a loja</a>
        </section>
      </div>`;
  }

  function productForm(product, kind) {
    const mode = product?.kind || kind || "single";
    const sealed = mode === "sealed";
    const p = product || { id: "", kind: mode, name: "", set_id: "", number: "", rarity: "", condition: sealed ? "" : "NM", lang: sealed ? "" : "PT", finish: sealed ? "Lacrado" : "Normal", qty: 1, price: "" };
    const file = String(p.number || "").split("/")[0];
    const auto = !sealed && file && p.set_id ? `https://images.pokemontcg.io/${esc(p.set_id)}/${esc(file)}.png` : "";
    const chosen = product && shop.sets.find((set) => set.id === product.set_id);
    const preview = draftImage || auto;
    const search = sealed ? `
        <label>Produto<input id="sealed-q" type="search" placeholder="Coleção, ex. Evoluções Prismáticas" autocomplete="off" /></label>
        <div id="sealed-types" class="name-picks"></div>
        <div id="sealed-hits" class="print-grid"></div>` : `
        <label>Nome<input id="poke-name" type="search" placeholder="Ex. Charizard V do Lance" autocomplete="off" /></label>
        <div id="poke-names" class="name-picks"></div>
        <label>Número<input id="poke-number" type="search" placeholder="Número ou código, ex. SWSH133" autocomplete="off" /></label>
        <div id="card-hits" class="print-grid"></div>`;
    const specifics = sealed ? `
        <input type="hidden" name="number" value="${esc(p.number)}" />
        <input type="hidden" name="rarity" value="${esc(p.rarity)}" />
        <input type="hidden" name="condition" value="${esc(p.condition)}" />
        <input type="hidden" name="lang" value="${esc(p.lang)}" />
        <input type="hidden" name="finish" value="${esc(p.finish || "Lacrado")}" />
        <div class="row-2">${field("qty", "Quantidade", p.qty, "number")}${field("price", "Preço", p.price, "number")}</div>` : `
        <div class="row-2">${field("number", "Número", p.number)}${field("rarity", "Raridade", p.rarity)}</div>
        <div class="row-2">${field("condition", "Condição", p.condition)}${field("lang", "Idioma", p.lang)}</div>
        <div class="row-2">${field("finish", "Acabamento", p.finish)}${field("qty", "Quantidade", p.qty, "number")}</div>
        ${field("price", "Preço", p.price, "number")}`;
    return `
      <form id="editor" class="fields">
        <h2>${product ? (sealed ? "Produto" : "Carta") : (sealed ? "Adicionar produto" : "Adicionar carta")}</h2>
        <input type="hidden" name="kind" value="${sealed ? "sealed" : "single"}" />
        ${search}
        <div class="photo-box">
          ${preview ? `<img id="card-preview" class="card-preview" src="${esc(preview)}" alt="" />` : `<div id="card-preview" class="card-preview empty">Sem foto</div>`}
          <div class="photo-actions">
            <label class="ghost photo-btn"><img src="/assets/icons/search.png" alt="" />Adicionar foto<input id="photo-file" type="file" accept="image/*" hidden /></label>
            <button class="ghost" type="button" id="photo-clear">Tirar foto</button>
            <p>Foto que aparece na loja.</p>
          </div>
        </div>
        <div class="row-2">${field("id", "Código", p.id)}${field("name", "Nome", p.name)}</div>
        <div class="set-field">
          <span>Coleção</span>
          <div class="set-pick">
            <input type="hidden" name="set_id" value="${esc(chosen ? chosen.id : "")}" />
            <div class="set-chosen" id="set-chosen" ${chosen ? "" : "hidden"}>
              <img src="${chosen ? esc(setLogo(chosen.id)) : ""}" alt="" />
              <strong>${chosen ? esc(chosen.name) : ""}</strong>
              <button class="ghost" type="button" id="set-clear">Trocar</button>
            </div>
            <input id="set-pick-q" class="set-find" type="search" placeholder="Buscar coleção" autocomplete="off" ${chosen ? "hidden" : ""} />
            <div id="set-pick-results" class="set-results" hidden></div>
          </div>
        </div>
        ${specifics}
        <div class="actions">
          <button class="solid" type="submit">${product ? "Salvar" : "Adicionar"}</button>
          ${product ? `<button class="ghost" type="button" id="copy">Duplicar</button>` : ""}
          ${product ? `<button class="ghost danger" type="button" id="remove">Apagar</button>` : ""}
          <button class="ghost" type="button" id="cancel">Cancelar</button>
        </div>
      </form>`;
  }

  async function refreshSets() {
    const { data, error } = await sb.from("sets").select("id,name,code,sort").order("sort");
    if (!error && data) {
      for (const set of data) {
        if (!shop.sets.some((item) => item.id === set.id)) shop.sets.push({ id: set.id, name: set.name, code: set.code });
      }
    }
  }

  function thumb(product) {
    if (product.image) return product.image;
    if (product.kind === "sealed" || !product.number) return "";
    const number = String(product.number).split("/")[0];
    return `https://images.pokemontcg.io/${product.set_id}/${number}.png`;
  }

  function setName(id) {
    return shop.sets.find((set) => set.id === id)?.name || id || "Sem coleção";
  }

  function stockList() {
    const query = stockQuery.trim().toLowerCase();
    return catalog.filter((product) => {
      if (stockKind !== "all" && product.kind !== stockKind) return false;
      if (!query) return true;
      return `${product.name} ${product.number} ${product.set_id} ${setName(product.set_id)}`.toLowerCase().includes(query);
    });
  }

  function productRows(list) {
    if (catalogError) return `<p class="msg">${esc(catalogError)}</p>`;
    if (!list.length) return `<p class="empty">Nenhum item por aqui.</p>`;
    return list.map((product) => {
      const image = thumb(product);
      return `
        <div class="prow">
          <button class="prow-open" type="button" data-id="${esc(product.id)}">
            ${image ? `<img class="thumb" src="${esc(image)}" alt="" />` : `<span class="thumb"></span>`}
            <span><strong>${esc(product.name)}</strong><span>${esc(setName(product.set_id))}${product.number ? " · " + esc(product.number) : ""} · ${product.qty} un.</span></span>
          </button>
          <div class="qty-step">
            <button type="button" data-qty="-1" data-id="${esc(product.id)}" aria-label="Diminuir">−</button>
            <b>${product.qty}</b>
            <button type="button" data-qty="1" data-id="${esc(product.id)}" aria-label="Aumentar">+</button>
          </div>
          <strong>${esc(money(product.price))}</strong>
          <button class="ghost danger row-delete" type="button" data-remove="${esc(product.id)}">Excluir</button>
        </div>`;
    }).join("");
  }

  function shell(title, lede, body) {
    const item = (id, label, icon) => `<button type="button" data-view="${id}" class="${view === id ? "is-on" : ""}"><img src="${icon}" alt="" />${label}</button>`;
    return `
      <div class="desk">
        <aside class="desk-side">
          <a class="brand" href="/admin">
            <img src="/assets/logo-mark.png?v=8" alt="" width="76" height="76" />
            <span>A.M.D<small>Painel</small></span>
          </a>
          <nav class="desk-nav">
            ${item("home", "Visão geral", "/assets/icons/home.png")}
            ${item("stock", "Vitrine", "/assets/icons/cards.png")}
            ${item("estoque", "Estoque", "/assets/icons/sealed.png")}
            ${item("sets", "Coleções", "/assets/icons/sets.png")}
            ${item("visits", "Visitas", "/assets/icons/search.png")}
          </nav>
          <div class="desk-tools">
            <button class="ghost" type="button" id="sair">Sair</button>
            <a class="desk-store" href="/"><img src="/assets/icons/home.png" alt="" />Ver loja</a>
          </div>
        </aside>
        <section class="desk-main">
          <header class="desk-head">
            <div><h1>${title}</h1><p>${esc(lede)}</p></div>
          </header>
          ${body}
          <p class="msg" id="desk-msg"></p>
        </section>
      </div>`;
  }

  function homeView() {
    const singles = catalog.filter((product) => product.kind === "single");
    const sealed = catalog.filter((product) => product.kind === "sealed");
    const units = catalog.reduce((sum, product) => sum + Number(product.qty || 0), 0);
    const value = catalog.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.qty || 0), 0);
    const low = catalog.filter((product) => Number(product.qty) <= 1).slice(0, 6);
    return shell("Visão geral", session.user.email, `
      <div class="stats">
        <article class="stat"><span>Itens</span><b>${catalog.length}</b></article>
        <article class="stat"><span>Avulsos</span><b>${singles.length}</b></article>
        <article class="stat"><span>Lacrados</span><b>${sealed.length}</b></article>
        <article class="stat"><span>Em estoque</span><b>${money(value)}</b></article>
      </div>
      <section class="panel">
        <h2>${units} ${units === 1 ? "unidade" : "unidades"} na vitrine</h2>
        <p>${low.length ? "Estoque baixo ou zerado:" : "Nenhum item com estoque baixo."}</p>
        <div class="plist">${productRows(low)}</div>
        <div class="actions">
          <button class="solid" type="button" id="add-card">Adicionar carta</button>
          <button class="solid" type="button" id="add-product">Adicionar produto</button>
        </div>
      </section>`);
  }

  function estoqueRows() {
    const query = stockQuery.trim().toLowerCase();
    return catalog.filter((product) => {
      const qty = Number(product.qty);
      if (stockLevel === "low" && qty > 1) return false;
      if (stockLevel === "out" && qty > 0) return false;
      if (!query) return true;
      return `${product.name} ${product.number} ${setName(product.set_id)}`.toLowerCase().includes(query);
    });
  }

  function estoqueView() {
    const rows = estoqueRows();
    const units = catalog.reduce((sum, product) => sum + Number(product.qty || 0), 0);
    const value = catalog.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.qty || 0), 0);
    return shell("Estoque", "Quantidade, itens baixos e valor parado.", `
      <div class="stats">
        <article class="stat"><span>Unidades</span><b>${units}</b></article>
        <article class="stat"><span>Valor</span><b>${money(value)}</b></article>
        <article class="stat"><span>Baixo</span><b>${catalog.filter((product) => Number(product.qty) <= 1).length}</b></article>
        <article class="stat"><span>Zerado</span><b>${catalog.filter((product) => Number(product.qty) === 0).length}</b></article>
      </div>
      <div class="toolbar">
        <input id="stock-q" type="search" placeholder="Buscar no estoque" value="${esc(stockQuery)}" />
        <select id="stock-level">
          <option value="all" ${stockLevel === "all" ? "selected" : ""}>Tudo</option>
          <option value="low" ${stockLevel === "low" ? "selected" : ""}>Estoque baixo</option>
          <option value="out" ${stockLevel === "out" ? "selected" : ""}>Zerado</option>
        </select>
      </div>
      <div class="plist" id="plist">${productRows(rows)}</div>`);
  }

  function pageLabel(path) {
    if (!path || path === "#/" || path === "#") return "Catálogo";
    if (path.startsWith("#/carta")) return "Carta";
    if (path.startsWith("#/set")) return "Coleção";
    const names = {
      "#/avulsos": "Avulsos",
      "#/lacrados": "Lacrados",
      "#/colecoes": "Coleções",
      "#/contato": "Contato",
      "#/sobre": "Sobre",
      "#/cadastro": "Cadastro",
      "#/entrar": "Entrar",
    };
    return names[path] || path;
  }

  function visitWindow() {
    const now = new Date();
    if (visitRange === "all") return { from: null, to: null };
    if (visitRange === "custom" && visitFrom && visitTo) {
      return { from: new Date(visitFrom + "T00:00:00"), to: new Date(visitTo + "T23:59:59") };
    }
    const from = new Date(now.getFullYear(), now.getMonth() + (visitRange === "prev" ? -1 : 0), 1);
    const to = visitRange === "prev" ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) : now;
    return { from, to };
  }

  function visitsView() {
    if (visitsError) {
      const sql = visitsError.includes("visits") ? `<p>Rode no SQL Editor:</p><pre class="sql">create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null default '/',
  visitor text not null default '',
  city text not null default ''
);
alter table public.visits enable row level security;
create policy "registrar visita" on public.visits for insert to anon, authenticated with check (true);
create policy "ler visitas" on public.visits for select to authenticated using (true);</pre>` : "";
      return shell("Visitas", "Quantas pessoas entraram no catálogo.", `<section class="panel"><p class="msg">${esc(visitsError)}</p>${sql}</section>`);
    }
    const { from, to } = visitWindow();
    const rows = visits.filter((visit) => {
      const when = new Date(visit.created_at);
      if (from && when < from) return false;
      if (to && when > to) return false;
      return true;
    });
    const people = new Set(rows.map((visit) => visit.visitor).filter(Boolean));
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayPeople = new Set(rows.filter((visit) => String(visit.created_at).slice(0, 10) === todayKey).map((visit) => visit.visitor));
    const perDay = new Map();
    rows.forEach((visit) => {
      const key = String(visit.created_at).slice(0, 10);
      if (!perDay.has(key)) perDay.set(key, new Set());
      if (visit.visitor) perDay.get(key).add(visit.visitor);
    });
    const days = [...perDay.keys()].sort();
    const max = Math.max(1, ...days.map((day) => perDay.get(day).size));
    const bars = days.map((day) => {
      const count = perDay.get(day).size;
      const label = day.slice(8, 10) + "/" + day.slice(5, 7);
      return `<div class="bar"><b>${count}</b><span style="height:${Math.max(6, Math.round(count / max * 120))}px"></span><small>${label}</small></div>`;
    }).join("");
    const pages = new Map();
    rows.forEach((visit) => pages.set(visit.path, (pages.get(visit.path) || 0) + 1));
    const pageRows = [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const pageMax = pageRows[0]?.[1] || 1;
    const cities = new Map();
    rows.forEach((visit) => {
      const city = visit.city || "Não informado";
      cities.set(city, (cities.get(city) || 0) + 1);
    });
    const cityRows = [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const cityMax = cityRows[0]?.[1] || 1;
    return shell("Visitas", "Quantas pessoas entraram no catálogo e o que viram.", `
      <div class="toolbar">
        <button class="ghost ${visitRange === "month" ? "is-on" : ""}" type="button" data-range="month">Este mês</button>
        <button class="ghost ${visitRange === "prev" ? "is-on" : ""}" type="button" data-range="prev">Mês anterior</button>
        <button class="ghost ${visitRange === "all" ? "is-on" : ""}" type="button" data-range="all">Todos</button>
        <input id="visit-from" type="date" value="${esc(visitFrom)}" />
        <input id="visit-to" type="date" value="${esc(visitTo)}" />
      </div>
      <div class="stats">
        <article class="stat dark"><img src="/assets/icons/visits-people.svg" alt="" /><span>Pessoas</span><b>${people.size}</b></article>
        <article class="stat"><img src="/assets/icons/visits-pages.svg" alt="" /><span>Páginas vistas</span><b>${rows.length}</b></article>
        <article class="stat"><img src="/assets/icons/visits-today.svg" alt="" /><span>Hoje</span><b>${todayPeople.size}</b></article>
      </div>
      <section class="panel">
        <h2 class="with-icon"><img src="/assets/icons/visits-people.svg" alt="" />Pessoas por dia</h2>
        <div class="bars">${bars || `<p class="empty">Nenhuma visita neste período.</p>`}</div>
      </section>
      <div class="split">
        <section class="panel">
          <h2 class="with-icon"><img src="/assets/icons/visits-pages.svg" alt="" />Páginas mais vistas</h2>
          ${pageRows.map(([path, count]) => `<div class="rank"><span>${esc(pageLabel(path))}</span><strong>${count}</strong><small>${rows.length ? Math.round(count / rows.length * 100) : 0}%</small><i style="width:${Math.round(count / pageMax * 100)}%"></i></div>`).join("") || `<p class="empty">Sem páginas.</p>`}
        </section>
        <section class="panel">
          <h2 class="with-icon"><img src="/assets/icons/visits-city.svg" alt="" />Cidades</h2>
          ${cityRows.map(([city, count]) => `<div class="rank"><span>${esc(city)}</span><strong>${count}</strong><small>${rows.length ? Math.round(count / rows.length * 100) : 0}%</small><i style="width:${Math.round(count / cityMax * 100)}%"></i></div>`).join("") || `<p class="empty">Sem cidades.</p>`}
          <h2 class="with-icon">Últimos IPs</h2>
          ${rows.slice(0, 6).map((visit) => {
            const when = new Date(visit.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
            const ip = /^\d{1,3}(\.\d{1,3}){3}$/.test(visit.visitor || "") || String(visit.visitor || "").includes(":") ? visit.visitor : "Sem IP";
            return `<div class="rank"><span>${esc(ip)}</span><strong>${esc(visit.city || "—")}</strong><small>${esc(when)}</small></div>`;
          }).join("") || `<p class="empty">Nenhum acesso.</p>`}
        </section>
      </div>`);
  }

  function stockView() {
    return shell("Vitrine", "Cartas, lacrados, preço e quantidade.", `
      <div class="toolbar">
        <input id="stock-q" type="search" placeholder="Buscar na vitrine" value="${esc(stockQuery)}" />
        <select id="stock-kind">
          <option value="all" ${stockKind === "all" ? "selected" : ""}>Tudo</option>
          <option value="single" ${stockKind === "single" ? "selected" : ""}>Avulsos</option>
          <option value="sealed" ${stockKind === "sealed" ? "selected" : ""}>Lacrados</option>
        </select>
        <button class="solid" type="button" id="add-card">Adicionar carta</button>
        <button class="solid" type="button" id="add-product">Adicionar produto</button>
        <button class="ghost" type="button" id="seed">Enviar vitrine de exemplo</button>
      </div>
      <div id="editor-slot"></div>
      <div class="plist" id="plist">${productRows(stockList())}</div>`);
  }

  function setsView() {
    return shell("Coleções", "Escreva o nome para ver a coleção.", `
      <div class="set-pick">
        <input id="set-q" class="set-find" type="search" placeholder="Buscar coleção" autocomplete="off" />
        <div id="set-results" class="set-results" hidden></div>
      </div>
      <section class="panel">
        <h2>Nova coleção</h2>
        <form id="set-form" class="fields">
          <div class="row-2">${field("id", "Código", "")}${field("code", "Sigla", "")}</div>
          ${field("name", "Nome", "")}
          <div class="actions"><button class="solid" type="submit">Adicionar coleção</button></div>
        </form>
      </section>`);
  }

  function bindDesk() {
    root.querySelectorAll("[data-view]").forEach((button) => {
      button.onclick = () => { view = button.dataset.view; editing = null; paintDesk(); };
    });
    document.getElementById("sair").onclick = async () => { await sb.auth.signOut(); session = null; paint(); };
    const openNew = async (kind) => {
      view = "stock";
      editing = null;
      await paintDesk();
      openEditor(null, kind);
    };
    const addCard = document.getElementById("add-card");
    const addProduct = document.getElementById("add-product");
    if (addCard) addCard.onclick = () => openNew("single");
    if (addProduct) addProduct.onclick = () => openNew("sealed");
    const setQuery = document.getElementById("set-q");
    const setResults = document.getElementById("set-results");
    if (setQuery && setResults) bindSetSearch(setQuery, setResults, (set) => { if (set) editSet(set.id); });
    const seedButton = document.getElementById("seed");
    if (seedButton) seedButton.onclick = seed;
    const list = document.getElementById("plist");
    if (list) list.addEventListener("click", async (event) => {
      const removeBtn = event.target.closest("[data-remove]");
      if (removeBtn) {
        const product = catalog.find((item) => item.id === removeBtn.dataset.remove);
        if (product && confirm(`Excluir ${product.name}?`)) {
          editing = product;
          removeProduct();
        }
        return;
      }
      const step = event.target.closest("[data-qty]");
      if (step) { changeQty(step.dataset.id, Number(step.dataset.qty)); return; }
      const button = event.target.closest(".prow-open");
      if (!button) return;
      const product = catalog.find((item) => item.id === button.dataset.id);
      if (document.getElementById("editor-slot")) openEditor(product);
      else { view = "stock"; editing = product; await paintDesk(); }
    });
    const query = document.getElementById("stock-q");
    if (query) query.addEventListener("input", () => {
      stockQuery = query.value;
      const rows = view === "estoque" ? estoqueRows() : stockList();
      document.getElementById("plist").innerHTML = productRows(rows);
    });
    const level = document.getElementById("stock-level");
    if (level) level.onchange = () => { stockLevel = level.value; document.getElementById("plist").innerHTML = productRows(estoqueRows()); };
    root.querySelectorAll("[data-range]").forEach((button) => {
      button.onclick = () => { visitRange = button.dataset.range; paintDesk(); };
    });
    const fromInput = document.getElementById("visit-from");
    const toInput = document.getElementById("visit-to");
    if (fromInput && toInput) {
      const applyRange = () => {
        visitFrom = fromInput.value;
        visitTo = toInput.value;
        if (visitFrom && visitTo) visitRange = "custom";
        paintDesk();
      };
      fromInput.onchange = applyRange;
      toInput.onchange = applyRange;
    }
    const kind = document.getElementById("stock-kind");
    if (kind) kind.onchange = () => { stockKind = kind.value; document.getElementById("plist").innerHTML = productRows(stockList()); };
    const setForm = document.getElementById("set-form");
    if (setForm) setForm.addEventListener("submit", saveSet);
  }

  async function paintDesk() {
    await refreshSets();
    const { data, error } = await sb.from("products").select("*").order("name");
    catalog = data || [];
    catalogError = error ? error.message : "";
    if (view === "visits") {
      const result = await sb.from("visits").select("created_at,path,visitor,city").order("created_at", { ascending: false }).limit(4000);
      visits = result.data || [];
      visitsError = result.error ? result.error.message : "";
    }
    const viewHtml = view === "visits" ? visitsView() : view === "sets" ? setsView() : view === "stock" ? stockView() : view === "estoque" ? estoqueView() : homeView();
    root.innerHTML = viewHtml;
    bindDesk();
    if (view === "stock" && editing) openEditor(editing);
  }

  function editSet(id) {
    const set = shop.sets.find((item) => item.id === id);
    if (!set) return;
    const form = document.getElementById("set-form");
    form.elements.id.value = set.id;
    form.elements.code.value = set.code;
    form.elements.name.value = set.name;
    form.querySelector("button").textContent = "Salvar coleção";
    if (!form.querySelector("#remove-set")) {
      form.querySelector(".actions").insertAdjacentHTML("beforeend", `<button class="ghost danger" type="button" id="remove-set">Apagar</button>`);
    }
    document.getElementById("remove-set").onclick = () => removeSet(set.id);
  }

  async function removeSet(id) {
    const msg = document.getElementById("desk-msg");
    if (catalog.some((product) => product.set_id === id)) {
      msg.textContent = "Essa coleção ainda tem itens na vitrine.";
      return;
    }
    const { error } = await sb.from("sets").delete().eq("id", id);
    msg.textContent = error ? error.message : "Coleção apagada.";
    if (!error) paintDesk();
  }

  async function saveSet(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const row = {
      id: String(form.get("id") || "").trim(),
      name: String(form.get("name") || "").trim(),
      code: String(form.get("code") || "").trim(),
      sort: shop.sets.findIndex((set) => set.id === String(form.get("id") || "").trim()),
    };
    const msg = document.getElementById("desk-msg");
    if (!row.id || !row.name || !row.code) { msg.textContent = "Código, sigla e nome são obrigatórios."; return; }
    if (row.sort < 0) row.sort = shop.sets.length;
    const { error } = await sb.from("sets").upsert(row);
    msg.textContent = error ? error.message : "Coleção salva.";
    if (!error) paintDesk();
  }

  function autoArt() {
    const form = document.getElementById("editor");
    if (!form) return "";
    const number = String(form.elements.number.value || "").split("/")[0];
    const setId = form.elements.set_id.value;
    if (!number || !setId) return "";
    return `https://images.pokemontcg.io/${setId}/${number}.png`;
  }

  function showPreview(src) {
    const current = document.getElementById("card-preview");
    if (!current) return;
    if (!src) {
      current.outerHTML = `<div id="card-preview" class="card-preview empty">Sem foto</div>`;
      return;
    }
    if (current.tagName === "IMG") current.src = src;
    else current.outerHTML = `<img id="card-preview" class="card-preview" src="${esc(src)}" alt="" />`;
  }

  function readPhoto(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler a foto.")); };
      image.src = url;
    });
  }

  async function changeQty(id, delta) {
    const product = catalog.find((item) => item.id === id);
    if (!product) return;
    const qty = Math.max(0, Number(product.qty) + delta);
    const { error } = await sb.from("products").update({ qty }).eq("id", id);
    const msg = document.getElementById("desk-msg");
    if (error) { if (msg) msg.textContent = error.message; return; }
    paintDesk();
  }

  async function duplicateProduct() {
    if (!editing) return;
    const row = { ...editing, id: `${editing.id}-copia-${Date.now().toString(36).slice(-4)}`, name: editing.name };
    delete row.created_at;
    const { error } = await sb.from("products").upsert(row);
    const msg = document.getElementById("desk-msg");
    msg.textContent = error ? error.message : "Item duplicado.";
    if (!error) { editing = null; paintDesk(); }
  }

  function openEditor(product, kind) {
    const mode = product?.kind || kind || "single";
    editing = product;
    draftImage = product?.image || "";
    const slot = document.getElementById("editor-slot");
    slot.innerHTML = `<div class="panel" style="box-shadow:none">${productForm(product, mode)}</div>`;
    document.getElementById("cancel").onclick = () => { slot.innerHTML = ""; draftImage = ""; };
    const remove = document.getElementById("remove");
    if (remove) remove.onclick = removeProduct;
    const copy = document.getElementById("copy");
    if (copy) copy.onclick = duplicateProduct;
    document.getElementById("photo-file").addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        draftImage = await readPhoto(file);
        showPreview(draftImage);
      } catch (error) {
        document.getElementById("desk-msg").textContent = error.message;
      }
    });
    document.getElementById("photo-clear").onclick = () => {
      draftImage = "";
      showPreview(mode === "sealed" ? "" : autoArt());
    };
    document.getElementById("editor").addEventListener("submit", saveProduct);
    const pick = document.getElementById("set-pick-q");
    const pickResults = document.getElementById("set-pick-results");
    const chosenBox = document.getElementById("set-chosen");
    const showChosen = (set) => {
      document.querySelector("#editor [name=set_id]").value = set.id;
      chosenBox.hidden = false;
      const logo = chosenBox.querySelector("img");
      logo.hidden = false;
      delete logo.dataset.symbol;
      logo.src = setLogo(set.id);
      fitSetImage(logo);
      chosenBox.querySelector("strong").textContent = set.name;
      pick.value = "";
      pick.hidden = true;
      pickResults.hidden = true;
    };
    bindSetSearch(pick, pickResults, (set) => { if (set) showChosen(set); });
    document.getElementById("set-clear").onclick = () => {
      document.querySelector("#editor [name=set_id]").value = "";
      chosenBox.hidden = true;
      pick.hidden = false;
      pick.focus();
    };
    if (mode === "sealed") {
      const input = document.getElementById("sealed-q");
      input.addEventListener("input", () => {
        clearTimeout(sealedTimer);
        sealedTimer = setTimeout(() => searchSealedProducts(input.value), 350);
      });
      return;
    }
    const nameInput = document.getElementById("poke-name");
    nameInput.addEventListener("input", () => {
      chosenName = "";
      printings = [];
      document.getElementById("card-hits").innerHTML = "";
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => searchPokemonNames(nameInput.value), 350);
    });
    document.getElementById("poke-number").addEventListener("input", renderPrintings);
  }

  function parseCardSearch(text) {
    const raw = text.trim();
    if (!raw) return null;
    const fraction = raw.match(/(\d{1,4}[a-zA-Z]?)\s*\/\s*(\d{2,4})/);
    if (fraction) {
      const name = raw.slice(0, fraction.index).replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
      return { name, number: fraction[1], printed: fraction[2] };
    }
    const tail = raw.match(/^(.*\S)\s+(\d{1,4}[a-zA-Z]?)$/);
    if (tail) return { name: tail[1].trim(), number: tail[2], printed: "" };
    if (/^\d{1,4}[a-zA-Z]?$/.test(raw)) return { name: "", number: raw, printed: "" };
    return { name: raw, number: "", printed: "" };
  }

  function numberVariants(number) {
    const variants = [number];
    if (/^\d+$/.test(number)) {
      variants.push(String(Number(number)));
      variants.push(String(Number(number)).padStart(3, "0"));
    }
    return [...new Set(variants.filter(Boolean))];
  }

  function sameNumber(cardNumber, wanted) {
    const left = String(cardNumber).replace(/^0+(?=\d)/, "").toLowerCase();
    const right = String(wanted).replace(/^0+(?=\d)/, "").toLowerCase();
    return left === right;
  }

  function nameMatches(cardName, query) {
    if (!query) return true;
    const hay = cardName.toLowerCase();
    return query.toLowerCase().split(/\s+/).every((word) => hay.includes(word));
  }

  function matchesPrinted(card, printed) {
    if (!printed) return true;
    const total = Number(printed);
    return card.set.printedTotal === total || card.set.total === total;
  }

  function setLabel(card) {
    const known = shop.sets.find((set) => set.id === card.set?.id);
    if (card.set?.id === "swshp") return "Promo SWSH";
    return known?.name || card.set?.name || "Promo";
  }

  function ligaNumber(card) {
    const number = String(card.number || "").trim();
    if (!number) return "Sem número";
    if (/^(SWSH|SM|XY|BW|DP|HGSS)/i.test(number) || (String(card.set?.id || "").endsWith("p") && !/^\d+$/.test(number))) return number.toUpperCase();
    const total = card.set.printedTotal || card.set.total;
    return total ? `${number}/${total}` : number;
  }

  function foldText(text) {
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/shw/g, "swsh");
  }

  function searchTokens(text) {
    const raw = foldText(text);
    const code = (raw.match(/\b((?:swsh|sm|sv|xy|bw|dp)\s*-?\s*\d{2,4}[a-z]?)\b/) || [])[1];
    const filler = new Set(["do", "da", "de", "dos", "das", "o", "a", "the", "of"]);
    const words = raw.replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word && !filler.has(word));
    const base = words.find((word) => word.length > 1 && !/^(swsh|sm|sv|xy|bw|dp)\d/.test(word) && !/^\d+$/.test(word)) || "";
    return { promoCode: code ? code.replace(/[\s-]/g, "").toUpperCase() : "", words, base };
  }

  function cardMatches(card, tokens) {
    const set = card.set || {};
    const promo = String(set.id || "").endsWith("p") || /promo/i.test(set.name || "");
    const hay = foldText([card.name, card.number, set.name, set.id, set.ptcgoCode, promo ? "promo" : ""].join(" "));
    const nameWords = foldText(card.name).split(/[^a-z0-9]+/).filter(Boolean);
    return tokens.words.every((word) => {
      if (word === "swsh") return foldText(card.number || "").startsWith("swsh") || set.id === "swshp";
      if (word === "promo" || /^(swsh|sm|sv|xy|bw|dp)\d/.test(word)) return hay.includes(word);
      if (word.length <= 3) return nameWords.includes(word);
      return hay.includes(word);
    });
  }

  function tcgQuery(parsed, number, withPrinted) {
    const parts = [];
    const name = parsed.name.replace(/"/g, "");
    if (name) parts.push(name.includes(" ") ? `name:"${name}"*` : `name:${name}*`);
    if (number) parts.push(`number:${number}`);
    if (withPrinted && parsed.printed) parts.push(`set.printedTotal:${parsed.printed}`);
    return parts.join(" ");
  }

  async function fetchCards(q, pageSize, page) {
    const size = pageSize || 30;
    const pageNo = page || 1;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch("/api/tcg?page=" + pageNo + "&pageSize=" + size + "&q=" + encodeURIComponent(q));
      if (!response.ok) continue;
      const payload = await response.json();
      if (Array.isArray(payload.data)) return payload.data;
    }
    return null;
  }

  async function fetchNamedCards(q) {
    for (const size of [100, 50]) {
      const first = await fetchCards(q, size, 1);
      if (!first) continue;
      let all = first;
      let page = 1;
      while (all.length === page * size && page < 4) {
        page += 1;
        const more = await fetchCards(q, size, page);
        if (!more?.length) break;
        all = all.concat(more);
      }
      return all;
    }
    return null;
  }

  async function searchPokemonNames(text) {
    const box = document.getElementById("poke-names");
    const raw = text.trim().replace(/"/g, "");
    if (raw.length < 2) { box.innerHTML = ""; nameCards = []; return; }
    box.innerHTML = `<p class="msg">Buscando nomes…</p>`;
    const tokens = searchTokens(raw);
    if (!tokens.base && !tokens.promoCode) { box.innerHTML = `<p class="msg">Digite o nome da carta.</p>`; return; }
    const query = tokens.base ? "name:" + tokens.base : "number:" + tokens.promoCode;
    const cards = tokens.base ? await fetchNamedCards(query) : await fetchCards(query, 30, 1);
    if (!cards) { box.innerHTML = `<p class="msg">Não foi possível consultar o catálogo.</p>`; return; }
    nameCards = cards.filter((card) => cardMatches(card, tokens));
    const needle = foldText(raw);
    const names = [...new Set(nameCards.map((card) => card.name))].sort((a, b) => {
      const rank = (name) => {
        const folded = foldText(name);
        return (folded.startsWith(needle) ? 0 : 1) + (tokens.words.every((word) => folded.includes(word)) ? 0 : 2);
      };
      return rank(a) - rank(b) || a.localeCompare(b, "pt");
    }).slice(0, 40);
    if (!names.length) { box.innerHTML = `<p class="msg">Nenhum Pokémon com esse nome.</p>`; return; }
    box.innerHTML = names.map((name) => `<button type="button" data-name="${esc(name)}">${esc(name)}</button>`).join("");
    box.querySelectorAll("[data-name]").forEach((button) => {
      button.onclick = () => choosePokemon(button.dataset.name);
    });
    const exact = names.find((name) => name.toLowerCase() === needle);
    if (exact) choosePokemon(exact);
    else if (names.length === 1) choosePokemon(names[0]);
  }

  function choosePokemon(name) {
    chosenName = name;
    document.querySelectorAll("#poke-names [data-name]").forEach((button) => {
      button.classList.toggle("is-on", button.dataset.name === name);
    });
    const wanted = name.toLowerCase();
    printings = nameCards.filter((card) => card.name.toLowerCase() === wanted);
    if (!printings.length) printings = nameCards.filter((card) => card.name.toLowerCase().includes(wanted));
    renderPrintings();
  }

  function renderPrintings() {
    const box = document.getElementById("card-hits");
    if (!box) return;
    const typed = foldText(document.getElementById("poke-number")?.value || "");
    const list = printings.filter((card) => {
      if (!typed) return true;
      const printed = foldText(ligaNumber(card) + " " + (card.number || "") + " " + setLabel(card));
      return printed.includes(typed);
    }).sort((a, b) => String(b.set?.releaseDate || "").localeCompare(String(a.set?.releaseDate || ""))).slice(0, 36);
    if (!printings.length) { box.innerHTML = `<p class="msg">Nenhuma carta com esse nome.</p>`; return; }
    if (!list.length) { box.innerHTML = `<p class="msg">Nenhuma carta com esse número.</p>`; return; }
    box.innerHTML = list.map((card, index) => `
      <button type="button" data-print="${index}">
        <img src="${esc(card.images.small)}" alt="" />
        <strong>${esc(ligaNumber(card))}</strong>
        <span>${esc(setLabel(card))}</span>
      </button>`).join("");
    box.querySelectorAll("[data-print]").forEach((button) => {
      button.onclick = () => applyCard(list[Number(button.dataset.print)]);
    });
  }

  async function searchSealedProducts(text) {
    const box = document.getElementById("sealed-hits");
    const types = document.getElementById("sealed-types");
    if (!box || !types) return;
    const query = text.trim();
    if (query.length < 2) { box.innerHTML = ""; types.innerHTML = ""; sealedItems = []; return; }
    box.innerHTML = `<p class="msg">Buscando lacrados…</p>`;
    try {
      const response = await fetch("/api/sealed?q=" + encodeURIComponent(query));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível consultar os lacrados.");
      sealedItems = payload.items || [];
      if (!sealedItems.length) { box.innerHTML = `<p class="msg">Nenhum lacrado nessa coleção.</p>`; types.innerHTML = ""; return; }
      const labels = [...new Set(sealedItems.map((item) => item.label))];
      const order = ["BB", "Mini BB", "ETB", "UPC", "Bundle", "Box", "Mini Tin", "Coleção"];
      labels.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      if (!labels.includes(sealedType)) sealedType = "Todos";
      types.innerHTML = ["Todos", ...labels].map((label) => `<button type="button" data-seal="${esc(label)}" class="${label === sealedType ? "is-on" : ""}">${esc(label)}</button>`).join("");
      types.querySelectorAll("[data-seal]").forEach((button) => {
        button.onclick = () => {
          sealedType = button.dataset.seal;
          types.querySelectorAll("[data-seal]").forEach((item) => item.classList.toggle("is-on", item.dataset.seal === sealedType));
          renderSealed();
        };
      });
      renderSealed();
    } catch (error) {
      box.innerHTML = `<p class="msg">${esc(error.message)}</p>`;
    }
  }

  function renderSealed() {
    const box = document.getElementById("sealed-hits");
    if (!box) return;
    const list = sealedItems.filter((item) => sealedType === "Todos" || item.label === sealedType);
    box.innerHTML = list.map((item, index) => `
      <button type="button" data-seal-item="${index}">
        <img src="${esc(item.image)}" alt="" />
        <strong>${esc(item.label)}</strong>
        <span>${esc(item.name)}</span>
      </button>`).join("");
    box.querySelectorAll("[data-seal-item]").forEach((button) => {
      button.onclick = () => applySealed(list[Number(button.dataset.sealItem)]);
    });
  }

  function applySealed(item) {
    const form = document.getElementById("editor");
    form.elements.kind.value = "sealed";
    form.elements.name.value = item.name;
    if (!form.elements.id.value) form.elements.id.value = "sealed-" + item.productId;
    form.elements.number.value = "";
    form.elements.rarity.value = item.label;
    if (!form.elements.finish.value || form.elements.finish.value === "Normal" || form.elements.finish.value === "Foil") {
      form.elements.finish.value = "Lacrado";
    }
    draftImage = item.image;
    showPreview(item.image);
  }

  async function lookupCard(text) {
    const box = document.getElementById("card-hits");
    const parsed = parseCardSearch(text);
    if (!parsed) { box.innerHTML = ""; return; }
    box.innerHTML = `<p class="msg">Buscando…</p>`;
    try {
      const variants = parsed.number ? numberVariants(parsed.number) : [""];
      const found = new Map();
      let reached = false;
      const collect = (cards, printed) => {
        if (!cards) return;
        reached = true;
        cards.filter((card) => (!parsed.number || sameNumber(card.number, parsed.number)) && matchesPrinted(card, printed) && nameMatches(card.name, parsed.name))
          .forEach((card) => found.set(card.id, card));
      };
      if (parsed.printed) {
        for (const variant of variants) {
          collect(await fetchCards(`number:${variant} set.printedTotal:${parsed.printed}`), parsed.printed);
          if (found.size) break;
        }
        if (!found.size) {
          for (const variant of variants) {
            collect(await fetchCards(`number:${variant} set.total:${parsed.printed}`), parsed.printed);
            if (found.size) break;
          }
        }
      } else {
        for (const variant of variants) {
          collect(await fetchCards(tcgQuery(parsed, variant, false)), "");
          if (found.size) break;
        }
      }
      if (!reached) throw new Error("Não foi possível consultar o catálogo.");
      const cards = [...found.values()].slice(0, 8);
      if (!cards.length) { box.innerHTML = `<p class="msg">Nenhuma carta com esse nome e número.</p>`; return; }
      box.innerHTML = cards.map((card, index) => `
        <button class="hit" type="button" data-hit="${index}">
          <img src="${esc(card.images.small)}" alt="" />
          <span><strong>${esc(card.name)} (${esc(ligaNumber(card))})</strong><span>${esc(card.set.name)}</span></span>
        </button>`).join("");
      box.querySelectorAll("[data-hit]").forEach((button) => {
        button.onclick = () => applyCard(cards[Number(button.dataset.hit)]);
      });
    } catch (error) {
      box.innerHTML = `<p class="msg">${esc(error.message)}</p>`;
    }
  }

  function applyCard(card) {
    const form = document.getElementById("editor");
    const known = shop.sets.find((set) => set.id === card.set.id);
    pickedSet = known || {
      id: card.set.id,
      name: card.set.name,
      code: card.set.ptcgoCode || card.set.id.toUpperCase(),
    };
    if (!known) shop.sets.push(pickedSet);
    form.elements.set_id.value = pickedSet.id;
    const chosenBox = document.getElementById("set-chosen");
    const pick = document.getElementById("set-pick-q");
    if (chosenBox && pick) {
      chosenBox.hidden = false;
      const logo = chosenBox.querySelector("img");
      logo.hidden = false;
      delete logo.dataset.symbol;
      logo.src = setLogo(pickedSet.id);
      fitSetImage(logo);
      chosenBox.querySelector("strong").textContent = pickedSet.name;
      pick.value = "";
      pick.hidden = true;
      document.getElementById("set-pick-results").hidden = true;
    }
    form.elements.id.value = card.id;
    form.elements.name.value = card.name;
    form.elements.number.value = ligaNumber(card);
    form.elements.rarity.value = RARITY[card.rarity] || card.rarity || "";
    form.elements.kind.value = "single";
    const rare = /rare|rara|ilustra|ultra|hiper|holo/i.test(form.elements.rarity.value);
    if (!form.elements.finish.value || form.elements.finish.value === "Normal" || form.elements.finish.value === "Foil") {
      form.elements.finish.value = rare ? "Foil" : "Normal";
    }
    if (!draftImage) showPreview(card.images.small);
    document.getElementById("card-hits").innerHTML = "";
    const nameInput = document.getElementById("poke-name");
    const numberInput = document.getElementById("poke-number");
    if (nameInput) nameInput.value = card.name;
    if (numberInput) numberInput.value = ligaNumber(card);
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const row = {
      id: String(form.get("id") || "").trim(),
      kind: form.get("kind"),
      name: String(form.get("name") || "").trim(),
      set_id: form.get("set_id"),
      number: String(form.get("number") || "").trim(),
      rarity: String(form.get("rarity") || "").trim(),
      condition: String(form.get("condition") || "").trim(),
      lang: String(form.get("lang") || "").trim(),
      finish: String(form.get("finish") || "").trim(),
      qty: Number(form.get("qty") || 0),
      price: Number(form.get("price") || 0),
      image: draftImage || "",
    };
    const msg = document.getElementById("desk-msg");
    if (!row.id || !row.name || !row.set_id) { msg.textContent = "Código, nome e coleção são obrigatórios."; return; }
    const setRow = shop.sets.find((set) => set.id === row.set_id);
    if (setRow) {
      const setSave = await sb.from("sets").upsert({
        id: setRow.id,
        name: setRow.name,
        code: setRow.code,
        sort: shop.sets.indexOf(setRow),
      });
      if (setSave.error) { msg.textContent = setSave.error.message; return; }
    }
    const { error } = await sb.from("products").upsert(row);
    if (error && /image/.test(error.message || "")) {
      msg.textContent = "Para guardar fotos, rode no SQL Editor: alter table public.products add column if not exists image text not null default '';";
      return;
    }
    msg.textContent = error ? error.message : "Item salvo.";
    if (!error) { editing = null; paintDesk(); }
  }

  async function removeProduct() {
    if (!editing) return;
    const { error } = await sb.from("products").delete().eq("id", editing.id);
    const msg = document.getElementById("desk-msg");
    msg.textContent = error ? error.message : "Item apagado.";
    if (!error) { editing = null; paintDesk(); }
  }

  async function seed() {
    const msg = document.getElementById("desk-msg");
    msg.textContent = "Enviando…";
    const sets = localSets;
    const products = localProducts.map((product) => ({
      id: product.id,
      kind: product.kind,
      name: product.name,
      set_id: product.set,
      number: product.number || "",
      rarity: product.rarity || "",
      condition: product.condition || "",
      lang: product.lang || "",
      finish: product.finish || "",
      qty: product.qty,
      price: product.price,
    }));
    const setResult = await sb.from("sets").upsert(sets);
    if (setResult.error) { msg.textContent = setResult.error.message; return; }
    const productResult = await sb.from("products").upsert(products);
    msg.textContent = productResult.error ? productResult.error.message : "Vitrine local enviada.";
    if (!productResult.error) paintDesk();
  }

  async function paint() {
    sb = sb || await window.AMD_SB.client();
    if (!sb) {
      root.innerHTML = `<div class="login-wrap"><section class="login-card"><h1>Painel indisponível</h1><p>A conexão com o Supabase não foi encontrada.</p><a class="login-back" href="/">Voltar para a loja</a></section></div>`;
      return;
    }
    const { data } = await sb.auth.getSession();
    session = data.session;
    if (!session) {
      root.innerHTML = loginScreen();
      document.getElementById("login").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.target);
        const { error } = await sb.auth.signInWithPassword({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
        });
        const msg = document.getElementById("login-msg");
        if (error) { msg.textContent = error.message; return; }
        paint();
      });
      return;
    }
    paintDesk();
  }

  paint();
})();

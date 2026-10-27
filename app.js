(function () {
  const shop = window.AMD_SHOP;
  const main = document.getElementById("conteudo");
  const qInput = document.getElementById("q");
  const nav = document.getElementById("nav");
  let remote = false;

  const I = {
    buy: "assets/icons/buy.png",
    chat: "assets/icons/chat.png",
    cards: "assets/icons/cards.png",
    sealed: "assets/icons/sealed.png",
    sets: "assets/icons/sets.png",
  };

  function setOf(id) {
    return shop.sets.find((set) => set.id === id) || { id, name: id, code: id };
  }

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

  function imageOf(product) {
    if (product.image) return product.image;
    if (product.kind === "sealed" || !product.number) return "";
    const number = String(product.number).split("/")[0];
    return `https://images.pokemontcg.io/${product.set}/${number}.png`;
  }

  function numberLabel(number) {
    if (!number) return "";
    const text = String(number);
    return text.includes("/") ? text : `#${text}`;
  }

  function orderText(product) {
    const set = setOf(product.set);
    const code = product.number ? ` ${numberLabel(product.number)}` : "";
    return [
      "Olá! Quero reservar:",
      `${product.name}${code}`,
      `${set.name} · ${product.lang} · ${product.condition} · ${product.finish}`,
      money(product.price),
      "Ainda está disponível?",
    ].join("\n");
  }

  function waLink(product) {
    return "https://api.whatsapp.com/send?phone=" + shop.whatsapp + "&text=" + encodeURIComponent(orderText(product));
  }

  function shot(product) {
    const photo = imageOf(product);
    if (photo) return `<img src="${esc(photo)}" alt="${esc(product.name)}" loading="lazy" width="245" height="342" />`;
    const set = setOf(product.set);
    return `<div class="pack"><img src="${I.sealed}" alt="" /><b>${esc(product.name)}</b><span>${esc(set.code)} · lacrado</span></div>`;
  }

  function flagOf(lang) {
    const code = String(lang || "").trim().toUpperCase();
    const flags = {
      PT: ["Português", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#009b3a"/><polygon points="10,1.2 18.6,7 10,12.8 1.4,7" fill="#fedf00"/><circle cx="10" cy="7" r="2.5" fill="#002776"/></svg>`],
      EN: ["Inglês", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#bf0a30"/><path d="M0 2h20M0 6h20M0 10h20" stroke="#fff" stroke-width="2"/><rect width="8" height="7" fill="#002868"/></svg>`],
      JP: ["Japonês", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#fff"/><circle cx="10" cy="7" r="3.1" fill="#bc002d"/></svg>`],
      KO: ["Coreano", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#fff"/><circle cx="10" cy="7" r="3" fill="#cd2e3a"/><path d="M10 4a3 3 0 0 1 0 6 1.5 1.5 0 0 1 0-3 1.5 1.5 0 0 0 0-3z" fill="#0047a0"/></svg>`],
      ZH: ["Chinês", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#de2910"/><polygon points="3.2,2.2 3.7,3.6 2.4,2.7 4,2.7 2.7,3.6" fill="#ffde00"/></svg>`],
      ES: ["Espanhol", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#c60b1e"/><rect y="3.5" width="20" height="7" fill="#ffc400"/></svg>`],
      FR: ["Francês", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#ed2939"/><rect width="13.3" height="14" fill="#fff"/><rect width="6.7" height="14" fill="#002395"/></svg>`],
      DE: ["Alemão", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#ffce00"/><rect width="20" height="9.3" fill="#dd0000"/><rect width="20" height="4.7" fill="#000"/></svg>`],
      IT: ["Italiano", `<svg viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" rx="1.5" fill="#ce2b37"/><rect width="13.3" height="14" fill="#fff"/><rect width="6.7" height="14" fill="#009246"/></svg>`],
    };
    const aliases = { "PT-BR": "PT", BR: "PT", POR: "PT", ENG: "EN", US: "EN", JA: "JP", KR: "KO", CN: "ZH", CH: "ZH" };
    const hit = flags[aliases[code] || code];
    if (!hit) return `<span>${esc(lang)}</span>`;
    return `<span class="flag" role="img" aria-label="${esc(hit[0])}" title="${esc(hit[0])}">${hit[1]}</span>`;
  }

  function cardHtml(product) {
    const set = setOf(product.set);
    const number = product.number ? ` ${esc(numberLabel(product.number))}` : "";
    return `
      <article class="card">
        <a class="card-link" href="#/carta/${esc(product.id)}">
          <div class="shot">${shot(product)}</div>
          <div class="card-body">
            <h3>${esc(product.name)}</h3>
            <p class="setline">${esc(set.name)}${number}</p>
            <p class="tags"><span>${esc(product.condition)}</span>${flagOf(product.lang)}<span>${esc(product.finish)}</span><span>${product.qty} un.</span></p>
            <p class="price">${esc(money(product.price))}</p>
          </div>
        </a>
        <a class="buy" href="${esc(waLink(product))}" target="_blank" rel="noopener noreferrer">
          <img src="${I.buy}" alt="" />Comprar
        </a>
      </article>`;
  }

  function route() {
    const raw = (location.hash || "#/").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    return { name: parts[0] || "home", id: decodeURIComponent(parts[1] || "") };
  }

  function markNav(name) {
    const key = name === "home" || name === "set" || name === "carta" ? "#/" : `#/${name}`;
    nav.querySelectorAll("a").forEach((link) => {
      if (link.getAttribute("href") === key) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function account() {
    try { return JSON.parse(localStorage.getItem("amd.account") || "null"); }
    catch { return null; }
  }

  function banner() {
    return `
      <div class="hero">
        <div class="hero-rotator">
          <img src="assets/banner.jpg?v=4" alt="Um novo site para os amantes de Pokémon" />
          <a href="#/cadastro" aria-label="Clientes cadastrados ganham 5% de desconto">
            <img src="assets/banner-desconto.jpg?v=4" alt="" />
          </a>
        </div>
        <div class="hero-dots">
          <button type="button" aria-label="Primeiro banner"></button>
          <button type="button" aria-label="Segundo banner"></button>
        </div>
      </div>`;
  }

  function shelf(id, title, lede, body) {
    return `
      <section class="shelf" id="${id}">
        <div class="section-head"><h2>${esc(title)}</h2></div>
        <p class="lede">${esc(lede)}</p>
        ${body}
      </section>`;
  }

  function bindJumps() {
    const head = document.querySelector(".top");
    if (head) document.documentElement.style.setProperty("--head", `${head.offsetHeight}px`);
  }

  function listPage(title, lede, items) {
    const body = items.length
      ? `<div class="grid">${items.map(cardHtml).join("")}</div>`
      : `<p class="empty">Nenhum item por aqui.</p>`;
    return `<h1 class="page-title">${esc(title)}</h1><p class="lede">${esc(lede)}</p>${body}`;
  }

  const tracking = new Set();
  function trackVisit() {
    const path = location.hash || "#/";
    const seen = (sessionStorage.getItem("amd.tracked") || "").split("|").filter(Boolean);
    if (seen.includes(path) || tracking.has(path)) return;
    tracking.add(path);
    const localId = localStorage.getItem("amd.visitor") || crypto.randomUUID();
    localStorage.setItem("amd.visitor", localId);
    let sent = false;
    const send = (visitor, city) => {
      if (sent) return;
      sent = true;
      window.AMD_SB.client().then(async (sb) => {
        if (!sb) { sent = false; tracking.delete(path); return; }
        const { error } = await sb.from("visits").insert({ path, visitor, city: city || "" });
        if (error) { sent = false; tracking.delete(path); return; }
        sessionStorage.setItem("amd.tracked", seen.concat(path).join("|"));
      }).catch(() => { sent = false; tracking.delete(path); });
    };
    const cachedIp = sessionStorage.getItem("amd.ip");
    if (cachedIp) { send(cachedIp, sessionStorage.getItem("amd.city") || ""); return; }
    const timer = setTimeout(() => send(localId, ""), 2000);
    fetch("https://ipwho.is/").then((response) => response.json()).then((geo) => {
      clearTimeout(timer);
      const city = geo && geo.city ? [geo.city, geo.region_code || geo.region].filter(Boolean).join(" — ") : "";
      const ip = geo && geo.ip ? String(geo.ip) : "";
      sessionStorage.setItem("amd.city", city);
      if (ip) sessionStorage.setItem("amd.ip", ip);
      send(ip || localId, city);
    }).catch(() => {
      clearTimeout(timer);
      send(localId, "");
    });
  }

  let heroTimer = 0;
  function spinHero() {
    clearInterval(heroTimer);
    const box = document.querySelector(".hero-rotator");
    if (!box) return;
    const slides = [...box.children];
    const dots = [...document.querySelectorAll(".hero-dots button")];
    let index = 0;
    const show = () => {
      slides.forEach((slide, i) => slide.classList.toggle("is-on", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-on", i === index));
    };
    const start = () => {
      clearInterval(heroTimer);
      heroTimer = setInterval(() => {
        index = (index + 1) % slides.length;
        show();
      }, 5000);
    };
    show();
    start();
    dots.forEach((dot, i) => {
      dot.onclick = () => {
        index = i;
        show();
        start();
      };
    });
  }

  function render() {
    trackVisit();
    queueMicrotask(() => {
      spinHero();
      bindJumps();
    });
    const { name, id } = route();
    const query = qInput.value.trim().toLowerCase();
    markNav(name);
    const setFilter = document.getElementById("set-filter");
    if (name === "set" && shop.sets.some((set) => set.id === id)) setFilter.value = id;
    else if (name === "home") setFilter.value = "";

    if (query) {
      const found = shop.products.filter((product) => {
        const set = setOf(product.set);
        const hay = `${product.name} ${product.number} ${set.name} ${set.code} ${product.lang}`.toLowerCase();
        return hay.includes(query);
      });
      main.innerHTML = listPage(
        found.length ? `${found.length} resultado${found.length > 1 ? "s" : ""}` : "Nenhum resultado",
        query,
        found
      );
      document.title = "Busca · A.M.D TCG";
      return;
    }

    if (name === "carta") {
      const product = shop.products.find((item) => item.id === id);
      if (!product) {
        main.innerHTML = `<p class="empty">Esse item não está mais disponível.</p>`;
        return;
      }
      const set = setOf(product.set);
      document.title = `${product.name} · A.M.D TCG`;
      main.innerHTML = `
        <a class="back" href="#/${product.kind === "sealed" ? "lacrados" : "set/" + product.set}">Voltar</a>
        <article class="detail">
          <div class="detail-shot"><div class="shot">${shot(product)}</div></div>
          <div>
            <p class="kicker">${esc(set.name)}${product.number ? " · " + esc(numberLabel(product.number)) : ""}</p>
            <h1>${esc(product.name)}</h1>
            <p class="price">${esc(money(product.price))}</p>
            <table class="specs">
              <tr><th>Tipo</th><td>${product.kind === "sealed" ? "Lacrado" : "Carta avulsa"}</td></tr>
              <tr><th>Coleção</th><td>${esc(set.name)} (${esc(set.code)})</td></tr>
              <tr><th>Raridade</th><td>${esc(product.rarity)}</td></tr>
              <tr><th>Condição</th><td>${esc(product.condition)}</td></tr>
              <tr><th>Idioma</th><td>${flagOf(product.lang)}</td></tr>
              <tr><th>Acabamento</th><td>${esc(product.finish)}</td></tr>
              <tr><th>Quantidade</th><td>${product.qty} un.</td></tr>
            </table>
            <a class="ask" href="${esc(waLink(product))}" target="_blank" rel="noopener noreferrer"><img src="${I.buy}" alt="" />Comprar</a>
            <p class="note">Frete combinado no pedido.</p>
          </div>
        </article>`;
      return;
    }

    if (name === "cadastro") {
      document.title = "Cadastro · A.M.D TCG";
      const user = account();
      main.innerHTML = `
        <div class="auth">
          <section class="auth-card">
            <a class="brand" href="#/" aria-label="A.M.D TCG, início"><img src="assets/logo-mark.png?v=8" alt="" width="120" height="80" /></a>
            <h1 class="page-title">Criar conta</h1>
            <p class="lede">Cadastre-se e ganhe 5% de desconto.</p>
            <form class="form" id="signup">
              <label>Nome<input name="name" required value="${esc(user?.name || "")}" autocomplete="name" /></label>
              <label>E-mail<input name="email" type="email" required value="${esc(user?.email || "")}" autocomplete="email" /></label>
              <label>Telefone<input name="phone" required value="${esc(user?.phone || "")}" autocomplete="tel" /></label>
              <label>Senha<input name="password" type="password" minlength="6" required autocomplete="new-password" /></label>
              <button class="solid" type="submit">Criar conta</button>
            </form>
            <p class="msg" id="signup-msg"></p>
            <p class="auth-switch">Já tem conta? <a href="#/entrar">Entrar</a></p>
          </section>
        </div>`;
      document.getElementById("signup").addEventListener("submit", onSignup);
      return;
    }

    if (name === "entrar") {
      document.title = "Entrar · A.M.D TCG";
      const user = account();
      main.innerHTML = `
        <div class="auth">
          <section class="auth-card">
            <a class="brand" href="#/" aria-label="A.M.D TCG, início"><img src="assets/logo-mark.png?v=8" alt="" width="120" height="80" /></a>
            <h1 class="page-title">Entrar</h1>
            <p class="lede">${user ? esc(user.name) + " · " + esc(user.email) : "Bem-vindo de volta."}</p>
            <form class="form" id="signin">
              <label>E-mail<input name="email" type="email" required value="${esc(user?.email || "")}" autocomplete="email" /></label>
              <label>Senha<input name="password" type="password" required autocomplete="current-password" /></label>
              <button class="solid" type="submit">Entrar</button>
            </form>
            <p class="msg" id="signin-msg"></p>
            <p class="auth-switch">Ainda não tem conta? <a href="#/cadastro">Criar conta</a></p>
          </section>
        </div>`;
      document.getElementById("signin").addEventListener("submit", onSignin);
      return;
    }

    if (name === "contato") {
      document.title = "Contato · A.M.D TCG";
      main.innerHTML = `
        <h1 class="page-title">Contato</h1>
        <p class="lede">Grupo, lives e convite.</p>
        <div class="sets">
          <a class="set-link" href="${esc(shop.whatsappGroup)}" target="_blank" rel="noopener noreferrer"><strong>Grupo do WhatsApp</strong><span>Abrir</span></a>
          <a class="set-link" href="${esc(shop.jamble)}" target="_blank" rel="noopener noreferrer"><strong>Lives na Jamble</strong><span>@allandomingues</span></a>
          <a class="set-link" href="${esc(shop.jambleInvite)}" target="_blank" rel="noopener noreferrer"><strong>Ganhe R$ 75 na Jamble</strong><span>Convite</span></a>
        </div>`;
      return;
    }

    if (name === "sobre") {
      document.title = "Sobre · A.M.D TCG";
      main.innerHTML = `
        <h1 class="page-title">Sobre</h1>
        <p class="lede">Loja de Pokémon TCG do @allandomingues. Cartas avulsas e lacrados para quem coleciona e joga.</p>`;
      return;
    }

    if (name === "avulsos") {
      document.title = "Avulsos · A.M.D TCG";
      main.innerHTML = listPage("Avulsos", "Unidades escolhidas uma a uma.", shop.products.filter((p) => p.kind === "single"));
      return;
    }
    if (name === "lacrados") {
      document.title = "Lacrados · A.M.D TCG";
      main.innerHTML = listPage("Lacrados", "Caixas e packs fechados de fábrica.", shop.products.filter((p) => p.kind === "sealed"));
      return;
    }
    if (name === "colecoes") {
      document.title = "Coleções · A.M.D TCG";
      const rows = shop.sets.map((set) => {
        const count = shop.products.filter((product) => product.set === set.id).length;
        return `<a class="set-link" href="#/set/${esc(set.id)}" data-find="${esc(`${set.name} ${set.en || ""} ${set.code}`)}"><strong>${esc(set.name)}</strong><span>${esc(set.code)} · ${count}</span></a>`;
      }).join("");
      main.innerHTML = `<h1 class="page-title">Coleções</h1><p class="lede">Escolha a coleção.</p><input id="set-find" class="set-find" type="search" placeholder="Buscar coleção" /><div class="sets" id="set-list">${rows}</div>`;
      document.getElementById("set-find").addEventListener("input", (event) => {
        const query = event.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        document.querySelectorAll("#set-list .set-link").forEach((link) => {
          const hay = (link.dataset.find || link.textContent).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          link.hidden = query && !query.split(/\s+/).every((word) => hay.includes(word));
        });
      });
      return;
    }
    if (name === "set") {
      const set = shop.sets.find((item) => item.id === id);
      if (!set) {
        main.innerHTML = `<p class="empty">Coleção não encontrada.</p>`;
        return;
      }
      document.title = `${set.name} · A.M.D TCG`;
      main.innerHTML = listPage(set.name, set.code, shop.products.filter((product) => product.set === set.id));
      return;
    }

    document.title = "A.M.D TCG — Pokémon";
    const singles = shop.products.filter((product) => product.kind === "single");
    const sealed = shop.products.filter((product) => product.kind === "sealed");
    const cards = (items) => items.length
      ? `<div class="grid">${items.map(cardHtml).join("")}</div>`
      : `<p class="empty">Nenhum item no momento.</p>`;
    main.innerHTML = banner() + `
      <nav class="jumps" aria-label="Seções do catálogo">
        <button type="button" data-jump="loja-avulsos">Avulsos<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
        <button type="button" data-jump="loja-lacrados">Lacrados<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      </nav>
      ${shelf("loja-avulsos", "Avulsos", "Unidades escolhidas uma a uma.", cards(singles))}
      ${shelf("loja-lacrados", "Lacrados", "Caixas e packs fechados de fábrica.", cards(sealed))}`;
  }

  async function onSignup(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const profile = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
    };
    const password = String(form.get("password") || "");
    const msg = document.getElementById("signup-msg");
    localStorage.setItem("amd.account", JSON.stringify(profile));
    sessionStorage.setItem("amd.session", profile.email);
    try {
      const sb = await window.AMD_SB.client();
      if (sb) {
        const { error } = await sb.auth.signUp({
          email: profile.email,
          password,
          options: { data: { name: profile.name, phone: profile.phone } },
        });
        if (error) { msg.textContent = error.message; return; }
      }
    } catch (error) {
      console.warn(error);
    }
    msg.textContent = "Conta criada.";
    paintAccount();
  }

  async function onSignin(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const msg = document.getElementById("signin-msg");
    const saved = account();
    try {
      const sb = await window.AMD_SB.client();
      if (sb) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { msg.textContent = error.message; return; }
      } else if (!saved || saved.email !== email) {
        msg.textContent = "Cadastre-se primeiro.";
        return;
      }
    } catch (error) {
      msg.textContent = "Não foi possível entrar.";
      return;
    }
    sessionStorage.setItem("amd.session", email);
    msg.textContent = "Você entrou.";
    paintAccount();
  }

  function paintAccount() {
    const user = account();
    const link = document.getElementById("entrar");
    const on = sessionStorage.getItem("amd.session");
    if (user && on) {
      link.textContent = user.name.split(" ")[0];
      link.href = "#/entrar";
    }
  }

  function fillSets() {
    const select = document.getElementById("set-filter");
    const current = select.value;
    select.innerHTML = `<option value="">Todas as coleções</option>` + shop.sets.map((set) => `<option value="${esc(set.id)}">${esc(set.name)}</option>`).join("");
    select.value = shop.sets.some((set) => set.id === current) ? current : "";
  }

  async function loadRemote() {
    try {
      const sb = await window.AMD_SB.client();
      if (!sb) return;
      const [{ data: sets, error: setError }, { data: products, error: productError }] = await Promise.all([
        sb.from("sets").select("id,name,code,sort").order("sort"),
        sb.from("products").select("id,kind,name,set_id,number,rarity,condition,lang,finish,qty,price,image").order("name"),
      ]);
      let rows = products;
      let rowsError = productError;
      if (rowsError && /image/.test(rowsError.message || "")) {
        const again = await sb.from("products").select("id,kind,name,set_id,number,rarity,condition,lang,finish,qty,price").order("name");
        rows = again.data;
        rowsError = again.error;
      }
      if (setError || rowsError || !rows || !rows.length) return;
      for (const set of sets || []) {
        if (!shop.sets.some((item) => item.id === set.id)) shop.sets.push({ id: set.id, name: set.name, code: set.code });
      }
      shop.products = rows.map((product) => ({
        id: product.id,
        kind: product.kind,
        name: product.name,
        set: product.set_id,
        number: product.number || "",
        rarity: product.rarity || "",
        condition: product.condition || "",
        lang: product.lang || "",
        finish: product.finish || "",
        qty: product.qty,
        price: Number(product.price),
        image: product.image || "",
      }));
      remote = true;
    } catch (error) {
      console.warn("Supabase indisponível, usando a vitrine local.", error);
    }
  }

  function setMenu(open) {
    const menu = document.getElementById("menu");
    const btn = document.getElementById("menu-btn");
    const backdrop = document.getElementById("backdrop");
    const head = document.querySelector(".top");
    if (head) document.documentElement.style.setProperty("--head", `${head.offsetHeight}px`);
    menu.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.querySelector("span").textContent = open ? "Fechar" : "Menu";
    backdrop.hidden = !open;
  }

  window.addEventListener("hashchange", () => {
    qInput.value = "";
    setMenu(false);
    render();
    window.scrollTo(0, 0);
  });
  document.getElementById("menu-btn").addEventListener("click", () => {
    const open = document.getElementById("menu-btn").getAttribute("aria-expanded") !== "true";
    setMenu(open);
  });
  document.getElementById("backdrop").addEventListener("click", () => setMenu(false));
  window.addEventListener("resize", () => setMenu(document.getElementById("menu").classList.contains("is-open")));
  document.getElementById("set-filter").addEventListener("change", (event) => {
    const id = event.target.value;
    location.hash = id ? `#/set/${id}` : "#/";
  });
  document.getElementById("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    qInput.blur();
  });
  qInput.addEventListener("input", () => {
    if ((location.hash || "#/") !== "#/") history.replaceState(null, "", "#/");
    render();
  });

  const boot = document.getElementById("boot");
  if (boot) {
    const started = performance.now();
    const finish = () => {
      const wait = Math.max(0, 1800 - (performance.now() - started));
      setTimeout(() => {
        boot.classList.add("is-done");
        setTimeout(() => boot.remove(), 320);
      }, wait);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-jump]");
    if (!button) return;
    document.querySelectorAll("[data-jump]").forEach((item) => item.classList.remove("is-on"));
    button.classList.add("is-on");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(button.dataset.jump)?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  });

  loadRemote().finally(() => {
    fillSets();
    paintAccount();
    render();
  });
})();

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

  function loggedIn() {
    return Boolean(sessionStorage.getItem("amd.session"));
  }

  function payPrice(value) {
    const full = Number(value) || 0;
    if (!loggedIn()) return full;
    return Math.round(full * 95) / 100;
  }

  function priceHtml(value) {
    const full = Number(value) || 0;
    if (!loggedIn()) return esc(money(full));
    return `<s>${esc(money(full))}</s> ${esc(money(payPrice(full)))}`;
  }

  function money(value) {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function artFile(number) {
    const file = String(number || "").split("/")[0].trim();
    if (/^0+\d+$/.test(file)) return String(Number(file));
    return file;
  }

  function plainArt(url) {
    return String(url || "").replace(/\/0+(\d+)\.png(?=$|\?)/, (_, digits) => `/${Number(digits)}.png`);
  }

  function imageOf(product) {
    if (product.image) return plainArt(product.image);
    if (product.kind === "sealed" || !product.number) return "";
    return `https://images.pokemontcg.io/${product.set}/${artFile(product.number)}.png`;
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
      money(payPrice(product.price)),
      "Ainda está disponível?",
    ].join("\n");
  }

  function waLink(product) {
    return "https://api.whatsapp.com/send?phone=" + shop.whatsapp + "&text=" + encodeURIComponent(orderText(product));
  }

  function shot(product) {
    const photo = imageOf(product);
    if (photo) return `<img src="${esc(photo)}" alt="${esc(product.name)}" loading="lazy" width="245" height="342" onload="if(this.naturalWidth===640&&this.naturalHeight===892)this.hidden=true" onerror="this.hidden=true" />`;
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
            <p class="price">${priceHtml(product.price)}</p>
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
          <img src="assets/banner.jpg?v=8" alt="Um novo site para os amantes de Pokémon" />
        <a href="#/cadastro" aria-label="Clientes cadastrados ganham 5% de desconto">
          <img src="assets/banner-desconto.jpg?v=8" alt="" />
        </a>
        <a href="${esc(shop.jamble)}" target="_blank" rel="noopener noreferrer" aria-label="AMD na Jamble, confira já">
          <img src="assets/banner-jamble.jpg?v=1" alt="" />
        </a>
        </div>
        <div class="hero-dots">
          <button type="button" aria-label="Primeiro banner"></button>
          <button type="button" aria-label="Segundo banner"></button>
          <button type="button" aria-label="Terceiro banner"></button>
        </div>
      </div>`;
  }

  function setRails(products) {
    const groups = new Map();
    for (const product of products) {
      const key = product.set || "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(product);
    }
    const known = shop.sets.map((set) => set.id).filter((id) => groups.has(id));
    const extra = [...groups.keys()].filter((id) => !known.includes(id));
    const ids = [...known, ...extra];
    if (!ids.length) return `<p class="empty">Nenhum item no momento.</p>`;
    return ids.map((id) => {
      const set = setOf(id);
      const items = groups.get(id);
      return `
        <div class="set-rail">
          <div class="section-head">
            <h3>${esc(set.name)} <span>${esc(set.code)}</span></h3>
            <a href="#/set/${esc(set.id)}">Ver coleção</a>
          </div>
          <div class="row">${items.map(cardHtml).join("")}</div>
        </div>`;
    }).join("");
  }

  function bindRails() {
    document.querySelectorAll(".row").forEach((row) => {
      if (row.dataset.drag) return;
      row.dataset.drag = "1";
      let startX = 0;
      let startScroll = 0;
      let moved = false;
      row.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "touch") return;
        startX = event.clientX;
        startScroll = row.scrollLeft;
        moved = false;
        row.setPointerCapture(event.pointerId);
      });
      row.addEventListener("pointermove", (event) => {
        if (!row.hasPointerCapture(event.pointerId)) return;
        const dx = event.clientX - startX;
        if (Math.abs(dx) > 5) {
          moved = true;
          row.classList.add("is-drag");
        }
        row.scrollLeft = startScroll - dx;
      });
      const end = () => row.classList.remove("is-drag");
      row.addEventListener("pointerup", end);
      row.addEventListener("pointercancel", end);
      row.addEventListener("click", (event) => {
        if (!moved) return;
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }, true);
    });
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
    if (localStorage.getItem("amd.cookies") !== "all") return;
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
    const fill = (img) => {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const sample = 40;
      const y = Math.max(0, Math.floor(img.naturalHeight / 2 - sample / 2));
      ctx.drawImage(img, 0, y, 1, sample, 0, 0, 1, 1);
      ctx.drawImage(img, img.naturalWidth - 1, y, 1, sample, 1, 0, 1, 1);
      const hex = (x) => {
        const p = ctx.getImageData(x, 0, 1, 1).data;
        return "#" + [p[0], p[1], p[2]].map((n) => n.toString(16).padStart(2, "0")).join("");
      };
      const left = hex(0);
      const right = hex(1);
      box.style.background = `linear-gradient(90deg, ${left}, ${right})`;
    };
    const fit = (slide) => {
      const img = slide.tagName === "IMG" ? slide : slide.querySelector("img");
      if (!img) return;
      const apply = () => {
        if (!slide.classList.contains("is-on") || !img.naturalWidth) return;
        fill(img);
      };
      if (img.complete && img.naturalWidth) apply();
      else img.addEventListener("load", apply, { once: true });
    };
    const show = () => {
      slides.forEach((slide, i) => slide.classList.toggle("is-on", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-on", i === index));
      fit(slides[index]);
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
    paintAccount();
    trackVisit();
    queueMicrotask(() => {
      spinHero();
      bindJumps();
      bindRails();
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
            <p class="price">${priceHtml(product.price)}</p>
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
      if (loggedIn()) { location.hash = "#/"; return; }
      document.title = "Cadastro · A.M.D TCG";
      const user = account();
      main.innerHTML = `
        <div class="auth">
          <section class="auth-card">
            <a class="brand" href="#/" aria-label="A.M.D TCG, início"><img src="assets/logo-mark.png?v=10" alt="" width="120" height="80" /></a>
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

    if (name === "conta") {
      if (!loggedIn()) { location.hash = "#/entrar"; return; }
      document.title = "Conta · A.M.D TCG";
      main.innerHTML = profileCard(account() || {});
      fillProfile();
      return;
    }

    if (name === "entrar") {
      document.title = "Entrar · A.M.D TCG";
      const user = account();
      main.innerHTML = `
        <div class="auth">
          <section class="auth-card">
            <a class="brand" href="#/" aria-label="A.M.D TCG, início"><img src="assets/logo-mark.png?v=10" alt="" width="120" height="80" /></a>
            <h1 class="page-title">Entrar</h1>
            <p class="lede">${personName(user?.name, user?.email) || "Bem-vindo de volta."}</p>
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

    if (name === "privacidade" || name === "cookies" || name === "termos") {
      main.innerHTML = legalPage(name);
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
      const singles = shop.products.filter((product) => product.kind === "single");
      main.innerHTML = `<h1 class="page-title">Avulsos</h1><p class="lede">Unidades escolhidas uma a uma.</p>${setRails(singles)}`;
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
      ${shelf("loja-avulsos", "Avulsos", "Unidades escolhidas uma a uma.", setRails(singles))}
      ${shelf("loja-lacrados", "Lacrados", "Caixas e packs fechados de fábrica.", cards(sealed))}`;
  }

  function legalPage(name) {
    const updated = "27 de outubro de 2026";
    const pages = {
      privacidade: {
        title: "Política de privacidade",
        body: `
          <p>Esta política explica o que a A.M.D TCG faz com os dados de quem usa a loja. Ela vale para o site e segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
          <h2>Quem é responsável</h2>
          <p>A loja é a A.M.D TCG, do @allandomingues. Para falar sobre seus dados, chame no WhatsApp <a href="https://api.whatsapp.com/send?phone=5511969194152">11 96919-4152</a>.</p>
          <h2>Quais dados usamos</h2>
          <ul>
            <li>Conta: nome, e-mail, telefone e senha. A senha fica protegida no serviço de acesso e a loja não vê a senha em texto aberto.</li>
            <li>Pedido: ao tocar em Comprar, o WhatsApp abre com o produto, a coleção, o idioma, a condição, o acabamento e o preço. Essa conversa segue as regras do WhatsApp.</li>
            <li>Visita, só se você aceitar: página vista, endereço IP e cidade aproximada, para saber quantas pessoas entram na loja.</li>
            <li>Aparelho: a sessão da conta fica guardada neste navegador até você fechar a aba.</li>
          </ul>
          <h2>Para que serve</h2>
          <ul>
            <li>Criar a conta e aplicar o desconto de 5% enquanto você está dentro dela.</li>
            <li>Montar a mensagem do pedido no WhatsApp.</li>
            <li>Contar visitas, quando você aceita, para a loja entender o movimento do catálogo.</li>
            <li>Manter o site no ar e proteger a conta contra uso indevido.</li>
          </ul>
          <h2>Base legal</h2>
          <p>A conta e o pedido existem para atender a você. A visita com IP e cidade só acontece com o seu consentimento, que pode ser retirado. Dados estritamente necessários para a página abrir e para a sessão da conta se apoiam na execução do serviço.</p>
          <h2>Com quem compartilhamos</h2>
          <p>Não vendemos dados. O cadastro e as visitas aceitas ficam em banco de dados da Supabase. O site fica hospedado na Vercel. A cidade aproximada vem de uma consulta ao IP na ipwho.is. O pedido vai para o WhatsApp quando você toca em Comprar. Esses fornecedores podem guardar dados em servidores fora do Brasil. A loja usa isso só para o serviço descrito aqui.</p>
          <h2>Por quanto tempo</h2>
          <p>A conta fica enquanto você quiser mantê-la. As visitas ficam para a contagem da loja e podem ser apagadas quando você pedir. A sessão da aba some quando o navegador é fechado.</p>
          <h2>Seus direitos</h2>
          <p>Você pode pedir confirmação, acesso, correção, portabilidade, exclusão, informação sobre com quem os dados foram compartilhados e revogar o consentimento das visitas. O pedido é pelo WhatsApp da loja. A resposta sai em até 15 dias. Você também pode procurar a Autoridade Nacional de Proteção de Dados, em gov.br/anpd.</p>
          <h2>Crianças e adolescentes</h2>
          <p>A conta é para maiores de 18 anos. Menor de idade só deve se cadastrar com um responsável. A loja não pede dados de criança de propósito.</p>
          <p>Atualizada em ${updated}.</p>`,
      },
      cookies: {
        title: "Cookies e dados no aparelho",
        body: `
          <p>Este site não usa cookie de anúncio. O que fica no aparelho serve para a conta funcionar e, se você aceitar, para contar a visita.</p>
          <h2>Necessários</h2>
          <ul>
            <li>Sessão da conta, para saber que você entrou e aplicar o desconto de 5% nesta aba.</li>
            <li>Nome, e-mail e telefone do cadastro, para preencher a conta neste aparelho.</li>
            <li>Sua escolha neste aviso: aceitar as visitas ou ficar só com o necessário.</li>
          </ul>
          <h2>Somente com aceite</h2>
          <ul>
            <li>Página visitada, endereço IP e cidade aproximada. Isso conta as pessoas que entram na loja. Sem o aceite, essa visita não é registrada.</li>
          </ul>
          <h2>Como mudar de ideia</h2>
          <p>Apague os dados deste site nas configurações do navegador. Na próxima visita o aviso aparece de novo e você escolhe outra vez. Para apagar o que já foi salvo na loja, chame no WhatsApp <a href="https://api.whatsapp.com/send?phone=5511969194152">11 96919-4152</a>.</p>
          <p>Atualizada em ${updated}.</p>`,
      },
      termos: {
        title: "Termos de uso",
        body: `
          <p>Ao usar o site da A.M.D TCG você vê o catálogo e, se quiser, pede um item pelo WhatsApp. Comprar no botão abre a conversa com a loja. O pedido se fecha nessa conversa, não aqui no site.</p>
          <h2>Catálogo e preço</h2>
          <p>Preço, quantidade e condição são os que estão na ficha no momento. O item pode acabar antes da confirmação. Quem está dentro da conta vê 5% de desconto nos preços do site. O valor final, o frete e a reserva são combinados no WhatsApp.</p>
          <h2>Conta</h2>
          <p>Os dados do cadastro precisam ser seus. A senha é sua responsabilidade. A loja pode recusar cadastro com informação falsa ou uso que atrapalhe o site e os outros clientes.</p>
          <h2>O que não fazer</h2>
          <ul>
            <li>Usar o site para golpe, spam ou para pegar dados de outra pessoa.</li>
            <li>Tentar invadir, copiar em massa ou quebrar o catálogo.</li>
            <li>Publicar o conteúdo da loja como se fosse seu.</li>
          </ul>
          <h2>Marcas</h2>
          <p>Pokémon e as marcas das cartas pertencem aos seus donos. A A.M.D TCG é uma loja independente e não é a Pokémon Company, a Nintendo nem a The Pokémon Company International.</p>
          <h2>Limite</h2>
          <p>O site mostra o que está disponível. Atraso de operadora, falta de estoque ou instabilidade do WhatsApp não geram compra automática. A lei brasileira vale para estes termos.</p>
          <p>Dúvida ou pedido sobre estes termos: WhatsApp <a href="https://api.whatsapp.com/send?phone=5511969194152">11 96919-4152</a>.</p>
          <p>Atualizado em ${updated}.</p>`,
      },
    };
    const page = pages[name];
    document.title = `${page.title} · A.M.D TCG`;
    return `<article class="legal"><h1 class="page-title">${page.title}</h1>${page.body}</article>`;
  }

  function bindCookies() {
    const bar = document.getElementById("cookie");
    if (!bar) return;
    const choice = localStorage.getItem("amd.cookies");
    bar.hidden = Boolean(choice);
    document.body.classList.toggle("has-cookie", !choice);
    const pick = (value) => {
      localStorage.setItem("amd.cookies", value);
      bar.hidden = true;
      document.body.classList.remove("has-cookie");
      if (value === "all") trackVisit();
    };
    document.getElementById("cookie-all").onclick = () => pick("all");
    document.getElementById("cookie-min").onclick = () => pick("essential");
  }

  async function onSignup(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const profile = {
      name: personName(form.get("name")),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
    };
    const password = String(form.get("password") || "");
    const msg = document.getElementById("signup-msg");
    try {
      const sb = await window.AMD_SB.client();
      if (sb) {
        const { error } = await sb.auth.signUp({
          email: profile.email,
          password,
          options: { data: { name: profile.name, phone: profile.phone } },
        });
        if (error) { msg.textContent = error.message; return; }
        await saveCustomer(sb, profile);
      }
    } catch (error) {
      console.warn(error);
    }
    msg.textContent = "Conta criada.";
    localStorage.setItem("amd.account", JSON.stringify(profile));
    sessionStorage.setItem("amd.session", profile.email);
    paintAccount();
    location.hash = "#/";
  }

  async function saveCustomer(sb, profile) {
    if (!sb || !profile?.email) return;
    const { error } = await sb.from("customers").insert({
      name: profile.name || "",
      email: profile.email,
      phone: profile.phone || "",
    });
    if (error && !/duplicate|unique/i.test(error.message || "")) console.warn(error.message);
  }

  function titled(value) {
    const text = String(value || "").trim();
    if (!text || text.includes("@")) return "";
    return text.split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1)).join(" ");
  }

  function profileCard(user) {
    const phone = String(user.phone || "").trim();
    return `
      <div class="auth">
        <section class="auth-card profile-card">
          <a class="brand" href="#/" aria-label="A.M.D TCG, início"><img src="assets/logo-mark.png?v=10" alt="" width="120" height="80" /></a>
          <h1 class="page-title">Sua conta</h1>
          <p class="lede">Clientes cadastrados ganham 5% de desconto.</p>
          <dl class="profile">
            <div><dt>Nome</dt><dd id="profile-name">${esc(titled(user.name) || "Não informado")}</dd></div>
            <div><dt>E-mail</dt><dd id="profile-email">${esc(user.email || "Não informado")}</dd></div>
            <div><dt>Telefone</dt><dd id="profile-phone">${esc(phone || "Não informado")}</dd></div>
          </dl>
        </section>
      </div>`;
  }

  async function fillProfile() {
    try {
      const sb = await window.AMD_SB.client();
      if (!sb || route().name !== "conta") return;
      const { data } = await sb.auth.getUser();
      const user = data.user;
      if (!user) return;
      const meta = user.user_metadata || {};
      const email = user.email || "";
      const { data: row } = await sb.from("customers").select("name,phone").eq("email", email).maybeSingle();
      const next = rememberAccount({
        name: meta.name || row?.name || "",
        email,
        phone: meta.phone || row?.phone || "",
      });
      if (!next || route().name !== "conta") return;
      const name = document.getElementById("profile-name");
      const mail = document.getElementById("profile-email");
      const phone = document.getElementById("profile-phone");
      if (name) name.textContent = titled(next.name) || titled(row?.name) || "Não informado";
      if (mail) mail.textContent = next.email || "Não informado";
      if (phone) phone.textContent = next.phone || "Não informado";
      paintAccount();
    } catch { /* a conta local continua na tela */ }
  }

  function personName(value, email) {
    const text = String(value || "").trim();
    if (!text || text.includes("@")) return "";
    const local = String(email || "").split("@")[0].toLowerCase();
    if (local && text.toLowerCase() === local) return "";
    return text.split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1)).join(" ");
  }

  function rememberAccount(profile) {
    const current = account() || {};
    const email = (profile.email || current.email || "").trim();
    const next = {
      name: personName(profile.name, email) || personName(current.name, email),
      email,
      phone: (profile.phone || current.phone || "").trim(),
    };
    if (!next.email) return null;
    localStorage.setItem("amd.account", JSON.stringify(next));
    sessionStorage.setItem("amd.session", next.email);
    return next;
  }

  async function nameFor(sb, email, fallback) {
    const given = personName(fallback, email);
    if (given) return given;
    if (!sb || !email) return "";
    const { data } = await sb.from("customers").select("name").eq("email", email).maybeSingle();
    return personName(data?.name, email);
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
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) { msg.textContent = error.message; return; }
        const meta = data.user?.user_metadata || {};
        const profile = rememberAccount({
          name: await nameFor(sb, data.user?.email || email, meta.name),
          email: data.user?.email || email,
          phone: meta.phone || saved?.phone || "",
        });
        await saveCustomer(sb, profile);
      } else if (!saved || saved.email !== email) {
        msg.textContent = "Cadastre-se primeiro.";
        return;
      }
    } catch (error) {
      msg.textContent = "Não foi possível entrar.";
      return;
    }
    sessionStorage.setItem("amd.session", email);
    paintAccount();
    location.hash = "#/";
  }

  function paintAccount() {
    const user = account();
    const link = document.getElementById("entrar");
    const signup = document.getElementById("criar");
    const leave = document.getElementById("sair");
    const menuSignup = document.querySelector('#nav a[href="#/cadastro"]');
    const on = loggedIn();
    if (signup) signup.hidden = on;
    if (leave) leave.hidden = !on;
    if (menuSignup) menuSignup.hidden = on;
    if (on) {
      link.textContent = personName(user?.name, user?.email) || "Conta";
      link.href = "#/conta";
    } else {
      link.textContent = "Entrar";
      link.href = "#/entrar";
    }
  }

  async function logout() {
    sessionStorage.removeItem("amd.session");
    try {
      const sb = await window.AMD_SB.client();
      if (sb) await sb.auth.signOut();
    } catch { /* a tela volta mesmo se a saída remota falhar */ }
    paintAccount();
    if ((location.hash || "#/") !== "#/") location.hash = "#/";
    else render();
  }

  async function syncAccount() {
    try {
      const sb = await window.AMD_SB.client();
      if (!sb) return;
      const { data, error } = await sb.auth.getSession();
      if (error || !data.session) {
        if (!error) sessionStorage.removeItem("amd.session");
        return;
      }
      const user = data.session.user;
      const meta = user.user_metadata || {};
      const profile = rememberAccount({
        name: await nameFor(sb, user.email || "", meta.name || ""),
        email: user.email || "",
        phone: meta.phone || "",
      });
      await saveCustomer(sb, profile);
    } catch { /* sem rede, mantém a sessão que já está no aparelho */ }
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

  bindCookies();
  document.getElementById("sair").onclick = logout;
  loadRemote().finally(async () => {
    await syncAccount();
    fillSets();
    render();
  });
})();

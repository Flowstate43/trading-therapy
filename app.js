(() => {
  const MESSENGER_URL = "https://m.me/j/AbY7Lx_SSPZwO3t6/";
  const PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin&vs_currencies=usd&include_24hr_change=true";
  const GLOBAL_URL = "https://api.coingecko.com/api/v3/global";
  const FNG_URL = "https://api.alternative.me/fng/?limit=1";
  const CACHE_KEY = "tradingTherapy:stats:v1";
  const REFRESH_MS = 90 * 1000;

  const COINS = [
    { id: "bitcoin", key: "btc" },
    { id: "ethereum", key: "eth" },
    { id: "solana", key: "sol" },
    { id: "ripple", key: "xrp" },
    { id: "binancecoin", key: "bnb" },
  ];

  const FALLBACK_POSTS = [
    {
      date: "2026-11-25",
      title: "Tuesday calm: sitting with the tape",
      teaser: "A short morning note on patience, position size, and why today's move doesn't need a reaction.",
      sample: true,
    },
    {
      date: "2026-11-24",
      title: "When the market is loud, go quieter",
      teaser: "How to read a messy session without chasing, plus one beginner mindset check.",
      sample: true,
    },
    {
      date: "2026-11-23",
      title: "Support, not a promise",
      teaser: "A plain-language look at levels, and what it means when they break.",
      sample: true,
    },
  ];

  const FALLBACK_LESSONS = [
    { title: "Support & Resistance", blurb: "How to spot areas where buyers and sellers have repeatedly stepped in — and how not to treat them as guarantees.", status: "coming soon" },
    { title: "Candlestick basics", blurb: "Read the story of a session: opens, closes, wicks, and what a single candle can and cannot tell you.", status: "coming soon" },
    { title: "Risk management", blurb: "Position size, invalidation, and staying in the game long enough for skill to matter.", status: "coming soon" },
    { title: "Chart patterns", blurb: "Common shapes traders watch, why they form, and the limits of pattern-only decisions.", status: "coming soon" },
  ];

  const $ = (id) => document.getElementById(id);

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function formatUsd(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return "—";
    const digits = n >= 1000 ? 0 : n >= 1 ? 2 : 4;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  }

  function formatChange(n) {
    if (typeof n !== "number" || Number.isNaN(n)) return "";
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toFixed(2)}%`;
  }

  function formatTime(ts) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleTimeString();
    }
  }

  function formatDate(iso) {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  }

  function applyChangeClass(el, change) {
    if (!el) return;
    el.classList.remove("up", "down");
    if (typeof change !== "number" || Number.isNaN(change) || change === 0) return;
    el.classList.add(change > 0 ? "up" : "down");
  }

  function setDelayed(on) {
    const note = $("data-delayed");
    if (note) note.hidden = !on;
  }

  function renderStats(data, delayed) {
    const prices = data && data.prices ? data.prices : {};
    COINS.forEach(({ id, key }) => {
      const row = prices[id] || {};
      const price = formatUsd(row.usd);
      const change = formatChange(row.usd_24h_change);
      setText(`stat-${key}-price`, price);
      setText(`stat-${key}-change`, change);
      applyChangeClass($(`stat-${key}-change`), row.usd_24h_change);
      if (key === "btc") {
        setText("hdr-btc-price", price);
        setText("hdr-btc-change", change);
        applyChangeClass($("hdr-btc-change"), row.usd_24h_change);
        setText("hero-btc-price", price);
        setText("hero-btc-change", change);
        applyChangeClass($("hero-btc-change"), row.usd_24h_change);
      }
    });

    const dom = data && typeof data.dominance === "number" ? `${data.dominance.toFixed(2)}%` : "—";
    setText("stat-btc-dom", dom);

    const fng = data && data.fng ? data.fng : null;
    const fngValue = fng && fng.value != null ? String(fng.value) : "—";
    const fngLabel = fng && fng.value_classification ? fng.value_classification : "";
    setText("stat-fng-value", fngValue);
    setText("stat-fng-label", fngLabel);
    const bar = $("stat-fng-bar");
    if (bar) {
      const n = Number(fng && fng.value);
      bar.style.width = Number.isFinite(n) ? `${Math.max(0, Math.min(100, n))}%` : "0%";
    }

    const stamp = data && data.fetchedAt ? formatTime(data.fetchedAt) : "—";
    setText("updated-at", delayed ? `Last updated: ${stamp}` : `Last updated: ${stamp}`);
    const meta = $("hero-pulse-meta");
    if (meta) {
      meta.textContent = delayed
        ? `Showing cached snapshot from ${stamp}`
        : `Live snapshot · updates every 90 seconds`;
    }
    setDelayed(Boolean(delayed));
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function loadStats() {
    try {
      const [prices, global, fng] = await Promise.all([
        fetchJson(PRICE_URL),
        fetchJson(GLOBAL_URL),
        fetchJson(FNG_URL),
      ]);
      const dominance = global && global.data && global.data.market_cap_percentage
        ? Number(global.data.market_cap_percentage.btc)
        : null;
      const payload = {
        prices,
        dominance: Number.isFinite(dominance) ? dominance : null,
        fng: fng && Array.isArray(fng.data) ? fng.data[0] : null,
        fetchedAt: Date.now(),
      };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch {
        /* ignore quota / private mode */
      }
      renderStats(payload, false);
    } catch (err) {
      const cached = readCache();
      if (cached) {
        renderStats(cached, true);
      } else {
        setDelayed(true);
      }
      console.warn("TradingTherapy stats fetch failed; using cache if available.", err);
    }
  }

  function renderNewsletter(posts) {
    const list = $("newsletter-list");
    if (!list) return;
    list.replaceChildren();
    (posts || []).forEach((post) => {
      const li = document.createElement("li");
      li.className = "archive-item";

      const date = document.createElement("p");
      date.className = "archive-date";
      date.textContent = formatDate(post.date);

      const body = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = post.title || "Untitled";
      const teaser = document.createElement("p");
      teaser.textContent = post.teaser || "";
      body.append(title, teaser);

      li.append(date, body);
      if (post.sample || post.placeholder) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = post.placeholder ? "Placeholder" : "Sample";
        li.append(badge);
      }
      list.append(li);
    });
  }

  function renderLessons(lessons) {
    const grid = $("lessons-grid");
    if (!grid) return;
    grid.replaceChildren();
    (lessons || []).forEach((lesson) => {
      const card = document.createElement("article");
      card.className = "card";
      const status = document.createElement("p");
      status.className = "card-subtitle";
      status.textContent = lesson.status || "coming soon";
      const title = document.createElement("h3");
      title.className = "panel-heading";
      title.textContent = lesson.title || "Lesson";
      const blurb = document.createElement("p");
      blurb.className = "panel-copy";
      blurb.textContent = lesson.blurb || "";
      card.append(status, title, blurb);
      grid.append(card);
    });
  }

  async function loadJsonCollection(path, fallback, key) {
    try {
      const data = await fetchJson(path);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data[key])) return data[key];
      return fallback;
    } catch {
      return fallback;
    }
  }

  async function initContent() {
    const [posts, lessons] = await Promise.all([
      loadJsonCollection("newsletter.json", FALLBACK_POSTS, "posts"),
      loadJsonCollection("lessons.json", FALLBACK_LESSONS, "lessons"),
    ]);
    renderNewsletter(posts);
    renderLessons(lessons);
  }

  // Messenger URLs stay in the HTML; keep a single source if any are added later.
  document.querySelectorAll('a[href="#messenger"]').forEach((a) => {
    a.href = MESSENGER_URL;
  });

  initContent();
  const cached = readCache();
  if (cached) renderStats(cached, false);
  loadStats();
  setInterval(loadStats, REFRESH_MS);
})();

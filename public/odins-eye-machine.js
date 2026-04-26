(function () {
  const KEY = "odinMemory";
  const today = new Date().toISOString().slice(0, 10);
  const defaultMemory = {
    visits: 0, godsOpened: [], runesOpened: [], dailyRunes: {}, poemsGenerated: 0,
    freePoemsUsedDate: null, freePoemsUsedToday: 0, poemCredits: 0, runeDust: 0,
    secretsFound: [], lastVisitDate: null, shareCardsMade: 0
  };

  const runes = [
  {
    id: "fehu",
    symbol: "ᚠ",
    name: "Fehu",
    meaning: "Cattle & Wealth",
    omen: "Resources are moving. Steward what you have, share wisely, and do not confuse possession with security."
  },
  {
    id: "uruz",
    symbol: "ᚢ",
    name: "Uruz",
    meaning: "Aurochs & Vital Force",
    omen: "You have more force available than you think. Use discipline so strength becomes useful instead of reckless."
  },
  {
    id: "thurisaz",
    symbol: "ᚦ",
    name: "Thurisaz",
    meaning: "Thorn / Giant",
    omen: "Pause before acting. A sharp force is present; it can protect you or wound you depending on timing."
  },
  {
    id: "ansuz",
    symbol: "ᚨ",
    name: "Ansuz",
    meaning: "God / Breath / Speech",
    omen: "Listen closely and speak cleanly. The important thing may arrive as a word, sign, teaching, or correction."
  },
  {
    id: "raidho",
    symbol: "ᚱ",
    name: "Raidho",
    meaning: "Ride & Journey",
    omen: "Move with rhythm. The path matters, but so does pace, sequence, and the way you travel."
  },
  {
    id: "kenaz",
    symbol: "ᚲ",
    name: "Kenaz",
    meaning: "Torch & Knowing",
    omen: "A thing can be understood now. Bring skill, attention, and a clean flame to the work."
  },
  {
    id: "gebo",
    symbol: "ᚷ",
    name: "Gebo",
    meaning: "Gift & Exchange",
    omen: "A bond is being formed or tested. Give freely, but keep the exchange honorable and balanced."
  },
  {
    id: "wunjo",
    symbol: "ᚹ",
    name: "Wunjo",
    meaning: "Joy & Fellowship",
    omen: "Let yourself recognize what is working. Joy is not trivial when it restores the group and the heart."
  },
  {
    id: "hagalaz",
    symbol: "ᚺ",
    name: "Hagalaz",
    meaning: "Hail & Disruption",
    omen: "Something may break pattern suddenly. Respond to the weather; do not waste strength arguing with the storm."
  },
  {
    id: "naudhiz",
    symbol: "ᚾ",
    name: "Naudhiz",
    meaning: "Need & Constraint",
    omen: "Separate need from want. Constraint is uncomfortable, but it can clarify the next honest action."
  },
  {
    id: "isa",
    symbol: "ᛁ",
    name: "Isa",
    meaning: "Ice & Stillness",
    omen: "Do not force movement. Stillness may be the medicine, the warning, or the only clean mirror."
  },
  {
    id: "jera",
    symbol: "ᛃ",
    name: "Jera",
    meaning: "Year & Harvest",
    omen: "What was planted returns in season. Work with the cycle instead of trying to bully the calendar."
  },
  {
    id: "eihwaz",
    symbol: "ᛇ",
    name: "Eihwaz",
    meaning: "Yew & Endurance",
    omen: "Hold steady through the threshold. What looks like an ending may be a hard change of form."
  },
  {
    id: "perthro",
    symbol: "ᛈ",
    name: "Perthro",
    meaning: "Lot Cup & Mystery",
    omen: "Not all variables are visible. Leave room for surprise, privacy, and the unknown."
  },
  {
    id: "algiz",
    symbol: "ᛉ",
    name: "Algiz",
    meaning: "Elk & Protection",
    omen: "Raise your awareness. Protection comes from boundaries, attention, and knowing what stands behind you."
  },
  {
    id: "sowilo",
    symbol: "ᛊ",
    name: "Sowilo",
    meaning: "Sun & Victory",
    omen: "Clarity is available. Use the light well; success asks for direction, not just brightness."
  },
  {
    id: "tiwaz",
    symbol: "ᛏ",
    name: "Tiwaz",
    meaning: "Tyr & Justice",
    omen: "Choose the honorable action. Integrity may cost something, but it gives the path its spine."
  },
  {
    id: "berkano",
    symbol: "ᛒ",
    name: "Berkano",
    meaning: "Birch & New Growth",
    omen: "Something young needs tending. Protect the beginning instead of demanding harvest too soon."
  },
  {
    id: "ehwaz",
    symbol: "ᛖ",
    name: "Ehwaz",
    meaning: "Horse & Trust",
    omen: "Progress depends on trust and coordination. Move together or do not move yet."
  },
  {
    id: "mannaz",
    symbol: "ᛗ",
    name: "Mannaz",
    meaning: "Human & Community",
    omen: "Know yourself in relation to others. The answer may be social, not solitary."
  },
  {
    id: "laguz",
    symbol: "ᛚ",
    name: "Laguz",
    meaning: "Water & Flow",
    omen: "Follow the current without surrendering discernment. Feeling may know before language does."
  },
  {
    id: "ingwaz",
    symbol: "ᛜ",
    name: "Ingwaz",
    meaning: "Ing & Seeded Potential",
    omen: "Energy is gathered inside the seed. Finish the inner formation before forcing outer movement."
  },
  {
    id: "dagaz",
    symbol: "ᛞ",
    name: "Dagaz",
    meaning: "Day & Breakthrough",
    omen: "A shift in perspective changes the field. Stand at the threshold and let the new light arrive."
  },
  {
    id: "othala",
    symbol: "ᛟ",
    name: "Othala",
    meaning: "Heritage & Home",
    omen: "Look to roots, home, and inherited patterns. Keep what gives life; release what only repeats harm."
  }
];

  function getOdinMemory() {
    try { return { ...defaultMemory, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return { ...defaultMemory }; }
  }
  function saveOdinMemory(mem) { localStorage.setItem(KEY, JSON.stringify(mem)); }
  let mem = getOdinMemory();

  function recordOdinVisit() {
    if (mem.lastVisitDate !== today) {
      mem.visits += 1;
      mem.lastVisitDate = today;
      mem.freePoemsUsedToday = 0;
      mem.freePoemsUsedDate = today;
      saveOdinMemory(mem);
    }
  }
  function normalizeId(text) {
    return String(text || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function toast(text) {
    const el = document.createElement("div");
    el.className = "odin-discovery-toast";
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 420); }, 2600);
  }
  function addRuneDust(amount) {
    mem.runeDust += amount;
    saveOdinMemory(mem);
    updateProgressOrb();
  }
  function hasSecret(id) { return mem.secretsFound.includes(id); }
  function addSecret(id, label) {
    if (hasSecret(id)) return;
    mem.secretsFound.push(id);
    saveOdinMemory(mem);
    toast("✦ secret found: " + label);
    document.body.classList.add("odin-secret-pulse");
    setTimeout(() => document.body.classList.remove("odin-secret-pulse"), 1400);
  }
  function recordGodOpen(id) {
    if (!mem.godsOpened.includes(id)) { mem.godsOpened.push(id); addRuneDust(1); }
    saveOdinMemory(mem); checkSecrets();
  }
  function recordRuneOpen(id) {
    if (!mem.runesOpened.includes(id)) { mem.runesOpened.push(id); addRuneDust(1); }
    saveOdinMemory(mem); checkSecrets();
  }
  function recordPoemGenerated() {
    mem.poemsGenerated += 1;
    saveOdinMemory(mem);
    checkSecrets();
  }
  function recordShare() {
    mem.shareCardsMade += 1;
    saveOdinMemory(mem);
    addSecret("public_omen", "Public Omen");
    updateProgressOrb();
  }

  function updateProgressOrb() {
    let orb = document.querySelector("#odin-progress-orb");
    if (!orb) {
      orb = document.createElement("button");
      orb.id = "odin-progress-orb";
      orb.className = "odin-progress-orb is-floating";
      orb.type = "button";
      document.body.appendChild(orb);
    }
    orb.innerHTML = `<span>ᚱ</span><strong>${mem.runeDust}</strong><small>rune dust</small>`;
  }
  function checkSecrets() {
    if (mem.godsOpened.filter((x) => x.startsWith("greek:")).length >= 3) addSecret("olympian_echo", "Olympian Echo");
    if (mem.godsOpened.filter((x) => x.startsWith("norse:")).length >= 3) addSecret("raven_whisper", "Raven Whisper");
    if (mem.runesOpened.length >= 5) addSecret("futhark_path", "Futhark Path");
    if (Object.keys(mem.dailyRunes || {}).length >= 3) addSecret("three_dawn_mark", "Three Dawn Mark");
    if (mem.poemsGenerated >= 3) addSecret("skald_tongue", "Skald Tongue");
    if (mem.shareCardsMade >= 1) addSecret("public_omen", "Public Omen");
  }

  function filterCards() {
    const q = document.querySelector("#odin-search")?.value.trim().toLowerCase() || "";
    const active = document.querySelector(".odin-tabs button.active")?.dataset.odinFilter || "all";
    document.querySelectorAll(".odin-artifact-card").forEach((card) => {
      const text = card.textContent.toLowerCase();
      const kind = card.dataset.rune !== undefined ? "rune" : card.dataset.secretCard !== undefined ? "secret" : card.dataset.pantheon || "myth";
      const matchKind = active === "all" || kind === active;
      card.style.display = matchKind && (!q || text.includes(q)) ? "" : "none";
    });
  }

  function enhanceCards() {
    document.querySelectorAll(".odin-artifact-card, .god-card, .rune-card").forEach((card) => {
      if (card.dataset.odinEnhanced) return;
      card.dataset.odinEnhanced = "1";
      card.classList.add("odin-artifact-card");
      card.addEventListener("click", () => {
        card.classList.toggle("expanded");
        const title = card.querySelector("h3,h2,.god-name,.rune-name")?.textContent || card.dataset.id || "unknown";
        if (card.dataset.rune !== undefined || card.classList.contains("rune-card")) {
          const id = "rune:" + normalizeId(title);
          recordRuneOpen(id);
          toast("✦ a rune stirred");
        } else if (card.dataset.god !== undefined || card.classList.contains("god-card")) {
          const pantheon = card.dataset.pantheon || (card.closest("#norse-grid,#section-norse") ? "norse" : "greek");
          const id = pantheon + ":" + normalizeId(title);
          recordGodOpen(id);
          toast("✦ " + title.trim() + " has weight");
        }
        card.classList.add("is-discovered");
      });
    });
  }

  function seededRune() {
    const seed = Number(today.split("-").join(""));
    return runes[seed % runes.length];
  }
  function drawDailyRune() {
    const rune = seededRune();
    const stage = document.querySelector("#daily-rune-stage");
    if (stage) {
      stage.innerHTML = `<div class="daily-rune-symbol">${rune.symbol}</div><div><h2>${rune.name}</h2><p>${rune.meaning}. ${rune.omen}</p></div>`;
    }
    const legacyDisplay = document.querySelector("#drawn-rune-display");
    if (legacyDisplay) {
      legacyDisplay.classList.add("visible");
      const symbol = document.querySelector("#drawn-symbol");
      const name = document.querySelector("#drawn-name");
      const meaning = document.querySelector("#drawn-meaning");
      const message = document.querySelector("#drawn-message");
      if (symbol) symbol.textContent = rune.symbol;
      if (name) name.textContent = rune.name;
      if (meaning) meaning.textContent = rune.meaning;
      if (message) message.textContent = rune.omen;
    }
    if (!mem.dailyRunes[today]) {
      mem.dailyRunes[today] = rune.id;
      recordRuneOpen("daily:" + rune.id);
      addRuneDust(2);
      toast("✦ today's rune has chosen you");
    } else {
      toast("✦ the rune remembers today's pull");
    }
    let host = document.querySelector("#odin-rune-share");
    if (!host && document.querySelector(".draw-rune-area")) {
      host = document.createElement("div");
      host.id = "odin-rune-share";
      document.querySelector(".draw-rune-area").appendChild(host);
    }
    if (host) {
      host.innerHTML = '<button class="odin-share-button" type="button">Share my rune</button>';
      host.querySelector("button").onclick = () => window.OdinShareCard.showShareCard({
        title: rune.symbol + " " + rune.name,
        body: rune.meaning,
        omen: rune.omen
      });
    }
    checkSecrets();
  }

  function poemCost(mode) { return mode === "share" ? 3 : mode === "prophecy" ? 2 : 1; }
  function showPremiumPanel(cost) {
    const panel = document.createElement("div");
    panel.className = "odin-premium-lock";
    panel.innerHTML = `<div><button class="odin-credit-close">x</button><h2>The well is quiet.</h2><p>Add dream credits to weave another poem.</p><p>Need ${cost} credit${cost === 1 ? "" : "s"}. Current credits: ${mem.poemCredits}.</p><button class="odin-share-button">Credit shop coming soon</button></div>`;
    panel.querySelector(".odin-credit-close").onclick = () => panel.remove();
    document.body.appendChild(panel);
  }
  async function generatePoem(form) {
    const fd = new FormData(form);
    const mode = fd.get("mode") || "free";
    const cost = poemCost(mode);
    if (mem.freePoemsUsedToday < 1) {
      mem.freePoemsUsedToday += 1;
    } else if (mem.poemCredits >= cost) {
      mem.poemCredits -= cost;
    } else {
      saveOdinMemory(mem);
      showPremiumPanel(cost);
      return;
    }
    saveOdinMemory(mem);
    const payload = {
      subject: String(fd.get("subject") || "").slice(0, 180),
      style: fd.get("style"),
      mood: fd.get("mood"),
      inspiration: String(fd.get("inspiration") || "").slice(0, 300),
      mode
    };
    const result = document.querySelector("#odin-poem-result");
    result.innerHTML = '<div class="odin-poem-result-card"><h2>The ravens are listening...</h2></div>';
    try {
      const res = await fetch("/api/odin-poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Poem failed");
      recordPoemGenerated();
      result.innerHTML = `<article class="odin-poem-result-card"><h2>${data.title}</h2><pre>${data.poem}</pre><p>${data.omen}</p><button class="odin-share-button" type="button">Make this a share card</button></article>`;
      result.querySelector("button").onclick = () => window.OdinShareCard.showShareCard({
        title: data.title, body: data.poem, omen: data.shareLine || data.omen
      });
      toast("✦ poem woven");
    } catch {
      result.innerHTML = '<div class="odin-poem-result-card"><h2>The ravens scattered.</h2><p>Try again.</p></div>';
    }
  }

  async function generateLegacyPoem() {
    const subjectEl = document.querySelector("#poem-subject");
    const subject = subjectEl?.value.trim() || "";
    if (!subject) { subjectEl?.focus(); return; }
    const payload = {
      subject,
      style: (document.querySelector("#poem-style")?.value || "skald").toLowerCase().replace(/\s+/g, "-"),
      mood: (document.querySelector("#poem-mood")?.value || "moonlit").toLowerCase().replace(/\s+/g, "-"),
      inspiration: document.querySelector("#poem-theme")?.value.trim() || "",
      mode: "free"
    };
    if (!["skald","prophecy","soft","battle"].includes(payload.style)) payload.style = "skald";
    if (!["moonlit","fierce","tender","strange"].includes(payload.mood)) payload.mood = "moonlit";
    const loading = document.querySelector("#poem-loading");
    const result = document.querySelector("#poem-result");
    const text = document.querySelector("#poem-text");
    loading?.classList.add("visible");
    result?.classList.remove("visible");
    try {
      const res = await fetch("/api/odin-poem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Poem failed");
      recordPoemGenerated();
      if (text) {
        text.className = "poem-text";
        text.textContent = `${data.title}\n\n${data.poem}\n\n${data.omen}`;
      }
      result?.classList.add("visible");
      if (result && !result.querySelector("[data-odin-share-poem]")) {
        const btn = document.createElement("button");
        btn.className = "odin-share-button";
        btn.dataset.odinSharePoem = "1";
        btn.textContent = "Make this a share card";
        btn.onclick = () => window.OdinShareCard.showShareCard({ title: data.title, body: data.poem, omen: data.shareLine || data.omen });
        result.appendChild(btn);
      }
      toast("✦ poem woven");
    } catch {
      if (text) {
        text.className = "poem-error";
        text.textContent = "The ravens scattered. Try again.";
      }
      result?.classList.add("visible");
    } finally {
      loading?.classList.remove("visible");
    }
  }

  function init() {
    document.body.classList.add("odin-page");
    if (!document.querySelector(".odin-machine-bg")) {
      document.body.insertAdjacentHTML("afterbegin", '<div class="odin-machine-bg"></div><div class="odin-orbit-particles" aria-hidden="true"></div>');
    }
    recordOdinVisit();
    updateProgressOrb();
    enhanceCards();
    checkSecrets();
    document.querySelector("#odin-search")?.addEventListener("input", filterCards);
    document.querySelectorAll(".odin-tabs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".odin-tabs button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        filterCards();
      });
    });
    document.querySelector("#draw-daily-rune")?.addEventListener("click", drawDailyRune);
    const legacyDraw = document.querySelector(".draw-btn");
    if (legacyDraw) legacyDraw.onclick = drawDailyRune;
    document.querySelector("#odin-poem-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      generatePoem(e.currentTarget);
    });
    const legacyPoem = document.querySelector("#poem-btn");
    if (legacyPoem) legacyPoem.onclick = generateLegacyPoem;
    document.querySelector("[data-share-page]")?.addEventListener("click", () => window.OdinShareCard.showShareCard({
      title: "Odin's Eye",
      body: "Choose a path. Touch the names. Wake the runes.",
      omen: "pixie-portal.com/odins_eye"
    }));
  }

  window.OdinMachine = {
    getOdinMemory, saveOdinMemory, recordOdinVisit, recordGodOpen, recordRuneOpen,
    recordPoemGenerated, addRuneDust, addSecret, hasSecret, recordShare
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(function () {
  const STYLE_ID = "loki-pixie-style";
  const ROOT_ID = "loki-pixie-agent";
  const starters = [
    {
      role: "assistant",
      content:
        "Hi, I am Loki in pixie form. Ask me about games, The Portal, the spellbook, journals, tarot, or where to start.",
    },
  ];
  let messages = starters.slice();
  let open = false;
  let loading = false;
  let lokiMode = "live";

  function getUserContext() {
    if (typeof currentUser === "undefined" || !currentUser) return null;
    return {
      displayName: currentUser.display_name || "",
      username: currentUser.username || "",
      avatar: currentUser.avatar_emoji || "",
      bio: currentUser.bio || "",
    };
  }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function localReply(text) {
    const lower = String(text || "").toLowerCase();
    if (lower.includes("where") && lower.includes("start")) {
      return "Start in The Portal. Open one chamber, do one focused action, save it, then return to the Portal. That loop is the spine.";
    }
    if (lower.includes("wadu") || lower.includes("hello") || lower.includes("yo") || lower.includes("hey") || lower.includes("og")) {
      return "I am here. The live connection is being stubborn, but I still know the map: Portal first, My Pixie second, Dream Well third.";
    }
    if (lower.includes("grok") || lower.includes("portrait")) {
      return "For Grok portrait work: open My Pixie, click the portrait piece, generate, then save it back to the altar.";
    }
    return "I am here. The live model is busy, so here is the practical path: Portal -> chamber -> save -> altar.";
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{position:fixed;right:18px;bottom:18px;z-index:9998;font-family:Quicksand,Arial,sans-serif;color:#f0d0ff;transform:scale(.9);transform-origin:bottom right}
      body.pixie-profile-page #${ROOT_ID},body.my-pixie-page-active #${ROOT_ID}{display:none!important}
      .loki-pixie-toggle{display:flex;align-items:center;gap:10px;max-width:282px;padding:9px 12px;border-radius:20px;border:1px solid rgba(255,150,200,.32);background:linear-gradient(135deg,rgba(26,16,48,.92),rgba(13,8,32,.92));box-shadow:0 10px 35px rgba(180,100,255,.18);cursor:pointer;color:#f0d0ff;text-align:left}
      .loki-pixie-toggle:hover{border-color:#ff96c8;box-shadow:0 10px 45px rgba(255,150,200,.28)}
      .loki-pixie-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 30% 20%,#96ffdc,#b496ff 55%,#ff96c8);box-shadow:0 0 20px rgba(150,255,220,.35);font-size:24px;flex:0 0 auto}
      .loki-pixie-title{display:block;color:#ff96c8;font-size:13px;font-weight:700;letter-spacing:1px}
      .loki-pixie-sub{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#9080b0;font-size:11px;line-height:1.35;margin-top:2px}
      .loki-pixie-panel{width:350px;max-width:calc(100vw - 36px);border-radius:22px;overflow:hidden;border:1px solid rgba(180,150,255,.25);background:linear-gradient(135deg,#1a1030,#0d0820);box-shadow:0 16px 55px rgba(0,0,0,.45)}
      .loki-pixie-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(180,150,255,.16);background:rgba(20,12,35,.72)}
      .loki-pixie-name{display:flex;align-items:center;gap:10px}
      .loki-pixie-name strong{display:block;color:#ff96c8;font-size:14px}
      .loki-pixie-name span{display:block;color:#96ffdc;font-size:11px;letter-spacing:1px;text-transform:uppercase}
      .loki-pixie-status{display:inline-flex;align-items:center;gap:5px;margin-top:3px;color:#96ffdc;font-size:10px;font-style:normal;letter-spacing:1px;text-transform:uppercase}
      .loki-pixie-status::before{content:"";width:6px;height:6px;border-radius:50%;background:#96ffdc;box-shadow:0 0 10px rgba(150,255,220,.7)}
      .loki-pixie-status.quiet{color:#ffd88a}
      .loki-pixie-status.quiet::before{background:#ffd88a;box-shadow:0 0 10px rgba(255,216,138,.65)}
      .loki-pixie-close{border:0;background:transparent;color:#9080b0;font-size:20px;cursor:pointer;padding:4px 8px}
      .loki-pixie-close:hover{color:#ff96c8}
      .loki-pixie-log{max-height:310px;overflow-y:auto;padding:13px;display:flex;flex-direction:column;gap:9px}
      .loki-pixie-msg{padding:9px 11px;border-radius:15px;font-size:13px;line-height:1.45}
      .loki-pixie-msg.assistant{background:rgba(180,150,255,.1);border:1px solid rgba(180,150,255,.12);color:#f0d0ff;margin-right:28px}
      .loki-pixie-msg.user{background:linear-gradient(135deg,#ff96c8,#b496ff);color:#0a0614;margin-left:28px;font-weight:600}
      .loki-pixie-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(180,150,255,.16)}
      .loki-pixie-input{min-width:0;flex:1;border-radius:18px;border:1px solid rgba(180,150,255,.24);background:rgba(20,12,35,.85);color:#f0d0ff;padding:10px 12px;font:13px Quicksand,Arial,sans-serif;outline:none}
      .loki-pixie-input:focus{border-color:#ff96c8}
      .loki-pixie-send{border:0;border-radius:18px;background:linear-gradient(135deg,#ff96c8,#b496ff);color:#0a0614;font-weight:700;padding:0 14px;cursor:pointer;font:12px Quicksand,Arial,sans-serif;letter-spacing:1px;text-transform:uppercase}
      .loki-pixie-send:disabled{opacity:.45;cursor:not-allowed}
      @media (max-width:520px){#${ROOT_ID}{right:14px;bottom:18px;transform:none}.loki-pixie-toggle{width:62px;height:62px;padding:0;border-radius:50%;justify-content:center}.loki-pixie-toggle>span{display:none}.loki-pixie-toggle .loki-pixie-avatar{width:54px;height:54px;font-size:27px}.loki-pixie-panel{width:calc(100vw - 24px);max-height:62vh}.loki-pixie-log{max-height:calc(62vh - 132px)}.loki-pixie-msg{font-size:12px}.loki-pixie-msg.assistant{margin-right:10px}.loki-pixie-msg.user{margin-left:10px}}
    `;
    document.head.appendChild(style);
  }

  function avatar() {
    return '<div class="loki-pixie-avatar" aria-hidden="true">&#x1F9DA;</div>';
  }

  function render() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    if (!open) {
      const latest = messages[messages.length - 1]?.content || "Ask me about the portal.";
      const user = getUserContext();
      const title = user?.displayName ? `Ask Loki, ${user.displayName}` : "Ask Loki Pixie";
      root.innerHTML = `
        <button class="loki-pixie-toggle" type="button" aria-label="Open Loki Pixie chat">
          ${avatar()}
          <span><span class="loki-pixie-title">${esc(title)}</span><span class="loki-pixie-sub">${esc(latest)}</span></span>
        </button>`;
      root.querySelector("button").onclick = function () {
        open = true;
        render();
      };
      return;
    }

    root.innerHTML = `
      <section class="loki-pixie-panel" aria-label="Loki Pixie chat">
        <div class="loki-pixie-head">
          <div class="loki-pixie-name">${avatar()}<div><strong>Loki Pixie</strong><span>portal guide</span><em class="loki-pixie-status ${lokiMode === "quiet" ? "quiet" : ""}">${lokiMode === "quiet" ? "quiet mode" : "live"}</em></div></div>
          <button class="loki-pixie-close" type="button" aria-label="Close chat">&times;</button>
        </div>
        <div class="loki-pixie-log">
          ${messages
            .map((message) => `<div class="loki-pixie-msg ${message.role}">${esc(message.content)}</div>`)
            .join("")}
          ${loading ? '<div class="loki-pixie-msg assistant">stirring sparkle...</div>' : ""}
        </div>
        <form class="loki-pixie-form">
          <input class="loki-pixie-input" placeholder="Ask Loki..." maxlength="500">
          <button class="loki-pixie-send" type="submit" ${loading ? "disabled" : ""}>Send</button>
        </form>
      </section>`;

    root.querySelector(".loki-pixie-close").onclick = function () {
      open = false;
      render();
    };
    const log = root.querySelector(".loki-pixie-log");
    log.scrollTop = log.scrollHeight;
    const form = root.querySelector("form");
    const input = root.querySelector("input");
    input.focus();
    form.onsubmit = send;
  }

  async function send(event) {
    event.preventDefault();
    if (loading) return;
    const input = event.currentTarget.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    messages.push({ role: "user", content: text });
    input.value = "";
    loading = true;
    render();
    try {
      const response = await fetch("/api/pixie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, user: getUserContext() }),
      });
      const data = await response.json().catch(() => ({}));
      lokiMode = data.degraded ? "quiet" : "live";
      messages.push({
        role: "assistant",
        content: data.reply || localReply(text),
      });
    } catch {
      lokiMode = "quiet";
      messages.push({
        role: "assistant",
        content: localReply(text),
      });
    } finally {
      loading = false;
      render();
    }
  }

  function init() {
    if (document.getElementById(ROOT_ID)) return;
    injectStyle();
    const root = document.createElement("div");
    root.id = ROOT_ID;
    document.body.appendChild(root);
    window.updateLokiPixieUser = render;
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

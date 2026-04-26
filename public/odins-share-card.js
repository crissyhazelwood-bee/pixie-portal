(function () {
  function wrap(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    const lines = [];
    words.forEach((word) => {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
    return y + lines.length * lineHeight;
  }

  function makeShareCard(data, opts) {
    const w = opts && opts.w ? opts.w : 1080;
    const h = opts && opts.h ? opts.h : 1350;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#090414");
    g.addColorStop(0.45, "#2a0b3e");
    g.addColorStop(1, "#06202a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 180; i++) {
      ctx.globalAlpha = 0.18 + Math.random() * 0.28;
      ctx.fillStyle = i % 3 ? "#ff9cd9" : "#92ffe1";
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(255,220,168,.72)";
    ctx.lineWidth = 10;
    ctx.strokeRect(54, 54, w - 108, h - 108);
    ctx.strokeStyle = "rgba(255,156,217,.32)";
    ctx.lineWidth = 3;
    ctx.strokeRect(82, 82, w - 164, h - 164);

    ctx.fillStyle = "#ffe3ad";
    ctx.font = "800 34px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Pixie Portal / Odin's Eye", w / 2, 142);

    ctx.font = "800 82px Georgia";
    ctx.fillStyle = "#ffffff";
    wrap(ctx, data.title || "Odin's Eye", w / 2, 280, w - 220, 92);

    ctx.font = "500 38px Georgia";
    ctx.fillStyle = "#f0ddff";
    ctx.textAlign = "left";
    wrap(ctx, data.body || data.poem || data.omen || "", 142, 500, w - 284, 58);

    ctx.font = "700 34px Georgia";
    ctx.fillStyle = "#92ffe1";
    wrap(ctx, data.omen || data.shareLine || "Choose a path. Wake the rune.", 142, h - 250, w - 284, 46);

    ctx.textAlign = "center";
    ctx.font = "800 28px Georgia";
    ctx.fillStyle = "#d8c6ff";
    ctx.fillText("pixie-portal.com/odins_eye", w / 2, h - 106);
    return canvas;
  }

  async function showShareCard(data) {
    const canvas = makeShareCard(data || {});
    const url = canvas.toDataURL("image/png");
    const modal = document.createElement("div");
    modal.className = "odin-share-modal";
    modal.innerHTML = '<div class="odin-share-modal-inner"><h2>Share card ready</h2><img alt="Odin share card"><div><button class="odin-share-button" data-download>Download PNG</button> <button class="odin-back" data-close>Close</button></div></div>';
    modal.querySelector("img").src = url;
    modal.querySelector("[data-close]").onclick = () => modal.remove();
    modal.querySelector("[data-download]").onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "odins-eye-card.png";
      a.click();
    };
    document.body.appendChild(modal);
    if (window.OdinMachine && window.OdinMachine.recordShare) window.OdinMachine.recordShare();
  }

  window.OdinShareCard = { makeShareCard, showShareCard };
})();

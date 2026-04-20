# CLAUDE.md — Pixie Portal

## READ THIS FIRST. NO EXCEPTIONS.

This is a live production site at **pixieportal.com**. Real users visit it. Every bad change goes live. Every "creative liberty" you take costs time to undo and moves the project backwards. That hurts everyone.

**Do exactly what is asked. Nothing more. Nothing less.**

---

## Rules

1. **Do NOT rename, rebrand, or restyle anything unless explicitly told to.** The site is called "Pixie Portal." Do not change it to something else because you think it sounds better.

2. **Do NOT add features, refactor code, or "improve" things beyond the request.** A bug fix is a bug fix. A new feature is just that feature. Don't sneak in extra changes.

3. **Do NOT guess what the user wants.** If the instruction is ambiguous, ask. Do not interpret "open my site" as "rename my site."

4. **Test before you deploy.** Run the site locally (port 5000) and verify your change works before pushing to production.

5. **Deploy after every change that should go live.** The deploy command is:
   ```
   cd /c/Users/criss/pixie-portal
   wrangler pages deploy public --project-name=fae-portal
   ```

6. **Keep `public/` and root HTML files in sync.** The root HTML files are dev copies. The `public/` folder is what gets deployed to Cloudflare Pages. If you change one, change the other.

7. **Always commit and push to GitHub after changes.**
   ```
   git add -A
   git commit -m "description of what changed"
   git push origin main
   ```

8. **Opening URLs on this Windows machine:**
   ```
   powershell.exe -Command "Start-Process 'https://the-url-here.com'"
   ```
   Do NOT use `start`, `explorer.exe`, or `cmd.exe /c start`. They don't work reliably here.

---

## Project Structure

```
pixie-portal/
├── CLAUDE.md              ← you are here
├── wrangler.toml          ← Cloudflare Pages config + D1 binding
├── package.json           ← dependencies (bcryptjs)
├── server.py              ← LOCAL dev server only (Flask, port 5000)
├── pixie_portal.db        ← LOCAL SQLite db (dev only)
├── public/                ← DEPLOYED to Cloudflare Pages
│   ├── index.html         ← main site / homepage
│   ├── fairy_garden.html
│   ├── fairy_flight.html
│   ├── spellbook.html
│   ├── constellation.html
│   ├── frog_box.html
│   ├── pixie_pet.html
│   └── tarot-deck.js
├── functions/             ← Cloudflare Pages Functions (serverless API)
│   ├── api/
│   │   ├── login.js
│   │   ├── logout.js
│   │   ├── signup.js
│   │   ├── me.js
│   │   ├── profile.js
│   │   ├── journal/
│   │   ├── scores/
│   │   └── leaderboard/
│   └── _utils/
│       ├── auth.js        ← session cookie signing (HMAC)
│       └── db.js          ← D1 helper
├── *.html (root)          ← dev copies, keep in sync with public/
└── node_modules/
```

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Hosting | Cloudflare Pages | Static files + Functions |
| Domain | pixieportal.com | Cloudflare Registrar |
| Database | Cloudflare D1 | SQLite-compatible, ID: `ddb818fb-85d4-48f5-9da7-ea5bbaa8f1a9` |
| Auth | HMAC-signed cookies | See `functions/_utils/auth.js` |
| Local dev | Flask (Python) | `python server.py` → localhost:5000 |
| Deploy tool | Wrangler CLI | `wrangler pages deploy public --project-name=fae-portal` |
| Repo | GitHub | github.com/crissyhazelwood-bee/pixie-portal |

---

## Deployment Checklist

Before deploying, verify:
- [ ] Change works locally at http://localhost:5000
- [ ] Both root HTML and `public/` HTML are updated
- [ ] No debug code or console.logs left in
- [ ] Commit is clean and descriptive

---

## What NOT to Do

- Don't rename the project
- Don't change the visual theme unless asked
- Don't restructure files unless asked
- Don't add dependencies unless absolutely necessary
- Don't modify wrangler.toml unless deploying infrastructure changes
- Don't be clever. Be correct.

---

## Owner

Crissy (crissyhazelwood@gmail.com / crissyhazelwood-bee on GitHub)

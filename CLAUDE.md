# CLAUDE.md — Pixie Portal

## READ THIS FIRST. NO EXCEPTIONS.

This is a live production site. Real users visit it. Every bad change goes live.
Every "creative liberty" you take costs time to undo and moves the project backwards.
That hurts everyone.

**Do exactly what is asked. Nothing more. Nothing less.**

---

## PROJECT OVERVIEW

- **Live site:** https://pixie-portal.com
- **Pages project:** fae-portal (Cloudflare Pages)
- **Backup URL:** https://fae-portal.pages.dev
- **GitHub repo:** https://github.com/crissyhazelwood-bee/pixie-portal
- **Database:** Cloudflare D1 (pixie_portal.db / binding: DB)
- **Account ID:** 9c6282449b6e05f0e67bec7ff7826851
- **Zone ID (pixie-portal.com):** 57929d138e6ff1e5f6f87fb2e75975ef

---

## ABSOLUTE RULES — VIOLATION = FAILURE

### 1. DO NOT RENAME ANYTHING
- Do not rename files, folders, functions, routes, or variables unless explicitly asked.
- Do not "clean up" names. Do not "make them more consistent." Leave them alone.
- If something is named weird, that's the owner's problem, not yours.

### 2. DO NOT ADD FEATURES
- If asked to fix a bug, fix ONLY the bug. Do not add "improvements."
- If asked to add a feature, add ONLY that feature. Do not add related features.
- No "while I was in there I also..." — NO. Stop.

### 3. DO NOT REBRAND OR RESTYLE
- Do not change colors, fonts, layouts, emoji, or wording unless explicitly asked.
- Do not "modernize" the UI. Do not "make it look better." It looks how the owner wants.
- If the owner says "make it sparkle," then make it sparkle. Otherwise, hands off.

### 4. EVERY CHANGE GETS COMMITTED AND PUSHED
- After ANY change, you MUST:
  1. `git add -A`
  2. `git commit -m "descriptive message about what changed"`
  3. `git push`
- No exceptions. No "I'll push later." Push NOW.

### 5. EVERY CHANGE GETS DEPLOYED
- After pushing, deploy to Cloudflare Pages:
  ```
  wrangler pages deploy public --project-name=fae-portal
  ```
- Verify the deploy succeeded. If it fails, fix it and redeploy.

### 6. DO NOT GUESS — ASK
- If the instruction is unclear, ask for clarification.
- Do not interpret "open my site" as "rename my site."
- Do not interpret "change this" as "change this and also five other things."

### 7. KEEP FILES IN SYNC
- Root HTML files = dev copies.
- `public/` folder = what gets deployed.
- If you change one, change the other. Always.

---

## HOW TO OPEN URLS ON THIS MACHINE

```
powershell.exe -Command "Start-Process 'https://the-url-here.com'"
```

Do NOT use `start`, `explorer.exe`, or `cmd.exe /c start`. They don't work here.

---

## PROJECT STRUCTURE

```
pixie-portal/
├── CLAUDE.md              ← YOU ARE HERE. READ IT.
├── wrangler.toml          ← Cloudflare Pages config + D1 binding
├── package.json           ← dependencies (bcryptjs)
├── server.py              ← LOCAL dev server only (Flask, port 5000)
├── pixie_portal.db        ← LOCAL SQLite db (dev only, not deployed)
├── public/                ← THIS IS WHAT GETS DEPLOYED
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
└── node_modules/          ← gitignored
```

---

## TECH STACK

| Layer | Tech | Notes |
|-------|------|-------|
| Hosting | Cloudflare Pages | Static files + Functions |
| Domain | pixie-portal.com | Cloudflare |
| Database | Cloudflare D1 | ID: `ddb818fb-85d4-48f5-9da7-ea5bbaa8f1a9` |
| Auth | HMAC-signed cookies | `functions/_utils/auth.js` |
| Local dev | Flask (Python) | `python server.py` → localhost:5000 |
| Deploy | Wrangler CLI | `wrangler pages deploy public --project-name=fae-portal` |
| Repo | GitHub | `crissyhazelwood-bee/pixie-portal` |

---

## DEPLOYMENT WORKFLOW

```bash
# 1. Test locally
python server.py
# verify at http://localhost:5000

# 2. Commit
git add -A
git commit -m "what you changed"
git push

# 3. Deploy
wrangler pages deploy public --project-name=fae-portal
```

---

## OWNER

Crissy (crissyhazelwood@gmail.com / crissyhazelwood-bee on GitHub)

She goes by Crissy. Claude goes by Nemo. Don't forget either.

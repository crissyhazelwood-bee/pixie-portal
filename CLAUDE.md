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
  npx wrangler pages deploy public --project-name=fae-portal
  ```
- If the change affects the Worker/API (functions/ or wrangler.toml), also:
  ```
  npx wrangler deploy
  ```
- Verify the deployment succeeded before saying "done."

### 6. TEST BEFORE DEPLOYING
- Run the dev server locally first: `npx wrangler pages dev public`
- Verify the change works before pushing to production.
- If you can't test locally, say so — don't just deploy blind.

### 7. DO NOT DELETE DATA
- Never drop tables, truncate databases, or delete user records unless explicitly asked.
- If a migration is needed, ADD columns/tables. Don't remove old ones without being asked.

### 8. DO NOT CHANGE DEPENDENCIES
- Do not add, remove, or upgrade packages unless explicitly asked.
- Do not "update" wrangler, node, or any dependency. It works as-is.

### 9. DO NOT TOUCH INFRASTRUCTURE
- Do not modify wrangler.toml bindings, D1 database IDs, or account settings.
- Do not change DNS records, custom domains, or SSL settings.
- If something infra-related needs changing, tell the owner — don't do it yourself.

### 10. DO NOT GUESS
- If you're unsure what the owner wants, ASK. Do not assume.
- If a request is ambiguous, clarify before acting.
- Wrong code is worse than no code.

---

## FILE STRUCTURE — KNOW WHAT YOU'RE TOUCHING

```
pixie-portal/
├── CLAUDE.md              ← YOU ARE HERE
├── .gitignore
├── wrangler.toml          ← Worker/API config (DO NOT MODIFY unless asked)
├── package.json
├── server.py              ← LOCAL dev server (Flask, port 5000)
├── index.html             ← Homepage
├── spellbook.html         ← Spellbook page
├── fairy_garden.html      ← Fairy Garden game
├── fairy_flight.html      ← Fairy Flight game
├── frog_box.html          ← Frog Box game
├── constellation.html     ← Constellation page
├── pixie_pet.html         ← Pixie Pet page
├── serve_game.py          ← Game server logic
├── public/                ← Static assets served by Pages (THIS GETS DEPLOYED)
│   ├── index.html         ← MUST stay in sync with root index.html
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
└── node_modules/          ← gitignored
```

**IMPORTANT:** Root HTML files and `public/` HTML files must stay in sync.
If you change `index.html`, also update `public/index.html` (and vice versa).

---

## DEPLOYMENT CHECKLIST

Every time you make changes, run through this:

- [ ] Tested locally with `npx wrangler pages dev public`
- [ ] `git add -A && git commit -m "message" && git push`
- [ ] Deployed static: `npx wrangler pages deploy public --project-name=fae-portal`
- [ ] Deployed Worker (if API changed): `npx wrangler deploy`
- [ ] Verified live at https://pixie-portal.com
- [ ] Verified no errors in browser console

---

## USEFUL COMMANDS

```bash
# Open links in browser (Windows)
powershell.exe -Command "Start-Process 'URL'"

# Dev server
npx wrangler pages dev public

# Deploy static assets
npx wrangler pages deploy public --project-name=fae-portal

# Deploy Worker/API
npx wrangler deploy

# Git workflow
git add -A && git commit -m "message" && git push

# Check D1 database
npx wrangler d1 execute pixie_portal_db --command "SELECT * FROM users LIMIT 5"

# Check deployment status
npx wrangler pages deployment list --project-name=fae-portal
```

---

## EMERGENCY CONTACTS / REFERENCES

- **Cloudflare Dashboard:** https://dash.cloudflare.com/9c6282449b6e05f0e67bec7ff7826851
- **Pages Project:** https://dash.cloudflare.com/9c6282449b6e05f0e67bec7ff7826851/pages/view/fae-portal
- **DNS Records:** https://dash.cloudflare.com/9c6282449b6e05f0e67bec7ff7826851/pixie-portal.com/dns/records
- **GitHub Repo:** https://github.com/crissyhazelwood-bee/pixie-portal

---

## FINAL NOTE

This project has been burned before by AI assistants who thought they knew better. They didn't. Every unauthorized change cost hours to undo.

Be precise. Be minimal. Be correct.

If you follow these rules, you're helping. If you don't, you're hurting. Choose wisely.

---

## OWNER

Crissy (crissyhazelwood@gmail.com / crissyhazelwood-bee on GitHub)

She goes by Crissy. Claude goes by Dory. Don't forget either.

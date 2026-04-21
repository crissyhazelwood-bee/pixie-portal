# Pixie Portal — Dev Workflow Cheat Sheet

## Every time you start new work

```bash
# Make sure you're up to date first
git checkout master
git pull

# Create a new branch
git checkout -b feature/what-youre-building
```

**Branch name examples:**
- `feature/portal-sound`
- `feature/new-game-potions`
- `fix/login-bug`
- `update/fairy-customizer`

---

## Make your changes, then save them

```bash
# Stage everything
git add .

# Commit with a description
git commit -m "what you did"

# Push to GitHub
git push -u origin feature/what-youre-building
```

---

## Open a Pull Request

```bash
gh pr create --title "What you did" --body "Brief description of the changes"
```

CodeRabbit will automatically review it within a minute or two. Check the PR on GitHub to see its feedback.

---

## Merge when you're ready

```bash
gh pr merge --squash --delete-branch
```

This merges your changes into master and cleans up the branch.

---

## Quick reference — full flow start to finish

```bash
git checkout master && git pull
git checkout -b feature/my-feature

# ... do your work ...

git add .
git commit -m "describe the change"
git push -u origin feature/my-feature
gh pr create --title "My feature" --body "What changed and why"

# Wait for CodeRabbit, then:
gh pr merge --squash --delete-branch
```

---

## Useful extras

```bash
# See what branch you're on
git branch

# See what files you changed
git status

# See all open PRs
gh pr list

# Check CodeRabbit's review on your PR
gh pr view --web
```

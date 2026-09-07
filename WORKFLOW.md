# Goodslister — Development Workflow

## The 3-Environment Model

Feature branch  →  Preview URL  →  Production (goodslister.com)

Rule: **NEVER commit directly to `main`** for anything risky.

---

## Standard Workflow — Safe Changes

### Step 1: Create a feature branch

On GitHub UI: click "main" dropdown → type new branch name → Create branch

**Naming convention**: `feat/short-description` or `fix/short-description`

Examples:
- `feat/new-search-filter`
- `fix/booking-email-bug`
- `exp/redesign-home-hero`

### Step 2: Make your changes

- Edit files ON THAT BRANCH (not main)
- Commit with meaningful messages
- Vercel auto-deploys a preview URL for the branch

### Step 3: Test the preview URL

Vercel comment on the PR (or check dashboard) shows the preview URL:
```
https://goodslister-marketplace-2025-git-<branch>-<hash>.vercel.app
```

- Preview URL is BLOCKED from Google crawlers (robots.txt handles this)
- Preview URL uses SAME production data (Postgres, Firestore, Stripe)
- ⚠️ Be careful: destructive tests affect real production data
- Login, test flow, verify no regressions

### Step 4: Open a Pull Request

- Go to Pull Requests tab → New PR
- Base: `main` ← Compare: your branch
- Vercel comments with preview URL directly on PR

### Step 5: Merge to production

- Once tested, click "Merge pull request"
- Delete the branch after merge (keeps repo clean)
- Vercel auto-deploys `main` to goodslister.com in ~90 seconds

---

## What Data Does the Preview Use?

| Service | Preview | Production |
|---------|---------|------------|
| Postgres (Neon) | Same DB as prod | Same |
| Firestore | Same DB as prod (default) | Same |
| Stripe | LIVE mode | LIVE mode |
| Resend emails | Same API key | Same |
| Vercel Blob | Same bucket | Same |

⚠️ **WARNING**: Preview URLs are functionally equivalent to production. Tests that create data, send emails, or charge Stripe WILL affect real production.

### Safer Testing Strategies

1. **Use test accounts** — `ana.demo@goodslister.com` / `anaDemo123!` and `carlos.demo@goodslister.com` / `carlosDemo123!` for functional testing
2. **Read-only tests first** — verify UI, navigation, existing data before creating anything
3. **Small refunds ready** — if you must test payment, be ready to refund the $1-5 test charge
4. **Console logs** — inspect Firestore/network requests before submitting forms

---

## Emergency: Rollback a Bad Deploy

If you merged something that broke production:

### Option A — Revert commit (recommended for regular bugs)

1. GitHub → Commits → click the bad commit
2. Click "Revert" → creates new PR that undoes the change
3. Merge that PR → prod redeploys in 90s to the fixed state

### Option B — Instant rollback via Vercel dashboard (critical bugs)

1. Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to production"
4. Instant rollback (no code change needed)

Use **Option B** for critical bugs (site down), **Option A** for regular bugs.

---

## robots.txt Behavior

- **Production** (`goodslister.com`, `www.goodslister.com`): Allow all crawlers, disallow private routes
- **Preview URLs** (`*.vercel.app`, staging, branches): Block ALL crawlers to prevent SEO duplicate content

Handled dynamically by `/api/robots.ts`.

---

## Neon Postgres Branching (Advanced — future setup)

Neon supports database branching that syncs with Git branches for full isolation:

1. Create a Neon branch matching your Git branch name
2. Vercel automatically uses branch-specific database URL via env vars
3. Reset the branch DB anytime without affecting production

Setup guide: https://neon.tech/docs/guides/vercel-preview-branches

Setup pending — do this when you want fully isolated staging data.

---

## Cron Jobs

Configured in `vercel.json`:
- `expire-boosts` — daily at 02:00 UTC
- `rental-reminders` — daily at 14:00 UTC
- `review-requests` — daily at 16:00 UTC
- `auto-resolve-damages` — daily at 18:00 UTC

⚠️ Cron jobs run on production only, NOT on preview deployments.

---

## Environment Variables

All in Vercel dashboard → Settings → Environment Variables.

Marked as:
- **Production** — only used on `main` deploys
- **Preview** — used on branch deploys
- **Development** — used for `vercel dev` local

For Stripe TEST mode on previews (future): create a separate `STRIPE_SECRET_KEY_TEST` variable scoped to Preview only.

---

## Team Roles (Future)

When adding collaborators to the repo:
- `Read` — can view but not deploy
- `Write` — can push branches (Vercel deploys previews)
- `Admin` — can merge to main (deploys production)

Restrict Admin to `lucianoreverberi-gif` only until the team grows.

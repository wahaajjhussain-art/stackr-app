# Stackr — Development Instructions

> **Every AI agent and developer MUST read this file and `.github/context.md` at the start of every session.**

---

## Mandatory Pre-Work

1. Read `.github/context.md` to understand the full product, features, views, components, and tech stack.
2. Read `.github/instructions.md` (this file) for development rules.
3. Check `.github/versions/` for the latest version document to understand current state.
4. Read `AGENTS.md` before writing any Next.js code — APIs and conventions may differ from training data.

---

## Documentation Rules

### Every Change Must Be Documented

When making changes to the codebase:

1. **Log the change** in the current version file (`.github/versions/vX.md`) under the appropriate section.
2. **Include:**
   - What was changed and why
   - Which files were modified
   - Before/after description (for non-trivial changes)

### Bug Documentation

When fixing a bug, document it in the current version file:

```markdown
### Bug: [Short description]
- **Symptom:** What the user saw
- **Root Cause:** Why it happened
- **Fixes Tried:** What was attempted (including failures)
- **Actual Fix:** What resolved it
- **Files Modified:** List of files changed
- **Rollback:** How to undo if needed
```

---

## Version Tracking

### When to Create a New Version

A new version is created at each **logical milestone** — a coherent set of features or fixes that form a meaningful release. Examples:
- Initial launch (v1)
- Major feature addition (e.g., calendar integration)
- Mobile responsiveness overhaul
- Performance optimization pass

### Version File Format

Each version gets its own file: `.github/versions/vX.md`

```markdown
# Version X — [Title]

**Date:** YYYY-MM-DD
**Git Tag:** vX.0
**Commit:** [hash]

## Summary
Brief description of what this version represents.

## Features Added
- Feature 1
- Feature 2

## Bugs Fixed
- Bug 1 (see Bug Documentation format above)

## Files Modified
- file1.js — description of change
- file2.js — description of change

## Breaking Changes
- None / list any

## Rollback Instructions
Steps to revert to previous version.
```

---

## Rollback Procedures

### Quick Rollback (Git)
```bash
# Revert to a specific version tag
git checkout vX.0

# Or revert the last commit
git revert HEAD
```

### Database Rollback
- Schema changes must be documented with both UP and DOWN migrations
- Never drop tables without a backup plan documented in the version file

### Environment Rollback
- If environment variables change between versions, document the diff in the version file

---

## Code Standards

### File Organization
- All dashboard views and inline components live in `app/app/page.js`
- Reusable components go in `app/app/components/`
- Database functions: client-side in `lib/db.js`, server-side in `lib/db-server.js`
- API routes under `app/api/`

### Styling
- Use inline React styles with CSS custom properties (design tokens)
- Theme variables defined in `app/globals.css`
- Mobile breakpoint: **680px** for dashboard, **700px** for landing page
- Use `stackr-` prefix for CSS class names added to `globals.css`

### Naming Conventions
- Components: PascalCase (`DashboardView`, `HabitRow`)
- CSS classes: kebab-case with `stackr-` prefix (`stackr-dashboard-grid`, `stackr-view`)
- Database tables: snake_case (`reminder_log`, `day_key`)
- API routes: kebab-case paths (`/api/reminders/send`)

### Git
- PATH fix required on this machine: `$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH`
- Commit messages: concise, descriptive
- Tag versions: `git tag vX.0`

---

## Testing Checklist

Before marking any work complete:
- [ ] `npm run build` passes without errors
- [ ] Mobile view tested (680px breakpoint)
- [ ] Dark and light themes both work
- [ ] No console errors in browser
- [ ] Changes documented in current version file

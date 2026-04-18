# Stackr — Copilot Instructions

## Required Reading

Before making ANY changes, read these files in order:

1. **`.github/context.md`** — Full product overview, features, views, components, tech stack, database schema
2. **`.github/instructions.md`** — Development rules, documentation requirements, version tracking, rollback procedures
3. **`.github/versions/`** — Check the latest version file for current state and recent changes
4. **`AGENTS.md`** — Next.js-specific rules (APIs and conventions may differ from training data)

## Quick Reference

- **Main dashboard file:** `app/app/page.js` (all views, modals, inline components)
- **Separate components:** `app/app/components/`
- **Client DB layer:** `lib/db.js` | **Server DB layer:** `lib/db-server.js`
- **Landing page:** `public/landing.html` + `public/intro.css`
- **Theme variables:** `app/globals.css`
- **Mobile breakpoint:** 680px (dashboard), 700px (landing)
- **CSS class prefix:** `stackr-`

## Rules

- Document every change in the current version file (`.github/versions/vX.md`)
- Follow bug documentation format in `instructions.md` for all bug fixes
- Read `AGENTS.md` before writing Next.js code
- Use inline React styles with CSS custom properties for theming
- Test at 680px mobile breakpoint
- Git PATH fix: `$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH`

## Current Version

**v1.0** — See `.github/versions/v1.md` for full details.
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
# Sol implementation prompt · MQ-102

You are Codex Sol. Deliver discoverable collections, a searchable Store catalog and variant-aware product detail pages for Merqloom. Astra accepted MQ-101 in [PR #1](https://github.com/XVDev21/merqloom-dev/pull/1). Accepted application revision on main: `197e631bf6e1b50c4bd16f96d0327ed1ec931bb8`. The December 7 demo target remains unchanged. Stop for Astra review after the MQ-102 PR.

## Start

Use the physical checkout `~/merqloom-dev`. Verify a clean tree and origin `https://github.com/XVDev21/merqloom-dev.git`. Fetch main, confirm the accepted revision is its ancestor and this packet is present on origin/main, then branch from that tip.

```bash
cd ~/merqloom-dev
git status --short --branch
git remote get-url origin
git fetch origin main
git merge-base --is-ancestor 197e631bf6e1b50c4bd16f96d0327ed1ec931bb8 origin/main
git cat-file -e origin/main:docs/handoffs/SOL_MQ-102_CATALOG.md
git switch -c feat/MQ-102-catalog origin/main
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
```

Read AGENTS.md, [M1 architecture and review contract](SOL_M1_MASTER_PROMPT.md), [PRD](../product/PRD.md), ADRs 001–006, [design system](../design/DESIGN_SYSTEM.md), [claims](../conversion/CLAIMS_REGISTER.md), [runbook](../architecture/LOCAL_ENVIRONMENT.md), task ledger and MQ-101 acceptance. This packet releases MQ-102 only. The local November 27 Day 5 plan supplies its detailed acceptance criteria.

## Implement

- Extend /store with native Medusa collections, meaningful search, collection filtering and links to product pages. Use stable shareable URLs for queries, collections, product handles and variant selection. Verify refresh and Back retain the intended state. Use the supported Store API for the installed version. Document search scope, pagination and any limits. Keep the publishable key server-side as in the current catalog.
- Build a product detail page that answers whether the sample item fits the shopper’s need. Show fixture-supported dimensions, finish/material when known, selected variant, PHP demo price, and availability for the correct sales channel and region. Use native calculated prices and inventory. Keep source-specific fulfillment language and simulated shipping clear.
- Preserve the seeded Natural tray (PHP 450, 12 units on fresh seed) and Natural pouch (PHP 320, zero units). Keep the pouch a supplier preview. Add a second fictional selectable variant to the tray and at least one useful native collection so browser tests can demonstrate actual selection and filtering. Choose and document the new demo variant facts. Extend the existing database via a new repeatable migration/fixture step keyed by stable SKU/handle. Prove clean setup and upgrade from M0 data without resetting the developer database or duplicating records. Never reset existing order or stock history to seed defaults on rerun.
- Provide original or rights-cleared visuals with alt text, reserved dimensions and an asset provenance manifest. Design for loading, no products, no matches, invalid product/variant and temporary service failure. Give visitors a working recovery action. Cart and checkout belong to MQ-103. Omit inert purchase controls.
- Keep Studio, roadmap and native Admin functional. Update only Studio/roadmap status text made stale by the new capability and its claim entries. Scope includes apps/storefront, project-owned backend fixture/migration code, tests, the media manifest and task evidence. Bring provider, infrastructure or domain-ownership changes back to Astra.
- Read the installed commerce-conversion-strategy, design-taste-frontend, design-motion-principles, adaptive-code-verification and playwright-cli manuals. Use the conversion skill to map fit, price and availability questions to evidence, taste for composition and responsive imagery, motion for useful selection feedback with a reduced-motion path, and adaptive verification for executed checks. MQ-101's Studio-specific illustration exception does not establish a product imagery policy.

## Verify and submit

Use the runbook and existing isolated PostgreSQL/Redis services. Inspect running processes before starting another copy. Run frozen install, pnpm lint, pnpm typecheck, pnpm build and pnpm test with both production apps running. Extend integration coverage for collection membership, query results, valid and invalid variant IDs, regional prices and zero stock. Exercise failure and empty states in isolation. Test both migration paths and a repeat run.

Use playwright-cli 0.1.24 in a named session. Exercise Studio → catalog → collection/filter → product → variant change, restore the URL, test an unmatched search and recovery, inspect unavailable supplier stock, and return to Studio. Preserve the existing Studio browser smoke. Check keyboard/focus, reduced motion, meaningful alt text and reflow at 360, 390, 768, 1280 and 1440 px. Inspect screenshots and record defects or justified exceptions.

Update docs/roadmap/TASKS.md, PROGRESS.md, the claims register, and docs/verification/DAY_05_2026-11-27.md with actual execution date, fixture IDs, API contract, commands, exit codes, screenshots, limitations and Git state. Inspect the staged diff, scan for secrets and verify asset rights. Commit with MQ-102, push feat/MQ-102-catalog, compare remote SHA and open a PR to main. Send Astra the PR URL, SHA, CI results, evidence and remaining decisions. Leave the PR open.

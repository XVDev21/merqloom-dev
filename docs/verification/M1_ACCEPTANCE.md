# MQ-105 · M1 acceptance evidence

**M1 accepted by Sol on merge of PR #15.** Terra submitted the evidence below on November 27, 2026 (Asia/Manila). The local demo uses fictional data and simulated payment and shipping. Supplier processing remains planned.

## Release, scope and isolation

The physical checkout `/home/vonspc/merqloom-dev` was clean on `main`, with origin `https://github.com/XVDev21/merqloom-dev.git`. After `git fetch origin main`, the fetched and live remote main tip agreed at **`86dbb2f9dc09020a86665ca596e823149ad30f88`**. It contains the handoff and accepted runtime/commerce ancestor `6367d1daf16fcfbea08722d2013f720b632158f9`. The isolated worktree `/home/vonspc/merqloom-mq105` and branch `review/MQ-105-m1-acceptance` start at that tip. The pushed source correction is `6ed3d32c77fb44d13d53777cbe9880a263e6378a`; the following evidence commits do not change application source. Between the accepted runtime baseline and the release tip only the MQ-105 handoff and roadmap documents changed. The release's accepted [Foundation](https://github.com/XVDev21/merqloom-dev/actions/runs/45960876176) and [Compose](https://github.com/XVDev21/merqloom-dev/actions/runs/45960876159) runs are prior-baseline evidence; follow [PR #15](https://github.com/XVDev21/merqloom-dev/pull/15) and the [MQ-105 branch workflow runs](https://github.com/XVDev21/merqloom-dev/actions?query=branch%3Areview%2FMQ-105-m1-acceptance) for the final pushed head. A commit cannot contain its own hash, so the final pushed SHA is recorded in the PR and its check records.

The separate system Docker engine was selected only for these commands with `DOCKER_CONTEXT=default`; the global context stayed `desktop-linux`. Disposable project `merqloom-mq105` used fresh `merqloom-mq105_pgdata` and `merqloom-mq105_redisdata` volumes, with PostgreSQL, Redis, backend/Admin and Store bound to loopback ports 15438, 16385, 19010 and 18010. A runbook ownership check matched all four services, their project labels, the data mounts, host endpoints, database-backed Store key and application connections. The running Desktop `merqloom-dev` project and its original volumes remained available, with all four services healthy at the end of the walkthrough. No order-creating check targeted it.

For the walkthrough, the disposable backend and Store used the previously verified MQ-106 production images `sha256:6630ff222e019f17d20f839af842d0c526da63390dac5e76fcd70430c726bc91` and `sha256:7ca2b1fad3d58f64f0dd37198d8609c1f36b916c71b5c7d9cb5b0182da55a909`. Migration and key export used the accepted development image `sha256:c010b7d77d0a2aefab7eb71132b816da907d8a8c84bd2015cf621bf5c2c1ba56`. The checked runtime source, lockfile, Dockerfile and scripts match reviewed MQ-106 head `affa929ea837f36e0383f0a063dac6205d840cd2`. After the order walkthrough, only the disposable Store was switched to that development image with this worktree's source mounted, to reproduce and verify the copy correction. Its backend and data remained the same. The toolchain in the image is Node 22.23.4 and pnpm 10.11.1.

## Acceptance matrix

| Area | Current-baseline result and accepted evidence |
| --- | --- |
| Studio and roadmap | Followed the Studio link into the Store, visited the roadmap and verified simulated-payment and shipping disclosure. The accepted [MQ-101 Studio record](MQ-101.md) covers the original design and its accepted visual exceptions. A stale-status finding and correction are documented below. |
| Catalog and variants | Selected the Natural direct-stock tray, PHP 450 with 12 available. A no-results search recovered, an invalid finish showed its recovery state and the fictional supplier pouch remained out of stock and browse-only. The unchanged catalog's five-width coverage is in [Day 5](DAY_05_2026-11-27.md) at reviewed head `dfc3144c7d139e103e479ca207d9507ffe9cb594`. |
| Cart and checkout | Cart and Natural line survived a refresh. From valid order review, an invalid edited postal code submitted through the server form returned the field error and no active completion control; corrected details required a fresh review. Native item, shipping, tax and total were shown; payment and shipping were disclosed as simulated at review, submit and confirmation. Confirmation survived refresh and a separate browser session could see neither that confirmation nor the cart. A native retry of the same cart returned the same order; one order-cart link remained. The unchanged interrupted/concurrent-submit and direct-completion protections are covered by the accepted [Day 6 tests](DAY_06_2026-11-28.md) at reviewed head `60bc4801cfcb90595e6acb21ca75d8eac55c54cb` and by exact-head Foundation. |
| Direct fulfillment | The same order was fulfilled and marked shipped in authenticated native Admin. Replayed fulfillment and shipment requests returned 400, unauthenticated requests returned 401, and state and stock did not change. Attempting quantity 12 with only 11 available was rejected without an order or inventory change. The native lifecycle and additional isolated fixture assertions are in [Day 7](DAY_07_2026-11-29.md) at reviewed head `88366fc012c09cca5ca3a40d631a4ff0fcb414a9` and run in Foundation. |
| Container integration | Disposable readiness passed; native catalog, Medusa health, Studio, Store and Admin responded. Actual app logs were checked in memory for a successful completion and controlled malformed request: fixed method/route-template/status diagnostics appeared without the checked raw URLs, native identifiers, session token, key, synthetic contact/address or raw error. [MQ-106](MQ-106.md) records the accepted first startup, retained-volume restart, both hot reloads and portable amd64 production images. Exact-head Compose exercises a separate cold stack and checkout. |

## One Store-to-Admin order

In the disposable Store, enter from Studio, select **Desk tray → Natural**, add quantity 1 and continue to simulated checkout. Use fictional contact/address data, review the native totals and submit the simulated order. Confirmation and native Admin both showed demo order **#1**, SKU `MQ-DIRECT-TRAY`, Natural × 1: item PHP 450, simulated shipping PHP 10, tax PHP 0, total **PHP 460**. The system payment authorization is a demo state, not a real charge.

In authenticated native Admin, open Orders → #1 → Unfulfilled Items → **Fulfill items**. Select **Demo warehouse**, **Simulated shipping** and full quantity 1, turn notification off and create the fulfillment. Choose **Mark as shipped**, enter fictional tracking `SIMULATED-MQ105` and reserved `example.test` links, leave notification off and save. One native fulfillment, one matching fulfillment line, one shipment and one label were observed. There was no carrier interaction or notification.

| Natural tray at Demo warehouse | Stocked | Reserved | Store channel available |
| --- | ---: | ---: | ---: |
| Before checkout | 12 | 0 | 12 |
| After order/reservation | 12 | 1 | 11 |
| After fulfillment creation | 11 | 0 | 11 |
| After simulated shipment | 11 | 0 | 11 |
| After rejected replays and unavailable-stock attempt | 11 | 0 | 11 |

The Admin form displayed 12 available for this order while channel availability was 11: it includes the order's own reserved unit. The accepted Day 7 record explains this native calculation. The same-cart completion retry returned 200 and the same order; authenticated duplicate fulfillment and shipment requests returned 400 each, unauthenticated requests returned 401 each, and the single fulfillment, label, shipment and inventory remained unchanged. A new session's request for 12 units returned the Store's unavailable state and created no order.

Keyboard Tab reached visibly focused catalog and checkout actions, and Enter activated them. Reduced-motion preference and no horizontal overflow were checked at 390 and 1280 px through checkout/confirmation; the existing Studio smoke passed at 360, 390, 768, 1280 and 1440 px, including keyboard disclosures and no-JavaScript comparison. These checks are not a sitewide accessibility conformance claim.

Reviewed synthetic captures: [Studio at 390](screens/mq105-studio-390.png), [roadmap at 1280](screens/mq105-roadmap-1280.png), confirmation at [390](screens/mq105-confirmation-390.png) and [1280](screens/mq105-confirmation-1280.png), and [shipped Admin fulfillment](screens/mq105-admin-shipped.png). Studio and roadmap captures use the disposable development server; its small development indicator is visible. Captures contain no real contact details or tokens.

## Confirmed public-copy blocker

The released Studio still said manual fulfillment was a later milestone, and the roadmap said checkout was in review, despite accepted MQ-103/MQ-104 and the demonstrated order. The focused browser regression opened Studio and asserted that the outdated milestone sentence was absent and that manual fulfillment in Admin was described; it then opened the roadmap and asserted that checkout was no longer labeled in review, the direct-stock/manual fulfillment path was described and fictional supplier work remained future. On the released source it failed at the stale Studio sentence (exit 1). After the narrow wording correction, the same check passed (exit 0), as did the nearby five-width Studio smoke. No transaction, inventory, validation or recovery semantics changed. The [claims register](../conversion/CLAIMS_REGISTER.md) limits the revised claims to the demonstrated fictional direct flow.

## Commands and outcomes

Commands ran from the isolated worktree with `COMPOSE_PROJECT_NAME=merqloom-mq105`, `DOCKER_CONTEXT=default`, and an ignored local `COMPOSE_FILE` override selecting the ports, resource limits and accepted images. The verification copies in `.cache` only adapt endpoints or assertion/screenshot locations; they are not shipped and do not contain evidence credentials.

| Command or check | Result |
| --- | --- |
| `docker compose up -d --wait postgres redis` | 0; fresh isolated volumes and data services. |
| `docker compose run --rm --no-deps -T bootstrap` | 0; native migrations and Store key export. |
| `./scripts/store-env.sh` and `docker compose up -d --no-build --wait --wait-timeout 240 backend storefront` | Each 0. |
| `./scripts/compose-ready.sh` and `node .cache/mq105-ownership.cjs` | Each 0; ownership rechecked after the disposable Store switch. |
| `playwright-cli --raw -s=mq105-store run-code --filename .cache/mq105-store-browser.js` | 0 on third attempt; coherent synthetic Store order and checks above. |
| `playwright-cli --raw -s=mq105-claims run-code --filename .cache/mq105-claims-regression.js` | Baseline 1, corrected source 0; same assertions. |
| `playwright-cli --raw -s=mq105-studio run-code --filename .cache/mq105-studio-smoke.js` | 0; accepted Studio smoke adapted to the disposable URL and nonoverwriting capture path. |
| `playwright-cli --raw -s=mq105-claims run-code --filename .cache/mq105-claims-layout.js` | 0; corrected Studio and roadmap at 390, 768 and 1280 px with reduced motion. |
| `node .cache/mq105-log-check.cjs` | 0 after resolving the existing pinned Redis-client path; successful and controlled-failure process output passed the sanitized in-memory check. |
| Native Admin browser walkthrough, state queries and replay requests | Passed; results and stock transitions above. Synthetic operator authentication stayed in memory. |
| Taste source lint on both changed TSX files | 0; no failures or warnings. Rendered Studio inspection retained the previously accepted image/motion exceptions in MQ-101. |
| `python3 /home/vonspc/.agents/skills/adaptive-code-verification/scripts/verify.py run --root "$PWD" --mode docs --level comprehensive --isolated` with changed paths and checks below | 0; document links, whitespace and all requested checks passed. The docs mode avoids the default-port integration runner; local runtime checks are listed separately. |
| `docker compose run --rm --no-deps -T checks pnpm lint`, `pnpm typecheck`, `pnpm build` | Each 0 in separate disposable one-off containers with the changed source mounted read-only and the pinned toolchain. The accepted development image already contained the frozen-lock installation. |
| `git diff --check` and local Markdown link checks | 0 through the adaptive run. |
| Exact-head `pnpm test` and Compose smoke | Run by hosted Foundation and Compose; local default ports belong to the retained stack. See the PR's exact-head checks for outcomes. |

The adaptive command added each changed path and the following reviewed checks. `COMPOSE_FILE` selected the ignored `mq105-override.yaml` and `mq105-checks.yaml` with the normal Compose file; the latter starts only the one-off verification service:

```sh
COMPOSE_FILE="$PWD/compose.yaml:$PWD/.cache/mq105-override.yaml:$PWD/.cache/mq105-checks.yaml" \
COMPOSE_PROJECT_NAME=merqloom-mq105 DOCKER_CONTEXT=default \
python3 /home/vonspc/.agents/skills/adaptive-code-verification/scripts/verify.py run \
  --root "$PWD" --task 'MQ-105 M1 evidence and verified Studio claim correction' \
  --mode docs --level comprehensive --isolated \
  --file docs/verification/M1_ACCEPTANCE.md --file docs/roadmap/TASKS.md \
  --file docs/roadmap/PROGRESS.md --file docs/conversion/CLAIMS_REGISTER.md \
  --file apps/storefront/src/app/page.tsx --file apps/storefront/src/app/roadmap/page.tsx \
  --check '["git","diff","--check"]' \
  --check '["docker","compose","run","--rm","--no-deps","-T","checks","pnpm","lint"]' \
  --check '["docker","compose","run","--rm","--no-deps","-T","checks","pnpm","typecheck"]' \
  --check '["docker","compose","run","--rm","--no-deps","-T","checks","pnpm","build"]'
```

The first two browser attempts stopped at an incorrect automation assumption about programmatic focus and then a navigation/focus setup issue; keyboard Tab and visible outline were confirmed in focused diagnostics before the successful retry. Two initial Admin locator attempts looked for a button instead of the native menu item; selecting the actual menu completed the walkthrough. The first log-check invocation could not resolve an `ioredis` symlink in the physical worktree; using the same pinned dependency from the accepted MQ-106 worktree passed. A first draft of corrected roadmap copy failed the focused assertion, then the stated manual-fulfillment wording passed. A mistakenly invoked taste `lint.mjs --help` scanned the whole project and flagged four existing thin-border rules in unchanged CSS; scoped changed-file lint passed. The rendered taste inspector's existing `few-pictures` and `still-page` findings and associated warnings remain recorded and accepted in MQ-101. A `python` help invocation returned 127 on this host; `python3` was used for adaptive verification.

The staged documents, screenshots and source correction were reviewed. A scan of their blobs for the disposable environment's secret values, private-key markers and non-demo email addresses returned zero matches; screenshots were inspected visually. `git diff --cached --check` passed. Ignored local environments, browser output and diagnostic scripts are excluded.

## Hosted review checks

The first pushed review head was `5ff844fe0777acf1f5e1a9435e124a7b80daa548`. [Foundation push](https://github.com/XVDev21/merqloom-dev/actions/runs/46001105437) and [Foundation PR](https://github.com/XVDev21/merqloom-dev/actions/runs/46001161964) passed; the PR log reports 17 tests passed and zero failed. [Compose push](https://github.com/XVDev21/merqloom-dev/actions/runs/46001105268) and [Compose PR](https://github.com/XVDev21/merqloom-dev/actions/runs/46001162097) passed their runtime builds, disposable stacks, readiness and simulated checkout. This evidence-only follow-up has separate checks on the final [PR head](https://github.com/XVDev21/merqloom-dev/pull/15/checks).

## Remaining limits

The native Admin shipping-subtotal markup warning recorded in Day 7 remains an upstream UI defect; the order workflow was usable. Native Medusa's HTTP 409 in-progress branch was not observed; the accepted tests cover supported concurrent requests and application busy/retry behavior. Redis crash durability was not tested. With JavaScript disabled, a server-rejected edit still reports the field error and requires re-review but discards unsaved field values. Sanitized diagnostics deliberately omit dynamic framework detail. Sol reviewed these limits and deemed them nonblocking for M1. Real payment, actual shipping, supplier workflows, production deployment and infrastructure changes are outside this packet.

## Sol acceptance · November 28

Sol reviewed Terra's exact submission `cc9be247bf8bf08e41717a82259e470ee37caf44` against the released M1 handoff and accepted the direct demo on merge of [PR #15](https://github.com/XVDev21/merqloom-dev/pull/15). The application diff updates only Studio and roadmap copy. It preserves the simulated disclosures, and supplier processing remains planned. Sol independently exercised Studio and the roadmap at 390 and 1280 px in Playwright, followed the Store link, and checked reflow and reduced motion. Sol reviewed the PHP 460 confirmation and shipped fulfillment captures. A read-only query on the disposable database confirmed one order, one cart link, one shipped fulfillment, one label, and 11 stocked / 0 reserved / 11 available. The negative-stock and duplicate-action checks preserved that state.

Foundation push and PR and Compose push and PR passed on Terra's exact submission, with 17 integration tests passing in the Foundation PR log. Sol's acceptance update changes only Markdown; the required checks for the final branch revision are recorded on the [PR checks page](https://github.com/XVDev21/merqloom-dev/pull/15/checks). No further M1 correction is required. MQ-201 remains the next planned task and requires its own release.

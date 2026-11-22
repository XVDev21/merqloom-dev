# Terra handoff and implementation plan · MQ-103

**Released by Sol to Terra.** Implement Day 6 cart and simulated checkout for the M1 storefront. Move a fictional shopper from the selected product variant to a persisted cart and a real Medusa demo order. The Day 6 target is November 28, 2026, and the MVP demo target is December 7, 2026. Sol reviews the feature PR and decides acceptance.

## Release and workspace

[Governance PR #4](https://github.com/XVDev21/merqloom-dev/pull/4) establishes the Sol and Terra roles. Accepted application baseline `89e7d3bac18b5d9598d5e49cd72e8412f3738bc6` contains [MQ-102 PR #3](https://github.com/XVDev21/merqloom-dev/pull/3) and the [passing main Foundation run](https://github.com/XVDev21/merqloom-dev/actions/runs/45040090750). Branch from the verified live main tip that contains this handoff and record the exact tip as the implementation base.

Run this from a Bash shell. A failed gate stops the command chain before worktree creation. If the branch or worktree already exists, inspect its state and ancestry before resuming.

```bash
cd /home/vonspc/merqloom-dev &&
test -z "$(git status --porcelain)" &&
test "$(git remote get-url origin)" = https://github.com/XVDev21/merqloom-dev.git &&
git fetch origin main &&
mq103_base=$(git rev-parse --verify refs/remotes/origin/main) &&
mq103_live=$(git ls-remote --exit-code origin refs/heads/main | cut -f1) &&
test "$mq103_base" = "$mq103_live" &&
git merge-base --is-ancestor 89e7d3bac18b5d9598d5e49cd72e8412f3738bc6 "$mq103_base" &&
git cat-file -e "$mq103_base:docs/handoffs/TERRA_MQ-103_CHECKOUT.md" &&
git worktree add -b feat/MQ-103-cart-checkout /home/vonspc/merqloom-mq103 "$mq103_base" &&
printf 'MQ-103 release base %s\n' "$mq103_base"
```

Read [AGENTS](../../AGENTS.md), [PRD](../product/PRD.md), [architecture](../architecture/SYSTEM.md), [ADR-001](../decisions/ADR-001-foundation.md), [ADR-003](../decisions/ADR-003-inventory-routing.md), [ADR-005](../decisions/ADR-005-local-runtime.md), [ADR-006](../decisions/ADR-006-design-conversion.md), the [task ledger](../roadmap/TASKS.md), [Day 5 evidence](../verification/DAY_05_2026-11-27.md), [runbook](../architecture/LOCAL_ENVIRONMENT.md), [design system](../design/DESIGN_SYSTEM.md) and [claims register](../conversion/CLAIMS_REGISTER.md). The approved repo documents and this release packet supply the scope.

Use Node 22.23.4 and pnpm 10.11.1. The original checkout may already have these at `/home/vonspc/merqloom-dev/.tools/node_modules/.bin`. Verify versions before installing or running project commands. Read the installed manuals for `adaptive-code-verification`, `commerce-conversion-strategy`, `design-taste-frontend`, `design-motion-principles` and `playwright-cli`. Plan verification with the worktree root and affected paths. Preserve the approved tokens and apply the existing guidance on transparent claims, focus, reduced motion, and visual review. Escalate unresolved payment, inventory, or transaction semantics to Sol with a minimal reproduction and the decision needed.

## Implementation sequence

### 1. Prove the installed checkout path

- [ ] Inspect the installed Medusa 2.23.0 Store interfaces. Use a fresh disposable Merqloom database and Redis instance for write checks. An isolated CI-style environment can use the runbook directly. On the local host, identify the existing Compose projects and occupied ports first. Use an MQ-103-specific Compose project and free loopback ports for its services, and point the worktree's ignored configuration at that instance. Keep the shared demo database and Redis intact. `scripts/store-env.sh` reads the key from the active Compose project's `merqloom` database. Check that project and database before running it.
- [ ] Confirm the Philippine PHP region, the demo sales channel and the native `Simulated shipping` option for a fictional PH address. Use `pp_system_default`. Prove create cart → add line → set contact/address → select shipping → initialize payment → complete. Record the supported operations and their observed result for success, in-progress completion, and retry. Follow the native workflow and keep application secrets server-side. Escalate if the native path cannot produce a demo order or resolve a repeated completion safely.

### 2. Connect the PDP and cart

- [ ] Extend the existing server-side Store API access under `apps/storefront/src/app/store/`. Add the purchase action to the resolved `[handle]/page.tsx` variant and add `/store/cart`. Resolve the native region, channel, selected variant, and available quantity on the server. Keep the invalid-finish placeholder and recovery. Treat the supplier pouch as a browse-only preview and reject unavailable items on cart mutations.
- [ ] Persist the native cart across navigation and reload through a server-managed session. Use an HttpOnly session cookie with production security defaults and the documented loopback behavior. Keep cart state and totals in Medusa. Apply quantity and removal changes to the native lines and display the resulting PHP subtotal, shipping, taxes when returned, and total. Support empty and expired carts, invalid quantities, changes in availability and temporary service errors with a working recovery path. Verify that an independent browser session has a separate cart.
- [ ] Use Natural and Walnut tray variants for the standard shopper journey. For the Day 6 two-distinct-product case, create one additional synthetic direct-stock product in disposable test setup with the existing PHP region, channel, warehouse, and shipping profile. Resolve its IDs from the fixture and keep it out of the normal seed. Scope it to the integration case and remove it from the active catalog before the standard browser smoke. Prove both products can coexist, quantities update, a line can be removed, and displayed totals equal the native cart for each change.

### 3. Complete and recover the checkout

- [ ] Add `/store/checkout` and a session-bound confirmation path. Collect the minimum fictional contact and PH address fields and surface field-specific validation. Display the available native shipping option and final authoritative total. Explain simulated payment and shipment before the submit control, in its label, and on confirmation. Keep cards, production providers, supplier purchasing, actual shipping, and external services outside this task.
- [ ] Handle completion as a native cart operation with accessible pending and error states. Keep the same cart identity while the outcome is uncertain. Show success only after Medusa confirms an order and support confirmation refresh for the session that placed it. Handle conflict, failed validation, interrupted response and retry without creating a replacement cart or duplicate order. Do not expose merchant order APIs, addresses, contact details, session identifiers or raw backend errors through public confirmation links or logs.
- [ ] Exercise sequential retry and concurrent submission independently of the button guard. Use a disposable backend query or authorized test service to count orders attributable to the cart and compare returned order IDs. Confirm that there is exactly one order after retries and that its lines and totals agree with the native cart. Record enough order evidence for MQ-104. Manual fulfillment and its inventory lifecycle gate belong to MQ-104. MQ-105 remains the M1 acceptance gate.

### 4. Verify and submit

- [ ] Add integration coverage reachable through root `pnpm test` and preserve the existing tests in `scripts/baseline.test.mjs`. Verify session separation, correct variants and totals, unavailable stock, invalid address, cart expiry and completion with one durable order under duplicate or interrupted submission. Use the supported browser/server boundary or native backend evidence for the assertions.
- [ ] Run the following acceptance commands from the MQ-103 worktree with the pinned tools on PATH. Run the production app starts in separate terminals with the disposable configuration. The existing tests and smokes address ports 18000 and 19000. Use those ports for the disposable app instances after confirming ownership and availability, or make an explicit test configuration for alternate loopback ports if needed.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

```bash
# Separate terminals, with the disposable environment configured
pnpm --dir apps/backend start
pnpm --dir apps/storefront start
```

```bash
curl -fsS http://127.0.0.1:19000/health
pnpm test
playwright-cli -s=merqloom-mq103 open http://127.0.0.1:18000
playwright-cli -s=merqloom-mq103 run-code --filename scripts/browser-smoke.js
playwright-cli -s=merqloom-mq103 run-code --filename scripts/catalog-browser-smoke.js
playwright-cli -s=merqloom-mq103 run-code --filename scripts/cart-checkout-browser-smoke.js
playwright-cli -s=merqloom-mq103 close
```

- [ ] Create `scripts/cart-checkout-browser-smoke.js` for PDP → cart → checkout → confirmation with persistence and an accessible negative state. Check visible focus, keyboard operation, focus on validation errors, reduced motion and reflow at 360, 390, 768, 1280 and 1440 px. Inspect screenshots for cart, checkout, validation and confirmation, including mobile and desktop. Use synthetic addresses and sanitized evidence. Preserve existing accepted screenshots and record any inspector exception for Sol review.
- [ ] Create `docs/verification/DAY_06_2026-11-28.md` with the execution date, base and pushed SHAs, changed surfaces, cart/session and completion contract, fixture setup, sanitized order evidence, exact checks and exit codes, screenshot paths, failures and corrections, unresolved defects, PR, and Foundation runs. Update [task ledger](../roadmap/TASKS.md) and [progress](../roadmap/PROGRESS.md) to record the review state. Update Studio, roadmap and claim entries only where the tested capability changes their truth.
- [ ] Inspect the staged changes for credentials, contact data, generated output and asset rights. Commit with MQ-103, push only the feature branch, compare its live SHA and open a PR to main. Send Sol the PR URL, exact head SHA, Foundation results, evidence, and remaining decisions. Leave the PR open. Sol independently reviews the transaction and browser evidence and accepts or returns findings before merge.

## Copy into Terra's conversation

Act as Terra, Merqloom's implementation engineer. Implement only MQ-103 using the published `docs/handoffs/TERRA_MQ-103_CHECKOUT.md` in `XVDev21/merqloom-dev`. Open the physical checkout at `/home/vonspc/merqloom-dev`, fetch main and follow the release and worktree commands in that file. Execute the plan through the feature PR, including the native checkout preflight, stock and retry tests, and screenshots. Report blockers to Sol with evidence and leave the PR open for review.

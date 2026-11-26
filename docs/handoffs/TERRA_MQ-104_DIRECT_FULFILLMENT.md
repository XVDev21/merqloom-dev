# Terra handoff and master prompt · MQ-104

Sol releases Day 7 direct inventory and manual fulfillment to Terra. Trace a fresh fictional shopper order from the Store through native Medusa Admin fulfillment and simulated shipment. Prove what happens to stock and reservations at each transition and when an action is repeated. The Day 7 target is November 29, 2026. The MVP demo target remains December 7, 2026. Sol reviews MQ-104 and owns the separate MQ-105 M1 acceptance decision.

## Verified starting point

[PR #6](https://github.com/XVDev21/merqloom-dev/pull/6) merged the accepted MQ-103 checkout at `8d065fd8a25be20c64372c5cd85b1fbff302d65b`. The [Sol acceptance record](../verification/DAY_06_2026-11-28.md#sol-acceptance--november-26) is on main from `a84ad2f811337f7d34bc376b90993ee82fe9a1b7` with a [passing Foundation run](https://github.com/XVDev21/merqloom-dev/actions/runs/45753306453). Day 6's order #10 proves checkout and single-order linkage. Create a fresh order in an MQ-104 disposable environment for the fulfillment demonstration.

Run this from Bash. If the feature branch or worktree already exists, inspect and resume it only after confirming its ancestry and scope.

```bash
cd /home/vonspc/merqloom-dev &&
test -z "$(git status --porcelain)" &&
test "$(git remote get-url origin)" = https://github.com/XVDev21/merqloom-dev.git &&
git fetch origin main &&
mq104_base=$(git rev-parse --verify refs/remotes/origin/main) &&
mq104_live=$(git ls-remote --exit-code origin refs/heads/main | cut -f1) &&
test "$mq104_base" = "$mq104_live" &&
git merge-base --is-ancestor a84ad2f811337f7d34bc376b90993ee82fe9a1b7 "$mq104_base" &&
git cat-file -e "$mq104_base:docs/handoffs/TERRA_MQ-104_DIRECT_FULFILLMENT.md" &&
git worktree add -b feat/MQ-104-direct-fulfillment /home/vonspc/merqloom-mq104 "$mq104_base" &&
printf 'MQ-104 release base %s\n' "$mq104_base"
```

Read [AGENTS](../../AGENTS.md), [PRD](../product/PRD.md), [architecture](../architecture/SYSTEM.md), [ADR-003](../decisions/ADR-003-inventory-routing.md), [ADR-005](../decisions/ADR-005-local-runtime.md), the [runbook](../architecture/LOCAL_ENVIRONMENT.md), [task ledger](../roadmap/TASKS.md), and [Day 6 evidence](../verification/DAY_06_2026-11-28.md). Use Node 22.23.4, pnpm 10.11.1 and the locked Medusa 2.23.0. Consult the installed `adaptive-code-verification` and `playwright-cli` manuals. Apply the conversion, design and motion skills to any changes that fall within their scope.

## Implementation plan

### 1. Verify the native prerequisites

- [ ] Use the disposable verification procedure in the runbook. Confirm what owns ports 18000 and 19000 before starting apps. Use separate PostgreSQL and Redis data, synthetic identities and a fresh seeded database for the browser demonstration. Preserve Terra's MQ-103 evidence and existing demo data.
- [ ] Verify the native demo sales channel is linked to `Demo warehouse`, the direct variant manages inventory there, and `Simulated shipping` uses `manual_manual` for the Philippines demo. Resolve identifiers from the installed fixtures. Create a disposable native Admin login through the runbook or supported Medusa CLI. Keep auth material, invite links and raw logs out of the PR and screenshot set.
- [ ] Inspect the installed Admin UI and server routes. The locked package exposes `POST /admin/orders/:id/fulfillments` and `POST /admin/orders/:id/fulfillments/:fulfillment_id/shipments`. Verify their payloads, supported auth and response fields against the installed version. Use the native screens for the operator walkthrough and authenticated Admin APIs for automated assertions.

### 2. Prove a direct order and manual fulfillment

- [ ] Use one available direct tray variant for the walkthrough. Record its location, stocked, reserved and channel-available quantity before placing the order via the MQ-103 storefront. Confirm the order in Store and find the same display order in native Admin. Compare variant, quantity, PHP totals and demo payment/shipping disclosures.
- [ ] Use native Admin to create a full-quantity fulfillment from the seeded warehouse and create its simulated shipment. Use fictional shipment data, with no carrier interaction. Capture the native order, fulfillment and shipment states at each step. Check the selected location and fulfillment item quantities before treating the task as complete.
- [ ] Capture stocked, reserved and available quantities before checkout, after order/reservation, after fulfillment creation, and after shipment. Verify actual Medusa behavior against native inventory and order records. Use read-only SQL on the disposable database only if native responses leave an evidence gap. Link the observations to the same order, variant and location. Investigate any inconsistency before proposing code changes.
- [ ] Replay the already fulfilled full-quantity action and the shipment action in automated verification. A native rejection or idempotent response is acceptable when the same order still has one fulfillment, the existing shipment is unchanged, and inventory and reservation quantities are unchanged. If the installed version permits duplicate side effects or fails to maintain correct stock, stop and send Sol a bounded reproduction, the observed state and the smallest supported correction.

### 3. Add regression and operator evidence

- [ ] Add a focused lifecycle integration suite under `scripts/` and include it in root `pnpm test`. Use the existing serial test setup. Create synthetic data within the disposable test run and keep stock assumptions independent of earlier checkout tests. Use a separate test-only fixture if needed. Preserve the normal seed and accepted test coverage. Make the Admin mutation path require an authenticated disposable operator, and verify an unauthenticated action is rejected and leaves state unchanged.
- [ ] Cover correct stock reservation and fulfillment adjustments, the repeated actions above, and an unavailable direct-stock quantity rejected before order creation. Keep the zero-stock supplier preview outside the direct flow. Verify the unavailable path has no order, fulfillment or inventory side effect. For automated checks, assert native records and quantities in addition to HTTP responses.
- [ ] Reuse MQ-103's storefront checkout browser journey as a regression. Walk the resulting fictional order through the native Admin UI in a named Playwright session. Record a reproducible sequence and capture sanitized Store confirmation, Admin pre-fulfillment, and Admin fulfilled or shipped evidence. Caption screenshots with the simulated context. Review the images before publishing and retain the existing accepted captures.
- [ ] Keep changes focused on the lifecycle test, disposable fixture setup if required, and evidence. Use the existing provider and warehouse. Escalate changes to commerce contracts, inventory or payment semantics, or any provider configuration beyond a proven missing fixture. MQ-105 milestone sign-off, M2 supplier workflows, real payment or shipping, Docker/Makefile/CI infrastructure and deployment are separate directives.

## Verification and review

Run the following from the MQ-104 worktree. Start both production apps using the runbook and independently verify their disposable endpoints before running order-creating suites or browser scripts.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
```

```bash
curl -fsS http://127.0.0.1:19000/health
curl -fsS http://127.0.0.1:19000/app >/dev/null
pnpm test
```

Use a named `playwright-cli` session for the existing Studio, catalog and checkout smokes and the operator walkthrough. Use a fresh seeded disposable database for the demonstration if earlier test orders consumed the demo stock. The smoke scripts can rewrite screenshot paths. Publish only MQ-104 evidence and intentional changes.

Create `docs/verification/DAY_07_2026-11-29.md` with the execution date, native endpoints or UI steps, replay walkthrough, expected and observed lifecycle, stock and reservation table, repeat-action and unavailable-stock results, synthetic order reference, screenshots, exact commands and exit codes, remaining defects, local and remote revision, PR and CI links. Update the task ledger and progress to `IN_REVIEW`; leave M1 acceptance for Sol under MQ-105. Review the staged diff for secrets, personal data and generated files. Push `feat/MQ-104-direct-fulfillment`, compare the live branch SHA, open a PR to main and report the exact head and checked Foundation runs. Leave the PR open for Sol.

## Copy into Terra's conversation

Act as Terra, Merqloom's implementation engineer. Deliver only MQ-104 in `XVDev21/merqloom-dev`. Fetch main in `/home/vonspc/merqloom-dev` and follow the released `docs/handoffs/TERRA_MQ-104_DIRECT_FULFILLMENT.md`, including its worktree commands. Use a fresh disposable Merqloom environment. Place a direct-stock demo order in the Store, create fulfillment and simulated shipment in native Admin, and correlate the order, fulfillment and inventory state at each step. Prove repeat actions and unavailable stock leave the expected state, add focused integration coverage to `pnpm test`, and attach sanitized Playwright evidence. Preserve accepted checkout and use Medusa as the source of truth. Escalate native consistency problems to Sol. Push the task branch, open the PR with the exact reviewed SHA and Foundation evidence, and leave it open for Sol. MQ-105 and infrastructure work remain separate.

# Terra handoff · MQ-202 supplier CSV import and inventory freshness

**Goal**

Import a bounded fictional CSV into stable supplier mappings, record its audit and freshness, and update only the supplier's isolated native inventory. This is the Days 8–9 task. The December 7 MVP target still applies.

**Architecture**

Use the accepted MQ-201 module and its Product Variant link, a server-side Medusa import workflow, and native inventory workflows. PostgreSQL owns import identity and audit. The observed quantity and timestamp are supplier evidence. Medusa owns stock, reservations and commerce state.

Read [engineering standards](../../AGENTS.md#engineering-standards), [MQ-201 contract](../verification/MQ-201.md), [supplier boundary](../decisions/ADR-002-supplier-boundary.md), [inventory routing](../decisions/ADR-003-inventory-routing.md) and the [disposable runbook](../architecture/LOCAL_ENVIRONMENT.md#disposable-integration-verification). Use adaptive-code-verification and the pinned Node, pnpm and Medusa 2.23.0 toolchain.

## Start from published main

Use the verified live default-branch tip containing this file, descended from accepted MQ-201 at `e0b9df68fbd9a584b7d4b93ad3c358e2a9eb464b` with passing [Foundation](https://github.com/XVDev21/merqloom-dev/actions/runs/46115749956) and [Compose](https://github.com/XVDev21/merqloom-dev/actions/runs/46115749946). Inspect any existing MQ-202 worktree before resuming.

```bash
set -euo pipefail
cd /home/vonspc/merqloom-dev
test -z "$(git status --porcelain)"
test "$(git remote get-url origin)" = https://github.com/XVDev21/merqloom-dev.git
git fetch origin main
mq202_base=$(git rev-parse --verify refs/remotes/origin/main)
mq202_live=$(git ls-remote --exit-code origin refs/heads/main | cut -f1)
test "$mq202_base" = "$mq202_live"
git merge-base --is-ancestor e0b9df68fbd9a584b7d4b93ad3c358e2a9eb464b "$mq202_base"
git cat-file -e "$mq202_base:docs/handoffs/TERRA_MQ-202_SUPPLIER_IMPORT_FRESHNESS.md"
git worktree add -b feat/MQ-202-supplier-import-freshness /home/vonspc/merqloom-mq202 "$mq202_base"
printf 'MQ-202 release base %s\n' "$mq202_base"
```

## 1. Validate the entire import before commerce writes

- [ ] Add a pure parser under `apps/backend/src/modules/supplier/`. Accept UTF-8 CSV with the exact ordered header `external_sku,variant_sku,quantity,observed_at`, with an optional UTF-8 BOM and LF or CRLF. Support standard quoting with a strict parser. Bound CSV bytes to 256 KiB before parsing, data rows to 100, each SKU to 128 trimmed characters, and each parser record to 1 KiB. Use ASCII SKU tokens starting with an alphanumeric and containing only alphanumerics, period, underscore or hyphen. Preserve case. Quantity must be a base-10 integer from 0 to 9,999. Require a real UTC timestamp with a Z suffix and reject future observations using server time. Reject the whole file on malformed input, duplicate external SKU or duplicate native target within the file. Return bounded row numbers and stable codes. Keep raw CSV and values out of logs and audit responses.
- [ ] Reuse a supported parser when available. `csv-parse` **7.0.2** is already in the pinned lockfile via Medusa. If using `csv-parse/sync`, declare that same version directly for the backend and verify the frozen install. Use the existing framework Zod for the envelope or field schema where it fits. Exercise quoted fields, both line endings, wrong/duplicate headers, malformed quotes, unsafe SKU text, invalid dates, negative/fractional quantities, and the boundary and one-over cases for bytes, rows and fields.
- [ ] Add thin native-authenticated Admin endpoints under `apps/backend/src/api/admin/supplier/imports/` for POST import and GET run by ID. POST accepts `{supplierId, idempotencyKey, csv}`. Require a bounded nonempty key of at most 128 characters and use Medusa's route-local parser limit of 512 KiB for the JSON envelope. Use native user authentication and the existing middleware setup. Confirm unauthenticated and customer sessions cannot trigger import or read audit data. Use sanitized run ID, status, counts, timestamps and error codes in responses. The Admin UI belongs to MQ-204. [Medusa request limits](https://docs.medusajs.com/learn/fundamentals/api-routes/parse-body) · [CSV Parse options](https://csv.js.org/parse/options/)

## 2. Apply idempotently to existing supplier variants

- [ ] Add import-run audit and timestamped observations to the existing supplier module using Medusa models and an additive generated migration. Record supplier, key, SHA-256 of the exact UTF-8 CSV bytes, safe counts and status, and server timestamps. Enforce unique `(supplier_id, idempotency_key)` in PostgreSQL. A matching key and digest returns the existing run and outcome. The same key with different bytes returns conflict with no writes. A corrected or explicitly retried failure uses a new key. Use a durable one-active-run constraint per supplier across processes. An overlapping different run returns a retryable conflict. A run requiring reconciliation retains the claim until an operator resolves it.
- [ ] Keep one configured fictional supplier for the MVP sync. Use `fictional-north` and `POUCH-NATURAL → MQ-SUPPLIER-POUCH` as the primary fixture. Resolve existing Medusa variants and their inventory items, require a supplier-source product and one managed stock item per variant, and reject missing, ambiguous, direct-stock or conflicting targets before writes. Reuse MQ-201's mapping workflow for first association. A repeated mapping to the same variant keeps the ID and link. Reject a conflicting target or competing supplier for a synced variant. A soft-deleted unique mapping requires explicit reconciliation. Import only existing approved demo variants. Omitted rows retain their prior association and observation.
- [ ] Use one explicitly provisioned native location for the fictional supplier and verify its identity server-side. Keep it separate from Demo warehouse and outside the current storefront sales-channel stock path. Use native inventory creation/update workflows and change only the target location's stocked quantity. Preserve native reservations and reject an observation below the reserved quantity. Older observations cannot replace newer ones. Equal timestamps with equal quantities avoid a native write. Equal timestamps with different quantities conflict. The existing pouch remains browse-only. MQ-203 owns the later gated supplier order path and worker integration. [Medusa inventory workflows](https://docs.medusajs.com/resources/commerce-modules/inventory/workflows)
- [ ] Preflight every mapping and observation before applying the run. Record its intended targets and prior state, then use native workflow compensation across mapping, links and stock changes. Publish the successful observations only after all stock changes succeed. On a post-write failure, roll back only that run's new links/mappings and stock changes. Retain the rejected or failed audit and last good observations. If compensation cannot finish, keep the run in reconciliation, block further writes for that supplier, and fail eligibility closed. Document the operator procedure. Prove the controlled partial-failure path after at least one real native write.

## 3. Expose a fail-closed freshness decision

- [ ] Provide a server-side eligibility helper keyed by supplier and mapping, with injected time for tests and a configurable positive threshold of **15 minutes by default**. An observation is fresh only when its age is nonnegative and less than the threshold, its latest applicable refresh succeeded, and the mapping still resolves. Failed or unfinished refreshes of an attempted target make it ineligible while preserving the last good observation for audit. A rejected malformed file leaves unrelated mappings alone. Missing observations are unknown. Zero remains a known observation and yields out-of-stock. Return the reason and observation timestamp for MQ-203 and MQ-204. Native inventory must still confirm availability at any later checkout gate.
- [ ] Prove fresh just below 15 minutes, stale at exactly 15 minutes, unknown, zero, future, failed refresh, and interrupted reconciliation. Verify an older replay cannot extend freshness. Cover corrected import, same-key replay, mismatched key contents, competing requests, omitted rows, post-write compensation, and identical direct stock and order fingerprints. Use only synthetic data.

## Verification and submission

- [ ] Exercise fresh and repeat upgrade migrations on disposable PostgreSQL and the existing isolated Compose workflow. Use the repository's integration runner and add the import, authorization, freshness and direct regression cases to Foundation. Run focused checks while coding, then lint, typecheck, build, full Foundation and Compose on the exact pushed head. Use hosted Foundation for fixed-port tests if retained ports are occupied. Screenshots apply only to a changed visible journey.
- [ ] Record `docs/verification/MQ-202.md` with exact SHAs, route and helper contracts, commands and outcomes, sanitized run and inventory evidence, rollback/reconciliation limits, and CI links. Update ledger and progress to `IN_REVIEW` and leave the implementation PR open for Sol. Use the [engineering tracker](../roadmap/TASKS.md#engineering-improvements) for performance and deployment work.

## Copy into Terra’s conversation

Start MQ-202 in `/home/vonspc/merqloom-dev`. Verify live main and follow `docs/handoffs/TERRA_MQ-202_SUPPLIER_IMPORT_FRESHNESS.md`. Handle any additional setup, diagnostics or verification needed within scope. Escalate blockers or scope changes to Sol. When finished, send Sol the open PR link, exact head SHA, verification results and remaining issues.

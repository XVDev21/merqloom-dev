# Terra handoff · MQ-201 supplier schema and adapter

**Goal**

Give MQ-202 a testable supplier identity, SKU mapping, and deterministic fictional adapter. This is the first M2 implementation. Day 8 targets November 30 and the MVP targets December 7.

**Architecture**

Extend the pinned Medusa 2.23.0 backend with a supplier module and a native Product Variant module link. PostgreSQL enforces mapping identity. Medusa owns inventory and commerce state. The mock adapter is a pure local boundary that later tasks can call from their own workflows.

Read [engineering standards](../../AGENTS.md#engineering-standards), [PRD](../product/PRD.md), [supplier boundary](../decisions/ADR-002-supplier-boundary.md), [inventory routing](../decisions/ADR-003-inventory-routing.md), and [durable processing](../decisions/ADR-004-async-processing.md). Use adaptive-code-verification and execute the plan in order. This backend-only change uses the existing Node 22.23.4, pnpm 10.11.1, PostgreSQL and Compose workflow.

## Start from published main

Start from the live main tip containing this handoff. It must descend from `21b5acaea06ade1d36a509d284c8dc6404142bf6`, the accepted M1 baseline with published engineering standards and passing [Foundation](https://github.com/XVDev21/merqloom-dev/actions/runs/46096611667) and [Compose](https://github.com/XVDev21/merqloom-dev/actions/runs/46096611661). If the MQ-201 worktree exists, inspect its branch, base and in-progress work before resuming.

```bash
set -euo pipefail
cd /home/vonspc/merqloom-dev
test -z "$(git status --porcelain)"
test "$(git remote get-url origin)" = https://github.com/XVDev21/merqloom-dev.git
git fetch origin main
mq201_base=$(git rev-parse --verify refs/remotes/origin/main)
mq201_live=$(git ls-remote --exit-code origin refs/heads/main | cut -f1)
test "$mq201_base" = "$mq201_live"
git merge-base --is-ancestor 21b5acaea06ade1d36a509d284c8dc6404142bf6 "$mq201_base"
git cat-file -e "$mq201_base:docs/handoffs/TERRA_MQ-201_SUPPLIER_SCHEMA_ADAPTER.md"
git worktree add -b feat/MQ-201-supplier-schema-adapter /home/vonspc/merqloom-mq201 "$mq201_base"
printf 'MQ-201 release base %s\n' "$mq201_base"
```

## 1. Supplier models, migration and native link

- [ ] Start with requirements tests for supplier identity and the mapping constraint. Two suppliers can each use external SKU `POUCH-NATURAL`. The same supplier cannot create that mapping twice, including overlapping writes. Prove database enforcement independently of any service precheck.
- [ ] Add `Supplier` and `SupplierMapping` using Medusa `model` and `MedusaService` in `apps/backend/src/modules/supplier/`. Register module key `supplier` in `apps/backend/medusa-config.ts`. `Supplier` has a stable database ID, unique fixture code and display name. `SupplierMapping` belongs to `Supplier` and adds a nonempty `external_sku`. Put the unique composite index on `(supplier_id, external_sku)` in the model and verify it in the generated migration. Trim input at the internal write boundary, reject blank SKUs, and preserve case. Keep import-run and observation persistence in MQ-202.
- [ ] Add `apps/backend/src/links/supplier-mapping-variant.ts` using `defineLink`, `ProductModule.linkable.productVariant` and `SupplierModule.linkable.supplierMapping`. Configure the mapping side as a list so one native variant can have multiple supplier mappings and each mapping can have at most one native variant. Use the link as the single persisted variant association. Exercise lookup through native Query or Link. Deleting or dismissing a supplier mapping must never delete a native variant.
- [ ] Provide one internal mapping creation operation under `apps/backend/src/workflows/` taking `{ supplierId, externalSku, variantId }`. Resolve the native variant and confirm its product has `metadata.source === "supplier"` before creating the mapping. Use native workflow compensation if link creation fails after the mapping write. Run a failure-path check that leaves neither a usable orphan mapping nor a link. Missing suppliers, missing variants and direct-stock variants must produce no new mapping. The operation creates a mapping once. MQ-202 owns repeated import/upsert behavior.
- [ ] Use `pnpm --dir apps/backend exec medusa db:generate supplier` and review the generated module migration. Run `pnpm --dir apps/backend exec medusa db:migrate` only against verified disposable PostgreSQL. The pinned CLI syncs module links during migration. Prove a fresh database boot and an upgrade of a disposable database seeded from the accepted baseline. Run migration twice on the upgrade fixture. Verify existing direct fixture counts, prices, inventory and orders are unchanged by migration and by the supplier mapping exercise, before running any order-creating regression tests. Use the seeded `MQ-SUPPLIER-POUCH` variant as the native supplier example. It stays browse-only and at zero available stock in MQ-201.

Support verified in the installed backend includes `model.define`, `MedusaService`, `defineLink`, `ProductModule.linkable.productVariant`, the Link container key, `createRemoteLinkStep` and the migration commands. Use the native extension points and keep the PR free of new dependencies. [Medusa module and migrations](https://docs.medusajs.com/learn/fundamentals/modules) · [Module link cardinality](https://docs.medusajs.com/learn/fundamentals/module-links) · [Link operations](https://docs.medusajs.com/learn/fundamentals/module-links/link)

## 2. Deterministic mock adapter

- [ ] Define a typed adapter and local fixture implementation in `apps/backend/src/modules/supplier/adapters/`. Publish the resulting interface as the MQ-202 and MQ-203 integration contract. Use these operations and data boundaries:

  | Operation | Input and result |
  | --- | --- |
  | `getCatalog` | Supplier code → fixture rows with `externalSku` and `title`. |
  | `getInventory` | Supplier code, requested external SKUs and an explicit UTC `observedAt` → observations of `externalSku`, nonnegative integer `quantity` and the supplied timestamp. An unknown SKU yields no observation. A known zero-stock SKU yields quantity 0. |
  | `submitFulfillment` | Supplier code, stable `requestKey` and SKU/positive-integer quantity lines → simulated accepted receipt with a deterministic reference, or a typed rejection. The mock makes no writes and uses no random values. |
  | `getFulfillmentStatus` | Supplier code and an accepted mock receipt → deterministic simulated status. A receipt from a different supplier or an invalid receipt yields a typed rejection. MQ-203 persists receipts, retries and resulting state. |

- [ ] Test equal results for identical input, distinct references when supplier or logical key changes, rejection of invalid or unknown inputs, and the distinction between zero and absent inventory. Use an injected observation timestamp and local fixtures. The mock must work with outbound network access unavailable. Keep supplier observations separate from native stock and keep the adapter independent of pricing, carts, payments and fulfillment writes.

## Verification and submission

- [ ] Start with adaptive verification on the actual branch. Use focused automated checks while implementing. Add the supplier contract, uniqueness, and link/compensation regression to the existing test path exercised by Foundation. Prefer the repository's Node runner and disposable Medusa CLI fixture pattern. Keep fixture writes inside explicitly disposable PostgreSQL and Redis, using the [runbook's ownership checks](../architecture/LOCAL_ENVIRONMENT.md#disposable-integration-verification). If the retained stack occupies the legacy test ports, use a disposable override only for checks with configurable endpoints and use exact-head Foundation for the fixed-port full suite.
- [ ] Verify lint, typecheck, production build, the supplier adapter and database assertions, the existing M1 integration suite, and exact-head Compose cold startup and simulated checkout. Record which steps were local and which ran in CI. Browser screenshots are applicable only if an unexpected visible change needs evidence. Supplier Admin and the supplier Store journey have their own later gates.
- [ ] Create `docs/verification/MQ-201.md` with base and pushed revisions, the schema/adapter interface, actual commands, migration and constraint results, direct-state evidence, and CI links. Update the ledger and progress to `IN_REVIEW`. Leave the implementation PR open on the final checked SHA for Sol's review.
- [ ] Later M2 tasks own CSV import, observation persistence and freshness, supplier checkout, durable worker and retry behavior, and Admin UI. Use local fixtures for all MVP supplier operations. The [engineering work tracker](../roadmap/TASKS.md#engineering-improvements) assigns performance and predeployment work separately.

## Copy into Terra's conversation

Implement MQ-201 in `XVDev21/merqloom-dev`. Start from verified live `main` in `/home/vonspc/merqloom-dev` and follow `docs/handoffs/TERRA_MQ-201_SUPPLIER_SCHEMA_ADAPTER.md` on its isolated feature branch. Apply `AGENTS.md` and adaptive-code-verification. Deliver the supplier module, database-unique supplier/SKU mapping, native variant link, and deterministic offline adapter. Prove clean and upgrade migrations, duplicate rejection, independent supplier keys, failed-link compensation, and direct inventory and order invariance on disposable data. Run the existing M1 regressions and exact-head Foundation and Compose. Record `docs/verification/MQ-201.md` and leave the PR open for Sol. CSV, freshness, worker, Admin, and supplier checkout stay in their subsequent tasks.

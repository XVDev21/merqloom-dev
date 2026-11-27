# Task ledger

Updated 2026-11-26, Asia/Manila. M0 foundation tasks are accepted. Each M0 entry references the common publication record in docs/verification/M0_ACCEPTANCE.md. Each task requires tests, a verified remote SHA and review. Git states are independent of implementation states.

## MQ-001: Environment/upstream/repository preflight

Owner: Astra. Dependencies: None. Gate: M0. Status: ACCEPTED. Git: PUSHED. Branch: main. Foundation SHA: 9ed5bd5. CI: 45011973691. Direct initial publication.

## MQ-002: PRD, ADRs and governance

Owner: Astra. Dependencies: MQ-001. Gate: M0. Status: ACCEPTED. Git: PUSHED. Branch: main. Foundation SHA: 9ed5bd5. CI: 45011973691. Direct initial publication.

## MQ-003: Official scaffold and dependencies

Owner: Astra. Dependencies: MQ-001, MQ-002. Gate: M0. Status: ACCEPTED. Git: PUSHED. Branch: main. Foundation SHA: 9ed5bd5. CI: 45011973691. Direct initial publication.

## MQ-004: Isolated infrastructure and synthetic seed

Owner: Astra. Dependencies: MQ-003. Gate: M0. Status: ACCEPTED. Git: PUSHED. Branch: main. Foundation SHA: 9ed5bd5. CI: 45011973691. Direct initial publication.

## MQ-005: Baseline checks, CI, initial push and handoff

Owner: Astra. Dependencies: MQ-003, MQ-004, MQ-006. Gate: M0. Status: ACCEPTED. Git: PUSHED. Branch: main. Foundation SHA: 9ed5bd5. CI: 45011973691. Direct initial publication.

## MQ-006: Design foundation and claim policy

Owner: Astra. Dependencies: MQ-002, MQ-003. Gate: M0. Status: ACCEPTED. Git: PUSHED. Branch: main. Foundation SHA: 9ed5bd5. CI: 45011973691. Direct initial publication.

## MQ-101: Studio and working CTAs

Owner: Sol. Reviewer: Astra. Gate: M1. Status: ACCEPTED. Git: PUSHED and merged. [PR #1](https://github.com/XVDev21/merqloom-dev/pull/1), reviewed head 5d411c3, main merge 197e631. [Acceptance evidence](../verification/MQ-101.md).

## MQ-102: Catalog/PDP/variants/search

Owner: Sol. Reviewer: Astra. Dependencies: MQ-101 accepted. Gate: M1. Status: ACCEPTED on merge of [PR #3](https://github.com/XVDev21/merqloom-dev/pull/3). Git: PUSHED. Reviewed implementation: dfc3144c7d139e103e479ca207d9507ffe9cb594. [Day 5 evidence](../verification/DAY_05_2026-11-27.md).

## MQ-103: Cart and simulated checkout

Owner: Terra. Reviewer: Sol. Dependencies: MQ-102 accepted. Gate: M1. Status: ACCEPTED. Git: PUSHED and merged. Reviewed head: `60bc4801cfcb90595e6acb21ca75d8eac55c54cb`. Main merge: `8d065fd8a25be20c64372c5cd85b1fbff302d65b`. [PR #6](https://github.com/XVDev21/merqloom-dev/pull/6) · [Day 6 evidence](../verification/DAY_06_2026-11-28.md) · [Released handoff](../handoffs/TERRA_MQ-103_CHECKOUT.md).

## MQ-104: Direct inventory and manual fulfillment

Owner: Terra. Reviewer: Sol. Dependencies: MQ-103 accepted. Gate: M1. Status: ACCEPTED. Git: PUSHED and merged. Reviewed head: `88366fc012c09cca5ca3a40d631a4ff0fcb414a9`. Main merge: `92051bff02628444d0c36069f281fa59e3cf343e`. [PR #9](https://github.com/XVDev21/merqloom-dev/pull/9) · [Day 7 evidence](../verification/DAY_07_2026-11-29.md) · [Released handoff](../handoffs/TERRA_MQ-104_DIRECT_FULFILLMENT.md).

## MQ-105: Direct-flow gate review

Owner: Sol. Dependencies: MQ-101 through MQ-104. Gate: M1. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-106: Full-stack Compose development

Owner: Terra. Reviewer: Sol. Dependencies: MQ-104 accepted. Status: IN_REVIEW. Branch: `feat/MQ-106-full-stack-compose`. [Infrastructure handoff](../handoffs/TERRA_MQ-106_FULL_STACK_COMPOSE.md) · [verification evidence](../verification/MQ-106.md). Uses the accepted direct-flow behavior as its regression baseline. Sol owns review and merge; MQ-105 retains its original dependencies.

## MQ-201: Supplier schema and adapter

Architecture: Sol. Implementation: Terra. Dependencies: M1 accepted. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-202: Idempotent CSV import/mapping/freshness

Owner: Terra. Dependencies: MQ-201. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-203: Durable mock fulfillment/retries

Owner: Terra. Dependencies: MQ-202. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-204: Authorized supplier Admin extension

Owner: Terra. Dependencies: MQ-203. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-205: Supplier E2E and direct regression gate

Owner: Sol. Dependencies: MQ-201 through MQ-204. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-301: Accessibility/security/regression/CI

Owner: Terra. Reviewer: Sol. Dependencies: M2 accepted. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-302: Repeatable demo and portfolio evidence

Owner: Terra. Reviewer: Sol. Dependencies: MQ-301. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-303: Final MVP acceptance

Owner: Sol. Dependencies: MQ-302. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## Daily schedule

Day 1, November 23: MQ-001/002 discovery and architecture.
Day 2, November 24: MQ-003/004/006 official scaffold, infrastructure and design.
Day 3, November 25: M0 checks, push and Sol release.
Day 4, November 26: MQ-101 Studio.
Day 5, November 27: MQ-102 catalog/PDP.
Day 6, November 28: MQ-103 cart/checkout.
Day 7, November 29: MQ-104/105 direct fulfillment and M1.
Day 8, November 30: MQ-201/202 supplier boundary/CSV.
Day 9, December 1: MQ-202 repeated import/mapping/sync.
Day 10, December 2: MQ-203 async mock fulfillment.
Day 11, December 3: MQ-204/205 Console and M2.
Day 12, December 4: MQ-301 accessibility/SEO/security/claims.
Day 13, December 5: MQ-301 regression/CI/reproducibility.
Day 14, December 6: MQ-302 demo/fixtures/defect triage.
Day 15, December 7: MQ-303 final acceptance.

## Evidence rules

MQ-001 requires working resource/port inspection and upstream verification; current limitations are in PREFLIGHT.
MQ-002 requires approved requirements and decisions plus publication/review; local documents alone remain IN_REVIEW.
MQ-003/004 require actual generated dependency tree, isolated service boot and deterministic catalog.
MQ-005 requires local/remote SHA equality, real CI and runnable handoff.
MQ-006 requires applied tokens, contrast, responsive and motion evidence; policy alone is partial.
M1/M2/M3 criteria are in the PRD. Start each task from the published Sol-approved handoff and verified default-branch tip. Each handoff specifies the accepted baseline and verification commands.

Statuses: PLANNED, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, ACCEPTED, DEFERRED.
Git states: NOT_COMMITTED, LOCAL_ONLY, PUSH_PENDING, PUSHED. A rejected Git init is NOT_COMMITTED, not PUSH_PENDING.

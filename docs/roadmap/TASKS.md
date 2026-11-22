# Task ledger

Updated 2026-11-22, Asia/Manila. M0 foundation tasks are accepted. Each M0 entry references the common publication record in docs/verification/M0_ACCEPTANCE.md. Each task requires tests, a verified remote SHA and review. Git states are independent of implementation states.

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

Owner: Sol. Dependencies: MQ-101 accepted. Gate: M1. Status: IN_REVIEW (Astra). Git: PUSHED. Branch: `feat/MQ-102-catalog`. [Sol packet](../handoffs/SOL_MQ-102_CATALOG.md) · [Day 5 evidence](../verification/DAY_05_2026-11-27.md) · [GitHub review and checks](https://github.com/XVDev21/merqloom-dev/pulls?q=is%3Apr+head%3Afeat%2FMQ-102-catalog).

## MQ-103: Cart and simulated checkout

Owner: Sol. Dependencies: MQ-102. Gate: M1. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-104: Direct inventory and manual fulfillment

Owner: Sol. Dependencies: MQ-103. Gate: M1. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-105: Direct-flow gate review

Owner: Astra. Dependencies: MQ-101 through MQ-104. Gate: M1. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-201: Supplier schema and adapter

Owner: Astra design; Sol implements. Dependencies: M1 accepted. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-202: Idempotent CSV import/mapping/freshness

Owner: Sol. Dependencies: MQ-201. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-203: Durable mock fulfillment/retries

Owner: Sol. Dependencies: MQ-202. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-204: Authorized supplier Admin extension

Owner: Sol. Dependencies: MQ-203. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-205: Supplier E2E and direct regression gate

Owner: Astra. Dependencies: MQ-201 through MQ-204. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-301: Accessibility/security/regression/CI

Owner: Sol; Astra reviews. Dependencies: M2 accepted. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-302: Repeatable demo and portfolio evidence

Owner: Sol; Astra reviews. Dependencies: MQ-301. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-303: Final MVP acceptance

Owner: Astra. Dependencies: MQ-302. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

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
M1/M2/M3 criteria are in PRD and the M1 packet; later task packets must bind exact test commands and accepted SHA before starting.

Statuses: PLANNED, READY, IN_PROGRESS, BLOCKED, IN_REVIEW, ACCEPTED, DEFERRED.
Git states: NOT_COMMITTED, LOCAL_ONLY, PUSH_PENDING, PUSHED. A rejected Git init is NOT_COMMITTED, not PUSH_PENDING.

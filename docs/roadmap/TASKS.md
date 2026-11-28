# Task ledger

Updated 2026-11-27, Asia/Manila. M0 foundation tasks are accepted. Each M0 entry references the common publication record in docs/verification/M0_ACCEPTANCE.md. Each task requires tests, a verified remote SHA and review. Git states are independent of implementation states.

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

Owner and reviewer: Sol. Evidence and scoped fixes: Terra. Dependencies: MQ-101 through MQ-104 accepted. Gate: M1. Status: ACCEPTED on merge of [PR #15](https://github.com/XVDev21/merqloom-dev/pull/15). Reviewed submission: `cc9be247bf8bf08e41717a82259e470ee37caf44`. [Sol acceptance and verification](../verification/M1_ACCEPTANCE.md#sol-acceptance--november-28) · [Released handoff](../handoffs/TERRA_MQ-105_M1_ACCEPTANCE.md).

## MQ-106: Full-stack Compose development

Owner: Terra. Reviewer: Sol. Dependencies: MQ-104 accepted. Status: ACCEPTED. Git: PUSHED and merged. Reviewed head: `affa929ea837f36e0383f0a063dac6205d840cd2`. Main merge: `5cbce5228458dc37aa30a4b22b1fad4c07e04f3d`. [PR #12](https://github.com/XVDev21/merqloom-dev/pull/12) · [Infrastructure handoff](../handoffs/TERRA_MQ-106_FULL_STACK_COMPOSE.md) · [verification evidence](../verification/MQ-106.md). MQ-105 retains its original dependencies.

## MQ-201: Supplier schema and adapter

Architecture and review: Sol. Implementation: Terra. Dependencies: M1 accepted. Gate: M2. Status: ACCEPTED on merge of [PR #18](https://github.com/XVDev21/merqloom-dev/pull/18). [Sol acceptance and verification](../verification/MQ-201.md#sol-acceptance--november-28) · [Released handoff](../handoffs/TERRA_MQ-201_SUPPLIER_SCHEMA_ADAPTER.md).

## MQ-202: Idempotent CSV import/mapping/freshness

Owner: Terra. Reviewer: Sol. Dependencies: MQ-201 accepted. Gate: M2. Status: IN_REVIEW. Branch: `feat/MQ-202-supplier-import-freshness`. [PR #20](https://github.com/XVDev21/merqloom-dev/pull/20) · [Verification](../verification/MQ-202.md). [Released CSV import and freshness handoff](../handoffs/TERRA_MQ-202_SUPPLIER_IMPORT_FRESHNESS.md).

## MQ-203: Durable mock fulfillment/retries

Owner: Terra. Dependencies: MQ-202. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none. The later release covers gated supplier checkout as the prerequisite for the durable mock fulfillment journey.

## MQ-204: Authorized supplier Admin extension

Owner: Terra. Dependencies: MQ-203. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-205: Supplier E2E and direct regression gate

Owner: Sol. Dependencies: MQ-201 through MQ-204. Gate: M2. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-301: Accessibility/security/regression/CI

Owner: Terra. Reviewer: Sol. Dependencies: M2 accepted. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

Capture the database request and storefront lab baselines listed in [Engineering improvements](#engineering-improvements). Record revision, fixture size, run conditions and results. Timebox optional profiling, tuning and hosted k6 to the M3 schedule. Transfer any open predeployment acceptance evidence to MQ-401 when MQ-301 closes.

## MQ-302: Repeatable demo and portfolio evidence

Owner: Terra. Reviewer: Sol. Dependencies: MQ-301. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-303: Final MVP acceptance

Owner: Sol. Dependencies: MQ-302. Gate: M3. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none.

## MQ-401: Predeployment engineering acceptance

Owner and release reviewer: Sol. Gate: before public deployment. Dependencies: M3 accepted, a staging environment and an approved deployment plan. Status: PLANNED. Git: NOT_COMMITTED. Branch/SHA/PR/CI: none. Schedule this separately from the December 7 demo. Sol closes each predeployment criterion below on evidence and records any optimization ruled out by that evidence. Completion of this task is an engineering gate for a separate deployment decision.

## Engineering improvements

| Area | MVP work and owner | MQ-401 acceptance before public deployment |
| --- | --- | --- |
| Database optimization | Terra, MQ-301. Count catalog and checkout calls with one and multiple cart lines. Investigate checkout batching or SQL plans when measured cost warrants it. MQ-201 owns the mapping uniqueness constraint. | Verify the request and query budget on representative staging data. Resolve measured repetition and index candidates with before/after evidence and M1/M2 integrity checks. |
| Application caching | Sol reviews candidates from MQ-301 read timings. MQ-203 owns worker persistence and replay. Preserve fresh cart, checkout, inventory and supplier eligibility reads. | Record the cache decision using measured benefit. For any adopted metadata cache, verify scope, hit rate, invalidation, failure fallback and separation from session and durable work state. |
| Frontend performance | Terra, MQ-301. Capture mobile lab LCP, CLS, resource bytes and the LCP element on Studio, catalog and product detail. | Close any outstanding lab baseline or regression work. Verify agreed production build budgets in staging and record the plan for field LCP, INP and CLS measurements. |
| API rate limiting and resource protection | Terra, MQ-202. Verify supplier file, row, field and batch limits. MQ-301 reviews request cost and checkout lease/recovery behavior where applicable. | Verify ingress body, rate and timeout budgets, expected 413 and 429 responses, normal checkout and restricted origin exposure on the selected hosting topology. Close any outstanding lease or crash-recovery evidence required for that topology. |
| Dedicated k6 load testing | Terra, MQ-301 if the schedule allows. Keep a short, opt-in hosted HTTP smoke on synthetic disposable data outside routine tests. | Deliver any outstanding k6 smoke and run a bounded staging workload on synthetic data. Attach the workload, endpoint p95, error and dropped-iteration results against approved budgets and confirm expected commerce state. |
| Code health and dependencies | Apply [engineering standards](../../AGENTS.md#engineering-standards) on each M2/M3 change. Verify duplication and unused dependency candidates in focused changes when justified. | Review remaining dependency advisories and confirmed cleanup risks. Prove any manifest removal with a frozen install, builds and affected regressions. Record any retained findings and their disposition. |

## ENG-001: Global engineering-excellence skill assessment

Owner: Sol. Status: PLANNED. Separate assessment and approval after the MVP or a second project pilot. Compare a narrow decision workflow with current adaptive verification and specialized skills using behavioral evaluations. Report decision quality and context cost before proposing a global skill, global instructions, or runner changes.

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

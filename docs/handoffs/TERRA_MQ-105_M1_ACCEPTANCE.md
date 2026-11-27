# Terra handoff and master prompt · MQ-105 M1 acceptance

Terra prepares the final M1 evidence and fixes confirmed blockers within scope. Sol independently reviews the exact pushed revision, records the M1 decision, and owns the merge. Use the accepted work from MQ-101 through MQ-104 and verify the direct customer and operator journey on the current containerized baseline. Day 7 remains the November 29 target.

## Start from the released baseline

The accepted local runtime and commerce baseline is on main at `6367d1daf16fcfbea08722d2013f720b632158f9` with passing [Foundation](https://github.com/XVDev21/merqloom-dev/actions/runs/45960876176) and [Compose](https://github.com/XVDev21/merqloom-dev/actions/runs/45960876159). The release commit containing this packet will be a descendant. Record the exact live main tip containing this file. Reuse the existing feature worktrees only as references. If the MQ-105 worktree already exists, verify its base and scope before resuming.

```bash
cd /home/vonspc/merqloom-dev &&
test -z "$(git status --porcelain)" &&
test "$(git remote get-url origin)" = https://github.com/XVDev21/merqloom-dev.git &&
git fetch origin main &&
mq105_base=$(git rev-parse --verify refs/remotes/origin/main) &&
mq105_live=$(git ls-remote --exit-code origin refs/heads/main | cut -f1) &&
test "$mq105_base" = "$mq105_live" &&
git merge-base --is-ancestor 6367d1daf16fcfbea08722d2013f720b632158f9 "$mq105_base" &&
git cat-file -e "$mq105_base:docs/handoffs/TERRA_MQ-105_M1_ACCEPTANCE.md" &&
git worktree add -b review/MQ-105-m1-acceptance /home/vonspc/merqloom-mq105 "$mq105_base" &&
printf 'MQ-105 release base %s\n' "$mq105_base"
```

Read [AGENTS](../../AGENTS.md), [M1 requirements](../product/PRD.md#acceptance), [system architecture](../architecture/SYSTEM.md), [inventory policy](../decisions/ADR-003-inventory-routing.md), [local runbook](../architecture/LOCAL_ENVIRONMENT.md) and the [claims register](../conversion/CLAIMS_REGISTER.md). Use the installed adaptive-code-verification and playwright-cli manuals. Consult the conversion, design and motion skills where a confirmed finding involves those surfaces.

## Evidence required for the gate

| Area | Accepted evidence to reuse | Current-baseline check |
| --- | --- | --- |
| MQ-101 Studio and roadmap | [Studio acceptance](../verification/MQ-101.md) | Follow the working Studio-to-Store link. Confirm the roadmap and public claim language describe the observed simulated behavior. |
| MQ-102 catalog and variants | [Day 5](../verification/DAY_05_2026-11-27.md) | Check the selected tray variant, price and availability. Confirm one catalog recovery case and that the supplier preview stays browse-only. Reuse accepted five-width evidence where the UI is unchanged. |
| MQ-103 cart and checkout | [Day 6](../verification/DAY_06_2026-11-28.md) | Exercise cart persistence and a rejected edit with re-review. Verify native PHP totals, clear simulated payment and shipping, confirmation refresh and isolation from another session. Use the existing integration tests for interrupted/repeated submits and verify one Medusa order. |
| MQ-104 direct fulfillment | [Day 7](../verification/DAY_07_2026-11-29.md) | Take the same synthetic Store order into authenticated native Admin, fulfill it from Demo warehouse and record a simulated shipment. Link the order, variant, quantity and totals. Compare stocked, reserved and available quantities at each stage. Use the existing native integration assertions for unavailable stock, unauthorized actions and fulfillment/shipment replays. |
| Container integration | [MQ-106](../verification/MQ-106.md) | Run readiness on a disposable full stack. Verify the native catalog, Admin and sanitized application diagnostics. Carry the accepted startup, existing-volume retention, hot reload and portable image evidence forward where runtime inputs and code match. |

Use one coherent Store → checkout → Admin walkthrough with synthetic data and a short table of before/after inventory observations. Record the usable keyboard path, visible focus, a narrow and desktop layout and retained reduced-motion behavior. Capture only the evidence needed to show the current gate. Reuse accepted scripts and screenshots where they still prove the claim.

Perform a bounded review of auth and logging behavior. Ensure backend totals and Medusa records stay authoritative, confirmation stays session-bound, negative stock and duplicate actions preserve state, and published evidence contains no real contact data, tokens or raw logs. Keep the known native Admin markup warning, native HTTP 409 coverage, Redis crash recovery and no-JavaScript unsaved-field limitation explicit. Reclassify a prior limitation only when this run supplies evidence that it blocks M1.

## Verification strategy

- [ ] Start with adaptive verification on the actual worktree and changed paths. Map each check to a gate criterion. Reuse evidence only when the tested code, runtime and inputs still apply. Record its revision and source. Run focused checks during a correction and the full affected gate once on the finished code.
- [ ] Use a separate disposable Compose project with its own PostgreSQL and Redis volumes. Keep the running `merqloom-dev` project, its ports and data available. Use free loopback ports and the runbook's ownership checks. `scripts/mq106-compose-smoke.mjs` accepts `MQ106_STOREFRONT_URL` and `MQ106_BACKEND_URL`. When existing browser scripts assume the default ports or screenshot paths, adapt an ignored verification copy or reuse their steps in a named session. Keep accepted evidence files intact. The full integration suite can use the exact-head Foundation run when fixed local ports are occupied. Record which checks actually ran locally and in CI.
- [ ] Verify Compose readiness, the current direct-flow browser and Admin walkthrough, exact-head Foundation lint/typecheck/build and the full integration suite, and the exact-head Compose smoke. Use the installed, pinned toolchain. Run `git diff --check` and verify documentation links. Any failed gate requires a reproducible finding and a smallest useful next action.

## Coding standard for any correction

- [ ] Make source changes only to resolve a confirmed M1 blocker. Reproduce it first and add or strengthen the smallest regression that would fail before the fix. Use the existing native APIs, validation rules and shared helpers where their behavior fits. Preserve validation at each trust boundary and preserve checkout, inventory and recovery semantics.
- [ ] Keep code short and readable. Remove unused variables, imports, helpers, branches and temporary output from the paths you change. Give each declaration a clear purpose. Avoid repeated logic, repeated computations and unnecessary state. Consolidate duplication when it preserves behavior and makes the code easier to follow. Keep names descriptive and favor straightforward control flow over compressed expressions or extra abstraction.
- [ ] Use validation as evidence for simplification. Confirm callers and edge cases before deleting or combining logic. Rerun the failing test and its nearby cases after the correction, and review the diff for dead code, duplication, changed security checks and accidental behavior changes. Lint, typecheck and tests support this review. Leave unrelated cleanup, provider changes and supplier work to their own tasks. Escalate changes in commerce ownership or native transaction behavior to Sol.

## Submit the acceptance packet

Create `docs/verification/M1_ACCEPTANCE.md` with Terra's evidence and `IN_REVIEW` status. Include the base and pushed SHA, acceptance matrix results, a reproducible direct-flow walkthrough, synthetic order and inventory evidence, sanitized captures as needed, exact commands and outcomes, CI links, limitations, and any blocking findings. Point to accepted records instead of copying them. Update the ledger and progress. If current evidence holds, deliver an evidence-only PR. Scope any code and test changes to proven blockers.

Push the task branch, verify the live SHA and open a PR to main. Wait for both required workflows on the exact final head and leave the PR open for Sol. Sol signs the M1 decision and releases any next milestone task separately. MQ-106 is already accepted. M2, production deployment and unrelated refactoring remain separate.

## Copy into Terra's conversation

Act as Terra, Merqloom's implementation engineer. Execute the released `docs/handoffs/TERRA_MQ-105_M1_ACCEPTANCE.md` for MQ-105 from verified main in `/home/vonspc/merqloom-dev`. Use its isolated worktree and disposable Compose procedure. Reuse accepted MQ-101–104 evidence and verify the full direct Store → checkout → native Admin fulfillment journey and current regressions. Prepare `docs/verification/M1_ACCEPTANCE.md` and an exact-head PR with Foundation and Compose evidence. Fix only confirmed blockers and use focused regression checks to prove each fix. Keep code short, clear, free of unused declarations and repeated logic, and reuse existing validators and helpers where they fit. Leave the PR and M1 decision to Sol.

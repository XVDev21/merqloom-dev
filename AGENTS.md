# Merqloom development

Consult adaptive-code-verification for every task, including read-only research and documentation. Respect read-only scope, coordinate applicable Superpowers workflows, and report executed evidence. Use commerce-conversion-strategy for buyer decisions and claims, design-taste-frontend for composition, and design-motion-principles for interaction feedback. Use playwright-cli for browser journeys. Read the installed manuals before applying them.

Sol owns architecture, task release, technical review, acceptance and authorized merges. Terra implements released tasks in a separate conversation on a task-specific branch and opens a pull request for Sol. Terra leaves the PR open for review and escalates architecture, inventory and payment decisions to Sol. Sol reviews the exact pushed SHA, verifies relevant test evidence and the Foundation checks on the final PR head, and records acceptance and Git state. A READY task starts from the verified default-branch tip containing its Sol-approved handoff.

Review the PRD, ADRs, task ledger and local runbook first. Record checks, screenshots, exact SHA, CI and outstanding defects. Keep credentials, merchant data and private research outside Git. Astra's acceptance records and Sol's implementation handoffs through MQ-102 document the previous workflow.

## Engineering standards

- Keep changes focused and readable. Use the simplest supported approach and check the project's pinned framework and existing helpers first. Use descriptive names and remove unused declarations, unnecessary state and repeated work in changed paths. Share business rules when callers need the same behavior. Keep unrelated cleanup in its own change.
- Prefer existing dependencies and tools. For an addition, explain the need, why the existing toolchain falls short, and the maintenance and security cost. Verify runtime, build and test callers before removing a dependency.
- Validate and authorize at each trust boundary. Bound input size, batch size and retries where applicable. Preserve Medusa's authority over commerce transactions. For writes that can repeat or fail partway, use a stable idempotency key with a database constraint where needed, and use transactional writes or documented compensation. Bring changes to commerce ownership or recovery semantics to Sol.
- Reproduce a regression before correcting it and verify the smallest case that would fail without the fix. Run focused checks during implementation and the relevant acceptance gate on the final revision. Reuse evidence when the code, inputs and runtime still match.
- Measure before optimizing. Record the workload, before and after results, and correctness checks for performance changes. Use synthetic data in a [verified disposable environment](docs/architecture/LOCAL_ENVIRONMENT.md#disposable-integration-verification) for load or order-creating checks.

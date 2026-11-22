# ADR-004: Durable mock processing

Status: approved intent; exact module configuration pending version-specific validation.

Use Medusa-supported event/workflow facilities and Redis persistence. Persist a unique logical key derived from supplier, order, fulfillment and action; use a database uniqueness constraint, not an in-memory flag. Repeated delivery or manual retry reuses the logical request.

State vocabulary proposal: queued, processing, accepted, shipped, failed. Shipping values remain visibly simulated. Transient failure uses bounded retries (initial proposal: three attempts with increasing delay); permanent validation failure is terminal. Manual retry requires admin authorization and an audit entry. Failure never marks native fulfillment shipped.

Test success, duplicate events, transient recovery, terminal failure, worker restart and native-state reconciliation. A queue enqueue alone does not pass acceptance.

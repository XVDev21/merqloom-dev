# ADR-003: Inventory freshness and cart routing

Status: approved policy, implementation deferred to M2.

Two separate demonstration orders, one source per cart. Reject a conflicting source on cart mutation and again at completion server-side. A UI-only guard is insufficient. Verify hooks and transactions in the selected Medusa version before coding.

Mock supplier observations have an explicit configurable freshness threshold; initial demo proposal is 15 minutes. Unknown, stale or failed observations must not authorize supplier checkout. A failed refresh preserves the last observation for audit but does not advertise it as fresh. Never overwrite direct stock from a supplier import.

Medusa remains authoritative for availability/reservations. Test reservation changes, stock exhaustion and repeated fulfillment instead of assuming semantics. Define cancellation behavior before extending the order lifecycle.

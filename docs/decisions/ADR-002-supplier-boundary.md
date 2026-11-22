# ADR-002: Supplier boundary

Status: approved conceptual boundary; exact Medusa extension APIs pending M2 review.

Custom supplier records hold no native commerce ledger. Unique mapping key: supplier ID plus external SKU, linked to a Medusa variant. Imports require schema/size limits and stable upserts. Missing rows do not delete products. Validate first and use transactional updates or documented compensation.

Adapter operations: getCatalog, getInventory, submitFulfillment, getFulfillmentStatus. Use typed inputs/results, stable IDs and deterministic fixtures; implementation must not make network calls.

Direct stock uses native merchant location/manual fulfillment. Supplier stock uses a separate native location/provider relationship once validated. The custom snapshot records observation provenance and freshness only.

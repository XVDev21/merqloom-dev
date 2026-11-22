# Full Product Completion Roadmap (Outside the 15-Day MVP)

All items below are future candidates. None may be declared part of the December 7 MVP without an explicit scope change and new acceptance criteria.

## Release 1.1: Production trust and reliability

- Authenticated account security and access review; rate limits, audit trails, secret rotation.
- Real gateway under approved test/live progression, regional taxation, shipping/rate calculations and invoice requirements.
- Refund/return/cancellation and customer support workflows, applicable policies and privacy requirements.
- Persistent uploads, monitored worker queues, backups, recovery drills, uptime alerts and performance/load tests.
- Launch readiness decision with operating costs and security evidence, not a blanket production-ready claim.

## Release 1.2: Actual supplier operations

- Contracted supplier API connections with authorization, credentials and terms.
- Supplier service-level expectations and inventory reconciliation; mapping drift, duplicate updates, idempotency under unreliable networks.
- Multi-supplier selection, partial shipments, split fulfillment for mixed carts, tracking, exceptions and manual overrides.
- Cost/landed margin estimation with current shipping/tax/fees and explicit estimate vs realized labels.

## Release 1.3: Growth, customer experience, and measurement

- Consent-aware conversion analytics, measurable funnel reports, validated experiments and hypothesis registry.
- Merchandising, promotions, contextual recommendations, email/customer communication integrations with applicable consent.
- Content tools, technical SEO maturity, localization/multi-currency by supported market, increased accessibility assurance.

## Release 2.0: Multi-merchant SaaS (optional)

- Architecture decision on tenant isolation and data ownership, merchant onboarding, RBAC, merchant customization and domain configuration.
- Service billing/subscriptions, tenant-level audit logs, access/usage control, support/incident processes, scalable deployments.
- Do not introduce tenancy now simply because the name could later become a SaaS.

## Release decision gates

Each release requires: validated customer/supplier market, business requirements and authorization; feature acceptance contracts; privacy/security review; deployment/operating budget; tests; monitoring; rollback and support plan. Astra must propose a release order based on real business needs rather than assume the next release is automatically approved.

# ADR-001 · Foundation

Accepted November 22. Use the official Medusa 2.23.0 DTC monorepo with two application packages. Medusa owns transactional data and Admin. Next.js 16.3.8 serves Studio at / and the Store at /store. The foundation keeps the generated backend workflow conventions, workspace lock and app tooling, and introduces an intentionally small API-backed catalog. Native checkout behavior is Sol's M1 assignment.

Pin Node 22.23.4 and pnpm 10.11.1. The host's Node 22.22.1 falls below the starter minimum. Compile strict TypeScript in both applications, build sequentially, verify the production bundle and authenticate against native Admin. Use the tracked migration to install sample records once per new database.

[Upstream](../verification/UPSTREAM.md) · [Runbook](../architecture/LOCAL_ENVIRONMENT.md)

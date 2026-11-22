# ADR-005 · Local infrastructure

Accepted November 22. Project merqloom-dev owns its Compose network, PostgreSQL 16 database and Redis 7 service. Bind PostgreSQL to loopback 15432, Redis to 16379, Studio/Store to 18000 and backend/Admin to 19000. Leave unrelated Docker projects and the global context alone. Physical checkout on this workstation is ~/merqloom-dev. Build the apps sequentially.

The local HTTP start command sets a loopback-specific cookie override and binds to 127.0.0.1. Other environments retain framework cookie defaults. The M0 configuration supplies Redis connectivity. M2 must configure and demonstrate durable workflow processing separately. Deployment, paid services and public application hosting are outside the MVP.

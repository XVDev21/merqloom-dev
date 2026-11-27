# Run Merqloom locally

Use a checkout in a simple directory such as `~/merqloom-dev`. A path containing spaces and an apostrophe previously prevented Medusa's native migrations from running. The Compose workflow needs Docker Compose, Make and OpenSSL; its image pins Node 22.23.4 and pnpm 10.11.1.

## Full-stack Compose

For the first creation, from the physical checkout:

```bash
cd ~/merqloom-dev
make start
make status
make verify
```

`make start` creates ignored local secrets only when absent, builds the workspace image, starts PostgreSQL, Redis, Medusa/Admin and Next.js, and waits for their health checks. The equivalent commands are `./scripts/local-env.sh` and `docker compose up -d --build --wait --wait-timeout 360`. Database and Redis ports remain on `127.0.0.1:15432` and `127.0.0.1:16379`; the browser-facing backend and Admin are on `127.0.0.1:19000` and Studio and Store are on `127.0.0.1:18000`. The Admin development WebSocket also uses loopback port 19100. Containers use Compose DNS and internal ports. Stop any host app processes occupying those app ports before starting the containerized apps.

On the first local database, the backend runs the existing migrations and demo seed: a PHP region, manual payment and fulfillment settings, a publishable key, sample products and stock. Subsequent starts repeat the migration command without replacing existing records. The backend shares the scoped publishable key with the storefront through a Compose volume; PostgreSQL credentials are not passed to the storefront. Local HTTP cookie exceptions are enabled only in this development Compose configuration. Use fictional customer and address data.

After all four containers exist, Docker Desktop can stop and start the project. `docker compose stop` / `docker compose start` are the equivalent existing-container operations; app entrypoints wait for their dependencies again. Before the first `make start`, Desktop Start cannot create the missing app containers. `make stop` stops the four services without deleting their volumes. Never use `down --volumes` on data you intend to keep.

Use `make status`, `make verify`, and `make logs` (or `docker compose logs -f backend storefront`) for service status, native Store/catalog readiness, and application output. If initialization fails, check that the selected project and its data services are healthy and that local configuration is present; the startup scripts emit fixed diagnostic codes without printing database credentials. `docker compose ps -a` and the bounded readiness checks help locate a failed service. Keep log captures free of credentials and customer data.

The development containers bind the app source and use the frameworks' development servers. Edits in `apps/storefront/src` and `apps/backend/src` reload without a rebuild; dependencies and generated output stay in the image/container. Run `make start` again after changing the lockfile, package manifests, or other image inputs. If a service cannot start after an image input change, inspect its status and logs before retrying.

Open Studio at http://127.0.0.1:18000, Store at http://127.0.0.1:18000/store, and native Admin at http://127.0.0.1:19000/app. For a new demo environment, issue an Admin invite inside the backend container and treat the printed invite as a secret:

```bash
docker compose exec backend pnpm --dir apps/backend exec medusa user --invite --email merchant@example.test
```

## Optional host app workflow and backout

To keep the same database and Redis volumes while using host app processes, stop only the app containers first, then start the data services. Use Node 22.23.4 and pnpm 10.11.1 on the host. The optional tool installation below remains inside the ignored checkout directory.

```bash
cd ~/merqloom-dev
./scripts/local-env.sh
docker compose stop backend storefront
docker compose up -d --wait postgres redis
npm install --prefix .tools node@22.23.4 pnpm@10.11.1 --no-audit --no-fund
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
export MEDUSA_DISABLE_TELEMETRY=true NEXT_TELEMETRY_DISABLED=1
pnpm install --frozen-lockfile
pnpm --dir apps/backend exec medusa db:migrate
./scripts/store-env.sh
pnpm build
```

Run `pnpm --dir apps/backend start` and `pnpm --dir apps/storefront start` in separate terminals. Development alternatives are `pnpm backend:dev` and `pnpm storefront:dev`. The store setup reads the active project's seeded key and copies the backend Redis URL into the ignored storefront environment; confirm the selected project and database before using it. Stop the host app processes before returning to `make start` so they do not contend for ports 19000 and 18000.

## Portable production image contract

Build the independent images with `docker build --target backend-runtime -t merqloom-backend:local .` and `docker build --target storefront-runtime -t merqloom-storefront:local .`. These images have no source bind mounts, do not run the demo seed or migrations as their default command, and do not set the local HTTP exception. Run release migrations separately under the operator's control before starting a production backend. Use HTTPS for the Store's secure session cookies.

Provide backend `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, and `AUTH_MFA_ENCRYPTION_KEY` at runtime. Provide storefront `MEDUSA_BACKEND_URL`, `MERQLOOM_REDIS_URL`, and `MEDUSA_PUBLISHABLE_KEY` at runtime. `PORT` selects the listener port in either image (defaults: backend 9000, storefront 8000). The runtime must supply reachable backing services and browser-facing allowed origins; it must keep secrets out of image layers and logs. Registry publication, deployment and cloud secret handling are separate work.

## Disposable integration verification

`pnpm test` and checkout browser journeys create demo orders and reserve inventory. Run them only in an explicitly disposable checkout and Compose project with separate volumes, never against a demo database you want to keep. Select a distinct `COMPOSE_PROJECT_NAME` and any necessary `COMPOSE_FILE` overrides before starting it; choose free loopback ports. Configure that checkout's ignored backend `.env` with the selected PostgreSQL and Redis host ports, run `scripts/store-env.sh` against that same project, and ensure the app test endpoints on ports 19000 and 18000 are the disposable apps. Foundation uses a fresh disposable runner and retains `pnpm test` as its test entry point.

Before a suite, inspect `docker compose ls --all`, `docker compose ps`, and `ss -ltnp` (or the operating system's equivalent). Confirm all four services, their ports and backing volumes belong to the disposable project and no other project will be stopped or reset. `make test` requires `MERQLOOM_TEST_DISPOSABLE=yes`; its guard checks the selected project's service labels and published endpoints and compares the test checkout's configured database, Redis and publishable key to that project. It prints no credentials. The flag is an operator designation, not proof that data is disposable; do not set it until you have verified ownership.

```bash
./scripts/store-env.sh
MERQLOOM_TEST_DISPOSABLE=yes make test
MERQLOOM_TEST_DISPOSABLE=yes node scripts/mq106-compose-smoke.mjs
```

The first command above writes only an ignored file. The smoke has its own project and endpoint guard. Run browser checks against the same disposable stack. For a clean replay, create another disposable project and volumes; removing a project's volumes permanently deletes its orders, products and accounts, so verify ownership before any removal.

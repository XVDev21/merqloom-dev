# Run Merqloom locally

Use a checkout in a simple directory such as `~/merqloom-dev`. The first local run under a path containing spaces and an apostrophe skipped native migrations. Moving the same checkout to a simple path allowed 189 migrations to run. Use the physical checkout for framework commands.

Use Node 22.23.4 and pnpm 10.11.1. On a machine with older Node, the following installs both inside the ignored project directory. Repeat the export in each terminal.

```bash
cd ~/merqloom-dev
npm install --prefix .tools node@22.23.4 pnpm@10.11.1 --no-audit --no-fund
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
export MEDUSA_DISABLE_TELEMETRY=true NEXT_TELEMETRY_DISABLED=1
pnpm install --frozen-lockfile
./scripts/local-env.sh
docker compose config --quiet
docker compose up -d --wait
pnpm --dir apps/backend exec medusa db:migrate
./scripts/store-env.sh
pnpm lint
pnpm typecheck
pnpm build
```

The migration creates the PHP region, manual payment and fulfillment settings, a publishable key, two sample products and stock. Running migrations again preserves fixtures. The store setup reads the scoped publishable key from the active Compose project's `merqloom` database and copies the backend Redis URL into the ignored storefront environment. Confirm the active Compose project and database before running it.

The Store uses Redis for opaque cart sessions, with a 30-day expiry. Cart and order values remain in Medusa; the session holds the cart reference, completion state and the minimal confirmation summary. If an order result is uncertain, the same cart remains locked for a status retry. The local start command enables its HTTP cookie exception only for the loopback demo; other runtimes must use HTTPS and the default secure cookie. Use fictional contact and address data.

Start one process per terminal from the repository root with the project toolchain on PATH.

```bash
pnpm --dir apps/backend start
```

```bash
pnpm --dir apps/storefront start
```

Open Studio at http://127.0.0.1:18000 and follow the catalog link. Native Admin is at http://127.0.0.1:19000/app. For a new environment, issue an invite with the command below. Open the printed invite path under the local Admin and set a local password. Treat the invite as a secret.

```bash
pnpm --dir apps/backend exec medusa user --invite --email merchant@example.test
playwright-cli -s=merqloom-m0 open http://127.0.0.1:18000
playwright-cli -s=merqloom-m0 run-code --filename scripts/browser-smoke.js
playwright-cli -s=merqloom-m0 close
```

The browser script replaces the three catalog evidence images. Review them before committing changes. Development entry points are `pnpm backend:dev` and `pnpm storefront:dev` after stopping the corresponding production process. Stop the two application processes and use `docker compose stop` to preserve demo data.

## Disposable integration verification

`pnpm test` creates demo orders and reserves inventory. Run it only in an explicitly disposable checkout and Compose project, never against a demo database you want to keep. Use a separate project name and volumes, and choose host ports that do not overlap another project. Configure that checkout's ignored backend `.env` for those PostgreSQL and Redis ports, migrate it, and run `scripts/store-env.sh` with the disposable Compose project selected. Both production apps must be restarted from that checkout after changing either environment file. Foundation uses a new disposable runner and retains `pnpm test` as its test entry point.

Before the suite, inspect `docker compose ls --all`, `docker compose ps`, and `ss -ltnp` (or the operating system's equivalent). Confirm that the selected Compose project's PostgreSQL and Redis listeners are the disposable containers, that ports 19000 and 18000 belong to the backend and storefront processes started from this checkout, and that no other project will be stopped or reset. On Linux, check the process working directories with `readlink /proc/<pid>/cwd`. Verify the database and Redis themselves:

```bash
docker compose exec -T postgres psql -U merqloom -d merqloom -c 'select current_database(), inet_server_port()'
docker compose exec -T redis redis-cli ping
```

The following check compares the two apps' configured endpoints with the *selected* Compose project's published ports and confirms that the storefront key belongs to its database. It prints no passwords or keys. `COMPOSE_PROJECT_NAME` and any `COMPOSE_FILE`/`COMPOSE_ENV_FILES` overrides must already select the disposable project in this terminal, as they did for `store-env.sh`.

```bash
node --input-type=module <<'NODE'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
const backend = parseEnv(readFileSync('apps/backend/.env', 'utf8'))
const store = parseEnv(readFileSync('apps/storefront/.env.local', 'utf8'))
const endpoint = value => { try { return new URL(value) } catch { throw new Error('Invalid configured endpoint') } }
const db = endpoint(backend.DATABASE_URL), redis = endpoint(backend.REDIS_URL)
const storeRedis = endpoint(store.MERQLOOM_REDIS_URL), storeBackend = endpoint(store.MEDUSA_BACKEND_URL)
const compose = (...args) => { try { return execFileSync('docker', ['compose', ...args], { encoding: 'utf8' }).trim() } catch { throw new Error('Docker Compose verification failed') } }
assert.equal(`${db.hostname}:${db.port}`, compose('port', 'postgres', '5432'))
assert.equal(`${redis.hostname}:${redis.port}`, compose('port', 'redis', '6379'))
assert.equal(db.pathname, '/merqloom')
assert.ok(storeRedis.href === redis.href, 'Storefront Redis does not match backend Redis')
assert.equal(storeBackend.origin, 'http://127.0.0.1:19000')
const key = compose('exec', '-T', 'postgres', 'psql', '-U', 'merqloom', '-d', 'merqloom', '-Atc', "select token from api_key where title='Default Publishable API Key' and type='publishable' and revoked_at is null and deleted_at is null")
assert.ok(store.MEDUSA_PUBLISHABLE_KEY === key, 'Storefront key does not match selected database')
console.log('Configured database, Redis, backend and storefront key match the selected Compose project.')
NODE
```

Do not run the suite if a port, process, working directory, key, or database cannot be matched to the disposable project. Once verified, with both production apps running, execute `pnpm test`. Browser checkout journeys also create orders and reserve stock; use the same disposable instance for them.

For a clean replay, create another disposable Compose project with its own volumes. Removing a project's volumes deletes its orders, products and accounts; confirm the project name and data ownership before any removal. CI exercises the setup in a new environment on each run.

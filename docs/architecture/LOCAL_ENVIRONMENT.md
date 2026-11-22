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

The migration creates the PHP region, manual payment and fulfillment settings, a publishable key, two sample products and stock. Running migrations again preserves fixtures. The store setup reads the scoped publishable key from this project's database and writes the ignored storefront environment.

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
pnpm test
playwright-cli -s=merqloom-m0 open http://127.0.0.1:18000
playwright-cli -s=merqloom-m0 run-code --filename scripts/browser-smoke.js
playwright-cli -s=merqloom-m0 close
```

The browser script replaces the three catalog evidence images. Review them before committing changes. Development entry points are `pnpm backend:dev` and `pnpm storefront:dev` after stopping the corresponding production process. Stop the two application processes and use `docker compose stop` to preserve demo data.

For an intentional clean replay on a disposable Merqloom installation, stop both applications, confirm `docker compose ps -a` shows only this project's services, then run `docker compose -p merqloom-dev down --volumes`. This deletes all local Merqloom orders, products and accounts. Repeat the setup and invitation steps. CI exercises this setup in a new environment on each run.

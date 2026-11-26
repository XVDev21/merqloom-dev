.PHONY: start stop logs status verify test

start:
	./scripts/local-env.sh
	docker compose up -d --build --wait --wait-timeout 360

stop:
	docker compose stop

logs:
	docker compose logs -f backend storefront

status:
	docker compose ps

verify:
	./scripts/compose-ready.sh

test:
	./scripts/verify-disposable.sh
	pnpm test

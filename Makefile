.PHONY: all dev test check build docker clean

all: dev

dev:
	cd apps/web && npm install && npm run dev

test:
	cd apps/web && npm test
	python eval/typo_bench.py

check:
	cd apps/web && npm run check

build:
	cd apps/web && npm run build

docker:
	docker compose up -d --build

clean:
	rm -rf apps/web/build apps/web/.svelte-kit apps/web/node_modules

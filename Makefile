.PHONY: up down logs test lint clean db-shell redis-cli install dev dev-server dev-web build deploy

# ============ DEVELOPMENT ============

# Install all dependencies
install:
	cd apps/server && npm install
	cd apps/web && npm install

# Local development infrastructure (DB + Redis)
up:
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 3
	@docker compose ps

down:
	docker compose down

down-v:
	docker compose down -v

logs:
	docker compose logs -f

# Run development servers
dev: up
	@echo "Starting development servers..."
	@make dev-server &
	@make dev-web

dev-server:
	cd apps/server && cp .env.example .env 2>/dev/null || true && npx prisma migrate dev --name init 2>/dev/null || true && npm run dev

dev-web:
	cd apps/web && npm run dev

# Database utilities
db-shell:
	docker compose exec db psql -U akistel -d akistel

db-migrate:
	cd apps/server && npx prisma migrate dev

db-generate:
	cd apps/server && npx prisma generate

db-studio:
	cd apps/server && npx prisma studio

redis-cli:
	docker compose exec redis redis-cli

# ============ TESTING ============

test:
	cd apps/server && npm test

test-server:
	cd apps/server && npm test

lint:
	cd apps/server && npm run lint
	cd apps/web && npm run lint

# ============ BUILD ============

build:
	cd apps/server && npm run build
	cd apps/web && npm run build

build-server:
	cd apps/server && npm run build

build-web:
	cd apps/web && npm run build

# ============ PRODUCTION ============

# Build and run production containers locally
prod-up:
	docker compose -f docker-compose.prod.yml up --build -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

# ============ DEPLOYMENT ============

# Deploy to Fly.io (requires flyctl)
deploy:
	fly deploy

deploy-staging:
	fly deploy --config fly.toml --app akistel-staging

# ============ CLEANUP ============

clean:
	@echo "Cleaning build artifacts..."
	rm -rf apps/server/dist apps/web/dist coverage/
	rm -rf apps/server/node_modules apps/web/node_modules

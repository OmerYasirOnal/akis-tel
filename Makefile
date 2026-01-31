.PHONY: up down logs test lint clean db-shell redis-cli install dev-server dev-web build deploy smoke

# ============ DEVELOPMENT ============

# Install all dependencies
install:
	cd apps/server && npm install
	cd apps/web && npm install

# Local development infrastructure (DB + Redis)
# NOTE: Adminer runs on port 8080, backend uses port 3000
up:
	docker compose up -d
	@echo "Waiting for services to be healthy..."
	@sleep 3
	@docker compose ps
	@echo ""
	@echo "Services ready:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis:      localhost:6379"
	@echo "  - Adminer:    http://localhost:8080"

down:
	docker compose down

down-v:
	docker compose down -v

logs:
	docker compose logs -f

# Run development servers (use in separate terminals)
# Terminal 1: make dev-server
# Terminal 2: make dev-web
dev-server:
	@echo "Starting backend on http://localhost:3000..."
	cd apps/server && npm run dev

dev-web:
	@echo "Starting frontend on http://localhost:5173..."
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

smoke:
	cd apps/server && npm run smoke

lint:
	cd apps/server && npm run lint || true
	cd apps/web && npm run lint || true

# ============ BUILD ============

build:
	cd apps/server && npm run build
	cd apps/web && npm run build

build-server:
	cd apps/server && npm run build

build-web:
	cd apps/web && npm run build

# ============ PRODUCTION ============

prod-up:
	docker compose -f docker-compose.prod.yml up --build -d

prod-down:
	docker compose -f docker-compose.prod.yml down

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

# ============ DEPLOYMENT ============

deploy:
	fly deploy

deploy-staging:
	fly deploy --config fly.toml --app akistel-staging

# ============ CLEANUP ============

clean:
	@echo "Cleaning build artifacts..."
	rm -rf apps/server/dist apps/web/dist coverage/
	rm -rf apps/server/node_modules apps/web/node_modules

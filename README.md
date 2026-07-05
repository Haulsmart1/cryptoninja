# CryptoNinja AI Starter 🥷

A subscription-based AI crypto trading platform starter kit.

> Safety first: this starter defaults to **paper trading only**. Do not enable live trading until you have tested, audited, and understood the risks.

## Stack

- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Stripe subscription placeholders
- Python 3.12 FastAPI trading engine skeleton
- Docker Compose
- GitHub Actions

## Apps

```txt
apps/web                 Next.js dashboard and landing page
services/trading-engine  Python paper-trading service
supabase/migrations      Database schema
```

## Quick Start

### 1. Install tools

- Node.js LTS
- Python 3.12
- Docker Desktop
- Git
- VS Code

### 2. Configure environment

Copy:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp services/trading-engine/.env.example services/trading-engine/.env
```

### 3. Run web app

```bash
cd apps/web
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

### 4. Run trading engine

```bash
cd services/trading-engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open:

```txt
http://localhost:8000/health
```

## Free recommended programs

- VS Code — code editor
- GitHub Desktop — easier Git
- Node.js LTS — runs Next.js
- Python 3.12 — trading engine
- Docker Desktop — containers
- Supabase free plan — database/auth
- Vercel free plan — frontend hosting
- Stripe test mode — subscription testing
- Postman or Insomnia — API testing
- DBeaver Community — database viewer
- TradingView free — charts and market checking

## Roadmap

1. Finish Supabase project connection.
2. Add real Stripe checkout.
3. Add Coinbase Advanced API paper-data adapter.
4. Add backtesting.
5. Add AI analysis.
6. Add live trading only after risk testing.

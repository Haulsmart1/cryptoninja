# Setup Guide

## Supabase

1. Create a free Supabase project.
2. Open SQL Editor.
3. Paste and run `supabase/migrations/0001_initial_schema.sql`.
4. Copy your project URL and anon key into `apps/web/.env.local`.

## Stripe

Use Stripe test mode first.

1. Create a product.
2. Create monthly prices.
3. Put the price IDs into `apps/web/.env.local`.

Checkout integration is intentionally left as a safe placeholder for the next milestone.

## Trading Engine

The trading engine is paper-only by default.

Test an order:

```bash
curl -X POST http://localhost:8000/paper/order   -H "Content-Type: application/json"   -d '{"symbol":"BTC-GBP","side":"buy","quantity":0.001,"price":50000,"portfolio_value":10000,"daily_pnl":0}'
```

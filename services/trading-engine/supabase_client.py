import httpx


class SupabaseLogger:
    def __init__(self, supabase_url: str, service_key: str):
        self.supabase_url = supabase_url.rstrip("/")
        self.service_key = service_key

    def _headers(self) -> dict:
        return {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def log_ai_signal(self, signal: dict, executed: bool) -> None:
        if not self.supabase_url or not self.service_key:
            return

        payload = {
            "symbol": signal["symbol"],
            "action": signal["side"].upper(),
            "confidence": signal.get("confidence", 75),
            "reason": signal["reason"],
            "executed": executed,
        }

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{self.supabase_url}/rest/v1/ai_signals",
                headers=self._headers(),
                json=payload,
            )
            print("AI Signal Status:", response.status_code)

    async def log_paper_trade(self, trade: dict, cash_gbp: float) -> None:
        if not self.supabase_url or not self.service_key:
            return

        payload = {
            "engine_trade_id": trade["id"],
            "symbol": trade["symbol"],
            "side": trade["side"],
            "quantity": trade["quantity"],
            "price": trade["price"],
            "value_gbp": trade["value_gbp"],
            "status": trade["status"],
            "reason": trade["reason"],
            "cash_gbp": cash_gbp,
        }

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{self.supabase_url}/rest/v1/paper_trade_logs",
                headers=self._headers(),
                json=payload,
            )
            print("Trade Status:", response.status_code)

    async def log_portfolio_snapshot(
        self,
        user_id: str,
        snapshot: dict,
    ) -> None:
        if not self.supabase_url or not self.service_key:
            return

        if not user_id:
            raise ValueError("user_id is required.")

        payload = {
            "user_id": user_id,
            "portfolio_value": snapshot["portfolio_value"],
            "cash": snapshot["cash"],
            "invested": snapshot["invested"],
            "unrealized_pnl": snapshot["unrealized_pnl"],
            "btc_price": snapshot["btc_price"],
        }

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{self.supabase_url}/rest/v1/portfolio_history",
                headers=self._headers(),
                json=payload,
            )

            print(
                "Portfolio Snapshot Status:",
                response.status_code,
            )

            if response.status_code >= 400:
                print(
                    "Portfolio Snapshot Response:",
                    response.text,
                )

            response.raise_for_status()


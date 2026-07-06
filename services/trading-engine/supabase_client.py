import httpx


class SupabaseLogger:
    def __init__(self, supabase_url: str, service_key: str):
        self.supabase_url = supabase_url.rstrip("/")
        self.service_key = service_key

    async def log_ai_signal(self, signal: dict, executed: bool) -> None:
        if not self.supabase_url or not self.service_key:
            print("Supabase AI signal logging disabled.")
            return

        payload = {
            "symbol": signal["symbol"],
            "action": signal["side"].upper(),
            "confidence": signal.get("confidence", 75),
            "reason": signal["reason"],
            "executed": executed,
        }

        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{self.supabase_url}/rest/v1/ai_signals",
                headers=headers,
                json=payload,
            )

            print("AI Signal Status:", response.status_code)
            print("AI Signal Response:", response.text)

    async def log_paper_trade(self, trade: dict, cash_gbp: float) -> None:
        if not self.supabase_url or not self.service_key:
            print("Supabase trade logging disabled.")
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

        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{self.supabase_url}/rest/v1/paper_trade_logs",
                headers=headers,
                json=payload,
            )

            print("Trade Status:", response.status_code)
            print("Trade Response:", response.text)

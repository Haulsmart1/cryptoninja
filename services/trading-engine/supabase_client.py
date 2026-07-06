import httpx


class SupabaseLogger:
    def __init__(self, supabase_url: str, service_key: str):
        self.supabase_url = supabase_url.rstrip("/")
        self.service_key = service_key

    async def log_paper_trade(self, trade: dict, cash_gbp: float) -> None:
        if not self.supabase_url or not self.service_key:
            print("Supabase logging disabled (missing credentials)")
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

            print("Status:", response.status_code)
            print("Response:", response.text)

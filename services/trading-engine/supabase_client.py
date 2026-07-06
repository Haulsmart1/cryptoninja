import httpx


class SupabaseLogger:
    def __init__(self, supabase_url: str, service_key: str):
        self.supabase_url = supabase_url.rstrip("/")
        self.service_key = service_key

    async def log_trade(self, trade: dict) -> None:
        if not self.supabase_url or not self.service_key:
            return

        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{self.supabase_url}/rest/v1/trades",
                headers=headers,
                json=trade,
            )

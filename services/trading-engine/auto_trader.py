import asyncio
from datetime import datetime, timezone
from typing import Optional

from analysis import analyze_market


class AutoTrader:
    def __init__(self):
        self.enabled = False
        self.interval_seconds = 300
        self.min_confidence = 85
        self.task: Optional[asyncio.Task] = None
        self.last_decision = None
        self.last_run_at = None
        self.trades_today = 0
        self.emergency_stop = False

    async def start(self, run_once_callback):
        if self.emergency_stop:
            return {"enabled": False, "message": "Emergency stop is active."}

        if self.enabled:
            return {"enabled": True, "message": "Auto trader already running."}

        self.enabled = True
        self.task = asyncio.create_task(self._loop(run_once_callback))

        return {"enabled": True, "message": "Auto trader started."}

    async def stop(self):
        self.enabled = False

        if self.task:
            self.task.cancel()
            self.task = None

        return {"enabled": False, "message": "Auto trader stopped."}

    def trigger_emergency_stop(self):
        self.enabled = False
        self.emergency_stop = True

        if self.task:
            self.task.cancel()
            self.task = None

        return {
            "enabled": False,
            "emergency_stop": True,
            "message": "Emergency stop activated.",
        }

    def reset_emergency_stop(self):
        self.emergency_stop = False

        return {
            "emergency_stop": False,
            "message": "Emergency stop reset.",
        }

    async def _loop(self, run_once_callback):
        while self.enabled and not self.emergency_stop:
            try:
                analysis = analyze_market("BTC-GBP")
                self.last_decision = analysis
                self.last_run_at = datetime.now(timezone.utc).isoformat()

                if (
                    analysis["action"] == "BUY"
                    and analysis["confidence"] >= self.min_confidence
                ):
                    result = await run_once_callback()

                    if result.get("executed"):
                        self.trades_today += 1

                await asyncio.sleep(self.interval_seconds)

            except asyncio.CancelledError:
                break

            except Exception as ex:
                self.last_decision = {
                    "error": str(ex),
                    "action": "HOLD",
                    "confidence": 0,
                }

                await asyncio.sleep(self.interval_seconds)

    def status(self):
        return {
            "enabled": self.enabled,
            "interval_seconds": self.interval_seconds,
            "min_confidence": self.min_confidence,
            "last_run_at": self.last_run_at,
            "last_decision": self.last_decision,
            "trades_today": self.trades_today,
            "emergency_stop": self.emergency_stop,
        }


auto_trader = AutoTrader()

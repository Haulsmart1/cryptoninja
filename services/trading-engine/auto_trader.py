import asyncio
from datetime import datetime, timezone
from typing import Awaitable, Callable, Optional

from decision_engine import make_decision


DecisionCallback = Callable[[dict], Awaitable[dict]]


class AutoTrader:
    def __init__(self) -> None:
        self.enabled = False
        self.interval_seconds = 300
        self.min_confidence = 85
        self.max_risk_score = 50
        self.task: Optional[asyncio.Task] = None
        self.last_decision: Optional[dict] = None
        self.last_result: Optional[dict] = None
        self.last_run_at: Optional[str] = None
        self.last_error: Optional[str] = None
        self.trades_today = 0
        self.emergency_stop = False

    async def start(self, execute_callback: DecisionCallback) -> dict:
        if self.emergency_stop:
            return {
                "enabled": False,
                "message": "Emergency stop is active.",
            }

        if self.enabled:
            return {
                "enabled": True,
                "message": "Auto trader already running.",
            }

        self.enabled = True
        self.last_error = None
        self.task = asyncio.create_task(
            self._loop(execute_callback)
        )

        return {
            "enabled": True,
            "message": "Auto trader started.",
        }

    async def stop(self) -> dict:
        self.enabled = False

        if self.task:
            self.task.cancel()
            self.task = None

        return {
            "enabled": False,
            "message": "Auto trader stopped.",
        }

    def trigger_emergency_stop(self) -> dict:
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

    def reset_emergency_stop(self) -> dict:
        self.emergency_stop = False

        return {
            "emergency_stop": False,
            "message": "Emergency stop reset.",
        }

    async def _loop(
        self,
        execute_callback: DecisionCallback,
    ) -> None:
        while self.enabled and not self.emergency_stop:
            try:
                decision = make_decision("BTC-GBP")

                self.last_decision = decision
                self.last_run_at = datetime.now(
                    timezone.utc
                ).isoformat()
                self.last_error = None

                should_execute = (
                    decision.get("action") == "BUY"
                    and float(decision.get("confidence", 0))
                    >= self.min_confidence
                    and int(decision.get("risk_score", 100))
                    <= self.max_risk_score
                    and float(
                        decision.get("position_size_gbp", 0)
                    )
                    > 0
                )

                if should_execute:
                    result = await execute_callback(decision)
                    self.last_result = result

                    if result.get("executed"):
                        self.trades_today += 1
                else:
                    self.last_result = {
                        "executed": False,
                        "reason": "Decision did not meet execution rules.",
                    }

                await asyncio.sleep(self.interval_seconds)

            except asyncio.CancelledError:
                break

            except Exception as error:
                self.last_error = str(error)
                self.last_result = {
                    "executed": False,
                    "reason": "Auto-trader cycle failed.",
                    "error": str(error),
                }

                await asyncio.sleep(self.interval_seconds)

    def status(self) -> dict:
        return {
            "enabled": self.enabled,
            "emergency_stop": self.emergency_stop,
            "interval_seconds": self.interval_seconds,
            "min_confidence": self.min_confidence,
            "max_risk_score": self.max_risk_score,
            "last_run_at": self.last_run_at,
            "last_decision": self.last_decision,
            "last_result": self.last_result,
            "last_error": self.last_error,
            "trades_today": self.trades_today,
        }


auto_trader = AutoTrader()

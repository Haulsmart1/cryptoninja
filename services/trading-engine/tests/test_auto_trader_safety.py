import unittest

from auto_trader import AutoTrader


class AutoTraderSafetyTests(unittest.TestCase):
    def test_emergency_stop_blocks_restart(self):
        trader = AutoTrader()

        result = trader.trigger_emergency_stop()

        self.assertFalse(result["enabled"])
        self.assertTrue(result["emergency_stop"])
        self.assertTrue(trader.emergency_stop)

    def test_safety_lock_can_be_reset(self):
        trader = AutoTrader()

        trader.trigger_emergency_stop()
        result = trader.reset_emergency_stop()

        self.assertFalse(result["emergency_stop"])
        self.assertFalse(trader.emergency_stop)


if __name__ == "__main__":
    unittest.main()

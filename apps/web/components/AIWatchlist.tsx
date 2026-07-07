"use client";

const watchlist = [
  { symbol: "BTC", score: 92, action: "BUY", trend: "📈" },
  { symbol: "SOL", score: 84, action: "BUY", trend: "📈" },
  { symbol: "ETH", score: 76, action: "HOLD", trend: "➖" },
  { symbol: "XRP", score: 41, action: "SELL", trend: "📉" },
  { symbol: "ADA", score: 55, action: "HOLD", trend: "➖" },
];

export default function AIWatchlist() {
  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6">
      <h2 className="text-2xl font-black text-cyan-300">
        🧠 AI Watchlist
      </h2>

      <div className="mt-6 space-y-4">
        {watchlist.map((coin) => (
          <div
            key={coin.symbol}
            className="rounded-xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-black">{coin.symbol}</p>
                <p className="text-sm text-slate-400">{coin.action}</p>
              </div>

              <div className="text-right">
                <p className="text-xl">{coin.trend}</p>
                <p className="font-black">{coin.score}</p>
              </div>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-300"
                style={{ width: `${coin.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

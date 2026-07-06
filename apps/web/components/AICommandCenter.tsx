"use client";

export default function AICommandCenter() {
  const widgets = [
    {
      title: "AI Status",
      value: "ONLINE",
      colour: "text-emerald-300",
    },
    {
      title: "Market",
      value: "Bullish",
      colour: "text-cyan-300",
    },
    {
      title: "Risk",
      value: "Low",
      colour: "text-emerald-300",
    },
    {
      title: "Strategy",
      value: "Paper Trading",
      colour: "text-amber-300",
    },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.35em] text-cyan-300">
            AI COMMAND CENTER
          </p>
          <h2 className="mt-2 text-3xl font-black">
            CryptoNinja Intelligence
          </h2>
        </div>

        <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
          ● LIVE
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {widgets.map((widget) => (
          <div
            key={widget.title}
            className="rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <p className="text-sm text-slate-400">{widget.title}</p>

            <p className={`mt-3 text-2xl font-black ${widget.colour}`}>
              {widget.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
        <p className="text-sm font-bold text-cyan-300">
          AI Insight
        </p>

        <p className="mt-3 text-slate-300">
          Monitoring BTC, ETH and SOL. Paper trading remains enabled while
          risk controls are active. Waiting for the next qualifying signal.
        </p>
      </div>
    </section>
  );
}

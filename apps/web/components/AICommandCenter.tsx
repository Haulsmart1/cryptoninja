"use client";

export default function AICommandCenter({ online = false }: { online?: boolean }) {
  const widgets = [
    {
      title: "AI Status",
      value: "Not verified",
      colour: "text-slate-300",
    },
    {
      title: "Market",
      value: "Not assessed",
      colour: "text-cyan-300",
    },
    {
      title: "Risk",
      value: "Not assessed",
      colour: "text-slate-300",
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

        <div role="status" className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-bold text-cyan-300">
          {online ? "Engine connected" : "Engine unavailable"}
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
          Paper trading only. Engine connectivity does not verify AI analysis,
          risk assessment or automated trading activity. No live-money trading.
        </p>
      </div>
    </section>
  );
}

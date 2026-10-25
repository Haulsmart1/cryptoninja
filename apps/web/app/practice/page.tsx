'use client';

import { useState } from 'react';
import Link from 'next/link';
import { newPractice, openPractice, closePractice, quotePractice, practiceValue } from '@/lib/paper-practice';

const money = (pence: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);

export default function PracticePage() {
  const [state, setState] = useState(newPractice);
  const [amount, setAmount] = useState('10.00');
  const [message, setMessage] = useState('Ready: start with £10 of virtual cash.');
  const [error, setError] = useState('');
  const value = practiceValue(state);
  const unrealised = state.position ? value - state.position.costPence : 0;

  function buy(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError('Enter pounds with no more than two decimal places.');
      return;
    }
    try {
      const next = openPractice(state, Math.round(Number(amount) * 100));
      setState(next);
      setMessage('Practice position opened. No real order was placed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to open practice position.'); }
  }

  function close() {
    try {
      setState(closePractice(state));
      setError('');
      setMessage('Practice position closed. The result is included in your virtual cash.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to close practice position.'); }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 sm:px-8">
      <Link href="/" className="inline-block py-2 text-cyan-300 underline">CryptoNinja home</Link>
      <header className="space-y-3">
        <p className="font-bold uppercase tracking-widest text-amber-300">Practice only · No real money</p>
        <h1 className="text-3xl font-bold">Your £10 practice account</h1>
        <p className="text-slate-300">Try opening and closing a simulated BTC position. Prices below are fabricated scenarios, not live prices or predictions.</p>
      </header>
      <section className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-4">
        No deposit, exchange connection, wallet, login or live trading. This isolated guest simulator does not test the account login or trading backend. Refreshing or leaving this page clears the session. Fees, spread and slippage are not modelled; these results cannot establish real trading performance.
      </section>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[['Virtual cash', money(state.cashPence)], ['Practice position', money(value)], ['Realised profit / loss', money(state.realisedPence)]].map(([label, total]) => (
          <div key={label} className="glass rounded-xl p-4"><dt className="text-sm text-slate-300">{label}</dt><dd className="mt-2 text-2xl font-bold">{total}</dd></div>
        ))}
      </dl>
      <section className="glass space-y-4 rounded-xl p-5">
        <h2 className="text-xl font-semibold">1. Open a practice position</h2>
        <p>Simulated BTC price: <strong>{money(state.pricePence)}</strong></p>
        <form onSubmit={buy} className="space-y-3">
          <label className="block" htmlFor="practice-amount">Virtual amount in GBP</label>
          <input id="practice-amount" inputMode="decimal" value={amount} disabled={!!state.position} onChange={e => setAmount(e.target.value)} className="min-h-12 w-full rounded-lg border border-slate-500 bg-slate-950 p-3 disabled:opacity-50" />
          <button disabled={!!state.position || state.cashPence === 0} className="min-h-12 w-full rounded-lg bg-cyan-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-40">Open simulated position</button>
        </form>
      </section>
      <section className="glass space-y-4 rounded-xl p-5">
        <h2 className="text-xl font-semibold">2. Choose a fabricated market scenario</h2>
        <p>These buttons set the price relative to the opening scenario of £60,000, not the previous click.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[[5700000, 'Down 5%'], [6000000, 'Unchanged'], [6300000, 'Up 5%']].map(([price, label]) => (
            <button key={price} onClick={() => { setState(quotePractice(state, Number(price))); setMessage('Fabricated practice price changed.'); }} className="min-h-12 rounded-lg border border-slate-500 px-4 py-3">{label}</button>
          ))}
        </div>
        <p>Unrealised practice profit / loss: <strong>{money(unrealised)}</strong></p>
      </section>
      <section className="glass space-y-4 rounded-xl p-5">
        <h2 className="text-xl font-semibold">3. Close and check your result</h2>
        <button disabled={!state.position} onClick={close} className="min-h-12 w-full rounded-lg bg-cyan-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-40">Close simulated position</button>
        <p className="text-sm text-slate-300">Example: open £10 at £60,000, choose Up 5%, then close. Virtual cash should become £10.50. Down 5% instead should leave £9.50.</p>
      </section>
      <p role="status" aria-live="polite" className="rounded-lg border border-slate-600 p-4">{message}</p>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button onClick={() => { if (window.confirm('Discard this practice session and reset to £10 virtual cash?')) { setState(newPractice()); setAmount('10.00'); setError(''); setMessage('Reset to £10 of virtual cash.'); } }} className="min-h-12 rounded-lg border border-slate-500 px-4 py-3">Reset practice account</button>
    </main>
  );
}

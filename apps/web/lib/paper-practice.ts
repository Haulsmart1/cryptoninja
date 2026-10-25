// Offline practice only: no exchange, market feed, wallet or account access.
export type PracticeState = {
  cashPence: number;
  pricePence: number;
  position: { costPence: number; entryPricePence: number } | null;
  realisedPence: number;
};

export function newPractice(): PracticeState {
  return { cashPence: 1000, pricePence: 6000000, position: null, realisedPence: 0 };
}

function positivePence(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Enter a positive whole-penny amount.');
}

export function openPractice(state: PracticeState, spendPence: number): PracticeState {
  positivePence(spendPence);
  positivePence(state.pricePence);
  if (state.position) throw new Error('Close the current practice position first.');
  if (spendPence > state.cashPence) throw new Error('Not enough virtual cash.');
  return { ...state, cashPence: state.cashPence - spendPence,
    position: { costPence: spendPence, entryPricePence: state.pricePence } };
}

export function practiceValue(state: PracticeState): number {
  if (!state.position) return 0;
  return Math.round(state.position.costPence * state.pricePence / state.position.entryPricePence);
}

export function quotePractice(state: PracticeState, pricePence: number): PracticeState {
  positivePence(pricePence);
  // Bound fabricated quotes; this is not a real-time market-price endpoint.
  if (pricePence > 1000000000) throw new Error('Practice price is outside the simulation limit.');
  return { ...state, pricePence };
}

export function closePractice(state: PracticeState): PracticeState {
  if (!state.position) throw new Error('There is no practice position to close.');
  const proceeds = practiceValue(state);
  return { ...state, cashPence: state.cashPence + proceeds, position: null,
    realisedPence: state.realisedPence + proceeds - state.position.costPence };
}

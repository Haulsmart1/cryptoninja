import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newPractice, openPractice, closePractice, quotePractice, practiceValue } from './paper-practice.ts';

test('£10 virtual start, buy, unchanged quote and close preserve cash', () => {
  const start = newPractice();
  const open = openPractice(start, 1000);
  assert.equal(start.cashPence, 1000);
  assert.equal(open.cashPence, 0);
  assert.equal(practiceValue(open), 1000);
  assert.deepEqual(closePractice(open), start);
});
test('fabricated +5% quote realises 50p profit on £10', () => {
  const closed = closePractice(quotePractice(openPractice(newPractice(), 1000), 6300000));
  assert.equal(closed.cashPence, 1050);
  assert.equal(closed.realisedPence, 50);
  assert.equal(closed.position, null);
});
test('fabricated -5% quote realises 50p loss on £10', () => {
  const closed = closePractice(quotePractice(openPractice(newPractice(), 1000), 5700000));
  assert.equal(closed.cashPence, 950);
  assert.equal(closed.realisedPence, -50);
});
test('partial position keeps unspent virtual cash', () => {
  const open = openPractice(newPractice(), 400);
  assert.equal(open.cashPence, 600);
  assert.equal(closePractice(open).cashPence, 1000);
});
test('invalid amounts, overspending and double opening are rejected', () => {
  for (const amount of [0, -1, 1.5, NaN, Infinity, 1001]) {
    assert.throws(() => openPractice(newPractice(), amount));
  }
  assert.throws(() => openPractice(openPractice(newPractice(), 500), 500));
});
test('invalid fabricated quotes and double closing are rejected', () => {
  for (const price of [0, -1, NaN, Infinity, 1.5, 1000000001]) {
    assert.throws(() => quotePractice(newPractice(), price));
  }
  assert.throws(() => closePractice(newPractice()));
  const closed = closePractice(openPractice(newPractice(), 1000));
  assert.throws(() => closePractice(closed));
});
test('reset creates an independent fresh session', () => {
  const old = closePractice(quotePractice(openPractice(newPractice(), 1000), 5700000));
  assert.equal(old.cashPence, 950);
  assert.equal(newPractice().cashPence, 1000);
});

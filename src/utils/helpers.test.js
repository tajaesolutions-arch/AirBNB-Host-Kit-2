import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingNightsInMonth, bookingOverlapsMonth, bookingRevenueInMonth, fmtCurrency } from './helpers.js';

const booking = {
  checkin_date: '2026-04-28',
  checkout_date: '2026-05-03',
  nightly_rate: 10000,
  cleaning_fee: 5000,
  extra_fees: 0,
  discounts: 0,
};

test('booking overlap detection', () => {
  assert.equal(bookingOverlapsMonth(booking, '2026-05'), true);
  assert.equal(bookingOverlapsMonth(booking, '2026-03'), false);
});

test('booking nights in month uses overlap only', () => {
  assert.equal(bookingNightsInMonth(booking, '2026-04'), 3);
  assert.equal(bookingNightsInMonth(booking, '2026-05'), 2);
});

test('booking revenue is prorated by overlap nights', () => {
  assert.equal(bookingRevenueInMonth(booking, '2026-05'), 22000);
});

test('currency formatter remains stable', () => {
  assert.match(fmtCurrency(10000, 'JMD'), /\$/);
});

import { createGoldAggregator } from '../src/demo-battle/gold-agg.js';

// Kill-gold numbers spam into unreadable walls during big fights. The view
// aggregates kills per side over a short window into one "+N" number.
export default [
  {
    name: 'kills in one window flush as a single summed number',
    run(t) {
      const agg = createGoldAggregator(0.6);
      agg.add('enemy', 65, 10, 0);
      agg.add('enemy', 65, 11, 0.5);
      agg.add('enemy', 40, 9, -0.5);
      t.assert('nothing flushes before the window', agg.poll(0.5).length === 0, '');
      const out = agg.poll(0.2);
      t.assert('one flush per side', out.length === 1, JSON.stringify(out));
      t.assert('amounts sum', out[0].amount === 170, JSON.stringify(out));
      t.assert('position tracks the latest kill', out[0].x === 9, JSON.stringify(out));
      t.assert('flush drains the bucket', agg.poll(0.7).length === 0, '');
    },
  },
  {
    name: 'each side flushes its own number',
    run(t) {
      const agg = createGoldAggregator(0.6);
      agg.add('enemy', 65, 10, 0);
      agg.add('player', 15, -10, 0);
      const out = agg.poll(0.7);
      t.assert('two numbers', out.length === 2, JSON.stringify(out));
      const total = out.reduce((s, f) => s + f.amount, 0);
      t.assert('no gold lost', total === 80, JSON.stringify(out));
    },
  },
];

// Kill-gold aggregation: mass kills in one window flush as a single "+N"
// number per side instead of a wall of overlapping labels.
// Contract: createGoldAggregator(windowS) -> { add(side, amount, x, z), poll(dt) }
// poll(dt) returns [{ side, amount, x, z }] flushes (position = latest kill).
export function createGoldAggregator(windowS = 0.6) {
  const buckets = new Map();
  let t = 0;
  return {
    add(side, amount, x, z) {
      const b = buckets.get(side) || { amount: 0, x: 0, z: 0 };
      b.amount += amount;
      b.x = x;
      b.z = z;
      buckets.set(side, b);
    },
    poll(dt) {
      t += dt;
      if (t < windowS) return [];
      t = 0;
      if (buckets.size === 0) return [];
      const out = [...buckets].map(([side, b]) => ({ side, ...b }));
      buckets.clear();
      return out;
    },
    clear() {
      buckets.clear();
      t = 0;
    },
  };
}

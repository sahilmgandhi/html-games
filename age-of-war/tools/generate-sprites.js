const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 96;
const OUT_DIR = path.join(__dirname, '..', 'sprites');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TYPES = ['melee','ranged','fast','siege','armored','elite','hero'];
const age0 = require('./sprites/age_0');
const age1 = require('./sprites/age_1');
const age2 = require('./sprites/age_2');
const age3 = require('./sprites/age_3');
const age4 = require('./sprites/age_4');
const ALL = [...age0, ...age1, ...age2, ...age3, ...age4];

let idx = 0;
for (let age = 0; age < 5; age++) {
  for (let t = 0; t < TYPES.length; t++) {
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    ALL[idx](ctx);
    idx++;
    const buf = canvas.toBuffer('image/png');
    const fname = `${TYPES[t]}_${age}.png`;
    fs.writeFileSync(path.join(OUT_DIR, fname), buf);
    console.log(`  ${fname} (${buf.length} bytes)`);
  }
}
console.log(`\nGenerated ${idx} sprites.`);

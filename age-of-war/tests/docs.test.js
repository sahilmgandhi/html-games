const fs = require('fs');
const { renderBalanceDoc, DOC_PATH } = require('../tools/gen-docs');

module.exports = [
  {
    name: 'Generated Balance Doc',
    run(t) {
      const expected = renderBalanceDoc(CONFIG);
      const actual = fs.existsSync(DOC_PATH) ? fs.readFileSync(DOC_PATH, 'utf8') : null;
      t.assert('docs/balance.md matches js/config.js', actual === expected,
        actual === null ? 'file is missing' : 'stale — run `npm run docs`');
    },
  },
];

import { galleryRoster } from '../src/gallery/roster.js';

export default [
  {
    name: 'every age lists its units plus the hero',
    run(t) {
      t.assert('stone has 3 units + hero', galleryRoster(0).length === 4);
      t.assert('future has 4 units + hero', galleryRoster(4).length === 5);
      for (let a = 1; a <= 3; a++) {
        t.assert(`age ${a} has 3 units + hero`, galleryRoster(a).length === 4);
      }
    },
  },
  {
    name: 'labels match config names, hero flagged',
    run(t) {
      const r0 = galleryRoster(0);
      t.assert('first stone label is Clubman', r0[0].label === 'Clubman');
      t.assert('clubman is not hero', r0[0].isHero === false);
      const hero = r0[r0.length - 1];
      t.assert('last stone entry is hero Shaman', hero.isHero === true && hero.label === 'Shaman');
      const rf = galleryRoster(4);
      t.assert('future hero is Titan', rf[rf.length - 1].label === 'Titan');
    },
  },
  {
    name: 'out-of-range age returns empty',
    run(t) {
      t.assert('age 5 empty', galleryRoster(5).length === 0);
      t.assert('age -1 empty', galleryRoster(-1).length === 0);
    },
  },
];

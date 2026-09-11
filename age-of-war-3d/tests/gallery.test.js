import { galleryRoster, lineupX, GALLERY_CATEGORIES, galleryTurrets } from '../src/gallery/roster.js';
import { CONFIG } from '../src/simulation/config.js';
import { createPhasePlayer } from '../src/gallery/player.js';
import { toGallery, toBattle } from '../src/gallery/nav.js';

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
  {
    name: 'phase player auto-cycles walk/attack/idle',
    run(t) {
      const p = createPhasePlayer();
      t.assert('starts on walk', p.phase === 0 && p.label === 'Walk');
      p.update(3.1);
      t.assert('advances to attack', p.phase === 1 && p.label === 'Attack');
      p.update(2.1);
      t.assert('advances to idle', p.phase === 2 && p.label === 'Idle');
      p.update(2.1);
      t.assert('loops back to walk', p.phase === 0);
    },
  },
  {
    name: 'phase player manual select pauses auto',
    run(t) {
      const p = createPhasePlayer();
      p.setPhase(2);
      t.assert('jumps to idle', p.phase === 2);
      t.assert('auto off after manual', p.auto === false);
      p.update(99);
      t.assert('frozen while manual', p.phase === 2);
      p.setAuto(true);
      t.assert('auto resumes', p.auto === true);
      p.update(3.1);
      t.assert('cycling again', p.phase === 0);
    },
  },
  {
    name: 'gallery/battle nav helpers keep the page, swap the param',
    run(t) {
      const g = toGallery('http://x/game/');
      t.assert('adds showcase=gallery', g.includes('showcase=gallery'));
      const b = toBattle('http://x/game/?showcase=gallery');
      t.assert('drops showcase param', !b.includes('showcase'));
      const b2 = toBattle('http://x/game/?showcase=gallery&foo=1');
      t.assert('keeps other params', b2.includes('foo=1') && !b2.includes('showcase'));
    },
  },
  {
    name: 'four categories; every age lists its turrets',
    run(t) {
      t.assert('units/turrets/bases/world', GALLERY_CATEGORIES.join(',') === 'units,turrets,bases,world');
      for (let a = 0; a < 5; a++) {
        const tur = galleryTurrets(a);
        t.assert(`age ${a} turret count matches config`, tur.length === CONFIG.AGES[a].turrets.length,
          `got=${tur.length}`);
        t.assert(`age ${a} labels match config`, tur.every((x, i) => x.label === CONFIG.AGES[a].turrets[i].name), '');
      }
      t.assert('out-of-range turrets empty', galleryTurrets(5).length === 0);
    },
  },
];

import { CONFIG } from '../simulation/config.js';

// Pure roster for the gallery showcase (?showcase=gallery): one entry per
// unit plus the hero. Kept DOM/three-free so node tests can cover it.
export function galleryRoster(ageIndex) {
  const age = CONFIG.AGES[ageIndex];
  if (!age) return [];
  const out = age.units.map((u, unitIndex) => ({ unitIndex, isHero: false, label: u.name }));
  out.push({ unitIndex: -1, isHero: true, label: age.hero.name });
  return out;
}

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

// Gallery categories: units march the lineup; turrets seat on the shared
// side towers; bases stand off player vs enemy; world clears the stage and
// shows the age's terrain + environment + lighting.
export const GALLERY_CATEGORIES = ['units', 'turrets', 'bases', 'world'];

export function galleryTurrets(ageIndex) {
  const age = CONFIG.AGES[ageIndex];
  if (!age) return [];
  return age.turrets.map((t, turretIndex) => ({ turretIndex, label: t.name }));
}

// Lane x (px) of the i-th gallery slot. Wide enough for titan-scale units.
export function lineupX(i) {
  return 600 + i * 300;
}

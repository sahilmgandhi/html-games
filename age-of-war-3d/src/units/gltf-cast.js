// Quaternius CC0 stone + castle + renaissance + modern casts. Parses the vendored assets/quat files
// once, then spawns per-instance SkeletonUtils clones with an
// AnimationMixer each, mirroring the UnitMesh {mesh, update, dispose}
// contract (HP bar, team rings, hero scale, hit-flash, death fade) so
// battle-view needs no special-casing beyond preloading templates.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { toMeters } from '../simulation/config.js';
import {
  solidify, cloneMats, makeHpBar, teamRing, disposeDeep, SIDE_ACCENT,
  pbr, basic, glowMat, glowSprite, FLASH_HEX, FLASH_PEAK, mergeStatic,
} from '../core/pbr.js';

// entity.type (or hero) -> template role, per age.
export const QUAT_ROLES = { melee: 'clubman', ranged: 'slinger', fast: 'dino', hero: 'hero' };
export const CASTLE_ROLES = { melee: 'swordsman', ranged: 'archer', fast: 'knight', hero: 'paladin' };
export const RENAISSANCE_ROLES = { melee: 'dueler', ranged: 'musketeer', siege: 'cannoneer', hero: 'engineer' };
export const MODERN_ROLES = { melee: 'meleeinf', ranged: 'infantry', armored: 'tank', hero: 'commander' };
export const FUTURE_ROLES = { melee: 'godsblade', ranged: 'blaster', armored: 'warmachine', elite: 'supersoldier', hero: 'titan' };

// Procedural rig heights the cast must match (units.js builders).
// heroModel: template is already modeled at hero height, skip the 1.18x.
// lift: color multiplier for authored near-black browns (raptor, horse).
// glTF knights need none: their runtime colors already clear the bar.
// bow: earns a procedural longbow + quiver (archer has no bow prop).
// hide: authored weapon meshes to switch off per role (musketeer drops the
// cutlass for a rifle, the cannoneer crew drops the lute for a cannon).
const ROLE_SPEC = {
  clubman: { file: 'Viking_Male', kind: 'gltf', targetH: 2.1, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle', handProp: 'club', propTiltX: Math.PI / 2 },
  slinger: { file: 'Goblin_Male', kind: 'gltf', targetH: 1.95, walk: 'Walk', attack: 'Shoot_OneHanded', death: 'Death', idle: 'Idle', handProp: 'sling' },
  hero: { file: 'Wizard', kind: 'gltf', targetH: 2.4 * 1.18, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle', heroModel: true, handProp: 'staff', propTiltX: Math.PI / 2 },
  dino: { file: 'Velociraptor', kind: 'fbx', targetH: 3.1, walk: 'Velociraptor_Walk', attack: 'Velociraptor_Attack', death: 'Velociraptor_Death', idle: 'Velociraptor_Idle', lift: 5.0 },
  swordsman: { file: 'Knight_Male', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle', handProp: 'sword', propTiltX: Math.PI / 2 },
  archer: { file: 'Elf', kind: 'gltf', targetH: 2.0, walk: 'Walk', attack: 'Shoot_OneHanded', death: 'Death', idle: 'Idle', bow: true },
  paladin: { file: 'Knight_Golden_Male', kind: 'gltf', targetH: 2.5 * 1.18, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle', heroModel: true, handProp: 'sword', armProp: 'shield', propTiltX: Math.PI / 2 },
  knight: { file: 'Horse', kind: 'fbx', targetH: 2.9, walk: 'Walk', attack: 'Run', death: 'Death', idle: 'Idle', lift: 5.0 },
  knightRider: { file: 'Knight_Male', kind: 'gltf', targetH: 1.5, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle', handProp: 'sword' },
  dueler: { file: 'Pirate_Barbarossa', kind: 'gltf', targetH: 2.1, walk: 'Walk', attack: 'Sword', death: 'Death', idle: 'Idle' },
  musketeer: { file: 'Pirate_Mako', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', rifle: 'rifleProp', hide: ['Weapon_Sword'] },
  cannoneer: { file: 'Pirate_Henry', kind: 'gltf', targetH: 2.2, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', hide: ['Weapon_Lute'] },
  engineer: { file: 'Pirate_Anne', kind: 'gltf', targetH: 2.6 * 1.18, walk: 'Walk', attack: 'Sword', death: 'Death', idle: 'Idle', heroModel: true },
  cannon: { file: 'Pirate_Cannon', kind: 'gltf', targetH: 1.13, walk: 'Idle', attack: 'Idle', death: 'Death', idle: 'Idle' },
  rifle: { file: 'Pirate_Rifle', kind: 'gltf', targetH: 0.69, walk: 'Idle', attack: 'Idle', death: 'Death', idle: 'Idle' },
  meleeinf: { file: 'Shooter_Soldier', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', handProp: 'sword', handBone: 'Middle1R' },
  infantry: { file: 'Shooter_Enemy', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'Idle_Shoot', death: 'Death', idle: 'Idle', rifle: 'akProp', gunName: 'ak' },
  commander: { file: 'Shooter_Hazmat', kind: 'gltf', targetH: 2.3 * 1.18, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', heroModel: true, headProp: 'cap', handProp: 'baton', handBone: 'Middle1R', trimProp: 'collartrim' },
  tank: { file: 'Quat_Tank', kind: 'fbx', targetH: 2.4, walk: 'Tank_Forward', attack: 'Tank_Forward', death: null, idle: 'Tank_Forward', turn: Math.PI },
  ak: { file: 'Shooter_AK', kind: 'gltf', targetH: 1.42, walk: 'Idle', attack: 'Idle', death: 'Death', idle: 'Idle' },
  godsblade: { file: 'Future_Robot', kind: 'fbx', targetH: 2.3, walk: 'Robot_Walking', attack: 'Robot_Punch', death: 'Robot_Death', idle: 'Robot_Idle', handProp: 'blade' },
  blaster: { file: 'Future_Alien', kind: 'fbx', targetH: 2.15, walk: 'Alien_Walk', attack: 'Alien_Punch', death: 'Alien_Death', idle: 'Alien_Idle', handProp: 'blaster' },
  warmachine: { file: 'Future_Stan', kind: 'gltf', targetH: 2.6, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle' },
  supersoldier: { file: 'Future_Mike', kind: 'gltf', targetH: 2.8, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle' },
  titan: { file: 'Future_George', kind: 'gltf', targetH: 3.0 * 1.18, walk: 'Walk', attack: 'Shoot', death: 'Death', idle: 'Idle', heroModel: true },
};

// Mounted roles: rider template, rider attack clip, rider feet height
// relative to the mount's hips (straddle above, dangle below).
const COMPOSITES = {
  dino: { rider: 'rider', attack: 'Punch', rideH: 0.05 },
  knight: { rider: 'knightRider', attack: 'SwordSlash', rideH: -0.15 },
};

// Foot roles with a static mount beside them: template name, scale factor
// (cannon stays authored size), and the sideways lane offset of the mount.
const MOUNTS = {
  cannoneer: { tpl: 'cannon', scale: 1.0, side: 1.1 },
};

function measureHeight(object) {
  const box = new THREE.Box3().setFromObject(object);
  return Math.max(0.001, box.max.y - box.min.y);
}

// Fetch + parse the vendored cast. fetchFn defaults to the browser fetch;
// base is the directory holding the quat files (trailing slash). Tests pass
// a shim reading the same files from disk, so one path serves both.
export async function fetchQuatCast(fetchFn = fetch, base = 'assets/quat/') {
  const gltfLoader = new GLTFLoader();
  const fbxLoader = new FBXLoader();
  async function loadGltf(name) {
    const res = await fetchFn(`${base}${name}.gltf`);
    const text = await res.text();
    return new Promise((resolve, reject) => gltfLoader.parse(text, '', resolve, reject));
  }
  async function loadFbx(name) {
    const res = await fetchFn(`${base}${name}.fbx`);
    return fbxLoader.parse(await res.arrayBuffer(), '');
  }
  const [viking, goblin, wizard, raptor, knight, golden, elf, horse,
    barbarossa, mako, henry, anne, cannon, rifle,
    soldier, enemy, hazmat, ak, tank,
    george, mike, stan, robot, alien] = await Promise.all([
    loadGltf('Viking_Male'), loadGltf('Goblin_Male'), loadGltf('Wizard'), loadFbx('Velociraptor'),
    loadGltf('Knight_Male'), loadGltf('Knight_Golden_Male'), loadGltf('Elf'), loadFbx('Horse'),
    loadGltf('Pirate_Barbarossa'), loadGltf('Pirate_Mako'), loadGltf('Pirate_Henry'),
    loadGltf('Pirate_Anne'), loadGltf('Pirate_Cannon'), loadGltf('Pirate_Rifle'),
    loadGltf('Shooter_Soldier'), loadGltf('Shooter_Enemy'), loadGltf('Shooter_Hazmat'),
    loadGltf('Shooter_AK'), loadFbx('Quat_Tank'),
    loadGltf('Future_George'), loadGltf('Future_Mike'), loadGltf('Future_Stan'),
    loadFbx('Future_Robot'), loadFbx('Future_Alien'),
  ]);
  // FBX clips arrive prefixed (Armature|Walk); strip to the bare name.
  const clipMap = (animations) => new Map(animations.map((c) => [c.name.split('|').pop(), c]));
  const pack = (role, gltf) => {
    const spec = ROLE_SPEC[role];
    const clips = clipMap(gltf.animations);
    return { object: gltf.scene, clips, scale: spec.targetH / measureHeight(gltf.scene), height: spec.targetH, spec };
  };
  // FBX phong materials ship a white specular that washes the diffuse
  // under the key light; tie it to the diffuse so facets keep shape.
  // lift is per-role: raptor and horse browns are authored near-black
  // and read as silhouette without it.
  const tameFbx = (object, lift) => {
    object.traverse((o) => {
      if (o.isMesh) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          if (m.color && lift !== 1) m.color.multiplyScalar(lift);
          if (m.specular && m.color) m.specular.copy(m.color).multiplyScalar(0.5);
        }
      }
    });
  };
  tameFbx(raptor, ROLE_SPEC.dino.lift);
  tameFbx(horse, ROLE_SPEC.knight.lift);
  tameFbx(tank, 1);
  tameFbx(robot, 1);
  tameFbx(alien, 4);
  // the super soldier is a golden mech variant: pull Mike's paint to gold.
  tintGold(mike.scene);
  // the future fights at night: lift dark panels out of silhouette and give
  // eye dots an emissive glow so fighters read in the dark.
  nightPrep(george.scene, 2, 0xffffff);
  nightPrep(mike.scene, 2, 0xffffff);
  nightPrep(stan.scene, 2, 0xffffff);
  nightPrep(alien, 1, 0x35f0e0);
  nightPrep(robot, 1, 0x35f0e0);
  // the castle fights at night too: its dark bronze + tribal paints need
  // a stronger lift than the future panels (Main stays out of the set so
  // the light grey does not blow out).
  nightPrep(knight.scene, 4, 0xffffff, CASTLE_PANELS);
  nightPrep(golden.scene, 4, 0xffffff, CASTLE_PANELS);
  nightPrep(elf.scene, 4, 0xffffff, CASTLE_PANELS);
  nightPrep(horse, 4, 0xffffff, CASTLE_PANELS);
  const goblinH = measureHeight(goblin.scene);
  const knightH = measureHeight(knight.scene);
  return {
    clubman: pack('clubman', viking),
    slinger: pack('slinger', goblin),
    hero: pack('hero', wizard),
    dino: { object: raptor, clips: clipMap(raptor.animations), scale: ROLE_SPEC.dino.targetH / measureHeight(raptor), height: ROLE_SPEC.dino.targetH, spec: ROLE_SPEC.dino },
    // the dino rider is a small goblin seated on the raptor's back.
    rider: { object: goblin.scene, clips: clipMap(goblin.animations), scale: 1.2 / goblinH, height: 1.2, spec: ROLE_SPEC.slinger },
    swordsman: pack('swordsman', knight),
    archer: pack('archer', elf),
    paladin: pack('paladin', golden),
    knight: { object: horse, clips: clipMap(horse.animations), scale: ROLE_SPEC.knight.targetH / measureHeight(horse), height: ROLE_SPEC.knight.targetH, spec: ROLE_SPEC.knight },
    // the knight's rider is a knight fighting on horseback, feet dangling.
    knightRider: { object: knight.scene, clips: clipMap(knight.animations), scale: 1.5 / knightH, height: 1.5, spec: ROLE_SPEC.knightRider },
    dueler: pack('dueler', barbarossa),
    musketeer: pack('musketeer', mako),
    cannoneer: pack('cannoneer', henry),
    engineer: pack('engineer', anne),
    // the cannon is a static mount, not a fighter: authored size, no clips.
    cannon: { object: cannon.scene, clips: clipMap(cannon.animations || []), scale: ROLE_SPEC.cannon.targetH / measureHeight(cannon.scene), height: ROLE_SPEC.cannon.targetH, spec: ROLE_SPEC.cannon },
    // the rifle is a hand prop cloned onto the musketeer's firing hand.
    rifleProp: { object: rifle.scene, clips: clipMap(rifle.animations || []), scale: 1, height: ROLE_SPEC.rifle.targetH, spec: ROLE_SPEC.rifle },
    meleeinf: pack('meleeinf', soldier),
    infantry: pack('infantry', enemy),
    commander: pack('commander', hazmat),
    // the tank is a vehicle, not a fighter: scaled body, drive clips only.
    tank: { object: tank, clips: clipMap(tank.animations), scale: ROLE_SPEC.tank.targetH / measureHeight(tank), height: ROLE_SPEC.tank.targetH, spec: ROLE_SPEC.tank },
    // the AK is a hand prop cloned onto modern firing hands.
    akProp: { object: ak.scene, clips: clipMap(ak.animations || []), scale: 1, height: ROLE_SPEC.ak.targetH, spec: ROLE_SPEC.ak },
    warmachine: pack('warmachine', stan),
    supersoldier: pack('supersoldier', mike),
    titan: pack('titan', george),
    godsblade: { object: robot, clips: clipMap(robot.animations), scale: ROLE_SPEC.godsblade.targetH / measureHeight(robot), height: ROLE_SPEC.godsblade.targetH, spec: ROLE_SPEC.godsblade },
    blaster: { object: alien, clips: clipMap(alien.animations), scale: ROLE_SPEC.blaster.targetH / measureHeight(alien), height: ROLE_SPEC.blaster.targetH, spec: ROLE_SPEC.blaster },
  };
}

// Night-fighting cast: lift named panel paints out of silhouette and give
// eye dots an emissive glow. lift 1 leaves paint alone (eyes only).
// The castle set is separate: its light-grey Main must not lift.
const PANELS = new Set(['Main', 'Accent', 'Grey', 'LightGrey']);
const CASTLE_PANELS = new Set(['Skin', 'Brown', 'Armor_Dark', 'Detail', 'Red', 'Material.006']);
export function nightPrep(object, lift, eyeHex, panels = PANELS) {
  object.traverse((o) => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) {
      if (!m.color) continue;
      if (lift !== 1 && panels.has(m.name)) m.color.multiplyScalar(lift);
      if (/^eyes?$/i.test(m.name) && m.emissive) {
        m.emissive.setHex(eyeHex);
        m.emissiveIntensity = 1;
      }
    }
  });
}

// Golden mech variant: pull every paint color partway to gold.
const GOLD = new THREE.Color(0xc9a227);
export function tintGold(object) {
  object.traverse((o) => {
    if (o.isMesh) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) if (m.color) m.color.lerp(GOLD, 0.55);
    }
  });
}

let activeTemplates = null;
export function setQuatTemplates(tpl) { activeTemplates = tpl; }
export function getQuatTemplates() { return activeTemplates; }

// Single-flight background load shared by battles and showcases: first
// caller starts the fetch, everyone else rides along. Failure keeps the
// procedural rigs and records the flag for verification screenshots.
let quatPromise = null;
export function loadQuatCastOnce(fetchFn = fetch, base = 'assets/quat/') {
  if (!quatPromise) {
    quatPromise = fetchQuatCast(fetchFn, base).then(
      (tpl) => {
        setQuatTemplates(tpl);
        if (typeof window !== 'undefined') window.__quatLoaded = true;
        return tpl;
      },
      () => {
        if (typeof window !== 'undefined') window.__quatLoaded = false;
        return null;
      },
    );
  }
  return quatPromise;
}

// UnitMesh calls this: any cast-covered render path (battle, showcase)
// triggers the cast load without caring who got there first.
export function ensureQuatLoaded() {
  if (activeTemplates || typeof fetch === 'undefined') return;
  loadQuatCastOnce();
}
// Stone age 0 uses QUAT_ROLES, castle age 1 CASTLE_ROLES, renaissance
// age 2 RENAISSANCE_ROLES, modern age 3 MODERN_ROLES.
export function quatRoleFor(entity, ageIndex = 0) {
const AGE_ROLES = { 1: CASTLE_ROLES, 2: RENAISSANCE_ROLES, 3: MODERN_ROLES, 4: FUTURE_ROLES };
  const roles = AGE_ROLES[ageIndex] || QUAT_ROLES;
  if (entity.isHero) return roles.hero;
  return roles[entity.type] || roles.melee;
}

// Procedural longbow + quiver for the archer (same design as the
// procedural buildArcher). k counter-scales the dims so the prop lands
// at procedural size inside the scaled body group.
function buildLongbow(k) {
  const bow = new THREE.Group();
  bow.name = 'longbow';
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.42 * k, 0.055 * k, 7, 18, Math.PI), pbr('#7a5230', 0.85));
  arc.rotation.z = -Math.PI / 2;
  bow.add(arc);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * k, 0.05 * k, 0.22 * k, 7), pbr('#4e3822', 0.9));
  bow.add(grip);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * k, 0.008 * k, 0.84 * k, 4), basic('#d8cfb8'));
  bow.add(string);
  return bow;
}
function buildQuiver(k) {
  const quiver = new THREE.Group();
  quiver.name = 'quiver';
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * k, 0.07 * k, 0.55 * k, 8), pbr('#5a3d26', 0.9));
  quiver.add(tube);
  for (let i = 0; i < 3; i++) {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03 * k, 0.1 * k, 5), pbr('#9aa0a8', 0.4, 0.8));
    tip.position.set((-0.08 + i * 0.05) * k, 0.31 * k, 0);
    quiver.add(tip);
  }
  return quiver;
}

// Procedural energy blade for the god's blade (robot file has no weapon)
// and blaster gun for the alien. k counter-scales like the longbow.
function buildEnergyBlade(k) {
  const blade = new THREE.Group();
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * k, 0.045 * k, 0.22 * k, 8), pbr('#2b2f36', 0.4, 0.8));
  hilt.position.y = 0.11 * k;
  blade.add(hilt);
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.05 * k, 0.85 * k, 0.02 * k), basic('#bffbff'));
  core.position.y = 0.64 * k;
  blade.add(core);
  const halo = new THREE.Mesh(new THREE.BoxGeometry(0.11 * k, 0.9 * k, 0.06 * k), glowMat('#35e0ff', 0.45));
  halo.position.y = 0.64 * k;
  blade.add(halo);
  return blade;
}
function buildBlaster(k) {
  const gun = new THREE.Group();
  const bodyM = new THREE.Mesh(new THREE.BoxGeometry(0.09 * k, 0.14 * k, 0.34 * k), pbr('#3a4048', 0.45, 0.7));
  gun.add(bodyM);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * k, 0.035 * k, 0.3 * k, 8), pbr('#23272e', 0.4, 0.8));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.03 * k, 0.3 * k);
  gun.add(barrel);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.03 * k, 0.03 * k, 0.03 * k), glowMat('#ff5a3c', 0.8));
  sight.position.set(0, 0.1 * k, -0.05 * k);
  gun.add(sight);
  return gun;
}
// Procedural stone-age hand props (the UAC files ship bare-handed).
// k counter-scales like the longbow; all hang off the right fist.
function buildClub(k) {
  const club = new THREE.Group();
  club.name = 'club';
  const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * k, 0.045 * k, 0.7 * k, 7), pbr('#6b4a2c', 0.9));
  haft.position.y = 0.35 * k;
  club.add(haft);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11 * k, 8, 6), pbr('#8d8d94', 0.7));
  head.position.y = 0.72 * k;
  head.scale.y = 1.25;
  club.add(head);
  return club;
}
function buildSlingshot(k) {
  const sling = new THREE.Group();
  sling.name = 'slingshot';
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * k, 0.035 * k, 0.3 * k, 6), pbr('#6b4a2c', 0.9));
  grip.position.y = 0.15 * k;
  sling.add(grip);
  for (const sx of [-1, 1]) {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * k, 0.025 * k, 0.28 * k, 6), pbr('#6b4a2c', 0.9));
    fork.position.set(sx * 0.07 * k, 0.4 * k, 0);
    fork.rotation.z = -sx * 0.35;
    sling.add(fork);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * k, 0.008 * k, 0.16 * k, 4), basic('#3a2c1c'));
    band.position.set(sx * 0.035 * k, 0.5 * k, 0);
    band.rotation.z = Math.PI / 2 - sx * 0.2;
    sling.add(band);
  }
  return sling;
}
function buildStaff(k) {
  const staff = new THREE.Group();
  staff.name = 'staff';
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * k, 0.035 * k, 1.5 * k, 7), pbr('#4e3822', 0.85));
  shaft.position.y = 0.75 * k;
  staff.add(shaft);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.09 * k, 8, 6), pbr('#ded8c8', 0.6));
  skull.position.y = 1.56 * k;
  staff.add(skull);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.05 * k, 8, 6), glowMat('#7fe0ff', 0.9));
  glow.position.y = 1.56 * k;
  staff.add(glow);
  return staff;
}
// Procedural arming sword + heater shield for the castle age (the knight
// files ship bare-handed). k counter-scales like the longbow.
function buildSword(k) {
  const sword = new THREE.Group();
  sword.name = 'sword';
  const gripM = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * k, 0.035 * k, 0.16 * k, 7), pbr('#4e3822', 0.9));
  gripM.position.y = 0.08 * k;
  sword.add(gripM);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22 * k, 0.04 * k, 0.06 * k), pbr('#8d8d94', 0.4, 0.8));
  guard.position.y = 0.18 * k;
  sword.add(guard);
  const bladeM = new THREE.Mesh(new THREE.BoxGeometry(0.09 * k, 0.85 * k, 0.02 * k), pbr('#c7ccd4', 0.3, 0.9));
  bladeM.position.y = 0.62 * k;
  sword.add(bladeM);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045 * k, 0.12 * k, 4), pbr('#c7ccd4', 0.3, 0.9));
  tip.position.y = 1.1 * k;
  sword.add(tip);
  return sword;
}
function buildShield(k) {
  const shield = new THREE.Group();
  shield.name = 'shield';
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * k, 0.3 * k, 0.05 * k, 12), pbr('#7a1f1f', 0.7));
  plate.rotation.x = Math.PI / 2;
  shield.add(plate);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.09 * k, 8, 6), pbr('#8d8d94', 0.4, 0.8));
  boss.position.z = 0.05 * k;
  shield.add(boss);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.3 * k, 0.03 * k, 6, 16), pbr('#c9a227', 0.5, 0.7));
  shield.add(trim);
  return shield;
}
// commander's peaked cap: dome + gold band + forward brim.
function buildCap(k) {
  const cap = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17 * k, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), pbr('#2e3b2f', 0.8, 0.1));
  dome.position.y = 0.1 * k;
  cap.add(dome);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175 * k, 0.175 * k, 0.06 * k, 12), pbr('#c9a227', 0.5, 0.7));
  band.position.y = 0.1 * k;
  cap.add(band);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * k, 0.2 * k, 0.02 * k, 12), pbr('#232b23', 0.8, 0.1));
  brim.position.set(0, 0.08 * k, 0.12 * k);
  cap.add(brim);
  return cap;
}
// commander's baton: dark shaft + gold pommel, gripped in the fist.
function buildBaton(k) {
  const baton = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * k, 0.035 * k, 0.5 * k, 8), pbr('#3a2c1c', 0.7, 0.2));
  baton.add(shaft);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.05 * k, 8, 6), pbr('#c9a227', 0.4, 0.8));
  pommel.position.y = 0.28 * k;
  baton.add(pommel);
  return baton;
}
// commander's gold collar trim: bright bars at the neck base.
function buildCollarTrim(k) {
  const trim = new THREE.Group();
  for (const sx of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12 * k, 0.04 * k, 0.06 * k), pbr('#c9a227', 0.4, 0.8));
    bar.position.set(sx * 0.14 * k, -0.02 * k, 0.05 * k);
    trim.add(bar);
  }
  return trim;
}
const HAND_PROPS = {
  club: { bone: 'FistR', name: 'club', make: buildClub },
  sling: { bone: 'FistR', name: 'slingshot', make: buildSlingshot },
  staff: { bone: 'FistR', name: 'staff', make: buildStaff },
  sword: { bone: 'FistR', name: 'sword', make: buildSword },
  shield: { bone: 'LowerArmL', name: 'shield', make: buildShield },
  blade: { bone: 'HandR', name: 'energyblade', make: buildEnergyBlade },
  blaster: { bone: 'PalmR', name: 'blastergun', make: buildBlaster, rotX: -Math.PI / 2 },
  cap: { bone: 'Head_M', name: 'cap', make: buildCap },
  baton: { bone: 'FistR', name: 'baton', make: buildBaton },
  collartrim: { bone: 'Head_M', name: 'collartrim', make: buildCollarTrim },
};

function playAction(holder, name) {
  const { mixer, actions } = holder;
  let action = actions.get(name);
  if (!action) {
    const clip = holder.clips.get(name);
    if (!clip) return null;
    action = mixer.clipAction(clip);
    actions.set(name, action);
  }
  if (holder.current !== action) {
    if (holder.current) holder.current.fadeOut(0.12);
    action.reset().fadeIn(0.12).play();
    holder.current = action;
    holder.currentName = name;
  }
  return action;
}

// Same externals as UnitMesh: HP bar, team rings, hero scale, hit-flash
// squash, death fade; walk/attack/death are skeletal clips instead.
export function QuatUnitMesh(entity, role, templates) {
  const tpl = templates[role] || templates.clubman;
  const accent = SIDE_ACCENT[entity.side] || SIDE_ACCENT.player;
  const heroS = entity.isHero ? 1.18 : 1;
  // heroModel templates are already modeled at hero height; others scale.
  const s = tpl.spec.heroModel ? 1 : heroS;
  const height = tpl.height * s;

  const mesh = new THREE.Group();
  const body = SkeletonUtils.clone(tpl.object);
  // Quaternius models face +Z; procedural rigs face +X at rotation 0.
  // The tank's gun runs along prop-local -X, so it turns PI to face +X
  // like every other unit instead of sideways.
  body.rotation.y = tpl.spec.turn ?? Math.PI / 2;
  body.scale.setScalar(tpl.scale * s);
  mesh.add(body);
  // FBX files can hide unit-conversion nodes below the root (the alien's
  // AlienArmature is x100): they survive cloning, so size procedural
  // props from the grip's true world scale, not tpl.scale.
  body.updateMatrixWorld(true);
  const gripK = (bone) => {
    const b = body.getObjectByName(bone);
    if (!b) return 1 / (tpl.scale * s);
    const v = new THREE.Vector3();
    b.getWorldScale(v);
    return v.x > 0 ? 1 / v.x : 1 / (tpl.scale * s);
  };
  // the archer's file has no bow: hang a procedural longbow off the left
  // fist and a quiver off the torso.
  if (tpl.spec.bow) {
    const k = gripK('FistL');
    const fist = body.getObjectByName('FistL');
    (fist || body).add(buildLongbow(k));
    const torso = body.getObjectByName('Torso');
    const quiver = buildQuiver(k);
    quiver.position.set(-0.2 * k, 1.35 * k, 0.12 * k);
    quiver.rotation.z = 0.35;
    (torso || body).add(quiver);
  }
  // roles that drop their authored weapon for a different job (musketeer
  // trades cutlass for rifle, cannoneer crew trades lute for cannon duty).
  if (tpl.spec.hide) {
    for (const name of tpl.spec.hide) {
      const dropped = body.getObjectByName(name);
      if (dropped) dropped.visible = false;
    }
  }
  // roles with a gun file hang the prop off the firing hand (a finger
  // joint the clip articulates). It inherits body scale.
  let gunProp = null;
  if (tpl.spec.rifle && templates[tpl.spec.rifle]) {
    const hand = body.getObjectByName('Middle1R');
    const gun = templates[tpl.spec.rifle].object.clone();
    gun.name = tpl.spec.gunName || 'rifle';
    gun.rotation.z = Math.PI / 2;
    (hand || body).add(gun);
    gunProp = gun;
  }
  // fighters with procedural hand props (stone clubs, castle swords,
  // paladin shield off the left arm, future energy blade, blaster gun).
  // handBone overrides the entry bone for rigs without fists (shooter
  // arms run LowerArmR straight into fingers; the sword hangs off the
  // finger base like the infantry AK).
  const slots = [
    [tpl.spec.handProp, tpl.spec.handBone],
    [tpl.spec.armProp, null],
    [tpl.spec.headProp, null],
    [tpl.spec.trimProp, null],
  ];
  for (const [key, boneOverride] of slots) {
    if (!key || !HAND_PROPS[key]) continue;
    const { bone, name, make, rotX } = HAND_PROPS[key];
    const useBone = boneOverride || bone;
    const k = gripK(useBone);
    const grip = body.getObjectByName(useBone);
    const prop = make(k);
    prop.name = name;
    // Fist-hung blades point down the hanging arm straight through the
    // floor; tip them forward out of the knuckles like the rifle idiom.
    if (tpl.spec.propTiltX && key === tpl.spec.handProp) prop.rotation.x = tpl.spec.propTiltX;
    // the blaster barrel is built along +Z but the alien's fingers run
    // along the palm bone's +Y; tip the gun onto the finger line so the
    // grip reads instead of pointing back down the wrist.
    if (rotX) prop.rotation.x = rotX;
    (grip || body).add(prop);
  }
  // the cannoneer fights beside a static cannon mount, not on it.
  // the barrel runs along prop-local -X, so a PI turn points the muzzle
  // at mesh-local +X (forward); the old PI/2 aimed it sideways (+Z).
  const mount = MOUNTS[role];
  let cannonProp = null;
  if (mount && templates[mount.tpl]) {
    const prop = SkeletonUtils.clone(templates[mount.tpl].object);
    prop.name = mount.tpl;
    prop.rotation.y = Math.PI;
    prop.scale.setScalar(templates[mount.tpl].scale * mount.scale);
    prop.position.set(0, 0, mount.side);
    // Seat the mount on the dirt: the authored cannon origin hangs its
    // wheels below grade.
    prop.updateMatrixWorld(true);
    prop.position.y -= new THREE.Box3().setFromObject(prop).min.y;
    mesh.add(prop);
    cannonProp = prop;
  }
  const holder = { mixer: new THREE.AnimationMixer(body), actions: new Map(), clips: tpl.clips, current: null, currentName: null };
  // Procedural legs for the march. Authored walk clips swing shins but
  // leave thighs/hips rigid (legs freeze ~60% of each loop), and the rigs
  // are flat (bones are armature siblings), so rotating one bone cannot
  // translate the hoof. Each leg chain (thigh/foot, matched by name) is
  // posed outright while walking, driven by walkPhase (already
  // speed-coupled in sim and gallery): the foot bone carries a sawtooth
  // stride retreating through stance at body speed, the thigh follows to
  // keep the knee connected, the body bobs twice per stride. Riders ride
  // mesh.position so they follow for free.
  const hindOnly = role === 'dino'; // raptor arms stay out
  const legs = [];
  mesh.updateMatrixWorld(true);
  body.traverse((o) => {
    if (!(o.isBone && /(upleg|upperleg|thigh)/i.test(o.name) && !/end/i.test(o.name))) return;
    if (hindOnly && /^front/i.test(o.name)) return;
    const side = o.name.endsWith('L') ? 'L' : (o.name.endsWith('R') ? 'R' : null);
    const fb = /^front/i.test(o.name) ? 'front' : (/^back/i.test(o.name) ? 'back' : null);
    const sib = (re) => {
      let found = null;
      body.traverse((oo) => {
        if (found || !oo.isBone || !re.test(oo.name) || /end/i.test(oo.name)) return;
        if (side && !oo.name.endsWith(side)) return;
        if (fb === 'front' && !/^front/i.test(oo.name)) return;
        if (fb === 'back' && !/^back/i.test(oo.name)) return;
        if (hindOnly && /^front/i.test(oo.name)) return;
        found = oo;
      });
      return found;
    };
    const shin = sib(/(lowleg|lowerleg|shin|knee)/i);
    const foot = sib(/foot/i);
    if (!foot) return;
    // Swing axis: perturb each local axis, keep the one that carries the
    // knee along facing (restored after). Signed against the knee (shin
    // origin) so the thigh provably follows the ankle, even on mirrored
    // frames where rotation direction flips.
    const knee = shin || foot;
    const kv0 = new THREE.Vector3();
    knee.getWorldPosition(kv0);
    let axis = 'x';
    let sign = 1;
    let bestD = -1;
    for (const ax of ['x', 'y', 'z']) {
      const save = o.rotation[ax];
      o.rotation[ax] = save + 0.25;
      mesh.updateMatrixWorld(true);
      const kv1 = new THREE.Vector3();
      knee.getWorldPosition(kv1);
      o.rotation[ax] = save;
      const dx = kv1.x - kv0.x;
      if (Math.abs(dx) > bestD) { bestD = Math.abs(dx); axis = ax; sign = dx < 0 ? -1 : 1; }
    }
    mesh.updateMatrixWorld(true);
    const trest = o.rotation[axis];
    // Foot travel vector in the foot's parent frame. Matrix-derived, never
    // quaternion-derived: mirrored limb frames make quaternion inverses
    // garbage. Gain-calibrated so STEP meters land in world X.
    const fdir = new THREE.Vector3(1, 0, 0).transformDirection(foot.parent.matrixWorld.clone().invert());
    const fp0 = foot.position.clone();
    const fw0 = new THREE.Vector3();
    foot.getWorldPosition(fw0);
    foot.position.copy(fp0).addScaledVector(fdir, 0.25);
    mesh.updateMatrixWorld(true);
    const fw1 = new THREE.Vector3();
    foot.getWorldPosition(fw1);
    foot.position.copy(fp0);
    mesh.updateMatrixWorld(true);
    const fgain = ((fw1.x - fw0.x) / 0.25) || 1;
    const hipW = new THREE.Vector3();
    o.getWorldPosition(hipW);
    const ankW = new THREE.Vector3();
    foot.getWorldPosition(ankW);
    const legLen = Math.max(0.3, hipW.distanceTo(ankW));
    const leg = { thigh: o, tax: axis, tsign: sign, trest,
      foot, fdir, fgain, fprest: fp0, legLen,
      off: (side === 'R' ? Math.PI : 0) + (fb === 'back' ? Math.PI : 0) };
    legs.push(leg);
  });
  // Half foot travel per step. walkPhase cadence scales with speed, so one
  // STEP serves every role: stance travel matches ground speed.
  const STEP = 0.28;
  const BOB = 0.045;
  let walkBlend = 0;

  let riderHolder = null;
  let riderAttack = 'Punch';
  const comp = COMPOSITES[role];
  if (comp && templates[comp.rider]) {
    const riderTpl = templates[comp.rider];
    const rider = SkeletonUtils.clone(riderTpl.object);
    rider.rotation.y = Math.PI / 2;
    rider.scale.setScalar(riderTpl.scale);
    // Seat on the skeleton, not the bounding box: box mid-X drifts over
    // long tails and box top rides the head crest, both of which parked
    // riders behind and above the back. Hips carry the load; mid-back sits
    // a third of the way to the shoulders; feet straddle (dino) or dangle
    // (knight) from there.
    mesh.updateMatrixWorld(true);
    const hips = body.getObjectByName('Hips');
    const shoulders = body.getObjectByName('Shoulders') || body.getObjectByName('Torso');
    const hv = new THREE.Vector3();
    (hips || body).getWorldPosition(hv);
    const sv = new THREE.Vector3();
    (shoulders || hips || body).getWorldPosition(sv);
    rider.position.set(hv.x + (sv.x - hv.x) * 0.35, 0, (hv.z + sv.z) / 2);
    mesh.add(rider);
    mesh.updateMatrixWorld(true);
    const rb = new THREE.Box3().setFromObject(rider);
    rider.position.y += hv.y + (comp.rideH ?? 0) - rb.min.y;
    // riders fight armed too: hang their hand prop off the rider's fist
    // (the seat-block clone above is raw, like the dino rider).
    if (riderTpl.spec.handProp && HAND_PROPS[riderTpl.spec.handProp]) {
      const { bone, name, make } = HAND_PROPS[riderTpl.spec.handProp];
      const fist = rider.getObjectByName(bone);
      const rv = new THREE.Vector3();
      (fist || rider).getWorldScale(rv);
      const prop = make(rv.x > 0 ? 1 / rv.x : 1 / riderTpl.scale);
      prop.name = name;
      (fist || rider).add(prop);
    }
    riderHolder = { mixer: new THREE.AnimationMixer(rider), actions: new Map(), clips: riderTpl.clips, current: null, currentName: null };
    riderAttack = comp.attack;
  }

  // Rigid prop parts fuse per joint (local mode) so hand guns, shields and
  // crew-served mounts cost a few calls but keep articulating with bones.
  mergeStatic(mesh, new Set(), { local: true });
  const bar = makeHpBar(entity.isHero ? 1.8 : 1.3);
  bar.sprite.position.y = height * heroS + 0.35;
  bar.sprite.visible = false;
  mesh.add(bar.sprite);
  solidify(mesh);
  const mats = cloneMats(mesh);
  for (const m of mats) {
    if ('emissive' in m) { m.emissive = new THREE.Color('#000000'); m.transparent = true; }
  }
  const ringR = THREE.MathUtils.clamp(height * 0.35, 0.5, 1.5);
  mesh.add(teamRing(ringR * heroS, accent));
  if (entity.isHero) mesh.add(teamRing(ringR * heroS * 1.3, '#ffd23a', 0.9));

  let facing = entity.side === 'player' ? 0 : Math.PI;
  mesh.rotation.y = facing;
  let lastWalkPhase = entity.walkPhase;
  let wasAttacking = false;
  let currentClip = tpl.spec.idle;

  function setFlash(level) {
    for (const m of mats) {
      if ('emissive' in m) m.emissive.setHex(level > 0 ? FLASH_HEX : 0x000000);
      if ('emissiveIntensity' in m) m.emissiveIntensity = level > 0 ? level * FLASH_PEAK : 1;
    }
  }

  // transient muzzle fx (flash sprites, tracers): spawned on the attack
  // rising edge, decayed in update, disposed on expiry. disposeDeep skips
  // sprites, so each entry owns its material (the shared glow texture
  // survives material disposal).
  const fx = [];
  function addFx(obj, ttl, vel) {
    mesh.add(obj);
    fx.push({ obj, ttl, vel });
  }
  function muzzleMeshLocal(prop, local) {
    mesh.updateMatrixWorld(true);
    return mesh.worldToLocal(prop.localToWorld(local.clone()));
  }
  let cannonKick = 0;
  function fireFx() {
    if (cannonProp) {
      // recoil backward: prop-local +X is mesh-local -X after the PI turn.
      cannonKick = 1;
      cannonProp.position.x = 0.3;
      const m = muzzleMeshLocal(cannonProp, new THREE.Vector3(-0.87, 0.1, 0));
      const flash = glowSprite('#ffd23a', 0.95, 1.2);
      flash.name = 'cannonflash';
      flash.position.copy(m);
      addFx(flash, 0.2);
      const smoke = glowSprite('#9aa0a8', 0.55, 1.0, false);
      smoke.name = 'cannonsmoke';
      smoke.position.copy(m);
      addFx(smoke, 0.8, new THREE.Vector3(0, 1.2, 0));
    } else if (gunProp) {
      const m = muzzleMeshLocal(gunProp, new THREE.Vector3(2.04, 0, 0));
      // The shot line stays level and above the dirt even when the firing
      // clip dips the rifle: clamp the FX height, keep the beam horizontal.
      const fy = Math.max(m.y, 0.45);
      const flash = glowSprite('#ffe9a3', 0.95, 0.8);
      flash.name = 'muzzleflash';
      flash.position.set(m.x, fy, m.z);
      addFx(flash, 0.12);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(3, 0.06, 0.06), glowMat('#ffd23a', 0.8));
      beam.name = 'tracer';
      beam.position.set(m.x + 1.5, fy, m.z);
      addFx(beam, 0.15);
    }
  }

  // Walk clip with leg tracks stripped: while marching, legs are fully
  // procedural (below), so the authored shin snap cannot fight them. Arms,
  // torso and head keep the authored motion. Central position tracks go
  // too: the clip's body-bob runs on the clip clock and would beat against
  // the stride (the mesh-level bob below replaces it). Cached per template.
  // The public clip contract still reports base names ('Walk').
  let walkPlay = tpl.spec.walk;
  if (legs.length) {
    if (!tpl.walkNoLegs) {
      const src = tpl.clips.get(tpl.spec.walk);
      const legNames = new Set();
      for (const leg of legs) {
        legNames.add(leg.thigh.name);
        if (leg.shin) legNames.add(leg.shin.name);
        legNames.add(leg.foot.name);
      }
      const central = /^(body|root|hips|torso|pelvis)$/i;
      const tracks = src ? src.tracks.filter((tr) => {
        const [node, prop] = tr.name.split('.');
        if (legNames.has(node)) return false;
        if (prop === 'position' && central.test(node)) return false;
        return true;
      }) : [];
      tpl.walkNoLegs = new THREE.AnimationClip(`${tpl.spec.walk}_nolegs`, src ? src.duration : 1, tracks);
      tpl.clips.set(`${tpl.spec.walk}_nolegs`, tpl.walkNoLegs);
    }
    walkPlay = `${tpl.spec.walk}_nolegs`;
  }

  const inst = {
    mesh,
    get currentClip() { return currentClip; },
    get riderClip() { return riderHolder ? riderHolder.currentName : null; },
    update(dt, e) {
      mesh.position.set(toMeters(e.x), 0, e.z || 0);
      facing = e.side === 'player' ? 0 : Math.PI;
      mesh.rotation.y = facing;

      const dying = e.dying || !e.alive;
      const attacking = !dying && e.attackSpeed > 0 && e.attackCooldown > 0;
      const moving = !dying && !attacking && e.walkPhase !== lastWalkPhase;
      lastWalkPhase = e.walkPhase;

      let want = tpl.spec.idle;
      if (dying) want = tpl.spec.death;
      else if (attacking) want = tpl.spec.attack;
      else if (moving) want = tpl.spec.walk;
      if (want !== currentClip || (attacking && !wasAttacking)) {
        playAction(holder, want === tpl.spec.walk ? walkPlay : want);
        currentClip = want;
      }
      if (attacking && !wasAttacking) fireFx();
      wasAttacking = attacking;
      if (riderHolder) {
        const rwant = dying ? 'Death' : (attacking ? riderAttack : 'Idle');
        if (rwant !== riderHolder.currentName) playAction(riderHolder, rwant);
      }
      holder.mixer.update(dt);
      if (riderHolder) riderHolder.mixer.update(dt);
      // Procedural legs: absolute poses from walkPhase, eased in/out so
      // walk/idle/attack transitions never snap. Diagonal pairs alternate;
      // sawtooth stride retreats through stance at body speed with a quick
      // lifted return, so one STEP serves every role.
      walkBlend = THREE.MathUtils.clamp(walkBlend + ((want === tpl.spec.walk && moving) ? dt : -dt) / 0.15, 0, 1);
      if (walkBlend > 0 && legs.length) {
        for (const leg of legs) {
          const cyc = (e.walkPhase + leg.off) / (Math.PI * 2);
          const f01 = cyc - Math.floor(cyc);
          const s = (f01 < 0.6 ? 1 - (f01 / 0.6) * 2 : -1 + ((f01 - 0.6) / 0.4) * 2) * walkBlend;
          leg.foot.position.copy(leg.fprest).addScaledVector(leg.fdir, (STEP * s) / leg.fgain);
          const bend = (STEP / leg.legLen) * s;
          leg.thigh.rotation[leg.tax] = leg.trest + leg.tsign * bend;
        }
        mesh.position.y = BOB * Math.abs(Math.sin(e.walkPhase)) * walkBlend;
      } else {
        mesh.position.y = 0;
      }

      // recoil spring-back + transient fx expiry (dt is sim-scaled here).
      // the firing frame keeps full kick; decay starts the next frame.
      if (cannonProp) {
        if (cannonKick > 0.001) {
          const before = cannonKick;
          cannonKick *= Math.exp(-dt * 6);
          if (before < 1) cannonProp.position.x = cannonKick * 0.3;
        } else if (cannonProp.position.x !== 0) {
          cannonKick = 0;
          cannonProp.position.x = 0;
        }
      }
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i];
        f.ttl -= dt;
        if (f.vel) f.obj.position.addScaledVector(f.vel, dt);
        if (f.ttl <= 0) {
          mesh.remove(f.obj);
          f.obj.material?.dispose?.();
          fx.splice(i, 1);
        }
      }

      if (e.hitFlash > 0) {
        const pop = Math.min(1, e.hitFlash / 0.1);
        body.scale.set(tpl.scale * s * (1 + pop * 0.05), tpl.scale * s * (1 - pop * 0.05), tpl.scale * s * (1 + pop * 0.05));
        setFlash(pop);
      } else {
        body.scale.setScalar(tpl.scale * s);
        setFlash(0);
      }

      if (dying) {
        const raw = Math.min(1, (e.deathTimer || 0) / 0.35);
        for (const m of mats) m.opacity = 1 - raw * 0.45;
        bar.sprite.visible = false;
      } else {
        for (const m of mats) m.opacity = 1;
        const frac = e.hp / e.maxHp;
        bar.sprite.visible = frac < 0.999;
        if (bar.sprite.visible) bar.set(frac);
      }
    },
    dispose() {
      for (const f of fx) {
        mesh.remove(f.obj);
        f.obj.material?.dispose?.();
      }
      fx.length = 0;
      disposeDeep(mesh);
      bar.sprite.material.map?.dispose?.();
      bar.sprite.material.dispose?.();
    },
  };
  // Start settled in the idle pose so the first frame is never a T-pose
  // flash: play idle on both mixers and advance past the fade-in. Without
  // this riders pop ~0.5m high for the first frames of every spawn.
  playAction(holder, tpl.spec.idle);
  holder.mixer.update(0.15);
  if (riderHolder) {
    playAction(riderHolder, 'Idle');
    riderHolder.mixer.update(0.15);
  }
  currentClip = tpl.spec.idle;
  return inst;
}

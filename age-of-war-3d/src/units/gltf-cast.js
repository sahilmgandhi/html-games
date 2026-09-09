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
  pbr, basic,
} from '../core/pbr.js';

// entity.type (or hero) -> template role, per age.
export const QUAT_ROLES = { melee: 'clubman', ranged: 'slinger', fast: 'dino', hero: 'hero' };
export const CASTLE_ROLES = { melee: 'swordsman', ranged: 'archer', fast: 'knight', hero: 'paladin' };
export const RENAISSANCE_ROLES = { melee: 'dueler', ranged: 'musketeer', siege: 'cannoneer', hero: 'engineer' };
export const MODERN_ROLES = { melee: 'meleeinf', ranged: 'infantry', armored: 'tank', hero: 'commander' };

// Procedural rig heights the cast must match (units.js builders).
// heroModel: template is already modeled at hero height, skip the 1.18x.
// lift: color multiplier for authored near-black browns (raptor, horse).
// glTF knights need none: their runtime colors already clear the bar.
// bow: earns a procedural longbow + quiver (archer has no bow prop).
// hide: authored weapon meshes to switch off per role (musketeer drops the
// cutlass for a rifle, the cannoneer crew drops the lute for a cannon).
const ROLE_SPEC = {
  clubman: { file: 'Viking_Male', kind: 'gltf', targetH: 2.1, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle' },
  slinger: { file: 'Goblin_Male', kind: 'gltf', targetH: 1.95, walk: 'Walk', attack: 'Shoot_OneHanded', death: 'Death', idle: 'Idle' },
  hero: { file: 'Wizard', kind: 'gltf', targetH: 2.4 * 1.18, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle', heroModel: true },
  dino: { file: 'Velociraptor', kind: 'fbx', targetH: 3.1, walk: 'Velociraptor_Walk', attack: 'Velociraptor_Attack', death: 'Velociraptor_Death', idle: 'Velociraptor_Idle', lift: 5.0 },
  swordsman: { file: 'Knight_Male', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle' },
  archer: { file: 'Elf', kind: 'gltf', targetH: 2.0, walk: 'Walk', attack: 'Shoot_OneHanded', death: 'Death', idle: 'Idle', bow: true },
  paladin: { file: 'Knight_Golden_Male', kind: 'gltf', targetH: 2.5 * 1.18, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle', heroModel: true },
  knight: { file: 'Horse', kind: 'fbx', targetH: 2.9, walk: 'Walk', attack: 'Run', death: 'Death', idle: 'Idle', lift: 5.0 },
  knightRider: { file: 'Knight_Male', kind: 'gltf', targetH: 1.5, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle' },
  dueler: { file: 'Pirate_Barbarossa', kind: 'gltf', targetH: 2.1, walk: 'Walk', attack: 'Sword', death: 'Death', idle: 'Idle' },
  musketeer: { file: 'Pirate_Mako', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', rifle: 'rifleProp', hide: ['Weapon_Sword'] },
  cannoneer: { file: 'Pirate_Henry', kind: 'gltf', targetH: 2.2, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', hide: ['Weapon_Lute'] },
  engineer: { file: 'Pirate_Anne', kind: 'gltf', targetH: 2.6 * 1.18, walk: 'Walk', attack: 'Sword', death: 'Death', idle: 'Idle', heroModel: true },
  cannon: { file: 'Pirate_Cannon', kind: 'gltf', targetH: 1.13, walk: 'Idle', attack: 'Idle', death: 'Death', idle: 'Idle' },
  rifle: { file: 'Pirate_Rifle', kind: 'gltf', targetH: 0.69, walk: 'Idle', attack: 'Idle', death: 'Death', idle: 'Idle' },
  meleeinf: { file: 'Shooter_Soldier', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', rifle: 'akProp', gunName: 'ak' },
  infantry: { file: 'Shooter_Enemy', kind: 'gltf', targetH: 2.15, walk: 'Walk', attack: 'Idle_Shoot', death: 'Death', idle: 'Idle', rifle: 'akProp', gunName: 'ak' },
  commander: { file: 'Shooter_Hazmat', kind: 'gltf', targetH: 2.3 * 1.18, walk: 'Walk', attack: 'Punch', death: 'Death', idle: 'Idle', heroModel: true },
  tank: { file: 'Quat_Tank', kind: 'fbx', targetH: 2.4, walk: 'Tank_Forward', attack: 'Tank_Forward', death: null, idle: 'Tank_Forward' },
  ak: { file: 'Shooter_AK', kind: 'gltf', targetH: 1.42, walk: 'Idle', attack: 'Idle', death: 'Death', idle: 'Idle' },
};

// Mounted roles: rider template, rider attack clip, how far the feet hang
// below the mount's back line (dangle: raptor rider sits tall, knight's
// feet hang past the barrel).
const COMPOSITES = {
  dino: { rider: 'rider', attack: 'Punch', seatDrop: 0.18 },
  knight: { rider: 'knightRider', attack: 'SwordSlash', seatDrop: 0.55 },
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
    soldier, enemy, hazmat, ak, tank] = await Promise.all([
    loadGltf('Viking_Male'), loadGltf('Goblin_Male'), loadGltf('Wizard'), loadFbx('Velociraptor'),
    loadGltf('Knight_Male'), loadGltf('Knight_Golden_Male'), loadGltf('Elf'), loadFbx('Horse'),
    loadGltf('Pirate_Barbarossa'), loadGltf('Pirate_Mako'), loadGltf('Pirate_Henry'),
    loadGltf('Pirate_Anne'), loadGltf('Pirate_Cannon'), loadGltf('Pirate_Rifle'),
    loadGltf('Shooter_Soldier'), loadGltf('Shooter_Enemy'), loadGltf('Shooter_Hazmat'),
    loadGltf('Shooter_AK'), loadFbx('Quat_Tank'),
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
  };
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
const AGE_ROLES = { 1: CASTLE_ROLES, 2: RENAISSANCE_ROLES, 3: MODERN_ROLES };
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
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.38 * k, 0.03 * k, 6, 14, Math.PI), pbr('#7a5230', 0.85));
  arc.rotation.z = -Math.PI / 2;
  bow.add(arc);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * k, 0.008 * k, 0.76 * k, 4), basic('#d8cfb8'));
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
  body.rotation.y = Math.PI / 2;
  body.scale.setScalar(tpl.scale * s);
  mesh.add(body);
  // the archer's file has no bow: hang a procedural longbow off the left
  // fist and a quiver off the torso.
  if (tpl.spec.bow) {
    const k = 1 / (tpl.scale * s);
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
  if (tpl.spec.rifle && templates[tpl.spec.rifle]) {
    const hand = body.getObjectByName('Middle1R');
    const gun = templates[tpl.spec.rifle].object.clone();
    gun.name = tpl.spec.gunName || 'rifle';
    gun.rotation.z = Math.PI / 2;
    (hand || body).add(gun);
  }
  // the cannoneer fights beside a static cannon mount, not on it.
  const mount = MOUNTS[role];
  if (mount && templates[mount.tpl]) {
    const prop = SkeletonUtils.clone(templates[mount.tpl].object);
    prop.name = mount.tpl;
    prop.rotation.y = Math.PI / 2;
    prop.scale.setScalar(templates[mount.tpl].scale * mount.scale);
    prop.position.set(0, 0, mount.side);
    mesh.add(prop);
  }
  const holder = { mixer: new THREE.AnimationMixer(body), actions: new Map(), clips: tpl.clips, current: null, currentName: null };

  let riderHolder = null;
  let riderAttack = 'Punch';
  const comp = COMPOSITES[role];
  if (comp && templates[comp.rider]) {
    const riderTpl = templates[comp.rider];
    const rider = SkeletonUtils.clone(riderTpl.object);
    rider.rotation.y = Math.PI / 2;
    rider.scale.setScalar(riderTpl.scale);
    // seat on the mount's back: mid-back, feet resting near (dino) or
    // dangling past (knight) the back line.
    const box = new THREE.Box3().setFromObject(body);
    rider.position.set(box.min.x + (box.max.x - box.min.x) * 0.5, 0, 0);
    mesh.add(rider);
    mesh.updateMatrixWorld(true);
    const rb = new THREE.Box3().setFromObject(rider);
    rider.position.y += box.max.y * 0.92 - rb.min.y - comp.seatDrop;
    riderHolder = { mixer: new THREE.AnimationMixer(rider), actions: new Map(), clips: riderTpl.clips, current: null, currentName: null };
    riderAttack = comp.attack;
  }

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

  function setFlash(on) {
    for (const m of mats) {
      if ('emissive' in m) m.emissive.setHex(on ? 0xffffff : 0x000000);
      if ('emissiveIntensity' in m) m.emissiveIntensity = on ? 0.3 : 1;
    }
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
        playAction(holder, want);
        currentClip = want;
      }
      wasAttacking = attacking;
      if (riderHolder) {
        const rwant = dying ? 'Death' : (attacking ? riderAttack : 'Idle');
        if (rwant !== riderHolder.currentName) playAction(riderHolder, rwant);
      }
      holder.mixer.update(dt);
      if (riderHolder) riderHolder.mixer.update(dt);

      if (e.hitFlash > 0) {
        const pop = Math.min(1, e.hitFlash / 0.1);
        body.scale.set(tpl.scale * s * (1 + pop * 0.05), tpl.scale * s * (1 - pop * 0.05), tpl.scale * s * (1 + pop * 0.05));
      } else {
        body.scale.setScalar(tpl.scale * s);
      }
      setFlash(e.hitFlash > 0);

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
      disposeDeep(mesh);
      bar.sprite.material.map?.dispose?.();
      bar.sprite.material.dispose?.();
    },
  };
  // start in the idle pose so the first frame is never a T-pose flash.
  playAction(holder, tpl.spec.idle);
  currentClip = tpl.spec.idle;
  return inst;
}

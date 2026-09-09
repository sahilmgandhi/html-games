// Quaternius CC0 stone-age cast. Parses the vendored assets/quat files
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
} from '../core/pbr.js';

// entity.type (or hero) -> template role.
export const QUAT_ROLES = { melee: 'clubman', ranged: 'slinger', fast: 'dino', hero: 'hero' };

// Procedural stone-age rig heights the cast must match (units.js builders).
const ROLE_SPEC = {
  clubman: { file: 'viking', targetH: 2.1, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle' },
  slinger: { file: 'goblin', targetH: 1.95, walk: 'Walk', attack: 'Shoot_OneHanded', death: 'Death', idle: 'Idle' },
  hero: { file: 'wizard', targetH: 2.4 * 1.18, walk: 'Walk', attack: 'SwordSlash', death: 'Death', idle: 'Idle' },
  dino: { file: 'raptor', targetH: 3.1, walk: 'Velociraptor_Walk', attack: 'Velociraptor_Attack', death: 'Velociraptor_Death', idle: 'Velociraptor_Idle' },
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
  const [viking, goblin, wizard, raptor] = await Promise.all([
    loadGltf('Viking_Male'), loadGltf('Goblin_Male'), loadGltf('Wizard'), loadFbx('Velociraptor'),
  ]);
  // FBX clips arrive prefixed (Armature|Walk); strip to the bare name.
  const clipMap = (animations) => new Map(animations.map((c) => [c.name.split('|').pop(), c]));
  const pack = (role, gltf) => {
    const spec = ROLE_SPEC[role];
    const clips = clipMap(gltf.animations);
    return { object: gltf.scene, clips, scale: spec.targetH / measureHeight(gltf.scene), height: spec.targetH, spec };
  };
  const dinoSpec = ROLE_SPEC.dino;
  const dinoClips = clipMap(raptor.animations);
  const goblinH = measureHeight(goblin.scene);
  return {
    clubman: pack('clubman', viking),
    slinger: pack('slinger', goblin),
    hero: pack('hero', wizard),
    dino: { object: raptor, clips: dinoClips, scale: dinoSpec.targetH / measureHeight(raptor), height: dinoSpec.targetH, spec: dinoSpec },
    // the dino rider is a small goblin seated on the raptor's back.
    rider: { object: goblin.scene, clips: clipMap(goblin.animations), scale: 1.2 / goblinH, height: 1.2, spec: ROLE_SPEC.slinger },
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

// UnitMesh calls this: any stone-age render path (battle, showcase)
// triggers the cast load without caring who got there first.
export function ensureQuatLoaded() {
  if (activeTemplates || typeof fetch === 'undefined') return;
  loadQuatCastOnce();
}
export function quatRoleFor(entity) {
  if (entity.isHero) return QUAT_ROLES.hero;
  return QUAT_ROLES[entity.type] || QUAT_ROLES.melee;
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
  // the hero template is already modeled at hero height; other roles scale.
  const s = role === 'hero' ? 1 : heroS;
  const height = tpl.height * s;

  const mesh = new THREE.Group();
  const body = SkeletonUtils.clone(tpl.object);
  // Quaternius models face +Z; procedural rigs face +X at rotation 0.
  body.rotation.y = Math.PI / 2;
  body.scale.setScalar(tpl.scale * s);
  mesh.add(body);
  const holder = { mixer: new THREE.AnimationMixer(body), actions: new Map(), clips: tpl.clips, current: null, currentName: null };

  let riderHolder = null;
  if (role === 'dino' && templates.rider) {
    const rider = SkeletonUtils.clone(templates.rider.object);
    rider.rotation.y = Math.PI / 2;
    rider.scale.setScalar(templates.rider.scale);
    // seat on the raptor's back: behind center, above the spine.
    const box = new THREE.Box3().setFromObject(body);
    rider.position.set(box.min.x + (box.max.x - box.min.x) * 0.35, box.max.y * 0.82, 0);
    mesh.add(rider);
    riderHolder = { mixer: new THREE.AnimationMixer(rider), actions: new Map(), clips: templates.rider.clips, current: null, currentName: null };
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
        const rwant = dying ? 'Death' : (attacking ? 'Punch' : 'Idle');
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

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { pbr, disposeDeep, basic, glowMat, glowSprite } from '../core/pbr.js';

// Hybrid environment model system: loads available CC0 models, falls back to procedural
// for roles without models. Models are loaded once, then cloned via SkeletonUtils.

const _cache = new Map();
export let envTemplates = null;

// Available CC0 models we already have
const EXISTING_MODELS = {
  // Renaissance turret - use pirate cannon
  renaissance_small_cannon: { file: 'Pirate_Cannon', kind: 'gltf', existing: true },
  renaissance_large_cannon: { file: 'Pirate_Cannon', kind: 'gltf', existing: true },
  renaissance_explosive_cannon: { file: 'Pirate_Cannon', kind: 'gltf', existing: true },
  
  // Modern turret - use Quat_Tank
  modern_single_turret: { file: 'Quat_Tank', kind: 'fbx', existing: true },
  modern_rocket_turret: { file: 'Quat_Tank', kind: 'fbx', existing: true },
  modern_double_turret: { file: 'Quat_Tank', kind: 'fbx', existing: true },
  
  // We don't have these - will use procedural fallback
  // stone_slingshot, stone_egg, stone_catapult
  // castle_catapult, castle_fire_catapult, castle_oil_tower
  // modern_single_turret, modern_rocket_turret, modern_double_turret (already above)
  // future_titanium_shooter, future_lazer_cannon, future_ion_ray
  // tower, stone_hold, castle_keep, etc.
};

// Role specifications: target height, scale, muzzle offset
const ROLE_SPECS = {
  // Stone Age turrets
  stone_slingshot: { targetH: 4.6, scale: 1.0, muzzleOffset: [1.5, 3.65, 0] },
  stone_egg: { targetH: 4.2, scale: 1.0, muzzleOffset: [0.9, 3.1, 0] },
  stone_catapult: { targetH: 5.4, scale: 1.0, muzzleOffset: [0, 4.6, 0] },
  
  // Castle Age turrets
  castle_catapult: { targetH: 5.6, scale: 1.0, muzzleOffset: [0, 4.8, 0] },
  castle_fire_catapult: { targetH: 5.6, scale: 1.0, muzzleOffset: [2.3, 3.8, 0] },
  castle_oil_tower: { targetH: 5.2, scale: 1.0, muzzleOffset: [0.9, 3.4, 0] },
  
  // Renaissance turrets - use Pirate_Cannon model
  renaissance_small_cannon: { targetH: 4.6, scale: 1.0, muzzleOffset: [1.6, 1.3, 0] },
  renaissance_large_cannon: { targetH: 4.8, scale: 1.0, muzzleOffset: [2.4, 1.3, 0] },
  renaissance_explosive_cannon: { targetH: 4.8, scale: 1.0, muzzleOffset: [1.0, 1.3, 0] },
  
  // Modern turrets - use Quat_Tank model
  modern_single_turret: { targetH: 3.4, scale: 1.0, muzzleOffset: [2.35, 0.5, 0] },
  modern_rocket_turret: { targetH: 4.2, scale: 1.0, muzzleOffset: [1.0, 0.95, 0] },
  modern_double_turret: { targetH: 3.6, scale: 1.0, muzzleOffset: [2.5, 0.72, 0.3] },
  
  // Future turrets
  future_titanium_shooter: { targetH: 3.6, scale: 1.0, muzzleOffset: [2.1, 0.5, 0] },
  future_lazer_cannon: { targetH: 4.0, scale: 1.0, muzzleOffset: [1.35, 0.45, 0] },
  future_ion_ray: { targetH: 4.6, scale: 1.0, muzzleOffset: [0.4, 2.6, 0] },
  
  // Tower
  tower: { targetH: 4.675, scale: 1.0, muzzleOffset: null },
  
  // Bases
  stone_hold: { targetH: 8.0, scale: 1.0 },
  castle_keep: { targetH: 8.0, scale: 1.0 },
  renaissance_palazzo: { targetH: 8.0, scale: 1.0 },
  modern_bunker: { targetH: 8.0, scale: 1.0 },
  future_citadel: { targetH: 8.0, scale: 1.0 },
};

const clipMap = (clips) => {
  const map = new Map();
  for (const clip of clips) map.set(clip.name, clip);
  return map;
}

async function loadGltf(loader, url) {
  const res = await loader.loadAsync(url);
  return res;
}

async function loadFbx(loader, url) {
  const res = await loader.loadAsync(url);
  return res;
}

// Procedural fallback generators for roles without models
function createProceduralTurret(role, accent) {
  const spec = ROLE_SPECS[role] || { targetH: 4.0, scale: 1.0 };
  const { targetH } = spec;
  
  const mesh = new THREE.Group();
  const root = new THREE.Group();
  
  // Simple procedural turret based on role
  if (role.includes('stone') || role.includes('castle')) {
    // Wood/stone aesthetic
    const wood = pbr('#6e4a2c', 0.9);
    const woodDk = pbr('#4c3018', 0.9);
    const stone = pbr('#8d8d94', 0.9);
    const stoneDk = pbr('#5e5e66', 0.95);
    const iron = pbr('#3a3f4a', 0.5, 0.7);
    
    // Platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 0.8, 14), 
      pbr('#5a4a3a', 0.95)
    );
    platform.position.y = 0.35;
    root.add(platform);
    
    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 0.25, 14), 
      pbr('#4c3018', 0.9)
    );
    deck.position.y = 0.8;
    root.add(deck);
    
    // Turret body
    const body = new THREE.Group();
    body.position.y = 1.5;
    
    if (role.includes('slingshot')) {
      // A-frame slingshot
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.16, 3.0, 8), 
          pbr('#6e4a2c', 0.9)
        );
        leg.position.set(s * 0.5, 1.5, 0);
        leg.rotation.z = s * -0.3;
        body.add(leg);
      }
      const arm = new THREE.Group();
      arm.position.y = 2.5;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 2.4, 8), 
        pbr('#6e4a2c', 0.9)
      );
      beam.rotation.z = Math.PI / 2 - 0.5;
      beam.position.x = 0.3;
      arm.add(beam);
      body.add(arm);
    } else if (role.includes('egg')) {
      // Egg thrower - nest mound
      const nest = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.3, 10, 16), 
        pbr('#7a5a34', 0.95)
      );
      nest.rotation.x = Math.PI / 2;
      nest.position.y = 1.2;
      nest.scale.z = 0.7;
      body.add(nest);
      // Thrower arm
      const arm = new THREE.Group();
      arm.position.y = 2.5;
      const cradle = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.07, 8, 12, Math.PI * 1.4), 
        pbr('#4c3018', 0.9)
      );
      cradle.rotation.z = -0.4;
      arm.add(cradle);
      body.add(arm);
    } else {
      // Catapult-style
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.15, 2.0, 8), 
          pbr('#6e4a2c', 0.9)
        );
        leg.position.set(s * 0.9, 0.4, 0);
        leg.rotation.z = s * 0.25;
        body.add(leg);
      }
      const arm = new THREE.Group();
      arm.position.set(-0.3, 1.2, 0);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.13, 3.0, 8), 
        pbr('#6e4a2c', 0.9)
      );
      beam.position.y = 1.4;
      arm.add(beam);
      const bucket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.25, 0.35, 10, 1, true), 
        pbr('#4c3018', 0.9)
      );
      bucket.material = bucket.material.clone();
      bucket.material.side = THREE.DoubleSide;
      bucket.position.y = 2.8;
      arm.add(bucket);
      body.add(arm);
    }
    root.add(body);
  } else if (role.includes('modern')) {
    // Modern military aesthetic
    const concrete = pbr('#6a6a62', 0.95);
    const dark = pbr('#3a3f46', 0.6);
    const sand = pbr('#8a7a5a', 1.0);
    
    // Concrete pad
    const padGeo = new THREE.CylinderGeometry(1.9, 2.1, 0.5, 14);
    const pad = new THREE.Mesh(padGeo, pbr('#6a6a62', 0.95));
    pad.position.y = 0.25;
    root.add(pad);
    
    // Sandbags
    const bagM = pbr('#8a7a5a', 1.0);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + 0.7 * (i / 6));
      const bag = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 8, 6), 
        bagM
      );
      bag.scale.set(1.25, 0.55, 0.8);
      bag.position.set(Math.cos(a) * 1.9, 0.68, Math.sin(a) * 1.9);
      bag.rotation.y = -a;
      root.add(bag);
    }
    
    const head = new THREE.Group();
    head.position.y = 0.5;
    const pivot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 0.7, 10), 
      pbr('#3a3f46', 0.6)
    );
    pivot.position.y = 0.7;
    head.add(pivot);
    
    const arm = new THREE.Group();
    arm.position.set(0, 1.1, 0);
    head.add(arm);
    root.add(head);
  } else if (role.includes('future')) {
    // Future sci-fi aesthetic
    const alloy = pbr('#1c2940', 0.6);
    const dark = pbr('#0d1522', 0.7);
    
    const techPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 0.5, 6), 
      pbr('#0d1522', 0.8)
    );
    techPad.position.y = 0.25;
    root.add(techPad);
    
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.06, 8, 6), 
      glowMat('#00e5ff', 0.9)
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.5;
    root.add(rim);
    
    const head = new THREE.Group();
    head.position.y = 0.5;
    const pivot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 0.8, 6), 
      pbr('#1c2940', 0.6, 0.6)
    );
    pivot.position.y = 0.7;
    head.add(pivot);
    root.add(head);
    
    const arm = new THREE.Group();
    arm.position.set(0, 1.2, 0);
    head.add(arm);
    
    if (role.includes('titanium')) {
      for (const s of [-1, 1]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.12, 0.14), 
          pbr('#2a3648', 0.5, 0.7)
        );
        rail.position.set(1.0, 0.5, s * 0.22);
        head.add(rail);
      }
    } else if (role.includes('lazer')) {
      const housing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.7, 1.4, 10), 
        pbr('#1c2940', 0.6, 0.6)
      );
      housing.rotation.z = -Math.PI / 2;
      housing.position.set(0.5, 0.45, 0);
      head.add(housing);
    } else if (role.includes('ion')) {
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 2.2, 8), 
        pbr('#1c2940', 0.6, 0.6)
      );
      mast.position.y = 1.3;
      head.add(mast);
      for (const fy of [0.8, 1.4, 2.0]) {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(0.34, 0.07, 8, 14), 
          pbr('#2a3648', 0.5, 0.7)
        );
        coil.rotation.x = Math.PI / 2;
        coil.position.y = fy;
        head.add(coil);
      }
    }
    root.add(head);
  }
  
  return { root, height: ROLE_SPECS[role]?.targetH || 4.0 };
}

async function fetchEnvCast(fetchFn = null, base = 'assets/env/') {
  // In Node.js tests, fetchFn is a shim that reads files from disk
  // In browser, fetchFn is the native fetch
  const isNode = typeof fetchFn === 'function' && fetchFn.name === 'shim';
  const fetchImpl = fetchFn || (typeof fetch === 'function' ? fetch : null);
  
  const gltfLoader = new (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader();
  const fbxLoader = new (await import('three/addons/loaders/FBXLoader.js')).FBXLoader();
  const templates = {};
  
  // Load existing models
  for (const [role, info] of Object.entries(EXISTING_MODELS)) {
    if (!info.existing) continue;
    try {
      let res;
      // Use fetchFn shim if provided, otherwise use fetch
      if (fetchFn) {
        // Node.js test shim - reads file from disk
        const filePath = info.kind === 'gltf' 
          ? `assets/quat/${info.file}.gltf`
          : `assets/quat/${info.file}.fbx`;
        const res = await fetchFn(filePath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        if (info.kind === 'gltf') {
          const text = await res.text();
          const loader = new (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader();
          res = await loader.parseAsync(text, '');
        } else if (info.kind === 'fbx') {
          const arrayBuffer = await res.arrayBuffer();
          const loader = new (await import('three/addons/loaders/FBXLoader.js')).FBXLoader();
          res = await loader.parseAsync(arrayBuffer, '');
        }
      } else if (fetchImpl) {
        // Browser - use native fetch
        const res = await fetchImpl(`${base}${info.file}.${info.kind}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        if (info.kind === 'gltf') {
          const text = await res.text();
          const loader = new (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader();
          res = await loader.parseAsync(text, base);
        } else if (info.kind === 'fbx') {
          const arrayBuffer = await res.arrayBuffer();
          const loader = new (await import('three/addons/loaders/FBXLoader.js')).FBXLoader();
          res = await loader.parseAsync(arrayBuffer, '');
        }
      }
      
      const object = res.scene || res;
      const animations = res.animations || [];
      const clips = new Map();
      for (const clip of animations) {
        clips.set(clip.name, clip);
      }
      
      const box = new THREE.Box3().setFromObject(object);
      const height = box.max.y - box.min.y;
      const spec = ROLE_SPECS[role] || { targetH: height, scale: 1.0 };
      const scale = spec.targetH / height;
      
      object.scale.setScalar(scale);
      object.updateMatrixWorld(true);
      
      let muzzle = null;
      if (spec.muzzleOffset) {
        const muzzleObj = new THREE.Object3D();
        muzzleObj.position.set(...spec.muzzleOffset.map(v => v * scale));
        object.add(muzzleObj);
        muzzle = muzzleObj;
      }
      
      _cache.set(role, {
        object,
        clips,
        height: spec.targetH,
        scale,
        spec,
        muzzle,
      });
    } catch (e) {
      console.warn(`Failed to load ${role}:`, e);
    }
  }
  
  envTemplates = Object.fromEntries(_cache);
  return templates;
}

export function getEnvTemplates() {
  return envTemplates;
}

export function getEnvTemplate(role) {
  if (envTemplates?.[role]) return envTemplates[role];
  // Return procedural fallback
  return { procedural: true, role, spec: ROLE_SPECS[role] };
}

export function createEnvMesh(role, accent = '#4a8af4') {
  const template = getEnvTemplate(role);
  if (!template) return null;
  
  if (template.procedural) {
    const { root, height } = createProceduralTurret(role, accent);
    const mesh = new THREE.Group();
    mesh.add(root);
    
    // Add muzzle if spec has it
    let muzzle = null;
    const spec = ROLE_SPECS[template.role];
    if (spec?.muzzleOffset) {
      const muzzleObj = new THREE.Object3D();
      muzzleObj.position.set(...spec.muzzleOffset);
      mesh.add(muzzleObj);
      muzzle = muzzleObj;
    }
    
    return {
      mesh,
      height,
      muzzle,
      getMuzzle() { return muzzle; },
      update(dt) {},
      dispose() { disposeDeep(mesh); },
    };
  }
  
  // Model-based template
  const tpl = template;
  const mesh = SkeletonUtils.clone(tpl.object);
  
  let muzzle = tpl.muzzle;
  if (!muzzle && tpl.spec?.muzzleOffset) {
    const muzzleObj = new THREE.Object3D();
    muzzleObj.position.set(...tpl.spec.muzzleOffset.map(v => v * tpl.scale));
    mesh.add(muzzleObj);
    muzzle = muzzleObj;
  }
  
  const mixer = new THREE.AnimationMixer(mesh);
  const actions = new Map();
  for (const [name, clip] of tpl.clips) {
    const action = mixer.clipAction(clip);
    actions.set(name, action);
  }
  
  let currentAction = null;
  function playAction(name, loop = THREE.LoopOnce) {
    const action = actions.get(name);
    if (!action) return null;
    if (currentAction) currentAction.fadeOut(0.1);
    action.reset().setLoop(loop).fadeIn(0.1).play();
    currentAction = action;
    return action;
  }
  
  return {
    mesh,
    mixer,
    playAction,
    update(dt) { mixer.update(dt); },
    getMuzzle() { return muzzle; },
    dispose() {
      mixer.uncacheRoot(mesh);
      disposeDeep(mesh);
    },
  };
}

export async function loadEnvCastOnce(fetchFn = fetch, base = 'assets/env/') {
  if (envTemplates) return envTemplates;
  return fetchEnvCast(fetchFn, base);
}

export function ensureEnvLoaded() {
  if (!envTemplates) return loadEnvCastOnce();
  return Promise.resolve(envTemplates);
}
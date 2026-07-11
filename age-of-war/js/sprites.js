class SpriteManager {
  constructor() {
    this.cache = {};
    this.size = 64;
    this.baseSize = 48;
  }

  getSprite(type, ageIndex) {
    const key = `${type}_${ageIndex}`;
    if (this.cache[key]) return this.cache[key];

    const base = document.createElement('canvas');
    base.width = this.baseSize;
    base.height = this.baseSize;
    const baseCtx = base.getContext('2d');
    baseCtx.imageSmoothingEnabled = false;
    if (type === 'hero') {
      this['draw_hero_' + ageIndex](baseCtx);
    } else {
      this['draw_' + type](baseCtx, ageIndex);
    }

    const c = document.createElement('canvas');
    c.width = this.size;
    c.height = this.size;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 0, 0, this.baseSize, this.baseSize, 0, 0, this.size, this.size);

    this.cache[key] = c;
    return c;
  }

  draw(ctx, type, ageIndex, x, y, facing, side) {
    const sprite = this.getSprite(type, ageIndex);
    const s = this.size;
    ctx.save();
    ctx.translate(x, y);
    if (facing === -1) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sprite, -s / 2, -s, s, s);
    if (side) {
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = side === 'player' ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.ENEMY;
      ctx.fillRect(-s / 2, -s, s, s);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ── Melee units (5 ages) ──
  draw_melee(ctx, age) {
    const s = this.rect.bind(this, ctx);
    if (age === 0) {
      // Clubman — caveman
      s(18, 4, 10, 10, '#D2B48C');   // head
      s(19, 5, 8, 4, '#c4a070');     // face
      s(20, 7, 3, 2, '#222');        // eyes
      s(25, 7, 3, 2, '#222');
      s(21, 8, 2, 1, '#c44');        // mouth
      s(17, 14, 12, 14, '#8B7355');  // torso
      s(18, 15, 10, 12, '#9a8365');  // torso highlight
      s(17, 28, 5, 10, '#7a6345');   // left leg
      s(24, 28, 5, 10, '#7a6345');   // right leg
      s(17, 34, 5, 4, '#5a4325');    // left foot
      s(24, 34, 5, 4, '#5a4325');    // right foot
      s(28, 14, 4, 12, '#8B7355');   // right arm
      s(29, 14, 3, 10, '#9a8365');   // arm highlight
      s(31, 6, 3, 10, '#6B4325');    // club handle
      s(29, 4, 7, 4, '#8a5520');     // club head
      s(30, 3, 5, 2, '#9a6530');     // club highlight
      s(16, 16, 3, 10, '#7a6345');   // left arm
    } else if (age === 1) {
      // Swordsman — knight
      s(18, 4, 10, 10, '#D2B48C');
      s(17, 2, 12, 4, '#777');       // helmet
      s(18, 3, 10, 2, '#888');       // helmet top
      s(20, 7, 2, 2, '#222');        // eyes
      s(25, 7, 2, 2, '#222');
      s(17, 14, 12, 14, '#555');     // chainmail
      s(18, 15, 10, 12, '#666');     // chainmail light
      s(19, 16, 8, 4, '#4444aa');    // tabard
      s(17, 28, 5, 10, '#444');      // left leg
      s(24, 28, 5, 10, '#444');      // right leg
      s(17, 34, 5, 4, '#333');       // feet
      s(24, 34, 5, 4, '#333');
      s(28, 14, 4, 12, '#666');      // right arm
      s(31, 6, 2, 12, '#ddd');       // sword blade
      s(32, 5, 1, 2, '#fff');        // blade tip
      s(30, 14, 4, 2, '#8B7355');    // crossguard
      s(16, 16, 3, 10, '#555');      // left arm
    } else if (age === 2) {
      // Dueler — fencer
      s(18, 4, 10, 10, '#D2B48C');
      s(16, 2, 14, 3, '#222');       // wide-brim hat
      s(17, 3, 12, 1, '#333');
      s(20, 7, 2, 2, '#222');
      s(25, 7, 2, 2, '#222');
      s(17, 14, 12, 14, '#8B6914');  // doublet
      s(18, 15, 10, 12, '#9a7924');  // highlight
      s(19, 17, 8, 3, '#6a4a10');    // belt
      s(17, 28, 5, 10, '#333');      // left leg
      s(24, 28, 5, 10, '#333');      // right leg
      s(17, 34, 5, 4, '#222');       // feet
      s(24, 34, 5, 4, '#222');
      s(28, 14, 4, 12, '#D2B48C');   // right arm
      s(31, 6, 1, 14, '#ccc');       // rapier
      s(32, 5, 1, 2, '#eee');        // tip
      s(30, 14, 3, 2, '#8B7355');    // hilt
      s(16, 16, 3, 10, '#D2B48C');   // left arm
    } else if (age === 3) {
      // Melee Infantry — modern soldier
      s(18, 5, 10, 9, '#D2B48C');    // head
      s(17, 3, 12, 4, '#4a5a2a');    // helmet
      s(18, 4, 10, 2, '#556B2F');
      s(20, 8, 2, 2, '#222');
      s(25, 8, 2, 2, '#222');
      s(17, 14, 12, 14, '#556B2F');  // uniform
      s(18, 15, 10, 12, '#607030');  // highlight
      s(19, 16, 8, 5, '#3a4a2a');    // vest
      s(17, 28, 5, 10, '#4a5a2a');   // legs
      s(24, 28, 5, 10, '#4a5a2a');
      s(17, 34, 5, 4, '#333');       // boots
      s(24, 34, 5, 4, '#333');
      s(28, 14, 4, 12, '#556B2F');   // arm
      s(30, 12, 10, 3, '#333');      // rifle
      s(30, 11, 8, 2, '#444');       // rifle top
      s(39, 12, 2, 2, '#555');       // muzzle
      s(16, 16, 3, 10, '#4a5a2a');   // left arm
    } else {
      // God's Blade — futuristic warrior
      s(18, 4, 10, 10, '#0a0a2a');   // head
      s(19, 5, 8, 4, '#1a1a3a');     // visor area
      s(20, 7, 6, 2, '#00e5ff');     // visor glow
      s(21, 6, 4, 1, '#66ffff');     // visor highlight
      s(17, 14, 12, 14, '#0a0a2a');  // armor
      s(18, 15, 10, 12, '#1a1a3a');  // armor mid
      s(19, 16, 8, 4, '#00e5ff');    // chest glow
      s(20, 17, 6, 2, '#66ffff');    // glow highlight
      s(17, 28, 5, 10, '#0a0a2a');   // legs
      s(24, 28, 5, 10, '#0a0a2a');
      s(17, 34, 5, 4, '#00e5ff');    // boots glow
      s(24, 34, 5, 4, '#00e5ff');
      s(28, 14, 4, 12, '#0a0a2a');   // arm
      s(31, 6, 3, 16, '#00e5ff');    // energy blade
      s(32, 5, 1, 3, '#aaffff');     // blade tip glow
      s(31, 7, 2, 1, '#88ffff');     // blade highlight
      s(16, 16, 3, 10, '#0a0a2a');   // left arm
    }
  }

  // ── Ranged units (5 ages) ──
  draw_ranged(ctx, age) {
    const s = this.rect.bind(this, ctx);
    if (age === 0) {
      // Slingshot man
      s(18, 4, 10, 10, '#D2B48C');
      s(20, 7, 3, 2, '#222');
      s(25, 7, 3, 2, '#222');
      s(17, 14, 12, 14, '#8B7355');
      s(18, 15, 10, 12, '#9a8365');
      s(17, 28, 5, 10, '#7a6345');
      s(24, 28, 5, 10, '#7a6345');
      s(17, 34, 5, 4, '#5a4325');
      s(24, 34, 5, 4, '#5a4325');
      s(28, 14, 4, 12, '#8B7355');   // arm
      s(32, 6, 2, 8, '#6B4325');     // fork handle
      s(33, 5, 1, 2, '#6B4325');     // fork left
      s(34, 5, 1, 2, '#6B4325');     // fork right
      s(32, 14, 2, 1, '#8a5520');    // band
      s(16, 16, 3, 10, '#7a6345');   // left arm
    } else if (age === 1) {
      // Archer
      s(18, 4, 10, 10, '#D2B48C');
      s(17, 2, 12, 4, '#2a5a2a');    // hood
      s(18, 3, 10, 2, '#3a6a3a');
      s(20, 7, 2, 2, '#222');
      s(25, 7, 2, 2, '#222');
      s(17, 14, 12, 14, '#2a5a2a');
      s(18, 15, 10, 12, '#3a6a3a');
      s(17, 28, 5, 10, '#2a4a2a');
      s(24, 28, 5, 10, '#2a4a2a');
      s(17, 34, 5, 4, '#1a3a1a');
      s(24, 34, 5, 4, '#1a3a1a');
      s(28, 14, 4, 12, '#2a5a2a');   // arm
      s(33, 6, 2, 16, '#8B6040');    // bow
      s(34, 12, 1, 4, '#8B6040');    // bow string
      s(32, 14, 2, 1, '#8B6040');    // arrow nock
      s(16, 16, 3, 10, '#2a4a2a');   // left arm
    } else if (age === 2) {
      // Musketeer
      s(18, 4, 10, 10, '#D2B48C');
      s(17, 2, 12, 3, '#222');       // hat
      s(20, 7, 2, 2, '#222');
      s(25, 7, 2, 2, '#222');
      s(17, 14, 12, 14, '#2a2a2a');
      s(18, 15, 10, 12, '#3a3a3a');
      s(19, 16, 8, 3, '#8B6914');    // gold trim
      s(17, 28, 5, 10, '#333');
      s(24, 28, 5, 10, '#333');
      s(17, 34, 5, 4, '#222');
      s(24, 34, 5, 4, '#222');
      s(28, 14, 4, 12, '#2a2a2a');
      s(30, 12, 12, 3, '#555');      // musket barrel
      s(30, 11, 10, 2, '#666');
      s(41, 12, 3, 2, '#444');       // muzzle
      s(16, 16, 3, 10, '#2a2a2a');
    } else if (age === 3) {
      // Infantry rifleman
      s(18, 5, 10, 9, '#D2B48C');
      s(17, 3, 12, 4, '#4a5a2a');
      s(20, 8, 2, 2, '#222');
      s(25, 8, 2, 2, '#222');
      s(17, 14, 12, 14, '#556B2F');
      s(18, 15, 10, 12, '#607030');
      s(19, 16, 8, 5, '#3a4a2a');
      s(17, 28, 5, 10, '#4a5a2a');
      s(24, 28, 5, 10, '#4a5a2a');
      s(17, 34, 5, 4, '#333');
      s(24, 34, 5, 4, '#333');
      s(28, 14, 4, 12, '#556B2F');
      s(30, 12, 12, 3, '#333');      // rifle
      s(30, 11, 10, 2, '#444');
      s(41, 12, 2, 2, '#555');       // muzzle
      s(16, 16, 3, 10, '#4a5a2a');
    } else {
      // Blaster — futuristic
      s(18, 4, 10, 10, '#0a0a2a');
      s(20, 7, 6, 2, '#00e5ff');
      s(17, 14, 12, 14, '#0a0a2a');
      s(18, 15, 10, 12, '#1a1a3a');
      s(19, 16, 8, 4, '#00e5ff');
      s(17, 28, 5, 10, '#0a0a2a');
      s(24, 28, 5, 10, '#0a0a2a');
      s(17, 34, 5, 4, '#00e5ff');
      s(24, 34, 5, 4, '#00e5ff');
      s(28, 14, 4, 12, '#0a0a2a');
      s(30, 12, 14, 3, '#00e5ff');   // energy barrel
      s(30, 11, 12, 2, '#66ffff');
      s(43, 12, 3, 3, '#00e5ff');    // energy tip
      s(44, 11, 1, 1, '#aaffff');
      s(16, 16, 3, 10, '#0a0a2a');
    }
  }

  // ── Fast units (5 ages) ──
  draw_fast(ctx, age) {
    const s = this.rect.bind(this, ctx);
    if (age === 0) {
      // Dino Rider
      // Dino body
      s(8, 16, 24, 10, '#3a8a1a');   // body
      s(10, 18, 20, 6, '#4a9a2a');   // body highlight
      s(4, 12, 8, 8, '#2a7a0a');     // head
      s(5, 14, 6, 4, '#3a8a1a');     // head mid
      s(6, 14, 2, 2, '#fff');        // eye
      s(5, 18, 3, 2, '#2a7a0a');     // jaw
      s(6, 20, 2, 1, '#fff');        // teeth
      s(10, 26, 4, 10, '#2a6a0a');   // front legs
      s(12, 26, 4, 10, '#2a6a0a');
      s(10, 34, 4, 3, '#1a5a00');    // front feet
      s(12, 34, 4, 3, '#1a5a00');
      s(24, 26, 4, 10, '#2a6a0a');   // back legs
      s(26, 26, 4, 10, '#2a6a0a');
      s(24, 34, 4, 3, '#1a5a00');
      s(26, 34, 4, 3, '#1a5a00');
      s(28, 16, 8, 4, '#3a8a1a');    // tail
      s(34, 17, 4, 3, '#2a7a0a');
      s(36, 18, 2, 2, '#2a7a0a');
      // Rider
      s(14, 6, 8, 10, '#D2B48C');    // body
      s(15, 6, 6, 8, '#e2c49c');     // highlight
      s(15, 2, 6, 5, '#8B7355');     // head
      s(16, 3, 4, 2, '#222');        // eyes
    } else if (age === 1) {
      // Knight on horse
      // Horse
      s(6, 16, 26, 10, '#8B6535');   // body
      s(8, 18, 22, 6, '#9a7545');    // highlight
      s(2, 12, 8, 8, '#6B4525');     // head
      s(3, 14, 6, 3, '#7a5535');
      s(4, 14, 2, 2, '#222');        // eye
      s(3, 19, 4, 2, '#5a3515');     // muzzle
      s(6, 26, 4, 10, '#6B4525');    // front legs
      s(8, 26, 4, 10, '#6B4525');
      s(6, 34, 4, 3, '#4a2505');
      s(8, 34, 4, 3, '#4a2505');
      s(26, 26, 4, 10, '#6B4525');   // back legs
      s(28, 26, 4, 10, '#6B4525');
      s(26, 34, 4, 3, '#4a2505');
      s(28, 34, 4, 3, '#4a2505');
      s(30, 14, 6, 4, '#7a5535');    // tail
      s(34, 14, 3, 3, '#6a4525');
      // Rider
      s(12, 4, 8, 12, '#555');       // armor
      s(13, 4, 6, 10, '#666');       // armor highlight
      s(13, 0, 6, 5, '#777');        // helmet
      s(14, 1, 4, 2, '#888');
      s(14, 4, 2, 1, '#4444aa');     // plume
      s(20, 6, 3, 8, '#aaa');        // sword arm
      s(21, 4, 1, 3, '#ddd');        // sword
    } else if (age === 2) {
      // Renaissance horse with rider
      s(6, 16, 26, 10, '#7a5a10');   // body
      s(8, 18, 22, 6, '#8a6a20');    // highlight
      s(2, 12, 8, 8, '#5a3a00');     // head
      s(3, 14, 6, 3, '#6a4a10');
      s(4, 14, 2, 2, '#222');
      s(6, 26, 4, 10, '#5a3a00');
      s(8, 26, 4, 10, '#5a3a00');
      s(6, 34, 4, 3, '#4a2a00');
      s(8, 34, 4, 3, '#4a2a00');
      s(26, 26, 4, 10, '#5a3a00');
      s(28, 26, 4, 10, '#5a3a00');
      s(26, 34, 4, 3, '#4a2a00');
      s(28, 34, 4, 3, '#4a2a00');
      s(30, 14, 6, 4, '#6a4a10');    // tail
      // Rider
      s(12, 4, 8, 12, '#8B6914');
      s(13, 4, 6, 10, '#9a7924');
      s(13, 0, 6, 5, '#222');
      s(14, 1, 4, 2, '#333');
      s(14, 3, 2, 1, '#8B6914');     // plume
      s(20, 6, 3, 8, '#8B6914');
    } else if (age === 3) {
      // Helicopter
      s(6, 14, 26, 10, '#4a5a2a');   // body
      s(8, 16, 22, 6, '#556B2F');    // body highlight
      s(2, 16, 6, 6, '#6a8a4f');     // cockpit
      s(3, 17, 4, 3, '#aaddff');     // glass
      s(4, 18, 2, 1, '#ccffff');     // glass highlight
      s(14, 10, 12, 4, '#333');      // rotor bar
      s(18, 8, 4, 3, '#444');        // rotor hub
      s(19, 7, 2, 1, '#555');
      s(28, 16, 8, 4, '#4a5a2a');    // tail boom
      s(34, 14, 4, 4, '#333');       // tail rotor
      s(35, 15, 2, 2, '#444');
      s(10, 24, 3, 4, '#333');       // skids
      s(24, 24, 3, 4, '#333');
      s(8, 28, 20, 1, '#444');       // skid bar
    } else {
      // Hover vehicle
      s(4, 14, 28, 10, '#1a2a4a');   // body
      s(6, 16, 24, 6, '#2a3a5a');    // body highlight
      s(2, 16, 4, 6, '#00e5ff');     // front glow
      s(3, 17, 2, 4, '#66ffff');
      s(30, 16, 4, 6, '#ff4444');    // rear glow
      s(31, 17, 2, 4, '#ff8888');
      s(10, 12, 10, 4, '#2a3a6a');   // canopy
      s(11, 13, 8, 2, '#88ccff');    // glass
      s(12, 12, 4, 1, '#00e5ff');    // antenna
      s(13, 10, 2, 2, '#00e5ff');
      s(8, 24, 4, 2, '#00e5ff');     // hover glow
      s(18, 24, 4, 2, '#00e5ff');
      s(28, 24, 4, 2, '#00e5ff');
      s(6, 26, 28, 1, '#00e5ff');    // hover bar
      s(8, 27, 24, 1, 'rgba(0,229,255,0.3)'); // glow below
    }
  }

  // ── Siege: Cannoneer (Renaissance) ──
  draw_siege(ctx) {
    const s = this.rect.bind(this, ctx);
    // Cannon on wheeled cart
    s(4, 16, 30, 8, '#666');         // barrel
    s(6, 17, 26, 6, '#777');        // barrel highlight
    s(32, 17, 4, 5, '#444');        // muzzle
    s(33, 18, 2, 3, '#333');
    s(4, 12, 16, 8, '#8B6914');     // mount
    s(6, 13, 12, 6, '#9a7924');     // mount highlight
    s(6, 24, 6, 6, '#333');         // left wheel
    s(7, 25, 4, 4, '#444');
    s(8, 26, 2, 2, '#555');
    s(18, 24, 6, 6, '#333');        // right wheel
    s(19, 25, 4, 4, '#444');
    s(20, 26, 2, 2, '#555');
    s(28, 24, 6, 6, '#333');        // rear wheel
    s(29, 25, 4, 4, '#444');
    s(30, 26, 2, 2, '#555');
    s(4, 10, 2, 4, '#ff6600');      // fuse
    s(3, 8, 3, 3, '#ff4400');       // flame
    s(4, 7, 1, 2, '#ffaa00');
  }

  // ── Armored units (Modern + Future) ──
  draw_armored(ctx, age) {
    const s = this.rect.bind(this, ctx);
    if (age === 3) {
      // Modern tank
      s(2, 18, 36, 12, '#4a5a2a');   // hull
      s(4, 20, 32, 8, '#556B2F');    // hull highlight
      s(10, 8, 16, 12, '#3a4a2a');   // turret
      s(12, 10, 12, 8, '#4a5a2a');   // turret mid
      s(16, 5, 6, 4, '#556B2F');     // cupola
      s(17, 6, 4, 2, '#607030');
      s(24, 12, 14, 3, '#333');      // barrel
      s(24, 11, 12, 2, '#444');      // barrel top
      s(37, 12, 3, 2, '#555');       // muzzle brake
      s(2, 30, 8, 4, '#2a2a2a');     // treads
      s(12, 30, 8, 4, '#2a2a2a');
      s(22, 30, 8, 4, '#2a2a2a');
      s(32, 30, 8, 4, '#2a2a2a');
      s(3, 31, 6, 2, '#3a3a3a');     // tread detail
      s(13, 31, 6, 2, '#3a3a3a');
      s(23, 31, 6, 2, '#3a3a3a');
      s(33, 31, 6, 2, '#3a3a3a');
    } else {
      // Future War Machine — mech
      s(4, 14, 28, 14, '#0a1a3a');   // hull
      s(6, 16, 24, 10, '#1a2a4a');   // hull mid
      s(8, 18, 20, 6, '#2a3a5a');    // hull light
      s(10, 6, 14, 12, '#0a1a3a');   // turret
      s(12, 8, 10, 8, '#1a2a4a');    // turret mid
      s(13, 3, 8, 4, '#00e5ff');     // sensor array
      s(14, 4, 6, 2, '#66ffff');
      s(22, 10, 16, 4, '#00e5ff');   // energy barrel
      s(22, 9, 14, 2, '#66ffff');
      s(37, 10, 3, 3, '#aaffff');    // barrel tip glow
      s(6, 28, 6, 4, '#00e5ff');     // hover pads
      s(18, 28, 6, 4, '#00e5ff');
      s(30, 28, 6, 4, '#00e5ff');
      s(7, 32, 4, 1, '#66ffff');     // pad glow
      s(19, 32, 4, 1, '#66ffff');
      s(31, 32, 4, 1, '#66ffff');
      s(5, 33, 28, 1, 'rgba(0,229,255,0.3)'); // ground glow
    }
  }

  // ── Hero sprites (5 ages) ──
  draw_hero_0(ctx) {
    const s = this.rect.bind(this, ctx);
    // Shaman — larger caveman with headdress
    s(16, 2, 14, 12, '#D2B48C');    // head
    s(17, 3, 12, 6, '#c4a070');     // face
    s(18, 5, 4, 2, '#222');         // eyes
    s(24, 5, 4, 2, '#222');
    s(19, 7, 3, 1, '#c44');         // mouth
    s(14, 0, 18, 3, '#ff4400');     // feather headdress
    s(16, -1, 2, 4, '#ff6600');
    s(22, -1, 2, 4, '#ffaa00');
    s(28, -1, 2, 4, '#ff4400');
    s(14, 14, 18, 14, '#8B6040');   // torso
    s(16, 15, 14, 12, '#9a7050');   // torso highlight
    s(18, 16, 10, 4, '#ff6600');    // mystical marking
    s(14, 28, 6, 10, '#7a5030');    // left leg
    s(26, 28, 6, 10, '#7a5030');    // right leg
    s(14, 34, 6, 4, '#5a3020');     // feet
    s(26, 34, 6, 4, '#5a3020');
    s(32, 14, 5, 14, '#6B4020');    // right arm (staff)
    s(34, 4, 3, 12, '#8B5030');     // staff
    s(34, 2, 4, 4, '#ff6600');      // staff orb glow
    s(35, 3, 2, 2, '#ffaa00');      // orb highlight
    s(12, 16, 4, 10, '#7a5030');    // left arm
  }

  draw_hero_1(ctx) {
    const s = this.rect.bind(this, ctx);
    // Paladin — armored knight with shield
    s(17, 3, 12, 10, '#D2B48C');    // head
    s(15, 1, 16, 5, '#aaa');        // full helm
    s(17, 2, 12, 3, '#ccc');        // helm highlight
    s(19, 5, 3, 2, '#222');         // eye slit
    s(25, 5, 3, 2, '#222');
    s(14, 13, 18, 15, '#999');      // plate armor
    s(16, 14, 14, 13, '#bbb');      // armor highlight
    s(19, 15, 8, 4, '#4444aa');     // blue tabard
    s(20, 16, 6, 2, '#6666cc');     // tabard light
    s(14, 28, 6, 10, '#777');       // legs
    s(26, 28, 6, 10, '#777');
    s(14, 34, 6, 4, '#555');        // boots
    s(26, 34, 6, 4, '#555');
    s(32, 13, 5, 14, '#aaa');       // right arm
    s(34, 3, 3, 14, '#ddd');        // sword
    s(35, 2, 1, 2, '#fff');         // tip
    s(32, 13, 3, 3, '#8B7355');     // crossguard
    s(6, 14, 8, 12, '#4444aa');     // shield
    s(7, 15, 6, 10, '#5555bb');     // shield mid
    s(9, 17, 2, 6, '#ffd700');      // shield cross
    s(8, 19, 4, 2, '#ffd700');
  }

  draw_hero_2(ctx) {
    const s = this.rect.bind(this, ctx);
    // War Engineer — person with large cannon device
    s(17, 3, 12, 10, '#D2B48C');
    s(15, 1, 16, 4, '#5a3a00');     // wide hat
    s(16, 2, 14, 2, '#6a4a10');
    s(19, 5, 3, 2, '#222');
    s(25, 5, 3, 2, '#222');
    s(14, 13, 18, 15, '#5a4a30');   // coat
    s(16, 14, 14, 13, '#6a5a40');
    s(18, 16, 10, 3, '#8B6914');    // gold belt
    s(14, 28, 6, 10, '#3a3a2a');    // legs
    s(26, 28, 6, 10, '#3a3a2a');
    s(14, 34, 6, 4, '#2a2a1a');
    s(26, 34, 6, 4, '#2a2a1a');
    // Backpack cannon
    s(32, 10, 12, 8, '#555');
    s(34, 11, 8, 6, '#666');
    s(42, 12, 4, 4, '#444');        // barrel
    s(44, 13, 2, 2, '#ff6600');     // fuse glow
    s(6, 14, 8, 10, '#5a4a30');     // left arm
    s(2, 18, 5, 4, '#8B6914');      // tool belt
  }

  draw_hero_3(ctx) {
    const s = this.rect.bind(this, ctx);
    // Commander — officer with radio
    s(18, 5, 10, 9, '#D2B48C');
    s(16, 2, 14, 5, '#2a3a2a');     // officer cap
    s(17, 3, 12, 3, '#3a4a3a');
    s(19, 4, 4, 1, '#ffd700');      // cap badge
    s(20, 8, 2, 2, '#222');
    s(25, 8, 2, 2, '#222');
    s(14, 14, 18, 14, '#3a4a2a');   // uniform
    s(16, 15, 14, 12, '#4a5a3a');
    s(19, 15, 8, 4, '#ffd700');     // medals
    s(20, 16, 6, 2, '#ff4444');     // ribbon
    s(14, 28, 6, 10, '#2a3a1a');    // legs
    s(26, 28, 6, 10, '#2a3a1a');
    s(14, 34, 6, 4, '#1a2a1a');     // boots
    s(26, 34, 6, 4, '#1a2a1a');
    s(32, 14, 5, 12, '#3a4a2a');    // right arm
    s(34, 10, 4, 6, '#333');        // radio
    s(35, 8, 2, 3, '#444');         // antenna
    s(35, 6, 2, 2, '#ff4444');      // antenna light
    s(8, 16, 6, 8, '#3a4a2a');      // left arm (pointing)
    s(2, 16, 7, 3, '#3a4a2a');
  }

  draw_hero_4(ctx) {
    const s = this.rect.bind(this, ctx);
    // Titan — massive mech
    s(14, 2, 18, 12, '#0a1a3a');    // head
    s(16, 4, 14, 8, '#1a2a4a');     // head mid
    s(18, 5, 10, 4, '#00e5ff');     // visor
    s(19, 4, 8, 1, '#66ffff');      // visor highlight
    s(20, 6, 6, 1, '#aaffff');
    s(10, 14, 26, 16, '#0a1a3a');   // torso
    s(12, 16, 22, 12, '#1a2a4a');   // torso mid
    s(14, 17, 18, 6, '#00e5ff');    // core
    s(16, 18, 14, 4, '#66ffff');    // core glow
    s(18, 19, 10, 2, '#aaffff');    // core highlight
    s(10, 30, 8, 10, '#0a1a3a');    // left leg
    s(12, 32, 4, 8, '#1a2a4a');
    s(28, 30, 8, 10, '#0a1a3a');    // right leg
    s(30, 32, 4, 8, '#1a2a4a');
    s(10, 38, 8, 4, '#00e5ff');     // boots
    s(28, 38, 8, 4, '#00e5ff');
    // Massive arms
    s(0, 14, 12, 6, '#0a1a3a');     // left arm
    s(1, 15, 10, 4, '#1a2a4a');
    s(-4, 12, 6, 10, '#ff3333');    // left blade
    s(-3, 13, 4, 8, '#ff6666');
    s(34, 14, 12, 6, '#0a1a3a');    // right arm
    s(35, 15, 10, 4, '#1a2a4a');
    s(44, 12, 6, 10, '#ff3333');    // right blade
    s(45, 13, 4, 8, '#ff6666');
    // Head crest
    s(18, -2, 8, 4, '#00e5ff');
    s(20, -3, 4, 2, '#66ffff');
  }

  // ── Elite: Super Soldier (Future) ──
  draw_elite(ctx) {
    const s = this.rect.bind(this, ctx);
    // Large dual-wielding warrior
    s(16, 2, 14, 12, '#0a0a2a');     // head
    s(17, 3, 12, 8, '#1a1a3a');      // face
    s(18, 5, 10, 3, '#00e5ff');      // visor
    s(19, 4, 8, 1, '#66ffff');       // visor highlight
    s(20, 6, 6, 1, '#aaffff');       // visor center glow
    s(14, 14, 18, 14, '#0a0a2a');    // torso
    s(16, 16, 14, 10, '#1a1a3a');    // torso mid
    s(18, 17, 10, 5, '#00e5ff');     // chest core
    s(19, 18, 8, 3, '#66ffff');      // core glow
    s(20, 19, 6, 1, '#aaffff');      // core highlight
    s(14, 28, 7, 12, '#0a0a2a');     // left leg
    s(15, 30, 5, 8, '#1a1a3a');      // left leg mid
    s(25, 28, 7, 12, '#0a0a2a');     // right leg
    s(26, 30, 5, 8, '#1a1a3a');      // right leg mid
    s(14, 36, 7, 4, '#00e5ff');      // left boots
    s(25, 36, 7, 4, '#00e5ff');      // right boots
    // Arms
    s(6, 14, 10, 4, '#0a0a2a');      // left arm
    s(7, 15, 8, 2, '#1a1a3a');
    s(30, 14, 10, 4, '#0a0a2a');     // right arm
    s(31, 15, 8, 2, '#1a1a3a');
    // Energy blades
    s(1, 8, 6, 8, '#ff3333');        // left blade
    s(2, 9, 4, 6, '#ff6666');        // left blade mid
    s(3, 10, 2, 4, '#ff9999');       // left blade glow
    s(39, 8, 6, 8, '#ff3333');       // right blade
    s(40, 9, 4, 6, '#ff6666');       // right blade mid
    s(41, 10, 2, 4, '#ff9999');      // right blade glow
    // Blade tips
    s(0, 7, 2, 2, '#ffaaaa');
    s(44, 7, 2, 2, '#ffaaaa');
    // Head crest
    s(20, 0, 6, 3, '#00e5ff');
    s(21, 0, 4, 1, '#66ffff');
  }
}

const spriteManager = new SpriteManager();

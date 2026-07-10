class SpriteManager {
  constructor() {
    this.cache = {};
    this.scale = 1.5;
    this.size = 32;
  }

  getSprite(type, ageIndex) {
    const key = `${type}_${ageIndex}`;
    if (this.cache[key]) return this.cache[key];

    const c = document.createElement('canvas');
    c.width = this.size;
    c.height = this.size;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    this['draw_' + type](ctx, ageIndex);

    this.cache[key] = c;
    return c;
  }

  draw(ctx, type, ageIndex, x, y, facing) {
    const sprite = this.getSprite(type, ageIndex);
    const s = this.size * this.scale;
    ctx.save();
    ctx.translate(x, y);
    if (facing === -1) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sprite, -s / 2, -s, s, s);
    ctx.restore();
  }

  px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ── Stone Age melee: Clubman ──
  draw_melee(ctx, age) {
    const s = this.rect.bind(this, ctx);
    const p = this.px.bind(this, ctx);
    if (age === 0) {
      // Clubman: caveman with club
      s(13, 2, 6, 6, '#D2B48C');   // head
      s(14, 3, 4, 3, '#000');      // eyes
      p(14, 4, '#fff'); p(17, 4, '#fff');
      s(12, 8, 8, 10, '#8B7355');  // torso
      s(12, 18, 3, 8, '#8B7355');  // left leg
      s(17, 18, 3, 8, '#8B7355');  // right leg
      s(10, 19, 2, 6, '#6B5335');  // left foot
      s(19, 19, 2, 6, '#6B5335'); // right foot
      s(20, 8, 2, 10, '#8B7355'); // right arm
      s(21, 3, 2, 6, '#6B5335');  // club handle
      s(20, 1, 4, 3, '#8B6535');  // club head
    } else if (age === 1) {
      // Swordsman: armored warrior with sword
      s(13, 2, 6, 6, '#D2B48C');
      s(13, 1, 6, 2, '#888');      // helmet
      s(12, 8, 8, 10, '#666');     // chainmail
      s(13, 9, 6, 3, '#4444aa');   // tabard
      s(12, 18, 3, 8, '#555');
      s(17, 18, 3, 8, '#555');
      s(10, 19, 2, 6, '#444');
      s(19, 19, 2, 6, '#444');
      s(20, 9, 2, 9, '#C0C0C0');  // arm
      s(22, 3, 1, 8, '#C0C0C0');  // sword blade
      s(21, 3, 3, 1, '#8B7355');  // crossguard
    } else if (age === 2) {
      // Dueler: renaissance fencer
      s(13, 2, 6, 6, '#D2B48C');
      s(12, 1, 8, 2, '#333');      // hat
      s(12, 8, 8, 10, '#8B6914');  // doublet
      s(13, 9, 6, 3, '#5a4a10');
      s(12, 18, 3, 8, '#444');
      s(17, 18, 3, 8, '#444');
      s(10, 19, 2, 6, '#333');
      s(19, 19, 2, 6, '#333');
      s(20, 8, 2, 10, '#D2B48C');
      s(22, 2, 1, 9, '#C0C0C0');  // rapier
      s(21, 2, 1, 2, '#8B7355');  // hilt
    } else if (age === 3) {
      // Melee Infantry: modern soldier
      s(13, 3, 6, 5, '#D2B48C');   // head
      s(12, 2, 8, 2, '#556B2F');   // helmet
      s(12, 8, 8, 10, '#556B2F');  // uniform
      s(14, 9, 4, 3, '#3a4a2a');   // vest
      s(12, 18, 3, 8, '#4a5a2a');
      s(17, 18, 3, 8, '#4a5a2a');
      s(10, 22, 2, 4, '#333');
      s(19, 22, 2, 4, '#333');
      s(20, 9, 6, 2, '#333');      // rifle
      s(20, 8, 2, 3, '#556B2F');
    } else {
      // God's Blade: futuristic warrior with energy blade
      s(13, 3, 6, 5, '#1a1a3a');   // head
      s(14, 4, 4, 3, '#00e5ff');   // visor glow
      s(12, 8, 8, 10, '#1a1a3a');  // armor
      s(13, 9, 6, 3, '#00e5ff');   // chest glow
      s(12, 18, 3, 8, '#1a1a3a');
      s(17, 18, 3, 8, '#1a1a3a');
      s(10, 22, 2, 4, '#00e5ff');
      s(19, 22, 2, 4, '#00e5ff');
      s(20, 6, 2, 12, '#00e5ff');  // blade
      s(20, 5, 1, 2, '#fff');      // blade tip glow
      s(21, 4, 1, 2, '#00e5ff');
    }
  }

  // ── Stone Age ranged: Slingshot ──
  draw_ranged(ctx, age) {
    const s = this.rect.bind(this, ctx);
    const p = this.px.bind(this, ctx);
    if (age === 0) {
      // Slingshot: caveman with slingshot
      s(13, 3, 6, 5, '#D2B48C');
      s(14, 4, 4, 3, '#000');
      p(14, 5, '#fff'); p(17, 5, '#fff');
      s(12, 8, 8, 10, '#8B7355');
      s(12, 18, 3, 8, '#8B7355');
      s(17, 18, 3, 8, '#8B7355');
      s(10, 19, 2, 6, '#6B5335');
      s(19, 19, 2, 6, '#6B5335');
      s(20, 8, 2, 8, '#8B7355');
      s(22, 4, 1, 4, '#6B5335');  // slingshot fork
      s(23, 4, 1, 1, '#6B5335');
      s(21, 8, 2, 1, '#8B7355');  // band
    } else if (age === 1) {
      // Archer: hooded archer
      s(13, 3, 6, 5, '#D2B48C');
      s(12, 2, 8, 2, '#2a5a2a');   // hood
      s(14, 4, 4, 3, '#000');
      s(12, 8, 8, 10, '#2a5a2a');
      s(12, 18, 3, 8, '#2a4a2a');
      s(17, 18, 3, 8, '#2a4a2a');
      s(10, 19, 2, 6, '#1a3a1a');
      s(19, 19, 2, 6, '#1a3a1a');
      s(20, 8, 1, 10, '#8B7355'); // bow
      s(21, 4, 1, 6, '#8B7355');
      s(21, 10, 1, 1, '#8B7355'); // arrow notch
    } else if (age === 2) {
      // Musketeer: renaissance gunman
      s(13, 3, 6, 5, '#D2B48C');
      s(12, 2, 8, 2, '#333');
      s(12, 8, 8, 10, '#333');
      s(14, 9, 4, 3, '#8B6914');
      s(12, 18, 3, 8, '#444');
      s(17, 18, 3, 8, '#444');
      s(10, 19, 2, 6, '#333');
      s(19, 19, 2, 6, '#333');
      s(20, 8, 8, 2, '#666');     // musket barrel
      s(20, 7, 2, 4, '#8B7355');
    } else if (age === 3) {
      // Infantry: modern rifleman
      s(13, 3, 6, 5, '#D2B48C');
      s(12, 2, 8, 2, '#556B2F');
      s(12, 8, 8, 10, '#556B2F');
      s(14, 9, 4, 3, '#3a4a2a');
      s(12, 18, 3, 8, '#4a5a2a');
      s(17, 18, 3, 8, '#4a5a2a');
      s(10, 22, 2, 4, '#333');
      s(19, 22, 2, 4, '#333');
      s(20, 8, 8, 2, '#333');
      s(20, 7, 2, 4, '#556B2F');
      s(28, 8, 1, 1, '#ff6600'); // muzzle flash ready
    } else {
      // Blaster: futuristic energy gunner
      s(13, 3, 6, 5, '#1a1a3a');
      s(14, 4, 4, 3, '#00e5ff');
      s(12, 8, 8, 10, '#1a1a3a');
      s(13, 9, 6, 3, '#00e5ff');
      s(12, 18, 3, 8, '#1a1a3a');
      s(17, 18, 3, 8, '#1a1a3a');
      s(10, 22, 2, 4, '#00e5ff');
      s(19, 22, 2, 4, '#00e5ff');
      s(20, 8, 10, 2, '#00e5ff');
      s(20, 7, 2, 4, '#1a1a3a');
      s(30, 8, 1, 1, '#00e5ff'); // energy tip
    }
  }

  // ── Fast units: Dino Rider, Knight, horse, heli, hover ──
  draw_fast(ctx, age) {
    const s = this.rect.bind(this, ctx);
    if (age === 0) {
      // Dino Rider: green dinosaur
      s(10, 10, 16, 8, '#4a8a2a');   // body
      s(6, 8, 6, 6, '#3a7a1a');      // head
      s(5, 9, 2, 2, '#fff');         // eye
      s(8, 16, 3, 8, '#3a6a1a');     // front legs
      s(19, 16, 3, 8, '#3a6a1a');    // back legs
      s(24, 12, 5, 3, '#4a8a2a');    // tail
      s(28, 13, 3, 2, '#3a7a1a');
      // rider
      s(12, 4, 5, 6, '#D2B48C');
      s(12, 2, 5, 3, '#8B7355');
      s(13, 2, 3, 2, '#000');
    } else if (age === 1) {
      // Knight on horse
      s(8, 10, 16, 8, '#8B7355');    // horse body
      s(4, 8, 6, 6, '#6B5335');      // horse head
      s(4, 9, 2, 2, '#000');
      s(8, 18, 3, 8, '#6B5335');     // horse legs
      s(19, 18, 3, 8, '#6B5335');
      s(22, 12, 5, 3, '#8B7355');    // horse tail
      // rider
      s(11, 2, 6, 8, '#666');        // armor
      s(12, 0, 4, 3, '#888');        // helmet
      s(12, 1, 2, 1, '#4444aa');     // plume
      s(18, 4, 2, 6, '#C0C0C0');    // sword arm
    } else if (age === 2) {
      // Renaissance horse
      s(8, 10, 16, 8, '#8B6914');
      s(4, 8, 6, 6, '#6B5510');
      s(4, 9, 2, 2, '#000');
      s(8, 18, 3, 8, '#6B5510');
      s(19, 18, 3, 8, '#6B5510');
      s(22, 12, 5, 3, '#8B6914');
      s(11, 2, 6, 8, '#8B6914');
      s(12, 0, 4, 3, '#333');
      s(13, 1, 2, 1, '#8B6914');
    } else if (age === 3) {
      // Helicopter
      s(8, 10, 16, 8, '#556B2F');    // body
      s(4, 11, 5, 5, '#7a9a4f');     // cockpit
      s(5, 12, 3, 2, '#aaddff');     // glass
      s(10, 8, 10, 2, '#444');       // rotor bar
      s(14, 6, 2, 2, '#333');        // rotor hub
      s(22, 14, 6, 2, '#556B2F');    // tail boom
      s(27, 12, 3, 3, '#333');       // tail rotor
      s(12, 18, 2, 4, '#333');       // skids
      s(18, 18, 2, 4, '#333');
    } else {
      // Hover vehicle
      s(6, 10, 20, 8, '#1a3a5a');    // body
      s(4, 11, 4, 5, '#00e5ff');     // glow front
      s(24, 11, 4, 5, '#ff4444');    // glow rear
      s(10, 8, 8, 2, '#2a4a6a');     // canopy
      s(12, 6, 4, 2, '#00e5ff');     // antenna glow
      s(8, 18, 3, 2, '#00e5ff');     // hover glow
      s(16, 18, 3, 2, '#00e5ff');
      s(10, 20, 12, 1, '#00e5ff');
    }
  }

  // ── Siege: Cannoneer (Renaissance) ──
  draw_siege(ctx) {
    const s = this.rect.bind(this, ctx);
    // Cannon on wheels
    s(6, 12, 20, 6, '#8B6914');     // barrel mount
    s(4, 14, 24, 4, '#666');        // barrel
    s(26, 13, 4, 3, '#444');        // muzzle
    s(8, 18, 4, 4, '#333');         // left wheel
    s(12, 18, 4, 4, '#333');        // right wheel
    s(20, 18, 4, 4, '#333');
    s(9, 19, 2, 2, '#555');
    s(13, 19, 2, 2, '#555');
    s(21, 19, 2, 2, '#555');
    // fuse
    s(6, 10, 1, 3, '#ff6600');
    s(5, 9, 2, 2, '#ff4400');
  }

  // ── Armored: Tank (Modern), War Machine (Future) ──
  draw_armored(ctx, age) {
    const s = this.rect.bind(this, ctx);
    if (age === 3) {
      // Modern Tank
      s(4, 12, 24, 8, '#556B2F');    // hull
      s(8, 6, 12, 8, '#4a5a2a');     // turret
      s(12, 4, 4, 3, '#556B2F');     // cupola
      s(18, 8, 12, 3, '#333');       // barrel
      s(4, 20, 6, 3, '#333');        // left tread
      s(14, 20, 6, 3, '#333');       // right tread
      s(22, 20, 6, 3, '#333');
      s(5, 21, 4, 1, '#555');        // tread detail
      s(15, 21, 4, 1, '#555');
      s(23, 21, 4, 1, '#555');
    } else {
      // Future War Machine
      s(4, 10, 24, 10, '#1a3a5a');   // hull
      s(8, 4, 12, 8, '#1a2a4a');     // turret
      s(10, 2, 8, 3, '#00e5ff');     // sensor array
      s(18, 6, 14, 3, '#00e5ff');    // energy barrel
      s(4, 20, 6, 3, '#00e5ff');     // hover pads
      s(14, 20, 6, 3, '#00e5ff');
      s(22, 20, 6, 3, '#00e5ff');
      s(6, 23, 4, 1, '#00e5ff');
      s(16, 23, 4, 1, '#00e5ff');
      s(24, 23, 4, 1, '#00e5ff');
    }
  }

  // ── Elite: Super Soldier (Future) ──
  draw_elite(ctx) {
    const s = this.rect.bind(this, ctx);
    // Dual-wielding energy warrior
    s(12, 2, 8, 6, '#1a1a3a');      // head
    s(13, 3, 6, 3, '#00e5ff');      // visor
    s(11, 8, 10, 10, '#1a1a3a');    // torso
    s(13, 9, 6, 3, '#00e5ff');      // chest core
    s(11, 18, 4, 8, '#1a1a3a');     // left leg
    s(17, 18, 4, 8, '#1a1a3a');     // right leg
    s(9, 22, 2, 4, '#00e5ff');
    s(19, 22, 2, 4, '#00e5ff');
    s(6, 8, 5, 2, '#1a1a3a');       // left arm
    s(21, 8, 5, 2, '#1a1a3a');      // right arm
    s(2, 6, 4, 3, '#ff4444');       // left blade
    s(26, 6, 4, 3, '#ff4444');      // right blade
    s(1, 5, 2, 1, '#ff8888');       // glow
    s(29, 5, 2, 1, '#ff8888');
    s(14, 1, 4, 1, '#00e5ff');      // head crest
  }
}

const spriteManager = new SpriteManager();

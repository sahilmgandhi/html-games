class SpriteManager {
    constructor() {
        this.cache = new Map();
        this.renderSize = 256;
        this.displaySize = 160;
    }

    getKey(type, ageIndex, side) {
        return `${type}_${ageIndex}_${side || 'none'}_${this.renderSize}`;
    }

    draw(ctx, type, ageIndex, x, y, facingRight, side) {
        const key = this.getKey(type, ageIndex, side);
        let entry = this.cache.get(key);
        if (!entry) {
            entry = { canvas: null };
            this.cache.set(key, entry);
        }

        if (!entry.canvas) {
            const offscreen = document.createElement('canvas');
            offscreen.width = this.renderSize;
            offscreen.height = this.renderSize;
            const oc = offscreen.getContext('2d');
            this.drawSprite(oc, type, ageIndex, side);
            entry.canvas = offscreen;
        }

        const dw = this.displaySize;
        const dh = this.displaySize;

        ctx.save();
        if (facingRight <= 0) {
            ctx.translate(x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(entry.canvas, -dw / 2, y - dh + 2, dw, dh);
        } else {
            ctx.drawImage(entry.canvas, x - dw / 2, y - dh + 2, dw, dh);
        }
        ctx.restore();
    }

    drawSprite(ctx, type, ageIndex, side) {
        const s = this.renderSize;
        const cx = s / 2;
        const team = side || 'player';
        const ta = team === 'player'
            ? { accent: '#3a78c2', dark: '#235089', light: '#7fc0ff', cape: '#2b5a96' }
            : { accent: '#c23a3a', dark: '#8a2626', light: '#ff8a7a', cape: '#96302b' };

        // Per-age clothing/armor palette (team color is only a small sash/crest)
        const AP = [
            { cloth: '#8a6a3a', clothDark: '#5e4422', clothLight: '#a9864e', metal: '#9a7a4a', metalDark: '#5e4422', skin: '#e8b894' },
            { cloth: '#7a8290', clothDark: '#4e5560', clothLight: '#9aa2b0', metal: '#c2c6ce', metalDark: '#7a7e86', skin: '#ecbf9a' },
            { cloth: '#3a5e9a', clothDark: '#26406e', clothLight: '#5a7eba', metal: '#caa24e', metalDark: '#8a6e2e', skin: '#e8b894' },
            { cloth: '#5e6e3e', clothDark: '#3e4a26', clothLight: '#7a8a52', metal: '#4a4a3a', metalDark: '#2a2a1a', skin: '#e0b088' },
            { cloth: '#2a2c3c', clothDark: '#16181e', clothLight: '#3a3c50', metal: '#3a3c58', metalDark: '#1a1c28', skin: '#d8b090' },
        ];
        const ap = AP[Math.max(0, Math.min(4, ageIndex))];

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const drawFn = this['draw_' + type];
        if (drawFn) {
            drawFn.call(this, ctx, s, cx, ageIndex, ap, ta);
        } else {
            this.draw_melee(ctx, s, cx, ageIndex, ap, ta);
        }

        ctx.beginPath();
        ctx.ellipse(cx, s - 6, 34, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = team === 'player' ? 'rgba(58,120,194,0.26)' : 'rgba(194,58,58,0.26)';
        ctx.fill();
    }

    _fillRoundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    _outline(ctx, color, w) {
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        ctx.stroke();
    }

    // Generic standing humanoid. feetY ~248, head center y~92.
    _humanoid(ctx, cx, ap, ta, opt) {
        opt = opt || {};
        const skin = ap.skin;
        const skinDark = '#c8966e';
        const torsoW = opt.torsoW || 60;
        const headR = opt.headR || 30;
        const legColor = opt.legColor || ap.clothDark;
        const OUT = '#16161e';
        const legTop = 196;
        const feetY = 248;

        if (!opt.noLegs) {
            ctx.fillStyle = legColor;
            this._fillRoundRect(ctx, cx - 27, legTop, 22, feetY - legTop, 7);
            ctx.fill();
            this._outline(ctx, OUT, 4);
            this._fillRoundRect(ctx, cx + 5, legTop, 22, feetY - legTop, 7);
            ctx.fill();
            this._outline(ctx, OUT, 4);

            ctx.fillStyle = '#241a10';
            this._fillRoundRect(ctx, cx - 30, feetY - 16, 28, 16, 5);
            ctx.fill();
            this._fillRoundRect(ctx, cx + 2, feetY - 16, 28, 16, 5);
            ctx.fill();
        }

        ctx.fillStyle = ap.cloth;
        this._fillRoundRect(ctx, cx - torsoW / 2 - 13, 126, 19, 70, 9);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        this._fillRoundRect(ctx, cx + torsoW / 2 - 6, 126, 19, 70, 9);
        ctx.fill();
        this._outline(ctx, OUT, 4);

        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(cx - torsoW / 2 - 3, 196, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + torsoW / 2 + 4, 196, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = ap.cloth;
        this._fillRoundRect(ctx, cx - torsoW / 2, 116, torsoW, 84, 16);
        ctx.fill();
        this._outline(ctx, ap.clothDark, 4);
        ctx.fillStyle = ap.clothLight;
        ctx.globalAlpha = 0.5;
        this._fillRoundRect(ctx, cx - torsoW / 4, 124, torsoW / 2, 64, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
        // team sash
        ctx.fillStyle = ta.accent;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - torsoW / 2, 116, torsoW, 84);
        ctx.clip();
        ctx.fillRect(cx - 6, 116, 14, 84);
        ctx.restore();
        // belt
        ctx.fillStyle = '#2a1c0e';
        ctx.fillRect(cx - torsoW / 2, 186, torsoW, 13);
        ctx.fillStyle = '#b5894e';
        this._fillRoundRect(ctx, cx - 8, 188, 16, 9, 3);
        ctx.fill();

        ctx.fillStyle = skin;
        ctx.fillRect(cx - 11, 80, 22, 16);
        ctx.beginPath();
        ctx.arc(cx, 90, headR, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, skinDark, 3);

        if (!opt.noHair) {
            ctx.fillStyle = opt.hair || '#3a2a1a';
            ctx.beginPath();
            ctx.arc(cx, 86, headR + 2, Math.PI * 1.05, Math.PI * 2.05);
            ctx.fill();
            this._fillRoundRect(ctx, cx - headR - 2, 78, headR + 4, 14, 6);
            ctx.fill();
        }

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx + 11, 90, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _blade(ctx, x1, y1, x2, y2, w, color, edge) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        ctx.beginPath();
        ctx.moveTo(x1 + nx * w, y1 + ny * w);
        ctx.lineTo(x2 + nx * w * 0.4, y2 + ny * w * 0.4);
        ctx.lineTo(x2 - nx * w * 0.4, y2 - ny * w * 0.4);
        ctx.lineTo(x1 - nx * w, y1 - ny * w);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = edge || '#e2e6ee';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }

    _shield(ctx, cx, cy, r, ta) {
        ctx.fillStyle = ta.accent;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, '#5a5e66', 5);
        ctx.fillStyle = '#c9cdd6';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a8e96';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    _helmetGreat(ctx, cx, cy, r) {
        ctx.fillStyle = '#c9cdd6';
        this._fillRoundRect(ctx, cx - r, cy - r, r * 2, r * 2.1, 10);
        ctx.fill();
        this._outline(ctx, '#6a6e76', 4);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - r * 0.7, cy - 2, r * 1.4, 7);
    }

    // ── MELEE ───────────────────────────────────────────────
    draw_melee(ctx, s, cx, age, ap, ta) {
        if (age === 0) { // Caveman with club
            this._humanoid(ctx, cx, ap, ta, { hair: '#4a3422', legColor: '#5e4422' });
            ctx.fillStyle = '#4a3422';
            ctx.beginPath();
            ctx.arc(cx + 2, 104, 18, 0, Math.PI);
            ctx.fill();
            const hx = cx + 35, hy = 196;
            ctx.save();
            ctx.translate(hx, hy);
            ctx.rotate(-0.5);
            ctx.strokeStyle = '#6a4a2a';
            ctx.lineWidth = 11;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(36, -70);
            ctx.stroke();
            ctx.fillStyle = '#8a6233';
            ctx.beginPath();
            ctx.arc(40, -78, 20, 0, Math.PI * 2);
            ctx.fill();
            this._outline(ctx, '#4a3216', 4);
            ctx.restore();
        } else if (age === 1) { // Knight: sword + shield
            this._humanoid(ctx, cx, ap, ta, { hair: '#3a2a1a' });
            this._helmetGreat(ctx, cx, 90, 30);
            this._shield(ctx, cx - 33, 150, 27, ta);
            const gx = cx + 35, gy = 196;
            ctx.fillStyle = '#b5894e';
            ctx.fillRect(gx - 6, gy - 16, 12, 16);
            ctx.fillStyle = '#e2c14e';
            ctx.fillRect(gx - 18, gy - 4, 36, 7);
            this._blade(ctx, gx, gy - 6, gx + 14, 60, 9, ap.metal, '#fff');
        } else if (age === 2) { // Dueler: rapier + plumed hat
            this._humanoid(ctx, cx, ap, ta, { torsoW: 52, headR: 27, hair: '#2a1a10' });
            ctx.fillStyle = ap.clothDark;
            this._fillRoundRect(ctx, cx - 30, 70, 60, 12, 6);
            ctx.fill();
            ctx.fillStyle = ta.accent;
            ctx.beginPath();
            ctx.moveTo(cx + 4, 70);
            ctx.quadraticCurveTo(cx + 30, 40, cx + 44, 68);
            ctx.quadraticCurveTo(cx + 24, 66, cx + 4, 70);
            ctx.fill();
            const gx = cx + 31, gy = 196;
            ctx.fillStyle = '#3a2a14';
            ctx.fillRect(gx - 5, gy - 14, 10, 14);
            ctx.fillStyle = '#e2c14e';
            ctx.fillRect(gx - 14, gy - 4, 28, 6);
            this._blade(ctx, gx, gy - 6, gx + 10, 44, 5, ap.metal, '#fff');
        } else if (age === 3) { // Soldier: rifle + bayonet
            this._humanoid(ctx, cx, ap, ta, { hair: '#3a2a1a' });
            ctx.fillStyle = '#5a6a4a';
            this._fillRoundRect(ctx, cx - 30, 60, 60, 26, 8);
            ctx.fill();
            this._outline(ctx, '#2a3a1a', 4);
            ctx.fillStyle = ta.accent;
            ctx.fillRect(cx - 22, 60, 44, 5);
            const by = 168;
            ctx.fillStyle = '#3a3a2a';
            this._fillRoundRect(ctx, cx + 24, by - 7, 120, 14, 4);
            ctx.fill();
            this._outline(ctx, '#1a1a10', 3);
            ctx.fillStyle = '#5a3a1a';
            this._fillRoundRect(ctx, cx + 10, by - 7, 24, 14, 4);
            ctx.fill();
            this._blade(ctx, cx + 144, by, cx + 178, by - 6, 5, ap.metal, '#fff');
            ctx.fillStyle = ap.skin;
            ctx.beginPath();
            ctx.arc(cx + 40, by, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 120, by, 10, 0, Math.PI * 2);
            ctx.fill();
        } else { // Future: energy sword
            this._humanoid(ctx, cx, ap, ta, { hair: '#2a2030' });
            ctx.fillStyle = '#2a2a3a';
            this._fillRoundRect(ctx, cx - 32, 62, 64, 28, 10);
            ctx.fill();
            this._outline(ctx, ap.clothDark, 4);
            ctx.fillStyle = ta.light;
            ctx.fillRect(cx - 22, 62, 44, 5);
            const gx = cx + 35, gy = 196;
            ctx.fillStyle = '#3a3a4a';
            this._fillRoundRect(ctx, gx - 6, gy - 16, 12, 18, 3);
            ctx.fill();
            ctx.save();
            ctx.shadowColor = ta.accent;
            ctx.shadowBlur = 16;
            this._blade(ctx, gx, gy - 8, gx + 16, 56, 8, ta.accent, '#ffffff');
            ctx.restore();
        }
    }

    // ── RANGED ──────────────────────────────────────────────
    draw_ranged(ctx, s, cx, age, ap, ta) {
        if (age === 0) { // Slinger
            this._humanoid(ctx, cx, ap, ta, { hair: '#4a3422', legColor: '#5e4422' });
            const hx = cx + 35, hy = 196;
            ctx.strokeStyle = '#5a4a2a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx + 26, hy - 30);
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx + 18, hy - 36);
            ctx.stroke();
            ctx.fillStyle = '#3a2a14';
            ctx.beginPath();
            ctx.arc(hx + 22, hy - 33, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (age === 1) { // Archer: bow + quiver
            this._humanoid(ctx, cx, ap, ta, { hair: '#3a2a1a' });
            ctx.fillStyle = ap.clothDark;
            this._fillRoundRect(ctx, cx - 6, 66, 12, 26, 4);
            ctx.fill();
            ctx.fillStyle = '#5a3a1a';
            this._fillRoundRect(ctx, cx - 26, 120, 14, 50, 5);
            ctx.fill();
            ctx.fillStyle = ap.metal;
            for (let i = 0; i < 3; i++) ctx.fillRect(cx - 24 + i * 4, 116, 3, 10);
            const bx = cx - 33, by = 150;
            ctx.strokeStyle = '#8a6233';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.arc(bx, by, 40, -Math.PI * 0.55, Math.PI * 0.55);
            ctx.stroke();
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx, by - 32);
            ctx.lineTo(bx, by + 32);
            ctx.stroke();
            ctx.strokeStyle = '#5a3a1a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + 60, by);
            ctx.stroke();
            ctx.fillStyle = ap.metal;
            ctx.beginPath();
            ctx.moveTo(bx + 60, by);
            ctx.lineTo(bx + 50, by - 6);
            ctx.lineTo(bx + 50, by + 6);
            ctx.fill();
            ctx.fillStyle = ap.skin;
            ctx.beginPath();
            ctx.arc(bx, by, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (age === 2) { // Musketeer: musket + bandolier
            this._humanoid(ctx, cx, ap, ta, { torsoW: 54, headR: 28, hair: '#2a1a10' });
            ctx.fillStyle = '#2a1a10';
            this._fillRoundRect(ctx, cx - 32, 68, 64, 12, 6);
            ctx.fill();
            ctx.fillStyle = ta.accent;
            ctx.beginPath();
            ctx.moveTo(cx + 6, 68);
            ctx.quadraticCurveTo(cx + 34, 36, cx + 48, 66);
            ctx.quadraticCurveTo(cx + 26, 64, cx + 6, 68);
            ctx.fill();
            ctx.strokeStyle = ta.accent;
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.moveTo(cx - 22, 120);
            ctx.lineTo(cx + 22, 188);
            ctx.stroke();
            ctx.fillStyle = '#e2c14e';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(cx - 16 + i * 12, 132 + i * 17, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            const by = 162;
            ctx.fillStyle = '#3a2a14';
            this._fillRoundRect(ctx, cx + 18, by - 6, 130, 12, 4);
            ctx.fill();
            this._outline(ctx, '#1a1008', 3);
            ctx.fillStyle = '#5a4a2a';
            this._fillRoundRect(ctx, cx + 8, by - 6, 20, 12, 3);
            ctx.fill();
            this._blade(ctx, cx + 148, by, cx + 176, by - 4, 5, ap.metal, '#fff');
            ctx.fillStyle = ap.skin;
            ctx.beginPath();
            ctx.arc(cx + 30, by, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (age === 3) { // Infantry rifle
            this._humanoid(ctx, cx, ap, ta, { hair: '#3a2a1a' });
            ctx.fillStyle = '#5a6a4a';
            this._fillRoundRect(ctx, cx - 30, 60, 60, 26, 8);
            ctx.fill();
            this._outline(ctx, '#2a3a1a', 4);
            const by = 160;
            ctx.fillStyle = '#3a3a2a';
            this._fillRoundRect(ctx, cx + 20, by - 6, 140, 12, 4);
            ctx.fill();
            this._outline(ctx, '#1a1a10', 3);
            ctx.fillStyle = '#5a3a1a';
            this._fillRoundRect(ctx, cx + 8, by - 6, 22, 12, 3);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.fillRect(cx + 120, by - 12, 10, 18);
            ctx.fillStyle = ap.skin;
            ctx.beginPath();
            ctx.arc(cx + 34, by, 10, 0, Math.PI * 2);
            ctx.fill();
        } else { // Future blaster
            this._humanoid(ctx, cx, ap, ta, { hair: '#2a2030' });
            ctx.fillStyle = '#2a2a3a';
            this._fillRoundRect(ctx, cx - 30, 62, 60, 26, 10);
            ctx.fill();
            this._outline(ctx, ap.clothDark, 4);
            ctx.fillStyle = ta.light;
            ctx.fillRect(cx - 20, 62, 40, 5);
            const by = 164;
            ctx.fillStyle = '#2a2a3a';
            this._fillRoundRect(ctx, cx + 22, by - 8, 70, 18, 6);
            ctx.fill();
            this._outline(ctx, ap.clothDark, 3);
            ctx.save();
            ctx.shadowColor = ta.accent;
            ctx.shadowBlur = 14;
            ctx.fillStyle = ta.accent;
            this._fillRoundRect(ctx, cx + 88, by - 4, 60, 9, 4);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = ap.skin;
            ctx.beginPath();
            ctx.arc(cx + 38, by, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── FAST ────────────────────────────────────────────────
    draw_fast(ctx, s, cx, age, ap, ta) {
        if (age === 0) {
            this._drawDinoRider(ctx, cx, ap, ta);
        } else if (age === 1) {
            this._drawKnightMounted(ctx, cx, ap, ta);
        } else if (age === 2) { // Fencer scout
            this._humanoid(ctx, cx, ap, ta, { torsoW: 48, headR: 27, hair: '#2a1a10' });
            ctx.fillStyle = ap.clothDark;
            this._fillRoundRect(ctx, cx - 18, 64, 36, 10, 5);
            ctx.fill();
            ctx.fillStyle = ta.accent;
            ctx.beginPath();
            ctx.moveTo(cx, 64);
            ctx.lineTo(cx - 24, 44);
            ctx.lineTo(cx + 4, 60);
            ctx.fill();
            const gx = cx + 28, gy = 192;
            ctx.fillStyle = '#3a2a14';
            ctx.fillRect(gx - 5, gy - 12, 10, 12);
            this._blade(ctx, gx, gy - 4, gx + 8, 70, 7, ap.metal, '#fff');
        } else if (age === 3) { // Commando with SMG
            this._humanoid(ctx, cx, ap, ta, { torsoW: 48, headR: 27, hair: '#3a2a1a' });
            ctx.fillStyle = '#5a6a4a';
            this._fillRoundRect(ctx, cx - 28, 60, 56, 24, 8);
            ctx.fill();
            this._outline(ctx, '#2a3a1a', 4);
            const by = 172;
            ctx.fillStyle = '#2a2a2a';
            this._fillRoundRect(ctx, cx + 20, by - 7, 56, 14, 4);
            ctx.fill();
            ctx.fillStyle = '#1a1a1a';
            this._fillRoundRect(ctx, cx + 8, by - 7, 20, 16, 3);
            ctx.fill();
            ctx.fillStyle = ap.skin;
            ctx.beginPath();
            ctx.arc(cx + 34, by, 9, 0, Math.PI * 2);
            ctx.fill();
        } else { // Hover mech
            this._drawHoverMech(ctx, cx, ap, ta);
        }
    }

    _drawDinoRider(ctx, cx, ap, ta) {
        const OUT = '#16161e';
        const DINO = '#6a9a52';
        const DINO_D = '#46732f';
        // legs
        ctx.fillStyle = DINO_D;
        for (const lx of [cx - 46, cx - 20, cx + 8, cx + 36]) {
            this._fillRoundRect(ctx, lx, 198, 20, 50, 6);
            ctx.fill();
            this._outline(ctx, OUT, 4);
        }
        // body
        ctx.fillStyle = DINO;
        ctx.beginPath();
        ctx.ellipse(cx, 172, 64, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 5);
        // belly
        ctx.fillStyle = '#8ab86e';
        ctx.beginPath();
        ctx.ellipse(cx - 6, 184, 44, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        // tail
        ctx.fillStyle = DINO;
        ctx.beginPath();
        ctx.moveTo(cx + 50, 178);
        ctx.quadraticCurveTo(cx + 100, 196, cx + 118, 232);
        ctx.lineTo(cx + 104, 236);
        ctx.quadraticCurveTo(cx + 90, 206, cx + 44, 190);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        // neck + head (facing right)
        ctx.fillStyle = DINO;
        ctx.beginPath();
        ctx.moveTo(cx + 40, 168);
        ctx.quadraticCurveTo(cx + 70, 130, cx + 78, 104);
        ctx.lineTo(cx + 98, 112);
        ctx.quadraticCurveTo(cx + 88, 150, cx + 64, 178);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        ctx.beginPath();
        ctx.ellipse(cx + 86, 110, 20, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx + 96, 106, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // rider (caveman) on back
        const rx = cx - 18;
        this._humanoid(ctx, rx, ap, ta, { torsoW: 40, headR: 24, hair: '#4a3422', legColor: '#5e4422', noLegs: true });
        // club
        const gx = rx + 24, gy = 150;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(-0.6);
        ctx.strokeStyle = '#6a4a2a';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(30, -56);
        ctx.stroke();
        ctx.fillStyle = '#8a6233';
        ctx.beginPath();
        ctx.arc(33, -62, 16, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, '#4a3216', 4);
        ctx.restore();
    }

    _drawKnightMounted(ctx, cx, ap, ta) {
        const OUT = '#16161e';
        const HORSE = '#7a5230';
        const HORSE_D = '#553818';
        // legs
        ctx.fillStyle = HORSE_D;
        for (const lx of [cx - 44, cx - 18, cx + 8, cx + 34]) {
            this._fillRoundRect(ctx, lx, 196, 18, 52, 6);
            ctx.fill();
            this._outline(ctx, OUT, 4);
        }
        // hooves
        ctx.fillStyle = '#2a1a0e';
        for (const lx of [cx - 44, cx - 18, cx + 8, cx + 34]) {
            this._fillRoundRect(ctx, lx, 240, 18, 10, 3);
            ctx.fill();
        }
        // body
        ctx.fillStyle = HORSE;
        ctx.beginPath();
        ctx.ellipse(cx, 168, 60, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 5);
        // tail
        ctx.fillStyle = HORSE_D;
        ctx.beginPath();
        ctx.moveTo(cx - 54, 150);
        ctx.quadraticCurveTo(cx - 78, 190, cx - 64, 230);
        ctx.quadraticCurveTo(cx - 60, 196, cx - 48, 162);
        ctx.fill();
        // neck + head
        ctx.fillStyle = HORSE;
        ctx.beginPath();
        ctx.moveTo(cx + 40, 160);
        ctx.quadraticCurveTo(cx + 66, 120, cx + 70, 92);
        ctx.lineTo(cx + 90, 96);
        ctx.quadraticCurveTo(cx + 84, 134, cx + 60, 172);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        ctx.beginPath();
        ctx.ellipse(cx + 80, 100, 16, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx + 88, 96, 3, 0, Math.PI * 2);
        ctx.fill();
        // rider (knight)
        const rx = cx - 14;
        this._humanoid(ctx, rx, ap, ta, { torsoW: 42, headR: 25, hair: '#3a2a1a', noLegs: true });
        this._helmetGreat(ctx, rx, 78, 25);
        // sword raised
        const gx = rx + 26, gy = 142;
        ctx.fillStyle = '#b5894e';
        ctx.fillRect(gx - 5, gy - 14, 10, 14);
        ctx.fillStyle = '#e2c14e';
        ctx.fillRect(gx - 14, gy - 4, 28, 6);
        this._blade(ctx, gx, gy - 6, gx + 12, 48, 7, ap.metal, '#fff');
    }

    _drawHoverMech(ctx, cx, ap, ta) {
        const OUT = '#16161e';
        ctx.save();
        ctx.shadowColor = ta.accent;
        ctx.shadowBlur = 18;
        ctx.fillStyle = ta.accent;
        ctx.globalAlpha = 0.7;
        this._fillRoundRect(ctx, cx - 26, 232, 52, 14, 7);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#2a2a3a';
        this._fillRoundRect(ctx, cx - 34, 150, 68, 84, 18);
        ctx.fill();
        this._outline(ctx, ap.clothDark, 5);
        ctx.fillStyle = ta.accent;
        ctx.beginPath();
        ctx.arc(cx, 184, 14, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, '#fff', 2);
        ctx.fillStyle = '#1a1a2a';
        this._fillRoundRect(ctx, cx - 20, 120, 40, 34, 12);
        ctx.fill();
        this._outline(ctx, ap.clothDark, 4);
        ctx.fillStyle = ta.light;
        ctx.fillRect(cx - 12, 132, 24, 6);
        ctx.fillStyle = '#33334a';
        this._fillRoundRect(ctx, cx - 50, 160, 18, 50, 9);
        ctx.fill();
        this._fillRoundRect(ctx, cx + 32, 160, 18, 50, 9);
        ctx.fill();
        ctx.fillStyle = '#222';
        this._fillRoundRect(ctx, cx - 54, 198, 26, 12, 4);
        ctx.fill();
        this._fillRoundRect(ctx, cx + 28, 198, 26, 12, 4);
        ctx.fill();
    }

    // ── SIEGE ───────────────────────────────────────────────
    draw_siege(ctx, s, cx, age, ap, ta) {
        const wood = age >= 3 ? '#6a5a3a' : '#8a6233';
        const woodDark = age >= 3 ? '#4a3a1a' : '#5a3e1a';
        ctx.fillStyle = wood;
        this._fillRoundRect(ctx, cx - 46, 150, 92, 30, 6);
        ctx.fill();
        this._outline(ctx, woodDark, 4);
        ctx.fillStyle = '#5a3a1a';
        for (const wx of [cx - 30, cx + 30]) {
            ctx.beginPath();
            ctx.arc(wx, 192, 20, 0, Math.PI * 2);
            ctx.fill();
            this._outline(ctx, woodDark, 4);
            ctx.fillStyle = '#8a6233';
            ctx.beginPath();
            ctx.arc(wx, 192, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5a3a1a';
        }
        ctx.strokeStyle = wood;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(cx - 20, 180);
        ctx.lineTo(cx - 4, 96);
        ctx.moveTo(cx + 24, 180);
        ctx.lineTo(cx + 4, 96);
        ctx.stroke();
        this._outline(ctx, woodDark, 3);
        ctx.save();
        ctx.translate(cx + 4, 96);
        ctx.rotate(-0.7);
        ctx.strokeStyle = '#6a4a2a';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-70, -10);
        ctx.stroke();
        ctx.fillStyle = '#5a3a1a';
        this._fillRoundRect(ctx, -92, -22, 26, 22, 5);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#4a3a2a';
        this._fillRoundRect(ctx, cx + 2, 150, 22, 22, 5);
        ctx.fill();
    }

    // ── ARMORED ─────────────────────────────────────────────
    draw_armored(ctx, s, cx, age, ap, ta) {
        if (age <= 0) {
            this._drawElephant(ctx, cx, ap, ta);
        } else {
            this._drawTank(ctx, cx, ap, ta);
        }
    }

    _drawElephant(ctx, cx, ap, ta) {
        const OUT = '#16161e';
        ctx.fillStyle = '#8a8a92';
        for (const lx of [cx - 40, cx - 14, cx + 12, cx + 38]) {
            this._fillRoundRect(ctx, lx, 190, 22, 56, 6);
            ctx.fill();
            this._outline(ctx, OUT, 4);
        }
        ctx.fillStyle = '#9a9aa2';
        ctx.beginPath();
        ctx.ellipse(cx, 160, 64, 46, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 5);
        ctx.beginPath();
        ctx.ellipse(cx + 60, 150, 34, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 5);
        ctx.fillStyle = '#8a8a92';
        ctx.beginPath();
        ctx.ellipse(cx + 44, 150, 26, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        ctx.strokeStyle = '#9a9aa2';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx + 88, 156);
        ctx.quadraticCurveTo(cx + 110, 190, cx + 96, 220);
        ctx.stroke();
        ctx.strokeStyle = '#f0e8d0';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(cx + 90, 176);
        ctx.lineTo(cx + 104, 210);
        ctx.stroke();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(cx + 68, 142, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ta.accent;
        this._fillRoundRect(ctx, cx - 30, 108, 56, 28, 6);
        ctx.fill();
        this._outline(ctx, ta.dark, 4);
        ctx.fillStyle = ap.skin;
        this._fillRoundRect(ctx, cx - 12, 86, 24, 28, 8);
        ctx.fill();
        this._outline(ctx, '#c8966e', 3);
        ctx.beginPath();
        ctx.arc(cx, 80, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawTank(ctx, cx, ap, ta) {
        const OUT = '#16161e';
        ctx.fillStyle = '#2a2a2a';
        this._fillRoundRect(ctx, cx - 66, 196, 132, 44, 14);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        ctx.fillStyle = '#444';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.arc(cx - 50 + i * 20, 218, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#5a6a4a';
        this._fillRoundRect(ctx, cx - 60, 150, 120, 52, 10);
        ctx.fill();
        this._outline(ctx, '#2a3a1a', 5);
        ctx.fillStyle = ta.accent;
        this._fillRoundRect(ctx, cx - 30, 116, 60, 42, 12);
        ctx.fill();
        this._outline(ctx, ta.dark, 5);
        ctx.fillStyle = '#4a4a4a';
        this._fillRoundRect(ctx, cx + 20, 132, 96, 16, 5);
        ctx.fill();
        this._outline(ctx, OUT, 4);
        ctx.fillStyle = ta.light;
        this._fillRoundRect(ctx, cx - 14, 122, 28, 12, 5);
        ctx.fill();
        ctx.fillStyle = ta.accent;
        ctx.beginPath();
        ctx.arc(cx, 168, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── ELITE ───────────────────────────────────────────────
    draw_elite(ctx, s, cx, age, ap, ta) {
        ctx.fillStyle = ta.cape;
        ctx.beginPath();
        ctx.moveTo(cx - 30, 116);
        ctx.quadraticCurveTo(cx - 56, 170, cx - 40, 230);
        ctx.lineTo(cx + 40, 230);
        ctx.quadraticCurveTo(cx + 56, 170, cx + 30, 116);
        ctx.fill();
        this._outline(ctx, ta.dark, 4);
        this._humanoid(ctx, cx, ap, ta, { torsoW: 62, headR: 32, hair: '#2a1a10' });
        this._helmetGreat(ctx, cx, 90, 32);
        for (const dir of [-1, 1]) {
            const gx = cx + dir * 36, gy = 196;
            ctx.fillStyle = '#3a2a14';
            ctx.fillRect(gx - 6, gy - 14, 12, 14);
            ctx.fillStyle = '#e2c14e';
            ctx.fillRect(gx - 16, gy - 4, 32, 7);
            this._blade(ctx, gx, gy - 6, gx + dir * 12, 56, 8, ap.metal, '#fff');
        }
    }

    // ── HERO ────────────────────────────────────────────────
    draw_hero(ctx, s, cx, age, ap, ta) {
        ctx.fillStyle = ta.cape;
        ctx.beginPath();
        ctx.moveTo(cx - 34, 112);
        ctx.quadraticCurveTo(cx - 64, 170, cx - 46, 236);
        ctx.lineTo(cx + 46, 236);
        ctx.quadraticCurveTo(cx + 64, 170, cx + 34, 112);
        ctx.fill();
        this._outline(ctx, ta.dark, 5);
        this._humanoid(ctx, cx, ap, ta, { torsoW: 66, headR: 34, hair: '#2a1a10' });
        ctx.fillStyle = '#c9cdd6';
        this._fillRoundRect(ctx, cx - 34, 56, 68, 44, 14);
        ctx.fill();
        this._outline(ctx, '#6a6e76', 5);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - 24, 84, 48, 8);
        ctx.fillStyle = '#e8e0c8';
        for (const dir of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(cx + dir * 30, 60);
            ctx.quadraticCurveTo(cx + dir * 58, 36, cx + dir * 50, 18);
            ctx.quadraticCurveTo(cx + dir * 40, 34, cx + dir * 26, 56);
            ctx.fill();
            this._outline(ctx, '#b0a890', 3);
        }
        ctx.fillStyle = ap.skin;
        ctx.beginPath();
        ctx.arc(cx, 90, 13, 0, Math.PI * 2);
        ctx.fill();
        for (const dir of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(cx + dir * 38, 124, 16, 0, Math.PI * 2);
            ctx.fill();
            this._outline(ctx, ta.dark, 4);
        }
        this._shield(ctx, cx - 40, 158, 30, ta);
        const gx = cx + 40, gy = 196;
        ctx.fillStyle = '#3a2a14';
        this._fillRoundRect(ctx, gx - 6, gy - 40, 12, 56, 4);
        ctx.fill();
        ctx.fillStyle = '#c9cdd6';
        ctx.beginPath();
        ctx.moveTo(gx + 4, gy - 40);
        ctx.quadraticCurveTo(gx + 34, gy - 30, gx + 22, gy - 6);
        ctx.quadraticCurveTo(gx + 10, gy - 18, gx + 2, gy - 14);
        ctx.fill();
        this._outline(ctx, '#8a8e96', 3);
        ctx.fillStyle = '#3a2a14';
        this._fillRoundRect(ctx, gx - 6, gy - 10, 12, 40, 4);
        ctx.fill();
        ctx.fillStyle = '#c9cdd6';
        ctx.beginPath();
        ctx.moveTo(gx + 4, gy - 10);
        ctx.quadraticCurveTo(gx + 30, gy - 2, gx + 18, gy + 14);
        ctx.quadraticCurveTo(gx + 8, gy + 4, gx + 2, gy + 6);
        ctx.fill();
        this._outline(ctx, '#8a8e96', 3);
    }
}

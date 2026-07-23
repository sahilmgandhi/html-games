class SpriteManager {
    constructor() {
        this.cache = new Map();
        this.images = new Map();
        this.renderSize = 96;
        this.displaySize = 110;
        this.turretDisplaySize = 80;
        this._shadowY = 76;
        this._shadowFrac = 76 / 96;
        this._hasImage = typeof Image !== 'undefined';
        this._types = ['melee', 'ranged', 'fast', 'siege', 'armored', 'elite', 'hero'];
        this._ages = [0, 1, 2, 3, 4];
        this._loaded = false;
        if (this._hasImage) {
            this._loadPNGs();
        }
    }

    _loadPNGs() {
        for (const type of this._types) {
            for (const age of this._ages) {
                const key = `${type}_${age}`;
                const img = new Image();
                img.src = `sprites/${key}.png`;
                img._loaded = false;
                img.onload = () => { img._loaded = true; };
                this.images.set(key, img);
            }
        }
        for (let ti = 0; ti < 3; ti++) {
            for (const age of this._ages) {
                const key = `turret_${ti}_${age}`;
                const img = new Image();
                img.src = `sprites/${key}.png`;
                img._loaded = false;
                img.onload = () => { img._loaded = true; };
                this.images.set(key, img);
            }
        }
        this._loaded = true;
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
            const imgKey = `${type}_${ageIndex}`;
            const img = this.images.get(imgKey);

            if (img && img._loaded) {
                entry.canvas = this._renderFromPNG(img, type, ageIndex, side);
            } else {
                const offscreen = document.createElement('canvas');
                offscreen.width = this.renderSize;
                offscreen.height = this.renderSize;
                const oc = offscreen.getContext('2d');
                this.drawSprite(oc, type, ageIndex, side);
                entry.canvas = offscreen;
            }
        }

        const dw = this.displaySize;
        const dh = this.displaySize;
        const drawY = y - Math.round(dh * this._shadowFrac);

        ctx.save();
        if (facingRight <= 0) {
            ctx.translate(x, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(entry.canvas, -dw / 2, drawY, dw, dh);
        } else {
            ctx.drawImage(entry.canvas, x - dw / 2, drawY, dw, dh);
        }
        ctx.restore();
    }

    turretKey(turretIndex, ageIndex, side) {
        return `turret_${turretIndex}_${ageIndex}_${side || 'none'}_${this.renderSize}`;
    }

    drawTurret(ctx, turretIndex, ageIndex, x, y, side) {
        const key = this.turretKey(turretIndex, ageIndex, side);
        let entry = this.cache.get(key);
        if (!entry) {
            entry = { canvas: null };
            this.cache.set(key, entry);
        }

        if (!entry.canvas) {
            const imgKey = `turret_${turretIndex}_${ageIndex}`;
            const img = this.images.get(imgKey);

            if (img && img._loaded) {
                entry.canvas = this._renderTurretFromPNG(img, side);
            } else {
                entry.canvas = null;
            }
        }

        if (!entry.canvas) return;

        const dw = this.turretDisplaySize;
        const dh = this.turretDisplaySize;
        const drawY = y - Math.round(dh * this._shadowFrac);

        ctx.drawImage(entry.canvas, x - dw / 2, drawY, dw, dh);
    }

    _renderTurretFromPNG(img, side) {
        const s = this.renderSize;
        const offscreen = document.createElement('canvas');
        offscreen.width = s;
        offscreen.height = s;
        const oc = offscreen.getContext('2d');
        oc.imageSmoothingEnabled = true;
        oc.imageSmoothingQuality = 'high';
        oc.drawImage(img, 0, 0, s, s);

        if (side === 'enemy') {
            this._tintEnemy(oc, s);
        }

        return offscreen;
    }

    _renderFromPNG(img, type, ageIndex, side) {
        const s = this.renderSize;
        const offscreen = document.createElement('canvas');
        offscreen.width = s;
        offscreen.height = s;
        const oc = offscreen.getContext('2d');
        oc.imageSmoothingEnabled = true;
        oc.imageSmoothingQuality = 'high';
        oc.drawImage(img, 0, 0, s, s);

        if (side === 'enemy') {
            this._tintEnemy(oc, s);
        }

        const team = side || 'player';
        const cx = s / 2;
        oc.beginPath();
        oc.ellipse(cx, this._shadowY, 34, 8, 0, 0, Math.PI * 2);
        oc.fillStyle = team === 'player' ? 'rgba(58,120,194,0.26)' : 'rgba(194,58,58,0.26)';
        oc.fill();

        return offscreen;
    }

    _tintEnemy(oc, s) {
        const imageData = oc.getImageData(0, 0, s, s);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
            if (a < 30) continue;
            if (r > 30 && r < 90 && g > 80 && g < 160 && b > 150 && b < 230) {
                const ratio = (r - 40) / 50;
                d[i] = Math.round(194 * (0.5 + 0.5 * ratio));
                d[i + 1] = Math.round(58 * (0.5 + 0.5 * ratio));
                d[i + 2] = Math.round(58 * (0.5 + 0.5 * ratio));
            }
        }
        oc.putImageData(imageData, 0, 0);
    }

    drawSprite(ctx, type, ageIndex, side) {
        const s = this.renderSize;
        const cx = s / 2;
        const team = side || 'player';
        const ta = team === 'player'
            ? { accent: '#3a78c2', dark: '#235089', light: '#7fc0ff', cape: '#2b5a96' }
            : { accent: '#c23a3a', dark: '#8a2626', light: '#ff8a7a', cape: '#96302b' };

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
        ctx.fillStyle = ta.accent;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - torsoW / 2, 116, torsoW, 84);
        ctx.clip();
        ctx.fillRect(cx - 6, 116, 14, 84);
        ctx.restore();
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

    draw_melee(ctx, s, cx, age, ap, ta) {
        if (age === 0) {
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
        } else if (age === 1) {
            this._humanoid(ctx, cx, ap, ta, { hair: '#3a2a1a' });
            this._helmetGreat(ctx, cx, 90, 30);
            this._shield(ctx, cx - 33, 150, 27, ta);
            const gx = cx + 35, gy = 196;
            ctx.fillStyle = '#b5894e';
            ctx.fillRect(gx - 6, gy - 16, 12, 16);
            ctx.fillStyle = '#e2c14e';
            ctx.fillRect(gx - 18, gy - 4, 36, 7);
            this._blade(ctx, gx, gy - 6, gx + 14, 60, 9, ap.metal, '#fff');
        } else if (age === 2) {
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
        } else if (age === 3) {
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
        } else {
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

    draw_ranged(ctx, s, cx, age, ap, ta) {
        if (age === 0) {
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
        } else if (age === 1) {
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
        } else if (age === 2) {
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
        } else if (age === 3) {
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
        } else {
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

    draw_fast(ctx, s, cx, age, ap, ta) {
        if (age === 0) {
            this._drawDinoRider(ctx, cx, ap, ta);
        } else if (age === 1) {
            this._drawKnightMounted(ctx, cx, ap, ta);
        } else if (age === 2) {
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
        } else if (age === 3) {
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
        } else {
            this._drawHoverMech(ctx, cx, ap, ta);
        }
    }

    _drawDinoRider(ctx, cx, ap, ta) {
        const OUT = '#16161e';
        const DINO = '#6a9a52';
        const DINO_D = '#46732f';
        ctx.fillStyle = DINO_D;
        for (const lx of [cx - 46, cx - 20, cx + 8, cx + 36]) {
            this._fillRoundRect(ctx, lx, 198, 20, 50, 6);
            ctx.fill();
            this._outline(ctx, OUT, 4);
        }
        ctx.fillStyle = DINO;
        ctx.beginPath();
        ctx.ellipse(cx, 172, 64, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 5);
        ctx.fillStyle = '#8ab86e';
        ctx.beginPath();
        ctx.ellipse(cx - 6, 184, 44, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = DINO;
        ctx.beginPath();
        ctx.moveTo(cx + 50, 178);
        ctx.quadraticCurveTo(cx + 100, 196, cx + 118, 232);
        ctx.lineTo(cx + 104, 236);
        ctx.quadraticCurveTo(cx + 90, 206, cx + 44, 190);
        ctx.fill();
        this._outline(ctx, OUT, 4);
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
        const rx = cx - 18;
        this._humanoid(ctx, rx, ap, ta, { torsoW: 40, headR: 24, hair: '#4a3422', legColor: '#5e4422', noLegs: true });
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
        ctx.fillStyle = HORSE_D;
        for (const lx of [cx - 44, cx - 18, cx + 8, cx + 34]) {
            this._fillRoundRect(ctx, lx, 196, 18, 52, 6);
            ctx.fill();
            this._outline(ctx, OUT, 4);
        }
        ctx.fillStyle = '#2a1a0e';
        for (const lx of [cx - 44, cx - 18, cx + 8, cx + 34]) {
            this._fillRoundRect(ctx, lx, 240, 18, 10, 3);
            ctx.fill();
        }
        ctx.fillStyle = HORSE;
        ctx.beginPath();
        ctx.ellipse(cx, 168, 60, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, OUT, 5);
        ctx.fillStyle = HORSE_D;
        ctx.beginPath();
        ctx.moveTo(cx - 54, 150);
        ctx.quadraticCurveTo(cx - 78, 190, cx - 64, 230);
        ctx.quadraticCurveTo(cx - 60, 196, cx - 48, 162);
        ctx.fill();
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
        const rx = cx - 14;
        this._humanoid(ctx, rx, ap, ta, { torsoW: 42, headR: 25, hair: '#3a2a1a', noLegs: true });
        this._helmetGreat(ctx, rx, 78, 25);
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

    draw_siege(ctx, s, cx, age, ap, ta) {
        const wood = age >= 3 ? '#6a5a3a' : '#8a6233';
        const woodDark = age >= 3 ? '#4a3a1a' : '#5a3e1a';
        ctx.fillStyle = wood;
        this._fillRoundRect(ctx, cx - 46, 150, 92, 30, 6);
        ctx.fill();
        this._outline(ctx, woodDark, 4);
        ctx.strokeStyle = woodDark;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - 40, 156 + i * 7);
            ctx.lineTo(cx + 40, 156 + i * 7);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#5a3a1a';
        for (const wx of [cx - 30, cx + 30]) {
            ctx.beginPath();
            ctx.arc(wx, 192, 20, 0, Math.PI * 2);
            ctx.fill();
            this._outline(ctx, woodDark, 4);
            ctx.strokeStyle = '#6a4a2a';
            ctx.lineWidth = 3;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
                ctx.beginPath();
                ctx.moveTo(wx, 192);
                ctx.lineTo(wx + Math.cos(a) * 16, 192 + Math.sin(a) * 16);
                ctx.stroke();
            }
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
        ctx.strokeStyle = woodDark;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - 14, 150);
        ctx.lineTo(cx + 14, 130);
        ctx.stroke();
        ctx.strokeStyle = '#b5a080';
        ctx.lineWidth = 2;
        for (const ry of [160, 130]) {
            ctx.beginPath();
            ctx.arc(cx - 8, ry, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.save();
        ctx.translate(cx + 4, 96);
        ctx.rotate(-0.7);
        ctx.strokeStyle = '#6a4a2a';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-70, -10);
        ctx.stroke();
        this._outline(ctx, woodDark, 2);
        ctx.fillStyle = '#5a3a1a';
        this._fillRoundRect(ctx, -92, -22, 26, 22, 5);
        ctx.fill();
        this._outline(ctx, '#3a2a0a', 3);
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(-86, -18, 14, 14);
        ctx.strokeStyle = '#8a7a5a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-2, -4);
        ctx.lineTo(6, 10);
        ctx.lineTo(-6, 10);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#4a3a2a';
        this._fillRoundRect(ctx, cx + 2, 150, 22, 22, 5);
        ctx.fill();
        this._outline(ctx, '#2a1a0a', 3);
        if (age >= 2) {
            ctx.fillStyle = '#3a3a3a';
            ctx.beginPath();
            ctx.arc(cx + 13, 155, 6, 0, Math.PI * 2);
            ctx.fill();
            this._outline(ctx, '#1a1a1a', 2);
        } else {
            ctx.fillStyle = '#6a5a3a';
            ctx.beginPath();
            ctx.arc(cx + 13, 155, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = ta.accent;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(cx - 44, 148, 6, 24);
        ctx.fillRect(cx + 38, 148, 6, 24);
        ctx.globalAlpha = 1;
        ctx.fillStyle = ta.accent;
        ctx.beginPath();
        ctx.moveTo(cx - 10, 96);
        ctx.lineTo(cx - 22, 104);
        ctx.lineTo(cx - 10, 108);
        ctx.fill();
    }

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

    draw_elite(ctx, s, cx, age, ap, ta) {
        ctx.fillStyle = ta.cape;
        ctx.beginPath();
        ctx.moveTo(cx - 30, 116);
        ctx.quadraticCurveTo(cx - 56, 170, cx - 40, 230);
        ctx.lineTo(cx + 40, 230);
        ctx.quadraticCurveTo(cx + 56, 170, cx + 30, 116);
        ctx.fill();
        this._outline(ctx, ta.dark, 4);
        ctx.strokeStyle = ta.dark;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(cx - 20, 130);
        ctx.quadraticCurveTo(cx - 30, 180, cx - 24, 228);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 20, 130);
        ctx.quadraticCurveTo(cx + 30, 180, cx + 24, 228);
        ctx.stroke();
        ctx.globalAlpha = 1;

        this._humanoid(ctx, cx, ap, ta, { torsoW: 62, headR: 32, hair: '#2a1a10' });
        this._helmetGreat(ctx, cx, 90, 32);

        for (const dir of [-1, 1]) {
            const px = cx + dir * 36;
            ctx.fillStyle = ap.metal;
            ctx.beginPath();
            ctx.ellipse(px, 120, 14, 10, dir * 0.3, 0, Math.PI * 2);
            ctx.fill();
            this._outline(ctx, ap.metalDark, 3);
            ctx.fillStyle = ap.metalDark;
            ctx.beginPath();
            ctx.arc(px, 120, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const dir of [-1, 1]) {
            const gx = cx + dir * 36, gy = 196;
            ctx.fillStyle = '#3a2a14';
            ctx.fillRect(gx - 6, gy - 14, 12, 14);
            ctx.fillStyle = '#e2c14e';
            ctx.fillRect(gx - 16, gy - 4, 32, 7);
            ctx.save();
            ctx.shadowColor = ap.metalLight || '#ffffff';
            ctx.shadowBlur = 6;
            this._blade(ctx, gx, gy - 6, gx + dir * 12, 56, 8, ap.metal, '#fff');
            ctx.restore();
        }

        ctx.fillStyle = '#2a1c0e';
        ctx.fillRect(cx - 30, 186, 60, 10);
        ctx.fillStyle = ta.accent;
        ctx.beginPath();
        ctx.arc(cx, 191, 4, 0, Math.PI * 2);
        ctx.fill();
        this._outline(ctx, '#e2c14e', 1.5);
    }

    draw_hero(ctx, s, cx, age, ap, ta) {
        ctx.fillStyle = ta.cape;
        ctx.beginPath();
        ctx.moveTo(cx - 34, 112);
        ctx.quadraticCurveTo(cx - 64, 170, cx - 46, 236);
        ctx.lineTo(cx + 46, 236);
        ctx.quadraticCurveTo(cx + 64, 170, cx + 34, 112);
        ctx.fill();
        this._outline(ctx, ta.dark, 5);
        ctx.strokeStyle = ta.dark;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.moveTo(cx + i * 14, 124);
            ctx.quadraticCurveTo(cx + i * 36, 175, cx + i * 28, 234);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

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
            this._outline(ctx, '#aaa', 3);
        }
        ctx.fillStyle = '#e2c14e';
        ctx.save();
        ctx.shadowColor = '#e2c14e';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, 52, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        this._outline(ctx, '#e2c14e', 1.5);

        ctx.fillStyle = ap.skin;
        ctx.beginPath();
        ctx.arc(cx, 90, 13, 0, Math.PI * 2);
        ctx.fill();

        for (const dir of [-1, 1]) {
            ctx.fillStyle = ap.metal;
            ctx.beginPath();
            ctx.arc(cx + dir * 38, 124, 16, 0, Math.PI * 2);
            ctx.fill();
            this._outline(ctx, ta.dark, 4);
            ctx.fillStyle = ap.metalDark;
            ctx.beginPath();
            ctx.arc(cx + dir * 38, 120, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        this._shield(ctx, cx - 40, 158, 30, ta);
        ctx.fillStyle = '#e2c14e';
        ctx.beginPath();
        ctx.moveTo(cx - 40, 148);
        ctx.lineTo(cx - 46, 158);
        ctx.lineTo(cx - 40, 168);
        ctx.lineTo(cx - 34, 158);
        ctx.closePath();
        ctx.fill();

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
        ctx.save();
        ctx.shadowColor = ta.accent;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = ta.accent;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(gx + 8, gy - 38);
        ctx.lineTo(gx + 20, gy - 8);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

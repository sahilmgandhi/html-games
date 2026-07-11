class SpriteManager {
    constructor() {
        this.cache = new Map();
        this.renderSize = 192;
        this.size = 192;
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

        const dw = this.renderSize;
        const dh = this.renderSize;

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
        const bodyColor = team === 'player' ? '#4488cc' : '#cc4444';
        const darkBody = team === 'player' ? '#3366aa' : '#aa2222';
        const lightBody = team === 'player' ? '#66aaee' : '#ee6666';
        const skinColor = '#f5c6a0';
        const darkSkin = '#d4a574';
        const metalColor = '#999';
        const darkMetal = '#666';
        const lightMetal = '#ccc';

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const drawFn = this['draw_' + type];
        if (drawFn) {
            drawFn.call(this, ctx, s, cx, 0, ageIndex, bodyColor, darkBody, lightBody, skinColor, darkSkin, metalColor, darkMetal, lightMetal, team);
        } else {
            this.draw_melee(ctx, s, cx, 0, ageIndex, bodyColor, darkBody, lightBody, skinColor, darkSkin, metalColor, darkMetal, lightMetal, team);
        }

        ctx.beginPath();
        ctx.ellipse(cx, s - 6, 24, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = team === 'player' ? 'rgba(68,136,204,0.25)' : 'rgba(204,68,68,0.25)';
        ctx.fill();
    }

    _fillRoundRect(ctx, x, y, w, h, r) {
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

    _drawBody(ctx, cx, bodyY, color, darkColor, lightColor, skin, darkSkin, headSize, bodyW) {
        headSize = headSize || 12;
        bodyW = bodyW || 14;

        ctx.fillStyle = darkColor;
        ctx.fillRect(cx - 8, bodyY, 6, 28);
        ctx.fillRect(cx + 2, bodyY, 6, 28);

        ctx.fillStyle = '#333';
        ctx.fillRect(cx - 10, bodyY + 24, 10, 6);
        ctx.fillRect(cx, bodyY + 24, 10, 6);

        ctx.fillStyle = color;
        this._fillRoundRect(ctx, cx - bodyW / 2, bodyY - 30, bodyW, 32, 4);
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#8B6914';
        ctx.fillRect(cx - bodyW / 2, bodyY - 4, bodyW, 4);
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(cx, bodyY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = skin;
        ctx.fillRect(cx - bodyW / 2 - 8, bodyY - 28, 8, 22);
        ctx.fillRect(cx + bodyW / 2, bodyY - 28, 8, 22);
        ctx.fillRect(cx - 4, bodyY - 38, 8, 10);

        ctx.beginPath();
        ctx.arc(cx, bodyY - 48, headSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkSkin;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.arc(cx, bodyY - 50, headSize, Math.PI, 0);
        ctx.fill();
    }

    draw_melee(ctx, s, cx, cy, age, body, darkBody, lightBody, skin, darkSkin, metal, darkMetal, lightMetal, team) {
        if (age === 0) {
            ctx.strokeStyle = darkBody;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, 38, 14, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, 52);
            ctx.lineTo(cx, 98);
            ctx.moveTo(cx, 98);
            ctx.lineTo(cx - 16, 128);
            ctx.moveTo(cx, 98);
            ctx.lineTo(cx + 16, 128);
            ctx.moveTo(cx - 22, 68);
            ctx.lineTo(cx + 22, 68);
            ctx.stroke();
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(cx + 22, 68);
            ctx.lineTo(cx + 44, 52);
            ctx.stroke();
            ctx.fillStyle = '#8B6914';
            ctx.beginPath();
            ctx.arc(cx + 46, 50, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = darkBody;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (age === 1) {
            this._drawBody(ctx, cx, 100, body, darkBody, lightBody, skin, darkSkin);
            ctx.fillStyle = metal;
            ctx.strokeStyle = darkMetal;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx - 20, 76, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = darkMetal;
            ctx.beginPath();
            ctx.arc(cx - 20, 76, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = lightMetal;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx + 18, 64);
            ctx.lineTo(cx + 30, 36);
            ctx.stroke();
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(cx + 16, 62, 6, 10);
        } else if (age === 2) {
            this._drawBody(ctx, cx, 96, body, darkBody, lightBody, skin, darkSkin);
            ctx.fillStyle = darkMetal;
            ctx.beginPath();
            ctx.arc(cx, 38, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = metal;
            ctx.beginPath();
            ctx.arc(cx, 38, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 8, 34, 16, 6);
            ctx.fillStyle = lightMetal;
            ctx.fillRect(cx - 10, 32, 20, 3);
            ctx.strokeStyle = lightMetal;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(cx + 22, 60);
            ctx.lineTo(cx + 34, 28);
            ctx.stroke();
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(cx + 18, 58, 8, 12);
            ctx.fillStyle = body;
            ctx.strokeStyle = darkBody;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 30, 54);
            ctx.lineTo(cx - 16, 54);
            ctx.lineTo(cx - 16, 86);
            ctx.lineTo(cx - 23, 92);
            ctx.lineTo(cx - 30, 86);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = lightBody;
            ctx.beginPath();
            ctx.arc(cx - 23, 70, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (age === 3) {
            this._drawBody(ctx, cx, 92, body, darkBody, lightBody, skin, darkSkin);
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(cx, 38, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(cx, 36, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 7, 32, 14, 4);
            ctx.fillStyle = '#444';
            ctx.fillRect(cx + 16, 56, 6, 52);
            ctx.fillStyle = '#333';
            ctx.fillRect(cx + 14, 52, 10, 10);
            ctx.fillStyle = '#666';
            ctx.fillRect(cx + 17, 48, 4, 8);
            ctx.strokeStyle = lightMetal;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 19, 48);
            ctx.lineTo(cx + 19, 36);
            ctx.stroke();
        } else {
            this._drawBody(ctx, cx, 88, body, darkBody, lightBody, skin, darkSkin, 14, 14);
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(cx, 36, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx, 34, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = team === 'player' ? '#4488cc' : '#cc4444';
            ctx.fillRect(cx - 8, 30, 16, 3);
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 7, 34, 14, 4);
            ctx.strokeStyle = team === 'player' ? '#88ccff' : '#ff8844';
            ctx.lineWidth = 5;
            ctx.shadowColor = team === 'player' ? '#4488cc' : '#cc4444';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(cx + 22, 56);
            ctx.lineTo(cx + 36, 24);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#888';
            ctx.fillRect(cx + 18, 54, 8, 12);
            ctx.fillStyle = '#333';
            ctx.strokeStyle = team === 'player' ? '#4488cc' : '#cc4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 32, 52);
            ctx.lineTo(cx - 16, 52);
            ctx.lineTo(cx - 16, 84);
            ctx.lineTo(cx - 24, 90);
            ctx.lineTo(cx - 32, 84);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    draw_ranged(ctx, s, cx, cy, age, body, darkBody, lightBody, skin, darkSkin, metal, darkMetal, lightMetal, team) {
        if (age === 0) {
            ctx.strokeStyle = darkBody;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, 42, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, 54);
            ctx.lineTo(cx, 100);
            ctx.moveTo(cx, 100);
            ctx.lineTo(cx - 14, 128);
            ctx.moveTo(cx, 100);
            ctx.lineTo(cx + 14, 128);
            ctx.stroke();
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx + 16, 66);
            ctx.lineTo(cx + 36, 56);
            ctx.moveTo(cx + 36, 56);
            ctx.lineTo(cx + 44, 42);
            ctx.stroke();
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.arc(cx + 44, 42, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (age === 1) {
            this._drawBody(ctx, cx, 96, body, darkBody, lightBody, skin, darkSkin);
            ctx.fillStyle = body;
            ctx.beginPath();
            ctx.arc(cx, 38, 14, Math.PI, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx - 14, 38);
            ctx.lineTo(cx - 18, 54);
            ctx.lineTo(cx + 18, 54);
            ctx.lineTo(cx + 14, 38);
            ctx.fill();
            ctx.fillStyle = darkBody;
            ctx.beginPath();
            ctx.arc(cx, 40, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(cx, 42, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx + 26, 62, 28, -0.8, 0.8);
            ctx.stroke();
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + 42, 38);
            ctx.lineTo(cx + 42, 86);
            ctx.stroke();
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 42, 62);
            ctx.lineTo(cx + 10, 68);
            ctx.stroke();
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.moveTo(cx + 10, 68);
            ctx.lineTo(cx + 4, 64);
            ctx.lineTo(cx + 4, 72);
            ctx.closePath();
            ctx.fill();
        } else if (age === 2) {
            this._drawBody(ctx, cx, 94, body, darkBody, lightBody, skin, darkSkin);
            ctx.fillStyle = darkMetal;
            ctx.beginPath();
            ctx.arc(cx, 38, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = metal;
            ctx.beginPath();
            ctx.arc(cx, 36, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 6, 32, 12, 5);
            ctx.fillStyle = '#654321';
            ctx.fillRect(cx + 6, 56, 8, 44);
            ctx.fillStyle = '#555';
            ctx.fillRect(cx - 22, 54, 56, 6);
            ctx.fillStyle = '#444';
            ctx.fillRect(cx - 24, 52, 4, 10);
            ctx.fillRect(cx + 28, 52, 4, 10);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - 22, 55);
            ctx.lineTo(cx + 10, 58);
            ctx.moveTo(cx + 28, 55);
            ctx.lineTo(cx + 10, 58);
            ctx.stroke();
            ctx.fillStyle = '#654321';
            ctx.fillRect(cx + 4, 52, 8, 8);
        } else if (age === 3) {
            this._drawBody(ctx, cx, 90, body, darkBody, lightBody, skin, darkSkin);
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(cx, 38, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(cx, 36, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 6, 32, 12, 5);
            ctx.fillStyle = '#444';
            ctx.fillRect(cx + 14, 48, 5, 52);
            ctx.fillStyle = '#654321';
            ctx.fillRect(cx + 10, 56, 13, 32);
            ctx.fillStyle = '#333';
            ctx.fillRect(cx + 16, 44, 5, 8);
            ctx.fillStyle = '#555';
            ctx.fillRect(cx + 15, 88, 7, 6);
            ctx.strokeStyle = lightMetal;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 17, 44);
            ctx.lineTo(cx + 17, 34);
            ctx.stroke();
        } else {
            this._drawBody(ctx, cx, 86, body, darkBody, lightBody, skin, darkSkin, 14, 14);
            ctx.fillStyle = '#1a1a2a';
            ctx.beginPath();
            ctx.arc(cx, 36, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(cx, 34, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = team === 'player' ? '#4488cc' : '#cc4444';
            ctx.fillRect(cx - 8, 30, 16, 3);
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 6, 33, 12, 4);
            ctx.strokeStyle = team === 'player' ? '#88ccff' : '#ff8844';
            ctx.lineWidth = 4;
            ctx.shadowColor = team === 'player' ? '#4488cc' : '#cc4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cx + 28, 60, 28, -0.8, 0.8);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + 44, 36);
            ctx.lineTo(cx + 44, 84);
            ctx.stroke();
            ctx.strokeStyle = team === 'player' ? '#88ccff' : '#ff8844';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 44, 60);
            ctx.lineTo(cx + 12, 66);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx + 12, 66, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    draw_fast(ctx, s, cx, cy, age, body, darkBody, lightBody, skin, darkSkin, metal, darkMetal, lightMetal, team) {
        if (age === 0) {
            ctx.strokeStyle = darkBody;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, 40, 11, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, 51);
            ctx.lineTo(cx, 92);
            ctx.moveTo(cx, 92);
            ctx.lineTo(cx - 16, 126);
            ctx.moveTo(cx, 92);
            ctx.lineTo(cx + 16, 126);
            ctx.stroke();
            ctx.strokeStyle = darkBody;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 14, 64);
            ctx.lineTo(cx - 30, 52);
            ctx.moveTo(cx + 14, 64);
            ctx.lineTo(cx + 30, 52);
            ctx.stroke();
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx - 30, 52);
            ctx.lineTo(cx - 38, 38);
            ctx.moveTo(cx + 30, 52);
            ctx.lineTo(cx + 38, 38);
            ctx.stroke();
        } else if (age === 1) {
            this._drawBody(ctx, cx, 94, body, darkBody, lightBody, skin, darkSkin, 12, 10);
            ctx.fillStyle = body;
            ctx.beginPath();
            ctx.arc(cx, 38, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(cx, 40, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 22, 62);
            ctx.lineTo(cx - 38, 46);
            ctx.moveTo(cx + 22, 62);
            ctx.lineTo(cx + 38, 46);
            ctx.stroke();
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(cx - 38, 46, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 38, 46, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 38, 46);
            ctx.lineTo(cx - 38, 36);
            ctx.moveTo(cx + 38, 46);
            ctx.lineTo(cx + 38, 36);
            ctx.stroke();
        } else if (age === 2) {
            this._drawBody(ctx, cx, 92, body, darkBody, lightBody, skin, darkSkin, 10, 8);
            ctx.fillStyle = metal;
            ctx.beginPath();
            ctx.arc(cx, 36, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = darkBody;
            ctx.beginPath();
            ctx.arc(cx, 34, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(cx, 36, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 5, 32, 10, 4);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 20, 60);
            ctx.lineTo(cx - 36, 44);
            ctx.moveTo(cx + 20, 60);
            ctx.lineTo(cx + 36, 44);
            ctx.stroke();
            ctx.fillStyle = lightMetal;
            ctx.beginPath();
            ctx.arc(cx - 36, 44, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 36, 44, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (age === 3) {
            this._drawBody(ctx, cx, 88, body, darkBody, lightBody, skin, darkSkin, 8, 6);
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(cx, 36, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(cx, 34, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(cx, 36, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.fillRect(cx - 5, 32, 10, 4);
            ctx.fillStyle = '#555';
            ctx.fillRect(cx - 20, 56, 8, 28);
            ctx.fillRect(cx + 12, 56, 8, 28);
            ctx.fillStyle = '#666';
            ctx.fillRect(cx - 22, 52, 12, 8);
            ctx.fillRect(cx + 10, 52, 12, 8);
        } else {
            this._drawBody(ctx, cx, 84, body, darkBody, lightBody, skin, darkSkin, 6, 4);
            ctx.fillStyle = '#1a1a2a';
            ctx.beginPath();
            ctx.arc(cx, 34, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(cx, 32, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = team === 'player' ? '#4488cc' : '#cc4444';
            ctx.fillRect(cx - 8, 28, 16, 3);
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 6, 31, 12, 4);
            ctx.fillStyle = '#333';
            ctx.shadowColor = team === 'player' ? '#4488cc' : '#cc4444';
            ctx.shadowBlur = 8;
            ctx.fillRect(cx - 24, 52, 10, 30);
            ctx.fillRect(cx + 14, 52, 10, 30);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#444';
            ctx.fillRect(cx - 26, 48, 14, 8);
            ctx.fillRect(cx + 12, 48, 14, 8);
        }
    }

    draw_siege(ctx, s, cx, cy, age, body, darkBody, lightBody, skin, darkSkin, metal, darkMetal, lightMetal, team) {
        ctx.fillStyle = '#654321';
        ctx.strokeStyle = '#4a3210';
        ctx.lineWidth = 3;
        this._fillRoundRect(ctx, cx - 40, 96, 80, 28, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#555';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx - 28, 124, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 28, 124, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.arc(cx - 28, 124, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 28, 124, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 8, 96);
        ctx.lineTo(cx + 8, 52);
        ctx.stroke();
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(cx, 48);
        ctx.lineTo(cx + 14, 56);
        ctx.lineTo(cx + 12, 62);
        ctx.lineTo(cx - 2, 58);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(cx + 7, 52, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 30, 96);
        ctx.lineTo(cx - 8, 96);
        ctx.lineTo(cx + 8, 52);
        ctx.stroke();
    }

    draw_armored(ctx, s, cx, cy, age, body, darkBody, lightBody, skin, darkSkin, metal, darkMetal, lightMetal, team) {
        if (age <= 1) {
            this._drawBody(ctx, cx, 96, body, darkBody, lightBody, skin, darkSkin, 14, 12);
            ctx.fillStyle = '#777';
            ctx.beginPath();
            ctx.ellipse(cx, 82, 42, 32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(cx + 20, 62, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#555';
            ctx.stroke();
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(cx + 34, 68);
            ctx.quadraticCurveTo(cx + 44, 80, cx + 38, 96);
            ctx.stroke();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx + 30, 74);
            ctx.lineTo(cx + 42, 84);
            ctx.moveTo(cx + 30, 78);
            ctx.lineTo(cx + 42, 88);
            ctx.stroke();
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.arc(cx + 16, 54, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = body;
            ctx.fillRect(cx + 10, 60, 12, 10);
        } else {
            ctx.fillStyle = '#555';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 4;
            this._fillRoundRect(ctx, cx - 44, 72, 88, 40, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#666';
            this._fillRoundRect(ctx, cx - 24, 56, 48, 20, 4);
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#444';
            ctx.fillRect(cx + 24, 60, 32, 10);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + 24, 60, 32, 10);
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(cx + 56, 65, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#333';
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(cx - 42 + i * 18, 112, 14, 8);
            }
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 44, 116);
            ctx.lineTo(cx + 44, 116);
            ctx.stroke();
            ctx.fillStyle = body;
            ctx.fillRect(cx - 20, 60, 4, 12);
            ctx.fillRect(cx + 16, 60, 4, 12);
        }
    }

    draw_elite(ctx, s, cx, cy, age, body, darkBody, lightBody, skin, darkSkin, metal, darkMetal, lightMetal, team) {
        this._drawBody(ctx, cx, 88, body, darkBody, lightBody, skin, darkSkin, 16, 14);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(cx - 14, 50);
        ctx.quadraticCurveTo(cx - 30, 80, cx - 22, 120);
        ctx.lineTo(cx + 22, 120);
        ctx.quadraticCurveTo(cx + 30, 80, cx + 14, 50);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = darkBody;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx, 38, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(cx, 36, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.fillRect(cx - 8, 32, 16, 6);
        ctx.fillStyle = lightMetal;
        ctx.fillRect(cx - 10, 30, 20, 4);
        ctx.fillStyle = team === 'player' ? '#4488cc' : '#cc4444';
        ctx.beginPath();
        ctx.moveTo(cx - 6, 22);
        ctx.lineTo(cx, 14);
        ctx.lineTo(cx + 6, 22);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = lightMetal;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 24, 56);
        ctx.lineTo(cx - 38, 30);
        ctx.moveTo(cx + 24, 56);
        ctx.lineTo(cx + 38, 30);
        ctx.stroke();
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(cx - 28, 54, 8, 12);
        ctx.fillRect(cx + 20, 54, 8, 12);
        ctx.fillStyle = metal;
        ctx.strokeStyle = darkMetal;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx - 22, 54, 10, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx + 22, 54, 10, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    draw_hero(ctx, s, cx, cy, age, body, darkBody, lightBody, skin, darkSkin, metal, darkMetal, lightMetal, team) {
        const heroBody = team === 'player' ? '#4488cc' : '#cc4444';
        const heroDark = team === 'player' ? '#3366aa' : '#aa2222';
        const heroLight = team === 'player' ? '#66aaee' : '#ee6666';

        this._drawBody(ctx, cx, 84, heroBody, heroDark, heroLight, skin, darkSkin, 18, 16);
        ctx.fillStyle = heroBody;
        ctx.beginPath();
        ctx.moveTo(cx - 16, 48);
        ctx.quadraticCurveTo(cx - 36, 80, cx - 28, 120);
        ctx.lineTo(cx + 28, 120);
        ctx.quadraticCurveTo(cx + 36, 80, cx + 16, 48);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = heroDark;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = darkMetal;
        ctx.beginPath();
        ctx.arc(cx, 36, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = metal;
        ctx.beginPath();
        ctx.arc(cx, 34, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.fillRect(cx - 8, 30, 16, 6);
        ctx.fillStyle = lightMetal;
        ctx.fillRect(cx - 10, 28, 20, 4);
        ctx.fillStyle = lightMetal;
        ctx.beginPath();
        ctx.moveTo(cx - 14, 24);
        ctx.lineTo(cx - 22, 14);
        ctx.lineTo(cx - 10, 22);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 14, 24);
        ctx.lineTo(cx + 22, 14);
        ctx.lineTo(cx + 10, 22);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = lightMetal;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx + 20, 54);
        ctx.lineTo(cx + 36, 28);
        ctx.stroke();
        ctx.fillStyle = lightMetal;
        ctx.beginPath();
        ctx.moveTo(cx + 32, 24);
        ctx.lineTo(cx + 44, 34);
        ctx.lineTo(cx + 36, 38);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 40, 20);
        ctx.lineTo(cx + 28, 30);
        ctx.lineTo(cx + 32, 34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(cx + 16, 52, 8, 14);
        ctx.fillStyle = heroBody;
        ctx.strokeStyle = heroDark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 34, 50);
        ctx.lineTo(cx - 18, 50);
        ctx.lineTo(cx - 18, 84);
        ctx.lineTo(cx - 26, 90);
        ctx.lineTo(cx - 34, 84);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = lightMetal;
        ctx.beginPath();
        ctx.arc(cx - 26, 68, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = heroDark;
        ctx.beginPath();
        ctx.arc(cx - 26, 68, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = metal;
        ctx.strokeStyle = darkMetal;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx - 24, 52, 12, 9, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx + 24, 52, 12, 9, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

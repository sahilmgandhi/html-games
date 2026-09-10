// HTML overlay HUD: resources, unit cards + upgrades, turret/building shop,
// speed, special, pause and game-over overlays.
//
// State: see BattleSim.hudState().
// Actions out: { type: 'spawn-unit', index } | { type: 'upgrade-unit', index }
//   | { type: 'spawn-hero' } | { type: 'evolve' } | { type: 'special' }
//   | { type: 'buy-slot' } | { type: 'spawn-turret', index }
//   | { type: 'sell-turret', index } | { type: 'buy-building', index }
//   | { type: 'set-speed', speed } | { type: 'cycle-speed' }
//   | { type: 'cycle-difficulty' }
//   | { type: 'toggle-pause' } | { type: 'restart' }
// Hotkeys: 1-4 spawn (guarded by the current age's unit count) · H hero ·
// E evolve · Q/Space special · B/N shops · T cycle speed · P pause
export class HUD {
  constructor(root, game) {
    this.game = game;
    this._handlers = new Set();

    this.el = document.createElement('div');
    this.el.className = 'aow-hud';
    this.el.innerHTML = `
      <div class="aow-topbar">
        <span class="aow-res aow-gold">🪙 <b data-f="gold">0</b></span>
        <span class="aow-res aow-xp">✨ <b data-f="xp">0</b></span>
        <span class="aow-res aow-age" data-f="age">Stone Age</span>
        <button class="aow-res aow-mini" data-act="pause" title="Pause (P)">PAUSE</button>
        <button class="aow-res aow-mini" data-act="difficulty" title="Cycle difficulty (restarts match)"></button>
        <button class="aow-res aow-mini" data-act="bot" title="Spectate: bot plays blue"></button>
      </div>
      <div class="aow-bottombar">
        <div class="aow-row" data-f="row1">
          <div class="aow-cards" data-f="units"></div>
          <button class="aow-btn aow-hero" data-act="hero"></button>
          <button class="aow-btn aow-evolve" data-act="evolve"></button>
          <button class="aow-btn aow-special" data-act="special"></button>
        </div>
        <div class="aow-row" data-f="row2"></div>
      </div>
      <div class="aow-hint" data-f="hint"></div>
      <div class="aow-overlay" data-f="overlay" style="display:none"></div>`;
    root.appendChild(this.el);

    this._f = {};
    this.el.querySelectorAll('[data-f]').forEach((n) => { this._f[n.dataset.f] = n; });
    this._unitBtns = [];
    this._upgBtns = [];
    this._lastAge = -1;
    this._lastRow2Sig = '';

    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act],[data-unit],[data-turret],[data-sell],[data-building],[data-upgrade],[data-speed]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.unit !== undefined) {
        this._emit({ type: 'spawn-unit', index: Number(btn.dataset.unit) });
      } else if (btn.dataset.upgrade !== undefined) {
        this._emit({ type: 'upgrade-unit', index: Number(btn.dataset.upgrade) });
      } else if (btn.dataset.turret !== undefined) {
        this._emit({ type: 'spawn-turret', index: Number(btn.dataset.turret) });
      } else if (btn.dataset.sell !== undefined) {
        this._emit({ type: 'sell-turret', index: Number(btn.dataset.sell) });
      } else if (btn.dataset.building !== undefined) {
        this._emit({ type: 'buy-building', index: Number(btn.dataset.building) });
      } else if (btn.dataset.speed !== undefined) {
        this._emit({ type: 'set-speed', speed: Number(btn.dataset.speed) });
      } else if (btn.dataset.act === 'hero') {
        this._emit({ type: 'spawn-hero' });
      } else if (btn.dataset.act === 'evolve') {
        this._emit({ type: 'evolve' });
      } else if (btn.dataset.act === 'special') {
        this._emit({ type: 'special' });
      } else if (btn.dataset.act === 'buy-slot') {
        this._emit({ type: 'buy-slot' });
      } else if (btn.dataset.act === 'pause') {
        this._emit({ type: 'toggle-pause' });
      } else if (btn.dataset.act === 'difficulty') {
        this._emit({ type: 'cycle-difficulty' });
      } else if (btn.dataset.act === 'bot') {
        this._emit({ type: 'toggle-bot' });
      } else if (btn.dataset.act === 'restart') {
        this._emit({ type: 'restart' });
      } else if (btn.dataset.act === 'gallery') {
        this._emit({ type: 'gallery' });
      }
    });

    this._onKey = (e) => {
      if (e.repeat) return;
      // Never steal keys from text inputs; Space on a focused button would
      // otherwise fire both the native click and our hotkey (double action).
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.key === ' ') e.preventDefault();
      const k = e.key.toLowerCase();
      if (k >= '1' && k <= '4') {
        const index = Number(k) - 1;
        if (index < this._unitBtns.length) {
          this._emit({ type: 'spawn-unit', index });
        } else {
          this._flashHint(`No unit ${k} in this age`);
        }
      }
      else if (k === 'h') this._emit({ type: 'spawn-hero' });
      else if (k === 'e') this._emit({ type: 'evolve' });
      else if (k === 'q' || k === ' ') this._emit({ type: 'special' });
      else if (k === 'b') this._emit({ type: 'buy-building', index: 0 });
      else if (k === 'n') this._emit({ type: 'buy-building', index: 1 });
      else if (k === 't') this._emit({ type: 'cycle-speed' });
      else if (k === 'p' || k === 'escape') this._emit({ type: 'toggle-pause' });
    };
    window.addEventListener('keydown', this._onKey);
  }

  // Transient feedback for rejected hotkeys; the next update() restores the
  // last state-driven hint, plus a timer covers a paused sim.
  _flashHint(msg) {
    if (!this._f.hint) return;
    this._f.hint.textContent = msg;
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      if (this._f.hint) this._f.hint.textContent = this._lastHint ?? '';
    }, 1200);
  }

  on(fn) {
    this._handlers.add(fn);
    return () => this._handlers.delete(fn);
  }

  _emit(action) {
    for (const fn of this._handlers) fn(action);
  }

  _setText(node, v) {
    const s = String(v);
    if (node.textContent !== s) node.textContent = s;
  }

  _buildUnits(state) {
    this._lastAge = state.ageIndex;
    this._f.units.innerHTML = '';
    this._unitBtns = [];
    this._upgBtns = [];
    state.units.forEach((u, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'aow-unit-wrap';
      const b = document.createElement('button');
      b.className = 'aow-card';
      b.dataset.unit = String(i);
      b.title = u.tooltip || u.name;
      b.innerHTML = `<span class="aow-card-key">${u.hotkey || i + 1}</span>
        <span class="aow-card-name">${u.name}</span>
        <span class="aow-card-cost">🪙${u.cost}</span>
        <span class="aow-pips">${'●'.repeat(u.tier)}${'○'.repeat(Math.max(0, u.maxTier - u.tier))}</span>`;
      const up = document.createElement('button');
      up.className = 'aow-upg';
      up.dataset.upgrade = String(i);
      wrap.append(b, up);
      this._f.units.appendChild(wrap);
      this._unitBtns.push(b);
      this._upgBtns.push(up);
    });
  }

  _buildRow2(state) {
    const sell = state.sell || [];
    const turrets = state.turrets || [];
    const buildings = state.buildings || [];
    const sig = [state.ageIndex, sell.length, turrets.length, buildings.length].join('|');
    if (sig === this._lastRow2Sig) return;
    this._lastRow2Sig = sig;
    const row = this._f.row2;
    if (!row) return;
    row.innerHTML = '';
    const mk = (cls, attrs, html) => {
      const b = document.createElement('button');
      b.className = cls;
      for (const k in attrs) b.dataset[k] = attrs[k];
      b.innerHTML = html;
      row.appendChild(b);
      return b;
    };
    this._slotBtn = mk('aow-btn aow-small', { act: 'buy-slot' }, '');
    this._turretBtns = turrets.map((t, i) => mk(
      'aow-btn aow-small', { turret: String(i) },
      `<span class="aow-card-name">${t.name}</span><span class="aow-card-cost">🪙${t.cost}</span>`,
    ));
    this._buildingBtns = buildings.map((b, i) => mk(
      'aow-btn aow-small', { building: String(i) },
      `<span class="aow-card-key">${i === 0 ? 'B' : 'N'}</span><span class="aow-card-name">${b.name}</span><span class="aow-card-cost">🪙${b.cost}</span>`,
    ));
    this._sellBtns = sell.map((s, i) => mk(
      'aow-btn aow-small aow-sell', { sell: String(i) },
      `<span class="aow-card-name">Sell ${s.name}</span><span class="aow-card-cost">+${s.refund}g</span>`,
    ));
    this._speedBtns = [1, 2, 3].map((s) => mk(
      'aow-btn aow-small aow-speed', { speed: String(s) }, `${s}x`,
    ));
  }

  update(state) {
    if (!state) return;
    this._setText(this._f.gold, Math.floor(state.gold ?? 0));
    this._setText(this._f.xp, Math.floor(state.xp ?? 0));
    this._setText(this._f.age, state.ageName ?? '');
    if (state.hint !== undefined) {
      this._lastHint = state.hint;
      this._setText(this._f.hint, state.hint);
    }

    // Buttons mirror the action live-guard: no silent drops while paused/over.
    // Speed stays usable while paused (view pacing); pause dies on game-over.
    const interactive = !state.paused && !state.over;

    if (state.ageIndex !== this._lastAge && state.units) this._buildUnits(state);
    if (state.units) {
      state.units.forEach((u, i) => {
        if (this._unitBtns[i]) {
          this._unitBtns[i].disabled = !interactive || !u.affordable;
          this._unitBtns[i].title = u.tooltip || u.name;
          const pips = this._unitBtns[i].querySelector('.aow-pips');
          if (pips) {
            const s = '●'.repeat(u.tier) + '○'.repeat(Math.max(0, u.maxTier - u.tier));
            if (pips.textContent !== s) pips.textContent = s;
          }
        }
        const up = this._upgBtns[i];
        if (up) {
          const maxed = u.upgCost === null;
          up.innerHTML = maxed ? '★' : `↑<small>🪙${u.upgCost}</small>`;
          up.title = maxed ? 'Max tier' : `Upgrade to tier ${u.tier + 1} (🪙${u.upgCost})`;
          up.disabled = !interactive || maxed || !u.upgAffordable;
        }
      });
    }

    const heroBtn = this.el.querySelector('[data-act="hero"]');
    if (state.hero) {
      const cd = state.hero.cooldownSecs > 0 ? `${state.hero.cooldownSecs}s` : `🪙${state.hero.cost}`;
      heroBtn.innerHTML = `<span class="aow-card-key">${state.hero.hotkey || 'H'}</span>
        <span class="aow-card-name">${state.hero.name}</span>
        <span class="aow-card-cost">${cd}</span>`;
      heroBtn.disabled = !interactive || !state.hero.affordable;
      heroBtn.style.display = '';
    } else {
      heroBtn.style.display = 'none';
    }

    const evoBtn = this.el.querySelector('[data-act="evolve"]');
    if (state.evolve) {
      evoBtn.innerHTML = `<span class="aow-card-key">E</span>
        <span class="aow-card-name">${state.evolve.label}</span>
        <span class="aow-card-cost">✨${state.evolve.cost}</span>`;
      evoBtn.disabled = !interactive || !state.evolve.affordable;
      evoBtn.style.display = '';
    } else {
      evoBtn.style.display = 'none';
    }

    const spBtn = this.el.querySelector('[data-act="special"]');
    if (state.special) {
      spBtn.innerHTML = `<span class="aow-card-key">Q</span>
        <span class="aow-card-name">${state.special.name}</span>
        <span class="aow-card-cost">${state.special.ready ? 'READY' : state.special.status}</span>`;
      spBtn.disabled = !interactive || !state.special.ready;
      spBtn.classList.toggle('aow-ready', !!state.special.ready);
      spBtn.style.display = '';
    } else {
      spBtn.style.display = 'none';
    }

    if (state.slots) {
      this._buildRow2(state);
      const s = state.slots;
      if (this._slotBtn) {
        this._slotBtn.innerHTML = `<span class="aow-card-name">Slot ${s.bought}/${s.max}</span>
          <span class="aow-card-cost">${s.full ? 'FULL' : `🪙${s.cost}`}</span>`;
        this._slotBtn.disabled = !interactive || !s.affordable;
      }
      (state.turrets || []).forEach((t, i) => { if (this._turretBtns[i]) this._turretBtns[i].disabled = !interactive || !t.placeable; });
      (state.buildings || []).forEach((b, i) => { if (this._buildingBtns[i]) this._buildingBtns[i].disabled = !interactive || !b.affordable; });
      (state.speeds || []).forEach((sp, i) => {
        if (this._speedBtns[i]) {
          this._speedBtns[i].classList.toggle('aow-active', !!sp.active);
          this._speedBtns[i].disabled = !!state.over;
        }
      });
    }

    const ov = this._f.overlay;
    const ovSig = state.over ? `over:${state.over.title}` : (state.paused ? 'paused' : 'none');
    if (ovSig !== this._lastOvSig) {
      this._lastOvSig = ovSig;
      if (state.over) {
        ov.style.display = 'flex';
        ov.innerHTML = `<div class="aow-panel">
          <h1 class="${state.over.winner === 'player' ? 'aow-win' : 'aow-lose'}">${state.over.title}</h1>
          ${(state.over.stats || []).map((s) => `<div class="aow-stat">${s}</div>`).join('')}
          <button class="aow-btn" data-act="restart">↻ Restart (click)</button>
        </div>`;
      } else if (state.paused) {
        ov.style.display = 'flex';
        ov.innerHTML = `<div class="aow-panel">
          <h1>PAUSED</h1>
          <button class="aow-btn" data-act="restart">↻ Restart</button>
          <button class="aow-btn" data-act="gallery">🖼 Unit gallery</button>
        </div>`;
      } else {
        ov.style.display = 'none';
        ov.innerHTML = '';
      }
    }
    const pauseBtn = this.el.querySelector('[data-act="pause"]');
    if (pauseBtn) {
      pauseBtn.textContent = state.paused ? 'RESUME' : 'PAUSE';
      pauseBtn.disabled = !!state.over;
    }
    const diffBtn = this.el.querySelector('[data-act="difficulty"]');
    if (diffBtn && state.difficulty) {
      this._setText(diffBtn, `⚔ ${state.difficulty.name}`);
      diffBtn.disabled = !!state.over;
    }
    const botBtn = this.el.querySelector('[data-act="bot"]');
    if (botBtn && state.bot !== undefined) {
      this._setText(botBtn, state.bot ? '🤖 BOT ON' : '🤖 Bot');
      botBtn.disabled = !!state.over;
    }
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey);
    clearTimeout(this._hintTimer);
    this.el.remove();
    this._handlers.clear();
  }
}

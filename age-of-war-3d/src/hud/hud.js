// HTML overlay HUD: resources, unit cards + upgrades, turret/building shop,
// speed/formation, special, pause and game-over overlays.
//
// State: see BattleSim.hudState().
// Actions out: { type: 'spawn-unit', index } | { type: 'upgrade-unit', index }
//   | { type: 'spawn-hero' } | { type: 'evolve' } | { type: 'special' }
//   | { type: 'buy-slot' } | { type: 'spawn-turret', index }
//   | { type: 'sell-turret', index } | { type: 'buy-building', index }
//   | { type: 'set-speed', speed } | { type: 'cycle-formation' }
//   | { type: 'toggle-pause' } | { type: 'restart' }
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
      } else if (btn.dataset.act === 'formation') {
        this._emit({ type: 'cycle-formation' });
      } else if (btn.dataset.act === 'pause') {
        this._emit({ type: 'toggle-pause' });
      } else if (btn.dataset.act === 'restart') {
        this._emit({ type: 'restart' });
      }
    });

    this._onKey = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k >= '1' && k <= '4') this._emit({ type: 'spawn-unit', index: Number(k) - 1 });
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
    const sig = [state.ageIndex, state.sell.length, state.turrets.length, state.buildings.length].join('|');
    if (sig === this._lastRow2Sig) return;
    this._lastRow2Sig = sig;
    const row = this._f.row2;
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
    this._turretBtns = state.turrets.map((t, i) => mk(
      'aow-btn aow-small', { turret: String(i) },
      `<span class="aow-card-name">${t.name}</span><span class="aow-card-cost">🪙${t.cost}</span>`,
    ));
    this._buildingBtns = state.buildings.map((b, i) => mk(
      'aow-btn aow-small', { building: String(i) },
      `<span class="aow-card-key">${i === 0 ? 'B' : 'N'}</span><span class="aow-card-name">${b.name}</span><span class="aow-card-cost">🪙${b.cost}</span>`,
    ));
    this._sellBtns = state.sell.map((s, i) => mk(
      'aow-btn aow-small aow-sell', { sell: String(i) },
      `<span class="aow-card-name">Sell ${s.name}</span><span class="aow-card-cost">+${s.refund}g</span>`,
    ));
    this._speedBtns = [1, 2, 3].map((s) => mk(
      'aow-btn aow-small aow-speed', { speed: String(s) }, `${s}x`,
    ));
    this._formBtn = mk('aow-btn aow-small', { act: 'formation' }, '');
  }

  update(state) {
    if (!state) return;
    this._setText(this._f.gold, Math.floor(state.gold ?? 0));
    this._setText(this._f.xp, Math.floor(state.xp ?? 0));
    this._setText(this._f.age, state.ageName ?? '');
    if (state.hint !== undefined) this._setText(this._f.hint, state.hint);

    if (state.ageIndex !== this._lastAge && state.units) this._buildUnits(state);
    if (state.units) {
      state.units.forEach((u, i) => {
        if (this._unitBtns[i]) {
          this._unitBtns[i].disabled = !u.affordable;
          this._unitBtns[i].title = u.tooltip || u.name;
        }
        const up = this._upgBtns[i];
        if (up) {
          const maxed = u.upgCost === null;
          up.innerHTML = maxed ? '★' : `↑<small>🪙${u.upgCost}</small>`;
          up.title = maxed ? 'Max tier' : `Upgrade to tier ${u.tier + 1} (🪙${u.upgCost})`;
          up.disabled = maxed || !u.upgAffordable;
        }
      });
    }

    const heroBtn = this.el.querySelector('[data-act="hero"]');
    if (state.hero) {
      const cd = state.hero.cooldownSecs > 0 ? `${state.hero.cooldownSecs}s` : `🪙${state.hero.cost}`;
      heroBtn.innerHTML = `<span class="aow-card-key">${state.hero.hotkey || 'H'}</span>
        <span class="aow-card-name">${state.hero.name}</span>
        <span class="aow-card-cost">${cd}</span>`;
      heroBtn.disabled = !state.hero.affordable;
      heroBtn.style.display = '';
    } else {
      heroBtn.style.display = 'none';
    }

    const evoBtn = this.el.querySelector('[data-act="evolve"]');
    if (state.evolve) {
      evoBtn.innerHTML = `<span class="aow-card-key">E</span>
        <span class="aow-card-name">${state.evolve.label}</span>
        <span class="aow-card-cost">✨${state.evolve.cost}</span>`;
      evoBtn.disabled = !state.evolve.affordable;
      evoBtn.style.display = '';
    } else {
      evoBtn.style.display = 'none';
    }

    const spBtn = this.el.querySelector('[data-act="special"]');
    if (state.special) {
      spBtn.innerHTML = `<span class="aow-card-key">Q</span>
        <span class="aow-card-name">${state.special.name}</span>
        <span class="aow-card-cost">${state.special.ready ? 'READY' : state.special.status}</span>`;
      spBtn.disabled = !state.special.ready;
      spBtn.classList.toggle('aow-ready', !!state.special.ready);
    } else {
      spBtn.style.display = 'none';
    }

    if (state.slots) {
      this._buildRow2(state);
      const s = state.slots;
      this._slotBtn.innerHTML = `<span class="aow-card-name">Slot ${s.bought}/${s.max}</span>
        <span class="aow-card-cost">${s.full ? 'FULL' : `🪙${s.cost}`}</span>`;
      this._slotBtn.disabled = !s.affordable;
      state.turrets.forEach((t, i) => { if (this._turretBtns[i]) this._turretBtns[i].disabled = !t.placeable; });
      state.buildings.forEach((b, i) => { if (this._buildingBtns[i]) this._buildingBtns[i].disabled = !b.affordable; });
      (state.speeds || []).forEach((sp, i) => {
        if (this._speedBtns[i]) this._speedBtns[i].classList.toggle('aow-active', !!sp.active);
      });
      if (this._formBtn) this._formBtn.innerHTML = `<span class="aow-card-name">${state.formation || ''}</span><span class="aow-card-key">T</span>`;
    }

    const ov = this._f.overlay;
    const ovSig = state.over ? `over:${state.over.title}` : (state.paused ? 'paused' : 'none');
    if (ovSig !== this._lastOvSig) {
      this._lastOvSig = ovSig;
      if (state.over) {
        ov.style.display = 'flex';
        ov.innerHTML = `<div class="aow-panel">
          <h1 class="${state.over.winner === 'player' ? 'aow-win' : 'aow-lose'}">${state.over.title}</h1>
          ${state.over.stats.map((s) => `<div class="aow-stat">${s}</div>`).join('')}
          <button class="aow-btn" data-act="restart">↻ Restart (click)</button>
        </div>`;
      } else if (state.paused) {
        ov.style.display = 'flex';
        ov.innerHTML = `<div class="aow-panel">
          <h1>PAUSED</h1>
          <button class="aow-btn" data-act="restart">↻ Restart</button>
        </div>`;
      } else {
        ov.style.display = 'none';
        ov.innerHTML = '';
      }
    }
    const pauseBtn = this.el.querySelector('[data-act="pause"]');
    if (pauseBtn) pauseBtn.textContent = state.paused ? 'RESUME' : 'PAUSE';
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey);
    this.el.remove();
    this._handlers.clear();
  }
}

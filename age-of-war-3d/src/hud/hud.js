// HTML overlay HUD: resources, unit cards, evolve, special attack.
// Contract: HUD(root, game) -> { update(state), on(action), dispose() }
//
// State: { gold, xp, ageIndex, ageName,
//   units: [{ name, cost, hotkey, affordable }],
//   hero: { name, cost, hotkey, affordable },
//   evolve: { label, cost, affordable } | null,
//   special: { name, ready, frac } }
// Actions out: { type: 'spawn-unit', index } | { type: 'spawn-hero' }
//   | { type: 'evolve' } | { type: 'special' }
import './hud.css';

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
      </div>
      <div class="aow-bottombar">
        <div class="aow-cards" data-f="units"></div>
        <button class="aow-btn aow-hero" data-act="hero"></button>
        <button class="aow-btn aow-evolve" data-act="evolve"></button>
        <button class="aow-btn aow-special" data-act="special"></button>
      </div>
      <div class="aow-hint" data-f="hint"></div>`;
    root.appendChild(this.el);

    this._f = {};
    this.el.querySelectorAll('[data-f]').forEach((n) => { this._f[n.dataset.f] = n; });
    this._unitBtns = [];
    this._lastAge = -1;

    this.el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act],[data-unit]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.unit !== undefined) {
        this._emit({ type: 'spawn-unit', index: Number(btn.dataset.unit) });
      } else if (btn.dataset.act === 'hero') {
        this._emit({ type: 'spawn-hero' });
      } else if (btn.dataset.act === 'evolve') {
        this._emit({ type: 'evolve' });
      } else if (btn.dataset.act === 'special') {
        this._emit({ type: 'special' });
      }
    });

    this._onKey = (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k >= '1' && k <= '4') this._emit({ type: 'spawn-unit', index: Number(k) - 1 });
      else if (k === 'h') this._emit({ type: 'spawn-hero' });
      else if (k === 'e') this._emit({ type: 'evolve' });
      else if (k === 'q' || k === ' ') this._emit({ type: 'special' });
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

  update(state) {
    if (!state) return;
    this._setText(this._f.gold, Math.floor(state.gold ?? 0));
    this._setText(this._f.xp, Math.floor(state.xp ?? 0));
    this._setText(this._f.age, state.ageName ?? '');
    if (state.hint !== undefined) this._setText(this._f.hint, state.hint);

    if (state.ageIndex !== this._lastAge && state.units) {
      this._lastAge = state.ageIndex;
      this._f.units.innerHTML = '';
      this._unitBtns = state.units.map((u, i) => {
        const b = document.createElement('button');
        b.className = 'aow-card';
        b.dataset.unit = String(i);
        b.innerHTML = `<span class="aow-card-key">${u.hotkey || i + 1}</span>
          <span class="aow-card-name">${u.name}</span>
          <span class="aow-card-cost">🪙${u.cost}</span>`;
        this._f.units.appendChild(b);
        return b;
      });
    }
    if (state.units) {
      state.units.forEach((u, i) => {
        if (this._unitBtns[i]) this._unitBtns[i].disabled = !u.affordable;
      });
    }

    const heroBtn = this.el.querySelector('[data-act="hero"]');
    if (state.hero) {
      heroBtn.innerHTML = `<span class="aow-card-key">${state.hero.hotkey || 'H'}</span>
        <span class="aow-card-name">${state.hero.name}</span>
        <span class="aow-card-cost">🪙${state.hero.cost}</span>`;
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
        <span class="aow-card-cost">${state.special.ready ? 'READY' : `${Math.ceil(state.special.frac * 100)}%`}</span>`;
      spBtn.disabled = !state.special.ready;
      spBtn.classList.toggle('aow-ready', !!state.special.ready);
    } else {
      spBtn.style.display = 'none';
    }
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey);
    this.el.remove();
    this._handlers.clear();
  }
}

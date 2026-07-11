class Achievements {
  constructor() {
    this.defs = [
      { id: 'first_win', name: 'First Victory', desc: 'Win your first game', icon: '🏆' },
      { id: 'comeback', name: 'Comeback King', desc: 'Win after your base was below 20% HP', icon: '🛡' },
      { id: 'gold_hoarder', name: 'Gold Hoarder', desc: 'Accumulate 50,000 gold in one game', icon: '💰' },
      { id: 'maxed_out', name: 'Maxed Out', desc: 'Fully upgrade a unit', icon: '⭐' },
      { id: 'hero_call', name: 'Hero Summoner', desc: 'Spawn your first hero', icon: '⚔' },
      { id: 'builder', name: 'Builder', desc: 'Build both a mine and barracks', icon: '🛠' },
      { id: 'speed_demon', name: 'Speed Demon', desc: 'Win with 3x speed', icon: '⚡' },
      { id: 'impossible', name: 'Unstoppable', desc: 'Win on Impossible difficulty', icon: '💀' },
      { id: 'unit_collector', name: 'Unit Collector', desc: 'Spawn 500 units in one game', icon: '👥' },
      { id: 'turret_tycoon', name: 'Turret Tycoon', desc: 'Place 4 turrets in one game', icon: '🔫' },
      { id: 'evolved', name: 'Age of Discovery', desc: 'Evolve to Future Age', icon: '🚀' },
      { id: 'max_difficulty', name: 'Glutton for Punishment', desc: 'Win on Harder difficulty', icon: '🔥' },
    ];
    this.unlocked = this.load();
    this.queue = [];
    this.queueTimer = 0;
  }

  load() {
    try {
      const raw = localStorage.getItem('age_of_war_achievements');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  save() {
    try {
      localStorage.setItem('age_of_war_achievements', JSON.stringify(this.unlocked));
    } catch (e) {}
  }

  isUnlocked(id) {
    return this.unlocked.includes(id);
  }

  unlock(id) {
    if (this.isUnlocked(id)) return;
    this.unlocked.push(id);
    this.save();
    const def = this.defs.find(d => d.id === id);
    if (def) this.queue.push(def);
  }

  check(game) {
    if (game.gameOver && game.winner === 'player') {
      if (!this.isUnlocked('first_win')) this.unlock('first_win');
      if (game.playerLowestHp < game.playerBase.maxHp * 0.2) this.unlock('comeback');
      if (game.gameSpeed === 3) this.unlock('speed_demon');
      if (game.difficulty === 2) this.unlock('impossible');
      if (game.difficulty === 1) this.unlock('max_difficulty');
    }
  }

  update(dt, game) {
    if (game.gold >= 50000) this.unlock('gold_hoarder');
    if (game.totalSpawned >= 500) this.unlock('unit_collector');
    if (game.units.some(u => u.isHero && u.side === 'player')) this.unlock('hero_call');
    const upgValues = Object.values(game.unitUpgrades);
    if (upgValues.some(v => v >= CONFIG.MAX_UPGRADE_TIER)) this.unlock('maxed_out');
    const hasMine = game.buildings.some(b => b.buildingIndex === 0 && b.alive);
    const hasBarracks = game.buildings.some(b => b.buildingIndex === 1 && b.alive);
    if (hasMine && hasBarracks) this.unlock('builder');
    const turretCount = game.turrets.filter(t => t.side === 'player' && t.alive).length;
    if (turretCount >= 4) this.unlock('turret_tycoon');
    if (game.currentAge >= 4) this.unlock('evolved');

    if (this.queue.length > 0) {
      this.queueTimer += dt;
      if (this.queueTimer > 1) {
        this.queue.shift();
        this.queueTimer = 0;
      }
    }
  }

  getCurrentPopup() {
    if (this.queue.length > 0 && this.queueTimer < 0.8) {
      return this.queue[0];
    }
    return null;
  }
}

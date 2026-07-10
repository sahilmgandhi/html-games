class BalanceTracker {
  constructor() {
    this.timeline = [];
    this.snapshotInterval = 1;
    this.lastSnapshotTime = 0;
  }

  reset() {
    this.timeline = [];
    this.lastSnapshotTime = 0;
  }

  update(game) {
    if (game.gameTime - this.lastSnapshotTime < this.snapshotInterval) return;
    this.lastSnapshotTime = game.gameTime;

    const pUnits = game.units.filter(u => u.side === 'player' && u.alive);
    const eUnits = game.units.filter(u => u.side === 'enemy' && u.alive);

    this.timeline.push({
      time: Math.floor(game.gameTime),
      playerAge: game.currentAge,
      enemyAge: game.enemyAge,
      playerGold: Math.floor(game.gold),
      enemyGold: Math.floor(game.enemyGold),
      playerXp: Math.floor(game.xp),
      enemyXp: Math.floor(game.enemyXp),
      playerHp: game.playerBase.hp,
      enemyHp: game.enemyBase.hp,
      playerUnits: pUnits.length,
      enemyUnits: eUnits.length,
      playerDps: pUnits.reduce((s, u) => s + u.damage, 0),
      enemyDps: eUnits.reduce((s, u) => s + u.damage, 0),
    });
  }

  toJSON() {
    return JSON.stringify(this.timeline, null, 2);
  }

  toCSV() {
    if (this.timeline.length === 0) return '';
    const headers = Object.keys(this.timeline[0]);
    const rows = [headers.join(',')];
    for (const snap of this.timeline) {
      rows.push(headers.map(h => snap[h]).join(','));
    }
    return rows.join('\n');
  }

  download(filename, format) {
    const content = format === 'csv' ? this.toCSV() : this.toJSON();
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const balanceTracker = new BalanceTracker();

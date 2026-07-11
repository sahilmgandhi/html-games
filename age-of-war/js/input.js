class InputHandler {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.game = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.keys = {};

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.renderer.mouseX = this.mouseX;
      this.renderer.mouseY = this.mouseY;
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.renderer.mouseX = this.mouseX;
      this.renderer.mouseY = this.mouseY;
    });

    canvas.addEventListener('mouseleave', () => {
      this.mouseX = CONFIG.VIEWPORT.WIDTH / 2;
      this.mouseY = CONFIG.VIEWPORT.HEIGHT / 2;
      this.renderer.mouseX = this.mouseX;
      this.renderer.mouseY = this.mouseY;
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (this.game && this.game.started && !this.game.gameOver && !this.game.debugOpen) {
        if (e.key >= '1' && e.key <= '9') {
          const idx = parseInt(e.key) - 1;
          const age = CONFIG.AGES[this.game.currentAge];
          if (idx < age.units.length) this.game.spawnUnit(idx);
        } else if (e.key === ' ') {
          e.preventDefault();
          this.game.useSpecial();
        } else if (e.key === 'e' || e.key === 'E') {
          this.game.evolve();
        } else if (e.key === 'h' || e.key === 'H') {
          this.game.spawnHero('player');
        } else if (e.key === 'b' || e.key === 'B') {
          this.game.buyBuilding(0);
        } else if (e.key === 'n' || e.key === 'N') {
          this.game.buyBuilding(1);
        } else if (e.key === 't' || e.key === 'T') {
          const speeds = [1, 2, 3];
          const idx = speeds.indexOf(this.game.gameSpeed);
          this.game.gameSpeed = speeds[(idx + 1) % speeds.length];
        } else if (e.key === 'F5') {
          e.preventDefault();
          this.game.saveGame(0);
        } else if (e.key === 'F8') {
          e.preventDefault();
          this.game.loadGame(0);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    let touchActive = false;
    let touchMoved = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let cameraStartX = 0;

    const touchToCanvas = (t) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (t.clientX - rect.left) * (canvas.width / rect.width),
        y: (t.clientY - rect.top) * (canvas.height / rect.height),
        clientX: t.clientX,
        clientY: t.clientY,
      };
    };

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const p = touchToCanvas(e.touches[0]);
      this.mouseX = p.x;
      this.mouseY = p.y;
      this.renderer.mouseX = p.x;
      this.renderer.mouseY = p.y;
      touchActive = true;
      touchMoved = false;
      touchStartX = p.x;
      touchStartY = p.y;
      cameraStartX = this.renderer.camera.x;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!touchActive) return;
      const p = touchToCanvas(e.touches[0]);
      this.mouseX = p.x;
      this.mouseY = p.y;
      this.renderer.mouseX = p.x;
      this.renderer.mouseY = p.y;
      if (Math.abs(p.x - touchStartX) > 8 || Math.abs(p.y - touchStartY) > 8) {
        touchMoved = true;
      }
      const hudTop = CONFIG.VIEWPORT.HEIGHT - CONFIG.HUD_HEIGHT;
      if (touchStartY < hudTop) {
        this.renderer.scrollTo(cameraStartX - (p.x - touchStartX));
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!touchActive) return;
      touchActive = false;
      if (!touchMoved) {
        const t = e.changedTouches[0];
        canvas.dispatchEvent(new MouseEvent('click', {
          clientX: t.clientX,
          clientY: t.clientY,
          bubbles: true,
        }));
      }
    }, { passive: false });
  }

  setGame(game) {
    this.game = game;
  }

  update() {
    const margin = CONFIG.CAMERA_EDGE_MARGIN;
    const speed = CONFIG.CAMERA_SCROLL_SPEED;

    if (this.mouseX < margin) {
      this.renderer.scrollTo(this.renderer.camera.x - speed);
    } else if (this.mouseX > CONFIG.VIEWPORT.WIDTH - margin) {
      this.renderer.scrollTo(this.renderer.camera.x + speed);
    }

    if (this.keys['ArrowLeft'] || this.keys['a']) {
      this.renderer.scrollTo(this.renderer.camera.x - speed);
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      this.renderer.scrollTo(this.renderer.camera.x + speed);
    }
  }

  handleClick(game) {
    const HH = CONFIG.HUD_HEIGHT;
    const y = CONFIG.VIEWPORT.HEIGHT - HH;
    if (this.mouseY < y) return;

    const age = CONFIG.AGES[game.currentAge];
    const unitStartX = CONFIG.UNIT_START_X;

    for (let i = 0; i < age.units.length; i++) {
      const bx = unitStartX + i * CONFIG.UNIT_SPACING;
      if (pointInRect(this.mouseX, this.mouseY, bx, y + 6, 68, 34)) {
        game.spawnUnit(i);
        return;
      }
      const ubx = bx + 70;
      if (pointInRect(this.mouseX, this.mouseY, ubx, y + 6, 14, 34)) {
        game.upgradeUnit(i);
        return;
      }
    }

    const evoNeeded = CONFIG.EVOLVE_XP[game.currentAge + 1];
    if (evoNeeded !== undefined) {
      const evoX = unitStartX + age.units.length * CONFIG.UNIT_SPACING + 8;
      if (pointInRect(this.mouseX, this.mouseY, evoX, y + 6, 80, 34)) {
        game.evolve();
        return;
      }
    }

    const heroBtnX = evoNeeded !== undefined ? unitStartX + age.units.length * CONFIG.UNIT_SPACING + 8 + 80 + 8 : unitStartX + age.units.length * CONFIG.UNIT_SPACING + 8;
    if (pointInRect(this.mouseX, this.mouseY, heroBtnX, y + 6, 80, 34)) {
      game.spawnHero('player');
      return;
    }

    const spX = CONFIG.VIEWPORT.WIDTH - 120;
    if (pointInRect(this.mouseX, this.mouseY, spX, y + 6, 108, 34)) {
      game.useSpecial();
      return;
    }

    const speedBtns = [1, 2, 3];
    const spdStartX = CONFIG.VIEWPORT.WIDTH - 230;
    for (let i = 0; i < speedBtns.length; i++) {
      const sx = spdStartX + i * 32;
      if (pointInRect(this.mouseX, this.mouseY, sx, y + 10, 28, 22)) {
        game.gameSpeed = speedBtns[i];
        return;
      }
    }

    const formBtnX = CONFIG.VIEWPORT.WIDTH - 230;
    if (pointInRect(this.mouseX, this.mouseY, formBtnX, y + 34, 90, 16)) {
      game.formationMode = (game.formationMode + 1) % 3;
      return;
    }

    const row2Y = y + 56;
    if (pointInRect(this.mouseX, this.mouseY, 12, row2Y, 80, 22)) {
      game.buySlot();
      return;
    }

    for (let i = 0; i < age.turrets.length; i++) {
      const bx = 100 + i * 96;
      if (pointInRect(this.mouseX, this.mouseY, bx, row2Y, 88, 22)) {
        game.spawnTurret(i);
        return;
      }
    }

    const buildingStartX = 100 + age.turrets.length * 96 + 16;
    for (let i = 0; i < CONFIG.BUILDINGS.length; i++) {
      const bbX = buildingStartX + i * 88;
      if (pointInRect(this.mouseX, this.mouseY, bbX, row2Y, 80, 22)) {
        game.buyBuilding(i);
        return;
      }
    }

    const playerTurrets = game.turrets.filter(t => t.side === 'player');
    const row3Y = row2Y + 34;
    for (let i = 0; i < playerTurrets.length; i++) {
      const bx = 100 + i * 96;
      if (pointInRect(this.mouseX, this.mouseY, bx, row3Y, 88, 18)) {
        game.sellTurret(i);
        return;
      }
    }
  }
}

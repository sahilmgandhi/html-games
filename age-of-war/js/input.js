class InputHandler {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.mouseX = 0;
    this.mouseY = 0;
    this.keys = {};

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    });

    canvas.addEventListener('mouseleave', () => {
      this.mouseX = CONFIG.VIEWPORT.WIDTH / 2;
      this.mouseY = CONFIG.VIEWPORT.HEIGHT / 2;
    });

    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
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
    const hudH = 100;
    const y = CONFIG.VIEWPORT.HEIGHT - hudH;
    if (this.mouseY < y) return;

    const age = CONFIG.AGES[game.currentAge];
    const unitStartX = 120;

    for (let i = 0; i < age.units.length; i++) {
      const bx = unitStartX + i * 90;
      if (pointInRect(this.mouseX, this.mouseY, bx, y + 5, 80, 28)) {
        game.spawnUnit(i);
        return;
      }
    }

    const evoNeeded = CONFIG.EVOLVE_XP[game.currentAge + 1];
    if (evoNeeded !== undefined) {
      const evoX = unitStartX + age.units.length * 90 + 10;
      if (pointInRect(this.mouseX, this.mouseY, evoX, y + 5, 90, 28)) {
        game.evolve();
        return;
      }
    }

    const spX = CONFIG.VIEWPORT.WIDTH - 110;
    if (pointInRect(this.mouseX, this.mouseY, spX, y + 5, 100, 28)) {
      game.useSpecial();
      return;
    }

    const row2Y = y + 38;
    if (pointInRect(this.mouseX, this.mouseY, 10, row2Y, 90, 24)) {
      game.buySlot();
      return;
    }

    for (let i = 0; i < age.turrets.length; i++) {
      const bx = 110 + i * 100;
      if (pointInRect(this.mouseX, this.mouseY, bx, row2Y, 90, 24)) {
        game.spawnTurret(i);
        return;
      }
    }
  }
}

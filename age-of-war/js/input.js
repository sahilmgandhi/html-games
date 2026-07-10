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
    const y = CONFIG.VIEWPORT.HEIGHT - 70;
    if (this.mouseY < y) return;

    const age = CONFIG.AGES[game.currentAge];
    const unitStartX = 120;

    for (let i = 0; i < age.units.length; i++) {
      const bx = unitStartX + i * 100;
      if (pointInRect(this.mouseX, this.mouseY, bx, y + 5, 85, 30)) {
        game.spawnUnit(i);
        return;
      }
    }

    const evoX = unitStartX + age.units.length * 100 + 20;
    if (pointInRect(this.mouseX, this.mouseY, evoX, y + 5, 100, 30)) {
      game.evolve();
      return;
    }

    const spX = CONFIG.VIEWPORT.WIDTH - 120;
    if (pointInRect(this.mouseX, this.mouseY, spX, y + 5, 110, 30)) {
      game.useSpecial();
      return;
    }
  }
}

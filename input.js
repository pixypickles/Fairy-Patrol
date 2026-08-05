export class InputController {
  constructor(stick, knob) {
    this.stick = stick;
    this.knob = knob;
    this.vector = { x: 0, y: 0 };
    this.pointerId = null;
    this.maxRadius = 42;
    this.keys = new Set();
    this.bind();
  }

  bind() {
    this.stick.addEventListener('pointerdown', (e) => {
      this.pointerId = e.pointerId;
      this.stick.setPointerCapture(e.pointerId);
      this.updatePointer(e);
    });
    this.stick.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.pointerId) this.updatePointer(e);
    });
    const end = (e) => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.vector.x = 0;
      this.vector.y = 0;
      this.knob.style.transform = 'translate(0px, 0px)';
    };
    this.stick.addEventListener('pointerup', end);
    this.stick.addEventListener('pointercancel', end);

    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
  }

  updatePointer(e) {
    const rect = this.stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const length = Math.hypot(dx, dy);
    const max = rect.width * 0.31;
    if (length > max) {
      dx = dx / length * max;
      dy = dy / length * max;
    }
    const nx = dx / max;
    const ny = dy / max;
    const dead = 0.18;
    if (Math.hypot(nx, ny) < dead) {
      this.vector.x = 0;
      this.vector.y = 0;
    } else {
      const angle = Math.atan2(ny, nx);
      const step = Math.PI / 4;
      const snapped = Math.round(angle / step) * step;
      this.vector.x = Math.cos(snapped);
      this.vector.y = Math.sin(snapped);
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  getVector() {
    let x = this.vector.x;
    let y = this.vector.y;
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('d')) x += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('w')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('s')) y += 1;
    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  }
}

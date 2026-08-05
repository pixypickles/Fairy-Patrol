export class Stage {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.offset = 0;
    this.speed = 44;
    this.patches = this.createPatches();
  }

  createPatches() {
    const patches = [];
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 110; i++) {
      patches.push({
        x: rnd() * this.width,
        y: rnd() * (this.height + 220),
        r: 10 + rnd() * 34,
        type: rnd(),
        phase: rnd() * Math.PI * 2
      });
    }
    return patches;
  }

  update(dt) { this.offset = (this.offset + this.speed * dt) % (this.height + 220); }

  draw(ctx, time) {
    ctx.fillStyle = '#7ca85d';
    ctx.fillRect(0, 0, this.width, this.height);

    const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
    bg.addColorStop(0, 'rgba(190,215,130,.18)');
    bg.addColorStop(.5, 'rgba(42,108,52,.06)');
    bg.addColorStop(1, 'rgba(230,220,135,.11)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const p of this.patches) {
      let y = (p.y + this.offset) % (this.height + 220) - 110;
      if (p.type < .42) {
        ctx.fillStyle = p.type < .2 ? 'rgba(91,137,67,.24)' : 'rgba(190,180,96,.15)';
        ctx.beginPath(); ctx.ellipse(p.x, y, p.r * 1.4, p.r, p.phase, 0, Math.PI*2); ctx.fill();
      } else if (p.type < .76) {
        ctx.strokeStyle = 'rgba(39,104,47,.43)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.x, y + 4); ctx.quadraticCurveTo(p.x - 4, y - 5, p.x - 2, y - 10);
        ctx.moveTo(p.x + 2, y + 4); ctx.quadraticCurveTo(p.x + 7, y - 3, p.x + 6, y - 9);
        ctx.stroke();
      } else if (p.type < .9) {
        ctx.fillStyle = 'rgba(110,105,82,.42)';
        ctx.beginPath(); ctx.ellipse(p.x, y, 3 + p.r*.08, 2 + p.r*.05, p.phase, 0, Math.PI*2); ctx.fill();
      } else {
        const sway = Math.sin(time * 2 + p.phase) * 1.5;
        ctx.fillStyle = '#f6df75';
        ctx.beginPath(); ctx.arc(p.x + sway, y, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath(); ctx.arc(p.x - 3 + sway, y, 2.2, 0, Math.PI*2); ctx.arc(p.x + 3 + sway, y, 2.2, 0, Math.PI*2); ctx.fill();
      }
    }
  }
}

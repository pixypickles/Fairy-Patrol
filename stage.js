export class Stage {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.offset = 0;
    this.speed = 42;
    this.patches = this.createPatches();
  }

  createPatches() {
    const patches = [];
    let seed = 20260805;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 155; i++) {
      patches.push({
        x: rnd() * this.width,
        y: rnd() * (this.height + 260),
        size: 7 + rnd() * 30,
        type: rnd(),
        phase: rnd() * Math.PI * 2,
        tone: rnd()
      });
    }
    return patches;
  }

  update(dt) {
    this.offset = (this.offset + this.speed * dt) % (this.height + 260);
  }

  draw(ctx, time) {
    const base = ctx.createLinearGradient(0, 0, this.width, this.height);
    base.addColorStop(0, '#89b86a');
    base.addColorStop(.5, '#78a85a');
    base.addColorStop(1, '#6f9e52');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, this.width, this.height);

    // Broad, soft patches make the meadow less tiled.
    for (const p of this.patches) {
      const y = (p.y + this.offset) % (this.height + 260) - 130;
      if (p.type < .28) {
        ctx.fillStyle = p.tone < .5 ? 'rgba(189,213,126,.13)' : 'rgba(45,111,54,.11)';
        ctx.beginPath();
        ctx.ellipse(p.x, y, p.size * 1.8, p.size, p.phase, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type < .68) {
        const sway = Math.sin(time * 1.7 + p.phase) * 1.5;
        ctx.strokeStyle = p.tone < .5 ? 'rgba(38,105,48,.44)' : 'rgba(73,130,58,.5)';
        ctx.lineWidth = 1.25 + p.tone;
        ctx.beginPath();
        ctx.moveTo(p.x, y + 5);
        ctx.quadraticCurveTo(p.x - 5 + sway, y - 3, p.x - 2 + sway, y - 11);
        ctx.moveTo(p.x + 1, y + 5);
        ctx.quadraticCurveTo(p.x + 7 + sway, y - 1, p.x + 5 + sway, y - 9);
        ctx.moveTo(p.x - 2, y + 5);
        ctx.quadraticCurveTo(p.x + sway, y - 5, p.x + 1 + sway, y - 15);
        ctx.stroke();
      } else if (p.type < .83) {
        ctx.fillStyle = p.tone < .55 ? 'rgba(104,103,78,.38)' : 'rgba(150,132,83,.28)';
        ctx.beginPath(); ctx.ellipse(p.x, y, 3 + p.size * .12, 2 + p.size * .07, p.phase, 0, Math.PI * 2); ctx.fill();
      } else if (p.type < .94) {
        const sway = Math.sin(time * 2 + p.phase) * 1.4;
        const petals = p.tone < .5 ? '#fff7d7' : '#f6c4df';
        ctx.fillStyle = petals;
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2;
          ctx.beginPath(); ctx.arc(p.x + sway + Math.cos(a) * 3, y + Math.sin(a) * 3, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#f4d661'; ctx.beginPath(); ctx.arc(p.x + sway, y, 1.7, 0, Math.PI * 2); ctx.fill();
      } else {
        // Clover-like accent.
        ctx.fillStyle = 'rgba(39,128,57,.62)';
        ctx.beginPath();
        ctx.arc(p.x - 3, y, 3.5, 0, Math.PI * 2);
        ctx.arc(p.x + 3, y, 3.5, 0, Math.PI * 2);
        ctx.arc(p.x, y - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // A faint moving light veil gives depth without looking like a pattern.
    const light = ctx.createLinearGradient(0, 0, this.width, 0);
    light.addColorStop(0, 'rgba(255,255,220,.02)');
    light.addColorStop(.45, 'rgba(255,255,220,.09)');
    light.addColorStop(1, 'rgba(255,255,220,.02)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}

export class River {
  constructor(width, height, seed = Math.random()) {
    this.width = width;
    this.screenHeight = height;
    this.height = 86;
    this.y = -120;
    this.speed = 42;
    this.dead = false;
    this.blocking = false;
    this.lanes = [width * 0.25, width * 0.5, width * 0.75];
    const count = seed < 0.55 ? 1 : 2;
    const choices = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, count);
    this.slots = choices.map(lane => ({ lane, x: this.lanes[lane], growth: 0, growing: false, complete: false, scored: false }));
  }

  update(dt, chick) {
    const complete = this.slots.filter(s => s.complete);
    const nearChick = this.y + this.height * 0.5 > chick.y - 72 && this.y - this.height * 0.5 < chick.y + 42;
    const aligned = complete.some(s => Math.abs(chick.x - s.x) < 46);
    this.blocking = nearChick && !aligned;

    if (!this.blocking) this.y += this.speed * dt;
    else this.y = Math.min(this.y, chick.y - this.height * 0.5 - 22);

    for (const slot of this.slots) {
      if (slot.growing && !slot.complete) {
        slot.growth = Math.min(1, slot.growth + dt / 0.75);
        if (slot.growth >= 1) slot.complete = true;
      }
    }
    if (this.y - this.height * 0.5 > this.screenHeight + 80) this.dead = true;
  }

  waterHit(x, y, radius = 22) {
    for (const slot of this.slots) {
      if (slot.growing || slot.complete) continue;
      const sproutY = this.y + this.height * 0.5 + 24;
      if (Math.hypot(x - slot.x, y - sproutY) < radius + 28) {
        slot.growing = true;
        slot.growth = 0.02;
        return slot;
      }
    }
    return null;
  }

  getGuidance(chick) {
    if (this.y < chick.y - 290 || this.y > chick.y + 40) return null;
    const complete = this.slots.filter(s => s.complete);
    if (!complete.length) return null;
    return complete.reduce((best, slot) => Math.abs(slot.x - chick.x) < Math.abs(best.x - chick.x) ? slot : best).x;
  }

  draw(ctx, time) {
    ctx.save();
    ctx.translate(0, this.y);

    const water = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
    water.addColorStop(0, '#78cdf0');
    water.addColorStop(.45, '#4daedb');
    water.addColorStop(1, '#338fc4');
    ctx.fillStyle = water;
    ctx.fillRect(0, -this.height / 2, this.width, this.height);

    ctx.fillStyle = '#6d8c4f';
    ctx.fillRect(0, -this.height / 2 - 9, this.width, 11);
    ctx.fillRect(0, this.height / 2 - 2, this.width, 11);
    ctx.fillStyle = 'rgba(237,255,255,.48)';
    for (let i = 0; i < 9; i++) {
      const x = (i * 79 + time * 26) % (this.width + 80) - 40;
      const yy = -24 + (i % 3) * 22;
      ctx.beginPath();
      ctx.ellipse(x, yy, 24, 4, -.08, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const slot of this.slots) {
      const sproutY = this.height / 2 + 24;
      if (!slot.complete) {
        const pulse = 1 + Math.sin(time * 3 + slot.lane) * .05;
        ctx.save();
        ctx.translate(slot.x, sproutY);
        ctx.scale(pulse, pulse);
        ctx.strokeStyle = '#2d6d35';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(-1, 0, 0, -11); ctx.stroke();
        ctx.fillStyle = '#66bd52';
        ctx.beginPath(); ctx.ellipse(-8, -8, 9, 5, -.45, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8, -8, 9, 5, .45, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      if (slot.growth > 0) {
        const g = slot.growth;
        const bridgeHalf = this.height * .5 * g;
        ctx.strokeStyle = '#347a3b';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        for (let n = -1; n <= 1; n++) {
          ctx.beginPath();
          ctx.moveTo(slot.x + n * 15, this.height / 2 + 4);
          ctx.quadraticCurveTo(slot.x + Math.sin(time * 4 + n) * 8, 0, slot.x + n * 15, this.height / 2 - bridgeHalf * 2 + 4);
          ctx.stroke();
        }
        const leafCount = Math.floor(10 * g);
        ctx.fillStyle = '#62b84f';
        for (let i = 0; i < leafCount; i++) {
          const yy = this.height / 2 - (i / 9) * this.height;
          const side = i % 2 ? -1 : 1;
          ctx.beginPath();
          ctx.ellipse(slot.x + side * (10 + (i % 3) * 5), yy, 15, 8, side * .35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
}

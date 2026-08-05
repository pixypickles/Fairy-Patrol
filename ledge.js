export class Ledge {
  constructor(width, height, seed = Math.random()) {
    this.width = width;
    this.screenHeight = height;
    this.height = 92;
    this.y = -130;
    this.speed = 42;
    this.dead = false;
    this.blocking = false;
    this.lanes = [width * 0.25, width * 0.5, width * 0.75];
    const count = seed < 0.58 ? 1 : 2;
    const choices = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, count);
    this.slots = choices.map(lane => ({ lane, x: this.lanes[lane], carve: 0, carving: false, complete: false }));
  }

  update(dt, chick) {
    const complete = this.slots.filter(s => s.complete);
    const nearChick = this.y + this.height * 0.5 > chick.y - 70 && this.y - this.height * 0.5 < chick.y + 42;
    const aligned = complete.some(s => Math.abs(chick.x - s.x) < 48);
    this.blocking = nearChick && !aligned;

    if (!this.blocking) this.y += this.speed * dt;
    else this.y = Math.min(this.y, chick.y - this.height * 0.5 - 22);

    for (const slot of this.slots) {
      if (slot.carving && !slot.complete) {
        slot.carve = Math.min(1, slot.carve + dt / 0.62);
        if (slot.carve >= 1) slot.complete = true;
      }
    }
    if (this.y - this.height * 0.5 > this.screenHeight + 90) this.dead = true;
  }

  windHit(x, y, radius = 24) {
    for (const slot of this.slots) {
      if (slot.carving || slot.complete) continue;
      const weakY = this.y + this.height * 0.10;
      if (Math.hypot(x - slot.x, y - weakY) < radius + 34) {
        slot.carving = true;
        slot.carve = 0.02;
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

    // Broad earthen ledge spanning the whole playfield.
    const soil = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
    soil.addColorStop(0, '#9b744e');
    soil.addColorStop(.42, '#795338');
    soil.addColorStop(1, '#5d402e');
    ctx.fillStyle = soil;
    ctx.fillRect(0, -this.height / 2, this.width, this.height);

    ctx.fillStyle = '#5f954d';
    ctx.fillRect(0, -this.height / 2 - 10, this.width, 17);
    ctx.fillStyle = '#a9855f';
    ctx.fillRect(0, this.height / 2 - 5, this.width, 9);

    // Small stones and roots make the cliff look natural rather than tiled.
    for (let i = 0; i < 18; i++) {
      const xx = (i * 71 + 29) % this.width;
      const yy = -25 + (i % 4) * 19;
      ctx.fillStyle = i % 3 === 0 ? '#bea17d' : '#6c4934';
      ctx.beginPath();
      ctx.ellipse(xx, yy, 4 + (i % 4), 2.5 + (i % 2), (i % 5) * .17, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const slot of this.slots) {
      const weakY = this.height * 0.10;
      if (!slot.complete) {
        ctx.strokeStyle = '#3e2b21';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(slot.x - 17, weakY - 23);
        ctx.lineTo(slot.x - 5, weakY - 8);
        ctx.lineTo(slot.x - 13, weakY + 6);
        ctx.lineTo(slot.x + 3, weakY + 18);
        ctx.lineTo(slot.x + 15, weakY + 31);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,244,196,.55)';
        ctx.beginPath();
        ctx.arc(slot.x, weakY - 8, 4 + Math.sin(time * 4 + slot.lane), 0, Math.PI * 2);
        ctx.fill();
      }

      if (slot.carve > 0) {
        const g = slot.carve;
        const rampW = 72 * g;
        const rampH = 86 * g;
        ctx.save();
        ctx.beginPath();
        ctx.rect(slot.x - rampW / 2, -this.height / 2 - 2, rampW, this.height + 6);
        ctx.clip();
        const ramp = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        ramp.addColorStop(0, '#bea071');
        ramp.addColorStop(1, '#8a6847');
        ctx.fillStyle = ramp;
        ctx.beginPath();
        ctx.moveTo(slot.x - rampW / 2, -this.height / 2);
        ctx.lineTo(slot.x + rampW / 2, -this.height / 2);
        ctx.lineTo(slot.x + rampW * .30, this.height / 2);
        ctx.lineTo(slot.x - rampW * .30, this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(78,54,36,.45)';
        ctx.lineWidth = 2;
        for (let n = 0; n < 5; n++) {
          const yy = -this.height / 2 + 16 + n * (rampH / 5);
          ctx.beginPath();
          ctx.moveTo(slot.x - rampW * .28, yy);
          ctx.lineTo(slot.x + rampW * .28, yy + 3);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

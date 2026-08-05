export class Chick {
  constructor(width, height) {
    this.lanes = [width * 0.25, width * 0.5, width * 0.75];
    this.lane = 1;
    this.targetX = this.lanes[this.lane];
    this.x = this.targetX;
    this.y = height * 0.82;
    this.wander = 0;
  }

  guide(direction) {
    this.lane = Math.max(0, Math.min(2, this.lane + direction));
    this.targetX = this.lanes[this.lane];
  }

  update(dt, time) {
    const desire = this.targetX + Math.sin(time * 1.7) * 8 + Math.sin(time * 0.63) * 5;
    this.x += (desire - this.x) * Math.min(1, dt * 1.6);
    this.y += Math.sin(time * 3.1) * 2.5 * dt;
  }

  draw(ctx, time) {
    const bob = Math.abs(Math.sin(time * 5)) * 3;
    const step = Math.sin(time * 8) * 3;
    ctx.save();
    ctx.translate(this.x, this.y - bob);
    ctx.strokeStyle = '#2d2b21';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.ellipse(0, 5, 17, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -12, 14, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2d2b21';
    ctx.beginPath(); ctx.arc(-4, -14, 1.7, 0, Math.PI*2); ctx.arc(4, -14, 1.7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f1a438';
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-5, -5); ctx.lineTo(5, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d98b22'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, 23); ctx.lineTo(-8 + step, 28); ctx.moveTo(6, 23); ctx.lineTo(8 - step, 28); ctx.stroke();
    ctx.restore();
  }
}

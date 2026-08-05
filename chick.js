export class Chick {
  constructor(width, height) {
    this.lanes = [width * 0.25, width * 0.5, width * 0.75];
    this.lane = 1;
    this.targetX = this.lanes[this.lane];
    this.x = this.targetX;
    this.y = height * 0.82;
  }

  guide(direction) {
    this.lane = Math.max(0, Math.min(2, this.lane + direction));
    this.targetX = this.lanes[this.lane];
  }

  update(dt, time) {
    const desire = this.targetX + Math.sin(time * 1.55) * 7 + Math.sin(time * 0.71) * 4;
    this.x += (desire - this.x) * Math.min(1, dt * 1.55);
  }

  draw(ctx, time) {
    const walk = Math.sin(time * 7.5);
    const bob = Math.abs(walk) * 3.4;
    const tilt = Math.sin(time * 3.2) * 0.035;
    ctx.save();
    ctx.translate(this.x, this.y - bob);
    ctx.rotate(tilt);
    ctx.strokeStyle = '#2e2a1f';
    ctx.lineWidth = 3.8;
    ctx.lineJoin = 'round';

    // Tiny feet behind the body.
    ctx.strokeStyle = '#d98326';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, 19); ctx.lineTo(-8 + walk * 4, 25);
    ctx.moveTo(6, 19); ctx.lineTo(8 - walk * 4, 25);
    ctx.stroke();

    // Rounded fluffy body.
    ctx.strokeStyle = '#2e2a1f';
    ctx.fillStyle = '#ffd84f';
    ctx.beginPath();
    ctx.ellipse(0, 5, 16.5, 19, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Side wings.
    ctx.fillStyle = '#f2bd31';
    ctx.beginPath();
    ctx.ellipse(-14, 6 + walk, 6, 9, -.5, 0, Math.PI * 2);
    ctx.ellipse(14, 6 - walk, 6, 9, .5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Head, tuft and cheeks.
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath(); ctx.arc(0, -12, 14.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -26); ctx.quadraticCurveTo(-1, -32, 1, -26);
    ctx.quadraticCurveTo(4, -31, 5, -24);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#2e2a1f';
    ctx.beginPath(); ctx.arc(-4.8, -14, 2, 0, Math.PI * 2); ctx.arc(4.8, -14, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,124,103,.52)';
    ctx.beginPath(); ctx.arc(-8.5, -9.5, 2.5, 0, Math.PI * 2); ctx.arc(8.5, -9.5, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f19b2b';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(-6, -5); ctx.lineTo(6, -5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

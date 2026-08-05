export class Chick {
  constructor(width, height) {
    this.lanes = [width * 0.25, width * 0.5, width * 0.75];
    this.lane = 1;
    this.targetX = this.lanes[this.lane];
    this.x = this.targetX;
    this.y = height * 0.82;
    this.lookTimer = 0;
    this.lookDir = 0;
  }

  guide(direction) {
    this.lane = Math.max(0, Math.min(2, this.lane + direction));
    this.targetX = this.lanes[this.lane];
  }

  update(dt, time) {
    this.lookTimer -= dt;
    if (this.lookTimer <= 0) {
      this.lookTimer = 1.4 + Math.random() * 2.4;
      this.lookDir = [-1, 0, 0, 1][Math.floor(Math.random() * 4)];
    }
    const wander = Math.sin(time * 1.45) * 6 + Math.sin(time * .69) * 3.5;
    this.x += (this.targetX + wander - this.x) * Math.min(1, dt * 1.45);
  }

  draw(ctx, time) {
    const walk = Math.sin(time * 6.6);
    const bob = Math.abs(walk) * 3;
    const tilt = Math.sin(time * 2.8) * .035 + this.lookDir * .03;
    ctx.save();
    ctx.translate(this.x, this.y - bob);
    ctx.rotate(tilt);

    // Soft ground shadow.
    ctx.fillStyle = 'rgba(47,72,38,.18)';
    ctx.beginPath(); ctx.ellipse(0, 25 + bob, 18, 6, 0, 0, Math.PI * 2); ctx.fill();

    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#342c1d';
    ctx.lineWidth = 3.6;

    // Feet.
    ctx.strokeStyle = '#d47c22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, 18); ctx.lineTo(-9 + walk * 3.5, 25);
    ctx.moveTo(6, 18); ctx.lineTo(9 - walk * 3.5, 25);
    ctx.stroke();

    // Fluffy body.
    const bodyGrad = ctx.createRadialGradient(-5, -2, 2, 0, 5, 22);
    bodyGrad.addColorStop(0, '#fff38b');
    bodyGrad.addColorStop(.72, '#ffd848');
    bodyGrad.addColorStop(1, '#e9ae2c');
    ctx.strokeStyle = '#342c1d';
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 5, 17, 19.5, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Wings flap gently.
    ctx.fillStyle = '#efbd31';
    const flap = walk * 2.2;
    ctx.beginPath();
    ctx.ellipse(-14.5, 6 + flap, 6.3, 9.2, -.55, 0, Math.PI * 2);
    ctx.ellipse(14.5, 6 - flap, 6.3, 9.2, .55, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Head and tuft.
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(0, -12, 14.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, -26); ctx.quadraticCurveTo(-2, -32, 1, -26);
    ctx.quadraticCurveTo(4, -31, 6, -24);
    ctx.quadraticCurveTo(2, -27, -5, -26);
    ctx.fill(); ctx.stroke();

    const eyeShift = this.lookDir * 1.5;
    ctx.fillStyle = '#2d291e';
    ctx.beginPath(); ctx.arc(-4.8 + eyeShift, -14, 2.1, 0, Math.PI * 2); ctx.arc(4.8 + eyeShift, -14, 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(-5.4 + eyeShift, -14.8, .65, 0, Math.PI * 2); ctx.arc(4.2 + eyeShift, -14.8, .65, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,119,93,.48)';
    ctx.beginPath(); ctx.arc(-8.7, -9.2, 2.5, 0, Math.PI * 2); ctx.arc(8.7, -9.2, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f29b28';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(-6.3, -5); ctx.lineTo(6.3, -5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

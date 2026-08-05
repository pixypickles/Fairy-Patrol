export class Chick {
  constructor(width, height) {
    this.lanes = [width * 0.25, width * 0.5, width * 0.75];
    this.lane = 1;
    this.targetX = this.lanes[this.lane];
    this.x = this.targetX;
    this.y = height * 0.82;
    this.lookTimer = 1.2;
    this.lookMode = 'forward';
    this.turnTime = 0;
    this.moveDir = 0;
  }

  guide(direction) {
    this.lane = Math.max(0, Math.min(2, this.lane + direction));
    this.targetX = this.lanes[this.lane];
  }

  update(dt, time) {
    const dx = this.targetX - this.x;
    this.moveDir = Math.abs(dx) > 4 ? Math.sign(dx) : 0;

    this.lookTimer -= dt;
    this.turnTime = Math.max(0, this.turnTime - dt);
    if (this.lookTimer <= 0) {
      this.lookTimer = 2.2 + Math.random() * 3.4;
      const r = Math.random();
      this.lookMode = r < 0.22 ? 'back' : r < 0.50 ? (Math.random() < .5 ? 'left' : 'right') : 'forward';
      this.turnTime = this.lookMode === 'back' ? .65 : .85;
    }
    if (this.turnTime <= 0) this.lookMode = 'forward';

    const wander = Math.sin(time * 1.45) * 6 + Math.sin(time * .69) * 3.5;
    this.x += (this.targetX + wander - this.x) * Math.min(1, dt * 1.45);
  }

  draw(ctx, time) {
    const walk = Math.sin(time * 6.6);
    const bob = Math.abs(walk) * 3;
    let facing = this.moveDir < 0 ? 'left' : this.moveDir > 0 ? 'right' : this.lookMode;
    if (facing === 'forward') facing = 'up';

    ctx.save();
    ctx.translate(this.x, this.y - bob);
    const side = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
    ctx.rotate(Math.sin(time * 2.8) * .025 + side * .045);

    ctx.fillStyle = 'rgba(47,72,38,.18)';
    ctx.beginPath(); ctx.ellipse(0, 25 + bob, 18, 6, 0, 0, Math.PI * 2); ctx.fill();

    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#342c1d';
    ctx.lineWidth = 3.6;

    ctx.strokeStyle = '#d47c22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, 18); ctx.lineTo(-9 + walk * 3.5, 25);
    ctx.moveTo(6, 18); ctx.lineTo(9 - walk * 3.5, 25);
    ctx.stroke();

    const bodyGrad = ctx.createRadialGradient(-5, -2, 2, 0, 5, 22);
    bodyGrad.addColorStop(0, '#fff38b');
    bodyGrad.addColorStop(.72, '#ffd848');
    bodyGrad.addColorStop(1, '#e9ae2c');
    ctx.strokeStyle = '#342c1d';
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.ellipse(0, 5, 17, 19.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#efbd31';
    const flap = walk * 2.2;
    ctx.beginPath();
    ctx.ellipse(-14.5, 6 + flap, 6.3, 9.2, -.55, 0, Math.PI * 2);
    ctx.ellipse(14.5, 6 - flap, 6.3, 9.2, .55, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(0, -12, 14.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, -26); ctx.quadraticCurveTo(-2, -32, 1, -26);
    ctx.quadraticCurveTo(4, -31, 6, -24);
    ctx.quadraticCurveTo(2, -27, -5, -26);
    ctx.fill(); ctx.stroke();

    if (facing === 'up') {
      // Default: the chick walks away from the viewer. Only its fluffy nape is visible.
      ctx.strokeStyle = '#d9a724';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -12, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (facing === 'back') {
      // A brief cute turn toward the viewer.
      ctx.fillStyle = '#2d291e';
      ctx.beginPath(); ctx.arc(-4.8, -14, 2.1, 0, Math.PI * 2); ctx.arc(4.8, -14, 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f29b28';
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-6.3, -5); ctx.lineTo(6.3, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      // Side view while changing lanes or glancing around.
      const sx = facing === 'left' ? -1 : 1;
      ctx.fillStyle = '#2d291e';
      ctx.beginPath(); ctx.arc(sx * 4.5, -14, 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f29b28';
      ctx.beginPath();
      ctx.moveTo(sx * 11, -10); ctx.lineTo(sx * 4, -6); ctx.lineTo(sx * 4, -13); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
}

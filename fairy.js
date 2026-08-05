export class Fairy {
  constructor(width, height) {
    this.x = width * 0.5;
    this.y = height * 0.62;
    this.speed = 300;
    this.radius = 24;
  }

  update(dt, input, width, height) {
    this.x += input.x * this.speed * dt;
    this.y += input.y * this.speed * dt;
    this.x = Math.max(34, Math.min(width - 34, this.x));
    this.y = Math.max(95, Math.min(height - 52, this.y));
  }

  draw(ctx, time) {
    const flap = Math.sin(time * 9) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Four translucent rainbow wings.
    const wing = (side, upper) => {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate((upper ? -0.42 : 0.42) + flap * side * (upper ? 1 : -1));
      const g = ctx.createLinearGradient(0, -28, 55, 28);
      g.addColorStop(0, 'rgba(255,120,160,.42)');
      g.addColorStop(.18, 'rgba(255,190,90,.38)');
      g.addColorStop(.36, 'rgba(255,245,120,.35)');
      g.addColorStop(.54, 'rgba(100,220,150,.34)');
      g.addColorStop(.72, 'rgba(100,190,255,.36)');
      g.addColorStop(.86, 'rgba(150,125,255,.34)');
      g.addColorStop(1, 'rgba(230,130,245,.34)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.bezierCurveTo(20, upper ? -33 : 33, 53, upper ? -34 : 34, 50, 0);
      ctx.bezierCurveTo(45, upper ? 20 : -20, 21, upper ? 24 : -24, 5, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.62)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(126,114,210,.25)';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.quadraticCurveTo(28, upper ? -10 : 10, 45, upper ? -2 : 2);
      ctx.moveTo(14, upper ? -5 : 5);
      ctx.quadraticCurveTo(26, upper ? -20 : 20, 39, upper ? -22 : 22);
      ctx.stroke();
      ctx.restore();
    };
    wing(-1, true); wing(1, true); wing(-1, false); wing(1, false);

    // Human-shaped fairy.
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2c2730';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#ffd8bd';
    ctx.beginPath(); ctx.arc(0, -22, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6b85d';
    ctx.beginPath();
    ctx.arc(-2, -25, 13, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(13, -20, 9, -9);
    ctx.quadraticCurveTo(3, -15, -9, -10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4b362e';
    ctx.beginPath(); ctx.arc(-4, -21, 1.4, 0, Math.PI*2); ctx.arc(4, -21, 1.4, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2c2730';
    ctx.beginPath(); ctx.moveTo(-1, -18); ctx.quadraticCurveTo(0, -16, 2, -18); ctx.stroke();

    ctx.fillStyle = '#f2a9cf';
    ctx.beginPath();
    ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(15, 19); ctx.lineTo(-15, 19); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2c2730';
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-19, 9); ctx.moveTo(8, 0); ctx.lineTo(19, 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 19); ctx.lineTo(-8, 32); ctx.moveTo(6, 19); ctx.lineTo(8, 32); ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const a = time * 2 + i * Math.PI / 2;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.25 * Math.sin(time * 5 + i)})`;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 30, Math.sin(a) * 24, 2.2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

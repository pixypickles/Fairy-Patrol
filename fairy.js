export class Fairy {
  constructor(width, height) {
    this.x = width * 0.5;
    this.y = height * 0.62;
    this.speed = 300;
    this.radius = 25;
  }

  update(dt, input, width, height) {
    this.x += input.x * this.speed * dt;
    this.y += input.y * this.speed * dt;
    this.x = Math.max(40, Math.min(width - 40, this.x));
    this.y = Math.max(105, Math.min(height - 48, this.y));
  }

  drawWing(ctx, side, upper, time) {
    const flap = Math.sin(time * 8.5 + (upper ? 0 : 0.55));
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate((upper ? -0.34 : 0.43) + flap * (upper ? 0.11 : 0.08));

    const length = upper ? 57 : 48;
    const height = upper ? 36 : 29;
    const g = ctx.createLinearGradient(2, -height, length, height);
    g.addColorStop(0.00, 'rgba(255,110,160,.48)');
    g.addColorStop(0.16, 'rgba(255,175,86,.43)');
    g.addColorStop(0.32, 'rgba(255,238,112,.40)');
    g.addColorStop(0.48, 'rgba(104,225,151,.40)');
    g.addColorStop(0.64, 'rgba(87,198,255,.43)');
    g.addColorStop(0.82, 'rgba(147,124,255,.41)');
    g.addColorStop(1.00, 'rgba(236,126,245,.42)');

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.bezierCurveTo(15, upper ? -30 : 25, 43, upper ? -43 : 34, length, upper ? -8 : 7);
    ctx.bezierCurveTo(length + 4, upper ? 8 : 18, 31, upper ? 26 : 26, 3, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,.86)';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Fine butterfly-like veins.
    ctx.strokeStyle = 'rgba(92,83,160,.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(7, 0); ctx.quadraticCurveTo(28, upper ? -12 : 12, length - 5, upper ? -6 : 7);
    ctx.moveTo(14, upper ? -4 : 4); ctx.quadraticCurveTo(28, upper ? -27 : 23, length - 12, upper ? -27 : 24);
    ctx.moveTo(20, upper ? 8 : -6); ctx.quadraticCurveTo(34, upper ? 14 : -14, length - 15, upper ? 8 : -5);
    ctx.stroke();

    // Tiny iridescent dots.
    for (let i = 0; i < 4; i++) {
      const px = 19 + i * 8;
      const py = (upper ? -1 : 1) * (8 + (i % 2) * 7);
      ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.18 * Math.sin(time * 5 + i)})`;
      ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  draw(ctx, time) {
    const hover = Math.sin(time * 3.5) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + hover);

    this.drawWing(ctx, -1, true, time);
    this.drawWing(ctx, 1, true, time);
    this.drawWing(ctx, -1, false, time);
    this.drawWing(ctx, 1, false, time);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#332937';
    ctx.lineWidth = 3.6;

    // Legs behind the dress.
    ctx.strokeStyle = '#6b4b42';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-5, 18); ctx.lineTo(-7, 31);
    ctx.moveTo(5, 18); ctx.lineTo(7, 31);
    ctx.stroke();

    // Dress with a small petal hem.
    ctx.strokeStyle = '#332937';
    ctx.fillStyle = '#f4a7d5';
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.quadraticCurveTo(0, -10, 8, -6);
    ctx.lineTo(14, 17);
    ctx.quadraticCurveTo(8, 22, 3, 18);
    ctx.quadraticCurveTo(0, 24, -3, 18);
    ctx.quadraticCurveTo(-8, 22, -14, 17);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.52)';
    ctx.beginPath(); ctx.ellipse(-3, 4, 4, 10, -.2, 0, Math.PI * 2); ctx.fill();

    // Arms and tiny hands.
    ctx.strokeStyle = '#6b4b42';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-8, 1); ctx.lineTo(-19, 9);
    ctx.moveTo(8, 1); ctx.lineTo(19, 9);
    ctx.stroke();
    ctx.fillStyle = '#ffd8bd';
    ctx.beginPath(); ctx.arc(-19, 9, 2.7, 0, Math.PI * 2); ctx.arc(19, 9, 2.7, 0, Math.PI * 2); ctx.fill();

    // Head and ears.
    ctx.strokeStyle = '#332937';
    ctx.lineWidth = 3.6;
    ctx.fillStyle = '#ffd8bd';
    ctx.beginPath(); ctx.arc(0, -23, 13.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-12.2, -23, 2.7, 0, Math.PI * 2); ctx.arc(12.2, -23, 2.7, 0, Math.PI * 2); ctx.fill();

    // Hair silhouette and side locks.
    ctx.fillStyle = '#d39a47';
    ctx.beginPath();
    ctx.arc(-1, -27, 14.7, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(15, -22, 10, -9);
    ctx.quadraticCurveTo(6, -14, 3, -10);
    ctx.quadraticCurveTo(-1, -15, -8, -10);
    ctx.quadraticCurveTo(-14, -17, -13, -25);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -15); ctx.quadraticCurveTo(-16, -5, -10, 1);
    ctx.moveTo(9, -15); ctx.quadraticCurveTo(15, -5, 10, 1);
    ctx.stroke();

    // Face.
    ctx.fillStyle = '#3f3037';
    ctx.beginPath(); ctx.arc(-4.5, -23, 1.45, 0, Math.PI * 2); ctx.arc(4.5, -23, 1.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(244,120,148,.48)';
    ctx.beginPath(); ctx.arc(-7.5, -19, 2, 0, Math.PI * 2); ctx.arc(7.5, -19, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8b4b59';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, -18); ctx.quadraticCurveTo(0, -16, 2, -18); ctx.stroke();

    // Orbiting fairy dust.
    for (let i = 0; i < 6; i++) {
      const a = time * 1.8 + i * Math.PI / 3;
      const rx = 31 + (i % 2) * 5;
      const ry = 25 + (i % 3) * 3;
      const twinkle = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(time * 6 + i));
      ctx.fillStyle = `rgba(255,255,235,${twinkle})`;
      ctx.beginPath(); ctx.arc(Math.cos(a) * rx, Math.sin(a) * ry, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

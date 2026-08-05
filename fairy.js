export class Fairy {
  constructor(width, height) {
    this.x = width * 0.5;
    this.y = height * 0.62;
    this.speed = 300;
  }

  update(dt, input, width, height) {
    this.x += input.x * this.speed * dt;
    this.y += input.y * this.speed * dt;
    this.x = Math.max(48, Math.min(width - 48, this.x));
    this.y = Math.max(115, Math.min(height - 54, this.y));
  }

  drawWing(ctx, side, upper, time) {
    const flap = Math.sin(time * 7.2 + (upper ? 0 : 0.65));
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate((upper ? -0.42 : 0.48) + flap * (upper ? 0.12 : 0.09));

    const tipX = upper ? 64 : 53;
    const tipY = upper ? -14 : 13;
    const grad = ctx.createLinearGradient(2, -35, tipX, 33);
    const colors = [
      ['rgba(255,118,168,.48)', 0], ['rgba(255,180,92,.45)', .16],
      ['rgba(255,237,116,.42)', .31], ['rgba(102,224,153,.42)', .47],
      ['rgba(83,193,255,.45)', .63], ['rgba(145,122,255,.43)', .81],
      ['rgba(238,128,245,.44)', 1]
    ];
    colors.forEach(([c, p]) => grad.addColorStop(p, c));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(3, 0);
    if (upper) {
      ctx.bezierCurveTo(17, -35, 45, -48, 64, -20);
      ctx.bezierCurveTo(73, -5, 55, 17, 30, 21);
      ctx.bezierCurveTo(20, 22, 11, 13, 3, 0);
    } else {
      ctx.bezierCurveTo(14, 18, 38, 39, 55, 25);
      ctx.bezierCurveTo(64, 17, 52, -2, 28, -13);
      ctx.bezierCurveTo(17, -14, 9, -8, 3, 0);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(91,78,164,.23)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(5, 0); ctx.quadraticCurveTo(28, upper ? -12 : 11, tipX - 5, tipY);
    ctx.moveTo(13, upper ? -3 : 4); ctx.quadraticCurveTo(28, upper ? -31 : 27, tipX - 14, upper ? -31 : 23);
    ctx.moveTo(16, upper ? 6 : -5); ctx.quadraticCurveTo(34, upper ? 15 : -14, tipX - 16, upper ? 10 : -7);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const px = 17 + i * 7;
      const py = (upper ? -1 : 1) * (7 + (i % 3) * 6);
      const alpha = .22 + .38 * (.5 + .5 * Math.sin(time * 6 + i * 1.7));
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath(); ctx.arc(px, py, i % 2 ? 1.5 : 2.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  draw(ctx, time) {
    const hover = Math.sin(time * 3.2) * 2.4;
    const sway = Math.sin(time * 2.1) * .035;
    ctx.save();
    ctx.translate(this.x, this.y + hover);
    ctx.rotate(sway);

    this.drawWing(ctx, -1, true, time);
    this.drawWing(ctx, 1, true, time);
    this.drawWing(ctx, -1, false, time);
    this.drawWing(ctx, 1, false, time);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Legs and slippers.
    ctx.strokeStyle = '#765042';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-5, 20); ctx.lineTo(-7, 33);
    ctx.moveTo(5, 20); ctx.lineTo(7, 33);
    ctx.stroke();
    ctx.fillStyle = '#d968a7';
    ctx.beginPath(); ctx.ellipse(-8, 34, 5, 2.7, -.2, 0, Math.PI * 2); ctx.ellipse(8, 34, 5, 2.7, .2, 0, Math.PI * 2); ctx.fill();

    // Dress/body.
    ctx.strokeStyle = '#42313d';
    ctx.lineWidth = 3.5;
    const dressGrad = ctx.createLinearGradient(0, -7, 0, 24);
    dressGrad.addColorStop(0, '#f8b8dd');
    dressGrad.addColorStop(1, '#d96cac');
    ctx.fillStyle = dressGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -7); ctx.quadraticCurveTo(0, -13, 10, -7);
    ctx.lineTo(16, 18);
    ctx.quadraticCurveTo(11, 25, 5, 20);
    ctx.quadraticCurveTo(0, 27, -5, 20);
    ctx.quadraticCurveTo(-11, 25, -16, 18);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(-3, 5, 4.5, 11, -.18, 0, Math.PI * 2); ctx.fill();

    // Arms and hands.
    const armSwing = Math.sin(time * 4.2) * 1.8;
    ctx.strokeStyle = '#765042';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-9, 0); ctx.lineTo(-21, 9 + armSwing);
    ctx.moveTo(9, 0); ctx.lineTo(21, 9 - armSwing);
    ctx.stroke();
    ctx.fillStyle = '#ffd9c1';
    ctx.beginPath(); ctx.arc(-21, 9 + armSwing, 3, 0, Math.PI * 2); ctx.arc(21, 9 - armSwing, 3, 0, Math.PI * 2); ctx.fill();

    // Head and hair.
    ctx.strokeStyle = '#42313d';
    ctx.lineWidth = 3.5;
    ctx.fillStyle = '#ffd9c1';
    ctx.beginPath(); ctx.arc(0, -25, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    const hair = ctx.createLinearGradient(-12, -39, 13, -11);
    hair.addColorStop(0, '#f3d27a');
    hair.addColorStop(1, '#b97732');
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -29, 16.2, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(17, -23, 11, -9);
    ctx.quadraticCurveTo(5, -16, 1, -10);
    ctx.quadraticCurveTo(-4, -17, -10, -10);
    ctx.quadraticCurveTo(-17, -19, -14, -29);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, -17); ctx.quadraticCurveTo(-18, -4, -10, 2);
    ctx.moveTo(10, -17); ctx.quadraticCurveTo(18, -4, 10, 2);
    ctx.stroke();

    // Flower hair ornament.
    ctx.fillStyle = '#fff4a8';
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      ctx.beginPath(); ctx.arc(-10 + Math.cos(a) * 4, -35 + Math.sin(a) * 4, 2.7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#f39b5e'; ctx.beginPath(); ctx.arc(-10, -35, 2.3, 0, Math.PI * 2); ctx.fill();

    // Face.
    ctx.fillStyle = '#3f3037';
    ctx.beginPath(); ctx.arc(-5, -25, 1.6, 0, Math.PI * 2); ctx.arc(5, -25, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(244,120,148,.5)';
    ctx.beginPath(); ctx.arc(-8, -20, 2.2, 0, Math.PI * 2); ctx.arc(8, -20, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#934f63'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-2, -19); ctx.quadraticCurveTo(0, -16.5, 2, -19); ctx.stroke();

    // Fairy dust.
    for (let i = 0; i < 8; i++) {
      const a = time * 1.5 + i * Math.PI / 4;
      const rx = 35 + (i % 2) * 8;
      const ry = 30 + (i % 3) * 4;
      const alpha = .22 + .55 * (.5 + .5 * Math.sin(time * 6.5 + i));
      ctx.fillStyle = `rgba(255,255,225,${alpha})`;
      ctx.beginPath(); ctx.arc(Math.cos(a) * rx, Math.sin(a) * ry, 1.4 + (i % 3) * .55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

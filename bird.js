export class Bird {
  constructor(width, height, variant = 0) {
    this.width = width;
    this.height = height;
    this.variant = variant;
    this.x = 70 + Math.random() * (width - 140);
    this.y = -55;
    this.speed = 42 + Math.random() * 14;
    this.phase = Math.random() * Math.PI * 2;
    this.state = 'approach';
    this.escapeX = 0;
    this.escapeY = -1;
    this.hitRadius = 28;
    this.scored = false;
  }

  update(dt, chick, time) {
    if (this.state === 'approach') {
      const targetX = chick.x + Math.sin(time * 1.1 + this.phase) * 42;
      this.x += (targetX - this.x) * Math.min(1, dt * 0.55);
      this.y += this.speed * dt;
      this.x += Math.sin(time * 2.2 + this.phase) * 10 * dt;
    } else {
      this.x += this.escapeX * 250 * dt;
      this.y += this.escapeY * 250 * dt;
    }
  }

  scare(sourceX, sourceY) {
    if (this.state !== 'approach') return false;
    let dx = this.x - sourceX;
    let dy = this.y - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    // Always bias the retreat upward so it visibly flies back out of the scene.
    this.escapeX = dx * 0.7;
    this.escapeY = Math.min(-0.75, dy - 0.55);
    const escapeLen = Math.hypot(this.escapeX, this.escapeY) || 1;
    this.escapeX /= escapeLen;
    this.escapeY /= escapeLen;
    this.state = 'retreat';
    return true;
  }

  isOffscreen() {
    return this.x < -90 || this.x > this.width + 90 || this.y < -100 || this.y > this.height + 100;
  }

  draw(ctx, time) {
    const flap = Math.sin(time * 10 + this.phase);
    const retreating = this.state === 'retreat';
    const angle = retreating ? Math.atan2(this.escapeY, this.escapeX) + Math.PI / 2 : 0;
    const bob = Math.sin(time * 4.2 + this.phase) * 2;

    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(angle);

    // Soft shadow makes it clear that this bird is above the ground.
    ctx.save();
    ctx.rotate(-angle);
    ctx.fillStyle = 'rgba(37,68,42,.16)';
    ctx.beginPath();
    ctx.ellipse(8, 34, 25, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const palettes = [
      { body: '#72c8ef', belly: '#ffe17a', wing: '#8168d8', cheek: '#ff9bb7' },
      { body: '#8edc9e', belly: '#fff19b', wing: '#ef83ae', cheek: '#f7a36f' },
      { body: '#f0a1c6', belly: '#ffe98c', wing: '#62b7df', cheek: '#ff8f8f' }
    ];
    const p = palettes[this.variant % palettes.length];

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3c342d';
    ctx.lineWidth = 3.2;

    // Tail feathers.
    ctx.fillStyle = p.wing;
    ctx.beginPath();
    ctx.moveTo(-8, 17); ctx.lineTo(-18, 31); ctx.lineTo(-4, 27);
    ctx.lineTo(2, 34); ctx.lineTo(6, 18); ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Wings use three clearly different silhouettes as flap moves.
    const wingLift = flap * 15;
    ctx.fillStyle = p.wing;
    ctx.beginPath();
    ctx.moveTo(-12, -1);
    ctx.quadraticCurveTo(-30, -15 - wingLift, -35, -2 - wingLift * .45);
    ctx.quadraticCurveTo(-28, 8, -10, 11);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -1);
    ctx.quadraticCurveTo(30, -15 - wingLift, 35, -2 - wingLift * .45);
    ctx.quadraticCurveTo(28, 8, 10, 11);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Round, friendly body.
    const bodyGrad = ctx.createRadialGradient(-7, -9, 2, 0, 3, 25);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(.16, p.body);
    bodyGrad.addColorStop(1, p.body);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.ellipse(0, 4, 20, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = p.belly;
    ctx.beginPath(); ctx.ellipse(0, 10, 12, 13, 0, 0, Math.PI * 2); ctx.fill();

    // Tuft.
    ctx.fillStyle = p.wing;
    ctx.beginPath();
    ctx.moveTo(-5, -17); ctx.quadraticCurveTo(-2, -28, 2, -18);
    ctx.quadraticCurveTo(8, -26, 7, -14); ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Face points down toward the chick while approaching.
    ctx.fillStyle = '#332e28';
    ctx.beginPath(); ctx.arc(-6, -5, 2.3, 0, Math.PI * 2); ctx.arc(6, -5, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.cheek;
    ctx.beginPath(); ctx.arc(-11, 1, 3.2, 0, Math.PI * 2); ctx.arc(11, 1, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a13e';
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(-6, 4); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();

    if (retreating) {
      // Small surprise mark, no words needed.
      ctx.fillStyle = '#fff6a0';
      ctx.strokeStyle = '#5b4a2f';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(25, -23, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5b4a2f';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 25, -23);
    }

    ctx.restore();
  }
}

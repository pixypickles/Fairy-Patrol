export class Cat {
  constructor(width, height, variant = 0) {
    this.width = width;
    this.height = height;
    this.variant = variant;
    this.x = 75 + Math.random() * (width - 150);
    this.y = -65;
    this.speed = 31 + Math.random() * 8;
    this.phase = Math.random() * Math.PI * 2;
    this.state = 'approach';
    this.escapeX = 0;
    this.escapeY = -1;
    this.hitRadius = 31;
  }

  update(dt, chick, time) {
    if (this.state === 'approach') {
      const targetX = chick.x + Math.sin(time * 0.8 + this.phase) * 54;
      this.x += (targetX - this.x) * Math.min(1, dt * 0.42);
      this.y += this.speed * dt;
      this.x += Math.sin(time * 2.1 + this.phase) * 5 * dt;
    } else {
      this.x += this.escapeX * 175 * dt;
      this.y += this.escapeY * 175 * dt;
    }
  }

  scare(sourceX, sourceY) {
    if (this.state !== 'approach') return false;
    let dx = this.x - sourceX;
    let dy = this.y - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    this.escapeX = dx * 0.85;
    this.escapeY = Math.min(-0.65, dy - 0.45);
    const escapeLen = Math.hypot(this.escapeX, this.escapeY) || 1;
    this.escapeX /= escapeLen;
    this.escapeY /= escapeLen;
    this.state = 'retreat';
    return true;
  }

  isOffscreen() {
    return this.x < -100 || this.x > this.width + 100 || this.y < -110 || this.y > this.height + 110;
  }

  draw(ctx, time) {
    const retreating = this.state === 'retreat';
    const step = Math.sin(time * 8 + this.phase);
    const bob = Math.abs(step) * -1.8;
    const angle = retreating ? Math.atan2(this.escapeY, this.escapeX) + Math.PI / 2 : 0;

    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(angle);

    // Ground shadow: cats are walking on the meadow rather than flying.
    ctx.save();
    ctx.rotate(-angle);
    ctx.fillStyle = 'rgba(42,65,34,.18)';
    ctx.beginPath();
    ctx.ellipse(0, 28, 31, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const palettes = [
      { fur: '#e9a44e', light: '#ffe0a4', stripe: '#8a562c', collar: '#74c9b1' },
      { fur: '#9da3ad', light: '#e9edf2', stripe: '#565d68', collar: '#d99bd0' }
    ];
    const p = palettes[this.variant % palettes.length];

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b312b';
    ctx.lineWidth = 3.3;

    // Curved tail, gently swishing during approach and held high while retreating.
    const tailSwing = retreating ? -8 : step * 9;
    ctx.strokeStyle = '#3b312b';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(17, 13);
    ctx.quadraticCurveTo(38, 13 + tailSwing, 34, -12);
    ctx.quadraticCurveTo(31, -25, 41, -27);
    ctx.stroke();
    ctx.strokeStyle = p.fur;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(17, 13);
    ctx.quadraticCurveTo(38, 13 + tailSwing, 34, -12);
    ctx.quadraticCurveTo(31, -25, 41, -27);
    ctx.stroke();

    // Body.
    ctx.strokeStyle = '#3b312b';
    ctx.lineWidth = 3.3;
    ctx.fillStyle = p.fur;
    ctx.beginPath();
    ctx.ellipse(0, 9, 24, 21, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = p.light;
    ctx.beginPath();
    ctx.ellipse(0, 13, 13, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs alternate in two clear walking frames.
    const legA = step > 0 ? 5 : -3;
    const legB = step > 0 ? -3 : 5;
    ctx.strokeStyle = '#3b312b';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-13, 17); ctx.lineTo(-14 + legA, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 17); ctx.lineTo(13 + legB, 30); ctx.stroke();
    ctx.strokeStyle = p.fur;
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-13, 17); ctx.lineTo(-14 + legA, 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 17); ctx.lineTo(13 + legB, 30); ctx.stroke();

    // Head and ears point toward the chick while approaching.
    ctx.strokeStyle = '#3b312b';
    ctx.lineWidth = 3.3;
    ctx.fillStyle = p.fur;
    ctx.beginPath();
    ctx.moveTo(-21, -16); ctx.lineTo(-14, -35); ctx.lineTo(-4, -24);
    ctx.quadraticCurveTo(0, -27, 4, -24);
    ctx.lineTo(14, -35); ctx.lineTo(21, -16);
    ctx.quadraticCurveTo(20, 4, 0, 6);
    ctx.quadraticCurveTo(-20, 4, -21, -16);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#f6b6a6';
    ctx.beginPath(); ctx.moveTo(-15, -27); ctx.lineTo(-12, -19); ctx.lineTo(-7, -23); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, -27); ctx.lineTo(12, -19); ctx.lineTo(7, -23); ctx.closePath(); ctx.fill();

    // Tabby marks remain readable at mobile size.
    ctx.strokeStyle = p.stripe;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-7, -21); ctx.lineTo(-4, -14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -23); ctx.lineTo(0, -15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7, -21); ctx.lineTo(4, -14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-19, 5); ctx.lineTo(-10, 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(19, 5); ctx.lineTo(10, 9); ctx.stroke();

    ctx.fillStyle = '#302925';
    ctx.beginPath(); ctx.arc(-7, -9, 2.3, 0, Math.PI * 2); ctx.arc(7, -9, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#704d49';
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-3.5, -1); ctx.lineTo(3.5, -1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#704d49';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(-3, 0, 4, 0.1, 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(3, 0, 4, 1.95, 3.05); ctx.stroke();

    // Collar gives the cat a friendly, domestic feel.
    ctx.strokeStyle = p.collar;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 2, 14, 0.2, Math.PI - 0.2); ctx.stroke();

    if (retreating) {
      ctx.fillStyle = '#fff6a0';
      ctx.strokeStyle = '#5b4a2f';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(29, -32, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5b4a2f';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 29, -32);
    }

    ctx.restore();
  }
}

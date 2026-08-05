export class LeafPile {
  constructor(width, height) {
    this.width = width;
    this.screenHeight = height;
    this.x = 70 + Math.random() * (width - 140);
    this.y = -75;
    this.speed = 42;
    this.radius = 34;
    this.state = 'rest';
    this.scatter = 0;
    this.dead = false;
    this.scored = false;
    this.bumped = false;
    this.seed = Math.random() * Math.PI * 2;
    this.leaves = Array.from({ length: 18 }, (_, i) => ({
      a: (i / 18) * Math.PI * 2 + Math.random() * .35,
      d: 8 + Math.random() * 23,
      size: 5 + Math.random() * 5,
      spin: (Math.random() - .5) * 5,
      tone: i % 4
    }));
  }

  update(dt, chick) {
    this.y += this.speed * dt;
    if (this.state === 'scatter') {
      this.scatter += dt / .72;
      if (this.scatter >= 1) this.dead = true;
    } else if (!this.bumped && Math.hypot(this.x - chick.x, this.y - chick.y) < 38) {
      this.bumped = true;
      return 'bump';
    }
    if (this.y > this.screenHeight + 90) this.dead = true;
    return null;
  }

  windHit(x, y, radius = 24) {
    if (this.state !== 'rest') return false;
    if (Math.hypot(x - this.x, y - this.y) < radius + this.radius) {
      this.state = 'scatter';
      this.scatter = .01;
      return true;
    }
    return false;
  }

  drawLeaf(ctx, x, y, size, angle, tone, alpha = 1) {
    const colors = ['#c9963d', '#d7b84f', '#9a7334', '#b86c3e'];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors[tone];
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * .48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(89,63,31,.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-size * .65, 0); ctx.lineTo(size * .7, 0); ctx.stroke();
    ctx.restore();
  }

  draw(ctx, time) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const s = Math.min(1, this.scatter);

    if (this.state === 'rest') {
      ctx.fillStyle = 'rgba(50,63,31,.18)';
      ctx.beginPath(); ctx.ellipse(0, 13, 39, 15, 0, 0, Math.PI * 2); ctx.fill();
      // A loose, uneven mound rather than neatly stacked lumber.
      for (let i = 0; i < this.leaves.length; i++) {
        const leaf = this.leaves[i];
        const wobble = Math.sin(time * 1.8 + this.seed + i) * .6;
        const px = Math.cos(leaf.a) * leaf.d;
        const py = Math.sin(leaf.a) * leaf.d * .46 - (i % 3) * 3;
        this.drawLeaf(ctx, px, py + wobble, leaf.size, leaf.a + leaf.spin * .08, leaf.tone);
      }
      ctx.strokeStyle = '#76562f';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-25, 8); ctx.lineTo(19, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(28, 11); ctx.stroke();
    } else {
      for (let i = 0; i < this.leaves.length; i++) {
        const leaf = this.leaves[i];
        const distance = leaf.d + s * (58 + (i % 5) * 8);
        const px = Math.cos(leaf.a) * distance;
        const py = Math.sin(leaf.a) * distance * .65 - s * (18 + (i % 4) * 8);
        this.drawLeaf(ctx, px, py, leaf.size, leaf.a + leaf.spin * s, leaf.tone, 1 - s * .85);
      }
      ctx.strokeStyle = `rgba(219,255,225,${.65 * (1 - s)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 24 + s * 46, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

import { Fairy } from './fairy.js';
import { Chick } from './chick.js';
import { Stage } from './stage.js';

export class Game {
  constructor(canvas, input, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.hud = hud;
    this.width = canvas.width;
    this.height = canvas.height;
    this.running = false;
    this.lastTime = 0;
    this.elapsed = 0;
    this.distance = 0;
    this.plus = 0;
    this.minus = 0;
    this.effects = [];
    this.stage = new Stage(this.width, this.height);
    this.fairy = new Fairy(this.width, this.height);
    this.chick = new Chick(this.width, this.height);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  guideChick(direction) { this.chick.guide(direction); }

  cast(kind) {
    if (!this.running) return;
    const isWater = kind === 'water';
    this.effects.push({
      x: this.fairy.x,
      y: this.fairy.y - 16,
      age: 0,
      life: .65,
      kind: isWater ? 'water' : 'wind'
    });
  }

  update(dt) {
    this.elapsed += dt;
    this.distance += dt * 5;
    this.stage.update(dt);
    this.fairy.update(dt, this.input.getVector(), this.width, this.height);
    this.chick.update(dt, this.elapsed);
    for (const e of this.effects) {
      e.age += dt;
      e.y -= dt * 220;
    }
    this.effects = this.effects.filter(e => e.age < e.life);
    this.hud.distance.textContent = `${Math.floor(this.distance)} m`;
    this.hud.plus.textContent = this.plus;
    this.hud.minus.textContent = this.minus;
  }

  drawEffect(e) {
    const ctx = this.ctx;
    const t = e.age / e.life;
    ctx.save();
    ctx.globalAlpha = 1 - t * .7;
    ctx.translate(e.x, e.y);
    if (e.kind === 'wind') {
      const r = 17 + t * 8;
      const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,255,.95)');
      g.addColorStop(.45, 'rgba(197,255,210,.75)');
      g.addColorStop(1, 'rgba(115,226,160,.08)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(235,255,238,.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, Math.PI*2); ctx.stroke();
    } else {
      const r = 16 + t * 5;
      const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, r);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(.25, 'rgba(89,196,255,.98)');
      g.addColorStop(.72, 'rgba(0,116,235,.88)');
      g.addColorStop(1, 'rgba(0,73,180,.35)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.beginPath(); ctx.ellipse(-6, -7, 5, 3, -.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  draw() {
    this.stage.draw(this.ctx, this.elapsed);
    this.chick.draw(this.ctx, this.elapsed);
    for (const e of this.effects) this.drawEffect(e);
    this.fairy.draw(this.ctx, this.elapsed);
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(.033, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop);
  }
}

import { Fairy } from './fairy.js';
import { Chick } from './chick.js';
import { Stage } from './stage.js';
import { Bird } from './bird.js';

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
    this.cooldowns = { wind: 0, water: 0 };
    this.birds = [];
    this.birdSpawnTimer = 2.8;
    this.stage = new Stage(this.width, this.height);
    this.fairy = new Fairy(this.width, this.height);
    this.chick = new Chick(this.width, this.height);
    this.loop = this.loop.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  guideChick(direction) { this.chick.guide(direction); }

  cast(kind, chargeSeconds = 0) {
    if (!this.running || this.cooldowns[kind] > 0) return;
    const isWater = kind === 'water';
    const charge = isWater ? 0 : Math.min(1, Math.max(0, chargeSeconds / 0.9));
    this.cooldowns[kind] = isWater ? 0.62 : 0.52 + charge * 0.18;
    this.effects.push({
      x: this.fairy.x,
      y: this.fairy.y - 24,
      startX: this.fairy.x,
      startY: this.fairy.y - 24,
      age: 0,
      // Wind already travels a little farther than water. Holding the button
      // briefly extends its range and makes the burst wider.
      travel: isWater ? 0.54 : 0.56 + charge * 0.34,
      burst: isWater ? 0.38 : 0.34 + charge * 0.10,
      speed: isWater ? 225 : 270,
      power: isWater ? 1 : 1 + charge * 0.7,
      charge,
      kind,
      phase: 'travel'
    });
  }

  update(dt) {
    this.elapsed += dt;
    this.distance += dt * 5;
    this.stage.update(dt);
    this.fairy.update(dt, this.input.getVector(), this.width, this.height);
    this.chick.update(dt, this.elapsed);
    this.cooldowns.wind = Math.max(0, this.cooldowns.wind - dt);
    this.cooldowns.water = Math.max(0, this.cooldowns.water - dt);

    // Keep the pace gentle: normally only one bird is present at a time.
    this.birdSpawnTimer -= dt;
    if (this.birdSpawnTimer <= 0 && this.birds.length === 0) {
      this.birds.push(new Bird(this.width, this.height, Math.floor(Math.random() * 3)));
      this.birdSpawnTimer = 5.5 + Math.random() * 3.5;
    }
    for (const bird of this.birds) {
      bird.update(dt, this.chick, this.elapsed);
      if (bird.state === 'approach' && Math.hypot(bird.x - this.chick.x, bird.y - this.chick.y) < 34) {
        this.minus += 25;
        bird.scare(this.chick.x, this.chick.y + 25);
      }
    }

    for (const e of this.effects) {
      e.age += dt;
      if (e.phase === 'travel') {
        e.y -= e.speed * dt;
        e.x += Math.sin(e.age * 10) * (e.kind === 'wind' ? 0.8 : 0.25);
        // A direct hit scares the bird immediately.
        for (const bird of this.birds) {
          if (bird.state === 'approach' && Math.hypot(e.x - bird.x, e.y - bird.y) < bird.hitRadius + 18) {
            if (bird.scare(e.x, e.y)) this.plus += 50;
            e.phase = 'burst';
            e.age = 0;
            break;
          }
        }
        if (e.age >= e.travel) {
          e.phase = 'burst';
          e.age = 0;
        }
      } else {
        const t = e.age / e.burst;
        const radius = e.kind === 'wind' ? 18 + t * 65 * (e.power || 1) : 13 + t * 56;
        for (const bird of this.birds) {
          if (bird.state === 'approach' && Math.hypot(e.x - bird.x, e.y - bird.y) < radius + bird.hitRadius) {
            if (bird.scare(e.x, e.y)) this.plus += 50;
          }
        }
      }
    }
    this.effects = this.effects.filter(e => e.phase !== 'burst' || e.age < e.burst);
    this.birds = this.birds.filter(bird => !bird.isOffscreen());
    this.hud.distance.textContent = `${Math.floor(this.distance)} m`;
    this.hud.plus.textContent = this.plus;
    this.hud.minus.textContent = this.minus;
  }

  drawWindTravel(ctx, e) {
    const pulse = 1 + Math.sin(e.age * 22) * 0.08;
    ctx.scale(pulse, pulse);
    const r = 18 * (1 + (e.charge || 0) * 0.26);
    const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,.98)');
    g.addColorStop(.42, 'rgba(200,255,218,.83)');
    g.addColorStop(1, 'rgba(76,213,140,.08)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(237,255,242,.82)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 12, -0.2, Math.PI * 1.55);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = e.age * 7 + i * Math.PI * 2 / 3;
      ctx.fillStyle = 'rgba(210,255,222,.68)';
      ctx.beginPath(); ctx.arc(Math.cos(a) * 23, Math.sin(a) * 12, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawWaterTravel(ctx, e) {
    const r = 18;
    const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.22, 'rgba(95,205,255,.98)');
    g.addColorStop(.68, 'rgba(0,123,239,.94)');
    g.addColorStop(1, 'rgba(0,63,170,.62)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.82)';
    ctx.beginPath(); ctx.ellipse(-6, -7, 5, 3, -.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(71,183,255,.65)';
    ctx.beginPath(); ctx.arc(10, 9, 3, 0, Math.PI * 2); ctx.fill();
  }

  drawBurst(ctx, e) {
    const t = e.age / e.burst;
    ctx.globalAlpha = Math.max(0, 1 - t);
    if (e.kind === 'wind') {
      const r = 18 + t * 65 * (e.power || 1);
      ctx.strokeStyle = `rgba(207,255,220,${0.9 - t * 0.6})`;
      ctx.lineWidth = 7 * (1 - t) + 1;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.7 - t * 0.55})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7 + e.age * 2;
        const d = 14 + t * 58;
        ctx.fillStyle = `rgba(187,247,202,${0.7 - t * 0.55})`;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, 5, 2, a, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      const r = 13 + t * 56;
      ctx.strokeStyle = `rgba(43,157,255,${0.88 - t * 0.65})`;
      ctx.lineWidth = 7 * (1 - t) + 1;
      ctx.beginPath(); ctx.ellipse(0, 5, r, r * 0.48, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const a = i * Math.PI * 2 / 10;
        const d = 12 + t * 62;
        const drop = 4 + (i % 3) * 2;
        ctx.fillStyle = `rgba(${i % 2 ? '64,177,255' : '129,218,255'},${0.9 - t * 0.7})`;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d * 0.58, drop, drop * 1.5, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = `rgba(220,247,255,${0.65 - t * 0.5})`;
      ctx.beginPath(); ctx.ellipse(0, 5, r * .65, r * .23, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawEffect(e) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.phase === 'travel') {
      if (e.kind === 'wind') this.drawWindTravel(ctx, e);
      else this.drawWaterTravel(ctx, e);
    } else {
      this.drawBurst(ctx, e);
    }
    ctx.restore();
  }

  draw() {
    this.stage.draw(this.ctx, this.elapsed);
    this.chick.draw(this.ctx, this.elapsed);
    for (const bird of this.birds) bird.draw(this.ctx, this.elapsed);
    for (const e of this.effects) this.drawEffect(e);
    this.fairy.draw(this.ctx, this.elapsed, this.chick);
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

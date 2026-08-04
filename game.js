(() => {
  'use strict';

  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const overlay = document.querySelector('#overlay');
  const startBtn = document.querySelector('#startBtn');
  const hpEl = document.querySelector('#chickHp');
  const distanceEl = document.querySelector('#distance');
  const shieldEl = document.querySelector('#shieldGauge');
  const buttons = [...document.querySelectorAll('.magic')];

  let W = 390, H = 844, dpr = 1;
  let running = false;
  let last = 0;
  let time = 0;
  let distance = 100;
  let spawnTimer = 0;
  let obstacleTimer = 0;
  let pointerId = null;
  let targetX = W * .5;
  let targetY = H * .34;

  const fairy = { x: W * .5, y: H * .33, r: 17, speed: 760, bob: 0 };
  const chick = { x: W * .5, y: H * .79, hp: 3, inv: 0, shield: 0 };
  const cooldown = { cutter: 0, blast: 0, water: 0, shield: 0 };
  let shieldGauge = 100;

  let enemies = [];
  let projectiles = [];
  let effects = [];
  let obstacles = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    W = rect.width;
    H = rect.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fairy.x = Math.min(W - 25, fairy.x);
    chick.x = W * .5;
    chick.y = H * .79;
  }

  function reset() {
    time = 0;
    distance = 100;
    spawnTimer = .8;
    obstacleTimer = 3;
    enemies = [];
    projectiles = [];
    effects = [];
    obstacles = [];
    fairy.x = W * .5;
    fairy.y = H * .32;
    targetX = fairy.x;
    targetY = fairy.y;
    chick.hp = 3;
    chick.inv = 0;
    chick.shield = 0;
    shieldGauge = 100;
    Object.keys(cooldown).forEach(k => cooldown[k] = 0);
    updateHud();
  }

  function start() {
    reset();
    overlay.classList.remove('show');
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function end(won) {
    running = false;
    overlay.classList.add('show');
    const card = overlay.querySelector('.card');
    card.innerHTML = `
      <h1>${won ? '無事に到着！' : 'ヒヨコを守れなかった…'}</h1>
      <p>${won ? '妖精の風と水の魔法で、ヒヨコたちは安全に森を抜けました。' : 'もう一度、敵を早めに追い払ってみよう。'}</p>
      <button id="restartBtn">もう一度</button>`;
    const restart = card.querySelector('#restartBtn');
    restart.style.cssText = 'width:100%;border:0;border-radius:16px;padding:14px;background:linear-gradient(90deg,#ffb65d,#ff8ba7);color:white;font-weight:900;font-size:17px;box-shadow:0 5px 0 #e67479';
    restart.addEventListener('click', start, { once: true });
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, .034);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    time += dt;
    distance = Math.max(0, 100 - time * 2.1);
    if (distance <= 0) return end(true);

    const dx = targetX - fairy.x;
    const dy = targetY - fairy.y;
    const len = Math.hypot(dx, dy);
    const step = fairy.speed * dt;
    if (len > 1) {
      fairy.x += dx / len * Math.min(step, len);
      fairy.y += dy / len * Math.min(step, len);
    }
    fairy.x = clamp(fairy.x, 24, W - 24);
    fairy.y = clamp(fairy.y, 90, H * .62);
    fairy.bob += dt * 7;

    chick.inv = Math.max(0, chick.inv - dt);
    chick.shield = Math.max(0, chick.shield - dt);
    shieldGauge = Math.min(100, shieldGauge + dt * 4.5);
    Object.keys(cooldown).forEach(k => cooldown[k] = Math.max(0, cooldown[k] - dt));

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      spawnTimer = Math.max(.7, 1.45 - time * .008) + Math.random() * .55;
    }
    obstacleTimer -= dt;
    if (obstacleTimer <= 0) {
      spawnObstacle();
      obstacleTimer = 4.3 + Math.random() * 2.8;
    }

    for (const e of enemies) {
      if (e.state === 'flee') {
        e.x += e.fleeX * dt;
        e.y += e.fleeY * dt;
        e.rot += dt * 8;
        e.life -= dt;
      } else {
        const tx = chick.x + Math.sin(time * 2 + e.seed) * 10;
        const ty = chick.y - 18;
        const ex = tx - e.x, ey = ty - e.y;
        const el = Math.hypot(ex, ey) || 1;
        e.x += ex / el * e.speed * dt;
        e.y += ey / el * e.speed * dt;
        if (el < 28) {
          if (chick.shield > 0) {
            repel(e, (e.x - chick.x) || 1, -1);
            burst(e.x, e.y, '✨');
          } else if (chick.inv <= 0) {
            chick.hp--;
            chick.inv = 1.3;
            repel(e, (e.x - chick.x) || 1, -1);
            burst(chick.x, chick.y, '💥');
            if (chick.hp <= 0) return end(false);
          }
        }
      }
    }

    for (const p of projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.type === 'water' && p.life <= 0 && !p.exploded) {
        p.exploded = true;
        waterSplash(p.x, p.y);
      }
    }

    for (const p of projectiles) {
      if (p.type === 'water' || p.life <= 0) continue;
      for (const e of enemies) {
        if (e.state !== 'hunt') continue;
        if (dist(p, e) < p.r + e.r) {
          repel(e, p.vx, p.vy);
          p.life = 0;
          burst(e.x, e.y, p.type === 'cutter' ? '🍃' : '💨');
        }
      }
      if (p.type === 'blast') {
        for (const o of obstacles) {
          if (o.type === 'branches' && !o.cleared && dist(p, o) < p.r + o.r) {
            o.cleared = true;
            p.life = 0;
            burst(o.x, o.y, '🍂');
          }
        }
      }
    }

    effects.forEach(e => e.life -= dt);
    projectiles = projectiles.filter(p => p.life > 0 || (p.type === 'water' && !p.exploded));
    enemies = enemies.filter(e => e.life > 0 && e.x > -80 && e.x < W + 80 && e.y < H + 80);
    effects = effects.filter(e => e.life > 0);
    obstacles = obstacles.filter(o => o.y < H + 80);

    // World scroll: objects drift downward as the flock advances.
    for (const o of obstacles) {
      o.y += 25 * dt;
      if (!o.cleared && Math.abs(o.y - chick.y) < 22 && Math.abs(o.x - chick.x) < 42) {
        if (o.type === 'branches') {
          chick.y = Math.min(H * .84, chick.y + 18 * dt);
        } else if (o.type === 'sprout') {
          chick.y = Math.min(H * .84, chick.y + 12 * dt);
        }
      }
    }
    chick.y += (H * .79 - chick.y) * dt * 2;
    updateHud();
  }

  function spawnEnemy() {
    const side = Math.random();
    const e = {
      x: side < .2 ? -20 : side > .8 ? W + 20 : 30 + Math.random() * (W - 60),
      y: side < .2 || side > .8 ? 170 + Math.random() * H * .4 : 70,
      r: 17,
      speed: 58 + Math.random() * 34 + time * .35,
      seed: Math.random() * 10,
      state: 'hunt', life: 12, rot: 0,
      icon: Math.random() < .5 ? '🦊' : (Math.random() < .5 ? '🐍' : '🐦')
    };
    enemies.push(e);
  }

  function spawnObstacle() {
    const type = Math.random() < .55 ? 'branches' : 'sprout';
    obstacles.push({
      type,
      x: W * .5 + (Math.random() - .5) * Math.min(130, W * .32),
      y: 105,
      r: 28,
      cleared: false,
      grown: false
    });
  }

  function cast(action) {
    if (!running || cooldown[action] > 0) return;
    if (action === 'cutter') {
      cooldown.cutter = .18;
      const count = time > 30 ? 3 : time > 15 ? 2 : 1;
      const angles = count === 1 ? [-Math.PI/2] : count === 2 ? [-1.72, -1.42] : [-1.82, -Math.PI/2, -1.32];
      angles.forEach(a => projectiles.push({ type:'cutter', x:fairy.x, y:fairy.y-12, vx:Math.cos(a)*520, vy:Math.sin(a)*520, r:8, life:1.2 }));
    }
    if (action === 'blast') {
      cooldown.blast = .42;
      // Wide diagonal-down gust, aimed toward the chick/ground layer.
      const a = Math.PI * .38;
      [-.16, 0, .16].forEach(off => projectiles.push({ type:'blast', x:fairy.x, y:fairy.y+8, vx:Math.cos(a+off)*330, vy:Math.sin(a+off)*330, r:15, life:.72 }));
    }
    if (action === 'water') {
      cooldown.water = .75;
      projectiles.push({ type:'water', x:fairy.x, y:fairy.y+8, vx:0, vy:250, r:12, life:.52, exploded:false });
    }
    if (action === 'shield') {
      if (shieldGauge < 55) return;
      shieldGauge -= 55;
      cooldown.shield = .5;
      chick.shield = 3.2;
      burst(chick.x, chick.y, '✨');
    }
  }

  function waterSplash(x, y) {
    effects.push({ x, y, life:.55, max:.55, kind:'splash' });
    for (const e of enemies) {
      if (e.state === 'hunt' && Math.hypot(e.x-x, e.y-y) < 65) repel(e, e.x-x, e.y-y);
    }
    for (const o of obstacles) {
      if (o.type === 'sprout' && !o.cleared && Math.hypot(o.x-x, o.y-y) < 70) {
        o.grown = true;
        o.cleared = true;
        burst(o.x, o.y, '🌼');
      }
    }
  }

  function repel(e, x, y) {
    const l = Math.hypot(x, y) || 1;
    e.state = 'flee';
    e.fleeX = x / l * 290;
    e.fleeY = y / l * 290;
    e.life = 1.2;
  }

  function burst(x, y, icon) {
    effects.push({ x, y, icon, life:.7, max:.7, kind:'icon' });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawObstacles();
    drawChicks();
    drawEnemies();
    drawProjectiles();
    drawFairy();
    drawEffects();
  }

  function drawBackground() {
    const horizon = H * .56;
    const sky = ctx.createLinearGradient(0,0,0,horizon);
    sky.addColorStop(0,'#8edcff'); sky.addColorStop(1,'#e9fbff');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,horizon);
    const ground = ctx.createLinearGradient(0,horizon,0,H);
    ground.addColorStop(0,'#bceaa1'); ground.addColorStop(1,'#82c96f');
    ctx.fillStyle = ground; ctx.fillRect(0,horizon,W,H-horizon);

    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (let i=0;i<5;i++) {
      const y = ((i*170 + time*22) % (H+100)) - 60;
      ctx.beginPath(); ctx.ellipse(45 + (i%2)*W*.55, y, 36, 13, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(224,202,134,.8)';
    ctx.beginPath();
    ctx.moveTo(W*.39,H); ctx.lineTo(W*.45,horizon); ctx.lineTo(W*.55,horizon); ctx.lineTo(W*.63,H); ctx.closePath(); ctx.fill();
  }

  function drawFairy() {
    const y = fairy.y + Math.sin(fairy.bob)*3;
    ctx.save(); ctx.translate(fairy.x,y);
    ctx.globalAlpha = .7;
    ctx.fillStyle = '#f5ffff';
    ctx.beginPath(); ctx.ellipse(-14,-4,12,20,-.55,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14,-4,12,20,.55,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe0bf'; ctx.beginPath(); ctx.arc(0,-11,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#74c996'; ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(-10,18); ctx.lineTo(10,18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6a865f'; ctx.lineWidth = 3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-4,17); ctx.lineTo(-7,28); ctx.moveTo(4,17); ctx.lineTo(7,28); ctx.stroke();
    ctx.fillStyle = '#f4b35a'; ctx.beginPath(); ctx.arc(0,-19,9,Math.PI,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawChicks() {
    const offsets = [-22,0,22];
    offsets.forEach((ox,i) => {
      const x = chick.x+ox, y = chick.y + Math.sin(time*7+i)*2;
      if (chick.inv>0 && Math.floor(time*12)%2===0) return;
      ctx.font = '27px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🐥',x,y);
    });
    if (chick.shield > 0) {
      ctx.strokeStyle='rgba(184,116,255,.85)'; ctx.lineWidth=5;
      ctx.beginPath(); ctx.ellipse(chick.x,chick.y,52,34,0,0,Math.PI*2); ctx.stroke();
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.rot);
      ctx.font='31px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(e.icon,0,0); ctx.restore();
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      ctx.save(); ctx.translate(o.x,o.y);
      if (o.type === 'branches') {
        ctx.globalAlpha = o.cleared ? .18 : 1;
        ctx.font='35px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🪵',-13,0); ctx.fillText('🍂',14,2);
      } else {
        ctx.font = o.grown ? '45px sans-serif' : '32px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(o.grown ? '🌻' : '🌱',0,0);
      }
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.save(); ctx.translate(p.x,p.y);
      if (p.type === 'cutter') { ctx.font='22px sans-serif'; ctx.fillText('🍃',0,0); }
      if (p.type === 'blast') { ctx.font='28px sans-serif'; ctx.fillText('💨',0,0); }
      if (p.type === 'water') { ctx.font='25px sans-serif'; ctx.fillText('💧',0,0); }
      ctx.restore();
    }
  }

  function drawEffects() {
    for (const e of effects) {
      const t = e.life/e.max;
      ctx.save(); ctx.globalAlpha=t;
      if (e.kind==='splash') {
        ctx.strokeStyle='#5ab9ff'; ctx.lineWidth=6;
        ctx.beginPath(); ctx.arc(e.x,e.y,12+(1-t)*55,0,Math.PI*2); ctx.stroke();
      } else {
        ctx.font=`${24+(1-t)*15}px sans-serif`; ctx.textAlign='center'; ctx.fillText(e.icon,e.x,e.y-(1-t)*24);
      }
      ctx.restore();
    }
  }

  function updateHud() {
    hpEl.textContent = chick.hp;
    distanceEl.textContent = Math.ceil(distance);
    shieldEl.textContent = Math.floor(shieldGauge);
    buttons.forEach(b => {
      const a = b.dataset.action;
      b.classList.toggle('cooldown', cooldown[a] > 0 || (a==='shield' && shieldGauge < 55));
    });
  }

  function canvasPoint(ev) {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX-r.left, y: ev.clientY-r.top };
  }

  canvas.addEventListener('pointerdown', ev => {
    if (!running || ev.clientX > innerWidth*.67) return;
    pointerId = ev.pointerId; canvas.setPointerCapture(pointerId);
    const p=canvasPoint(ev); targetX=p.x; targetY=p.y;
  });
  canvas.addEventListener('pointermove', ev => {
    if (ev.pointerId!==pointerId) return;
    const p=canvasPoint(ev); targetX=p.x; targetY=p.y;
  });
  canvas.addEventListener('pointerup', ev => { if(ev.pointerId===pointerId) pointerId=null; });
  canvas.addEventListener('pointercancel', () => pointerId=null);

  buttons.forEach(btn => {
    const action = btn.dataset.action;
    const down = ev => { ev.preventDefault(); btn.classList.add('pressed'); cast(action); };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
    btn.addEventListener('pointercancel', () => btn.classList.remove('pressed'));
  });

  window.addEventListener('keydown', ev => {
    const map = { KeyA:'cutter', KeyB:'blast', KeyC:'water', KeyD:'shield', Space:'cutter' };
    if (map[ev.code]) cast(map[ev.code]);
    const n=24;
    if(ev.code==='ArrowLeft') targetX-=n;
    if(ev.code==='ArrowRight') targetX+=n;
    if(ev.code==='ArrowUp') targetY-=n;
    if(ev.code==='ArrowDown') targetY+=n;
  });

  startBtn.addEventListener('click', start);
  window.addEventListener('resize', resize);
  resize();
  draw();

  function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
})();

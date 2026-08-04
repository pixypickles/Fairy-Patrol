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
  const dirButtons = [...document.querySelectorAll('.dir')];

  let W = 390, H = 650, dpr = 1;
  let running = false, last = 0, time = 0, distance = 100;
  let spawnTimer = 0, obstacleTimer = 0;
  const move = { up:false, down:false, left:false, right:false };
  const keys = { up:false, down:false, left:false, right:false };

  const fairy = { x: W*.5, y:H*.44, r:18, speed:330, bob:0 };
  const chick = { x:W*.5, y:H*.91, hp:3, inv:0, shield:0 };
  const cooldown = { cutter:0, blast:0, water:0, shield:0 };
  let shieldGauge = 100;
  let enemies = [], projectiles = [], effects = [], obstacles = [], scenery = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width*dpr);
    canvas.height = Math.round(rect.height*dpr);
    W = rect.width; H = rect.height;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    chick.x = W*.5; chick.y = H*.94;
    fairy.x = clamp(fairy.x, 26, W-26);
    fairy.y = clamp(fairy.y, 82, H*.76);
  }

  function reset() {
    time=0; distance=100; spawnTimer=.7; obstacleTimer=1.8;
    enemies=[]; projectiles=[]; effects=[]; obstacles=[]; scenery=[];
    fairy.x=W*.5; fairy.y=H*.48;
    Object.keys(move).forEach(k=>move[k]=false);
    Object.keys(keys).forEach(k=>keys[k]=false);
    chick.x=W*.5; chick.y=H*.94; chick.hp=3; chick.inv=0; chick.shield=0;
    shieldGauge=100;
    Object.keys(cooldown).forEach(k=>cooldown[k]=0);
    for(let i=0;i<20;i++) scenery.push(makeScenery(Math.random()*H));
    updateHud();
  }

  function start(){ reset(); overlay.classList.remove('show'); running=true; last=performance.now(); requestAnimationFrame(loop); }
  function end(won){
    running=false; overlay.classList.add('show');
    overlay.querySelector('.card').innerHTML=`<h1>${won?'無事に到着！':'ヒヨコを守れなかった…'}</h1><p>${won?'風と水の魔法で、ヒヨコたちは森を抜けました。':'敵や障害物を少し早めに追い払ってみよう。'}</p><button id="restartBtn">もう一度</button>`;
    const b=overlay.querySelector('#restartBtn');
    b.style.cssText='width:100%;border:0;border-radius:16px;padding:14px;background:linear-gradient(90deg,#ffb65d,#ff8ba7);color:white;font-weight:900;font-size:17px;box-shadow:0 5px 0 #e67479';
    b.addEventListener('click',start,{once:true});
  }

  function loop(now){ if(!running)return; const dt=Math.min((now-last)/1000,.034); last=now; update(dt); draw(); requestAnimationFrame(loop); }

  function update(dt){
    time+=dt; distance=Math.max(0,100-time*1.35); if(distance<=0)return end(true);
    let dx=(move.right||keys.right?1:0)-(move.left||keys.left?1:0);
    let dy=(move.down||keys.down?1:0)-(move.up||keys.up?1:0);
    const len=Math.hypot(dx,dy)||1;
    if(dx||dy){ fairy.x+=dx/len*fairy.speed*dt; fairy.y+=dy/len*fairy.speed*dt; }
    fairy.x=clamp(fairy.x,24,W-24); fairy.y=clamp(fairy.y,82,H*.78); fairy.bob+=dt*7;
    chick.inv=Math.max(0,chick.inv-dt); chick.shield=Math.max(0,chick.shield-dt);
    shieldGauge=Math.min(100,shieldGauge+dt*4.5);
    Object.keys(cooldown).forEach(k=>cooldown[k]=Math.max(0,cooldown[k]-dt));

    spawnTimer-=dt; if(spawnTimer<=0){ spawnEnemy(); spawnTimer=Math.max(1.05,2.05-time*.005)+Math.random()*.75; }
    obstacleTimer-=dt; if(obstacleTimer<=0){ spawnObstacle(); obstacleTimer=4.5+Math.random()*3.0; }

    const scroll=22*dt;
    scenery.forEach(s=>s.y+=scroll);
    scenery=scenery.filter(s=>s.y<H+40);
    while(scenery.length<20)scenery.push(makeScenery(-Math.random()*120));
    obstacles.forEach(o=>o.y+=scroll);

    for(const e of enemies){
      if(e.state==='flee'){ e.x+=e.fleeX*dt; e.y+=e.fleeY*dt; e.rot+=dt*7; e.life-=dt; continue; }
      const tx=chick.x+Math.sin(time*2+e.seed)*14, ty=chick.y-20;
      const ex=tx-e.x, ey=ty-e.y, el=Math.hypot(ex,ey)||1;
      e.x+=ex/el*e.speed*dt; e.y+=ey/el*e.speed*dt;
      if(el<30){
        if(chick.shield>0){ repel(e,e.x-chick.x,-1); burst(e.x,e.y,'✨'); }
        else if(chick.inv<=0){ chick.hp--; chick.inv=1.3; repel(e,e.x-chick.x,-1); burst(chick.x,chick.y,'💥'); if(chick.hp<=0)return end(false); }
      }
    }

    for(const p of projectiles){
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
      if(p.type==='water'&&p.life<=0&&!p.exploded){p.exploded=true;waterSplash(p.x,p.y);}
      if(p.type==='blast'&&p.life<=0&&!p.exploded){p.exploded=true;blastBurst(p.x,p.y);}
    }

    for(const p of projectiles){
      if(p.type==='water'||p.type==='blast'||p.life<=0)continue;
      for(const e of enemies){
        if(e.state!=='hunt')continue;
        const compatible=(p.type==='cutter'&&e.layer==='air')||(p.type==='blast'&&e.layer==='ground');
        if(compatible&&dist(p,e)<p.r+e.r){ repel(e,p.vx,p.vy); p.life=0; burst(e.x,e.y,p.type==='cutter'?'🍃':'💨'); }
      }
    }

    for(const o of obstacles){
      if(o.y>H+80)continue;
      if(o.type==='hole'&&!o.bridged&&Math.abs(o.y-chick.y)<30&&Math.abs(o.x-chick.x)<58){
        if(chick.shield<=0&&chick.inv<=0){chick.hp--;chick.inv=1.3;burst(chick.x,chick.y,'💥');if(chick.hp<=0)return end(false);}
      }
      if(o.type==='branches'&&!o.cleared&&Math.abs(o.y-chick.y)<25&&Math.abs(o.x-chick.x)<52) chick.y=Math.min(H*.94,chick.y+16*dt);
    }
    chick.y+=(H*.91-chick.y)*dt*2;

    effects.forEach(e=>e.life-=dt);
    projectiles=projectiles.filter(p=>p.life>0||((p.type==='water'||p.type==='blast')&&!p.exploded));
    enemies=enemies.filter(e=>e.life>0&&e.x>-90&&e.x<W+90&&e.y<H+90);
    effects=effects.filter(e=>e.life>0);
    obstacles=obstacles.filter(o=>o.y<H+90);
    updateHud();
  }

  function makeScenery(y){
    const side=Math.random()<.5?'left':'right';
    return {x:side==='left'?18+Math.random()*75:W-18-Math.random()*75,y,type:Math.random()<.45?'flower':Math.random()<.72?'stone':'bush',r:8+Math.random()*9};
  }

  function spawnEnemy(){
    const air=Math.random()<.36;
    const kinds=air?['bird']:['fox','cat','snake'];
    const kind=kinds[Math.floor(Math.random()*kinds.length)];
    const side=Math.random();
    enemies.push({x:side<.2?-25:side>.8?W+25:35+Math.random()*(W-70),y:side<.2||side>.8?120+Math.random()*H*.35:75,r:kind==='snake'?18:20,speed:(air?58:40)+Math.random()*20+time*.16,seed:Math.random()*10,state:'hunt',life:13,rot:0,kind,layer:air?'air':'ground'});
  }

  function spawnObstacle(){
    const r=Math.random(); const type=r<.48?'branches':r<.78?'hole':'sprout';
    obstacles.push({type,x:W*.5+(Math.random()-.5)*Math.min(150,W*.38),y:95,r:type==='hole'?34:28,cleared:false,grown:false,bridged:false});
  }

  function cast(action){
    if(!running||cooldown[action]>0)return;
    if(action==='cutter'){
      cooldown.cutter=.28;
      [-1.78,-Math.PI/2,-1.36].forEach(a=>projectiles.push({type:'cutter',x:fairy.x,y:fairy.y-14,vx:Math.cos(a)*390,vy:Math.sin(a)*390,r:9,life:1.35}));
    }
    if(action==='blast'){
      cooldown.blast=.75;
      const a=Math.PI*.36;
      projectiles.push({type:'blast',x:fairy.x+8,y:fairy.y+10,vx:Math.cos(a)*215,vy:Math.sin(a)*215,r:16,life:.78,exploded:false});
    }
    if(action==='water'){ cooldown.water=.9; projectiles.push({type:'water',x:fairy.x,y:fairy.y+8,vx:0,vy:185,r:13,life:.68,exploded:false}); }
    if(action==='shield'){ if(shieldGauge<55)return; shieldGauge-=55; cooldown.shield=.65; chick.shield=3.2; burst(chick.x,chick.y,'✨'); }
  }

  function blastBurst(x,y){
    effects.push({x,y,life:.5,max:.5,kind:'blastBurst'});
    for(const e of enemies){
      if(e.state==='hunt'&&e.layer==='ground'&&Math.hypot(e.x-x,e.y-y)<82)repel(e,e.x-x,e.y-y);
    }
    for(const o of obstacles){
      if(o.type==='branches'&&!o.cleared&&Math.hypot(o.x-x,o.y-y)<86){o.cleared=true;burst(o.x,o.y,'🍂');}
    }
  }

  function waterSplash(x,y){
    effects.push({x,y,life:.55,max:.55,kind:'splash'});
    for(const e of enemies)if(e.state==='hunt'&&e.layer==='ground'&&Math.hypot(e.x-x,e.y-y)<68)repel(e,e.x-x,e.y-y);
    for(const o of obstacles){
      if(Math.hypot(o.x-x,o.y-y)>=75)continue;
      if(o.type==='sprout'&&!o.cleared){o.grown=true;o.cleared=true;burst(o.x,o.y,'🌼');}
      if(o.type==='hole'&&!o.bridged){o.bridged=true;o.cleared=true;burst(o.x,o.y,'🌿');}
    }
  }

  function repel(e,x,y){const l=Math.hypot(x,y)||1;e.state='flee';e.fleeX=x/l*310;e.fleeY=y/l*310;e.life=1.2;}
  function burst(x,y,icon){effects.push({x,y,icon,life:.7,max:.7,kind:'icon'});}

  function draw(){ctx.clearRect(0,0,W,H);drawBackground();drawScenery();drawObstacles();drawChicks();drawEnemies();drawProjectiles();drawFairy();drawEffects();}

  function drawBackground(){
    // 全画面を地面として描画。空、地平線、遠景は一切表示しない。
    ctx.fillStyle='#76c85e';
    ctx.fillRect(0,0,W,H);

    // 真上から見た草地の細かな模様。
    ctx.fillStyle='rgba(255,255,255,.055)';
    const offset=(time*22)%54;
    for(let row=-1;row<Math.ceil(H/54)+1;row++){
      const y=row*54+offset;
      for(let col=0;col<Math.ceil(W/58)+1;col++){
        const x=col*58+(row%2)*24;
        ctx.beginPath();
        ctx.ellipse(x,y,12,5,.35,0,Math.PI*2);
        ctx.fill();
      }
    }

    // 縦スクロールSTGらしい、真上から見た土の道。
    const roadTopLeft=W*.39, roadTopRight=W*.61;
    const roadBottomLeft=W*.31, roadBottomRight=W*.69;
    ctx.fillStyle='rgba(220,190,112,.9)';
    ctx.beginPath();
    ctx.moveTo(roadTopLeft,0);
    ctx.lineTo(roadTopRight,0);
    ctx.lineTo(roadBottomRight,H);
    ctx.lineTo(roadBottomLeft,H);
    ctx.closePath();
    ctx.fill();

    // 道の表面が下へ流れ、画面全体が縦スクロールしているように見せる。
    ctx.strokeStyle='rgba(155,124,63,.16)';
    ctx.lineWidth=2;
    for(let y=((time*22)%52)-52;y<H;y+=52){
      const t=Math.max(0,Math.min(1,y/H));
      const left=roadTopLeft+(roadBottomLeft-roadTopLeft)*t;
      const right=roadTopRight+(roadBottomRight-roadTopRight)*t;
      ctx.beginPath();
      ctx.moveTo(left+10,y);
      ctx.quadraticCurveTo(W*.5,y+7,right-10,y+1);
      ctx.stroke();
    }

    // 道の縁。斜め視点に見えないよう、影はごく弱くする。
    ctx.strokeStyle='rgba(91,135,61,.22)';
    ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(roadTopLeft,0);ctx.lineTo(roadBottomLeft,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(roadTopRight,0);ctx.lineTo(roadBottomRight,H);ctx.stroke();
  }

  function drawScenery(){for(const s of scenery){ctx.save();ctx.translate(s.x,s.y);if(s.type==='flower'){ctx.font='16px sans-serif';ctx.fillText('🌼',0,0);}else if(s.type==='stone'){ctx.fillStyle='#9da791';ctx.beginPath();ctx.ellipse(0,0,s.r,s.r*.7,0,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle='#4f9d4f';ctx.beginPath();ctx.arc(0,0,s.r,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-s.r*.55,2,s.r*.65,0,Math.PI*2);ctx.fill();}ctx.restore();}}

  function drawFairy(){
    const y=fairy.y+Math.sin(fairy.bob)*2;
    ctx.save();ctx.translate(fairy.x,y);
    ctx.fillStyle='rgba(75,104,55,.22)';ctx.beginPath();ctx.ellipse(0,22,16,7,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.72;ctx.fillStyle='#efffff';ctx.beginPath();ctx.ellipse(-13,-1,10,18,-.45,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(13,-1,10,18,.45,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='#6ac98a';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-10,16);ctx.lineTo(10,16);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f4c28a';ctx.beginPath();ctx.arc(0,-11,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#efb35b';ctx.beginPath();ctx.arc(0,-17,8,Math.PI,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#58724d';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4,15);ctx.lineTo(-7,25);ctx.moveTo(4,15);ctx.lineTo(7,25);ctx.stroke();ctx.restore();
  }

  function drawChicks(){
    [-23,0,23].forEach((ox,i)=>{if(chick.inv>0&&Math.floor(time*12)%2===0)return;drawChick(chick.x+ox,chick.y+Math.sin(time*7+i)*1.7);});
    if(chick.shield>0){ctx.strokeStyle='rgba(184,116,255,.9)';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(chick.x,chick.y,55,31,0,0,Math.PI*2);ctx.stroke();}
  }
  function drawChick(x,y){ctx.save();ctx.translate(x,y);ctx.fillStyle='#ffd83d';ctx.beginPath();ctx.ellipse(0,2,9,11,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,-7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ef9d28';ctx.beginPath();ctx.moveTo(6,-7);ctx.lineTo(12,-4);ctx.lineTo(6,-2);ctx.fill();ctx.strokeStyle='#b97725';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,12);ctx.lineTo(-4,16);ctx.moveTo(3,12);ctx.lineTo(4,16);ctx.stroke();ctx.restore();}

  function drawEnemies(){for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.rot);if(e.layer==='air'){ctx.fillStyle='rgba(40,60,35,.2)';ctx.beginPath();ctx.ellipse(8,20,18,7,0,0,Math.PI*2);ctx.fill();drawBird();}else if(e.kind==='fox')drawFox();else if(e.kind==='cat')drawCat();else drawSnake();ctx.restore();}}
  function drawFox(){ctx.fillStyle='#e98737';ctx.beginPath();ctx.ellipse(0,5,15,11,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-8,-7,9,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-15,-12);ctx.lineTo(-12,-22);ctx.lineTo(-7,-13);ctx.moveTo(-2,-13);ctx.lineTo(1,-22);ctx.lineTo(5,-10);ctx.fill();ctx.beginPath();ctx.ellipse(16,7,12,7,.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff3dc';ctx.beginPath();ctx.ellipse(-9,-4,6,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#333';ctx.beginPath();ctx.arc(-12,-8,1.4,0,Math.PI*2);ctx.fill();}
  function drawCat(){ctx.fillStyle='#8e9298';ctx.beginPath();ctx.ellipse(0,6,14,10,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-7,-7,8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-14,-12);ctx.lineTo(-12,-20);ctx.lineTo(-7,-13);ctx.moveTo(-2,-13);ctx.lineTo(1,-20);ctx.lineTo(2,-10);ctx.fill();ctx.strokeStyle='#555';ctx.lineWidth=4;ctx.beginPath();ctx.arc(13,4,11,-1.1,1.1);ctx.stroke();ctx.fillStyle='#333';ctx.beginPath();ctx.arc(-10,-8,1.2,0,Math.PI*2);ctx.fill();}
  function drawSnake(){ctx.strokeStyle='#3c9b58';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,4,12,.3,5.2);ctx.stroke();ctx.fillStyle='#56b96c';ctx.beginPath();ctx.ellipse(7,-9,8,6,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(10,-10,1.2,0,Math.PI*2);ctx.fill();}
  function drawBird(){ctx.fillStyle='#3f79bb';ctx.beginPath();ctx.ellipse(0,0,13,8,-.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-24,-12);ctx.lineTo(-12,6);ctx.moveTo(3,0);ctx.lineTo(23,-13);ctx.lineTo(13,7);ctx.fill();ctx.fillStyle='#ef9d28';ctx.beginPath();ctx.moveTo(12,-1);ctx.lineTo(20,2);ctx.lineTo(12,5);ctx.fill();}

  function drawObstacles(){for(const o of obstacles){ctx.save();ctx.translate(o.x,o.y);if(o.type==='branches'){ctx.globalAlpha=o.cleared?.2:1;ctx.strokeStyle='#8d5d32';ctx.lineWidth=7;ctx.lineCap='round';[-18,-9,0,9,18].forEach((x,i)=>{ctx.beginPath();ctx.moveTo(x-10,-12+i%2*8);ctx.lineTo(x+10,12-i%2*8);ctx.stroke();});}else if(o.type==='hole'){ctx.fillStyle='#5a4028';ctx.beginPath();ctx.ellipse(0,0,38,24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2d2219';ctx.beginPath();ctx.ellipse(0,2,29,17,0,0,Math.PI*2);ctx.fill();if(o.bridged){ctx.strokeStyle='#4e9d4e';ctx.lineWidth=8;ctx.lineCap='round';[-12,-4,4,12].forEach(y=>{ctx.beginPath();ctx.moveTo(-32,y);ctx.lineTo(32,y);ctx.stroke();});ctx.fillStyle='#78c75e';for(let i=-25;i<=25;i+=10){ctx.beginPath();ctx.ellipse(i,-7,7,3,.4,0,Math.PI*2);ctx.fill();}}}else{ctx.font=o.grown?'40px sans-serif':'28px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(o.grown?'🌿':'🌱',0,0);}ctx.restore();}}

  function drawProjectiles(){for(const p of projectiles){ctx.save();ctx.translate(p.x,p.y);if(p.type==='cutter'){ctx.strokeStyle='#dbfff2';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,10,-1.2,1.2);ctx.stroke();}if(p.type==='blast'){ctx.rotate(Math.atan2(p.vy,p.vx));ctx.strokeStyle='#eafff5';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,12,-1.1,1.1);ctx.stroke();ctx.strokeStyle='rgba(130,235,205,.65)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-18,-7);ctx.lineTo(-5,-4);ctx.moveTo(-20,7);ctx.lineTo(-5,4);ctx.stroke();}if(p.type==='water'){ctx.font='25px sans-serif';ctx.fillText('💧',0,0);}ctx.restore();}}
  function drawEffects(){for(const e of effects){const t=e.life/e.max;ctx.save();ctx.globalAlpha=t;if(e.kind==='splash'){ctx.strokeStyle='#5ab9ff';ctx.lineWidth=6;ctx.beginPath();ctx.arc(e.x,e.y,12+(1-t)*55,0,Math.PI*2);ctx.stroke();}else if(e.kind==='blastBurst'){ctx.strokeStyle='#dffff3';ctx.lineWidth=7;ctx.beginPath();ctx.arc(e.x,e.y,8+(1-t)*72,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(95,210,165,.55)';ctx.lineWidth=3;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*18,e.y+Math.sin(a)*18);ctx.lineTo(e.x+Math.cos(a)*(35+(1-t)*45),e.y+Math.sin(a)*(35+(1-t)*45));ctx.stroke();}}else{ctx.font=`${24+(1-t)*15}px sans-serif`;ctx.textAlign='center';ctx.fillText(e.icon,e.x,e.y-(1-t)*24);}ctx.restore();}}

  function updateHud(){hpEl.textContent=chick.hp;distanceEl.textContent=Math.ceil(distance);shieldEl.textContent=Math.floor(shieldGauge);buttons.forEach(b=>{const a=b.dataset.action;b.classList.toggle('cooldown',cooldown[a]>0||(a==='shield'&&shieldGauge<55));});}
  function setDirection(dir,on){
    move[dir]=on;
    const btn=dirButtons.find(b=>b.dataset.dir===dir);
    if(btn)btn.classList.toggle('pressed',on);
  }
  dirButtons.forEach(btn=>{
    const dir=btn.dataset.dir;
    btn.addEventListener('pointerdown',ev=>{ev.preventDefault();btn.setPointerCapture(ev.pointerId);setDirection(dir,true);});
    const stop=()=>setDirection(dir,false);
    btn.addEventListener('pointerup',stop);btn.addEventListener('pointercancel',stop);btn.addEventListener('lostpointercapture',stop);
  });
  buttons.forEach(btn=>{const action=btn.dataset.action;btn.addEventListener('pointerdown',ev=>{ev.preventDefault();btn.classList.add('pressed');cast(action);});btn.addEventListener('pointerup',()=>btn.classList.remove('pressed'));btn.addEventListener('pointercancel',()=>btn.classList.remove('pressed'));});
  window.addEventListener('keydown',ev=>{
    const actionMap={KeyA:'cutter',KeyB:'blast',KeyC:'water',KeyD:'shield',Space:'cutter'};
    if(actionMap[ev.code]&&!ev.repeat)cast(actionMap[ev.code]);
    const dirMap={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
    if(dirMap[ev.code]){ev.preventDefault();keys[dirMap[ev.code]]=true;}
  });
  window.addEventListener('keyup',ev=>{const dirMap={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(dirMap[ev.code])keys[dirMap[ev.code]]=false;});
  startBtn.addEventListener('click',start);window.addEventListener('resize',resize);resize();draw();
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
})();

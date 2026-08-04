(() => {
  'use strict';

  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const overlay = document.querySelector('#overlay');
  const startBtn = document.querySelector('#startBtn');
  const plusEl = document.querySelector('#plusScore');
  const minusEl = document.querySelector('#minusScore');
  const distanceEl = document.querySelector('#distance');
  const buttons = [...document.querySelectorAll('.magic')];
  const dpad = document.querySelector('#dpad');
  const stickKnob = document.querySelector('#stickKnob');

  let W = 390, H = 650, dpr = 1;
  let running = false, last = 0, time = 0, distance = 100, plusScore = 0, minusScore = 0;
  let spawnTimer = 0, obstacleTimer = 0;
  const move = { x:0, y:0 };
  const stick = { pointerId:null, angle:0, strength:0, direction:-1 };
  const keys = { up:false, down:false, left:false, right:false };

  const fairy = { x: W*.5, y:H*.44, r:18, speed:330, bob:0 };
  const chick = { x:W*.5, y:H*.88, inv:0, targetX:W*.5, targetY:H*.88, wanderTimer:0, speed:25, hop:0, blockedLedge:null, jumpFlash:0 };
  const cooldown = { windForward:0, windDown:0, waterForward:0, waterDown:0 };
  let enemies = [], projectiles = [], effects = [], obstacles = [], scenery = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width*dpr);
    canvas.height = Math.round(rect.height*dpr);
    W = rect.width; H = rect.height;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    chick.x = clamp(chick.x, 24, W-24); chick.y = clamp(chick.y, H*.67, H*.94);
    fairy.x = clamp(fairy.x, 26, W-26);
    fairy.y = clamp(fairy.y, 82, H*.90);
  }

  function reset() {
    time=0; distance=100; plusScore=0; minusScore=0; spawnTimer=.7; obstacleTimer=1.8;
    enemies=[]; projectiles=[]; effects=[]; obstacles=[]; scenery=[];
    fairy.x=W*.5; fairy.y=H*.56;
    move.x=0; move.y=0; resetStick();
    Object.keys(keys).forEach(k=>keys[k]=false);
    chick.x=W*.5; chick.y=H*.88; chick.inv=0; chick.targetX=chick.x; chick.targetY=chick.y; chick.wanderTimer=.3; chick.hop=0; chick.blockedLedge=null; chick.jumpFlash=0;
    Object.keys(cooldown).forEach(k=>cooldown[k]=0);
    for(let i=0;i<20;i++) scenery.push(makeScenery(Math.random()*H));
    updateHud();
  }

  function start(){ reset(); overlay.classList.remove('show'); running=true; last=performance.now(); requestAnimationFrame(loop); }
  function end(won){
    running=false; overlay.classList.add('show');
    overlay.querySelector('.card').innerHTML=`<h1>${won?'無事に到着！':'ゲーム終了'}</h1><p class="resultScores"><span class="plusResult">プラス +${Math.round(plusScore)}点</span><br><span class="minusResult">マイナス -${Math.round(minusScore)}点</span></p><p>${won?'気まぐれなヒヨコを森の出口まで送り届けました。マイナス点が増えてもゲームオーバーにはなりません。':'プラス点とマイナス点は別々に記録されます。'}</p><button id="restartBtn">もう一度</button>`;
    const b=overlay.querySelector('#restartBtn');
    b.style.cssText='width:100%;border:0;border-radius:16px;padding:14px;background:linear-gradient(90deg,#ffb65d,#ff8ba7);color:white;font-weight:900;font-size:17px;box-shadow:0 5px 0 #e67479';
    b.addEventListener('click',start,{once:true});
  }

  function loop(now){ if(!running)return; const dt=Math.min((now-last)/1000,.034); last=now; update(dt); draw(); requestAnimationFrame(loop); }

  function update(dt){
    time+=dt; distance=Math.max(0,100-time*1.35); if(distance<=0)return end(true);
    let dx=move.x+(keys.right?1:0)-(keys.left?1:0);
    let dy=move.y+(keys.down?1:0)-(keys.up?1:0);
    const len=Math.hypot(dx,dy)||1;
    if(dx||dy){ fairy.x+=dx/len*fairy.speed*dt; fairy.y+=dy/len*fairy.speed*dt; }
    fairy.x=clamp(fairy.x,24,W-24); fairy.y=clamp(fairy.y,82,H*.90); fairy.bob+=dt*7;
    chick.inv=Math.max(0,chick.inv-dt);
    // ヒヨコは縦スクロール中も気まぐれに上下左右へ歩く。
    chick.wanderTimer-=dt;
    if(chick.wanderTimer<=0 || Math.hypot(chick.targetX-chick.x,chick.targetY-chick.y)<8){
      chick.targetX=26+Math.random()*(W-52);
      chick.targetY=H*(.69+Math.random()*.23);
      chick.wanderTimer=.8+Math.random()*1.8;
    }
    const cdx=chick.targetX-chick.x, cdy=chick.targetY-chick.y, cdl=Math.hypot(cdx,cdy)||1;
    const nextX=chick.x+cdx/cdl*chick.speed*dt;
    let nextY=chick.y+cdy/cdl*chick.speed*dt;
    chick.blockedLedge=null;
    for(const o of obstacles){
      if(o.type!=='ledge'||o.cleared)continue;
      const half=o.width*.5;
      const inSpan=nextX>o.x-half-8&&nextX<o.x+half+8;
      // ヒヨコが段差の下側から上へ進もうとした時だけ通せんぼする。
      if(inSpan&&chick.y>=o.y+10&&nextY<o.y+18){
        nextY=o.y+18;
        chick.blockedLedge=o;
        chick.hop+=dt*13;
        // 段差を越えたい間は、少し先を目標にし続ける。
        chick.targetY=Math.min(chick.targetY,o.y-34);
        break;
      }
    }
    if(!chick.blockedLedge)chick.hop=Math.max(0,chick.hop-dt*8);
    chick.jumpFlash=Math.max(0,chick.jumpFlash-dt);
    chick.x=nextX;
    chick.y=nextY;
    chick.x=clamp(chick.x,22,W-22); chick.y=clamp(chick.y,H*.66,H*.95);
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
        if(chick.inv<=0){ deductScore(100,'敵に接触'); chick.inv=1.3; repel(e,e.x-chick.x,-1); burst(chick.x,chick.y,'💥'); }
      }
    }

    for(const p of projectiles){
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
      if(p.type==='wind'||p.type==='water'){
        p.z=Math.max(0,p.z-p.descent*dt);
        // 水・下は妖精の真下へ短く落ちるだけ。ほかは前方へ進みながら下降する。
        if(p.z<=0&&!p.exploded){
          p.exploded=true; p.life=0;
          if(p.type==='wind') blastBurst(p.x,p.y,p.mode);
          else waterSplash(p.x,p.y,p.mode);
        }
      }
    }

    for(const p of projectiles){
      if(p.life<=0||p.exploded)continue;
      for(const e of enemies){
        if(e.state!=='hunt')continue;
        // 水・下以外は飛行中に鳥へ当たる。前方の風玉は鳥の近くでも破裂する。
        const canHitBird=e.layer==='air' && !(p.type==='water'&&p.mode==='down');
        if(canHitBird&&dist(p,e)<p.r+e.r+6){
          if(p.type==='wind'){
            p.exploded=true;p.life=0;blastBurst(p.x,p.y,p.mode);
          } else {
            repel(e,p.vx||0,p.vy||-1);p.exploded=true;p.life=0;waterSplash(p.x,p.y,p.mode);burst(e.x,e.y,'💦');
          }
          break;
        }
      }
    }

    for(const o of obstacles){
      if(o.y>H+80)continue;
      if(o.type==='waterway'&&!o.bridged){
        const half=o.width*.5;
        const inWater=Math.abs(o.y-chick.y)<22&&Math.abs(o.x-chick.x)<half+8;
        if(inWater){
          chick.y=Math.min(H*.95,o.y+28);
          chick.targetY=Math.max(chick.targetY,o.y+46);
          if(chick.inv<=0&&!o.penalized){deductScore(120,'水辺');chick.inv=1.1;o.penalized=true;burst(chick.x,chick.y,'💦');}
        }
      }
      if(o.type==='branches'&&!o.cleared&&Math.abs(o.y-chick.y)<23&&Math.abs(o.x-chick.x)<38){
        chick.y=Math.min(H*.95,chick.y+10*dt);
        if(chick.inv<=0&&!o.penalized){deductScore(60,'小枝');chick.inv=.85;o.penalized=true;burst(chick.x,chick.y,'🍂');}
      }
    }

    effects.forEach(e=>e.life-=dt);
    projectiles=projectiles.filter(p=>p.life>0&&!p.exploded);
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
    const r=Math.random(); const type=r<.34?'branches':r<.60?'waterway':r<.78?'sprout':'ledge';
    const width=type==='ledge'?90+Math.random()*95:type==='waterway'?105+Math.random()*105:0;
    const x=(type==='ledge'||type==='waterway')?width*.5+18+Math.random()*Math.max(1,W-width-36):28+Math.random()*(W-56);
    obstacles.push({type,x,y:70+Math.random()*45,r:28,width,cleared:false,grown:false,bridged:false,penalized:false,grow:0});
  }

  function cast(action){
    if(!running||cooldown[action]>0)return;
    if(action==='windForward'){
      cooldown.windForward=.7;
      projectiles.push({type:'wind',mode:'forward',x:fairy.x,y:fairy.y-10,vx:0,vy:-155,r:17,life:1.25,z:78,startZ:78,descent:92,exploded:false});
    }
    if(action==='windDown'){
      cooldown.windDown=.58;
      projectiles.push({type:'wind',mode:'down',x:fairy.x,y:fairy.y+4,vx:0,vy:-42,r:16,life:.55,z:36,startZ:36,descent:110,exploded:false});
    }
    if(action==='waterForward'){
      cooldown.waterForward=.78;
      projectiles.push({type:'water',mode:'forward',x:fairy.x,y:fairy.y-8,vx:0,vy:-145,r:12,life:1.05,maxLife:1.05,z:72,startZ:72,descent:84,exploded:false});
    }
    if(action==='waterDown'){
      cooldown.waterDown=.65;
      projectiles.push({type:'water',mode:'down',x:fairy.x,y:fairy.y+10,vx:0,vy:42,r:10,life:.32,maxLife:.32,z:22,startZ:22,descent:90,exploded:false});
    }
  }

  function blastBurst(x,y,mode='forward'){
    const radius=mode==='down'?68:88;
    effects.push({x,y,life:.5,max:.5,kind:'blastBurst',radius});
    for(const e of enemies){
      if(e.state==='hunt'&&e.layer==='ground'&&Math.hypot(e.x-x,e.y-y)<radius)repel(e,e.x-x,e.y-y);
    }
    for(const o of obstacles){
      if(o.type==='branches'&&!o.cleared&&Math.hypot(o.x-x,o.y-y)<radius){o.cleared=true;addScore(60,o.x,o.y);burst(o.x,o.y,'🍂');}
      if(o.type==='ledge'&&!o.cleared){
        const nearBlast=Math.hypot(chick.x-x,chick.y-y)<(mode==='down'?82:102);
        const nearLedge=Math.abs(chick.y-o.y)<45&&Math.abs(chick.x-o.x)<o.width*.5+20;
        if(nearBlast&&nearLedge&&chick.y>=o.y+8){
          chick.y=o.y-28;
          chick.targetY=Math.min(chick.targetY,o.y-55);
          chick.blockedLedge=null;
          chick.jumpFlash=.55;
          addScore(80,chick.x,chick.y);
          burst(chick.x,chick.y,'✨');
        }
      }
    }
  }

  function waterSplash(x,y,mode='down'){
    const radius=mode==='forward'?72:60;
    effects.push({x,y,life:.55,max:.55,kind:'splash',radius});
    for(const e of enemies)if(e.state==='hunt'&&e.layer==='ground'&&Math.hypot(e.x-x,e.y-y)<radius)repel(e,e.x-x,e.y-y);
    for(const o of obstacles){
      if(Math.hypot(o.x-x,o.y-y)>=75)continue;
      if(o.type==='sprout'&&!o.cleared){o.grown=true;o.cleared=true;addScore(40,o.x,o.y);burst(o.x,o.y,'🌼');}
      if(o.type==='waterway'&&!o.bridged){
        const seedX=o.x-o.width*.5+18, seedY=o.y+25;
        if(Math.hypot(seedX-x,seedY-y)<52){o.bridged=true;o.cleared=true;o.grow=1;addScore(120,o.x,o.y);burst(seedX,seedY,'🌿');}
      }
    }
  }

  function repel(e,x,y){
    if(e.state!=='flee'&&!e.awarded){e.awarded=true;addScore(e.layer==='air'?120:100,e.x,e.y);}
    const l=Math.hypot(x,y)||1;e.state='flee';e.fleeX=x/l*310;e.fleeY=y/l*310;e.life=1.2;
  }
  function burst(x,y,icon){effects.push({x,y,icon,life:.7,max:.7,kind:'icon'});}

  function draw(){ctx.clearRect(0,0,W,H);drawBackground();drawScenery();drawObstacles();drawChicks();drawEnemies();drawProjectiles();drawFairy();drawEffects();}

  function drawBackground(){
    // 中央の道は置かず、画面全体を自由に歩ける草原として描画。
    ctx.fillStyle='#76c85e';
    ctx.fillRect(0,0,W,H);
    const offset=(time*22)%54;
    for(let row=-1;row<Math.ceil(H/54)+1;row++){
      const y=row*54+offset;
      for(let col=0;col<Math.ceil(W/58)+1;col++){
        const x=col*58+(row%2)*24;
        ctx.fillStyle='rgba(255,255,255,.05)';
        ctx.beginPath();ctx.ellipse(x,y,12,5,.35,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(52,137,54,.08)';
        ctx.beginPath();ctx.arc(x+17,y+14,3,0,Math.PI*2);ctx.fill();
      }
    }
  }

  function drawScenery(){for(const s of scenery){ctx.save();ctx.translate(s.x,s.y);if(s.type==='flower'){ctx.font='16px sans-serif';ctx.fillText('🌼',0,0);}else if(s.type==='stone'){ctx.fillStyle='#9da791';ctx.beginPath();ctx.ellipse(0,0,s.r,s.r*.7,0,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle='#4f9d4f';ctx.beginPath();ctx.arc(0,0,s.r,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-s.r*.55,2,s.r*.65,0,Math.PI*2);ctx.fill();}ctx.restore();}}

  function drawFairy(){
    const y=fairy.y+Math.sin(fairy.bob)*2;
    ctx.save();ctx.translate(fairy.x,y);
    ctx.fillStyle='rgba(75,104,55,.22)';ctx.beginPath();ctx.ellipse(0,23,17,7,0,0,Math.PI*2);ctx.fill();

    // 蝶のような左右2枚ずつ、合計4枚の半透明な虹色の羽。
    const wings=[
      {x:-14,y:-5,rx:12,ry:21,rot:-.52,side:-1},
      {x:-15,y:10,rx:10,ry:15,rot:-.92,side:-1},
      {x:14,y:-5,rx:12,ry:21,rot:.52,side:1},
      {x:15,y:10,rx:10,ry:15,rot:.92,side:1}
    ];
    const rainbow=['#ff91a4','#ffc47c','#fff39a','#9ceaa7','#8ce8e4','#91baff','#c9a2f4'];
    for(const w of wings){
      ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.rot);
      const grad=ctx.createLinearGradient(-w.rx,-w.ry,w.rx,w.ry);
      rainbow.forEach((c,i)=>grad.addColorStop(i/(rainbow.length-1),c));
      ctx.globalAlpha=.26;ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(0,0,w.rx,w.ry,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.42;ctx.strokeStyle='rgba(245,255,255,.9)';ctx.lineWidth=1.3;ctx.stroke();
      // 蝶の羽脈と淡い模様。
      ctx.globalAlpha=.22;ctx.strokeStyle='#ffffff';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,w.ry*.72);ctx.quadraticCurveTo(w.side*2,0,0,-w.ry*.75);ctx.stroke();
      ctx.beginPath();ctx.ellipse(0,-w.ry*.18,w.rx*.46,w.ry*.28,0,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.ellipse(w.side*1.5,w.ry*.35,w.rx*.32,w.ry*.2,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // 羽の上を流れる小さなきらめき。
    for(let i=0;i<7;i++){
      const a=time*1.7+i*2.31;
      const sx=Math.sin(a)*25, sy=-2+Math.cos(a*1.37)*17;
      ctx.globalAlpha=.28+.22*(.5+.5*Math.sin(a*2));ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(sx,sy,1.1+(i%2)*.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.fillStyle='#6ac98a';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(-10,16);ctx.lineTo(10,16);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f4c28a';ctx.beginPath();ctx.arc(0,-11,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#efb35b';ctx.beginPath();ctx.arc(0,-17,8,Math.PI,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#58724d';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4,15);ctx.lineTo(-7,25);ctx.moveTo(4,15);ctx.lineTo(7,25);ctx.stroke();ctx.restore();
  }

  function drawChicks(){
    const blockedBounce=chick.blockedLedge?Math.abs(Math.sin(chick.hop))*7:0;
    const jumpBounce=chick.jumpFlash>0?Math.sin((1-chick.jumpFlash/.55)*Math.PI)*13:0;
    if(!(chick.inv>0&&Math.floor(time*12)%2===0)) drawChick(chick.x,chick.y+Math.sin(time*7)*1.7-blockedBounce-jumpBounce);
  }
  function drawChick(x,y){ctx.save();ctx.translate(x,y);ctx.fillStyle='#ffd83d';ctx.beginPath();ctx.ellipse(0,2,9,11,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,-7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ef9d28';ctx.beginPath();ctx.moveTo(6,-7);ctx.lineTo(12,-4);ctx.lineTo(6,-2);ctx.fill();ctx.strokeStyle='#b97725';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,12);ctx.lineTo(-4,16);ctx.moveTo(3,12);ctx.lineTo(4,16);ctx.stroke();ctx.restore();}

  function drawEnemies(){for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.rot);if(e.layer==='air'){ctx.fillStyle='rgba(40,60,35,.2)';ctx.beginPath();ctx.ellipse(8,20,18,7,0,0,Math.PI*2);ctx.fill();drawBird();}else if(e.kind==='fox')drawFox();else if(e.kind==='cat')drawCat();else drawSnake();ctx.restore();}}
  function drawFox(){ctx.fillStyle='#e98737';ctx.beginPath();ctx.ellipse(0,5,15,11,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-8,-7,9,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-15,-12);ctx.lineTo(-12,-22);ctx.lineTo(-7,-13);ctx.moveTo(-2,-13);ctx.lineTo(1,-22);ctx.lineTo(5,-10);ctx.fill();ctx.beginPath();ctx.ellipse(16,7,12,7,.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff3dc';ctx.beginPath();ctx.ellipse(-9,-4,6,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#333';ctx.beginPath();ctx.arc(-12,-8,1.4,0,Math.PI*2);ctx.fill();}
  function drawCat(){ctx.fillStyle='#8e9298';ctx.beginPath();ctx.ellipse(0,6,14,10,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-7,-7,8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-14,-12);ctx.lineTo(-12,-20);ctx.lineTo(-7,-13);ctx.moveTo(-2,-13);ctx.lineTo(1,-20);ctx.lineTo(2,-10);ctx.fill();ctx.strokeStyle='#555';ctx.lineWidth=4;ctx.beginPath();ctx.arc(13,4,11,-1.1,1.1);ctx.stroke();ctx.fillStyle='#333';ctx.beginPath();ctx.arc(-10,-8,1.2,0,Math.PI*2);ctx.fill();}
  function drawSnake(){ctx.strokeStyle='#3c9b58';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,4,12,.3,5.2);ctx.stroke();ctx.fillStyle='#56b96c';ctx.beginPath();ctx.ellipse(7,-9,8,6,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#222';ctx.beginPath();ctx.arc(10,-10,1.2,0,Math.PI*2);ctx.fill();}
  function drawBird(){ctx.fillStyle='#3f79bb';ctx.beginPath();ctx.ellipse(0,0,13,8,-.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-3,0);ctx.lineTo(-24,-12);ctx.lineTo(-12,6);ctx.moveTo(3,0);ctx.lineTo(23,-13);ctx.lineTo(13,7);ctx.fill();ctx.fillStyle='#ef9d28';ctx.beginPath();ctx.moveTo(12,-1);ctx.lineTo(20,2);ctx.lineTo(12,5);ctx.fill();}

  function drawObstacles(){for(const o of obstacles){ctx.save();ctx.translate(o.x,o.y);if(o.type==='branches'){ctx.globalAlpha=o.cleared?.2:1;ctx.strokeStyle='#8d5d32';ctx.lineWidth=7;ctx.lineCap='round';[-18,-9,0,9,18].forEach((x,i)=>{ctx.beginPath();ctx.moveTo(x-10,-12+i%2*8);ctx.lineTo(x+10,12-i%2*8);ctx.stroke();});}else if(o.type==='waterway'){
      const half=o.width*.5;
      // 水たまり／小川。下側（ヒヨコ側）の左端に双葉を置く。
      const water=ctx.createLinearGradient(0,-20,0,22);water.addColorStop(0,'#71d7ef');water.addColorStop(1,'#3ca6d2');
      ctx.fillStyle=water;ctx.beginPath();ctx.roundRect(-half,-19,o.width,38,18);ctx.fill();
      ctx.strokeStyle='rgba(229,253,255,.72)';ctx.lineWidth=2;
      for(let x=-half+15;x<half-8;x+=25){ctx.beginPath();ctx.arc(x,0,9,Math.PI*.1,Math.PI*.9);ctx.stroke();}
      if(o.bridged){
        ctx.strokeStyle='#3e9147';ctx.lineWidth=9;ctx.lineCap='round';
        [-12,-4,4,12].forEach(y=>{ctx.beginPath();ctx.moveTo(-half+7,y);ctx.lineTo(half-7,y);ctx.stroke();});
        ctx.fillStyle='#77c95d';
        for(let x=-half+14;x<half-5;x+=15){ctx.beginPath();ctx.ellipse(x,-8,8,4,(x%2?-.45:.45),0,Math.PI*2);ctx.fill();}
      }
      const sx=-half+18, sy=25;
      ctx.strokeStyle='#32843e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,sy+8);ctx.lineTo(sx,sy-2);ctx.stroke();
      ctx.fillStyle=o.bridged?'#68c957':'#7bd46b';
      ctx.beginPath();ctx.ellipse(sx-5,sy-4,6,3,-.55,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(sx+5,sy-4,6,3,.55,0,Math.PI*2);ctx.fill();
    }else if(o.type==='ledge'){
      const half=o.width*.5;
      ctx.fillStyle='#8b8f78';ctx.beginPath();ctx.roundRect(-half,-10,o.width,20,8);ctx.fill();
      ctx.fillStyle='#b7b99e';ctx.beginPath();ctx.roundRect(-half,-10,o.width,8,7);ctx.fill();
      ctx.strokeStyle='rgba(67,76,55,.35)';ctx.lineWidth=2;
      for(let x=-half+12;x<half;x+=22){ctx.beginPath();ctx.moveTo(x,-7);ctx.lineTo(x+7,7);ctx.stroke();}
      ctx.fillStyle='rgba(49,96,42,.25)';ctx.fillRect(-half,10,o.width,5);
    }else{ctx.font=o.grown?'40px sans-serif':'28px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(o.grown?'🌿':'🌱',0,0);}ctx.restore();}}

  function drawProjectiles(){
    for(const p of projectiles){
      ctx.save();ctx.translate(p.x,p.y);
      const height=Math.max(0,p.z||0);
      const progress=1-height/(p.startZ||1);
      const visualY=-height*.22;
      const scale=.74+progress*.34;
      ctx.fillStyle=`rgba(45,78,48,${.06+progress*.15})`;
      ctx.beginPath();ctx.ellipse(0,5,11*scale,4.5*scale,0,0,Math.PI*2);ctx.fill();
      ctx.translate(0,visualY);ctx.scale(scale,scale);
      if(p.type==='wind'){
        const glow=ctx.createRadialGradient(-4,-5,2,0,0,18);
        glow.addColorStop(0,'rgba(255,255,255,.98)');glow.addColorStop(.45,'rgba(211,255,235,.9)');glow.addColorStop(1,'rgba(83,205,136,.62)');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(239,255,247,.96)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='rgba(62,165,105,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.stroke();
      }else{
        const g=ctx.createRadialGradient(-4,-6,1,0,0,17);g.addColorStop(0,'rgba(240,253,255,.98)');g.addColorStop(.35,'rgba(105,206,255,.96)');g.addColorStop(1,'rgba(37,126,221,.72)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(224,248,255,.95)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.72)';ctx.beginPath();ctx.ellipse(-4,-5,3.5,2.2,-.5,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
  }
  function drawEffects(){for(const e of effects){const t=e.life/e.max;ctx.save();ctx.globalAlpha=t;if(e.kind==='splash'){ctx.strokeStyle='#5ab9ff';ctx.lineWidth=6;ctx.beginPath();ctx.arc(e.x,e.y,12+(1-t)*(e.radius||55),0,Math.PI*2);ctx.stroke();}else if(e.kind==='blastBurst'){ctx.strokeStyle='#dffff3';ctx.lineWidth=7;ctx.beginPath();ctx.arc(e.x,e.y,8+(1-t)*(e.radius||72),0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(95,210,165,.55)';ctx.lineWidth=3;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*18,e.y+Math.sin(a)*18);ctx.lineTo(e.x+Math.cos(a)*(35+(1-t)*45),e.y+Math.sin(a)*(35+(1-t)*45));ctx.stroke();}}else{ctx.font=`900 ${24+(1-t)*15}px sans-serif`;ctx.textAlign='center';if(e.kind==='plus')ctx.fillStyle='#fff7a8';else if(e.kind==='minus')ctx.fillStyle='#ffb3bc';ctx.fillText(e.icon,e.x,e.y-(1-t)*24);}ctx.restore();}}

  function deductScore(points,label){minusScore+=points;effects.push({x:chick.x,y:chick.y-24,icon:`-${points}`,life:.9,max:.9,kind:'minus'});}
  function addScore(points,x,y){plusScore+=points;effects.push({x,y:y-18,icon:`+${points}`,life:.9,max:.9,kind:'plus'});}

  function updateHud(){plusEl.textContent=Math.round(plusScore);minusEl.textContent=Math.round(minusScore);distanceEl.textContent=Math.ceil(distance);buttons.forEach(b=>{const a=b.dataset.action;b.classList.toggle('cooldown',cooldown[a]>0);});}
  function resetStick(){
    stick.pointerId=null; stick.strength=0; stick.direction=-1;
    move.x=0; move.y=0;
    if(stickKnob)stickKnob.style.transform='translate(-50%,-50%)';
    if(dpad)dpad.classList.remove('active');
  }
  function updateStick(clientX,clientY){
    const rect=dpad.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    let dx=clientX-cx, dy=clientY-cy;
    const max=rect.width*.29, len=Math.hypot(dx,dy);
    const dead=rect.width*.09;
    if(len<dead){ move.x=0; move.y=0; stick.direction=-1; dx=0;dy=0; }
    else {
      const angle=Math.atan2(dy,dx);
      // 8方向へスナップ。上、右上、右、右下、下、左下、左、左上。
      const step=Math.PI/4;
      const snapped=Math.round(angle/step)*step;
      stick.direction=((Math.round(angle/step)%8)+8)%8;
      stick.angle=snapped; stick.strength=Math.min(1,(len-dead)/(max-dead));
      move.x=Math.cos(snapped); move.y=Math.sin(snapped);
      const knobLen=Math.min(max,len);
      dx=Math.cos(angle)*knobLen; dy=Math.sin(angle)*knobLen;
    }
    stickKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  }
  dpad.addEventListener('pointerdown',ev=>{
    ev.preventDefault(); stick.pointerId=ev.pointerId; dpad.setPointerCapture(ev.pointerId);
    dpad.classList.add('active'); updateStick(ev.clientX,ev.clientY);
  });
  dpad.addEventListener('pointermove',ev=>{
    if(ev.pointerId!==stick.pointerId)return; ev.preventDefault(); updateStick(ev.clientX,ev.clientY);
  });
  const endStick=ev=>{ if(stick.pointerId!==null&&ev.pointerId!==undefined&&ev.pointerId!==stick.pointerId)return; resetStick(); };
  dpad.addEventListener('pointerup',endStick); dpad.addEventListener('pointercancel',endStick); dpad.addEventListener('lostpointercapture',endStick);
  buttons.forEach(btn=>{const action=btn.dataset.action;btn.addEventListener('pointerdown',ev=>{ev.preventDefault();btn.classList.add('pressed');cast(action);});btn.addEventListener('pointerup',()=>btn.classList.remove('pressed'));btn.addEventListener('pointercancel',()=>btn.classList.remove('pressed'));});
  window.addEventListener('keydown',ev=>{
    const actionMap={KeyA:'windForward',KeyB:'windDown',KeyC:'waterForward',KeyD:'waterDown',Space:'windForward'};
    if(actionMap[ev.code]&&!ev.repeat)cast(actionMap[ev.code]);
    const dirMap={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
    if(dirMap[ev.code]){ev.preventDefault();keys[dirMap[ev.code]]=true;}
  });
  window.addEventListener('keyup',ev=>{const dirMap={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(dirMap[ev.code])keys[dirMap[ev.code]]=false;});
  startBtn.addEventListener('click',start);window.addEventListener('resize',resize);resize();draw();
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
})();

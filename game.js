(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const scoreEl=document.getElementById('score'),overlay=document.getElementById('overlay'),startBtn=document.getElementById('start');
let W=0,H=0,dpr=1,state='ready',lane=1,targetLane=1,playerY=0,jumpV=0,sliding=0;
let distance=0,coins=0,speed=360,spawn=0,objects=[],particles=[],last=0,shake=0;
const lanes=[-0.29,0,0.29];
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
new ResizeObserver(resize).observe(canvas);resize();
function roadY(t){return H*.27+t*t*H*.73}
function laneX(l,t){return W/2+lanes[l]*W*(.3+t*.9)}
function rounded(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawBackground(){
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#64c8e9');sky.addColorStop(.48,'#b8e8dc');sky.addColorStop(.49,'#276b55');sky.addColorStop(1,'#102d36');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // distant hills and city
 ctx.fillStyle='#4b9c7a';for(let i=0;i<7;i++){let x=(i*W/5-distance*.05%(W/5)+W)%W;ctx.beginPath();ctx.arc(x,H*.47,W*.14,Math.PI,0);ctx.fill()}
 for(let i=0;i<8;i++){let x=(i*W/6-distance*.12%(W/6)+W)%W;let h=35+(i*37)%65;ctx.fillStyle=i%2?'#397d75':'#326d69';ctx.fillRect(x,H*.37-h,30,h)}
 // track
 ctx.fillStyle='#4a4e50';ctx.beginPath();ctx.moveTo(W*.22,H*.27);ctx.lineTo(W*.78,H*.27);ctx.lineTo(W*1.16,H);ctx.lineTo(-W*.16,H);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#d4c7a3';ctx.lineWidth=5;for(let l=0;l<3;l++){let x0=W/2+lanes[l]*W*.3,x1=W/2+lanes[l]*W*1.2;ctx.beginPath();ctx.moveTo(x0,H*.27);ctx.lineTo(x1,H);ctx.stroke()}
 // sleepers
 for(let i=0;i<13;i++){let t=((i/13+(distance/220)%1)%1);let y=roadY(t);let half=W*(.13+t*.43);ctx.fillStyle='#8b7657';ctx.fillRect(W/2-half,y,half*2,Math.max(2,2+t*10))}
}
function drawPikachu(x,y,s,slide=false){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 // shadow
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,4,24,8,0,0,Math.PI*2);ctx.fill();
 if(slide){ctx.rotate(-.22);rounded(-25,-22,50,27,14,'#ffd83d');}
 else{
  // ears
  ctx.fillStyle='#ffd83d';ctx.beginPath();ctx.moveTo(-14,-35);ctx.lineTo(-25,-75);ctx.quadraticCurveTo(-5,-70,-5,-36);ctx.fill();ctx.beginPath();ctx.moveTo(12,-37);ctx.lineTo(25,-76);ctx.quadraticCurveTo(34,-54,18,-32);ctx.fill();
  ctx.fillStyle='#302c2a';ctx.beginPath();ctx.moveTo(-22,-70);ctx.lineTo(-25,-75);ctx.lineTo(-18,-72);ctx.fill();ctx.beginPath();ctx.moveTo(22,-70);ctx.lineTo(25,-76);ctx.lineTo(19,-72);ctx.fill();
  ctx.fillStyle='#ffd83d';ctx.beginPath();ctx.ellipse(0,-25,25,29,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(-9,-30,2.8,0,7);ctx.arc(9,-30,2.8,0,7);ctx.fill();
  ctx.fillStyle='#ef6b55';ctx.beginPath();ctx.arc(-19,-20,5,0,7);ctx.arc(19,-20,5,0,7);ctx.fill();
  ctx.strokeStyle='#9b5422';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-16,6,.2,Math.PI-.2);ctx.stroke();
  ctx.fillStyle='#ffd83d';ctx.beginPath();ctx.moveTo(20,-8);ctx.lineTo(39,-20);ctx.lineTo(31,-30);ctx.lineTo(44,-42);ctx.lineTo(27,-37);ctx.lineTo(21,-25);ctx.fill();
  ctx.fillStyle='#e69b25';ctx.beginPath();ctx.moveTo(39,-20);ctx.lineTo(31,-30);ctx.lineTo(44,-42);ctx.fill();
 }
 ctx.restore();
}
function drawArceus(){
 const x=W/2,y=H*.16;ctx.save();ctx.translate(x,y);
 // glowing golden ring and simplified guardian silhouette
 ctx.strokeStyle='#fff0a0';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,42,17,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#e8e3d2';ctx.beginPath();ctx.moveTo(-12,10);ctx.lineTo(-25,-13);ctx.lineTo(-12,-9);ctx.lineTo(0,-30);ctx.lineTo(12,-9);ctx.lineTo(25,-13);ctx.lineTo(12,10);ctx.closePath();ctx.fill();
 ctx.fillStyle='#c5a43b';ctx.fillRect(-5,8,10,22);ctx.restore();
}
function drawObject(o){
 const t=o.z, y=roadY(t),x=laneX(o.lane,t),s=.35+t*1.25;
 if(o.type==='coin'){ctx.fillStyle='#ffdf38';ctx.strokeStyle='#fff5a8';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-18*s,10*s,14*s,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#b57a12';ctx.font=`bold ${13*s}px Arial`;ctx.textAlign='center';ctx.fillText('P',x,y-13*s)}
 else if(o.type==='barrier'){rounded(x-23*s,y-34*s,46*s,34*s,5*s,'#e35e3f');ctx.fillStyle='#ffe7c0';ctx.fillRect(x-19*s,y-23*s,38*s,6*s)}
 else {rounded(x-34*s,y-64*s,68*s,64*s,9*s,'#267f9f');rounded(x-27*s,y-56*s,54*s,38*s,5*s,'#a8e2e8');ctx.fillStyle='#173c4c';ctx.fillRect(x-27*s,y-12*s,54*s,8*s);ctx.fillStyle='#d6e7e9';ctx.fillRect(x-35*s,y-2*s,70*s,5*s)}
}
function spawnObject(){const l=Math.floor(Math.random()*3);const r=Math.random();objects.push({lane:l,z:0,type:r<.32?'coin':r<.66?'barrier':'train'});if(Math.random()<.55)objects.push({lane:(l+1+Math.floor(Math.random()*2))%3,z:0,type:'coin'})}
function draw(){
 drawBackground();drawArceus();
 objects.slice().sort((a,b)=>a.z-b.z).forEach(drawObject);
 const x=laneX(lane,.88),base=H*.86-playerY;drawPikachu(x,base,1.15,sliding>0);
 if(shake>0){ctx.fillStyle='#ffdf38';ctx.font='bold 18px Arial';ctx.textAlign='center';ctx.fillText('WATCH OUT!',W/2,H*.22)}
}
function reset(){distance=0;coins=0;speed=360;spawn=0;objects=[];lane=targetLane=1;playerY=0;jumpV=0;sliding=0;shake=0;scoreEl.textContent='0 m · 0 coins'}
function start(){reset();state='run';overlay.classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}
function end(){state='over';overlay.classList.remove('hidden');overlay.querySelector('h1').textContent='ARCEUS CAUGHT YOU!';overlay.querySelector('p').textContent=`You surfed ${Math.floor(distance)} metres and collected ${coins} PokéCoins.`;startBtn.textContent='RUN AGAIN'}
function act(a){if(state!=='run')return;if(a==='left')targetLane=Math.max(0,targetLane-1);if(a==='right')targetLane=Math.min(2,targetLane+1);if(a==='jump'&&playerY===0)jumpV=680;if(a==='slide')sliding=.65}
function loop(now){if(state!=='run')return;let dt=Math.min((now-last)/1000,.035);last=now;distance+=speed*dt/10;speed=Math.min(760,360+distance*.55);spawn-=dt;if(spawn<=0){spawnObject();spawn=Math.max(.48,1.05-distance/1800)}
 lane+=(targetLane-lane)*Math.min(1,dt*13);if(jumpV){playerY+=jumpV*dt;jumpV-=1550*dt;if(playerY<0){playerY=0;jumpV=0}}sliding=Math.max(0,sliding-dt);
 for(const o of objects){o.z+=dt*(speed/500);if(o.z>.78&&o.z<.99&&Math.round(lane)===o.lane){if(o.type==='coin'){coins++;o.z=2}else if(o.type==='train'||(o.type==='barrier'&&playerY<30&&sliding<=0)){shake=.3;end();return}else if(o.type==='barrier'&&playerY>30){o.z=2}else if(o.type==='train'&&sliding>0){o.z=2}}}
 objects=objects.filter(o=>o.z<1.2);shake=Math.max(0,shake-dt);scoreEl.textContent=`${Math.floor(distance)} m · ${coins} coins`;draw();requestAnimationFrame(loop)}
startBtn.addEventListener('click',start);
window.addEventListener('keydown',e=>{if(['ArrowLeft','a','A'].includes(e.key))act('left');if(['ArrowRight','d','D'].includes(e.key))act('right');if(['ArrowUp','w','W',' '].includes(e.key))act('jump');if(['ArrowDown','s','S'].includes(e.key))act('slide');if(e.key==='Enter'&&state!=='run')start()});
let sx=0,sy=0;canvas.addEventListener('touchstart',e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});canvas.addEventListener('touchend',e=>{let dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;if(Math.abs(dx)>Math.abs(dy))act(dx>0?'right':'left');else act(dy<0?'jump':'slide')},{passive:true});
draw();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 96;
const OUT_DIR = path.join(__dirname, '..', 'sprites');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TEAM_BLUE = { accent: '#3a78c2', dark: '#235089', light: '#7fc0ff' };

const AP = [
  { cloth:'#8a6a3a', clothDark:'#5e4422', clothLight:'#a9864e', metal:'#9a7a4a', skin:'#e8b894', skinDark:'#c8966e', hair:'#4a3422', leather:'#5e4422' },
  { cloth:'#7a8290', clothDark:'#4e5560', clothLight:'#9aa2b0', metal:'#c2c6ce', skin:'#ecbf9a', skinDark:'#c8966e', hair:'#3a2a1a', leather:'#4e5560' },
  { cloth:'#3a5e9a', clothDark:'#26406e', clothLight:'#5a7eba', metal:'#caa24e', skin:'#e8b894', skinDark:'#c8966e', hair:'#2a1a10', leather:'#26406e' },
  { cloth:'#5e6e3e', clothDark:'#3e4a26', clothLight:'#7a8a52', metal:'#4a4a3a', skin:'#e0b088', skinDark:'#b8866a', hair:'#2a2a1a', leather:'#3e4a26' },
  { cloth:'#2a2c3c', clothDark:'#16181e', clothLight:'#3a3c50', metal:'#3a3c58', skin:'#d8b090', skinDark:'#b08870', hair:'#1a1a2a', leather:'#16181e' },
];

function rect(ctx,x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
function outlineRect(ctx,x,y,w,h,c){ ctx.strokeStyle=c; ctx.lineWidth=1; ctx.strokeRect(Math.round(x)+0.5,Math.round(y)+0.5,Math.round(w)-1,Math.round(h)-1); }
function circle(ctx,cx,cy,r,c){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); }
function outlineCircle(ctx,cx,cy,r,c){ ctx.strokeStyle=c; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke(); }
function line(ctx,x1,y1,x2,y2,c,w){ ctx.strokeStyle=c; ctx.lineWidth=w||1; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
function grad(ctx,x,y,w,h,c1,c2){ const g=ctx.createLinearGradient(x,y,x,y+h); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; }
function gradH(ctx,x,y,w,h,c1,c2){ const g=ctx.createLinearGradient(x,y,x+w,y); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; }
function rgrad(ctx,cx,cy,r,c1,c2){ const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; }
function shadow(ctx,cx,by,w){ ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cx,by,w*0.5,2,0,0,Math.PI*2); ctx.fill(); }
function px(ctx,x,y,c){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),1,1); }

function head(ctx,cx,cy,r,skin,sd,hair,dir){
  dir=dir||1;
  if(hair){ ctx.fillStyle=hair; ctx.beginPath(); ctx.arc(cx,cy-1,r+1,Math.PI*0.8,Math.PI*2.2); ctx.fill(); rect(ctx,cx-r-1,cy-r-1,r*2+2,4,hair); }
  circle(ctx,cx,cy,r,rgrad(ctx,cx-1,cy-1,r,skin,sd));
  outlineCircle(ctx,cx,cy,r,sd);
  px(ctx,cx+dir*2,cy-1,'#fff'); px(ctx,cx+dir*3,cy-1,'#fff');
  px(ctx,cx+dir*3,cy-1,'#1a1a1a'); px(ctx,cx+dir*4,cy-1,'#1a1a1a');
  px(ctx,cx+dir*2,cy+2,sd); px(ctx,cx+dir*3,cy+2,sd);
}

function torso(ctx,cx,ty,w,h,cl,cd,cll){
  rect(ctx,cx-w/2,ty,w,h,gradH(ctx,cx-w/2,ty,w,h,cll||cl,cd));
  outlineRect(ctx,cx-w/2,ty,w,h,cd);
  line(ctx,cx,ty+1,cx,ty+h-1,cd,0.5);
}

function legs(ctx,cx,ty,h,c,cd){
  rect(ctx,cx-7,ty,5,h,c); rect(ctx,cx+2,ty,5,h,c);
  outlineRect(ctx,cx-7,ty,5,h,cd); outlineRect(ctx,cx+2,ty,5,h,cd);
  rect(ctx,cx-6,ty+1,2,h-2,cd); rect(ctx,cx+3,ty+1,2,h-2,cd);
  rect(ctx,cx-8,ty+h-3,7,3,'#2a1a0e'); rect(ctx,cx+1,ty+h-3,7,3,'#2a1a0e');
}

function arms(ctx,cx,ty,h,skin,sd){
  rect(ctx,cx-12,ty+2,5,h,skin); rect(ctx,cx+7,ty+2,5,h,skin);
  outlineRect(ctx,cx-12,ty+2,5,h,sd); outlineRect(ctx,cx+7,ty+2,5,h,sd);
  rect(ctx,cx-11,ty+3,2,h-2,skin); rect(ctx,cx+8,ty+3,2,h-2,skin);
}

function belt(ctx,cx,y,w,c){ rect(ctx,cx-w/2,y,w,3,c); rect(ctx,cx-2,y,4,3,'#b5894e'); px(ctx,cx-1,y+1,'#8a6a2e'); }
function sash(ctx,cx,ty,h,tc){ rect(ctx,cx-2,ty,4,h,tc); rect(ctx,cx-1,ty+1,1,h-2,TEAM_BLUE.light); }

function cape(ctx,cx,ty,h,w,c,cd){
  rect(ctx,cx-w/2,ty,w,h,gradH(ctx,cx-w/2,ty,w,h,c,cd));
  outlineRect(ctx,cx-w/2,ty,w,h,cd);
  for(let i=0;i<3;i++) line(ctx,cx-w/4+i*(w/4),ty+2,cx-w/4+i*(w/4),ty+h-2,cd,0.5);
}

// ════════════════════════════════════════════════════════════
// AGE 0 — STONE AGE
// ════════════════════════════════════════════════════════════

function drawMelee0(ctx){
  const cx=48,ap=AP[0];
  shadow(ctx,cx,88,24);
  head(ctx,cx,24,10,ap.skin,ap.skinDark,'#4a3422');
  torso(ctx,cx,36,24,18,'#7a5e3e','#5a4228','#8a6e4e');
  sash(ctx,cx,36,18,TEAM_BLUE.accent);
  belt(ctx,cx,53,24,'#5a4228');
  for(let i=0;i<5;i++){ px(ctx,cx-8+i*4,38,'#6a4e2e'); px(ctx,cx-6+i*4,42,'#6a4e2e'); }
  arms(ctx,cx,36,14,ap.skin,ap.skinDark);
  rect(ctx,cx-6,56,4,14,ap.skin); rect(ctx,cx+2,56,4,14,ap.skin);
  outlineRect(ctx,cx-6,56,4,14,ap.skinDark); outlineRect(ctx,cx+2,56,4,14,ap.skinDark);
  rect(ctx,cx-7,62,6,2,'#5e4422'); rect(ctx,cx+1,62,6,2,'#5e4422');
  rect(ctx,cx-7,68,6,3,'#3a2a14'); rect(ctx,cx+1,68,6,3,'#3a2a14');
  rect(ctx,cx+14,30,4,26,'#6a4a2a'); outlineRect(ctx,cx+14,30,4,26,'#3a2a14');
  circle(ctx,cx+16,28,7,'#8a6233'); outlineCircle(ctx,cx+16,28,7,'#4a3216');
  for(let i=0;i<3;i++) line(ctx,cx+12+i*4,24,cx+12+i*4,32,'#6a4e2e',0.5);
  px(ctx,cx-3,23,'#c23a3a'); px(ctx,cx+4,23,'#c23a3a');
}

function drawRanged0(ctx){
  const cx=48,ap=AP[0];
  shadow(ctx,cx,88,24);
  head(ctx,cx,24,10,ap.skin,ap.skinDark,'#4a3422');
  torso(ctx,cx,36,22,18,'#7a5e3e','#5a4228','#8a6e4e');
  sash(ctx,cx,36,18,TEAM_BLUE.accent);
  belt(ctx,cx,53,22,'#5a4228');
  arms(ctx,cx,36,14,ap.skin,ap.skinDark);
  rect(ctx,cx-6,56,4,14,ap.skin); rect(ctx,cx+2,56,4,14,ap.skin);
  outlineRect(ctx,cx-6,56,4,14,ap.skinDark); outlineRect(ctx,cx+2,56,4,14,ap.skinDark);
  rect(ctx,cx-7,68,6,3,'#3a2a14'); rect(ctx,cx+1,68,6,3,'#3a2a14');
  ctx.strokeStyle='#5a4a2a'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(cx+14,38); ctx.quadraticCurveTo(cx+26,28,cx+28,22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+14,42); ctx.quadraticCurveTo(cx+26,34,cx+28,22); ctx.stroke();
  circle(ctx,cx+28,20,3,'#7a7a7a'); outlineCircle(ctx,cx+28,20,3,'#4a4a4a');
  circle(ctx,cx-8,54,2,'#7a7a7a'); circle(ctx,cx-5,55,2,'#6a6a6a');
}

function drawFast0(ctx){
  const cx=48,ap=AP[0];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-14,42,32,22,grad(ctx,cx-14,42,32,22,'#6a9a4a','#4a7a2a'));
  outlineRect(ctx,cx-14,42,32,22,'#3a6a1a');
  for(let i=0;i<4;i++){ px(ctx,cx-10+i*7,44,'#5a8a3a'); px(ctx,cx-8+i*7,48,'#5a8a3a'); }
  circle(ctx,cx+22,40,10,'#6a9a4a'); outlineCircle(ctx,cx+22,40,10,'#3a6a1a');
  rect(ctx,cx+28,38,8,6,'#5a8a3a'); outlineRect(ctx,cx+28,38,8,6,'#3a6a1a');
  px(ctx,cx+30,44,'#f0f0e0'); px(ctx,cx+33,44,'#f0f0e0'); px(ctx,cx+36,44,'#f0f0e0');
  circle(ctx,cx+24,37,2,'#ff4444'); px(ctx,cx+24,37,'#1a1a1a');
  rect(ctx,cx-8,64,5,8,'#4a7a2a'); rect(ctx,cx+8,64,5,8,'#4a7a2a');
  outlineRect(ctx,cx-8,64,5,8,'#3a6a1a'); outlineRect(ctx,cx+8,64,5,8,'#3a6a1a');
  rect(ctx,cx-22,46,10,6,'#5a8a3a'); rect(ctx,cx-28,47,7,4,'#4a7a2a'); rect(ctx,cx-33,48,6,3,'#3a6a1a');
  for(let i=0;i<4;i++){ const sx=cx-10+i*7; ctx.fillStyle='#3a6a1a'; ctx.beginPath(); ctx.moveTo(sx,42); ctx.lineTo(sx+2,38); ctx.lineTo(sx+4,42); ctx.fill(); }
  head(ctx,cx-4,28,7,ap.skin,ap.skinDark,'#4a3422');
  torso(ctx,cx-4,37,12,8,'#7a5e3e','#5a4228','#8a6e4e');
  sash(ctx,cx-4,37,8,TEAM_BLUE.accent);
  rect(ctx,cx+8,24,2,24,'#6a4a2a'); rect(ctx,cx+7,22,4,3,'#c2c6ce');
}

function drawSiege0(ctx){
  const cx=48,ap=AP[0];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-18,48,36,14,grad(ctx,cx-18,48,36,14,'#7a5a2a','#5a3a1a'));
  outlineRect(ctx,cx-18,48,36,14,'#3a2a14');
  for(let i=0;i<4;i++) line(ctx,cx-16+i*9,50,cx-16+i*9,60,'#5a3a1a',0.5);
  circle(ctx,cx-12,64,6,'#5a3a1a'); circle(ctx,cx+12,64,6,'#5a3a1a');
  outlineCircle(ctx,cx-12,64,6,'#3a2a14'); outlineCircle(ctx,cx+12,64,6,'#3a2a14');
  circle(ctx,cx-12,64,2,'#3a2a14'); circle(ctx,cx+12,64,2,'#3a2a14');
  for(let a=0;a<4;a++){ const angle=a*Math.PI/2; line(ctx,cx-12,64,cx-12+Math.cos(angle)*5,64+Math.sin(angle)*5,'#3a2a14',1); line(ctx,cx+12,64,cx+12+Math.cos(angle)*5,64+Math.sin(angle)*5,'#3a2a14',1); }
  line(ctx,cx-4,48,cx+14,22,'#5a3a1a',4);
  line(ctx,cx+14,22,cx+14,32,'#8a7a5a',1);
  rect(ctx,cx+8,16,12,8,'#4a3a1a'); outlineRect(ctx,cx+8,16,12,8,'#2a1a0e');
  circle(ctx,cx+14,14,5,'#8a8a8a'); outlineCircle(ctx,cx+14,14,5,'#5a5a5a');
  rect(ctx,cx-10,24,10,8,'#8a8a92'); outlineRect(ctx,cx-10,24,10,8,'#5a5a62');
  rect(ctx,cx-18,50,36,2,'#5a3a1a'); rect(ctx,cx-18,58,36,2,'#5a3a1a');
  head(ctx,cx-14,34,6,ap.skin,ap.skinDark,'#4a3422');
  torso(ctx,cx-14,42,12,10,'#7a5e3e','#5a4228','#8a6e4e');
  sash(ctx,cx-14,42,10,TEAM_BLUE.accent);
}

function drawArmored0(ctx){
  const cx=48,ap=AP[0];
  shadow(ctx,cx,88,28);
  circle(ctx,cx,40,18,rgrad(ctx,cx,40,18,'#aaaab2','#7a7a82'));
  outlineCircle(ctx,cx,40,18,'#6a6a72');
  circle(ctx,cx+18,34,13,'#9a9aa2'); outlineCircle(ctx,cx+18,34,13,'#6a6a72');
  line(ctx,cx+10,32,cx+14,36,'#7a7a82',0.5); line(ctx,cx+12,30,cx+16,34,'#7a7a82',0.5);
  ctx.fillStyle='#8a8a92'; ctx.beginPath(); ctx.ellipse(cx+12,28,7,10,0,0,Math.PI*2); ctx.fill();
  outlineCircle(ctx,cx+12,28,7,'#6a6a72');
  circle(ctx,cx+22,30,3,'#fff'); circle(ctx,cx+23,30,1.5,'#1a1a1a');
  rect(ctx,cx+30,34,8,4,'#9a9aa2'); rect(ctx,cx+36,36,5,6,'#9a9aa2'); rect(ctx,cx+38,40,4,4,'#9a9aa2');
  outlineRect(ctx,cx+30,34,8,4,'#7a7a82');
  ctx.strokeStyle='#f0e8d0'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx+26,38); ctx.quadraticCurveTo(cx+34,44,cx+32,50); ctx.stroke();
  rect(ctx,cx-10,56,7,12,'#8a8a92'); rect(ctx,cx+0,56,7,12,'#8a8a92'); rect(ctx,cx+10,56,7,12,'#8a8a92');
  outlineRect(ctx,cx-10,56,7,12,'#6a6a72'); outlineRect(ctx,cx+0,56,7,12,'#6a6a72'); outlineRect(ctx,cx+10,56,7,12,'#6a6a72');
  rect(ctx,cx-11,66,9,3,'#7a7a82'); rect(ctx,cx-1,66,9,3,'#7a7a82'); rect(ctx,cx+9,66,9,3,'#7a7a82');
  rect(ctx,cx-8,18,16,12,TEAM_BLUE.accent); outlineRect(ctx,cx-8,18,16,12,TEAM_BLUE.dark);
  rect(ctx,cx-6,20,12,2,TEAM_BLUE.dark);
  head(ctx,cx,12,6,ap.skin,ap.skinDark,'#4a3422');
  torso(ctx,cx,20,10,6,'#7a5e3e','#5a4228','#8a6e4e');
  rect(ctx,cx-14,34,4,10,'#8a6a3a'); outlineRect(ctx,cx-14,34,4,10,'#5a4a2a');
}

function drawElite0(ctx){
  const cx=48,ap=AP[0];
  shadow(ctx,cx,88,26);
  head(ctx,cx,20,12,ap.skin,ap.skinDark,'#4a3422');
  rect(ctx,cx-5,17,3,2,'#c23a3a'); rect(ctx,cx+3,19,3,2,'#c23a3a');
  for(let i=0;i<4;i++) rect(ctx,cx-6+i*4,30,2,3,'#f0e8d0');
  torso(ctx,cx,34,28,20,'#6a4e2e','#4a3218','#7a5e3e');
  sash(ctx,cx,34,20,TEAM_BLUE.accent); belt(ctx,cx,53,28,'#4a3218');
  for(let i=0;i<5;i++) rect(ctx,cx-12+i*6,54,2,2,'#f0e8d0');
  rect(ctx,cx-18,36,7,16,ap.skin); rect(ctx,cx+11,36,7,16,ap.skin);
  outlineRect(ctx,cx-18,36,7,16,ap.skinDark); outlineRect(ctx,cx+11,36,7,16,ap.skinDark);
  rect(ctx,cx-19,48,9,3,'#5e4422'); rect(ctx,cx+10,48,9,3,'#5e4422');
  rect(ctx,cx-7,56,5,14,ap.skinDark); rect(ctx,cx+2,56,5,14,ap.skinDark);
  rect(ctx,cx-8,68,7,3,'#3a2a14'); rect(ctx,cx+1,68,7,3,'#3a2a14');
  rect(ctx,cx+18,30,4,22,'#6a4a2a'); circle(ctx,cx+20,28,7,'#8a6233'); outlineCircle(ctx,cx+20,28,7,'#4a3216');
  rect(ctx,cx-22,30,4,22,'#6a4a2a'); circle(ctx,cx-20,28,7,'#8a6233'); outlineCircle(ctx,cx-20,28,7,'#4a3216');
  rect(ctx,cx+17,26,2,3,'#f0e8d0'); rect(ctx,cx+23,27,2,3,'#f0e8d0');
  rect(ctx,cx-23,26,2,3,'#f0e8d0'); rect(ctx,cx-17,27,2,3,'#f0e8d0');
}

function drawHero0(ctx){
  const cx=48,ap=AP[0];
  shadow(ctx,cx,88,28);
  head(ctx,cx,18,13,ap.skin,ap.skinDark,'#4a3422');
  rect(ctx,cx-10,4,20,4,'#f0e8d0'); outlineRect(ctx,cx-10,4,20,4,'#c8c0a0');
  ctx.fillStyle='#f0e8d0';
  ctx.beginPath(); ctx.moveTo(cx-8,4); ctx.lineTo(cx-7,0); ctx.lineTo(cx-4,4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx-2,4); ctx.lineTo(cx,-2); ctx.lineTo(cx+2,4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx+4,4); ctx.lineTo(cx+7,0); ctx.lineTo(cx+8,4); ctx.fill();
  rect(ctx,cx-6,15,4,3,'#c23a3a'); rect(ctx,cx+3,17,4,3,'#c23a3a'); rect(ctx,cx-1,20,3,3,'#c23a3a');
  for(let i=0;i<5;i++) rect(ctx,cx-8+i*4,28,2,4,'#f0e8d0');
  torso(ctx,cx,32,30,22,'#6a4e2e','#4a3218','#7a5e3e');
  sash(ctx,cx,32,22,TEAM_BLUE.accent); belt(ctx,cx,53,30,'#4a3218');
  for(let i=0;i<6;i++) rect(ctx,cx-14+i*6,54,2,3,'#f0e8d0');
  cape(ctx,cx,34,20,10,'#7a5e3e','#5a4228');
  rect(ctx,cx-20,34,8,18,ap.skin); rect(ctx,cx+12,34,8,18,ap.skin);
  outlineRect(ctx,cx-20,34,8,18,ap.skinDark); outlineRect(ctx,cx+12,34,8,18,ap.skinDark);
  rect(ctx,cx-21,48,10,4,'#5e4422'); rect(ctx,cx+11,48,10,4,'#5e4422');
  rect(ctx,cx-7,56,5,14,ap.skinDark); rect(ctx,cx+2,56,5,14,ap.skinDark);
  rect(ctx,cx-8,68,7,3,'#3a2a14'); rect(ctx,cx+1,68,7,3,'#3a2a14');
  rect(ctx,cx+20,28,5,28,'#6a4a2a'); outlineRect(ctx,cx+20,28,5,28,'#3a2a14');
  circle(ctx,cx+22,26,8,'#8a6233'); outlineCircle(ctx,cx+22,26,8,'#4a3216');
  rect(ctx,cx+17,22,3,4,'#f0e8d0'); rect(ctx,cx+25,24,3,4,'#f0e8d0'); rect(ctx,cx+20,20,3,4,'#f0e8d0');
  circle(ctx,cx-3,16,2,'#ff6644'); circle(ctx,cx+5,16,2,'#ff6644');
}

// ════════════════════════════════════════════════════════════
// AGE 1 — CASTLE AGE
// ════════════════════════════════════════════════════════════

function drawMelee1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,88,24);
  rect(ctx,cx-10,8,20,18,grad(ctx,cx-10,8,20,18,'#d0d4dc','#9a9aa2'));
  outlineRect(ctx,cx-10,8,20,18,'#7a7e86');
  rect(ctx,cx-7,20,14,3,'#1a1a1a');
  rect(ctx,cx-2,2,4,8,gradH(ctx,cx-2,2,4,8,TEAM_BLUE.accent,TEAM_BLUE.dark));
  px(ctx,cx-1,1,TEAM_BLUE.light); px(ctx,cx,1,TEAM_BLUE.light); px(ctx,cx+1,1,TEAM_BLUE.light);
  head(ctx,cx,24,10,ap.skin,ap.skinDark,null);
  torso(ctx,cx,36,24,20,'#9aa2b0','#4e5560','#b0b8c4');
  sash(ctx,cx,36,20,TEAM_BLUE.accent); belt(ctx,cx,55,24,'#4e5560');
  for(let r=0;r<5;r++) for(let c=0;c<4;c++) px(ctx,cx-8+c*5,38+r*3,'#8a8e96');
  rect(ctx,cx-16,38,6,14,'#9aa2b0'); rect(ctx,cx+10,38,6,14,'#9aa2b0');
  outlineRect(ctx,cx-16,38,6,14,'#7a7e86'); outlineRect(ctx,cx+10,38,6,14,'#7a7e86');
  rect(ctx,cx-17,50,8,4,'#c2c6ce'); rect(ctx,cx+9,50,8,4,'#c2c6ce');
  legs(ctx,cx,57,12,'#4e5560','#3a4048');
  rect(ctx,cx+16,32,3,26,'#c2c6ce'); outlineRect(ctx,cx+16,32,3,26,'#7a7e86');
  rect(ctx,cx+13,32,9,3,'#b5894e'); line(ctx,cx+17,34,cx+17,56,'#e0e4ec',0.5);
  circle(ctx,cx-18,46,10,rgrad(ctx,cx-18,46,10,TEAM_BLUE.accent,TEAM_BLUE.dark));
  outlineCircle(ctx,cx-18,46,10,TEAM_BLUE.dark);
  circle(ctx,cx-18,46,4,'#c2c6ce'); outlineCircle(ctx,cx-18,46,4,'#7a7e86');
  line(ctx,cx-18,38,cx-18,54,'#c2c6ce',1); line(ctx,cx-26,46,cx-10,46,'#c2c6ce',1);
}

function drawRanged1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,88,24);
  head(ctx,cx,24,10,ap.skin,ap.skinDark,'#3a2a1a');
  ctx.fillStyle=ap.clothDark; ctx.beginPath(); ctx.arc(cx,20,12,Math.PI*1.1,Math.PI*1.9); ctx.fill();
  rect(ctx,cx-12,20,24,6,ap.clothDark);
  torso(ctx,cx,36,22,20,'#5a4a2a','#3a2a14','#6a5a3a');
  sash(ctx,cx,36,20,TEAM_BLUE.accent); belt(ctx,cx,55,22,'#3a2a14');
  arms(ctx,cx,36,14,ap.skin,ap.skinDark); legs(ctx,cx,57,12,'#3a2a14','#2a1a0e');
  ctx.strokeStyle='#8a6233'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(cx-20,42,18,-Math.PI*0.55,Math.PI*0.55); ctx.stroke();
  line(ctx,cx-20,25,cx-20,59,'#d0d0d0',1);
  line(ctx,cx-20,42,cx+10,42,'#5a3a1a',2);
  ctx.fillStyle='#c2c6ce'; ctx.beginPath(); ctx.moveTo(cx+10,40); ctx.lineTo(cx+16,42); ctx.lineTo(cx+10,44); ctx.fill();
  rect(ctx,cx+8,30,6,22,'#5a3a1a'); outlineRect(ctx,cx+8,30,6,22,'#3a2a14');
  for(let i=0;i<3;i++){ rect(ctx,cx+9,28-i*4,2,6,'#c2c6ce'); px(ctx,cx+9,28-i*4,'#8a8a8a'); }
}

function drawFast1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-14,38,32,18,grad(ctx,cx-14,38,32,18,'#a07a4a','#7a5a2a'));
  outlineRect(ctx,cx-14,38,32,18,'#5a3a1a');
  rect(ctx,cx+18,30,12,16,grad(ctx,cx+18,30,12,16,'#a07a4a','#7a5a2a'));
  outlineRect(ctx,cx+18,30,12,16,'#5a3a1a');
  circle(ctx,cx+25,33,2,'#fff'); px(ctx,cx+26,33,'#1a1a1a'); px(ctx,cx+28,40,'#5a3a1a');
  for(let i=0;i<5;i++) rect(ctx,cx+16+i,28+i*2,3,4,'#3a2a14');
  rect(ctx,cx-10,56,4,10,'#7a5a2a'); rect(ctx,cx+2,56,4,10,'#7a5a2a'); rect(ctx,cx+10,56,4,10,'#7a5a2a');
  outlineRect(ctx,cx-10,56,4,10,'#5a3a1a'); outlineRect(ctx,cx+2,56,4,10,'#5a3a1a'); outlineRect(ctx,cx+10,56,4,10,'#5a3a1a');
  rect(ctx,cx-11,64,6,3,'#2a1a0e'); rect(ctx,cx+1,64,6,3,'#2a1a0e'); rect(ctx,cx+9,64,6,3,'#2a1a0e');
  rect(ctx,cx-18,40,5,4,'#3a2a14'); rect(ctx,cx-22,42,5,3,'#3a2a14');
  rect(ctx,cx-6,36,12,4,'#5a4a2a'); rect(ctx,cx-4,34,8,3,'#6a5a3a');
  head(ctx,cx,22,8,ap.skin,ap.skinDark,'#3a2a1a');
  torso(ctx,cx,32,14,10,'#9aa2b0','#4e5560','#b0b8c4');
  sash(ctx,cx,32,10,TEAM_BLUE.accent);
  rect(ctx,cx+14,16,3,30,'#c2c6ce'); outlineRect(ctx,cx+14,16,3,30,'#7a7e86');
  ctx.fillStyle='#e0e4ec'; ctx.beginPath(); ctx.moveTo(cx+15.5,12); ctx.lineTo(cx+13,18); ctx.lineTo(cx+18,18); ctx.fill();
  rect(ctx,cx+18,14,6,4,TEAM_BLUE.accent);
}

function drawSiege1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-16,44,32,10,grad(ctx,cx-16,44,32,10,'#7a5a2a','#5a3a1a'));
  outlineRect(ctx,cx-16,44,32,10,'#3a2a14');
  line(ctx,cx-14,54,cx-8,72,'#5a3a1a',4); line(ctx,cx+14,54,cx+8,72,'#5a3a1a',4);
  line(ctx,cx-6,54,cx-2,72,'#5a3a1a',3); line(ctx,cx+6,54,cx+2,72,'#5a3a1a',3);
  line(ctx,cx-10,62,cx+10,62,'#5a3a1a',2);
  line(ctx,cx-2,44,cx+16,18,'#5a3a1a',4);
  rect(ctx,cx+12,10,10,8,'#4a3a1a'); outlineRect(ctx,cx+12,10,10,8,'#2a1a0e');
  circle(ctx,cx+17,10,5,'#8a8a8a'); outlineCircle(ctx,cx+17,10,5,'#5a5a5a');
  rect(ctx,cx-10,20,10,10,'#8a8a92'); outlineRect(ctx,cx-10,20,10,10,'#5a5a62');
  ctx.strokeStyle='#8a7a5a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx+12,14); ctx.lineTo(cx-2,44); ctx.stroke();
  head(ctx,cx+4,28,6,ap.skin,ap.skinDark,'#3a2a1a');
  torso(ctx,cx+4,36,10,10,'#3a5e9a','#26406e','#5a7eba');
  sash(ctx,cx+4,36,10,TEAM_BLUE.accent);
}

function drawArmored1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,88,26);
  rect(ctx,cx-14,18,28,44,'#6a4a2a'); outlineRect(ctx,cx-14,18,28,44,'#3a2a14');
  for(let i=0;i<6;i++) line(ctx,cx-12,22+i*7,cx+12,22+i*7,'#5a3a1a',0.5);
  rect(ctx,cx-14,12,6,8,'#6a4a2a'); rect(ctx,cx-4,12,6,8,'#6a4a2a'); rect(ctx,cx+6,12,6,8,'#6a4a2a');
  outlineRect(ctx,cx-14,12,6,8,'#3a2a14'); outlineRect(ctx,cx-4,12,6,8,'#3a2a14'); outlineRect(ctx,cx+6,12,6,8,'#3a2a14');
  rect(ctx,cx-2,30,4,12,'#1a1a1a');
  rect(ctx,cx-14,28,28,3,'#5a3a1a'); rect(ctx,cx-14,50,28,3,'#5a3a1a');
  circle(ctx,cx-8,64,6,'#5a3a1a'); circle(ctx,cx+8,64,6,'#5a3a1a');
  outlineCircle(ctx,cx-8,64,6,'#3a2a14'); outlineCircle(ctx,cx+8,64,6,'#3a2a14');
  for(let a=0;a<4;a++){ const angle=a*Math.PI/2; line(ctx,cx-8,64,cx-8+Math.cos(angle)*5,64+Math.sin(angle)*5,'#3a2a14',1); line(ctx,cx+8,64,cx+8+Math.cos(angle)*5,64+Math.sin(angle)*5,'#3a2a14',1); }
  rect(ctx,cx,4,2,10,'#5a3a1a'); rect(ctx,cx+2,4,10,6,TEAM_BLUE.accent); outlineRect(ctx,cx+2,4,10,6,TEAM_BLUE.dark);
  head(ctx,cx,8,4,ap.skin,ap.skinDark,'#3a2a1a');
}

function drawElite1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,88,26);
  rect(ctx,cx-12,6,24,20,grad(ctx,cx-12,6,24,20,'#d0d4dc','#9a9aa2'));
  outlineRect(ctx,cx-12,6,24,20,'#7a7e86');
  rect(ctx,cx-9,18,18,4,'#1a1a1a');
  rect(ctx,cx-2,0,4,8,TEAM_BLUE.accent); rect(ctx,cx-4,-1,8,3,TEAM_BLUE.accent);
  head(ctx,cx,26,10,ap.skin,ap.skinDark,null);
  rect(ctx,cx-14,36,28,22,grad(ctx,cx-14,36,28,22,'#d0d4dc','#9a9aa2'));
  outlineRect(ctx,cx-14,36,28,22,'#7a7e86');
  line(ctx,cx,36,cx,58,'#7a7e86',1); line(ctx,cx-14,46,cx+14,46,'#7a7e86',1);
  sash(ctx,cx,36,22,TEAM_BLUE.accent); belt(ctx,cx,57,28,'#7a7e86');
  rect(ctx,cx-20,34,8,8,'#c2c6ce'); rect(ctx,cx+12,34,8,8,'#c2c6ce');
  outlineRect(ctx,cx-20,34,8,8,'#7a7e86'); outlineRect(ctx,cx+12,34,8,8,'#7a7e86');
  rect(ctx,cx-18,42,6,12,'#b0b8c4'); rect(ctx,cx+12,42,6,12,'#b0b8c4');
  outlineRect(ctx,cx-18,42,6,12,'#7a7e86'); outlineRect(ctx,cx+12,42,6,12,'#7a7e86');
  legs(ctx,cx,60,10,'#4e5560','#3a4048');
  rect(ctx,cx+18,24,4,34,'#c2c6ce'); outlineRect(ctx,cx+18,24,4,34,'#7a7e86');
  rect(ctx,cx+15,24,10,3,'#b5894e'); line(ctx,cx+19.5,26,cx+19.5,56,'#e8ecf0',0.5);
  circle(ctx,cx-22,48,12,rgrad(ctx,cx-22,48,12,TEAM_BLUE.accent,TEAM_BLUE.dark));
  outlineCircle(ctx,cx-22,48,12,TEAM_BLUE.dark); circle(ctx,cx-22,48,5,'#c2c6ce');
}

function drawHero1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-14,8,28,22,grad(ctx,cx-14,8,28,22,'#d0d4dc','#9a9aa2'));
  outlineRect(ctx,cx-14,8,28,22,'#7a7e86');
  rect(ctx,cx-10,24,20,4,'#1a1a1a');
  rect(ctx,cx-10,0,20,10,gradH(ctx,cx-10,0,20,10,'#f0d060','#b08820'));
  outlineRect(ctx,cx-10,0,20,10,'#8a6a10');
  ctx.fillStyle='#e2c14e';
  ctx.beginPath(); ctx.moveTo(cx-8,0); ctx.lineTo(cx-7,-6); ctx.lineTo(cx-4,0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx-2,0); ctx.lineTo(cx,-8); ctx.lineTo(cx+2,0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx+4,0); ctx.lineTo(cx+7,-6); ctx.lineTo(cx+8,0); ctx.fill();
  circle(ctx,cx-6,2,1.5,'#c23a3a'); circle(ctx,cx,1,1.5,'#3ac27a'); circle(ctx,cx+6,2,1.5,'#3a78c2');
  head(ctx,cx,24,11,ap.skin,ap.skinDark,null);
  rect(ctx,cx-16,36,32,24,grad(ctx,cx-16,36,32,24,'#e0e4ec','#b0b8c4'));
  outlineRect(ctx,cx-16,36,32,24,'#7a7e86');
  rect(ctx,cx-3,38,6,8,'#e2c14e'); rect(ctx,cx-1,36,2,3,'#e2c14e');
  rect(ctx,cx-4,36,8,24,TEAM_BLUE.accent); outlineRect(ctx,cx-4,36,8,24,TEAM_BLUE.dark);
  belt(ctx,cx,59,32,'#7a7e86');
  cape(ctx,cx,38,24,12,TEAM_BLUE.accent,TEAM_BLUE.dark);
  rect(ctx,cx-22,38,8,16,'#c2c6ce'); rect(ctx,cx+14,38,8,16,'#c2c6ce');
  outlineRect(ctx,cx-22,38,8,16,'#7a7e86'); outlineRect(ctx,cx+14,38,8,16,'#7a7e86');
  legs(ctx,cx,62,10,'#4e5560','#3a4048');
  rect(ctx,cx+20,20,4,38,'#c2c6ce'); outlineRect(ctx,cx+20,20,4,38,'#7a7e86');
  rect(ctx,cx+17,20,10,3,gradH(ctx,cx+17,20,10,3,'#e2c14e','#b08820'));
  line(ctx,cx+21.5,24,cx+21.5,56,'#f0f4f8',0.5);
  circle(ctx,cx-24,50,14,rgrad(ctx,cx-24,50,14,TEAM_BLUE.accent,TEAM_BLUE.dark));
  outlineCircle(ctx,cx-24,50,14,TEAM_BLUE.dark);
  circle(ctx,cx-24,50,6,'#e2c14e'); outlineCircle(ctx,cx-24,50,6,'#b08820');
}

// ════════════════════════════════════════════════════════════
// AGE 2 — RENAISSANCE
// ════════════════════════════════════════════════════════════

function drawMelee2(ctx){
  const cx=48,ap=AP[2];
  shadow(ctx,cx,88,24);
  rect(ctx,cx-14,8,28,6,gradH(ctx,cx-14,8,28,6,'#3a2a18','#1a0e08'));
  outlineRect(ctx,cx-14,8,28,6,'#1a0e08');
  rect(ctx,cx-6,4,12,6,'#2a1a10');
  ctx.fillStyle=TEAM_BLUE.accent; ctx.beginPath(); ctx.moveTo(cx+6,4); ctx.quadraticCurveTo(cx+14,-4,cx+12,-8); ctx.quadraticCurveTo(cx+10,-4,cx+6,2); ctx.fill();
  head(ctx,cx,22,10,ap.skin,ap.skinDark,'#2a1a10');
  rect(ctx,cx-8,30,16,3,'#e8e4e0');
  for(let i=0;i<5;i++) px(ctx,cx-6+i*3,31,'#d0ccc8');
  torso(ctx,cx,34,24,20,'#3a5e9a','#26406e','#5a7eba');
  for(let i=0;i<4;i++) circle(ctx,cx,36+i*5,1,'#caa24e');
  sash(ctx,cx,34,20,TEAM_BLUE.accent); belt(ctx,cx,53,24,'#26406e');
  arms(ctx,cx,34,14,ap.skin,ap.skinDark); legs(ctx,cx,56,12,'#26406e','#1a3050');
  rect(ctx,cx+16,30,3,24,'#caa24e'); outlineRect(ctx,cx+16,30,3,24,'#8a6e2e');
  ctx.strokeStyle='#caa24e'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(cx+17,30,4,0,Math.PI*2); ctx.stroke();
  rect(ctx,cx+17,16,1.5,15,'#e0e4ec'); line(ctx,cx+17.5,18,cx+17.5,30,'#fff',0.5);
  cape(ctx,cx,36,20,8,'#3a5e9a','#26406e');
}

function drawRanged2(ctx){
  const cx=48,ap=AP[2];
  shadow(ctx,cx,88,24);
  rect(ctx,cx-12,8,24,6,'#2a1a10'); rect(ctx,cx-5,4,10,6,'#2a1a10');
  ctx.fillStyle='#c23a3a'; ctx.beginPath(); ctx.moveTo(cx+5,4); ctx.quadraticCurveTo(cx+12,-2,cx+10,-6); ctx.fill();
  head(ctx,cx,22,10,ap.skin,ap.skinDark,'#2a1a10');
  torso(ctx,cx,34,24,20,'#3a5e9a','#26406e','#5a7eba');
  sash(ctx,cx,34,20,TEAM_BLUE.accent); belt(ctx,cx,53,24,'#26406e');
  arms(ctx,cx,34,14,ap.skin,ap.skinDark); legs(ctx,cx,56,12,'#26406e','#1a3050');
  rect(ctx,cx+14,28,4,28,'#5a4a2a'); outlineRect(ctx,cx+14,28,4,28,'#3a2a14');
  rect(ctx,cx+13,52,6,6,'#6a5a3a');
  rect(ctx,cx+15,18,2,12,'#4a4a3a'); rect(ctx,cx+15,16,2,3,'#6a6a5a');
  rect(ctx,cx+18,36,3,4,'#8a8a8a'); px(ctx,cx+19,35,'#aaa');
  line(ctx,cx-8,36,cx+6,52,'#5a4a2a',2.5);
  for(let i=0;i<4;i++){ const bx=cx-6+i*3,by=38+i*4; rect(ctx,bx,by,3,5,'#e2c14e'); outlineRect(ctx,bx,by,3,5,'#8a6e2e'); }
}

function drawFast2(ctx){
  const cx=48,ap=AP[2];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-14,38,32,18,grad(ctx,cx-14,38,32,18,'#a07a4a','#7a5a2a'));
  outlineRect(ctx,cx-14,38,32,18,'#5a3a1a');
  rect(ctx,cx+18,30,12,16,'#a07a4a'); outlineRect(ctx,cx+18,30,12,16,'#5a3a1a');
  circle(ctx,cx+25,33,2,'#fff'); px(ctx,cx+26,33,'#1a1a1a');
  for(let i=0;i<5;i++) rect(ctx,cx+16+i,28+i*2,3,4,'#3a2a14');
  rect(ctx,cx-10,56,4,10,'#7a5a2a'); rect(ctx,cx+2,56,4,10,'#7a5a2a'); rect(ctx,cx+10,56,4,10,'#7a5a2a');
  rect(ctx,cx-11,64,6,3,'#2a1a0e'); rect(ctx,cx+1,64,6,3,'#2a1a0e'); rect(ctx,cx+9,64,6,3,'#2a1a0e');
  rect(ctx,cx-18,40,5,4,'#3a2a14');
  rect(ctx,cx-10,40,20,8,grad(ctx,cx-10,40,20,8,'#b0b8c4','#7a7e86'));
  outlineRect(ctx,cx-10,40,20,8,'#5a5a62');
  rect(ctx,cx-6,36,12,4,'#5a4a2a');
  head(ctx,cx,22,8,ap.skin,ap.skinDark,'#2a1a10');
  torso(ctx,cx,32,14,10,'#3a5e9a','#26406e','#5a7eba');
  sash(ctx,cx,32,10,TEAM_BLUE.accent);
  rect(ctx,cx+14,14,3,32,'#caa24e'); outlineRect(ctx,cx+14,14,3,32,'#8a6e2e');
  ctx.fillStyle='#e0e4ec'; ctx.beginPath(); ctx.moveTo(cx+15.5,10); ctx.lineTo(cx+13,16); ctx.lineTo(cx+18,16); ctx.fill();
  rect(ctx,cx+18,12,8,5,TEAM_BLUE.accent);
}

function drawSiege2(ctx){
  const cx=48,ap=AP[2];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-2,36,32,12,grad(ctx,cx-2,36,32,12,'#5a5a4a','#3a3a2a'));
  outlineRect(ctx,cx-2,36,32,12,'#2a2a1a');
  rect(ctx,cx+28,37,5,10,'#3a3a2a'); outlineRect(ctx,cx+28,37,5,10,'#1a1a0a');
  rect(ctx,cx,35,4,14,'#5a5a4a'); rect(ctx,cx+16,35,4,14,'#5a5a4a');
  rect(ctx,cx-10,46,28,10,grad(ctx,cx-10,46,28,10,'#7a5a2a','#5a3a1a'));
  outlineRect(ctx,cx-10,46,28,10,'#3a2a14');
  circle(ctx,cx-4,58,7,'#5a3a1a'); circle(ctx,cx+14,58,7,'#5a3a1a');
  outlineCircle(ctx,cx-4,58,7,'#3a2a14'); outlineCircle(ctx,cx+14,58,7,'#3a2a14');
  circle(ctx,cx-4,58,2.5,'#3a2a14'); circle(ctx,cx+14,58,2.5,'#3a2a14');
  for(let a=0;a<6;a++){ const angle=a*Math.PI/3; line(ctx,cx-4,58,cx-4+Math.cos(angle)*6,58+Math.sin(angle)*6,'#3a2a14',1); line(ctx,cx+14,58,cx+14+Math.cos(angle)*6,58+Math.sin(angle)*6,'#3a2a14',1); }
  circle(ctx,cx+30,33,3,rgrad(ctx,cx+30,33,3,'#4a4a4a','#1a1a1a'));
  ctx.strokeStyle='#8a6233'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx+4,36); ctx.quadraticCurveTo(cx,30,cx-4,28); ctx.stroke();
  circle(ctx,cx-4,27,2,'#ff8844'); circle(ctx,cx-4,27,1,'#ffcc44');
  head(ctx,cx-12,28,6,ap.skin,ap.skinDark,'#2a1a10');
  torso(ctx,cx-12,36,10,10,'#3a5e9a','#26406e','#5a7eba');
  sash(ctx,cx-12,36,10,TEAM_BLUE.accent);
}

function drawArmored2(ctx){
  const cx=48,ap=AP[2];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-18,26,36,26,'#6a4a2a'); outlineRect(ctx,cx-18,26,36,26,'#3a2a14');
  rect(ctx,cx-18,30,36,3,'#5a5a4a'); rect(ctx,cx-18,42,36,3,'#5a5a4a');
  for(let i=0;i<4;i++) line(ctx,cx-16,28+i*6,cx+16,28+i*6,'#5a3a1a',0.5);
  rect(ctx,cx-18,20,6,8,'#6a4a2a'); rect(ctx,cx-8,20,6,8,'#6a4a2a'); rect(ctx,cx+2,20,6,8,'#6a4a2a'); rect(ctx,cx+12,20,6,8,'#6a4a2a');
  rect(ctx,cx-1,34,2,8,'#1a1a1a');
  circle(ctx,cx-12,54,6,'#5a3a1a'); circle(ctx,cx+12,54,6,'#5a3a1a');
  outlineCircle(ctx,cx-12,54,6,'#3a2a14'); outlineCircle(ctx,cx+12,54,6,'#3a2a14');
  for(let a=0;a<4;a++){ const angle=a*Math.PI/2; line(ctx,cx-12,54,cx-12+Math.cos(angle)*5,54+Math.sin(angle)*5,'#3a2a14',1); line(ctx,cx+12,54,cx+12+Math.cos(angle)*5,54+Math.sin(angle)*5,'#3a2a14',1); }
  rect(ctx,cx,10,2,12,'#3a2a14'); rect(ctx,cx+2,10,10,6,TEAM_BLUE.accent); outlineRect(ctx,cx+2,10,10,6,TEAM_BLUE.dark);
  head(ctx,cx-4,16,4,ap.skin,ap.skinDark,'#2a1a10'); head(ctx,cx+8,18,3,ap.skin,ap.skinDark,'#2a1a10');
}

function drawElite2(ctx){
  const cx=48,ap=AP[2];
  shadow(ctx,cx,88,26);
  rect(ctx,cx-10,8,20,5,'#2a1a10'); rect(ctx,cx-4,4,8,6,'#2a1a10');
  ctx.fillStyle=TEAM_BLUE.accent; ctx.beginPath(); ctx.moveTo(cx+2,4); ctx.quadraticCurveTo(cx+12,-8,cx+8,-14); ctx.quadraticCurveTo(cx+4,-6,cx+2,2); ctx.fill();
  head(ctx,cx,22,10,ap.skin,ap.skinDark,'#2a1a10');
  rect(ctx,cx-14,34,28,22,grad(ctx,cx-14,34,28,22,'#5a7eba','#26406e'));
  outlineRect(ctx,cx-14,34,28,22,'#1a3050');
  for(let i=0;i<3;i++) line(ctx,cx-10+i*10,36,cx-10+i*10,54,'#caa24e',0.5);
  sash(ctx,cx,34,22,TEAM_BLUE.accent); belt(ctx,cx,55,28,'#1a3050');
  rect(ctx,cx-8,32,16,3,'#e8e4e0');
  arms(ctx,cx,34,14,ap.skin,ap.skinDark); legs(ctx,cx,58,12,'#26406e','#1a3050');
  rect(ctx,cx+18,28,2,28,'#caa24e'); rect(ctx,cx-20,28,2,28,'#caa24e');
  rect(ctx,cx+18,16,1,13,'#e0e4ec'); rect(ctx,cx-20,16,1,13,'#e0e4ec');
  ctx.strokeStyle='#caa24e'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(cx+19,28,3,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx-19,28,3,0,Math.PI*2); ctx.stroke();
  cape(ctx,cx,36,20,10,'#3a5e9a','#26406e');
}

function drawHero2(ctx){
  const cx=48,ap=AP[2];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-12,8,24,6,'#2a1a10'); rect(ctx,cx-5,4,10,6,'#2a1a10');
  ctx.fillStyle=TEAM_BLUE.accent; ctx.beginPath(); ctx.moveTo(cx+4,4); ctx.quadraticCurveTo(cx+16,-6,cx+14,-16); ctx.quadraticCurveTo(cx+8,-8,cx+4,2); ctx.fill();
  ctx.fillStyle=TEAM_BLUE.light; ctx.beginPath(); ctx.moveTo(cx+6,4); ctx.quadraticCurveTo(cx+14,-4,cx+12,-12); ctx.fill();
  for(let i=0;i<4;i++) px(ctx,cx+8+i,-2-i*3,'#fff');
  head(ctx,cx,22,11,ap.skin,ap.skinDark,'#2a1a10');
  rect(ctx,cx-16,34,32,24,grad(ctx,cx-16,34,32,24,'#caa24e','#8a6e2e'));
  outlineRect(ctx,cx-16,34,32,24,'#6a5020');
  rect(ctx,cx-4,36,8,8,'#e2c14e'); outlineRect(ctx,cx-4,36,8,8,'#8a6e2e');
  rect(ctx,cx-8,32,16,3,'#e8e4e0');
  sash(ctx,cx,34,24,TEAM_BLUE.accent); belt(ctx,cx,57,32,'#6a5020');
  cape(ctx,cx,36,24,14,TEAM_BLUE.accent,TEAM_BLUE.dark);
  rect(ctx,cx-22,36,8,16,'#caa24e'); rect(ctx,cx+14,36,8,16,'#caa24e');
  outlineRect(ctx,cx-22,36,8,16,'#8a6e2e'); outlineRect(ctx,cx+14,36,8,16,'#8a6e2e');
  legs(ctx,cx,60,12,'#26406e','#1a3050');
  rect(ctx,cx+20,22,3,36,'#caa24e'); outlineRect(ctx,cx+20,22,3,36,'#8a6e2e');
  rect(ctx,cx+20,12,2,12,'#e0e4ec'); line(ctx,cx+21,14,cx+21,24,'#fff',0.5);
  circle(ctx,cx-24,48,14,rgrad(ctx,cx-24,48,14,'#caa24e','#8a6e2e'));
  outlineCircle(ctx,cx-24,48,14,'#6a5020');
  circle(ctx,cx-24,48,6,'#e2c14e');
  line(ctx,cx-24,36,cx-24,60,'#8a6e2e',1); line(ctx,cx-36,48,cx-12,48,'#8a6e2e',1);
}

// ════════════════════════════════════════════════════════════
// AGE 3 — MODERN
// ════════════════════════════════════════════════════════════

function drawMelee3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,88,24);
  rect(ctx,cx-10,10,20,14,grad(ctx,cx-10,10,20,14,'#6a6e5a','#3a3e2a'));
  outlineRect(ctx,cx-10,10,20,14,'#2a2e1a');
  rect(ctx,cx-11,22,22,3,'#4a4e3a');
  head(ctx,cx,24,9,ap.skin,ap.skinDark,'#2a2a1a');
  torso(ctx,cx,36,24,20,'#5e6e3e','#3e4a26','#7a8a52');
  rect(ctx,cx-10,40,5,4,'#4e5e2e'); rect(ctx,cx+5,40,5,4,'#4e5e2e');
  sash(ctx,cx,36,20,TEAM_BLUE.accent); belt(ctx,cx,55,24,'#3e4a26');
  arms(ctx,cx,36,14,ap.skin,ap.skinDark); legs(ctx,cx,57,12,'#3e4a26','#2e3a1a');
  rect(ctx,cx-8,67,7,3,'#2a1a0e'); rect(ctx,cx+1,67,7,3,'#2a1a0e');
  rect(ctx,cx+16,42,3,16,'#8a8a8a'); outlineRect(ctx,cx+16,42,3,16,'#5a5a5a');
  rect(ctx,cx+15,56,5,3,'#3a2a14');
  ctx.fillStyle='#c2c2c2'; ctx.beginPath(); ctx.moveTo(cx+17.5,40); ctx.lineTo(cx+15,44); ctx.lineTo(cx+20,44); ctx.fill();
  rect(ctx,cx-2,33,1,4,'#aaa'); circle(ctx,cx-1,37,1.5,'#ccc');
}

function drawRanged3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,88,24);
  rect(ctx,cx-10,10,20,14,grad(ctx,cx-10,10,20,14,'#5e6e3e','#3e4a26'));
  outlineRect(ctx,cx-10,10,20,14,'#2a2e1a');
  rect(ctx,cx-11,22,22,3,'#4a5e36');
  head(ctx,cx,24,9,ap.skin,ap.skinDark,'#2a2a1a');
  torso(ctx,cx,36,24,20,'#5e6e3e','#3e4a26','#7a8a52');
  rect(ctx,cx-12,50,5,5,'#4e5e2e'); rect(ctx,cx+7,50,5,5,'#4e5e2e');
  sash(ctx,cx,36,20,TEAM_BLUE.accent); belt(ctx,cx,55,24,'#3e4a26');
  arms(ctx,cx,36,14,ap.skin,ap.skinDark); legs(ctx,cx,57,12,'#3e4a26','#2e3a1a');
  rect(ctx,cx-8,67,7,3,'#2a1a0e'); rect(ctx,cx+1,67,7,3,'#2a1a0e');
  rect(ctx,cx+14,28,4,30,'#3a3a2a'); outlineRect(ctx,cx+14,28,4,30,'#2a2a1a');
  rect(ctx,cx+13,54,6,6,'#5a4a2a');
  rect(ctx,cx+15,18,2,12,'#4a4a3a'); rect(ctx,cx+15,16,2,3,'#6a6a5a');
  rect(ctx,cx+20,32,4,8,'#3a3a3a'); outlineRect(ctx,cx+20,32,4,8,'#2a2a2a');
  circle(ctx,cx+22,32,2,'#6a8aaa');
  rect(ctx,cx+10,40,5,8,'#3a3a2a');
  rect(ctx,cx+15.5,16,1,4,'#c2c2c2');
}

function drawFast3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-16,34,36,22,grad(ctx,cx-16,34,36,22,'#5e6e3e','#3e4a26'));
  outlineRect(ctx,cx-16,34,36,22,'#2a3a16');
  rect(ctx,cx+8,30,12,8,'#8ab4d8'); outlineRect(ctx,cx+8,30,12,8,'#2a3a16');
  line(ctx,cx+10,32,cx+12,36,'#a0d0f0',1);
  rect(ctx,cx+16,36,6,8,'#4e5e2e');
  circle(ctx,cx+22,40,2,'#ffffcc');
  rect(ctx,cx-16,44,36,2,'#2a3a16');
  circle(ctx,cx-10,58,7,'#2a2a2a'); circle(ctx,cx+14,58,7,'#2a2a2a');
  outlineCircle(ctx,cx-10,58,7,'#1a1a1a'); outlineCircle(ctx,cx+14,58,7,'#1a1a1a');
  circle(ctx,cx-10,58,3,'#5a5a5a'); circle(ctx,cx+14,58,3,'#5a5a5a');
  for(let i=0;i<6;i++){ const angle=i*Math.PI/3; px(ctx,cx-10+Math.cos(angle)*5,58+Math.sin(angle)*5,'#3a3a3a'); px(ctx,cx+14+Math.cos(angle)*5,58+Math.sin(angle)*5,'#3a3a3a'); }
  head(ctx,cx+2,24,7,ap.skin,ap.skinDark,'#2a2a1a');
  torso(ctx,cx+2,32,10,6,'#5e6e3e','#3e4a26','#7a8a52');
  rect(ctx,cx-14,30,6,4,'#4a4a3a'); rect(ctx,cx-20,28,8,3,'#4a4a3a');
  rect(ctx,cx-22,29,4,2,'#3a3a2a');
}

function drawSiege3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-4,30,32,10,grad(ctx,cx-4,30,32,10,'#5a5a4a','#3a3a2a'));
  outlineRect(ctx,cx-4,30,32,10,'#2a2a1a');
  rect(ctx,cx+26,29,6,12,'#4a4a3a'); outlineRect(ctx,cx+26,29,6,12,'#2a2a1a');
  rect(ctx,cx-2,28,6,4,'#5a5a4a');
  rect(ctx,cx-10,26,12,18,'#5e6e3e'); outlineRect(ctx,cx-10,26,12,18,'#3e4a26');
  rect(ctx,cx-7,32,6,2,'#1a1a1a');
  rect(ctx,cx-12,38,30,8,'#4a4a3a'); outlineRect(ctx,cx-12,38,30,8,'#2a2a1a');
  circle(ctx,cx-6,50,7,'#3a3a2a'); circle(ctx,cx+16,50,7,'#3a3a2a');
  outlineCircle(ctx,cx-6,50,7,'#2a2a1a'); outlineCircle(ctx,cx+16,50,7,'#2a2a1a');
  circle(ctx,cx-6,50,3,'#5a5a4a'); circle(ctx,cx+16,50,3,'#5a5a4a');
  rect(ctx,cx+28,24,3,6,'#8a6e2e'); rect(ctx,cx+28,22,3,3,'#caa24e');
  head(ctx,cx-14,22,6,ap.skin,ap.skinDark,'#2a2a1a');
  torso(ctx,cx-14,30,10,10,'#5e6e3e','#3e4a26','#7a8a52');
  sash(ctx,cx-14,30,10,TEAM_BLUE.accent);
  rect(ctx,cx-18,26,4,3,'#2a2a2a');
}

function drawArmored3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-18,36,40,20,grad(ctx,cx-18,36,40,20,'#5e6e3e','#3e4a26'));
  outlineRect(ctx,cx-18,36,40,20,'#2a3a16');
  rect(ctx,cx+18,32,6,24,'#4e5e2e'); outlineRect(ctx,cx+18,32,6,24,'#2a3a16');
  rect(ctx,cx-11,24,22,14,grad(ctx,cx-11,24,22,14,'#6a7e4e','#4a5e36'));
  outlineRect(ctx,cx-11,24,22,14,'#2a3a16');
  circle(ctx,cx,28,4,'#4a5e36'); outlineCircle(ctx,cx,28,4,'#2a3a16');
  rect(ctx,cx+10,28,22,5,'#4a4a3a'); outlineRect(ctx,cx+10,28,22,5,'#2a2a1a');
  rect(ctx,cx+30,27,4,7,'#3a3a2a');
  rect(ctx,cx-4,22,8,3,'#4a4a3a'); rect(ctx,cx-8,21,5,2,'#3a3a2a');
  rect(ctx,cx-20,54,44,4,'#4a5e36');
  for(let i=0;i<4;i++){ circle(ctx,cx-14+i*10,62,5,'#3a3a2a'); outlineCircle(ctx,cx-14+i*10,62,5,'#2a2a1a'); circle(ctx,cx-14+i*10,62,2,'#5a5a4a'); }
  rect(ctx,cx-20,58,44,8,'#2a2a2a');
  for(let i=0;i<8;i++) rect(ctx,cx-18+i*5,58,1,8,'#3a3a3a');
  circle(ctx,cx-6,42,3,TEAM_BLUE.accent);
  rect(ctx,cx-20,40,3,6,'#4a4a3a');
  head(ctx,cx+2,18,5,ap.skin,ap.skinDark,'#2a2a1a');
  rect(ctx,cx-1,23,6,4,'#5e6e3e');
}

function drawElite3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,88,26);
  rect(ctx,cx-12,10,24,16,grad(ctx,cx-12,10,24,16,'#6a6e5a','#3a3e2a'));
  outlineRect(ctx,cx-12,10,24,16,'#2a2e1a');
  rect(ctx,cx-8,20,16,4,'#1a1a1a');
  rect(ctx,cx-4,10,8,3,'#3a3a2a');
  circle(ctx,cx-2,10,2,'#2a4a2a'); circle(ctx,cx+4,10,2,'#2a4a2a');
  head(ctx,cx,26,10,ap.skin,ap.skinDark,'#2a2a1a');
  rect(ctx,cx-14,36,28,22,grad(ctx,cx-14,36,28,22,'#5e6e3e','#3e4a26'));
  outlineRect(ctx,cx-14,36,28,22,'#2a3a16');
  rect(ctx,cx-10,38,8,10,'#6a7e5e'); rect(ctx,cx+2,38,8,10,'#6a7e5e');
  rect(ctx,cx-12,52,4,6,'#4e5e2e'); rect(ctx,cx+8,52,4,6,'#4e5e2e');
  sash(ctx,cx,36,22,TEAM_BLUE.accent); belt(ctx,cx,57,28,'#2a3a16');
  rect(ctx,cx-18,38,6,14,'#4e5e2e'); rect(ctx,cx+12,38,6,14,'#4e5e2e');
  outlineRect(ctx,cx-18,38,6,14,'#2a3a16'); outlineRect(ctx,cx+12,38,6,14,'#2a3a16');
  legs(ctx,cx,60,10,'#3e4a26','#2e3a1a');
  rect(ctx,cx-8,68,7,3,'#2a1a0e'); rect(ctx,cx+1,68,7,3,'#2a1a0e');
  rect(ctx,cx+16,34,4,26,'#3a3a2a'); outlineRect(ctx,cx+16,34,4,26,'#2a2a1a');
  rect(ctx,cx+15,56,6,6,'#3a3a2a');
  rect(ctx,cx+17,26,2,10,'#4a4a3a');
  rect(ctx,cx+22,36,4,6,'#3a3a3a'); circle(ctx,cx+24,36,2,'#6a8aaa');
  rect(ctx,cx+14,44,2,6,'#2a2a1a');
  rect(ctx,cx+12,42,5,8,'#2a2a1a');
}

function drawHero3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-14,10,28,18,grad(ctx,cx-14,10,28,18,'#6a6e5a','#3a3e2a'));
  outlineRect(ctx,cx-14,10,28,18,'#2a2e1a');
  rect(ctx,cx-10,22,20,4,'#1a1a1a');
  rect(ctx,cx-6,10,12,4,'#3a3a2a');
  circle(ctx,cx-4,10,2.5,'#2a5a2a'); circle(ctx,cx+4,10,2.5,'#2a5a2a');
  circle(ctx,cx-4,10,1,'#44ff44'); circle(ctx,cx+4,10,1,'#44ff44');
  head(ctx,cx,28,11,ap.skin,ap.skinDark,'#2a2a1a');
  rect(ctx,cx-16,40,32,24,grad(ctx,cx-16,40,32,24,'#5e6e3e','#3e4a26'));
  outlineRect(ctx,cx-16,40,32,24,'#2a3a16');
  rect(ctx,cx-12,42,10,12,'#6a7e5e'); rect(ctx,cx+2,42,10,12,'#6a7e5e');
  outlineRect(ctx,cx-12,42,10,12,'#4a5e3e'); outlineRect(ctx,cx+2,42,10,12,'#4a5e3e');
  for(let i=0;i<4;i++) line(ctx,cx-14,54+i*2,cx+14,54+i*2,'#4e5e2e',1);
  sash(ctx,cx,40,24,TEAM_BLUE.accent); belt(ctx,cx,63,32,'#2a3a16');
  rect(ctx,cx-20,42,6,16,'#4e5e2e'); rect(ctx,cx+14,42,6,16,'#4e5e2e');
  outlineRect(ctx,cx-20,42,6,16,'#2a3a16'); outlineRect(ctx,cx+14,42,6,16,'#2a3a16');
  rect(ctx,cx-21,56,8,4,'#3a3a2a'); rect(ctx,cx+13,56,8,4,'#3a3a2a');
  legs(ctx,cx,66,8,'#3e4a26','#2e3a1a');
  rect(ctx,cx-8,72,7,3,'#2a1a0e'); rect(ctx,cx+1,72,7,3,'#2a1a0e');
  rect(ctx,cx+18,36,4,30,'#3a3a2a'); outlineRect(ctx,cx+18,36,4,30,'#2a2a1a');
  rect(ctx,cx+19,26,2,12,'#4a4a3a');
  line(ctx,cx+16,60,cx+12,68,'#3a3a2a',2); line(ctx,cx+24,60,cx+28,68,'#3a3a2a',2);
  rect(ctx,cx+14,50,6,8,'#4a4a3a');
  line(ctx,cx+18,50,cx+18,44,'#8a6e2e',2);
  rect(ctx,cx-16,64,2,8,'#c2c2c2'); rect(ctx,cx-16,70,2,3,'#3a2a14');
}

// ════════════════════════════════════════════════════════════
// AGE 4 — FUTURE
// ════════════════════════════════════════════════════════════

function drawMelee4(ctx){
  const cx=48,ap=AP[4];
  shadow(ctx,cx,88,26);
  rect(ctx,cx-12,8,24,18,grad(ctx,cx-12,8,24,18,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-12,8,24,18,'#1a1c28');
  rect(ctx,cx-8,20,16,3,'#3ac2ff'); outlineRect(ctx,cx-8,20,16,3,'#1a8abb');
  rect(ctx,cx-13,14,3,6,'#3a3c58'); rect(ctx,cx+10,14,3,6,'#3a3c58');
  head(ctx,cx,26,10,ap.skin,ap.skinDark,'#1a1a2a');
  rect(ctx,cx-16,36,32,24,grad(ctx,cx-16,36,32,24,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-16,36,32,24,'#1a1c28');
  circle(ctx,cx,46,4,'#3ac2ff'); outlineCircle(ctx,cx,46,4,'#1a8abb');
  circle(ctx,cx,46,2,'#7aeaff');
  rect(ctx,cx-14,38,8,8,'#3a3c58'); rect(ctx,cx+6,38,8,8,'#3a3c58');
  line(ctx,cx-6,42,cx-2,42,'#3ac2ff',1); line(ctx,cx+2,42,cx+6,42,'#3ac2ff',1);
  sash(ctx,cx,36,24,TEAM_BLUE.accent); belt(ctx,cx,59,32,'#1a1c28');
  rect(ctx,cx-20,38,6,16,'#3a3c58'); rect(ctx,cx+14,38,6,16,'#3a3c58');
  outlineRect(ctx,cx-20,38,6,16,'#1a1c28'); outlineRect(ctx,cx+14,38,6,16,'#1a1c28');
  rect(ctx,cx-21,52,8,4,'#4a4c6a'); rect(ctx,cx+13,52,8,4,'#4a4c6a');
  circle(ctx,cx-17,54,2,'#3ac2ff'); circle(ctx,cx+17,54,2,'#3ac2ff');
  legs(ctx,cx,62,8,'#2a2c3c','#16181e');
  rect(ctx,cx-8,68,7,3,'#1a1c28'); rect(ctx,cx+1,68,7,3,'#1a1c28');
  rect(ctx,cx+18,28,3,28,'#3a3c58');
  rect(ctx,cx+16,16,7,14,grad(ctx,cx+16,16,7,14,'#3ac2ff','#7aeaff'));
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=6; rect(ctx,cx+18,18,3,10,'#3ac2ff'); ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(cx+19.5,14); ctx.lineTo(cx+16,18); ctx.lineTo(cx+23,18); ctx.fill();
}

function drawRanged4(ctx){
  const cx=48,ap=AP[4];
  shadow(ctx,cx,88,26);
  rect(ctx,cx-12,8,24,18,grad(ctx,cx-12,8,24,18,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-12,8,24,18,'#1a1c28');
  rect(ctx,cx-9,18,18,4,'#3ac2ff'); rect(ctx,cx-8,19,16,2,'#7aeaff');
  rect(ctx,cx+10,6,2,8,'#3a3c58'); circle(ctx,cx+11,5,1.5,'#ff4444');
  head(ctx,cx,26,10,ap.skin,ap.skinDark,'#1a1a2a');
  rect(ctx,cx-14,36,28,22,grad(ctx,cx-14,36,28,22,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-14,36,28,22,'#1a1c28');
  rect(ctx,cx+10,38,6,12,'#3a3c58'); circle(ctx,cx+13,40,2,'#3ac2ff');
  sash(ctx,cx,36,22,TEAM_BLUE.accent); belt(ctx,cx,57,28,'#1a1c28');
  rect(ctx,cx-18,38,6,14,'#3a3c58'); rect(ctx,cx+12,38,6,14,'#3a3c58');
  outlineRect(ctx,cx-18,38,6,14,'#1a1c28'); outlineRect(ctx,cx+12,38,6,14,'#1a1c28');
  legs(ctx,cx,60,8,'#2a2c3c','#16181e');
  rect(ctx,cx-8,66,7,3,'#1a1c28'); rect(ctx,cx+1,66,7,3,'#1a1c28');
  rect(ctx,cx+14,30,4,28,'#3a3c58'); outlineRect(ctx,cx+14,30,4,28,'#1a1c28');
  rect(ctx,cx+15,20,2,12,'#2a2c3c');
  rect(ctx,cx+18,36,4,8,'#3a3c58'); circle(ctx,cx+20,38,2,'#3ac2ff');
  rect(ctx,cx+20,32,4,6,'#2a2c3c'); circle(ctx,cx+22,33,1.5,'#3ac2ff');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=4; circle(ctx,cx+16,19,2,'#3ac2ff'); ctx.shadowBlur=0;
  line(ctx,cx-6,14,cx+6,14,'#3ac2ff',0.5);
}

function drawFast4(ctx){
  const cx=48,ap=AP[4];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-18,36,40,18,grad(ctx,cx-18,36,40,18,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-18,36,40,18,'#1a1c28');
  rect(ctx,cx-16,44,36,2,'#3a3c58');
  ctx.fillStyle='#1a3a5a'; ctx.beginPath(); ctx.moveTo(cx+8,32); ctx.lineTo(cx+22,32); ctx.lineTo(cx+20,42); ctx.lineTo(cx+10,42); ctx.fill();
  outlineRect(ctx,cx+8,32,14,10,'#3ac2ff');
  rect(ctx,cx+10,34,10,2,'#3ac2ff');
  rect(ctx,cx-12,54,8,4,'#3a3c58'); rect(ctx,cx+4,54,8,4,'#3a3c58');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=6;
  rect(ctx,cx-10,58,4,3,'#3ac2ff'); rect(ctx,cx+6,58,4,3,'#3ac2ff');
  ctx.shadowBlur=0;
  rect(ctx,cx-20,40,4,6,'#3a3c58'); rect(ctx,cx+18,40,4,6,'#3a3c58');
  circle(ctx,cx-18,43,1.5,'#3ac2ff'); circle(ctx,cx+20,43,1.5,'#3ac2ff');
  rect(ctx,cx-6,30,4,8,'#3a3c58'); rect(ctx,cx+2,30,4,8,'#3a3c58');
  rect(ctx,cx-5,24,2,8,'#2a2c3c'); rect(ctx,cx+3,24,2,8,'#2a2c3c');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=4;
  circle(ctx,cx-4,23,1.5,'#3ac2ff'); circle(ctx,cx+4,23,1.5,'#3ac2ff');
  ctx.shadowBlur=0;
  rect(ctx,cx-14,38,8,4,TEAM_BLUE.accent);
  for(let i=0;i<3;i++) line(ctx,cx-24-i*4,40+i*4,cx-28-i*4,40+i*4,'#3ac2ff',0.5);
  head(ctx,cx+14,28,5,ap.skin,ap.skinDark,'#1a1a2a');
}

function drawSiege4(ctx){
  const cx=48,ap=AP[4];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-20,40,44,18,grad(ctx,cx-20,40,44,18,'#3a3c58','#1a1c28'));
  outlineRect(ctx,cx-20,40,44,18,'#0a0c18');
  for(let i=0;i<4;i++) rect(ctx,cx-18+i*10,42,6,2,'#3a3c58');
  rect(ctx,cx-8,30,16,12,grad(ctx,cx-8,30,16,12,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-8,30,16,12,'#1a1c28');
  rect(ctx,cx-4,32,8,3,'#3ac2ff');
  rect(ctx,cx+8,20,4,22,'#3a3c58'); outlineRect(ctx,cx+8,20,4,22,'#1a1c28');
  rect(ctx,cx+6,14,8,8,'#4a4c6a'); outlineRect(ctx,cx+6,14,8,8,'#1a1c28');
  rect(ctx,cx+8,16,4,4,'#3ac2ff');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=8;
  circle(ctx,cx+10,12,3,'#3ac2ff'); circle(ctx,cx+10,12,1.5,'#7aeaff');
  ctx.shadowBlur=0;
  rect(ctx,cx-6,58,4,4,'#3a3c58'); rect(ctx,cx+6,58,4,4,'#3a3c58');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=4;
  rect(ctx,cx-5,62,2,2,'#3ac2ff'); rect(ctx,cx+7,62,2,2,'#3ac2ff');
  ctx.shadowBlur=0;
  head(ctx,cx-16,34,6,ap.skin,ap.skinDark,'#1a1a2a');
  torso(ctx,cx-16,42,10,10,'#2a2c3c','#16181e','#3a3c58');
  sash(ctx,cx-16,42,10,TEAM_BLUE.accent);
}

function drawArmored4(ctx){
  const cx=48,ap=AP[4];
  shadow(ctx,cx,88,30);
  rect(ctx,cx-20,38,44,24,grad(ctx,cx-20,38,44,24,'#3a3c58','#1a1c28'));
  outlineRect(ctx,cx-20,38,44,24,'#0a0c18');
  rect(ctx,cx-18,40,40,2,'#3a3c58'); rect(ctx,cx-18,54,40,2,'#3a3c58');
  rect(ctx,cx-10,30,20,10,grad(ctx,cx-10,30,20,10,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-10,30,20,10,'#1a1c28');
  rect(ctx,cx-6,32,12,3,'#3ac2ff');
  rect(ctx,cx+14,28,10,8,'#3a3c58'); outlineRect(ctx,cx+14,28,10,8,'#1a1c28');
  rect(ctx,cx+16,30,6,3,'#3ac2ff');
  rect(ctx,cx+22,24,2,8,'#2a2c3c');
  rect(ctx,cx+22,20,4,5,'#3a3c58');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=6;
  circle(ctx,cx+24,18,2,'#3ac2ff');
  ctx.shadowBlur=0;
  rect(ctx,cx-8,62,6,6,'#2a2c3c'); rect(ctx,cx+2,62,6,6,'#2a2c3c');
  outlineRect(ctx,cx-8,62,6,6,'#1a1c28'); outlineRect(ctx,cx+2,62,6,6,'#1a1c28');
  rect(ctx,cx-10,66,10,4,'#1a1c28'); rect(ctx,cx,66,10,4,'#1a1c28');
  for(let i=0;i<3;i++){
    rect(ctx,cx-6+i*6,42,4,10,'#3a3c58'); outlineRect(ctx,cx-6+i*6,42,4,10,'#1a1c28');
    circle(ctx,cx-4+i*6,44,1,'#3ac2ff');
  }
  head(ctx,cx,22,8,ap.skin,ap.skinDark,'#1a1a2a');
  rect(ctx,cx-12,30,24,10,grad(ctx,cx-12,30,24,10,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-12,30,24,10,'#1a1c28');
  rect(ctx,cx-4,32,8,3,'#3ac2ff');
  rect(ctx,cx+28,36,4,22,'#3a3c58'); outlineRect(ctx,cx+28,36,4,22,'#1a1c28');
  rect(ctx,cx+30,30,4,8,'#4a4c6a'); outlineRect(ctx,cx+30,30,4,8,'#1a1c28');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=6;
  rect(ctx,cx+31,32,2,4,'#3ac2ff');
  ctx.shadowBlur=0;
  rect(ctx,cx-32,40,6,14,'#3a3c58'); outlineRect(ctx,cx-32,40,6,14,'#1a1c28');
  rect(ctx,cx-34,38,4,6,'#3a3c58'); outlineRect(ctx,cx-34,38,4,6,'#1a1c28');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=4;
  rect(ctx,cx-33,39,2,4,'#3ac2ff');
  ctx.shadowBlur=0;
}

function drawElite4(ctx){
  const cx=48,ap=AP[4];
  shadow(ctx,cx,88,26);
  rect(ctx,cx-14,8,28,18,grad(ctx,cx-14,8,28,18,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-14,8,28,18,'#1a1c28');
  rect(ctx,cx-10,20,20,4,'#3ac2ff'); rect(ctx,cx-9,21,18,2,'#7aeaff');
  rect(ctx,cx-15,14,3,6,'#3a3c58'); rect(ctx,cx+12,14,3,6,'#3a3c58');
  head(ctx,cx,26,10,ap.skin,ap.skinDark,'#1a1a2a');
  rect(ctx,cx-16,36,32,24,grad(ctx,cx-16,36,32,24,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-16,36,32,24,'#1a1c28');
  rect(ctx,cx-12,38,8,8,'#3a3c58'); rect(ctx,cx+4,38,8,8,'#3a3c58');
  circle(ctx,cx,46,4,'#3ac2ff'); outlineCircle(ctx,cx,46,4,'#1a8abb');
  circle(ctx,cx,46,2,'#7aeaff');
  line(ctx,cx-4,42,cx-1,42,'#3ac2ff',1); line(ctx,cx+1,42,cx+4,42,'#3ac2ff',1);
  sash(ctx,cx,36,24,TEAM_BLUE.accent); belt(ctx,cx,59,32,'#1a1c28');
  rect(ctx,cx-22,38,6,16,'#3a3c58'); rect(ctx,cx+16,38,6,16,'#3a3c58');
  outlineRect(ctx,cx-22,38,6,16,'#1a1c28'); outlineRect(ctx,cx+16,38,6,16,'#1a1c28');
  rect(ctx,cx-23,52,8,4,'#4a4c6a'); rect(ctx,cx+15,52,8,4,'#4a4c6a');
  circle(ctx,cx-19,54,2,'#3ac2ff'); circle(ctx,cx+19,54,2,'#3ac2ff');
  legs(ctx,cx,62,8,'#2a2c3c','#16181e');
  rect(ctx,cx-8,68,7,3,'#1a1c28'); rect(ctx,cx+1,68,7,3,'#1a1c28');
  rect(ctx,cx+20,30,3,30,'#3a3c58'); outlineRect(ctx,cx+20,30,3,30,'#1a1c28');
  rect(ctx,cx+18,14,7,18,grad(ctx,cx+18,14,7,18,'#3ac2ff','#7aeaff'));
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=8; rect(ctx,cx+20,16,3,14,'#3ac2ff'); ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(cx+21.5,12); ctx.lineTo(cx+18,16); ctx.lineTo(cx+25,16); ctx.fill();
  rect(ctx,cx-23,30,3,30,'#3a3c58'); outlineRect(ctx,cx-23,30,3,30,'#1a1c28');
  rect(ctx,cx-25,14,7,18,grad(ctx,cx-25,14,7,18,'#3ac2ff','#7aeaff'));
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=8; rect(ctx,cx-23,16,3,14,'#3ac2ff'); ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(cx-21.5,12); ctx.lineTo(cx-25,16); ctx.lineTo(cx-18,16); ctx.fill();
}

function drawHero4(ctx){
  const cx=48,ap=AP[4];
  shadow(ctx,cx,88,28);
  rect(ctx,cx-14,8,28,20,grad(ctx,cx-14,8,28,20,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-14,8,28,20,'#1a1c28');
  rect(ctx,cx-10,22,20,4,'#3ac2ff'); rect(ctx,cx-9,23,18,2,'#7aeaff');
  rect(ctx,cx-15,12,3,8,'#3a3c58'); rect(ctx,cx+12,12,3,8,'#3a3c58');
  rect(ctx,cx-6,6,12,4,gradH(ctx,cx-6,6,12,4,'#3ac2ff','#1a8abb'));
  rect(ctx,cx-2,2,4,6,'#4a4c6a');
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=6;
  circle(ctx,cx,1,2,'#3ac2ff');
  ctx.shadowBlur=0;
  head(ctx,cx,28,11,ap.skin,ap.skinDark,'#1a1a2a');
  rect(ctx,cx-18,40,36,26,grad(ctx,cx-18,40,36,26,'#4a4c6a','#2a2c3c'));
  outlineRect(ctx,cx-18,40,36,26,'#1a1c28');
  rect(ctx,cx-14,42,10,10,'#3a3c58'); rect(ctx,cx+4,42,10,10,'#3a3c58');
  circle(ctx,cx,50,5,'#3ac2ff'); outlineCircle(ctx,cx,50,5,'#1a8abb');
  circle(ctx,cx,50,3,'#7aeaff');
  line(ctx,cx-6,46,cx-2,46,'#3ac2ff',1); line(ctx,cx+2,46,cx+6,46,'#3ac2ff',1);
  for(let i=0;i<3;i++){ rect(ctx,cx-10+i*10,44,6,6,'#3a3c58'); outlineRect(ctx,cx-10+i*10,44,6,6,'#1a1c28'); circle(ctx,cx-7+i*10,46,1.5,'#3ac2ff'); }
  sash(ctx,cx,40,26,TEAM_BLUE.accent); belt(ctx,cx,65,36,'#1a1c28');
  rect(ctx,cx-24,42,6,18,'#3a3c58'); rect(ctx,cx+18,42,6,18,'#3a3c58');
  outlineRect(ctx,cx-24,42,6,18,'#1a1c28'); outlineRect(ctx,cx+18,42,6,18,'#1a1c28');
  rect(ctx,cx-25,58,8,4,'#4a4c6a'); rect(ctx,cx+17,58,8,4,'#4a4c6a');
  circle(ctx,cx-21,60,2.5,'#3ac2ff'); circle(ctx,cx+21,60,2.5,'#3ac2ff');
  legs(ctx,cx,68,6,'#2a2c3c','#16181e');
  rect(ctx,cx-8,72,7,3,'#1a1c28'); rect(ctx,cx+1,72,7,3,'#1a1c28');
  rect(ctx,cx+22,28,4,34,'#3a3c58'); outlineRect(ctx,cx+22,28,4,34,'#1a1c28');
  rect(ctx,cx+20,10,8,20,grad(ctx,cx+20,10,8,20,'#3ac2ff','#7aeaff'));
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=10; rect(ctx,cx+22,12,4,16,'#3ac2ff'); ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(cx+24,8); ctx.lineTo(cx+20,14); ctx.lineTo(cx+28,14); ctx.fill();
  rect(ctx,cx-26,28,4,34,'#3a3c58'); outlineRect(ctx,cx-26,28,4,34,'#1a1c28');
  rect(ctx,cx-28,10,8,20,grad(ctx,cx-28,10,8,20,'#3ac2ff','#7aeaff'));
  ctx.shadowColor='#3ac2ff'; ctx.shadowBlur=10; rect(ctx,cx-26,12,4,16,'#3ac2ff'); ctx.shadowBlur=0;
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(cx-24,8); ctx.lineTo(cx-28,14); ctx.lineTo(cx-20,14); ctx.fill();
}

// ════════════════════════════════════════════════════════════
// GENERATION
// ════════════════════════════════════════════════════════════

const TYPES = ['melee','ranged','fast','siege','armored','elite','hero'];
const DRAW = [drawMelee0,drawRanged0,drawFast0,drawSiege0,drawArmored0,drawElite0,drawHero0,
              drawMelee1,drawRanged1,drawFast1,drawSiege1,drawArmored1,drawElite1,drawHero1,
              drawMelee2,drawRanged2,drawFast2,drawSiege2,drawArmored2,drawElite2,drawHero2,
              drawMelee3,drawRanged3,drawFast3,drawSiege3,drawArmored3,drawElite3,drawHero3,
              drawMelee4,drawRanged4,drawFast4,drawSiege4,drawArmored4,drawElite4,drawHero4];

let idx = 0;
for (let age = 0; age < 5; age++) {
  for (let t = 0; t < TYPES.length; t++) {
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    DRAW[idx](ctx);
    idx++;
    const buf = canvas.toBuffer('image/png');
    const fname = `${TYPES[t]}_${age}.png`;
    fs.writeFileSync(path.join(OUT_DIR, fname), buf);
    console.log(`  ${fname} (${buf.length} bytes)`);
  }
}
console.log(`\nGenerated ${idx} sprites.`);

const { TEAM_BLUE, AP, rect, outlineRect, circle, outlineCircle, line, grad, gradH, rgrad, shadow, px, head, torso, legs, arms, belt, sash, cape } = require('./helpers');

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

module.exports = [drawMelee2, drawRanged2, drawFast2, drawSiege2, drawArmored2, drawElite2, drawHero2];

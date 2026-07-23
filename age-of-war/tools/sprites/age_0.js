const { TEAM_BLUE, AP, rect, outlineRect, circle, outlineCircle, line, grad, gradH, rgrad, shadow, px, head, torso, legs, arms, belt, sash, cape } = require('./helpers');

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

module.exports = [drawMelee0, drawRanged0, drawFast0, drawSiege0, drawArmored0, drawElite0, drawHero0];

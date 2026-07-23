const { TEAM_BLUE, AP, rect, outlineRect, circle, outlineCircle, line, grad, gradH, rgrad, shadow, px, head, torso, legs, arms, belt, sash, cape } = require('./helpers');

function drawMelee1(ctx){
  const cx=48,ap=AP[1];
  shadow(ctx,cx,76,24);
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
  shadow(ctx,cx,76,24);
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
  shadow(ctx,cx,76,30);
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
  shadow(ctx,cx,76,28);
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
  shadow(ctx,cx,76,26);
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
  shadow(ctx,cx,76,26);
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
  shadow(ctx,cx,76,28);
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

module.exports = [drawMelee1, drawRanged1, drawFast1, drawSiege1, drawArmored1, drawElite1, drawHero1];

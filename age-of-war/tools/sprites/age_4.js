const { TEAM_BLUE, AP, rect, outlineRect, circle, outlineCircle, line, grad, gradH, rgrad, shadow, px, head, torso, legs, arms, belt, sash, cape } = require('./helpers');

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

module.exports = [drawMelee4, drawRanged4, drawFast4, drawSiege4, drawArmored4, drawElite4, drawHero4];

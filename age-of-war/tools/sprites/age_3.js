const { TEAM_BLUE, AP, rect, outlineRect, circle, outlineCircle, line, grad, gradH, rgrad, shadow, px, head, torso, legs, arms, belt, sash, cape } = require('./helpers');

function drawMelee3(ctx){
  const cx=48,ap=AP[3];
  shadow(ctx,cx,76,24);
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
  shadow(ctx,cx,76,24);
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
  shadow(ctx,cx,76,30);
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
  shadow(ctx,cx,76,28);
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
  shadow(ctx,cx,76,30);
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
  shadow(ctx,cx,76,26);
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
  shadow(ctx,cx,76,28);
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

module.exports = [drawMelee3, drawRanged3, drawFast3, drawSiege3, drawArmored3, drawElite3, drawHero3];

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

module.exports = { TEAM_BLUE, AP, rect, outlineRect, circle, outlineCircle, line, grad, gradH, rgrad, shadow, px, head, torso, legs, arms, belt, sash, cape };

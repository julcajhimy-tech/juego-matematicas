import { useState, useEffect, useRef, useCallback } from "react";
import keyboardImage from './assets/indicaciones_teclado.svg';

// ══════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════
const MAX_ATTEMPTS  = 10;
const MAX_LIVES     = 3;
const POWER_STREAK  = 3;

const OPS = [
  { label:"Suma",  sym:"+", key:"sum" },
  { label:"Resta", sym:"−", key:"sub" },
  { label:"Mult.", sym:"×", key:"mul" },
  { label:"Div.",  sym:"÷", key:"div" },
];

function genQuestion(opKey) {
  if (opKey==="sum") { const a=Math.floor(Math.random()*20)+1,b=Math.floor(Math.random()*20)+1; return {a,b,op:"+",answer:a+b}; }
  if (opKey==="sub") { const a=Math.floor(Math.random()*20)+5,b=Math.floor(Math.random()*a)+1; return {a,b,op:"−",answer:a-b}; }
  if (opKey==="mul") { const a=Math.floor(Math.random()*10)+1,b=Math.floor(Math.random()*10)+1; return {a,b,op:"×",answer:a*b}; }
  const b=Math.floor(Math.random()*9)+1,a=b*(Math.floor(Math.random()*9)+1); return {a,b,op:"÷",answer:a/b};
}

const MOTIVATIONAL = [
  "¡Las matemáticas son tu superpoder! 🦸","¡Cada error es una lección! 💡",
  "¡Sigan practicando, campeones! 🏅","¡El esfuerzo siempre paga! 🌟",
  "¡Juntos aprendemos más! 🤝","¡Hoy aprendiste algo nuevo! 🎉",
];
const WIN_MSG  = (t) => [`🎊 ¡${t} GANÓ! 🎊`, "¡Increíble desempeño!", MOTIVATIONAL[Math.floor(Math.random()*MOTIVATIONAL.length)]];
const DRAW_MSG = ["🤝 ¡EMPATE ÉPICO! 🤝","¡Los dos equipos son campeones!","¡Las matemáticas los unieron! 💪"];

// ══════════════════════════════════════════════════════════
//  PARTICLE HOOK
// ══════════════════════════════════════════════════════════
function useParticles() {
  const particles = useRef([]);
  const nextId    = useRef(0);

  const spawn = useCallback((x, y, type="correct", count=14) => {
    const palettes = {
      correct: ["#FFD93D","#6BCB77","#fff","#a8ff78"],
      wrong:   ["#FF6B6B","#ff4444","#ff9999","#fff"],
      powerup: ["#FFD93D","#FF922B","#fff","#ffd700","#ff6b35"],
    };
    const pal = palettes[type] || palettes.correct;
    for (let i=0;i<count;i++) {
      const angle=(Math.PI*2*i)/count+Math.random()*0.5;
      const spd=2+Math.random()*4;
      particles.current.push({
        id:nextId.current++,x,y,
        vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd-2,
        life:1, decay:0.02+Math.random()*0.02,
        size:4+Math.random()*8,
        color:pal[Math.floor(Math.random()*pal.length)],
        shape:Math.random()>0.5?"circle":"star",
        rotation:Math.random()*Math.PI*2,
        rotSpeed:(Math.random()-0.5)*0.2,
      });
    }
  },[]);

  const update = useCallback(()=>{
    particles.current = particles.current
      .map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+0.15,life:p.life-p.decay,rotation:p.rotation+p.rotSpeed}))
      .filter(p=>p.life>0);
  },[]);

  const draw = useCallback((ctx)=>{
    particles.current.forEach(p=>{
      ctx.save();
      ctx.globalAlpha=p.life;
      ctx.fillStyle=p.color;
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rotation);
      if(p.shape==="star"){
        ctx.beginPath();
        for(let i=0;i<5;i++){
          const a=(i*4*Math.PI)/5-Math.PI/2;
          const r=i%2===0?p.size:p.size*0.4;
          ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
        }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });
  },[]);

  return {spawn, update, draw};
}

// ══════════════════════════════════════════════════════════
//  TUG VISUAL — GLASS ARENA
// ══════════════════════════════════════════════════════════
function TugVisual({ ropePos, team1, team2, lastEvent }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const tickRef   = useRef(0);
  const stateRef  = useRef({ ropePos, team1, team2, lastEvent });
  const { spawn, update, draw: drawParticles } = useParticles();

  useEffect(()=>{ stateRef.current={ropePos,team1,team2,lastEvent}; },[ropePos,team1,team2,lastEvent]);

  useEffect(()=>{
    const c=canvasRef.current; if(!c||!lastEvent) return;
    const W=c.width,H=c.height;
    const isT1=lastEvent.team==="team1";
    spawn(isT1?W*0.28:W*0.72, H*0.45, lastEvent.type, lastEvent.type==="powerup"?26:15);
  },[lastEvent,spawn]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");

    const resize=()=>{
      const p=canvas.parentElement;
      canvas.width  = p ? Math.min(p.clientWidth,580) : 560;
      canvas.height = 210;
    };
    resize();
    window.addEventListener("resize",resize);

    function lighten(hex,amt){
      const n=parseInt(hex.replace("#",""),16);
      const r=Math.min(255,(n>>16)+amt),g=Math.min(255,((n>>8)&0xff)+amt),b=Math.min(255,(n&0xff)+amt);
      return `rgb(${r},${g},${b})`;
    }

    function drawHeart(x,y,size,filled,pulse){
      ctx.save(); ctx.translate(x,y);
      if(pulse){ ctx.shadowColor="#FF6B6B"; ctx.shadowBlur=10; }
      ctx.beginPath();
      ctx.moveTo(0,size*.3);
      ctx.bezierCurveTo(0,0,-size*.6,0,-size*.6,-size*.3);
      ctx.bezierCurveTo(-size*.6,-size*.7,0,-size*.7,0,-size*.3);
      ctx.bezierCurveTo(0,-size*.7,size*.6,-size*.7,size*.6,-size*.3);
      ctx.bezierCurveTo(size*.6,0,0,0,0,size*.3);
      ctx.closePath();
      ctx.fillStyle=filled?"#FF6B6B":"rgba(255,107,107,0.18)";
      ctx.fill();
      if(filled){ ctx.strokeStyle="rgba(255,255,255,0.4)"; ctx.lineWidth=0.8; ctx.stroke(); }
      ctx.restore();
    }

    function drawPowerBar(x,y,w,streak,color,side){
      const pct=(streak%POWER_STREAK)/POWER_STREAK;
      const lvl=Math.floor(streak/POWER_STREAK);
      ctx.save();
      ctx.fillStyle="rgba(0,0,0,0.35)";
      ctx.beginPath(); ctx.roundRect(x,y,w,7,3); ctx.fill();
      if(pct>0){
        const g=ctx.createLinearGradient(x,y,x+w*pct,y);
        g.addColorStop(0,color); g.addColorStop(1,"#FFD93D");
        ctx.fillStyle=g; ctx.shadowColor=color; ctx.shadowBlur=pct>.5?8:0;
        ctx.beginPath(); ctx.roundRect(x,y,w*pct,7,3); ctx.fill();
      }
      ctx.shadowBlur=0;
      ctx.font="bold 9px 'Fredoka One',cursive";
      ctx.fillStyle="#FFD93D";
      ctx.textAlign=side==="left"?"left":"right";
      ctx.fillText(lvl>0?`⚡×${lvl}`:"POWER",side==="left"?x:x+w,y-3);
      ctx.restore();
    }

    function drawFigure(x,baseY,color,facingRight,state,streak,t){
      const powered=streak>=POWER_STREAK;
      ctx.save(); ctx.translate(x,baseY);
      if(powered){
        const ag=ctx.createRadialGradient(0,-22,4,0,-22,38);
        ag.addColorStop(0,`${color}55`); ag.addColorStop(1,"transparent");
        ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(0,-22,38+Math.sin(t*.08)*5,0,Math.PI*2); ctx.fill();
      }
      ctx.shadowColor=powered?"#FFD93D":color;
      ctx.shadowBlur=powered?12+Math.sin(t*.08)*4:5;
      let bounce=0,legSwing=0,armLean=0,sx=1,sy=1;
      if(state==="celebrate"){ bounce=Math.abs(Math.sin(t*.2))*-16; legSwing=Math.sin(t*.25)*28; sx=1+Math.sin(t*.2)*.07; sy=1-Math.sin(t*.2)*.04; }
      else if(state==="hit"){ bounce=Math.sin(t*.4)*4; sx=1.14; sy=0.88; armLean=facingRight?18:-18; }
      else if(state==="pull"){ armLean=facingRight?-14:14; bounce=Math.sin(t*.12)*2.5; legSwing=Math.sin(t*.12)*7; }
      else { bounce=Math.sin(t*.05)*1.5; }
      ctx.scale(sx,sy); ctx.translate(0,bounce);
      ctx.strokeStyle=color; ctx.lineWidth=3.5; ctx.lineCap="round"; ctx.lineJoin="round";
      const ls=(legSwing*Math.PI)/180;
      ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(-12+Math.sin(ls)*12,14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(12-Math.sin(ls)*12,14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,-36); ctx.stroke();
      const ad=facingRight?1:-1, aa=(armLean*Math.PI)/180;
      ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(ad*20*Math.cos(aa),-28+20*Math.sin(aa)*ad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-28); ctx.lineTo(-ad*14,-38); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,-46,12,0,Math.PI*2);
      const hg=ctx.createRadialGradient(-3,-49,2,0,-46,12);
      hg.addColorStop(0,powered?"#FFD93D":lighten(color,40)); hg.addColorStop(1,color);
      ctx.fillStyle=hg; ctx.shadowBlur=0; ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.35)"; ctx.lineWidth=1.5; ctx.stroke();
      ctx.font="13px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(state==="celebrate"?"😄":state==="hit"?"😵":powered?"😤":"😐",0,-46);
      if(powered){
        ctx.strokeStyle="#FFD93D"; ctx.lineWidth=2; ctx.shadowColor="#FFD93D"; ctx.shadowBlur=10;
        const lx=facingRight?-22:22;
        ctx.beginPath(); ctx.moveTo(lx,-56); ctx.lineTo(lx+(facingRight?5:-5),-48);
        ctx.lineTo(lx-(facingRight?3:-3),-44); ctx.lineTo(lx+(facingRight?4:-4),-36); ctx.stroke();
      }
      ctx.restore();
    }

    function drawArena(W,H,t){
      const bg=ctx.createLinearGradient(0,0,W,H);
      bg.addColorStop(0,"rgba(12,8,38,0.95)"); bg.addColorStop(.5,"rgba(22,12,55,0.97)"); bg.addColorStop(1,"rgba(12,8,38,0.95)");
      ctx.fillStyle=bg; ctx.beginPath(); ctx.roundRect(0,0,W,H,18); ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.03)"; ctx.lineWidth=1;
      for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      const g1=ctx.createRadialGradient(W*.2,H*.5,0,W*.2,H*.5,W*.38);
      g1.addColorStop(0,"rgba(255,145,43,0.13)"); g1.addColorStop(1,"transparent");
      ctx.fillStyle=g1; ctx.beginPath(); ctx.roundRect(0,0,W,H,18); ctx.fill();
      const g2=ctx.createRadialGradient(W*.8,H*.5,0,W*.8,H*.5,W*.38);
      g2.addColorStop(0,"rgba(77,150,255,0.13)"); g2.addColorStop(1,"transparent");
      ctx.fillStyle=g2; ctx.beginPath(); ctx.roundRect(0,0,W,H,18); ctx.fill();
      ctx.save(); ctx.strokeStyle="rgba(255,215,0,0.5)"; ctx.lineWidth=2;
      ctx.setLineDash([8,6]); ctx.lineDashOffset=-(t*.5%28);
      ctx.shadowColor="#FFD93D"; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      const lz=ctx.createLinearGradient(0,0,W*.18,0);
      lz.addColorStop(0,"rgba(255,145,43,0.2)"); lz.addColorStop(1,"transparent");
      ctx.fillStyle=lz; ctx.beginPath(); ctx.roundRect(0,0,W*.18,H,[18,0,0,18]); ctx.fill();
      const rz=ctx.createLinearGradient(W*.82,0,W,0);
      rz.addColorStop(0,"transparent"); rz.addColorStop(1,"rgba(77,150,255,0.2)");
      ctx.fillStyle=rz; ctx.beginPath(); ctx.roundRect(W*.82,0,W*.18,H,[0,18,18,0]); ctx.fill();
      ctx.font="bold 11px 'Fredoka One',cursive";
      ctx.fillStyle="#FF922B"; ctx.shadowColor="#FF922B"; ctx.shadowBlur=8; ctx.textAlign="left";
      ctx.fillText("← GANA T1",10,17);
      ctx.fillStyle="#4D96FF"; ctx.shadowColor="#4D96FF"; ctx.textAlign="right";
      ctx.fillText("GANA T2 →",W-10,17); ctx.shadowBlur=0;
      const border=ctx.createLinearGradient(0,0,W,H);
      border.addColorStop(0,"rgba(255,255,255,0.22)"); border.addColorStop(.5,"rgba(255,255,255,0.05)"); border.addColorStop(1,"rgba(255,255,255,0.14)");
      ctx.strokeStyle=border; ctx.lineWidth=2; ctx.shadowColor="rgba(255,255,255,0.15)"; ctx.shadowBlur=5;
      ctx.beginPath(); ctx.roundRect(1,1,W-2,H-2,17); ctx.stroke(); ctx.shadowBlur=0;
      const sh=ctx.createLinearGradient(W*.1,0,W*.6,H*.15);
      sh.addColorStop(0,"rgba(255,255,255,0.07)"); sh.addColorStop(1,"transparent");
      ctx.fillStyle=sh; ctx.beginPath();
      ctx.moveTo(W*.05,0); ctx.lineTo(W*.85,0); ctx.lineTo(W*.7,H*.18); ctx.lineTo(W*.1,H*.18); ctx.closePath(); ctx.fill();
    }

    function drawRope(W,H,ropePos,t){
      const ry=H*.47, rx=W/2+ropePos*(W*.28);
      ctx.save(); ctx.strokeStyle="rgba(0,0,0,0.25)"; ctx.lineWidth=12; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(32,ry+3); ctx.lineTo(W-32,ry+3); ctx.stroke();
      const rg=ctx.createLinearGradient(32,ry-5,W-32,ry+5);
      rg.addColorStop(0,"#8B4513"); rg.addColorStop(.3,"#CD853F"); rg.addColorStop(.5,"#DEB887"); rg.addColorStop(.7,"#CD853F"); rg.addColorStop(1,"#8B4513");
      ctx.strokeStyle=rg; ctx.lineWidth=10;
      ctx.beginPath(); ctx.moveTo(32,ry); ctx.lineTo(W-32,ry); ctx.stroke();
      ctx.strokeStyle="rgba(255,255,255,0.13)"; ctx.lineWidth=2;
      for(let i=0;i<3;i++){
        ctx.beginPath();
        for(let px=32;px<W-32;px+=2){
          const py=ry+Math.sin(px*.08+t*.05+i*2)*1.5;
          if(px===32)ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
      const gp=14+Math.sin(t*.08)*3;
      const mg=ctx.createRadialGradient(rx,ry,0,rx,ry,gp*2);
      mg.addColorStop(0,"rgba(255,107,107,0.55)"); mg.addColorStop(1,"transparent");
      ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(rx,ry,gp*2,0,Math.PI*2); ctx.fill();
      const mrg=ctx.createRadialGradient(rx-4,ry-4,2,rx,ry,gp);
      mrg.addColorStop(0,"#FF9999"); mrg.addColorStop(.5,"#FF6B6B"); mrg.addColorStop(1,"#CC0000");
      ctx.beginPath(); ctx.arc(rx,ry,gp,0,Math.PI*2); ctx.fillStyle=mrg;
      ctx.shadowColor="#FF6B6B"; ctx.shadowBlur=16; ctx.fill();
      ctx.shadowBlur=0; ctx.strokeStyle="rgba(255,255,255,0.6)"; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();
    }

    function drawHeartsAndPower(W,H,t1,t2){
      const hs=9,gap=22;
      for(let i=0;i<MAX_LIVES;i++) drawHeart(12+i*gap,H-24,hs,i<t1.lives,t1.lives===1&&i===0);
      for(let i=0;i<MAX_LIVES;i++) drawHeart(W-12-i*gap,H-24,hs,i<t2.lives,t2.lives===1&&i===0);
      drawPowerBar(12,H-40,78,t1.streak,"#FF922B","left");
      drawPowerBar(W-90,H-40,78,t2.streak,"#4D96FF","right");
    }

    function drawBanner(W,H,ev,t){
      if(!ev) return;
      const age=t-(ev.time||0); if(age>110) return;
      const op=Math.max(0,1-age/110);
      const sc=age<10?0.5+(age/10)*.6:1;
      ctx.save(); ctx.translate(W/2,H*.16); ctx.scale(sc,sc); ctx.globalAlpha=op;
      const msg=ev.type==="powerup"?"⚡ ¡POWER UP! ⚡":ev.type==="correct"?(ev.team==="team1"?"🔴 ¡Correcto! +1":"🔵 ¡Correcto! +1"):"💥 ¡Fallo! -❤️";
      const bgc=ev.type==="powerup"?"rgba(255,165,0,0.9)":ev.type==="correct"?"rgba(107,203,119,0.88)":"rgba(255,80,80,0.88)";
      ctx.font="bold 13px 'Fredoka One',cursive";
      const tw=ctx.measureText(msg).width+28;
      ctx.beginPath(); ctx.roundRect(-tw/2,-15,tw,30,14); ctx.fillStyle=bgc;
      ctx.shadowColor=bgc; ctx.shadowBlur=18; ctx.fill();
      ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.shadowBlur=0;
      ctx.fillText(msg,0,0); ctx.restore();
    }

    const loop=()=>{
      const {ropePos,team1,team2,lastEvent}=stateRef.current;
      const W=canvas.width,H=canvas.height;
      tickRef.current++;
      const t=tickRef.current;
      ctx.clearRect(0,0,W,H);
      drawArena(W,H,t);
      drawRope(W,H,ropePos,t);
      const rx=W/2+ropePos*(W*.28);
      drawFigure(Math.max(52,rx-88), H*.66, "#FF922B", true,  team1.state, team1.streak, t);
      drawFigure(Math.min(W-52,rx+88),H*.66, "#4D96FF", false, team2.state, team2.streak, t);
      update(); drawParticles(ctx);
      drawBanner(W,H,lastEvent,t);
      drawHeartsAndPower(W,H,team1,team2);
      animRef.current=requestAnimationFrame(loop);
    };
    loop();
    return ()=>{ cancelAnimationFrame(animRef.current); window.removeEventListener("resize",resize); };
  },[update,drawParticles]);

  return (
    <canvas ref={canvasRef}
      style={{width:"100%",borderRadius:18,display:"block",
              boxShadow:"0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)"}} />
  );
}

// ══════════════════════════════════════════════════════════
//  ANIMATED BACKGROUND
// ══════════════════════════════════════════════════════════
function AnimatedBackground() {
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current, ctx=canvas.getContext("2d");
    let id;
    const COLORS=["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF922B","#CC5DE8"];
    const SYMS=["+","-","×","÷","=","?","1","2","3","4","5","6","7","8","9","0"];
    const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
    resize(); window.addEventListener("resize",resize);
    const shapes=Array.from({length:55},()=>({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      size:14+Math.random()*36, angle:Math.random()*Math.PI*2,
      rot:(Math.random()-.5)*.02,
      color:COLORS[Math.floor(Math.random()*COLORS.length)],
      opacity:.06+Math.random()*.14,
      type:Math.random()>.5?"shape":"symbol",
      shape:["circle","triangle","square","diamond"][Math.floor(Math.random()*4)],
      symbol:SYMS[Math.floor(Math.random()*SYMS.length)],
      dx:(Math.random()-.5)*.55, dy:-(0.3+Math.random()*.4),
    }));
    const draw=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      shapes.forEach(s=>{
        s.x+=s.dx; s.y+=s.dy; s.angle+=s.rot;
        if(s.y<-60){s.y=canvas.height+30;s.x=Math.random()*canvas.width;}
        if(s.x<-60)s.x=canvas.width+30; if(s.x>canvas.width+60)s.x=-30;
        ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.angle);
        ctx.globalAlpha=s.opacity; ctx.fillStyle=s.color; ctx.strokeStyle=s.color; ctx.lineWidth=2;
        if(s.type==="symbol"){
          ctx.font=`bold ${s.size}px 'Fredoka One',cursive`; ctx.textAlign="center"; ctx.textBaseline="middle";
          ctx.fillText(s.symbol,0,0);
        } else {
          ctx.beginPath();
          if(s.shape==="circle")ctx.arc(0,0,s.size/2,0,Math.PI*2);
          else if(s.shape==="square")ctx.rect(-s.size/2,-s.size/2,s.size,s.size);
          else if(s.shape==="triangle"){ctx.moveTo(0,-s.size/2);ctx.lineTo(s.size/2,s.size/2);ctx.lineTo(-s.size/2,s.size/2);ctx.closePath();}
          else{ctx.moveTo(0,-s.size/2);ctx.lineTo(s.size/2,0);ctx.lineTo(0,s.size/2);ctx.lineTo(-s.size/2,0);ctx.closePath();}
          ctx.stroke();
        }
        ctx.restore();
      });
      id=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(id);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ══════════════════════════════════════════════════════════
//  CONFETTI
// ══════════════════════════════════════════════════════════
function Confetti() {
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current, ctx=c.getContext("2d");
    c.width=window.innerWidth; c.height=window.innerHeight;
    const p=Array.from({length:130},()=>({
      x:Math.random()*c.width, y:Math.random()*c.height-c.height,
      w:8+Math.random()*10, h:4+Math.random()*6,
      color:["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF922B","#CC5DE8"][Math.floor(Math.random()*6)],
      rot:Math.random()*Math.PI*2, rotS:(Math.random()-.5)*.15,
      vy:2+Math.random()*4, vx:(Math.random()-.5)*2,
    }));
    let id;
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      p.forEach(q=>{
        q.y+=q.vy; q.x+=q.vx; q.rot+=q.rotS;
        if(q.y>c.height+20){q.y=-20;q.x=Math.random()*c.width;}
        ctx.save(); ctx.translate(q.x,q.y); ctx.rotate(q.rot);
        ctx.fillStyle=q.color; ctx.fillRect(-q.w/2,-q.h/2,q.w,q.h); ctx.restore();
      });
      id=requestAnimationFrame(draw);
    };
    draw();
    return()=>cancelAnimationFrame(id);
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,zIndex:999,pointerEvents:"none"}}/>;
}

// ══════════════════════════════════════════════════════════
//  QUESTION CARD — glass dark style
// ══════════════════════════════════════════════════════════
function QuestionCard({name,color,score,question,onAnswer,disabled,lives,streak,answer,setAnswer,attempt}) {
  const [shake,setShake]=useState(false);
  const [flash,setFlash]=useState(null);

  const addDigit=(d)=>setAnswer(answer.length<4?answer+d:answer);
  const clear=()=>setAnswer("");
  const submit=()=>{
    if(!answer||disabled) return;
    const ok=parseInt(answer)===question.answer;
    setFlash(ok?"correct":"wrong");
    if(!ok){setShake(true);setTimeout(()=>setShake(false),500);}
    setTimeout(()=>{setFlash(null);onAnswer(ok);},650);
  };

  const cm={ orange:{border:"#FF922B",accent:"#FF922B",btnBg:"#FF922B"}, blue:{border:"#4D96FF",accent:"#4D96FF",btnBg:"#4D96FF"} }[color];
  const powered=streak>=POWER_STREAK;

  return (
    <div style={{
      border:`2px solid ${powered?"#FFD93D":cm.border+"88"}`,
      borderRadius:22, padding:"16px 14px",
      background: flash==="correct"?"rgba(107,203,119,0.12)": flash==="wrong"?"rgba(255,80,80,0.12)":"rgba(255,255,255,0.06)",
      backdropFilter:"blur(20px)",
      minWidth:155, maxWidth:210, width:"100%",
      boxShadow: powered?`0 0 24px #FFD93D66,0 6px 30px rgba(0,0,0,0.4)`:`0 6px 30px rgba(0,0,0,0.35),0 0 0 1px ${cm.border}22`,
      transform:shake?"translateX(-6px)":"none",
      transition:"background .3s,transform .1s,box-shadow .3s",
      opacity:disabled?.6:1,
      position:"relative",overflow:"hidden",
    }}>
      {powered&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#FFD93D,transparent)",animation:"shimmer 1.4s infinite"}}/>}
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>

      <div style={{textAlign:"center",fontFamily:"'Fredoka One',cursive",color:powered?"#FFD93D":cm.accent,fontSize:16,marginBottom:3}}>{name}</div>
      <div style={{textAlign:"center",fontSize:16,marginBottom:4,letterSpacing:3}}>
        {"❤️".repeat(lives)}{"🖤".repeat(MAX_LIVES-lives)}
      </div>
      <div style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:4}}>
        Intento: {attempt + 1} / {MAX_ATTEMPTS}
      </div>
      <div style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:8}}>
        {powered?"⚡ POWER UP ACTIVO":"Racha: "+"★".repeat(streak%POWER_STREAK)+"☆".repeat(POWER_STREAK-(streak%POWER_STREAK))}
      </div>

      <div style={{
        background:powered?"linear-gradient(135deg,#FF922B,#FFD93D)":cm.btnBg,
        borderRadius:12,padding:"10px 8px",textAlign:"center",color:"#fff",
        fontFamily:"'Fredoka One',cursive",fontSize:24,fontWeight:700,marginBottom:12,
        boxShadow:`0 3px 14px ${cm.border}66`,
      }}>{question.a} {question.op} {question.b} = ?</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5,marginBottom:8}}>
        {["1","2","3","4","5","6","7","8","9","0"].map(d=>(
          <button key={d} onClick={()=>addDigit(d)} disabled={disabled} style={{
            background:["3","9"].includes(d)?"#6BCB77":["6"].includes(d)?"#FF6B6B":cm.btnBg,
            color:"#fff",border:"none",borderRadius:50,width:34,height:34,
            fontFamily:"'Fredoka One',cursive",fontSize:15,cursor:"pointer",
            boxShadow:"0 2px 8px rgba(0,0,0,0.25)",opacity:disabled?.5:1,
          }}>{d}</button>
        ))}
      </div>

      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
        <div style={{flex:1,border:`2px solid ${powered?"#FFD93D":cm.border+"88"}`,borderRadius:10,
          padding:"5px 10px",fontFamily:"'Fredoka One',cursive",fontSize:20,
          color:powered?"#FFD93D":cm.accent,background:"rgba(0,0,0,0.3)",minHeight:34,
        }}>{answer||<span style={{color:"rgba(255,255,255,0.15)"}}>_</span>}</div>
        <button onClick={clear} disabled={disabled} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:13,color:"#ccc"}}>✕</button>
      </div>

      <button onClick={submit} disabled={disabled||!answer} style={{
        width:"100%",
        background:disabled||!answer?"rgba(255,255,255,0.08)":powered?"linear-gradient(135deg,#FF922B,#FFD93D)":cm.btnBg,
        color:disabled||!answer?"rgba(255,255,255,0.25)":"#fff",
        border:"none",borderRadius:12,padding:"10px 0",fontFamily:"'Fredoka One',cursive",fontSize:16,
        cursor:disabled||!answer?"default":"pointer",
        boxShadow:disabled||!answer?"none":`0 4px 16px ${cm.border}66`,transition:"all .2s",
      }}>
        {flash==="correct"?"✅ ¡Correcto!":flash==="wrong"?"❌ Incorrecto":"ENVIAR"}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [screen,setScreen]   = useState("home");
  const [selectedOps,setOps] = useState(["sum"]);
  const [score,setScore]     = useState({team1:0,team2:0});
  const [attempts,setAtt]    = useState({team1:0,team2:0});
  const [lives,setLives]     = useState({team1:MAX_LIVES,team2:MAX_LIVES});
  const [streaks,setStreaks]  = useState({team1:0,team2:0});
  const [ropePos,setRope]    = useState(0);
  const [questions,setQ]     = useState({team1:null,team2:null});
  const [teamStates,setTS]   = useState({team1:"pull",team2:"pull"});
  const [lastEvent,setLE]    = useState(null);
  const [busy,setBusy]       = useState({team1:false,team2:false});
  const [answers, setAnswers] = useState({ team1: "", team2: "" });
  const [teamNames, setTeamNames] = useState({ team1: "Equipo 1", team2: "Equipo 2" });
  const tickRef              = useRef(0);

  const pickOp=()=>selectedOps[Math.floor(Math.random()*selectedOps.length)];
  const toggleOp=(k)=>setOps(p=>p.includes(k)?(p.length>1?p.filter(x=>x!==k):p):[...p,k]);

  const startGame=()=>{
    setQ({team1:genQuestion(pickOp()),team2:genQuestion(pickOp())});
    setScore({team1:0,team2:0}); setAtt({team1:0,team2:0});
    setLives({team1:MAX_LIVES,team2:MAX_LIVES}); setStreaks({team1:0,team2:0});
    setRope(0); setLE(null); setBusy({team1:false,team2:false});
    setAnswers({ team1: "", team2: "" });
    setTS({team1:"pull",team2:"pull"}); setScreen("game");
  };

  const handleAnswer=useCallback((team,correct)=>{
    setBusy(b=>({...b,[team]:true}));
    const now=(++tickRef.current)*10;
    const newAtt={...attempts,[team]:attempts[team]+1};
    setAtt(newAtt);

    if(correct){
      setStreaks(prev=>{
        const ns={...prev,[team]:prev[team]+1};
        const isPowerup=ns[team]>0&&ns[team]%POWER_STREAK===0;
        const pull=isPowerup?0.38:0.16;
        setRope(p=>Math.max(-1,Math.min(1,p+(team==="team1"?-pull:pull))));
        setLE({team,type:isPowerup?"powerup":"correct",time:tickRef.current*10});
        setScore(s=>({...s,[team]:s[team]+1}));
        return ns;
      });
      setTS(s=>({...s,[team]:"celebrate"}));
      setTimeout(()=>setTS(s=>({...s,[team]:"pull"})),800);
    } else {
      setLives(prev=>{
        const nl={...prev,[team]:Math.max(0,prev[team]-1)};
        if(nl[team]===0) setTimeout(()=>setScreen("result"),600);
        return nl;
      });
      setStreaks(s=>({...s,[team]:0}));
      setLE({team,type:"wrong",time:now});
      setTS(s=>({...s,[team]:"hit"}));
      setTimeout(()=>setTS(s=>({...s,[team]:"pull"})),700);
    }

    const t1done=newAtt.team1>=MAX_ATTEMPTS, t2done=newAtt.team2>=MAX_ATTEMPTS;
    setTimeout(()=>{
      if(t1done&&t2done){setScreen("result");return;}
      setQ(q=>({...q,[team]:genQuestion(pickOp())}));
      setBusy(b=>({...b,[team]:false}));
      setAnswers(a => ({ ...a, [team]: "" }));
    },800);
  },[attempts,selectedOps]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (screen !== "game") return;

      const { key, code } = e;

      // Team 1: Main keyboard numbers + Control to submit + Tab to delete
               if (!busy.team1) {
                 if (key === "Control") {
                   e.preventDefault();
                   if (answers.team1) {
                     handleAnswer("team1", parseInt(answers.team1) === questions.team1.answer);
                   }
                 } else if (key === "Tab") {
                    e.preventDefault();
                    setAnswers(a => ({ ...a, team1: a.team1.slice(0, -1) }));
                 } else if (!isNaN(parseInt(key)) && !code.startsWith("Numpad") && answers.team1.length < 4) {
                   e.preventDefault();
                   setAnswers(a => ({ ...a, team1: a.team1 + key }));
                 }
               }
 
               // Team 2: Numpad numbers + Enter/NumpadEnter to submit + Delete to delete
               if (!busy.team2) {
                 if (key === "Enter" || code === "NumpadEnter") {
                   e.preventDefault();
                   if (answers.team2) {
                     handleAnswer("team2", parseInt(answers.team2) === questions.team2.answer);
                   }
                 } else if (key === "Delete") {
                    e.preventDefault();
                    setAnswers(a => ({ ...a, team2: a.team2.slice(0, -1) }));
                 } else if (!isNaN(parseInt(key)) && code.startsWith("Numpad") && answers.team2.length < 4) {
                   e.preventDefault();
                   setAnswers(a => ({ ...a, team2: a.team2 + key }));
                 }
               }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, busy, answers, questions, handleAnswer]);

  // ── HOME ──
  if(screen==="home") return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",fontFamily:"'Fredoka One',cursive",position:"relative",overflow:"hidden",
      background:"linear-gradient(135deg,#0f0a2a 0%,#1e1060 50%,#0f0a2a 100%)"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');*{box-sizing:border-box;margin:0;padding:0;}button:active{transform:scale(0.95)!important;}`}</style>
      <AnimatedBackground/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:24,maxWidth:380,display:"flex",flexDirection:"column",justifyContent:"center",flex:1}}>
        <div style={{fontSize:62,marginBottom:6,filter:"drop-shadow(0 0 20px #FFD93D88)"}}>🧮</div>
        <div style={{background:"linear-gradient(135deg,#FF922B,#FFD93D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:"clamp(30px,7vw,54px)",fontWeight:700,lineHeight:1.1,marginBottom:2}}>Aprendemos</div>
        <div style={{background:"linear-gradient(135deg,#6BCB77,#4D96FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:"clamp(30px,7vw,54px)",fontWeight:700,marginBottom:14}}>Jugando 🎉</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:14,marginBottom:14}}>¡Jalar la Cuerda Matemática para 2 equipos!</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px', width: '100%', maxWidth: 420, padding: '0 10px' }}>
          <input
            type="text"
            value={teamNames.team1}
            onChange={(e) => setTeamNames(tn => ({ ...tn, team1: e.target.value.slice(0, 12) }))}
            placeholder="Equipo 1"
            style={{
              flex: 1, padding: '10px', borderRadius: '12px',
              border: '1px solid rgba(255, 146, 43, 0.5)', background: 'rgba(0, 0, 0, 0.3)',
              color: '#FF922B', textAlign: 'center', fontFamily: "'Fredoka One', cursive",
              fontSize: '15px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
            }}
          />
          <input
            type="text"
            value={teamNames.team2}
            onChange={(e) => setTeamNames(tn => ({ ...tn, team2: e.target.value.slice(0, 12) }))}
            placeholder="Equipo 2"
            style={{
              flex: 1, padding: '10px', borderRadius: '12px',
              border: '1px solid rgba(77, 150, 255, 0.5)', background: 'rgba(0, 0, 0, 0.3)',
              color: '#4D96FF', textAlign: 'center', fontFamily: "'Fredoka One', cursive",
              fontSize: '15px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
            }}
          />
        </div>
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"18px 20px",marginBottom:20}}>
          <div style={{color:"#FFD93D",fontWeight:700,fontSize:15,marginBottom:12}}>⚙️ Operaciones:</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
            {OPS.map(op=>(
              <button key={op.key} onClick={()=>toggleOp(op.key)} style={{
                background:selectedOps.includes(op.key)?"#FFD93D":"rgba(255,255,255,0.08)",
                color:selectedOps.includes(op.key)?"#333":"#fff",
                border:`2px solid ${selectedOps.includes(op.key)?"#FFD93D":"rgba(255,255,255,0.2)"}`,
                borderRadius:12,padding:"8px 14px",fontSize:14,cursor:"pointer",
                fontFamily:"'Fredoka One',cursive",transition:"all .2s",
              }}>{op.sym} {op.label}</button>
            ))}
          </div>
          <div style={{color:"rgba(255,255,255,0.35)",fontSize:11,marginTop:10}}>
            📌 {MAX_ATTEMPTS} intentos · {MAX_LIVES} vidas · Racha ×{POWER_STREAK} = ⚡ Power Up
          </div>
        </div>
        <img src={keyboardImage} alt="Indicaciones del teclado" style={{ width: '100%', maxWidth: '500px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', marginBottom: 20 }} />
        <button onClick={startGame} style={{background:"linear-gradient(135deg,#FF6B6B,#FF922B)",color:"#fff",border:"none",borderRadius:20,padding:"16px 52px",fontSize:22,fontFamily:"'Fredoka One',cursive",cursor:"pointer",boxShadow:"0 8px 28px rgba(255,107,107,0.5)"}}>🎮 ¡JUGAR!</button>
      </div>
    </div>
  );

  // ── RESULT ──
  if(screen==="result"){
    const winner=score.team1>score.team2?`${teamNames.team1} 🔴`:score.team2>score.team1?`${teamNames.team2} 🔵`:null;
    const msgs=winner?WIN_MSG(winner):DRAW_MSG;
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",position:"relative",background:"linear-gradient(135deg,#0f0a2a,#1e1060,#0f0a2a)",overflow:"hidden"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');*{box-sizing:border-box;}`}</style>
        <AnimatedBackground/><Confetti/>
        <div style={{position:"relative",zIndex:10,textAlign:"center",padding:24,maxWidth:420}}>
          <div style={{fontSize:72,marginBottom:8,filter:"drop-shadow(0 0 24px #FFD93D)"}}>🏆</div>
          {msgs.map((m,i)=>(
            <div key={i} style={{color:i===0?"#FFD93D":"#fff",fontSize:i===0?28:i===1?20:16,fontWeight:700,marginBottom:10,textShadow:i===0?"0 0 20px #FFD93D88":"none"}}>{m}</div>
          ))}
          <div style={{display:"flex",gap:16,justifyContent:"center",margin:"20px 0",flexWrap:"wrap"}}>
            {[{label:`${teamNames.team1} 🔴`,s:score.team1,c:"#FF922B"},{label:`${teamNames.team2} 🔵`,s:score.team2,c:"#4D96FF"}].map(t=>(
              <div key={t.label} style={{background:`${t.c}18`,border:`2px solid ${t.c}55`,borderRadius:16,padding:"14px 24px",color:"#fff",minWidth:130,backdropFilter:"blur(10px)"}}>
                <div style={{fontSize:13,color:t.c}}>{t.label}</div>
                <div style={{fontSize:44,fontWeight:700}}>{t.s}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>puntos</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={startGame} style={{background:"linear-gradient(135deg,#6BCB77,#4D96FF)",color:"#fff",border:"none",borderRadius:16,padding:"12px 28px",fontSize:18,cursor:"pointer",fontFamily:"'Fredoka One',cursive",boxShadow:"0 6px 20px rgba(77,150,255,0.4)"}}>🔄 Jugar de nuevo</button>
            <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,0.08)",color:"#fff",border:"1px solid rgba(255,255,255,0.2)",borderRadius:16,padding:"12px 24px",fontSize:18,cursor:"pointer",fontFamily:"'Fredoka One',cursive"}}>🏠 Inicio</button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ──
  const t1done=attempts.team1>=MAX_ATTEMPTS;
  const t2done=attempts.team2>=MAX_ATTEMPTS;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",background:"linear-gradient(135deg,#0f0a2a 0%,#1e1060 50%,#0f0a2a 100%)",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        *{box-sizing:border-box;}body{margin:0;}
        @media(max-width:620px){.game-row{flex-direction:column!important;align-items:center!important;}.tug-wrap{order:-1;width:100%!important;}}
      `}</style>
      <AnimatedBackground/>
      <div style={{position:"relative",zIndex:1,padding:"10px 14px",maxWidth:960,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8}}>
          <div style={{color:"#FFD93D",fontSize:20,fontWeight:700,textShadow:"0 0 12px #FFD93D55"}}>🧮 Aprendemos Jugando</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"4px 14px",color:"#fff",fontSize:13}}>
              ⏳ {Math.max(0,MAX_ATTEMPTS-Math.max(attempts.team1,attempts.team2))} intentos
            </div>
            <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"6px 14px",color:"#fff",cursor:"pointer",fontFamily:"'Fredoka One',cursive",fontSize:13}}>🏠</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {[{k:"team1",c:"#FF922B",s:score.team1},{k:"team2",c:"#4D96FF",s:score.team2}].map(({k,c,s})=>(
            <div key={k} style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:8,height:8,overflow:"hidden"}}>
              <div style={{height:"100%",background:c,width:`${(s/MAX_ATTEMPTS)*100}%`,transition:"width .5s",borderRadius:8,boxShadow:`0 0 8px ${c}88`}}/>
            </div>
          ))}
        </div>
        <div className="game-row" style={{display:"flex",gap:12,alignItems:"flex-start",justifyContent:"center"}}>
          {questions.team1&&(
            <QuestionCard name={`🔴 ${teamNames.team1}`} color="orange" score={score.team1} question={questions.team1}
              lives={lives.team1} streak={streaks.team1} onAnswer={c=>handleAnswer("team1",c)} disabled={busy.team1||t1done}
              answer={answers.team1}
              setAnswer={(val) => setAnswers(a => ({ ...a, team1: val }))}
              attempt={attempts.team1} />
          )}
          <div className="tug-wrap" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6,minWidth:220}}>
            <TugVisual ropePos={ropePos}
              team1={{lives:lives.team1,streak:streaks.team1,state:teamStates.team1}}
              team2={{lives:lives.team2,streak:streaks.team2,state:teamStates.team2}}
              lastEvent={lastEvent}/>
            <div style={{color:"rgba(255,255,255,0.3)",fontSize:11,textAlign:"center"}}>EDUTEC -UNIFSLB- CICLO VI</div>
          </div>
          {questions.team2&&(
            <QuestionCard name={`🔵 ${teamNames.team2}`} color="blue" score={score.team2} question={questions.team2}
              lives={lives.team2} streak={streaks.team2} onAnswer={c=>handleAnswer("team2",c)} disabled={busy.team2||t2done}
              answer={answers.team2}
              setAnswer={(val) => setAnswers(a => ({ ...a, team2: val }))}
              attempt={attempts.team2} />
          )}
        </div>
      </div>
    </div>
  );
}
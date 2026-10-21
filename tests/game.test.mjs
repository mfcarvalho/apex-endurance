// Integração da simulação real; apenas DOM, áudio e WebGL são substituídos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Three from '../three.module.js';
import * as core from '../race-core.js';
function game(){
  const elements=new Map(),events={};
  const noop=()=>{};
  const context2d=new Proxy({}, {get:()=>noop,set:()=>true});
  const element=()=>({classList:{add:noop,remove:noop},style:{},textContent:'',innerHTML:'',getContext:()=>context2d,addEventListener:noop});
  const document={querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s);},querySelectorAll:()=>[],createElement:element,body:element(),addEventListener:noop};
  class Renderer{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}setClearColor(){}render(){}}
  const context=vm.createContext({T:{...Three,WebGLRenderer:Renderer},...core,document,innerWidth:1280,innerHeight:720,devicePixelRatio:1,performance:{now:()=>0},requestAnimationFrame:noop,addEventListener:(name,fn)=>events[name]=fn,console});
  const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  vm.runInContext(source,context);
  return {run:code=>vm.runInContext(code,context),events};
}
test('controles, pausa, reinício, recuperação e câmeras',()=>{
  const g=game();g.run('startRace()');
  assert.equal(g.run('ai.every(a=>a.s<startS)'),true);
  g.run('simulate(1)');assert.equal(g.run('elapsed'),0);
  g.run('count=0;keys.w=true;for(let i=0;i<240;i++)simulate(STEP)');
  assert.ok(g.run('speed')>20);
  const yaw=g.run('yaw');g.run('keys.a=true;for(let i=0;i<20;i++)simulate(STEP)');assert.ok(g.run('yaw')>yaw);
  g.run('keys.a=false;keys.d=true;steer=0');const leftYaw=g.run('yaw');
  g.run('for(let i=0;i<20;i++)simulate(STEP)');assert.ok(g.run('yaw')<leftYaw);
  const moving=g.run('speed');g.run('keys.w=false;keys.d=false;keys.arrowdown=true;for(let i=0;i<30;i++)simulate(STEP)');assert.ok(g.run('speed')<moving);
  g.run('pause()');assert.equal(g.run('mode'),'pause');assert.equal(g.run('Object.keys(keys).length'),0);
  g.run('pause();startRace()');assert.equal(g.run('speed'),0);assert.equal(g.run('offroad'),false);assert.equal(g.run('cameraSnap'),true);
  g.run('count=0;player.position.set(900,0,900);simulate(STEP)');assert.equal(g.run('speed'),0);assert.equal(g.run('completed'),0);
  for(let i=0;i<3;i++){g.run(`camMode=${i};tick(${100+i*10})`);assert.equal(g.run('Number.isFinite(camera.position.x)&&Number.isFinite(camera.fov)'),true);}
});
test('sete adversários completam 3 voltas, sem sobreposição persistente',()=>{
  const g=game();g.run('startRace();count=0');
  const report=g.run(`(()=>{
    let minGap=Infinity;
    for(let i=0;i<120*300;i++){
      simulate(STEP);
      if(i%120===0)for(let a=0;a<ai.length;a++)for(let b=a+1;b<ai.length;b++){
        const gap=ai[a].mesh.position.distanceTo(ai[b].mesh.position);minGap=Math.min(minGap,gap);
      }
    }
    return {finished:ai.filter(a=>a.finishTime!==null).length,minGap,finite:ai.every(a=>Number.isFinite(a.s)&&Number.isFinite(a.lane)),completed};
  })()`);
  assert.equal(report.finite,true);assert.equal(report.completed,0);assert.equal(report.finished,7);
  assert.ok(report.minGap>3,`menor distância entre adversários: ${report.minGap}`);
});
test('jogador encerra exatamente após três circuitos válidos',()=>{
  const g=game();g.run('startRace();count=0');
  g.run(`for(let s=startS-31;s<=startS+3*L+1;s+=1){
    const q=at(s);player.position.copy(q.p);yaw=q.yaw;speed=0;simulate(STEP);
    if(mode==='finish')break;
  }`);
  assert.equal(g.run('completed'),3);assert.equal(g.run('mode'),'finish');assert.equal(g.run('Number.isFinite(best)'),true);
  const before=g.run('elapsed');g.run('tick(1000)');assert.equal(g.run('elapsed'),before);
});

test('mesma física a 30, 60 e 120 quadros por segundo',()=>{
  const states=[30,60,120].map(fps=>{
    const g=game();g.run('startRace();keys.arrowup=true');
    g.run(`for(let i=1;i<=10*${fps};i++)tick(i*1000/${fps})`);
    return g.run('[elapsed,speed,player.position.x,player.position.z]');
  });
  for(const state of states)for(let i=0;i<state.length;i++)assert.ok(Math.abs(state[i]-states[0][i])<1,`diferença de física: ${state[i]} / ${states[0][i]}`);
});

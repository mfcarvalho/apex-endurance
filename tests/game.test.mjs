import test from 'node:test';
import assert from 'node:assert/strict';
import {RaceSimulation} from '../src/race.js';
import {createTrack} from '../src/track.js';
import {RACE} from '../src/config.js';

const idle={accel:false,brake:false,steering:0};
const track=createTrack();
function advance(race, steps, input=idle) {
  for(let i=0;i<steps;i++)race.step(RACE.step,input);
}

test('largada, seleção, pausa, reinício e isolamento dos snapshots',()=>{
  const race=new RaceSimulation(track);
  race.selectCar(2);race.start();
  assert.equal(race.state.chosen,2);
  assert.ok(race.state.ai.every(a=>a.s<track.config.startS));
  advance(race,120);
  assert.equal(race.state.elapsed,0);
  const copy=race.state;copy.player.speed=999;copy.ai.length=0;
  assert.equal(race.state.player.speed,0);assert.equal(race.state.ai.length,7);
  advance(race,240);
  advance(race,240,{accel:true,brake:false,steering:0});
  assert.ok(race.state.player.speed>20);
  const before=race.state.elapsed;
  race.togglePause();advance(race,120);
  assert.equal(race.state.elapsed,before);
  race.togglePause();advance(race,120);
  assert.ok(race.state.elapsed>before);
  race.start();assert.equal(race.state.player.speed,0);assert.equal(race.state.completed,0);
  assert.equal(race.state.lapTime,0);assert.equal(race.state.best,Infinity);assert.equal(race.state.lapDelta,null);
  race.menu();assert.equal(race.mode,'menu');assert.equal(race.state.ai.length,0);
});

test('tráfego por 300 segundos: sete chegadas, sem volta gratuita do jogador',()=>{
  const race=new RaceSimulation(track,undefined,{...RACE,countdown:0});
  race.start();let minGap=Infinity;
  for(let i=0;i<120*300;i++) {
    race.step(RACE.step,idle);
    if(i%120===0) {
      const {ai}=race.state;
      for(let a=0;a<ai.length;a++)for(let b=a+1;b<ai.length;b++) {
        minGap=Math.min(minGap,Math.hypot(ai[a].x-ai[b].x,ai[a].z-ai[b].z));
      }
    }
  }
  const state=race.state;
  assert.equal(state.completed,0);
  assert.equal(state.ai.filter(a=>a.finishTime!==null).length,7);
  assert.ok(state.ai.every(a=>Number.isFinite(a.s)&&Number.isFinite(a.lane)));
  assert.ok(minGap>3,`distância mínima amostrada: ${minGap}`);
});

test('três voltas por comandos de pilotagem produzem resultado e congelam a corrida',()=>{
  const race=new RaceSimulation(track);race.start();
  let comparedDuringLap=false;
  // Condutor de teste: segue a curva usando a mesma API de entrada da física.
  // Não injeta posições, checkpoints ou contadores no estado.
  for(let i=0;i<120*400&&race.mode!=='finish';i++) {
    const state=race.state,p=state.player,target=track.at(state.lastS+15);
    if(state.completed>0 && Number.isFinite(state.lapDelta))comparedDuringLap=true;
    const desired=Math.atan2(target.p.x-p.x,target.p.z-p.z);
    const delta=Math.atan2(Math.sin(desired-p.yaw),Math.cos(desired-p.yaw));
    race.step(RACE.step,{accel:p.speed<30,brake:p.speed>34,steering:Math.max(-1,Math.min(1,delta*4))});
  }
  assert.equal(race.mode,'finish');assert.equal(race.state.completed,3);
  assert.equal(comparedDuringLap,true);
  assert.ok(Number.isFinite(race.state.best));
  assert.equal(race.ranking.length,8);
  assert.ok(race.state.lastLapTime>0);
  assert.equal(race.state.lapDelta,race.state.lastLapTime-race.state.best);
  const before=race.state;advance(race,120);assert.deepEqual(race.state,before);
  race.start();assert.equal(race.state.best,Infinity);assert.equal(race.state.lapDelta,null);assert.equal(race.state.lastLapTime,null);
});

test('portão perdido fora da pista não bloqueia a próxima volta nem salva tempo inválido',()=>{
  // Fixture: sinaliza saída de pista no primeiro portão da primeira volta.
  // A pilotagem continua pela API normal e só a consulta de superfície é controlada.
  const base=createTrack();let forceOffroad=true;
  const testTrack={...base,project(x,z){
    const near=base.project(x,z);
    const gate=base.config.startS+base.length/4;
    return forceOffroad && Math.abs(near.s-gate)<12 ? {...near,dist:12} : near;
  }};
  const race=new RaceSimulation(testTrack);race.start();
  let frozenTime=null,checkedReset=false,sawValidLap=false;
  for(let i=0;i<120*300 && race.mode!=='finish';i++) {
    const s=race.state,p=s.player,q=base.at(s.lastS+15);
    if(!s.lapValid) {
      if(frozenTime===null)frozenTime=s.lapTime;
      else assert.equal(s.lapTime,frozenTime);
      assert.equal(s.lapDelta,null);
    }
    if(s.completed===1 && !checkedReset) {
      assert.notEqual(frozenTime,null);
      assert.equal(s.lastLapValid,false);assert.equal(s.lastLapTime,null);
      assert.equal(s.best,Infinity);assert.equal(s.lapTime,0);
      assert.equal(s.lapValid,true);checkedReset=true;forceOffroad=false;
    }
    if(s.completed>=2) {
      assert.equal(s.lastLapValid,true);assert.ok(Number.isFinite(s.best));sawValidLap=true;
    }
    const desired=Math.atan2(q.p.x-p.x,q.p.z-p.z);
    const delta=Math.atan2(Math.sin(desired-p.yaw),Math.cos(desired-p.yaw));
    race.step(RACE.step,{accel:p.speed<30,brake:p.speed>34,steering:Math.max(-1,Math.min(1,delta*4))});
  }
  assert.equal(checkedReset,true);assert.equal(sawValidLap,true);
  assert.equal(race.state.completed,3);assert.equal(race.mode,'finish');
  race.start();assert.equal(race.state.lapValid,true);assert.equal(race.state.lastLapValid,null);
});

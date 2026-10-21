import test from 'node:test';
import assert from 'node:assert/strict';
import {LapTracker, rankRace} from '../src/rules.js';
import {projectTrack} from '../src/track.js';
import {trafficTarget} from '../src/opponents.js';
import {signedDistance} from '../src/math.js';

test('projeção contínua e passagem pela origem',()=>{
  const samples=[{p:{x:0,z:0}},{p:{x:100,z:0}},{p:{x:100,z:100}},{p:{x:0,z:100}}];
  assert.equal(projectTrack(samples,400,25,3).s,25);
  assert.equal(projectTrack(samples,400,25,3).dist,3);
  assert.equal(signedDistance(398,2,400),4);
});
function drive(tracker, from, to, valid=true){for(let s=from+1;s<=to;s++)tracker.update(s%400,valid,2);}
test('grid, três voltas completas e cruzamentos em ré',()=>{
  const t=new LapTracker(400,25,-7);
  drive(t,-7,25);assert.equal(t.completed,0);
  drive(t,25,425);assert.equal(t.completed,1);
  t.update(24,true,2);t.update(25,true,2);assert.equal(t.completed,1);
  drive(t,425,1225);assert.equal(t.completed,3);
});
test('corte descarta tempo; saltos não concedem chegadas',()=>{
  const t=new LapTracker(400,25,-7);
  drive(t,-7,25);drive(t,25,150,false);drive(t,150,425);
  assert.equal(t.completed,1);assert.equal(t.lastLapValid,false);
  t.update(220,true,2);assert.equal(t.completed,1);assert.equal(t.lapValid,false);
});
test('tráfego ultrapassa em faixa livre e freia com ambas ocupadas',()=>{
  const self={s:390,lane:2.8,baseLane:2.8,speed:40,targetSpeed:50};
  const leader={s:2,lane:2.8,speed:25};
  assert.equal(trafficTarget(self,[self,leader],400).lane,-3.8);
  const blocked=trafficTarget(self,[self,leader,{s:395,lane:-3.8,speed:20}],400);
  assert.equal(blocked.lane,2.8);assert.ok(blocked.speed<50);
});

test('classificação preserva chegadas e ordena os não finalizados por progresso',()=>{
  const state={elapsed:120,completed:2,travel:1900,ai:[
    {name:'A',s:8000,finishTime:110},
    {name:'B',s:10000,finishTime:115},
    {name:'C',s:1920,finishTime:null},
  ]};
  const before=structuredClone(state);
  assert.deepEqual(rankRace(state,25,3).map(a=>a.name),['A','B','VOCÊ','C']);
  assert.deepEqual(state,before);
  state.completed=3;state.elapsed=112;
  assert.deepEqual(rankRace(state,25,3).map(a=>a.name),['A','VOCÊ','B','C']);
});

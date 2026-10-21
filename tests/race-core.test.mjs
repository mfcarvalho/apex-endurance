import test from 'node:test';
import assert from 'node:assert/strict';
import {LapTracker, projectTrack, trafficTarget, signedDistance} from '../race-core.js';

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
test('atalhos, saltos e deslocamentos fora da pista não concedem volta',()=>{
  const t=new LapTracker(400,25,-7);
  drive(t,-7,25);drive(t,25,150,false);drive(t,150,425);
  assert.equal(t.completed,0);
  t.update(220,true,2);assert.equal(t.completed,0);
});
test('tráfego ultrapassa em faixa livre e freia com ambas ocupadas',()=>{
  const self={s:390,lane:2.8,baseLane:2.8,speed:40,targetSpeed:50};
  const leader={s:2,lane:2.8,speed:25};
  assert.equal(trafficTarget(self,[self,leader],400).lane,-3.8);
  const blocked=trafficTarget(self,[self,leader,{s:395,lane:-3.8,speed:20}],400);
  assert.equal(blocked.lane,2.8);assert.ok(blocked.speed<50);
});

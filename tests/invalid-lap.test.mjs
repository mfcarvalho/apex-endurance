import test from 'node:test';
import assert from 'node:assert/strict';
import {LapTracker} from '../src/rules.js';

function drive(tracker,from,to,valid=true){for(let s=from+1;s<=to;s++)tracker.update(s%400,valid,2);}

test('corte invalida o tempo, mas a linha inicia a próxima volta',()=>{
  const tracker=new LapTracker(400,25,-7);
  drive(tracker,-7,25);
  drive(tracker,25,150,false); // Perde o primeiro portão fora da pista.
  drive(tracker,150,425);
  assert.equal(tracker.completed,1);
  assert.equal(tracker.lastLapValid,false);
  assert.equal(tracker.lapValid,true);
  assert.equal(tracker.nextGate,1);
  drive(tracker,425,825);
  assert.equal(tracker.completed,2);
  assert.equal(tracker.lastLapValid,true);
});

test('ré e oscilações na linha não duplicam uma volta inválida',()=>{
  const tracker=new LapTracker(400,25,-7);
  drive(tracker,-7,25);
  tracker.update(24,true,2);tracker.update(25,true,2);
  assert.equal(tracker.completed,0);
  drive(tracker,25,200,false);drive(tracker,200,425);
  assert.equal(tracker.completed,1);
  for(let i=0;i<5;i++) {
    tracker.update(24,true,2);tracker.update(25,true,2);
    assert.equal(tracker.completed,1);
  }
});

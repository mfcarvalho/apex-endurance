import test from 'node:test';
import assert from 'node:assert/strict';
import {LapTiming} from '../src/lap-timing.js';

test('primeira volta sem delta; comparação interpolada no mesmo ponto da pista',()=>{
  const timing=new LapTiming(100);
  assert.equal(timing.update(-5,1),null);
  assert.equal(timing.update(0,2),null); // Inclui o deslocamento inicial do grid.
  timing.update(50,12);
  timing.update(100,21);
  timing.complete(22);
  assert.equal(timing.best,22);
  assert.equal(timing.update(25,6),-1); // Melhor: 7 s aos 25 m, não 22 s.
  assert.equal(timing.update(25,8),1);
  assert.equal(timing.update(30,9,false),null);
  assert.equal(timing.update(100,22),0);
});

test('volta mais lenta preserva a referência; volta mais rápida substitui',()=>{
  const timing=new LapTiming(100);
  timing.update(0,0);timing.update(50,10);timing.complete(20);
  timing.update(50,12);timing.complete(24);
  assert.equal(timing.best,20);
  assert.equal(timing.update(50,8),-2);
  timing.complete(16);
  assert.equal(timing.best,16);
  assert.equal(timing.update(50,9),1);
  const fresh=new LapTiming(100);
  assert.equal(fresh.best,Infinity);
  assert.equal(fresh.update(50,9),null);
});

test('voltar pela pista não regrava a referência do primeiro trajeto',()=>{
  const timing=new LapTiming(100);
  timing.update(0,0);timing.update(50,10);timing.update(25,15);
  timing.update(50,20);timing.complete(30);
  assert.equal(timing.update(25,5),0);
  assert.equal(timing.update(50,10),0);
});

test('tempo inválido é descartado sem substituir a melhor e sem contaminar a próxima volta',()=>{
  const timing=new LapTiming(100);
  timing.update(0,0);timing.update(50,10);timing.complete(20);
  timing.update(50,1);timing.complete(2,false);
  assert.equal(timing.best,20);
  assert.equal(timing.update(0,0),0);
  assert.equal(timing.update(50,12),2);
  timing.complete(24);
  assert.equal(timing.best,20);
  const noValidLap=new LapTiming(100);
  noValidLap.update(50,1);noValidLap.complete(2,false);
  assert.equal(noValidLap.best,Infinity);
  assert.equal(noValidLap.update(50,5),null);
});

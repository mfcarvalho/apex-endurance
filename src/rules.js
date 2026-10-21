import {wrap, signedDistance} from './math.js';

// Portões ordenados impedem atalhos, ré na linha e teleporte de conceder voltas.
export class LapTracker {
  constructor(length, start, gridS) {
    this.length = length;
    this.start = start;
    this.lastS = wrap(gridS, length);
    this.progress = signedDistance(start, gridS, length);
    this.nextGate = 1;
    this.completed = 0;
  }
  update(s, valid, maxStep) {
    const previous = this.lastS;
    const delta = signedDistance(previous, s, this.length);
    this.lastS = s;
    if (!valid || Math.abs(delta) > maxStep) return false;
    this.progress += delta;
    const gate = wrap(this.start + this.nextGate / 4 * this.length, this.length);
    const distanceToGate = wrap(gate - previous, this.length);
    if (delta <= 0 || distanceToGate <= 0 || distanceToGate > delta + 1e-7) return false;
    this.nextGate++;
    if (this.nextGate <= 4) return false;
    this.completed++;
    this.nextGate = 1;
    return true;
  }
}


// Não modifica os participantes nem a ordem recebida.
export function rankRace(state, startS, totalLaps) {
  return [
    ...state.ai.map(a => ({name:a.name,dist:a.s-startS,finishTime:a.finishTime})),
    {name:'VOCÊ',dist:state.travel,you:true,finishTime:state.completed>=totalLaps?state.elapsed:null},
  ].sort((a,b) => a.finishTime!==null && b.finishTime!==null ? a.finishTime-b.finishTime
    : a.finishTime!==null ? -1 : b.finishTime!==null ? 1 : b.dist-a.dist);
}

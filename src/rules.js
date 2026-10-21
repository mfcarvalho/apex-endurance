import {wrap, signedDistance} from './math.js';

// Portões validam o tempo. O avanço da corrida é independente da validade:
// uma volta cortada termina na linha e a próxima recebe novos portões.
export class LapTracker {
  constructor(length, start, gridS) {
    this.length=length;
    this.start=start;
    this.lastS=wrap(gridS,length);
    this.progress=signedDistance(start,gridS,length);
    this.lapProgress=this.progress;
    this.nextGate=1;
    this.completed=0;
    this.lapValid=true;
    this.lastLapValid=null;
  }
  update(s, valid, maxStep) {
    const previous=this.lastS;
    const delta=signedDistance(previous,s,this.length);
    this.lastS=s;
    const plausible=Math.abs(delta)<=maxStep;
    if (!valid || !plausible) this.lapValid=false;
    if (!plausible) return false; // Teleporte não concede percurso nem chegada.
    this.progress+=delta;
    this.lapProgress+=delta;
    if (delta<=0) return false;
    const crosses=gate=>{
      const distance=wrap(gate-previous,this.length);
      return distance>0 && distance<=delta+1e-7;
    };
    if (valid && this.nextGate<4 && crosses(wrap(this.start+this.nextGate/4*this.length,this.length))) {
      this.nextGate++;
    }
    // Percurso líquido mínimo exclui a saída do grid e oscilações na linha.
    // Os três portões intermediários continuam obrigatórios para um tempo válido.
    if (!valid || !crosses(this.start) || this.lapProgress<this.length/2) return false;
    this.lastLapValid=this.lapValid && this.nextGate===4;
    this.completed++;
    this.lapValid=true;
    this.nextGate=1;
    this.lapProgress=wrap(s-this.start,this.length);
    this.progress=this.completed*this.length+this.lapProgress;
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

import {CARS, RACE, PHYSICS} from './config.js';
import {LapTiming} from './lap-timing.js';
import {wrap} from './math.js';
import {LapTracker, rankRace} from './rules.js';
import {advancePlayer, collidePlayer} from './physics.js';
import {createOpponents, advanceOpponents} from './opponents.js';

// Único dono do estado de domínio. Leitores recebem cópias; alterações passam
// pelos comandos abaixo. Nem os modelos 3D nem a interface entram na simulação.
export class RaceSimulation {
  #state;
  #tracker;
  #timing;
  #track;
  #cars;
  #config;

  constructor(track, cars=CARS, config=RACE) {
    this.#track=track;
    this.#cars=cars;
    this.#config=config;
    this.#state={mode:'menu',chosen:0,elapsed:0,lapTime:0,best:Infinity,completed:0,lastLapTime:null,lapDelta:null,
      travel:0,lastS:0,count:3.6,gridRevision:0,cameraRevision:0,
      player:{x:0,z:0,yaw:0,roll:0,speed:0,steer:0,offroad:false,braking:false},ai:[]};
    this.#resetPlayer();
  }

  get state() { return structuredClone(this.#state); }
  get mode() { return this.#state.mode; }
  get ranking() { return rankRace(this.#state,this.#track.config.startS,this.#config.laps); }

  #resetPlayer() {
    const s=this.#state, q=this.#track.at(this.#track.config.startS-this.#track.config.playerGridOffset,this.#track.config.playerLane);
    Object.assign(s.player,{x:q.p.x,z:q.p.z,yaw:q.yaw,roll:0,braking:false});
    s.gridRevision++;
    s.cameraRevision++;
  }

  selectCar(index) {
    if (!this.#cars[index]) return;
    this.#state.chosen=index;
    this.#resetPlayer();
  }

  start() {
    const s=this.#state, track=this.#track;
    this.#resetPlayer();
    s.ai=createOpponents(track);
    Object.assign(s.player,{speed:0,steer:0,offroad:false,braking:false});
    Object.assign(s,{elapsed:0,lapTime:0,completed:0,count:this.#config.countdown,best:Infinity,lastLapTime:null,lapDelta:null,mode:'race'});
    this.#timing=new LapTiming(track.length,this.#config.timingSampleDistance);
    this.#tracker=new LapTracker(track.length,track.config.startS,track.config.startS-track.config.playerGridOffset);
    s.travel=this.#tracker.progress;
    s.lastS=this.#tracker.lastS;
  }

  menu() {
    this.#state.mode='menu';
    this.#state.ai=[];
    this.#resetPlayer();
  }

  togglePause() {
    if (this.mode==='race') this.#state.mode='pause';
    else if (this.mode==='pause') this.#state.mode='race';
  }

  step(dt, input) {
    if (this.mode!=='race') return;
    const s=this.#state, before=s.count;
    s.count-=dt;
    if (s.count>0) return;
    if (before>0) dt=-s.count;
    if (dt<=0) return;
    s.elapsed+=dt;
    s.lapTime+=dt;
    const movement=advancePlayer(s.player,input,this.#cars[s.chosen],this.#track,s.lastS,dt);
    s.ai=advanceOpponents(s.ai,movement.player,movement.near,this.#track,s.elapsed,this.#config.laps,dt);
    s.player=collidePlayer(movement.player,s.ai);
    const near=this.#track.project(s.player.x,s.player.z);
    s.player.offroad=near.dist>PHYSICS.roadLimit;
    const validTiming=!movement.recovered && near.dist<=PHYSICS.progressLimit;
    const crossed=this.#tracker.update(near.s,validTiming,
      Math.max(PHYSICS.minProgressStep,s.player.speed*dt+PHYSICS.progressMargin));
    s.travel=this.#tracker.progress;
    s.lastS=this.#tracker.lastS;
    if (movement.recovered) s.cameraRevision++;
    if (crossed) {
      this.#timing.complete(s.lapTime);
      s.lastLapTime=s.lapTime;
      s.best=this.#timing.best;
      s.lapTime=0;
      s.completed=this.#tracker.completed;
    }
    if (s.completed>=this.#config.laps) {
      s.mode='finish';
      s.lapDelta=s.lastLapTime-s.best;
    } else {
      // Comparação no mesmo ponto físico; o portão seguinte impede que uma
      // passagem em ré pela linha seja confundida com o final da volta.
      const distance=crossed ? 0 : wrap(near.s-this.#track.config.startS,this.#track.length);
      const inSequence=distance<=this.#tracker.nextGate/4*this.#track.length+PHYSICS.progressMargin;
      s.lapDelta=this.#timing.update(distance,s.lapTime,
        crossed || (validTiming && s.travel>=0 && inSequence));
    }
  }
}

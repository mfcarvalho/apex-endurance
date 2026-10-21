import {CARS, RACE, PHYSICS} from './config.js';
import {LapTracker, rankRace} from './rules.js';
import {advancePlayer, collidePlayer} from './physics.js';
import {createOpponents, advanceOpponents} from './opponents.js';

// Único dono do estado de domínio. Leitores recebem cópias; alterações passam
// pelos comandos abaixo. Nem os modelos 3D nem a interface entram na simulação.
export class RaceSimulation {
  #state;
  #tracker;
  #track;
  #cars;
  #config;

  constructor(track, cars=CARS, config=RACE) {
    this.#track=track;
    this.#cars=cars;
    this.#config=config;
    this.#state={mode:'menu',chosen:0,elapsed:0,lapTime:0,best:Infinity,completed:0,
      travel:0,lastS:0,count:3.6,gridRevision:0,cameraRevision:0,
      player:{x:0,z:0,yaw:0,roll:0,speed:0,steer:0,offroad:false},ai:[]};
    this.#resetPlayer();
  }

  get state() { return structuredClone(this.#state); }
  get mode() { return this.#state.mode; }
  get ranking() { return rankRace(this.#state,this.#track.config.startS,this.#config.laps); }

  #resetPlayer() {
    const s=this.#state, q=this.#track.at(this.#track.config.startS-this.#track.config.playerGridOffset,this.#track.config.playerLane);
    Object.assign(s.player,{x:q.p.x,z:q.p.z,yaw:q.yaw,roll:0});
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
    Object.assign(s.player,{speed:0,steer:0,offroad:false});
    Object.assign(s,{elapsed:0,lapTime:0,completed:0,count:this.#config.countdown,best:Infinity,mode:'race'});
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
    const crossed=this.#tracker.update(near.s,!movement.recovered && near.dist<=PHYSICS.progressLimit,
      Math.max(PHYSICS.minProgressStep,s.player.speed*dt+PHYSICS.progressMargin));
    s.travel=this.#tracker.progress;
    s.lastS=this.#tracker.lastS;
    if (movement.recovered) s.cameraRevision++;
    if (crossed) {
      s.best=Math.min(s.best,s.lapTime);
      s.lapTime=0;
      s.completed=this.#tracker.completed;
    }
    if (s.completed>=this.#config.laps) s.mode='finish';
  }
}

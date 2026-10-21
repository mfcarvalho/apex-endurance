import {CARS, RACE} from './src/config.js';
import {createRendering} from './src/rendering.js';
import {createTrack} from './src/track.js';
import {buildTrackScene} from './src/scenery.js';
import {createCarViews} from './src/cars.js';
import {RaceSimulation} from './src/race.js';
import {createCameras} from './src/cameras.js';
import {createControls} from './src/controls.js';
import {createInterface} from './src/interface.js';
import {createAudio} from './src/audio.js';

// Raiz de composição. Conecta adaptadores e comanda a ordem de atualização.
export function startGame() {
  const canvas=document.querySelector('#world');
  const rendering=createRendering(canvas);
  const track=createTrack();
  buildTrackScene(rendering.scene,track);
  const race=new RaceSimulation(track);
  const cars=createCarViews(rendering.scene,CARS);
  const cameras=createCameras(rendering.camera,track);
  const ui=createInterface(track,CARS);
  const audio=createAudio();
  const sync=(refreshHud=false)=>{
    const state=race.state;
    cars.sync(state);
    ui.sync(state,race.ranking,refreshHud);
    return state;
  };
  const start=()=>{controls.clear();audio.start();race.start();sync(true);};
  const pause=()=>{
    controls.clear();race.togglePause();
    if(race.mode==='pause')audio.silence();
    sync();
  };
  const actions={
    state:()=>race.state,
    start,
    menu:()=>{controls.clear();audio.silence();race.menu();sync();},
    pause,
    camera:()=>cameras.next(),
    selectCar:index=>{race.selectCar(index);sync();},
    sound:()=>ui.sound(audio.toggle()),
    restartKey:()=>{if(race.mode==='race')start();},
    blur:()=>{if(race.mode==='race')pause();},
  };
  const controls=createControls(actions);
  ui.bind(actions);
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();
    if(race.mode==='race')pause();
    ui.error('A renderização 3D foi interrompida. Recarregue a página para continuar.');
  });
  sync();
  let last=performance.now(),frame=0,accumulator=0;
  function tick(now) {
    requestAnimationFrame(tick);
    const dt=Math.min(Math.max(0,(now-last)/1000),RACE.maxFrameDelta);
    last=now;frame++;
    if(race.mode==='race') {
      accumulator+=dt;
      while(accumulator>=RACE.step && race.mode==='race') {
        const input=controls.read();
        race.step(RACE.step,input);
        accumulator-=RACE.step;
        const state=race.state;
        if(state.mode==='finish') {controls.clear();audio.silence();}
        else audio.update(state,input);
      }
    } else accumulator=0;
    const state=sync(frame%RACE.hudEvery===0);
    cameras.update(state,now,dt);
    rendering.render(state.player);
  }
  requestAnimationFrame(tick);
}

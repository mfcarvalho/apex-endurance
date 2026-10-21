import {CAMERAS as C} from './config.js';
import {damp} from './math.js';
import {V} from './rendering.js';

// Modo e interpolação pertencem à apresentação, não à física.
export function createCameras(camera, track) {
  let mode=0, revision=-1;
  const temp=V(0,0,0);
  return {
    next() {mode=(mode+1)%C.heights.length;},
    update(state, now, dt) {
      const player=state.player;
      if (state.mode==='menu') {
        const q=track.at(track.config.startS-track.config.playerGridOffset,track.config.playerLane), tm=now*.00012;
        camera.position.copy(q.p).add(V(Math.sin(tm)*10+9,5.5,Math.cos(tm)*9-4));
        camera.lookAt(q.p.clone().add(V(-1,1,0)));
        camera.fov=C.fov;
        camera.updateProjectionMatrix();
        return;
      }
      const position=V(player.x,0,player.z), f=V(Math.sin(player.yaw),0,Math.cos(player.yaw));
      temp.copy(position).addScaledVector(f,-C.distances[mode]).add(V(0,C.heights[mode],0));
      if (revision!==state.cameraRevision) {
        camera.position.copy(temp);
        camera.fov=C.fov;
        revision=state.cameraRevision;
      } else camera.position.lerp(temp,1-Math.exp(-C.damping*dt));
      camera.lookAt(position.clone().addScaledVector(f,C.lookAhead+player.speed*C.lookSpeed).add(V(0,1,0)));
      camera.fov=damp(camera.fov,C.fov+player.speed*C.fovSpeed,C.fovDamping,dt);
      camera.updateProjectionMatrix();
    },
  };
}

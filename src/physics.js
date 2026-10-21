import {PHYSICS as P} from './config.js';
import {clamp, damp} from './math.js';

// Funções puras: retornam novos dados, sem meshes, DOM ou estado compartilhado.
export function advancePlayer(current, input, spec, track, lastS, dt) {
  const player = {...current};
  let near = track.project(player.x, player.z);
  player.offroad = near.dist > P.roadLimit;
  player.speed += ((input.accel ? spec.power * (1-player.speed/(spec.max+P.powerHeadroom)) : 0)
    - (input.brake ? P.brake : 0) - P.rollingDrag - player.speed*player.speed*P.aeroDrag
    - (player.offroad ? player.speed*P.offroadDrag : 0))*dt;
  player.speed = clamp(player.speed, 0, spec.max);
  // Convenção original solicitada pelo usuário: A/esquerda aumenta yaw.
  player.steer = damp(player.steer, input.steering, P.steerDamping, dt);
  player.yaw += player.steer*player.speed/(P.steerBase+player.speed*P.steerSpeed)*spec.grip*dt;
  player.roll = -player.steer*player.speed*P.roll;
  player.x += Math.sin(player.yaw)*player.speed*dt;
  player.z += Math.cos(player.yaw)*player.speed*dt;
  near = track.project(player.x, player.z);
  const recovered = near.dist > P.recoveryDistance;
  if (recovered) {
    const q = track.at(lastS);
    Object.assign(player, {x:q.p.x,z:q.p.z,yaw:q.yaw,roll:0,speed:0,steer:0});
    near = track.project(player.x, player.z);
  }
  player.offroad = near.dist > P.roadLimit;
  return {player, near, recovered};
}

export function collidePlayer(current, opponents) {
  const player = {...current};
  for (const other of opponents) {
    const dx=player.x-other.x, dz=player.z-other.z, dist=Math.hypot(dx,dz);
    if (dist < P.collisionRadius) {
      const nx=dist>P.collisionEpsilon ? dx/dist : Math.cos(player.yaw);
      const nz=dist>P.collisionEpsilon ? dz/dist : -Math.sin(player.yaw);
      player.x += nx*(P.collisionRadius-dist);
      player.z += nz*(P.collisionRadius-dist);
      player.speed = Math.min(player.speed, other.speed*P.collisionSpeed);
    }
  }
  return player;
}

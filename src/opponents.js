import {OPPONENTS as A} from './config.js';
import {clamp, damp, wrap, signedDistance} from './math.js';

export function trafficTarget(car, cars, length) {
  const laneClear = candidate => cars.every(other => other === car
    || Math.abs(other.lane - candidate) >= A.laneWidth
    || Math.abs(signedDistance(car.s, other.s, length)) > A.returnClearance);
  let lane = laneClear(car.baseLane) ? car.baseLane : car.lane, target = car.targetSpeed;
  const ahead = cars.filter(other => other !== car && wrap(other.s - car.s, length) > 0
    && wrap(other.s - car.s, length) < A.trafficLookAhead && Math.abs(other.lane - car.lane) < A.laneWidth)
    .sort((a, b) => wrap(a.s - car.s, length) - wrap(b.s - car.s, length))[0];
  if (ahead) {
    const alternative = ahead.lane >= 0 ? -A.passingLane : A.passingLane;
    const clear = cars.every(other => other === car || Math.abs(other.lane - alternative) >= A.laneWidth
      || Math.abs(signedDistance(car.s, other.s, length)) > A.passingClearance);
    if (clear) lane = alternative;
    const gap = wrap(ahead.s - car.s, length);
    if (!clear || gap < A.brakeGap) target = Math.min(target, Math.max(0, ahead.speed + (gap - A.brakeGap) * A.gapResponse));
  }
  return {lane, speed: target};
}

export function createOpponents(track) {
  return A.names.map((name, id) => {
    const s=track.config.startS-A.gridOffset-Math.floor(id/2)*A.rowSpacing;
    const lane=id%2 ? A.gridLane : -A.gridLane;
    const q=track.at(s,lane);
    return {s,lane,baseLane:lane,pace:A.pace+id*A.paceStep,speed:0,name,id,
      color:A.colors[id],finishTime:null,x:q.p.x,z:q.p.z,yaw:q.yaw};
  });
}

export function advanceOpponents(current, player, near, track, elapsed, totalLaps, dt) {
  const opponents=current.map(a=>({...a}));
  const traffic=current.map(a=>({...a}));
  traffic.push({s:near.s,lane:near.lateral,speed:player.speed});
  const L=track.length;
  for (const a of opponents) {
    const q=track.at(a.s), future=track.at(a.s+A.lookAhead);
    const turn=Math.acos(clamp(q.t.dot(future.t),-1,1));
    const snapshot=traffic.find(other=>other.id===a.id);
    snapshot.targetSpeed=Math.max(A.minCornerSpeed,a.pace-turn*A.cornerPenalty);
    const target=trafficTarget(snapshot,traffic,L);
    a.speed=damp(a.speed,target.speed,A.speedDamping,dt);
    const leader=traffic.filter(other=>other!==snapshot && Math.abs(other.lane-a.lane)<A.laneWidth)
      .map(other=>({other,gap:wrap(other.s-a.s,L)}))
      .filter(item=>item.gap>0 && item.gap<A.brakeGap).sort((a,b)=>a.gap-b.gap)[0];
    if (leader) a.speed=Math.min(a.speed,Math.max(0,leader.other.speed+(leader.gap-A.separation)*A.gapResponse));
    a.previousS=a.s;
    a.s+=a.speed*dt;
    a.lane=damp(a.lane,target.lane,A.laneDamping,dt);
  }
  for (let pass=0;pass<opponents.length;pass++) {
    for (let i=0;i<opponents.length;i++) for (let j=i+1;j<opponents.length;j++) {
      const a=opponents[i], b=opponents[j], gap=signedDistance(a.s,b.s,L);
      if (Math.abs(a.lane-b.lane)<A.laneWidth && Math.abs(gap)<A.separation) {
        const behind=gap>=0?a:b, front=gap>=0?b:a;
        behind.s-=A.separation-Math.abs(gap);
        behind.speed=Math.min(behind.speed,front.speed);
      }
    }
  }
  for (const a of opponents) {
    if (a.finishTime===null && a.s>=track.config.startS+totalLaps*L) {
      a.finishTime=elapsed-dt+clamp((track.config.startS+totalLaps*L-a.previousS)/Math.max(a.s-a.previousS,.001),0,1)*dt;
    }
    const q=track.at(a.s,a.lane);
    Object.assign(a,{x:q.p.x,z:q.p.z,yaw:q.yaw});
  }
  return opponents;
}

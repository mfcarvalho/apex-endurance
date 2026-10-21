import * as T from '../three.module.js';
import {TRACK} from './config.js';
import {wrap} from './math.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);

// Geometria de referência, sem estado da corrida ou dependência do DOM.
export function createTrack(config = TRACK) {
  const pts=config.points.map(([x,z])=>V(x,0,z));
  const curve=new T.CatmullRomCurve3(pts,true,'centripetal');
  const N=config.samples, L=curve.getLength(), samples=[];
  for (let i=0;i<N;i++) {
    const p=curve.getPointAt(i/N), t=curve.getTangentAt(i/N);
    samples.push({p,t,n:V(t.z,0,-t.x)});
  }
  function at(s,lane=0) {
    const t=((s%L)+L)%L/L, p=curve.getPointAt(t), f=curve.getTangentAt(t);
    p.x+=f.z*lane;
    p.z-=f.x*lane;
    return {p,t:f,yaw:Math.atan2(f.x,f.z)};
  }
  // Consulta amostrada original usada somente na distribuição do cenário.
  function nearest(x,z) {
    let best=Infinity, index=0;
    for (let i=0;i<N;i+=2) {
      const p=samples[i].p, d=(x-p.x)**2+(z-p.z)**2;
      if (d<best) {best=d;index=i;}
    }
    const q=samples[index];
    return {dist:Math.sqrt(best),index,lateral:(x-q.p.x)*q.n.x+(z-q.p.z)*q.n.z};
  }
  return {config,samples,length:L,at,nearest,project:(x,z)=>projectTrack(samples,L,x,z)};
}

export function projectTrack(samples, length, x, z) {
  let best = Infinity, result;
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i].p, next = samples[(i + 1) % samples.length].p;
    const dx = next.x - p.x, dz = next.z - p.z;
    const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (z - p.z) * dz) / (dx * dx + dz * dz)));
    const px = p.x + dx * t, pz = p.z + dz * t;
    const dist2 = (x - px) ** 2 + (z - pz) ** 2;
    if (dist2 < best) {
      best = dist2;
      result = {s: wrap((i + t) / samples.length * length, length), x: px, z: pz,
        dist: Math.sqrt(best), lateral: ((x - px) * dz - (z - pz) * dx) / Math.hypot(dx, dz)};
    }
  }
  return result;
}


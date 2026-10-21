// Regras independentes do renderizador, em metros e segundos.
export const TOTAL_LAPS = 3;
export const STEP = 1 / 120;
export const wrap = (value, length) => ((value % length) + length) % length;
export const signedDistance = (from, to, length) => wrap(to - from + length / 2, length) - length / 2;

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

export function trafficTarget(car, cars, length) {
  const laneClear = candidate => cars.every(other => other === car
    || Math.abs(other.lane - candidate) >= 3.3
    || Math.abs(signedDistance(car.s, other.s, length)) > 10);
  let lane = laneClear(car.baseLane) ? car.baseLane : car.lane, target = car.targetSpeed;
  const ahead = cars.filter(other => other !== car && wrap(other.s - car.s, length) > 0
    && wrap(other.s - car.s, length) < 18 && Math.abs(other.lane - car.lane) < 3.3)
    .sort((a, b) => wrap(a.s - car.s, length) - wrap(b.s - car.s, length))[0];
  if (ahead) {
    const alternative = ahead.lane >= 0 ? -3.8 : 3.8;
    const clear = cars.every(other => other === car || Math.abs(other.lane - alternative) >= 3.3
      || Math.abs(signedDistance(car.s, other.s, length)) > 9);
    if (clear) lane = alternative;
    const gap = wrap(ahead.s - car.s, length);
    if (!clear || gap < 7) target = Math.min(target, Math.max(0, ahead.speed + (gap - 7) * 2));
  }
  return {lane, speed: target};
}

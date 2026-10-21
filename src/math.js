// Somente operações usadas por mais de um sistema.
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function damp(value, target, rate, dt) {
  const t = 1 - Math.exp(-rate * dt);
  return (1 - t) * value + t * target;
}
export const wrap = (value, length) => ((value % length) + length) % length;
export const signedDistance = (from, to, length) => wrap(to - from + length / 2, length) - length / 2;

// Unidades: metros, segundos e radianos; velocidade interna em m/s.
export const RACE = {laps: 3, step: 1 / 120, maxFrameDelta: .25, countdown: 3, goDuration: .8, hudEvery: 4, timingSampleDistance: 2};
export const TRACK = {
  name: 'Costa Dourada', samples: 900, startS: 25, playerGridOffset: 32, playerLane: 2.8,
  points: [[-180,-120],[-40,-120],[120,-120],[190,-65],[180,35],[115,75],[70,25],[5,55],[-25,150],[-125,165],[-200,100],[-205,-10]],
  seed: 12,
};
export const CARS = [
  {name:'VORTEX R',desc:'Motor central · 540 cv · equilibrado',color:0xe7e5d8,accent:0xe8733f,power:21,max:77,grip:1.12,body:0},
  {name:'FALCON V8',desc:'Motor dianteiro · 580 cv · potência',color:0x466c7a,accent:0xdfff66,power:23,max:81,grip:1.02,body:1},
  {name:'SPECTRE RS',desc:'Motor traseiro · 520 cv · agilidade',color:0xb65e47,accent:0xe5d7b1,power:20,max:75,grip:1.23,body:2},
];
export const PHYSICS = {
  powerHeadroom: 15, brake: 36, rollingDrag: 1.5, aeroDrag: .0009, offroadDrag: .65,
  roadLimit: 8.4, progressLimit: 10, recoveryDistance: 36, steerDamping: 7,
  steerBase: 12, steerSpeed: .62, roll: .0009, collisionRadius: 3.1,
  collisionSpeed: .9, collisionEpsilon: .01, minProgressStep: 2, progressMargin: 4,
};
export const OPPONENTS = {
  names: ['SILVA','ROSSI','MÜLLER','KIM','COSTA','DUBOIS','SATO'],
  colors: [0xdbb645,0x6c9a91,0xad5b43,0xe4e0ce,0x577f9a,0x858864,0xae8b93],
  pace: 49, paceStep: .75, gridOffset: 8, rowSpacing: 8, gridLane: 2.8,
  lookAhead: 24, minCornerSpeed: 23, cornerPenalty: 47, speedDamping: 1.4,
  laneDamping: 2, laneWidth: 3.3, returnClearance: 10, passingClearance: 9,
  passingLane: 3.8, trafficLookAhead: 18, brakeGap: 7, separation: 6, gapResponse: 2,
};
export const CAMERAS = {
  fov: 53, heights: [5,2.5,13], distances: [10,5.5,16], damping: 5,
  fovSpeed: .13, fovDamping: 2, lookAhead: 7, lookSpeed: .06,
};

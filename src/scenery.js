import * as T from '../three.module.js';
import {box, mat} from './rendering.js';

// Cenário costeiro original: apenas geometria, sem regras da corrida.
export function buildTrackScene(scene, track) {
  const {config, samples, length:L, at, nearest} = track;
  const N = samples.length;
  const asphalt=mat(0x3f4c4b),white=mat(0xe8e9d3),red=mat(0xbf6246),dark=mat(0x172b2c);
  function ribbon(a,b,material,y=.035) {
    const arr=[];
    for (let i=0;i<N;i++) {
      for (const idx of [i,(i+1)%N]) {
        const {p,n}=samples[idx];
        for (const v of [a,b]) arr.push(p.x+n.x*v,y,p.z+n.z*v);
      }
    }
    const geo=new T.BufferGeometry(), pos=[], norm=[];
    for (let i=0;i<arr.length;i+=12) {
      for (const j of [0,2,1,1,2,3]) {
        pos.push(...arr.slice(i+j*3,i+j*3+3));
        norm.push(0,1,0);
      }
    }
    geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));
    const mesh=new T.Mesh(geo,material);
    mesh.receiveShadow=true;
    scene.add(mesh);
  }
  const ground=new T.Mesh(new T.PlaneGeometry(2300,2300),mat(0x939e62));
  ground.rotation.x=-Math.PI/2;
  ground.position.y=-.08;
  ground.receiveShadow=true;
  scene.add(ground);
  ribbon(-12,12,mat(0xa6a281));
  ribbon(-8.5,8.5,asphalt,.05);
  ribbon(-8.15,-7.95,white,.075);
  ribbon(7.95,8.15,white,.075);
  for (let i=0;i<N;i+=5) for (const side of [-1,1]) {
    const q=samples[i];
    const mesh=box(scene,q.p.x+q.n.x*side*8.8,.06,q.p.z+q.n.z*side*8.8,.95,.1,L/N*5.1,Math.floor(i/5)%2?white:red);
    mesh.rotation.y=Math.atan2(q.t.x,q.t.z);
  }
  const sea=new T.Mesh(new T.PlaneGeometry(1600,2000),mat(0x64a8a7,{metalness:.2,roughness:.4}));
  sea.rotation.x=-Math.PI/2;
  sea.position.set(1060,-.24,0);
  scene.add(sea);
  let seed=config.seed;
  function random() {
    seed=(seed*1664525+1013904223)>>>0;
    return seed/4294967296;
  }
  for (let i=0;i<370;i++) {
    const x=random()*850-450, z=random()*850-410;
    if (x>265||nearest(x,z).dist<20) continue;
    const h=5+random()*11, tree=new T.Group();
    box(tree,0,h*.25,0,.65,h*.5,.65,mat(0x6f7251));
    const crown=new T.Mesh(new T.IcosahedronGeometry(h*.36,0),mat([0x5e805e,0x788b5c,0x426e5d,0x9d9d65][i%4]));
    crown.scale.set(.85,1.35,.9);
    crown.position.y=h*.7;
    tree.add(crown);
    tree.position.set(x,0,z);
    crown.castShadow=true;
    scene.add(tree);
  }
  for (let i=0;i<30;i++) {
    const mesh=new T.Mesh(new T.ConeGeometry(70+random()*100,60+random()*140,5),mat(i%2?0x819784:0x9da58c));
    mesh.position.set(-650+random()*1200,-10,400+random()*170);
    scene.add(mesh);
  }
  // Boxes, pórtico, marcas de largada e arquibancada.
  for (let i=0;i<10;i++) {
    box(scene,-140+i*14,3.7,-146,13,7.5,16,mat(0xd6ccb0));
    box(scene,-140+i*14,3,-137.8,10,4,.15,dark);
    box(scene,-140+i*14,8,-146,13.5,1,17,mat(0x8e9f91));
  }
  const startS=config.startS,start=at(startS);
  const gantry=new T.Group();
  box(gantry,-12,5,0,.5,10,.7,white);
  box(gantry,12,5,0,.5,10,.7,white);
  box(gantry,0,9.8,0,25,2,.7,dark);
  for(let i=0;i<5;i++)box(gantry,-4+i*2,9.7,-.45,.6,.6,.3,mat(0xdbff66));
  gantry.position.copy(start.p);
  gantry.rotation.y=start.yaw;
  scene.add(gantry);
  for (let a=0;a<16;a++) for (let b=0;b<3;b++) {
    const q=at(startS+b*.65,a-7.5);
    const mesh=box(scene,q.p.x,.09,q.p.z,1,.035,.65,(a+b)%2?dark:white);
    mesh.rotation.y=q.yaw;
  }
  for (let r=0;r<6;r++) box(scene,-70,1+r*.9,-93+r*1.25,110,.7,1.5,mat(r%2?0xcfc8af:0x6b7e74));
}

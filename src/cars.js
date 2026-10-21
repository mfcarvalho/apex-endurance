import * as T from '../three.module.js';
import {box, mat} from './rendering.js';

export function createCar(spec,num) {
  const dark=mat(0x172b2c),glass=mat(0x15383e,{metalness:.4,roughness:.25}),rubber=mat(0x171e20);
  const g=new T.Group(),paint=mat(spec.color,{metalness:.25,roughness:.48}),accent=mat(spec.accent,{metalness:.1});
  box(g,0,.63,0,2.05,.65,4.5,paint);
  box(g,0,.98,spec.body===1?.35:0,1.8,.35,2.25,paint);
  box(g,0,1.27,-.2,1.52,.4,1.65,glass);
  box(g,0,1.5,-.3,1.55,.12,1.2,paint);
  box(g,0,.34,2.2,2.2,.13,.42,dark);
  box(g,0,.42,-2.18,2.1,.2,.35,dark);
  box(g,0,.99,1.35,.3,.08,1.55,accent);
  box(g,-.65,1.25,-1.9,.1,.65,.13,dark);
  box(g,.65,1.25,-1.9,.1,.65,.13,dark);
  box(g,0,1.6,-1.94,2.5,.12,.58,dark);
  for (const side of [-1,1]) {
    box(g,side*1.035,.75,0,.03,.3,2.7,accent);
    box(g,side*.72,.86,2.22,.5,.13,.05,mat(0xffefb5,{emissive:0xffd27d,emissiveIntensity:.5}));
    box(g,side*.72,.83,-2.26,.5,.1,.05,mat(0xff3311,{emissive:0xff2211,emissiveIntensity:.6}));
    for (const z of [-1.45,1.4]) {
      const wheel=new T.Mesh(new T.CylinderGeometry(.45,.45,.33,12),rubber);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(side*1.02,.46,z);
      g.add(wheel);
      const hub=new T.Mesh(new T.CylinderGeometry(.26,.26,.35,8),mat(0xb1b7ac,{metalness:.7}));
      hub.rotation.z=Math.PI/2;
      hub.position.copy(wheel.position);
      g.add(hub);
    }
  }
  const cn=document.createElement('canvas');
  cn.width=128;
  cn.height=128;
  const ctx=cn.getContext('2d');
  ctx.fillStyle='#e9edda';
  ctx.fillRect(0,0,128,128);
  ctx.fillStyle='#132c30';
  ctx.font='bold 86px Arial';
  ctx.textAlign='center';
  ctx.fillText(num,64,95);
  const tex=new T.CanvasTexture(cn);
  const plate=new T.Mesh(new T.PlaneGeometry(.78,.78),new T.MeshBasicMaterial({map:tex}));
  plate.rotation.x=-Math.PI/2;
  plate.position.set(.5,1.18,1.1);
  g.add(plate);
  const shadow=new T.Mesh(new T.PlaneGeometry(2.6,4.9),new T.MeshBasicMaterial({color:0x0d2424,transparent:true,opacity:.22,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=.02;
  g.add(shadow);
  return g;
}

export function disposeCar(mesh) {
  mesh.removeFromParent();
  const materials = new Set(), textures = new Set();
  mesh.traverse(node => {
    if (!node.isMesh) return;
    node.geometry.dispose();
    materials.add(node.material);
  });
  for (const material of materials) {
    if (material.map) textures.add(material.map);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}

// Possui apenas meshes; transformações vêm de snapshots da simulação.
export function createCarViews(scene, specs) {
  let revision = -1, player, opponents = [];
  return {
    sync(state) {
      if (revision !== state.gridRevision) {
        if (player) disposeCar(player);
        opponents.forEach(disposeCar);
        player = createCar(specs[state.chosen], '27');
        opponents = state.ai.map(a => createCar({...specs[a.id % specs.length], color:a.color}, String(11+a.id*7)));
        scene.add(player, ...opponents);
        revision = state.gridRevision;
      }
      const transform = (mesh, car) => {
        mesh.position.set(car.x, 0, car.z);
        mesh.rotation.set(0, car.yaw, car.roll || 0);
      };
      transform(player, state.player);
      opponents.forEach((mesh, i) => transform(mesh, state.ai[i]));
    },
  };
}

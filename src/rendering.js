import * as T from '../three.module.js';

export const mat = (color, other = {}) => new T.MeshStandardMaterial({color, roughness: .88, ...other});
export const V = (x, y, z) => new T.Vector3(x, y, z);
export function box(parent, x, y, z, w, h, d, material) {
  const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createRendering(canvas) {
  const renderer = new T.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0xabc9bd);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new T.Scene();
  scene.fog = new T.Fog(0xb8c8af, 180, 850);
  const camera = new T.PerspectiveCamera(53, innerWidth / innerHeight, .2, 2000);
  scene.add(new T.HemisphereLight(0xffebcb, 0x56785d, 2.4));
  const sun = new T.DirectionalLight(0xffd8a1, 3.1);
  sun.position.set(-120, 180, -90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {left:-180,right:180,top:180,bottom:-180,near:1,far:500});
  sun.shadow.bias = -.001;
  scene.add(sun, sun.target);
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });
  return {
    scene, camera,
    render(player) {
      sun.position.set(player.x - 120, 180, player.z - 90);
      sun.target.position.set(player.x, 0, player.z);
      renderer.render(scene, camera);
    },
  };
}

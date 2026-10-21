import * as T from './three.module.js';
import {TOTAL_LAPS, STEP, wrap, signedDistance, projectTrack, LapTracker, trafficTarget} from './race-core.js?v=3';
const $=s=>document.querySelector(s),hide=s=>$(s).classList.add('hidden'),show=s=>$(s).classList.remove('hidden');
const renderer=new T.WebGLRenderer({canvas:$('#world'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0xabc9bd);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const scene=new T.Scene();scene.fog=new T.Fog(0xb8c8af,180,850);const camera=new T.PerspectiveCamera(53,innerWidth/innerHeight,.2,2000);scene.add(new T.HemisphereLight(0xffebcb,0x56785d,2.4));const sun=new T.DirectionalLight(0xffd8a1,3.1);sun.position.set(-120,180,-90);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-180,right:180,top:180,bottom:-180,near:1,far:500});sun.shadow.bias=-.001;scene.add(sun);scene.add(sun.target);
const mat=(color,other={})=>new T.MeshStandardMaterial({color,roughness:.88,...other});const asphalt=mat(0x3f4c4b),white=mat(0xe8e9d3),red=mat(0xbf6246),dark=mat(0x172b2c),glass=mat(0x15383e,{metalness:.4,roughness:.25}),rubber=mat(0x171e20);const V=(x,y,z)=>new T.Vector3(x,y,z);
function box(parent,x,y,z,w,h,d,m){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
const pts=[[-180,-120],[-40,-120],[120,-120],[190,-65],[180,35],[115,75],[70,25],[5,55],[-25,150],[-125,165],[-200,100],[-205,-10]].map(([x,z])=>V(x,0,z));const curve=new T.CatmullRomCurve3(pts,true,'centripetal');const N=900,L=curve.getLength(),samples=[];for(let i=0;i<N;i++){const p=curve.getPointAt(i/N),t=curve.getTangentAt(i/N);samples.push({p,t,n:V(t.z,0,-t.x)});}function at(s,lane=0){const t=((s%L)+L)%L/L,p=curve.getPointAt(t),f=curve.getTangentAt(t);p.x+=f.z*lane;p.z-=f.x*lane;return {p,t:f,yaw:Math.atan2(f.x,f.z)};}
function ribbon(a,b,material,y=.035){const arr=[];for(let i=0;i<N;i++){for(const idx of [i,(i+1)%N]){const {p,n}=samples[idx];for(const v of [a,b])arr.push(p.x+n.x*v,y,p.z+n.z*v);} }const geo=new T.BufferGeometry(),pos=[],norm=[];for(let i=0;i<arr.length;i+=12){for(const j of [0,2,1,1,2,3]){pos.push(...arr.slice(i+j*3,i+j*3+3));norm.push(0,1,0);}}geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));const mesh=new T.Mesh(geo,material);mesh.receiveShadow=true;scene.add(mesh);}
const ground=new T.Mesh(new T.PlaneGeometry(2300,2300),mat(0x939e62));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);ribbon(-12,12,mat(0xa6a281));ribbon(-8.5,8.5,asphalt,.05);ribbon(-8.15,-7.95,white,.075);ribbon(7.95,8.15,white,.075);
for(let i=0;i<N;i+=5){for(const side of [-1,1]){const q=samples[i],mesh=box(scene,q.p.x+q.n.x*side*8.8,.06,q.p.z+q.n.z*side*8.8,.95,.1,L/N*5.1,Math.floor(i/5)%2?white:red);mesh.rotation.y=Math.atan2(q.t.x,q.t.z);}}
const sea=new T.Mesh(new T.PlaneGeometry(1600,2000),mat(0x64a8a7,{metalness:.2,roughness:.4}));sea.rotation.x=-Math.PI/2;sea.position.set(1060,-.24,0);scene.add(sea);
let seed=12;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}function nearest(x,z){let best=Infinity,index=0;for(let i=0;i<N;i+=2){const p=samples[i].p,d=(x-p.x)**2+(z-p.z)**2;if(d<best){best=d;index=i;}}const q=samples[index];return {dist:Math.sqrt(best),index,lateral:(x-q.p.x)*q.n.x+(z-q.p.z)*q.n.z};}
for(let i=0;i<370;i++){let x=random()*850-450,z=random()*850-410;if(x>265||nearest(x,z).dist<20)continue;const h=5+random()*11;const tree=new T.Group();box(tree,0,h*.25,0,.65,h*.5,.65,mat(0x6f7251));const crown=new T.Mesh(new T.IcosahedronGeometry(h*.36,0),mat([0x5e805e,0x788b5c,0x426e5d,0x9d9d65][i%4]));crown.scale.set(.85,1.35,.9);crown.position.y=h*.7;tree.add(crown);tree.position.set(x,0,z);crown.castShadow=true;scene.add(tree);}
for(let i=0;i<30;i++){const m=new T.Mesh(new T.ConeGeometry(70+random()*100,60+random()*140,5),mat(i%2?0x819784:0x9da58c));m.position.set(-650+random()*1200,-10,400+random()*170);scene.add(m);}
// Pit buildings, gantry, grid markings and grandstand.
for(let i=0;i<10;i++){box(scene,-140+i*14,3.7,-146,13,7.5,16,mat(0xd6ccb0));box(scene,-140+i*14,3,-137.8,10,4,.15,dark);box(scene,-140+i*14,8,-146,13.5,1,17,mat(0x8e9f91));}
const startS=25,start=at(startS);const gantry=new T.Group();box(gantry,-12,5,0,.5,10,.7,white);box(gantry,12,5,0,.5,10,.7,white);box(gantry,0,9.8,0,25,2,.7,dark);for(let i=0;i<5;i++)box(gantry,-4+i*2,9.7,-.45,.6,.6,.3,mat(0xdbff66));gantry.position.copy(start.p);gantry.rotation.y=start.yaw;scene.add(gantry);
for(let a=0;a<16;a++)for(let b=0;b<3;b++){const q=at(startS+b*.65,(a-7.5));const m=box(scene,q.p.x,.09,q.p.z,1,.035,.65,(a+b)%2?dark:white);m.rotation.y=q.yaw;}
for(let r=0;r<6;r++)box(scene,-70,1+r*.9,-93+r*1.25,110,.7,1.5,mat(r%2?0xcfc8af:0x6b7e74));
const specs=[{name:'VORTEX R',desc:'Motor central · 540 cv · equilibrado',color:0xe7e5d8,accent:0xe8733f,power:21,max:77,grip:1.12,body:0},{name:'FALCON V8',desc:'Motor dianteiro · 580 cv · potência',color:0x466c7a,accent:0xdfff66,power:23,max:81,grip:1.02,body:1},{name:'SPECTRE RS',desc:'Motor traseiro · 520 cv · agilidade',color:0xb65e47,accent:0xe5d7b1,power:20,max:75,grip:1.23,body:2}];
function car(spec,num){const g=new T.Group(),paint=mat(spec.color,{metalness:.25,roughness:.48}),accent=mat(spec.accent,{metalness:.1});box(g,0,.63,0,2.05,.65,4.5,paint);box(g,0,.98,spec.body===1?.35:0,1.8,.35,2.25,paint);box(g,0,1.27,-.2,1.52,.4,1.65,glass);box(g,0,1.5,-.3,1.55,.12,1.2,paint);box(g,0,.34,2.2,2.2,.13,.42,dark);box(g,0,.42,-2.18,2.1,.2,.35,dark);box(g,0,.99,1.35,.3,.08,1.55,accent);box(g,-.65,1.25,-1.9,.1,.65,.13,dark);box(g,.65,1.25,-1.9,.1,.65,.13,dark);box(g,0,1.6,-1.94,2.5,.12,.58,dark);for(const side of [-1,1]){box(g,side*1.035,.75,0,.03,.3,2.7,accent);box(g,side*.72,.86,2.22,.5,.13,.05,mat(0xffefb5,{emissive:0xffd27d,emissiveIntensity:.5}));box(g,side*.72,.83,-2.26,.5,.1,.05,mat(0xff3311,{emissive:0xff2211,emissiveIntensity:.6}));for(const z of [-1.45,1.4]){const w=new T.Mesh(new T.CylinderGeometry(.45,.45,.33,12),rubber);w.rotation.z=Math.PI/2;w.position.set(side*1.02,.46,z);g.add(w);const hub=new T.Mesh(new T.CylinderGeometry(.26,.26,.35,8),mat(0xb1b7ac,{metalness:.7}));hub.rotation.z=Math.PI/2;hub.position.copy(w.position);g.add(hub);}}
const cn=document.createElement('canvas');cn.width=128;cn.height=128;const ctx=cn.getContext('2d');ctx.fillStyle='#e9edda';ctx.fillRect(0,0,128,128);ctx.fillStyle='#132c30';ctx.font='bold 86px Arial';ctx.textAlign='center';ctx.fillText(num,64,95);const tex=new T.CanvasTexture(cn);const plate=new T.Mesh(new T.PlaneGeometry(.78,.78),new T.MeshBasicMaterial({map:tex}));plate.rotation.x=-Math.PI/2;plate.position.set(.5,1.18,1.1);g.add(plate);const shadow=new T.Mesh(new T.PlaneGeometry(2.6,4.9),new T.MeshBasicMaterial({color:0x0d2424,transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;g.add(shadow);return g;}
function disposeCar(mesh) {
  scene.remove(mesh);
  const materials = new Set(), textures = new Set();
  mesh.traverse(node => {
    if (!node.isMesh) return;
    node.geometry.dispose();
    if (![dark, glass, rubber].includes(node.material)) materials.add(node.material);
  });
  for (const material of materials) {
    if (material.map) textures.add(material.map);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}
let tracker, cameraSnap=true;
let chosen=0,player=car(specs[0],'27');scene.add(player);const names=['SILVA','ROSSI','MÜLLER','KIM','COSTA','DUBOIS','SATO'];let ai=[];let mode='menu',elapsed=0,lapTime=0,best=Infinity,completed=0,travel=0,speed=0,yaw=0,steer=0,lastS=0,count=3.6,camMode=0,offroad=false;const keys={};let soundOn=false,audio,osc,gain;
function silence(){if(gain){gain.gain.cancelScheduledValues(audio.currentTime);gain.gain.setValueAtTime(0,audio.currentTime);}}
function audioInit(){if(!audio){audio=new AudioContext();osc=audio.createOscillator();gain=audio.createGain();osc.type='sawtooth';gain.gain.value=0;osc.connect(gain);gain.connect(audio.destination);osc.start();}audio.resume().catch(error=>console.warn('Áudio suspenso:',error));}
$('#sound').onclick=()=>{
  try{
    audioInit();soundOn=!soundOn;if(!soundOn)silence();
    $('#sound').textContent=soundOn?'SOM ON':'SOM OFF';
    $('#sound').setAttribute('aria-label',soundOn?'Desativar som':'Ativar som');
  }catch(error){console.warn('Áudio indisponível:',error);soundOn=false;silence();$('#sound').textContent='SOM OFF';}
};
$('#full').onclick=async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else await document.documentElement.requestFullscreen?.();
  }catch(error){console.warn('Tela cheia indisponível:',error);}
};
function setPlayer(){disposeCar(player);player=car(specs[chosen],'27');scene.add(player);const q=at(startS-32,2.8);cameraSnap=true;player.position.copy(q.p);yaw=q.yaw;player.rotation.y=yaw;$('#selectedName').textContent=specs[chosen].name+' / GT3';$('#carLabel small').textContent=specs[chosen].desc;}
function garage(){hide('#menu');hide('#sceneLabel');show('#garagePanel');$('#cars').innerHTML=specs.map((s,i)=>`<button class="carOption ${i===chosen?'selected':''}" data-car="${i}"><i style="background:#${s.color.toString(16)}"></i><b>${s.name} / GT3</b><small>${s.desc}</small></button>`).join('');document.querySelectorAll('[data-car]').forEach(b=>b.onclick=()=>{chosen=+b.dataset.car;setPlayer();garage();});}$('#garage').onclick=garage;$('#garageDone').onclick=()=>{hide('#garagePanel');show('#menu');show('#sceneLabel');};
function clearKeys(){for(const key in keys)delete keys[key];}
function startRace(){
  clearKeys();silence();
  for(const a of ai)disposeCar(a.mesh);
  ai=[];setPlayer();
  for(let i=0;i<7;i++){
    const sp={...specs[i%3],color:[0xdbb645,0x6c9a91,0xad5b43,0xe4e0ce,0x577f9a,0x858864,0xae8b93][i]};
    const mesh=car(sp,String(11+i*7));scene.add(mesh);
    const s=startS-8-Math.floor(i/2)*8,lane=i%2?2.8:-2.8;
    ai.push({mesh,s,lane,baseLane:lane,pace:49+i*.75,speed:0,name:names[i],id:i,finishTime:null});
    const q=at(s,lane);mesh.position.copy(q.p);mesh.rotation.y=q.yaw;
  }
  speed=0;steer=0;offroad=false;elapsed=0;lapTime=0;completed=0;
  tracker=new LapTracker(L,startS,startS-32);travel=tracker.progress;lastS=tracker.lastS;
  count=3;best=Infinity;mode='race';document.body.classList.add('racing');
  ['#menu','#garagePanel','#sceneLabel','#carLabel','#result','#pausePanel'].forEach(hide);
  show('#hud');show('#countdown');$('#countdown').textContent='3';
  if(soundOn)audioInit();updateHud();
}
$('#start').onclick=startRace;$('#again').onclick=startRace;$('#restart').onclick=startRace;
function menu(){clearKeys();for(const a of ai)disposeCar(a.mesh);ai=[];mode='menu';silence();document.body.classList.remove('racing');['#hud','#result','#pausePanel','#countdown'].forEach(hide);show('#menu');show('#sceneLabel');show('#carLabel');setPlayer();}$('#back').onclick=menu;$('#resultBack').onclick=menu;
function pause(){clearKeys();if(mode==='race'){mode='pause';show('#pausePanel');silence();}else if(mode==='pause'){mode='race';hide('#pausePanel');}}$('#pause').onclick=pause;$('#resume').onclick=pause;$('#camera').onclick=()=>camMode=(camMode+1)%3;
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys[k]=true;if(e.repeat)return;if(k==='p'||k==='escape')pause();if(k==='r'&&mode==='race')startRace();if(k==='c')camMode=(camMode+1)%3;});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{clearKeys();if(mode==='race')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='race')pause();});document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[b.dataset.key]=false;});
const mm=$('#map').getContext('2d');function minimap(){mm.clearRect(0,0,210,160);mm.lineWidth=4;mm.strokeStyle='#e8edcf60';mm.beginPath();for(let i=0;i<N;i+=5){const p=samples[i].p,x=(p.x+230)*.42+10,y=(p.z+145)*.42+10;if(i===0)mm.moveTo(x,y);else mm.lineTo(x,y);}mm.closePath();mm.stroke();for(const a of [...ai,{mesh:player,you:true}]){const p=a.mesh.position;mm.beginPath();mm.arc((p.x+230)*.42+10,(p.z+145)*.42+10,a.you?4:2.4,0,Math.PI*2);mm.fillStyle=a.you?'#dbff66':'#e7e5d8';mm.fill();}}
const clockText=t=>{const ms=Math.floor(t*1000);return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;};
function ranking(){return [...ai.map(a=>({name:a.name,dist:a.s-startS,finishTime:a.finishTime})),{name:'VOCÊ',dist:travel,you:true,finishTime:completed>=TOTAL_LAPS?elapsed:null}].sort((a,b)=>a.finishTime!==null&&b.finishTime!==null?a.finishTime-b.finishTime:a.finishTime!==null?-1:b.finishTime!==null?1:b.dist-a.dist);}
function updateHud(){const order=ranking(),pos=order.findIndex(a=>a.you)+1;$('#pos').innerHTML=pos+'<span>/ 8</span>';$('#lap').textContent=Math.min(3,completed+1)+' / 3';$('#timer').textContent=clockText(elapsed);$('#speed').textContent=String(Math.round(speed*3.6)).padStart(3,'0');const gear=speed<1?'N':Math.min(6,1+Math.floor(speed/14));$('#gear').textContent=gear;$('#rev').style.width=Math.min(100,25+(speed%14)/14*75)+'%';$('#drivingStatus').textContent=offroad?'FORA DA PISTA · ADERÊNCIA REDUZIDA':best<Infinity?'MELHOR VOLTA '+clockText(best):'CONTROLE DE TRAÇÃO ATIVO';$('#drivingStatus').style.color=offroad?'#ffc285':'';$('#leaderboard').innerHTML=order.map((a,i)=>`<div class="rankrow ${a.you?'you':''}"><span>${String(i+1).padStart(2,'0')} &nbsp; ${a.name}</span><span>${a.you?'27':'GT3'}</span></div>`).join('');minimap();}
function finish(){clearKeys();mode='finish';silence();const pos=ranking().findIndex(a=>a.you)+1;$('#resultTitle').textContent=pos===1?'O topo é seu.':`P${pos}. Até a última curva.`;$('#resultText').textContent=`Tempo total ${clockText(elapsed)}. Melhor volta ${clockText(best)}. ${specs[chosen].name} / GT3.`;show('#result');}
function simulate(dt){
  const before=count;count-=dt;
  if(count>0)return;
  if(before>0)dt=-count;
  if(dt<=0)return;
  elapsed+=dt;lapTime+=dt;
  const accel=keys.w||keys.arrowup,brake=keys.s||keys.arrowdown,spec=specs[chosen];
  let near=projectTrack(samples,L,player.position.x,player.position.z);
  offroad=near.dist>8.4;
  speed+=((accel?spec.power*(1-speed/(spec.max+15)):0)-(brake?36:0)-1.5-speed*speed*.0009-(offroad?speed*.65:0))*dt;
  speed=T.MathUtils.clamp(speed,0,spec.max);
  const input=(keys.a||keys.arrowleft?1:0)-(keys.d||keys.arrowright?1:0);
  steer=T.MathUtils.damp(steer,input,7,dt);
  yaw+=steer*speed/(12+speed*.62)*spec.grip*dt;
  player.rotation.y=yaw;player.rotation.z=-steer*speed*.0009;
  player.position.x+=Math.sin(yaw)*speed*dt;player.position.z+=Math.cos(yaw)*speed*dt;
  near=projectTrack(samples,L,player.position.x,player.position.z);
  let recovered=false;
  if(near.dist>36){
    const q=at(lastS);player.position.copy(q.p);yaw=q.yaw;player.rotation.set(0,yaw,0);
    speed=0;steer=0;cameraSnap=true;recovered=true;
    near=projectTrack(samples,L,player.position.x,player.position.z);
  }
  offroad=near.dist>8.4;
  // Todos decidem a partir do mesmo estado de tráfego.
  const traffic=ai.map(a=>({...a}));
  traffic.push({s:near.s,lane:near.lateral,speed});
  for(const a of ai){
    const q=at(a.s),future=at(a.s+24),turn=Math.acos(T.MathUtils.clamp(q.t.dot(future.t),-1,1));
    const snapshot=traffic.find(other=>other.id===a.id);
    snapshot.targetSpeed=Math.max(23,a.pace-turn*47);
    const target=trafficTarget(snapshot,traffic,L);
    a.speed=T.MathUtils.damp(a.speed,target.speed,1.4,dt);
    // Não atravessar o carro da frente durante uma mudança de faixa.
    const leader=traffic.filter(other=>other!==snapshot&&Math.abs(other.lane-a.lane)<3.3)
      .map(other=>({other,gap:wrap(other.s-a.s,L)})).filter(item=>item.gap>0&&item.gap<7)
      .sort((a,b)=>a.gap-b.gap)[0];
    if(leader)a.speed=Math.min(a.speed,Math.max(0,leader.other.speed+(leader.gap-6)*2));
    a.previousS=a.s;a.s+=a.speed*dt;
    a.lane=T.MathUtils.damp(a.lane,target.lane,2,dt);
  }
  // Resolver encontros também durante transições laterais e ao dar uma volta.
  for(let pass=0;pass<ai.length;pass++)for(let i=0;i<ai.length;i++)for(let j=i+1;j<ai.length;j++){
    const a=ai[i],b=ai[j],gap=signedDistance(a.s,b.s,L);
    if(Math.abs(a.lane-b.lane)<3.3&&Math.abs(gap)<6){
      const behind=gap>=0?a:b,front=gap>=0?b:a;
      behind.s-=6-Math.abs(gap);behind.speed=Math.min(behind.speed,front.speed);
    }
  }
  for(const a of ai){
    if(a.finishTime===null&&a.s>=startS+TOTAL_LAPS*L){
      a.finishTime=elapsed-dt+T.MathUtils.clamp((startS+TOTAL_LAPS*L-a.previousS)/Math.max(a.s-a.previousS,.001),0,1)*dt;
    }
    const qp=at(a.s,a.lane);a.mesh.position.copy(qp.p);a.mesh.rotation.y=qp.yaw;
    const dx=player.position.x-qp.p.x,dz=player.position.z-qp.p.z,dist=Math.hypot(dx,dz);
    if(dist<3.1){
      const nx=dist>.01?dx/dist:Math.cos(yaw),nz=dist>.01?dz/dist:-Math.sin(yaw);
      player.position.x+=nx*(3.1-dist);player.position.z+=nz*(3.1-dist);
      speed=Math.min(speed,a.speed*.9);
    }
  }
  near=projectTrack(samples,L,player.position.x,player.position.z);
  offroad=near.dist>8.4;
  const crossed=tracker.update(near.s,!recovered&&near.dist<=10,Math.max(2,speed*dt+4));
  travel=tracker.progress;lastS=tracker.lastS;
  if(crossed){best=Math.min(best,lapTime);lapTime=0;completed=tracker.completed;}
  if(completed>=TOTAL_LAPS){finish();updateHud();return;}
  if(audio&&soundOn){
    osc.frequency.setTargetAtTime(40+speed*3.8+(speed%14)*5,audio.currentTime,.08);
    gain.gain.setTargetAtTime(.018+(accel?.012:0),audio.currentTime,.1);
  }
}
let last=performance.now(),frame=0,accumulator=0;
const temp=new T.Vector3();
function tick(now){
  requestAnimationFrame(tick);
  const dt=Math.min(Math.max(0,(now-last)/1000),.25);last=now;frame++;
  if(mode==='race'){
    accumulator+=dt;
    while(accumulator>=STEP&&mode==='race'){simulate(STEP);accumulator-=STEP;}
    if(count>0)$('#countdown').textContent=Math.ceil(count);
    else if(count>-.8)$('#countdown').textContent='VAI!';
    else hide('#countdown');
    if(frame%4===0)updateHud();
  }else accumulator=0;
  if(mode==='menu'){
    const q=at(startS-32,2.8),tm=now*.00012;
    camera.position.copy(q.p).add(V(Math.sin(tm)*10+9,5.5,Math.cos(tm)*9-4));
    camera.lookAt(q.p.clone().add(V(-1,1,0)));camera.fov=53;camera.updateProjectionMatrix();
  }else{
    const f=V(Math.sin(yaw),0,Math.cos(yaw)),height=[5,2.5,13][camMode],distance=[10,5.5,16][camMode];
    temp.copy(player.position).addScaledVector(f,-distance).add(V(0,height,0));
    if(cameraSnap){camera.position.copy(temp);camera.fov=53;cameraSnap=false;}
    else camera.position.lerp(temp,1-Math.exp(-5*dt));
    camera.lookAt(player.position.clone().addScaledVector(f,7+speed*.06).add(V(0,1,0)));
    camera.fov=T.MathUtils.damp(camera.fov,53+speed*.13,2,dt);camera.updateProjectionMatrix();
  }
  sun.position.copy(player.position).add(V(-120,180,-90));sun.target.position.copy(player.position);
  renderer.render(scene,camera);
}
setPlayer();requestAnimationFrame(tick);addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

$('#world').addEventListener('webglcontextlost',e=>{e.preventDefault();if(mode==='race')pause();$('#error').textContent='A renderização 3D foi interrompida. Recarregue a página para continuar.';show('#error');});

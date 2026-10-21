import {RACE, OPPONENTS} from './config.js';

const $=selector=>document.querySelector(selector);
const hide=selector=>$(selector).classList.add('hidden');
const show=selector=>$(selector).classList.remove('hidden');
function clockText(t) {
  const ms=Math.floor(t*1000);
  return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;
}

export function createInterface(track, specs, raceConfig=RACE) {
  let previousMode, garageOpen=false, garageRevision=-1, actions;
  const mm=$('#map').getContext('2d');
  function minimap(state) {
    mm.clearRect(0,0,210,160);
    mm.lineWidth=4;mm.strokeStyle='#e8edcf60';mm.beginPath();
    for (let i=0;i<track.samples.length;i+=5) {
      const p=track.samples[i].p,x=(p.x+230)*.42+10,y=(p.z+145)*.42+10;
      if(i===0)mm.moveTo(x,y);else mm.lineTo(x,y);
    }
    mm.closePath();mm.stroke();
    for (const car of [...state.ai,{...state.player,you:true}]) {
      mm.beginPath();mm.arc((car.x+230)*.42+10,(car.z+145)*.42+10,car.you?4:2.4,0,Math.PI*2);
      mm.fillStyle=car.you?'#dbff66':'#e7e5d8';mm.fill();
    }
  }
  function garage(state) {
    garageRevision=state.gridRevision;
    hide('#menu');hide('#sceneLabel');show('#garagePanel');
    $('#cars').innerHTML=specs.map((s,i)=>`<button class="carOption ${i===state.chosen?'selected':''}" data-car="${i}"><i style="background:#${s.color.toString(16)}"></i><b>${s.name} / GT3</b><small>${s.desc}</small></button>`).join('');
    document.querySelectorAll('[data-car]').forEach(button=>button.onclick=()=>actions.selectCar(+button.dataset.car));
  }
  function hud(state, order) {
    const player=state.player, speed=player.speed, laps=raceConfig.laps;
    $('#pos').innerHTML=(order.findIndex(a=>a.you)+1)+`<span>/ ${order.length}</span>`;
    $('#lap').textContent=Math.min(laps,state.completed+1)+' / '+laps;
    $('#timer').textContent=clockText(state.elapsed);
    $('#speed').textContent=String(Math.round(speed*3.6)).padStart(3,'0');
    $('#gear').textContent=speed<1?'N':Math.min(6,1+Math.floor(speed/14));
    $('#rev').style.width=Math.min(100,25+(speed%14)/14*75)+'%';
    $('#drivingStatus').textContent=player.offroad?'FORA DA PISTA · ADERÊNCIA REDUZIDA':state.best<Infinity?'MELHOR VOLTA '+clockText(state.best):'CONTROLE DE TRAÇÃO ATIVO';
    $('#drivingStatus').style.color=player.offroad?'#ffc285':'';
    $('#leaderboard').innerHTML=order.map((a,i)=>`<div class="rankrow ${a.you?'you':''}"><span>${String(i+1).padStart(2,'0')} &nbsp; ${a.name}</span><span>${a.you?'27':'GT3'}</span></div>`).join('');
    minimap(state);
  }
  return {
    bind(commands) {
      actions=commands;
      $('#menu .mode small').textContent=`${raceConfig.laps} voltas · ${OPPONENTS.names.length+1} carros · pôr do sol`;
      $('#sceneLabel h2').textContent=track.config.name;
      $('.mapWrap small').textContent=track.config.name.toUpperCase();
      const bindings={start:'start',again:'start',restart:'start',back:'menu',resultBack:'menu',pause:'pause',resume:'pause',camera:'camera',sound:'sound'};
      for (const [id,command] of Object.entries(bindings)) $('#'+id).onclick=actions[command];
      $('#garage').onclick=()=>{garageOpen=true;garage(actions.state());};
      $('#garageDone').onclick=()=>{garageOpen=false;hide('#garagePanel');show('#menu');show('#sceneLabel');};
      $('#full').onclick=async()=>{
        try {
          if(document.fullscreenElement)await document.exitFullscreen();
          else await document.documentElement.requestFullscreen?.();
        }catch(error){console.warn('Tela cheia indisponível:',error);}
      };
    },
    sync(state, order, refreshHud=false) {
      const spec=specs[state.chosen];
      $('#selectedName').textContent=spec.name+' / GT3';
      $('#carLabel small').textContent=spec.desc;
      if (state.mode!==previousMode) {
        document.body.classList.toggle('racing',state.mode!=='menu');
        ['#menu','#garagePanel','#sceneLabel','#carLabel','#result','#pausePanel','#hud','#countdown'].forEach(hide);
        if (state.mode==='menu') {
          show('#menu');show('#sceneLabel');show('#carLabel');
          if(garageOpen)garage(state);
        } else {
          garageOpen=false;show('#hud');
          if(state.mode==='pause')show('#pausePanel');
          if(state.mode==='finish') {
            const pos=order.findIndex(a=>a.you)+1;
            $('#resultTitle').textContent=pos===1?'O topo é seu.':`P${pos}. Até a última curva.`;
            $('#resultText').textContent=`Tempo total ${clockText(state.elapsed)}. Melhor volta ${clockText(state.best)}. ${spec.name} / GT3.`;
            show('#result');
          }
        }
        previousMode=state.mode;
        refreshHud=true;
      }
      if (state.mode==='race' || state.mode==='pause') {
        if(state.count>0){show('#countdown');$('#countdown').textContent=Math.ceil(state.count);}
        else if(state.count>-raceConfig.goDuration){show('#countdown');$('#countdown').textContent='VAI!';}
        else hide('#countdown');
      }
      if(garageOpen && garageRevision!==state.gridRevision)garage(state);
      if(refreshHud)hud(state,order);
    },
    sound(enabled) {
      $('#sound').textContent=enabled?'SOM ON':'SOM OFF';
      $('#sound').setAttribute('aria-label',enabled?'Desativar som':'Ativar som');
    },
    error(message) {$('#error').textContent=message;show('#error');},
  };
}

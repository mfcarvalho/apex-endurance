// Estado de entrada pertence a este adaptador; comandos não alteram a corrida.
export function createControls(actions) {
  const keys={};
  function clear() { for (const key in keys) delete keys[key]; }
  addEventListener('keydown', e => {
    const key=e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
    keys[key]=true;
    if (e.repeat) return;
    if (key==='p' || key==='escape') actions.pause();
    if (key==='r') actions.restartKey();
    if (key==='c') actions.camera();
  });
  addEventListener('keyup', e=>keys[e.key.toLowerCase()]=false);
  addEventListener('blur', ()=>{clear();actions.blur();});
  document.addEventListener('visibilitychange', ()=>{if(document.hidden)actions.blur();});
  document.querySelectorAll('[data-key]').forEach(button=>{
    button.onpointerdown=e=>{
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      keys[button.dataset.key]=true;
    };
    button.onpointerup=button.onpointercancel=button.onlostpointercapture=()=>keys[button.dataset.key]=false;
  });
  return {
    clear,
    read:()=>({accel:!!(keys.w||keys.arrowup),brake:!!(keys.s||keys.arrowdown),
      steering:(keys.a||keys.arrowleft?1:0)-(keys.d||keys.arrowright?1:0)}),
  };
}

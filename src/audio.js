// Possui apenas AudioContext/nós e a preferência de som, não estado da corrida.
export function createAudio() {
  let enabled=false, audio, osc, gain;
  function init() {
    if (!audio) {
      audio=new AudioContext();
      osc=audio.createOscillator();
      gain=audio.createGain();
      osc.type='sawtooth';
      gain.gain.value=0;
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
    }
    audio.resume().catch(error=>console.warn('Áudio suspenso:',error));
  }
  function silence() {
    if (gain) {
      gain.gain.cancelScheduledValues(audio.currentTime);
      gain.gain.setValueAtTime(0,audio.currentTime);
    }
  }
  return {
    toggle() {
      try {init();enabled=!enabled;if(!enabled)silence();}
      catch(error) {console.warn('Áudio indisponível:',error);enabled=false;silence();}
      return enabled;
    },
    start() {silence();if(enabled)init();},
    silence,
    update(state, input) {
      if (state.mode==='race' && state.count<=0 && audio && enabled) {
        const speed=state.player.speed;
        osc.frequency.setTargetAtTime(40+speed*3.8+(speed%14)*5,audio.currentTime,.08);
        gain.gain.setTargetAtTime(.018+(input.accel?.012:0),audio.currentTime,.1);
      }
    },
  };
}

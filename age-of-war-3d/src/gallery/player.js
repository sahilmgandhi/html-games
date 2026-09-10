const DURATIONS = [3, 2, 2];
const LABELS = ['Walk', 'Attack', 'Idle'];

// Pure clip-playback state for the gallery showcase: auto-cycles
// walk/attack/idle until a manual setPhase pauses it. DOM/three-free.
export function createPhasePlayer(durations = DURATIONS, labels = LABELS) {
  let phase = 0;
  let phaseT = 0;
  let auto = true;
  return {
    get phase() { return phase; },
    get auto() { return auto; },
    get label() { return labels[phase]; },
    update(dt) {
      if (!auto) return;
      phaseT += dt;
      if (phaseT > durations[phase]) {
        phaseT = 0;
        phase = (phase + 1) % durations.length;
      }
    },
    setPhase(i) {
      phase = ((i % durations.length) + durations.length) % durations.length;
      phaseT = 0;
      auto = false;
    },
    setAuto(on) {
      auto = !!on;
      phaseT = 0;
    },
  };
}

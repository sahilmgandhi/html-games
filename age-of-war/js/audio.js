class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicNodes = [];
    this.musicTimer = null;
    this.currentAgeIndex = 0;
    this.musicSection = 0;
    this.ambientNodes = [];
    this.ambientTimer = null;
    this.currentAmbient = -1;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }

  startMusic(ageIndex) {
    this.stopMusic();
    if (!this.ctx || !this.musicEnabled) return;
    this.currentAgeIndex = ageIndex;
    this.musicPlaying = true;
    this.musicSection = 0;
    this.playMusicLoop(ageIndex);
    this.startAmbient(ageIndex);
  }

  stopMusic() {
    this.musicPlaying = false;
    this.stopAmbient();
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    for (const node of this.musicNodes) {
      try { node.stop(); } catch (e) {}
    }
    this.musicNodes = [];
  }

  updateMusicAge(ageIndex) {
    if (this.musicPlaying && ageIndex !== this.currentAgeIndex) {
      this.currentAgeIndex = ageIndex;
      if (this.musicEnabled) {
        this.stopMusic();
        this.startMusic(ageIndex);
      }
    }
  }

  noteFreq(root, scale, degree) {
    const oct = Math.floor(degree / scale.length);
    const idx = ((degree % scale.length) + scale.length) % scale.length;
    return root * Math.pow(2, (scale[idx] + oct * 12) / 12);
  }

  playMusicLoop(ageIndex) {
    if (!this.musicPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;

    const MUSIC = [
      { // Age 0: Stone Age — Tribal, primal
        bpm: 82, root: 55,
        scale: [0, 3, 5, 7, 10],
        bassWave: 'sine', padWave: 'sine', melWave: 'triangle',
        bassVol: 0.04, padVol: 0.015, melVol: 0.03,
        padCutoff: 350,
        bass: [0,-1,-1,-1, 0,-1,-1,-1, 3,-1,-1,-1, 0,-1,-1,-1],
        mel:  [4,-1,3,-1, 2,-1,0,-1, 4,-1,3,-1, 2,-1,0,-1],
        pad:  [[0,2,4],[0,2,4],[1,3,4],[2,4,5]],
        perc: [0,-1,-1,-1, 0,-1,-1,-1, 0,-1,-1,-1, 0,-1,-1,-1],
      },
      { // Age 1: Castle Age — Medieval, Dorian
        bpm: 100, root: 73.4,
        scale: [0, 2, 3, 5, 7, 9, 10],
        bassWave: 'triangle', padWave: 'sine', melWave: 'triangle',
        bassVol: 0.035, padVol: 0.015, melVol: 0.028,
        padCutoff: 500,
        bass: [0,-1,3,-1, 5,-1,3,-1, 0,-1,5,-1, 3,-1,0,-1],
        mel:  [0,-1,2,-1, 3,-1,5,-1, 4,-1,3,-1, 2,-1,0,-1],
        pad:  [[0,2,4],[1,3,5],[2,4,6],[0,2,4]],
        perc: [0,-1,1,-1, 0,-1,1,-1, 0,-1,1,-1, 0,-1,0,-1],
      },
      { // Age 2: Renaissance — Baroque counterpoint
        bpm: 108, root: 82.4,
        scale: [0, 2, 3, 5, 7, 8, 10],
        bassWave: 'triangle', padWave: 'sawtooth', melWave: 'sine',
        bassVol: 0.03, padVol: 0.012, melVol: 0.025,
        padCutoff: 600,
        bass: [0,-1,3,-1, 5,-1,3,-1, 0,-1,5,-1, 3,-1,0,-1],
        mel:  [6,-1,5,-1, 4,-1,2,-1, 3,-1,4,-1, 2,-1,0,-1],
        pad:  [[0,2,4],[3,5,0],[1,3,5],[0,2,4]],
        perc: [0,-1,2,1, 0,-1,2,-1, 0,-1,2,1, 0,-1,2,-1],
      },
      { // Age 3: Modern Age — Orchestral, harmonic minor
        bpm: 118, root: 98,
        scale: [0, 2, 3, 5, 7, 8, 11],
        bassWave: 'sawtooth', padWave: 'sawtooth', melWave: 'square',
        bassVol: 0.025, padVol: 0.01, melVol: 0.02,
        padCutoff: 800,
        bass: [0,-1,0,-1, 5,-1,3,-1, 0,-1,5,-1, 3,-1,0,-1],
        mel:  [6,-1,5,-1, 4,-1,2,-1, 5,-1,4,-1, 3,-1,0,-1],
        pad:  [[0,2,4],[3,5,0],[4,6,1],[0,2,4]],
        perc: [0,-1,2,1, 0,-1,2,-1, 0,2,2,1, 0,-1,2,-1],
      },
      { // Age 4: Future Age — Electronic, Lydian
        bpm: 128, root: 110,
        scale: [0, 2, 4, 6, 7, 9, 11],
        bassWave: 'sawtooth', padWave: 'sawtooth', melWave: 'sine',
        bassVol: 0.025, padVol: 0.01, melVol: 0.022,
        padCutoff: 1000,
        bass: [0,-1,0,-1, 3,-1,0,-1, 5,-1,3,-1, 0,-1,0,-1],
        mel:  [6,-1,5,-1, 4,-1,2,-1, 5,-1,4,-1, 3,-1,2,-1],
        pad:  [[0,2,4],[3,5,1],[4,6,2],[0,2,4]],
        perc: [0,2,1,2, 0,2,1,2, 0,2,1,2, 0,2,1,2],
      },
    ];

    const cfg = MUSIC[ageIndex];
    const beat = 60 / cfg.bpm;
    const totalDur = 16 * beat;

    // — Bass voice —
    cfg.bass.forEach((deg, i) => {
      if (deg < 0) return;
      const t = now + i * beat;
      const freq = this.noteFreq(cfg.root, cfg.scale, deg);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = cfg.bassWave;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(cfg.bassVol, t + 0.02);
      gain.gain.setValueAtTime(cfg.bassVol, t + beat * 0.7);
      gain.gain.linearRampToValueAtTime(0, t + beat * 0.95);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + beat);
      this.musicNodes.push(osc);
    });

    // — Pad voice (4 bars, one chord each) —
    cfg.pad.forEach((chord, bar) => {
      const t = now + bar * 4 * beat;
      const dur = 4 * beat;
      chord.forEach(deg => {
        const freq = this.noteFreq(cfg.root * 2, cfg.scale, deg);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = cfg.padWave;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cfg.padCutoff, t);
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(cfg.padVol, t + 0.4);
        gain.gain.setValueAtTime(cfg.padVol, t + dur - 0.4);
        gain.gain.linearRampToValueAtTime(0, t + dur);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
        this.musicNodes.push(osc);
      });
    });

    // — Melody voice —
    cfg.mel.forEach((deg, i) => {
      if (deg < 0) return;
      const t = now + i * beat;
      const freq = this.noteFreq(cfg.root * 4, cfg.scale, deg);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = cfg.melWave;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(cfg.melVol, t + 0.03);
      gain.gain.setValueAtTime(cfg.melVol * 0.6, t + beat * 0.5);
      gain.gain.linearRampToValueAtTime(0, t + beat * 0.9);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + beat);
      this.musicNodes.push(osc);
    });

    // — Percussion voice —
    cfg.perc.forEach((type, i) => {
      const t = now + i * beat;
      if (type === 0) {
        this.scheduleKick(t);
      } else if (type === 1) {
        this.scheduleSnare(t);
      } else if (type === 2) {
        this.scheduleHihat(t);
      }
    });

    this.musicTimer = setTimeout(() => {
      this.musicNodes = [];
      this.musicSection = (this.musicSection + 1) % 4;
      this.playMusicLoop(ageIndex);
    }, totalDur * 1000);
  }

  scheduleKick(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.1);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
    this.musicNodes.push(osc);
  }

  scheduleSnare(t) {
    const noise = this.createNoise(0.08);
    const nGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3500, t);
    filter.Q.setValueAtTime(0.8, t);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    nGain.gain.setValueAtTime(0.09, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    noise.start(t);
    noise.stop(t + 0.08);
    this.musicNodes.push(noise);

    const osc = this.ctx.createOscillator();
    const oGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
    oGain.gain.setValueAtTime(0.06, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(oGain);
    oGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
    this.musicNodes.push(osc);
  }

  scheduleHihat(t) {
    const noise = this.createNoise(0.03);
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, t);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    noise.start(t);
    noise.stop(t + 0.03);
    this.musicNodes.push(noise);
  }

  startAmbient(ageIndex) {
    this.stopAmbient();
    if (!this.ctx || !this.musicEnabled) return;
    this.currentAmbient = ageIndex;

    const now = this.ctx.currentTime;
    const dur = 2;

    if (ageIndex === 0) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      const noise = this.createNoise(dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.5);
      gain.gain.setValueAtTime(0.02, now + dur - 0.5);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + dur);
      this.ambientNodes.push(noise);
    } else if (ageIndex === 3) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3000, now);

      const noise = this.createNoise(dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.3);
      gain.gain.setValueAtTime(0.01, now + dur - 0.3);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + dur);
      this.ambientNodes.push(noise);
    } else if (ageIndex === 4) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      gain.gain.setValueAtTime(0.01, now + dur - 0.3);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
      this.ambientNodes.push(osc);
    }

    this.ambientTimer = setTimeout(() => {
      this.ambientNodes = [];
      this.startAmbient(ageIndex);
    }, dur * 1000);
  }

  stopAmbient() {
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
    for (const n of this.ambientNodes) {
      try { n.stop(); } catch (e) {}
    }
    this.ambientNodes = [];
  }

  createNoise(duration) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  play(type) {
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      switch (type) {
        case 'ui_click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'spawn': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(350, now + 0.15);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);

          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(400, now + 0.05);
          osc2.frequency.exponentialRampToValueAtTime(800, now + 0.12);
          gain2.gain.setValueAtTime(0.06, now + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
          osc2.start(now + 0.05);
          osc2.stop(now + 0.18);
          break;
        }

        case 'hit': {
          const noise = this.createNoise(0.06);
          const noiseGain = this.ctx.createGain();
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(2000, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.06);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noiseGain.gain.setValueAtTime(0.15, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
          noise.start(now);
          noise.stop(now + 0.06);

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }

        case 'fire': {
          const noise = this.createNoise(0.05);
          const noiseGain = this.ctx.createGain();
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.setValueAtTime(3000, now);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noiseGain.gain.setValueAtTime(0.1, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          noise.start(now);
          noise.stop(now + 0.05);

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(900, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'evolve': {
          const notes = [300, 400, 500, 600, 800];
          notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.1, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.15);
          });

          const noise = this.createNoise(0.3);
          const noiseGain = this.ctx.createGain();
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(2000, now);
          noiseFilter.Q.setValueAtTime(2, now);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noiseGain.gain.setValueAtTime(0.04, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          noise.start(now);
          noise.stop(now + 0.3);
          break;
        }

        case 'special': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.linearRampToValueAtTime(400, now + 0.15);
          osc.frequency.linearRampToValueAtTime(200, now + 0.25);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.setValueAtTime(0.18, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
          osc.start(now);
          osc.stop(now + 0.6);

          const noise = this.createNoise(0.5);
          const noiseGain = this.ctx.createGain();
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(3000, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noiseGain.gain.setValueAtTime(0.12, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          noise.start(now);
          noise.stop(now + 0.5);
          break;
        }

        case 'death': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(500, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);

          const noise = this.createNoise(0.1);
          const noiseGain = this.ctx.createGain();
          noise.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noiseGain.gain.setValueAtTime(0.06, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          noise.start(now);
          noise.stop(now + 0.1);
          break;
        }

        case 'gold': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(1800, now + 0.04);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);

          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1600, now + 0.06);
          osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.1);
          gain2.gain.setValueAtTime(0.04, now + 0.06);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
          osc2.start(now + 0.06);
          osc2.stop(now + 0.14);
          break;
        }
      }
    } catch (e) {
      // silent fail
    }
  }
}

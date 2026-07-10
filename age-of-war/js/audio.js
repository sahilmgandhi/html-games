class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicNodes = [];
    this.musicTimer = null;
    this.currentAgeIndex = 0;
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

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else if (this.musicEnabled) {
      this.startMusic(this.currentAgeIndex);
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else if (!this.muted) {
      this.startMusic(this.currentAgeIndex);
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
  }

  startMusic(ageIndex) {
    this.stopMusic();
    if (this.muted || !this.ctx || !this.musicEnabled) return;
    this.currentAgeIndex = ageIndex;
    this.musicPlaying = true;
    this.playMusicLoop(ageIndex);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    for (const node of this.musicNodes) {
      try { node.stop(); } catch (e) {}
    }
    this.musicNodes = [];
  }

  playMusicLoop(ageIndex) {
    if (!this.musicPlaying || this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreqs = [65, 73, 82, 98, 110];
    const melodyNotes = [
      [0, 3, 5, 7, 5, 3],
      [0, 4, 7, 9, 7, 4],
      [0, 2, 5, 7, 5, 2],
      [0, 3, 7, 10, 7, 3],
      [0, 5, 9, 12, 9, 5],
    ];
    const scales = [
      [0, 2, 3, 5, 7, 8, 10],
      [0, 2, 4, 5, 7, 9, 11],
      [0, 2, 3, 5, 7, 8, 10],
      [0, 2, 4, 5, 7, 9, 10],
      [0, 2, 4, 6, 7, 9, 11],
    ];

    const baseFreq = baseFreqs[Math.min(ageIndex, baseFreqs.length - 1)];
    const scale = scales[Math.min(ageIndex, scales.length - 1)];
    const melodyPattern = melodyNotes[Math.min(ageIndex, melodyNotes.length - 1)];
    const noteDur = 0.4;
    const totalDur = melodyPattern.length * noteDur;

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.03, now);
    bassGain.connect(this.ctx.destination);

    const bassOsc = this.ctx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(baseFreq, now);
    bassOsc.connect(bassGain);
    bassOsc.start(now);
    bassOsc.stop(now + totalDur);
    this.musicNodes.push(bassOsc);

    const bassOsc2 = this.ctx.createOscillator();
    bassOsc2.type = 'triangle';
    bassOsc2.frequency.setValueAtTime(baseFreq * 1.5, now);
    const bass2Gain = this.ctx.createGain();
    bass2Gain.gain.setValueAtTime(0.015, now);
    bassOsc2.connect(bass2Gain);
    bass2Gain.connect(this.ctx.destination);
    bass2Gain.gain.setValueAtTime(0.015, now);
    bassOsc2.start(now);
    bassOsc2.stop(now + totalDur);
    this.musicNodes.push(bassOsc2);

    melodyPattern.forEach((interval, i) => {
      const noteFreq = baseFreq * 4 * Math.pow(2, scale[interval % scale.length] / 12);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = ageIndex >= 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(noteFreq, now + i * noteDur);
      gain.gain.setValueAtTime(0, now + i * noteDur);
      gain.gain.linearRampToValueAtTime(0.035, now + i * noteDur + 0.05);
      gain.gain.linearRampToValueAtTime(0.02, now + i * noteDur + noteDur * 0.6);
      gain.gain.linearRampToValueAtTime(0, now + i * noteDur + noteDur * 0.95);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * noteDur);
      osc.stop(now + i * noteDur + noteDur);
      this.musicNodes.push(osc);
    });

    this.musicNodes = this.musicNodes.filter(n => {
      try { return n.context.currentTime < n.stopTime; } catch (e) { return false; }
    });

    this.musicTimer = setTimeout(() => {
      this.musicNodes = [];
      this.playMusicLoop(ageIndex);
    }, totalDur * 1000);
  }

  updateMusicAge(ageIndex) {
    if (this.musicPlaying && ageIndex !== this.currentAgeIndex) {
      this.currentAgeIndex = ageIndex;
      if (!this.muted && this.musicEnabled) {
        this.stopMusic();
        this.startMusic(ageIndex);
      }
    }
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
    if (this.muted || !this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      switch (type) {
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

        case 'explosion': {
          const noise = this.createNoise(0.4);
          const noiseGain = this.ctx.createGain();
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(1500, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.4);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.ctx.destination);
          noiseGain.gain.setValueAtTime(0.25, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          noise.start(now);
          noise.stop(now + 0.4);

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
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

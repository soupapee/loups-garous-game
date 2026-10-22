// ====================================================================
// MOTEUR AUDIO PROCÉDURAL WEB AUDIO API — AMBIANCE GOTHIQUE
// Sons atmosphériques générés sans dépendance externe ni risque 404
// ====================================================================

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private muted: boolean = false;

  constructor() {
    // Initialisation paresseuse au premier clic utilisateur (requis par les navigateurs)
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx?.currentTime || 0);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx?.currentTime || 0);
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Hurlement de loup lointain (Nuit / Attaque)
   */
  public playWolfHowl() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;

      // Fréquence qui monte puis descend comme un hurlement dans la brume
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.8);
      osc.frequency.exponentialRampToValueAtTime(320, now + 2.2);
      osc.frequency.exponentialRampToValueAtTime(140, now + 3.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      // Filtre passe-bas pour rendre le hurlement brumeux et spectral
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(4, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.3);
    } catch (e) {
      // Ignorer si l'interaction audio est bloquée
    }
  }

  /**
   * Glas de l'église du village (Annonce de l'aube / Exécution)
   */
  public playChurchBell() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      // Son complexe avec harmoniques métalliques
      [180, 360, 540, 720].forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = 0.3 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5 - idx * 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 3.6);
      });
    } catch (e) {}
  }

  /**
   * Battement de cœur angoissant (Tension des votes ou de la nuit)
   */
  public playHeartbeat() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      [0, 0.22].forEach(offset => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(65, now + offset);
        osc.frequency.exponentialRampToValueAtTime(35, now + offset + 0.15);

        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    } catch (e) {}
  }

  /**
   * Coup de fusil du Chasseur
   */
  public playGunshot() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      // Bruit blanc pour la détonation
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.5);
    } catch (e) {}
  }

  /**
   * Émulsion magique de fiole / potion (Sorcière)
   */
  public playPotionBubble() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = now + i * 0.12;
        const baseFreq = 400 + Math.random() * 300;
        osc.frequency.setValueAtTime(baseFreq, start);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 250, start + 0.1);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + 0.11);
      }
    } catch (e) {}
  }

  /**
   * Bruissement de carte / révélation de rôle
   */
  public playCardFlip() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {}
  }

  /**
   * Clic gothique pour boutons
   */
  public playClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.muted) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }
}

export const soundEngine = new SoundEngine();

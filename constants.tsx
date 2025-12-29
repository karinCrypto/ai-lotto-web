
import { LotteryType } from './types';

export const getBallColor = (n: number, isSpecial?: boolean): string => {
  if (isSpecial) return 'bg-rose-600 text-white border-rose-200 shadow-rose-500/50';
  if (n <= 10) return 'bg-amber-400 text-white';
  if (n <= 20) return 'bg-sky-500 text-white';
  if (n <= 30) return 'bg-rose-500 text-white';
  if (n <= 40) return 'bg-slate-500 text-white';
  return 'bg-emerald-500 text-white';
};

export const LOTTERY_CONFIGS = {
  [LotteryType.KR_LOTTO]: {
    name: "KR Lotto 6/45",
    mainCount: 6,
    mainMax: 45,
    hasBonus: false,
    bonusMax: 0
  },
  [LotteryType.US_POWERBALL]: {
    name: "US Powerball",
    mainCount: 5,
    mainMax: 69,
    hasBonus: true,
    bonusMax: 26,
    bonusName: "Powerball"
  },
  [LotteryType.US_MEGA_MILLIONS]: {
    name: "Mega Millions",
    mainCount: 5,
    mainMax: 70,
    hasBonus: true,
    bonusMax: 25,
    bonusName: "Mega Ball"
  },
  [LotteryType.SG_TOTO]: {
    name: "Singapore TOTO",
    mainCount: 6,
    mainMax: 49,
    hasBonus: true,
    bonusMax: 49,
    bonusName: "Additional"
  },
  [LotteryType.HK_MARK_SIX]: {
    name: "HK Mark Six",
    mainCount: 6,
    mainMax: 49,
    hasBonus: true,
    bonusMax: 49,
    bonusName: "Extra"
  }
};

export const generateLottoNumbers = (type: LotteryType) => {
  const config = LOTTERY_CONFIGS[type];
  const nums = new Set<number>();
  while (nums.size < config.mainCount) {
    nums.add(Math.floor(Math.random() * config.mainMax) + 1);
  }
  const main = Array.from(nums).sort((a, b) => a - b);
  let bonus = undefined;
  if (config.hasBonus) {
    bonus = Math.floor(Math.random() * config.bonusMax) + 1;
    if (type === LotteryType.SG_TOTO || type === LotteryType.HK_MARK_SIX) {
      while (nums.has(bonus)) {
        bonus = Math.floor(Math.random() * config.bonusMax) + 1;
      }
    }
  }
  return { main, bonus };
};

class SoundPlayer {
  private ctx: AudioContext | null = null;
  private masterVolume: number = 0.5;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  playCollision(intensity: number = 1.0) {
    this.init();
    if (!this.ctx || this.masterVolume <= 0) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 600, now);
    
    const volume = Math.min(0.05 * intensity, 0.1) * this.masterVolume;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.05);
  }

  playHeartbeat(progress: number) {
    this.init();
    if (!this.ctx || this.masterVolume <= 0) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(60 + (progress * 40), now);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.1);
  }

  playReveal() {
    this.init();
    if (!this.ctx || this.masterVolume <= 0) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.15);
  }

  playSuccess() {
    this.init();
    if (!this.ctx || this.masterVolume <= 0) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.1 * this.masterVolume, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.05 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    });
  }
}

export const soundPlayer = new SoundPlayer();

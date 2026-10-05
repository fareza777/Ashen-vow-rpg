// Recorded stone-water ambience, regional environments and tactile effects; no music.
import { battlePresentation } from "./battlePresentation";
import type { BattleFx } from "./battlePresentation";

class Soundscape {
  private ctx: AudioContext | null = null;
  private ambient: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
  private region = "";
  private enabled = false;
  private sfx = true;
  private buffer: AudioBuffer | null = null;
  private townRecording: Promise<AudioBuffer | null> | null = null;
  private ambientPending = false;
  private generation = 0;
  private interrupted = false;
  unlock() {
    try {
      this.ctx ??= new AudioContext();
      if (
        this.ctx.state === "suspended" &&
        !document.hidden &&
        !this.interrupted
      )
        void this.ctx.resume();
    } catch {
      return;
    }
  }
  private noise() {
    const ctx = this.ctx!;
    if (!this.buffer) {
      this.buffer = ctx.createBuffer(2, ctx.sampleRate * 9, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = this.buffer.getChannelData(ch);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          last = (last + Math.random() * 0.08 - 0.04) / 1.02;
          data[i] = last * 5;
        }
      }
    }
    return this.buffer;
  }
  configure(ambience: boolean, sfx: boolean, region: string) {
    this.sfx = sfx;
    if (
      this.enabled === ambience &&
      this.region === region &&
      (!ambience || this.ambient.length > 0 || this.ambientPending)
    )
      return;
    this.enabled = ambience;
    this.region = region;
    const generation = ++this.generation;
    this.ambientPending = false;
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    this.ambient.forEach(({ source, gain }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.35);
      source.stop(now + 2);
    });
    this.ambient = [];
    if (!ambience) return;
    if (region === "town" || region === "catacombs") {
      this.ambientPending = true;
      this.townRecording ??= fetch("/audio/town-stonewater.mp3")
        .then((response) => {
          if (!response.ok) throw new Error("Nature recording unavailable");
          return response.arrayBuffer();
        })
        .then((bytes) => ctx.decodeAudioData(bytes))
        .catch(() => {
          this.townRecording = null;
          return null;
        });
      void this.townRecording.then((recording) => {
        if (generation !== this.generation) return;
        this.ambientPending = false;
        if (!recording || !this.enabled || this.region !== region) return;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = recording;
        source.loop = true;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 2);
        source.connect(gain).connect(ctx.destination);
        source.start();
        this.ambient.push({ source, gain });
      });
      return;
    }
    const water = ["saltreach", "rootsea", "catacombs"].includes(region);
    const fire = ["archive", "engine"].includes(region);
    const layers = [
      {
        freq: water ? 220 : fire ? 450 : 130,
        gain: 0.055,
        type: "lowpass" as BiquadFilterType,
      },
      {
        freq: water ? 1800 : fire ? 3200 : 900,
        gain: water ? 0.022 : 0.012,
        type: "bandpass" as BiquadFilterType,
      },
    ];
    layers.forEach((layer, i) => {
      const source = ctx.createBufferSource(),
        filter = ctx.createBiquadFilter(),
        gain = ctx.createGain();
      source.buffer = this.noise();
      source.loop = true;
      source.playbackRate.value = water ? 0.75 + i * 0.16 : 0.5 + i * 0.21;
      filter.type = layer.type;
      filter.frequency.value = layer.freq;
      filter.Q.value = 0.3;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(layer.gain, now + 2);
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(now, i * 2.1);
      this.ambient.push({ source, gain });
    });
  }
  gesture(ambience: boolean, sfx: boolean, region: string) {
    this.unlock();
    this.configure(ambience, sfx, region);
  }
  private burst(
    duration: number,
    freq: number,
    volume: number,
    delay = 0,
    type: BiquadFilterType = "bandpass",
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.sfx || ctx.state !== "running") return;
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain(),
      t = ctx.currentTime + delay;
    source.buffer = this.noise();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(60, freq * 0.35),
      t + duration,
    );
    filter.Q.value = 1.8;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(t, Math.random() * 6);
    source.stop(t + duration + 0.02);
  }
  click() {
    this.burst(0.055, 1400, 0.045);
  }
  battle(fx: BattleFx) {
    const p = battlePresentation(fx);
    const impact = p.impactMs / 1000;
    if (fx.damage > 0) {
      this.burst(
        p.style === "heavy" ? 0.26 : 0.18,
        p.style === "shadow" ? 1100 : 2300,
        0.14,
      );
      this.burst(
        p.style === "heavy" || fx.critical ? 0.42 : 0.22,
        p.style === "heavy" || fx.critical ? 130 : 310,
        0.2,
        impact,
        "lowpass",
      );
      this.burst(0.2, 4300, 0.065, impact + 0.025);
      if (p.style === "ember") this.burst(0.6, 2000, 0.09, 0.12, "highpass");
      if (p.style === "shadow") this.burst(0.4, 700, 0.06, 0.1, "lowpass");
    }
    if (["guard", "bulwark", "riposte"].includes(fx.action)) {
      this.burst(0.12, 3400, 0.2);
      this.burst(0.42, 620, 0.1, 0.08);
    }
    if (fx.healed > 0) {
      this.burst(0.45, 900, 0.1, 0, "lowpass");
      this.burst(0.16, 2600, 0.065, 0.16);
    }
    if (fx.action === "focus") this.burst(0.65, 600, 0.07, 0, "lowpass");
    if (fx.incoming > 0) {
      this.burst(0.28, 120, 0.16, p.counterMs / 1000, "lowpass");
      this.burst(0.12, 1000, 0.07, p.counterMs / 1000 + 0.025);
    }
    if (fx.won) {
      this.burst(0.7, 230, 0.09, 0.4, "lowpass");
      this.burst(0.4, 2200, 0.055, 0.75);
    }
  }
  visibility() {
    if (!this.ctx) return;
    if (document.hidden || this.interrupted) void this.ctx.suspend();
    else void this.ctx.resume();
  }
  interrupt(interrupted: boolean) {
    this.interrupted = interrupted;
    this.visibility();
  }
  stop() {
    ++this.generation;
    this.ambientPending = false;
    this.ambient.forEach((a) => {
      try {
        a.source.stop();
      } catch {}
    });
    this.ambient = [];
  }
}
export const soundscape = new Soundscape();

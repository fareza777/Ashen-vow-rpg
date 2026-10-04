import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { soundscape } from "../src/audio";

class Param {
  value = 0;
  setValueAtTime(value: number) {
    this.value = value;
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
  }
  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }
  setTargetAtTime(value: number) {
    this.value = value;
  }
  cancelScheduledValues() {}
}
class Node {
  connect<T>(next: T) {
    return next;
  }
  disconnect() {}
}
class Source extends Node {
  buffer: unknown = null;
  loop = false;
  playbackRate = new Param();
  started = false;
  stopped = false;
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
  }
}

function environment(t: TestContext) {
  const recording = { duration: 27.051, numberOfChannels: 2 };
  const sources: Source[] = [];
  const contexts: Context[] = [];
  class Context {
    state = "running";
    sampleRate = 8000;
    currentTime = 0;
    destination = new Node();
    constructor() {
      contexts.push(this);
    }
    resume() {
      this.state = "running";
      return Promise.resolve();
    }
    suspend() {
      this.state = "suspended";
      return Promise.resolve();
    }
    createBuffer(_channels: number, length: number) {
      return { getChannelData: () => new Float32Array(length) };
    }
    decodeAudioData() {
      return Promise.resolve(recording);
    }
    createBufferSource() {
      const source = new Source();
      sources.push(source);
      return source;
    }
    createGain() {
      return Object.assign(new Node(), { gain: new Param() });
    }
    createBiquadFilter() {
      return Object.assign(new Node(), {
        type: "lowpass",
        frequency: new Param(),
        Q: new Param(),
      });
    }
  }
  const previous = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: Context,
  });
  const Soundscape = soundscape.constructor as { new (): typeof soundscape };
  const engine = new Soundscape();
  t.after(() => {
    engine.stop();
    if (previous) Object.defineProperty(globalThis, "AudioContext", previous);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  });
  let resolve!: (value: Response) => void;
  const pending = new Promise<Response>((done) => {
    resolve = done;
  });
  t.mock.method(globalThis, "fetch", () => pending);
  return {
    engine,
    recording,
    sources,
    contexts,
    finish: () => resolve(new Response(new Uint8Array([1, 2, 3]))),
    active: () => sources.filter((source) => source.started && !source.stopped),
  };
}

test("fullscreen ads and purchases suspend audio until dismissed and preserve the mute choice", async (t) => {
  const env = environment(t);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  const page = { hidden: false };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: page,
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  });
  env.engine.gesture(true, true, "town");
  env.finish();
  await setImmediate();
  const context = env.contexts[0];
  env.engine.interrupt(true);
  assert.equal(context.state, "suspended");
  env.engine.gesture(true, true, "town");
  env.engine.visibility();
  assert.equal(
    context.state,
    "suspended",
    "ordinary gestures or visibility must not unmute an ad",
  );
  page.hidden = true;
  env.engine.interrupt(false);
  assert.equal(
    context.state,
    "suspended",
    "background dismissal must stay quiet",
  );
  page.hidden = false;
  env.engine.visibility();
  assert.equal(context.state, "running");
  env.engine.configure(false, false, "town");
  env.engine.interrupt(true);
  env.engine.interrupt(false);
  assert.equal(
    env.active().length,
    0,
    "returning from an ad must preserve muted ambience",
  );
});

test("town ambience plays one recorded nature loop without a synthetic noise bed", async (t) => {
  const env = environment(t);
  env.engine.gesture(true, false, "town");
  assert.equal(
    env.active().length,
    0,
    "remain quiet while the local recording loads",
  );
  env.finish();
  await setImmediate();
  assert.equal(env.active().length, 1);
  assert.equal(env.active()[0].buffer, env.recording);
  assert.equal(env.active()[0].loop, true);
  env.engine.gesture(true, false, "town");
  assert.equal(
    env.active().length,
    1,
    "ordinary clicks must not stack ambience",
  );
});

test("muting while nature audio loads prevents delayed playback", async (t) => {
  const env = environment(t);
  env.engine.gesture(true, false, "town");
  env.engine.configure(false, false, "town");
  env.finish();
  await setImmediate();
  assert.equal(env.active().length, 0);
  env.engine.configure(true, false, "town");
  await setImmediate();
  assert.equal(env.active().length, 1);
  assert.equal(env.active()[0].buffer, env.recording);
});

test("leaving town during loading cannot start its recording in the dungeon", async (t) => {
  const env = environment(t);
  env.engine.gesture(true, false, "town");
  env.engine.configure(true, false, "thornwild");
  env.finish();
  await setImmediate();
  assert.equal(env.active().length, 2, "only the regional environment remains");
  assert.ok(env.active().every((source) => source.buffer !== env.recording));
  env.engine.configure(true, false, "town");
  await setImmediate();
  assert.equal(env.active().length, 1);
  assert.equal(env.active()[0].buffer, env.recording);
});

test("stopping or failing a town recording leaves silence instead of noisy fallback", async (t) => {
  const env = environment(t);
  env.engine.gesture(true, false, "town");
  env.engine.stop();
  env.finish();
  await setImmediate();
  assert.equal(env.active().length, 0);
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Asset unavailable");
  });
  const Soundscape = soundscape.constructor as { new (): typeof soundscape };
  const unavailable = new Soundscape();
  t.after(() => unavailable.stop());
  unavailable.gesture(true, false, "town");
  await setImmediate();
  assert.equal(env.active().length, 0);
});

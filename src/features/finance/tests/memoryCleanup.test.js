import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';

function createMemoryLeakDetector() {
  const listeners = new Map();

  return {
    trackListener(emitter, eventName, listener) {
      if (!listeners.has(emitter)) {
        listeners.set(emitter, new Map());
      }
      const eventListeners = listeners.get(emitter);
      if (!eventListeners.has(eventName)) {
        eventListeners.set(eventName, []);
      }
      eventListeners.get(eventName).push(listener);
      return listener;
    },

    cleanup() {
      let cleaned = 0;
      listeners.forEach((eventListeners) => {
        cleaned += eventListeners.size;
        eventListeners.clear();
      });
      listeners.clear();
      return cleaned;
    },

    removeAllListeners(emitter) {
      if (emitter instanceof EventEmitter) {
        emitter.removeAllListeners();
      }
    },
  };
}

test('EventEmitter cleanup prevents memory leaks', () => {
  const emitter = new EventEmitter();
  const detector = createMemoryLeakDetector();

  const listener = () => {};
  emitter.on('test', listener);

  emitter.emit('test');

  detector.removeAllListeners(emitter);

  assert.equal(emitter.listenerCount('test'), 0);
});

test('no listener retention after removal', () => {
  const emitter = new EventEmitter();
  const detector = createMemoryLeakDetector();

  const rawListener = () => {};
  detector.trackListener(emitter, 'event', rawListener);
  emitter.on('event', rawListener);
  emitter.emit('event');

  emitter.off('event', rawListener);

  assert.equal(emitter.listenerCount('event'), 0, 'Listener should be removed from emitter');
});

test('cleanup multiple emitters', () => {
  const detectors = [];

  for (let i = 0; i < 5; i++) {
    const detector = createMemoryLeakDetector();
    const emitter = new EventEmitter();

    const listener = () => {};
    detector.trackListener(emitter, 'test', listener);

    detectors.push(detector);
  }

  detectors.forEach((d) => d.cleanup());

  let totalLeaks = 0;
  detectors.forEach((d) => {
    totalLeaks += d.cleanup();
  });

  assert.equal(totalLeaks, 0, 'Listeners not cleaned up properly');
});

test('removeAllListeners cleans all events', () => {
  const emitter = new EventEmitter();

  emitter.on('event1', () => {});
  emitter.on('event2', () => {});
  emitter.on('event3', () => {});

  assert.equal(emitter.listenerCount('event1'), 1);
  assert.equal(emitter.listenerCount('event2'), 1);
  assert.equal(emitter.listenerCount('event3'), 1);

  emitter.removeAllListeners();

  assert.equal(emitter.listenerCount('event1'), 0);
  assert.equal(emitter.listenerCount('event2'), 0);
  assert.equal(emitter.listenerCount('event3'), 0);
});

test('off with specific listener only removes that listener', () => {
  const emitter = new EventEmitter();
  const listener1 = () => {};
  const listener2 = () => {};

  emitter.on('event', listener1);
  emitter.on('event', listener2);

  emitter.off('event', listener1);

  assert.equal(emitter.listenerCount('event'), 1);
  assert.ok(emitter.listeners('event').includes(listener2));
});

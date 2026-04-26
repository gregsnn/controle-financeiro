import assert from 'node:assert/strict';
import test from 'node:test';
import {
  __resetChartLoaderForTests,
  prefetchChartModule,
  shouldPrefetchChart,
} from '../lib/chartLoader.js';

test('shouldPrefetchChart blocks save-data and slow connections', () => {
  assert.equal(shouldPrefetchChart(null), true);
  assert.equal(shouldPrefetchChart({ saveData: true }), false);
  assert.equal(shouldPrefetchChart({ effectiveType: '2g' }), false);
  assert.equal(shouldPrefetchChart({ effectiveType: 'slow-2g' }), false);
  assert.equal(shouldPrefetchChart({ effectiveType: '4g' }), true);
});

test('prefetchChartModule schedules module load once', async () => {
  __resetChartLoaderForTests();

  let idleCalls = 0;
  let moduleCalls = 0;
  const scheduled = [];

  const startedA = prefetchChartModule({
    requestIdle: (callback) => {
      idleCalls += 1;
      scheduled.push(callback);
    },
    loadModule: () => {
      moduleCalls += 1;
      return Promise.resolve();
    },
  });

  const startedB = prefetchChartModule({
    requestIdle: (callback) => {
      idleCalls += 1;
      scheduled.push(callback);
    },
    loadModule: () => {
      moduleCalls += 1;
      return Promise.resolve();
    },
  });

  assert.equal(startedA, true);
  assert.equal(startedB, false);
  assert.equal(idleCalls, 1);

  scheduled[0]();
  await Promise.resolve();
  assert.equal(moduleCalls, 1);
});

test('prefetchChartModule can be forced on restricted connection', () => {
  __resetChartLoaderForTests();

  let called = 0;
  const started = prefetchChartModule({
    force: true,
    connection: { saveData: true, effectiveType: '2g' },
    requestIdle: (callback) => callback(),
    loadModule: () => {
      called += 1;
      return Promise.resolve();
    },
  });

  assert.equal(started, true);
  assert.equal(called, 1);
});

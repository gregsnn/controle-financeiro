let chartModulePromise = null;
let prefetchScheduled = false;

function readConnection() {
  if (typeof navigator === 'undefined') return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

export function shouldPrefetchChart(connection) {
  if (!connection) return true;
  if (connection.saveData === true) return false;

  const effectiveType = String(connection.effectiveType || '').toLowerCase();
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return false;
  return true;
}

export function loadChartModule() {
  if (!chartModulePromise) {
    chartModulePromise = import('chart.js/auto');
  }
  return chartModulePromise;
}

export function prefetchChartModule(options = {}) {
  const {
    force = false,
    connection = readConnection(),
    requestIdle = typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback.bind(window)
      : null,
    timeoutFn = typeof setTimeout === 'function' ? setTimeout : null,
    loadModule = loadChartModule,
  } = options;

  if (prefetchScheduled) return false;
  if (!force && !shouldPrefetchChart(connection)) return false;

  prefetchScheduled = true;

  const run = () => {
    Promise.resolve(loadModule()).catch(() => {
      prefetchScheduled = false;
    });
  };

  if (typeof requestIdle === 'function') {
    requestIdle(run, { timeout: 1500 });
    return true;
  }

  if (typeof timeoutFn === 'function') {
    timeoutFn(run, 250);
    return true;
  }

  run();
  return true;
}

export function __resetChartLoaderForTests() {
  chartModulePromise = null;
  prefetchScheduled = false;
}

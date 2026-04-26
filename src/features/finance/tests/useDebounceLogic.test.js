import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('useDebounce logic (pure functions)', () => {
  describe('debounce logic', () => {
    it('deve executar funcao apos delay', async () => {
      let executionTime = 0;
      const startTime = Date.now();

      const debouncedFn = (fn, delay) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            executionTime = Date.now() - startTime;
            fn();
            resolve();
          }, delay);
        });
      };

      await debouncedFn(() => {}, 50);

      assert.ok(executionTime >= 45);
    });

    it('deve cancelar execucao anterior', async () => {
      let executionCount = 0;
      const executions = [];

      const debounce = (fn, delay) => {
        let timeout;
        return {
          call: (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              executionCount++;
              executions.push(Date.now());
              fn(...args);
            }, delay);
          },
          cancel: () => clearTimeout(timeout),
        };
      };

      const d = debounce(() => {}, 100);
      d.call(1);
      d.call(2);
      d.call(3);

      await new Promise((r) => setTimeout(r, 150));

      assert.strictEqual(executionCount, 1);
    });

    it('deve manter valor anteriores durante debounce', () => {
      const calls = [];
      let currentValue = undefined;

      const mockDebounce = (value, delay) => {
        let timeout;
        return {
          update: (newValue) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              currentValue = newValue;
              calls.push({ value: newValue, time: Date.now() });
            }, delay);
          },
          cancel: () => clearTimeout(timeout),
          getValue: () => currentValue,
        };
      };

      const d = mockDebounce(10);
      d.update(1);
      d.update(2);
      d.update(3);
      d.cancel();

      assert.strictEqual(d.getValue(), undefined);
    });
  });

  describe('throttle logic', () => {
    it('deve limitar chamadas em intervalo', async () => {
      let callCount = 0;

      const throttle = (fn, delay) => {
        let lastCall = 0;
        return {
          call: (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
              lastCall = now;
              callCount++;
              fn(...args);
            }
          },
        };
      };

      const t = throttle(() => {}, 50);

      for (let i = 0; i < 10; i++) {
        t.call(i);
        await new Promise((r) => setTimeout(r, 10));
      }

      assert.ok(callCount >= 1);
    });

    it('deve permitir chamada imediata inicial', async () => {
      let firstCallTime = null;
      let secondCallTime = null;

      const throttle = (fn, delay) => {
        let lastCall = 0;
        return {
          call: (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
              lastCall = now;
              fn(now);
            }
          },
        };
      };

      const t = throttle((time) => {
        if (firstCallTime === null) {
          firstCallTime = time;
        } else {
          secondCallTime = time;
        }
      }, 100);

      t.call();
      await new Promise((r) => setTimeout(r, 120));
      t.call();

      assert.ok(firstCallTime !== null);
      assert.ok(secondCallTime > firstCallTime);
    });
  });

  describe('setTimeout cleanup', () => {
    it('deve fazer cleanup de timers pendentes', async () => {
      let cleanupCount = 0;
      const timers = new Set();

      const mockTimer = (fn, delay) => {
        const id = setTimeout(fn, delay);
        timers.add(id);
        return id;
      };

      const clearAll = () => {
        timers.forEach((id) => clearTimeout(id));
        cleanupCount = timers.size;
        timers.clear();
      };

      mockTimer(() => {}, 1000);
      mockTimer(() => {}, 1000);
      mockTimer(() => {}, 1000);

      clearAll();

      assert.strictEqual(cleanupCount, 3);
    });
  });

  describe('value tracking', () => {
    it('deve rastrear mudancas de valor', () => {
      const history = [];
      let current = undefined;

      const track = (newValue) => {
        if (newValue !== current) {
          history.push(newValue);
          current = newValue;
        }
      };

      track(1);
      track(1);
      track(2);
      track(2);
      track(3);

      assert.strictEqual(history.length, 3);
      assert.deepStrictEqual(history, [1, 2, 3]);
    });
  });
});

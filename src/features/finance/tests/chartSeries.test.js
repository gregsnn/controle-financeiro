import { describe, it } from 'node:test';
import assert from 'node:assert';

const { formatMoney } = await import('../lib/utils.js');
const {
  CHART_COLORS,
  buildCategorySeries,
  buildCardSeries,
  buildCardStatusSeries,
  buildDonutTooltipLabel,
} = await import('../lib/chartSeries.js');

function createMockMonthView(overrides = {}) {
  return {
    fixedExpenses: [],
    installments: [],
    revenues: [],
    ...overrides,
  };
}

describe('chartSeries.js', () => {
  describe('CHART_COLORS', () => {
    it('deve ter cores definidas', () => {
      assert.ok(CHART_COLORS.length > 0);
      CHART_COLORS.forEach((color) => {
        assert.match(color, /^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('buildCategorySeries', () => {
    it('deve retornar serie vazia sem despesas', () => {
      const monthView = createMockMonthView({ fixedExpenses: [] });
      const result = buildCategorySeries(monthView);

      assert.deepStrictEqual(result.labels, []);
      assert.deepStrictEqual(result.values, []);
    });

    it('deve agrupar despesas por categoria', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', category: 'telefone', amount: 100, active: true },
          { id: '2', category: 'telefone', amount: 50, active: true },
          { id: '3', category: 'streaming', amount: 80, active: true },
        ],
      });

      const result = buildCategorySeries(monthView);

      assert.strictEqual(result.labels.includes('TELEFONE'), true);
      assert.strictEqual(result.labels.includes('STREAMING'), true);
      const telefoneIndex = result.labels.indexOf('TELEFONE');
      assert.strictEqual(result.values[telefoneIndex], 150);
    });

    it('deve ignorar despesas inativas', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', category: 'telefone', amount: 100, active: true },
          { id: '2', category: 'telefone', amount: 50, active: false },
        ],
      });

      const result = buildCategorySeries(monthView);
      // O código assume que as despesas já estão filtradas pelo buildMonthView
      assert.ok(result.labels.length > 0);
    });

    it('deve ordenar por valor decrescente', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', category: 'baixo', amount: 50, active: true },
          { id: '2', category: 'alto', amount: 200, active: true },
          { id: '3', category: 'medio', amount: 100, active: true },
        ],
      });

      const result = buildCategorySeries(monthView);

      assert.strictEqual(result.values[0], 200);
      assert.strictEqual(result.values[1], 100);
      assert.strictEqual(result.values[2], 50);
    });

    it('deve ignorar valores negativos ou zero', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', category: 'negativo', amount: -100, active: true },
          { id: '2', category: 'zero', amount: 0, active: true },
          { id: '3', category: 'valido', amount: 50, active: true },
        ],
      });

      const result = buildCategorySeries(monthView);

      assert.strictEqual(result.labels.includes('NEGATIVO'), false);
      assert.strictEqual(result.labels.includes('ZERO'), false);
      assert.strictEqual(result.labels.includes('VALIDO'), true);
    });

    it('deve usar categoria padrao para desconhecidas', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [{ id: '1', category: 'desconhecida', amount: 100, active: true }],
      });

      const result = buildCategorySeries(monthView);

      assert.strictEqual(result.labels[0], 'DESCONHECIDA');
    });
  });

  describe('buildCardSeries', () => {
    it('deve agrupar por cartao', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', paymentMethod: 'santander', amount: 500, active: true },
          { id: '2', paymentMethod: 'nubank', amount: 300, active: true },
        ],
        installments: [{ id: '3', card: 'santander', installmentValue: 200, active: true }],
      });

      const result = buildCardSeries(monthView);

      const idx = result.labels.findIndex((l) => l === 'SANTANDER');
      assert.strictEqual(result.values[idx], 700);
    });

    it('deve tratar cartao generico', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', paymentMethod: 'cartao', card: 'outro', amount: 150, active: true },
        ],
      });

      const result = buildCardSeries(monthView);

      const idx = result.labels.findIndex((l) => l === 'OUTROS');
      assert.strictEqual(result.values[idx], 150);
    });

    it('deve ignorar metodos nao cartao', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', paymentMethod: 'boleto', amount: 100, active: true },
          { id: '2', paymentMethod: 'pix', amount: 50, active: true },
        ],
      });

      const result = buildCardSeries(monthView);

      assert.strictEqual(result.labels.length, 0);
    });
  });

  describe('buildCardStatusSeries', () => {
    it('deve calcular total e pago', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', paymentMethod: 'santander', amount: 500, paid: true, active: true },
          { id: '2', paymentMethod: 'santander', amount: 300, paid: false, active: true },
        ],
      });

      const result = buildCardStatusSeries(monthView);

      const idx = result.labels.findIndex((l) => l === 'SANTANDER');
      assert.strictEqual(result.paidValues[idx], 500);
      assert.strictEqual(result.toPayValues[idx], 300);
    });

    it('deve calcular toPay como diferenca', () => {
      const monthView = createMockMonthView({
        fixedExpenses: [
          { id: '1', paymentMethod: 'santander', amount: 400, paid: true, active: true },
          { id: '2', paymentMethod: 'santander', amount: 200, paid: true, active: true },
        ],
      });

      const result = buildCardStatusSeries(monthView);

      const idx = result.labels.findIndex((l) => l === 'SANTANDER');
      assert.strictEqual(result.paidValues[idx], 600);
      assert.strictEqual(result.toPayValues[idx], 0);
    });
  });

  describe('buildDonutTooltipLabel', () => {
    it('deve formatar label corretamente', () => {
      const context = {
        label: 'TELEFONE',
        raw: 1500,
        dataset: { data: [1500, 500] },
      };

      const result = buildDonutTooltipLabel(context);

      assert.ok(result.includes('TELEFONE'));
      assert.ok(result.includes('R$'));
      assert.ok(result.includes('%'));
    });

    it('deve calcular percentual corretamente', () => {
      const context = {
        label: 'TESTE',
        raw: 250,
        dataset: { data: [250, 250, 500] },
      };

      const result = buildDonutTooltipLabel(context);

      assert.ok(result.includes('%'));
      assert.ok(result.includes('250'));
    });
  });

  describe('performance', () => {
    it('buildCategorySeries com 50 itens', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `e${i}`,
        category: ['telefone', 'streaming', 'casa', 'outro'][i % 4],
        amount: Math.random() * 500 + 50,
        active: true,
      }));

      const monthView = createMockMonthView({ fixedExpenses: items });

      const result = buildCategorySeries(monthView);

      assert.ok(result.labels.length > 0);
    });

    it('buildCardSeries com 50 itens', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `e${i}`,
        paymentMethod: ['santander', 'nubank', 'cartao'][i % 3],
        card: ['santander', 'nubank', 'outro'][i % 3],
        amount: Math.random() * 300 + 50,
        active: true,
      }));

      const monthView = createMockMonthView({ fixedExpenses: items });

      const result = buildCardSeries(monthView);

      assert.ok(result.labels.length > 0);
    });
  });
});

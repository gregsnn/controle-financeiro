# Arquitetura e Guia de Contribuição - Controle Financeiro

Este documento é a referência oficial para qualquer IA ou desenvolvedor que trabalhar neste projeto.

---

## 1. Contexto do Projeto

- **Stack**: React 18 + Vite + Chart.js + Dexie (IndexedDB)
- **Idioma**: Português (pt-BR)
- **Persistência**: IndexedDB com Dexie
- **Estado global**: Context + hooks customizados
- **Estrutura**: Feature-first em `src/features/finance`

---

## 2. Estrutura de Pastas

```
src/
├── App.tsx                  # Composição raiz (fino)
├── main.tsx                 # Bootstrap (fino)
├── styles.css               # Estilos globais
└── features/finance/
    ├── index.ts             # Exports públicos
    ├── FinanceApp.tsx       # Componente principal
    ├── domain/              # Regras de negócio (puro, sem React)
    │   ├── constants.ts     # Constantes de domínio (OVERRIDE_TYPES, ALLOWED_PAYMENT_METHODS)
    │   ├── types.ts         # Tipagens de domínio
    │   ├── actions.ts       # Ações de manipulação de dados
    │   ├── stateReducers.ts # Funções puras de estado (sem React)
    │   ├── migrations.ts    # Migração de dados legados
    │   └── normalizers.ts   # Normalização de dados
    ├── ui/                  # Constantes de UI
    │   └── constants.ts     # ICONS, CATEGORIES, TABS, etc
    ├── context/              # Estado global
    │   ├── FinanceContext.tsx      # Provider de estado
    │   └── financeContextInternals.ts # Hydration, persistência
    ├── components/          # UI e composição visual
    │   ├── app-shell/      # AppTabs, LoadingScreen
    │   ├── inputs/         # Input, SelectWithIcon
    │   ├── modals/         # ConfirmModal, RuleModal
    │   ├── sections/       # FixedExpenses, Installments, Revenues
    │   │   └── shared/     # Componentes compartilhados de seção
    │   ├── summary/        # SummaryDashboard
    │   └── MonthNav.tsx    # Navegação de meses
    ├── hooks/               # Hooks de lógica e efeitos
    │   ├── useFinanceActions.ts
    │   ├── useFinanceData.ts      # useFinanceSettings
    │   ├── useMonthOverridesActions.ts
    │   ├── useCharts.ts
    │   ├── useCardDeleteReasons.ts
    │   ├── useHashImport.ts
    │   ├── useActiveFixedExpenses.ts
    │   ├── useActiveRevenues.ts
    │   ├── useMonthPaymentMap.ts
    │   └── useDebounce.ts
    ├── lib/                 # Utilitários e infraestrutura
    │   ├── utils.ts         # formatMoney, monthKey, etc
    │   ├── moneyInput.ts    # Máscara de moeda
    │   ├── financeRepository.ts # Interface do repositório
    │   ├── storage.ts       # Persistência IndexedDB (Dexie)
    │   ├── schema.ts        # Schema de dados
    │   ├── ids.ts           # Geração de IDs
    │   ├── i18n.tsx         # Internacionalização
    │   ├── chartLoader.ts   # Lazy load de charts
    │   ├── chartSeries.ts   # Dados para gráficos
    │   ├── exportData.ts    # Export/Import de dados
    │   └── bankColors.ts   # Cores de bancos
    ├── selectors/           # Selectors (derive de dados)
    │   ├── buildMonth.ts      # Construção da view mensal
    │   ├── summarySelectors.ts# Dados para o resumo
    │   ├── monthOverrideSelectors.ts
    │   └── index.ts
    └── tests/               # Testes automatizados
```

---

## 3. Modelo de Dados

O app segue o princípio: **o mês é derivado, não armazenado**.

### 3.1 `fixedExpenses` (Despesas Fixas)

Repetem todo mês enquanto ativas.

```js
{
  (id, // string única
    name, // descrição
    amount, // valor
    dueDay, // dia do vencimento
    category, // categoria
    paymentMethod, // método (cartão, dinheiro, etc)
    active, // booleano
    startMonth, // YYYY-MM
    endMonth, // YYYY-MM (opcional)
    notes); // notas (opcional)
}
```

### 3.2 `installments` (Parcelas)

Existem apenas enquanto houver parcelas restantes.

```js
{
  (id, // string única
    name, // descrição
    totalInstallments, // total de parcelas
    currentInstallment, // parcela atual
    installmentValue, // valor de cada parcela
    card, // cartão associado
    category, // categoria
    startMonth, // YYYY-MM
    active, // booleano
    closedAt); // YYYY-MM (opcional, quando encerrou)
}
```

### 3.3 `revenues` (Receitas)

Renda recorrente com overrides por mês.

```js
{
  (id, // string única
    name, // descrição
    baseAmount, // valor base
    active, // booleano
    startMonth, // YYYY-MM
    endMonth, // YYYY-MM (opcional)
    category, // categoria (opcional)
    notes); // notas (opcional)
}
```

### 3.4 `monthOverrides` (Overrides por Mês)

Exceções específicas por mês para dados recorrentes.

```js
{
  id,       // string única
  type,     // FIXED_EXPENSE_PAYMENT | REVENUE_AMOUNT | CARD_BILL_AMOUNT | INSTALLMENT_PAYMENT | CARD_BILL_PAYMENT
  itemId,   // ID do item base
  monthKey, // YYYY-MM
  amount,   // valor override (opcional)
  paid,     // se foi pago (para pagamentos)
}
```

### 3.5 `settings` e `meta`

Configurações e metadados.

```js
// settings
{ theme: 'default' | 'premium', currentMonthKey: '2026-04' }

// meta
{ schemaVersion: 3, createdAt: Date, lastResetAt: Date }
```

---

## 4. Constantes

### domain/constants.ts (Domínio)
```js
// Tipos de override
OVERRIDE_TYPES = {
  FIXED_EXPENSE,
  FIXED_EXPENSE_PAYMENT,
  REVENUE,
  REVENUE_AMOUNT,
  INSTALLMENT_PAYMENT,
  CARD_BILL_AMOUNT,
  CARD_BILL_PAYMENT,
};

// Métodos de pagamento permitidos
ALLOWED_PAYMENT_METHODS = ['boleto', 'pix', 'debito', 'cartao'];

// Tipos
PaymentMethod, OverrideType, BillCard, PieMode, Theme
```

### ui/constants.ts (Interface)
```js
// Ícones
ICONS = { boleto: '📄', pix: '⚡', outro: '💳' };

// Categorias para UI
CATEGORIES = { casa: '🏠 CASA', telefone: '📱 TELEFONE', ... };

// Rótulos para gráficos
CATEGORY_LABELS, CARD_LABELS, CARD_NAMES

// Abas
TABS = [{ id: 'resumo', labelKey: 'tabs.resumo' }, ...];

// Ações
ACTION_ICONS = { edit: '✎', delete: '🗑' };
```

---

## 5. Como o Mês é Construído

Para um `monthKey` específico (`selectors/buildMonth.ts`):

1. Carregar despesas fixas ativas cujo período inclui o mês
2. Carregar parcelas válidas para o mês
3. Carregar receitas ativas cujo período inclui o mês
4. Aplicar overrides do mês
5. Calcular totais
6. Renderizar a tela com o resultado derivado

**Importante**: O objeto derivado (month view) **não** deve ser salvo como fonte de verdade.

---

## 6. Regras de Edição

### Editar despesa fixa globalmente

- Altera o registro base em `fixedExpenses`
- Meses futuros refletem automaticamente

### Editar despesa fixa apenas um mês

- Cria/atualiza override em `monthOverrides`
- Registro base permanece inalterado

### Editar receita globalmente

- Altera o registro base em `revenues`
- Todos os meses atualizam (exceto os com override)

### Editar receita apenas um mês

- Salva override `REVENUE_AMOUNT` para o mês
- Exemplo: salário padrão, mas Abril tem bônus

---

## 7. Regras Obrigatórias para IA

Estas regras são **bloqueantes**. Não atender qualquer item significa tarefa incompleta.

### 7.1 Segregação de Responsabilidade

- **PROIBIDO** colocar lógica de negócio em componentes de UI
- Componentes em `components/` devem ficar focados em renderização e eventos
- Regra de negócio deve estar em: `domain/` (puro), `lib/` (infra), `selectors/`
- **Domain deve ser puro**: sem imports do React (useState, useEffect, etc.)
- **Repository pattern**: `lib/financeRepository.ts` abstrai acesso a dados
- **Hooks de lógica** em `hooks/` (ex: `useCardDeleteReasons`, `useActiveFixedExpenses`)
- Se identificar lógica reutilizável repetida, extrair para módulo dedicado

### 7.2 Testes Obrigatórios

- Toda alteração que mude comportamento deve criar ou atualizar testes
- Correção de bug exige teste de regressão
- Nova regra de cálculo/selector/utilitário exige teste automatizado
- **NUNCA** usar `test.skip` para desativar testes com falha
- Testes falhando indicam que a tarefa não está completa, mesmo que o código tenha sido alterado
- **SEMPRE** pedir pré-aprovação antes de deletar testes ou usar `test.skip`

### 7.3 Gate de Validação

- Sempre rodar `npm test` e `npm run build` após alterações
- Se qualquer comando falhar, corrigir antes de finalizar
- Não declarar conclusão quando houver falha de teste ou build

### 7.4 Padrão Mínimo de Aceitação

- Segregação correta: sem lógica de negócio indevida em `components/`
- Testes criados/atualizados para o que mudou
- Suite de testes passando
- Build de produção passando

---

## 8. Convenções de Implementação

- Priorizar mudanças pequenas e focadas
- Evitar mover arquivos sem necessidade
- Evitar duplicar regras de negócio em componentes
- Manter nomes claros e sem abreviações confusas
- Manter compatibilidade com dados persistidos (IndexedDB)
- Preservar comportamento atual de navegação por mês, abas, modal, edição e exclusão

### Padrão de Imports

```js
// Usar extensão .js sempre
import { foo } from './bar.js';
import { baz } from '../lib/utils.js';
import { qux } from '../domain/constants.js';
```

### Nomenclatura de Arquivos

- Arquivos de código: `camelCase.ts` ou `camelCase.tsx`
- Exports: usar nomes claros em português ou inglês consistente
- Constantes: UPPER_SNAKE_CASE
- Funções: camelCase

---

## 9. Comandos de Desenvolvimento

```bash
npm run dev      # Iniciar dev server
npm run build    # Build produção
npm run preview  # Preview do build
npm run test     # Rodar testes
npm run lint     # Verificar lint
npm run format   # Formatar código
```

---

## 10. Dependências Ativas

- `react` / `react-dom` - UI
- `chart.js` - Gráficos
- `dexie` - IndexedDB wrapper
- `vite` - Build tool
- `eslint` + `prettier` - Qualidade

---

## 11. Estilo e UX

- Manter o visual existente
- Preservar padrão de moeda e datas em pt-BR
- Novos textos devem seguir o mesmo tom e idioma

---

## 12. Resumo

Este projeto segue um modelo financeiro baseado em regras:

- Despesas fixas são recorrentes
- Parcelas terminam naturalmente
- Receitas são recorrentes com overrides por mês
- Dados do mês são derivados, não armazenados como cópia
- Edições podem ser globais ou mês-específicas

Qualquer mudança deve preservar esses princípios.

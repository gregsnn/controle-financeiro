# Arquitetura e Guia de Contribuição - Controle Financeiro

Este documento é a referência oficial para qualquer IA ou desenvolvedor que trabalhar neste projeto.

---

## 1. Contexto do Projeto

- **Stack**: React 18 + Vite + Chart.js + Dexie (IndexedDB)
- **Idioma**: Português (pt-BR)
- **Persistencia**: IndexedDB com Dexie
- **Estado global**: Context + useReducer
- **Estrutura**: Feature-first em `src/features/finance`

---

## 2. Estrutura de Pastas

```
src/
├── App.jsx                  # Composição raiz (fino)
├── main.jsx                 # Bootstrap (fino)
├── styles.css               # Estilos globais
└── features/finance/
    ├── index.js             # Exports públicos
    ├── FinanceApp.jsx       # Componente principal
    ├── domain/              # Regras de negócio
    │   ├── constants.js     # Constantes (OVERRIDE_TYPES, CATEGORIES, TABS, etc)
    │   └── actions.js       # Ações de manipulação de dados
    ├── context/
    │   └── FinanceContext.jsx # Provider de estado
    ├── components/          # UI e composição visual
    │   ├── Summary.jsx      # Resumo financeiro
    │   ├── MonthNav.jsx     # Navegação de meses
    │   ├── ExportButton.jsx # Botão de exportar
    │   ├── ErrorBoundary.jsx
    │   ├── RuleSection.jsx  # Seção genérica com tabela
    │   ├── inputs/          # Input, SelectWithIcon
    │   ├── modals/          # ConfirmModal, RuleModal
    │   └── sections/        # FixedExpenses, Installments, Revenues
    ├── hooks/               # Hooks de cálculo/efeitos
    │   ├── useFinanceData.js
    │   ├── useFinanceActions.js
    │   ├── useMonthOverridesActions.js
    │   ├── useCharts.js
    │   └── useDebounce.js
    ├── lib/                 # Utilitários puros
    │   ├── utils.js         # formatMoney, monthKey, etc
    │   ├── moneyInput.js    # Máscara de moeda
    │   ├── storage.js       # Persistência IndexedDB
    │   ├── schema.js        # Schema de dados
    │   ├── ids.js           # Geração de IDs
    │   ├── i18n.jsx         # Internacionalização
    │   ├── chartLoader.js   # Lazy load de charts
    │   └── chartSeries.js   # Dados para gráficos
    ├── selectors/           # Selectors (derive de dados)
    │   ├── buildMonth.js      # Construção da view mensal
    │   ├── summarySelectors.js# Dados para o resumo
    │   ├── monthOverrideSelectors.js
    │   └── index.js
    └── tests/               # Testes automatizados
```

---

## 3. Modelo de Dados

O app segue o princípio: **o mês é derivado, não almacenado**.

### 3.1 `fixedExpenses` (Despesas Fixas)
Repetem todo mês enquanto ativas.

```js
{
  id,           // string única
  name,         // descrição
  amount,       // valor
  dueDay,       // dia do vencimento
  category,     // categoria
  paymentMethod,// método (cartão, dinheiro, etc)
  active,       // booleano
  startMonth,   // YYYY-MM
  endMonth,     // YYYY-MM (opcional)
  notes         // notas (opcional)
}
```

### 3.2 `installments` (Parcelas)
Existen apenas enquanto houver parcelas restantes.

```js
{
  id,                 // string única
  name,               // descrição
  totalInstallments,  // total de parcelas
  currentInstallment, // parcela atual
  installmentValue,   // valor de cada parcela
  card,               // cartão associado
  category,           // categoria
  startMonth,         // YYYY-MM
  active,             // booleano
  closedAt            // YYYY-MM (opcional, quando encerrou)
}
```

### 3.3 `revenues` (Receitas)
Renda recorrente com overrides por mês.

```js
{
  id,           // string única
  name,         // descrição
  baseAmount,   // valor base
  active,       // booleano
  startMonth,   // YYYY-MM
  endMonth,     // YYYY-MM (opcional)
  category,     // categoria (opcional)
  notes         // notas (opcional)
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

## 4. Constantes (domain/constants.js)

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
}

// Métodos de pagamento permitidos
ALLOWED_PAYMENT_METHODS = ['boleto', 'pix', 'debito', 'santander', 'nubank', 'cartao']

// Cartões de fatura
BILL_CARDS = [{ key: 'santander', label: 'Santander' }, { key: 'nubank', label: 'Nubank' }]

// Categorias de despesa
CATEGORIES = { debito, credito, casa, telefone, aluguel, cartao, streaming, seguro, outro }

// Rótulos para gráficos
CATEGORY_LABELS, CARD_LABELS, CARD_ORDER
```

---

## 5. Como o Mês é Construído

Para um `monthKey` específico (`selectors/buildMonth.js`):

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
- Regra de negócio deve estar em: `domain/`, `lib/`, `selectors/`
- Se identificar lógica reutilizável repetida, extrair para módulo dedicado

### 7.2 Testes Obrigatórios
- Toda alteração que mude comportamento deve criar ou atualizar testes
- Correção de bug exige teste de regressão
- Nova regra de cálculo/selector/utilitário exige teste automatizado
- **NUNCA** usar `test.skip` para desativar testes com falha

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

- Arquivos de código: `camelCase.js` ou `camelCase.jsx`
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
# Ledger Web

Aplicacao React para controle financeiro pessoal mensal, com despesas fixas,
despesas variaveis, parcelamentos, receitas, faturas de cartao e captura rapida
por linguagem natural.

## Funcionalidades

- **Captura rapida global**: interpreta entradas como `mercado 123,45`,
  `geladeira 10x de 320,89 santander`, `paguei nubank` e abre revisao quando
  houver ambiguidade.
- **OCR e arquivos fiscais**: aceita imagem, TXT, XML NF-e/NFC-e e PDF textual,
  sempre com revisao antes de salvar.
- **Despesas**: despesas fixas recorrentes e despesas variaveis mensais com
  status pago/pendente.
- **Cartoes**: faturas do mes, vencimento/fechamento opcionais do cartao,
  edicao de cartao e parcelamentos.
- **Parcelamentos**: cards com progresso, valor mensal, total pago/total da
  compra e filtros por recentes, perto de quitar, maior parcela, maior total e
  menor restante.
- **Receitas**: receitas recorrentes ou pontuais, com dia de recebimento,
  status recebido/previsto e overrides mensais de valor.
- **Resumo e graficos**: saldo previsto, receitas, despesas, distribuicao e
  parcelas em aberto.
- **Tema claro/escuro**: visual inspirado no FinFlow, com tokens locais.
- **Exportacao/importacao**: backup dos dados por JSON/link.

## Tech Stack

- React 18
- Vite (build tool)
- TypeScript (strict mode)
- Chart.js (gráficos)
- Dexie (IndexedDB)
- Tesseract.js (OCR)
- pdfjs-dist (PDF textual)
- lucide-react (icones)
- ESLint + Prettier

## Estrutura do Projeto

```
src/
├── App.tsx                    # Componente raiz
├── main.tsx                   # Entry point
├── styles.css                 # Estilos globais
├── styles/                    # Tokens, temas, secoes, forms e navegacao
└── features/finance/
    ├── FinanceApp.tsx         # Componente principal
    ├── capture/               # Parser, intent, preview, executor, OCR e metricas
    ├── domain/
    │   ├── constants.ts       # Constantes e configurações
    │   ├── types.ts           # Tipagens de domínio
    │   ├── stateReducers.ts   # Reducers puros
    │   └── factories.ts       # Defaults de criacao
    ├── context/
    │   └── FinanceContext.tsx # Provider de estado
    ├── components/
    │   ├── capture/           # QuickCaptureBar e CaptureReviewModal
    │   ├── summary/           # Dashboard e graficos do resumo
    │   ├── ExportButton.tsx   # Botão de exportar
    │   ├── ErrorBoundary.tsx  # Tratamento de erros
    │   ├── RuleSection.tsx    # Seção genérica com tabela
    │   ├── inputs/            # Componentes de entrada
    │   ├── modals/            # Componentes de modal
    │   └── sections/          # Seções principais
    ├── hooks/                 # Hooks customizados
    ├── lib/                   # Utilitários e helpers
    │   ├── utils.ts           # Funções utilitárias
    │   ├── moneyInput.ts      # Máscara de moeda
    │   ├── storage.ts         # Persistência IndexedDB
    │   ├── schema.ts          # Schema de dados
    │   ├── ids.ts             # Geração de IDs
    │   ├── i18n.tsx           # Internacionalização
    │   ├── chartLoader.ts     # Lazy load de charts
    │   └── chartSeries.ts     # Dados para gráficos
    ├── selectors/             # Selectors (derive de dados)
    │   ├── buildMonth.ts      # Construção da view mensal
    │   ├── summarySelectors.ts# Dados para o resumo
    │   └── monthOverrideSelectors.ts
    ├── tests/                 # Testes automatizados
    └── ui/                    # Constantes de UI
```

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Executar testes
npm run test

# Verificar lint
npm run lint

# Formatar código
npm run format
```

## Modelo de Dados

O app segue o princípio: **o mês é derivado, não armazenado**.

### Despesas Fixas

```ts
interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  paymentMethod: string;
  card?: string | null;
  active: boolean;
  startMonth: string;
  endMonth: string | null;
  notes: string;
}
```

### Despesas Variaveis

```ts
interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  monthKey: string;
  category: string;
  paymentMethod: string;
  card?: string | null;
  paid: boolean;
  notes: string;
}
```

### Parcelamentos

```ts
interface Installment {
  id: string;
  name: string;
  totalInstallments: number;
  currentInstallment: number;
  installmentValue: number;
  card: string;
  category: string;
  startMonth: string;
  active: boolean;
  closedAt: string | null;
}
```

### Receitas

```ts
interface Revenue {
  id: string;
  name: string;
  baseAmount: number;
  active: boolean;
  startMonth: string;
  paymentDay?: number | null;
  recurring?: boolean;
  endMonth: string | null;
  notes: string;
}
```

### Cartoes

```ts
interface CardBillItem {
  id: string;
  name: string;
  color?: string;
  dueDay?: number | null;
  closingDay?: number | null;
}
```

### Overrides por Mes

`MonthOverride` guarda excecoes mensais de valor e pago/pendente para despesas,
receitas, parcelas e faturas.

## Arquitetura

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes completos sobre:

- camadas e responsabilidades;
- captura rapida e OCR;
- regras de dados e month view derivada;
- padroes de implementacao;
- regras obrigatorias para IA/agentes automatizados.

## Licença

MIT

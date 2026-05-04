# Controle Financeiro Pessoal

Aplicação React para controle de finanças pessoais com gestão de despesas fixas, parcelas, receitas e faturas de cartão.

## Funcionalidades

- **Despesas Fixas**: Cadastro e gestão de despesas recorrentes mensais
- **Parcelas**: Acompanhamento de compras parceladas
- **Receitas**: Registro de rendimentos com possível variação mensal
- **Faturas de Cartão**: Controle de faturas
- **Overrides Mensais**:personalização de valores por mês específico
- **Gráficos**: Visualização de despesas por categoria, cartão e status de pagamento
- **Tema Claro/Escuro**: Alternância de tema visual
- **Exportação**: Backup dos dados em JSON

## Tech Stack

- React 18
- Vite (build tool)
- TypeScript (strict mode)
- Chart.js (gráficos)
- Dexie (IndexedDB)
- ESLint + Prettier

## Estrutura do Projeto

```
src/
├── App.jsx                    # Componente raiz
├── main.jsx                   # Entry point
├── styles.css                 # Estilos globais
└── features/finance/
    ├── FinanceApp.tsx         # Componente principal
    ├── domain/
    │   ├── constants.ts       # Constantes e configurações
    │   ├── types.ts           # Tipagens de domínio
    │   └── actions.ts         # Lógica de negócio
    ├── context/
    │   └── FinanceContext.tsx # Provider de estado
    ├── components/
    │   ├── Summary.tsx        # Resumo financeiro
    │   ├── MonthNav.tsx       # Navegação de meses
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
    ├── tests/                 # Testes automatizados (ts/tsx)
    └── types.d.ts             # Declarações auxiliares
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

```js
{
  (id, name, amount, dueDay, category, paymentMethod, active, startMonth, endMonth, notes);
}
```

### Parcelas

```js
{
  (id,
    name,
    totalInstallments,
    currentInstallment,
    installmentValue,
    card,
    category,
    startMonth,
    active,
    closedAt);
}
```

### Receitas

```js
{
  (id, name, baseAmount, active, startMonth, endMonth, category, notes);
}
```

### Overrides por Mês

```js
{
  (id, type, itemId, monthKey, amount, paid);
}
```

## Arquitetura

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes completos sobre:

- Regras de edição (global vs mensal)
- Padrões de implementação
- Regras para contribuidores

## Licença

MIT

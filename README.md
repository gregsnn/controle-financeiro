# Controle Financeiro Pessoal

Aplicação React para controle de finanças pessoais com gestão de despesas fixas, parcelas, receitas e faturas de cartão.

## Funcionalidades

- **Despesas Fixas**: Cadastro e gestão de despesas recorrentes mensais
- **Parcelas**: Acompanhamento de compras parceladas
- **Receitas**: Registro de rendimentos com possível variação mensal
- **Faturas de Cartão**: Controle de faturas Santander e Nubank
- **Overrides Mensais**:personalização de valores por mês específico
- **Gráficos**: Visualização de despesas por categoria, cartão e status de pagamento
- **Tema Claro/Escuro**: Alternância de tema visual
- **Exportação**: Backup dos dados em JSON

## Tech Stack

- React 18
- Vite (build tool)
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
    ├── FinanceApp.jsx         # Componente principal
    ├── domain/
    │   ├── constants.js       # Constantes e configurações
    │   └── actions.js         # Lógica de negócio
    ├── context/
    │   └── FinanceContext.jsx # Provider de estado
    ├── components/
    │   ├── Summary.jsx        # Resumo financeiro
    │   ├── MonthNav.jsx       # Navegação de meses
    │   ├── ExportButton.jsx   # Botão de exportar
    │   ├── ErrorBoundary.jsx  # Tratamento de erros
    │   ├── RuleSection.jsx    # Seção genérica com tabela
    │   ├── inputs/            # Componentes de entrada
    │   ├── modals/            # Componentes de modal
    │   └── sections/          # Seções principais
    ├── hooks/                 # Hooks customizados
    ├── lib/                   # Utilitários e helpers
    │   ├── utils.js           # Funções utilitárias
    │   ├── moneyInput.js      # Máscara de moeda
    │   ├── storage.js         # Persistência IndexedDB
    │   ├── schema.js          # Schema de dados
    │   ├── ids.js             # Geração de IDs
    │   ├── i18n.jsx           # Internacionalização
    │   ├── chartLoader.js     # Lazy load de charts
    │   └── chartSeries.js     # Dados para gráficos
    ├── selectors/             # Selectors (derive de dados)
    │   ├── buildMonth.js      # Construção da view mensal
    │   ├── summarySelectors.js# Dados para o resumo
    │   └── monthOverrideSelectors.js
    └── tests/                 # Testes automatizados
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
{ id, name, amount, dueDay, category, paymentMethod, active, startMonth, endMonth, notes }
```

### Parcelas
```js
{ id, name, totalInstallments, currentInstallment, installmentValue, card, category, startMonth, active, closedAt }
```

### Receitas
```js
{ id, name, baseAmount, active, startMonth, endMonth, category, notes }
```

### Overrides por Mês
```js
{ id, type, itemId, monthKey, amount, paid }
```

## Arquitetura

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes completos sobre:
- Regras de edição (global vs mensal)
- Padrões de implementação
- Regras para contribuidores

## Licença

MIT
# Arquitetura - Ledger Web V1

Este documento descreve a arquitetura atual do app web apos o roadmap de
deduplicacao. Ele deve ser usado como referencia para manutencao, novas features
e futuras refatoracoes.

---

## 1. Visao Geral

- **Stack:** React 18, TypeScript, Vite 8, Vitest, ESLint, Prettier.
- **UI:** React com componentes locais, `lucide-react` para icones e CSS modularizado por area.
- **Persistencia:** IndexedDB via Dexie; preferencias/metricas leves de captura usam `localStorage` best-effort.
- **Graficos:** Chart.js, carregado sob demanda.
- **Estado global:** Context API com reducers/funcoes puras de dominio e hooks de fachada.
- **Dominio:** app financeiro mensal baseado em despesas fixas, despesas variaveis, parcelamentos, receitas e overrides por mes.
- **Captura rapida:** entrada textual global, OCR de cupom/DANFE via `tesseract.js`, leitura de PDF textual via `pdfjs-dist`, XML NF-e/NFC-e, preview/revisao e executor por actions existentes.
- **Idioma principal:** pt-BR.

O principio central da V1 e: **o mes e derivado, nao armazenado como fonte de verdade**.

---

## 2. Estrutura Principal

```text
src/
  App.tsx
  main.tsx
  styles.css
  styles/
    forms/
    navigation/
    sections/
    shared/
    theme/
  features/
    finance/
      FinanceApp.tsx
      capture/
      components/
      context/
      domain/
      hooks/
      lib/
      selectors/
      tests/
      ui/
```

### `features/finance`

Toda a aplicacao financeira vive nessa feature. Evite espalhar regra de negocio
fora dela.

```text
features/finance/
  FinanceApp.tsx                 # composicao principal da tela
  capture/                       # parser, detector, preview, executor, preferencias, sugestoes, OCR e metricas
  components/                    # UI, rows, modais, sections e composicao visual
  context/                       # provider, hidratacao e persistencia do estado
  domain/                        # tipos, constantes, reducers puros, factories, migracoes
  hooks/                         # orquestracao e facades para UI
  lib/                           # infra e utilitarios
  selectors/                     # dados derivados e calculos
  tests/                         # suite Vitest
  ui/                            # constantes de UI
```

---

## 3. Camadas e Responsabilidades

### 3.1 Components

`components/` deve conter renderizacao e eventos de interface. Nao coloque regra
de negocio duradoura em componentes.

Principais grupos:

- `app-shell/`: abas e tela de loading.
- `inputs/`: `Input`.
- `modals/`: `ModalShell`, `ConfirmModal`, `RuleModal`.
- `sections/`: telas de receitas, despesas e cartoes.
- `capture/`: `QuickCaptureBar` e `CaptureReviewModal`.
- `sections/shared/`: abstracoes compartilhadas pelas sections.
- `summary/`: dashboard/resumo e estados vazios de graficos.
- `CardBillsSection.tsx`: painel de faturas por cartao usado dentro da aba Cartoes.
- `MonthNav.tsx`: wrapper legado/testavel que combina navegacao mensal e `CardBillsSection`.
- `RuleSection.tsx`: tabela generica ordenavel usada pelas sections.

### 3.2 Sections

As sections especificas ainda preservam as diferencas de dominio:

- `RevenuesSection`: receitas recorrentes e override mensal de valor.
- `ExpensesSection`: composicao de Despesas; exibe `Fixas` e `Variaveis`.
- `FixedExpensesSection`: despesas fixas, override mensal de valor, pago/no pago e cartao.
- `VariableExpensesSection`: despesas variaveis do mes, cadastro rapido em linha, preferencias locais e CRUD.
- `InstallmentsSection`: parcelamentos, cartao e pago/no pago dentro da aba Cartoes.

O shell comum foi extraido para `sections/shared/CrudSection.tsx`, que cuida de:

- `RuleSection`;
- abertura de modal de criacao/edicao;
- confirmacao de delete;
- `RuleModal`;
- `ConfirmModal`;
- `useCrudFormFlow`.

As sections continuam responsaveis por preparar dados derivados locais e renderizar
suas rows. `ExpensesSection` e uma camada de composicao para a linguagem de
produto de despesas, unindo fixas e variaveis. `InstallmentsSection` e a excecao
visual principal: ela preserva os mesmos hooks, modais, payloads e acoes do CRUD,
mas renderiza cards de progresso em vez da tabela generica porque parcelamentos
se beneficiam de leitura temporal.

### 3.3 Capture

`capture/` concentra a reducao de friccao de entrada de dados. Componentes React
nao devem implementar parsing ou regra de decisao diretamente.

Arquivos principais:

- `types.ts`: contratos de `CaptureDraft`, intents, preview e contexto.
- `parser.ts`: coordena parsers primitivos e aplica preferencias locais.
- `intentDetector.ts`: classifica destino provavel sem executar actions.
- `previewBuilder.ts`: monta resumo revisavel do draft.
- `executor.ts`: converte draft validado em actions existentes do app.
- `preferences.ts`: memoria local best-effort por descricao normalizada.
- `suggestions.ts`: sugestoes pos-captura que abrem revisao, sem salvar automaticamente.
- `metrics.ts`: contadores locais de uso da captura, sem envio externo.
- `ocr/receiptParser.ts`: leitura de imagem, texto, PDF textual e XML NF-e/NFC-e; parsing de total/data/emitente/produto/chave e draft revisavel.

Regras:

- parser nunca altera estado financeiro;
- OCR/XML/PDF nunca salvam direto;
- baixa/pagamento ambiguo exige revisao;
- executor deve chamar hooks/actions existentes, nao reducers diretamente;
- preferencias e metricas sao descartaveis e nao fazem parte do export/import financeiro.

### 3.4 Domain

`domain/` deve ser puro e sem React.

Arquivos importantes:

- `types.ts`: tipos centrais (`FinanceState`, `FixedExpense`, `Installment`, `Revenue`, etc.).
- `constants.ts`: constantes de dominio (`OVERRIDE_TYPES`, metodos de pagamento, cores canonicas).
- `stateReducers.ts`: funcoes puras que alteram `FinanceState`.
- `factories.ts`: defaults de criacao (`createDefaultFixedExpense`, `createDefaultRevenue`, `createDefaultInstallment`).
- `migrations.ts`: migracoes de dados legados.
- `normalizers.ts`: normalizacao de dados importados/legados.
- `overrides/`: repositorio/facade para month overrides.

### 3.5 Hooks

`hooks/` faz a ponte entre UI, contexto e dominio.

Exemplos:

- `useFinanceActions`: fachada de acoes usadas pela UI.
- `useMonthOverridesActions`: operacoes mensais de overrides, faturas e pago/no pago.
- `useCharts`: ciclo de vida dos graficos.
- `useCardList`: normalizacao da lista dinamica de cartoes.
- `useCardDeleteReasons`: regras para impedir exclusao de cartao em uso.
- `useActiveFixedExpenses` e `useActiveRevenues`: filtros de itens ativos no mes.

### 3.6 Lib

`lib/` contem utilitarios e infraestrutura:

- `storage.ts`: IndexedDB/Dexie.
- `financeRepository.ts`: contrato de repositorio.
- `schema.ts`: estado vazio e versao de schema.
- `currency.ts` e `moneyInput.ts`: formatacao e mascara monetaria.
- `utils.ts`: utilitarios de data/mes, `clone`, `resolvePaymentMethod`, `softDeleteItem`.
- `exportData.ts`: import/export via arquivo/link.
- `chartLoader.ts`, `chartSeries.ts`, `charts/`: suporte aos graficos.
- `charts/chartTheme.ts`: tokens compartilhados para eixos, grades e textos de
  Chart.js.

### 3.7 Selectors

`selectors/` calcula dados derivados sem alterar estado:

- `buildMonth.ts`: constroi a visao mensal.
- `summarySelectors.ts`: dados do resumo, cards e graficos.
- `monthOverrideSelectors.ts`: seletores de overrides por mes.

---

## 4. Modelo de Dados

### 4.1 `FinanceState`

```ts
interface FinanceState {
  currentDate: Date;
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  installments: Installment[];
  revenues: Revenue[];
  monthOverrides: MonthOverride[];
  settings: Settings;
  meta: Meta;
}
```

### 4.2 Despesas Fixas

`FixedExpense` representa uma despesa recorrente. Na UI, ele aparece dentro da
aba **Despesas > Fixas**.

Campos principais:

- `id`
- `name`
- `amount`
- `dueDay`
- `category`
- `paymentMethod`
- `card`
- `active`
- `startMonth`
- `endMonth`
- `notes`

Remocao e soft-delete: a remocao define `endMonth` usando `softDeleteItem`.

### 4.3 Parcelamentos

`Installment` representa uma compra parcelada.

Campos principais:

- `id`
- `name`
- `totalInstallments`
- `currentInstallment`
- `installmentValue`
- `card`
- `category`
- `startMonth`
- `active`
- `closedAt`

Remocao e soft-delete: a remocao define `closedAt` usando `softDeleteItem`.

### 4.4 Despesas Variaveis

`VariableExpense` representa uma despesa lancada em um mes especifico.

Campos principais:

- `id`
- `name`
- `amount`
- `date`
- `monthKey`
- `category`
- `paymentMethod`
- `card`
- `paid`
- `notes`

Despesas variaveis entram em `buildMonth`, resumo, graficos e regras de uso de
cartao. Elas nao usam soft-delete; exclusao remove o item mensal.

### 4.5 Receitas

`Revenue` representa uma receita do mes, recorrente ou pontual.

Campos principais:

- `id`
- `name`
- `baseAmount`
- `active`
- `startMonth`
- `paymentDay`
- `recurring`
- `endMonth`
- `notes`

`startMonth` e o mes de validade inicial no dominio. Na UI, o usuario informa o
dia de recebimento (`paymentDay`) e se a receita e recorrente. Receitas nao
recorrentes aparecem apenas no mes em que foram criadas. Receitas podem ter
override mensal de valor.

### 4.6 Overrides Mensais

`MonthOverride` guarda excecoes de um mes especifico:

- valor mensal de gasto fixo;
- valor mensal de receita;
- pago/no pago de gasto fixo;
- pago/no pago de parcela;
- valor de fatura por cartao;
- pago/no pago de fatura.

Use `OVERRIDE_TYPES` para evitar strings soltas.

---

## 5. Fluxo de Dados

1. `FinanceProvider` hidrata o estado pelo repositorio/Dexie.
2. `FinanceApp` le estado e settings via contexto/hooks.
3. `buildMonth` deriva a visao do mes atual.
4. `useMonthOverridesActions` une overrides, faturas e eventos mensais.
5. `QuickCaptureBar` pode gerar `CaptureDraft`, abrir revisao ou executar action segura.
6. Sections renderizam dados derivados e disparam actions.
7. Reducers/factories atualizam o estado base.
8. Persistencia salva o estado no IndexedDB.

Regra importante: **nao salve a month view como dado primario**. Ela e sempre
derivada de `fixedExpenses`, `variableExpenses`, `installments`, `revenues` e
`monthOverrides`.

---

## 6. CRUD e Abstracoes Compartilhadas

A V1 usa um conjunto de helpers para evitar boilerplate:

- `useCrudState<TForm, TItem>`: estado de formulario, submit habilitado e delete.
- `useCrudModalState<T>`: estado dos modais de create/edit/delete.
- `useCrudFormFlow<TForm, TPayload>`: submit comum para create/edit.
- `createSectionLabels`: factory tipada para labels de section/modal/delete.
- `createFormHelpers`: factory tipada para empty form, edit form e payload.
- `CrudSection`: shell comum de `RuleSection` + modais.
- `RowActions`: acoes padrao de editar/excluir.
- `ModalShell`: wrapper visual compartilhado por modais.

Diretriz: quando criar uma nova section CRUD, reutilize esse conjunto antes de
adicionar uma nova variacao manual.

---

## 7. Estilos

Entrada global:

- `src/styles.css`

Organizacao atual:

- `styles/theme/`: tokens e variaveis.
- `styles/shared/`: utilidades compartilhadas, incluindo controles.
- `styles/navigation/`: mes, cartoes e navegacao.
- `styles/sections/`: cards, metricas, resumo e headers.
- `styles/forms/`: formularios, modais, inputs.

Regras:

- Evite duplicar base de botao/label.
- Use tokens existentes antes de criar novas cores.
- A linguagem visual atual segue a direcao FinFlow: topbar fixa, surfaces
  elevadas, accent verde, cards com `--shadow-surface`, tabs segmentadas e
  modais com backdrop escuro/blur.
- `--color-background-primary`, `--color-background-secondary`,
  `--color-background-elevated`, `--color-background-hover`,
  `--color-accent`, `--color-accent-strong`, `--color-accent-muted`,
  `--shadow-surface` e `--shadow-glow-accent` sao os tokens principais para
  novas superficies.
- Nao copie Tailwind, Next.js, mocks ou componentes do `finflow`; use-o apenas
  como referencia visual e adapte para os componentes/CSS locais.
- Para alertas orientativos, use os tokens `--color-alert-guidance-bg` e
  `--color-alert-guidance-border`; eles existem nos temas default e premium.
- A escala principal de espacamento vive em `styles/theme/tokens.css`:
  `--layout-gap-sm` (8px), `--layout-gap` (12px),
  `--layout-gap-section` (16px) e `--layout-gap-lg` (24px).
- Em shells, grids, cards e secoes, prefira esses tokens a valores soltos de
  espacamento.
- Microcopy de resumo deve priorizar clareza emocional: comunicar se o mes esta
  confortavel, apertado ou negativo antes de exibir detalhes tecnicos.
- Graficos devem ser apoio, nao a primeira resposta. Quando houver poucos dados,
  prefira estados compactos de insight; use Chart.js para comparacoes com
  diversidade suficiente.
- `ChartEmpty` deve permanecer como estado visual discreto, sem depender de emoji
  ou asset externo.
- Cards de parcelamento devem preservar progresso, valor mensal, parcela atual e
  status `Perto de quitar` sem alterar regra financeira.
- Ajustes mobile devem ser tratados com cuidado: a V1 nao foi originalmente
  desenhada mobile-first, entao validacao visual e obrigatoria quando houver
  mudanca responsiva.

---

## 8. Testes e Gates

Suite atual:

- Vitest + Testing Library + jsdom.
- Testes em `src/features/finance/tests`.
- Setup em `vitest.setup.ts`.

Gates para qualquer mudanca relevante:

```bash
npm run lint
npm test
npm run build
```

Gates recomendados antes de fechar release:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
git diff --check
```

Estado validado apos captura inteligente global:

- `npm run lint`: passou.
- `npm test`: passou, 294 testes.
- `npm run build`: passou.
- `tsc --noEmit --pretty false`: passou.
- `git diff --check`: passou.

---

## 9. Git, Hooks e Configuracao

O app vive dentro da pasta `web`, mas o repositorio Git esta na raiz `ledger`.

Configuracao relevante:

- `web/.husky/pre-commit` entra em `web` e roda lint/test.
- `package.json` possui `prepare` para configurar `core.hooksPath` como `web/.husky`.
- `.editorconfig` em `web` define LF, newline final e indentacao de 2 espacos.

Ressalvas atuais:

- `package-lock.json` deve permanecer versionado para permitir instalacao reprodutivel,
  especialmente apos a adicao de `tesseract.js`.
- `*roadmap*` esta ignorado por `.gitignore`, entao documentos como
  `roadmap-deduplicacao.md` e `ROADMAP_PHASE5_ANALYSIS.md` nao sao rastreados.
- `tsconfig.tsbuildinfo` aparece como arquivo rastreado/alteravel apos typecheck;
  se virar ruido recorrente, decidir se deve ser removido do Git e ignorado.

---

## 10. Warnings Conhecidos

Com `vite@8` e `@vitejs/plugin-react@4.7.0`, o build/test emite warnings sobre
React plugin, esbuild/Oxc e Rolldown.

Estado atual:

- os warnings nao quebram build;
- a recomendacao tecnica e atualizar `@vitejs/plugin-react` para uma versao
  compativel com Vite 8;
- nao migrar para `@vitejs/plugin-react-oxc`, pois o pacote foi deprecado em favor
  do proprio `@vitejs/plugin-react`.

Tratar essa atualizacao em uma mudanca separada.

---

## 11. Convencoes de Implementacao

- Mantenha mudancas pequenas e focadas.
- Preserve compatibilidade com dados persistidos no IndexedDB.
- Nao duplique regra de negocio em componentes.
- Prefira selectors/factories/hooks compartilhados quando houver padrao repetido.
- Evite `as any`; se precisar, documente o motivo ou melhore o tipo.
- Evite logs de debug em fluxo de usuario.
- Nao use `test.skip` para mascarar falhas.
- Se alterar comportamento financeiro, crie ou atualize testes.
- Se alterar UI sensivel, valide visualmente.

---

## 12. Regras Obrigatorias para IA

Estas regras sao bloqueantes para qualquer IA ou agente automatizado trabalhando
no projeto.

### 12.1 Escopo e Seguranca

- Trabalhe dentro de `web` salvo pedido explicito em contrario.
- Nao reverta alteracoes do usuario sem autorizacao explicita.
- Antes de editar, leia o contexto real dos arquivos afetados.
- Nao apague testes, dados, configuracoes ou arquivos de roadmap sem confirmar.
- Nao use comandos destrutivos (`git reset --hard`, checkout forcado, deletes recursivos) sem pedido claro.
- Se encontrar alteracoes inesperadas no worktree, trate como trabalho do usuario e preserve.

### 12.2 Arquitetura

- Nao coloque regra de negocio duradoura em componentes de UI.
- `domain/` deve permanecer puro e sem imports de React.
- Calculos e dados derivados devem ficar em `selectors/`, `domain/` ou `lib/`.
- Persistencia deve passar pelo repositorio/storage existente.
- Reutilize `CrudSection`, `ModalShell`, `useCrudState`, `createFormHelpers` e `createSectionLabels` antes de criar novo boilerplate.
- Nao duplique constantes, formatadores, factories, helpers de cartao ou logica de override.
- Evite `as any`; se for inevitavel, documente o motivo e limite o escopo.

### 12.3 Dados e Compatibilidade

- O mes e derivado, nao fonte de verdade.
- Nao altere o formato persistido no IndexedDB sem migracao compativel.
- Preserve `FinanceState`, `settings`, `meta` e `schemaVersion` com cuidado.
- Mudancas em import/export precisam manter compatibilidade com backups existentes.
- Regras de soft-delete devem usar `softDeleteItem` ou manter comportamento equivalente.

### 12.4 Testes e Validacao

- Mudanca de comportamento exige teste novo ou teste atualizado.
- Bug fix exige teste de regressao quando for razoavel reproduzir.
- Nunca use `test.skip`, `it.skip`, `describe.skip`, `@ts-ignore` ou logs de debug para contornar problema.
- Antes de concluir, rode no minimo:

```bash
npm run lint
npm test
npm run build
```

- Para fechamento de release ou refatoracao ampla, rode tambem:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
git diff --check
```

- Se algum gate falhar, a tarefa nao esta concluida.

### 12.5 UI e UX

- Preserve o comportamento atual de navegacao por mes, abas, modais, faturas e edicao.
- Alteracoes visuais relevantes exigem validacao visual.
- Mobile nao foi desenhado como prioridade inicial; nao faca refatoracao mobile ampla junto de ajustes pequenos.
- Evite texto de ajuda ou explicacoes novas dentro da UI sem necessidade de produto.

### 12.6 Documentacao

- Atualize `ARCHITECTURE.md`, roadmap ou `SESSION_PROGRESS.md` quando mudar arquitetura, fluxo, regra ou ressalva importante.
- Registre decisoes e trade-offs quando uma abstracao nova for criada.
- Se a tarefa ficar incompleta, documente exatamente o que falta e quais gates passaram.

---

## 13. Comandos

```bash
npm run dev       # dev server
npm run build     # build de producao
npm run preview   # preview do build
npm test          # suite Vitest
npm run lint      # ESLint
npm run lint:fix  # ESLint com fix
npm run format    # Prettier em TS/TSX/CSS
```

---

## 14. Estado da V1

O roadmap de deduplicacao foi concluido ate a Fase 6:

- tipos e constantes centralizados;
- utilitarios duplicados consolidados;
- CSS repetido reduzido;
- CRUD hooks/form helpers/labels compartilhados;
- sections migradas para `CrudSection`;
- modais compartilhando `ModalShell`;
- defaults de criacao centralizados em factories;
- soft-delete centralizado em `softDeleteItem`.

A V1 esta funcional pelos gates automatizados. Antes de publicar, recomenda-se:

1. decidir se documentos de roadmap devem ser versionados;
2. tratar warnings Vite/plugin React em uma mudanca isolada;
3. fazer uma validacao visual manual dos principais fluxos em desktop;
4. validar OCR em navegador real com imagens de cupom, pois testes cobrem parsing e
   fallback sem executar reconhecimento visual pesado.

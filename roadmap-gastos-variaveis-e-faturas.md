# Roadmap - Gastos Variaveis, Vencimento de Faturas e Baixa Friccao

## Contexto

Este roadmap planeja a proxima evolucao de produto apos a reorganizacao de
`Despesas` e `Cartoes`:

- criar de fato **despesas variaveis**;
- adicionar **data/dia de vencimento da fatura** em cada cartao;
- permitir **editar cartoes**;
- repensar o cadastro de gastos com foco em **minima friccao**.

A direcao de produto e clara: o usuario precisa conseguir registrar um gasto
rapido, sem sentir que esta preenchendo uma ficha contábil.

---

## Problema de Produto

Despesas variaveis tendem a ser o fluxo mais frequente do app. Se cadastrar uma
despesa exigir muitos passos, o usuario abandona.

O insight recebido foi:

- adicionar gasto em 3-5 segundos;
- autofill inteligente;
- categorias automaticas;
- repetir ultimo comportamento;
- OCR de nota/cupom;
- sugestao de recorrencia;
- previsao automatica de parcelas.

Minha leitura: isso faz muito sentido, mas precisa entrar em camadas. Se tentarmos
OCR, categorizacao automatica, recorrencia e parcelamento inteligente junto do
primeiro CRUD de variaveis, o risco de complexidade sobe muito.

O caminho recomendado e construir primeiro um **cadastro rapido muito bom** e
deixar automacoes inteligentes como melhorias incrementais.

---

## Decisoes de Produto

### 1. O Que E Uma Despesa Variavel

Uma despesa variavel e um gasto pontual do mes. Exemplos:

- mercado;
- farmacia;
- restaurante;
- combustivel;
- compra avulsa;
- manutencao;
- lazer.

Ela deve afetar o mes em que foi lancada e aparecer no resumo/graficos.

### 2. Variavel Nao E Fixa

Despesa fixa tem recorrencia por natureza.
Despesa variavel nasce pontual.

Se o usuario quiser repetir, isso deve ser uma decisao explicita ou uma sugestao
do app, nao comportamento padrao.

### 3. Cartao Como Meio, Nao Como Tipo

Uma despesa variavel pode ser paga por:

- dinheiro;
- pix;
- debito;
- boleto;
- cartao.

Se for cartao, ela precisa se relacionar com a fatura certa. Para isso, cada
cartao precisa ter um dia de vencimento.

---

## Modelo Mental Proposto

```text
Despesas
  Fixas
    - recorrentes
    - com vencimento mensal
    - podem ir para cartao ou outro pagamento

  Variaveis
    - pontuais
    - com data do gasto
    - podem ir para cartao ou outro pagamento
    - podem ser pagas/pendentes

Cartoes
  Faturas do mes
    - valor total
    - vencimento
    - pago/pendente
    - abatimentos

  Parcelamentos
    - compras parceladas
    - impacto mensal
```

---

## Campos de Despesa Variavel

### Campos Minimos Para V1

Para nao matar a friccao, o cadastro precisa ter poucos campos obrigatorios:

- `name`: descricao;
- `amount`: valor;
- `date`: data do gasto;
- `paymentMethod`: forma de pagamento;
- `category`: categoria.

Campos condicionais:

- `card`: obrigatorio apenas se `paymentMethod` for `cartao`;
- `paid`: status pago/pendente;
- `notes`: opcional.

### Campos Que Nao Entram Primeiro

Nao colocar na primeira versao, salvo se ficar muito barato:

- OCR;
- anexos;
- subcategorias;
- tags;
- local/estabelecimento separado;
- comprovante;
- recorrencia automatica;
- parcelamento automatico dentro do fluxo de variavel.

---

## Vencimento de Fatura por Cartao

### Novo Campo

Cada cartao deve ter:

- `dueDay`: dia de vencimento da fatura.

Exemplo:

```ts
interface CardBillItem {
  id: string;
  name: string;
  color?: string;
  dueDay?: number | null;
}
```

### Criacao de Cartao

No modal de criar cartao:

- nome do cartao;
- fatura inicial opcional;
- dia de vencimento opcional, mas recomendado.

Texto sugerido:

> Dia de vencimento ajuda o app a organizar melhor suas faturas. Voce pode
> preencher depois.

### Edicao de Cartao

Precisamos adicionar edicao de cartao porque, sem isso, qualquer erro no nome ou
vencimento vira dado preso.

Editar cartao deve permitir:

- alterar nome;
- alterar vencimento;
- manter cor detectada automaticamente;
- talvez recalcular cor se o nome mudar.

Excluir continua respeitando `useCardDeleteReasons`.

---

## Como Vencimento Afeta a Fatura

Aqui ha uma decisao importante.

### Opcao A - Simples Para V1

Toda despesa variavel do mes atual vinculada ao cartao entra na fatura do mes
atual, independente da data do gasto.

Vantagens:

- simples;
- previsivel;
- menor risco;
- encaixa no modelo atual do app.

Desvantagens:

- nao modela fechamento/vencimento real do cartao;
- compras apos fechamento podem cair na fatura errada.

### Opcao B - Mais Realista

Adicionar tambem `closingDay` ou inferir fechamento a partir de `dueDay`. A data
do gasto decide em qual fatura a compra cai.

Vantagens:

- mais proximo da vida real;
- faturas ficam mais corretas.

Desvantagens:

- muito mais complexo;
- exige explicar fechamento de fatura;
- aumenta friccao;
- pode confundir usuario no inicio.

### Recomendacao

Para a V1 deste roadmap: **usar Opcao A**.

Adicionar apenas `dueDay` agora para informacao, exibicao e organizacao. Deixar
fechamento real de fatura para um roadmap futuro.

---

## Baixa Friccao no Cadastro

### Regra de Ouro

O fluxo principal precisa funcionar com:

1. descricao;
2. valor;
3. confirmar.

O resto deve ser preenchido por padroes inteligentes.

### Defaults Inteligentes Para V1

Ao abrir "Nova despesa variavel":

- `date`: hoje ou mes selecionado;
- `category`: ultima categoria usada ou `OUTRO`;
- `paymentMethod`: ultimo metodo usado;
- `card`: ultimo cartao usado, se metodo for cartao;
- `paid`: `true` para pix/debito/dinheiro, `false` ou pendente para cartao/boleto.

### Cadastro Rapido

Proposta para o modal:

Campos sempre visiveis:

- descricao;
- valor.

Campos compactos abaixo:

- data;
- categoria;
- pagamento;
- cartao, apenas se pagamento for cartao;
- status pago/pendente.

Nao usar um formulario longo com tudo ocupando o mesmo peso visual.

### Sugestoes Futuras

Depois do CRUD basico:

- sugerir categoria pela descricao;
- lembrar ultimo comportamento por descricao;
- botao "repetir ultimo gasto";
- converter variavel em fixa;
- converter variavel em parcelamento;
- OCR de cupom/nota.

---

## Fase 0 - Decisoes Antes de Implementar

**Objetivo:** evitar criar uma regra errada no dominio.

| Passo | Acao                                                                           |
| ----- | ------------------------------------------------------------------------------ |
| 0.1   | [feito] Confirmar se despesa variavel e sempre mensal/pontual.                 |
| 0.2   | [feito] Confirmar que `dueDay` do cartao entra agora sem logica de fechamento. |
| 0.3   | [feito] Confirmar que edicao de cartao entra antes ou junto de `dueDay`.       |
| 0.4   | [feito] Confirmar campos obrigatorios do cadastro rapido: descricao e valor.   |
| 0.5   | [feito] Confirmar defaults inteligentes iniciais.                              |

---

## Fase 1 - Modelo de Dados

**Objetivo:** preparar dominio e persistencia.

| Passo | Acao                                                                  |
| ----- | --------------------------------------------------------------------- |
| 1.1   | [feito] Criar tipo `VariableExpense`.                                 |
| 1.2   | [feito] Adicionar `variableExpenses` em `FinanceState`.               |
| 1.3   | [feito] Criar factory `createDefaultVariableExpense`.                 |
| 1.4   | [feito] Criar normalizer para dados importados/legados.               |
| 1.5   | [feito] Criar reducers: add/update/remove.                            |
| 1.6   | [feito] Atualizar schema/migrations se necessario.                    |
| 1.7   | [feito] Incluir `VariableExpense` nos tipos de actions/context/hooks. |

Campos iniciais sugeridos:

```ts
interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  category: string;
  paymentMethod: string;
  card?: string | null;
  paid: boolean;
  notes: string;
}
```

---

## Fase 2 - Selectors e Resumo

**Objetivo:** fazer despesas variaveis afetarem a leitura mensal.

| Passo | Acao                                                                         |
| ----- | ---------------------------------------------------------------------------- |
| 2.1   | [feito] Incluir variaveis em `buildMonthView`.                               |
| 2.2   | [feito] Atualizar totais: despesas variaveis, despesas totais e saldo.       |
| 2.3   | [feito] Atualizar graficos de distribuicao por categoria/cartao.             |
| 2.4   | [feito] Atualizar cards de resumo que hoje consideram fixas + parcelamentos. |
| 2.5   | [feito] Atualizar selectors de paid/pending se variaveis tiverem status.     |

---

## Fase 3 - UI de Despesas Variaveis

**Objetivo:** substituir placeholder por CRUD funcional.

| Passo | Acao                                                       |
| ----- | ---------------------------------------------------------- |
| 3.1   | [feito] Criar `VariableExpensesSection`.                   |
| 3.2   | [feito] Criar row/tabela ou lista compacta para variaveis. |
| 3.3   | [feito] Criar form/modal de cadastro rapido.               |
| 3.4   | [feito] Integrar com `ExpensesSection` na aba `Variaveis`. |
| 3.5   | [feito] Criar edicao/exclusao usando fluxo modal atual.    |
| 3.6   | [feito] Garantir empty state bom e curto.                  |

### Forma Visual Recomendada

Comecar com tabela parecida com despesas fixas, mas mais rapida de escanear:

- descricao;
- categoria;
- pagamento/cartao;
- data;
- valor;
- status;
- acoes.

Depois, se ficar muito pesado, evoluir para lista compacta.

---

## Fase 4 - Baixa Friccao

**Objetivo:** reduzir tempo real de cadastro.

| Passo | Acao                                                                                       |
| ----- | ------------------------------------------------------------------------------------------ |
| 4.1   | [feito] Criar defaults de formulario com comportamento simples por mes/cartao.             |
| 4.2   | [feito] Persistir preferencias simples: ultima categoria, ultimo pagamento, ultimo cartao. |
| 4.3   | [feito] Focar primeiro campo automaticamente ao abrir modal.                               |
| 4.4   | [feito] Permitir submit rapido por Enter quando campos minimos estiverem validos.          |
| 4.5   | [feito] Manter campos secundarios compactos e pre-preenchidos.                             |
| 4.6   | [feito] Avaliar um botao/linha de "Adicionar rapido" dentro de `Variaveis`.                |

---

## Fase 5 - Cartoes com Vencimento e Edicao

**Objetivo:** tornar cartoes editaveis e preparar faturas para leitura melhor.

| Passo | Acao                                                                           |
| ----- | ------------------------------------------------------------------------------ |
| 5.1   | [feito] Adicionar `dueDay` em `CardBillItem`.                                  |
| 5.2   | [feito] Atualizar modal de novo cartao com campo opcional `Dia de vencimento`. |
| 5.3   | [feito] Criar acao de editar cartao.                                           |
| 5.4   | [feito] Criar modal de edicao de cartao.                                       |
| 5.5   | [feito] Exibir vencimento no card de fatura sem poluir visual.                 |
| 5.6   | [feito] Garantir que renomear cartao nao quebre referencias por `id`.          |
| 5.7   | [feito] Atualizar testes de adicionar/editar/excluir cartao.                   |

### Observacao Sobre ID

O `id` do cartao deve continuar estavel. Editar nome nao deve gerar novo id,
porque despesas, fixas e parcelamentos referenciam o cartao por id.

---

## Fase 6 - Testes

**Objetivo:** proteger regras novas.

| Passo | Acao                                                                   |
| ----- | ---------------------------------------------------------------------- |
| 6.1   | [feito] Testes de reducers/factories/normalizers de `VariableExpense`. |
| 6.2   | [feito] Testes de `buildMonthView` com variaveis.                      |
| 6.3   | [feito] Testes de resumo e graficos com variaveis.                     |
| 6.4   | [feito] Testes de `VariableExpensesSection`.                           |
| 6.5   | [feito] Testes de criacao/edicao de cartao com `dueDay`.               |
| 6.6   | [feito] Testes de bloqueio de exclusao de cartao em uso por variaveis. |

---

## Fase 7 - Futuro: Inteligencia e Automacao

**Objetivo:** atacar retencao depois do fluxo basico estar solido.

| Ideia                              | Quando faz sentido                               |
| ---------------------------------- | ------------------------------------------------ |
| Categoria automatica por descricao | Depois de termos historico local suficiente.     |
| Repetir ultimo gasto               | Logo apos CRUD basico, baixo custo e alto ganho. |
| Sugestao de recorrencia            | Depois de detectar padroes repetidos.            |
| Converter em fixa                  | Depois de variaveis estarem estaveis.            |
| Converter em parcelamento          | Depois de termos fluxo claro de cartao/fatura.   |
| OCR de cupom/nota                  | Futuro; alto impacto, alta complexidade.         |

---

## Perguntas Em Aberto

1. [decidido] Despesa variavel paga no cartao entra no rastreamento da fatura
   do cartao no mes, seguindo a opcao simples da V1.
2. [decidido] O usuario pode marcar uma despesa variavel como paga/pendente.
3. [decidido] Parcelar uma variavel continua fora da V1; permanece em
   `Parcelamentos`.
4. [decidido] `dueDay` do cartao e informativo agora, sem alertas no resumo.
5. [decidido] O cadastro rapido comeca em modal compacto; linha inline fica
   para melhoria futura.

---

## Recomendacao de Execucao

1. Fechar as perguntas da Fase 0.
2. Implementar `VariableExpense` sem automacoes.
3. Fazer variaveis aparecerem em resumo/graficos.
4. Criar cadastro rapido com defaults simples.
5. Adicionar `dueDay` e edicao de cartao.
6. Depois atacar automacoes de baixa friccao.

Minha recomendacao pratica: nao comecar por OCR nem categorizacao automatica. O
primeiro ganho real vem de um formulario rapido, pre-preenchido e confiavel.

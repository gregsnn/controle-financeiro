# Roadmap - Captura Inteligente Global

## Contexto

Este roadmap planeja uma mudanca estrutural de produto: reduzir a friccao de
entrada de dados em todo o app, nao apenas em despesas variaveis.

A direcao e clara:

- o usuario deve conseguir registrar informacoes em poucos segundos;
- formularios completos continuam existindo para revisao e correcao;
- o caminho principal deve ser captura rapida, inteligente e tolerante;
- nenhuma regra atual de dominio deve ser quebrada durante a migracao.

O app deve deixar de depender de "abrir a secao certa, abrir modal, preencher
todos os campos" como fluxo principal.

---

## Principio Central

**Captura primeiro, classificacao depois.**

O usuario escreve uma entrada natural e o app interpreta a intencao, preenche o
maximo possivel e direciona para a entidade correta.

Exemplos:

```text
mercado 123,45
internet 120 todo mes dia 10
geladeira 2400 10x itau
salario 5000 todo dia 5
freela 1200 dia 18
nubank 2539 vence 12
paguei nubank
paguei luz
```

Cada entrada vira um destino de dominio:

- `VariableExpense`;
- `FixedExpense`;
- `Installment`;
- `Revenue`;
- `CardBill`;
- `MonthOverride`.

---

## Escopo Total

Este roadmap cobre tudo que entra no app:

1. despesas variaveis;
2. despesas fixas;
3. parcelamentos;
4. receitas recorrentes;
5. receitas pontuais;
6. faturas de cartao;
7. vencimento de cartao;
8. baixa de faturas;
9. baixa de despesas fixas;
10. baixa de parcelamentos;
11. repeticao de comportamento anterior;
12. categorizacao automatica;
13. sugestao de recorrencia;
14. previsao de parcelamento;
15. OCR de nota/cupom;
16. revisao e correcao antes de salvar.

Nada disso deve remover os CRUDs atuais. Eles continuam como camada de edicao,
auditoria e recuperacao.

---

## Arquitetura Proposta

Criar uma nova camada dentro de `features/finance`:

```text
features/finance/
  capture/
    types.ts
    parser.ts
    tokenizer.ts
    intentDetector.ts
    amountParser.ts
    dateParser.ts
    recurrenceParser.ts
    installmentParser.ts
    paymentParser.ts
    cardMatcher.ts
    categoryClassifier.ts
    confidence.ts
    previewBuilder.ts
    executor.ts
    preferences.ts
    ocr/
      types.ts
      receiptParser.ts
```

### Responsabilidades

- `parser`: coordena a leitura da entrada natural.
- `intentDetector`: decide o tipo provavel de acao.
- `previewBuilder`: monta uma previsualizacao editavel antes de salvar.
- `executor`: converte a previsualizacao em actions reais do app.
- `preferences`: memoria local de padroes do usuario.
- `ocr`: leitura de cupom/nota, sem contaminar o parser textual.

Componentes React devem consumir essa camada, nao conter regra de parsing.

---

## Modelo de Captura

### `CaptureIntent`

```ts
type CaptureIntent =
  | 'variableExpense'
  | 'fixedExpense'
  | 'installment'
  | 'revenue'
  | 'cardBill'
  | 'markAsPaid'
  | 'unknown';
```

### `CaptureDraft`

```ts
interface CaptureDraft {
  id: string;
  rawText: string;
  intent: CaptureIntent;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  fields: Record<string, unknown>;
  missingFields: string[];
  alternatives: CaptureIntent[];
}
```

### `CaptureResult`

```ts
interface CaptureResult {
  draft: CaptureDraft;
  executable: boolean;
  destinationLabel: string;
}
```

---

## Regras de Produto

### 1. Fallback Seguro

Se o app nao entender direito, ele nunca deve inventar uma regra perigosa.

Fallback:

- valor + descricao -> despesa variavel;
- sem valor -> draft nao executavel;
- baixa ambigua -> pedir confirmacao;
- cartao ambiguo -> usar ultimo cartao ou pedir escolha.

### 2. Confirmacao Quando Houver Risco

Salvar direto apenas quando a confianca for alta.

Exemplos de confianca alta:

- `mercado 123,45`;
- `paguei nubank`;
- `salario 5000 todo dia 5`;
- `teclado 300 3x itau`, se `itau` existir.

Exemplos de confianca media/baixa:

- `internet`;
- `paguei conta`;
- `cartao 200`;
- `compra 10x`.

### 3. Formularios Viram Revisao

Os modais atuais continuam, mas a captura deve abrir uma previsualizacao compacta:

- destino sugerido;
- campos preenchidos;
- campos faltantes;
- botao de salvar;
- botao de editar detalhes.

### 4. Aprendizado Local Primeiro

Antes de IA externa:

- memorizar categoria por descricao;
- memorizar pagamento por descricao;
- memorizar cartao por descricao;
- memorizar recorrencia por descricao;
- memorizar preferencia por destino.

### 5. OCR Entra Como Fonte de Captura

OCR nao deve ser outro fluxo de dominio. Ele deve produzir texto/itens e entrar
na mesma pipeline:

```text
imagem -> OCR -> itens candidatos -> CaptureDraft[] -> revisao -> executor
```

---

## Entradas Suportadas

### Despesa Variavel

Exemplos:

```text
mercado 123,45
uber 32 pix
farmacia 88,90 debito
restaurante 140 itau
```

Resultado:

- `VariableExpense`;
- data padrao: hoje ou mes selecionado;
- categoria por memoria/classificador;
- pagamento por token ou ultima preferencia;
- cartao quando detectado.

### Despesa Fixa

Exemplos:

```text
internet 120 todo mes dia 10
aluguel 2500 mensal dia 5 boleto
academia 89,90 recorrente cartao
```

Resultado:

- `FixedExpense`;
- `active: true`;
- `startMonth: currentMonthKey`;
- `dueDay` detectado ou sugerido;
- pagamento detectado/default.

### Parcelamento

Exemplos:

```text
geladeira 2400 10x itau
teclado 300 em 3 vezes nubank
sofa 2800 4/6 santander
```

Resultado:

- `Installment`;
- calcular `installmentValue` quando houver total + parcelas;
- aceitar parcela atual quando informada;
- exigir cartao se nao detectado.

### Receita

Exemplos:

```text
salario 5000 todo dia 5
freela 1200 dia 18
recebi 3000 projeto
aluguel recebido 900 todo mes dia 10
```

Resultado:

- `Revenue`;
- recorrente quando houver `todo`, `mensal`, `salario`, `aluguel`;
- pontual quando houver `freela`, `recebi`, ou ausencia de recorrencia;
- `paymentDay` detectado;
- `startMonth` atual.

### Fatura de Cartao

Exemplos:

```text
nubank 2539,90
itau fatura 1200 vence 12
cartao sicredi 900,00
```

Resultado:

- `setMonthCardBill`;
- opcionalmente atualizar `dueDay` do cartao se vier `vence`.

### Baixa / Pagamento

Exemplos:

```text
paguei nubank
paguei luz
paguei teclado
recebi salario
```

Resultado:

- fatura: `CARD_BILL_PAYMENT`;
- fixa: `FIXED_EXPENSE_PAYMENT`;
- parcela: `INSTALLMENT_PAYMENT`;
- receita: se necessario, futuro override/status de recebimento.

Se houver mais de um candidato, abrir revisao.

---

## Preferencias e Memoria

Persistir localmente, separado do dominio financeiro principal:

```ts
interface CapturePreferences {
  lastDestination: CaptureIntent;
  lastCategoryByText: Record<string, string>;
  lastPaymentByText: Record<string, string>;
  lastCardByText: Record<string, string>;
  lastRecurringByText: Record<string, boolean>;
  lastGlobalPaymentMethod: string;
  lastGlobalCard: string | null;
}
```

### Regras

- memoria melhora sugestoes, mas nao deve ser fonte de verdade;
- export/import financeiro nao precisa incluir isso na primeira versao;
- limpar storage nao pode quebrar a aplicacao;
- preferencias devem ser best-effort.

---

## UX Proposta

### Entrada Global

Adicionar um componente sempre disponivel no topo do dashboard:

```text
Adicionar: "mercado 123,45"
```

Estados:

- idle;
- digitando;
- preview;
- salvando;
- salvo;
- precisa revisar.

### Preview Compacto

Antes de salvar quando necessario:

```text
Despesa variavel
Mercado - R$ 123,45
Categoria: CASA
Pagamento: Pix
[Salvar] [Editar detalhes]
```

### Multiresultado

OCR ou texto com varios itens pode gerar lista:

```text
3 itens encontrados
- Mercado R$ 80,00
- Padaria R$ 15,50
- Farmacia R$ 42,90
[Salvar todos] [Revisar]
```

### Atalhos

- Enter salva quando confianca alta.
- Cmd/Ctrl+K foca captura global.
- Escape fecha preview.

---

## Fase 0 - Preparacao e Contratos

**Objetivo:** criar a base sem alterar comportamento atual.

| Passo | Acao                                                                                           |
| ----- | ---------------------------------------------------------------------------------------------- |
| 0.1   | [feito] Criar `capture/types.ts` com contratos de draft, intent e result.                      |
| 0.2   | [feito] Criar fixtures de cartoes, categorias, despesas, receitas e parcelamentos para testes. |
| 0.3   | [feito] Criar testes base de parser antes de plugar na UI.                                     |
| 0.4   | [feito] Definir matriz de exemplos reais que devem ser suportados.                             |
| 0.5   | [feito] Garantir que nenhuma action existente seja chamada diretamente pelo parser.            |

Critério de aceite:

- parser ainda nao aparece na UI;
- testes de contratos passam;
- zero mudanca visual.

---

## Fase 1 - Parser Textual Base

**Objetivo:** interpretar texto livre sem salvar nada.

| Passo | Acao                                                                      |
| ----- | ------------------------------------------------------------------------- |
| 1.1   | [feito] Criar tokenizer tolerante a acentos, maiusculas, simbolos e `R$`. |
| 1.2   | [feito] Criar parser de valor monetario.                                  |
| 1.3   | [feito] Criar parser de data/dia.                                         |
| 1.4   | [feito] Criar detector de cartao conhecido.                               |
| 1.5   | [feito] Criar detector de metodo de pagamento.                            |
| 1.6   | [feito] Criar detector de recorrencia.                                    |
| 1.7   | [feito] Criar detector de parcelamento (`10x`, `em 10 vezes`, `4/10`).    |
| 1.8   | [feito] Criar classificador inicial de categoria por palavras-chave.      |

Critério de aceite:

- texto vira `CaptureDraft`;
- nenhum dado e persistido;
- casos ambiguos retornam `confidence: low | medium`.

---

## Fase 2 - Detector de Intencao

**Objetivo:** decidir destino correto.

| Passo | Acao                                                                                     |
| ----- | ---------------------------------------------------------------------------------------- |
| 2.1   | [feito] Detectar despesa variavel como fallback com descricao + valor.                   |
| 2.2   | [feito] Detectar despesa fixa com termos de recorrencia.                                 |
| 2.3   | [feito] Detectar parcelamento com `x` ou `vezes`.                                        |
| 2.4   | [feito] Detectar receita com `salario`, `recebi`, `freela`, `renda`, `aluguel recebido`. |
| 2.5   | [feito] Detectar fatura de cartao por nome de cartao + valor + termos de fatura.         |
| 2.6   | [feito] Detectar baixa/pagamento por `paguei`, `pago`, `quitado`, `recebi`.              |
| 2.7   | [feito] Gerar alternativas quando houver empate de intencao.                             |

Critério de aceite:

- exemplos principais caem no destino esperado;
- baixa ambigua nao salva automaticamente.

---

## Fase 3 - Preview e Executor

**Objetivo:** transformar draft em action real com seguranca.

| Passo | Acao                                                                      |
| ----- | ------------------------------------------------------------------------- |
| 3.1   | [feito] Criar `previewBuilder` para cada destino.                         |
| 3.2   | [feito] Criar `executor` que recebe actions como dependencia.             |
| 3.3   | [feito] Mapear draft para `addVariableExpense`.                           |
| 3.4   | [feito] Mapear draft para `addFixedExpense`.                              |
| 3.5   | [feito] Mapear draft para `addInstallment`.                               |
| 3.6   | [feito] Mapear draft para `addRevenue`.                                   |
| 3.7   | [feito] Mapear draft para `setMonthCardBill`.                             |
| 3.8   | [feito] Mapear draft para `toggleMonthPaid` quando for baixa.             |
| 3.9   | [feito] Bloquear execucao quando `missingFields` tiver campo obrigatorio. |

Critério de aceite:

- executor e testado com actions mockadas;
- nao duplica factory/reducer;
- usa actions existentes.

---

## Fase 4 - Entrada Global na UI

**Objetivo:** dar ao usuario um unico ponto de captura.

| Passo | Acao                                                                        |
| ----- | --------------------------------------------------------------------------- |
| 4.1   | [feito] Criar `QuickCaptureBar`.                                            |
| 4.2   | [feito] Posicionar no topo do dashboard, abaixo da topbar e acima das tabs. |
| 4.3   | [feito] Mostrar preview inline quando houver draft.                         |
| 4.4   | [feito] Permitir salvar direto com Enter para confianca alta.               |
| 4.5   | [feito] Permitir revisar quando confianca media/baixa.                      |
| 4.6   | [feito] Adicionar estado de sucesso curto apos salvar.                      |
| 4.7   | [feito] Adicionar atalho `Ctrl/Cmd+K` para focar.                           |

Critério de aceite:

- usuario consegue adicionar despesa variavel sem abrir aba/modal;
- UI existente continua funcionando.

---

## Fase 5 - Revisao Universal

**Objetivo:** permitir corrigir qualquer draft antes de salvar.

| Passo | Acao                                                               |
| ----- | ------------------------------------------------------------------ |
| 5.1   | [feito] Criar `CaptureReviewModal`.                                |
| 5.2   | [feito] Renderizar campos conforme destino.                        |
| 5.3   | [feito] Permitir trocar destino manualmente.                       |
| 5.4   | [feito] Validar obrigatorios por destino.                          |
| 5.5   | [feito] Exibir avisos e confianca.                                 |
| 5.6   | [feito] Permitir `Salvar`, `Salvar e adicionar outro`, `Cancelar`. |

Critério de aceite:

- qualquer captura ambigua pode ser corrigida;
- modais CRUD atuais continuam intactos.

---

## Fase 6 - Memoria e Autofill Inteligente

**Objetivo:** reduzir repeticao de escolhas.

| Passo | Acao                                                               |
| ----- | ------------------------------------------------------------------ |
| 6.1   | [feito] Criar `capture/preferences.ts`.                            |
| 6.2   | [feito] Memorizar categoria por descricao normalizada.             |
| 6.3   | [feito] Memorizar pagamento por descricao normalizada.             |
| 6.4   | [feito] Memorizar cartao por descricao normalizada.                |
| 6.5   | [feito] Memorizar recorrencia por descricao normalizada.           |
| 6.6   | [feito] Aplicar preferencias no parser antes do fallback.          |
| 6.7   | [feito] Atualizar preferencias apos salvamento manual ou revisado. |

Critério de aceite:

- repetir `mercado 123` sugere a mesma categoria/pagamento da ultima vez;
- preferencias corrompidas no storage sao ignoradas.

---

## Fase 7 - Sugestoes Pos-Captura

**Objetivo:** ajudar sem atrapalhar o fluxo rapido.

| Passo | Acao                                                                        |
| ----- | --------------------------------------------------------------------------- |
| 7.1   | [feito] Sugerir "tornar fixa" como revisao para despesa variavel candidata. |
| 7.2   | [feito] Sugerir "parcelar" quando houver valor alto e cartao.               |
| 7.3   | [feito] Sugerir "usar mesmo cartao da ultima vez".                          |
| 7.4   | [feito] Sugerir "marcar como pago" conforme metodo.                         |
| 7.5   | [feito] Criar UI discreta para aceitar/ignorar sugestao.                    |

Critério de aceite:

- sugestoes nunca bloqueiam o salvamento;
- sugestoes ignoradas nao voltam imediatamente de forma insistente.

---

## Fase 8 - OCR de Nota/Cupom

**Objetivo:** entrada por imagem usando a mesma pipeline.

| Passo | Acao                                                                              |
| ----- | --------------------------------------------------------------------------------- |
| 8.1   | [feito] Criar contrato `ReceiptCaptureSource`.                                    |
| 8.2   | [feito] Permitir upload/captura de imagem.                                        |
| 8.3   | [feito] Extrair texto via OCR.                                                    |
| 8.4   | [feito] Detectar total, data e estabelecimento.                                   |
| 8.5   | [feito] Gerar `CaptureDraft` unico para o total da nota.                          |
| 8.6   | [feito] Opcional: gerar multiplos drafts por item se a leitura estiver confiavel. |
| 8.7   | [feito] Exigir revisao antes de salvar OCR.                                       |
| 8.8   | [feito] Ler XML NF-e/NFC-e de forma estruturada, sem depender de OCR.             |
| 8.9   | [feito] Ler PDF textual de NF/cupom com `pdfjs-dist`.                            |
| 8.10  | [feito] Melhorar DANFE/TXT para priorizar total da nota, emitente e produto.      |

Critério de aceite:

- OCR/XML/PDF nunca salvam direto sem revisao;
- se OCR falhar, usuario ainda consegue preencher manualmente.

---

## Fase 9 - Integracao com Abas Existentes

**Objetivo:** fazer a captura conversar com as telas atuais.

| Passo | Acao                                                                   |
| ----- | ---------------------------------------------------------------------- |
| 9.1   | [feito] Apos salvar, oferecer link para abrir o item na aba correta.   |
| 9.2   | [feito] Atualizar resumo imediatamente pelo estado global.             |
| 9.3   | [feito] Garantir que faturas atualizam ao capturar gasto no cartao.    |
| 9.4   | [feito] Garantir que receitas pontuais aparecem apenas no mes correto. |
| 9.5   | [feito] Garantir que parcelamentos aparecem em Cartoes.                |
| 9.6   | [feito] Garantir que baixas aparecem como overrides mensais.           |

Critério de aceite:

- usuario nao precisa navegar para conferir que salvou;
- se navegar, encontra o item no destino esperado.

---

## Fase 10 - Testes e Qualidade

**Objetivo:** proteger a mudanca estrutural.

| Passo | Acao                                                 |
| ----- | ---------------------------------------------------- |
| 10.1  | [feito] Testes unitarios de parser monetario.        |
| 10.2  | [feito] Testes unitarios de data/dia.                |
| 10.3  | [feito] Testes unitarios de recorrencia.             |
| 10.4  | [feito] Testes unitarios de parcelamento.            |
| 10.5  | [feito] Testes unitarios de intent detector.         |
| 10.6  | [feito] Testes de executor com actions mockadas.     |
| 10.7  | [feito] Testes de `QuickCaptureBar`.                 |
| 10.8  | [feito] Testes de `CaptureReviewModal`.              |
| 10.9  | [feito] Testes de preferencias corrompidas/ausentes. |
| 10.10 | [feito] Testes de regressao para CRUDs existentes.   |
| 10.11 | [feito] Testes de buildMonth/summary apos capturas.  |

Critério de aceite:

- suite completa passa;
- build passa;
- lint passa;
- `git diff --check` passa.

---

## Fase 11 - Acessibilidade e Teclado

**Objetivo:** captura rapida precisa ser realmente rapida e acessivel.

| Passo | Acao                                                                    |
| ----- | ----------------------------------------------------------------------- |
| 11.1  | [feito] `QuickCaptureBar` com label acessivel.                          |
| 11.2  | [feito] Preview anunciado por `aria-live`.                              |
| 11.3  | [feito] `Ctrl/Cmd+K` documentado via tooltip, nao texto pesado na tela. |
| 11.4  | [feito] Enter salva apenas quando seguro.                               |
| 11.5  | [feito] Escape fecha preview/revisao.                                   |
| 11.6  | [feito] Foco retorna para entrada apos salvar.                          |

Critério de aceite:

- fluxo completo funciona sem mouse;
- foco nao fica perdido em modal/preview.

---

## Fase 12 - Observabilidade Local

**Objetivo:** saber se a captura esta ajudando sem analytics externo.

| Passo | Acao                                                                                     |
| ----- | ---------------------------------------------------------------------------------------- |
| 12.1  | [feito] Registrar contadores locais best-effort: capturas salvas, revisadas, canceladas. |
| 12.2  | [feito] Registrar intents mais usadas localmente.                                        |
| 12.3  | [feito] Nao enviar dados para fora.                                                      |
| 12.4  | [feito] Usar dados apenas para melhorar UX futura.                                       |

Critério de aceite:

- nenhum dado sensivel sai do navegador;
- limpar storage remove metricas locais.

---

## Fase 13 - Limpeza de Friccao nos CRUDs

**Objetivo:** os formularios completos tambem devem ficar mais leves.

| Passo | Acao                                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| 13.1  | [feito] Revisar modais de despesas fixas com defaults da captura; mantido CRUD completo como fallback.                            |
| 13.2  | [feito] Revisar modais de parcelamento com inferencia de parcelas; inferencia ficou centralizada na captura.                      |
| 13.3  | [feito] Revisar modais de receitas com recorrencia mais clara; fluxo atual ja usa dia de recebimento e recorrencia explicita.     |
| 13.4  | [feito] Revisar faturas de cartao para aceitar entrada natural no valor; captura global cobre fatura e card mantem edicao direta. |
| 13.5  | [feito] Remover campos redundantes ou mover para area secundaria; sem remocao adicional para preservar auditoria dos CRUDs.       |

Critério de aceite:

- formulario completo ainda existe;
- fluxo comum exige menos decisoes.

---

## Riscos e Mitigacoes

### Risco: parser salvar no destino errado

Mitigacao:

- confidence;
- preview;
- revisao obrigatoria em baixa confianca;
- testes por matriz de exemplos.

### Risco: duplicar regras de dominio

Mitigacao:

- executor chama actions existentes;
- parser nao altera `FinanceState`;
- factories/reducers continuam fonte de verdade.

### Risco: OCR gerar dado ruim

Mitigacao:

- OCR sempre exige revisao;
- fallback manual;
- nunca salvar multiplos itens automaticamente.

### Risco: app ficar visualmente mais complexo

Mitigacao:

- entrada global compacta;
- preview discreto;
- manter CRUDs nas abas.

### Risco: memoria local enviesar demais

Mitigacao:

- usuario pode corrigir;
- preferencias sao best-effort;
- parser deve aceitar ausencia/corrupcao de preferencias.

---

## Ordem Recomendada de Execucao

1. Fase 0 - contratos.
2. Fase 1 - parser textual base.
3. Fase 2 - detector de intencao.
4. Fase 3 - preview/executor.
5. Fase 4 - entrada global.
6. Fase 5 - revisao universal.
7. Fase 6 - memoria/autofill.
8. Fase 7 - sugestoes pos-captura.
9. Fase 8 - OCR.
10. Fase 9 - integracao com abas.
11. Fase 10 - testes.
12. Fase 11 - acessibilidade.
13. Fase 12 - observabilidade local.
14. Fase 13 - limpeza final dos CRUDs.

Essa ordem evita quebrar o app porque primeiro criamos interpretacao sem efeito
colateral, depois preview, depois executor e so entao UI global.

---

## Definicao de Pronto

Este roadmap so deve ser considerado fechado quando:

- a entrada global captura todos os destinos planejados;
- o parser tem fallback seguro;
- OCR existe com revisao obrigatoria;
- preferencias locais funcionam;
- sugestoes pos-captura existem;
- CRUDs atuais continuam funcionando;
- suite completa passa;
- build passa;
- lint passa;
- roadmap e `ARCHITECTURE.md` estiverem atualizados.

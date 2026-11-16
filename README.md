# Sistema de Pedidos em TypeScript

Módulo isolado que modela um sistema de pedidos simples: produtos com estoque, criação de pedidos, cálculo de totais com desconto no Pix e um fluxo controlado de status. Não há interface visual; o foco é a modelagem de tipos e as regras de negócio.

## Como rodar

```bash
npm install        # instala TypeScript e @types/node
npm run typecheck  # verifica os tipos sem gerar JavaScript
npm run build      # compila em dist/ e gera source maps
npm start          # executa a demonstração compilada
npm run dev        # compila e executa com suporte a source maps
npm test           # compila e executa os testes automatizados
```

## Estrutura

```
pedidos-ts/
├── src/
│   ├── tipos.ts        # enums, interfaces, uniões, tupla, interseção e tipos avançados
│   ├── validacao.ts    # validação de entrada `unknown`, type guards e assertNever
│   ├── repositorio.ts  # repositório genérico Repositorio<T>
│   ├── pedidos.ts      # classe SistemaPedidos com as regras de negócio
│   ├── index.ts        # demonstração de uso
│   └── testes.ts       # testes automatizados das regras principais
├── legado/
│   └── pedidos.js      # versão em JavaScript antes da migração
├── tsconfig.json
└── package.json
```

## Regras de negócio

1. Um pedido só é criado se todos os produtos existirem e houver estoque para todos os itens. Linhas repetidas do mesmo produto são somadas antes da conferência. O estoque só é alterado depois de tudo ser conferido.
2. O preço do item é copiado para o pedido no momento da compra, para que mudanças futuras no produto não alterem pedidos antigos.
3. Pagamento via Pix tem 5% de desconto.
4. O status segue um fluxo fixo: `pendente → pago → enviado → entregue`. Cancelar só é possível a partir de `pendente` ou `pago`.
5. Cancelar exige um motivo e devolve os itens ao estoque.
6. O cadastro valida os dados do produto (id, nome, preço e estoque) e rejeita ids duplicados. O lote inteiro é validado antes de qualquer gravação.
7. O repositório clona os objetos na entrada e na saída para proteger seu estado interno, inclusive estruturas aninhadas.
6. Valores em dinheiro são guardados em centavos (inteiros).

## Onde cada requisito aparece

| Requisito | Onde |
|---|---|
| Primitivos, uniões e literais | `StatusPedido` em `tipos.ts` |
| Inferência de tipos | `index.ts` (`criado`, totais desestruturados) e retornos de métodos |
| Interfaces | `Entidade`, `Produto`, `ItemPedido`, `Pedido` |
| Interseção | `PedidoComTotais = Pedido & {...}` |
| Tuplas | `LinhaPedido = [produtoId, quantidade]` |
| Spread / rest | `cadastrarProdutos(...produtos)`, `{ ...pedido, status }`, `[...valores]` |
| Classes, visibilidade, estáticos | `SistemaPedidos` (`private`, `#proximoId`, `static TRANSICOES`, `static DESCONTO_PIX`) |
| `unknown` em vez de `any` | `criarPedido(entrada: unknown)`, `validarPedido` e `validarProduto` |
| `keyof` e `typeof` | `filtrarPor<K extends keyof T>`, `CampoFiltro`, `(typeof STATUS_PEDIDO)[number]` |
| Type guards e validação | `ehRegistro`, `ehFormaPagamento`, `ehInteiroPositivo` e `validarProduto` / `validarPedido`, sem asserções para interpretar os dados recebidos |
| Generics | `Repositorio<T extends Entidade>`, `Resultado<T>` |
| Mapped types | `Transicoes = { [S in StatusPedido]: ... }` |
| Tipos condicionais | `MudancaStatus<S>`: cancelamento exige `motivo` |
| Exaustividade | `descreverStatus` com `assertNever` |
| Enum | `FormaPagamento` |
| ECMAScript moderno | campos privados `#`, `as const`, desestruturação, `Map`, ES2022 |
| Source maps | `"sourceMap": true` + `node --enable-source-maps` nos scripts `dev` e `test` |
| Tipagem externa | `@types/node` em `devDependencies` |

## Configuração do ambiente (`tsconfig.json`)

| Opção | Por quê |
|---|---|
| `target: ES2022` | O Node 22 executa ES2022 nativamente, então não é preciso transpilar para versões antigas. |
| `module: NodeNext` | Usa ES Modules como o Node espera. Por isso os imports terminam em `.js`. |
| `strict: true` | Ativa todas as verificações principais, incluindo `strictNullChecks` e `noImplicitAny`. |
| `noUncheckedIndexedAccess` | Acesso por índice passa a ser `T \| undefined`, o que evita erros com listas vazias. |
| `exactOptionalPropertyTypes` | Impede atribuir `undefined` explicitamente a um campo opcional. |
| `noImplicitReturns`, `noFallthroughCasesInSwitch` | Evita funções que esquecem de retornar e `case` sem `return`. |
| `sourceMap: true` | Erros em runtime apontam para a linha do `.ts`, não do `.js` gerado. |

## Decisões técnicas

- **`Resultado<T>` em vez de exceções.** Erros de regra de negócio (sem estoque, status inválido) são esperados, não excepcionais. Retornar `{ ok, erro }` obriga quem chama a tratar os dois casos, e o compilador avisa se não tratar.
- **Enum para pagamento, união de literais para status.** O enum dá um nome legível (`FormaPagamento.Pix`). O status precisa existir também como lista em runtime (para validar entrada), então ele é derivado de um array `as const`, e assim a lista e o tipo nunca ficam diferentes.
- **Tabela de transições em vez de vários `if`.** As regras de fluxo ficam em um só lugar (`TRANSICOES`), e o mapped type obriga a definir uma regra para cada status.
- **Tipo condicional só onde há regra real.** `MudancaStatus` existe porque cancelar realmente exige motivo. Isso move uma regra de negócio para o compilador.
- **Centavos como inteiros.** `0.1 + 0.2 !== 0.3` em JavaScript. Com inteiros, as contas de dinheiro são exatas.

## Evolução: de JavaScript para TypeScript

O arquivo `legado/pedidos.js` é a versão inicial. Problemas encontrados e como a versão TypeScript resolve:

| Problema no JS | Consequência | Solução no TS |
|---|---|---|
| `preco: "150.00"` (texto) | Conta funciona por coerção, por acaso | `preco: number` em centavos |
| Estoque baixado sem conferência | Estoque negativo | Conferência antes de alterar, retorno `Resultado` |
| `produtos.find(...)` sem checar | `TypeError` com id inexistente | `buscar` retorna `Resultado<T>`, obrigando a checar |
| `mudarStatus(id, "entrege")` | Erro de digitação aceito | `StatusPedido` só aceita os 5 valores |
| Qualquer ordem de status | Pedido "entregue" sem pagar | Tabela `TRANSICOES` |
| `==` em vez de `===` | Comparações com coerção | `===` e tipos iguais nos dois lados |
| `var` e estado global | Difícil de testar e reutilizar | Classe com estado privado |

Linhas no fim de `src/index.ts` mostram chamadas que **não compilam** (cancelar sem motivo, status inexistente). Elas foram testadas e geram os erros TS2345 e TS2322.

## Uso de Inteligência Artificial e avaliação crítica

Registre nesta seção somente o uso de IA que realmente ocorreu durante o desenvolvimento. Não atribua ferramenta, modelo, data ou prompt que não correspondam ao seu histórico.

### Registro de uso

- **Ferramenta/modelo utilizado:** [preencher com a ferramenta e o modelo realmente utilizados]
- **Finalidade:** apoio à organização da estrutura, revisão de tipagem, identificação de riscos e elaboração de testes, conforme efetivamente utilizado.
- **Prompt(s) utilizado(s):** [inserir um resumo fiel ou os prompts reais]

### Análise crítica — completar com sua experiência

Use as perguntas abaixo para registrar sua avaliação, sem copiar automaticamente sugestões da IA:

1. Quais sugestões foram aceitas? Explique por que eram adequadas ao domínio.
2. Quais sugestões foram modificadas ou rejeitadas? Explique o motivo técnico.
3. Que problemas foram encontrados durante compilação ou execução? Registre a mensagem e como você investigou a causa.
4. O que você aprendeu sobre a diferença entre tipagem estática e validação em tempo de execução?
5. Como os testes ajudaram a verificar que as correções não quebraram outras regras?

Aceitas: Validar os dados e o estoque antes de criar pedidos, somar itens repetidos e armazenar valores em centavos. Isso evita erros nas regras do negócio.

Modificadas ou rejeitadas: Preferi unknown com validação, em vez de any. Para erros esperados, usei resultados tipados em vez de exceções.

Aprendizado: Os tipos do TypeScript ajudam na compilação, mas dados externos também precisam ser validados durante a execução.

Testes: Verificaram as regras de pedidos, estoque e cancelamento. Os 11 testes passaram, indicando que as correções mantiveram o comportamento esperado.

### Melhorias técnicas realizadas nesta versão

- O estoque agora é validado pela quantidade total por produto, evitando que linhas repetidas ultrapassem o estoque disponível.
- O cadastro de produtos recebe `unknown`, valida os campos em runtime e rejeita ids duplicados antes de gravar o lote.
- O repositório usa `structuredClone` ao salvar e devolver dados, evitando que referências externas modifiquem diretamente o estado interno.
- Os type guards verificam valores com comparações seguras, sem asserções para converter dados externos.
- Foi adicionado `src/testes.ts` para testar estoque, cancelamento, entradas inválidas e cópia defensiva.

### Evidências a registrar antes da entrega

Execute localmente e inclua capturas de tela ou transcrições reais dos resultados:

```bash
npm install
npm run typecheck
npm run build
npm test
npm run dev
```

Não declare os comandos como aprovados até executá-los no seu ambiente. A execução do projeto requer uma versão recente do Node.js que disponibilize `structuredClone` (Node 17 ou superior; recomenda-se Node 22).

## Observação sobre o escopo front-end

Este repositório é um módulo de regras de negócio TypeScript executado no Node.js e não contém interface visual. Ele demonstra os conceitos de tipagem, contratos, abstrações e configuração do TypeScript. Se a atividade exigir uma interface front-end funcional, será necessário acrescentar uma camada visual separada.

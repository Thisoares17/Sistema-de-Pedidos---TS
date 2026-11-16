import { SistemaPedidos } from "./pedidos.js";
import { FormaPagamento } from "./tipos.js";

function verificar(condicao: boolean, mensagem: string): asserts condicao {
  if (!condicao) throw new Error(`Falha no teste: ${mensagem}`);
}

function executarTestes(): void {
  const sistema = new SistemaPedidos();
  const cadastro = sistema.cadastrarProdutos(
    { id: 1, nome: "Teclado", preco: 15000, estoque: 5 },
    { id: 2, nome: "Mouse", preco: 8000, estoque: 2 },
  );
  verificar(cadastro.ok, "cadastro de produtos válidos");

  const pedidoRepetido = sistema.criarPedido({
    cliente: "Thiago", pagamento: FormaPagamento.Pix, linhas: [[1, 3], [1, 3]],
  });
  verificar(!pedidoRepetido.ok, "somatório de linhas repetidas deve respeitar estoque");
  verificar(sistema.estoque(1) === 5, "falha na criação não pode baixar estoque");

  const pedido = sistema.criarPedido({
    cliente: "Bruno", pagamento: FormaPagamento.Cartao, linhas: [[1, 2], [2, 1]],
  });
  verificar(pedido.ok, "criação de pedido com estoque suficiente");
  verificar(sistema.estoque(1) === 3, "baixa correta do estoque");

  const cancelar = sistema.mudarStatus(pedido.valor.id, {
    para: "cancelado", motivo: "Desistência do cliente",
  });
  verificar(cancelar.ok, "cancelamento permitido");
  verificar(sistema.estoque(1) === 5, "devolução do estoque no cancelamento");

  const produtoInvalido = sistema.cadastrarProdutos({
    id: 3, nome: "Produto", preco: -1, estoque: 1,
  });
  verificar(!produtoInvalido.ok, "preço negativo deve ser rejeitado");
  verificar(!sistema.criarPedido({ cliente: "", pagamento: "dinheiro", linhas: [] }).ok,
    "pedido com dados inválidos deve ser rejeitado");

  // Confirma que modificar o objeto retornado não altera o estado interno.
  const produtoRetornado = sistema.cadastrarProdutos({
    id: 4, nome: "Cabo", preco: 2500, estoque: 4,
  });
  verificar(produtoRetornado.ok, "cadastro para teste de cópia defensiva");
  produtoRetornado.valor[0]!.estoque = 999;
  verificar(sistema.estoque(4) === 4, "repositório não deve expor referência interna");

  console.log("Todos os testes passaram (11 verificações).");
}

executarTestes();

// Versão original em JavaScript, ANTES da migração para TypeScript.
// Mantida como evidência da etapa 5 (evolução e refatoração).

var produtos = [{ id: 1, nome: "Teclado", preco: "150.00", estoque: 5 }];
var pedidos = [];

function criarPedido(cliente, itens, pagamento) {
  var total = 0;
  itens.forEach(function (i) {
    var p = produtos.find((x) => x.id == i.id);
    p.estoque = p.estoque - i.qtd;   // baixa estoque mesmo sem conferir
    total = total + p.preco * i.qtd; // preco é texto: "150.00" * 2 funciona por acaso
  });
  if (pagamento == "pix") total = total - total * 0.05;
  var pedido = { id: pedidos.length + 1, cliente, itens, total, status: "pendente" };
  pedidos.push(pedido);
  return pedido;
}

function mudarStatus(id, status) {
  var p = pedidos.find((x) => x.id == id);
  p.status = status; // aceita qualquer texto e qualquer ordem
}

criarPedido("Ana", [{ id: 1, qtd: 10 }], "pix"); // estoque fica -5
mudarStatus(1, "entrege");                        // erro de digitação passa
criarPedido("Bia", [{ id: 9, qtd: 1 }], "pix");   // TypeError em runtime

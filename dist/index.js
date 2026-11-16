import { SistemaPedidos, formatarPreco } from "./pedidos.js";
import { FormaPagamento } from "./tipos.js";
const sistema = new SistemaPedidos();
const cadastro = sistema.cadastrarProdutos({ id: 1, nome: "Teclado", preco: 15000, estoque: 5 }, { id: 2, nome: "Mouse", preco: 8000, estoque: 2 });
if (!cadastro.ok)
    throw new Error(cadastro.erro);
// Inferência: o tipo Resultado<Pedido> vem do retorno do método, sem anotação
const criado = sistema.criarPedido({
    cliente: "Thiago",
    pagamento: FormaPagamento.Pix,
    linhas: [[1, 2], [2, 1]],
});
if (!criado.ok)
    throw new Error(criado.erro);
const pedido = criado.valor;
const { subtotal, desconto, total } = sistema.calcularTotais(pedido);
console.log(`Pedido #${pedido.id} de ${pedido.cliente}`);
console.log(`Subtotal ${formatarPreco(subtotal)} | Desconto ${formatarPreco(desconto)} | Total ${formatarPreco(total)}`);
console.log("Estoque do teclado após o pedido:", sistema.estoque(1));
// Erros de regra de negócio voltam como Resultado, sem exceção
console.log("\nSem estoque:", sistema.criarPedido({ cliente: "Bruno", pagamento: "boleto", linhas: [[2, 5]] }));
console.log("Entrada inválida:", sistema.criarPedido({ cliente: "", pagamento: "dinheiro", linhas: [] }));
// Fluxo de status
console.log("\nPular etapa:", sistema.mudarStatus(pedido.id, { para: "entregue" }));
sistema.mudarStatus(pedido.id, { para: "pago" });
const cancelado = sistema.mudarStatus(pedido.id, { para: "cancelado", motivo: "Cliente desistiu" });
if (cancelado.ok)
    console.log(`Status: ${SistemaPedidos.descreverStatus(cancelado.valor.status)}`);
console.log("Estoque do teclado após cancelar:", sistema.estoque(1));
// Demonstração: o cadastro rejeita dados inválidos sem alterar o repositório.
console.log("Produto inválido:", sistema.cadastrarProdutos({
    id: 3, nome: "Produto inválido", preco: -100, estoque: 2,
}));
// Linhas que NÃO compilam (descomente para ver o erro):
// sistema.mudarStatus(1, { para: "cancelado" });     // falta o motivo
// sistema.mudarStatus(1, { para: "perdido" });       // status inexistente
// sistema.pedidosPorStatus("aberto");                // não é um StatusPedido
//# sourceMappingURL=index.js.map
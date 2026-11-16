import { FormaPagamento, STATUS_PEDIDO } from "./tipos.js";
export function assertNever(valor) {
    throw new Error(`Caso não tratado: ${String(valor)}`);
}
export function ehFormaPagamento(valor) {
    return Object.values(FormaPagamento).some((forma) => forma === valor);
}
export function ehStatus(valor) {
    return STATUS_PEDIDO.some((status) => status === valor);
}
function ehInteiroPositivo(valor) {
    return typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0;
}
function ehInteiroNaoNegativo(valor) {
    return typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
}
function ehRegistro(valor) {
    return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
/** Valida dados externos sem confiar em asserções de tipo. */
export function validarProduto(entrada) {
    if (!ehRegistro(entrada))
        return "Produto precisa ser um objeto";
    const { id, nome, preco, estoque } = entrada;
    if (!ehInteiroPositivo(id))
        return "Id do produto deve ser um inteiro positivo";
    if (typeof nome !== "string" || nome.trim() === "")
        return "Nome do produto inválido";
    if (!ehInteiroNaoNegativo(preco))
        return "Preço deve ser um inteiro não negativo em centavos";
    if (!ehInteiroNaoNegativo(estoque))
        return "Estoque deve ser um inteiro não negativo";
    return { id, nome: nome.trim(), preco, estoque };
}
export function validarPedido(entrada) {
    if (!ehRegistro(entrada))
        return "Pedido precisa ser um objeto";
    const { cliente, pagamento, linhas } = entrada;
    if (typeof cliente !== "string" || cliente.trim() === "")
        return "Cliente inválido";
    if (!ehFormaPagamento(pagamento))
        return "Forma de pagamento inválida";
    if (!Array.isArray(linhas) || linhas.length === 0)
        return "Pedido sem itens";
    const linhasValidas = [];
    for (const linha of linhas) {
        if (!Array.isArray(linha) || linha.length !== 2) {
            return "Item deve ser [produtoId, quantidade]";
        }
        const produtoId = linha[0];
        const quantidade = linha[1];
        if (!ehInteiroPositivo(produtoId) || !ehInteiroPositivo(quantidade)) {
            return "Id e quantidade devem ser inteiros positivos";
        }
        linhasValidas.push([produtoId, quantidade]);
    }
    return { cliente: cliente.trim(), pagamento, linhas: linhasValidas };
}
//# sourceMappingURL=validacao.js.map
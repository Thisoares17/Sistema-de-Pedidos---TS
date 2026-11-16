import { FormaPagamento, STATUS_PEDIDO, type LinhaPedido, type StatusPedido } from "./tipos.js";

export function assertNever(valor: never): never {
  throw new Error(`Caso não tratado: ${String(valor)}`);
}

export function ehFormaPagamento(valor: unknown): valor is FormaPagamento {
  return Object.values(FormaPagamento).some((forma) => forma === valor);
}

export function ehStatus(valor: unknown): valor is StatusPedido {
  return STATUS_PEDIDO.some((status) => status === valor);
}

function ehInteiroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0;
}

function ehInteiroNaoNegativo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

export interface DadosPedido {
  cliente: string;
  pagamento: FormaPagamento;
  linhas: LinhaPedido[];
}

export interface DadosProduto {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
}

/** Valida dados externos sem confiar em asserções de tipo. */
export function validarProduto(entrada: unknown): DadosProduto | string {
  if (!ehRegistro(entrada)) return "Produto precisa ser um objeto";
  const { id, nome, preco, estoque } = entrada;

  if (!ehInteiroPositivo(id)) return "Id do produto deve ser um inteiro positivo";
  if (typeof nome !== "string" || nome.trim() === "") return "Nome do produto inválido";
  if (!ehInteiroNaoNegativo(preco)) return "Preço deve ser um inteiro não negativo em centavos";
  if (!ehInteiroNaoNegativo(estoque)) return "Estoque deve ser um inteiro não negativo";

  return { id, nome: nome.trim(), preco, estoque };
}

export function validarPedido(entrada: unknown): DadosPedido | string {
  if (!ehRegistro(entrada)) return "Pedido precisa ser um objeto";
  const { cliente, pagamento, linhas } = entrada;

  if (typeof cliente !== "string" || cliente.trim() === "") return "Cliente inválido";
  if (!ehFormaPagamento(pagamento)) return "Forma de pagamento inválida";
  if (!Array.isArray(linhas) || linhas.length === 0) return "Pedido sem itens";

  const linhasValidas: LinhaPedido[] = [];
  for (const linha of linhas) {
    if (!Array.isArray(linha) || linha.length !== 2) {
      return "Item deve ser [produtoId, quantidade]";
    }
    const produtoId: unknown = linha[0];
    const quantidade: unknown = linha[1];
    if (!ehInteiroPositivo(produtoId) || !ehInteiroPositivo(quantidade)) {
      return "Id e quantidade devem ser inteiros positivos";
    }
    linhasValidas.push([produtoId, quantidade]);
  }

  return { cliente: cliente.trim(), pagamento, linhas: linhasValidas };
}

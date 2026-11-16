import { Repositorio } from "./repositorio.js";
import {
  FormaPagamento,
  type ItemPedido,
  type MudancaStatus,
  type Pedido,
  type PedidoComTotais,
  type Produto,
  type Resultado,
  type StatusPedido,
  type Transicoes,
} from "./tipos.js";
import { assertNever, validarPedido, validarProduto } from "./validacao.js";

/** Regras de negócio dos pedidos. */
export class SistemaPedidos {
  /** Membros estáticos: regras iguais para qualquer instância. */
  static readonly DESCONTO_PIX = 0.05; // 5% no Pix
  static readonly TRANSICOES: Transicoes = {
    pendente: ["pago", "cancelado"],
    pago: ["enviado", "cancelado"],
    enviado: ["entregue"],
    entregue: [],
    cancelado: [],
  };

  #proximoId = 1;
  private readonly produtos = new Repositorio<Produto>();
  private readonly pedidos = new Repositorio<Pedido>();

  /** Rest parameter: cadastra quantos produtos forem passados. */
  cadastrarProdutos(...entradas: unknown[]): Resultado<Produto[]> {
    const produtosValidados: Produto[] = [];
    const idsRecebidos = new Set<number>();

    // Valida o lote inteiro antes de cadastrar qualquer produto.
    for (const entrada of entradas) {
      const validacao = validarProduto(entrada);
      if (typeof validacao === "string") return { ok: false, erro: validacao };
      if (idsRecebidos.has(validacao.id) || this.produtos.buscar(validacao.id).ok) {
        return { ok: false, erro: `Produto com id ${validacao.id} já cadastrado` };
      }
      idsRecebidos.add(validacao.id);
      produtosValidados.push(validacao);
    }

    return { ok: true, valor: produtosValidados.map((produto) => this.produtos.salvar(produto)) };
  }

  estoque(produtoId: number): number | undefined {
    const r = this.produtos.buscar(produtoId);
    return r.ok ? r.valor.estoque : undefined;
  }

  /** Cria um pedido: valida a entrada, confere estoque e só então baixa o estoque. */
  criarPedido(entrada: unknown): Resultado<Pedido> {
    const dados = validarPedido(entrada);
    if (typeof dados === "string") return { ok: false, erro: dados };

    // Soma linhas repetidas do mesmo produto antes de conferir o estoque.
    const quantidades = new Map<number, number>();
    for (const [produtoId, quantidade] of dados.linhas) {
      quantidades.set(produtoId, (quantidades.get(produtoId) ?? 0) + quantidade);
    }

    // 1º passo: confere todos os produtos e estoques sem alterar o estado.
    const produtosParaBaixa = new Map<number, Produto>();
    for (const [produtoId, quantidadeTotal] of quantidades) {
      const busca = this.produtos.buscar(produtoId);
      if (!busca.ok) return busca;
      if (busca.valor.estoque < quantidadeTotal) {
        return { ok: false, erro: `Estoque insuficiente para ${busca.valor.nome}` };
      }
      produtosParaBaixa.set(produtoId, busca.valor);
    }

    const itens: ItemPedido[] = dados.linhas.map(([produtoId, quantidade]) => {
      const produto = produtosParaBaixa.get(produtoId);
      // A existência já foi verificada acima; a proteção mantém o retorno tipado.
      if (!produto) throw new Error(`Produto ${produtoId} não encontrado após validação`);
      return { produtoId, nome: produto.nome, precoUnitario: produto.preco, quantidade };
    });

    // 2º passo: baixa uma única vez por produto, usando a quantidade acumulada.
    for (const [produtoId, quantidadeTotal] of quantidades) {
      const produto = produtosParaBaixa.get(produtoId);
      if (produto) this.produtos.salvar({ ...produto, estoque: produto.estoque - quantidadeTotal });
    }

    const pedido: Pedido = {
      id: this.#proximoId++,
      cliente: dados.cliente,
      pagamento: dados.pagamento,
      itens,
      status: "pendente",
    };
    return { ok: true, valor: this.pedidos.salvar(pedido) };
  }

  /** Muda o status respeitando o fluxo permitido. Cancelar devolve o estoque. */
  mudarStatus(pedidoId: number, mudanca: MudancaStatus): Resultado<Pedido> {
    const busca = this.pedidos.buscar(pedidoId);
    if (!busca.ok) return busca;
    const pedido = busca.valor;

    if (!SistemaPedidos.TRANSICOES[pedido.status].includes(mudanca.para))
      return { ok: false, erro: `Não é possível ir de "${pedido.status}" para "${mudanca.para}"` };

    const atualizado: Pedido = { ...pedido, status: mudanca.para };
    if (mudanca.para === "cancelado") {
      atualizado.motivoCancelamento = mudanca.motivo; // o tipo garante que motivo existe aqui
      this.devolverEstoque(pedido.itens);
    }
    return { ok: true, valor: this.pedidos.salvar(atualizado) };
  }

  /** Calcula subtotal, desconto e total. */
  calcularTotais(pedido: Pedido): PedidoComTotais {
    const subtotal = pedido.itens.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0);
    const desconto =
      pedido.pagamento === FormaPagamento.Pix ? Math.round(subtotal * SistemaPedidos.DESCONTO_PIX) : 0;
    return { ...pedido, subtotal, desconto, total: subtotal - desconto };
  }

  pedidosDoCliente(cliente: string): Pedido[] {
    return this.pedidos.filtrarPor("cliente", cliente);
  }

  pedidosPorStatus(status: StatusPedido): Pedido[] {
    return this.pedidos.filtrarPor("status", status);
  }

  private devolverEstoque(itens: readonly ItemPedido[]): void {
    for (const item of itens) {
      const busca = this.produtos.buscar(item.produtoId);
      if (busca.ok) this.produtos.salvar({ ...busca.valor, estoque: busca.valor.estoque + item.quantidade });
    }
  }

  /** Exaustividade: se um novo status for criado, este switch deixa de compilar. */
  static descreverStatus(status: StatusPedido): string {
    switch (status) {
      case "pendente":
        return "Aguardando pagamento";
      case "pago":
        return "Pagamento confirmado";
      case "enviado":
        return "A caminho";
      case "entregue":
        return "Entregue ao cliente";
      case "cancelado":
        return "Cancelado";
      default:
        return assertNever(status);
    }
  }
}

/** Formata centavos como reais. */
export const formatarPreco = (centavos: number): string =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

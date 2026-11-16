// ===== Etapas 1 e 2: modelagem de dados e contratos =====

/** Enum: conjunto fechado de formas de pagamento, com valor legível em runtime. */
export enum FormaPagamento {
  Pix = "pix",
  Cartao = "cartao",
  Boleto = "boleto",
}

/** `as const` + typeof: a lista existe em runtime e o tipo é derivado dela. */
export const STATUS_PEDIDO = ["pendente", "pago", "enviado", "entregue", "cancelado"] as const;

/** União de literais: "pendente" | "pago" | "enviado" | "entregue" | "cancelado". */
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

/** Contrato base de qualquer entidade guardada em um repositório. */
export interface Entidade {
  readonly id: number;
}

export interface Produto extends Entidade {
  nome: string;
  preco: number; // em centavos, para evitar erros de ponto flutuante
  estoque: number;
}

export interface ItemPedido {
  readonly produtoId: number;
  readonly nome: string;
  readonly precoUnitario: number; // preço congelado no momento da compra
  readonly quantidade: number;
}

export interface Pedido extends Entidade {
  readonly cliente: string;
  readonly itens: readonly ItemPedido[];
  readonly pagamento: FormaPagamento;
  status: StatusPedido;
  motivoCancelamento?: string;
}

/** Tupla: [produtoId, quantidade]. Forma curta de pedir um item. */
export type LinhaPedido = readonly [produtoId: number, quantidade: number];

/** Interseção: o pedido somado aos valores calculados. */
export type PedidoComTotais = Pedido & {
  subtotal: number;
  desconto: number;
  total: number;
};

// ===== Etapa 3: tipos avançados =====

/** Generic: resultado de uma operação que pode falhar, sem lançar exceções. */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

/** Mapped type: para cada status, a lista de status para onde ele pode ir. */
export type Transicoes = { readonly [S in StatusPedido]: readonly StatusPedido[] };

/**
 * Tipo condicional: cancelar exige motivo; os outros status não.
 * O compilador recusa `{ para: "cancelado" }` sem `motivo`.
 */
export type MudancaStatus<S extends StatusPedido = StatusPedido> = S extends "cancelado"
  ? { para: S; motivo: string }
  : { para: S };

/** keyof: só as chaves de Pedido que podem ser usadas como filtro simples. */
export type CampoFiltro = keyof Pick<Pedido, "cliente" | "status" | "pagamento">;

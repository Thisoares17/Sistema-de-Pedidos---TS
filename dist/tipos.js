// ===== Etapas 1 e 2: modelagem de dados e contratos =====
/** Enum: conjunto fechado de formas de pagamento, com valor legível em runtime. */
export var FormaPagamento;
(function (FormaPagamento) {
    FormaPagamento["Pix"] = "pix";
    FormaPagamento["Cartao"] = "cartao";
    FormaPagamento["Boleto"] = "boleto";
})(FormaPagamento || (FormaPagamento = {}));
/** `as const` + typeof: a lista existe em runtime e o tipo é derivado dela. */
export const STATUS_PEDIDO = ["pendente", "pago", "enviado", "entregue", "cancelado"];
//# sourceMappingURL=tipos.js.map
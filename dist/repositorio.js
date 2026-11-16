/**
 * Repositório genérico em memória. Os dados são clonados na entrada e na saída
 * para impedir que quem chama altere o estado interno sem passar pelas regras.
 * O domínio usa objetos simples serializáveis (sem funções ou instâncias especiais).
 */
export class Repositorio {
    #itens = new Map();
    salvar(item) {
        const copia = structuredClone(item);
        this.#itens.set(copia.id, copia);
        return structuredClone(copia);
    }
    buscar(id) {
        const item = this.#itens.get(id);
        return item
            ? { ok: true, valor: structuredClone(item) }
            : { ok: false, erro: `Id ${id} não encontrado` };
    }
    listar() {
        return [...this.#itens.values()].map((item) => structuredClone(item));
    }
    /** Generic com keyof: o valor buscado precisa corresponder ao tipo do campo. */
    filtrarPor(campo, valor) {
        return this.listar().filter((item) => item[campo] === valor);
    }
}
//# sourceMappingURL=repositorio.js.map
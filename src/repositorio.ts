import type { Entidade, Resultado } from "./tipos.js";

/**
 * Repositório genérico em memória. Os dados são clonados na entrada e na saída
 * para impedir que quem chama altere o estado interno sem passar pelas regras.
 * O domínio usa objetos simples serializáveis (sem funções ou instâncias especiais).
 */
export class Repositorio<T extends Entidade> {
  #itens = new Map<number, T>();

  salvar(item: T): T {
    const copia = structuredClone(item);
    this.#itens.set(copia.id, copia);
    return structuredClone(copia);
  }

  buscar(id: number): Resultado<T> {
    const item = this.#itens.get(id);
    return item
      ? { ok: true, valor: structuredClone(item) }
      : { ok: false, erro: `Id ${id} não encontrado` };
  }

  listar(): T[] {
    return [...this.#itens.values()].map((item) => structuredClone(item));
  }

  /** Generic com keyof: o valor buscado precisa corresponder ao tipo do campo. */
  filtrarPor<K extends keyof T>(campo: K, valor: T[K]): T[] {
    return this.listar().filter((item) => item[campo] === valor);
  }
}

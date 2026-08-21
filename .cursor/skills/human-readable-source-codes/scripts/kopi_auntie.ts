/**
 * Constrained fluent builder matching the drink-stall auntie example in
 * https://medium.com/@beeleeong/human-readable-source-codes-988aa997692a
 *
 * kopi().o().ping().order() => "Kopi O Ping" (iced coffee without milk)
 */
export class DrinkStallAuntie {
  #base: "Kopi" | "Teh" | null = null;
  #milk: "O" | "C" | null = null;
  #sugar: "Kosong" | null = null;
  #iced = false;

  kopi(): this {
    this.#base = "Kopi";
    return this;
  }

  teh(): this {
    this.#base = "Teh";
    return this;
  }

  o(): this {
    this.#milk = "O";
    return this;
  }

  c(): this {
    this.#milk = "C";
    return this;
  }

  kosong(): this {
    this.#sugar = "Kosong";
    return this;
  }

  ping(): this {
    this.#iced = true;
    return this;
  }

  order(): string {
    if (!this.#base) {
      throw new Error("auntie is waiting: say kopi() or teh() first");
    }
    const parts: string[] = [this.#base];
    if (this.#milk) parts.push(this.#milk);
    if (this.#sugar) parts.push(this.#sugar);
    if (this.#iced) parts.push("Ping");
    return parts.join(" ");
  }
}

if (import.meta.main) {
  const drink = new DrinkStallAuntie().kopi().o().ping().order();
  console.log(drink);
}

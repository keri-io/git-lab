import { assertEquals, assertThrows } from "@std/assert";
import { DrinkStallAuntie } from "./kopi_auntie.ts";

Deno.test("kopi().o().ping() orders Kopi O Ping", () => {
  assertEquals(
    new DrinkStallAuntie().kopi().o().ping().order(),
    "Kopi O Ping",
  );
});

Deno.test("teh().c().kosong().ping() orders Teh C Kosong Ping", () => {
  assertEquals(
    new DrinkStallAuntie().teh().c().kosong().ping().order(),
    "Teh C Kosong Ping",
  );
});

Deno.test("order() throws until kopi() or teh() is said", () => {
  assertThrows(
    () => new DrinkStallAuntie().o().ping().order(),
    Error,
    "auntie is waiting",
  );
});

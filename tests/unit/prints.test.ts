import { test } from "node:test";
import assert from "node:assert/strict";
import { brlCents, parseCents, masterPxNeeded, masterFits, cm } from "../../lib/format.ts";

test("centavos em reais", () => {
  assert.equal(brlCents(21695).replace(/\s/g, " "), "R$ 216,95");
  assert.equal(brlCents(100000).replace(/\s/g, " "), "R$ 1.000,00");
});

test("lê o que o artista digita", () => {
  assert.equal(parseCents("60"), 6000);
  assert.equal(parseCents("60,5"), 6050);
  assert.equal(parseCents("R$ 1.234,56"), 123456);
  assert.equal(parseCents("1.234"), 123400);
  assert.equal(parseCents("12.5"), 1250);
  assert.equal(parseCents(""), null);
});

test("resolução do arquivo-mestre igual à conferência do banco", () => {
  assert.deepEqual(masterPxNeeded(42, 59.4, 300), [7016, 4961]); // A2 a 300 dpi
  assert.equal(masterFits(5000, 7100, masterPxNeeded(42, 59.4, 300)), true); // retrato ou paisagem tanto faz
  assert.equal(masterFits(4500, 6000, masterPxNeeded(42, 59.4, 300)), false);
  assert.equal(cm(29.7), "29,7");
});

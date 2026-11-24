// Regras de comissão do front (devem bater com o contrato gerado no banco). Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { orderPct, commissionOf, netOf, fmtPct } from "../../lib/format.ts";

test("venda sem a coluna (anterior à migração) usa 15%", () => {
  assert.equal(orderPct({}), 15);
  assert.equal(commissionOf({ amount: 8000 }), 1200);
  assert.equal(netOf({ amount: 8000 }), 6800);
});

test("venda com comissão gravada usa a dela, inclusive vinda como texto do Postgres", () => {
  assert.equal(commissionOf({ amount: 10000, commission_pct: "12.50" }), 1250);
  assert.equal(netOf({ amount: 10000, commission_pct: 12.5 }), 8750);
  assert.equal(commissionOf({ amount: 10000, commission_pct: 0 }), 0);
});

test("arredonda como o contrato (round do Postgres)", () => {
  assert.equal(commissionOf({ amount: 999, commission_pct: 12.5 }), 125); // 124,875 -> 125
  assert.equal(commissionOf({ amount: 1001, commission_pct: 15 }), 150); // 150,15 -> 150
  assert.equal(commissionOf({ amount: 1001, commission_pct: 15 }) + netOf({ amount: 1001, commission_pct: 15 }), 1001);
});

test("percentual escrito à brasileira", () => {
  assert.equal(fmtPct(15), "15");
  assert.equal(fmtPct(12.5), "12,5");
  assert.equal(fmtPct(7.25), "7,25");
});

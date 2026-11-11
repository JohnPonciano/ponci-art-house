import { NextResponse } from "next/server";
import { compliance } from "@/lib/admin";

export async function GET() {
  let rows: any[];
  try { rows = await compliance(10000); } catch { return NextResponse.json({ erro: "acesso restrito" }, { status: 403 }); }
  const cols = ["order_ref", "created_at", "amount", "stage", "via", "work_title", "artist_code", "artist_name", "artist_doc", "artist_pep", "buyer_code", "buyer_name", "buyer_doc", "buyer_pep", "buyer_city", "buyer_uf", "contract_ref", "signatures"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => q(r[c])).join(";"))].join("\r\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="ponci-compliance-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
}

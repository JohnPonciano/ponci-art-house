"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
export function SortSelect({ value }: { value: string }) {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  return (
    <select id="sort" value={value} onChange={(e) => { const q = new URLSearchParams(sp.toString()); e.target.value === "new" ? q.delete("sort") : q.set("sort", e.target.value); router.replace(path + (q.size ? "?" + q : ""), { scroll: false }); }}>
      <option value="new">Mais recentes</option><option value="low">Menor preço</option><option value="high">Maior preço</option>
    </select>
  );
}

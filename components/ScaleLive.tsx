"use client";
import { useSyncExternalStore } from "react";
import { Scale, type ScalePaper } from "./Scale";

/* Liga a escolha de compra (Original × Print, e o tamanho do print) ao boneco de escala da mesma página. */
let current: ScalePaper | null = null;
const subs = new Set<() => void>();
export function setScalePaper(p: ScalePaper | null) {
  if (current?.w === p?.w && current?.h === p?.h && current?.label === p?.label) return;
  current = p; subs.forEach((f) => f());
}
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export function ScaleLive({ a }: { a: { h: number; w: number; title: string; image_path?: string | null } }) {
  const paper = useSyncExternalStore(subscribe, () => current, () => null);
  return <Scale a={a} paper={paper} />;
}

"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState(""); const [on, setOn] = useState(false); const t = useRef<any>(null);
  const show = useCallback((m: string) => { setMsg(m); setOn(true); clearTimeout(t.current); t.current = setTimeout(() => setOn(false), 3200); }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className={"toast" + (on ? " on" : "")} role="status" aria-live="polite">{msg && <><Icon n="check" /><span>{msg}</span></>}</div>
    </Ctx.Provider>
  );
}

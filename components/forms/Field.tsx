import type { ReactNode } from "react";

type Base = { name: string; label: ReactNode; error?: string; aside?: ReactNode };
export function Field({ name, label, error, aside, as = "input", children, ...rest }: Base & { as?: "input" | "select" | "textarea"; children?: ReactNode } & Record<string, any>) {
  const id = "i-" + name;
  const common = { id, name, "aria-describedby": "e-" + name, "aria-invalid": error ? true : undefined, ...rest };
  return (
    <div className={"field" + (error ? " bad" : "")} id={"f-" + name}>
      <label htmlFor={id} className="lab"><span>{label}</span>{aside != null && <span className="count">{aside}</span>}</label>
      {as === "select" ? <select {...common}>{children}</select> : as === "textarea" ? <textarea {...common} /> : <input {...common} />}
      <p className="err" id={"e-" + name}>{error || ""}</p>
    </div>
  );
}
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

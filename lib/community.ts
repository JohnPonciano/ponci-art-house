import { dateBR } from "@/lib/format";
/* Tipos e regras de exibição da Comunidade (usados no servidor e no cliente). */
export type Topic = "geral" | "processo" | "obras" | "exposicoes" | "colecao" | "mercado";
/** Espaços da comunidade. "obras" é preenchido sozinho quando a curadoria aprova uma obra. */
export const TOPICS: Record<Topic, [string, string]> = {
  geral: ["Conversa", "Assuntos da rede, apresentações, recados"],
  processo: ["Processo", "Ateliê, técnica, obra em andamento"],
  obras: ["Obras novas", "Aprovadas pela curadoria, direto do ateliê"],
  exposicoes: ["Agenda", "Exposições, aberturas, feiras e visitas"],
  colecao: ["Coleção", "Como cada um vive com as obras em casa"],
  mercado: ["Dúvidas", "Conservação, moldura, transporte, mercado"],
};
export const POSTABLE: Topic[] = ["geral", "processo", "exposicoes", "colecao", "mercado"];

export type Person = { id: string; role: "artist" | "buyer"; display_name: string; city: string; practice: string; member_code: string; show_name: boolean };
export type PostMedia = { id: string; position: number; path: string | null; gen: any; w: number; h: number };
export type Comment = { id: string; post_id: string; parent_id: string | null; body: string; created_at: string; removed_at: string | null; author: Person };
export type Post = {
  id: string; kind: "post" | "obra_nova"; topic: Topic; title: string; body: string; created_at: string; removed_at: string | null; removed_reason?: string;
  author: Person; media: PostMedia[]; likes: number; comments: number;
  work: { id: string; slug: string; title: string; year: number; price: number; status: string; h: number; w: number; gen: any; image_path: string | null; img_w: number | null; img_h: number | null; medium: string; no: number } | null;
};
/** Nome público: artistas pelo nome; colecionadores pelo código, salvo se escolheram mostrar o nome. */
export function personName(p?: Partial<Person> | null) {
  if (!p) return "Membro";
  return p.role === "artist" || p.show_name ? p.display_name || "Membro" : `Colecionador ${p.member_code}`;
}
export function personLine(p?: Partial<Person> | null) {
  if (!p) return "";
  return p.role === "artist" ? `${p.practice ? p.practice + " · " : ""}${p.city}` : `Colecionador · ${p.city}`;
}


export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  if (s < 7 * 86400) return `há ${Math.round(s / 86400)} ${Math.round(s / 86400) === 1 ? "dia" : "dias"}`;
  return dateBR(iso);
};

/** Título da nota: o título escrito, ou a primeira frase do texto, ou a obra. */
export function noteTitle(p: Pick<Post, "title" | "body" | "work" | "kind">) {
  if (p.title) return p.title;
  if (p.kind === "obra_nova" && p.work) return `Obra nova: ${p.work.title}`;
  const first = (p.body || "").split(/(?<=[.!?])\s|\n/)[0].trim();
  return first.length > 80 ? first.slice(0, 77).trimEnd() + "…" : first || (p.work ? p.work.title : "Nota");
}

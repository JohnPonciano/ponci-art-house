import { redirect } from "next/navigation";

/* Não há índice de artistas: o acervo já organiza as obras por artista. */
export default function Artistas() { redirect("/colecionador"); }

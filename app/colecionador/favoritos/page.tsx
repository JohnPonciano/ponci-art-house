import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { catalogue, favoriteIds } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { WorkCard } from "@/components/area";
import { Icon } from "@/components/Icon";
import { brl } from "@/lib/format";

export const metadata = { title: "Favoritos" };

export default async function Favoritos() {
  const me = await requireMember("buyer");
  const [ids, cat] = await Promise.all([favoriteIds(me.id), catalogue()]);
  const list = cat.filter((a) => ids.includes(a.id));
  return (
    <div className="wrap">
      <PageHead title="Favoritos" label="Lista de interesse" intro="Obras que você guardou. Se uma reserva cair ou o preço mudar, elas continuam aqui." count={`${list.length} ${list.length === 1 ? "obra" : "obras"}`} />
      <div style={{ marginTop: "clamp(28px,4vw,48px)" }}>
        {list.length ? <div className="board cat">{list.map((a) => <WorkCard key={a.id} a={a} href={`/colecionador/obras/${a.slug}`} sub={a.artist?.display_name} fav
            foot={<><span className="price">{brl(a.price)}<small>{a.status === "published" ? "Disponível" : "Indisponível no momento"}</small></span><span className="go">Ver <Icon n="right" /></span></>} />)}</div>
          : <Empty title="Nenhuma obra salva." body="Use o marcador no canto de cada obra do acervo."><Link className="btn" href="/colecionador">Ir ao acervo <Icon n="right" /></Link></Empty>}
      </div>
    </div>
  );
}

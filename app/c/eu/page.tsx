import { redirect } from "next/navigation";
import { rnCtx } from "@/lib/rn";
export default async function Eu() { const { me, base, isAdmin } = await rnCtx(); redirect(isAdmin ? base || "/" : `${base}/u/${me.member_code}`); }

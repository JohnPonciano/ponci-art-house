import { redirect } from "next/navigation";
import { rnCtx } from "@/lib/rn";
export default async function Eu() { const { me, base } = await rnCtx(); redirect(`${base}/u/${me.member_code}`); }

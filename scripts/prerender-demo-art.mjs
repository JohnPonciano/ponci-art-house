// Uso: PWPATH=$(npm root -g)/playwright NODE_USE_ENV_PROXY=1 node scripts/prerender-demo-art.mjs <pasta-com-gen.js>
// gen.js = lib/gen.ts sem "export" (ver commit). Envia para o Storage com a conta demo da Helena e imprime o SQL de atualização.
// Renderiza as composições generativas das contas demo como JPEG e envia ao Storage (pasta de cada dono).
import { createRequire } from "module"; const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PWPATH);
const { createClient } = require("/home/user/ponci-art-house/node_modules/@supabase/supabase-js/dist/index.cjs");
import fs from "fs";
const SP = process.argv[2], URL = "https://wcdetrugbkgmapeehyxg.supabase.co", KEY = "sb_publishable_I9Nx_Frq7An3zxhh8kPIJw_q6a5QlqC", PASS = "ponci-demo-2026";
const OWNERS = ["helena@demo.ponci.art"];
const b = await chromium.launch(); const page = await b.newPage(); await page.setContent("<body></body>");
await page.addScriptTag({ content: fs.readFileSync(SP + "/gen.js", "utf8") });
const render = (a, L) => page.evaluate(([a, L]) => { const { W, H } = renderSize({ h: a.h, w: a.w }, L); const url = generate(a, L).replace("image/jpeg", "image/jpeg"); return { url, W, H }; }, [a, L]);
const toBuf = (u) => Buffer.from(u.split(",")[1], "base64");
const sql = [];
for (const email of OWNERS) {
  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  const { data: s, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) { console.log("login falhou", email, error.message); continue; }
  const uid = s.user.id;
  const { data: works } = await sb.from("works").select("id,gen,h,w").is("image_path", null).not("gen", "is", null);
  const { data: media } = await sb.from("post_media").select("id,gen,h,w").is("path", null).not("gen", "is", null);
  for (const [kind, rows] of [["work", works || []], ["media", media || []]]) for (const r of rows) {
    const full = await render({ gen: r.gen, h: r.h, w: r.w }, kind === "work" ? 1200 : 1000), th = await render({ gen: r.gen, h: r.h, w: r.w }, 560);
    const dir = kind === "work" ? "obras-gen" : "diario";
    let ok = true; const name = kind === "work" ? r.id : "gen-" + r.id;
    const path = `${uid}/${dir}/${name}.jpg`, tpath = `${uid}/${dir}/${name}-t.jpg`;
    for (const [p, u] of [[path, full.url], [tpath, th.url]]) {
      const { error: e } = await sb.storage.from("works").upload(p, toBuf(u), { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
      if (e && !/exists/i.test(e.message)) { console.log("upload falhou", p, e.message); ok = false; }
    }
    if (ok) sql.push(kind === "work" ? `update public.works set image_path='${path}', img_w=${full.W}, img_h=${full.H} where id='${r.id}';` : `update public.post_media set path='${path}' where id='${r.id}';`);
    console.log(email.split("@")[0], kind, r.id.slice(0, 8), `${full.W}x${full.H}`, Math.round(toBuf(full.url).length / 1024) + "KB", Math.round(toBuf(th.url).length / 1024) + "KB");
  }
}
fs.writeFileSync(SP + "/prerender.sql", sql.join("\n") + "\n"); console.log("SQL:", sql.length, "linhas");
await b.close();

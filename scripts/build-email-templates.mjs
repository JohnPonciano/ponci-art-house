// Gera os templates de e-mail do Supabase Auth no visual da PONCI.
// Uso: node scripts/build-email-templates.mjs  →  supabase/templates/*.html
// HTML de e-mail: tabelas, estilos inline e fontes de sistema (clientes de e-mail ignoram CSS moderno).
import { writeFileSync, mkdirSync } from "node:fs";

const C = { paper: "#F2F0EB", ink: "#121211", muted: "#5D5B56", ocre: "#8B6A4F", slab: "#DAD6CF", hair: "#CDC9C1", onInkMuted: "#A9A69F", line: "#3A3936" };
const GROT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const BLACK = "'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";
const MONO = "'Courier New',Courier,monospace";
const lab = `font-family:${MONO};font-size:11px;line-height:1.5;letter-spacing:1.2px;text-transform:uppercase;`;

const em = (t) => `<em style="font-family:${SERIF};font-style:italic;font-weight:400;text-transform:none;letter-spacing:0;">${t}</em>`;

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
  <tr><td bgcolor="${C.ink}" style="background:${C.ink};border:2px solid ${C.ink};">
    <a href="${href}" target="_blank" style="display:inline-block;padding:18px 22px;font-family:${GROT};font-size:13px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${C.paper};text-decoration:none;">${label}&nbsp;&nbsp;&rarr;</a>
  </td></tr></table>`;
}

function code(token, { size = 30, spacing = 10 } = {}) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px;">
  <tr><td bgcolor="${C.ink}" style="background:${C.ink};padding:16px 22px;font-family:${MONO};font-size:${size}px;font-weight:700;letter-spacing:${spacing}px;white-space:nowrap;color:${C.paper};">${token}</td></tr></table>`;
}

function layout({ title, preheader, n, eyebrow, ref, heading, intro, body, cta, after, note }) {
  return `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${title}</title>
<style>
  @media (max-width:620px){ .px{padding-left:20px!important;padding-right:20px!important} .mega{font-size:58px!important;letter-spacing:-2px!important} .h1{font-size:34px!important} }
  a{color:${C.ink}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.paper};">${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.paper}" style="background:${C.paper};">
<tr><td align="center" style="padding:28px 12px 40px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border:2px solid ${C.ink};background:${C.paper};">
  <!-- faixa -->
  <tr><td bgcolor="${C.ink}" class="px" style="background:${C.ink};padding:10px 28px;${lab}font-size:10px;color:${C.paper};">
    <span style="display:inline-block;width:7px;height:7px;background:${C.ocre};margin-right:10px;vertical-align:1px;"></span>Rede privada de arte &middot; Brasil
  </td></tr>
  <!-- marca -->
  <tr><td class="px" style="padding:26px 28px 14px;border-bottom:2px solid ${C.ink};">
    <div class="mega" style="font-family:${BLACK};font-size:84px;line-height:.86;font-weight:900;letter-spacing:-4px;color:${C.ink};">PONCI</div>
  </td></tr>
  <!-- régua -->
  <tr><td style="border-bottom:2px solid ${C.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="px" style="padding:12px 28px;${lab}color:${C.ink};">${n} &mdash; ${eyebrow}</td>
      <td align="right" class="px" style="padding:12px 28px;${lab}color:${C.muted};border-left:2px solid ${C.ink};white-space:nowrap;">${ref}</td>
    </tr></table>
  </td></tr>
  <!-- conteúdo -->
  <tr><td class="px" style="padding:32px 28px 30px;">
    <h1 class="h1" style="margin:0 0 18px;font-family:${BLACK};font-size:42px;line-height:.95;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:${C.ink};">${heading}</h1>
    <p style="margin:0 0 14px;font-family:${SERIF};font-style:italic;font-size:21px;line-height:1.3;color:${C.ink};">${intro}</p>
    <p style="margin:0;font-family:${GROT};font-size:15px;line-height:1.6;color:${C.muted};">${body}</p>
    ${cta}
    ${after || ""}
  </td></tr>
  <!-- aviso -->
  <tr><td class="px" style="padding:16px 28px 18px;border-top:2px solid ${C.ink};background:${C.slab};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top" style="padding:5px 12px 0 0;"><span style="display:inline-block;width:8px;height:8px;background:${C.ocre};"></span></td>
      <td style="font-family:${MONO};font-size:12px;line-height:1.6;color:${C.muted};">${note}</td>
    </tr></table>
  </td></tr>
  <!-- rodapé -->
  <tr><td bgcolor="${C.ink}" class="px" style="background:${C.ink};padding:22px 28px 20px;">
    <p style="margin:0 0 6px;font-family:${GROT};font-size:15px;font-weight:700;line-height:1.35;color:${C.paper};">Rede privada de artistas e colecionadores.</p>
    <p style="margin:0 0 16px;font-family:${SERIF};font-style:italic;font-size:15px;line-height:1.4;color:${C.onInkMuted};">&ldquo;Entre quem cria e quem coleciona, nada al&eacute;m da obra.&rdquo;</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};"><tr>
      <td style="padding-top:12px;${lab}font-size:10px;color:${C.onInkMuted};">&copy; 2026 PONCI</td>
      <td align="right" style="padding-top:12px;${lab}font-size:10px;"><a href="{{ .SiteURL }}" style="color:${C.ocre};text-decoration:none;">ponci.art</a></td>
    </tr></table>
  </td></tr>
</table>

</td></tr></table>
</body>
</html>
`;
}

const fallback = (url) => `<p style="margin:18px 0 0;font-family:${MONO};font-size:11px;line-height:1.6;color:${C.muted};">Se o bot&atilde;o n&atilde;o abrir, copie este endere&ccedil;o no navegador:<br><a href="${url}" style="color:${C.ink};word-break:break-all;">${url}</a></p>`;
const hello = `{{ if .Data.full_name }}Ol&aacute;, {{ .Data.full_name }}.{{ else }}Ol&aacute;.{{ end }}`;

const T = {
  confirmation: {
    subject: "Confirme seu e-mail · PONCI",
    html: layout({
      title: "Confirme seu e-mail", preheader: "Falta um passo para entrar na rede PONCI.",
      n: "01", eyebrow: "Novo membro", ref: "Cadastro",
      heading: `Confirme seu ${em("e-mail.")}`,
      intro: `${hello} Seu convite foi aceito.`,
      body: "Para ativar sua conta de membro da PONCI, confirme que este endere&ccedil;o &eacute; seu. Depois disso voc&ecirc; entra direto na sua &aacute;rea da rede.",
      cta: button("{{ .ConfirmationURL }}", "Confirmar e-mail"), after: fallback("{{ .ConfirmationURL }}"),
      note: "O link vale por 24 horas. Se voc&ecirc; n&atilde;o pediu acesso &agrave; PONCI, ignore esta mensagem: nenhuma conta ser&aacute; ativada.",
    }),
  },
  recovery: {
    subject: "Redefinir senha · PONCI",
    html: layout({
      title: "Redefinir senha", preheader: "Crie uma nova senha para sua conta na PONCI.",
      n: "02", eyebrow: "Acesso", ref: "Senha",
      heading: `Nova ${em("senha.")}`,
      intro: "Recebemos um pedido para redefinir a sua senha.",
      body: "Use o bot&atilde;o abaixo para escolher uma nova senha. Por seguran&ccedil;a, o link funciona uma &uacute;nica vez.",
      cta: button("{{ .ConfirmationURL }}", "Criar nova senha"), after: fallback("{{ .ConfirmationURL }}"),
      note: "Se n&atilde;o foi voc&ecirc;, ignore este e-mail. Sua senha atual continua valendo e ningu&eacute;m acessa sua conta sem ela.",
    }),
  },
  magic_link: {
    subject: "Seu link de acesso · PONCI",
    html: layout({
      title: "Link de acesso", preheader: "Entre na PONCI com um clique.",
      n: "03", eyebrow: "Acesso", ref: "Link &uacute;nico",
      heading: `Entrar ${em("na rede.")}`,
      intro: `${hello}`,
      body: "Aqui est&aacute; o seu link de acesso &agrave; PONCI. Ele entra direto na sua conta, sem senha.",
      cta: button("{{ .ConfirmationURL }}", "Entrar na PONCI"), after: fallback("{{ .ConfirmationURL }}"),
      note: "O link funciona uma vez e expira em pouco tempo. Se voc&ecirc; n&atilde;o pediu, ignore.",
    }),
  },
  email_change: {
    subject: "Confirme o novo e-mail · PONCI",
    html: layout({
      title: "Confirmar novo e-mail", preheader: "Confirme a troca de e-mail da sua conta PONCI.",
      n: "04", eyebrow: "Conta", ref: "Troca de e-mail",
      heading: `Novo ${em("endere&ccedil;o.")}`,
      intro: "Voc&ecirc; pediu para trocar o e-mail da sua conta.",
      body: `De <b style="color:${C.ink};">{{ .Email }}</b> para <b style="color:${C.ink};">{{ .NewEmail }}</b>. Confirme para concluir a troca.`,
      cta: button("{{ .ConfirmationURL }}", "Confirmar troca"), after: fallback("{{ .ConfirmationURL }}"),
      note: "Se voc&ecirc; n&atilde;o pediu esta troca, ignore e fale com a curadoria da PONCI.",
    }),
  },
  reauthentication: {
    subject: "Código de verificação · PONCI",
    html: layout({
      title: "Código de verificação", preheader: "Seu código de verificação da PONCI.",
      n: "05", eyebrow: "Seguran&ccedil;a", ref: "Verifica&ccedil;&atilde;o",
      heading: `Seu ${em("c&oacute;digo.")}`,
      intro: "Confirme que &eacute; voc&ecirc;.",
      body: "Digite este c&oacute;digo na PONCI para concluir a a&ccedil;&atilde;o que voc&ecirc; come&ccedil;ou.",
      cta: code("{{ .Token }}"),
      note: "O c&oacute;digo expira em poucos minutos. Nunca o compartilhe: a PONCI n&atilde;o pede este c&oacute;digo por telefone ou mensagem.",
    }),
  },
  invite: {
    subject: "Você foi convidado · PONCI",
    html: layout({
      title: "Convite PONCI", preheader: "Você recebeu um convite para a rede privada PONCI.",
      n: "00", eyebrow: "Convite", ref: "Rede privada",
      heading: `Voc&ecirc; foi ${em("convidado.")}`,
      intro: "A PONCI &eacute; uma rede fechada de artistas e colecionadores.",
      body: "Voc&ecirc; recebeu um convite para fazer parte dela. Aceite para criar sua senha e entrar na rede.",
      cta: button("{{ .ConfirmationURL }}", "Aceitar convite"), after: fallback("{{ .ConfirmationURL }}"),
      note: "O convite &eacute; pessoal. Se voc&ecirc; n&atilde;o esperava esta mensagem, ignore.",
    }),
  },
};

// Convite da PONCI (código gerado na aprovação de um pedido). Não é template do Supabase Auth:
// placeholders {{nome}}, {{codigo}}, {{perfil}} e {{link}}, compatíveis com templates dinâmicos do SendGrid.
const convite = layout({
  title: "Seu convite PONCI", preheader: "Seu acesso à PONCI foi aprovado. Use o código para criar sua conta.",
  n: "00", eyebrow: "Convite aprovado", ref: "{{perfil}}",
  heading: `Seu convite ${em("chegou.")}`,
  intro: "Ol&aacute;, {{nome}}. A curadoria aprovou o seu acesso.",
  body: "A PONCI &eacute; uma rede fechada de artistas e colecionadores. Este &eacute; o seu c&oacute;digo pessoal de convite. Use-o para criar sua conta de membro.",
  cta: code("{{codigo}}", { size: 20, spacing: 2 }) + button("{{link}}", "Criar minha conta"),
  after: fallback("{{link}}"),
  note: "O c&oacute;digo &eacute; pessoal e vale para um &uacute;nico cadastro. N&atilde;o o compartilhe.",
}).replace('href="{{ .SiteURL }}"', 'href="https://ponci.art"');

mkdirSync("supabase/templates", { recursive: true });
writeFileSync("supabase/templates/convite-ponci.html", convite);
const subjects = {};
for (const [k, v] of Object.entries(T)) { writeFileSync(`supabase/templates/${k}.html`, v.html); subjects[k] = v.subject; }
writeFileSync("supabase/templates/subjects.json", JSON.stringify(subjects, null, 2) + "\n");
console.log("ok:", Object.keys(T).join(", "));

# Templates de e-mail (Supabase Auth)

Gerados por `node scripts/build-email-templates.mjs` (edite o script, não o HTML).
HTML de e-mail: tabelas, estilos inline e fontes de sistema, testado em 600 px e 390 px.

Aplicar em **Supabase → Authentication → Emails → Templates**: para cada um, cole o assunto
e o conteúdo do arquivo (aba "Source").

| Template no Supabase | Arquivo | Assunto |
|---|---|---|
| Confirm signup | `confirmation.html` | Confirme seu e-mail · PONCI |
| Reset password | `recovery.html` | Redefinir senha · PONCI |
| Magic link | `magic_link.html` | Seu link de acesso · PONCI |
| Change email address | `email_change.html` | Confirme o novo e-mail · PONCI |
| Reauthentication | `reauthentication.html` | Código de verificação · PONCI |
| Invite user | `invite.html` | Você foi convidado · PONCI |

Variáveis usadas: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`,
`{{ .NewEmail }}` e `{{ .Data.full_name }}` (nome informado no cadastro).

Requisitos em **Authentication → URL Configuration**:
- Site URL: `https://ponci.art`
- Redirect URLs: `https://ponci.art/**` (cobre `/auth/callback` e `/auth/callback?next=/senha/nova`)

## Convite da PONCI (fora do Supabase Auth)

`convite-ponci.html` é o e-mail do código de convite gerado quando o admin aprova um pedido.
Usa os placeholders `{{nome}}`, `{{codigo}}`, `{{perfil}}` e `{{link}}`, no formato dos templates
dinâmicos do SendGrid (Email API → Dynamic Templates). O "Invite user" do Supabase existe só para
manter o painel consistente: a rede não usa o convite nativo, porque o cadastro exige código.

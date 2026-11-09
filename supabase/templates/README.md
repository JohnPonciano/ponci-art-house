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

Variáveis usadas: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`,
`{{ .NewEmail }}` e `{{ .Data.full_name }}` (nome informado no cadastro).

Requisitos em **Authentication → URL Configuration**:
- Site URL: `https://ponci.art`
- Redirect URLs: `https://ponci.art/**` (cobre `/auth/callback` e `/auth/callback?next=/senha/nova`)

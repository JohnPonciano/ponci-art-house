# PONCI — Rede privada de arte

Rede **fechada, por convite**, onde artistas e colecionadores compram e vendem obras.
Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage) + Cloudflare Workers (OpenNext), no design
brutalista do protótipo original (`docs/referencia/`).

## Rotas

| Rota | O que é |
|---|---|
| `/` | Landing: duas portas, vitrine com preço trancado, manifesto, como funciona, FAQ, pedido de convite (grava em `access_requests`). |
| `/entrar?perfil=artista\|colecionador` | Login. Botão de conta demo. |
| `/cadastro` | Criar conta com **código de convite** (o código define o papel). |
| `/artista` … `/obras`, `/obras/nova`, `/obras/[slug]`, `/propostas`, `/vendas`, `/perfil` | Área do artista: ateliê, curadoria, upload de foto, aceitar/recusar/contrapropor, custódia e repasse. |
| `/colecionador` … `/obras/[slug]`, `/favoritos`, `/propostas`, `/aquisicoes` | Área do colecionador: acervo com filtros, reserva pelo preço, propostas, aceitar contraproposta, etapas de custódia e certificado. |

O `middleware.ts` bloqueia as áreas para quem não está logado; os layouts redirecionam por papel.

## Banco (Supabase)

- `supabase/migrations/` — esquema, RLS e regras de negócio em funções (`make_proposal`, `respond_proposal`,
  `reserve_work`, `advance_order`, …). Reserva trava a linha da obra e encerra as outras propostas.
- Privacidade: o colecionador aparece para a artista só por `member_code` + cidade; o nome (`profile_private`)
  só é legível pela contraparte depois que existe um pedido entre os dois.
- `supabase/seed.sql` — convites `PONCI-ARTISTA-2026` / `PONCI-COLECAO-2026`, contas demo e obras.
- Contas demo: `helena@demo.ponci.art` e `marina@demo.ponci.art`, senha `ponci-demo-2026`.

## Rodar local

```bash
cp .env.example .env.local   # preencha URL e publishable key
npm install
npm run dev
```

## Deploy (Cloudflare Workers + ponci.art)

`wrangler.jsonc` publica o Worker `ponci-art-house` com os domínios `ponci.art` e `www.ponci.art`.
O workflow `.github/workflows/deploy.yml` faz build e deploy a cada push. Ele precisa do secret
**`CLOUDFLARE_API_TOKEN`** no GitHub (Settings → Secrets and variables → Actions).

Manual: `CLOUDFLARE_API_TOKEN=... npm run deploy`.

## Painel de admin (`/admin`)

Acesso só para e-mails da tabela `public.admins` (hoje: o do dono da rede), com login em `/admin/entrar`.

- **Pedidos**: aprovar um pedido de convite gera um código de uso único (`PONCI-A-XXXXXX` / `PONCI-C-XXXXXX`),
  com botões para copiar a mensagem ou abrir o e-mail já escrito. Conta criada com esse código entra ativa.
- **Membros**: contas criadas com códigos genéricos ficam *aguardando*; aprovar, suspender ou reativar.
  Membro que não está ativo não vê obras, preços nem negociações (RLS via `is_member()`).
- **Curadoria**: aprovar (publica) ou recusar (apaga) obras enviadas.
- **Convites**: gerar códigos avulsos (usos, nota, ativação direta ou não) e revogar.
- **Conta**: troca de senha.

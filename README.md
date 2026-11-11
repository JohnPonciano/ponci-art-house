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

Acesso só para e-mails da tabela `public.admins` (hoje: o do dono da rede), com login em `/entrar/admin`.

- **Pedidos**: aprovar um pedido de convite gera um código de uso único (`PONCI-A-XXXXXX` / `PONCI-C-XXXXXX`),
  com botões para copiar a mensagem ou abrir o e-mail já escrito. Conta criada com esse código entra ativa.
- **Membros**: contas criadas com códigos genéricos ficam *aguardando*; aprovar, suspender ou reativar.
  Membro que não está ativo não vê obras, preços nem negociações (RLS via `is_member()`).
- **Curadoria**: aprovar (publica) ou recusar (apaga) obras enviadas.
- **Convites**: gerar códigos avulsos (usos, nota, ativação direta ou não) e revogar.
- **Conta**: troca de senha.

## Dados e responsabilidade

- **Documentos versionados** (`legal/*.md`, minutas para revisão jurídica): Termos, Privacidade, Contrato do
  artista e Condições de compra. Cada versão é imutável e tem SHA-256. Publicar: painel → Documentos, ou
  `node scripts/publish-legal.mjs` (com sessão de admin verificada por MFA: `ADMIN_TOTP=123456`).
- **Aceites com evidência** (data, IP, navegador, hash) no cadastro e em `/aceite` quando sai versão nova.
- **Cadastro de identificação (KYC)**: CPF e telefone no cadastro; endereço, nascimento e declaração de PEP em
  `/conta`. Sem cadastro completo e termos em dia, o banco recusa propostas, reservas, obras e assinaturas.
- **Contrato por venda** gerado na reserva (`/contrato/[ref]`), com hash e assinatura eletrônica das partes;
  o pagamento só avança com as duas assinaturas. Arrependimento de 7 dias após a entrega.
- **LGPD**: `/conta` exporta os dados (JSON) e abre solicitações; admin responde em Solicitações.
- **Compliance** (Lei 9.613/98 · IPHAN): operações ≥ R$ 10 mil com identificação das partes e CSV.
- **Auditoria**: trilha imutável de alterações (dados sensíveis omitidos).
- **MFA (TOTP)**: opcional para membros (`/seguranca`), obrigatório para admin (o banco só aceita ações de
  admin em sessão `aal2`).

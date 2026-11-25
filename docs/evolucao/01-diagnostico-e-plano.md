# PONCI Art House: diagnóstico e plano de evolução

Data: 24/11/2026 · Base: branch `main` (commit 28aded5)

## 1. O que já existe (não reconstruir)

**Stack**
- Next.js 15 (App Router, Server Actions) e React 19.
- Supabase (Postgres com RLS, Auth, Storage, pg_cron, pg_net, Vault).
- Deploy em Cloudflare Workers via OpenNext; push em `main` publica.
- Sem framework de UI, sem ORM e sem dependências além de `@supabase/*`. CSS próprio em `app/globals.css`.
- A regra de negócio vive no banco: funções `SECURITY DEFINER`, triggers e RLS. O Next só chama RPCs.

**Identidade visual**
- Brutalismo editorial: Archivo (wide/cond), Instrument Serif itálico e IBM Plex Mono.
- Paleta: papel `#F2F0EB`, carvão `#121211` e ocre `#8B6A4F`.
- Componentes próprios: `PageHead`, `Empty`, `.lab`, `.tag`, `ArtImage` e `Scale` (escala humana da obra).

| Requisito do briefing | Situação hoje | Onde |
|---|---|---|
| Entrada por convite | **Pronto.** Convites do admin e de membros, pedido de acesso, aprovação de membro | `invites`, `access_requests`, `member_requests`, `/convite/[code]`, `/admin/convites`, `/admin/solicitacoes` |
| Cadastro e edição de perfil | **Pronto.** Nome artístico, cidade, prática, bio, @handle, avatar e KYC separado | `profiles`, `profile_private`, `kyc`, `/artista/perfil`, `/c/ajustes` |
| Cadastro de obra | **Pronto.** Foto com miniatura, técnica, medidas, ano, descrição, frete | `works`, `/artista/obras/nova` |
| Curadoria | **Pronta.** Aprovar, recusar com motivo, pedir ajustes e histórico | `admin_curate`, `curation_log`, `/admin/curadoria` |
| Venda de original | **Pronta, mas acoplada à obra.** Preço é coluna de `works`; reserva → contrato → pagamento manual → envio pelo artista → entrega → repasse | `orders`, `contracts`, `/admin/vendas` (kanban) |
| Negociação | **Pronta e opcional.** Propostas e contrapropostas | `proposals`, `proposal_events` |
| Prints sob demanda | **Não existe.** Só a etiqueta REPROD (`works.reproduction`), que marca a *própria peça* como reprodução | — |
| Encomendas | **Não existe** | — |
| Comunidade | **Pronta.** Feed, notas com fotos, comentários, curtidas, salvos, seguir, stories de 24h, coleção pública, perfil oficial. A nota pode apontar para uma obra (`posts.work_id`) | `/c/*` |
| Fornecedores, custos, regras comerciais | **Não existe.** Comissão de 15% fixa no código | — |
| Testes | **Não existem.** Validei tudo à mão (Postgres local e Playwright) | — |

## 2. Problemas de arquitetura que travam a evolução

1. **A obra é a oferta.** `works.price` é obrigatório (≥ 500) e `works.status` mistura dois conceitos:
   - curadoria: `review`, `published`;
   - disponibilidade comercial: `reserved`, `sold`.
   
   Resultado: aprovar uma obra a coloca à venda automaticamente, e não há lugar para uma segunda modalidade. Isso fere o item 3.6 do briefing (aprovação independente da configuração comercial).
2. **`orders` só conhece originais.** O pedido aponta para `work_id` com um único `amount` e `stage` de 0 a 3. Não há item, tamanho, edição nem número de exemplar.
3. **Comissão fixa em 6 lugares:**
   - `lib/format.ts` (`COMMISSION`);
   - `area-client.tsx` (`0.85`);
   - `_contract_text` (SQL `0.15`, em 3 versões da função);
   - textos da home, de `/artista/vendas` e de `/artista/obras/nova`.
4. **`works.reproduction` tem semântica ambígua.** Hoje significa "esta peça cadastrada é uma reprodução". Com prints, passaremos a ter "obra original + reproduções autorizadas dela". A etiqueta continua válida para o primeiro caso, mas não pode virar o mecanismo de prints.
5. **Valores em reais inteiros (`int`).** Funciona para originais (sempre redondos), mas não para preço calculado de print (custo ÷ (1 − comissão) gera centavos). As tabelas novas devem usar **centavos**.
6. **Sem testes automatizados.** Regras comerciais novas (preço, numeração de edição, limite de tiragem) precisam de testes antes de ir para produção.
7. **Rede fechada × "apresentação pública".** Por decisão anterior (proteção contra coleta por IA, `/protecao`), só membros veem obras. O público vê apenas a vitrine-teaser da home. O briefing fala em "apresentação pública": isso é uma decisão de produto (ver §4).

## 3. Modelo de dados proposto (aditivo, sem quebrar o que existe)

```
works (obra; curadoria)                    offers (oferta comercial de uma obra)
  status: review | published               kind: original | print
  (reserved/sold passam a ser              status: draft | active | paused | sold_out
   lidos da oferta original)               original: price_cents, ship_included…
                                            print: edition (open|limited), edition_max,
                                                   signed, numbered, artist_fee_cents,
                                                   rights_acceptance_id (autorização explícita)
                                           offer_print_sizes: offer × print_product × size
                                                   → preço final calculado e congelado na publicação

print_suppliers (gráficas homologadas)     commerce_settings (versão vigente)
print_products (papel/acabamento)            print_commission_pct, payment_fee_pct,
print_costs (fornecedor × produto ×          tax_pct, original_commission_pct
  tamanho → impressão, preparo,
  embalagem, assinatura; em centavos;      print_orders / print_units
  com vigência)                              numeração da edição alocada na
                                             confirmação do pagamento (lock por oferta)
commission_requests (encomenda: descrição,
  referências, medidas, local, orçamento pretendido, status do orçamento)
```

**Fórmula do print**, numa função SQL única e testada; o front só exibe:

```
custos_fixos = impressão + preparo + embalagem + (assinatura, se assinada) + frete-base (se definido)
preço_final  = arredonda_para_cima( (custos_fixos + remuneração_artista) / (1 − comissão% − taxa_pagamento% − imposto%) )
```

Regras:
- Cada componente entra uma única vez. Taxas percentuais ficam no denominador, nunca somadas de novo.
- A quebra completa fica guardada no registro do preço publicado, para mostrar com transparência ao artista e ao admin.
- Se algum custo do fornecedor estiver ausente ou vencido, a oferta **não publica**.
- **Não cadastro nenhum custo real.** As tabelas nascem vazias e o admin preenche.

**Autorização de reprodução**
- Aceite explícito e imutável, no mesmo padrão de `acceptances` e `contracts`.
- Fica ligado à obra e às condições da oferta: tiragem, tamanhos, assinatura.
- Mudou a condição, exige novo aceite.

**Edição limitada**
- O número do exemplar é alocado com `SELECT … FOR UPDATE` na oferta, na confirmação do pagamento.
- Pedido cancelado antes de pagar não consome número.
- A tiragem esgotada vira `sold_out` automaticamente.

## 4. Decisões de produto pendentes (com recomendação)

1. **Visibilidade das obras.**
   - *Recomendo:* manter a obra completa e os preços só para membros (coerente com `/protecao`).
   - Abrir ao público apenas uma página de artista e uma de obra em **baixa resolução, sem preço**, com chamada para pedir convite. Isso ajuda descoberta e SEO sem entregar a imagem em alta.
2. **Quem paga a comissão.**
   - *Recomendo:* nos prints, usar a sua fórmula, com a comissão embutida no preço final e o artista recebendo exatamente a remuneração que definiu.
   - Nos originais, manter os 15% descontados do artista (já está nos contratos assinados), mas lidos da configuração, não fixos no código.
3. **Logística do print assinado.**
   - *Recomendo:* gráfica homologada imprime. Print sem assinatura vai direto ao comprador.
   - Print assinado ou numerado vai da gráfica para o artista, que assina, numera e despacha (com o mesmo fluxo de rastreio que já existe).
4. **Pagamento.** Ainda não há gateway. *Recomendo:* confirmação manual pelo admin (como hoje nos originais). A produção do print só é liberada depois dela.

## 5. Plano incremental

Cada fase termina testada e no ar antes da próxima.

**Fase 0. Base (sem mudança visível)**
- Testes: SQL de regra comercial rodando no Postgres local, mais `node --test` para as funções de preço em TS. Sem dependência nova; o Node 22 roda TS direto.
- Tirar a comissão fixa do código: `commerce_settings` com a versão vigente, lida pelo SQL e pelo front.

**Fase 1. Curadoria separada da venda**
- Tabela `offers`. Migração cria uma oferta `original` ativa para cada obra publicada hoje, com o mesmo preço e status, sem mudança para quem usa.
- Depois de aprovada, a obra pode ficar só como portfólio, ou o artista ativa a venda do original numa tela "Modalidades".
- `reserve_work` e o kanban passam a ler e escrever a disponibilidade na oferta original.

**Fase 2. Prints sob demanda**
- Admin: fornecedores, produtos (papel, acabamento), tabela de custos por tamanho com vigência, regras comerciais.
- Artista: ativar print, tamanhos, edição aberta ou limitada, máximo, assinatura e numeração, remuneração por unidade, prévia transparente do preço e aceite da autorização de reprodução.
- Validação do preço final antes de publicar.
- Pedido de print: reserva → pagamento confirmado (admin) → número da edição → produção → envio → entrega.

**Fase 3. Página da obra como apresentação e compra**
- Seletor de modalidade (Original / Print Fine Art por tamanho / Encomenda), cada uma com condições e preço.
- Bloco de edição e autenticidade.
- Mais obras do artista e notas da comunidade sobre a obra.
- Tudo dentro do layout atual (`Scale`, `ArtImage`, faixa editorial).

**Fase 4. Encomendas**
- Formulário de pedido de orçamento: descrição, referências (fotos), medidas, local para mural, orçamento pretendido.
- Caixa de entrada do artista; responder com orçamento ou recusar.
- Sem contratação automática nesta fase.

**Depois:** integração por API com a gráfica, frete calculado (Melhor Envio já preparado, falta o token), relatórios comerciais, destaque de linguagens (arte urbana) na descoberta.

## 6. Decisões tomadas (24/11/2026)

1. **Visibilidade:** tudo continua fechado. Obras, preços e páginas de artista só para membros; nada novo público além da vitrine da home.
2. **Comissão:** nos prints, embutida no preço final pela fórmula. Nos originais, segue descontada do artista como hoje, mas lida das regras comerciais e gravada em cada venda.
3. **Logística do print:** gráfica homologada imprime. Sem assinatura, vai direto ao comprador; assinado ou numerado, vai ao artista, que assina, numera e despacha com rastreio.
4. **Pagamento:** confirmação manual pelo admin até haver gateway; a produção do print só começa depois dela.

## 7. Andamento

- **Fase 0, concluída.**
  - `20261126120000_regras_comerciais.sql`: `commerce_settings` versionada e imutável, `orders.commission_pct` e contrato lendo a comissão da venda.
  - Tela `/admin/regras`.
  - Front sem 15% fixo.
  - Testes: `npm test` (unidade) e `npm run test:db` (banco).
- **Fase 1, cancelada por decisão de produto.** O original fica exatamente como está, e o artista só ganha a opção de liberar prints.
- **Fase 2a, concluída.** Migração `20261127120000_prints.sql`:
  - catálogo do admin: gráficas, papéis com DPI mínimo, tamanhos e custos imutáveis com vigência;
  - oferta de print por obra: edição aberta ou limitada, assinatura e numeração, remuneração por tamanho;
  - arquivo-mestre em bucket privado, com resolução conferida por papel;
  - autorização de reprodução com texto, SHA-256 e IP, imutável;
  - preço congelado na publicação e pausa do admin com motivo.
  
  Telas: `/admin/prints`, seção "Prints" na obra do artista, "Também em print" na obra para o colecionador e etiqueta PRINT no acervo. Obras com original vendido e prints ativos continuam no acervo.
- **Próximo, Fase 2b: compra do print.** Pedido, confirmação manual de pagamento com número da edição alocado nesse momento, produção, envio (gráfica direto, ou via artista se assinado), entrega e repasse.
- **Fase 2b, concluída (25/11).** Migração `20261128120000_pedidos_print.sql`, já aplicada pelo conector do Supabase.
  - **Compra:** em 1 clique, com o endereço do cadastro; a vaga da edição limitada fica guardada por 48 h.
  - **Pagamento:** confirmado pelo admin. Isso numera o exemplar automaticamente e avisa comprador e artista por e-mail.
  - **Gráfica:** ordem pronta para copiar, com link temporário do arquivo.
  - **Envio:** pela gráfica ou, se assinado, pela artista. Comprador confirma o recebimento e o admin registra o repasse.
  - **Telas:** etiquetas Original/Print, escolha original × print na obra e "liberar prints" em 3 passos com valor único.
  - **Catálogo:** WePrint, enxuto: Rag e Lustre × A4, A3, A2, 50×70.

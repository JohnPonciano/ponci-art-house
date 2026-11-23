-- Envio pelo artista: a artista embala e despacha (com seguro); em cada obra escolhe "frete incluso" ou "frete à parte".
-- O contrato passa a dizer isso (cláusulas 2.4, 3.1 e 3.2).

alter table public.works add column if not exists ship_included boolean not null default false;

drop function if exists public.set_work_shipping(uuid, int, numeric);
create or replace function public.set_work_shipping(p_work uuid, p_depth int, p_weight numeric, p_included boolean default null) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_depth is not null and (p_depth < 1 or p_depth > 300) then raise exception 'Profundidade entre 1 e 300 cm.' using errcode='P0001'; end if;
  if p_weight is not null and (p_weight <= 0 or p_weight > 300) then raise exception 'Peso entre 0,1 e 300 kg.' using errcode='P0001'; end if;
  update public.works set depth_cm = p_depth, weight_kg = p_weight, ship_included = coalesce(p_included, ship_included)
  where id = p_work and artist_id = auth.uid() and status <> 'sold';
  if not found then raise exception 'Obra não encontrada.' using errcode='P0001'; end if;
end $$;
revoke execute on function public.set_work_shipping(uuid, int, numeric, boolean) from public, anon;
grant execute on function public.set_work_shipping(uuid, int, numeric, boolean) to authenticated;

create or replace function public._contract_text(p_order uuid) returns text language plpgsql stable security definer set search_path='' as $$
declare o public.orders; w public.works; ap public.profiles; bp public.profiles; ak public.kyc; bk public.kyc;
  t public.legal_documents; ca public.legal_documents; cc public.legal_documents; pv public.legal_documents;
  v_comm int; v_doc text;
begin
  select * into o from public.orders where id = p_order;
  select * into w from public.works where id = o.work_id;
  select * into ap from public.profiles where id = w.artist_id;
  select * into bp from public.profiles where id = o.buyer_id;
  select * into ak from public.kyc where user_id = w.artist_id;
  select * into bk from public.kyc where user_id = o.buyer_id;
  if ak.user_id is null or bk.user_id is null then
    raise exception 'As duas partes precisam ter o cadastro de identificação completo.' using errcode='P0001'; end if;
  select * into t from public.current_documents() where slug = 'termos';
  select * into pv from public.current_documents() where slug = 'privacidade';
  select * into ca from public.current_documents() where slug = 'contrato-artista';
  select * into cc from public.current_documents() where slug = 'contrato-colecionador';
  v_comm := round(o.amount * 0.15);
  return format(
E'# Instrumento particular de compra e venda de obra de arte com intermediação\n\n'
'Pedido **%s** · emitido em %s\n\n'
'## Partes\n\n'
'**VENDEDOR (ARTISTA):** %s, %s nº %s, membro %s, com endereço em %s/%s.\n\n'
'**COMPRADOR (COLECIONADOR):** %s, %s nº %s, membro %s, com endereço em %s/%s.\n\n'
'**INTERMEDIADORA:** [RAZÃO SOCIAL], CNPJ [CNPJ] ("PONCI").\n\n'
'A qualificação completa das partes consta do cadastro de identificação mantido pela INTERMEDIADORA.\n\n'
'## 1. Objeto\n\n'
'1.1. O VENDEDOR vende ao COMPRADOR a obra **%s**, de autoria de %s, %s, %s, %s × %s cm, %s, registrada na rede sob o nº %s.\n\n'
'## 2. Preço e pagamento\n\n'
'2.1. Preço total da obra: **%s** (%s).\n\n'
'2.2. O COMPRADOR paga o preço à instituição de pagamento parceira da INTERMEDIADORA, que o mantém em custódia até a confirmação de entrega e o término do prazo de arrependimento, quando aplicável. O pagamento deve ser concluído em até 48 horas após a assinatura deste instrumento.\n\n'
'2.3. Comissão de intermediação de 15%%, devida pelo VENDEDOR e retida no repasse: %s. Valor líquido a repassar ao VENDEDOR: %s.\n\n'
'2.4. %s\n\n'
'## 3. Entrega e risco\n\n'
'3.1. O VENDEDOR embala a obra adequadamente e a despacha, com seguro pelo valor da obra, em até 5 dias úteis após a confirmação do pagamento em custódia, informando na plataforma a transportadora e o código de rastreio.\n\n'
'3.2. O risco da obra corre por conta do VENDEDOR até a entrega e passa ao COMPRADOR no recebimento. O COMPRADOR registra avarias pela plataforma, com fotos, em até 48 horas. A INTERMEDIADORA acompanha a entrega e media eventuais problemas.\n\n'
'## 4. Arrependimento e devolução\n\n'
'4.1. Sendo o COMPRADOR consumidor, pode desistir da compra em até 7 dias do recebimento (art. 49 do CDC), devolvendo a obra nas mesmas condições, com restituição integral do valor pago.\n\n'
'## 5. Autenticidade\n\n'
'5.1. %s\n\n'
'5.2. Concluída a entrega, a INTERMEDIADORA emite certificado de procedência numerado.\n\n'
'## 6. Direitos autorais\n\n'
'6.1. Este instrumento transfere a propriedade do suporte físico, não os direitos patrimoniais de autor (art. 37 da Lei 9.610/98). Nas revendas, aplica-se o direito de sequência (art. 38 da mesma lei).\n\n'
'## 7. Documentos incorporados\n\n'
'7.1. Integram este instrumento, nas versões vigentes na data de emissão:\n\n'
'- Termos de Uso, versão %s (SHA-256 %s)\n'
'- Política de Privacidade, versão %s (SHA-256 %s)\n'
'- Contrato de Intermediação — Artista, versão %s (SHA-256 %s)\n'
'- Condições Gerais de Compra — Colecionador, versão %s (SHA-256 %s)\n\n'
'## 8. Assinatura eletrônica e foro\n\n'
'8.1. As partes assinam este instrumento eletronicamente na plataforma PONCI, que registra data, hora, IP, navegador e a impressão digital SHA-256 deste texto, reconhecendo sua validade (Lei 14.063/2020 e art. 10, § 2º, da MP 2.200-2/2001).\n\n'
'8.2. Fica eleito o foro da comarca de [CIDADE/UF], ressalvado o direito do consumidor de demandar no foro de seu domicílio.\n',
    o.ref, to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM/YYYY'),
    ak.legal_name, case ak.person_type when 'pf' then 'CPF' else 'CNPJ' end, public._mask_doc(ak.doc_number), ap.member_code, ak.city, ak.uf,
    bk.legal_name, case bk.person_type when 'pf' then 'CPF' else 'CNPJ' end, public._mask_doc(bk.doc_number), bp.member_code, bk.city, bk.uf,
    w.title, ap.display_name, w.year, w.medium, w.h, w.w, case when w.reproduction then coalesce(w.edition || ', ', '') || 'REPRODUÇÃO (não é a obra original)' else coalesce(w.edition, 'obra única') end, 'PNC ' || lpad(w.no::text, 3, '0'),
    public._brl(o.amount), case o.via when 'direct' then 'reserva pelo preço' else 'proposta aceita' end,
    public._brl(v_comm), public._brl(o.amount - v_comm),
    case when w.ship_included
      then 'O frete, a embalagem e o seguro de transporte estão incluídos no preço acima e correm por conta do VENDEDOR.'
      else 'O frete, com seguro pelo valor da obra, é pago pelo COMPRADOR, informado antes do pagamento e não integra o preço acima. A embalagem corre por conta do VENDEDOR.' end,
    case when w.reproduction
      then 'O objeto é uma REPRODUÇÃO (impressão ou cópia) e não a obra original. O VENDEDOR declara ser o autor da obra reproduzida ou deter os direitos para reproduzi-la e vendê-la, que o exemplar corresponde à descrição e está livre de ônus, e responde por evicção e vícios. Constatada divergência entre o exemplar e a descrição, o COMPRADOR tem direito à restituição integral.'
      else 'O VENDEDOR declara ser o autor da obra, que ela é original e está livre de ônus, e responde por evicção e vícios. Constatada falta de autenticidade, o COMPRADOR tem direito à restituição integral.' end,
    t.version, left(t.sha256, 16), pv.version, left(pv.sha256, 16), ca.version, left(ca.sha256, 16), cc.version, left(cc.sha256, 16));
end $$;
revoke execute on function public._contract_text(uuid) from public, anon, authenticated;

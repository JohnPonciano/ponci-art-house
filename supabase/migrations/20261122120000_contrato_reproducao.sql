-- Contrato de compra: quando a obra é uma reprodução (REPROD), o objeto e a cláusula de autenticidade
-- deixam isso explícito, em vez de declarar "obra única" e "original".
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
'2.4. Frete, embalagem especial e seguro são informados ao COMPRADOR antes do pagamento e não integram o preço acima.\n\n'
'## 3. Entrega e risco\n\n'
'3.1. O VENDEDOR disponibiliza a obra, adequadamente embalada, para coleta em até 5 dias úteis após a confirmação do pagamento em custódia.\n\n'
'3.2. O transporte é coordenado pela INTERMEDIADORA, com seguro. O risco passa ao COMPRADOR no recebimento. O COMPRADOR registra avarias pela plataforma em até 48 horas.\n\n'
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
    case when w.reproduction
      then 'O objeto é uma REPRODUÇÃO (impressão ou cópia) e não a obra original. O VENDEDOR declara ser o autor da obra reproduzida ou deter os direitos para reproduzi-la e vendê-la, que o exemplar corresponde à descrição e está livre de ônus, e responde por evicção e vícios. Constatada divergência entre o exemplar e a descrição, o COMPRADOR tem direito à restituição integral.'
      else 'O VENDEDOR declara ser o autor da obra, que ela é original e está livre de ônus, e responde por evicção e vícios. Constatada falta de autenticidade, o COMPRADOR tem direito à restituição integral.' end,
    t.version, left(t.sha256, 16), pv.version, left(pv.sha256, 16), ca.version, left(ca.sha256, 16), cc.version, left(cc.sha256, 16));
end $$;
revoke execute on function public._contract_text(uuid) from public, anon, authenticated;

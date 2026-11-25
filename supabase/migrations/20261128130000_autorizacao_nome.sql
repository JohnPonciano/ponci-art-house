-- Autorização de reprodução: não repete o nome quando o nome civil é igual ao nome artístico.
create or replace function public._print_auth_body(t jsonb, p_artist uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare ap public.profiles; k public.kyc; lines text := ''; z jsonb;
begin
  select * into ap from public.profiles where id = p_artist;
  select * into k from public.kyc where user_id = p_artist;
  for z in select * from jsonb_array_elements(t->'sizes') loop
    lines := lines || format(E'- %s, %s (%s × %s cm): remuneração de %s por exemplar; preço ao comprador %s.\n',
      z->>'product_name', z->>'label', replace(z->>'w_cm', '.', ','), replace(z->>'h_cm', '.', ','),
      public._brl_cents((z->>'artist_fee')::bigint), public._brl_cents((z->>'price')::bigint));
  end loop;
  return format(E'# Autorização de reprodução\n\n'
    'Eu, %s, membro %s, autor(a) da obra **%s** (%s), registrada na rede PONCI sob o nº %s, autorizo a PONCI a produzir, '
    'por meio de gráficas homologadas, e a vender reproduções impressas dessa obra exclusivamente nas condições abaixo.\n\n'
    '## Condições\n\n'
    '- Edição: %s.\n'
    '- %s\n'
    '- Arquivo-mestre fornecido por mim: %s × %s px.\n\n'
    '## Papéis, tamanhos e valores\n\n%s\n'
    '## Compromissos\n\n'
    '1. A reprodução é feita sem cortes nem alterações da imagem; cada exemplar é vendido como reprodução, nunca como original.\n'
    '2. A produção de cada exemplar só começa depois do pagamento confirmado.\n'
    '3. Em edição limitada, a PONCI controla a numeração e não produz exemplares além da tiragem.\n'
    '4. Esta autorização não transfere direitos autorais: autorizo apenas estas reproduções, nestas condições. '
    'Qualquer mudança exige nova autorização; posso pausar a venda a qualquer momento, sem afetar exemplares já vendidos.\n'
    '5. A certificação da PONCI não substitui esta autorização nem a documentação dos direitos.\n',
    case when k.legal_name is null or lower(btrim(k.legal_name)) = lower(btrim(ap.display_name)) then ap.display_name
         else k.legal_name || ' (' || ap.display_name || ')' end, ap.member_code, t->'work'->>'title', t->'work'->>'year', t->'work'->>'no',
    case when t->>'edition' = 'limited' then format('limitada, tiragem máxima de %s exemplares somando todos os tamanhos', t->>'edition_max') else 'aberta, sem limite de exemplares' end,
    case when (t->>'signed')::boolean and (t->>'numbered')::boolean then 'Cada exemplar é assinado e numerado por mim antes do envio.'
         when (t->>'signed')::boolean then 'Cada exemplar é assinado por mim antes do envio.'
         else 'Exemplares sem assinatura, enviados direto da gráfica ao comprador.' end,
    t->'master'->>'w', t->'master'->>'h', lines);
end $$;

-- PONCI · dados de demonstração (convites, contas demo, obras, propostas, pedidos)
insert into public.invites(code, role, uses_left) values
  ('PONCI-ARTISTA-2026','artist',100),('PONCI-COLECAO-2026','buyer',100)
on conflict (code) do nothing;

create or replace function pg_temp.demo_user(p_email text, p_pass text, p_meta jsonb) returns uuid language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  select id into uid from auth.users where email = p_email;
  if uid is not null then return uid; end if;
  uid := gen_random_uuid();
  insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,
    created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
  values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',p_email,extensions.crypt(p_pass,extensions.gen_salt('bf')),now(),
    '{"provider":"email","providers":["email"]}',p_meta,now(),now(),'','','','');
  insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values(gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',p_email,'email_verified',true),'email',now(),now(),now());
  return uid;
end $$;

do $$
declare
  helena uuid; rafael uuid; iara uuid; caio uuid; lucia uuid; marina uuid; c112 uuid; c189 uuid; c203 uuid;
  rnd text := encode(extensions.gen_random_bytes(18),'base64');
  pid uuid;
begin
  helena := pg_temp.demo_user('helena@demo.ponci.art','ponci-demo-2026','{"invite_code":"PONCI-ARTISTA-2026","full_name":"Helena Vasques","city":"Salvador, BA","practice":"Pintura monocromática"}');
  rafael := pg_temp.demo_user('rafael@demo.ponci.art',rnd,'{"invite_code":"PONCI-ARTISTA-2026","full_name":"Rafael Toledo","city":"Belo Horizonte, MG","practice":"Matéria e superfície"}');
  iara   := pg_temp.demo_user('iara@demo.ponci.art',rnd,'{"invite_code":"PONCI-ARTISTA-2026","full_name":"Iara Monteiro","city":"São Paulo, SP","practice":"Geometria e edição"}');
  caio   := pg_temp.demo_user('caio@demo.ponci.art',rnd,'{"invite_code":"PONCI-ARTISTA-2026","full_name":"Caio Bernardes","city":"Curitiba, PR","practice":"Paisagem surreal"}');
  lucia  := pg_temp.demo_user('lucia@demo.ponci.art',rnd,'{"invite_code":"PONCI-ARTISTA-2026","full_name":"Lúcia Amaral","city":"Recife, PE","practice":"Gesto e papel"}');
  marina := pg_temp.demo_user('marina@demo.ponci.art','ponci-demo-2026','{"invite_code":"PONCI-COLECAO-2026","full_name":"Marina Alves","city":"São Paulo, SP"}');
  c112   := pg_temp.demo_user('col112@demo.ponci.art',rnd,'{"invite_code":"PONCI-COLECAO-2026","full_name":"Colecionador Demo RJ","city":"Rio de Janeiro, RJ"}');
  c189   := pg_temp.demo_user('col189@demo.ponci.art',rnd,'{"invite_code":"PONCI-COLECAO-2026","full_name":"Colecionador Demo RS","city":"Porto Alegre, RS"}');
  c203   := pg_temp.demo_user('col203@demo.ponci.art',rnd,'{"invite_code":"PONCI-COLECAO-2026","full_name":"Colecionador Demo DF","city":"Brasília, DF"}');

  update public.profiles set bio='Trabalha com campos de cor construídos em dezenas de camadas translúcidas. Interessa-se pelo tempo que o olho leva para ver.' where id=helena;

  if exists(select 1 from public.works) then return; end if;

  insert into public.works(slug,artist_id,title,year,cat,medium,h,w,edition,price,description,status,gen,created_at) values
  ('campo-de-anil-i',helena,'Campo de Anil I',2026,'painting','Óleo e pigmento de anil sobre linho',180,150,null,68000,
    array['Um único campo de anil construído com dezenas de camadas finas e translúcidas.','De perto, a superfície se separa em azuis quentes e frios; à distância, assenta-se em um plano silencioso, como o barrado de uma parede caiada visto ao entardecer.'],
    'published','{"g":"mono","seed":11,"p":["#2F3C57","#45577A","#1D263B"]}',now()-interval '60 days'),
  ('estudo-para-um-silencio',helena,'Estudo para um Silêncio',2026,'painting','Óleo sobre tela',120,100,null,42000,
    array['Duas faixas de vermelho sangue-de-boi separadas por um registro um pouco mais escuro.','A pintura trata da borda entre elas, e do tempo que o olhar leva para encontrá-la.'],
    'published','{"g":"mono","seed":37,"p":["#5A2A25","#7B3C33","#381916"]}',now()-interval '40 days'),
  ('campo-de-anil-ii',helena,'Campo de Anil II',2026,'painting','Óleo e terra verde sobre linho',160,130,null,61000,
    array['Segunda peça da série, agora em terra verde.'],'review','{"g":"mono","seed":212,"p":["#3E4A3A","#55654F","#262E24"]}',now()-interval '2 days'),
  ('barrado',helena,'Barrado',2025,'painting','Óleo sobre linho',90,120,null,36000,
    array['Uma faixa de cor à altura do olhar, como o barrado de uma parede.'],'sold','{"g":"mono","seed":303,"p":["#6B5A3E","#857152","#45392A"]}',now()-interval '120 days'),
  ('ocre-profundo',rafael,'Ocre Profundo',2025,'painting','Acrílica e pó de mármore sobre tela',200,160,null,74000,
    array['Pigmento ocre ligado a pó de mármore e arrastado sobre a tela com uma lâmina larga.','As cristas capturam a luz e a superfície muda ao longo do dia.'],
    'published','{"g":"tex","seed":23,"p":["#9A7542","#B8925A","#7A5A2E","#C9A877","#5E4626"]}',now()-interval '30 days'),
  ('sedimento',rafael,'Sedimento',2024,'mixed','Gesso e pigmento mineral sobre painel de madeira',90,90,null,29000,
    array['Gesso e pigmento mineral aplicados em estratos, lixados e reaplicados.','O painel registra o próprio processo como uma margem de rio registra as cheias.'],
    'published','{"g":"tex","seed":41,"p":["#D7D0C3","#BDB4A4","#E8E3D8","#8E8678","#A79D8C"]}',now()-interval '30 days'),
  ('arquitetura-do-intervalo',iara,'Arquitetura do Intervalo',2026,'painting','Acrílica sobre tela',150,150,null,55000,
    array['Um quadrado dividido por uma grade irregular, onde os planos de cor funcionam como cômodos e as linhas como paredes.','O círculo é o único elemento que recusa a estrutura.'],
    'published','{"g":"geo","seed":58,"p":["#E6E0D4","#1C1B19","#8B4A32","#B89A63","#4A5560"]}',now()-interval '30 days'),
  ('modulo-7',iara,'Módulo 7',2025,'edition','Serigrafia sobre papel de algodão',70,50,'Edição de 12 + 2 PA',9500,
    array['Sétima de uma série de serigrafias construídas sobre a mesma grade modular.','Cada exemplar da edição é impresso à mão em quatro cores sobre papel de algodão.'],
    'reserved','{"g":"geo","seed":64,"p":["#ECE7DD","#22211F","#2F3B52","#A7A196","#7A3A2C"]}',now()-interval '30 days'),
  ('linha-de-prumo',iara,'Linha de Prumo',2024,'paper','Guache sobre papel',56,42,null,14000,
    array['Um estudo de equilíbrio vertical, em guache.','A composição pende de uma única linha, como um fio de prumo em um canteiro de obras.'],
    'published','{"g":"geo","seed":77,"p":["#EFEBE3","#2A2926","#C7B48C","#8C8F86","#5C3A2E"]}',now()-interval '30 days'),
  ('a-espera-do-meio-dia',caio,'A Espera do Meio-Dia',2026,'painting','Óleo sobre linho',140,110,null,58000,
    array['Uma esfera suspensa sobre uma planície vazia na hora em que as sombras deveriam ser mais curtas.','Aqui a sombra é longa, como se a luz viesse de outro tempo.'],
    'published','{"g":"sur","v":"sphere","seed":83,"p":["#A9A397","#E2D8C4","#C4A57C","#8A6A47","#A85A3C","#2B2420"]}',now()-interval '30 days'),
  ('porta-para-o-mar-seco',caio,'Porta para o Mar Seco',2025,'painting','Óleo sobre tela',100,130,null,49000,
    array['Uma parede solta em uma paisagem seca se abre para um mar que não está lá.','A pintura trata o horizonte como memória, e não como lugar.'],
    'published','{"g":"sur","v":"door","seed":91,"p":["#8C949B","#D9D3C5","#C9B08A","#957652","#E2DCD0","#2E3A49"]}',now()-interval '30 days'),
  ('gesto-n3',lucia,'Gesto Nº 3',2026,'painting','Óleo e carvão sobre tela',210,170,null,88000,
    array['Grandes pinceladas de óleo e carvão, cada uma feita em um único movimento do braço.','Cada correção permanece visível, e assim a imagem é também um registro de decisões.'],
    'published','{"g":"gest","seed":7,"p":["#E7E1D4","#1E1D1B","#6E2F2A","#B08A4E","#3E4A57","#1E1D1B","#8B7562"]}',now()-interval '30 days'),
  ('ruina-domestica',rafael,'Ruína Doméstica',2025,'mixed','Papel, linha e grafite sobre placa',80,60,null,24000,
    array['Fragmentos de papel, linha de costura e anotações em grafite dispostos sobre placa.','A colagem reconstrói uma casa a partir do que costuma ser descartado.'],
    'published','{"g":"mix","seed":105,"p":["#B19878","#EDE7DA","#D5CEC0","#C9BFAE","#2A2926","#7A3329"]}',now()-interval '30 days'),
  ('rumor',lucia,'Rumor',2024,'paper','Nanquim e pigmento de terra sobre papel de algodão',76,56,null,16500,
    array['Nanquim e pigmento de terra sobre papel de algodão, trabalhados rapidamente com a folha ainda úmida.','As marcas ultrapassam as próprias bordas, como algo dito e repetido.'],
    'published','{"g":"gest","seed":129,"p":["#EDE8DE","#2A2926","#8B7562","#A35A3C","#2A2926"]}',now()-interval '30 days');

  insert into public.proposals(work_id,buyer_id,status,created_at) select id,c189,'open',now()-interval '3 days' from public.works where slug='campo-de-anil-i' returning id into pid;
  insert into public.proposal_events(proposal_id,actor,kind,amount,msg,created_at) values(pid,'buyer','offer',60000,'Acompanho a série desde a primeira exposição. A obra iria para uma parede de pé-direito duplo, com luz do norte.',now()-interval '3 days');

  insert into public.proposals(work_id,buyer_id,status,created_at) select id,marina,'open',now()-interval '1 day' from public.works where slug='estudo-para-um-silencio' returning id into pid;
  insert into public.proposal_events(proposal_id,actor,kind,amount,msg,created_at) values(pid,'buyer','offer',38000,'Gostaria de ver a obra pessoalmente antes de fechar. Proposta inicial.',now()-interval '1 day');

  insert into public.proposals(work_id,buyer_id,status,created_at) select id,c203,'declined',now()-interval '18 days' from public.works where slug='campo-de-anil-i' returning id into pid;
  insert into public.proposal_events(proposal_id,actor,kind,amount,msg,created_at) values
    (pid,'buyer','offer',45000,'',now()-interval '18 days'),(pid,'artist','decline',null,'Obrigada pelo interesse, mas o valor está distante do preço da obra.',now()-interval '17 days');

  insert into public.proposals(work_id,buyer_id,status,created_at) select id,marina,'countered',now()-interval '6 days' from public.works where slug='a-espera-do-meio-dia' returning id into pid;
  insert into public.proposal_events(proposal_id,actor,kind,amount,msg,created_at) values
    (pid,'buyer','offer',50000,'Obra muito bonita. Consegue considerar este valor?',now()-interval '6 days'),
    (pid,'artist','counter',55000,'Posso chegar a este valor, incluindo a moldura em caixa de freijó.',now()-interval '5 days');

  insert into public.orders(work_id,buyer_id,amount,via,stage,created_at) select id,marina,9500,'direct',1,now()-interval '9 days' from public.works where slug='modulo-7';
  insert into public.orders(work_id,buyer_id,amount,via,stage,created_at) select id,c112,34000,'proposal',3,now()-interval '80 days' from public.works where slug='barrado';

  insert into public.favorites(buyer_id,work_id) select marina,id from public.works where slug in ('a-espera-do-meio-dia','ocre-profundo','gesto-n3');
end $$;

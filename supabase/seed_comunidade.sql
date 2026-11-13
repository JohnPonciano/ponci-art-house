-- Semente da Comunidade (contas de demonstração): cenas de ateliê geradas a partir das obras reais de cada artista,
-- publicações de colecionadores, comentários e curtidas. Idempotente: não roda de novo se a primeira publicação já existir.
do $$
declare
  helena uuid; rafael uuid; iara uuid; lucia uuid; caio uuid; marina uuid; rio uuid; poa uuid; bsb uuid;
  p uuid; g jsonb;
  function_dummy int;
begin
  if exists(select 1 from public.posts where body like 'Terceira semana no Campo de Anil II%') then return; end if;
  select id into helena from public.profiles where member_code='ART-0100';
  select id into rafael from public.profiles where member_code='ART-0101';
  select id into iara   from public.profiles where member_code='ART-0102';
  select id into caio   from public.profiles where member_code='ART-0103';
  select id into lucia  from public.profiles where member_code='ART-0104';
  select id into marina from public.profiles where member_code='COL-0105';
  select id into rio    from public.profiles where member_code='COL-0106';
  select id into poa    from public.profiles where member_code='COL-0107';
  select id into bsb    from public.profiles where member_code='COL-0108';

  create temp table _s(n int, author uuid, topic text, body text, ago interval, scene jsonb, w int, h int, work text) on commit drop;
  insert into _s values
  (1, helena,'processo','Terceira semana no Campo de Anil II. São mais de quarenta camadas finas, e cada uma pede dois dias de secagem antes da próxima. A parte de baixo ainda é só desenho.', '5 hours',
     '{"kind":"cavalete","who":0,"part":0.55,"art":{"g":"mono","p":["#3E4A3A","#55654F","#262E24"],"seed":212,"h":160,"w":130}}',1000,800,null),
  (2, lucia,'processo','Nanquim, terra e papel de algodão de 640 g. A mesa antes de começar o Gesto Nº 4: quero manter a mesma energia do 3, mas com mais vazio.', '9 hours',
     '{"kind":"mesa","art":{"g":"gest","p":["#E7E1D4","#1E1D1B","#6E2F2A","#B08A4E","#3E4A57","#1E1D1B","#8B7562"],"seed":7,"h":210,"w":170}}',1000,800,null),
  (3, rafael,'processo','Pó de mármore, acrílica e muita paciência. Ocre Profundo pronto para sair do ateliê: a superfície só aparece com luz rasante, então fotografei com a janela aberta.', '1 day 3 hours',
     '{"kind":"parede","who":5,"art":{"g":"tex","p":["#9A7542","#B8925A","#7A5A2E","#C9A877","#5E4626"],"seed":23,"h":200,"w":160}}',800,1000,'Ocre Profundo'),
  (4, caio,'processo','Porta para o Mar Seco ganhou uma sombra nova hoje. A paisagem é inventada, mas a luz é a do meio-dia de Curitiba em janeiro.', '1 day 20 hours',
     '{"kind":"cavalete","who":1,"part":0.8,"art":{"g":"sur","p":["#8C949B","#D9D3C5","#C9B08A","#957652","#E2DCD0","#2E3A49"],"v":"door","seed":91,"h":100,"w":130}}',1000,800,'Porta para o Mar Seco'),
  (5, marina,'colecao','A Espera do Meio-Dia chegou e finalmente achei a parede certa: luz indireta da tarde, nada de sol direto. Obrigada, Caio, e obrigada à PONCI pelo cuidado na entrega.', '2 days 2 hours',
     '{"kind":"casa","who":3,"sofa":"#5E5850","art":{"g":"sur","p":["#A9A397","#E2D8C4","#C4A57C","#8A6A47","#A85A3C","#2B2420"],"v":"sphere","seed":83,"h":140,"w":110}}',1000,800,null),
  (6, iara,'exposicoes','Abertura no sábado, às 16h, no Galpão Lapa (São Paulo). Três peças da série Intervalo conversando com a estrutura do espaço. Para membros da PONCI, visita guiada comigo às 15h.', '2 days 8 hours',
     '{"kind":"galeria","who":2,"people":3,"arts":[{"g":"geo","p":["#E6E0D4","#1C1B19","#8B4A32","#B89A63","#4A5560"],"seed":58,"h":150,"w":150},{"g":"geo","p":["#ECE7DD","#22211F","#2F3B52","#A7A196","#7A3A2C"],"seed":64,"h":70,"w":50},{"g":"geo","p":["#EFEBE3","#2A2926","#C7B48C","#8C8F86","#5C3A2E"],"seed":77,"h":56,"w":42}]}',1000,800,null),
  (7, rio,'mercado','Pergunta para os artistas: qual a distância segura de uma janela para pendurar pintura a óleo? Moro de frente para o mar e tenho medo da maresia no Barrado.', '3 days 1 hour', null,0,0,null),
  (8, helena,'geral','Ateliê em Salvador, fim de tarde. A luz entra pela janela lateral e o azul do Campo de Anil I muda de temperatura a cada hora. Gosto de passar um tempo só olhando antes de decidir a próxima camada.', '3 days 22 hours',
     '{"kind":"parede","who":0,"art":{"g":"mono","p":["#2F3C57","#45577A","#1D263B"],"seed":11,"h":180,"w":150}}',800,1000,'Campo de Anil I'),
  (9, bsb,'geral','Visitei o ateliê da Lúcia em Recife na semana passada. Ver os gestos em tamanho real muda tudo: o Gesto Nº 3 tem mais de dois metros e você sente o movimento do braço.', '4 days 5 hours',
     '{"kind":"parede","who":4,"art":{"g":"gest","p":["#E7E1D4","#1E1D1B","#6E2F2A","#B08A4E","#3E4A57","#1E1D1B","#8B7562"],"seed":7,"h":210,"w":170}}',800,1000,null),
  (10, lucia,'geral','Rumor, com escala. É bem menor do que parece nas fotos: 76 × 56 cm, nanquim e terra sobre papel de algodão.', '5 days 2 hours',
     '{"kind":"parede","who":3,"art":{"g":"gest","p":["#EDE8DE","#2A2926","#8B7562","#A35A3C","#2A2926"],"seed":129,"h":76,"w":56}}',800,1000,'Rumor'),
  (11, rafael,'processo','Sedimento terminado e assinado. 90 × 90, gesso e pigmento mineral sobre madeira. Foram onze camadas lixadas uma a uma.', '6 days 4 hours',
     '{"kind":"mesa","art":{"g":"tex","p":["#D7D0C3","#BDB4A4","#E8E3D8","#8E8678","#A79D8C"],"seed":41,"h":90,"w":90}}',1000,800,'Sedimento'),
  (12, iara,'processo','Malha a lápis antes de qualquer cor. Na geometria o erro aparece no milímetro, então a Linha de Prumo levou mais tempo no desenho do que na tinta.', '7 days 6 hours',
     '{"kind":"cavalete","who":3,"part":0.35,"art":{"g":"geo","p":["#EFEBE3","#2A2926","#C7B48C","#8C8F86","#5C3A2E"],"seed":77,"h":56,"w":42}}',1000,800,'Linha de Prumo'),
  (13, poa,'exposicoes','Alguém mais vai à Bienal do Mercosul este ano? Topo combinar uma visita em grupo com quem for de Porto Alegre.', '8 days 3 hours', null,0,0,null),
  (14, caio,'exposicoes','Duas obras minhas na coletiva Horizonte Interno, em Curitiba, até 20 de dezembro. A Espera do Meio-Dia foi emprestada pela colecionadora especialmente para a mostra.', '9 days 5 hours',
     '{"kind":"galeria","who":1,"people":2,"arts":[{"g":"sur","p":["#8C949B","#D9D3C5","#C9B08A","#957652","#E2DCD0","#2E3A49"],"v":"door","seed":91,"h":100,"w":130},{"g":"sur","p":["#A9A397","#E2D8C4","#C4A57C","#8A6A47","#A85A3C","#2B2420"],"v":"sphere","seed":83,"h":140,"w":110}]}',1000,800,null);

  create temp table _p(n int, id uuid) on commit drop;
  for function_dummy in select n from _s order by n loop
    insert into public.posts(artist_id, kind, topic, body, created_at, work_id, removed_reason)
      select s.author, 'post', s.topic, s.body, now() - s.ago,
        (select w.id from public.works w where w.title = s.work and w.artist_id = s.author), ''
      from _s s where s.n = function_dummy returning id into p;
    insert into _p values (function_dummy, p);
    select scene into g from _s where n = function_dummy;
    if g is not null then
      insert into public.post_media(post_id, position, gen, w, h)
        select p, 0, jsonb_build_object('g','cena','seed', 100 + function_dummy, 'v', g), s.w, s.h from _s s where s.n = function_dummy;
    end if;
  end loop;

  -- comentários (alguns com resposta)
  insert into public.post_comments(post_id, author_id, body, created_at, parent_id)
  select (select id from _p where n=c.n), c.a, c.b, now() - c.ago, null from (values
    (1, marina, 'Que paciência! Dá para ver as camadas de perto em alguma visita?', interval '3 hours'),
    (1, iara, 'O verde dessa série está lindo, Helena.', interval '2 hours'),
    (3, rio, 'A foto com luz rasante faz toda a diferença. Dá vontade de passar a mão.', interval '1 day'),
    (5, caio, 'Que alegria ver a obra em casa! A luz da tarde é exatamente a que imaginei para ela.', interval '2 days'),
    (5, bsb, 'Que sala bonita! Combinou demais com o sofá.', interval '1 day 20 hours'),
    (6, marina, 'Estarei lá às 15h!', interval '2 days 4 hours'),
    (6, poa, 'Uma pena estar longe. Vai ter registro em vídeo?', interval '2 days 1 hour'),
    (7, helena, 'Regra que eu uso: nunca na parede que recebe sol direto e pelo menos um metro e meio da janela. Com maresia, o verniz final ajuda muito. Posso te mandar a ficha técnica do Barrado.', interval '3 days'),
    (7, rafael, 'Também evitaria parede externa, que esquenta e esfria demais. Um desumidificador simples já resolve muito.', interval '2 days 22 hours'),
    (9, lucia, 'Foi um prazer receber você! Volte quando o Nº 4 estiver pronto.', interval '4 days'),
    (13, marina, 'Eu vou! Posso me juntar ao grupo mesmo sendo de São Paulo.', interval '8 days')
  ) as c(n, a, b, ago);
  insert into public.post_comments(post_id, author_id, body, created_at, parent_id)
  select (select id from _p where n=r.n), r.a, r.b, now() - r.ago,
    (select pc.id from public.post_comments pc where pc.post_id = (select id from _p where n=r.n) and pc.author_id = r.to_author and pc.parent_id is null limit 1)
  from (values
    (1, helena, marina, 'Claro! Me chama pela PONCI e marcamos.', interval '1 hour'),
    (7, rio, helena, 'Ajuda muito, obrigado! Vou mudar de parede.', interval '2 days 20 hours'),
    (6, iara, poa, 'Vai sim, eu posto aqui depois.', interval '1 day 22 hours')
  ) as r(n, a, to_author, b, ago);

  -- curtidas
  insert into public.post_likes(member_id, post_id, created_at)
  select m, (select id from _p where n=x.n), now() - x.ago from (values
    (1,'5 hours'::interval),(2,'8 hours'),(3,'1 day'),(4,'1 day 18 hours'),(5,'2 days'),(6,'2 days 6 hours'),(7,'3 days'),(8,'3 days 20 hours'),(9,'4 days'),(10,'5 days'),(11,'6 days'),(12,'7 days'),(13,'8 days'),(14,'9 days')) x(n, ago),
  lateral (select unnest(array[helena,rafael,iara,lucia,caio,marina,rio,poa,bsb]) m) mm
  where m <> (select author from _s where n=x.n) and (abs(hashtext(m::text || x.n::text)) % 3) <> 0
  on conflict do nothing;

end $$;

-- Documentos legais · nova versão (23/11/2026): envio pelo artista (frete incluso ou à parte) e proteção contra uso das obras para treino de IA.
-- Publica como a tela Documentos do admin: nova versão de cada um, com o hash calculado pelo banco. As versões antigas continuam guardadas.
-- Atenção: com versão nova, os membros precisam aceitar os documentos de novo antes de negociar.

insert into public.legal_documents(slug, version, title, summary, body)
select 'contrato-artista', coalesce(max(version), 0) + 1, 'Contrato de Intermediação — Artista', 'Mandato para a PONCI intermediar a venda das suas obras, comissão, repasse, autenticidade, entrega e direitos autorais.', $doc$> **Minuta para revisão jurídica.** Os campos entre colchetes devem ser preenchidos antes da publicação definitiva.

**INTERMEDIADORA:** **[RAZÃO SOCIAL]**, CNPJ **[CNPJ]**, com sede em **[ENDEREÇO]** ("PONCI").

**ARTISTA:** a pessoa física ou jurídica identificada no cadastro da plataforma que aceita eletronicamente este contrato.

## 1. Objeto

1.1. O ARTISTA contrata a PONCI para, em caráter **não exclusivo**, intermediar a venda das obras que cadastrar e que forem aprovadas pela curadoria, apresentando-as aos colecionadores membros da rede.

1.2. O ARTISTA outorga à PONCI **mandato** para, em seu nome: (a) aceitar reservas feitas pelo **preço de tabela** que ele próprio fixou para a obra; (b) emitir o instrumento particular de compra e venda de cada obra; e (c) coordenar a custódia do pagamento, acompanhar a entrega e emitir o certificado. Propostas abaixo do preço de tabela dependem sempre do aceite do ARTISTA.

## 2. Declarações do ARTISTA

2.1. O ARTISTA declara, para cada obra cadastrada, que: (a) é o autor ou detém poderes para vendê-la; (b) a obra é original e autêntica, ou que a edição é indicada corretamente e, quando se tratar de reprodução (impressão, fine art, pôster), que ela está marcada como tal na plataforma; (c) a obra está livre de ônus, penhora ou disputa; (d) as informações de técnica, dimensões, ano, edição e estado de conservação são verdadeiras.

2.2. O ARTISTA responde perante o COMPRADOR e a PONCI por evicção, vícios e pela falta de veracidade dessas declarações.

## 3. Preço, comissão e repasse

3.1. O preço de cada obra é definido pelo ARTISTA e pode ser alterado enquanto a obra não estiver reservada.

3.2. Pela intermediação, o ARTISTA paga à PONCI **comissão de 15% (quinze por cento)** sobre o preço efetivo de venda, retida no repasse.

3.3. O repasse do valor líquido é feito em até **7 (sete) dias** após a confirmação de entrega e o término do prazo de arrependimento do COMPRADOR, quando aplicável, na conta indicada pelo ARTISTA em seu cadastro.

3.4. Em caso de arrependimento ou devolução justificada, nenhum valor é devido entre as partes, e a obra retorna ao ARTISTA.

## 4. Exclusividade sobre obras reservadas e não-circunvenção

4.1. A partir da reserva, a obra fica exclusivamente vinculada à negociação em curso e não pode ser vendida por outro canal.

4.2. Por **12 (doze) meses** contados do último contato pela rede, o ARTISTA não venderá diretamente, fora da plataforma, obras a colecionadores que conheceu por meio da PONCI. Se o fizer, deve à PONCI a comissão que seria devida.

## 5. Entrega

5.1. O ARTISTA embala a obra de forma adequada e a despacha, **com seguro pelo valor da obra**, em até **5 (cinco) dias úteis** após a confirmação do pagamento em custódia, informando na plataforma a transportadora e o código de rastreio. O Guia de Envio da PONCI traz as orientações de embalagem.

5.2. O risco sobre a obra é do ARTISTA até a entrega e passa ao COMPRADOR no recebimento, nos termos do instrumento de cada venda.

5.3. Em cada obra, o ARTISTA escolhe se o frete está **incluso no preço**, caso em que o custo do envio é seu, ou se é **pago pelo COMPRADOR**, informado antes do pagamento.

## 6. Direitos autorais

6.1. O ARTISTA mantém todos os direitos autorais sobre suas obras.

6.2. O ARTISTA concede à PONCI licença gratuita e não exclusiva, válida enquanto durar este contrato e para as vendas realizadas, para reproduzir imagens e textos das obras **dentro da rede** e em comunicações institucionais da PONCI, sempre com o crédito de autoria.

6.3. A licença do item 6.2 **não inclui** o uso das obras para treinar, ajustar ou alimentar sistemas de inteligência artificial, nem a cessão ou o licenciamento a terceiros para esse fim.

6.3. O ARTISTA tem ciência do direito de sequência (art. 38 da Lei 9.610/98) nas revendas de suas obras.

## 7. Certificado de procedência

7.1. Cada venda gera um certificado numerado, emitido pela PONCI com base nas declarações do ARTISTA, registrando obra, autoria, data e partes.

## 8. Tributos

8.1. Cada parte responde pelos tributos incidentes sobre sua atividade. A PONCI emite nota fiscal de serviço sobre a comissão. O ARTISTA é responsável pela tributação e eventual emissão de documento fiscal referente à venda da obra.

## 9. Dados pessoais

9.1. Os dados do ARTISTA são tratados conforme a Política de Privacidade. O ARTISTA se compromete a usar os dados de colecionadores a que tiver acesso exclusivamente para concluir a venda correspondente.

## 10. Vigência e rescisão

10.1. Este contrato vigora por prazo indeterminado e pode ser rescindido por qualquer das partes com **30 (trinta) dias** de aviso pela plataforma. As vendas já reservadas e as obrigações de não-circunvenção permanecem válidas.

## 11. Assinatura eletrônica e foro

11.1. Este contrato é aceito eletronicamente na plataforma, com registro de data, hora, IP, navegador e hash do documento, o que as partes reconhecem como válido (Lei 14.063/2020).

11.2. Fica eleito o foro da comarca de **[CIDADE/UF]**.
$doc$
from public.legal_documents where slug = 'contrato-artista'
having not exists(select 1 from public.current_documents() c where c.slug = 'contrato-artista' and c.body = $doc$> **Minuta para revisão jurídica.** Os campos entre colchetes devem ser preenchidos antes da publicação definitiva.

**INTERMEDIADORA:** **[RAZÃO SOCIAL]**, CNPJ **[CNPJ]**, com sede em **[ENDEREÇO]** ("PONCI").

**ARTISTA:** a pessoa física ou jurídica identificada no cadastro da plataforma que aceita eletronicamente este contrato.

## 1. Objeto

1.1. O ARTISTA contrata a PONCI para, em caráter **não exclusivo**, intermediar a venda das obras que cadastrar e que forem aprovadas pela curadoria, apresentando-as aos colecionadores membros da rede.

1.2. O ARTISTA outorga à PONCI **mandato** para, em seu nome: (a) aceitar reservas feitas pelo **preço de tabela** que ele próprio fixou para a obra; (b) emitir o instrumento particular de compra e venda de cada obra; e (c) coordenar a custódia do pagamento, acompanhar a entrega e emitir o certificado. Propostas abaixo do preço de tabela dependem sempre do aceite do ARTISTA.

## 2. Declarações do ARTISTA

2.1. O ARTISTA declara, para cada obra cadastrada, que: (a) é o autor ou detém poderes para vendê-la; (b) a obra é original e autêntica, ou que a edição é indicada corretamente e, quando se tratar de reprodução (impressão, fine art, pôster), que ela está marcada como tal na plataforma; (c) a obra está livre de ônus, penhora ou disputa; (d) as informações de técnica, dimensões, ano, edição e estado de conservação são verdadeiras.

2.2. O ARTISTA responde perante o COMPRADOR e a PONCI por evicção, vícios e pela falta de veracidade dessas declarações.

## 3. Preço, comissão e repasse

3.1. O preço de cada obra é definido pelo ARTISTA e pode ser alterado enquanto a obra não estiver reservada.

3.2. Pela intermediação, o ARTISTA paga à PONCI **comissão de 15% (quinze por cento)** sobre o preço efetivo de venda, retida no repasse.

3.3. O repasse do valor líquido é feito em até **7 (sete) dias** após a confirmação de entrega e o término do prazo de arrependimento do COMPRADOR, quando aplicável, na conta indicada pelo ARTISTA em seu cadastro.

3.4. Em caso de arrependimento ou devolução justificada, nenhum valor é devido entre as partes, e a obra retorna ao ARTISTA.

## 4. Exclusividade sobre obras reservadas e não-circunvenção

4.1. A partir da reserva, a obra fica exclusivamente vinculada à negociação em curso e não pode ser vendida por outro canal.

4.2. Por **12 (doze) meses** contados do último contato pela rede, o ARTISTA não venderá diretamente, fora da plataforma, obras a colecionadores que conheceu por meio da PONCI. Se o fizer, deve à PONCI a comissão que seria devida.

## 5. Entrega

5.1. O ARTISTA embala a obra de forma adequada e a despacha, **com seguro pelo valor da obra**, em até **5 (cinco) dias úteis** após a confirmação do pagamento em custódia, informando na plataforma a transportadora e o código de rastreio. O Guia de Envio da PONCI traz as orientações de embalagem.

5.2. O risco sobre a obra é do ARTISTA até a entrega e passa ao COMPRADOR no recebimento, nos termos do instrumento de cada venda.

5.3. Em cada obra, o ARTISTA escolhe se o frete está **incluso no preço**, caso em que o custo do envio é seu, ou se é **pago pelo COMPRADOR**, informado antes do pagamento.

## 6. Direitos autorais

6.1. O ARTISTA mantém todos os direitos autorais sobre suas obras.

6.2. O ARTISTA concede à PONCI licença gratuita e não exclusiva, válida enquanto durar este contrato e para as vendas realizadas, para reproduzir imagens e textos das obras **dentro da rede** e em comunicações institucionais da PONCI, sempre com o crédito de autoria.

6.3. A licença do item 6.2 **não inclui** o uso das obras para treinar, ajustar ou alimentar sistemas de inteligência artificial, nem a cessão ou o licenciamento a terceiros para esse fim.

6.3. O ARTISTA tem ciência do direito de sequência (art. 38 da Lei 9.610/98) nas revendas de suas obras.

## 7. Certificado de procedência

7.1. Cada venda gera um certificado numerado, emitido pela PONCI com base nas declarações do ARTISTA, registrando obra, autoria, data e partes.

## 8. Tributos

8.1. Cada parte responde pelos tributos incidentes sobre sua atividade. A PONCI emite nota fiscal de serviço sobre a comissão. O ARTISTA é responsável pela tributação e eventual emissão de documento fiscal referente à venda da obra.

## 9. Dados pessoais

9.1. Os dados do ARTISTA são tratados conforme a Política de Privacidade. O ARTISTA se compromete a usar os dados de colecionadores a que tiver acesso exclusivamente para concluir a venda correspondente.

## 10. Vigência e rescisão

10.1. Este contrato vigora por prazo indeterminado e pode ser rescindido por qualquer das partes com **30 (trinta) dias** de aviso pela plataforma. As vendas já reservadas e as obrigações de não-circunvenção permanecem válidas.

## 11. Assinatura eletrônica e foro

11.1. Este contrato é aceito eletronicamente na plataforma, com registro de data, hora, IP, navegador e hash do documento, o que as partes reconhecem como válido (Lei 14.063/2020).

11.2. Fica eleito o foro da comarca de **[CIDADE/UF]**.
$doc$);

insert into public.legal_documents(slug, version, title, summary, body)
select 'contrato-colecionador', coalesce(max(version), 0) + 1, 'Condições Gerais de Compra — Colecionador', 'Como funcionam reserva, proposta, contrato por obra, pagamento em custódia, entrega, arrependimento e autenticidade.', $doc$> **Minuta para revisão jurídica.** Os campos entre colchetes devem ser preenchidos antes da publicação definitiva.

**INTERMEDIADORA:** **[RAZÃO SOCIAL]**, CNPJ **[CNPJ]** ("PONCI").

**COLECIONADOR:** a pessoa física ou jurídica identificada no cadastro da plataforma que aceita eletronicamente estas condições.

## 1. Papel das partes

1.1. As obras são vendidas pelos próprios artistas. A PONCI atua como intermediadora, nos termos dos Termos de Uso.

## 2. Reserva e proposta

2.1. **Reserva pelo preço:** ao reservar, o COLECIONADOR manifesta intenção firme de comprar a obra pelo preço indicado. A obra sai da vitrine.

2.2. **Proposta:** o COLECIONADOR pode oferecer outro valor. A proposta vale até ser respondida pelo artista ou retirada pelo COLECIONADOR. Se o artista aceitar, a compra se forma pelo valor proposto. O artista também pode responder com uma contraproposta, que o COLECIONADOR pode aceitar ou recusar.

2.3. A cada reserva ou aceite é gerado um **instrumento particular de compra e venda** da obra, que o COLECIONADOR assina eletronicamente na plataforma.

## 3. Pagamento

3.1. O pagamento é feito por meio de **instituição de pagamento parceira**, que mantém o valor em **custódia**. O valor só é liberado ao artista depois da entrega e do fim do prazo de arrependimento.

3.2. O envio é feito pelo artista, com seguro pelo valor da obra. O frete pode estar **incluso no preço** da obra ou ser **pago pelo COLECIONADOR**, e é sempre informado antes do pagamento.

3.3. Se o pagamento não for concluído em **48 (quarenta e oito) horas** após a assinatura do instrumento, a reserva pode ser cancelada e a obra volta à vitrine.

## 4. Entrega e inspeção

4.1. A obra é embalada e despachada pelo artista, com seguro e código de rastreio, para o endereço do cadastro ou outro informado pelo COLECIONADOR. A PONCI acompanha a entrega.

4.2. O COLECIONADOR deve inspecionar a obra no recebimento e registrar qualquer avaria pela plataforma em até **48 horas**.

## 5. Direito de arrependimento

5.1. O COLECIONADOR consumidor pode desistir da compra em até **7 (sete) dias** contados do recebimento (art. 49 do CDC), solicitando pela plataforma. A obra deve ser devolvida nas mesmas condições, na embalagem original, e o valor pago é restituído.

## 6. Autenticidade e procedência

6.1. Cada obra acompanha **certificado de procedência** numerado, emitido pela PONCI com base nas declarações do artista, que responde pela autoria e autenticidade.

6.2. Constatada falta de autenticidade ou divergência relevante em relação ao anunciado, o COLECIONADOR tem direito à devolução integral do valor, sem prejuízo de outros direitos legais.

## 7. Direitos autorais e revenda

7.1. A compra transfere a propriedade do suporte físico da obra, **não os direitos patrimoniais de autor**, que continuam com o artista (art. 37 da Lei 9.610/98). Reproduções da obra dependem de autorização do autor.

7.2. Em revendas futuras, o autor tem direito a, no mínimo, 5% sobre o aumento de preço verificado (direito de sequência, art. 38 da Lei 9.610/98).

## 8. Identificação e prevenção à lavagem de dinheiro

8.1. O COLECIONADOR deve manter seu cadastro de identificação completo e verdadeiro. Operações podem exigir documentos adicionais e são registradas e comunicadas às autoridades conforme a Lei 9.613/98 e a regulamentação do IPHAN.

## 9. Confidencialidade e dados

9.1. Durante a negociação, o COLECIONADOR é identificado ao artista apenas pelo código de membro e pela cidade. Seus dados são tratados conforme a Política de Privacidade.

## 10. Assinatura eletrônica e foro

10.1. Estas condições e cada instrumento de compra são aceitos e assinados eletronicamente, com registro de data, hora, IP, navegador e hash do documento (Lei 14.063/2020).

10.2. Fica eleito o foro da comarca de **[CIDADE/UF]**, ressalvado o direito do consumidor de demandar no foro de seu domicílio.
$doc$
from public.legal_documents where slug = 'contrato-colecionador'
having not exists(select 1 from public.current_documents() c where c.slug = 'contrato-colecionador' and c.body = $doc$> **Minuta para revisão jurídica.** Os campos entre colchetes devem ser preenchidos antes da publicação definitiva.

**INTERMEDIADORA:** **[RAZÃO SOCIAL]**, CNPJ **[CNPJ]** ("PONCI").

**COLECIONADOR:** a pessoa física ou jurídica identificada no cadastro da plataforma que aceita eletronicamente estas condições.

## 1. Papel das partes

1.1. As obras são vendidas pelos próprios artistas. A PONCI atua como intermediadora, nos termos dos Termos de Uso.

## 2. Reserva e proposta

2.1. **Reserva pelo preço:** ao reservar, o COLECIONADOR manifesta intenção firme de comprar a obra pelo preço indicado. A obra sai da vitrine.

2.2. **Proposta:** o COLECIONADOR pode oferecer outro valor. A proposta vale até ser respondida pelo artista ou retirada pelo COLECIONADOR. Se o artista aceitar, a compra se forma pelo valor proposto. O artista também pode responder com uma contraproposta, que o COLECIONADOR pode aceitar ou recusar.

2.3. A cada reserva ou aceite é gerado um **instrumento particular de compra e venda** da obra, que o COLECIONADOR assina eletronicamente na plataforma.

## 3. Pagamento

3.1. O pagamento é feito por meio de **instituição de pagamento parceira**, que mantém o valor em **custódia**. O valor só é liberado ao artista depois da entrega e do fim do prazo de arrependimento.

3.2. O envio é feito pelo artista, com seguro pelo valor da obra. O frete pode estar **incluso no preço** da obra ou ser **pago pelo COLECIONADOR**, e é sempre informado antes do pagamento.

3.3. Se o pagamento não for concluído em **48 (quarenta e oito) horas** após a assinatura do instrumento, a reserva pode ser cancelada e a obra volta à vitrine.

## 4. Entrega e inspeção

4.1. A obra é embalada e despachada pelo artista, com seguro e código de rastreio, para o endereço do cadastro ou outro informado pelo COLECIONADOR. A PONCI acompanha a entrega.

4.2. O COLECIONADOR deve inspecionar a obra no recebimento e registrar qualquer avaria pela plataforma em até **48 horas**.

## 5. Direito de arrependimento

5.1. O COLECIONADOR consumidor pode desistir da compra em até **7 (sete) dias** contados do recebimento (art. 49 do CDC), solicitando pela plataforma. A obra deve ser devolvida nas mesmas condições, na embalagem original, e o valor pago é restituído.

## 6. Autenticidade e procedência

6.1. Cada obra acompanha **certificado de procedência** numerado, emitido pela PONCI com base nas declarações do artista, que responde pela autoria e autenticidade.

6.2. Constatada falta de autenticidade ou divergência relevante em relação ao anunciado, o COLECIONADOR tem direito à devolução integral do valor, sem prejuízo de outros direitos legais.

## 7. Direitos autorais e revenda

7.1. A compra transfere a propriedade do suporte físico da obra, **não os direitos patrimoniais de autor**, que continuam com o artista (art. 37 da Lei 9.610/98). Reproduções da obra dependem de autorização do autor.

7.2. Em revendas futuras, o autor tem direito a, no mínimo, 5% sobre o aumento de preço verificado (direito de sequência, art. 38 da Lei 9.610/98).

## 8. Identificação e prevenção à lavagem de dinheiro

8.1. O COLECIONADOR deve manter seu cadastro de identificação completo e verdadeiro. Operações podem exigir documentos adicionais e são registradas e comunicadas às autoridades conforme a Lei 9.613/98 e a regulamentação do IPHAN.

## 9. Confidencialidade e dados

9.1. Durante a negociação, o COLECIONADOR é identificado ao artista apenas pelo código de membro e pela cidade. Seus dados são tratados conforme a Política de Privacidade.

## 10. Assinatura eletrônica e foro

10.1. Estas condições e cada instrumento de compra são aceitos e assinados eletronicamente, com registro de data, hora, IP, navegador e hash do documento (Lei 14.063/2020).

10.2. Fica eleito o foro da comarca de **[CIDADE/UF]**, ressalvado o direito do consumidor de demandar no foro de seu domicílio.
$doc$);

insert into public.legal_documents(slug, version, title, summary, body)
select 'termos', coalesce(max(version), 0) + 1, 'Termos de Uso da Rede PONCI', 'Regras de acesso, conduta, negociação, responsabilidades e papel da PONCI como intermediadora.', $doc$> **Minuta para revisão jurídica.** Os campos entre colchetes devem ser preenchidos antes da publicação definitiva.

## 1. Quem somos e qual é o nosso papel

1.1. A PONCI é uma rede privada, por convite, operada por **[RAZÃO SOCIAL]**, inscrita no CNPJ sob o nº **[CNPJ]**, com sede em **[ENDEREÇO]** ("PONCI" ou "Intermediadora").

1.2. A PONCI **não é proprietária nem vendedora** das obras apresentadas na rede. Ela atua como **intermediadora**: aproxima artistas e colecionadores, faz a curadoria das obras, registra as negociações, administra o fluxo de pagamento em custódia por meio de instituição de pagamento parceira, acompanha a entrega e emite o certificado de procedência.

1.3. Cada venda é celebrada diretamente entre o artista ("Vendedor") e o colecionador ("Comprador"), com a PONCI como intermediadora, por meio de um instrumento particular gerado para cada obra.

## 2. Acesso à rede

2.1. O acesso é feito exclusivamente por convite. Para ser membro é preciso ter 18 anos ou mais e plena capacidade civil, ou agir em nome de pessoa jurídica com poderes para isso.

2.2. A conta é pessoal e intransferível. O membro é responsável pela guarda da senha e por toda atividade realizada em sua conta.

2.3. Antes de negociar ou publicar obras, o membro deve completar seu **cadastro de identificação** (nome, CPF ou CNPJ, endereço, telefone e declaração de pessoa politicamente exposta). Os dados devem ser verdadeiros, completos e atualizados.

2.4. A PONCI pode recusar convites, suspender ou encerrar contas que descumpram estes Termos, que apresentem dados inconsistentes ou que representem risco à rede, mediante comunicação ao membro.

## 3. Confidencialidade e conduta

3.1. Preços, disponibilidade, propostas e dados de outros membros são **confidenciais** e não podem ser divulgados fora da rede.

3.2. É proibido: usar a rede para fins ilícitos; tentar identificar colecionadores antes da conclusão de uma venda; contornar a PONCI para concluir fora da rede negociações iniciadas nela; reproduzir imagens de obras sem autorização do autor; publicar conteúdo falso, ofensivo ou que viole direitos de terceiros.

## 4. Obras e curadoria

4.1. Toda obra passa por curadoria antes de ser publicada. A PONCI pode recusar ou retirar obras a seu critério, sem necessidade de justificativa detalhada.

4.2. As informações de cada obra (autoria, técnica, dimensões, edição, estado de conservação e preço) são fornecidas pelo artista, que responde por sua veracidade, nos termos do Contrato de Intermediação.

## 5. Negociação

5.1. O colecionador pode **reservar a obra pelo preço** informado ou **enviar uma proposta**. A reserva e a proposta são manifestações firmes de intenção de compra.

5.2. Aceita a proposta, ou feita a reserva, é gerado um **instrumento particular de compra e venda** com os dados da obra, das partes e das condições. A obra sai da vitrine e as demais propostas são encerradas.

5.3. O pagamento só é liberado para custódia depois que as duas partes assinam eletronicamente o instrumento.

## 6. Pagamento, custódia e comissão

6.1. O pagamento é feito pelo Comprador por meio de **instituição de pagamento parceira**, que mantém o valor em custódia até a confirmação de entrega e o fim do prazo de arrependimento, quando aplicável.

6.2. A PONCI recebe do Vendedor uma **comissão de 15% (quinze por cento)** sobre o preço de venda, retida no momento do repasse. Não há mensalidade nem taxa de entrada.

## 7. Entrega

7.1. A obra é embalada e despachada pelo artista, com seguro pelo valor da obra e código de rastreio, nas condições informadas ao Comprador antes do pagamento. A PONCI acompanha a entrega e media eventuais problemas.

7.2. O Comprador deve inspecionar a obra no recebimento e registrar qualquer avaria na própria plataforma em até 48 horas.

## 8. Direito de arrependimento

8.1. Quando o Comprador for consumidor e a contratação ocorrer fora de estabelecimento comercial, aplica-se o direito de arrependimento de **7 (sete) dias** contados do recebimento da obra (art. 49 do Código de Defesa do Consumidor). O pedido é feito pela plataforma e a obra deve ser devolvida nas mesmas condições em que foi recebida.

## 9. Propriedade intelectual

9.1. Os direitos autorais sobre as obras pertencem aos artistas. A aquisição do suporte físico **não transfere os direitos patrimoniais de autor** (art. 37 da Lei 9.610/98). É vedada a reprodução das obras sem autorização do autor.

9.2. A PONCI **não vende, não cede e não licencia** obras, imagens ou dados de membros para treinar, ajustar ou alimentar sistemas de inteligência artificial, e sinaliza aos robôs de coleta que o conteúdo da rede não pode ser usado para esse fim. É proibido extrair ou coletar imagens e textos da rede por meios automatizados.

9.2. A marca, o conteúdo e o software da PONCI são protegidos e não podem ser copiados.

## 10. Responsabilidades

10.1. O Vendedor responde pela autoria, autenticidade, titularidade, estado de conservação e informações da obra. O Comprador responde pelo pagamento e pela veracidade de seus dados.

10.2. A PONCI responde pela correta execução da intermediação, da curadoria, do registro das negociações e da coordenação da custódia e do acompanhamento da entrega, nos limites da lei. A PONCI não garante resultados de valorização das obras.

## 11. Prevenção à lavagem de dinheiro

11.1. O comércio de objetos de arte está sujeito à Lei 9.613/98 e à regulamentação do IPHAN. A PONCI identifica seus membros, mantém registro das operações pelo prazo legal e comunica às autoridades competentes, inclusive ao COAF, as operações exigidas em lei, **sem aviso prévio ao membro**.

11.2. A PONCI pode solicitar documentos adicionais, recusar ou suspender operações incompatíveis com o perfil do membro ou com indícios de irregularidade.

## 12. Assinatura e comunicações eletrônicas

12.1. Os membros concordam que aceites, propostas, assinaturas e comunicações feitos na plataforma têm validade jurídica como **assinatura eletrônica** (Lei 14.063/2020 e art. 10, § 2º, da MP 2.200-2/2001). A PONCI registra data, hora, IP, navegador e a impressão digital (hash SHA-256) de cada documento aceito ou assinado.

## 13. Alterações

13.1. Estes Termos podem ser atualizados. Cada versão é numerada e publicada na plataforma; para continuar usando a rede, o membro deve aceitar a versão vigente.

## 14. Lei aplicável e foro

14.1. Aplica-se a lei brasileira. Fica eleito o foro da comarca de **[CIDADE/UF]**, ressalvado o direito do consumidor de demandar no foro de seu domicílio.

Contato: **[E-MAIL DE CONTATO]**.
$doc$
from public.legal_documents where slug = 'termos'
having not exists(select 1 from public.current_documents() c where c.slug = 'termos' and c.body = $doc$> **Minuta para revisão jurídica.** Os campos entre colchetes devem ser preenchidos antes da publicação definitiva.

## 1. Quem somos e qual é o nosso papel

1.1. A PONCI é uma rede privada, por convite, operada por **[RAZÃO SOCIAL]**, inscrita no CNPJ sob o nº **[CNPJ]**, com sede em **[ENDEREÇO]** ("PONCI" ou "Intermediadora").

1.2. A PONCI **não é proprietária nem vendedora** das obras apresentadas na rede. Ela atua como **intermediadora**: aproxima artistas e colecionadores, faz a curadoria das obras, registra as negociações, administra o fluxo de pagamento em custódia por meio de instituição de pagamento parceira, acompanha a entrega e emite o certificado de procedência.

1.3. Cada venda é celebrada diretamente entre o artista ("Vendedor") e o colecionador ("Comprador"), com a PONCI como intermediadora, por meio de um instrumento particular gerado para cada obra.

## 2. Acesso à rede

2.1. O acesso é feito exclusivamente por convite. Para ser membro é preciso ter 18 anos ou mais e plena capacidade civil, ou agir em nome de pessoa jurídica com poderes para isso.

2.2. A conta é pessoal e intransferível. O membro é responsável pela guarda da senha e por toda atividade realizada em sua conta.

2.3. Antes de negociar ou publicar obras, o membro deve completar seu **cadastro de identificação** (nome, CPF ou CNPJ, endereço, telefone e declaração de pessoa politicamente exposta). Os dados devem ser verdadeiros, completos e atualizados.

2.4. A PONCI pode recusar convites, suspender ou encerrar contas que descumpram estes Termos, que apresentem dados inconsistentes ou que representem risco à rede, mediante comunicação ao membro.

## 3. Confidencialidade e conduta

3.1. Preços, disponibilidade, propostas e dados de outros membros são **confidenciais** e não podem ser divulgados fora da rede.

3.2. É proibido: usar a rede para fins ilícitos; tentar identificar colecionadores antes da conclusão de uma venda; contornar a PONCI para concluir fora da rede negociações iniciadas nela; reproduzir imagens de obras sem autorização do autor; publicar conteúdo falso, ofensivo ou que viole direitos de terceiros.

## 4. Obras e curadoria

4.1. Toda obra passa por curadoria antes de ser publicada. A PONCI pode recusar ou retirar obras a seu critério, sem necessidade de justificativa detalhada.

4.2. As informações de cada obra (autoria, técnica, dimensões, edição, estado de conservação e preço) são fornecidas pelo artista, que responde por sua veracidade, nos termos do Contrato de Intermediação.

## 5. Negociação

5.1. O colecionador pode **reservar a obra pelo preço** informado ou **enviar uma proposta**. A reserva e a proposta são manifestações firmes de intenção de compra.

5.2. Aceita a proposta, ou feita a reserva, é gerado um **instrumento particular de compra e venda** com os dados da obra, das partes e das condições. A obra sai da vitrine e as demais propostas são encerradas.

5.3. O pagamento só é liberado para custódia depois que as duas partes assinam eletronicamente o instrumento.

## 6. Pagamento, custódia e comissão

6.1. O pagamento é feito pelo Comprador por meio de **instituição de pagamento parceira**, que mantém o valor em custódia até a confirmação de entrega e o fim do prazo de arrependimento, quando aplicável.

6.2. A PONCI recebe do Vendedor uma **comissão de 15% (quinze por cento)** sobre o preço de venda, retida no momento do repasse. Não há mensalidade nem taxa de entrada.

## 7. Entrega

7.1. A obra é embalada e despachada pelo artista, com seguro pelo valor da obra e código de rastreio, nas condições informadas ao Comprador antes do pagamento. A PONCI acompanha a entrega e media eventuais problemas.

7.2. O Comprador deve inspecionar a obra no recebimento e registrar qualquer avaria na própria plataforma em até 48 horas.

## 8. Direito de arrependimento

8.1. Quando o Comprador for consumidor e a contratação ocorrer fora de estabelecimento comercial, aplica-se o direito de arrependimento de **7 (sete) dias** contados do recebimento da obra (art. 49 do Código de Defesa do Consumidor). O pedido é feito pela plataforma e a obra deve ser devolvida nas mesmas condições em que foi recebida.

## 9. Propriedade intelectual

9.1. Os direitos autorais sobre as obras pertencem aos artistas. A aquisição do suporte físico **não transfere os direitos patrimoniais de autor** (art. 37 da Lei 9.610/98). É vedada a reprodução das obras sem autorização do autor.

9.2. A PONCI **não vende, não cede e não licencia** obras, imagens ou dados de membros para treinar, ajustar ou alimentar sistemas de inteligência artificial, e sinaliza aos robôs de coleta que o conteúdo da rede não pode ser usado para esse fim. É proibido extrair ou coletar imagens e textos da rede por meios automatizados.

9.2. A marca, o conteúdo e o software da PONCI são protegidos e não podem ser copiados.

## 10. Responsabilidades

10.1. O Vendedor responde pela autoria, autenticidade, titularidade, estado de conservação e informações da obra. O Comprador responde pelo pagamento e pela veracidade de seus dados.

10.2. A PONCI responde pela correta execução da intermediação, da curadoria, do registro das negociações e da coordenação da custódia e do acompanhamento da entrega, nos limites da lei. A PONCI não garante resultados de valorização das obras.

## 11. Prevenção à lavagem de dinheiro

11.1. O comércio de objetos de arte está sujeito à Lei 9.613/98 e à regulamentação do IPHAN. A PONCI identifica seus membros, mantém registro das operações pelo prazo legal e comunica às autoridades competentes, inclusive ao COAF, as operações exigidas em lei, **sem aviso prévio ao membro**.

11.2. A PONCI pode solicitar documentos adicionais, recusar ou suspender operações incompatíveis com o perfil do membro ou com indícios de irregularidade.

## 12. Assinatura e comunicações eletrônicas

12.1. Os membros concordam que aceites, propostas, assinaturas e comunicações feitos na plataforma têm validade jurídica como **assinatura eletrônica** (Lei 14.063/2020 e art. 10, § 2º, da MP 2.200-2/2001). A PONCI registra data, hora, IP, navegador e a impressão digital (hash SHA-256) de cada documento aceito ou assinado.

## 13. Alterações

13.1. Estes Termos podem ser atualizados. Cada versão é numerada e publicada na plataforma; para continuar usando a rede, o membro deve aceitar a versão vigente.

## 14. Lei aplicável e foro

14.1. Aplica-se a lei brasileira. Fica eleito o foro da comarca de **[CIDADE/UF]**, ressalvado o direito do consumidor de demandar no foro de seu domicílio.

Contato: **[E-MAIL DE CONTATO]**.
$doc$);

select slug, version, published_at from public.current_documents() order by slug;

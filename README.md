# PONCI — Rede privada de arte

Protótipo de uma **rede fechada (por convite)** de artistas e colecionadores para compra e venda de obras,
no mesmo design do protótipo original da PONCI (brutalismo paulista: réguas de 2px, laje de concreto,
Archivo larga + Instrument Serif itálica + IBM Plex Mono).

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Landing page: as duas portas (artista / colecionador), vitrine com preço trancado, manifesto, como funciona, regras, FAQ e pedido de convite. |
| `artista.html` | Área do artista: ateliê (painel), obras com status de curadoria, cadastro de nova obra (com upload de foto ou composição gerada), propostas (aceitar / recusar / contrapropor), vendas e repasse, perfil. |
| `comprador.html` | Área do colecionador: acervo com filtros e preços, detalhe da obra (reservar pelo preço ou fazer proposta), favoritos, propostas (aceitar contraproposta), aquisições com custódia e certificado. |

## Como testar

Abra `index.html` direto no navegador ou sirva a pasta:

```bash
python3 -m http.server 8000
```

Nas áreas restritas, use **qualquer e-mail + código `PONCI-2026`**, ou o botão de conta de demonstração
(artista: Helena Vasques; colecionadora: Marina Alves, COL-0147).

As duas áreas compartilham o mesmo "banco" no `localStorage`: abra `artista.html` e `comprador.html`
em abas lado a lado — uma proposta enviada pela colecionadora aparece no painel da artista na hora,
e uma contraproposta da artista aparece para a colecionadora. Em *Perfil* (área do artista) há
"Restaurar dados de demonstração".

## Estrutura

```
assets/css/ponci.css   design system original + componentes da rede
assets/js/core.js      ícones, arte generativa, concreto, tipografia ajustada, cabeçalho/rodapé, formulários, roteador
assets/js/store.js     dados de demonstração e regras (propostas, reservas, custódia) em localStorage
assets/js/lp.js | artista.js | comprador.js
docs/referencia/       HTML original usado como referência de design
```

## Próximos passos para produção

Autenticação real e convites, banco de dados (ex.: Supabase/Postgres), upload de imagens em storage,
pagamento com custódia (split/escrow), notificações por e-mail e painel de curadoria.

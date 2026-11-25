# Cálculo operacional dos prints (25/11/2026)

Regras gravadas como versão 2 em `commerce_settings`, editáveis em Admin → Regras comerciais. Mudar não altera prints já publicados até o artista republicar.

| Item | Valor | Por quê |
|---|---|---|
| Comissão PONCI sobre o print | **30%** | Cobre a operação de cada pedido, o certificado, uma reserva para reimpressão e deixa margem para a plataforma (abaixo). |
| Taxa de pagamento | **4,5%** | Cartão de crédito: Mercado Pago 3,99% (receber em 30 dias) e 4,98% (na hora); Asaas 2,99% à vista e 3,49% em 2 a 6x, + R$ 0,49 por cobrança. Pix fica perto de 1%, então sobra folga. Parcelamento acima de 6x fica de fora. |
| Impostos | **6%** | Simples Nacional, 1ª faixa (até R$ 180 mil/ano): Anexo I (comércio) 4%, Anexo III (serviços) 6%. Usei o maior até o contador definir o enquadramento. |
| Comissão do original | 15% (sem mudança) | Regra já praticada e escrita nos contratos. |

**Fórmula do print:** preço = (custo da gráfica + valor do artista) ÷ (1 − 40,5%). O artista recebe exatamente o valor que definiu. O frete é cobrado à parte.

## Custos considerados por pedido (estimativas)

| Item | Valor |
|---|---|
| Operação (confirmar pagamento, ordem para a gráfica, acompanhamento): ~10 min a R$ 60/h | R$ 10,00 |
| Certificado impresso + envelope | R$ 3,00 |
| Reserva para reimpressão por dano no transporte: 5% do custo da impressão | varia |

**Custos fixos mensais estimados** (infra, já existentes para o site todo): Cloudflare Workers ~US$ 5, Supabase (Pro, se ativo) ~US$ 25, domínio e e-mail ~R$ 10. Total ≈ R$ 200/mês.

## Preço ao comprador com valores sugeridos para o artista

Valores sugeridos para o artista: A4 R$ 40, A3 R$ 60, A2 R$ 100, 50×70 R$ 140.

| | A4 | A3 | A2 | 50×70 |
|---|---|---|---|---|
| Canson Rag Photographique | R$ 152 | R$ 271 | R$ 509 | R$ 713 |
| PONCI fica com (bruto / líquido) | 46 / 30 | 81 / 63 | 153 / 130 | 214 / 187 |
| Photo Lustre | R$ 123 | R$ 213 | R$ 392 | R$ 549 |
| PONCI fica com (bruto / líquido) | 37 / 22 | 64 / 47 | 117 / 98 | 165 / 142 |

Com margem líquida média de ~R$ 50 por print, **4 a 5 prints por mês pagam a infraestrutura**. Daí em diante é resultado.

## Comparação: outras comissões

| | Rag A3 ao comprador | Líquido da PONCI no A3 |
|---|---|---|
| 25% | R$ 250 | R$ 44 |
| **30%** | **R$ 271** | **R$ 63** |
| 35% | R$ 296 | R$ 86 |

## A confirmar

- **Impostos:** enquadramento real com o contador (pode cair para 4%, ou ser outro regime). A empresa ainda não tem CNPJ nos documentos.
- **Taxa de pagamento:** a taxa do gateway escolhido. Com Pix como padrão e cartão em até 6x, dá para baixar para ~3,5%.
- **WePrint:** preço de parceiro (hoje usamos o preço de balcão) e o custo do envio para a artista no print assinado.

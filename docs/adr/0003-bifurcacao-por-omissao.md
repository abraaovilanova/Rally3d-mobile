# 3. A Bifurcação é a ausência de gesto, e o Desvio é sempre pior

Data: 2026-08-16

## Status

Aceita.

## Contexto

O Rally 2D tem **Bifurcação**, **Rota Alternativa**, **Atalho**, **Desvio**, **Beco sem Saída** e
**Placa de Rota** — um subsistema inteiro construído sobre o jogador *ver* dois caminhos e escolher
um.

Com a [câmera invertida](0001-camera-invertida.md), ele não vê nenhum dos dois. Escolher entre dois
caminhos invisíveis é cara-ou-coroa na primeira Corrida e, depois de decorado, é sempre a mesma
resposta — ou seja, não é decisão nenhuma. O subsistema estava para ser descartado inteiro.

## Decisão

A **Bifurcação** volta, com outra forma: **ela é a ausência de gesto.**

Toda **Virada** pede um swipe. Em algumas delas — não em todas — não fazer nada não mata: o Carro
segue em frente e entra num **Desvio**, mais longo, liso (sem Viradas próprias), que reencontra a
**Pista** adiante. Nas demais Viradas, não virar é **Batida**.

Três regras fecham o modelo:

1. **O Desvio é sempre mais longo.** Seguir reto jamais compensa. Não existe **Atalho**.
2. **O jogador não sabe quais Viradas perdoam** até já ter passado por elas — a **Nota** não
   distingue ([ADR 0002](0002-notas-como-contrato-de-justica.md)).
3. **O Fora de Rota é imediatamente visível**: asfalto escuro e aviso na tela no instante da
   entrada.

## Alternativas consideradas

- **Um gesto próprio para escolher rota** (swipe para cima, toque prolongado) — devolveria a
  escolha, mas é uma escolha tomada sem informação, e mais um gesto competindo pela mesma mão.
- **O "em frente" às vezes ser um Atalho** — daria conhecimento de veterano, mas faria a Nota
  mandar virar onde virar é pior. O jogador aprenderia a desconfiar do único canal de informação
  que ele tem, e o contrato de justiça cairia junto.
- **A Nota anunciar as Bifurcações** — transformaria a rede de segurança em decisão consciente
  ("essa eu posso pular"), que é exatamente o que a câmera cega não permite tomar bem.

## Consequências

- O **Desvio** é uma rede de segurança que custa caro, não uma opção. Ele suaviza a curva de
  aprendizado sem tirar peso das Viradas que matam.
- Saem do glossário: **Atalho**, **Beco sem Saída**, **Barreira**, **Placa de Rota**. Ficam
  **Bifurcação**, **Rota Alternativa** (só na forma de Desvio) e **Fora de Rota**.
- O **Fora de Rota** é visível aqui e escondido no Rally 2D — a inversão é proposital. Lá havia uma
  escolha a proteger na boca da Bifurcação; aqui não há, e esconder só faria o jogador culpar os
  controles pelo Tempo pior.
- O gerador de Pista precisa decidir *quais* Viradas ganham Desvio. A densidade dessas é uma
  alavanca de dificuldade que ainda não foi projetada.

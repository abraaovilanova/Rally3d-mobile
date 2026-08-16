# 1. A câmera fica à frente do Carro, olhando para trás

Data: 2026-08-16

## Status

Aceita.

## Contexto

A versão de desktop (Rally 2D) é um jogo de visão: câmera de topo, o jogador enxerga a **Pista**
chegando e pilota por reação contínua com o cursor. Esse modelo não sobrevive ao celular — o dedo
não flutua, tapa a tela, e não tem distância contínua ao Carro para servir de acelerador.

Ao projetar a versão mobile, a escolha de câmera era a raiz da árvore: ela decide se o jogo é de
**reação** (ver a curva e responder) ou de **memória** (saber a curva antes de chegar).

## Decisão

O observador fica **à frente do Carro, olhando para trás**. O jogador vê o Carro vindo em sua
direção e a Pista já percorrida se afastando. Ele **não vê nada do que vem pela frente**.

Isso é o oposto de Temple Run e Subway Surfers, que são jogos de reagir ao desconhecido.

Duas decisões que já estavam tomadas passam a fazer sentido junto com esta:

- A **Semente** é fixa por **Etapa**. A Pista é sempre a mesma, então ela é decorável.
- O **Melhor Tempo** é a métrica do jogo. Ele mede o quanto o jogador já decorou e o quão bem
  executa o que decorou.

E é o que rally de verdade é: o piloto não conhece a estrada, então o navegador lhe diz o que vem.
As **Notas** deixam de ser enfeite e viram o canal de informação principal.

## Alternativas consideradas

- **Topo-down com câmera deslocada para a frente** — reaproveitaria o renderizador, o gerador de
  Pista e a detecção de Borda do Rally 2D quase inteiros. Recusada: produziria uma porta do jogo de
  desktop com controles piores, não um jogo próprio.
- **Pseudo-3D atrás do Carro** (o enquadramento convencional de corrida) — mais fácil de vender,
  jogo de reação, e as Notas voltariam a ser decorativas.

## Consequências

- **O renderizador é novo do zero**: projeção em perspectiva, escala por profundidade, ordenação
  por profundidade. É a maior fatia de trabalho do projeto e nada do `render.ts` do Rally 2D se
  aproveita.
- **Retrato funciona bem**: a profundidade cai no eixo vertical, que é o que a tela alta tem
  sobrando.
- **O jogo é hostil nos primeiros 30 segundos.** Todo jogador vai bater sem entender por quê até
  aprender a ouvir/ler as Notas. A primeira Etapa precisa ensinar isso explicitamente, ou o jogo
  morre na primeira sessão. Este é o maior risco do projeto.
- Como o jogador não pode ver à frente, escolher entre dois caminhos visíveis deixa de ser
  possível. Ver [ADR 0003](0003-bifurcacao-por-omissao.md).
- **O reinício precisa ser instantâneo** (menos de ~0.3s do toque à largada). Num jogo de decorar
  por repetição, o atrito entre Tentativas é o que separa "difícil" de "frustrante".

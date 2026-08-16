# Rally Mobile

Um jogo de rally em que **você não vê a estrada**. A câmera fica à frente do carro,
olhando para trás: você vê o carro vindo na sua direção e a pista já percorrida se
afastando. O que vem pela frente chega só pelas **notas do navegador** e pela memória.

Jogo de celular, em retrato. É um jogo diferente do Rally 2D, não uma porta dele.

**Jogue:** https://abraaovilanova.github.io/Rally3d-mobile/ — abra no celular, em retrato.

## Controles

| Gesto | O que faz |
| --- | --- |
| Swipe ← / → | A **Virada**. Direção errada é batida; fora da janela, o carro raspa e perde tempo. |
| Inclinar o celular | A **Posição Lateral** — o lado da pista. Sem sensor, arraste o polegar. |
| Toque duplo | O **Impulso**: mais velocidade, menos tempo de reação. |

## Como jogar

1. `npm install`
2. `npm run dev -- --host` e abra no celular pela rede local.

O sensor de inclinação exige contexto seguro (HTTPS) e, no iOS 13+, permissão
concedida a partir de um toque — o jogo pede na tela inicial. Negar não bloqueia nada:
o arrasto do polegar é um caminho equivalente. Em `npm run dev` na rede local não há
HTTPS, então lá vale o arrasto; para testar a inclinação, use a versão publicada.

## Publicar

`npm run deploy` — compila e recria o branch `gh-pages` a partir do `dist`. O branch é
só o build, sem histórico. O Pages serve o jogo em `/Rally3d-mobile/`, que é de onde
vem o `base` no `vite.config.ts`.

## Onde ler antes de mexer

- [`CONTEXT.md`](CONTEXT.md) — o glossário do domínio. Os nomes usados no código são os
  daqui.
- [`docs/adr/0001-camera-invertida.md`](docs/adr/0001-camera-invertida.md) — por que o
  jogo é cego, e o que isso obriga.
- [`docs/adr/0002-notas-como-contrato-de-justica.md`](docs/adr/0002-notas-como-contrato-de-justica.md)
  — a nota avisa de tudo que pode matar, e de nada mais.
- [`docs/adr/0003-bifurcacao-por-omissao.md`](docs/adr/0003-bifurcacao-por-omissao.md) —
  não virar às vezes perdoa, e o desvio é sempre pior.
- `src/tuning.ts` — todos os números da sensação do jogo, num lugar só.

## O que ainda não existe

- **Etapa de tutorial.** Hoje a tela inicial explica os controles com texto. O ADR 0001
  registra isso como o maior risco do projeto: um jogo cego sem tutorial parece quebrado,
  não difícil.
- **Vocabulário de notas** além de curva e pedra.
- **Cenário**: a pista tem postes e nada mais.

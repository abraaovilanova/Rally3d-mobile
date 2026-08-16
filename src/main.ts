import { advance, createGame, retry, start, updateGame } from './game';
import { createInput } from './input';
import { render } from './render';
import { primeVoice } from './voice';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;

const game = createGame();
const input = createInput(canvas);

primeVoice();

function resize(): void {
  // Aqui o devicePixelRatio importa: a projeção é em perspectiva, então a quantidade
  // de Pista visível depende do ângulo, não do número de pixels.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

/** O toque que sai de uma tela de overlay. Batida repete a Etapa; Conclusão avança. */
function confirmOverlay(): void {
  if (game.phase === 'ready') {
    // A permissão de sensor do iOS só pode ser pedida a partir de um gesto.
    void input.requestTilt();
    start(game);
  } else if (game.phase === 'crashed') {
    retry(game);
  } else if (game.phase === 'finished') {
    advance(game);
  }
}

let last = performance.now();

function frame(now: number): void {
  // Um dt gigante (aba em segundo plano) atravessaria uma Janela inteira sem avaliá-la.
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;

  if (input.takeTap() && game.phase !== 'running') confirmOverlay();

  updateGame(game, input, dt);
  render(ctx, game, input);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

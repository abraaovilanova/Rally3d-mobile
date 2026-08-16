import { bezierPath, PathBuilder, samplePath, type Path } from './path';
import { createRng, seedFromStageId } from './rng';
import { TUNING } from './tuning';

/**
 * Uma Virada: a curva pede um swipe na direção certa dentro da Janela.
 * A Janela é o trecho `[sEntry - window, sEntry]` — o gesto acontece antes da curva,
 * não dentro dela.
 */
export interface Turn {
  dir: -1 | 1;
  radius: number;
  arcDeg: number;
  sEntry: number;
  sExit: number;
  /** Bifurcação: aqui a ausência de Virada não mata, joga o Carro num Desvio. */
  fork: boolean;
  detour?: Detour;
}

/** O Caminho mais longo em que o Carro cai ao não virar numa Bifurcação. */
export interface Detour {
  path: Path;
  /** Onde ele reencontra a Pista. */
  rejoinS: number;
}

/** Objeto na Pista; tocá-lo é Batida. Sempre anunciado por Nota. */
export interface Obstacle {
  s: number;
  lat: number;
}

export interface Track {
  path: Path;
  width: number;
  /** Comprimento da Janela desta Etapa, em px. Encurta com a Escalada. */
  window: number;
  turns: Turn[];
  obstacles: Obstacle[];
}

export interface TrackSpec {
  stageId: string;
  width: number;
  window: number;
  length: number;
  curveBias: number;
}

const MIN_FORKS = 2;

export function buildTrack(spec: TrackSpec): Track {
  const rng = createRng(seedFromStageId(spec.stageId));
  const builder = new PathBuilder();
  const turns: Turn[] = [];

  builder.straight(TUNING.runInLength);

  const lastTurnAt = spec.length - TUNING.runOutLength;

  while (builder.tip.s < lastTurnAt) {
    const dir: -1 | 1 = rng.chance(0.5) ? -1 : 1;

    // `curveBias` é a Escalada puxando o catálogo para curvas mais fechadas.
    const [rMin, rMax] = TUNING.curveRadius;
    const radius = rMin + (rMax - rMin) * Math.pow(rng.next(), spec.curveBias);
    const arcDeg = rng.range(TUNING.curveArc[0], TUNING.curveArc[1]);

    const sEntry = builder.tip.s;
    builder.curve(radius, (arcDeg * Math.PI) / 180, dir);

    turns.push({
      dir,
      radius,
      arcDeg,
      sEntry,
      sExit: builder.tip.s,
      fork: rng.chance(TUNING.forkChance),
    });

    builder.straight(rng.range(TUNING.straightLength[0], TUNING.straightLength[1]));
  }

  builder.straight(TUNING.runOutLength);

  const path = builder.build();

  // Uma Etapa sem Bifurcação nenhuma existiria: com poucas Viradas o sorteio às vezes
  // dá zero. Aí a rede de segurança simplesmente não aparece nessa Etapa, e o jogador
  // aprende uma regra que o jogo não cumpre.
  while (turns.filter((t) => t.fork).length < MIN_FORKS && turns.length >= MIN_FORKS) {
    turns[Math.floor(rng.next() * turns.length)].fork = true;
  }

  for (const turn of turns) {
    if (turn.fork) turn.detour = buildDetour(path, turn);
  }

  return {
    path,
    width: spec.width,
    window: spec.window,
    turns,
    obstacles: placeObstacles(rng, path, turns, spec),
  };
}

/**
 * O Desvio sai reto da Bifurcação e volta à Pista adiante, sem Viradas próprias.
 * É sempre mais longo: se a Bézier sair curta demais, o reencontro é empurrado para
 * a frente até o Desvio custar Tempo de verdade. Nunca existe atalho — ver
 * docs/adr/0003-bifurcacao-por-omissao.md
 */
function buildDetour(path: Path, turn: Turn): Detour {
  let rejoinS = turn.sExit + 260;
  let best: Detour | null = null;
  let bestRatio = 0;

  for (let attempt = 0; attempt < 14; attempt++) {
    const from = samplePath(path, turn.sEntry);
    const to = samplePath(path, rejoinS);
    const span = Math.hypot(to.x - from.x, to.y - from.y);

    // Alcance maior = barriga maior no Desvio, e portanto mais px a percorrer.
    const detour = bezierPath(from, to, span * (0.7 + attempt * 0.12));
    const replaced = rejoinS - turn.sEntry;
    const ratio = detour.length / replaced;

    if (ratio >= TUNING.detourMinRatio) return { path: detour, rejoinS };

    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = { path: detour, rejoinS };
    }

    rejoinS += 160;
  }

  return best!;
}

/**
 * Obstáculos só entram em reta, longe de qualquer Janela: um Obstáculo em cima de uma
 * Virada pediria duas ações cegas ao mesmo tempo, e o jogador não teria como separar
 * o que o matou.
 */
function placeObstacles(
  rng: ReturnType<typeof createRng>,
  path: Path,
  turns: Turn[],
  spec: TrackSpec,
): Obstacle[] {
  const guard = spec.window * 1.5;

  // Os vãos livres entre uma Virada e a próxima Janela. Um Obstáculo em cima de uma
  // Janela pediria duas ações cegas ao mesmo tempo, e o jogador não teria como
  // separar o que o matou.
  const gaps: { from: number; to: number }[] = [];
  let cursor = TUNING.runInLength;

  for (const turn of turns) {
    gaps.push({ from: cursor, to: turn.sEntry - guard });
    cursor = turn.sExit + 300;
  }
  gaps.push({ from: cursor, to: path.length - TUNING.runOutLength });

  const usable = gaps
    .filter((g) => g.to - g.from > 260)
    .sort((a, b) => b.to - b.from - (a.to - a.from))
    .slice(0, TUNING.obstaclesPerStage)
    .sort((a, b) => a.from - b.from);

  return usable.map((gap) => {
    const side: -1 | 1 = rng.chance(0.5) ? -1 : 1;
    return {
      s: rng.range(gap.from + 120, gap.to - 120),
      lat: side * (spec.width / 2 - TUNING.obstacleHalfWidth),
    };
  });
}

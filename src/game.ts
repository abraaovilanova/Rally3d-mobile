import type { Input } from './input';
import { buildNotes, type Note } from './notes';
import { samplePath, type Path } from './path';
import { bestTime, recordTime } from './records';
import { BIOMES, makeStage, type Stage } from './stage';
import type { Detour } from './track';
import { TUNING } from './tuning';
import { silence, speak } from './voice';

export type Phase = 'ready' | 'running' | 'crashed' | 'finished';

/** As três formas de Batida. Todas previsíveis pela Nota ou pela memória. */
export type CrashCause = 'direcao' | 'borda' | 'obstaculo';

export interface Banner {
  text: string;
  until: number;
}

export interface Game {
  biomeIndex: number;
  lap: number;
  stage: Stage;
  notes: Note[];

  phase: Phase;
  /** Tempo da Corrida atual, em segundos. */
  time: number;
  attempts: number;

  /** Distância na Pista. Enquanto o Carro está num Desvio, congela na entrada dele. */
  s: number;
  lat: number;
  speed: number;

  detour: Detour | null;
  detourS: number;
  detourFromS: number;

  /** Índice da próxima Virada ainda não resolvida. */
  pendingTurn: number;
  /** Índice da próxima Nota ainda não anunciada. */
  pendingNote: number;

  boostUntil: number;
  boostReadyAt: number;

  crashCause: CrashCause | null;
  lastTime: number | null;
  best: number | null;
  isRecord: boolean;
  banner: Banner | null;
}

export function createGame(): Game {
  const stage = makeStage(0, 0);
  return resetRace({
    biomeIndex: 0,
    lap: 0,
    stage,
    notes: buildNotes(stage.track),
    phase: 'ready',
    time: 0,
    attempts: 0,
    s: 0,
    lat: 0,
    speed: TUNING.baseSpeed,
    detour: null,
    detourS: 0,
    detourFromS: 0,
    pendingTurn: 0,
    pendingNote: 0,
    boostUntil: 0,
    boostReadyAt: 0,
    crashCause: null,
    lastTime: null,
    best: bestTime(stage.id),
    isRecord: false,
    banner: null,
  });
}

function resetRace(game: Game): Game {
  silence();
  game.time = 0;
  game.s = 0;
  game.lat = 0;
  game.speed = TUNING.baseSpeed;
  game.detour = null;
  game.detourS = 0;
  game.detourFromS = 0;
  game.pendingTurn = 0;
  game.pendingNote = 0;
  game.boostUntil = 0;
  game.boostReadyAt = 0;
  game.crashCause = null;
  game.isRecord = false;
  game.banner = null;
  game.best = bestTime(game.stage.id);
  return game;
}

/** Batida repete a mesma Etapa. Nunca faz retroceder na Progressão. */
export function retry(game: Game): void {
  game.attempts++;
  resetRace(game);
  game.phase = 'running';
}

/** Conclusão avança para a próxima Etapa: os Biomas ciclam e a Volta sobe. */
export function advance(game: Game): void {
  game.biomeIndex = (game.biomeIndex + 1) % BIOMES.length;
  if (game.biomeIndex === 0) game.lap++;

  game.stage = makeStage(game.biomeIndex, game.lap);
  game.notes = buildNotes(game.stage.track);
  game.attempts = 0;
  game.lastTime = null;
  resetRace(game);
  game.phase = 'running';
}

export function start(game: Game): void {
  resetRace(game);
  game.phase = 'running';
}

/** O Caminho em que o Carro está agora, e onde ele está nele. */
export function carPose(game: Game): { path: Path; s: number; lat: number } {
  if (game.detour) return { path: game.detour.path, s: game.detourS, lat: game.lat };
  return { path: game.stage.track.path, s: game.s, lat: game.lat };
}

/**
 * Quanto da Pista já foi percorrido. Dentro de um Desvio, interpola entre a
 * Bifurcação e o reencontro — as Notas seguintes continuam saindo na hora certa.
 */
export function trackProgress(game: Game): number {
  if (!game.detour) return game.s;
  const t = Math.min(1, game.detourS / game.detour.path.length);
  return game.detourFromS + (game.detour.rejoinS - game.detourFromS) * t;
}

export function boostReady(game: Game): boolean {
  return game.time >= game.boostReadyAt && game.time >= game.boostUntil;
}

export function updateGame(game: Game, input: Input, dt: number): void {
  if (game.phase !== 'running') {
    input.takeSwipe();
    input.takeBoost();
    return;
  }

  game.time += dt;
  updateSpeed(game, input, dt);
  updateLateral(game, input, dt);

  const swipe = input.takeSwipe();
  if (!game.detour && swipe !== 0) resolveSwipe(game, swipe);

  if (game.phase !== 'running') return;

  if (game.detour) advanceDetour(game, dt);
  else advanceTrack(game, dt);

  announceNotes(game);

  if (game.banner && game.time > game.banner.until) game.banner = null;
}

function updateSpeed(game: Game, input: Input, dt: number): void {
  if (input.takeBoost() && boostReady(game)) {
    game.boostUntil = game.time + TUNING.boostDuration;
    game.boostReadyAt = game.boostUntil + TUNING.boostCooldown;
  }

  const boosting = game.time < game.boostUntil;
  const target = TUNING.baseSpeed * (boosting ? TUNING.boostFactor : 1);
  const rate = TUNING.recoverAccel * (game.speed > target ? 2 : 1);
  const gap = target - game.speed;

  game.speed += Math.sign(gap) * Math.min(Math.abs(gap), rate * dt);
}

function updateLateral(game: Game, input: Input, dt: number): void {
  // A Inclinação mapeia posição, não velocidade: o Carro nunca deriva sozinho para a
  // Borda. Tocar a Borda continua sendo Batida, mas só a Virada errada leva até lá.
  const maxLat = game.stage.track.width / 2 - TUNING.carHalfWidth;
  const wanted = input.lateral * maxLat;
  game.lat += (wanted - game.lat) * Math.min(1, TUNING.lateralSmoothing * dt);
}

function resolveSwipe(game: Game, swipe: -1 | 1): void {
  const turn = game.stage.track.turns[game.pendingTurn];
  if (!turn) return;

  const window = game.stage.track.window;
  const attention = window * TUNING.turnAttentionSpan;

  // Um swipe solto longe de qualquer Virada é ignorado — ele não pode matar por uma
  // curva que ainda está longe demais para o jogador estar pensando nela.
  if (game.s < turn.sEntry - attention) return;

  if (swipe !== turn.dir) {
    crash(game, 'direcao');
    return;
  }

  game.pendingTurn++;

  if (game.s >= turn.sEntry - window) {
    banner(game, turn.dir < 0 ? 'ESQUERDA' : 'DIREITA');
  } else {
    // Fora da Janela: a Virada acontece, mas raspando. Custa Tempo, não a Corrida.
    game.speed *= TUNING.scrapeFactor;
    banner(game, 'CEDO DEMAIS');
  }
}

function advanceTrack(game: Game, dt: number): void {
  const track = game.stage.track;
  const point = samplePath(track.path, game.s);

  // Por dentro da curva o percurso é mais curto: a Posição Lateral é uma das duas
  // fontes de Tempo, junto com a precisão das Viradas.
  const line = Math.max(0.4, 1 + game.lat * point.curv);
  const from = game.s;
  const to = from + (game.speed * dt) / line;

  const turn = track.turns[game.pendingTurn];
  if (turn && to > turn.sEntry) {
    game.pendingTurn++;

    if (turn.fork && turn.detour) {
      game.detour = turn.detour;
      game.detourS = 0;
      game.detourFromS = turn.sEntry;
      game.s = turn.sEntry;
      banner(game, 'FORA DE ROTA');
      return;
    }

    crash(game, 'borda');
    return;
  }

  for (const obstacle of track.obstacles) {
    if (obstacle.s <= from || obstacle.s > to) continue;
    if (Math.abs(game.lat - obstacle.lat) < TUNING.obstacleHalfWidth + TUNING.carHalfWidth) {
      game.s = obstacle.s;
      crash(game, 'obstaculo');
      return;
    }
  }

  game.s = to;

  if (game.s >= track.path.length) finish(game);
}

function advanceDetour(game: Game, dt: number): void {
  const detour = game.detour!;
  game.detourS += game.speed * dt;

  if (game.detourS >= detour.path.length) {
    game.s = detour.rejoinS;
    game.detour = null;
    game.detourS = 0;
  }
}

function announceNotes(game: Game): void {
  const s = trackProgress(game);

  while (game.pendingNote < game.notes.length) {
    const note = game.notes[game.pendingNote];
    if (note.s - s > TUNING.noteLookahead) break;
    speak(note.spoken);
    game.pendingNote++;
  }
}

function banner(game: Game, text: string): void {
  game.banner = { text, until: game.time + 1.1 };
}

function crash(game: Game, cause: CrashCause): void {
  silence();
  game.phase = 'crashed';
  game.crashCause = cause;
}

function finish(game: Game): void {
  silence();
  game.phase = 'finished';
  game.lastTime = game.time;
  game.isRecord = recordTime(game.stage.id, game.time);
  game.best = bestTime(game.stage.id);
}

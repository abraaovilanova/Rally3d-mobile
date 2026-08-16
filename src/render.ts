import { boostReady, carPose, trackProgress, type Game } from './game';
import type { Input } from './input';
import { upcomingNotes, type Note } from './notes';
import { offsetPoint, samplePath } from './path';
import { formatTime } from './records';
import { TUNING } from './tuning';

interface Camera {
  x: number;
  y: number;
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  focal: number;
}

interface Projected {
  x: number;
  y: number;
  scale: number;
  depth: number;
}

/**
 * A Câmera Invertida: fica à frente do Carro, olhando para trás. O jogador vê o Carro
 * vindo em sua direção e a Pista já percorrida se afastando — e nada do que vem.
 *
 * A imagem é **espelhada**, como a de um retrovisor. Sem isso a direita do Carro
 * apareceria na esquerda da tela, e o swipe brigaria com a Nota que o mandou virar.
 * Ver docs/adr/0001-camera-invertida.md
 */
export function render(ctx: CanvasRenderingContext2D, game: Game, input: Input): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const palette = game.stage.biome.palette;

  const pose = carPose(game);
  const sCam = pose.s + TUNING.cameraAhead;

  // A Câmera é uma haste rígida presa ao Carro: ela fica à frente dele, na direção
  // dele, e gira **junto** com ele. Tirar a direção do ponto da Pista sob a Câmera
  // faria ela entrar na curva 780px antes do Carro e girar sozinha — o jogador veria
  // a curva pela rotação da imagem, não pela Nota.
  const carPoint = samplePath(pose.path, pose.s);
  const boomX = Math.cos(carPoint.heading) * TUNING.cameraAhead;
  const boomY = Math.sin(carPoint.heading) * TUNING.cameraAhead;

  // A Câmera acompanha só parte da Posição Lateral: o resto é o deslocamento do Carro
  // na tela, que é como o jogador enxerga de que lado da Pista está.
  const camPos = offsetPoint(carPoint, pose.lat * TUNING.cameraLateralFollow);

  const yaw = carPoint.heading + Math.PI;
  const cam: Camera = {
    x: camPos.x + boomX,
    y: camPos.y + boomY,
    fx: Math.cos(yaw),
    fy: Math.sin(yaw),
    cx: w / 2,
    cy: h * TUNING.horizonAt,
    focal: w * TUNING.focalRatio,
  };

  ctx.fillStyle = palette.sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, cam.cy, w, h - cam.cy);

  drawRoad(ctx, game, cam, sCam);
  drawProps(ctx, game, cam, sCam, pose.s);
  drawCar(ctx, game, cam);
  drawHud(ctx, game, input);
  drawOverlay(ctx, game);
}

function project(cam: Camera, x: number, y: number, z: number): Projected {
  const dx = x - cam.x;
  const dy = y - cam.y;
  const depth = dx * cam.fx + dy * cam.fy;
  const side = dx * cam.fy - dy * cam.fx;
  const scale = cam.focal / Math.max(1, depth);

  return {
    // O sinal negativo é o espelhamento do retrovisor.
    x: cam.cx - side * scale,
    y: cam.cy + (TUNING.cameraHeight - z) * scale,
    scale,
    depth,
  };
}

interface Section {
  s: number;
  left: Projected;
  right: Projected;
  outerLeft: Projected;
  outerRight: Projected;
}

function sectionAt(cam: Camera, game: Game, s: number): Section {
  const pose = carPose(game);
  const point = samplePath(pose.path, s);
  const half = game.stage.track.width / 2;
  const rumble = half * 0.14;

  const at = (lat: number) => {
    const p = offsetPoint(point, lat);
    return project(cam, p.x, p.y, 0);
  };

  return {
    s,
    left: at(-half),
    right: at(half),
    outerLeft: at(-half - rumble),
    outerRight: at(half + rumble),
  };
}

function drawRoad(ctx: CanvasRenderingContext2D, game: Game, cam: Camera, sCam: number): void {
  const palette = game.stage.biome.palette;
  const near = sCam - 30;
  const far = sCam - TUNING.viewDistance;

  const stops: number[] = [];
  for (let s = far; s < near; ) {
    stops.push(s);
    // Ao longe, um ponto a cada 3 passos basta: a diferença não chega a um pixel.
    s += sCam - s > 1200 ? TUNING.pathStep * 3 : TUNING.pathStep;
  }
  stops.push(near);

  const sections = stops.map((s) => sectionAt(cam, game, s));
  const offRoute = game.detour !== null;
  const road = offRoute ? palette.offRoute : palette.road;
  const roadAlt = offRoute ? palette.offRoute : palette.roadAlt;

  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i];
    const b = sections[i + 1];
    // Numa curva a Câmera sai da Pista, e trechos inteiros ficam atrás dela.
    // Basta um canto atrás do plano da Câmera para a projeção do quadrilátero explodir.
    if (
      Math.min(a.outerLeft.depth, a.outerRight.depth, b.outerLeft.depth, b.outerRight.depth) < 1
    ) {
      continue;
    }

    const stripe = Math.floor(a.s / TUNING.rumbleLength) % 2 === 0;

    quad(ctx, a.outerLeft, b.outerLeft, b.left, a.left, stripe ? palette.rumble : palette.rumbleAlt);
    quad(ctx, a.outerRight, b.outerRight, b.right, a.right, stripe ? palette.rumble : palette.rumbleAlt);
    quad(ctx, a.left, b.left, b.right, a.right, stripe ? road : roadAlt);
  }

  drawFinishLine(ctx, game, cam, sCam);
}

function quad(
  ctx: CanvasRenderingContext2D,
  a: Projected,
  b: Projected,
  c: Projected,
  d: Projected,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
}

function drawFinishLine(
  ctx: CanvasRenderingContext2D,
  game: Game,
  cam: Camera,
  sCam: number,
): void {
  if (game.detour) return;

  const end = game.stage.track.path.length;
  if (end > sCam || sCam - end > TUNING.viewDistance) return;

  const a = sectionAt(cam, game, end - 40);
  const b = sectionAt(cam, game, end);
  if (a.left.depth < 1) return;

  quad(ctx, a.left, b.left, b.right, a.right, '#f2f2f2');
}

/** Postes de beira de Pista e Obstáculos, desenhados do mais longe para o mais perto. */
function drawProps(
  ctx: CanvasRenderingContext2D,
  game: Game,
  cam: Camera,
  sCam: number,
  carS: number,
): void {
  const palette = game.stage.biome.palette;
  const half = game.stage.track.width / 2;
  const spacing = 220;

  const first = Math.ceil((sCam - TUNING.viewDistance) / spacing);
  const last = Math.floor((sCam - 40) / spacing);

  for (let i = first; i <= last; i++) {
    const s = i * spacing;
    if (s < 0) continue;
    for (const side of [-1, 1] as const) {
      drawPost(ctx, cam, game, s, side * (half + half * 0.3), palette.post);
    }
  }

  if (game.detour) return;

  const carDepth = TUNING.cameraAhead;
  const obstacles = game.stage.track.obstacles
    .filter((o) => o.s < sCam && sCam - o.s < TUNING.viewDistance)
    .sort((a, b) => a.s - b.s);

  for (const obstacle of obstacles) {
    if (sCam - obstacle.s < carDepth) continue;
    drawObstacle(ctx, cam, game, obstacle.s, obstacle.lat);
  }

  // Os Obstáculos mais próximos que o Carro passam por cima dele: já foram
  // ultrapassados, e vê-los passar raspando é a única confirmação de que o desvio deu certo.
  game.detour === null &&
    obstacles
      .filter((o) => sCam - o.s < carDepth && o.s > carS - 400)
      .forEach((o) => drawObstacle(ctx, cam, game, o.s, o.lat));
}

function drawPost(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  game: Game,
  s: number,
  lat: number,
  color: string,
): void {
  const point = samplePath(carPose(game).path, s);
  const at = offsetPoint(point, lat);
  const base = project(cam, at.x, at.y, 0);
  if (base.depth < 5) return;

  const top = project(cam, at.x, at.y, 90);
  const width = Math.max(1, 8 * base.scale);

  ctx.fillStyle = color;
  ctx.fillRect(base.x - width / 2, top.y, width, base.y - top.y);
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  game: Game,
  s: number,
  lat: number,
): void {
  const point = samplePath(game.stage.track.path, s);
  const left = offsetPoint(point, lat - TUNING.obstacleHalfWidth);
  const right = offsetPoint(point, lat + TUNING.obstacleHalfWidth);

  const bl = project(cam, left.x, left.y, 0);
  const br = project(cam, right.x, right.y, 0);
  const tl = project(cam, left.x, left.y, 62);
  const tr = project(cam, right.x, right.y, 62);
  if (bl.depth < 5) return;

  quad(ctx, tl, tr, br, bl, '#4a4038');
  ctx.fillStyle = '#6b5c4d';
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(tr.x, tr.y + 6 * tr.scale);
  ctx.lineTo(tl.x, tl.y + 6 * tl.scale);
  ctx.closePath();
  ctx.fill();
}

/** O Carro visto de frente: é a única coisa que o jogador vê chegando. */
function drawCar(ctx: CanvasRenderingContext2D, game: Game, cam: Camera): void {
  const pose = carPose(game);
  const point = samplePath(pose.path, pose.s);
  const at = offsetPoint(point, pose.lat);
  const base = project(cam, at.x, at.y, 0);
  if (base.depth < 5) return;

  const palette = game.stage.biome.palette;
  const w = 2 * TUNING.carHalfWidth * base.scale;
  const bodyH = 34 * base.scale;
  const roofH = 22 * base.scale;
  const x = base.x - w / 2;
  const y = base.y - bodyH;

  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, w * 0.6, w * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.car;
  ctx.fillRect(x, y, w, bodyH);
  ctx.fillRect(x + w * 0.12, y - roofH, w * 0.76, roofH);

  ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
  ctx.fillRect(x + w * 0.18, y - roofH * 0.85, w * 0.64, roofH * 0.7);

  ctx.fillStyle = game.time < game.boostUntil ? '#fff2b0' : palette.accent;
  ctx.fillRect(x + w * 0.06, y + bodyH * 0.18, w * 0.2, bodyH * 0.26);
  ctx.fillRect(x + w * 0.74, y + bodyH * 0.18, w * 0.2, bodyH * 0.26);

  ctx.fillStyle = 'rgba(10, 14, 20, 0.9)';
  ctx.fillRect(x - w * 0.06, y + bodyH * 0.6, w * 0.14, bodyH * 0.45);
  ctx.fillRect(x + w * 0.92, y + bodyH * 0.6, w * 0.14, bodyH * 0.45);

  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, game: Game, input: Input): void {
  const w = ctx.canvas.width;
  const palette = game.stage.biome.palette;
  const s = trackProgress(game);

  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = palette.text;
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(`${game.stage.biome.name} · volta ${game.stage.lap + 1}`, 16, 30);

  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText(formatTime(game.time), 16, 62);

  ctx.font = '500 13px system-ui, sans-serif';
  ctx.globalAlpha = 0.75;
  ctx.fillText(
    game.best === null ? 'sem melhor tempo' : `melhor ${formatTime(game.best)}`,
    16,
    82,
  );
  ctx.fillText(`tentativa ${game.attempts + 1}`, 16, 100);
  ctx.globalAlpha = 1;

  // Progresso na Pista: a única pista visual de quanto falta, já que não se vê à frente.
  const done = Math.min(1, s / game.stage.track.path.length);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(16, 110, w - 32, 4);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(16, 110, (w - 32) * done, 4);

  drawNotes(ctx, game, s);
  drawBoost(ctx, game);

  if (game.detour) {
    banner(ctx, 'FORA DE ROTA', '#ff8a5b');
  } else if (game.banner) {
    banner(ctx, game.banner.text, palette.accent);
  }

  if (input.tilt !== 'on') {
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = palette.text;
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillText('arraste o polegar para posicionar o carro', w / 2, ctx.canvas.height - 16);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/**
 * As Notas: canal principal, na tela. O jogo é inteiramente jogável no mudo.
 * A barra mostra a distância que falta — é o que substitui enxergar a curva.
 */
function drawNotes(ctx: CanvasRenderingContext2D, game: Game, s: number): void {
  const notes = upcomingNotes(game.notes, s, 3);
  const w = ctx.canvas.width;
  let y = 140;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const remaining = note.s - s;
    const near = 1 - Math.min(1, remaining / TUNING.noteLookahead);
    const size = i === 0 ? 78 : 46;
    const alpha = i === 0 ? 1 : 0.55;

    drawNoteCard(ctx, note, w - 16 - size, y, size, alpha, near, remaining);
    y += size + 12;
  }
}

function drawNoteCard(
  ctx: CanvasRenderingContext2D,
  note: Note,
  x: number,
  y: number,
  size: number,
  alpha: number,
  near: number,
  remaining: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = note.kind === 'obstacle' ? 'rgba(255, 138, 91, 0.22)' : 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 12);
  ctx.fill();

  ctx.strokeStyle = note.kind === 'obstacle' ? '#ff8a5b' : '#ffffff';
  ctx.globalAlpha = alpha * (0.35 + near * 0.65);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = alpha;

  const cx = x + size / 2;
  const cy = y + size * 0.44;
  const arm = size * 0.22;

  ctx.strokeStyle = note.kind === 'obstacle' ? '#ff8a5b' : '#ffffff';
  ctx.lineWidth = Math.max(3, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (note.kind === 'turn') {
    // Seta na direção da Virada, com a severidade dentro: 1 é a curva mais fechada.
    ctx.beginPath();
    ctx.moveTo(cx - note.dir * arm, cy + arm * 0.6);
    ctx.quadraticCurveTo(cx + note.dir * arm * 0.4, cy + arm * 0.6, cx + note.dir * arm, cy - arm * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + note.dir * arm, cy - arm * 0.5);
    ctx.lineTo(cx + note.dir * arm * 0.35, cy - arm * 0.25);
    ctx.moveTo(cx + note.dir * arm, cy - arm * 0.5);
    ctx.lineTo(cx + note.dir * arm * 1.1, cy + arm * 0.2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.round(size * 0.26)}px system-ui, sans-serif`;
    ctx.fillText(String(note.severity), cx - note.dir * arm * 0.8, cy + arm * 0.2);
  } else {
    // Obstáculo: o lado bloqueado aparece cheio, o lado livre vazio.
    const half = size * 0.2;
    ctx.fillStyle = '#ff8a5b';
    ctx.fillRect(note.dir < 0 ? cx - half * 1.9 : cx + half * 0.1, cy - half, half * 1.8, half * 1.7);
    ctx.strokeRect(note.dir < 0 ? cx + half * 0.1 : cx - half * 1.9, cy - half, half * 1.8, half * 1.7);
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(size * 0.16)}px system-ui, sans-serif`;
  ctx.fillText(
    `${Math.max(0, Math.round(remaining / TUNING.pixelsPerMeter))}m`,
    x + size / 2,
    y + size * 0.88,
  );

  ctx.restore();
}

function drawBoost(ctx: CanvasRenderingContext2D, game: Game): void {
  const h = ctx.canvas.height;
  const ready = boostReady(game);
  const boosting = game.time < game.boostUntil;

  const label = boosting ? 'IMPULSO' : ready ? 'toque duplo · impulso' : 'recarregando';

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = boosting ? '#fff2b0' : ready ? '#ffffff' : 'rgba(255,255,255,0.4)';
  ctx.fillText(label, 16, h - 40);

  const width = 120;
  const charge = boosting
    ? 1
    : Math.min(1, 1 - Math.max(0, game.boostReadyAt - game.time) / TUNING.boostCooldown);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(16, h - 32, width, 5);
  ctx.fillStyle = boosting ? '#fff2b0' : '#ffffff';
  ctx.fillRect(16, h - 32, width * charge, 5);
  ctx.restore();
}

function banner(ctx: CanvasRenderingContext2D, text: string, color: string): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h * 0.72);
  ctx.restore();
}

function drawOverlay(ctx: CanvasRenderingContext2D, game: Game): void {
  if (game.phase === 'running') return;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const palette = game.stage.biome.palette;

  ctx.save();
  ctx.fillStyle = 'rgba(6, 8, 12, 0.72)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.text;

  if (game.phase === 'ready') {
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillText('RALLY', w / 2, h * 0.3);
    ctx.font = '500 15px system-ui, sans-serif';

    const lines = [
      'Você não vê a estrada.',
      'A câmera está à frente do carro, olhando para trás.',
      '',
      'As notas no canto avisam o que vem.',
      'Swipe na direção da curva, antes de chegar nela.',
      'Incline o celular para escolher o lado da pista.',
      'Toque duplo dá impulso — e encurta seu tempo de reação.',
      '',
      'Direção errada é batida. Tempo errado só custa segundos.',
    ];

    lines.forEach((line, i) => ctx.fillText(line, w / 2, h * 0.4 + i * 22));

    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillStyle = palette.accent;
    ctx.fillText('toque para começar', w / 2, h * 0.82);
  }

  if (game.phase === 'crashed') {
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillText('BATIDA', w / 2, h * 0.4);
    ctx.font = '500 16px system-ui, sans-serif';
    ctx.fillText(CRASH_TEXT[game.crashCause ?? 'borda'], w / 2, h * 0.47);
    ctx.font = '500 14px system-ui, sans-serif';
    ctx.globalAlpha = 0.7;
    ctx.fillText(`tentativa ${game.attempts + 1}`, w / 2, h * 0.54);
    ctx.globalAlpha = 1;
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillStyle = palette.accent;
    ctx.fillText('toque para repetir', w / 2, h * 0.66);
  }

  if (game.phase === 'finished') {
    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillText(game.isRecord ? 'MELHOR TEMPO' : 'CHEGADA', w / 2, h * 0.38);
    ctx.font = '700 40px system-ui, sans-serif';
    ctx.fillText(formatTime(game.lastTime ?? 0), w / 2, h * 0.48);

    if (!game.isRecord && game.best !== null) {
      ctx.font = '500 15px system-ui, sans-serif';
      ctx.globalAlpha = 0.75;
      ctx.fillText(`melhor ${formatTime(game.best)}`, w / 2, h * 0.55);
      ctx.globalAlpha = 1;
    }

    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillStyle = palette.accent;
    ctx.fillText('toque para a próxima etapa', w / 2, h * 0.68);
  }

  ctx.restore();
}

const CRASH_TEXT: Record<string, string> = {
  direcao: 'virou para o lado errado',
  borda: 'não virou — e essa curva não perdoava',
  obstaculo: 'passou por cima do obstáculo',
};

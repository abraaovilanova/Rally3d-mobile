import { TUNING } from './tuning';

/** Um ponto amostrado de um Caminho. `curv` é a curvatura com sinal (1/raio). */
export interface PathPoint {
  x: number;
  y: number;
  heading: number;
  curv: number;
  s: number;
}

/** Um traçado percorrível: a Pista de uma Etapa é um Caminho, cada Desvio também. */
export interface Path {
  points: PathPoint[];
  length: number;
}

/**
 * Percorre um Caminho enquanto ele é construído, largando um ponto a cada `pathStep`.
 * Guarda a ponta (posição e direção) para que o próximo trecho continue dela.
 */
export class PathBuilder {
  private points: PathPoint[] = [];
  private s = 0;

  constructor(
    private x = 0,
    private y = 0,
    private heading = 0,
  ) {
    this.points.push({ x, y, heading, curv: 0, s: 0 });
  }

  get tip(): PathPoint {
    return this.points[this.points.length - 1];
  }

  straight(length: number): void {
    this.walk(length, 0);
  }

  /**
   * `dir` é -1 para esquerda e 1 para direita; `arc` em radianos.
   * O mundo tem y para cima, então virar à direita é diminuir a direção — daí o sinal.
   */
  curve(radius: number, arc: number, dir: -1 | 1): void {
    this.walk(radius * arc, -dir / radius);
  }

  /** Avança `length` px com curvatura constante, amostrando de `pathStep` em `pathStep`. */
  private walk(length: number, curv: number): void {
    const steps = Math.max(1, Math.round(length / TUNING.pathStep));
    const step = length / steps;

    for (let i = 0; i < steps; i++) {
      this.heading += curv * step;
      this.x += Math.cos(this.heading) * step;
      this.y += Math.sin(this.heading) * step;
      this.s += step;
      this.points.push({ x: this.x, y: this.y, heading: this.heading, curv, s: this.s });
    }
  }

  build(): Path {
    return { points: this.points, length: this.s };
  }
}

/**
 * O ponto do Caminho na distância `s`. Fora das pontas, extrapola em linha reta —
 * a Câmera Invertida fica à frente do Carro e passa da Linha de Chegada antes dele.
 */
export function samplePath(path: Path, s: number): PathPoint {
  const pts = path.points;

  if (s <= 0) return extrapolate(pts[0], s);
  if (s >= path.length) return extrapolate(pts[pts.length - 1], s - path.length);

  const idx = Math.min(pts.length - 2, Math.floor((s / path.length) * (pts.length - 1)));
  const a = pts[idx];
  const b = pts[idx + 1];
  const span = b.s - a.s;
  const t = span > 0 ? (s - a.s) / span : 0;

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    heading: a.heading + (b.heading - a.heading) * t,
    curv: a.curv,
    s,
  };
}

function extrapolate(from: PathPoint, by: number): PathPoint {
  return {
    x: from.x + Math.cos(from.heading) * by,
    y: from.y + Math.sin(from.heading) * by,
    heading: from.heading,
    curv: 0,
    s: from.s + by,
  };
}

/** O ponto a `lat` px à direita da Linha Central (à esquerda se negativo). */
export function offsetPoint(p: PathPoint, lat: number): { x: number; y: number } {
  return {
    x: p.x + Math.sin(p.heading) * lat,
    y: p.y - Math.cos(p.heading) * lat,
  };
}

/**
 * Um Caminho em curva de Bézier entre duas pontas, usado pelos Desvios.
 * Reamostra por comprimento de arco para os pontos ficarem igualmente espaçados.
 */
export function bezierPath(
  from: PathPoint,
  to: PathPoint,
  reach: number,
): Path {
  const p0 = { x: from.x, y: from.y };
  const p1 = {
    x: from.x + Math.cos(from.heading) * reach,
    y: from.y + Math.sin(from.heading) * reach,
  };
  const p2 = { x: to.x - Math.cos(to.heading) * reach, y: to.y - Math.sin(to.heading) * reach };
  const p3 = { x: to.x, y: to.y };

  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  };

  // Amostragem densa para medir o comprimento, depois reamostragem uniforme.
  const fine = 600;
  const raw: { x: number; y: number; s: number }[] = [];
  let total = 0;
  let prev = at(0);
  raw.push({ ...prev, s: 0 });

  for (let i = 1; i <= fine; i++) {
    const p = at(i / fine);
    total += Math.hypot(p.x - prev.x, p.y - prev.y);
    raw.push({ ...p, s: total });
    prev = p;
  }

  const points: PathPoint[] = [];
  const steps = Math.max(2, Math.round(total / TUNING.pathStep));
  let cursor = 0;

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * total;
    while (cursor < raw.length - 2 && raw[cursor + 1].s < s) cursor++;
    const a = raw[cursor];
    const b = raw[cursor + 1];
    const span = b.s - a.s;
    const t = span > 0 ? (s - a.s) / span : 0;
    points.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      heading: 0,
      curv: 0,
      s,
    });
  }

  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    points[i].heading = Math.atan2(b.y - a.y, b.x - a.x);
  }

  return { points, length: total };
}

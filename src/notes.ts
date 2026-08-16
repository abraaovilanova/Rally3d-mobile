import type { Track } from './track';
import { TUNING } from './tuning';

/**
 * A Nota avisa de tudo que pode matar o jogador, e de nada mais.
 * Por isso ela não distingue Bifurcação de curva comum: não virar numa Bifurcação
 * custa Tempo, não a Corrida. Ver docs/adr/0002-notas-como-contrato-de-justica.md
 */
export interface Note {
  /** A distância da Pista a que a Nota se refere. */
  s: number;
  kind: 'turn' | 'obstacle';
  dir: -1 | 1;
  /** 1 é a curva mais fechada, 6 a mais aberta. Só para Viradas. */
  severity: number;
  spoken: string;
}

export function buildNotes(track: Track): Note[] {
  const notes: Note[] = [];

  for (const turn of track.turns) {
    const severity = severityFor(turn.radius);
    notes.push({
      s: turn.sEntry,
      kind: 'turn',
      dir: turn.dir,
      severity,
      spoken: `${turn.dir < 0 ? 'esquerda' : 'direita'} ${SPOKEN_NUMBERS[severity]}`,
    });
  }

  for (const obstacle of track.obstacles) {
    const dir: -1 | 1 = obstacle.lat < 0 ? -1 : 1;
    notes.push({
      s: obstacle.s,
      kind: 'obstacle',
      dir,
      severity: 0,
      spoken: `pedra à ${dir < 0 ? 'esquerda' : 'direita'}`,
    });
  }

  return notes.sort((a, b) => a.s - b.s);
}

const SPOKEN_NUMBERS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis'];

/** Escala de rally: número baixo é curva fechada. */
function severityFor(radius: number): number {
  if (radius < 330) return 1;
  if (radius < 430) return 2;
  if (radius < 550) return 3;
  if (radius < 680) return 4;
  if (radius < 800) return 5;
  return 6;
}

/** As Notas visíveis agora, da mais próxima para a mais distante. */
export function upcomingNotes(notes: Note[], s: number, max: number): Note[] {
  const visible: Note[] = [];

  for (const note of notes) {
    if (note.s < s) continue;
    if (note.s - s > TUNING.noteLookahead) break;
    visible.push(note);
    if (visible.length === max) break;
  }

  return visible;
}

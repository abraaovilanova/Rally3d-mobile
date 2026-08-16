/** O Melhor Tempo pertence à Etapa. Comparar Etapas diferentes não significa nada. */
const KEY = 'rally-mobile:best';

type Records = Record<string, number>;

function load(): Records {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Records;
  } catch {
    return {};
  }
}

export function bestTime(stageId: string): number | null {
  return load()[stageId] ?? null;
}

/** Grava se for melhor. Devolve true quando o recorde caiu. */
export function recordTime(stageId: string, time: number): boolean {
  const records = load();
  const previous = records[stageId];

  if (previous !== undefined && previous <= time) return false;

  records[stageId] = time;
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // Sem armazenamento (aba privada): o jogo continua, só não guarda recorde.
  }
  return true;
}

export function formatTime(seconds: number): string {
  const whole = Math.floor(seconds);
  const hundredths = Math.floor((seconds - whole) * 100);
  return `${whole}.${hundredths.toString().padStart(2, '0')}s`;
}

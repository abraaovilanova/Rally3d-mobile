import { buildTrack, type Track } from './track';
import { TUNING } from './tuning';

export interface Palette {
  sky: string;
  ground: string;
  road: string;
  roadAlt: string;
  rumble: string;
  rumbleAlt: string;
  edge: string;
  post: string;
  car: string;
  text: string;
  accent: string;
  /** Asfalto do Desvio: o Fora de Rota é visível desde o instante da entrada. */
  offRoute: string;
}

/** A identidade visual de uma Etapa e o caráter base da sua Pista. */
export interface Biome {
  id: string;
  name: string;
  palette: Palette;
}

export const BIOMES: readonly Biome[] = [
  {
    id: 'deserto',
    name: 'Deserto',
    palette: {
      sky: '#241a12',
      ground: '#3a2a1a',
      road: '#4a3c28',
      roadAlt: '#443725',
      rumble: '#e8b04b',
      rumbleAlt: '#2b2118',
      edge: '#e8b04b',
      post: '#c08a3a',
      car: '#f6f2e9',
      text: '#f6f2e9',
      accent: '#ffcf6b',
      offRoute: '#211a12',
    },
  },
  {
    id: 'floresta',
    name: 'Floresta',
    palette: {
      sky: '#0d1a12',
      ground: '#14301f',
      road: '#26362b',
      roadAlt: '#223028',
      rumble: '#6fe38a',
      rumbleAlt: '#16241b',
      edge: '#6fe38a',
      post: '#4aa863',
      car: '#f2fff5',
      text: '#f2fff5',
      accent: '#8dffa8',
      offRoute: '#101a14',
    },
  },
  {
    id: 'gelo',
    name: 'Gelo',
    palette: {
      sky: '#0d1620',
      ground: '#1a2a38',
      road: '#2b3c4c',
      roadAlt: '#263644',
      rumble: '#7fd6ff',
      rumbleAlt: '#182634',
      edge: '#7fd6ff',
      post: '#4f9dc4',
      car: '#eaf6ff',
      text: '#eaf6ff',
      accent: '#a8e6ff',
      offRoute: '#121c26',
    },
  },
];

/** Uma Etapa: o que o jogador de fato joga, e a chave do seu Melhor Tempo. */
export interface Stage {
  id: string;
  biome: Biome;
  /** Quantos ciclos completos de Biomas o jogador já percorreu. */
  lap: number;
  track: Track;
}

export function makeStage(biomeIndex: number, lap: number): Stage {
  const biome = BIOMES[biomeIndex];
  const id = `${biome.id}-l${lap}`;

  const track = buildTrack({
    stageId: id,
    width: stepped(TUNING.escalationWidths, lap),
    window: stepped(TUNING.escalationWindows, lap),
    length: TUNING.trackLength,
    // Expoente > 1 empurra os raios sorteados para baixo: curvas mais fechadas.
    curveBias: 1 + Math.min(lap, 4) * 0.35,
  });

  return { id, biome, lap, track };
}

/** A Escalada anda pelos degraus até o piso e para ali. */
function stepped(values: readonly number[], lap: number): number {
  return values[Math.min(lap, values.length - 1)];
}

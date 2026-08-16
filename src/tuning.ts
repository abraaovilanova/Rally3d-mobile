/**
 * Todos os números que definem a sensação do jogo, num lugar só.
 * Distâncias em px de Pista; tempos em segundos.
 */
export const TUNING = {
  /**
   * Comprimento da Pista, em px. Fixo — a distância é igual para todos e o Tempo é o
   * que varia. A ~520 px/s dá os ~40s de Etapa que o CONTEXT.md pede: curta o bastante
   * para ser decorada numa sessão, que é o que a Câmera Invertida exige.
   */
  trackLength: 20800,

  /** Velocidade de cruzeiro do Carro, em px/s. Ele nunca para. */
  baseSpeed: 520,

  /** Aceleração de recuperação depois de uma raspada, em px/s². */
  recoverAccel: 300,

  /**
   * Multiplicador de velocidade ao executar uma Virada fora da Janela.
   * Raspar custa Tempo e nunca a Corrida — quem erra o instante perde o relógio,
   * quem erra a direção perde a Corrida.
   */
  scrapeFactor: 0.55,

  /** Multiplicador de velocidade durante o Impulso. */
  boostFactor: 1.45,

  /** Duração do Impulso, em segundos. */
  boostDuration: 2.5,

  /** Recarga do Impulso, contada a partir do fim dele, em segundos. */
  boostCooldown: 6,

  /**
   * Largura da Pista por Volta, em px. Último valor é o piso da Escalada.
   * Estreitar reduz a margem da Posição Lateral e aperta o desvio de Obstáculos.
   */
  escalationWidths: [240, 214, 194, 178, 166] as readonly number[],

  /**
   * Comprimento da Janela por Volta, em px de Pista. É o quanto antes da curva o
   * swipe conta como limpo. A 520 px/s, 260px são meio segundo de tolerância.
   * A Escalada encurta a Janela — mas nunca a antecedência da Nota, que é informação
   * e não execução. Ver docs/adr/0002-notas-como-contrato-de-justica.md
   */
  escalationWindows: [300, 270, 245, 225, 210] as readonly number[],

  /**
   * Quão antes da Janela um swipe ainda é atribuído à próxima Virada, em múltiplos do
   * comprimento da Janela. Fora disso o gesto é ignorado: um swipe solto no meio de uma
   * reta não pode matar o jogador por uma curva que ainda está longe.
   */
  turnAttentionSpan: 2.5,

  /** Fração das curvas que são Bifurcação — as que perdoam a ausência de Virada. */
  forkChance: 0.34,

  /** Quantos Obstáculos uma Etapa tem. */
  obstaclesPerStage: 5,

  /** Meia-largura de um Obstáculo, em px. */
  obstacleHalfWidth: 52,

  /** Meia-largura do Carro para colisão, em px. */
  carHalfWidth: 26,

  /** Distância entre pontos de um Caminho, em px. Menor = curvas mais lisas. */
  pathStep: 8,

  /** Reta inicial antes da primeira Virada, em px. Espaço para a primeira Nota sair. */
  runInLength: 1400,

  /** Reta final depois da última Virada, em px. */
  runOutLength: 900,

  /** Faixa de comprimento das retas entre curvas, em px. */
  straightLength: [850, 1700] as [number, number],

  /** Faixa de raio das curvas, em px. Raio menor = severidade menor na Nota. */
  curveRadius: [280, 900] as [number, number],

  /** Faixa de arco das curvas, em graus. */
  curveArc: [45, 115] as [number, number],

  /** Quanto o Desvio precisa ser mais longo que o trecho da Pista que ele substitui. */
  detourMinRatio: 1.35,

  /**
   * Antecedência da Nota, em px de Pista. Medida em distância e não em segundos para
   * continuar suficiente em qualquer velocidade — inclusive sob Impulso.
   */
  noteLookahead: 2100,

  /** Quantos px de Pista valem um "metro" na leitura das Notas. */
  pixelsPerMeter: 10,

  /** Distância da Câmera Invertida à frente do Carro, em px. */
  cameraAhead: 420,

  /** Altura da Câmera acima da Pista, em px. */
  cameraHeight: 130,

  /** Quanto a Câmera acompanha a Posição Lateral do Carro (0 = fixa no meio). */
  cameraLateralFollow: 0.55,

  /** Distância de Pista visível ao fundo, em px. */
  viewDistance: 3400,

  /** Altura do horizonte na tela, como fração da altura. */
  horizonAt: 0.4,

  /** Distância focal como fração da largura da tela. */
  focalRatio: 1.35,

  /** Comprimento de uma faixa da zebra da borda, em px. */
  rumbleLength: 110,

  /** Inclinação, em graus, que leva o Carro à borda da margem lateral. */
  tiltRange: 22,

  /** Quantos px de arrasto do polegar equivalem à inclinação máxima. */
  dragRange: 130,

  /** Suavização da Posição Lateral: fração da diferença resolvida por segundo. */
  lateralSmoothing: 9,

  /** Deslocamento mínimo, em px de tela, para um gesto contar como swipe. */
  swipeThreshold: 34,

  /** Janela de tempo entre dois toques para valer Impulso, em segundos. */
  doubleTapWindow: 0.32,
} as const;

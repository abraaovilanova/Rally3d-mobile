import { TUNING } from './tuning';

export type TiltState = 'off' | 'on' | 'denied' | 'unavailable';

/**
 * Os três controles do jogo, e nada mais:
 * swipe = Virada, inclinação (ou arrasto) = Posição Lateral, toque duplo = Impulso.
 *
 * A Inclinação sempre tem o arrasto como caminho equivalente, porque a permissão de
 * sensor pode ser negada — o arrasto é normal, não um modo reduzido.
 */
export interface Input {
  /** -1 (esquerda) a 1 (direita), no referencial do Carro. */
  lateral: number;
  tilt: TiltState;
  takeSwipe(): -1 | 1 | 0;
  takeBoost(): boolean;
  takeTap(): boolean;
  requestTilt(): Promise<void>;
}

interface Touch0 {
  id: number;
  x: number;
  y: number;
  at: number;
  swiped: boolean;
  base: number;
}

export function createInput(target: HTMLElement): Input {
  let lateral = 0;
  let tilt: TiltState = 'off';
  let swipe: -1 | 1 | 0 = 0;
  let boost = false;
  let tap = false;

  let touch: Touch0 | null = null;
  let lastTapAt = -1;
  let tiltZero: number | null = null;

  const now = () => performance.now() / 1000;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));

  target.addEventListener(
    'touchstart',
    (e) => {
      const t = e.changedTouches[0];
      touch = { id: t.identifier, x: t.clientX, y: t.clientY, at: now(), swiped: false, base: lateral };
      e.preventDefault();
    },
    { passive: false },
  );

  target.addEventListener(
    'touchmove',
    (e) => {
      if (!touch) return;
      const t = Array.from(e.changedTouches).find((c) => c.identifier === touch!.id);
      if (!t) return;

      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;

      // Um swipe é um gesto *rápido*: só o que sai da soleira em menos de 250ms conta.
      // Depois disso o mesmo dedo vira controle de Posição Lateral, e os dois não brigam.
      const quick = now() - touch.at < 0.25;

      if (!touch.swiped && quick && Math.abs(dx) > TUNING.swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
        swipe = dx > 0 ? 1 : -1;
        touch.swiped = true;
        touch.x = t.clientX;
        touch.base = lateral;
      } else if (tilt !== 'on') {
        lateral = clamp(touch.base + dx / TUNING.dragRange);
      }

      e.preventDefault();
    },
    { passive: false },
  );

  const endTouch = (e: TouchEvent) => {
    if (!touch) return;
    const t = Array.from(e.changedTouches).find((c) => c.identifier === touch!.id);
    if (!t) return;

    const moved = Math.hypot(t.clientX - touch.x, t.clientY - touch.y);
    const quick = now() - touch.at < 0.3;

    if (!touch.swiped && quick && moved < TUNING.swipeThreshold) {
      tap = true;
      if (now() - lastTapAt < TUNING.doubleTapWindow) {
        boost = true;
        lastTapAt = -1;
      } else {
        lastTapAt = now();
      }
    }

    touch = null;
    e.preventDefault();
  };

  target.addEventListener('touchend', endTouch, { passive: false });
  target.addEventListener('touchcancel', endTouch, { passive: false });

  // Teclado: só para desenvolver no desktop. O jogo é de celular.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') swipe = -1;
    if (e.key === 'ArrowRight') swipe = 1;
    if (e.key === 'a') lateral = clamp(lateral - 0.2);
    if (e.key === 'd') lateral = clamp(lateral + 0.2);
    if (e.key === ' ') boost = true;
    if (e.key === 'Enter' || e.key === 'r') tap = true;
  });

  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma === null) return;
    if (tiltZero === null) tiltZero = e.gamma;
    tilt = 'on';
    lateral = clamp((e.gamma - tiltZero) / TUNING.tiltRange);
  };

  const requestTilt = async (): Promise<void> => {
    const api = (
      window as unknown as {
        DeviceOrientationEvent?: { requestPermission?: () => Promise<PermissionState> };
      }
    ).DeviceOrientationEvent;

    if (!api) {
      tilt = 'unavailable';
      return;
    }

    // iOS 13+ exige permissão explícita, a partir de um gesto e em HTTPS.
    // Negar é um caminho previsto: o arrasto continua valendo.
    if (typeof api.requestPermission === 'function') {
      try {
        const granted = await api.requestPermission();
        if (granted !== 'granted') {
          tilt = 'denied';
          return;
        }
      } catch {
        tilt = 'denied';
        return;
      }
    }

    tiltZero = null;
    window.addEventListener('deviceorientation', onOrientation);
  };

  return {
    get lateral() {
      return lateral;
    },
    get tilt() {
      return tilt;
    },
    takeSwipe() {
      const s = swipe;
      swipe = 0;
      return s;
    },
    takeBoost() {
      const b = boost;
      boost = false;
      return b;
    },
    takeTap() {
      const t = tap;
      tap = false;
      return t;
    },
    requestTilt,
  };
}

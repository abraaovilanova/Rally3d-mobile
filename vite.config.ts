import { defineConfig } from 'vite';

export default defineConfig({
  // O GitHub Pages serve o projeto em /Rally3d-mobile/, não na raiz do domínio.
  base: '/Rally3d-mobile/',

  // O jogo depende de sensor de inclinação, que só existe em contexto seguro.
  // No Pages isso vem de graça (HTTPS); em rede local, use um túnel HTTPS.
  server: { host: true },
});

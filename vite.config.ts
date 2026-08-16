import { defineConfig } from 'vite';

export default defineConfig({
  // O jogo depende de sensor de inclinação, que só existe em contexto seguro.
  // `npm run dev -- --https` ou um túnel HTTPS para testar no celular de verdade.
  server: { host: true },
});

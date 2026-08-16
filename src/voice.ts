/**
 * A voz do navegador é o canal de reforço da Nota, nunca o principal:
 * a maioria joga celular no mudo, e o jogo tem de ser inteiramente jogável assim.
 * Ver docs/adr/0002-notas-como-contrato-de-justica.md
 */
let voice: SpeechSynthesisVoice | null = null;
let enabled = true;

export function primeVoice(): void {
  if (typeof speechSynthesis === 'undefined') {
    enabled = false;
    return;
  }

  const pick = () => {
    const voices = speechSynthesis.getVoices();
    voice = voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ?? voices[0] ?? null;
  };

  pick();
  speechSynthesis.addEventListener('voiceschanged', pick);
}

export function speak(text: string): void {
  if (!enabled || typeof speechSynthesis === 'undefined') return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.25;
  utterance.volume = 0.9;
  if (voice) utterance.voice = voice;

  // Uma Nota atrasada é pior que Nota nenhuma: a nova cancela a anterior.
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function silence(): void {
  if (enabled && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

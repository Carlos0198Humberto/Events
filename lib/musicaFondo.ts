// ─── Música de fondo con la voz siempre por encima ────────────────────────────
//
// El mismo criterio que la invitación (app/confirmar/[token]): la música va
// suave siempre y casi muda mientras suena una voz (un deseo grabado, el video
// del anfitrión). Baja y sube con un fundido, y entre una voz y la siguiente no
// vuelve a subir enseguida, para que no "bombee".
//
// iPhone y iPad ignoran audio.volume (la pista sonaba al 100 %): ahí el <audio>
// pasa por un mezclador de Web Audio (GainNode), el único volumen que iOS
// respeta. Se arma dentro de un toque (iOS lo exige) y solo donde hace falta.
// El archivo viene de Supabase Storage con CORS abierto: el <audio> necesita
// crossOrigin="anonymous" o Web Audio daría silencio.

export const MUSICA_BASE = 0.18;
export const MUSICA_BAJO_VOZ = 0.025;
const FUNDIDO_S = 0.45;
const ESPERA_VOLVER_MS = 1200;

let volumenControlable: boolean | null = null;
function puedeControlarVolumen() {
  if (volumenControlable === null) {
    try { const a = new Audio(); a.volume = 0.5; volumenControlable = Math.abs(a.volume - 0.5) < 0.01; }
    catch { volumenControlable = true; }
  }
  return volumenControlable;
}

export class MezclaMusica {
  private mezcla: { ctx: AudioContext; ganancia: GainNode } | null = null;
  private volverTimer: ReturnType<typeof setTimeout> | null = null;
  private objetivo = MUSICA_BASE;

  constructor(private audio: HTMLAudioElement) {
    audio.volume = MUSICA_BASE;
  }

  /** iPhone: conecta la música al mezclador. Llamar dentro de un toque. */
  preparar() {
    if (puedeControlarVolumen()) return;
    if (this.mezcla) { this.mezcla.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const ganancia = ctx.createGain();
      ganancia.gain.value = this.objetivo;
      ctx.createMediaElementSource(this.audio).connect(ganancia).connect(ctx.destination);
      ctx.resume().catch(() => {});
      this.mezcla = { ctx, ganancia };
      // Al volver a la pestaña iOS deja el mezclador "interrumpido"
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") this.mezcla?.ctx.resume().catch(() => {});
      });
    } catch { /* sin Web Audio: la música queda con su volumen */ }
  }

  private fundir(objetivo: number) {
    this.objetivo = objetivo;
    if (this.mezcla) {
      const g = this.mezcla.ganancia.gain;
      const t = this.mezcla.ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(objetivo, t + FUNDIDO_S);
      return;
    }
    if (puedeControlarVolumen()) this.audio.volume = objetivo;
  }

  /** Mientras suena una voz, la música queda casi muda; al terminar vuelve sola. */
  bajoVoz(hablando: boolean) {
    if (this.volverTimer) { clearTimeout(this.volverTimer); this.volverTimer = null; }
    if (hablando) { this.fundir(MUSICA_BAJO_VOZ); return; }
    this.volverTimer = setTimeout(() => { this.volverTimer = null; this.fundir(MUSICA_BASE); }, ESPERA_VOLVER_MS);
  }
}

/**
 * Abre un link de WhatsApp (wa.me) en una nueva pestaña y cierra
 * esa pestaña después de 1.5s — evita la pantalla blanca en iOS Safari
 * que queda después de que el browser redirige a la app de WhatsApp.
 */
export function openWhatsApp(url: string) {
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (tab) {
    setTimeout(() => {
      try { tab.close(); } catch (_) { /* tab ya cerrada o bloqueada */ }
    }, 1500);
  } else {
    // Fallback: popup bloqueado por el browser → navegación directa
    window.location.href = url;
  }
}

/**
 * Abre un link de WhatsApp (wa.me) en otra pestaña sin sacar al usuario de la
 * app.
 *
 * Antes se abría con "noopener,noreferrer", pero con "noopener" window.open
 * devuelve SIEMPRE null (así lo define el estándar): el código creía que el
 * navegador había bloqueado la ventana y además navegaba la página actual a
 * WhatsApp. El organizador perdía su panel y "Enviar a todos" se cortaba
 * después del primero.
 *
 * - Se abre sin "noopener" y se corta `opener` a mano: misma protección.
 * - Un `destino` con nombre reutiliza siempre la misma pestaña (envío en grupo:
 *   una pestaña de WhatsApp, no una por invitado).
 * - En el celular la pestaña queda en blanco cuando la app de WhatsApp toma el
 *   control (iOS Safari): se cierra a los 1,5 s. En la compu no, porque ahí
 *   vive WhatsApp Web.
 * - Solo si el navegador bloqueó la ventana se navega en esta misma pestaña.
 */
export function openWhatsApp(url: string, destino = "_blank") {
  const tab = window.open(url, destino);
  if (!tab) {
    window.location.href = url;
    return;
  }
  try { tab.opener = null; tab.focus(); } catch (_) { /* pestaña de otro origen */ }
  const tactil = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (tactil) {
    setTimeout(() => {
      try { tab.close(); } catch (_) { /* tab ya cerrada o bloqueada */ }
    }, 1500);
  }
}

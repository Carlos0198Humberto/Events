// ─── Transmisión en vivo (el culto, la ceremonia) ─────────────────────────────
//
// El organizador pega el enlace que le dio la iglesia o el canal. YouTube y los
// videos de Facebook se ven dentro del muro (reproductor incrustado); cualquier
// otro enlace (Zoom, Instagram, TikTok, la página de Facebook de la iglesia…)
// va como botón que abre la transmisión. Un canal de YouTube escrito con
// @nombre tampoco se puede incrustar: YouTube pide el ID del canal (UC…).

export type Transmision = {
  plataforma: "youtube" | "facebook" | "otra";
  /** Dirección para el reproductor, o null si solo se puede abrir */
  embed: string | null;
  /** El enlace tal como lo pegó el organizador, para abrirlo en su app */
  ver: string;
  /** "YouTube", "Facebook" o "la transmisión" (para "Abrir en …") */
  nombre: string;
};

const idValido = (s?: string | null) => (s && /^[\w-]{11}$/.test(s) ? s : null);

function idYouTube(u: URL, host: string): string | null {
  if (host === "youtu.be") return idValido(u.pathname.slice(1).split("/")[0]);
  const v = idValido(u.searchParams.get("v"));
  if (v) return v;
  return idValido(/^\/(?:live|embed|shorts|v)\/([\w-]{11})/.exec(u.pathname)?.[1]);
}

/** Lo que se puede hacer con el enlace de la transmisión, o null si no es un enlace https. */
export function transmisionDe(enlace?: string | null): Transmision | null {
  const texto = (enlace ?? "").trim();
  let u: URL;
  try { u = new URL(texto); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|web)\./, "");

  if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
    const id = idYouTube(u, host);
    if (id) return { plataforma: "youtube", embed: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`, ver: texto, nombre: "YouTube" };
    // El canal con su ID muestra solo lo que esté en vivo en ese momento
    const canal = /^\/channel\/(UC[\w-]{22})(?:\/|$)/.exec(u.pathname)?.[1];
    if (canal) return { plataforma: "youtube", embed: `https://www.youtube.com/embed/live_stream?channel=${canal}`, ver: texto, nombre: "YouTube" };
    return { plataforma: "youtube", embed: null, ver: texto, nombre: "YouTube" };
  }

  if (host === "fb.watch" || host === "facebook.com" || host.endsWith(".facebook.com")) {
    // Solo un VIDEO se incrusta; la página de la iglesia se abre aparte
    const esVideo = host === "fb.watch" || /\/videos\/|\/watch|\/live|\/reel\//.test(u.pathname);
    return {
      plataforma: "facebook",
      embed: esVideo ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(texto)}&show_text=false&width=560` : null,
      ver: texto,
      nombre: "Facebook",
    };
  }

  return { plataforma: "otra", embed: null, ver: texto, nombre: "la transmisión" };
}

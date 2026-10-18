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

// ─── Un video del anfitrión, pegado como enlace ───────────────────────────────
//
// El resumen del día, el saludo del graduado, el reel de la fiesta: el
// organizador pega el enlace de donde lo subió y se ve DENTRO de la página
// (el muro y la invitación a distancia). Cada plataforma tiene su reproductor
// incrustable; los cortos (Shorts, TikTok, reels) son verticales. Un archivo
// directo (.mp4, .webm, .mov) va en el reproductor del navegador. Lo que no se
// puede incrustar (un enlace corto de TikTok, un perfil) queda como botón.

export type VideoEnlace = {
  plataforma: "youtube" | "facebook" | "tiktok" | "instagram" | "drive" | "vimeo" | "archivo" | "otra";
  /** Dirección del reproductor incrustado (iframe), o null */
  embed: string | null;
  /** Dirección del archivo para <video>, o null */
  archivo: string | null;
  /** El enlace tal como lo pegó el organizador, para abrirlo en su app */
  ver: string;
  /** "YouTube", "TikTok"…: para «Abrir en …» */
  nombre: string;
  /** 9:16 en vez de 16:9 (Shorts, TikTok, reels) */
  vertical: boolean;
  /** Imagen para mostrar antes de reproducir (solo YouTube la da sin pedir nada) */
  miniatura: string | null;
};

const EXT_VIDEO = /\.(mp4|m4v|webm|mov)$/i;

/** Cómo se ve el video de ese enlace, o null si no es un enlace https. */
export function videoDe(enlace?: string | null): VideoEnlace | null {
  const texto = (enlace ?? "").trim();
  let u: URL;
  try { u = new URL(texto); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m|web|mobile)\./, "");
  const base = { ver: texto, embed: null, archivo: null, vertical: false, miniatura: null };

  if (EXT_VIDEO.test(u.pathname)) return { ...base, plataforma: "archivo", archivo: texto, nombre: "el video" };

  if (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com")) {
    const id = idYouTube(u, host);
    if (!id) return { ...base, plataforma: "youtube", nombre: "YouTube" };
    return {
      ...base,
      plataforma: "youtube",
      nombre: "YouTube",
      embed: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
      vertical: /^\/shorts\//.test(u.pathname),
      miniatura: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host === "fb.watch" || host === "facebook.com" || host.endsWith(".facebook.com")) {
    const reel = /\/reels?\//.test(u.pathname);
    const esVideo = host === "fb.watch" || reel || /\/videos\/|\/watch|\/share\/v\//.test(u.pathname);
    return {
      ...base,
      plataforma: "facebook",
      nombre: "Facebook",
      embed: esVideo ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(texto)}&show_text=false${reel ? "" : "&width=560"}` : null,
      vertical: reel,
    };
  }

  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    // El enlace completo trae el número del video; el corto (vm.tiktok.com/…) no.
    // El reproductor oficial (player/v1) muestra solo el video, sin la descripción;
    // rel=0: al terminar sugiere videos del mismo autor, no de cualquiera
    const id = /\/video\/(\d{8,25})/.exec(u.pathname)?.[1] ?? /^\/(?:embed(?:\/v2)?|player\/v1)\/(\d{8,25})/.exec(u.pathname)?.[1];
    return { ...base, plataforma: "tiktok", nombre: "TikTok", embed: id ? `https://www.tiktok.com/player/v1/${id}?rel=0` : null, vertical: true };
  }

  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    const m = /^\/(?:[\w.]+\/)?(p|reels?|tv)\/([\w-]{5,40})/.exec(u.pathname);
    const tipo = m ? (m[1].startsWith("reel") ? "reel" : m[1]) : null;
    return { ...base, plataforma: "instagram", nombre: "Instagram", embed: m ? `https://www.instagram.com/${tipo}/${m[2]}/embed` : null, vertical: true };
  }

  if (host === "drive.google.com") {
    const id = /^\/file\/d\/([\w-]{10,})/.exec(u.pathname)?.[1] ?? (/^\/(open|uc)$/.test(u.pathname) ? u.searchParams.get("id") : null);
    return { ...base, plataforma: "drive", nombre: "Google Drive", embed: id && /^[\w-]{10,}$/.test(id) ? `https://drive.google.com/file/d/${id}/preview` : null };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    // vimeo.com/123456789, vimeo.com/123456789/abcdef (oculto), player.vimeo.com/video/123456789
    const m = /^\/(?:video\/)?(\d{6,12})(?:\/([\da-f]{6,20}))?/.exec(u.pathname);
    const h = m?.[2] ?? u.searchParams.get("h");
    return { ...base, plataforma: "vimeo", nombre: "Vimeo", embed: m ? `https://player.vimeo.com/video/${m[1]}${h && /^[\da-f]+$/.test(h) ? `?h=${h}` : ""}` : null };
  }

  return { ...base, plataforma: "otra", nombre: "el video" };
}

import { describe, expect, it } from "vitest";
import { transmisionDe, videoDe } from "@/lib/transmision";

describe("transmisión en vivo", () => {
  it("incrusta cualquier forma de enlace a un video de YouTube", () => {
    const id = "dQw4w9WgXcQ";
    for (const url of [
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=abc`,
      `https://m.youtube.com/watch?v=${id}&t=30`,
      `https://www.youtube.com/live/${id}`,
      `https://youtube.com/shorts/${id}`,
      `https://www.youtube.com/embed/${id}`,
    ]) {
      const t = transmisionDe(url);
      expect(t?.plataforma).toBe("youtube");
      expect(t?.embed).toBe(`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`);
      expect(t?.ver).toBe(url);
    }
  });

  it("un canal con su ID muestra lo que esté en vivo; con @nombre solo se abre", () => {
    const canal = transmisionDe("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv/live");
    expect(canal?.embed).toBe("https://www.youtube.com/embed/live_stream?channel=UCabcdefghijklmnopqrstuv");
    const arroba = transmisionDe("https://www.youtube.com/@IglesiaCentral/live");
    expect([arroba?.plataforma, arroba?.embed]).toEqual(["youtube", null]);
  });

  it("incrusta un video de Facebook, pero la página de la iglesia se abre aparte", () => {
    const video = transmisionDe("https://www.facebook.com/IglesiaCentral/videos/1234567890/");
    expect(video?.embed).toBe(`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent("https://www.facebook.com/IglesiaCentral/videos/1234567890/")}&show_text=false&width=560`);
    expect(transmisionDe("https://fb.watch/abcDEF123/")?.embed).toContain("plugins/video.php");
    expect(transmisionDe("https://www.facebook.com/IglesiaCentral")?.embed).toBeNull();
  });

  it("otros servicios van como botón, y solo se aceptan enlaces https", () => {
    expect(transmisionDe("https://zoom.us/j/123456789")).toEqual({ plataforma: "otra", embed: null, ver: "https://zoom.us/j/123456789", nombre: "la transmisión" });
    expect(transmisionDe("http://youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(transmisionDe("javascript:alert(1)")).toBeNull();
    expect(transmisionDe("culto en vivo")).toBeNull();
    expect(transmisionDe(null)).toBeNull();
  });
});

describe("video del anfitrión por enlace", () => {
  it("YouTube: dentro de la página, con miniatura; los Shorts, verticales", () => {
    const v = videoDe("https://youtu.be/dQw4w9WgXcQ?si=abc");
    expect([v?.plataforma, v?.embed, v?.vertical]).toEqual(["youtube", "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1", false]);
    expect(v?.miniatura).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(videoDe("https://youtube.com/shorts/dQw4w9WgXcQ")?.vertical).toBe(true);
    expect(videoDe("https://www.youtube.com/@IglesiaCentral")?.embed).toBeNull();
  });

  it("TikTok: el reproductor oficial con el número del video; el enlace corto solo se abre", () => {
    const v = videoDe("https://www.tiktok.com/@carlos.ch/video/7351234567890123456?is_from_webapp=1");
    expect([v?.plataforma, v?.embed, v?.vertical]).toEqual(["tiktok", "https://www.tiktok.com/player/v1/7351234567890123456?rel=0", true]);
    const corto = videoDe("https://vm.tiktok.com/ZMabc123/");
    expect([corto?.plataforma, corto?.embed]).toEqual(["tiktok", null]);
  });

  it("Instagram: reels y publicaciones, verticales", () => {
    expect(videoDe("https://www.instagram.com/reel/C5abcDEF123/?igsh=xyz")?.embed).toBe("https://www.instagram.com/reel/C5abcDEF123/embed");
    expect(videoDe("https://www.instagram.com/reels/C5abcDEF123/")?.embed).toBe("https://www.instagram.com/reel/C5abcDEF123/embed");
    expect(videoDe("https://www.instagram.com/p/C5abcDEF123/")?.embed).toBe("https://www.instagram.com/p/C5abcDEF123/embed");
    expect(videoDe("https://www.instagram.com/carlos.ch/")?.embed).toBeNull();
  });

  it("Facebook: un video o un reel se incrusta; la página, no", () => {
    expect(videoDe("https://www.facebook.com/IglesiaCentral/videos/1234567890/")?.embed).toContain("plugins/video.php?href=");
    const reel = videoDe("https://www.facebook.com/reel/1234567890");
    expect([reel?.embed?.includes("width="), reel?.vertical]).toEqual([false, true]);
    expect(videoDe("https://www.facebook.com/IglesiaCentral")?.embed).toBeNull();
  });

  it("Google Drive y Vimeo: su vista previa", () => {
    expect(videoDe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing")?.embed).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
    expect(videoDe("https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp")?.embed).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/preview");
    expect(videoDe("https://vimeo.com/123456789")?.embed).toBe("https://player.vimeo.com/video/123456789");
    expect(videoDe("https://vimeo.com/123456789/abc123def0")?.embed).toBe("https://player.vimeo.com/video/123456789?h=abc123def0");
  });

  it("un archivo de video va al reproductor del navegador; lo demás, botón; sin https, nada", () => {
    const f = videoDe("https://x.supabase.co/storage/v1/object/public/eventos/1/video-1.mp4");
    expect([f?.plataforma, f?.archivo, f?.embed]).toEqual(["archivo", "https://x.supabase.co/storage/v1/object/public/eventos/1/video-1.mp4", null]);
    expect(videoDe("https://ejemplo.com/mi-video")?.plataforma).toBe("otra");
    expect(videoDe("http://youtu.be/dQw4w9WgXcQ")).toBeNull();
    expect(videoDe("javascript:alert(1)")).toBeNull();
    expect(videoDe("")).toBeNull();
  });
});

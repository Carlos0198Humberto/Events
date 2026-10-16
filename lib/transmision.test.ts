import { describe, expect, it } from "vitest";
import { transmisionDe } from "@/lib/transmision";

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

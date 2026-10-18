"use client";
// ─── Retos de fotos, arriba del muro ──────────────────────────────────────────
//
// Círculos como las historias: «Todas» y cada reto. El círculo de un reto
// muestra la última foto que lo cumplió (o su ícono, si todavía nadie) y
// tocarlo deja solo esas fotos en el muro. Al invitado que no lo cumplió, un
// «+» y el botón para subir la suya.

import type { ReactNode } from "react";
import type { Reto, RetoId, IconoReto } from "@/lib/retosMuro";
import { IcoAnillos, IcoBirrete, IcoCorona, IcoEstrella, IcoPastel, IcoTodas } from "@/app/components/Iconos";
import { miniatura, type FotoMuro, type TemaMuro } from "./GaleriaFotos";

export function IconoDeReto({ icono, size = 22 }: { icono: IconoReto; size?: number }) {
  const props = { size, strokeWidth: 1.8 };
  const iconos: Record<IconoReto, ReactNode> = {
    corona: <IcoCorona {...props} />,
    pastel: <IcoPastel {...props} />,
    birrete: <IcoBirrete {...props} />,
    anillos: <IcoAnillos {...props} />,
    estrella: <IcoEstrella {...props} />,
  };
  return <>{iconos[icono]}</>;
}

export default function RetosMuro({ retos, fotos, activo, onElegir, tema, invitado, pendientes, onSubir }: {
  retos: Reto[];
  /** Las fotos del muro, la más nueva primero */
  fotos: FotoMuro[];
  activo: RetoId | null;
  onElegir: (id: RetoId | null) => void;
  tema: TemaMuro;
  /** Entró con su enlace: puede subir fotos */
  invitado: boolean;
  /** Los retos que todavía no cumplió */
  pendientes: RetoId[];
  onSubir: (id: RetoId) => void;
}) {
  const elegido = retos.find((r) => r.id === activo) ?? null;
  const deElegido = elegido ? fotos.filter((f) => f.reto === elegido.id).length : 0;

  return (
    <section className="rm" aria-label="Retos de fotos">
      <style>{ESTILOS}</style>
      <div className="rm-fila">
        <button type="button" className={`rm-item${activo === null ? " activo" : ""}`} onClick={() => onElegir(null)} aria-pressed={activo === null}>
          <span className="rm-aro" style={{ borderColor: activo === null ? tema.acento : tema.borde }}>
            <span className="rm-in" style={{ color: tema.acento, background: tema.suave }}><IcoTodas size={22} strokeWidth={1.8} /></span>
          </span>
          <span className="rm-nombre" style={{ color: tema.tinta }}>Todas</span>
          <span className="rm-cuenta">{fotos.length} foto{fotos.length !== 1 ? "s" : ""}</span>
        </button>
        {retos.map((r) => {
          const suyas = fotos.filter((f) => f.reto === r.id);
          const ultima = suyas[0];
          const esActivo = activo === r.id;
          const falta = invitado && pendientes.includes(r.id);
          return (
            <button key={r.id} type="button" className={`rm-item${esActivo ? " activo" : ""}`} onClick={() => onElegir(esActivo ? null : r.id)} aria-pressed={esActivo}>
              <span
                className={`rm-aro${suyas.length ? "" : " vacio"}`}
                style={{ borderColor: esActivo ? tema.acento : suyas.length ? tema.destaque : tema.borde }}
              >
                <span className="rm-in" style={{ color: tema.acento, background: tema.suave }}>
                  {ultima
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={miniatura(ultima)} alt="" loading="lazy" />
                    : <IconoDeReto icono={r.icono} size={24} />}
                </span>
                {ultima && <span className="rm-icono" style={{ background: tema.acento }}><IconoDeReto icono={r.icono} size={12} /></span>}
                {falta && <span className="rm-mas" style={{ background: tema.acento }} aria-hidden="true">+</span>}
              </span>
              <span className="rm-nombre" style={{ color: tema.tinta }}>{r.nombre}</span>
              <span className="rm-cuenta">{suyas.length ? `${suyas.length} foto${suyas.length !== 1 ? "s" : ""}` : "¡Sé el primero!"}</span>
            </button>
          );
        })}
      </div>

      {elegido && (
        <div className="rm-aviso" style={{ borderColor: tema.borde }}>
          <span className="rm-aviso-ico" style={{ color: tema.acento, background: tema.suave }}><IconoDeReto icono={elegido.icono} size={18} /></span>
          <span className="rm-aviso-txt">
            <b style={{ color: tema.tinta }}>Reto: {elegido.nombre}</b>
            <small>{deElegido ? `${deElegido} foto${deElegido !== 1 ? "s" : ""} lo cumplieron` : "Todavía nadie lo cumplió"}</small>
          </span>
          {invitado && (pendientes.includes(elegido.id)
            ? <button type="button" className="rm-subir" style={{ background: tema.acento }} onClick={() => onSubir(elegido.id)}>Subir la mía</button>
            : <span className="rm-hecho" style={{ color: tema.acento }}>✓ Cumplido</span>)}
        </div>
      )}
    </section>
  );
}

const ESTILOS = `
.rm{margin:2px 0 14px}
.rm-fila{display:flex;justify-content:center;gap:18px;padding:2px 2px 4px;overflow-x:auto;scrollbar-width:none}
.rm-fila::-webkit-scrollbar{display:none}
.rm-item{flex:0 0 auto;width:86px;display:flex;flex-direction:column;align-items:center;gap:3px;padding:0;border:none;background:none;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent}
.rm-aro{position:relative;width:66px;height:66px;border-radius:50%;border:2.5px solid;padding:3px;transition:transform .15s}
.rm-aro.vacio{border-style:dashed}
.rm-item:active .rm-aro{transform:scale(.94)}
.rm-item.activo .rm-aro{transform:scale(1.06)}
.rm-in{width:100%;height:100%;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center}
.rm-in img{width:100%;height:100%;object-fit:cover;display:block}
.rm-icono{position:absolute;left:-2px;bottom:-2px;width:22px;height:22px;border-radius:50%;border:2px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center}
.rm-mas{position:absolute;right:-2px;bottom:-2px;width:22px;height:22px;border-radius:50%;border:2px solid #fff;color:#fff;font-size:15px;font-weight:800;line-height:18px;text-align:center}
.rm-nombre{font-size:11.5px;font-weight:700;line-height:1.2;text-align:center;margin-top:3px}
.rm-cuenta{font-size:10.5px;color:#94A3B8;line-height:1.2}
.rm-aviso{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px 12px;border:1px solid;border-radius:14px;background:#fff;animation:rmEntra .3s ease both}
.rm-aviso-ico{width:34px;height:34px;flex:0 0 auto;border-radius:50%;display:flex;align-items:center;justify-content:center}
.rm-aviso-txt{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}
.rm-aviso-txt b{font-size:13px}
.rm-aviso-txt small{font-size:11.5px;color:#64748B}
.rm-subir{flex:0 0 auto;border:none;border-radius:999px;padding:9px 14px;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.rm-hecho{flex:0 0 auto;font-size:12.5px;font-weight:700}
@keyframes rmEntra{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.rm-aviso{animation:none}}
`;

"use client";
// ─── Invitación especial para quien está lejos ────────────────────────────────
//
// Familiares y amigos que no pueden ir pero fueron parte del logro. No se les
// pide confirmar: se les agradece, ven las fotos que subió el anfitrión (ej. la
// graduación con sus padres) y las del muro, y dejan su mensaje. El formulario
// del deseo y el regalo llegan como `children` desde la página (allí viven).

import { useEffect, useState, type ReactNode } from "react";
import {
  agradecimientoDe, extrasDe, familiaDe, fechaLarga, horaCorta, protagonistaDe, quienInvitaHablado,
  type EventoTarjeta,
} from "@/lib/tarjetaInvitacion";

type Props = {
  evento: EventoTarjeta & { fotos_anfitrion?: string[] | null };
  invitadoNombre: string;
  muro: { href: string; urls: string[]; total: number } | null;
  children?: ReactNode;
};

export default function InvitacionDistancia({ evento, invitadoNombre, muro, children }: Props) {
  const p = protagonistaDe(evento);
  const ex = extrasDe(evento);
  const fotos = (Array.isArray(evento.fotos_anfitrion) ? evento.fotos_anfitrion : []).filter((u): u is string => typeof u === "string");
  const firma = familiaDe(evento) || quienInvitaHablado(evento);
  const cuando = [evento.fecha && fechaLarga(evento.fecha), evento.hora && horaCorta(evento.hora)].filter(Boolean).join(" · ");
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <div className="dist-wrap">
      <style>{ESTILOS}</style>
      <article className="dist-card">
        {evento.imagen_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="dist-portada" src={evento.imagen_url} alt={p.nombre} />
        )}

        <header className="dist-cab">
          <span className="dist-badge">💌 Invitación especial</span>
          <p className="dist-para">Para {invitadoNombre}</p>
          <h1 className="dist-nombre">{p.nombre}</h1>
          {ex.carrera && <p className="dist-carrera">{ex.carrera}</p>}
          {ex.institucion && <p className="dist-institucion">{ex.institucion}</p>}
        </header>

        <section className="dist-gracias">
          <p>{agradecimientoDe(evento)}</p>
          {firma && <p className="dist-firma">{firma}</p>}
        </section>

        {cuando && (
          <p className="dist-cuando">
            <span>La celebración</span>{cuando}
          </p>
        )}

        <section className="dist-seccion">
          <h2>Fotos del gran día</h2>
          {fotos.length ? (
            <div className="dist-galeria">
              {fotos.map((url, i) => (
                <button key={url + i} type="button" onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : (
            <p className="dist-vacio">Muy pronto vas a ver acá las fotos del gran día. 📸</p>
          )}
        </section>

        {muro && (
          <section className="dist-seccion">
            <h2>Fotos de los invitados</h2>
            <a className="dist-muro" href={muro.href}>
              {muro.urls.length > 0 && (
                <span className="dist-muro-fotos">
                  {muro.urls.map((u, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={u + i} src={u} alt="" />
                  ))}
                </span>
              )}
              <span className="dist-muro-texto">
                {muro.total > 0 ? `Ya hay ${muro.total} foto${muro.total !== 1 ? "s" : ""} en el muro` : "El muro del evento"}
                <small>Mirá los momentos que comparten los invitados →</small>
              </span>
            </a>
          </section>
        )}

        {children}
      </article>

      {abierta !== null && (
        <Visor fotos={fotos} indice={abierta} onCambiar={setAbierta} onCerrar={() => setAbierta(null)} />
      )}
    </div>
  );
}

function Visor({ fotos, indice, onCambiar, onCerrar }: { fotos: string[]; indice: number; onCambiar: (i: number) => void; onCerrar: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft" && indice > 0) onCambiar(indice - 1);
      if (e.key === "ArrowRight" && indice < fotos.length - 1) onCambiar(indice + 1);
    };
    window.addEventListener("keydown", fn);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = overflow; };
  }, [indice, fotos.length, onCambiar, onCerrar]);

  return (
    <div className="dist-visor" role="dialog" aria-label={`Foto ${indice + 1} de ${fotos.length}`} onClick={onCerrar}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={fotos[indice]} alt="" onClick={(e) => e.stopPropagation()} />
      <button className="dist-visor-cerrar" type="button" onClick={onCerrar} aria-label="Cerrar">×</button>
      {indice > 0 && (
        <button className="dist-visor-flecha izq" type="button" onClick={(e) => { e.stopPropagation(); onCambiar(indice - 1); }} aria-label="Anterior">‹</button>
      )}
      {indice < fotos.length - 1 && (
        <button className="dist-visor-flecha der" type="button" onClick={(e) => { e.stopPropagation(); onCambiar(indice + 1); }} aria-label="Siguiente">›</button>
      )}
      <span className="dist-visor-cuenta">{indice + 1} / {fotos.length}</span>
    </div>
  );
}

// Usa las variables de tema de la invitación (--gold, --ink…): combina con
// la paleta del evento sin colores propios.
const ESTILOS = `
.dist-wrap{max-width:440px;margin:0 auto;padding:16px 14px 40px}
.dist-card{background:var(--surface,#fff);border-radius:24px;overflow:hidden;border:1px solid var(--border-mid);box-shadow:var(--shadow-lg)}
.dist-portada{display:block;width:100%;max-height:380px;object-fit:cover;object-position:center 25%}
.dist-cab{text-align:center;padding:22px 20px 6px}
.dist-badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3);background:var(--cream);border:1px solid var(--border-mid);border-radius:99px;padding:5px 12px}
.dist-para{margin-top:14px;font-family:var(--f-display,'Cormorant Garamond'),serif;font-style:italic;font-size:19px;color:var(--ink2)}
.dist-nombre{font-family:var(--f-display,'Cormorant Garamond'),serif;font-size:clamp(30px,8.5vw,40px);font-weight:600;line-height:1.08;color:var(--ink);margin-top:4px;text-wrap:balance}
.dist-carrera{font-family:var(--f-display,'Cormorant Garamond'),serif;font-style:italic;font-size:17px;color:var(--ink2);margin-top:8px}
.dist-institucion{font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ink3);margin-top:4px}
.dist-gracias{margin:18px 18px 0;padding:18px;border-radius:18px;background:var(--cream);border:1px solid var(--border)}
.dist-gracias p{font-family:var(--f-display,'Cormorant Garamond'),serif;font-size:17.5px;line-height:1.6;color:var(--ink);text-align:center}
.dist-gracias .dist-firma{margin-top:12px;font-style:italic;font-size:22px;color:var(--ink3)}
.dist-cuando{margin:16px 18px 0;text-align:center;font-size:13.5px;color:var(--ink2)}
.dist-cuando span{display:block;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--ink3);margin-bottom:2px}
.dist-seccion{margin:22px 18px 0}
.dist-seccion h2{font-family:var(--f-display,'Cormorant Garamond'),serif;font-size:21px;font-weight:600;color:var(--ink);margin-bottom:10px}
.dist-galeria{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.dist-galeria button{padding:0;border:none;border-radius:14px;overflow:hidden;aspect-ratio:1;cursor:pointer;background:var(--cream)}
.dist-galeria img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s}
.dist-galeria button:active img{transform:scale(.97)}
.dist-vacio{font-size:14px;color:var(--ink2);background:var(--cream);border:1px dashed var(--border-mid);border-radius:14px;padding:16px;text-align:center}
.dist-muro{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;text-decoration:none;background:linear-gradient(135deg,var(--dark2),var(--dark));color:var(--on-dark,#fff);box-shadow:var(--shadow)}
.dist-muro-fotos{display:flex;flex-shrink:0}
.dist-muro-fotos img{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--gold-light,#E6CF8E)}
.dist-muro-fotos img+img{margin-left:-12px}
.dist-muro-texto{display:flex;flex-direction:column;font-size:14px;font-weight:700;line-height:1.3}
.dist-muro-texto small{font-size:11.5px;font-weight:500;opacity:.85;margin-top:2px}
.dist-visor{position:fixed;inset:0;z-index:9999;background:rgba(6,8,15,.94);display:flex;align-items:center;justify-content:center;padding:16px}
.dist-visor img{max-width:100%;max-height:86vh;object-fit:contain;border-radius:8px}
.dist-visor-cerrar{position:absolute;top:max(14px,env(safe-area-inset-top,14px));right:14px;width:42px;height:42px;border-radius:50%;border:none;background:rgba(255,255,255,.14);color:#fff;font-size:26px;cursor:pointer}
.dist-visor-flecha{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:rgba(255,255,255,.14);color:#fff;font-size:28px;cursor:pointer}
.dist-visor-flecha.izq{left:10px}.dist-visor-flecha.der{right:10px}
.dist-visor-cuenta{position:absolute;bottom:max(16px,env(safe-area-inset-bottom,16px));left:0;right:0;text-align:center;color:rgba(255,255,255,.8);font-size:13px;font-weight:600}
`;

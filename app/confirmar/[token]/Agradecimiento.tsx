"use client";
// ─── Agradecimiento de graduación: el tercer momento ─────────────────────────
//
// Después del evento, con el mismo enlace, el organizador le agradece a cada
// persona: a quien fue, por acompañarlo; a quien no pudo ir, por su cariño.
// Debajo, las fotos de ese día (las aprobadas del muro) y un lugar para que la
// persona deje su mensaje, que llega como `children` desde la página.
//
// Mismo lenguaje visual que la pre-invitación: cabecera azul marino con el
// nombre en blanco y el cuerpo blanco.

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { extrasDe, fechaLarga, protagonistaDe, textosGracias, type EventoTarjeta } from "@/lib/tarjetaInvitacion";
import { nombreDePila, saludoDeCarta, type Trato } from "@/lib/tratoInvitado";
import { IcoFlecha } from "@/app/components/Iconos";

type Props = {
  evento: EventoTarjeta;
  eventoId: string;
  invitadoNombre: string;
  trato: Trato;
  asistio: boolean;
  muroHref: string;
  children?: ReactNode;
};

type Foto = { url: string; thumb_url?: string | null };

export default function Agradecimiento({ evento, eventoId, invitadoNombre, trato, asistio, muroHref, children }: Props) {
  const p = protagonistaDe(evento);
  const ex = extrasDe(evento);
  const t = textosGracias(evento, trato, asistio);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [total, setTotal] = useState(0);
  const [abierta, setAbierta] = useState<number | null>(null);

  // Las fotos aprobadas del muro, las más nuevas primero (si la columna de
  // miniaturas no existe todavía, solo la original)
  useEffect(() => {
    let activo = true;
    (async () => {
      const consulta = (cols: string) => supabase
        .from("fotos")
        .select(cols, { count: "exact" })
        .eq("evento_id", eventoId)
        .eq("estado", "aprobada")
        .order("created_at", { ascending: false })
        .limit(6);
      let { data, count, error } = await consulta("url,thumb_url");
      if (error) ({ data, count } = await consulta("url"));
      if (!activo) return;
      const filas = (data ?? []) as unknown as Foto[];
      setFotos(filas);
      setTotal(count ?? filas.length);
    })();
    return () => { activo = false; };
  }, [eventoId]);

  useEffect(() => {
    if (abierta === null) return;
    const cerrar = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierta(null); };
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [abierta]);

  const varios = trato === "plural";

  return (
    <div className="ag-wrap">
      <style>{ESTILOS}</style>
      <article className="ag-card">
        <header className="ag-hero" data-guia="ag-inicio">
          <p className="ag-kicker">Con gratitud · Graduación</p>
          <p className="ag-para">Para {nombreDePila(invitadoNombre)}</p>
          <h1 className="ag-nombre">{p.nombre}</h1>
          {ex.carrera && <p className="ag-carrera">{ex.carrera}</p>}
          {ex.institucion && <p className="ag-institucion">{ex.institucion}</p>}
        </header>

        <div className="ag-cuerpo">
          <p className="ag-saludo">{saludoDeCarta(invitadoNombre, trato)}</p>
          <p className="ag-texto" data-guia="ag-texto">{t.texto}</p>
          {evento.fecha && <p className="ag-dia">{fechaLarga(evento.fecha)}</p>}
          {t.firma && <p className="ag-firma" data-guia="ag-firma">Con cariño,<strong>{t.firma}</strong></p>}
        </div>
      </article>

      <section className="ag-seccion" data-guia="ag-fotos">
        <h2>Las fotos de ese día</h2>
        {fotos.length > 0 ? (
          <>
            <p className="ag-sub">{t.fotos}</p>
            <div className="ag-fotos">
              {fotos.map((f, i) => (
                <button key={f.url} type="button" className="ag-foto" onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1} de ${fotos.length}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.thumb_url || f.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="ag-sub">Pronto vas a ver acá las fotos de ese día.</p>
        )}
        <a className="ag-muro" href={muroHref}>
          <span>
            {total > fotos.length ? `Ver las ${total} fotos en el muro` : "Ir al muro del evento"}
            <small>{varios ? "Si tienen fotos de ese día, súbanlas ahí" : "Si tenés fotos de ese día, subilas ahí"}</small>
          </span>
          <IcoFlecha size={18} />
        </a>
      </section>

      {children}

      {abierta !== null && fotos[abierta] && (
        <div className="ag-visor" role="dialog" aria-modal="true" aria-label="Foto" onClick={() => setAbierta(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotos[abierta].url} alt="" />
          <button type="button" className="ag-cerrar" aria-label="Cerrar" onClick={() => setAbierta(null)}>×</button>
        </div>
      )}
    </div>
  );
}

// Azul marino, plata y blanco: los colores de toda la graduación
const ESTILOS = `
.ag-wrap{max-width:460px;margin:0 auto;padding:18px 14px 44px;color:#152039;display:grid;gap:18px}
@keyframes agSube{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.ag-card{background:#FFFFFF;border-radius:22px;overflow:hidden;border:1px solid rgba(21,32,57,0.08);
  box-shadow:0 22px 50px -24px rgba(21,32,57,0.30);animation:agSube .6s ease both}
.ag-hero{position:relative;text-align:center;padding:30px 22px 26px;color:#FFFFFF;
  background:linear-gradient(160deg,#1E2B5E 0%,#141C42 55%,#0A0F24 100%)}
.ag-hero::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.10;
  background-image:radial-gradient(circle,#C9D4EA 1px,transparent 1px);background-size:18px 18px}
.ag-hero>*{position:relative}
.ag-kicker{display:inline-block;font-family:'Cinzel',Georgia,serif;font-size:11px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;
  color:#C9D4EA;border:1px solid rgba(201,212,234,0.40);border-radius:99px;padding:6px 14px}
.ag-para{margin-top:16px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17px;color:#DCE3F2}
.ag-nombre{margin-top:4px;font-family:'Playfair Display',Georgia,serif;font-size:clamp(30px,9vw,40px);font-weight:600;line-height:1.08;text-wrap:balance}
.ag-carrera{margin-top:10px;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17px;color:#DCE3F2;text-wrap:balance}
.ag-institucion{margin-top:5px;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#C9D4EA;text-wrap:balance}
.ag-cuerpo{padding:24px 22px 26px;display:grid;gap:14px}
.ag-saludo{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:600;color:#152039}
.ag-texto{font-family:'Playfair Display',Georgia,serif;font-size:18px;line-height:1.6;color:#2B3247;text-wrap:pretty}
.ag-dia{justify-self:center;font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#2D4372;
  padding:8px 0;border-top:1px solid rgba(45,67,114,0.22);border-bottom:1px solid rgba(45,67,114,0.22)}
.ag-firma{text-align:right;font-family:'Jost',sans-serif;font-size:14px;color:#596279;margin-top:4px}
.ag-firma strong{display:block;font-family:'Playfair Display',Georgia,serif;font-size:19px;font-weight:600;color:#152039;margin-top:2px}
.ag-seccion{background:#FFFFFF;border-radius:20px;padding:20px 18px;border:1px solid rgba(21,32,57,0.08);box-shadow:0 14px 34px -22px rgba(21,32,57,0.28);display:grid;gap:12px}
.ag-seccion h2{font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#152039}
.ag-sub{font-family:'Jost',sans-serif;font-size:14.5px;line-height:1.5;color:#596279}
.ag-fotos{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.ag-foto{display:block;padding:0;border:none;border-radius:10px;overflow:hidden;cursor:pointer;background:#E6ECF7}
.ag-foto img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
.ag-foto:active{transform:scale(.97)}
.ag-muro{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:14px;text-decoration:none;
  background:#152039;color:#FFFFFF;font-family:'Jost',sans-serif;font-size:15px;font-weight:600}
.ag-muro span{display:grid;gap:2px}
.ag-muro small{font-size:12px;font-weight:400;color:#C9D4EA}
.ag-muro:active{transform:scale(.98)}
.ag-visor{position:fixed;inset:0;z-index:9000;background:rgba(10,15,36,0.92);display:grid;place-items:center;padding:20px}
.ag-visor img{max-width:100%;max-height:86vh;border-radius:12px;object-fit:contain}
.ag-cerrar{position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:50%;border:none;background:rgba(255,255,255,0.14);color:#FFFFFF;font-size:26px;line-height:1;cursor:pointer}
.ag-wrap .guia-activa{outline:none;animation:none}
.ag-cuerpo .guia-activa,.ag-seccion.guia-activa{background:rgba(45,67,114,0.06);border-radius:12px;box-shadow:0 0 0 8px rgba(45,67,114,0.06);transition:background .4s,box-shadow .4s}
@media (prefers-reduced-motion:reduce){.ag-card{animation:none}}
`;

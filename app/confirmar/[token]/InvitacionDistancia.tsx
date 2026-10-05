"use client";
// ─── Invitación especial para quien está lejos ────────────────────────────────
//
// Familiares y amigos que no pueden ir pero fueron parte del logro. No se les
// pide confirmar: es una carta de agradecimiento con su nombre, que habla de la
// carrera, y una bendición (el único versículo), las fotos que subió el anfitrión (ej. la graduación
// con sus padres) y las del muro, y un lugar para dejar su mensaje. El
// formulario del mensaje y el regalo llegan como `children` desde la página.
//
// Identidad propia, distinta de la invitación de asistencia: papel blanco,
// rosa viejo y letra caligráfica, como una carta escrita a mano.

import { useEffect, useState, type ReactNode } from "react";
import {
  cartaDistancia, extrasDe, fechaLarga, horaCorta, protagonistaDe,
  type EventoTarjeta, type FormaFoto,
} from "@/lib/tarjetaInvitacion";
import { saludoDeCarta, type Trato } from "@/lib/tratoInvitado";
import { BIRRETE } from "@/lib/ornamentosTarjeta";
import { IcoCalendario, IcoCamara, IcoFlecha, IcoUbicacion } from "@/app/components/Iconos";

type Props = {
  evento: EventoTarjeta & { fotos_anfitrion?: string[] | null };
  invitadoNombre: string;
  trato: Trato;
  muro: { href: string; urls: string[]; total: number } | null;
  children?: ReactNode;
};

export default function InvitacionDistancia({ evento, invitadoNombre, trato, muro, children }: Props) {
  const p = protagonistaDe(evento);
  const ex = extrasDe(evento);
  const carta = cartaDistancia(evento, trato);
  const saludoCarta = saludoDeCarta(invitadoNombre, trato);
  const foto = ex.foto === false ? null : ex.foto_url || evento.imagen_url?.trim() || null;
  const forma: FormaFoto = ex.forma_foto ?? "arco";
  const fotos = (Array.isArray(evento.fotos_anfitrion) ? evento.fotos_anfitrion : []).filter((u): u is string => typeof u === "string");
  const fecha = evento.fecha ? fechaLarga(evento.fecha) : null;
  const hora = evento.hora ? horaCorta(evento.hora) : null;
  // "Hotel Real InterContinental, San Salvador" + "Bulevar Los Héroes, San
  // Salvador": la ciudad ya va en la dirección, no se repite en el lugar
  const lugarCompleto = evento.lugar?.trim() || "";
  const coma = lugarCompleto.indexOf(",");
  const ciudad = coma > 0 ? lugarCompleto.slice(coma + 1).trim().toLowerCase() : "";
  const direccion = ex.direccion ?? null;
  const lugar = direccion && ciudad && direccion.toLowerCase().includes(ciudad) ? lugarCompleto.slice(0, coma).trim() : lugarCompleto;
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <div className="dl-wrap">
      <style>{ESTILOS}</style>

      <article className="dl-carta">
        <span className="dl-marco" aria-hidden="true" />
        <MarcaDeAgua graduacion={evento.tipo === "graduacion"} iniciales={inicialesDe(p.nombre)} />

        <header className="dl-cab" data-guia="dl-inicio">
          <p className="dl-kicker"><i />Invitación especial<i /></p>
          {foto && (
            <figure className={`dl-retrato ${forma}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt={p.nombre} />
            </figure>
          )}
          <p className="dl-script">Con gratitud</p>
          <h1 className="dl-nombre">{p.nombre}</h1>
          {ex.carrera && <p className="dl-carrera">{ex.carrera}</p>}
          {ex.institucion && <p className="dl-institucion">{ex.institucion}</p>}
          <Ornamento />
        </header>

        <section className="dl-texto" aria-label="Carta de agradecimiento">
          <p className="dl-saludo" data-guia="dl-saludo">{saludoCarta}</p>
          {carta.parrafos.map((t, i) => <p key={i} data-guia={`dl-p${i}`}>{t}</p>)}
          <p className="dl-oracion">{carta.oracion}</p>
          <blockquote className="dl-bendicion" data-guia="dl-bendicion">
            <p>«{carta.bendicion.texto}»</p>
            <cite>{carta.bendicion.cita}</cite>
          </blockquote>
          <div data-guia="dl-firma">
            <p className="dl-despedida">{carta.despedida}</p>
            {carta.firma && <p className="dl-firma">{carta.firma}</p>}
          </div>
        </section>
      </article>

      {(fecha || lugar || direccion) && (
        <section className="dist-seccion">
          <h2>La celebración</h2>
          <div className="dl-datos">
            {fecha && (
              <p><span className="dl-ico"><IcoCalendario size={17} /></span><span>{fecha}{hora && <small>{hora}</small>}</span></p>
            )}
            {(lugar || direccion) && (
              <p><span className="dl-ico"><IcoUbicacion size={17} /></span><span>{lugar}{direccion && <small>{direccion}</small>}</span></p>
            )}
          </div>
        </section>
      )}

      <section className="dist-seccion" data-guia="dl-fotos">
        <h2>Recuerdos del gran día</h2>
        {fotos.length ? (
          <div className="dl-polaroids">
            {fotos.map((url, i) => (
              <button key={url + i} type="button" className="dl-polaroid" onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1} de ${fotos.length}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <p className="dist-vacio"><IcoCamara size={22} strokeWidth={1.6} />Muy pronto vas a ver acá las fotos del gran día.</p>
        )}
      </section>

      {muro && (
        <section className="dist-seccion">
          <h2>Fotos de los invitados</h2>
          <a className="dl-muro" href={muro.href}>
            {muro.urls.length > 0 ? (
              <span className="dl-muro-fotos">
                {muro.urls.map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u + i} src={u} alt="" />
                ))}
              </span>
            ) : (
              <span className="dl-ico grande"><IcoCamara size={20} /></span>
            )}
            <span className="dl-muro-texto">
              {muro.total > 0 ? `Ya hay ${muro.total} foto${muro.total !== 1 ? "s" : ""} en el muro` : "El muro del evento"}
              <small>Los momentos que comparten los invitados</small>
            </span>
            <IcoFlecha size={18} className="dl-muro-flecha" />
          </a>
        </section>
      )}

      {children}

      {abierta !== null && (
        <Visor fotos={fotos} indice={abierta} onCambiar={setAbierta} onCerrar={() => setAbierta(null)} />
      )}
    </div>
  );
}

const inicialesDe = (nombre: string) =>
  nombre.split(/\s+/).filter((w) => w.length > 1 && !/^(de|del|la|las|los|y)$/i.test(w)).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");

// Marca de agua al fondo de la carta: un birrete de línea (o las iniciales,
// si no es graduación), apenas visible, como el sello de agua de un papel fino
function MarcaDeAgua({ graduacion, iniciales }: { graduacion: boolean; iniciales: string }) {
  return (
    <span className="dl-marca" aria-hidden="true">
      {graduacion ? (
        <svg viewBox="-180 -70 360 186" width="100%">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d={BIRRETE.casquete} strokeWidth="3" />
            <path d={BIRRETE.bandaCasquete} strokeWidth="1.4" />
            <path d={BIRRETE.tablero} strokeWidth="3" />
            <path d={BIRRETE.canto} strokeWidth="1.8" />
            <path d={BIRRETE.cordon} strokeWidth="2.2" />
          </g>
          <path d={BIRRETE.borla + BIRRETE.boton} fill="currentColor" />
        </svg>
      ) : (
        <span className="dl-marca-letras">{iniciales}</span>
      )}
    </span>
  );
}

// Filete con un rombo al centro, en oro rosa
function Ornamento() {
  return (
    <svg className="dl-ornamento" width="150" height="14" viewBox="0 0 150 14" aria-hidden="true">
      <defs>
        <linearGradient id="dlFilete" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="150" y2="0">
          <stop offset="0" stopColor="#B97A68" stopOpacity="0" />
          <stop offset=".5" stopColor="#B97A68" />
          <stop offset="1" stopColor="#B97A68" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 7h62M88 7h62" stroke="url(#dlFilete)" strokeWidth="1" />
      <path d="M75 1.5l5.5 5.5-5.5 5.5L69.5 7z" fill="none" stroke="#B97A68" strokeWidth="1.1" />
      <circle cx="75" cy="7" r="1.6" fill="#B97A68" />
    </svg>
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
      <button className="dist-visor-cerrar" type="button" onClick={onCerrar} aria-label="Cerrar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
      {indice > 0 && (
        <button className="dist-visor-flecha izq" type="button" onClick={(e) => { e.stopPropagation(); onCambiar(indice - 1); }} aria-label="Anterior">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      )}
      {indice < fotos.length - 1 && (
        <button className="dist-visor-flecha der" type="button" onClick={(e) => { e.stopPropagation(); onCambiar(indice + 1); }} aria-label="Siguiente">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      )}
      <span className="dist-visor-cuenta">{indice + 1} / {fotos.length}</span>
    </div>
  );
}

// Rosa viejo liso sobre blanco, sin degradados metálicos. El tono oscuro
// (#8E5546) es el que se lee en texto chico; los claros solo decoran.
const ESTILOS = `
@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
/* La página entera en papel blanco (la de graduación es azul noche) */
html:has(.page-distancia),body:has(.page-distancia){background:#FFFFFF}
.page.page-distancia{background-color:#FFFFFF;background-size:auto;
  background-image:linear-gradient(180deg,#FFFFFF 0%,#F6F7F9 100%)}
.page-distancia .topbar{background:rgba(255,255,255,.9);border-bottom:1px solid rgba(185,122,104,.22)}
.page-distancia .topbar-name{color:#2A2326}
.page-distancia .topbar-sub{color:#8E5546;opacity:1}
.dl-wrap{--rg:#8E5546;--rg2:#B98F84;--rg3:#E2CFCA;--rg4:#F4F1F0;--tinta:#22252E;--tinta2:#5B5F6B;
  max-width:460px;margin:0 auto;padding:18px 14px 44px;color:var(--tinta)}
@keyframes dlSube{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.dl-carta{position:relative;background:#FFFFFF;border-radius:20px;padding:34px 26px 32px;
  box-shadow:0 1px 2px rgba(34,37,46,.06),0 18px 44px -20px rgba(34,37,46,.25);animation:dlSube .7s ease both}
.dl-marco{position:absolute;inset:10px;border:1px solid rgba(142,85,70,.22);border-radius:13px;pointer-events:none}
.dl-cab{position:relative;text-align:center}
/* Marca de agua: detrás del texto de la carta, sin robarle lectura */
.dl-marca{position:absolute;left:50%;top:54%;width:88%;transform:translate(-50%,-50%) rotate(-8deg);color:var(--rg);opacity:.06;pointer-events:none;z-index:0}
.dl-marca svg{display:block}
.dl-marca-letras{display:block;text-align:center;font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:min(56vw,230px);line-height:1}
.dl-carta>*:not(.dl-marco):not(.dl-marca){position:relative;z-index:1}
/* La voz lee la carta: el párrafo que dice se tiñe apenas (sin el contorno dorado de la invitación) */
.dl-wrap .guia-activa{outline:none;animation:none}
.dl-texto .guia-activa{background:rgba(142,85,70,.07);border-radius:10px;box-shadow:0 0 0 8px rgba(142,85,70,.07);transition:background .4s,box-shadow .4s}
.dl-kicker{display:flex;align-items:center;justify-content:center;gap:10px;font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:var(--rg)}
.dl-kicker i{display:block;width:26px;height:1px;background:linear-gradient(90deg,transparent,var(--rg2))}
.dl-kicker i:last-child{background:linear-gradient(90deg,var(--rg2),transparent)}
.dl-retrato{margin:22px auto 0;width:min(48vw,180px);box-shadow:0 14px 30px -16px rgba(34,37,46,.45)}
.dl-retrato img{display:block;width:100%;object-fit:cover;object-position:50% 22%;background:var(--rg4)}
.dl-retrato.circulo,.dl-retrato.circulo img{border-radius:50%}
.dl-retrato.circulo img{aspect-ratio:1}
.dl-retrato.arco,.dl-retrato.arco img{border-radius:999px 999px 0 0}
.dl-retrato.arco img,.dl-retrato.retrato img{aspect-ratio:4/5}
.dl-retrato.retrato,.dl-retrato.retrato img{border-radius:12px}
.dl-script{font-family:'Great Vibes',cursive;font-size:clamp(40px,12vw,52px);line-height:1.1;margin-top:16px;padding:0 6px;color:var(--rg)}
.dl-nombre{font-family:'Playfair Display',Georgia,serif;font-size:clamp(25px,7vw,32px);font-weight:600;line-height:1.15;color:var(--tinta);margin-top:2px;text-wrap:balance}
.dl-carrera{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:16.5px;color:var(--tinta2);margin-top:8px;text-wrap:balance}
.dl-institucion{font-family:'Cormorant Garamond',Georgia,serif;font-size:12px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--rg);margin-top:5px;text-wrap:balance}
.dl-ornamento{display:block;margin:18px auto 0}
.dl-bendicion cite{display:block;margin-top:6px;font-family:'Cormorant Garamond',Georgia,serif;font-style:normal;font-size:12px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--rg)}
.dl-texto{margin-top:26px}
.dl-saludo{font-family:'Great Vibes',cursive;font-size:34px;line-height:1.15;color:var(--rg);margin-bottom:10px}
.dl-texto>p:not(.dl-saludo):not(.dl-oracion):not(.dl-despedida):not(.dl-firma){font-family:'Cormorant Garamond',Georgia,serif;font-size:19.5px;line-height:1.62;color:var(--tinta);margin-top:12px;text-wrap:pretty}
.dl-oracion{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:19px;color:var(--tinta2);margin-top:18px}
.dl-bendicion{position:relative;margin:12px 0 0;padding:20px 18px 18px;border-radius:14px;text-align:center;
  background:#FFFFFF;border:1px solid rgba(142,85,70,.22)}
.dl-bendicion::before{content:"";position:absolute;top:-1px;left:50%;width:44px;height:2px;margin-left:-22px;background:var(--rg)}
.dl-bendicion p{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:17px;line-height:1.6;color:var(--tinta)}
.dl-despedida{font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:19px;color:var(--tinta2);margin-top:24px;text-align:right}
.dl-firma{font-family:'Great Vibes',cursive;font-size:clamp(30px,9vw,38px);line-height:1.15;color:var(--rg);text-align:right;margin-top:2px}
.dist-seccion{margin:26px 4px 0;animation:dlSube .7s .15s ease both}
.dist-seccion h2{display:flex;align-items:center;gap:12px;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:500;color:var(--tinta);margin-bottom:12px}
.dist-seccion h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(185,122,104,.5),transparent)}
.dl-datos{background:#FFFFFF;border:1px solid rgba(185,122,104,.28);border-radius:16px;padding:6px 16px}
.dl-datos p{display:flex;align-items:center;gap:12px;padding:10px 0;font-size:15px;color:var(--tinta);line-height:1.35}
.dl-datos p+p{border-top:1px solid rgba(185,122,104,.18)}
.dl-datos small{display:block;font-size:13px;color:var(--tinta2);margin-top:1px}
.dl-ico{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:34px;height:34px;border-radius:50%;background:var(--rg4);color:var(--rg)}
.dl-ico.grande{width:44px;height:44px}
.dl-polaroids{display:grid;grid-template-columns:repeat(2,1fr);gap:16px 14px;padding:4px 2px}
.dl-polaroid{display:block;padding:7px 7px 24px;border:none;background:#FFFFFF;cursor:pointer;
  box-shadow:0 1px 2px rgba(42,35,38,.08),0 10px 22px -10px rgba(42,35,38,.30);transform:rotate(-1.6deg);transition:transform .25s}
.dl-polaroid:nth-child(2n){transform:rotate(1.4deg)}
.dl-polaroid:nth-child(3n){transform:rotate(-.6deg)}
.dl-polaroid:active{transform:scale(.97)}
/* Con un número impar de fotos, la última va centrada y no queda sola a un costado */
.dl-polaroid:last-child:nth-child(odd){grid-column:1 / -1;justify-self:center;width:calc(50% - 7px)}
.dl-polaroid img{display:block;width:100%;aspect-ratio:1;object-fit:cover;background:var(--rg4)}
.dist-vacio{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:14.5px;color:var(--tinta2);text-align:center;
  background:#FFFFFF;border:1px dashed rgba(185,122,104,.55);border-radius:16px;padding:20px 16px}
.dist-vacio svg{color:var(--rg2)}
.dl-muro{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;text-decoration:none;background:#FFFFFF;
  border:1px solid rgba(142,85,70,.22);color:var(--tinta);box-shadow:0 8px 22px -16px rgba(34,37,46,.35);transition:transform .15s}
.dl-muro:active{transform:scale(.98)}
.dl-muro-fotos{display:flex;flex-shrink:0}
.dl-muro-fotos img{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #FFFFFF;box-shadow:0 0 0 1px var(--rg3)}
.dl-muro-fotos img+img{margin-left:-12px}
.dl-muro-texto{flex:1;min-width:0;display:flex;flex-direction:column;font-size:14.5px;font-weight:600;line-height:1.3}
.dl-muro-texto small{font-size:12px;font-weight:400;color:var(--tinta2);margin-top:2px}
.dl-muro-flecha{flex-shrink:0;color:var(--rg)}
.dist-visor{position:fixed;inset:0;z-index:9999;background:rgba(20,14,16,.94);display:flex;align-items:center;justify-content:center;padding:16px}
.dist-visor img{max-width:100%;max-height:86vh;object-fit:contain;border-radius:6px}
.dist-visor-cerrar,.dist-visor-flecha{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:50%;border:none;background:rgba(255,255,255,.14);color:#fff;cursor:pointer}
.dist-visor-cerrar{top:max(14px,env(safe-area-inset-top,14px));right:14px;width:42px;height:42px}
.dist-visor-flecha{top:50%;transform:translateY(-50%);width:44px;height:44px}
.dist-visor-flecha.izq{left:10px}.dist-visor-flecha.der{right:10px}
.dist-visor-cuenta{position:absolute;bottom:max(16px,env(safe-area-inset-bottom,16px));left:0;right:0;text-align:center;color:rgba(255,255,255,.8);font-size:13px;font-weight:600}
@media (max-width:360px){.dl-carta{padding:30px 20px 28px}.dl-texto>p:not(.dl-saludo):not(.dl-oracion):not(.dl-despedida):not(.dl-firma){font-size:18.5px}}
@media (prefers-reduced-motion:reduce){.dl-carta,.dist-seccion{animation:none}}
`;

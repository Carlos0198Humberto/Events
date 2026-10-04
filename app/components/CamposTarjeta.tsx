"use client";
// ─── Campos propios de la tarjeta de invitación ───────────────────────────────
//
// Lo usan "Nuevo evento" y "Editar evento" con los mismos datos (columna jsonb
// `eventos.tarjeta`, ver supabase-tarjeta.sql):
//   • <CamposTarjeta>   → frase de honor, graduando, carrera, institución,
//                         familia, y la vista previa de la tarjeta real.
//   • <CamposDireccion> → dirección completa y punto de referencia, que van en
//                         la sección "Fecha y lugar".
// Usa las clases de formulario de las dos páginas (field-label, field-input…).

import { useEffect, useRef, useState } from "react";
import { armarDatosTarjeta, doradoCss, FRASES_HONOR, PALETAS_TARJETA, paletaDe, type EventoTarjeta, type ExtrasTarjeta } from "@/lib/tarjetaInvitacion";

const CARRERAS = [
  "Bachillerato General",
  "Bachillerato Técnico Vocacional",
  "Técnico en ",
  "Licenciatura en ",
  "Ingeniería en ",
  "Arquitectura",
  "Doctorado en Medicina",
  "Profesorado en ",
  "Maestría en ",
  "Doctorado en ",
  "Kínder · Preparatoria",
  "Educación Básica (noveno grado)",
];

type Props = {
  tipo: string;
  valor: ExtrasTarjeta;
  onChange: (v: ExtrasTarjeta) => void;
  /** Lo demás del evento, solo para la vista previa */
  evento: Omit<EventoTarjeta, "tarjeta" | "tipo">;
};

const chip = (activo: boolean): React.CSSProperties => ({
  padding: "6px 11px",
  borderRadius: 99,
  border: activo ? "2px solid var(--accent)" : "1.5px solid var(--border-mid)",
  background: activo ? "var(--accent)" : "var(--surface)",
  color: activo ? "#fff" : "var(--text2)",
  fontSize: 11.5,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif",
  lineHeight: 1.2,
  minHeight: 32,
  transition: "all .15s",
  WebkitTapHighlightColor: "transparent",
});

export function CamposTarjeta({ tipo, valor, onChange, evento }: Props) {
  const esGrad = tipo === "graduacion";
  const frases = FRASES_HONOR[tipo] ?? FRASES_HONOR.otro;
  const set = (k: keyof ExtrasTarjeta, v: string) => onChange({ ...valor, [k]: v });

  // undefined = la frase de siempre; "" = sin frase; otro texto = esa frase
  const honor = valor.honor;
  const esPropia = honor != null && honor !== "" && !frases.some((f) => f.toLowerCase() === honor.toLowerCase());
  const [propia, setPropia] = useState(esPropia);
  useEffect(() => { if (esPropia) setPropia(true); }, [esPropia]);

  const paletaActiva = paletaDe({ tipo, tarjeta: valor }).id;

  return (
    <div className="fields-group">
      <div>
        <label className="field-label">Colores de la tarjeta</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(92px,1fr))", gap: 8 }}>
          {Object.values(PALETAS_TARJETA).map((p) => {
            const activa = paletaActiva === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ ...valor, paleta: p.id })}
                aria-pressed={activa}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 6px", borderRadius: 12, cursor: "pointer",
                  border: activa ? "2px solid var(--accent)" : "1.5px solid var(--border-mid)",
                  background: activa ? "var(--accent-soft2, rgba(79,70,229,0.16))" : "var(--surface)",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {/* Muestra: el fondo de la paleta con una franja de su dorado */}
                <span style={{ width: "100%", height: 34, borderRadius: 8, background: `radial-gradient(circle at 50% 45%, ${p.fondoCentro}, ${p.fondo} 75%)`, border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: "58%", height: 6, borderRadius: 3, backgroundImage: doradoCss(p) }} />
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: activa ? "var(--accent2)" : "var(--text2)", lineHeight: 1.2, textAlign: "center" }}>{p.nombre}</span>
              </button>
            );
          })}
        </div>
        <p className="field-hint">Si no elegís, va la del tipo de evento: azul noche en graduación, marfil en bodas, rosa vino en XV años.</p>
      </div>

      <div>
        <label className="field-label">Frase sobre el nombre</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {frases.map((f) => {
            const activo = !propia && (honor ?? (esGrad ? "En honor a" : null))?.toLowerCase() === f.toLowerCase();
            return (
              <button key={f} type="button" style={chip(activo)} onClick={() => { setPropia(false); onChange({ ...valor, honor: f }); }}>
                {f}
              </button>
            );
          })}
          <button type="button" style={chip(propia)} onClick={() => { setPropia(true); onChange({ ...valor, honor: esPropia ? honor : "" }); }}>
            ✏️ Escribir otra
          </button>
          <button type="button" style={chip(!propia && honor === "")} onClick={() => { setPropia(false); onChange({ ...valor, honor: "" }); }}>
            Sin frase
          </button>
        </div>
        {propia && (
          <input
            className="field-input"
            style={{ marginTop: 9 }}
            type="text"
            maxLength={48}
            autoFocus
            value={honor ?? ""}
            onChange={(e) => set("honor", e.target.value)}
            placeholder="Ej: Con amor y orgullo celebramos a"
          />
        )}
        <p className="field-hint">Es la línea pequeña en mayúsculas que va arriba del nombre en la tarjeta.</p>
      </div>

      <div>
        <label className="field-label">{esGrad ? "Nombre completo del graduando" : "Nombre de quien se celebra"}</label>
        <input
          className="field-input"
          type="text"
          maxLength={60}
          autoComplete="off"
          value={valor.graduando ?? ""}
          onChange={(e) => set("graduando", e.target.value)}
          placeholder={esGrad ? "Ej: Andrea Sofía Castillo" : "Ej: Sofía Martínez"}
        />
        <p className="field-hint">Es el nombre grande de la tarjeta. Si lo dejás vacío se toma del nombre del evento.</p>
      </div>

      {esGrad && (
        <>
          <div>
            <label className="field-label">¿De qué se gradúa?</label>
            <input
              className="field-input"
              type="text"
              list="carreras-sugeridas"
              maxLength={90}
              value={valor.carrera ?? ""}
              onChange={(e) => set("carrera", e.target.value)}
              placeholder="Ej: Licenciatura en Ciencias de la Educación"
            />
            <datalist id="carreras-sugeridas">
              {CARRERAS.map((c) => <option key={c} value={c} />)}
            </datalist>
            <p className="field-hint">Título, carrera o grado. Aparece debajo del nombre.</p>
          </div>
          <div>
            <label className="field-label">Institución</label>
            <input
              className="field-input"
              type="text"
              maxLength={90}
              value={valor.institucion ?? ""}
              onChange={(e) => set("institucion", e.target.value)}
              placeholder="Ej: Universidad de El Salvador"
            />
          </div>
        </>
      )}

      {evento.imagen_url && (
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1.5px solid var(--border-mid)", background: "var(--accent-soft)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={valor.foto !== false}
            onChange={(e) => onChange({ ...valor, foto: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: "var(--accent)", flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>
            Poner la foto de portada en la tarjeta
            <span style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--text3)" }}>En un círculo dorado, arriba del título.</span>
          </span>
        </label>
      )}

      <div>
        <label className="field-label">Familia que invita</label>
        <input
          className="field-input"
          type="text"
          maxLength={70}
          value={valor.familia ?? ""}
          onChange={(e) => set("familia", e.target.value)}
          placeholder="Ej: Familia Castillo Pérez"
        />
        <p className="field-hint">Firma la tarjeta al pie, en letra caligráfica. Si la dejás vacía y los anfitriones son una familia, se usan ellos.</p>
      </div>

      <VistaPreviaTarjeta evento={{ ...evento, tipo, tarjeta: valor }} />
    </div>
  );
}

export function CamposDireccion({ valor, onChange }: { valor: ExtrasTarjeta; onChange: (v: ExtrasTarjeta) => void }) {
  return (
    <>
      <div>
        <label className="field-label">Dirección completa</label>
        <textarea
          className="field-input field-textarea"
          rows={2}
          maxLength={140}
          value={valor.direccion ?? ""}
          onChange={(e) => onChange({ ...valor, direccion: e.target.value })}
          placeholder="Ej: Bulevar Los Próceres, Antiguo Cuscatlán, La Libertad"
        />
        <p className="field-hint">Calle, colonia y municipio. Se imprime en la tarjeta debajo del nombre del lugar.</p>
      </div>
      <div>
        <label className="field-label">Punto de referencia</label>
        <input
          className="field-input"
          type="text"
          maxLength={140}
          value={valor.referencia ?? ""}
          onChange={(e) => onChange({ ...valor, referencia: e.target.value })}
          placeholder="Ej: Frente a la gasolinera Puma, portón negro"
        />
        <p className="field-hint">Lo que alguien que nunca fue reconocería al llegar. Acompaña a la foto del lugar.</p>
      </div>
    </>
  );
}

/** La tarjeta real (la misma imagen que se envía), con un invitado de ejemplo. */
function VistaPreviaTarjeta({ evento }: { evento: EventoTarjeta }) {
  const [url, setUrl] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [abierta, setAbierta] = useState(false);
  const urlRef = useRef<string | null>(null);
  const firma = JSON.stringify(evento);

  useEffect(() => {
    if (!abierta) return;
    let vigente = true;
    // Espera a que se deje de escribir antes de redibujar
    const t = setTimeout(async () => {
      setGenerando(true);
      const { generarTarjetaPNG } = await import("@/lib/tarjetaCanvas");
      const datos = armarDatosTarjeta(
        { ...evento, nombre: evento.nombre || "Mi evento", fecha: evento.fecha || null, hora: evento.hora || null },
        "María José",
        "f",
      );
      const blob = await generarTarjetaPNG(datos);
      if (!vigente || !blob) { setGenerando(false); return; }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      setUrl(urlRef.current);
      setGenerando(false);
    }, 450);
    return () => { vigente = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, abierta]);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  return (
    <div style={{ borderRadius: 14, border: "1.5px solid var(--border-mid)", overflow: "hidden", background: "var(--surface2, #F4F5FB)" }}>
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", minHeight: 46, border: "none", background: "transparent", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--accent2)" }}
      >
        <span>🖼️ {abierta ? "Ocultar vista previa" : "Ver cómo queda la tarjeta"}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: abierta ? "rotate(180deg)" : "none", transition: "transform .2s" }}><path d="M5 8l5 5 5-5" /></svg>
      </button>
      {abierta && (
        <div style={{ padding: "0 12px 12px", position: "relative" }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 340, margin: "0 auto", aspectRatio: "1080 / 1350", borderRadius: 10, overflow: "hidden", background: "#0D0D0F", boxShadow: "0 10px 30px rgba(15,23,42,0.25)" }}>
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Vista previa de la tarjeta" style={{ width: "100%", height: "100%", display: "block", opacity: generando ? 0.55 : 1, transition: "opacity .2s" }} />
            )}
            {generando && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#D4B068", fontSize: 12, fontWeight: 700, letterSpacing: ".1em" }}>
                DIBUJANDO…
              </div>
            )}
          </div>
          <p className="field-hint" style={{ textAlign: "center", marginTop: 8 }}>
            Así la recibe cada invitado (acá con un nombre de ejemplo). Se actualiza mientras escribís.
          </p>
        </div>
      )}
    </div>
  );
}

/** Une los extras con lo guardado, sin campos vacíos (se guarda null si no queda nada). */
export function extrasParaGuardar(v: ExtrasTarjeta): ExtrasTarjeta | null {
  const out: Record<string, string | boolean> = {};
  // La foto va por defecto: solo se guarda cuando se la saca
  if (v.foto === false) out.foto = false;
  for (const [k, val] of Object.entries(v)) {
    if (typeof val !== "string") continue;
    const t = val.replace(/\s+/g, " ").trim();
    // honor "" es una elección ("sin frase"): se guarda aunque esté vacío
    if (t || k === "honor") out[k] = t;
  }
  return Object.keys(out).length ? (out as ExtrasTarjeta) : null;
}

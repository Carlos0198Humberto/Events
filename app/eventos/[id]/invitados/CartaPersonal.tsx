"use client";
// ─── La carta de UNA persona a distancia ──────────────────────────────────────
// La tía de Estados Unidos y el amigo de la universidad no reciben lo mismo:
// el organizador puede escribirle a cada uno su carta (un párrafo por línea)
// y la frase de su tarjeta. Vacío = la carta de su vínculo o la general.
// Al final la carta cierra siempre con la oración y la bendición.

import { useState } from "react";
import { MAX_CARTA, MAX_DEDICATORIA } from "@/lib/tarjetaInvitacion";

export type CartaGuardada = { carta: string | null; dedicatoria: string | null };

type Props = {
  nombre: string;
  /** «Querida Rosa,»: con lo que empieza la carta, arriba de lo que se escribe */
  saludo: string;
  /** Lo que guardó antes el organizador para esta persona */
  actual: CartaGuardada;
  /** La carta que recibe hoy (la de su vínculo, la general o la automática), sin el cierre */
  sugerida: string;
  /** La oración final, que va siempre */
  cierre: string;
  /** La frase que lleva hoy su tarjeta */
  dedicatoriaSugerida: string;
  onGuardar: (c: CartaGuardada) => Promise<boolean>;
  onCerrar: () => void;
};

export default function CartaPersonal({ nombre, saludo, actual, sugerida, cierre, dedicatoriaSugerida, onGuardar, onCerrar }: Props) {
  const [carta, setCarta] = useState(actual.carta ?? "");
  const [dedicatoria, setDedicatoria] = useState(actual.dedicatoria ?? "");
  const [guardando, setGuardando] = useState(false);
  const tienePropia = !!(actual.carta || actual.dedicatoria);

  async function guardar(c: CartaGuardada) {
    setGuardando(true);
    const ok = await onGuardar(c);
    setGuardando(false);
    if (ok) onCerrar();
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <style>{`
        .cp-card { background: var(--surface); border-radius: 24px; padding: 20px 18px 16px; max-width: 520px; width: 100%; max-height: calc(100dvh - 40px); overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.28); border: 1.5px solid var(--border); }
        .cp-titulo { font-family: 'Cormorant Garamond', serif; font-size: 23px; font-weight: 600; color: var(--text); text-align: center; }
        .cp-sub { font-size: 12.5px; color: var(--text2); text-align: center; line-height: 1.5; margin: 4px 0 14px; }
        .cp-etiqueta { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 12px; font-weight: 700; color: var(--text); margin: 12px 0 6px; }
        .cp-cuenta { font-size: 10.5px; font-weight: 600; color: var(--text3, var(--text2)); }
        .cp-saludo { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 17px; color: #9D174D; margin: 0 0 6px 2px; }
        .cp-campo { width: 100%; border: 1.5px solid var(--border-input); border-radius: 12px; padding: 10px 12px; font-size: 14px; line-height: 1.5; font-family: inherit; background: var(--surface); color: var(--text); resize: vertical; }
        .cp-campo:focus { outline: none; border-color: #9D174D; }
        .cp-ayuda { font-size: 11px; color: var(--text2); line-height: 1.45; margin-top: 5px; }
        .cp-partir { display: inline-block; margin-top: 6px; padding: 0; border: none; background: none; font-size: 12px; font-weight: 700; color: #9D174D; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; font-family: inherit; }
        .cp-cierre { margin-top: 8px; padding: 9px 11px; border-radius: 12px; background: #FDF2F8; border: 1px dashed #FBCFE8; font-size: 12px; line-height: 1.45; color: #831843; }
        .cp-cierre b { display: block; font-size: 10.5px; letter-spacing: .6px; text-transform: uppercase; margin-bottom: 3px; }
        .cp-acciones { display: flex; gap: 8px; margin-top: 14px; position: sticky; bottom: -16px; background: var(--surface); padding: 10px 0 4px; }
        .cp-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .cp-guardar { flex: 2; border: none; background: #9D174D; color: #fff; }
        .cp-btn:disabled { opacity: .45; cursor: not-allowed; }
        .cp-quitar { display: block; width: 100%; margin-top: 8px; padding: 4px; border: none; background: none; font-size: 12px; font-weight: 600; color: var(--text2); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; font-family: inherit; }
      `}</style>

      <div className="cp-card" role="dialog" aria-modal="true" aria-label={`Carta para ${nombre}`}>
        <div className="cp-titulo">Carta para {nombre}</div>
        <div className="cp-sub">Solo esta persona la recibe. La lee al abrir su invitación y la voz se la lee completa.</div>

        <label className="cp-etiqueta" htmlFor="cp-dedicatoria">
          Frase de su tarjeta
          <span className="cp-cuenta">{dedicatoria.length}/{MAX_DEDICATORIA}</span>
        </label>
        <input
          id="cp-dedicatoria"
          className="cp-campo"
          value={dedicatoria}
          maxLength={MAX_DEDICATORIA}
          placeholder={dedicatoriaSugerida}
          onChange={(e) => setDedicatoria(e.target.value)}
        />
        <div className="cp-ayuda">Va en la tarjeta y en el mensaje de WhatsApp. Vacía, lleva la de siempre: «{dedicatoriaSugerida}»</div>

        <label className="cp-etiqueta" htmlFor="cp-carta">
          Su carta
          <span className="cp-cuenta">{carta.length.toLocaleString("es")}/{MAX_CARTA.toLocaleString("es")}</span>
        </label>
        <p className="cp-saludo">{saludo}</p>
        <textarea
          id="cp-carta"
          className="cp-campo"
          rows={14}
          value={carta}
          maxLength={MAX_CARTA}
          placeholder="Escribile lo que querés que lea. Cada renglón es un párrafo."
          onChange={(e) => setCarta(e.target.value)}
        />
        {!carta.trim() && (
          <button type="button" className="cp-partir" onClick={() => setCarta(sugerida)}>
            Empezar con la carta que recibe ahora y cambiarla
          </button>
        )}
        <div className="cp-cierre">
          <b>Al final va siempre</b>
          {cierre} Y después, la bendición y la firma.
        </div>

        <div className="cp-acciones">
          <button type="button" className="cp-btn" onClick={onCerrar}>Cancelar</button>
          <button
            type="button"
            className="cp-btn cp-guardar"
            disabled={guardando || (!carta.trim() && !dedicatoria.trim() && !tienePropia)}
            onClick={() => guardar({ carta: carta.trim() || null, dedicatoria: dedicatoria.trim() || null })}
          >
            {guardando ? "Guardando…" : "Guardar su carta"}
          </button>
        </div>
        {tienePropia && (
          <button type="button" className="cp-quitar" disabled={guardando} onClick={() => guardar({ carta: null, dedicatoria: null })}>
            Volver a la carta de siempre
          </button>
        )}
      </div>
    </div>
  );
}

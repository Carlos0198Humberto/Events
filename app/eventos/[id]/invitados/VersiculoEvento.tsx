"use client";
// ─── Versículo de la invitación ───────────────────────────────────────────────
// Sugerencias según el tipo de evento (Reina-Valera 1960) o uno propio. Va en
// la tarjeta, en la vista previa de WhatsApp y en el mensaje de invitación.

import { useState } from "react";
import { versiculoDe, versiculosPara, type Versiculo } from "@/lib/versiculos";

type Props = {
  tipo: string;
  actual: Versiculo | null;
  onGuardar: (v: Versiculo | null) => Promise<boolean>;
  onCerrar: () => void;
};

export default function VersiculoEvento({ tipo, actual, onGuardar, onCerrar }: Props) {
  const sugeridos = versiculosPara(tipo);
  const indiceActual = actual ? sugeridos.findIndex((s) => s.cita === actual.cita && s.texto === actual.texto) : -1;
  const [eleccion, setEleccion] = useState<number | "ninguno" | "propio">(
    !actual ? "ninguno" : indiceActual >= 0 ? indiceActual : "propio",
  );
  const [texto, setTexto] = useState(indiceActual < 0 ? actual?.texto ?? "" : "");
  const [cita, setCita] = useState(indiceActual < 0 ? actual?.cita ?? "" : "");
  const [guardando, setGuardando] = useState(false);

  const propio = versiculoDe(texto, cita);
  const elegido: Versiculo | null =
    eleccion === "ninguno" ? null : eleccion === "propio" ? propio : sugeridos[eleccion];
  const valido = eleccion !== "propio" || !!propio;

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    const ok = await onGuardar(elegido);
    setGuardando(false);
    if (ok) onCerrar();
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <style>{`
        .vs-card { background: var(--surface); border-radius: 24px; padding: 20px 18px 16px; max-width: 460px; width: 100%; max-height: calc(100dvh - 40px); overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.28); border: 1.5px solid var(--border); }
        .vs-titulo { font-family: 'Cormorant Garamond', serif; font-size: 23px; font-weight: 600; color: var(--text); text-align: center; }
        .vs-sub { font-size: 12.5px; color: var(--text2); text-align: center; line-height: 1.5; margin: 4px 0 14px; }
        .vs-op { display: block; width: 100%; text-align: left; padding: 12px 14px; margin-bottom: 8px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--surface2); cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .vs-op.activo { border-color: #B4873A; background: #1D1C20; }
        .vs-op-texto { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 16.5px; line-height: 1.35; color: var(--text); }
        .vs-op.activo .vs-op-texto { color: #F1E3BF; }
        .vs-op-cita { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #B4873A; margin-top: 5px; }
        .vs-op-simple { font-size: 13.5px; font-weight: 600; color: var(--text2); }
        .vs-op.activo .vs-op-simple { color: #E8CB82; }
        .vs-campo { width: 100%; border: 1.5px solid var(--border-input); border-radius: 12px; padding: 10px 12px; font-size: 14px; font-family: inherit; background: var(--surface); color: var(--text); margin-top: 8px; resize: vertical; }
        .vs-acciones { display: flex; gap: 8px; margin-top: 12px; position: sticky; bottom: -16px; background: var(--surface); padding: 10px 0 4px; }
        .vs-guardar { flex: 2; padding: 13px; border-radius: 12px; border: none; background: #1D1C20; color: #E8CB82; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .vs-guardar:disabled { opacity: .45; cursor: not-allowed; }
      `}</style>

      <div className="vs-card" role="dialog" aria-modal="true" aria-label="Versículo de la invitación">
        <div className="vs-titulo">Versículo en la invitación</div>
        <div className="vs-sub">Aparece en la tarjeta, en la vista previa de WhatsApp y en el mensaje. Reina-Valera 1960.</div>

        <button type="button" className={`vs-op${eleccion === "ninguno" ? " activo" : ""}`} onClick={() => setEleccion("ninguno")}>
          <div className="vs-op-simple">Sin versículo</div>
        </button>

        {sugeridos.map((v, i) => (
          <button key={v.cita} type="button" className={`vs-op${eleccion === i ? " activo" : ""}`} onClick={() => setEleccion(i)}>
            <div className="vs-op-texto">«{v.texto}»</div>
            <div className="vs-op-cita">{v.cita}</div>
          </button>
        ))}

        <button type="button" className={`vs-op${eleccion === "propio" ? " activo" : ""}`} onClick={() => setEleccion("propio")}>
          <div className="vs-op-simple">Escribir otro versículo</div>
        </button>
        {eleccion === "propio" && (
          <div>
            <textarea className="vs-campo" rows={3} placeholder="Texto del versículo" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={260} />
            <input className="vs-campo" placeholder="Cita, por ejemplo: Salmos 23:1" value={cita} onChange={(e) => setCita(e.target.value)} maxLength={40} />
          </div>
        )}

        <div className="vs-acciones">
          <button className="btn-cancel" type="button" onClick={onCerrar}>Cancelar</button>
          <button className="vs-guardar" type="button" onClick={guardar} disabled={!valido || guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

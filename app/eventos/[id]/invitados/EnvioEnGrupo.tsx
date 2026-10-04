"use client";
// ─── Envío en grupo: invitación o recordatorio a varios invitados ─────────────
//
// WhatsApp no deja que una página mande mensajes sola: cada envío lo confirma
// una persona dentro de WhatsApp (mandar en simultáneo exige la API de
// WhatsApp Business, paga y con número propio). Esto es lo más rápido que se
// puede sin ella: se eligen los invitados una vez y la cola deja listo al
// siguiente cada vez que se vuelve. Un toque por invitado, y todos los envíos
// se abren en la MISMA pestaña de WhatsApp en vez de una por invitado.

import { useMemo, useState } from "react";
import { openWhatsApp } from "@/app/utils/openWhatsApp";
import { saludo, type Trato } from "@/lib/tratoInvitado";

export type TipoEnvio = "invitacion" | "recordatorio";
export type InvitadoEnvio = { nombre: string; token: string; telefono?: string; estado?: string };
export type MarcasEnvio = Record<string, { enviado_at?: string | null; recordatorio_at?: string | null }>;

type Props = {
  invitados: InvitadoEnvio[];
  tipoInicial: TipoEnvio;
  preseleccion: string[];
  marcas: MarcasEnvio;
  tratoDe: (inv: InvitadoEnvio) => Trato;
  urlWhatsApp: (inv: InvitadoEnvio, tipo: TipoEnvio) => string;
  onEnviado: (inv: InvitadoEnvio, tipo: TipoEnvio) => void;
  onCerrar: () => void;
};

const pendiente = (inv: InvitadoEnvio) => !inv.estado || inv.estado === "pendiente";

export default function EnvioEnGrupo({ invitados, tipoInicial, preseleccion, marcas, tratoDe, urlWhatsApp, onEnviado, onCerrar }: Props) {
  const [tipo, setTipo] = useState<TipoEnvio>(tipoInicial);
  const [elegidos, setElegidos] = useState<Set<string>>(() => new Set(preseleccion));
  const [cola, setCola] = useState<InvitadoEnvio[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [hechos, setHechos] = useState(0);

  // Un recordatorio es para quien no confirmó: a los demás no se les ofrece
  const disponible = (inv: InvitadoEnvio) => tipo === "invitacion" || pendiente(inv);
  const visibles = invitados.filter(disponible);

  const filtros = useMemo(() => {
    const lista = invitados.filter((inv) => tipo === "invitacion" || pendiente(inv));
    return tipo === "invitacion"
      ? [
          // Quien ya respondió tiene la invitación aunque no figure como enviada
          { clave: "sin-enviar", texto: "Sin invitación", tokens: lista.filter((i) => !marcas[i.token]?.enviado_at && pendiente(i)).map((i) => i.token) },
          { clave: "pendientes", texto: "Sin confirmar", tokens: lista.filter(pendiente).map((i) => i.token) },
          { clave: "todos", texto: "Todos", tokens: lista.map((i) => i.token) },
        ]
      : [
          { clave: "sin-recordar", texto: "Sin recordatorio", tokens: lista.filter((i) => !marcas[i.token]?.recordatorio_at).map((i) => i.token) },
          { clave: "todos", texto: "Todos los que no confirmaron", tokens: lista.map((i) => i.token) },
        ];
  }, [invitados, marcas, tipo]);

  function cambiarTipo(t: TipoEnvio) {
    setTipo(t);
    // Al pasar a recordatorio se sueltan los que ya confirmaron o rechazaron
    if (t === "recordatorio") setElegidos((prev) => new Set([...prev].filter((tk) => invitados.some((i) => i.token === tk && pendiente(i)))));
  }

  function alternar(token: string) {
    setElegidos((prev) => {
      const s = new Set(prev);
      if (s.has(token)) s.delete(token); else s.add(token);
      return s;
    });
  }

  function empezar() {
    const lista = visibles.filter((i) => elegidos.has(i.token));
    if (lista.length === 0) return;
    setCola(lista);
    setIndice(0);
    setHechos(0);
  }

  function enviarActual() {
    if (!cola) return;
    const inv = cola[indice];
    openWhatsApp(urlWhatsApp(inv, tipo), "evorix-whatsapp");
    onEnviado(inv, tipo);
    setHechos((h) => h + 1);
    setIndice((i) => i + 1);
  }

  const nombreTipo = tipo === "invitacion" ? "invitación" : "recordatorio";
  const seleccionados = visibles.filter((i) => elegidos.has(i.token)).length;
  const actual = cola && indice < cola.length ? cola[indice] : null;

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <style>{`
        .eg-card { background: var(--surface); border-radius: 24px; padding: 20px 18px 16px; max-width: 440px; width: 100%; max-height: calc(100dvh - 40px); overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.28); border: 1.5px solid var(--border); }
        .eg-titulo { font-family: 'Cormorant Garamond', serif; font-size: 23px; font-weight: 600; color: var(--text); text-align: center; }
        .eg-sub { font-size: 12.5px; color: var(--text2); text-align: center; line-height: 1.5; margin: 4px 0 14px; }
        .eg-tipos { display: flex; background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 3px; margin-bottom: 12px; }
        .eg-tipo { flex: 1; padding: 9px; border: none; border-radius: 9px; background: transparent; font-size: 13px; font-weight: 700; color: var(--text2); cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .eg-tipo.activo { background: #1D1C20; color: #E8CB82; }
        .eg-filtros { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
        .eg-filtro { font-size: 11.5px; font-weight: 600; padding: 6px 10px; border-radius: 999px; border: 1.5px solid var(--border-input); background: var(--surface); color: var(--text2); cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .eg-lista { max-height: 42dvh; overflow-y: auto; border: 1px solid var(--border); border-radius: 14px; margin-bottom: 12px; }
        .eg-fila { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid var(--border); cursor: pointer; }
        .eg-fila:last-child { border-bottom: none; }
        .eg-fila input { width: 18px; height: 18px; accent-color: #B4873A; flex-shrink: 0; cursor: pointer; }
        .eg-fila-nombre { font-size: 13.5px; font-weight: 600; color: var(--text); }
        .eg-fila-info { font-size: 11px; color: var(--text3); margin-top: 1px; }
        .eg-marca { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; white-space: nowrap; margin-left: auto; }
        .eg-principal { width: 100%; padding: 14px; border-radius: 13px; border: none; background: linear-gradient(135deg, var(--wa-green), var(--wa-dark)); color: white; font-size: 14.5px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(37,211,102,0.35); }
        .eg-principal:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
        .eg-nota { font-size: 11.5px; color: var(--text3); text-align: center; line-height: 1.5; margin-top: 10px; }
        .eg-secundarias { display: flex; gap: 8px; margin-top: 8px; }
        .eg-secundarias .btn-cancel { padding: 11px; font-size: 13px; }
        .eg-progreso { height: 6px; border-radius: 999px; background: var(--surface2); overflow: hidden; margin: 6px 0 16px; }
        .eg-progreso div { height: 100%; background: linear-gradient(90deg, #B4873A, #E8CB82); transition: width .3s; }
        .eg-actual { background: var(--surface2); border: 1px solid var(--border); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 14px; }
        .eg-actual-nombre { font-size: 18px; font-weight: 700; color: var(--text); }
        .eg-actual-saludo { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 17px; color: var(--text2); margin-top: 4px; }
        .eg-actual-tel { font-size: 12px; color: var(--text3); margin-top: 6px; }
      `}</style>

      <div className="eg-card" role="dialog" aria-modal="true" aria-label="Enviar a varios">
        {!cola && (
          <>
            <div className="eg-titulo">Enviar a varios</div>
            <div className="eg-sub">Elegí a quiénes. Después vas mandando de a uno, con un toque cada uno: WhatsApp no permite que una página envíe mensajes sola.</div>

            <div className="eg-tipos" role="tablist">
              {(["invitacion", "recordatorio"] as TipoEnvio[]).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tipo === t} className={`eg-tipo${tipo === t ? " activo" : ""}`} onClick={() => cambiarTipo(t)}>
                  {t === "invitacion" ? "Invitación" : "Recordatorio"}
                </button>
              ))}
            </div>

            <div className="eg-filtros">
              {filtros.map((f) => (
                <button key={f.clave} type="button" className="eg-filtro" onClick={() => setElegidos(new Set(f.tokens))}>
                  {f.texto} ({f.tokens.length})
                </button>
              ))}
              <button type="button" className="eg-filtro" onClick={() => setElegidos(new Set())}>Ninguno</button>
            </div>

            {visibles.length === 0 ? (
              <div className="eg-nota" style={{ margin: "18px 0" }}>Todos ya confirmaron o rechazaron: no hay a quién recordarle.</div>
            ) : (
              <div className="eg-lista">
                {visibles.map((inv) => {
                  const m = marcas[inv.token];
                  const marca = tipo === "invitacion" ? (m?.enviado_at ? "Ya enviada" : null) : (m?.recordatorio_at ? "Ya recordado" : null);
                  return (
                    <label key={inv.token} className="eg-fila">
                      <input type="checkbox" checked={elegidos.has(inv.token)} onChange={() => alternar(inv.token)} />
                      <div style={{ minWidth: 0 }}>
                        <div className="eg-fila-nombre">{inv.nombre}</div>
                        <div className="eg-fila-info">{inv.telefono ? inv.telefono : "Sin número: elegís el contacto en WhatsApp"}</div>
                      </div>
                      {marca && <span className="eg-marca">{marca}</span>}
                    </label>
                  );
                })}
              </div>
            )}

            <button className="eg-principal" type="button" disabled={seleccionados === 0} onClick={empezar}>
              {seleccionados === 0 ? "Elegí al menos uno" : `Empezar: ${seleccionados} ${seleccionados === 1 ? nombreTipo : tipo === "invitacion" ? "invitaciones" : "recordatorios"}`}
            </button>
            <div className="eg-secundarias">
              <button className="btn-cancel" type="button" onClick={onCerrar}>Cancelar</button>
            </div>
          </>
        )}

        {cola && actual && (
          <>
            <div className="eg-titulo">Enviando {nombreTipo === "invitación" ? "invitaciones" : "recordatorios"}</div>
            <div className="eg-sub">{indice + 1} de {cola.length}</div>
            <div className="eg-progreso"><div style={{ width: `${(indice / cola.length) * 100}%` }} /></div>
            <div className="eg-actual">
              <div className="eg-actual-nombre">{actual.nombre}</div>
              <div className="eg-actual-saludo">{saludo(actual.nombre, tratoDe(actual))}:</div>
              <div className="eg-actual-tel">{actual.telefono ? `📱 ${actual.telefono}` : "Sin número: en WhatsApp elegís el contacto"}</div>
            </div>
            <button className="eg-principal" type="button" onClick={enviarActual}>
              Abrir WhatsApp con {actual.nombre.split(" ")[0]}
            </button>
            <div className="eg-secundarias">
              <button className="btn-cancel" type="button" onClick={() => setIndice((i) => i + 1)}>Saltar</button>
              <button className="btn-cancel" type="button" onClick={onCerrar}>Terminar</button>
            </div>
            <div className="eg-nota">Mandalo en WhatsApp y volvé a esta pestaña: {indice + 1 < cola.length ? `${cola[indice + 1].nombre.split(" ")[0]} ya va a estar listo.` : "es el último."}</div>
          </>
        )}

        {cola && !actual && (
          <>
            <div className="eg-titulo">¡Listo!</div>
            <div className="eg-sub">
              {hechos === 0
                ? "No se abrió ningún envío."
                : `Se abrieron ${hechos} ${hechos === 1 ? nombreTipo : tipo === "invitacion" ? "invitaciones" : "recordatorios"} en WhatsApp. Quedan marcados para no repetirlos.`}
            </div>
            <button className="eg-principal" type="button" onClick={onCerrar}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}

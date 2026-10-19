"use client";
// ─── Reuniones del día de la graduación (lo que arma el organizador) ──────────
//
// Encuentros más chicos ese día: una reunión familiar, una cena. Cada uno con
// su día, hora, lugar y sus invitados (de la lista de la graduación o nuevos),
// y una invitación aparte por persona: su tarjeta, su mensaje de WhatsApp y su
// enlace (/reunion/<token>), donde confirma si va. Tablas y permisos en
// supabase-reuniones.sql; la lógica pura en lib/reuniones.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { openWhatsApp } from "@/app/utils/openWhatsApp";
import { PhoneInput } from "@/app/components/PhoneInput";
import { toast } from "@/app/components/Toast";
import { IcoCalendario, IcoCheck, IcoEnlace, IcoPapelera, IcoPersonas, IcoUbicacion, IcoWhatsApp } from "@/app/components/Iconos";
import { datosTarjetaReunion, limpiarReunion, MAX_NOTA_REUNION, nuevoTokenReunion, resumenReunion, type InvitadoReunion, type Reunion } from "@/lib/reuniones";
import { armarMensajeReunion } from "@/lib/mensajeInvitacion";
import { fechaLarga, horaCorta, type EventoTarjeta } from "@/lib/tarjetaInvitacion";
import { tratoDe } from "@/lib/tratoInvitado";

type Evento = EventoTarjeta & { id: string };
type InvitadoLista = { id: string; nombre: string; telefono: string | null; num_personas: number | null; estado: string | null; token: string; a_distancia?: boolean | null };

const NOMBRES_SUGERIDOS = ["Reunión familiar", "Cena de celebración", "Almuerzo familiar", "Reunión con amigos"];
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const linkDe = (token: string) => `${window.location.origin}/reunion/${token}`;
const TABLA_FALTA = /reuniones|reunion_invitados|schema cache|does not exist|42P01|PGRST205/i;

export default function ReunionesDelDia() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [lista, setLista] = useState<InvitadoLista[]>([]);
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [invitados, setInvitados] = useState<InvitadoReunion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [faltaSql, setFaltaSql] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<Reunion | "nueva" | null>(null);
  const [eligiendo, setEligiendo] = useState<Reunion | null>(null);
  const [nueva, setNueva] = useState<Reunion | null>(null);
  const [enviando, setEnviando] = useState<{ reunion: Reunion; inv: InvitadoReunion } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase.from("eventos").select("*").eq("id", id).single();
      if (ev) setEvento(ev as Evento);
      const base = "id, nombre, telefono, num_personas, estado, token";
      const conDistancia = await supabase.from("invitados").select(`${base}, a_distancia`).eq("evento_id", id).order("nombre");
      const filas = conDistancia.error ? (await supabase.from("invitados").select(base).eq("evento_id", id).order("nombre")).data : conDistancia.data;
      setLista((filas ?? []) as InvitadoLista[]);
      await cargarReuniones();
      setCargando(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cargarReuniones() {
    const { data: rs, error } = await supabase.from("reuniones").select("*").eq("evento_id", id).order("fecha").order("hora");
    if (error) { setFaltaSql(TABLA_FALTA.test(`${error.code} ${error.message}`)); return; }
    setFaltaSql(false);
    setReuniones((rs ?? []) as Reunion[]);
    const ids = (rs ?? []).map((r) => r.id);
    if (!ids.length) { setInvitados([]); return; }
    const { data: ri } = await supabase.from("reunion_invitados").select("*").in("reunion_id", ids).order("created_at");
    setInvitados((ri ?? []) as InvitadoReunion[]);
  }

  // El token de la lista de la graduación: ahí guarda el organizador cómo saludar a cada uno
  const tokenPrincipal = useMemo(() => new Map(lista.map((i) => [i.id, i.token])), [lista]);
  const tratoInvitado = (ri: InvitadoReunion) => tratoDe(ri.nombre, (ri.invitado_id && tokenPrincipal.get(ri.invitado_id)) || undefined);

  async function guardarReunion(datos: Omit<Reunion, "id" | "evento_id" | "created_at">, existente: Reunion | null): Promise<boolean> {
    const r = existente
      ? await supabase.from("reuniones").update(datos).eq("id", existente.id).select().single()
      : await supabase.from("reuniones").insert({ ...datos, evento_id: id }).select().single();
    if (r.error) {
      toast.error(TABLA_FALTA.test(`${r.error.code} ${r.error.message}`) ? "Falta correr supabase-reuniones.sql en Supabase" : "No se pudo guardar. Probá de nuevo.");
      return false;
    }
    await cargarReuniones();
    if (!existente) setAbierta((r.data as Reunion).id);
    toast.success(existente ? "Reunión actualizada" : "Reunión creada: ahora agregá a los invitados");
    return true;
  }

  async function eliminarReunion(r: Reunion) {
    const n = invitados.filter((i) => i.reunion_id === r.id).length;
    if (!confirm(`¿Eliminar «${r.nombre}»?${n ? ` Sus ${n} invitaciones dejan de funcionar.` : ""}`)) return;
    const { error } = await supabase.from("reuniones").delete().eq("id", r.id);
    if (error) { toast.error("No se pudo eliminar. Probá de nuevo."); return; }
    await cargarReuniones();
    toast.success("Reunión eliminada");
  }

  async function agregar(reunion: Reunion, filas: Pick<InvitadoReunion, "invitado_id" | "nombre" | "telefono" | "num_personas">[]): Promise<boolean> {
    if (!filas.length) return true;
    const nuevas = filas.map((f) => ({ ...f, reunion_id: reunion.id, token: nuevoTokenReunion() }));
    const { error } = await supabase.from("reunion_invitados").insert(nuevas);
    if (error) { toast.error("No se pudo agregar. Probá de nuevo."); return false; }
    await cargarReuniones();
    toast.success(filas.length === 1 ? `${filas[0].nombre} está invitado a ${reunion.nombre}` : `${filas.length} invitados agregados a ${reunion.nombre}`);
    return true;
  }

  async function quitar(ri: InvitadoReunion) {
    if (!confirm(`¿Quitar a ${ri.nombre} de esta reunión? Su enlace deja de funcionar.`)) return;
    const { error } = await supabase.from("reunion_invitados").delete().eq("id", ri.id);
    if (error) { toast.error("No se pudo quitar. Probá de nuevo."); return; }
    setInvitados((l) => l.filter((x) => x.id !== ri.id));
  }

  async function marcarEnviado(ri: InvitadoReunion) {
    const ahora = new Date().toISOString();
    setInvitados((l) => l.map((x) => (x.id === ri.id ? { ...x, enviado_at: ahora } : x)));
    await supabase.from("reunion_invitados").update({ enviado_at: ahora }).eq("id", ri.id);
  }

  async function copiarEnlace(ri: InvitadoReunion) {
    try { await navigator.clipboard.writeText(linkDe(ri.token)); toast.success("Enlace copiado"); }
    catch { toast.error("No se pudo copiar el enlace"); }
  }

  return (
    <main className="rn">
      <style>{ESTILOS}</style>
      <header className="rn-barra">
        <Link href="/dashboard" className="rn-volver">← Volver</Link>
        <div>
          <p className="rn-kicker">{evento?.nombre ?? "Graduación"}</p>
          <h1>Reuniones del día</h1>
        </div>
      </header>

      <div className="rn-cuerpo">
        <p className="rn-intro">
          Además de la ceremonia, armá encuentros más cercanos ese día: una reunión familiar, una cena.
          Cada uno tiene su propia invitación: su tarjeta, su mensaje y su enlace para confirmar.
        </p>

        {cargando ? (
          <div className="rn-cargando" aria-label="Cargando" />
        ) : faltaSql ? (
          <div className="rn-aviso">
            <b>Falta preparar la base de datos</b>
            Corré <code>supabase-reuniones.sql</code> en el SQL Editor de Supabase y recargá esta página.
          </div>
        ) : (
          <>
            <button type="button" className="rn-nueva" onClick={() => setFormulario("nueva")}>+ Nueva reunión</button>

            {reuniones.length === 0 && (
              <p className="rn-vacio">Todavía no hay reuniones. Creá la primera: por ejemplo, una reunión familiar después de la ceremonia.</p>
            )}

            {reuniones.map((r) => {
              const suyos = invitados.filter((i) => i.reunion_id === r.id);
              const res = resumenReunion(suyos);
              const abiertaEsta = abierta === r.id;
              return (
                <article key={r.id} className="rn-reunion">
                  <button type="button" className="rn-cab" onClick={() => setAbierta(abiertaEsta ? null : r.id)} aria-expanded={abiertaEsta}>
                    <span className="rn-nombre">{r.nombre}</span>
                    <span className="rn-cuando">
                      <IcoCalendario size={14} />
                      {r.fecha ? mayuscula(fechaLarga(r.fecha)) : "Sin día"}{r.hora ? ` · ${horaCorta(r.hora)}` : ""}
                    </span>
                    {r.lugar && <span className="rn-cuando"><IcoUbicacion size={14} />{r.lugar}</span>}
                    <span className="rn-chips">
                      <span className="rn-chip si">Van {res.van}</span>
                      <span className="rn-chip">Sin respuesta {res.sinRespuesta}</span>
                      {res.noVan > 0 && <span className="rn-chip no">No van {res.noVan}</span>}
                      <span className="rn-chip">{res.invitaciones} invitado{res.invitaciones !== 1 ? "s" : ""}</span>
                    </span>
                  </button>

                  {abiertaEsta && (
                    <div className="rn-detalle">
                      <div className="rn-acciones">
                        <button type="button" className="rn-btn principal" onClick={() => setEligiendo(r)}><IcoPersonas size={15} /> Agregar de mi lista</button>
                        <button type="button" className="rn-btn" onClick={() => setNueva(r)}>+ Persona nueva</button>
                        <button type="button" className="rn-btn" onClick={() => setFormulario(r)}>Editar</button>
                        <button type="button" className="rn-btn peligro" onClick={() => eliminarReunion(r)}><IcoPapelera size={14} /> Eliminar</button>
                      </div>

                      {suyos.length === 0 ? (
                        <p className="rn-vacio">Todavía no hay invitados en esta reunión.</p>
                      ) : (
                        <ul className="rn-lista">
                          {suyos.map((ri) => (
                            <li key={ri.id}>
                              <div className="rn-persona">
                                <b>{ri.nombre}</b>
                                <small>
                                  {ri.num_personas > 1 ? `${ri.num_personas} lugares` : "1 lugar"}
                                  {ri.telefono ? ` · ${ri.telefono}` : " · Sin número"}
                                  {ri.enviado_at ? " · Enviada" : ""}
                                </small>
                              </div>
                              <span className={`rn-estado ${ri.estado}`}>
                                {ri.estado === "confirmado" ? `✓ Van ${ri.personas_confirmadas ?? 1}` : ri.estado === "rechazado" ? "No va" : "Sin respuesta"}
                              </span>
                              <div className="rn-fila-acc">
                                <button type="button" className="rn-icono wa" onClick={() => setEnviando({ reunion: r, inv: ri })} aria-label={`Enviar la invitación a ${ri.nombre}`}><IcoWhatsApp size={15} /> Enviar</button>
                                <button type="button" className="rn-icono" onClick={() => copiarEnlace(ri)} aria-label="Copiar enlace"><IcoEnlace size={15} /></button>
                                <button type="button" className="rn-icono" onClick={() => quitar(ri)} aria-label={`Quitar a ${ri.nombre}`}><IcoPapelera size={15} /></button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </>
        )}
      </div>

      {formulario && evento && (
        <FormReunion
          inicial={formulario === "nueva" ? null : formulario}
          fechaEvento={evento.fecha?.slice(0, 10) ?? ""}
          onGuardar={(d) => guardarReunion(d, formulario === "nueva" ? null : formulario)}
          onCerrar={() => setFormulario(null)}
        />
      )}
      {eligiendo && (
        <ElegirDeLista
          reunion={eligiendo}
          lista={lista}
          yaInvitados={new Set(invitados.filter((i) => i.reunion_id === eligiendo.id && i.invitado_id).map((i) => i.invitado_id!))}
          onAgregar={(filas) => agregar(eligiendo, filas)}
          onCerrar={() => setEligiendo(null)}
        />
      )}
      {nueva && (
        <PersonaNueva reunion={nueva} onAgregar={(fila) => agregar(nueva, [fila])} onCerrar={() => setNueva(null)} />
      )}
      {enviando && evento && (
        <EnviarReunion
          evento={evento}
          reunion={enviando.reunion}
          inv={enviando.inv}
          trato={tratoInvitado(enviando.inv)}
          siguiente={invitados.find((i) => i.reunion_id === enviando.reunion.id && !i.enviado_at && i.id !== enviando.inv.id) ?? null}
          onEnviado={marcarEnviado}
          onSiguiente={(inv) => setEnviando({ reunion: enviando.reunion, inv })}
          onCerrar={() => setEnviando(null)}
        />
      )}
    </main>
  );
}

// ─── Crear o editar una reunión ───────────────────────────────────────────────
function FormReunion({ inicial, fechaEvento, onGuardar, onCerrar }: {
  inicial: Reunion | null;
  fechaEvento: string;
  onGuardar: (d: Omit<Reunion, "id" | "evento_id" | "created_at">) => Promise<boolean>;
  onCerrar: () => void;
}) {
  const [v, setV] = useState({
    nombre: inicial?.nombre ?? "",
    fecha: inicial?.fecha ?? fechaEvento,
    hora: inicial?.hora?.slice(0, 5) ?? "",
    lugar: inicial?.lugar ?? "",
    direccion: inicial?.direccion ?? "",
    nota: inicial?.nota ?? "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const cambiar = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setError(""); };

  async function guardar() {
    const r = limpiarReunion(v);
    if (!r.ok) { setError(r.error); return; }
    setGuardando(true);
    const ok = await onGuardar(r.datos);
    setGuardando(false);
    if (ok) onCerrar();
  }

  return (
    <Modal titulo={inicial ? "Editar reunión" : "Nueva reunión"} onCerrar={onCerrar}>
      <label className="rn-etiqueta" htmlFor="rn-nombre">¿Qué es?</label>
      <input id="rn-nombre" className="rn-campo" value={v.nombre} maxLength={60} onChange={cambiar("nombre")} placeholder="Reunión familiar" />
      {!inicial && (
        <div className="rn-sugeridos">
          {NOMBRES_SUGERIDOS.map((n) => (
            <button key={n} type="button" className={`rn-sugerido${v.nombre === n ? " activo" : ""}`} onClick={() => setV({ ...v, nombre: n })}>{n}</button>
          ))}
        </div>
      )}
      <div className="rn-dos">
        <div>
          <label className="rn-etiqueta" htmlFor="rn-fecha">Día</label>
          <input id="rn-fecha" type="date" className="rn-campo" value={v.fecha} onChange={cambiar("fecha")} />
        </div>
        <div>
          <label className="rn-etiqueta" htmlFor="rn-hora">Hora</label>
          <input id="rn-hora" type="time" className="rn-campo" value={v.hora} onChange={cambiar("hora")} />
        </div>
      </div>
      <label className="rn-etiqueta" htmlFor="rn-lugar">Lugar</label>
      <input id="rn-lugar" className="rn-campo" value={v.lugar} maxLength={160} onChange={cambiar("lugar")} placeholder="Casa de la familia" />
      <label className="rn-etiqueta" htmlFor="rn-direccion">Dirección (opcional)</label>
      <input id="rn-direccion" className="rn-campo" value={v.direccion} maxLength={200} onChange={cambiar("direccion")} placeholder="Colonia, calle y número, ciudad" />
      <label className="rn-etiqueta" htmlFor="rn-nota">
        Un mensaje para los invitados (opcional)
        <span>{v.nota.length}/{MAX_NOTA_REUNION}</span>
      </label>
      <textarea id="rn-nota" className="rn-campo" rows={3} value={v.nota} maxLength={MAX_NOTA_REUNION} onChange={cambiar("nota")} placeholder="Una cena sencilla para celebrar juntos" />
      <p className="rn-ayuda">Si es corto (hasta 120 letras) también va en la tarjeta.</p>
      {error && <p className="rn-error">{error}</p>}
      <div className="rn-pie">
        <button type="button" className="rn-btn" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="rn-btn principal grande" disabled={guardando} onClick={guardar}>{guardando ? "Guardando…" : inicial ? "Guardar cambios" : "Crear reunión"}</button>
      </div>
    </Modal>
  );
}

// ─── Elegir invitados de la lista de la graduación ────────────────────────────
function ElegirDeLista({ reunion, lista, yaInvitados, onAgregar, onCerrar }: {
  reunion: Reunion;
  lista: InvitadoLista[];
  yaInvitados: Set<string>;
  onAgregar: (filas: Pick<InvitadoReunion, "invitado_id" | "nombre" | "telefono" | "num_personas">[]) => Promise<boolean>;
  onCerrar: () => void;
}) {
  const [buscar, setBuscar] = useState("");
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const disponibles = lista.filter((i) => !yaInvitados.has(i.id));
  const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const visibles = disponibles.filter((i) => !buscar.trim() || normal(i.nombre).includes(normal(buscar.trim())));
  const alternar = (id: string) => setElegidos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const marcar = (ids: string[]) => setElegidos(new Set(ids));

  async function agregar() {
    setGuardando(true);
    const filas = disponibles.filter((i) => elegidos.has(i.id)).map((i) => ({
      invitado_id: i.id, nombre: i.nombre, telefono: i.telefono || null, num_personas: Math.max(1, Math.min(50, i.num_personas || 1)),
    }));
    const ok = await onAgregar(filas);
    setGuardando(false);
    if (ok) onCerrar();
  }

  return (
    <Modal titulo={`Invitar a ${reunion.nombre}`} onCerrar={onCerrar}>
      {disponibles.length === 0 ? (
        <p className="rn-vacio">Todos tus invitados ya están en esta reunión.</p>
      ) : (
        <>
          <input className="rn-campo" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre" aria-label="Buscar invitado" />
          <div className="rn-sugeridos">
            <button type="button" className="rn-sugerido" onClick={() => marcar(disponibles.filter((i) => i.estado === "confirmado").map((i) => i.id))}>Los que confirmaron</button>
            <button type="button" className="rn-sugerido" onClick={() => marcar(disponibles.map((i) => i.id))}>Todos</button>
            {elegidos.size > 0 && <button type="button" className="rn-sugerido" onClick={() => marcar([])}>Ninguno</button>}
          </div>
          <ul className="rn-elegir">
            {visibles.map((i) => (
              <li key={i.id}>
                <label>
                  <input type="checkbox" checked={elegidos.has(i.id)} onChange={() => alternar(i.id)} />
                  <span>
                    <b>{i.nombre}</b>
                    <small>
                      {(i.num_personas ?? 1) > 1 ? `${i.num_personas} lugares` : "1 lugar"}
                      {i.estado === "confirmado" ? " · Confirmó la graduación" : i.estado === "rechazado" ? " · No va a la graduación" : ""}
                      {i.a_distancia ? " · A distancia" : ""}
                    </small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="rn-pie">
        <button type="button" className="rn-btn" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="rn-btn principal grande" disabled={guardando || elegidos.size === 0} onClick={agregar}>
          {guardando ? "Agregando…" : elegidos.size ? `Invitar a ${elegidos.size}` : "Elegí a quiénes"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Una persona que no está en la lista de la graduación ─────────────────────
function PersonaNueva({ reunion, onAgregar, onCerrar }: {
  reunion: Reunion;
  onAgregar: (fila: Pick<InvitadoReunion, "invitado_id" | "nombre" | "telefono" | "num_personas">) => Promise<boolean>;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [lugares, setLugares] = useState(1);
  const [guardando, setGuardando] = useState(false);

  async function agregar() {
    if (!nombre.trim()) return;
    setGuardando(true);
    const ok = await onAgregar({ invitado_id: null, nombre: nombre.replace(/\s+/g, " ").trim().slice(0, 120), telefono: telefono || null, num_personas: lugares });
    setGuardando(false);
    if (ok) onCerrar();
  }

  return (
    <Modal titulo={`Persona nueva para ${reunion.nombre}`} onCerrar={onCerrar}>
      <label className="rn-etiqueta" htmlFor="rn-pn-nombre">Nombre</label>
      <input id="rn-pn-nombre" className="rn-campo" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} placeholder="Tía Rosa Pérez" />
      <label className="rn-etiqueta">Teléfono (para mandarle la invitación)</label>
      <PhoneInput value={telefono} onChange={setTelefono} />
      <label className="rn-etiqueta">Lugares</label>
      <div className="rn-paso">
        <button type="button" onClick={() => setLugares((n) => Math.max(1, n - 1))} disabled={lugares <= 1} aria-label="Uno menos">−</button>
        <b>{lugares}</b>
        <button type="button" onClick={() => setLugares((n) => Math.min(50, n + 1))} aria-label="Uno más">+</button>
      </div>
      <div className="rn-pie">
        <button type="button" className="rn-btn" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="rn-btn principal grande" disabled={guardando || !nombre.trim()} onClick={agregar}>{guardando ? "Agregando…" : "Invitar"}</button>
      </div>
    </Modal>
  );
}

// ─── Enviar la invitación: la tarjeta y el mensaje ────────────────────────────
function EnviarReunion({ evento, reunion, inv, trato, siguiente, onEnviado, onSiguiente, onCerrar }: {
  evento: Evento;
  reunion: Reunion;
  inv: InvitadoReunion;
  trato: ReturnType<typeof tratoDe>;
  siguiente: InvitadoReunion | null;
  onEnviado: (inv: InvitadoReunion) => void;
  onSiguiente: (inv: InvitadoReunion) => void;
  onCerrar: () => void;
}) {
  const [png, setPng] = useState<{ blob: Blob; url: string } | null>(null);
  const [enviado, setEnviado] = useState(false);
  const generacion = useRef(0);
  const mensaje = armarMensajeReunion(evento, reunion, inv.nombre, linkDe(inv.token), trato, new Date(), { personas: inv.num_personas });
  const archivo = (blob: Blob) => new File([blob], `${reunion.nombre} - ${inv.nombre}.png`.replace(/[\\/:*?"<>|]/g, ""), { type: "image/png" });
  const tactil = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  const puedeCompartir = tactil && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([""], "x.png", { type: "image/png" })] });
  const telefono = (inv.telefono ?? "").replace(/[^\d]/g, "");
  const waUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  useEffect(() => {
    const n = ++generacion.current;
    setPng(null);
    setEnviado(false);
    let url: string | null = null;
    (async () => {
      const { generarTarjetaPNG } = await import("@/lib/tarjetaCanvas");
      const blob = await generarTarjetaPNG(datosTarjetaReunion(evento, reunion, inv.nombre, trato));
      if (n !== generacion.current || !blob) return;
      url = URL.createObjectURL(blob);
      setPng({ blob, url });
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv.id]);

  function listo() { onEnviado(inv); setEnviado(true); }

  async function compartir() {
    if (!png) return;
    try { await navigator.share({ files: [archivo(png.blob)], text: mensaje }); listo(); }
    catch (e) { if ((e as Error)?.name !== "AbortError") toast.error("No se pudo compartir. Probá descargarla."); }
  }

  // WhatsApp no deja que una página adjunte la imagen: queda copiada para pegarla
  // en el chat. La copia no se espera: iOS solo abre la ventana dentro del toque.
  function alChat() {
    if (png) {
      try { navigator.clipboard.write([new ClipboardItem({ "image/png": png.blob })]).catch(() => {}); } catch { /* sin copia de imágenes */ }
    }
    openWhatsApp(waUrl);
    listo();
    toast.success(png ? "Tarjeta copiada: pegala en el chat" : "Mensaje listo en WhatsApp");
  }

  function descargar() {
    if (!png) return;
    const a = document.createElement("a");
    a.href = png.url;
    a.download = archivo(png.blob).name;
    a.click();
  }

  async function copiarMensaje() {
    try { await navigator.clipboard.writeText(mensaje); toast.success("Mensaje copiado"); } catch { toast.error("No se pudo copiar"); }
  }

  return (
    <Modal titulo={`Invitación para ${inv.nombre}`} onCerrar={onCerrar}>
      <div className="rn-vista">
        {png
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={png.url} alt={`Tarjeta de ${reunion.nombre} para ${inv.nombre}`} />
          : <div className="rn-vista-vacia"><span className="rn-cargando" /></div>}
      </div>
      <div className="rn-botones-envio">
        {puedeCompartir && <button type="button" className="rn-btn wa grande" disabled={!png} onClick={compartir}><IcoWhatsApp size={17} /> Compartir por WhatsApp</button>}
        <button type="button" className={`rn-btn ${puedeCompartir ? "" : "wa grande"}`} onClick={alChat}>
          <IcoWhatsApp size={16} /> {telefono ? "Abrir su chat de WhatsApp" : "Abrir WhatsApp"}
        </button>
        <div className="rn-dos">
          <button type="button" className="rn-btn" disabled={!png} onClick={descargar}>Descargar tarjeta</button>
          <button type="button" className="rn-btn" onClick={copiarMensaje}>Copiar mensaje</button>
        </div>
      </div>
      {(enviado || inv.enviado_at) && (
        <p className="rn-enviado"><IcoCheck size={14} strokeWidth={2.4} /> {enviado ? "Enviada" : "Ya se la habías enviado"}</p>
      )}
      {enviado && siguiente && (
        <button type="button" className="rn-btn principal grande" onClick={() => onSiguiente(siguiente)}>Siguiente: {siguiente.nombre} →</button>
      )}
      <details className="rn-mensaje">
        <summary>Ver el mensaje</summary>
        <pre>{mensaje}</pre>
      </details>
    </Modal>
  );
}

function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onCerrar]);
  return (
    <div className="rn-fondo" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="rn-modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="rn-modal-cab">
          <h2>{titulo}</h2>
          <button type="button" className="rn-x" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const ESTILOS = `
.rn{min-height:100dvh;background:#F6F7FB;color:#0F172A;font-family:'DM Sans',system-ui,sans-serif;padding-bottom:40px}
.rn-barra{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:14px;padding:12px 16px;background:#fff;border-bottom:1px solid rgba(15,23,42,.08)}
.rn-volver{font-size:14px;font-weight:700;color:#4F46E5;text-decoration:none;white-space:nowrap}
.rn-kicker{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60vw}
.rn-barra h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:600;line-height:1.1}
.rn-cuerpo{max-width:640px;margin:0 auto;padding:16px}
.rn-intro{font-size:14px;line-height:1.5;color:#475569;margin-bottom:14px}
.rn-cargando{display:block;width:28px;height:28px;margin:40px auto;border-radius:50%;border:3px solid rgba(79,70,229,.15);border-top-color:#4F46E5;animation:rnGira .8s linear infinite}
@keyframes rnGira{to{transform:rotate(360deg)}}
.rn-aviso{display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:16px;background:#FFFBEB;border:1px solid #FDE68A;color:#78350F;font-size:14px;line-height:1.45}
.rn-aviso code{font-weight:700}
.rn-nueva{width:100%;padding:14px;border-radius:16px;border:2px dashed rgba(79,70,229,.35);background:rgba(79,70,229,.05);color:#4338CA;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:14px}
.rn-vacio{font-size:13.5px;color:#64748B;text-align:center;padding:14px 8px;line-height:1.5}
.rn-reunion{background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:18px;margin-bottom:12px;box-shadow:0 10px 26px -22px rgba(15,23,42,.45);overflow:hidden}
.rn-cab{display:flex;flex-direction:column;gap:5px;width:100%;padding:16px;border:none;background:none;text-align:left;cursor:pointer;font-family:inherit;color:inherit}
.rn-nombre{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;line-height:1.15}
.rn-cuando{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#475569}
.rn-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.rn-chip{padding:3px 9px;border-radius:999px;background:#F1F5F9;color:#334155;font-size:11.5px;font-weight:700}
.rn-chip.si{background:#DCFCE7;color:#166534}
.rn-chip.no{background:#FEE2E2;color:#991B1B}
.rn-detalle{padding:0 16px 16px;border-top:1px solid rgba(15,23,42,.06)}
.rn-acciones{display:flex;flex-wrap:wrap;gap:8px;padding-top:14px}
.rn-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;border-radius:12px;border:1.5px solid rgba(15,23,42,.12);background:#fff;color:#0F172A;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.rn-btn.principal{background:#4F46E5;border-color:#4F46E5;color:#fff}
.rn-btn.peligro{color:#B91C1C;border-color:rgba(185,28,28,.25)}
.rn-btn.wa{background:#25D366;border-color:#25D366;color:#fff}
.rn-btn.grande{width:100%;padding:13px;font-size:14.5px;border-radius:14px}
.rn-btn:disabled{opacity:.5;cursor:default}
.rn-lista{list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:8px}
.rn-lista li{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;padding:10px 12px;border-radius:14px;background:#F8FAFC;border:1px solid rgba(15,23,42,.06)}
.rn-persona{min-width:0}
.rn-persona b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rn-persona small{font-size:11.5px;color:#64748B}
.rn-estado{font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:999px;background:#F1F5F9;color:#475569;white-space:nowrap}
.rn-estado.confirmado{background:#DCFCE7;color:#166534}
.rn-estado.rechazado{background:#FEE2E2;color:#991B1B}
.rn-fila-acc{grid-column:1 / -1;display:flex;gap:6px}
.rn-icono{display:inline-flex;align-items:center;gap:5px;padding:7px 10px;border-radius:10px;border:1px solid rgba(15,23,42,.1);background:#fff;color:#334155;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.rn-icono.wa{background:#25D366;border-color:#25D366;color:#fff}
.rn-fondo{position:fixed;inset:0;z-index:50;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center}
@media (min-width:640px){.rn-fondo{align-items:center;padding:20px}}
.rn-modal{width:100%;max-width:480px;max-height:92dvh;overflow-y:auto;background:#fff;border-radius:22px 22px 0 0;padding:18px 18px max(18px,env(safe-area-inset-bottom,18px))}
@media (min-width:640px){.rn-modal{border-radius:22px}}
.rn-modal-cab{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.rn-modal-cab h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:21px;font-weight:600;line-height:1.2}
.rn-x{width:34px;height:34px;flex:0 0 auto;border-radius:50%;border:none;background:#F1F5F9;font-size:20px;line-height:1;cursor:pointer;color:#334155}
.rn-etiqueta{display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;color:#334155;margin:12px 0 6px}
.rn-etiqueta span{font-weight:600;color:#94A3B8}
.rn-campo{width:100%;box-sizing:border-box;border:1.5px solid rgba(15,23,42,.14);border-radius:12px;padding:11px 12px;font-size:15px;font-family:inherit;background:#fff;color:#0F172A}
.rn-campo:focus{outline:none;border-color:#4F46E5}
textarea.rn-campo{resize:vertical;line-height:1.45}
.rn-dos{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rn-sugeridos{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.rn-sugerido{padding:6px 11px;border-radius:999px;border:1.5px solid rgba(79,70,229,.25);background:#fff;color:#4338CA;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.rn-sugerido.activo{background:#4F46E5;color:#fff;border-color:#4F46E5}
.rn-ayuda{font-size:11.5px;color:#64748B;margin-top:5px}
.rn-error{margin-top:10px;font-size:13px;font-weight:700;color:#B91C1C}
.rn-pie{display:flex;gap:8px;margin-top:16px}
.rn-pie .rn-btn:first-child{flex:0 0 auto}
.rn-elegir{list-style:none;margin-top:10px;max-height:46dvh;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
.rn-elegir label{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:12px;cursor:pointer}
.rn-elegir label:hover{background:#F8FAFC}
.rn-elegir input{width:18px;height:18px;margin-top:2px;accent-color:#4F46E5}
.rn-elegir b{display:block;font-size:14px}
.rn-elegir small{font-size:11.5px;color:#64748B}
.rn-paso{display:flex;align-items:center;gap:16px}
.rn-paso button{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(15,23,42,.15);background:#fff;font-size:20px;font-weight:700;cursor:pointer;color:#0F172A}
.rn-paso button:disabled{opacity:.35;cursor:default}
.rn-paso b{min-width:22px;text-align:center;font-size:18px}
.rn-vista{border-radius:14px;overflow:hidden;background:#0A0F24;margin-bottom:12px}
.rn-vista img{display:block;width:100%;height:auto}
.rn-vista-vacia{aspect-ratio:4/5;display:flex;align-items:center;justify-content:center}
.rn-botones-envio{display:flex;flex-direction:column;gap:8px}
.rn-enviado{display:flex;align-items:center;justify-content:center;gap:6px;margin:12px 0 8px;font-size:13px;font-weight:700;color:#166534}
.rn-mensaje{margin-top:12px;font-size:13px;color:#475569}
.rn-mensaje summary{cursor:pointer;font-weight:700}
.rn-mensaje pre{white-space:pre-wrap;font-family:inherit;margin-top:8px;padding:10px 12px;border-radius:12px;background:#F8FAFC;line-height:1.5}
@media (prefers-reduced-motion:reduce){.rn-cargando{animation:none}}
`;

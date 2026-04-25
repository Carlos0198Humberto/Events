"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/app/components/Toast";
import { BottomNav } from "@/app/components/BottomNav";

// ─── AppLogo ──────────────────────────────────────────────────────────────────
function AppLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#6366F1" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E0E7FF" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Mesa = {
  id: string;
  nombre: string;
  capacidad: number;
};

type Invitado = {
  id: string;
  nombre: string;
  num_personas: number;
  estado: string;
  mesa_id: string | null;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestionarMesas() {
  const params = useParams();
  const eventoId = params.id as string;

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [eventoNombre, setEventoNombre] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal nueva mesa
  const [showModalMesa, setShowModalMesa] = useState(false);
  const [editMesa, setEditMesa] = useState<Mesa | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formCapacidad, setFormCapacidad] = useState("10");
  const [guardandoMesa, setGuardandoMesa] = useState(false);
  const [asignandoAuto, setAsignandoAuto] = useState(false);
  const [showAutoPanel, setShowAutoPanel] = useState(false);

  // Modal asignar invitado
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [busqueda, setBusqueda] = useState("");

  // Eliminación de mesa
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Plano de mesas
  const [planoUrl, setPlanoUrl] = useState<string | null>(null);
  const [subiendoPlano, setSubiendoPlano] = useState(false);
  const planoInputRef = { current: null as HTMLInputElement | null };

  useEffect(() => {
    document.title = "Eventix — Mesas";
    setTimeout(() => setMounted(true), 60);
    cargarDatos();
  }, [eventoId]);

  async function cargarDatos() {
    setLoading(true);
    const [{ data: ev }, { data: ms }, { data: inv }] = await Promise.all([
      supabase.from("eventos").select("nombre, plano_mesas_url").eq("id", eventoId).single(),
      supabase.from("mesas").select("*").eq("evento_id", eventoId).order("created_at"),
      supabase
        .from("invitados")
        .select("id, nombre, num_personas, estado, mesa_id")
        .eq("evento_id", eventoId)
        .order("nombre"),
    ]);
    if (ev) { setEventoNombre(ev.nombre); setPlanoUrl(ev.plano_mesas_url ?? null); }
    if (ms) setMesas(ms);
    if (inv) setInvitados(inv);
    setLoading(false);
  }

  // ── Plano de mesas ──────────────────────────────────────────────────────────
  async function subirPlano(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoPlano(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `planos/${eventoId}_plano_${Date.now()}.${ext}`;
      const { data: up, error } = await supabase.storage.from("fotos-eventos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("fotos-eventos").getPublicUrl(up.path);
      const url = urlData?.publicUrl;
      await supabase.from("eventos").update({ plano_mesas_url: url }).eq("id", eventoId);
      setPlanoUrl(url);
      toast.success("Plano de mesas guardado");
    } catch {
      toast.error("Error al subir el plano");
    }
    setSubiendoPlano(false);
    if (e.target) e.target.value = "";
  }

  // ── CRUD Mesas ─────────────────────────────────────────────────────────────
  function abrirNuevaMesa() {
    setEditMesa(null);
    setFormNombre(`Mesa ${mesas.length + 1}`);
    setFormCapacidad("10");
    setShowModalMesa(true);
  }

  function abrirEditarMesa(m: Mesa) {
    setEditMesa(m);
    setFormNombre(m.nombre);
    setFormCapacidad(String(m.capacidad));
    setShowModalMesa(true);
  }

  async function guardarMesa() {
    if (!formNombre.trim()) return;
    setGuardandoMesa(true);
    const cap = parseInt(formCapacidad) || 10;

    if (editMesa) {
      const { data } = await supabase
        .from("mesas")
        .update({ nombre: formNombre.trim(), capacidad: cap })
        .eq("id", editMesa.id)
        .select()
        .single();
      if (data) setMesas((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    } else {
      const { data } = await supabase
        .from("mesas")
        .insert({ evento_id: eventoId, nombre: formNombre.trim(), capacidad: cap })
        .select()
        .single();
      if (data) setMesas((prev) => [...prev, data]);
    }
    setGuardandoMesa(false);
    setShowModalMesa(false);
    setEditMesa(null);
    toast.success(editMesa ? "Mesa actualizada" : "Mesa creada correctamente");
  }

  async function eliminarMesa(id: string) {
    setEliminando(id);
    // Desasignar invitados de esta mesa
    await supabase.from("invitados").update({ mesa_id: null }).eq("mesa_id", id);
    await supabase.from("mesas").delete().eq("id", id);
    setMesas((prev) => prev.filter((m) => m.id !== id));
    setInvitados((prev) => prev.map((i) => (i.mesa_id === id ? { ...i, mesa_id: null } : i)));
    setEliminando(null);
    setConfirmEliminar(null);
    toast.info("Mesa eliminada");
  }

  // ── Asignación de invitados ────────────────────────────────────────────────
  async function asignarInvitado(invId: string, mesaId: string | null) {
    await supabase.from("invitados").update({ mesa_id: mesaId }).eq("id", invId);
    setInvitados((prev) =>
      prev.map((i) => (i.id === invId ? { ...i, mesa_id: mesaId } : i))
    );
  }

  // ── Auto-asignación de confirmados ─────────────────────────────────────────
  async function autoAsignarConfirmados() {
    if (mesas.length === 0) return;
    setAsignandoAuto(true);
    // Solo los confirmados sin mesa asignada
    const pendientes = invitados.filter((i) => i.estado === "confirmado" && !i.mesa_id);
    let mesaIdx = 0;
    for (const inv of pendientes) {
      // Buscar la siguiente mesa con espacio
      let intentos = 0;
      while (intentos < mesas.length) {
        const mesa = mesas[mesaIdx % mesas.length];
        const ocupados = invitados
          .filter((i) => i.mesa_id === mesa.id)
          .reduce((s, i) => s + (i.num_personas || 1), 0);
        if (ocupados + (inv.num_personas || 1) <= mesa.capacidad) {
          await asignarInvitado(inv.id, mesa.id);
          mesaIdx++;
          break;
        }
        mesaIdx++;
        intentos++;
      }
    }
    setAsignandoAuto(false);
    setShowAutoPanel(false);
    toast.success(`¡${pendientes.length} invitados asignados automáticamente!`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function invitadosDeMesa(mesaId: string) {
    return invitados.filter((i) => i.mesa_id === mesaId);
  }
  function invitadosSinMesa() {
    return invitados.filter((i) => !i.mesa_id);
  }
  function ocupadosMesa(mesaId: string) {
    return invitadosDeMesa(mesaId).reduce((s, i) => s + (i.num_personas || 1), 0);
  }
  function invitadosFiltrados() {
    const q = busqueda.toLowerCase().trim();
    if (!q) return invitados;
    return invitados.filter((i) => i.nombre.toLowerCase().includes(q));
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const sinMesa = invitadosSinMesa();

  return (
    <div className={`page-wrap ev-page-with-nav${mounted ? " vis" : ""}`}>
      <style>{styles}</style>

      {/* Top bar */}
      <div className="top-bar">
        <Link href={`/eventos/${eventoId}/invitados`} className="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div className="top-bar-logo">
          <AppLogo size={30} />
          <div>
            <div className="top-bar-title">Mesas</div>
            <div className="top-bar-sub" title={eventoNombre}>{eventoNombre || "Cargando…"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {invitados.filter(i => i.estado === "confirmado" && !i.mesa_id).length > 0 && mesas.length > 0 && (
            <button
              className="btn-nueva-mesa"
              style={{ background: "rgba(79, 70, 229,0.12)", color: "var(--gold)", border: "1.5px solid rgba(79, 70, 229,0.3)" }}
              onClick={() => setShowAutoPanel(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Auto
            </button>
          )}
          <button className="btn-nueva-mesa" onClick={abrirNuevaMesa}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva
          </button>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* ─ Resumen ─ */}
            <div className="resumen-row">
              <div className="resumen-chip">
                <span className="resumen-val">{mesas.length}</span>
                <span className="resumen-label">mesas</span>
              </div>
              <div className="resumen-chip">
                <span className="resumen-val">{invitados.length}</span>
                <span className="resumen-label">invitados</span>
              </div>
              <div className="resumen-chip">
                <span className="resumen-val">{invitados.length - sinMesa.length}</span>
                <span className="resumen-label">asignados</span>
              </div>
              <div className="resumen-chip warn">
                <span className="resumen-val">{sinMesa.length}</span>
                <span className="resumen-label">sin mesa</span>
              </div>
            </div>

            {/* ─ Plano de distribución de mesas ─ */}
            <div style={{ background: "#F8FAFF", border: "1px dashed rgba(79,70,229,0.3)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>
                  📐 Plano de distribución
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {planoUrl ? "Plano guardado — los invitados pueden verlo" : "Subí una imagen del plano de mesas para tus invitados"}
                </div>
              </div>
              <input
                ref={(el) => { planoInputRef.current = el; }}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={subirPlano}
              />
              {planoUrl && (
                <img src={planoUrl} alt="Plano" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1.5px solid rgba(79,70,229,0.25)", cursor: "pointer" }} onClick={() => window.open(planoUrl!, "_blank")} />
              )}
              <button
                onClick={() => planoInputRef.current?.click()}
                disabled={subiendoPlano}
                style={{ background: "linear-gradient(135deg,#3730A3,#4F46E5)", color: "white", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}
              >
                {subiendoPlano ? "Subiendo..." : planoUrl ? "Cambiar" : "Subir plano"}
              </button>
            </div>

            {/* ─ Invitados sin mesa — SIEMPRE visible al tope ─ */}
            {sinMesa.length > 0 && (
              <div className="sin-mesa-section">
                <div className="sin-mesa-title">
                  <span>📋 Sin mesa asignada</span>
                  <span className="sin-mesa-count">{sinMesa.length}</span>
                </div>
                {mesas.length === 0 && (
                  <div className="sin-mesa-hint">Crea una mesa con el botón <strong>+ Nueva</strong> para comenzar a asignar</div>
                )}
                {sinMesa.map((inv) => (
                  <div key={inv.id} className="sin-mesa-row">
                    <div className="mesa-inv-avatar">{inv.nombre.charAt(0).toUpperCase()}</div>
                    <div className="mesa-inv-info">
                      <span className="mesa-inv-nombre">{inv.nombre}</span>
                      {(inv.num_personas ?? 1) > 1 && (
                        <span className="mesa-inv-pax">×{inv.num_personas}</span>
                      )}
                      <span className={`est-badge est-${inv.estado}`}>
                        {inv.estado === "confirmado" ? "✓ Confirmado" : inv.estado === "rechazado" ? "✗ Declinó" : "Pendiente"}
                      </span>
                    </div>
                    {mesas.length > 0 ? (
                      <select
                        className="select-mesa"
                        value=""
                        onChange={(e) => { if (e.target.value) asignarInvitado(inv.id, e.target.value); }}
                      >
                        <option value="">Asignar…</option>
                        {mesas
                          .filter((m) => ocupadosMesa(m.id) < m.capacidad)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre} ({ocupadosMesa(m.id)}/{m.capacidad})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className="sin-mesa-espera">—</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ─ Sin mesas aún (solo si no hay invitados tampoco) ─ */}
            {mesas.length === 0 && invitados.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🪑</div>
                <div className="empty-title">Sin mesas configuradas</div>
                <div className="empty-sub">Crea tus mesas para asignar lugares a tus invitados</div>
                <button className="btn-crear-primera" onClick={abrirNuevaMesa}>
                  Crear primera mesa
                </button>
              </div>
            )}

            {/* ─ Tarjetas de mesas ─ */}
            {mesas.map((mesa) => {
              const asignados = invitadosDeMesa(mesa.id);
              const ocupados = ocupadosMesa(mesa.id);
              const pct = Math.min(100, Math.round((ocupados / mesa.capacidad) * 100));
              const llena = ocupados >= mesa.capacidad;

              return (
                <div key={mesa.id} className={`mesa-card${llena ? " llena" : ""}`}>
                  <div className="mesa-card-header">
                    <div className="mesa-card-left">
                      <div className="mesa-icono">🪑</div>
                      <div>
                        <div className="mesa-nombre">{mesa.nombre}</div>
                      </div>
                    </div>
                    <div className="mesa-card-right">
                      <div className={`mesa-cupo${llena ? " llena" : ""}`}>
                        {ocupados}/{mesa.capacidad}
                      </div>
                      <button className="mesa-edit-btn" onClick={() => abrirEditarMesa(mesa)} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        className="mesa-del-btn"
                        onClick={() => setConfirmEliminar(mesa.id)}
                        title="Eliminar"
                        disabled={eliminando === mesa.id}
                      >
                        {eliminando === mesa.id
                          ? <div className="spinner sm" />
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Barra de ocupación */}
                  <div className="mesa-barra-bg">
                    <div className={`mesa-barra-fill${llena ? " llena" : ""}`} style={{ width: `${pct}%` }} />
                  </div>

                  {/* Lista de invitados asignados */}
                  {asignados.length > 0 && (
                    <div className="mesa-invitados">
                      {asignados.map((inv) => (
                        <div key={inv.id} className="mesa-inv-row">
                          <div className="mesa-inv-avatar">
                            {inv.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="mesa-inv-info">
                            <span className="mesa-inv-nombre">{inv.nombre}</span>
                            {inv.num_personas > 1 && (
                              <span className="mesa-inv-pax">×{inv.num_personas}</span>
                            )}
                          </div>
                          <button
                            className="mesa-inv-quitar"
                            onClick={() => asignarInvitado(inv.id, null)}
                            title="Quitar de esta mesa"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón agregar invitado */}
                  {!llena && (
                    <button
                      className="btn-asignar"
                      onClick={() => {
                        setMesaSeleccionada(mesa);
                        setBusqueda("");
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Asignar invitado
                    </button>
                  )}
                  {llena && (
                    <div className="mesa-llena-tag">Mesa completa</div>
                  )}
                </div>
              );
            })}

            {/* ─ Todos asignados ─ */}
            {mesas.length > 0 && sinMesa.length === 0 && invitados.length > 0 && (
              <div style={{ textAlign:"center", padding:"14px", color:"#2d7d46", fontWeight:600, fontSize:13, background:"rgba(45,125,70,0.07)", borderRadius:14, border:"1px solid rgba(45,125,70,0.2)" }}>
                ✓ Todos los invitados tienen mesa asignada
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Modal: Crear / Editar mesa ─── */}
      {showModalMesa && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModalMesa(false)}>
          <div className="modal-sheet">
            <div className="modal-drag" />
            <div className="modal-header">
              <span className="modal-title">{editMesa ? "Editar mesa" : "Nueva mesa"}</span>
              <button className="modal-close" onClick={() => setShowModalMesa(false)}>×</button>
            </div>
            <div className="modal-body">
              <label className="field-label">Nombre de la mesa</label>
              <input
                className="field-input"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej: Mesa 1, Mesa de honor, Familia…"
                autoFocus
              />
              <label className="field-label" style={{ marginTop: 14 }}>Capacidad (personas)</label>
              <input
                className="field-input"
                type="number"
                min={1}
                max={50}
                value={formCapacidad}
                onChange={(e) => setFormCapacidad(e.target.value)}
              />
              <button
                className="btn-guardar"
                onClick={guardarMesa}
                disabled={guardandoMesa || !formNombre.trim()}
              >
                {guardandoMesa ? <div className="spinner sm" /> : (editMesa ? "Guardar cambios" : "Crear mesa")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Asignar invitado a mesa ─── */}
      {mesaSeleccionada && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setMesaSeleccionada(null)}>
          <div className="modal-sheet">
            <div className="modal-drag" />
            <div className="modal-header">
              <div>
                <span className="modal-title">Asignar a {mesaSeleccionada.nombre}</span>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2 }}>
                  {ocupadosMesa(mesaSeleccionada.id)}/{mesaSeleccionada.capacidad} lugares ocupados
                </div>
              </div>
              <button className="modal-close" onClick={() => setMesaSeleccionada(null)}>×</button>
            </div>
            <div className="modal-body">
              <input
                className="field-input"
                placeholder="Buscar invitado…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                autoFocus
              />
              <div className="asignar-lista">
                {invitadosFiltrados().length === 0 && (
                  <div className="asignar-empty">No se encontraron invitados</div>
                )}
                {invitadosFiltrados().map((inv) => {
                  const yaEnEstaMesa = inv.mesa_id === mesaSeleccionada.id;
                  const otraMesa = inv.mesa_id && inv.mesa_id !== mesaSeleccionada.id
                    ? mesas.find((m) => m.id === inv.mesa_id)?.nombre
                    : null;

                  return (
                    <button
                      key={inv.id}
                      className={`asignar-item${yaEnEstaMesa ? " activo" : ""}`}
                      onClick={() => {
                        if (yaEnEstaMesa) {
                          asignarInvitado(inv.id, null);
                        } else {
                          asignarInvitado(inv.id, mesaSeleccionada.id);
                        }
                      }}
                    >
                      <div className="mesa-inv-avatar sm">{inv.nombre.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{inv.nombre}</div>
                        {otraMesa && (
                          <div style={{ fontSize: 11, color: "var(--gold)" }}>En: {otraMesa}</div>
                        )}
                        {inv.num_personas > 1 && (
                          <div style={{ fontSize: 11, color: "var(--ink3)" }}>{inv.num_personas} personas</div>
                        )}
                      </div>
                      <div className={`asignar-check${yaEnEstaMesa ? " activo" : ""}`}>
                        {yaEnEstaMesa ? "✓" : "+"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm eliminar mesa ─── */}
      {/* ─── Panel auto-asignación ─── */}
      {showAutoPanel && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAutoPanel(false)}>
          <div className="modal-sheet">
            <div className="modal-drag" />
            <div className="modal-header">
              <div>
                <span className="modal-title">Asignación automática</span>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2 }}>
                  Solo invitados confirmados sin mesa
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowAutoPanel(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Lista de confirmados sin mesa */}
              <div style={{ marginBottom: 16 }}>
                {invitados.filter(i => i.estado === "confirmado" && !i.mesa_id).length === 0 ? (
                  <div className="asignar-empty">Todos los confirmados ya tienen mesa asignada</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 10, fontWeight: 500 }}>
                      {invitados.filter(i => i.estado === "confirmado" && !i.mesa_id).length} confirmados sin mesa:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                      {invitados
                        .filter(i => i.estado === "confirmado" && !i.mesa_id)
                        .map(inv => (
                          <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 12px" }}>
                            <div className="mesa-inv-avatar sm">{inv.nombre.charAt(0).toUpperCase()}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{inv.nombre}</div>
                              {(inv.num_personas ?? 1) > 1 && (
                                <div style={{ fontSize: 11, color: "var(--ink3)" }}>{inv.num_personas} personas</div>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Confirmado</div>
                          </div>
                        ))
                      }
                    </div>
                  </>
                )}
              </div>

              {invitados.filter(i => i.estado === "confirmado" && !i.mesa_id).length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 12, lineHeight: 1.5, background: "rgba(79, 70, 229,0.08)", border: "1px solid rgba(79, 70, 229,0.2)", borderRadius: 8, padding: "10px 12px" }}>
                    Se distribuirán por orden de confirmación, respetando la capacidad de cada mesa.
                  </div>
                  <button
                    className="btn-guardar"
                    onClick={autoAsignarConfirmados}
                    disabled={asignandoAuto}
                  >
                    {asignandoAuto ? <div className="spinner sm" /> : "Asignar automáticamente"}
                  </button>
                </>
              )}
              <button className="modal-cancelar" onClick={() => setShowAutoPanel(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {confirmEliminar && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmEliminar(null)}>
          <div className="modal-sheet" style={{ paddingBottom: "env(safe-area-inset-bottom,16px)" }}>
            <div className="modal-drag" />
            <div className="modal-body" style={{ textAlign: "center", paddingTop: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
                ¿Eliminar esta mesa?
              </div>
              <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 24, lineHeight: 1.6 }}>
                Los invitados asignados quedarán sin mesa. Esta acción no se puede deshacer.
              </div>
              <button
                className="btn-guardar"
                style={{ background: "#c0392b" }}
                onClick={() => eliminarMesa(confirmEliminar)}
                disabled={!!eliminando}
              >
                {eliminando ? <div className="spinner sm" /> : "Sí, eliminar"}
              </button>
              <button
                className="modal-cancelar"
                onClick={() => setConfirmEliminar(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav eventoId={eventoId} active="mesas" />
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;background:#FFFFFF;color:#0F172A;overflow-x:hidden;max-width:100vw;-webkit-text-size-adjust:100%}
  :root{
    --bg:#FFFFFF;--surface:#fff;--surface-2:#F8FAFF;--surface-3:#EEF2FF;
    --ink:#0F172A;--ink2:#475569;--ink3:#64748B;
    --gold:#4F46E5;--gold-dark:#3730A3;--gold-pale:rgba(79,70,229,0.08);--gold-mid:rgba(79,70,229,0.18);
    --border:rgba(15,23,42,0.08);--border-mid:rgba(79,70,229,0.22);
    --shadow:0 2px 10px rgba(15,23,42,0.05);--shadow-lg:0 10px 30px -6px rgba(79,70,229,0.25);
    --r:18px;--r-sm:12px;
  }
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}

  .page-wrap{min-height:100dvh;background:var(--bg);opacity:0;transition:opacity .35s ease}
  .page-wrap.vis{opacity:1}

  /* Top bar */
  .top-bar{
    display:flex;align-items:center;gap:8px;
    padding:10px 14px;
    background:rgba(255,255,255,0.92);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    border-bottom:1px solid var(--border);
    position:sticky;top:env(safe-area-inset-top,0px);z-index:30;
    box-sizing:border-box;width:100%;
  }
  .back-btn{
    display:flex;align-items:center;justify-content:center;
    width:36px;height:36px;border-radius:10px;
    background:var(--surface-2);border:1px solid var(--border);
    color:var(--ink2);text-decoration:none;flex-shrink:0;
    transition:background .15s;
  }
  .back-btn:hover{background:var(--gold-pale);color:var(--gold)}
  .top-bar-logo{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
  .top-bar-logo > div{min-width:0;flex:1}
  .top-bar-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink);line-height:1.1;white-space:nowrap}
  .top-bar-sub{font-size:11px;color:var(--ink3);text-overflow:ellipsis;overflow:hidden;white-space:nowrap}
  .btn-nueva-mesa{
    display:inline-flex;align-items:center;gap:5px;
    background:linear-gradient(135deg,#4F46E5,#6366F1);
    color:#fff;border:none;border-radius:10px;
    padding:8px 12px;font-size:12px;font-weight:700;
    cursor:pointer;font-family:'Jost',sans-serif;
    flex-shrink:0;letter-spacing:.2px;
    box-shadow:0 4px 12px rgba(79,70,229,0.28);
  }
  .btn-nueva-mesa:active{transform:scale(.97)}

  /* Content */
  .content{max-width:520px;margin:0 auto;padding:16px 14px calc(32px + env(safe-area-inset-bottom,16px))}

  /* Resumen */
  .resumen-row{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px}
  .resumen-chip{
    background:var(--surface);border:1px solid var(--border);
    border-radius:12px;padding:10px 6px;text-align:center;
    box-shadow:var(--shadow);min-width:0;
  }
  .resumen-chip.warn{border-color:rgba(79,70,229,0.35);background:rgba(79,70,229,0.05)}
  .resumen-val{display:block;font-size:18px;font-weight:700;color:var(--ink);line-height:1.1}
  .resumen-label{display:block;font-size:9.5px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:.4px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  /* Empty state */
  .empty-state{
    display:flex;flex-direction:column;align-items:center;
    padding:48px 20px;text-align:center;gap:10px;
  }
  .empty-icon{font-size:44px}
  .empty-title{font-size:17px;font-weight:700;color:var(--ink)}
  .empty-sub{font-size:13px;color:var(--ink3);line-height:1.6;max-width:240px}
  .btn-crear-primera{
    margin-top:8px;background:linear-gradient(135deg,#4F46E5,#6366F1);
    color:#fff;border:none;border-radius:14px;padding:13px 28px;
    font-size:14px;font-weight:700;cursor:pointer;font-family:'Jost',sans-serif;
    box-shadow:0 10px 24px -6px rgba(79,70,229,0.4);
  }

  /* Mesa card */
  .mesa-card{
    background:var(--surface);border-radius:var(--r);border:1px solid var(--border);
    box-shadow:var(--shadow);padding:14px;margin-bottom:12px;
    animation:fadeIn .4s ease both;
  }
  .mesa-card.llena{border-color:rgba(79,70,229,0.35);background:rgba(79,70,229,0.03)}
  .mesa-card-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
  .mesa-card-left{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
  .mesa-card-left > div{min-width:0}
  .mesa-icono{font-size:22px;line-height:1;flex-shrink:0}
  .mesa-nombre{font-size:15px;font-weight:700;color:var(--ink);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mesa-seccion{font-size:11px;color:var(--ink3);margin-top:1px}
  .mesa-card-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
  .mesa-cupo{font-size:12px;font-weight:700;color:var(--gold-dark);padding:4px 9px;background:var(--surface-3);border-radius:8px;white-space:nowrap}
  .mesa-cupo.llena{color:#B45309;background:rgba(180,83,9,0.1)}
  .mesa-edit-btn,.mesa-del-btn{
    display:flex;align-items:center;justify-content:center;
    width:30px;height:30px;border-radius:8px;border:none;
    cursor:pointer;transition:all .15s;flex-shrink:0;
  }
  .mesa-edit-btn{background:var(--surface-2);color:var(--ink2)}
  .mesa-edit-btn:hover{background:var(--gold-pale);color:var(--gold)}
  .mesa-del-btn{background:var(--surface-2);color:#c0392b}
  .mesa-del-btn:hover{background:rgba(192,57,43,0.1)}
  .mesa-del-btn:disabled{opacity:.5;cursor:default}

  /* Barra de ocupación */
  .mesa-barra-bg{height:4px;background:var(--surface-3);border-radius:4px;margin-bottom:12px;overflow:hidden}
  .mesa-barra-fill{height:100%;background:linear-gradient(90deg,#4F46E5,#818CF8);border-radius:4px;transition:width .4s ease}
  .mesa-barra-fill.llena{background:linear-gradient(90deg,#B45309,#E57C00)}

  /* Invitados en mesa */
  .mesa-invitados{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
  .mesa-inv-row,.sin-mesa-row{
    display:flex;align-items:center;gap:10px;
    background:var(--surface-2);border-radius:10px;padding:8px 10px;
    border:1px solid var(--border);min-width:0;
  }
  .sin-mesa-row{background:rgba(79,70,229,0.05);border-color:rgba(79,70,229,0.18);flex-wrap:wrap}
  .mesa-inv-avatar{
    width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,#4F46E5,#818CF8);
    color:#fff;font-size:13px;font-weight:700;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
  }
  .mesa-inv-avatar.sm{width:28px;height:28px;font-size:11px}
  .mesa-inv-info{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px}
  .mesa-inv-nombre{font-size:13px;font-weight:600;color:var(--ink);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
  .mesa-inv-pax{font-size:11px;color:var(--gold);font-weight:600;flex-shrink:0}
  .mesa-inv-quitar{
    background:none;border:none;color:var(--ink3);font-size:18px;
    cursor:pointer;line-height:1;padding:0 6px;border-radius:6px;
    transition:color .15s;flex-shrink:0;
  }
  .mesa-inv-quitar:hover{color:#c0392b}
  .btn-asignar{
    width:100%;background:transparent;border:1.5px dashed var(--border-mid);
    border-radius:10px;padding:10px;color:var(--gold);
    font-size:12px;font-weight:600;cursor:pointer;
    display:flex;align-items:center;justify-content:center;gap:6px;
    font-family:'Jost',sans-serif;transition:all .15s;
  }
  .btn-asignar:hover{background:var(--gold-pale);border-style:solid}
  .mesa-llena-tag{text-align:center;font-size:11px;color:var(--gold);font-weight:700;padding:6px;letter-spacing:.5px;text-transform:uppercase}

  /* Sin mesa section */
  .sin-mesa-section{
    background:var(--surface);border-radius:var(--r);border:1px solid var(--border);
    padding:14px;margin-bottom:14px;box-shadow:var(--shadow);
  }
  .sin-mesa-title{
    display:flex;align-items:center;justify-content:space-between;
    font-size:13px;font-weight:700;color:var(--ink);
    margin-bottom:12px;gap:8px;
  }
  .sin-mesa-count{
    background:rgba(79,70,229,0.12);color:var(--gold);
    border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700;flex-shrink:0;
  }
  .sin-mesa-hint{font-size:12px;color:var(--ink3);padding:8px 4px 4px;line-height:1.5}
  .sin-mesa-espera{font-size:12px;color:var(--ink3);padding:4px 8px;flex-shrink:0}
  .est-badge{font-size:10px;font-weight:600;border-radius:6px;padding:2px 6px;flex-shrink:0;white-space:nowrap}
  .est-confirmado{background:rgba(45,125,70,0.12);color:#2d7d46}
  .est-rechazado{background:rgba(192,57,43,0.12);color:#c0392b}
  .est-pendiente{background:rgba(79,70,229,0.12);color:var(--gold)}
  .select-mesa{
    font-family:'Jost',sans-serif;font-size:12px;font-weight:500;
    background:var(--surface);border:1px solid var(--border-mid);
    border-radius:8px;padding:7px 8px;color:var(--ink);
    cursor:pointer;max-width:100%;flex-shrink:0;
  }

  /* Modales */
  .modal-overlay{
    position:fixed;inset:0;background:rgba(15,23,42,0.5);
    z-index:1000;display:flex;align-items:flex-end;
    backdrop-filter:blur(4px);
  }
  .modal-sheet{
    width:100%;max-height:90dvh;overflow-y:auto;
    background:#FFFFFF;border-radius:24px 24px 0 0;
    animation:slideUp .35s cubic-bezier(.22,1,.36,1) both;
    max-width:520px;margin:0 auto;
    box-shadow:0 -10px 40px rgba(15,23,42,0.15);
  }
  .modal-drag{width:36px;height:4px;background:rgba(15,23,42,0.15);border-radius:4px;margin:10px auto 0}
  .modal-header{
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 20px 10px;border-bottom:1px solid var(--border);gap:12px;
  }
  .modal-title{font-size:16px;font-weight:700;color:var(--ink)}
  .modal-close{background:none;border:none;font-size:24px;color:var(--ink3);cursor:pointer;line-height:1;flex-shrink:0}
  .modal-body{padding:16px 20px 20px;display:flex;flex-direction:column;gap:4px}

  .field-label{font-size:12px;font-weight:600;color:var(--ink2);letter-spacing:.3px;text-transform:uppercase;margin-bottom:4px}
  .field-input{
    width:100%;background:var(--surface);border:1.5px solid var(--border-mid);
    border-radius:12px;padding:12px 14px;font-size:14px;
    font-family:'Jost',sans-serif;color:var(--ink);
    outline:none;transition:border-color .15s;
  }
  .field-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(79,70,229,0.1)}
  .btn-guardar{
    width:100%;margin-top:16px;
    background:linear-gradient(135deg,#4F46E5,#6366F1);
    color:#fff;border:none;border-radius:14px;
    padding:14px;font-size:14px;font-weight:700;
    cursor:pointer;font-family:'Jost',sans-serif;
    display:flex;align-items:center;justify-content:center;gap:8px;
    transition:opacity .15s;
    box-shadow:0 10px 24px -6px rgba(79,70,229,0.35);
  }
  .btn-guardar:disabled{opacity:.6;cursor:not-allowed}
  .modal-cancelar{
    width:100%;background:transparent;border:none;
    padding:12px;font-size:13px;font-weight:500;
    color:var(--ink3);cursor:pointer;font-family:'Jost',sans-serif;margin-top:4px;
  }

  /* Lista asignar */
  .asignar-lista{max-height:280px;overflow-y:auto;margin-top:10px;display:flex;flex-direction:column;gap:4px}
  .asignar-item{
    display:flex;align-items:center;gap:10px;
    background:var(--surface);border:1.5px solid var(--border);
    border-radius:12px;padding:10px 12px;cursor:pointer;
    transition:all .15s;font-family:'Jost',sans-serif;
  }
  .asignar-item:hover{background:var(--gold-pale);border-color:var(--gold)}
  .asignar-item.activo{background:rgba(79,70,229,0.1);border-color:var(--gold)}
  .asignar-empty{text-align:center;padding:20px;color:var(--ink3);font-size:13px}
  .asignar-check{
    width:24px;height:24px;border-radius:50%;
    border:1.5px solid var(--border-mid);
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:700;color:var(--ink3);
    flex-shrink:0;transition:all .15s;
  }
  .asignar-check.activo{background:var(--gold);border-color:var(--gold);color:#fff}

  /* Spinner */
  .spinner{width:22px;height:22px;border-radius:50%;border:2.5px solid rgba(79,70,229,0.18);border-top-color:var(--gold);animation:spin .75s linear infinite}
  .spinner.sm{width:16px;height:16px;border-width:2px}

  /* ─── Responsive: teléfonos pequeños ─── */
  @media (max-width: 420px){
    .top-bar{padding:9px 12px;gap:6px}
    .top-bar-title{font-size:16px}
    .top-bar-sub{font-size:10px}
    .btn-nueva-mesa{padding:7px 10px;font-size:11px}
    .btn-nueva-mesa svg{width:13px;height:13px}
    .content{padding:14px 12px calc(28px + env(safe-area-inset-bottom,16px))}
    .resumen-row{gap:5px}
    .resumen-chip{padding:9px 4px}
    .resumen-val{font-size:16px}
    .resumen-label{font-size:9px;letter-spacing:.3px}
    .mesa-card{padding:12px}
    .mesa-nombre{font-size:14px}
    .mesa-icono{font-size:20px}
    .mesa-cupo{font-size:11px;padding:3px 7px}
    .mesa-inv-nombre{font-size:12.5px}
    .sin-mesa-section{padding:12px}
    .modal-header{padding:14px 16px 10px}
    .modal-body{padding:14px 16px 18px}
    .field-input{padding:11px 12px;font-size:13.5px}
  }
  @media (max-width: 340px){
    .resumen-row{grid-template-columns:repeat(2,1fr)}
    .top-bar-logo .top-bar-title{font-size:15px}
    .btn-nueva-mesa span{display:none}
  }
`;

"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

function AppLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="18" fill="#140d04"/>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(201,169,110,0.20)" strokeWidth="1.2"/>
      <rect x="13" y="14" width="6" height="36" rx="3" fill="#C9A96E"/>
      <rect x="13" y="14" width="24" height="6" rx="3" fill="#C9A96E"/>
      <rect x="13" y="29" width="18" height="6" rx="3" fill="#C9A96E"/>
      <rect x="13" y="44" width="24" height="6" rx="3" fill="#C9A96E"/>
      <path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E8D5B0"/>
      <circle cx="47" cy="46" r="2.5" fill="#C9A96E" opacity="0.55"/>
    </svg>
  );
}

// ─── Opciones de vestimenta ────────────────────────────────────────────────────
const TIPOS_VESTIMENTA = [
  { id: "formal",      label: "Etiqueta formal",   emoji: "🤵", desc: "Traje o smoking / vestido de gala" },
  { id: "semi-formal", label: "Semi-formal",        emoji: "👔", desc: "Traje casual / vestido elegante" },
  { id: "cocktail",    label: "Cocktail",           emoji: "🥂", desc: "Vestido corto o de cóctel" },
  { id: "casual-chic", label: "Casual elegante",    emoji: "✨", desc: "Ropa bonita pero cómoda" },
  { id: "casual",      label: "Casual",             emoji: "👕", desc: "Ropa cómoda y relajada" },
  { id: "tematico",    label: "Temático",           emoji: "🎭", desc: "Disfraz o tema especial" },
  { id: "blanco",      label: "Todo de blanco",     emoji: "🤍", desc: "Vestimenta en color blanco" },
  { id: "colores",     label: "Paleta de colores",  emoji: "🎨", desc: "Colores específicos indicados" },
];

// Paletas de colores predefinidas por tipo de evento
const PALETAS_PRESET: Record<string, string[][]> = {
  pastel:    [["#F8C8D4","#C8D8F8","#C8F0D0","#F8ECC8"],["#F0D0E8","#D0E8F0","#E8F0D0","#F0E8D0"]],
  neutros:   [["#FAF6F0","#E8D5B0","#C9A96E","#8B6914"],["#F5F0EB","#D4C5B0","#A89880","#6B5C4C"]],
  oscuros:   [["#140d04","#3d2b0f","#C9A96E","#E8D5B0"],["#1a1a2e","#16213e","#0f3460","#e94560"]],
  vibrantes: [["#FF6B6B","#FFD93D","#6BCB77","#4D96FF"],["#FF9A3C","#FF6392","#A280FF","#3CDBC0"]],
};

const COLORES_SUGERIDOS = [
  "#FAF6F0","#E8D5B0","#C9A96E","#8B6914","#140d04",
  "#FFFFFF","#F5E6CC","#D4A96A","#8B7355","#3d2b0f",
  "#FFC0CB","#FFB6C1","#FF69B4","#C71585","#8B0057",
  "#E6E6FA","#9370DB","#6A0DAD","#4B0082","#2E004B",
  "#E0F7FA","#80DEEA","#00BCD4","#0097A7","#006064",
  "#F3E5F5","#CE93D8","#AB47BC","#7B1FA2","#4A148C",
  "#E8F5E9","#A5D6A7","#4CAF50","#2E7D32","#1B5E20",
  "#FFF3E0","#FFCC80","#FF9800","#E65100","#BF360C",
  "#F44336","#E91E63","#9C27B0","#3F51B5","#2196F3",
  "#000000","#212121","#616161","#9E9E9E","#BDBDBD",
];

export default function ConfigurarEvento() {
  const params = useParams();
  const eventoId = params.id as string;

  const [eventoNombre, setEventoNombre] = useState("");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // ── Campo Regalo ──
  const [regaloActivo, setRegaloActivo] = useState(false);
  const [regaloBanco, setRegaloBanco] = useState("");
  const [regaloTitular, setRegaloTitular] = useState("");
  const [regaloCuenta, setRegaloCuenta] = useState("");
  const [regaloMensaje, setRegaloMensaje] = useState("");

  // ── Campos Vestimenta ──
  const [vestActivo, setVestActivo] = useState(false);
  const [vestTipo, setVestTipo] = useState("");
  const [vestColores, setVestColores] = useState<string[]>([]);
  const [vestNota, setVestNota] = useState("");

  // ── Itinerario ──
  type ItemItinerario = { id: string; hora: string; titulo: string; descripcion: string; icono: string; orden: number };
  const [items, setItems] = useState<ItemItinerario[]>([]);
  const [itiOpen, setItiOpen] = useState(true);
  const [nuevoHora, setNuevoHora] = useState("");
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoDesc, setNuevoDesc] = useState("");
  const [nuevoIcono, setNuevoIcono] = useState("✨");
  const [agregando, setAgregando] = useState(false);
  const [eliminandoItem, setEliminandoItem] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Eventix — Configurar evento";
    setTimeout(() => setMounted(true), 60);
    cargarConfig();
  }, [eventoId]);

  async function cargarConfig() {
    const { data } = await supabase
      .from("eventos")
      .select("nombre, anfitriones, regalo_activo, regalo_banco, regalo_titular, regalo_cuenta, regalo_mensaje, vestimenta_activo, vestimenta_tipo, vestimenta_colores, vestimenta_nota")
      .eq("id", eventoId)
      .single();
    if (data) {
      setEventoNombre(data.nombre ?? "");
      setRegaloActivo(data.regalo_activo ?? false);
      setRegaloBanco(data.regalo_banco ?? "");
      setRegaloTitular(data.regalo_titular ?? "");
      setRegaloCuenta(data.regalo_cuenta ?? "");
      setRegaloMensaje(data.regalo_mensaje ?? "");
      setVestActivo(data.vestimenta_activo ?? false);
      setVestTipo(data.vestimenta_tipo ?? "");
      setVestColores(data.vestimenta_colores ? data.vestimenta_colores.split(",").filter(Boolean) : []);
      setVestNota(data.vestimenta_nota ?? "");
    }
    // Cargar itinerario
    try {
      const { data: itiData } = await supabase
        .from("itinerario")
        .select("*")
        .eq("evento_id", eventoId)
        .order("orden", { ascending: true });
      if (itiData) setItems(itiData);
    } catch { /* tabla no existe aún */ }
    setLoading(false);
  }

  async function guardar() {
    setGuardando(true);
    await supabase.from("eventos").update({
      regalo_activo:       regaloActivo,
      regalo_banco:        regaloBanco.trim() || null,
      regalo_titular:      regaloTitular.trim() || null,
      regalo_cuenta:       regaloCuenta.trim() || null,
      regalo_mensaje:      regaloMensaje.trim() || null,
      vestimenta_activo:   vestActivo,
      vestimenta_tipo:     vestTipo || null,
      vestimenta_colores:  vestColores.length ? vestColores.join(",") : null,
      vestimenta_nota:     vestNota.trim() || null,
    }).eq("id", eventoId);
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  async function agregarItem() {
    if (!nuevoTitulo.trim()) return;
    setAgregando(true);
    const orden = items.length;
    const { data } = await supabase.from("itinerario").insert({
      evento_id: eventoId,
      hora: nuevoHora.trim() || null,
      titulo: nuevoTitulo.trim(),
      descripcion: nuevoDesc.trim() || null,
      icono: nuevoIcono,
      orden,
    }).select().single();
    if (data) setItems(prev => [...prev, data]);
    setNuevoHora(""); setNuevoTitulo(""); setNuevoDesc(""); setNuevoIcono("✨");
    setAgregando(false);
  }

  async function eliminarItem(id: string) {
    setEliminandoItem(id);
    await supabase.from("itinerario").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
    setEliminandoItem(null);
  }

  async function moverItem(id: string, dir: "up" | "down") {
    const idx = items.findIndex(i => i.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === items.length - 1) return;
    const newItems = [...items];
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setItems(newItems);
    // Actualizar orden en Supabase
    await Promise.all(newItems.map((item, i) =>
      supabase.from("itinerario").update({ orden: i }).eq("id", item.id)
    ));
  }

  function toggleColor(hex: string) {
    setVestColores(prev =>
      prev.includes(hex) ? prev.filter(c => c !== hex) : prev.length < 6 ? [...prev, hex] : prev
    );
  }

  const tipoActual = TIPOS_VESTIMENTA.find(t => t.id === vestTipo);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`page-wrap${mounted ? " vis" : ""}`}>
      <style>{styles}</style>

      {/* Top bar */}
      <div className="top-bar">
        <Link href="/dashboard" className="back-btn" title="Volver al Dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div className="top-bar-logo">
          <AppLogo size={30} />
          <div>
            <div className="top-bar-title">Configurar</div>
            <div className="top-bar-sub">{eventoNombre || "Cargando…"}</div>
          </div>
        </div>
      </div>

      <div className="content">
        {loading ? (
          <div className="spinner-center"><div className="spinner lg" /></div>
        ) : (
          <>
            {/* ══════════════════════════════════════════
                SECCIÓN 1: REGALO / TRANSFERENCIA
            ══════════════════════════════════════════ */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">🎁</div>
                <div>
                  <div className="section-title">Regalo / Transferencia</div>
                  <div className="section-sub">Datos bancarios opcionales en la invitación</div>
                </div>
              </div>

              <div className="toggle-row" onClick={() => setRegaloActivo(!regaloActivo)}>
                <div>
                  <div className="toggle-label">Mostrar sección de regalo</div>
                  <div className="toggle-sub">{regaloActivo ? "Visible en la invitación" : "Oculto"}</div>
                </div>
                <div className={`toggle${regaloActivo ? " on" : ""}`}>
                  <div className="toggle-thumb" />
                </div>
              </div>

              <div className={`collapsible${regaloActivo ? " open" : ""}`}>
                <div className="campo">
                  <label className="field-label">Banco / Entidad financiera</label>
                  <input className="field-input" value={regaloBanco} onChange={e => setRegaloBanco(e.target.value)} placeholder="Ej: BBVA, Banorte, Bancolombia, BCP…"/>
                </div>
                <div className="campo">
                  <label className="field-label">Nombre del titular</label>
                  <input className="field-input" value={regaloTitular} onChange={e => setRegaloTitular(e.target.value)} placeholder="Nombre tal como aparece en la cuenta"/>
                </div>
                <div className="campo">
                  <label className="field-label">Número de cuenta / CLABE / CBU<span className="field-hint">Se mostrará con botón para copiar</span></label>
                  <input className="field-input mono" value={regaloCuenta} onChange={e => setRegaloCuenta(e.target.value)} placeholder="000000000000000000" inputMode="numeric"/>
                </div>
                <div className="campo">
                  <label className="field-label">Mensaje <span className="optional">(opcional)</span></label>
                  <textarea className="field-input" value={regaloMensaje} onChange={e => setRegaloMensaje(e.target.value)} placeholder="Ej: Tu presencia es el mejor regalo, pero si deseas hacernos llegar un detalle…" rows={3} style={{resize:"none"}}/>
                </div>

                {(regaloBanco || regaloCuenta) && (
                  <div className="preview-box">
                    <div className="preview-label">Vista previa</div>
                    <div className="preview-gift-inner">
                      <span style={{fontSize:20}}>🎁</span>
                      <div style={{flex:1}}>
                        {regaloMensaje && <p style={{fontSize:11,fontStyle:"italic",color:"var(--ink2)",lineHeight:1.5,marginBottom:8}}>{regaloMensaje}</p>}
                        {regaloBanco && <div className="preview-row"><span className="pk">Banco</span><span className="pv">{regaloBanco}</span></div>}
                        {regaloTitular && <div className="preview-row"><span className="pk">Titular</span><span className="pv">{regaloTitular}</span></div>}
                        {regaloCuenta && <div className="preview-row"><span className="pk">Cuenta</span><span className="pv mono-sm">{regaloCuenta}</span><span className="copy-tag">copiar</span></div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════
                SECCIÓN 2: CÓDIGO DE VESTIMENTA
            ══════════════════════════════════════════ */}
            <div className="section-card">
              <div className="section-header">
                <div className="section-icon">👗</div>
                <div>
                  <div className="section-title">Código de vestimenta</div>
                  <div className="section-sub">Indica cómo deben vestir tus invitados</div>
                </div>
              </div>

              <div className="toggle-row" onClick={() => setVestActivo(!vestActivo)}>
                <div>
                  <div className="toggle-label">Mostrar dress code</div>
                  <div className="toggle-sub">{vestActivo ? "Visible en la invitación" : "Oculto"}</div>
                </div>
                <div className={`toggle${vestActivo ? " on" : ""}`}>
                  <div className="toggle-thumb" />
                </div>
              </div>

              <div className={`collapsible${vestActivo ? " open" : ""}`}>
                {/* Tipo de vestimenta */}
                <div className="campo">
                  <label className="field-label">Tipo de vestimenta</label>
                  <div className="tipos-grid">
                    {TIPOS_VESTIMENTA.map(t => (
                      <button
                        key={t.id}
                        className={`tipo-btn${vestTipo === t.id ? " selected" : ""}`}
                        onClick={() => setVestTipo(vestTipo === t.id ? "" : t.id)}
                        type="button"
                      >
                        <span className="tipo-emoji">{t.emoji}</span>
                        <span className="tipo-label">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paleta de colores */}
                <div className="campo">
                  <label className="field-label">
                    Paleta de colores <span className="optional">(hasta 6 — opcional)</span>
                  </label>
                  <div className="color-grid">
                    {COLORES_SUGERIDOS.map(hex => (
                      <button
                        key={hex}
                        className={`color-swatch${vestColores.includes(hex) ? " selected" : ""}`}
                        style={{ background: hex, border: hex === "#FFFFFF" || hex === "#FAF6F0" ? "1.5px solid rgba(0,0,0,0.12)" : "none" }}
                        onClick={() => toggleColor(hex)}
                        type="button"
                        title={hex}
                      >
                        {vestColores.includes(hex) && (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7l3.5 3.5L12 3" stroke={isLight(hex) ? "#140d04" : "#fff"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  {vestColores.length > 0 && (
                    <div className="colores-seleccionados">
                      <span className="selected-label">Seleccionados:</span>
                      {vestColores.map(hex => (
                        <span key={hex} className="color-chip" style={{background:hex,border:isLight(hex)?"1px solid rgba(0,0,0,0.15)":"none"}}
                          onClick={() => toggleColor(hex)} title="Click para quitar">
                          <span style={{color:isLight(hex)?"#140d04":"#fff",fontSize:10,fontWeight:700}}>×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nota libre */}
                <div className="campo">
                  <label className="field-label">Nota adicional <span className="optional">(opcional)</span></label>
                  <input className="field-input" value={vestNota} onChange={e => setVestNota(e.target.value)} placeholder="Ej: Por favor evitar el color blanco / Zapatos cerrados"/>
                </div>

                {/* Preview vestimenta */}
                {(vestTipo || vestColores.length > 0 || vestNota) && (
                  <div className="preview-box vest">
                    <div className="preview-label">Vista previa</div>
                    <div className="preview-vest-inner">
                      {tipoActual && (
                        <div className="preview-vest-tipo">
                          <span style={{fontSize:22}}>{tipoActual.emoji}</span>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"var(--ink)"}}>{tipoActual.label}</div>
                            <div style={{fontSize:11,color:"var(--ink3)",marginTop:1}}>{tipoActual.desc}</div>
                          </div>
                        </div>
                      )}
                      {vestColores.length > 0 && (
                        <div className="preview-vest-colores">
                          <span style={{fontSize:11,fontWeight:600,color:"var(--ink3)"}}>PALETA</span>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                            {vestColores.map(hex => (
                              <div key={hex} style={{
                                width:32,height:32,borderRadius:8,
                                background:hex,
                                border:isLight(hex)?"1.5px solid rgba(0,0,0,0.12)":"1.5px solid rgba(255,255,255,0.1)",
                                boxShadow:"0 2px 6px rgba(0,0,0,0.12)",
                              }}/>
                            ))}
                          </div>
                        </div>
                      )}
                      {vestNota && (
                        <div style={{fontSize:12,color:"var(--ink2)",fontStyle:"italic",borderTop:"1px solid var(--border)",paddingTop:10,marginTop:4,lineHeight:1.5}}>
                          {vestNota}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════
                SECCIÓN 3: PROGRAMA DEL EVENTO
            ══════════════════════════════════════════ */}
            <div className="section-card">
              <div className="section-header" style={{cursor:"pointer"}} onClick={() => setItiOpen(o => !o)}>
                <div className="section-icon">📅</div>
                <div style={{flex:1}}>
                  <div className="section-title">Programa del evento</div>
                  <div className="section-sub">Itinerario que verán tus invitados</div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round"
                  style={{transition:"transform .25s", transform: itiOpen ? "rotate(180deg)" : "rotate(0deg)"}}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>

              {itiOpen && (
                <div className="iti-body">
                  {/* Lista de ítems */}
                  {items.length > 0 && (
                    <div className="iti-list">
                      {items.map((item, idx) => (
                        <div key={item.id} className="iti-item">
                          <div className="iti-item-icon">{item.icono}</div>
                          <div className="iti-item-info">
                            {item.hora && <span className="iti-item-hora">{item.hora}</span>}
                            <span className="iti-item-titulo">{item.titulo}</span>
                            {item.descripcion && <span className="iti-item-desc">{item.descripcion}</span>}
                          </div>
                          <div className="iti-item-btns">
                            <button className="iti-ord-btn" onClick={() => moverItem(item.id, "up")} disabled={idx === 0} title="Subir">▲</button>
                            <button className="iti-ord-btn" onClick={() => moverItem(item.id, "down")} disabled={idx === items.length - 1} title="Bajar">▼</button>
                            <button className="iti-del-btn" onClick={() => eliminarItem(item.id)} disabled={eliminandoItem === item.id}>
                              {eliminandoItem === item.id ? "…" : "×"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario nuevo ítem */}
                  <div className="iti-form">
                    <div className="iti-form-title">+ Agregar momento</div>

                    {/* Selector de emoji */}
                    <div className="iti-form-label">Ícono</div>
                    <div className="iti-emoji-grid">
                      {["✨","🎂","💃","🎶","📸","🥂","🍽️","👑","💍","🎓","🎭","🎊","🕯️","🌸","🎁","💐","🪩","🎤","🎺","🥳","🌟","🎠","🫶","🎻","🏆"].map(e => (
                        <button key={e} className={`iti-emoji-btn${nuevoIcono === e ? " sel" : ""}`} onClick={() => setNuevoIcono(e)}>{e}</button>
                      ))}
                    </div>

                    <div className="iti-form-row">
                      <div style={{flex:"0 0 90px"}}>
                        <div className="iti-form-label">Hora</div>
                        <input className="iti-input" type="time" value={nuevoHora} onChange={e => setNuevoHora(e.target.value)} placeholder="18:00" />
                      </div>
                      <div style={{flex:1}}>
                        <div className="iti-form-label">Título *</div>
                        <input className="iti-input" placeholder="Ej: Entrada de los novios" value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} maxLength={60} />
                      </div>
                    </div>

                    <div className="iti-form-label" style={{marginTop:8}}>Descripción (opcional)</div>
                    <input className="iti-input" placeholder="Detalles del momento…" value={nuevoDesc} onChange={e => setNuevoDesc(e.target.value)} maxLength={120} />

                    <button
                      className="iti-add-btn"
                      onClick={agregarItem}
                      disabled={agregando || !nuevoTitulo.trim()}
                    >
                      {agregando ? "Agregando…" : "Agregar al programa"}
                    </button>
                  </div>

                  {items.length === 0 && (
                    <p className="iti-empty">Aún no hay momentos. Agrega el primero arriba.</p>
                  )}
                </div>
              )}
            </div>

            {/* ─── Botón guardar ─── */}
            <button className={`btn-guardar${guardado ? " done" : ""}`} onClick={guardar} disabled={guardando}>
              {guardando
                ? <><div className="spinner sm" /> Guardando…</>
                : guardado
                ? <>✓ Cambios guardados</>
                : <>Guardar configuración</>
              }
            </button>

            <div style={{height:"calc(40px + env(safe-area-inset-bottom, 16px))"}} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;background:#FAF6F0;color:#1a1209}
  :root{
    --bg:#FAF6F0;--surface:#fff;--cream2:#F3EDE3;
    --ink:#1a1209;--ink2:#3d2b0f;--ink3:#8B6914;
    --gold:#C9A96E;--gold-pale:rgba(201,169,110,0.1);
    --border:rgba(201,169,110,0.2);--border-mid:rgba(201,169,110,0.35);
    --shadow:0 4px 20px rgba(26,18,9,0.08);
    --r:20px;
  }
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}

  .page-wrap{min-height:100dvh;background:var(--bg);opacity:0;transition:opacity .35s}
  .page-wrap.vis{opacity:1}

  .top-bar{display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(250,246,240,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:30}
  .back-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:var(--cream2);border:1px solid var(--border);color:var(--ink2);text-decoration:none;flex-shrink:0;transition:background .15s}
  .back-btn:hover{background:var(--gold-pale)}
  .top-bar-logo{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
  .top-bar-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink);line-height:1.1}
  .top-bar-sub{font-size:10px;color:var(--ink3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}

  .content{max-width:480px;margin:0 auto;padding:18px 16px}

  .section-card{background:var(--surface);border-radius:var(--r);border:1px solid var(--border-mid);box-shadow:var(--shadow);padding:18px;margin-bottom:14px;animation:fadeIn .4s ease both}
  .section-header{display:flex;align-items:flex-start;gap:13px;margin-bottom:16px}
  .section-icon{font-size:24px;line-height:1;flex-shrink:0;margin-top:2px}
  .section-title{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:2px}
  .section-sub{font-size:12px;color:var(--ink3);line-height:1.5}

  /* Toggle */
  .toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#FAF6F0;border:1px solid var(--border);border-radius:13px;padding:13px 15px;cursor:pointer;user-select:none;-webkit-user-select:none;transition:background .15s}
  .toggle-row:hover{background:rgba(201,169,110,0.06)}
  .toggle-label{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:2px}
  .toggle-sub{font-size:11px;color:var(--ink3)}
  .toggle{width:46px;height:26px;border-radius:13px;background:rgba(201,169,110,0.2);flex-shrink:0;position:relative;transition:background .25s}
  .toggle.on{background:var(--gold)}
  .toggle-thumb{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:transform .25s cubic-bezier(.4,0,.2,1)}
  .toggle.on .toggle-thumb{transform:translateX(20px)}

  /* Collapsible */
  .collapsible{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.4,0,.2,1)}
  .collapsible.open{max-height:2000px}

  /* Campos */
  .campo{margin-top:14px}
  .field-label{display:block;font-size:11px;font-weight:600;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
  .field-hint{display:block;font-size:10px;font-weight:400;color:var(--ink3);text-transform:none;letter-spacing:0;margin-top:1px}
  .optional{font-size:11px;font-weight:400;color:var(--ink3);text-transform:none;letter-spacing:0}
  .field-input{width:100%;background:var(--surface);border:1.5px solid var(--border-mid);border-radius:12px;padding:11px 14px;font-size:14px;font-family:'Jost',sans-serif;color:var(--ink);outline:none;transition:border-color .15s}
  .field-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,169,110,0.12)}
  .field-input.mono{font-family:'Courier New',monospace;font-size:13px;letter-spacing:.5px}

  /* Tipos grid */
  .tipos-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
  .tipo-btn{display:flex;align-items:center;gap:8px;background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:10px 12px;cursor:pointer;transition:all .15s;font-family:'Jost',sans-serif;text-align:left}
  .tipo-btn:hover{border-color:var(--gold);background:var(--gold-pale)}
  .tipo-btn.selected{border-color:var(--gold);background:rgba(201,169,110,0.12);box-shadow:0 0 0 1px var(--gold)}
  .tipo-emoji{font-size:18px;line-height:1;flex-shrink:0}
  .tipo-label{font-size:12px;font-weight:600;color:var(--ink);line-height:1.3}

  /* Color grid */
  .color-grid{display:flex;flex-wrap:wrap;gap:7px;margin-top:2px}
  .color-swatch{width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s,box-shadow .15s;flex-shrink:0;outline:none;padding:0}
  .color-swatch:hover{transform:scale(1.15);box-shadow:0 3px 10px rgba(0,0,0,0.2)}
  .color-swatch.selected{transform:scale(1.1);box-shadow:0 0 0 2.5px var(--gold),0 3px 10px rgba(0,0,0,0.2)}
  .colores-seleccionados{display:flex;align-items:center;gap:7px;margin-top:10px;flex-wrap:wrap}
  .selected-label{font-size:11px;font-weight:600;color:var(--ink3)}
  .color-chip{width:24px;height:24px;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s}
  .color-chip:hover{transform:scale(1.1)}

  /* Preview */
  .preview-box{margin-top:16px;border-radius:14px;background:linear-gradient(135deg,rgba(201,169,110,0.08),rgba(232,213,176,0.12));border:1.5px dashed rgba(201,169,110,0.4);padding:14px 15px}
  .preview-label{font-size:10px;font-weight:600;color:var(--gold);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
  .preview-gift-inner{display:flex;gap:11px;align-items:flex-start}
  .preview-row{display:flex;align-items:center;gap:7px;margin-bottom:5px;flex-wrap:wrap}
  .pk{font-size:10px;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.4px;flex-shrink:0}
  .pv{font-size:12px;font-weight:600;color:var(--ink)}
  .pv.mono-sm{font-family:'Courier New',monospace;font-size:11px;word-break:break-all}
  .copy-tag{font-size:10px;font-weight:600;color:#140d04;background:var(--gold);border-radius:5px;padding:2px 6px}

  .preview-vest-inner{display:flex;flex-direction:column;gap:12px}
  .preview-vest-tipo{display:flex;align-items:center;gap:12px;background:rgba(250,246,240,0.8);border-radius:12px;padding:10px 12px}
  .preview-vest-colores{padding:4px 0}

  /* Save button */
  .btn-guardar{width:100%;background:linear-gradient(135deg,#C9A96E,#E8C97A);color:#140d04;border:none;border-radius:16px;padding:15px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Jost',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 18px rgba(201,169,110,0.35);transition:opacity .15s,transform .15s;letter-spacing:.2px}
  .btn-guardar:disabled{opacity:.6;cursor:not-allowed}
  .btn-guardar.done{background:linear-gradient(135deg,#2d7d46,#38a85c);color:#fff;box-shadow:0 4px 18px rgba(45,125,70,0.3)}
  .btn-guardar:active:not(:disabled){transform:scale(.98)}

  /* Spinners */
  @keyframes spin{to{transform:rotate(360deg)}}
  .spinner{border-radius:50%;border:2px solid rgba(201,169,110,0.2);border-top-color:#140d04;animation:spin .75s linear infinite}
  .spinner.sm{width:14px;height:14px}
  .spinner.lg{width:30px;height:30px;border-top-color:var(--gold)}
  .spinner-center{display:flex;justify-content:center;padding:60px}

  /* ─── Itinerario ─── */
  .iti-body{padding:0 18px 18px;display:flex;flex-direction:column;gap:14px}
  .iti-list{display:flex;flex-direction:column;gap:8px}
  .iti-item{display:flex;align-items:flex-start;gap:11px;background:var(--surface);border:1.5px solid var(--border-mid);border-radius:12px;padding:12px 10px 12px 14px}
  .iti-item-icon{font-size:20px;line-height:1;flex-shrink:0;margin-top:1px}
  .iti-item-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
  .iti-item-hora{font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.8px}
  .iti-item-titulo{font-size:14px;font-weight:600;color:var(--ink);line-height:1.3}
  .iti-item-desc{font-size:11px;color:var(--ink3);line-height:1.4;margin-top:1px}
  .iti-item-btns{display:flex;align-items:center;gap:4px;flex-shrink:0}
  .iti-ord-btn{width:26px;height:26px;border-radius:7px;background:var(--cream2);border:1px solid var(--border);color:var(--ink3);font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s}
  .iti-ord-btn:hover:not(:disabled){background:var(--gold-pale);border-color:var(--gold);color:var(--gold-dark)}
  .iti-ord-btn:disabled{opacity:.35;cursor:default}
  .iti-del-btn{width:26px;height:26px;border-radius:7px;background:#fef2f2;border:1px solid rgba(185,28,28,.15);color:#b91c1c;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;line-height:1}
  .iti-del-btn:hover:not(:disabled){background:#fee2e2}

  .iti-form{background:rgba(201,169,110,0.06);border:1.5px dashed rgba(201,169,110,0.3);border-radius:14px;padding:14px}
  .iti-form-title{font-size:12px;font-weight:700;color:var(--gold-dark);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px}
  .iti-form-label{font-size:10px;font-weight:700;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
  .iti-form-row{display:flex;gap:9px;align-items:flex-end}
  .iti-input{width:100%;background:var(--surface);border:1.5px solid var(--border-mid);border-radius:10px;padding:9px 12px;font-size:13px;font-family:'Jost',sans-serif;color:var(--ink);outline:none;transition:border-color .15s}
  .iti-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,169,110,0.12)}
  .iti-input::placeholder{color:var(--ink3);opacity:.6}
  .iti-emoji-grid{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
  .iti-emoji-btn{width:34px;height:34px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;line-height:1}
  .iti-emoji-btn:hover{border-color:var(--gold);background:var(--gold-pale)}
  .iti-emoji-btn.sel{border-color:var(--gold);background:rgba(201,169,110,0.15);box-shadow:0 0 0 1px var(--gold)}
  .iti-add-btn{width:100%;margin-top:12px;background:linear-gradient(135deg,var(--dark),var(--dark2));color:var(--gold);border:1px solid rgba(201,169,110,0.3);border-radius:11px;padding:11px;font-family:'Jost',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s}
  .iti-add-btn:disabled{opacity:.55;cursor:not-allowed}
  .iti-empty{font-size:12px;color:var(--ink3);text-align:center;font-style:italic;padding:4px 0}
`;

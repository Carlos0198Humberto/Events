"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

function AppLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="64" height="64" rx="18" fill="#140d04"/>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(201,169,110,0.20)" strokeWidth="1.2"/>
      {/* Geometric E — vertical bar */}
      <rect x="13" y="14" width="6" height="36" rx="3" fill="#C9A96E"/>
      {/* Top bar */}
      <rect x="13" y="14" width="24" height="6" rx="3" fill="#C9A96E"/>
      {/* Middle bar (slightly shorter) */}
      <rect x="13" y="29" width="18" height="6" rx="3" fill="#C9A96E"/>
      {/* Bottom bar */}
      <rect x="13" y="44" width="24" height="6" rx="3" fill="#C9A96E"/>
      {/* 4-pointed star sparkle — upper right */}
      <path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E8D5B0"/>
      {/* Small accent dot */}
      <circle cx="47" cy="46" r="2.5" fill="#C9A96E" opacity="0.55"/>
    </svg>
  );
}

type Invitado = {
  id?: string;
  nombre: string;
  token: string;
  telefono?: string;
  num_personas?: number;
  cupo_elije_invitado?: boolean;
  estado?: string;
};

type Evento = {
  nombre: string;
  tipo: string;
  anfitriones: string;
  fecha_limite_confirmacion?: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  quinceañera: "Quinceañera",
  boda: "Boda",
  graduacion: "Graduación",
  cumpleaños: "Cumpleaños",
  otro: "Evento especial",
};

export default function AgregarInvitados() {
  const params = useParams();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [numPersonas, setNumPersonas] = useState("1");
  const [cupoElijeInvitado, setCupoElijeInvitado] = useState(false);
  const [agregados, setAgregados] = useState<Invitado[]>([]);
  const [todosInvitados, setTodosInvitados] = useState<Invitado[]>([]);
  const [loadingInvitados, setLoadingInvitados] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [enviandoTodos, setEnviandoTodos] = useState(false);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const bulkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = "Eventix — Gestionar invitados";
    setTimeout(() => setMounted(true), 50);
    if (params.id) {
      // Cargar datos del evento
      supabase
        .from("eventos")
        .select("nombre, tipo, anfitriones, fecha_limite_confirmacion")
        .eq("id", params.id)
        .single()
        .then(({ data }) => { if (data) setEvento(data); });
      // Cargar TODOS los invitados existentes
      cargarTodosInvitados();
    }
    return () => {
      if (bulkTimerRef.current) clearTimeout(bulkTimerRef.current);
    };
  }, [params.id]);

  async function cargarTodosInvitados() {
    setLoadingInvitados(true);
    const { data } = await supabase
      .from("invitados")
      .select("id, nombre, token, telefono, num_personas, cupo_elije_invitado, estado")
      .eq("evento_id", params.id)
      .order("created_at", { ascending: true });
    if (data) setTodosInvitados(data);
    setLoadingInvitados(false);
  }

  async function handleEliminar(inv: Invitado) {
    if (!inv.id) return;
    setEliminando(inv.id);
    const { error } = await supabase
      .from("invitados")
      .delete()
      .eq("id", inv.id);
    if (!error) {
      setTodosInvitados((prev) => prev.filter((i) => i.id !== inv.id));
      setAgregados((prev) => prev.filter((i) => i.token !== inv.token));
    }
    setEliminando(null);
    setConfirmEliminar(null);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function buildLink(token: string) {
    return `${window.location.origin}/confirmar/${token}`;
  }

  function buildWhatsAppUrl(inv: Invitado) {
    const link = buildLink(inv.token);
    // Build personalized message using event data
    let fechaTexto = "";
    if (evento?.fecha_limite_confirmacion) {
      const d = new Date(evento.fecha_limite_confirmacion);
      fechaTexto = d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    }
    const tipoLabel = evento ? (TIPO_LABEL[evento.tipo] || "evento especial") : "evento especial";
    const anfitriones = evento?.anfitriones ?? "";
    let mensajeBase: string;
    if (evento) {
      mensajeBase =
        `Hola ${inv.nombre}, te saluda ${anfitriones}, con relación a nuestra ${tipoLabel}, te invitamos a confirmar` +
        (fechaTexto ? ` antes del ${fechaTexto}` : "") +
        `:\n${link}`;
    } else {
      mensajeBase = `Hola ${inv.nombre}, estás invitado a nuestro evento. Confirma tu asistencia aquí:\n${link}`;
    }
    const msg = encodeURIComponent(mensajeBase);
    // Normalize phone: keep only digits and leading +
    const rawPhone = inv.telefono ?? "";
    const phone = rawPhone.replace(/[^\d+]/g, "").replace(/(?!^\+)\+/g, "");
    return phone
      ? `https://wa.me/${phone.replace("+", "")}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleAgregar() {
    setLoading(true);
    setError("");
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      setLoading(false);
      return;
    }
    const personas = cupoElijeInvitado ? null : Math.max(1, parseInt(numPersonas) || 1);
    const { data, error } = await supabase
      .from("invitados")
      .insert({
        evento_id: params.id,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        num_personas: personas ?? 1,
        cupo_elije_invitado: cupoElijeInvitado,
      })
      .select()
      .single();

    if (error) {
      setError("Error al agregar invitado. Intenta de nuevo.");
    } else {
      const nuevo: Invitado = {
        id: data.id,
        nombre: nombre.trim(),
        token: data.token,
        telefono: telefono.trim() || undefined,
        num_personas: personas ?? 1,
        cupo_elije_invitado: cupoElijeInvitado,
        estado: "pendiente",
      };
      setAgregados((prev) => [...prev, nuevo]);
      // También se agrega a la lista completa
      setTodosInvitados((prev) => [...prev, nuevo]);
      setNombre("");
      setTelefono("");
      setNumPersonas("1");
      setCupoElijeInvitado(false);
    }
    setLoading(false);
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(buildLink(token));
    setCopiado(token);
    setTimeout(() => setCopiado(null), 2200);
  }

  function enviarWhatsApp(inv: Invitado) {
    window.open(buildWhatsAppUrl(inv), "_blank");
    setEnviados((prev) => new Set(prev).add(inv.token));
  }

  /**
   * Opens WhatsApp for each invitado that has a phone number,
   * staggered 1.2s apart to avoid popup blockers blocking all but the first.
   */
  function enviarATodos() {
    setShowBulkConfirm(false);
    const conTelefono = agregados.filter((inv) => inv.telefono);
    if (conTelefono.length === 0) return;

    setEnviandoTodos(true);
    let i = 0;

    const abrir = () => {
      if (i >= conTelefono.length) {
        setEnviandoTodos(false);
        return;
      }
      const inv = conTelefono[i];
      window.open(buildWhatsAppUrl(inv), "_blank");
      setEnviados((prev) => new Set(prev).add(inv.token));
      i++;
      bulkTimerRef.current = setTimeout(abrir, 1400);
    };

    abrir();
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const conTelefono = agregados.filter((inv) => inv.telefono);
  const sinTelefono = agregados.filter((inv) => !inv.telefono);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #FAF6F0;
          --surface:      #FFFFFF;
          --surface2:     #F7F2EA;
          --border:       rgba(201,169,110,0.16);
          --border-hover: rgba(201,169,110,0.50);
          --border-input: rgba(201,169,110,0.28);
          --accent:       #C9A96E;
          --accent2:      #8B6914;
          --accent-light: #C9A96E;
          --accent-soft:  rgba(201,169,110,0.08);
          --accent-soft2: rgba(201,169,110,0.16);
          --text:         #1a0f04;
          --text2:        #3d2b0f;
          --text3:        #8B6914;
          --shadow:       0 4px 28px rgba(26,15,4,0.10);
          --shadow-sm:    0 2px 10px rgba(26,15,4,0.07);
          --shadow-btn:   0 6px 28px rgba(201,169,110,0.38);
          --wa-green:     #25D366;
          --wa-dark:      #128C7E;
          --transition:   all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 320px; height: 320px; top: -80px; right: -60px; background: radial-gradient(circle, rgba(13,148,136,0.16) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 260px; height: 260px; bottom: 80px; left: -80px; background: radial-gradient(circle, rgba(94,234,212,0.11) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        @keyframes glowDrift1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-18px,28px)} 66%{transform:translate(14px,-18px)} }
        @keyframes glowDrift2 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(22px,-30px)} 70%{transform:translate(-8px,18px)} }

        .page-wrap { min-height:100vh; min-height:100dvh; background:var(--bg); position:relative; }

        .top-bar { background:rgba(250,246,240,0.96); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-bottom:1px solid var(--border); padding:13px 18px; padding-top:calc(13px + env(safe-area-inset-top,0px)); display:flex; align-items:center; gap:11px; position:sticky; top:0; z-index:10; box-shadow:var(--shadow-sm); }
        .top-bar-name { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:var(--text); letter-spacing:-0.5px; line-height:1; }
        .top-bar-name span { color:var(--accent); }
        .top-bar-sub { font-size:10.5px; font-weight:500; letter-spacing:1.8px; text-transform:uppercase; color:var(--text3); margin-top:2px; }

        /* scroll-area: flujo normal, NO overflow interno — el scroll lo hace la página completa */
        .scroll-area { padding:22px 16px; padding-bottom:calc(110px + env(safe-area-inset-bottom,16px)); display:flex; flex-direction:column; gap:16px; max-width:480px; width:100%; margin:0 auto; position:relative; z-index:1; }

        .card { background:var(--surface); border:1.5px solid var(--border); border-radius:22px; padding:22px 20px; box-shadow:var(--shadow); }
        .section-card { background:var(--surface); border:1.5px solid var(--border); border-radius:22px; padding:20px 18px; box-shadow:var(--shadow); }
        .card-title { font-family:'Cormorant Garamond',serif; font-size:21px; font-weight:600; color:var(--text); margin-bottom:3px; letter-spacing:-0.3px; }
        .card-sub { font-size:12.5px; color:var(--text3); margin-bottom:20px; font-weight:500; }

        .error-box { background:#fff1f2; border:1px solid #fecdd3; color:#e11d48; font-size:13px; padding:10px 14px; border-radius:12px; margin-bottom:16px; font-weight:500; }

        .fields { display:flex; flex-direction:column; gap:15px; }
        .field-label { font-size:11px; font-weight:600; color:var(--accent); display:block; margin-bottom:7px; letter-spacing:0.6px; text-transform:uppercase; }
        .field-input { width:100%; border:2px solid var(--border-input); border-radius:14px; padding:13px 15px; font-size:15px; background:var(--accent-soft); color:var(--text); outline:none; transition:border-color .22s,box-shadow .22s,background .22s; font-family:'DM Sans',sans-serif; -webkit-appearance:none; }
        .field-input::placeholder { color:var(--text3); }
        .field-input:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(13,148,136,0.11); background:var(--surface); }

        .btn-submit { width:100%; padding:15px; border-radius:14px; border:none; background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%); color:#fff; font-size:15px; font-weight:600; font-family:'DM Sans',sans-serif; letter-spacing:0.3px; cursor:pointer; margin-top:4px; box-shadow:var(--shadow-btn); transition:transform .2s ease,box-shadow .2s ease,opacity .2s; position:relative; overflow:hidden; -webkit-tap-highlight-color:transparent; }
        .btn-submit::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 55%); pointer-events:none; border-radius:inherit; }
        .btn-shimmer { position:absolute; inset:0; border-radius:inherit; background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.22) 50%,transparent 62%); background-size:200% 100%; animation:shimmer 3.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 10px 34px rgba(13,148,136,0.50); }
        .btn-submit:not(:disabled):active { transform:scale(0.97); }
        .btn-submit:disabled { opacity:0.55; cursor:not-allowed; }

        /* ── List ── */
        .list-header { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:var(--text2); margin-bottom:14px; }
        .list-badge { background:linear-gradient(135deg,var(--accent),var(--accent2)); color:white; border-radius:99px; font-size:11px; font-weight:700; padding:2px 9px; }

        /* ── Bulk send button ── */
        .btn-bulk {
          width:100%; padding:13px 16px; border-radius:14px; border:none;
          background:linear-gradient(135deg,var(--wa-green) 0%,var(--wa-dark) 100%);
          color:#fff; font-size:14px; font-weight:700;
          font-family:'DM Sans',sans-serif; letter-spacing:0.2px;
          cursor:pointer; margin-bottom:14px;
          box-shadow:0 6px 24px rgba(37,211,102,0.38);
          transition:transform .2s,box-shadow .2s,opacity .2s;
          position:relative; overflow:hidden;
          display:flex; align-items:center; justify-content:center; gap:8px;
          -webkit-tap-highlight-color:transparent;
        }
        .btn-bulk:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(37,211,102,0.50); }
        .btn-bulk:not(:disabled):active { transform:scale(0.97); }
        .btn-bulk:disabled { opacity:0.55; cursor:not-allowed; }
        .btn-bulk-shimmer { position:absolute; inset:0; border-radius:inherit; background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.18) 50%,transparent 62%); background-size:200% 100%; animation:shimmer 3s ease-in-out infinite; }

        /* ── Stats bar ── */
        .stats-bar { display:flex; gap:8px; margin-bottom:14px; }
        .stat-pill { flex:1; padding:8px 10px; border-radius:12px; font-size:11.5px; font-weight:600; display:flex; align-items:center; gap:5px; }
        .stat-pill-green { background:#f0fdf4; color:#16a34a; border:1px solid #86efac; }
        .stat-pill-amber { background:#fffbeb; color:#b45309; border:1px solid #fcd34d; }

        /* ── Inv row ── */
        .inv-row { display:flex; align-items:center; gap:10px; padding:11px 12px; background:var(--surface2); border-radius:14px; border:1px solid var(--border); margin-bottom:8px; }
        .inv-row:last-child { margin-bottom:0; }
        .inv-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--accent2)); display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:15px; flex-shrink:0; }
        .inv-info { flex:1; min-width:0; }
        .inv-name { font-size:14px; font-weight:500; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .inv-phone { font-size:11px; color:var(--text3); margin-top:1px; font-weight:500; }
        .inv-no-phone { font-size:11px; color:#fbbf24; margin-top:1px; font-weight:500; }
        .inv-actions { display:flex; gap:6px; flex-shrink:0; }

        .btn-action { font-size:11.5px; font-weight:700; border-radius:10px; padding:6px 10px; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; -webkit-tap-highlight-color:transparent; white-space:nowrap; border:1.5px solid; }
        .btn-copy-default { color:var(--accent); background:var(--surface); border-color:var(--border-input); }
        .btn-copy-done    { color:#16a34a; background:#f0fdf4; border-color:#86efac; }
        .btn-wa           { color:white; background:var(--wa-green); border-color:var(--wa-dark); }
        .btn-wa-done      { color:white; background:#16a34a; border-color:#15803d; }
        .btn-eliminar     { color:#dc2626; background:#fef2f2; border-color:#fecaca; }
        .btn-eliminar:hover { background:#fee2e2; }
        .btn-eliminar:disabled { opacity:.5; cursor:wait; }
        .estado-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:20px; }
        .estado-confirmado { background:#f0fdf4; color:#16a34a; border:1px solid #86efac; }
        .estado-pendiente  { background:#fffbeb; color:#92400e; border:1px solid #fcd34d; }
        .estado-rechazado  { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
        .confirm-eliminar { background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:10px 12px; display:flex; align-items:center; gap:8px; margin-top:6px; flex-wrap:wrap; }
        .section-divider { border:none; border-top:1px solid var(--border); margin:18px 0; }
        .gestionar-header { font-size:13px; font-weight:700; color:var(--accent2); text-transform:uppercase; letter-spacing:.6px; margin-bottom:12px; display:flex; align-items:center; gap:6px; }

        /* ── Confirm overlay ── */
        .overlay { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:20px; }
        .confirm-card { background:var(--surface); border-radius:24px; padding:28px 24px; max-width:340px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,0.22); border:1.5px solid var(--border); text-align:center; }
        .confirm-icon { font-size:36px; margin-bottom:14px; }
        .confirm-title { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:var(--text); margin-bottom:8px; }
        .confirm-body { font-size:13.5px; color:var(--text2); line-height:1.55; margin-bottom:22px; }
        .confirm-actions { display:flex; gap:10px; }
        .btn-cancel { flex:1; padding:13px; border-radius:12px; border:1.5px solid var(--border-input); background:var(--surface); color:var(--text2); font-size:14px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .btn-confirm { flex:1; padding:13px; border-radius:12px; border:none; background:linear-gradient(135deg,var(--wa-green),var(--wa-dark)); color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 16px rgba(37,211,102,0.35); }

        /* ── No-phone warning ── */
        .warn-box { background:#fffbeb; border:1px solid #fcd34d; color:#92400e; font-size:12.5px; padding:9px 13px; border-radius:12px; margin-bottom:10px; font-weight:500; display:flex; align-items:center; gap:7px; }

        /* ── Bottom bar ── */
        .bottom-bar { position:fixed; bottom:0; left:0; right:0; z-index:20; padding:12px 16px; padding-bottom:calc(12px + env(safe-area-inset-bottom,0px)); background:rgba(240,250,249,0.94); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-top:1px solid var(--border); box-shadow:0 -4px 24px rgba(13,148,136,0.09); }
        .btn-back { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; max-width:480px; margin:0 auto; padding:14px; background:var(--surface); color:var(--text2); border:1.5px solid var(--border); border-radius:14px; font-size:14px; font-weight:600; font-family:'DM Sans',sans-serif; text-decoration:none; transition:var(--transition); box-shadow:var(--shadow-sm); -webkit-tap-highlight-color:transparent; }
        .btn-back:hover { background:var(--accent-soft2); color:var(--accent); border-color:var(--border-hover); }

        /* ── Mount animations ── */
        .anim-header { opacity:0; transform:translateY(-10px); }
        .anim-card   { opacity:0; transform:translateY(20px); }
        .anim-list   { opacity:0; transform:translateY(14px); }
        .anim-bottom { opacity:0; transform:translateY(20px); }
        .mounted .anim-header { animation:mountUp .5s cubic-bezier(.22,1,.36,1) .05s both; }
        .mounted .anim-card   { animation:mountUp .6s cubic-bezier(.22,1,.36,1) .15s both; }
        .mounted .anim-list   { animation:mountUp .5s cubic-bezier(.22,1,.36,1) .28s both; }
        .mounted .anim-bottom { animation:mountUp .45s cubic-bezier(.22,1,.36,1) .38s both; }
        @keyframes mountUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        /* ── Pulse for sending state ── */
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        .pulsing { animation:pulse 1.2s ease-in-out infinite; }
      `}</style>

      {/* ── Confirm overlay ── */}
      {showBulkConfirm && (
        <div className="overlay">
          <div className="confirm-card">
            <div className="confirm-icon">📲</div>
            <div className="confirm-title">Enviar a todos</div>
            <div className="confirm-body">
              Se abrirá WhatsApp para{" "}
              <strong>
                {conTelefono.length} invitado
                {conTelefono.length !== 1 ? "s" : ""}
              </strong>{" "}
              con número registrado.
              {sinTelefono.length > 0 && (
                <>
                  {" "}
                  Los otros <strong>{sinTelefono.length}</strong> sin número
                  serán omitidos.
                </>
              )}
            </div>
            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowBulkConfirm(false)}
              >
                Cancelar
              </button>
              <button className="btn-confirm" onClick={enviarATodos}>
                Enviar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`page-wrap${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        {/* ── Header ── */}
        <div className="top-bar anim-header">
          <AppLogo size={34} />
          <div>
            <div className="top-bar-name">
              Event<span>ix</span>
            </div>
            <div className="top-bar-sub">Agregar invitados</div>
          </div>
        </div>

        {/* ── Scroll area ── */}
        <div className="scroll-area">
          {/* ── Form card ── */}
          <div className="card anim-card">
            <div className="card-title">Nuevo invitado</div>
            <div className="card-sub">
              Agrega el número para poder enviar la invitación por WhatsApp
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="fields">
              <div>
                <label className="field-label">Nombre completo *</label>
                <input
                  className="field-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Carlos Pérez"
                  onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="field-label">Teléfono WhatsApp</label>
                <input
                  className="field-input"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: +503 7777 8888"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>

              {/* Cupo de personas para esta invitación */}
              <div>
                <label className="field-label">Cupo de personas</label>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  {!cupoElijeInvitado && (
                    <input
                      className="field-input"
                      type="number"
                      min="1"
                      max="20"
                      value={numPersonas}
                      onChange={(e) => setNumPersonas(e.target.value)}
                      placeholder="1"
                      style={{width:90}}
                      inputMode="numeric"
                    />
                  )}
                  <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"var(--text2)",fontWeight:500,userSelect:"none"}}>
                    <input
                      type="checkbox"
                      checked={cupoElijeInvitado}
                      onChange={(e) => setCupoElijeInvitado(e.target.checked)}
                      style={{accentColor:"var(--accent)",width:16,height:16}}
                    />
                    El invitado elige cuántas personas asistirán
                  </label>
                </div>
                <p style={{fontSize:10,color:"var(--text3)",marginTop:4}}>
                  {cupoElijeInvitado
                    ? "Al confirmar, el invitado indicará cuántas personas van (incluyéndose)."
                    : "Número de lugares reservados para esta invitación."}
                </p>
              </div>

              <button
                className="btn-submit"
                onClick={handleAgregar}
                disabled={loading || !nombre.trim()}
                type="button"
              >
                <span className="btn-shimmer" />
                {loading ? "Agregando..." : "+ Agregar invitado"}
              </button>
            </div>
          </div>

          {/* ── Added list ── */}
          {agregados.length > 0 && (
            <div className="card anim-list">
              <div className="list-header">
                <span className="list-badge">{agregados.length}</span>
                Agregados en esta sesión
              </div>

              {/* Stats */}
              <div className="stats-bar">
                <div className="stat-pill stat-pill-green">
                  <span>📱</span>
                  {conTelefono.length} con número
                </div>
                {sinTelefono.length > 0 && (
                  <div className="stat-pill stat-pill-amber">
                    <span>⚠️</span>
                    {sinTelefono.length} sin número
                  </div>
                )}
              </div>

              {/* Warning if some have no phone */}
              {sinTelefono.length > 0 && (
                <div className="warn-box">
                  ⚠️ {sinTelefono.length} invitado
                  {sinTelefono.length !== 1 ? "s" : ""} sin número no recibirán
                  WhatsApp.
                </div>
              )}

              {/* Bulk send button */}
              <button
                className={`btn-bulk${enviandoTodos ? " pulsing" : ""}`}
                onClick={() => setShowBulkConfirm(true)}
                disabled={enviandoTodos || conTelefono.length === 0}
                type="button"
              >
                <span className="btn-bulk-shimmer" />
                {/* WhatsApp SVG icon */}
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {enviandoTodos
                  ? `Enviando... (${conTelefono.length} invitados)`
                  : `Enviar invitación a todos (${conTelefono.length})`}
              </button>

              {/* Individual rows */}
              {agregados.map((inv, i) => (
                <div className="inv-row" key={i}>
                  <div className="inv-avatar">
                    {inv.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="inv-info">
                    <div className="inv-name">{inv.nombre}</div>
                    {inv.telefono ? (
                      <div className="inv-phone">📱 {inv.telefono}</div>
                    ) : (
                      <div className="inv-no-phone">⚠️ Sin número</div>
                    )}
                    <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>
                      {inv.cupo_elije_invitado
                        ? "👥 El invitado elige cuántos van"
                        : `👥 ${inv.num_personas ?? 1} lugar${(inv.num_personas ?? 1) !== 1 ? "es" : ""}`}
                    </div>
                  </div>
                  <div className="inv-actions">
                    <button
                      className={`btn-action ${copiado === inv.token ? "btn-copy-done" : "btn-copy-default"}`}
                      onClick={() => copiarLink(inv.token)}
                      type="button"
                      title="Copiar link de confirmación"
                    >
                      {copiado === inv.token ? "✓" : "🔗"}
                    </button>
                    {inv.telefono && (
                      <button
                        className={`btn-action ${enviados.has(inv.token) ? "btn-wa-done" : "btn-wa"}`}
                        onClick={() => enviarWhatsApp(inv)}
                        type="button"
                        title="Enviar por WhatsApp"
                      >
                        {enviados.has(inv.token) ? "✓ Enviado" : "WhatsApp"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Gestionar todos los invitados ── */}
        <div className="section-card" style={{ marginTop: 12 }}>
          <div className="gestionar-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Gestionar invitados ({todosInvitados.length})
          </div>

          {loadingInvitados ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>
              Cargando invitados...
            </div>
          ) : todosInvitados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>
              Aún no hay invitados. Agrégalos arriba.
            </div>
          ) : (
            <div>
              {todosInvitados.map((inv) => (
                <div key={inv.id ?? inv.token} style={{ marginBottom: 8 }}>
                  <div className="inv-row" style={{ marginBottom: 0 }}>
                    <div className="inv-avatar" style={{
                      background: inv.estado === "confirmado"
                        ? "linear-gradient(135deg,#16a34a,#15803d)"
                        : inv.estado === "rechazado"
                        ? "linear-gradient(135deg,#dc2626,#b91c1c)"
                        : "linear-gradient(135deg,var(--accent),var(--accent2))",
                    }}>
                      {inv.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="inv-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="inv-name">{inv.nombre}</div>
                        {inv.estado && (
                          <span className={`estado-badge ${
                            inv.estado === "confirmado" ? "estado-confirmado"
                            : inv.estado === "rechazado" ? "estado-rechazado"
                            : "estado-pendiente"
                          }`}>
                            {inv.estado === "confirmado" ? "✓ Confirmado"
                              : inv.estado === "rechazado" ? "✗ Rechazado"
                              : "Pendiente"}
                          </span>
                        )}
                      </div>
                      {inv.telefono ? (
                        <div className="inv-phone">📱 {inv.telefono}</div>
                      ) : (
                        <div className="inv-no-phone">Sin número</div>
                      )}
                      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                        {inv.cupo_elije_invitado
                          ? "👥 Elige cuántos van"
                          : `👥 ${inv.num_personas ?? 1} lugar${(inv.num_personas ?? 1) !== 1 ? "es" : ""}`}
                      </div>
                    </div>
                    <div className="inv-actions">
                      <button
                        className={`btn-action ${copiado === inv.token ? "btn-copy-done" : "btn-copy-default"}`}
                        onClick={() => copiarLink(inv.token)}
                        type="button"
                        title="Copiar link"
                      >
                        {copiado === inv.token ? "✓" : "🔗"}
                      </button>
                      {inv.telefono && (
                        <button
                          className={`btn-action ${enviados.has(inv.token) ? "btn-wa-done" : "btn-wa"}`}
                          onClick={() => enviarWhatsApp(inv)}
                          type="button"
                          title="Enviar WhatsApp"
                        >
                          {enviados.has(inv.token) ? "✓" : "WA"}
                        </button>
                      )}
                      <button
                        className="btn-action btn-eliminar"
                        onClick={() => setConfirmEliminar(confirmEliminar === inv.id ? null : (inv.id ?? null))}
                        type="button"
                        title="Eliminar invitado"
                        disabled={eliminando === inv.id}
                      >
                        {eliminando === inv.id ? "..." : "🗑"}
                      </button>
                    </div>
                  </div>
                  {/* Confirmación de eliminar */}
                  {confirmEliminar === inv.id && (
                    <div className="confirm-eliminar">
                      <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, flex: 1 }}>
                        ¿Eliminar a {inv.nombre}? Esta acción no se puede deshacer.
                      </span>
                      <button
                        className="btn-action btn-eliminar"
                        onClick={() => handleEliminar(inv)}
                        disabled={eliminando === inv.id}
                        type="button"
                        style={{ padding: "5px 12px" }}
                      >
                        Eliminar
                      </button>
                      <button
                        className="btn-action btn-copy-default"
                        onClick={() => setConfirmEliminar(null)}
                        type="button"
                        style={{ padding: "5px 12px" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Floating back button ── */}
        <div className="bottom-bar anim-bottom">
          <Link href="/dashboard" className="btn-back">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

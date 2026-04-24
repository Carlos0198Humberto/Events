"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import { exportarInvitadosExcel } from "@/app/utils/exportarInvitados";

function AppLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#6366F1" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E0E7FF" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
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
  const id = params.id as string;

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
  const [exportando, setExportando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const bulkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = "Eventix — Gestionar invitados";
    setTimeout(() => setMounted(true), 50);
    if (id) {
      supabase
        .from("eventos")
        .select("nombre, tipo, anfitriones, fecha_limite_confirmacion")
        .eq("id", id)
        .single()
        .then(({ data }) => { if (data) setEvento(data); });
      cargarTodosInvitados();
    }
    return () => {
      if (bulkTimerRef.current) clearTimeout(bulkTimerRef.current);
    };
  }, [id]);

  async function cargarTodosInvitados() {
    setLoadingInvitados(true);
    const { data } = await supabase
      .from("invitados")
      .select("id, nombre, token, telefono, num_personas, cupo_elije_invitado, estado")
      .eq("evento_id", id)
      .order("created_at", { ascending: true });
    if (data) setTodosInvitados(data);
    setLoadingInvitados(false);
  }

  async function handleExportarExcel() {
    if (exportando || todosInvitados.length === 0) return;
    setExportando(true);
    try {
      const { data } = await supabase
        .from("invitados")
        .select("nombre, telefono, num_personas, estado, numero_confirmacion, mesa_id")
        .eq("evento_id", id)
        .order("estado", { ascending: true });
      const { data: mesas } = await supabase
        .from("mesas")
        .select("id, nombre")
        .eq("evento_id", id);
      const mesaMap: Record<string, string> = {};
      (mesas || []).forEach((m) => { mesaMap[m.id] = m.nombre; });
      const invData = (data || []).map((inv) => ({
        ...inv,
        mesa_nombre: inv.mesa_id ? (mesaMap[inv.mesa_id] ?? null) : null,
      }));
      await exportarInvitadosExcel(invData, evento?.nombre ?? "Evento");
    } finally {
      setExportando(false);
    }
  }

  async function handleEliminar(inv: Invitado) {
    if (!inv.id) return;
    setEliminando(inv.id);
    const { error } = await supabase.from("invitados").delete().eq("id", inv.id);
    if (!error) {
      setTodosInvitados((prev) => prev.filter((i) => i.id !== inv.id));
      setAgregados((prev) => prev.filter((i) => i.token !== inv.token));
    }
    setEliminando(null);
    setConfirmEliminar(null);
  }

  function buildLink(token: string) {
    return `${window.location.origin}/confirmar/${token}`;
  }

  function buildWhatsAppUrl(inv: Invitado) {
    const link = buildLink(inv.token);
    let fechaTexto = "";
    if (evento?.fecha_limite_confirmacion) {
      const d = new Date(evento.fecha_limite_confirmacion);
      fechaTexto = d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    }
    const tipoLabel = evento ? (TIPO_LABEL[evento.tipo] || "evento especial") : "evento especial";
    const anfitriones = evento?.anfitriones ?? "";
    const mensajeBase = evento
      ? `Hola ${inv.nombre}, te saluda ${anfitriones}, con relación a nuestra ${tipoLabel}, te invitamos a confirmar${fechaTexto ? ` antes del ${fechaTexto}` : ""}:\n${link}`
      : `Hola ${inv.nombre}, estás invitado a nuestro evento. Confirma tu asistencia aquí:\n${link}`;
    const msg = encodeURIComponent(mensajeBase);
    const rawPhone = inv.telefono ?? "";
    const phone = rawPhone.replace(/[^\d+]/g, "").replace(/(?!^\+)\+/g, "");
    return phone
      ? `https://wa.me/${phone.replace("+", "")}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  }

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
        evento_id: id,
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

  function enviarATodos() {
    setShowBulkConfirm(false);
    const conTelefono = agregados.filter((inv) => inv.telefono);
    if (conTelefono.length === 0) return;
    setEnviandoTodos(true);
    let i = 0;
    const abrir = () => {
      if (i >= conTelefono.length) { setEnviandoTodos(false); return; }
      const inv = conTelefono[i];
      window.open(buildWhatsAppUrl(inv), "_blank");
      setEnviados((prev) => new Set(prev).add(inv.token));
      i++;
      bulkTimerRef.current = setTimeout(abrir, 1400);
    };
    abrir();
  }

  const conTelefono = agregados.filter((inv) => inv.telefono);
  const sinTelefono = agregados.filter((inv) => !inv.telefono);

  const invitadosFiltrados = busqueda.trim()
    ? todosInvitados.filter((inv) =>
        inv.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : todosInvitados;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #FAFBFF;
          --surface:      #FFFFFF;
          --surface2:     #F4F5FB;
          --border:       rgba(79,70,229,0.16);
          --border-hover: rgba(79,70,229,0.50);
          --border-input: rgba(79,70,229,0.28);
          --accent:       #4F46E5;
          --accent2:      #3730A3;
          --accent-soft:  rgba(79,70,229,0.08);
          --accent-soft2: rgba(79,70,229,0.16);
          --text:         #0F172A;
          --text2:        #475569;
          --text3:        #3730A3;
          --shadow:       0 4px 28px rgba(15,23,42,0.10);
          --shadow-sm:    0 2px 10px rgba(15,23,42,0.07);
          --shadow-btn:   0 6px 28px rgba(79,70,229,0.38);
          --wa-green:     #25D366;
          --wa-dark:      #128C7E;
          --transition:   all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          width: 100%;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 320px; height: 320px; top: -80px; right: -60px; background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 260px; height: 260px; bottom: 80px; left: -80px; background: radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        @keyframes glowDrift1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-18px,28px)} 66%{transform:translate(14px,-18px)} }
        @keyframes glowDrift2 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(22px,-30px)} 70%{transform:translate(-8px,18px)} }

        /* ── Page ── */
        .page-wrap {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          position: relative;
        }

        /* ── Top bar ── */
        .top-bar {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          padding: 13px 18px;
          padding-top: calc(13px + env(safe-area-inset-top, 0px));
          display: flex;
          align-items: center;
          gap: 11px;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: var(--shadow-sm);
        }
        .top-bar-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--text); letter-spacing: -0.5px; line-height: 1; }
        .top-bar-name span { color: var(--accent); }
        .top-bar-sub { font-size: 10.5px; font-weight: 500; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); margin-top: 2px; }

        /* ── Quick nav tabs ── */
        .quick-nav {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 0 12px;
          position: sticky;
          top: calc(62px + env(safe-area-inset-top, 0px));
          z-index: 19;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          display: flex;
          gap: 2px;
        }
        .quick-nav::-webkit-scrollbar { display: none; }
        .qn-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 9px 14px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.4px;
          color: var(--text2);
          text-decoration: none;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color .2s, border-color .2s;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
        }
        .qn-link:hover { color: var(--accent); }
        .qn-link.active { color: var(--accent); border-bottom-color: var(--accent); }
        .qn-link svg { opacity: 0.75; }
        .qn-link.active svg { opacity: 1; }
        .qn-back {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 9px 12px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text3);
          text-decoration: none;
          white-space: nowrap;
          border-right: 1px solid var(--border);
          margin-right: 6px;
          transition: color .2s;
          flex-shrink: 0;
          font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .qn-back:hover { color: var(--accent); }

        /* ── Scroll area ── */
        .scroll-area {
          padding: 20px 16px;
          padding-bottom: calc(32px + env(safe-area-inset-bottom, 16px));
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* ── Cards ── */
        .card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 22px; padding: 22px 20px; box-shadow: var(--shadow); }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 21px; font-weight: 600; color: var(--text); margin-bottom: 3px; letter-spacing: -0.3px; }
        .card-sub { font-size: 12.5px; color: var(--text3); margin-bottom: 20px; font-weight: 500; }
        .section-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 22px; padding: 20px 18px; box-shadow: var(--shadow); }

        /* ── Error box ── */
        .error-box { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 13px; padding: 10px 14px; border-radius: 12px; margin-bottom: 16px; font-weight: 500; }

        /* ── Fields ── */
        .fields { display: flex; flex-direction: column; gap: 15px; }
        .field-label { font-size: 11px; font-weight: 600; color: var(--accent); display: block; margin-bottom: 7px; letter-spacing: 0.6px; text-transform: uppercase; }
        .field-input {
          width: 100%; border: 2px solid var(--border-input); border-radius: 14px;
          padding: 13px 15px; font-size: 15px;
          background: var(--accent-soft); color: var(--text);
          outline: none; transition: border-color .22s, box-shadow .22s, background .22s;
          font-family: 'DM Sans', sans-serif; -webkit-appearance: none;
          touch-action: manipulation;
        }
        .field-input::placeholder { color: var(--text3); }
        .field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,70,229,0.11); background: var(--surface); }

        /* ── Toggle switch ── */
        .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--accent-soft); border-radius: 14px; border: 1px solid var(--border-input); }
        .toggle-label { font-size: 13px; font-weight: 500; color: var(--text); }
        .toggle-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }
        .toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-thumb { position: absolute; inset: 0; background: #CBD5E1; border-radius: 999px; cursor: pointer; transition: background .2s; }
        .toggle-thumb::after { content: ''; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
        input:checked + .toggle-thumb { background: var(--accent); }
        input:checked + .toggle-thumb::after { transform: translateX(20px); }

        /* ── Submit button ── */
        .btn-submit { width: 100%; padding: 15px; border-radius: 14px; border: none; background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%); color: #fff; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px; cursor: pointer; margin-top: 4px; box-shadow: var(--shadow-btn); transition: transform .2s ease, box-shadow .2s ease, opacity .2s; position: relative; overflow: hidden; -webkit-tap-highlight-color: transparent; touch-action: manipulation; min-height: 50px; }
        .btn-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%); pointer-events: none; border-radius: inherit; }
        .btn-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 34px rgba(79,70,229,0.50); }
        .btn-submit:not(:disabled):active { transform: scale(0.97); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Search box ── */
        .search-wrap { position: relative; margin-bottom: 14px; }
        .search-input {
          width: 100%; border: 1.5px solid var(--border-input); border-radius: 14px;
          padding: 11px 14px 11px 38px; font-size: 14px;
          background: var(--surface2); color: var(--text);
          outline: none; transition: border-color .22s, box-shadow .22s;
          font-family: 'DM Sans', sans-serif; -webkit-appearance: none;
          touch-action: manipulation;
        }
        .search-input::placeholder { color: var(--text3); }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,70,229,0.11); background: var(--surface); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }

        /* ── Section header ── */
        .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .section-head-title { font-size: 13px; font-weight: 700; color: var(--accent2); text-transform: uppercase; letter-spacing: .6px; display: flex; align-items: center; gap: 6px; }
        .list-badge { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: white; border-radius: 99px; font-size: 11px; font-weight: 700; padding: 2px 9px; }

        /* ── Bulk button ── */
        .btn-bulk { width: 100%; padding: 13px 16px; border-radius: 14px; border: none; background: linear-gradient(135deg, var(--wa-green) 0%, var(--wa-dark) 100%); color: #fff; font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; margin-bottom: 14px; box-shadow: 0 6px 24px rgba(37,211,102,0.38); transition: transform .2s, box-shadow .2s, opacity .2s; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 8px; -webkit-tap-highlight-color: transparent; }
        .btn-bulk:not(:disabled):hover { transform: translateY(-2px); }
        .btn-bulk:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-bulk-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.18) 50%,transparent 62%); background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }

        /* ── Inv row ── */
        .inv-row { display: flex; align-items: center; gap: 10px; padding: 11px 12px; background: var(--surface2); border-radius: 14px; border: 1px solid var(--border); margin-bottom: 8px; }
        .inv-row:last-child { margin-bottom: 0; }
        .inv-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 15px; flex-shrink: 0; }
        .inv-info { flex: 1; min-width: 0; }
        .inv-name { font-size: 14px; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .inv-phone { font-size: 11px; color: var(--text3); margin-top: 1px; font-weight: 500; }
        .inv-no-phone { font-size: 11px; color: #fbbf24; margin-top: 1px; font-weight: 500; }
        .inv-actions { display: flex; gap: 6px; flex-shrink: 0; }

        .btn-action { font-size: 11.5px; font-weight: 700; border-radius: 10px; padding: 6px 10px; cursor: pointer; transition: all .2s; font-family: 'DM Sans', sans-serif; -webkit-tap-highlight-color: transparent; white-space: nowrap; border: 1.5px solid; }
        .btn-copy-default { color: var(--accent); background: var(--surface); border-color: var(--border-input); }
        .btn-copy-done    { color: #16a34a; background: #f0fdf4; border-color: #86efac; }
        .btn-wa           { color: white; background: var(--wa-green); border-color: var(--wa-dark); }
        .btn-wa-done      { color: white; background: #16a34a; border-color: #15803d; }
        .btn-eliminar     { color: #dc2626; background: #fef2f2; border-color: #fecaca; }
        .btn-eliminar:hover { background: #fee2e2; }
        .btn-eliminar:disabled { opacity: .5; cursor: wait; }

        .estado-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
        .estado-confirmado { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
        .estado-pendiente  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
        .estado-rechazado  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

        .confirm-eliminar { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }

        /* ── Empty state ── */
        .empty-state { text-align: center; padding: 24px 0; color: var(--text3); font-size: 13px; }

        /* ── Overlay confirm ── */
        .overlay { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .confirm-card { background: var(--surface); border-radius: 24px; padding: 28px 24px; max-width: 340px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.22); border: 1.5px solid var(--border); text-align: center; }
        .confirm-icon { font-size: 36px; margin-bottom: 14px; }
        .confirm-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
        .confirm-body { font-size: 13.5px; color: var(--text2); line-height: 1.55; margin-bottom: 22px; }
        .confirm-actions { display: flex; gap: 10px; }
        .btn-cancel { flex: 1; padding: 13px; border-radius: 12px; border: 1.5px solid var(--border-input); background: var(--surface); color: var(--text2); font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-confirm { flex: 1; padding: 13px; border-radius: 12px; border: none; background: linear-gradient(135deg, var(--wa-green), var(--wa-dark)); color: white; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(37,211,102,0.35); }

        /* ── Animations ── */
        .anim-header { opacity: 0; transform: translateY(-10px); }
        .anim-card   { opacity: 0; transform: translateY(20px); }
        .anim-list   { opacity: 0; transform: translateY(14px); }
        .mounted .anim-header { animation: mountUp .5s cubic-bezier(.22,1,.36,1) .05s both; }
        .mounted .anim-card   { animation: mountUp .6s cubic-bezier(.22,1,.36,1) .15s both; }
        .mounted .anim-list   { animation: mountUp .5s cubic-bezier(.22,1,.36,1) .28s both; }
        @keyframes mountUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        .pulsing { animation: pulse 1.2s ease-in-out infinite; }

        /* ── Responsive ── */
        @media (max-width: 420px) {
          .top-bar { padding: 11px 14px; gap: 9px; }
          .top-bar-name { font-size: 20px; }
          .scroll-area { padding: 16px 12px; }
          .card, .section-card { padding: 18px 15px; border-radius: 18px; }
          .card-title { font-size: 19px; }
          .field-input { padding: 12px 13px; font-size: 14.5px; }
          .btn-submit { padding: 14px; font-size: 14.5px; }
          .inv-row { padding: 10px; gap: 8px; }
          .inv-avatar { width: 32px; height: 32px; font-size: 13px; }
          .inv-actions { flex-wrap: wrap; gap: 5px; justify-content: flex-end; }
          .btn-action { font-size: 11px; padding: 5px 8px; }
          .qn-link { padding: 8px 11px; font-size: 10px; }
        }
        @media (max-width: 340px) {
          .inv-actions { flex-direction: column; align-items: stretch; }
          .btn-action { width: 100%; text-align: center; }
        }
      `}</style>

      {/* Confirm bulk overlay */}
      {showBulkConfirm && (
        <div className="overlay">
          <div className="confirm-card">
            <div className="confirm-icon">📲</div>
            <div className="confirm-title">Enviar a todos</div>
            <div className="confirm-body">
              Se abrirá WhatsApp para{" "}
              <strong>{conTelefono.length} invitado{conTelefono.length !== 1 ? "s" : ""}</strong>{" "}
              con número registrado.
              {sinTelefono.length > 0 && (
                <> Los otros <strong>{sinTelefono.length}</strong> sin número serán omitidos.</>
              )}
            </div>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowBulkConfirm(false)}>Cancelar</button>
              <button className="btn-confirm" onClick={enviarATodos}>Enviar ahora</button>
            </div>
          </div>
        </div>
      )}

      <div className={`page-wrap${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        {/* ── Top bar ── */}
        <div className="top-bar anim-header">
          <AppLogo size={34} />
          <div>
            <div className="top-bar-name">Event<span>ix</span></div>
            <div className="top-bar-sub">
              {evento?.nombre ? evento.nombre : "Gestionar invitados"}
            </div>
          </div>
        </div>

        {/* ── Quick nav ── */}
        <nav className="quick-nav anim-header">
          <Link href="/dashboard" className="qn-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Dashboard
          </Link>
          <Link href={`/eventos/${id}/invitados`} className="qn-link active">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Invitados
          </Link>
          <Link href={`/muro/${id}`} className="qn-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Muro
          </Link>
          <Link href={`/eventos/${id}/mesas`} className="qn-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Mesas
          </Link>
          <Link href={`/libro/${id}`} className="qn-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            Libro
          </Link>
          <Link href={`/eventos/${id}/scanner`} className="qn-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9V6a2 2 0 012-2h3M15 4h3a2 2 0 012 2v3M21 15v3a2 2 0 01-2 2h-3M9 20H6a2 2 0 01-2-2v-3M7 12h10"/></svg>
            Escáner
          </Link>
          <Link href={`/eventos/${id}/configurar`} className="qn-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Config
          </Link>
        </nav>

        {/* ── Content ── */}
        <div className="scroll-area">

          {/* ── Agregar invitado ── */}
          <div className="card anim-card">
            <div className="card-title">Agregar invitado</div>
            <div className="card-sub">Completá los datos y compartí el link de confirmación</div>

            {error && <div className="error-box">{error}</div>}

            <div className="fields">
              <div>
                <label className="field-label">Nombre *</label>
                <input
                  className="field-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: María García"
                  autoComplete="off"
                  onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
                />
              </div>

              <div>
                <label className="field-label">Teléfono (WhatsApp)</label>
                <input
                  className="field-input"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  autoComplete="off"
                  inputMode="tel"
                  onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
                />
              </div>

              {!cupoElijeInvitado && (
                <div>
                  <label className="field-label">Cantidad de lugares</label>
                  <input
                    className="field-input"
                    type="number"
                    min="1"
                    max="20"
                    value={numPersonas}
                    onChange={(e) => setNumPersonas(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              )}

              <div className="toggle-row">
                <div>
                  <div className="toggle-label">El invitado elige cuántos van</div>
                  <div className="toggle-sub">No se asigna un cupo fijo</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={cupoElijeInvitado}
                    onChange={(e) => setCupoElijeInvitado(e.target.checked)}
                  />
                  <span className="toggle-thumb" />
                </label>
              </div>

              <button
                className="btn-submit"
                onClick={handleAgregar}
                disabled={loading || !nombre.trim()}
                type="button"
              >
                <span className="btn-shimmer" />
                {loading ? "Agregando..." : "Agregar invitado"}
              </button>
            </div>
          </div>

          {/* ── Recién agregados (esta sesión) ── */}
          {agregados.length > 0 && (
            <div className="section-card anim-list">
              <div className="section-head">
                <div className="section-head-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  Recién agregados
                  <span className="list-badge">{agregados.length}</span>
                </div>
              </div>

              {conTelefono.length > 0 && (
                <button
                  className={`btn-bulk${enviandoTodos ? " pulsing" : ""}`}
                  onClick={() => setShowBulkConfirm(true)}
                  disabled={enviandoTodos}
                  type="button"
                >
                  <span className="btn-bulk-shimmer" />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.946 0C5.344 0 0 5.268 0 11.772c0 2.077.556 4.027 1.526 5.716L.057 24l6.727-1.712a11.98 11.98 0 005.162 1.168h.005C18.549 23.456 24 18.188 24 11.684 24 5.268 18.549 0 11.946 0z"/></svg>
                  {enviandoTodos ? "Enviando..." : `Enviar WhatsApp a todos (${conTelefono.length})`}
                </button>
              )}

              {agregados.map((inv) => (
                <div key={inv.id ?? inv.token} style={{ marginBottom: 8 }}>
                  <div className="inv-row" style={{ marginBottom: 0 }}>
                    <div className="inv-avatar">
                      {inv.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="inv-info">
                      <div className="inv-name">{inv.nombre}</div>
                      {inv.telefono
                        ? <div className="inv-phone">📱 {inv.telefono}</div>
                        : <div className="inv-no-phone">Sin número</div>
                      }
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
                        >
                          {enviados.has(inv.token) ? "✓" : "WA"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Gestionar todos ── */}
          <div className="section-card anim-list">
            <div className="section-head">
              <div className="section-head-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                Todos los invitados
                <span className="list-badge">{todosInvitados.length}</span>
              </div>
              {todosInvitados.length > 0 && (
                <button
                  onClick={handleExportarExcel}
                  disabled={exportando}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(79,70,229,0.10)",
                    border: "1px solid rgba(79,70,229,0.30)", borderRadius: 10,
                    padding: "6px 12px", fontSize: 11, fontWeight: 700,
                    color: "var(--accent2)", cursor: exportando ? "wait" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {exportando ? "..." : "Excel"}
                </button>
              )}
            </div>

            {/* Search */}
            {todosInvitados.length > 0 && (
              <div className="search-wrap">
                <span className="search-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  className="search-input"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre..."
                  autoComplete="off"
                />
              </div>
            )}

            {loadingInvitados ? (
              <div className="empty-state">Cargando invitados...</div>
            ) : todosInvitados.length === 0 ? (
              <div className="empty-state">Aún no hay invitados. Agrégalos arriba.</div>
            ) : invitadosFiltrados.length === 0 ? (
              <div className="empty-state">Sin resultados para "{busqueda}"</div>
            ) : (
              invitadosFiltrados.map((inv) => (
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <div className="inv-name">{inv.nombre}</div>
                        {inv.estado && (
                          <span className={`estado-badge ${
                            inv.estado === "confirmado" ? "estado-confirmado"
                            : inv.estado === "rechazado" ? "estado-rechazado"
                            : "estado-pendiente"
                          }`}>
                            {inv.estado === "confirmado" ? "✓ Conf."
                              : inv.estado === "rechazado" ? "✗ Rechazó"
                              : "Pendiente"}
                          </span>
                        )}
                      </div>
                      {inv.telefono
                        ? <div className="inv-phone">📱 {inv.telefono}</div>
                        : <div className="inv-no-phone">Sin número</div>
                      }
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
                        >
                          {enviados.has(inv.token) ? "✓" : "WA"}
                        </button>
                      )}
                      <button
                        className="btn-action btn-eliminar"
                        onClick={() => setConfirmEliminar(confirmEliminar === inv.id ? null : (inv.id ?? null))}
                        type="button"
                        disabled={eliminando === inv.id}
                      >
                        {eliminando === inv.id ? "..." : "🗑"}
                      </button>
                    </div>
                  </div>

                  {confirmEliminar === inv.id && (
                    <div className="confirm-eliminar">
                      <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, flex: 1 }}>
                        ¿Eliminar a {inv.nombre}?
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
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}

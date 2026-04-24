"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/app/components/Toast";

// ─── Types ─────────────────────────────────────────────────────────────────────
type UsuarioAdmin = {
  id: string;
  nombre: string | null;
  email: string | null;
  es_admin: boolean;
  bloqueado: boolean;
  evento_limit: number | null;
  created_at: string;
  total_eventos: number;
};

// ─── Logo ──────────────────────────────────────────────────────────────────────
function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#6366F1" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E0E7FF" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2l8 3v6c0 5-3.5 9.3-8 10.5C7.5 20.3 4 16 4 11V5l8-3z"/>
    </svg>
  ),
  check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  block: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>
    </svg>
  ),
  back: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
    </svg>
  ),
  refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  ),
  save: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"/>
    </svg>
  ),
  events: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M3 9h18M9 2v4M15 2v4"/>
    </svg>
  ),
  search: () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/>
    </svg>
  ),
  trash: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
    </svg>
  ),
  warn: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
    </svg>
  ),
};

// ─── Formato de fecha ───────────────────────────────────────────────────────────
function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [acceso, setAcceso] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [editLimite, setEditLimite] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<Record<string, boolean>>({});
  const [bloqueando, setBloqueando] = useState<Record<string, boolean>>({});
  const [eliminando, setEliminando] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<UsuarioAdmin | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "activos" | "bloqueados">("todos");

  const cargarUsuarios = useCallback(async () => {
    const { data, error } = await supabase
      .from("vista_admin_usuarios")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Error al cargar usuarios");
      return;
    }
    setUsuarios(data ?? []);
    const limites: Record<string, string> = {};
    (data ?? []).forEach((u: UsuarioAdmin) => {
      limites[u.id] = u.evento_limit !== null ? String(u.evento_limit) : "";
    });
    setEditLimite(limites);
  }, []);

  useEffect(() => {
    async function verificarAcceso() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("es_admin")
        .eq("id", authData.user.id)
        .single();

      if (!profile?.es_admin) {
        router.push("/dashboard");
        return;
      }

      setAcceso(true);
      await cargarUsuarios();
      setCargando(false);
    }
    verificarAcceso();
  }, [router, cargarUsuarios]);

  async function toggleBloqueado(usuario: UsuarioAdmin) {
    if (usuario.es_admin) {
      toast.warning("No puedes bloquear al super administrador");
      return;
    }
    setBloqueando((prev) => ({ ...prev, [usuario.id]: true }));
    const nuevoBloqueado = !usuario.bloqueado;
    const { error } = await supabase
      .from("profiles")
      .update({ bloqueado: nuevoBloqueado })
      .eq("id", usuario.id);
    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success(
        nuevoBloqueado
          ? `${usuario.nombre ?? "Usuario"} bloqueado`
          : `${usuario.nombre ?? "Usuario"} desbloqueado`
      );
      setUsuarios((prev) =>
        prev.map((u) => u.id === usuario.id ? { ...u, bloqueado: nuevoBloqueado } : u)
      );
    }
    setBloqueando((prev) => ({ ...prev, [usuario.id]: false }));
  }

  async function eliminarCuenta(usuario: UsuarioAdmin) {
    setConfirmDelete(null);
    setEliminando((prev) => ({ ...prev, [usuario.id]: true }));
    // Eliminar perfil — el CASCADE elimina eventos e invitados relacionados
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", usuario.id);
    if (error) {
      toast.error("Error al eliminar la cuenta");
      setEliminando((prev) => ({ ...prev, [usuario.id]: false }));
      return;
    }
    toast.success(`Cuenta de ${usuario.nombre ?? usuario.email ?? "usuario"} eliminada`);
    setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
    setEliminando((prev) => ({ ...prev, [usuario.id]: false }));
  }

  async function guardarLimite(usuario: UsuarioAdmin) {
    setGuardando((prev) => ({ ...prev, [usuario.id]: true }));
    const raw = editLimite[usuario.id];
    const limite = raw === "" ? null : parseInt(raw, 10);
    if (raw !== "" && (isNaN(limite!) || limite! < 0)) {
      toast.error("Límite inválido — usa un número positivo o déjalo vacío para sin límite");
      setGuardando((prev) => ({ ...prev, [usuario.id]: false }));
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ evento_limit: limite })
      .eq("id", usuario.id);
    if (error) {
      toast.error("Error al guardar límite");
    } else {
      toast.success("Límite actualizado");
      setUsuarios((prev) =>
        prev.map((u) => u.id === usuario.id ? { ...u, evento_limit: limite } : u)
      );
    }
    setGuardando((prev) => ({ ...prev, [usuario.id]: false }));
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    const coincide =
      !q ||
      (u.nombre ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q);
    const estadoOk =
      filtro === "todos" ||
      (filtro === "bloqueados" && u.bloqueado) ||
      (filtro === "activos" && !u.bloqueado);
    return coincide && estadoOk;
  });

  const totalUsuarios = usuarios.length;
  const totalBloqueados = usuarios.filter((u) => u.bloqueado).length;
  const totalEventos = usuarios.reduce((s, u) => s + (u.total_eventos ?? 0), 0);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <>
        <style>{`
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html,body{background:#FAFBFF;font-family:'DM Sans',sans-serif}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", background: "#FAFBFF",
        }}>
          <div style={{ textAlign: "center", opacity: 0.7 }}>
            <div style={{
              width: 34, height: 34,
              border: "2.5px solid rgba(79, 70, 229,0.2)",
              borderTop: "2.5px solid #4F46E5",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }} />
            <p style={{ fontFamily: "sans-serif", fontSize: 13, color: "#3730A3" }}>
              Verificando acceso...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!acceso) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        :root{
          --bg:#FAFBFF;--surface:#FFFFFF;--surface2:#F4F5FB;
          --border:rgba(79, 70, 229,0.16);--border-mid:rgba(79, 70, 229,0.28);
          --accent:#4F46E5;--accent2:#3730A3;
          --accent-soft:rgba(79, 70, 229,0.08);--accent-soft2:rgba(79, 70, 229,0.16);
          --ink:#0F172A;--ink2:#475569;--ink3:#3730A3;
          --danger:#DC2626;--danger-bg:#FEF2F2;--danger-border:rgba(220,38,38,0.25);
          --success:#059669;--success-bg:rgba(5,150,105,0.08);--success-border:rgba(5,150,105,0.25);
          --warn:#D97706;--warn-bg:rgba(217,119,6,0.08);--warn-border:rgba(217,119,6,0.25);
          --shadow:0 2px 16px rgba(15,23,42,0.09),0 1px 4px rgba(15,23,42,0.06);
          --radius:18px;--radius-sm:12px;
        }

        html,body{
          font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);
          -webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:hidden;
        }

        .page{min-height:100vh;background:var(--bg)}

        /* Nav */
        .nav{
          position:sticky;top:0;z-index:30;height:58px;
          padding:0 16px;
          display:flex;align-items:center;justify-content:space-between;gap:10px;
          background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
        }
        .nav-left{display:flex;align-items:center;gap:10px}
        .nav-logo{display:flex;align-items:center;gap:8px;text-decoration:none}
        .nav-logo-text{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:var(--ink);letter-spacing:.02em}
        .nav-badge{background:rgba(220,38,38,0.1);color:var(--danger);border:1px solid var(--danger-border);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
        .btn-back{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;border:1px solid var(--border-mid);background:var(--surface);color:var(--ink2);font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;transition:all .2s}
        .btn-back:hover{background:var(--accent-soft2);border-color:var(--accent)}

        /* Container */
        .container{max-width:860px;margin:0 auto;padding:24px 16px 60px}

        /* Page header */
        .page-header{margin-bottom:22px}
        .page-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:var(--ink);margin-bottom:3px}
        .page-subtitle{font-size:13px;color:var(--ink3)}

        /* Stats */
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}
        .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;box-shadow:var(--shadow)}
        .stat-value{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:var(--ink);line-height:1}
        .stat-label{font-size:10px;color:var(--ink3);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:.07em}

        /* Toolbar */
        .toolbar{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
        .search-wrap{flex:1;min-width:180px;position:relative}
        .search-input{width:100%;padding:9px 12px 9px 36px;border:1px solid var(--border-mid);border-radius:10px;background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink);outline:none;transition:border-color .2s}
        .search-input:focus{border-color:var(--accent)}
        .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--ink3);pointer-events:none}
        .filter-tabs{display:flex;gap:3px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:3px}
        .filter-tab{padding:5px 11px;border-radius:7px;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--ink3);cursor:pointer;transition:all .2s}
        .filter-tab.active{background:var(--surface);color:var(--ink);box-shadow:0 1px 4px rgba(15,23,42,0.10)}
        .btn-refresh{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;border:1px solid var(--border-mid);background:var(--surface);color:var(--ink2);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap}
        .btn-refresh:hover{border-color:var(--accent);background:var(--accent-soft)}

        /* Table */
        .table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden}

        /* User row */
        .user-row{padding:14px 16px;border-bottom:1px solid var(--border);transition:background .15s;display:flex;flex-direction:column;gap:12px}
        .user-row:last-child{border-bottom:none}
        .user-row:hover{background:rgba(79, 70, 229,0.04)}

        .user-row-top{display:flex;align-items:center;gap:12px}
        .user-avatar{width:38px;height:38px;border-radius:50%;background:var(--accent-soft2);border:1px solid var(--border-mid);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--accent2);flex-shrink:0}
        .user-info{flex:1;min-width:0}
        .user-nombre{font-size:14px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .user-email{font-size:11px;color:var(--ink3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .badge-admin{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:6px;background:rgba(79, 70, 229,0.12);color:var(--accent2);border:1px solid rgba(79, 70, 229,0.3);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
        .estado-bloqueado{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger-border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;flex-shrink:0}
        .estado-activo{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:var(--success-bg);color:var(--success);border:1px solid var(--success-border);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;flex-shrink:0}

        /* User row bottom */
        .user-row-bottom{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .eventos-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;background:var(--accent-soft);border:1px solid var(--border);font-size:12px;color:var(--ink2);font-weight:500}
        .eventos-badge b{font-weight:700;color:var(--ink)}
        .badge-fecha{font-size:11px;color:var(--ink3)}

        /* Limit control */
        .limit-wrap{display:inline-flex;align-items:center;gap:6px}
        .limit-label{font-size:11px;color:var(--ink3);white-space:nowrap}
        .limit-input{width:58px;padding:5px 8px;border:1px solid var(--border-mid);border-radius:8px;background:var(--surface);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:var(--ink);text-align:center;outline:none;transition:border-color .2s}
        .limit-input:focus{border-color:var(--accent)}
        .btn-save{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;border:1px solid var(--border-mid);background:var(--surface);color:var(--ink2);font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
        .btn-save:hover:not(:disabled){background:var(--accent-soft2);border-color:var(--accent);color:var(--accent2)}
        .btn-save:disabled{opacity:0.5;cursor:not-allowed}

        /* Block button */
        .btn-block{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:8px;border:none;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;margin-left:auto}
        .btn-block-danger{background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger-border)}
        .btn-block-danger:hover:not(:disabled){background:#fee2e2}
        .btn-block-ok{background:var(--success-bg);color:var(--success);border:1px solid var(--success-border)}
        .btn-block-ok:hover:not(:disabled){background:rgba(5,150,105,0.14)}
        .btn-block:disabled{opacity:0.5;cursor:not-allowed}

        /* Delete button */
        .btn-delete{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:8px;border:1px solid var(--danger-border);background:var(--danger-bg);color:var(--danger);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
        .btn-delete:hover:not(:disabled){background:#fee2e2;border-color:var(--danger)}
        .btn-delete:disabled{opacity:0.5;cursor:not-allowed}

        /* Confirm modal */
        .modal-backdrop{position:fixed;inset:0;background:rgba(20,13,4,0.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .modal{background:var(--surface);border-radius:20px;padding:28px 24px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(20,13,4,0.25);animation:fadeUp .25s ease both}
        .modal-icon{width:48px;height:48px;border-radius:50%;background:var(--danger-bg);border:1px solid var(--danger-border);display:flex;align-items:center;justify-content:center;color:var(--danger);margin:0 auto 16px}
        .modal-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--ink);text-align:center;margin-bottom:8px}
        .modal-body{font-size:13px;color:var(--ink3);text-align:center;line-height:1.6;margin-bottom:24px}
        .modal-body b{color:var(--ink);font-weight:600}
        .modal-note{font-size:11px;color:var(--danger);opacity:.8;text-align:center;margin-top:-14px;margin-bottom:20px}
        .modal-actions{display:flex;gap:10px}
        .modal-btn-cancel{flex:1;padding:10px;border-radius:11px;border:1px solid var(--border-mid);background:var(--surface2);color:var(--ink2);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
        .modal-btn-cancel:hover{border-color:var(--accent);background:var(--accent-soft)}
        .modal-btn-delete{flex:1;padding:10px;border-radius:11px;border:none;background:var(--danger);color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
        .modal-btn-delete:hover{background:#b91c1c}

        /* Empty */
        .empty{padding:44px 20px;text-align:center;color:var(--ink3);font-size:14px}

        /* Footer */
        .footer{text-align:center;padding:32px 16px;font-size:11px;color:var(--ink3);opacity:.55}

        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .page-header{animation:fadeUp .3s ease both}
        .stats-row{animation:fadeUp .3s .05s ease both}
        .toolbar{animation:fadeUp .3s .1s ease both}
        .table-wrap{animation:fadeUp .3s .15s ease both}
      `}</style>

      <div className="page">
        {/* Nav */}
        <nav className="nav">
          <div className="nav-left">
            <Link href="/dashboard" className="nav-logo">
              <AppLogo size={30} />
              <span className="nav-logo-text">Eventix</span>
            </Link>
            <span className="nav-badge">Super Admin</span>
          </div>
          <Link href="/dashboard" className="btn-back">
            <Icon.back /> Dashboard
          </Link>
        </nav>

        <div className="container">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Panel de Administración</h1>
            <p className="page-subtitle">Gestiona cuentas, límites y acceso de todos los usuarios registrados</p>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{totalUsuarios}</div>
              <div className="stat-label">Usuarios</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalEventos}</div>
              <div className="stat-label">Eventos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: totalBloqueados > 0 ? "var(--danger)" : "inherit" }}>
                {totalBloqueados}
              </div>
              <div className="stat-label">Bloqueados</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon"><Icon.search /></span>
              <input
                className="search-input"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="filter-tabs">
              {(["todos", "activos", "bloqueados"] as const).map((f) => (
                <button
                  key={f}
                  className={`filter-tab ${filtro === f ? "active" : ""}`}
                  onClick={() => setFiltro(f)}
                >
                  {f === "todos" ? "Todos" : f === "activos" ? "Activos" : "Bloqueados"}
                </button>
              ))}
            </div>
            <button
              className="btn-refresh"
              onClick={async () => { await cargarUsuarios(); toast.info("Lista actualizada"); }}
            >
              <Icon.refresh /> Actualizar
            </button>
          </div>

          {/* User list */}
          <div className="table-wrap">
            {usuariosFiltrados.length === 0 ? (
              <div className="empty">
                {busqueda
                  ? `Sin resultados para "${busqueda}"`
                  : "No hay usuarios registrados"}
              </div>
            ) : (
              usuariosFiltrados.map((u) => (
                <div key={u.id} className="user-row">
                  {/* Top */}
                  <div className="user-row-top">
                    <div className="user-avatar">
                      {(u.nombre ?? u.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="user-nombre">
                        {u.nombre ?? "Sin nombre"}
                        {u.es_admin && (
                          <span className="badge-admin">
                            <Icon.shield /> Admin
                          </span>
                        )}
                      </div>
                      <div className="user-email">{u.email ?? "—"}</div>
                    </div>
                    {u.bloqueado ? (
                      <span className="estado-bloqueado"><Icon.block /> Bloqueado</span>
                    ) : (
                      <span className="estado-activo"><Icon.check /> Activo</span>
                    )}
                  </div>

                  {/* Bottom: controles */}
                  <div className="user-row-bottom">
                    {/* Eventos */}
                    <div className="eventos-badge">
                      <Icon.events />
                      <b>{u.total_eventos}</b>
                      <span style={{ color: "var(--ink3)" }}>
                        evento{u.total_eventos !== 1 ? "s" : ""}
                        {u.evento_limit !== null
                          ? ` · límite: ${u.evento_limit}`
                          : " · sin límite"}
                      </span>
                    </div>

                    {/* Fecha */}
                    <span className="badge-fecha">Registro: {formatFecha(u.created_at)}</span>

                    {/* Limit input — solo para no-admins */}
                    {!u.es_admin && (
                      <div className="limit-wrap">
                        <span className="limit-label">Límite:</span>
                        <input
                          className="limit-input"
                          type="number"
                          min="0"
                          max="999"
                          placeholder="∞"
                          value={editLimite[u.id] ?? ""}
                          onChange={(e) =>
                            setEditLimite((prev) => ({ ...prev, [u.id]: e.target.value }))
                          }
                        />
                        <button
                          className="btn-save"
                          disabled={!!guardando[u.id]}
                          onClick={() => guardarLimite(u)}
                        >
                          <Icon.save />
                          {guardando[u.id] ? "..." : "Guardar"}
                        </button>
                      </div>
                    )}

                    {/* Block toggle — solo para no-admins */}
                    {!u.es_admin && (
                      <button
                        className={`btn-block ${u.bloqueado ? "btn-block-ok" : "btn-block-danger"}`}
                        disabled={!!bloqueando[u.id]}
                        onClick={() => toggleBloqueado(u)}
                      >
                        {bloqueando[u.id] ? (
                          "..."
                        ) : u.bloqueado ? (
                          <><Icon.check /> Desbloquear</>
                        ) : (
                          <><Icon.block /> Bloquear</>
                        )}
                      </button>
                    )}

                    {/* Delete — solo para no-admins */}
                    {!u.es_admin && (
                      <button
                        className="btn-delete"
                        disabled={!!eliminando[u.id]}
                        onClick={() => setConfirmDelete(u)}
                      >
                        {eliminando[u.id] ? "..." : <><Icon.trash /> Eliminar</>}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="footer">Panel privado · Solo visible para administradores · Humb3rsec 2026</p>
        </div>
      </div>

      {/* ── Modal de confirmación de eliminación ── */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <Icon.warn />
            </div>
            <h2 className="modal-title">Eliminar cuenta</h2>
            <p className="modal-body">
              ¿Estás seguro de que quieres eliminar la cuenta de{" "}
              <b>{confirmDelete.nombre ?? confirmDelete.email ?? "este usuario"}</b>?
            </p>
            <p className="modal-note">
              Se eliminarán todos sus eventos, invitados y datos. Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                className="modal-btn-delete"
                onClick={() => eliminarCuenta(confirmDelete)}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

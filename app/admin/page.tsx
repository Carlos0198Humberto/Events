"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  id: string;
  nombre: string;
  email: string;
  bloqueado: boolean;
  es_admin: boolean;
  created_at: string;
  evento_limit: number | null; // null = sin límite (campo en profiles)
  total_eventos?: number;
}

// ─── Credenciales hardcodeadas del super-admin ───────────────────────────────
const ADMIN_NAME = "Admin";
const ADMIN_PASS = "L1br0$Mus!c@";

// ─── Logo ─────────────────────────────────────────────────────────────────────
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onHide }: { msg: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 2800);
    return () => clearTimeout(t);
  }, [msg, onHide]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        background: "#fff",
        border: "1px solid rgba(201,169,110,0.18)",
        borderRadius: 12,
        padding: "10px 18px",
        fontSize: 13,
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        color: "#1a0f04",
        animation: "toastIn .25s ease",
      }}
    >
      {msg}
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(12,26,25,0.42)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "24px 22px",
          maxWidth: 320,
          width: "100%",
          border: "1.5px solid rgba(201,169,110,0.18)",
          boxShadow: "0 12px 40px rgba(201,169,110,0.15)",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            fontSize: 15,
            marginBottom: 8,
            color: "#1a0f04",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#8B6914",
            marginBottom: 22,
            lineHeight: 1.5,
          }}
        >
          {body}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: "1.5px solid rgba(201,169,110,0.30)",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#8B6914",
              fontFamily: "inherit",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              border: "none",
              background: danger ? "#e11d48" : "#C9A96E",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      if (user.trim() === ADMIN_NAME && pass === ADMIN_PASS) {
        onLogin();
      } else {
        setError(true);
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF6F0",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          background: "#fff",
          border: "1.5px solid rgba(201,169,110,0.18)",
          borderRadius: 22,
          padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(26,15,4,0.10)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <AppLogo size={52} />
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#1a0f04",
              letterSpacing: -0.5,
            }}
          >
            Event<span style={{ color: "#C9A96E" }}>ix</span>
          </div>
          <div style={{ fontSize: 12, color: "#8B6914", marginTop: 3 }}>
            Panel de administrador
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 8,
              fontSize: 11,
              padding: "3px 12px",
              background: "rgba(201,169,110,0.09)",
              color: "#C9A96E",
              borderRadius: 100,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Acceso restringido
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#e11d48",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            Usuario o contraseña incorrectos
          </div>
        )}

        {/* Fields */}
        {[
          {
            label: "Usuario",
            value: user,
            set: setUser,
            type: "text",
            placeholder: "Admin",
            auto: "username",
          },
        ].map((f) => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#C9A96E",
                display: "block",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {f.label}
            </label>
            <input
              type={f.type}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              autoComplete={f.auto}
              style={{
                width: "100%",
                border: "2px solid rgba(201,169,110,0.30)",
                borderRadius: 13,
                padding: "12px 14px",
                fontSize: 15,
                background: "rgba(201,169,110,0.09)",
                color: "#1a0f04",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#C9A96E",
              display: "block",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            Contraseña
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                border: "2px solid rgba(201,169,110,0.30)",
                borderRadius: 13,
                padding: "12px 44px 12px 14px",
                fontSize: 15,
                background: "rgba(201,169,110,0.09)",
                color: "#1a0f04",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#8B6914",
                padding: 4,
              }}
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 13,
            border: "none",
            background: "linear-gradient(135deg,#C9A96E 0%,#8B6914 100%)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Verificando..." : "Ingresar al panel"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState<Profile | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<Profile | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Load profiles + event count ──────────────────────────────────────────
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profErr) throw profErr;

      // Fetch event count per user
      const { data: evts } = await supabase
        .from("eventos")
        .select("organizador_id");

      const countMap: Record<string, number> = {};
      (evts ?? []).forEach((e: { organizador_id: string }) => {
        countMap[e.organizador_id] = (countMap[e.organizador_id] ?? 0) + 1;
      });

      setProfiles(
        (profs ?? []).map((p: Profile) => ({
          ...p,
          total_eventos: countMap[p.id] ?? 0,
        })),
      );
    } catch (err) {
      console.error(err);
      showToast("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  function showToast(msg: string) {
    setToast(msg);
  }

  // ── Change event limit ────────────────────────────────────────────────────
  async function changeLimit(profile: Profile, val: string) {
    const newLimit = val === "unlimited" ? null : parseInt(val);
    setUpdatingId(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ evento_limit: newLimit })
      .eq("id", profile.id);

    if (error) {
      showToast("Error al actualizar límite");
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, evento_limit: newLimit } : p,
        ),
      );
      const label =
        newLimit === null ? "sin límite" : `máx. ${newLimit} eventos`;
      showToast(`${profile.nombre} — ${label}`);
    }
    setUpdatingId(null);
  }

  // ── Toggle block ──────────────────────────────────────────────────────────
  async function toggleBlock(profile: Profile) {
    const newVal = !profile.bloqueado;
    setUpdatingId(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ bloqueado: newVal })
      .eq("id", profile.id);

    if (error) {
      showToast("Error al actualizar estado");
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, bloqueado: newVal } : p,
        ),
      );
      showToast(`${profile.nombre} ${newVal ? "bloqueado" : "desbloqueado"}`);
    }
    setConfirmBlock(null);
    setUpdatingId(null);
  }

  // ── Delete user ───────────────────────────────────────────────────────────
  async function deleteUser(profile: Profile) {
    setUpdatingId(profile.id);
    // Delete from profiles (cascade removes auth user via FK if configured,
    // otherwise you need a Supabase Edge Function for auth.users deletion)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profile.id);

    if (error) {
      showToast("Error al eliminar usuario");
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      showToast(`Cuenta de ${profile.nombre} eliminada`);
    }
    setConfirmDel(null);
    setUpdatingId(null);
  }

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: profiles.length,
    unlimited: profiles.filter((p) => p.evento_limit === null).length,
    limited: profiles.filter((p) => p.evento_limit !== null).length,
    blocked: profiles.filter((p) => p.bloqueado).length,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  function initials(nombre: string) {
    return nombre
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const avatarColors = [
    "#C9A96E",
    "#8B6914",
    "#0369a1",
    "#7c3aed",
    "#be185d",
    "#d97706",
    "#16a34a",
  ];
  function avatarColor(id: string) {
    let n = 0;
    for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return avatarColors[n % avatarColors.length];
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF6F0",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        @keyframes toastIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .user-row:hover { background: rgba(201,169,110,0.03) !important; }
        select:focus { outline: 2px solid #C9A96E; outline-offset: 1px; }
        input:focus { outline: 2px solid #C9A96E; outline-offset: 1px; border-color: #C9A96E !important; }
        .btn-act { transition: opacity .15s, transform .15s; }
        .btn-act:hover:not(:disabled) { opacity: 0.82; transform: scale(0.97); }
        .btn-act:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      {/* ── Top bar ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1.5px solid rgba(201,169,110,0.18)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AppLogo size={36} />
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#1a0f04",
                letterSpacing: -0.3,
              }}
            >
              Panel de administrador
            </div>
            <div style={{ fontSize: 12, color: "#8B6914" }}>
              Eventix · Gestión de usuarios
            </div>
          </div>
        </div>
        <button
          className="btn-act"
          onClick={onLogout}
          style={{
            padding: "7px 16px",
            borderRadius: 10,
            border: "1.5px solid rgba(201,169,110,0.30)",
            background: "none",
            cursor: "pointer",
            fontSize: 13,
            color: "#8B6914",
            fontFamily: "inherit",
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* ── Stats ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Total usuarios", value: stats.total, color: "#C9A96E" },
            { label: "Sin límite", value: stats.unlimited, color: "#16a34a" },
            { label: "Con límite", value: stats.limited, color: "#d97706" },
            { label: "Bloqueados", value: stats.blocked, color: "#e11d48" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#fff",
                border: "1.5px solid rgba(201,169,110,0.18)",
                borderRadius: 16,
                padding: "16px 18px",
                boxShadow: "0 2px 10px rgba(201,169,110,0.06)",
              }}
            >
              <div style={{ fontSize: 12, color: "#8B6914", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.4,
            }}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="7" cy="7" r="5" stroke="#C9A96E" strokeWidth="1.5" />
            <path
              d="M11 11l3 3"
              stroke="#C9A96E"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            style={{
              width: "100%",
              padding: "11px 14px 11px 38px",
              border: "1.5px solid rgba(201,169,110,0.30)",
              borderRadius: 13,
              fontSize: 14,
              background: "#fff",
              color: "#1a0f04",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* ── Section label ── */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#8B6914",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Usuarios registrados ({filtered.length})
        </div>

        {/* ── User list ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "3px solid rgba(201,169,110,0.2)",
                borderTopColor: "#C9A96E",
                margin: "0 auto 12px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div style={{ fontSize: 13, color: "#8B6914" }}>
              Cargando usuarios…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              fontSize: 14,
              color: "#8B6914",
            }}
          >
            {search
              ? "No se encontraron usuarios con esa búsqueda"
              : "No hay usuarios registrados"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((profile) => {
              const isUpdating = updatingId === profile.id;
              const limitVal =
                profile.evento_limit === null
                  ? "unlimited"
                  : String(profile.evento_limit);

              return (
                <div
                  key={profile.id}
                  className="user-row"
                  style={{
                    background: profile.bloqueado
                      ? "rgba(225,29,72,0.03)"
                      : "#fff",
                    border: `1.5px solid ${profile.bloqueado ? "rgba(225,29,72,0.18)" : "rgba(201,169,110,0.18)"}`,
                    borderRadius: 16,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexWrap: "wrap",
                    transition: "background .2s",
                    opacity: isUpdating ? 0.6 : 1,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: avatarColor(profile.id),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {initials(profile.nombre)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1a0f04",
                        }}
                      >
                        {profile.nombre}
                      </span>
                      {profile.bloqueado && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: "rgba(225,29,72,0.1)",
                            color: "#e11d48",
                            fontWeight: 600,
                          }}
                        >
                          BLOQUEADO
                        </span>
                      )}
                      {profile.es_admin && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: "rgba(201,169,110,0.09)",
                            color: "#C9A96E",
                            fontWeight: 600,
                          }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#8B6914", marginTop: 2 }}
                    >
                      {profile.email}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#8B6914", marginTop: 2 }}
                    >
                      {profile.total_eventos ?? 0} evento
                      {profile.total_eventos !== 1 ? "s" : ""} creado
                      {profile.total_eventos !== 1 ? "s" : ""} · Registro:{" "}
                      {fmtDate(profile.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Limit badge */}
                    <span
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 100,
                        fontWeight: 600,
                        background:
                          profile.evento_limit === null
                            ? "rgba(22,163,74,0.1)"
                            : "rgba(217,119,6,0.1)",
                        color:
                          profile.evento_limit === null ? "#16a34a" : "#d97706",
                      }}
                    >
                      {profile.evento_limit === null
                        ? "Sin límite"
                        : `Máx. ${profile.evento_limit}`}
                    </span>

                    {/* Limit selector */}
                    <select
                      value={limitVal}
                      disabled={isUpdating}
                      onChange={(e) => changeLimit(profile, e.target.value)}
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        border: "1.5px solid rgba(201,169,110,0.30)",
                        borderRadius: 10,
                        background: "#FAF6F0",
                        color: "#1a0f04",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <option value="unlimited">Sin límite</option>
                      <option value="1">1 evento</option>
                      <option value="3">3 eventos</option>
                      <option value="5">5 eventos</option>
                      <option value="10">10 eventos</option>
                      <option value="20">20 eventos</option>
                      <option value="50">50 eventos</option>
                    </select>

                    {/* Block / Unblock */}
                    <button
                      className="btn-act"
                      disabled={isUpdating}
                      onClick={() => setConfirmBlock(profile)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: profile.bloqueado
                          ? "rgba(201,169,110,0.09)"
                          : "rgba(217,119,6,0.1)",
                        color: profile.bloqueado ? "#C9A96E" : "#d97706",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "inherit",
                      }}
                    >
                      {profile.bloqueado ? "Desbloquear" : "Bloquear"}
                    </button>

                    {/* Delete */}
                    <button
                      className="btn-act"
                      disabled={isUpdating}
                      onClick={() => setConfirmDel(profile)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: "rgba(225,29,72,0.08)",
                        color: "#e11d48",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "inherit",
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {confirmDel && (
        <ConfirmModal
          title={`Eliminar a ${confirmDel.nombre}`}
          body={`¿Seguro que quieres eliminar la cuenta de ${confirmDel.email}? Sus eventos y datos se perderán permanentemente.`}
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={() => deleteUser(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
      {confirmBlock && (
        <ConfirmModal
          title={
            confirmBlock.bloqueado
              ? `Desbloquear a ${confirmBlock.nombre}`
              : `Bloquear a ${confirmBlock.nombre}`
          }
          body={
            confirmBlock.bloqueado
              ? "El usuario podrá volver a acceder y crear eventos."
              : "El usuario no podrá iniciar sesión ni crear nuevos eventos."
          }
          confirmLabel={confirmBlock.bloqueado ? "Desbloquear" : "Bloquear"}
          onConfirm={() => toggleBlock(confirmBlock)}
          onCancel={() => setConfirmBlock(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast} onHide={() => setToast("")} />}
    </div>
  );
}

// ─── Root Component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  // Optional: redirect to /dashboard if already logged in as org user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      // You can optionally check if the session user is allowed here
      // For now, we just gate with the local password check
    });
  }, []);

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return <AdminPanel onLogout={() => setAuthed(false)} />;
}

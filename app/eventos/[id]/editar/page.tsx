"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/app/components/AppLogo";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  anfitriones: string;
  frase_evento?: string | null;
  mensaje_invitacion?: string | null;
  fecha?: string | null;
  hora?: string | null;
  lugar?: string | null;
  maps_url?: string | null;
  como_llegar?: string | null;
  cupo_personas?: number | null;
  fecha_limite_confirmacion?: string | null;
  musica_nombre?: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  quinceañera: "Quinceañera",
  boda: "Boda",
  graduacion: "Graduación",
  cumpleaños: "Cumpleaños",
  otro: "Evento especial",
};

// Normaliza una fecha que pueda venir como ISO completo o "YYYY-MM-DD"
// devolviéndola siempre como "YYYY-MM-DD" para usarla en <input type="date">.
function normalizarFecha(f?: string | null): string {
  if (!f) return "";
  return f.split("T")[0];
}

// Normaliza una hora que pueda venir como "HH:mm" o "HH:mm:ss"
function normalizarHora(h?: string | null): string {
  if (!h) return "";
  const partes = h.split(":");
  if (partes.length >= 2) return `${partes[0].padStart(2, "0")}:${partes[1].padStart(2, "0")}`;
  return h;
}

const IconoBack = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M13 4l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function EditarEvento() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  const [tipo, setTipo] = useState("otro");
  const [nombre, setNombre] = useState("");
  const [anfitriones, setAnfitriones] = useState("");
  const [frase, setFrase] = useState("");
  const [mensajeInvitacion, setMensajeInvitacion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [comoLlegar, setComoLlegar] = useState("");
  const [cupo, setCupo] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [musicaNombre, setMusicaNombre] = useState("");

  useEffect(() => {
    document.title = "Eventix — Editar evento";
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  async function cargar() {
    setLoading(true);
    const { data, error: errLoad } = await supabase
      .from("eventos")
      .select(
        "id, nombre, tipo, anfitriones, frase_evento, mensaje_invitacion, fecha, hora, lugar, maps_url, como_llegar, cupo_personas, fecha_limite_confirmacion, musica_nombre",
      )
      .eq("id", eventoId)
      .single<Evento>();

    if (errLoad || !data) {
      setError("No se pudo cargar el evento");
      setLoading(false);
      return;
    }
    setTipo(data.tipo ?? "otro");
    setNombre(data.nombre ?? "");
    setAnfitriones(data.anfitriones ?? "");
    setFrase(data.frase_evento ?? "");
    setMensajeInvitacion(data.mensaje_invitacion ?? "");
    setFecha(normalizarFecha(data.fecha));
    setHora(normalizarHora(data.hora));
    setLugar(data.lugar ?? "");
    setMapsUrl(data.maps_url ?? "");
    setComoLlegar(data.como_llegar ?? "");
    setCupo(data.cupo_personas != null ? String(data.cupo_personas) : "");
    setFechaLimite(normalizarFecha(data.fecha_limite_confirmacion));
    setMusicaNombre(data.musica_nombre ?? "");
    setLoading(false);
  }

  async function guardar() {
    setError("");

    if (!nombre.trim() || !fecha || !hora || !lugar.trim() || !anfitriones.trim()) {
      setError("Por favor completá todos los campos obligatorios (*)");
      return;
    }

    setGuardando(true);

    const { error: errUpdate } = await supabase
      .from("eventos")
      .update({
        nombre: nombre.trim(),
        anfitriones: anfitriones.trim(),
        frase_evento: frase.trim() || null,
        mensaje_invitacion: mensajeInvitacion.trim() || null,
        fecha,
        hora,
        lugar: lugar.trim(),
        maps_url: mapsUrl.trim() || null,
        como_llegar: comoLlegar.trim() || null,
        cupo_personas: cupo ? parseInt(cupo) : null,
        fecha_limite_confirmacion: fechaLimite || null,
        musica_nombre: musicaNombre.trim() || null,
      })
      .eq("id", eventoId);

    setGuardando(false);

    if (errUpdate) {
      setError("Error al guardar: " + errUpdate.message);
      return;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{font-family:'DM Sans',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;background:#FAFBFF}

        :root{
          --bg:#FAFBFF;--surface:#FFFFFF;--surface2:#F4F5FB;
          --border:rgba(79,70,229,0.16);--border-mid:rgba(79,70,229,0.28);
          --accent:#4F46E5;--accent2:#3730A3;--accent3:#5a3e1b;
          --accent-soft:rgba(79,70,229,0.08);--accent-soft2:rgba(79,70,229,0.16);
          --text:#0F172A;--text2:#475569;--text3:#3730A3;
          --danger:#dc2626;--danger-bg:#fef2f2;--danger-border:#fecaca;
          --success:#16a34a;--success-bg:#f0fdf4;--success-border:#86efac;
          --shadow:0 4px 24px rgba(15,23,42,0.10);--shadow-sm:0 2px 10px rgba(15,23,42,0.07);
          --nav-bg:rgba(255,255,255,0.92);--transition:all 0.35s cubic-bezier(.4,0,.2,1);
          --radius:18px;
        }

        .page{min-height:100vh;background:var(--bg);position:relative;overflow-x:hidden;padding-bottom:60px}
        .glow{position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(90px)}
        .glow-1{width:320px;height:320px;top:-100px;right:-80px;background:radial-gradient(circle,rgba(79,70,229,0.14) 0%,transparent 70%)}
        .glow-2{width:260px;height:260px;bottom:100px;left:-80px;background:radial-gradient(circle,rgba(94,234,212,0.09) 0%,transparent 70%)}

        .nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:30;min-height:56px;padding:10px 16px;
          display:flex;align-items:center;justify-content:space-between;
          background:var(--nav-bg);backdrop-filter:blur(18px);
          border-bottom:1px solid var(--border);box-shadow:var(--shadow-sm);box-sizing:border-box;}
        .nav-left{display:flex;align-items:center;gap:10px;min-width:0}
        .nav-back{width:34px;height:34px;border-radius:10px;background:var(--surface);
          border:1px solid var(--border);display:flex;align-items:center;justify-content:center;
          color:var(--text3);cursor:pointer;transition:var(--transition);text-decoration:none;flex-shrink:0}
        .nav-back:hover{color:var(--accent);background:var(--accent-soft2);border-color:var(--accent2)}
        .nav-brand{display:flex;align-items:center;gap:8px;min-width:0}
        .nav-brand-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:var(--accent);letter-spacing:-0.5px;white-space:nowrap}
        .nav-brand-sub{font-size:9px;color:var(--text3);font-weight:600;letter-spacing:.4px;text-transform:uppercase;margin-top:1px;white-space:nowrap}

        .content{max-width:480px;margin:0 auto;padding:16px 14px 0;position:relative;z-index:1;display:flex;flex-direction:column;gap:11px}

        .section-card{background:var(--surface);border-radius:var(--radius);padding:16px 14px;border:1px solid var(--border);box-shadow:var(--shadow)}
        .section-title{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--accent2);margin-bottom:13px;display:flex;align-items:center;gap:6px}

        .fields-group{display:flex;flex-direction:column;gap:13px}
        .field-label{font-size:10px;font-weight:700;color:var(--accent2);display:block;margin-bottom:5px;letter-spacing:.2px;text-transform:uppercase}
        .field-input{width:100%;border:2px solid var(--border-mid);border-radius:11px;padding:10px 12px;font-size:14px;background:var(--accent-soft);color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s,background .2s;font-family:'DM Sans',sans-serif;-webkit-appearance:none;touch-action:manipulation}
        .field-input::placeholder{color:var(--text3)}
        .field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,70,229,0.10);background:var(--surface)}
        .field-hint{font-size:10px;color:var(--text3);margin-top:4px;padding:0 2px;line-height:1.4}
        .field-textarea{resize:none}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:9px}

        .error-box{background:var(--danger-bg);border:1px solid var(--danger-border);color:var(--danger);font-size:13px;padding:10px 13px;border-radius:11px;display:flex;align-items:center;gap:8px}
        .success-box{background:var(--success-bg);border:1px solid var(--success-border);color:var(--success);font-size:13px;padding:10px 13px;border-radius:11px;display:flex;align-items:center;gap:8px;font-weight:600}

        .btn-submit{width:100%;padding:14px;border-radius:var(--radius);border:none;
          background:linear-gradient(135deg,var(--accent) 0%,var(--accent2) 100%);
          color:#fff;font-size:15px;font-weight:800;font-family:'DM Sans',sans-serif;
          cursor:pointer;box-shadow:0 6px 22px rgba(79,70,229,0.36);
          transition:transform .2s,box-shadow .2s,opacity .2s;
          display:flex;align-items:center;justify-content:center;gap:8px;
          -webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:50px}
        .btn-submit:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(79,70,229,0.46)}
        .btn-submit:not(:disabled):active{transform:scale(0.98)}
        .btn-submit:disabled{opacity:.55;cursor:not-allowed}

        .btn-secondary{width:100%;padding:13px;border-radius:var(--radius);border:1.5px solid var(--border-mid);
          background:var(--surface);color:var(--accent2);font-size:14px;font-weight:700;font-family:'DM Sans',sans-serif;
          cursor:pointer;transition:var(--transition);text-align:center;text-decoration:none;
          display:flex;align-items:center;justify-content:center;gap:8px;-webkit-tap-highlight-color:transparent}
        .btn-secondary:hover{background:var(--accent-soft);border-color:var(--accent)}

        .tipo-tag{display:inline-flex;align-items:center;gap:6px;background:var(--accent-soft);border:1px solid var(--border);color:var(--accent2);font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;padding:5px 10px;border-radius:99px}

        .loading-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:14px}

        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .75s linear infinite}

        @media(max-width:360px){.grid-2{grid-template-columns:1fr}}
      `}</style>

      <div className="page">
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        <nav className="nav">
          <div className="nav-left">
            <Link href={`/eventos/${eventoId}/invitados`} className="nav-back" aria-label="Volver">
              <IconoBack />
            </Link>
            <div className="nav-brand">
              <AppLogo size={28} />
              <div>
                <div className="nav-brand-name">Eventix</div>
                <div className="nav-brand-sub">Editar evento</div>
              </div>
            </div>
          </div>
        </nav>

        {loading ? (
          <div className="loading-screen">Cargando...</div>
        ) : (
          <div className="content">
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              <span className="tipo-tag">{TIPO_LABEL[tipo] ?? "Evento especial"}</span>
            </div>

            {error && (
              <div className="error-box">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 5v3M8 10v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}
            {guardado && (
              <div className="success-box">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Cambios guardados correctamente
              </div>
            )}

            {/* Información del evento */}
            <div className="section-card">
              <p className="section-title">Información del evento</p>
              <div className="fields-group">
                <div>
                  <label className="field-label">Nombre del evento *</label>
                  <input
                    className="field-input"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Anfitriones / Organizadores *</label>
                  <input
                    className="field-input"
                    type="text"
                    value={anfitriones}
                    onChange={(e) => setAnfitriones(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Frase especial del evento</label>
                  <input
                    className="field-input"
                    type="text"
                    value={frase}
                    onChange={(e) => setFrase(e.target.value)}
                    placeholder="Ej: Para siempre juntos"
                  />
                </div>
                <div>
                  <label className="field-label">Mensaje para los invitados</label>
                  <textarea
                    className="field-input field-textarea"
                    value={mensajeInvitacion}
                    onChange={(e) => setMensajeInvitacion(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Fecha y lugar */}
            <div className="section-card">
              <p className="section-title">Fecha y lugar</p>
              <div className="fields-group">
                <div className="grid-2">
                  <div>
                    <label className="field-label">Fecha *</label>
                    <input
                      className="field-input"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">Hora *</label>
                    <input
                      className="field-input"
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Nombre del lugar *</label>
                  <input
                    className="field-input"
                    type="text"
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">Link de Google Maps</label>
                  <input
                    className="field-input"
                    type="url"
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                  <p className="field-hint">Abre Google Maps → busca el lugar → Compartir → Copiar enlace</p>
                </div>

                <div>
                  <label className="field-label">Cómo llegar (instrucciones)</label>
                  <textarea
                    className="field-input field-textarea"
                    value={comoLlegar}
                    onChange={(e) => setComoLlegar(e.target.value)}
                    rows={2}
                    placeholder="Ej: Al llegar al semáforo de la 5a Av., doblar a la derecha..."
                  />
                </div>
              </div>
            </div>

            {/* Cupo y confirmación */}
            <div className="section-card">
              <p className="section-title">Cupo y confirmación</p>
              <div className="fields-group">
                <div>
                  <label className="field-label">Cupo de personas</label>
                  <input
                    className="field-input"
                    type="number"
                    min="1"
                    max="9999"
                    value={cupo}
                    onChange={(e) => setCupo(e.target.value)}
                    placeholder="Ej: 150"
                  />
                  <p className="field-hint">Déjalo vacío si no hay límite. Si se llena, los invitados no podrán confirmar.</p>
                </div>

                <div>
                  <label className="field-label">Fecha límite para confirmar</label>
                  <input
                    className="field-input"
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                  />
                  <p className="field-hint">Después de esta fecha los invitados no podrán confirmar.</p>
                </div>
              </div>
            </div>

            {/* Música */}
            <div className="section-card">
              <p className="section-title">Música del evento</p>
              <div className="fields-group">
                <div>
                  <label className="field-label">Nombre de la canción</label>
                  <input
                    className="field-input"
                    type="text"
                    value={musicaNombre}
                    onChange={(e) => setMusicaNombre(e.target.value)}
                    placeholder="Ej: Perfect — Ed Sheeran"
                  />
                  <p className="field-hint">Para cambiar el archivo de audio, contactá al administrador.</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <button
              className="btn-submit"
              onClick={guardar}
              disabled={guardando}
              type="button"
            >
              {guardando ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="spin">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="44 22" />
                  </svg>
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>

            <Link href={`/eventos/${eventoId}/invitados`} className="btn-secondary">
              Volver a gestionar evento
            </Link>

            <p style={{ textAlign: "center", fontSize: 10, color: "var(--text3)", padding: "8px 0 6px" }}>
              Tip: para cambiar la foto de portada o del lugar, contactá al administrador.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

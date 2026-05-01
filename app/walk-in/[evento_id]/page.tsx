"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppLogo } from "@/app/components/AppLogo";

type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  anfitriones: string;
  fecha?: string;
  frase_evento?: string | null;
};

const TIPO_EMOJI: Record<string, string> = {
  quinceañera: "👑",
  boda: "💍",
  graduacion: "🎓",
  cumpleaños: "🎂",
  otro: "✨",
};

export default function WalkInPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.evento_id as string;
  const qrRef = useRef<HTMLImageElement>(null);

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [step, setStep] = useState<"qr" | "form" | "done">("qr");
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && eventoId) {
      const url = `${window.location.origin}/walk-in/${eventoId}`;
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}&format=png&margin=10`);
    }
  }, [eventoId]);

  async function cargar() {
    const { data } = await supabase
      .from("eventos")
      .select("id,nombre,tipo,anfitriones,fecha,frase_evento")
      .eq("id", eventoId)
      .single();
    if (data) setEvento(data);
    setLoading(false);
  }

  async function registrar() {
    if (!nombre.trim()) {
      setError("Por favor ingresá tu nombre.");
      return;
    }
    setRegistrando(true);
    setError("");

    // Generar token único
    const nuevoToken = crypto.randomUUID();

    const { error: err } = await supabase.from("invitados").insert({
      evento_id: eventoId,
      nombre: nombre.trim(),
      token: nuevoToken,
      estado: "confirmado",
      num_personas: 1,
      telefono: null,
      email: null,
    });

    if (err) {
      setError("Error al registrarse. Intentalo de nuevo.");
      setRegistrando(false);
      return;
    }

    setToken(nuevoToken);
    setStep("done");
    setRegistrando(false);
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#EEF2FF,#E0E7FF)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <AppLogo size={44} />
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #4F46E5", borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    );
  }

  if (!evento) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#EEF2FF,#E0E7FF)" }}>
        <div style={{ textAlign: "center" }}>
          <AppLogo size={48} />
          <p style={{ color: "#4F46E5", marginTop: 16, fontWeight: 600 }}>Evento no encontrado.</p>
        </div>
      </main>
    );
  }

  const emoji = TIPO_EMOJI[evento.tipo] ?? "✨";

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(160deg,#EEF2FF 0%,#E0E7FF 50%,#C7D2FE 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Botón de regreso */}
      <button className="wl-btn-regreso" onClick={() => router.back()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Regresar
      </button>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400&family=Jost:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes wlFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wlPop{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        @keyframes wlPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        .wl-input:focus{outline:none;border-color:#4F46E5!important;box-shadow:0 0 0 3px rgba(79,70,229,0.15)}
        .wl-btn-primary{transition:opacity .15s,transform .12s;} .wl-btn-primary:active{transform:scale(0.97)}
        .wl-btn-back{background:none;border:none;color:#94A3B8;font-size:13px;cursor:pointer;padding:6px;display:flex;align-items:center;gap:4px;font-family:inherit;}
        .wl-btn-back:hover{color:#6366F1}
        .wl-btn-regreso{position:fixed;top:max(16px,env(safe-area-inset-top,16px));left:16px;z-index:50;background:rgba(255,255,255,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(79,70,229,0.18);border-radius:12px;padding:8px 14px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#4F46E5;cursor:pointer;font-family:inherit;box-shadow:0 2px 12px rgba(79,70,229,0.12);-webkit-tap-highlight-color:transparent;transition:opacity .15s;}
        .wl-btn-regreso:active{opacity:0.7}
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, animation: "wlFadeUp 0.4s ease" }}>

        {/* ── Topbar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 24 }}>
          <AppLogo size={30} />
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, fontWeight: 600, color: "#1E1B4B", letterSpacing: "1.5px" }}>Eventix</span>
        </div>

        {/* ── Card de evento ── */}
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", borderRadius: 22, padding: "20px 22px 16px", marginBottom: 16, border: "1px solid rgba(79,70,229,0.12)", boxShadow: "0 8px 32px rgba(79,70,229,0.10)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#3730A3,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: "0 4px 14px rgba(79,70,229,0.25)" }}>
              {emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: "#1E1B4B", lineHeight: 1.2, marginBottom: 3 }}>{evento.nombre}</div>
              <div style={{ fontSize: 12, color: "#4F46E5", fontWeight: 600, opacity: 0.85 }}>{evento.anfitriones}</div>
            </div>
          </div>
          {evento.frase_evento && (
            <p style={{ fontSize: 12, color: "#6366F1", fontStyle: "italic", marginTop: 12, lineHeight: 1.6, borderTop: "1px solid rgba(79,70,229,0.10)", paddingTop: 10 }}>
              &ldquo;{evento.frase_evento}&rdquo;
            </p>
          )}
        </div>

        {/* ── Tarjeta principal ── */}
        <div style={{ background: "white", borderRadius: 24, padding: "28px 24px", boxShadow: "0 16px 48px rgba(79,70,229,0.14)", border: "1.5px solid rgba(79,70,229,0.10)" }}>

          {/* STEP: QR */}
          {step === "qr" && (
            <div style={{ textAlign: "center", animation: "wlPop 0.3s ease" }}>
              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", border: "1px solid rgba(79,70,229,0.20)", borderRadius: 99, padding: "5px 14px", marginBottom: 18 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="9" height="9" rx="2" stroke="#4F46E5" strokeWidth="2.5"/>
                  <rect x="13" y="2" width="9" height="9" rx="2" stroke="#4F46E5" strokeWidth="2.5"/>
                  <rect x="2" y="13" width="9" height="9" rx="2" stroke="#4F46E5" strokeWidth="2.5"/>
                  <rect x="17" y="17" width="4" height="4" fill="#4F46E5"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", textTransform: "uppercase", letterSpacing: "1.2px" }}>Código QR del evento</span>
              </div>

              {qrUrl && (
                <div style={{ background: "linear-gradient(135deg,#F8FAFF,#EEF2FF)", borderRadius: 20, padding: 16, display: "inline-block", border: "2px solid rgba(79,70,229,0.15)", marginBottom: 20, boxShadow: "0 6px 24px rgba(79,70,229,0.12)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img ref={qrRef} src={qrUrl} alt="QR Walk-in" width={220} height={220} style={{ display: "block", borderRadius: 12 }} />
                </div>
              )}

              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginBottom: 22 }}>
                Mostrá este código a los invitados que no recibieron invitación electrónica. Al escanearlo podrán registrarse.
              </p>

              <button
                className="wl-btn-primary"
                onClick={() => setStep("form")}
                style={{ width: "100%", background: "linear-gradient(135deg,#3730A3,#4F46E5)", color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(79,70,229,0.32)", fontFamily: "inherit", letterSpacing: ".2px" }}
              >
                Registrarme como invitado
              </button>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10 }}>
                ¿Sos invitado? Tocá el botón de arriba
              </p>
            </div>
          )}

          {/* STEP: Form */}
          {step === "form" && (
            <div style={{ animation: "wlFadeUp 0.3s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", border: "1.5px solid rgba(79,70,229,0.15)" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: "#1E1B4B", marginBottom: 4 }}>¿Cuál es tu nombre?</div>
                <p style={{ fontSize: 13, color: "#6B7280" }}>Te registraremos como invitado del evento</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  className="wl-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && registrar()}
                  placeholder="Tu nombre completo"
                  autoFocus
                  style={{ width: "100%", border: "1.5px solid #E0E7FF", borderRadius: 14, padding: "15px 16px", fontSize: 16, fontFamily: "inherit", background: "#FAFBFF", color: "#1E1B4B", transition: "border-color .15s, box-shadow .15s" }}
                />
                {error && (
                  <p style={{ fontSize: 12, color: "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>⚠</span> {error}
                  </p>
                )}
                <button
                  className="wl-btn-primary"
                  onClick={registrar}
                  disabled={registrando || !nombre.trim()}
                  style={{ width: "100%", background: nombre.trim() ? "linear-gradient(135deg,#3730A3,#4F46E5)" : "#E5E7EB", color: nombre.trim() ? "white" : "#9CA3AF", border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700, cursor: nombre.trim() ? "pointer" : "default", transition: "all .2s", boxShadow: nombre.trim() ? "0 8px 24px rgba(79,70,229,0.30)" : "none", fontFamily: "inherit" }}
                >
                  {registrando ? "Registrando..." : "Confirmar asistencia →"}
                </button>
                <button className="wl-btn-back" onClick={() => setStep("qr")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  Volver al QR
                </button>
              </div>
            </div>
          )}

          {/* STEP: Done */}
          {step === "done" && token && (
            <div style={{ textAlign: "center", animation: "wlPop 0.3s ease" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#3730A3,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 36, boxShadow: "0 10px 32px rgba(79,70,229,0.35)", animation: "wlPulse 2s ease infinite" }}>
                🎉
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 600, color: "#1E1B4B", marginBottom: 6 }}>¡Bienvenido/a!</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#4F46E5", marginBottom: 10 }}>{nombre}</div>
              <p style={{ fontSize: 13, color: "#6366F1", marginBottom: 24, lineHeight: 1.7, background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(79,70,229,0.12)" }}>
                Ya sos parte del evento. Podés ver el muro de fotos y dejar tu deseo para los anfitriones.
              </p>
              <a
                href={`/muro/${eventoId}?token=${token}`}
                style={{ width: "100%", background: "linear-gradient(135deg,#3730A3,#4F46E5)", color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 24px rgba(79,70,229,0.32)", fontFamily: "inherit" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                Ver muro del evento
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, opacity: 0.55 }}>
          <AppLogo size={14} />
          <span style={{ fontSize: 10, color: "#4F46E5", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}>Powered by Eventix</span>
        </div>
      </div>
    </main>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppLogo } from "@/app/components/AppLogo";

type RamoDato = {
  activa: boolean;
  inicio: number;
  duracion: number;
  participantes: { nombre: string; ts: number }[];
  ganadora: string | null;
};

function calcGanadora(participantes: string[], inicio: number): string {
  if (!participantes.length) return "";
  let h = inicio;
  for (const p of participantes) {
    for (let i = 0; i < p.length; i++) {
      h = (Math.imul(31, h) + p.charCodeAt(i)) | 0;
    }
  }
  return participantes[Math.abs(h) % participantes.length];
}

export default function RamoSolterasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evento, setEvento] = useState<{ nombre: string; tipo: string } | null>(null);
  const [ramo, setRamo] = useState<RamoDato | null>(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [giroActual, setGiroActual] = useState<string>("");
  const finalizadoRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const giroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    cargarEvento();
    cargarRamo();
  }, []);

  useEffect(() => {
    if (ramo?.activa) {
      startPolling();
      startGiro();
    } else {
      stopPolling();
      stopGiro();
    }
    return () => { stopPolling(); stopGiro(); };
  }, [ramo?.activa]);

  useEffect(() => {
    if (!ramo?.activa) return;
    const t = calcTiempo(ramo.inicio, ramo.duracion);
    setTiempoRestante(t);
    const tick = setInterval(() => {
      const r = calcTiempo(ramo.inicio, ramo.duracion);
      setTiempoRestante(r);
      if (r <= 0 && !finalizadoRef.current) {
        finalizadoRef.current = true;
        const ganadora = calcGanadora(ramo.participantes.map(p => p.nombre), ramo.inicio);
        finalizarRamo(ganadora);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [ramo?.activa, ramo?.inicio]);

  function calcTiempo(inicio: number, duracion: number) {
    return Math.max(0, duracion - Math.floor((Date.now() - inicio) / 1000));
  }

  function startPolling() {
    stopPolling();
    intervalRef.current = setInterval(cargarRamo, 4000);
  }
  function stopPolling() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }
  function startGiro() {
    stopGiro();
    giroRef.current = setInterval(() => {
      setRamo(r => {
        if (!r?.participantes.length) { setGiroActual("Esperando participantes..."); return r; }
        const idx = Math.floor(Math.random() * r.participantes.length);
        setGiroActual(r.participantes[idx].nombre);
        return r;
      });
    }, 700);
  }
  function stopGiro() {
    if (giroRef.current) { clearInterval(giroRef.current); giroRef.current = null; }
  }

  async function cargarEvento() {
    const { data } = await supabase.from("eventos").select("nombre,tipo").eq("id", id).single();
    if (data) setEvento(data);
  }

  async function cargarRamo() {
    try {
      const res = await fetch(`/api/boda-civil/${id}`);
      const data = await res.json();
      setRamo(data.ramo ?? null);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function iniciarRifa() {
    setAccion(true);
    finalizadoRef.current = false;
    const fd = new FormData();
    fd.append("type", "iniciar_ramo");
    const res = await fetch(`/api/boda-civil/${id}`, { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) setRamo(data.ramo);
    setAccion(false);
  }

  async function finalizarRamo(ganadora: string) {
    const fd = new FormData();
    fd.append("type", "finalizar_ramo");
    fd.append("ganadora", ganadora);
    const res = await fetch(`/api/boda-civil/${id}`, { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) setRamo(data.ramo);
  }

  async function resetRifa() {
    setAccion(true);
    finalizadoRef.current = false;
    const fd = new FormData();
    fd.append("type", "reset_ramo");
    await fetch(`/api/boda-civil/${id}`, { method: "POST", body: fd });
    setRamo(null);
    setAccion(false);
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pct = ramo ? Math.max(0, tiempoRestante / ramo.duracion) : 0;

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#fff0f6,#fdf2f8)" }}>
      <AppLogo size={40} />
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fff0f6 0%,#fdf2f8 50%,#fce7f3 100%)", padding: "0 0 40px", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes giro{0%{opacity:0;transform:translateY(-12px) scale(0.9)}20%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(12px) scale(0.9)}}
        @keyframes winner{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(236,72,153,0.12)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.push(`/eventos/${id}`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#be185d", display: "flex", padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <AppLogo size={26} />
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: "#9d174d" }}>Ramo a las Solteras</div>
          {evento && <div style={{ fontSize: 11, color: "#be185d", opacity: 0.7 }}>{evento.nombre}</div>}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Estado: sin rifa */}
        {!ramo && (
          <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", textAlign: "center", boxShadow: "0 8px 32px rgba(236,72,153,0.10)", border: "1.5px solid rgba(249,168,212,0.3)", animation: "fadeIn .3s ease" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>💐</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: "#9d174d", marginBottom: 8 }}>Rifa del Ramo</div>
            <p style={{ fontSize: 13, color: "#be185d", opacity: 0.8, marginBottom: 24, lineHeight: 1.7 }}>
              Al iniciar la rifa, las solteras en el muro tendrán <strong>3 minutos</strong> para participar. Al finalizar se revelará la ganadora del ramo.
            </p>
            <button
              onClick={iniciarRifa}
              disabled={accion}
              style={{ width: "100%", background: "linear-gradient(135deg,#ec4899,#be185d)", color: "#fff", border: "none", borderRadius: 16, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(236,72,153,0.35)", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {accion ? "Iniciando..." : "🎉 Iniciar la rifa ahora"}
            </button>
          </div>
        )}

        {/* Estado: rifa activa */}
        {ramo?.activa && (
          <div style={{ animation: "fadeIn .3s ease", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Timer */}
            <div style={{ background: "#fff", borderRadius: 24, padding: "24px", textAlign: "center", boxShadow: "0 8px 32px rgba(236,72,153,0.12)", border: "1.5px solid rgba(249,168,212,0.35)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#be185d", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, opacity: 0.7 }}>⏱ Tiempo restante</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 56, fontWeight: 600, color: tiempoRestante <= 10 ? "#ec4899" : "#9d174d", lineHeight: 1, marginBottom: 12, animation: tiempoRestante <= 10 ? "pulse 0.8s ease infinite" : "none" }}>
                {formatTime(tiempoRestante)}
              </div>
              {/* Progress bar */}
              <div style={{ height: 6, background: "#fce7f3", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct * 100}%`, background: "linear-gradient(90deg,#ec4899,#be185d)", borderRadius: 99, transition: "width 1s linear" }} />
              </div>
            </div>

            {/* Tambola girando */}
            <div style={{ background: "linear-gradient(135deg,#9d174d,#be185d)", borderRadius: 24, padding: "24px", textAlign: "center", boxShadow: "0 8px 32px rgba(157,23,77,0.3)", minHeight: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>🎰 Girando...</div>
              {ramo.participantes.length === 0 ? (
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>Esperando solteras...</div>
              ) : (
                <div key={giroActual} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: "#fff", animation: "giro 0.7s ease", letterSpacing: "0.3px" }}>
                  {giroActual || ramo.participantes[0]?.nombre}
                </div>
              )}
            </div>

            {/* Participantes */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "20px", boxShadow: "0 4px 20px rgba(236,72,153,0.08)", border: "1.5px solid rgba(249,168,212,0.25)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#be185d", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: "#be185d", color: "#fff", borderRadius: 99, padding: "1px 8px", fontSize: 11 }}>{ramo.participantes.length}</span>
                Participantes
              </div>
              {ramo.participantes.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>Aún no hay participantes</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ramo.participantes.map((p, i) => (
                    <div key={i} style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", border: "1px solid rgba(249,168,212,0.4)", borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#9d174d", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ec4899", display: "inline-block" }}/>
                      {p.nombre}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado: ganadora revelada */}
        {ramo && !ramo.activa && ramo.ganadora && (
          <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", textAlign: "center", boxShadow: "0 12px 48px rgba(236,72,153,0.18)", border: "2px solid rgba(249,168,212,0.5)", animation: "fadeIn .4s ease" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#be185d", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, opacity: 0.7 }}>¡Ganadora del Ramo!</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, color: "#9d174d", marginBottom: 6, animation: "winner 0.6s ease" }}>
              {ramo.ganadora}
            </div>
            <div style={{ width: 40, height: 2, background: "linear-gradient(90deg,transparent,#f9a8d4,transparent)", margin: "12px auto" }}/>
            <p style={{ fontSize: 12, color: "#be185d", opacity: 0.75, marginBottom: 20, lineHeight: 1.7 }}>
              {ramo.participantes.length} solteras participaron •{" "}
              <span style={{ fontStyle: "italic" }}>¡{ramo.ganadora} es la próxima!</span>
            </p>
            <div style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", borderRadius: 16, padding: "16px", marginBottom: 20, border: "1px solid rgba(249,168,212,0.3)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, letterSpacing: "1px", textTransform: "uppercase" }}>Todas las participantes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {ramo.participantes.map((p, i) => (
                  <span key={i} style={{ fontSize: 12, color: p.nombre === ramo.ganadora ? "#9d174d" : "#be185d", fontWeight: p.nombre === ramo.ganadora ? 700 : 500, background: p.nombre === ramo.ganadora ? "rgba(236,72,153,0.12)" : "transparent", borderRadius: 99, padding: "2px 8px" }}>
                    {p.nombre === ramo.ganadora ? "💐 " : ""}{p.nombre}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={resetRifa}
              disabled={accion}
              style={{ width: "100%", background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", color: "#be185d", border: "1.5px solid rgba(249,168,212,0.5)", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              {accion ? "..." : "🔄 Nueva rifa"}
            </button>
          </div>
        )}

        {/* Estado: rifa finalizada sin ganadora (nadie participó) */}
        {ramo && !ramo.activa && !ramo.ganadora && (
          <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", textAlign: "center", boxShadow: "0 8px 32px rgba(236,72,153,0.08)", border: "1.5px solid rgba(249,168,212,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌸</div>
            <p style={{ fontSize: 14, color: "#be185d", marginBottom: 20 }}>La rifa terminó sin participantes.</p>
            <button onClick={resetRifa} disabled={accion} style={{ width: "100%", background: "linear-gradient(135deg,#ec4899,#be185d)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Intentar de nuevo
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

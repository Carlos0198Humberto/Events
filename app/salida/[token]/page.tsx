"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppLogo } from "@/app/components/AppLogo";

type Evento = {
  nombre: string;
  tipo: string;
  anfitriones: string | null;
  frase_evento: string | null;
};

type Invitado = {
  nombre: string;
};

const CONFETI_COLORS = [
  "#4F46E5","#6366F1","#818CF8","#A5B4FC",
  "#3b82f6","#10b981","#06b6d4","#f59e0b",
  "#ec4899","#C7D2FE",
];

// ─── Particles ────────────────────────────────────────────────────────────────
function Particles() {
  return (
    <div className="sl-particles" aria-hidden="true">
      {[...Array(10)].map((_, i) => (
        <div key={i} className={`sl-particle sl-particle-${i + 1}`} />
      ))}
    </div>
  );
}

export default function SalidaInvitado() {
  const params = useParams();
  const token = params.token as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [fase, setFase] = useState<"loading" | "explosion" | "mensaje">("loading");
  const [mounted, setMounted] = useState(false);
  const [confeti, setConfeti] = useState<{
    id: number; x: number; color: string; size: number;
    delay: number; rot: number; shape: "circle" | "rect" | "diamond";
  }[]>([]);

  useEffect(() => {
    async function cargar() {
      const { data: inv } = await supabase
        .from("invitados")
        .select("nombre, evento_id")
        .eq("token", token)
        .single();

      if (!inv) { setFase("mensaje"); setTimeout(() => setMounted(true), 50); return; }

      setInvitado({ nombre: inv.nombre });

      const { data: ev } = await supabase
        .from("eventos")
        .select("nombre,tipo,anfitriones,frase_evento")
        .eq("id", inv.evento_id)
        .single();
      if (ev) setEvento(ev);

      // Confeti
      const piezas = Array.from({ length: 65 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETI_COLORS[Math.floor(Math.random() * CONFETI_COLORS.length)],
        size: 5 + Math.random() * 9,
        delay: Math.random() * 0.9,
        rot: Math.random() * 360,
        shape: (["circle", "rect", "diamond"] as const)[Math.floor(Math.random() * 3)],
      }));
      setConfeti(piezas);
      setFase("explosion");
      setTimeout(() => { setFase("mensaje"); setTimeout(() => setMounted(true), 80); }, 2000);
    }
    cargar();
  }, [token]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (fase === "loading") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <AppLogo size={44} />
          <div style={{ width: 28, height: 28, border: "3px solid #4F46E5", borderTopColor: "transparent", borderRadius: "50%", animation: "slSpin .7s linear infinite" }} />
        </div>
        <style>{`@keyframes slSpin{to{transform:rotate(360deg)}}`}</style>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        :root {
          --bg:          #FFFFFF;
          --surface:     #FFFFFF;
          --border:      #E5E7F0;
          --accent:      #4F46E5;
          --accent2:     #3730A3;
          --accent-light:#EEF2FF;
          --accent-soft: rgba(79,70,229,0.06);
          --text:        #0F172A;
          --text2:       #475569;
          --text3:       #64748B;
          --shadow:      0 14px 40px -10px rgba(15,23,42,0.10);
          --shadow-btn:  0 10px 30px -6px rgba(79,70,229,0.38),0 4px 12px rgba(79,70,229,0.18);
          --transition:  all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html,body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden}

        body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity:.5}

        /* Glows */
        .sl-glow{position:fixed;pointer-events:none;z-index:0;border-radius:50%;filter:blur(90px)}
        .sl-glow-1{width:280px;height:280px;top:-60px;right:-40px;background:radial-gradient(circle,rgba(79,70,229,0.13) 0%,transparent 70%);animation:slGlow1 9s ease-in-out infinite}
        .sl-glow-2{width:220px;height:220px;bottom:60px;left:-60px;background:radial-gradient(circle,rgba(129,140,248,0.10) 0%,transparent 70%);animation:slGlow2 11s ease-in-out infinite}
        .sl-glow-3{width:180px;height:180px;bottom:-30px;right:10px;background:radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%);animation:slGlow1 13s ease-in-out infinite reverse}
        @keyframes slGlow1{0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-18px,28px) scale(1.07)} 66%{transform:translate(14px,-18px) scale(0.95)}}
        @keyframes slGlow2{0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(22px,-30px) scale(1.09)} 70%{transform:translate(-8px,18px) scale(0.93)}}

        /* Particles */
        .sl-particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
        .sl-particle{position:absolute;border-radius:50%;background:var(--accent-light);opacity:0;animation:slPFloat linear infinite}
        .sl-particle:nth-child(3n){background:#A5B4FC}
        .sl-particle:nth-child(4n){background:#E0E7FF}
        .sl-particle-1{width:4px;height:4px;left:10%;animation-duration:13s;animation-delay:0s}
        .sl-particle-2{width:3px;height:3px;left:27%;animation-duration:16s;animation-delay:2.2s}
        .sl-particle-3{width:5px;height:5px;left:44%;animation-duration:11s;animation-delay:.6s}
        .sl-particle-4{width:2px;height:2px;left:61%;animation-duration:14s;animation-delay:3.1s}
        .sl-particle-5{width:4px;height:4px;left:76%;animation-duration:12s;animation-delay:1.1s}
        .sl-particle-6{width:3px;height:3px;left:89%;animation-duration:17s;animation-delay:4s}
        .sl-particle-7{width:5px;height:5px;left:19%;animation-duration:10s;animation-delay:1.7s}
        .sl-particle-8{width:2px;height:2px;left:37%;animation-duration:9s;animation-delay:2.7s}
        .sl-particle-9{width:4px;height:4px;left:54%;animation-duration:15s;animation-delay:.9s}
        .sl-particle-10{width:3px;height:3px;left:71%;animation-duration:11s;animation-delay:3.8s}
        @keyframes slPFloat{0%{transform:translateY(105vh);opacity:0} 5%{opacity:.15} 90%{opacity:.15} 100%{transform:translateY(-8vh) translateX(25px);opacity:0}}

        /* Logo rings */
        .sl-logo-ring{position:absolute;border-radius:50%;border:1.5px solid rgba(79,70,229,0.18);animation:slRingExp 3s ease-out infinite;width:68px;height:68px}
        .sl-logo-ring-2{animation-delay:1s}
        .sl-logo-ring-3{animation-delay:2s}
        @keyframes slRingExp{0%{transform:scale(0.82);opacity:.7} 100%{transform:scale(2.0);opacity:0}}
        .sl-logo-pulse{position:relative;z-index:2;animation:slLogoPulse 3.5s ease-in-out infinite;filter:drop-shadow(0 4px 20px rgba(79,70,229,0.20))}
        @keyframes slLogoPulse{0%,100%{transform:scale(1)} 50%{transform:scale(1.04);filter:drop-shadow(0 6px 28px rgba(79,70,229,0.25))}}

        /* Card */
        .sl-card{
          background:var(--surface);
          border:1.5px solid var(--border);
          border-radius:24px;
          padding:28px 24px;
          box-shadow:var(--shadow);
        }
        @media(min-width:400px){.sl-card{padding:32px 28px}}

        /* Mount animations */
        .sl-anim-logo{opacity:0;transform:translateY(28px) scale(0.92)}
        .sl-anim-card{opacity:0;transform:translateY(20px)}
        .sl-anim-foot{opacity:0}
        .sl-mounted .sl-anim-logo{animation:slMountUp .7s cubic-bezier(.22,1,.36,1) .1s both}
        .sl-mounted .sl-anim-card{animation:slMountUp .6s cubic-bezier(.22,1,.36,1) .26s both}
        .sl-mounted .sl-anim-foot{animation:slMountUp .5s cubic-bezier(.22,1,.36,1) .42s both}
        @keyframes slMountUp{from{opacity:0;transform:translateY(24px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)}}

        /* Feature rows (para las features del evento) */
        .sl-feat-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;background:var(--accent-soft);border:1px solid var(--border)}
        .sl-feat-ic{width:34px;height:34px;border-radius:10px;background:var(--accent-light);display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0;font-size:16px}
        .sl-feat-lbl{font-size:13px;font-weight:600;color:var(--text);line-height:1.25}
        .sl-feat-desc{font-size:11.5px;color:var(--text3);line-height:1.35}

        /* Shimmer en ícono central */
        .sl-icon-shimmer{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.22) 50%,transparent 62%);background-size:200% 100%;animation:slShimmer 3.5s ease-in-out infinite}
        @keyframes slShimmer{0%{background-position:200% center} 100%{background-position:-200% center}}

        /* Confeti */
        @keyframes slCaer-0{0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(640deg);opacity:0}}
        @keyframes slCaer-1{0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(-580deg);opacity:0}}
        @keyframes slCaer-2{0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(480deg);opacity:0}}
        @keyframes slCaer-3{0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(-420deg);opacity:0}}
        @keyframes slCaer-4{0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(320deg);opacity:0}}

        /* Anillos de explosión */
        @keyframes slRing{from{opacity:.8;transform:translate(-50%,-50%) scale(.3)} to{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}

        /* Dot parpadear */
        @keyframes slDot{0%,100%{opacity:.35;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)}}

        @media(max-width:359px){.sl-card{padding:22px 16px}}
        @media(max-height:620px){.sl-logo-area{margin-bottom:14px;gap:8px} .sl-logo-container{width:60px;height:60px} .sl-logo-ring{width:56px;height:56px}}
      `}</style>

      <div className={`sl-app${mounted ? " sl-mounted" : ""}`} style={{ position: "relative", minHeight: "100dvh", background: "var(--bg)", overflow: "hidden" }}>

        {/* Glows */}
        <div className="sl-glow sl-glow-1" />
        <div className="sl-glow sl-glow-2" />
        <div className="sl-glow sl-glow-3" />
        <Particles />

        {/* Confeti */}
        {confeti.map((p) => {
          const shapeStyle = p.shape === "circle"
            ? { borderRadius: "50%", width: p.size, height: p.size }
            : p.shape === "diamond"
              ? { width: p.size, height: p.size, transform: "rotate(45deg)", borderRadius: 2 }
              : { width: p.size * 1.4, height: p.size * 0.6, borderRadius: 2 };
          return (
            <div key={p.id} style={{
              position: "fixed", left: `${p.x}%`, top: -20,
              background: p.color, ...shapeStyle,
              opacity: fase === "explosion" ? 1 : 0,
              animation: fase === "explosion"
                ? `slCaer-${p.id % 5} ${1.2 + p.delay}s ease-in ${p.delay}s forwards`
                : "none",
              zIndex: 50, pointerEvents: "none",
            }} />
          );
        })}

        {/* Anillos de explosión */}
        {fase === "explosion" && [1, 2, 3].map((n) => (
          <div key={n} style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: n * 120, height: n * 120, borderRadius: "50%",
            border: `${4 - n}px solid ${CONFETI_COLORS[n * 2]}`,
            opacity: 0,
            animation: `slRing ${0.6 + n * 0.2}s ease-out ${n * 0.1}s forwards`,
            zIndex: 40, pointerEvents: "none",
          }} />
        ))}

        {/* ── Contenido principal ── */}
        <div style={{
          position: "relative", zIndex: 60,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100dvh",
          padding: "48px 16px 32px",
          paddingBottom: "max(32px, env(safe-area-inset-bottom))",
          opacity: fase === "mensaje" ? 1 : 0,
          transition: "opacity .5s ease",
        }}>
          <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>

            {/* ── Logo área (igual que home) ── */}
            <div className="sl-anim-logo" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div className="sl-logo-container" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80 }}>
                <div className="sl-logo-ring" />
                <div className="sl-logo-ring sl-logo-ring-2" />
                <div className="sl-logo-ring sl-logo-ring-3" />
                <div className="sl-logo-pulse">
                  <AppLogo size={58} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, letterSpacing: "-1.2px", color: "var(--text)", lineHeight: 1, textAlign: "center" }}>
                  Event<span style={{ color: "var(--accent)" }}>ix</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", color: "var(--text3)", marginTop: 3, textAlign: "center" }}>
                  Invitaciones · Fotos · Recuerdos
                </div>
              </div>
            </div>

            {/* ── Card principal ── */}
            <div className="sl-card sl-anim-card">

              {/* Ícono central */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                <div style={{
                  position: "relative", width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--accent2),var(--accent))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, boxShadow: "var(--shadow-btn)", overflow: "hidden", marginBottom: 16,
                }}>
                  <span className="sl-icon-shimmer" />
                  🎊
                </div>

                <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px", lineHeight: 1.2, textAlign: "center", marginBottom: 6 }}>
                  ¡Gracias por estar!
                </h1>

                {invitado && (
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--accent)", marginBottom: 4, textAlign: "center" }}>
                    {invitado.nombre}
                  </p>
                )}
                {evento?.anfitriones && (
                  <p style={{ fontSize: 13, color: "var(--text3)", textAlign: "center" }}>
                    {evento.anfitriones} {invitado ? "te agradece" : "agradece"} tu presencia
                  </p>
                )}
              </div>

              {/* Divisor */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 18px" }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,var(--border))" }} />
                <span style={{ fontSize: 16 }}>🙏</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,var(--border),transparent)" }} />
              </div>

              {/* Info del evento */}
              {evento && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  <div className="sl-feat-row">
                    <div className="sl-feat-ic">✨</div>
                    <div>
                      <div className="sl-feat-lbl">{evento.nombre}</div>
                      {evento.frase_evento && (
                        <div className="sl-feat-desc" style={{ fontStyle: "italic" }}>&ldquo;{evento.frase_evento}&rdquo;</div>
                      )}
                    </div>
                  </div>

                  <div className="sl-feat-row">
                    <div className="sl-feat-ic">💌</div>
                    <div>
                      <div className="sl-feat-lbl">Un recuerdo para siempre</div>
                      <div className="sl-feat-desc">Fue un honor tenerte presente en este día tan especial</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dots decorativos */}
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                {["#4F46E5","#f59e0b","#10b981","#ec4899","#3b82f6"].map((c, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: c,
                    animation: `slDot ${1 + i * 0.3}s ease-in-out infinite`,
                  }} />
                ))}
              </div>

              <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>
                Podés cerrar esta ventana
              </p>
            </div>

            {/* Footer */}
            <div className="sl-anim-foot" style={{ textAlign: "center", marginTop: 16, opacity: 0.55 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--text3)" }}>
                Humb3rsec 2026
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

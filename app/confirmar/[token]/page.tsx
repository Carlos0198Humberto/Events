"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Invitado = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  num_personas: number;
  token: string;
  numero_confirmacion?: number | null;
  foto_url?: string | null;
  deseo?: string | null;
  evento_id: string;
};

type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  anfitriones: string;
  fecha?: string;
  hora?: string;
  lugar?: string;
  organizador_telefono?: string;
};

// ─── Logo Eventix ─────────────────────────────────────────────────────────────
function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="lg-ev-c"
          x1="0"
          y1="0"
          x2="56"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3AADA0" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="56" height="56" rx="16" fill="url(#lg-ev-c)" />
      <circle cx="40" cy="10" r="3" fill="white" opacity="0.9" />
      <circle cx="44" cy="14" r="1.5" fill="white" opacity="0.5" />
      <rect
        x="8"
        y="20"
        width="34"
        height="22"
        rx="4"
        fill="white"
        opacity="0.95"
      />
      <circle cx="25" cy="31" r="7" fill="#e0f5f2" />
      <circle cx="25" cy="31" r="4.5" fill="#3AADA0" />
      <circle cx="25" cy="31" r="2" fill="white" opacity="0.7" />
      <path
        d="M28 20 L32 20 L34 16 L22 16 L22 20Z"
        fill="white"
        opacity="0.95"
      />
      <line
        x1="36"
        y1="23"
        x2="40"
        y2="27"
        stroke="#3AADA0"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="40"
        y1="23"
        x2="36"
        y2="27"
        stroke="#3AADA0"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  quinceañera: "Quinceañera",
  boda: "Boda",
  graduacion: "Graduación",
  cumpleaños: "Cumpleaños",
  otro: "Evento especial",
};

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFechaCorta(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Guardar en Google Calendar
function abrirGoogleCalendar(evento: Evento) {
  const titulo = encodeURIComponent(evento.nombre);
  const lugar = encodeURIComponent(evento.lugar || "");
  const desc = encodeURIComponent(
    `${TIPO_LABEL[evento.tipo] || "Evento"} de ${evento.anfitriones}`,
  );

  let fechaInicio = "";
  let fechaFin = "";

  if (evento.fecha) {
    const [y, m, d] = evento.fecha.split("T")[0].split("-");
    if (evento.hora) {
      const [h, min] = evento.hora.replace(".", ":").split(":");
      const hPad = String(parseInt(h)).padStart(2, "0");
      const mPad = String(parseInt(min || "0")).padStart(2, "0");
      // 2 horas de duración por defecto
      const hFin = String(parseInt(hPad) + 2).padStart(2, "0");
      fechaInicio = `${y}${m}${d}T${hPad}${mPad}00`;
      fechaFin = `${y}${m}${d}T${hFin}${mPad}00`;
    } else {
      fechaInicio = `${y}${m}${d}`;
      fechaFin = `${y}${m}${d}`;
    }
  }

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${fechaInicio}/${fechaFin}&details=${desc}&location=${lugar}`;
  window.open(url, "_blank");
}

// Partículas de confeti para la animación de destrucción
function crearParticulas() {
  const colores = [
    "#3AADA0",
    "#2DC4A8",
    "#7DD4C8",
    "#E0F5F2",
    "#ffffff",
    "#fbbf24",
    "#f472b6",
  ];
  const particulas: {
    x: number;
    y: number;
    color: string;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
  }[] = [];
  for (let i = 0; i < 60; i++) {
    particulas.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
      color: colores[Math.floor(Math.random() * colores.length)],
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -14 - 4,
      size: Math.random() * 10 + 4,
      rotation: Math.random() * 360,
    });
  }
  return particulas;
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ConfirmarPage() {
  const params = useParams();
  const token = params.token as string;

  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<
    "vista" | "form" | "confirmado" | "rechazado"
  >("vista");
  const [numPersonas, setNumPersonas] = useState(1);
  const [confirmando, setConfirmando] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: inv } = await supabase
      .from("invitados")
      .select("*")
      .eq("token", token)
      .single();
    if (!inv) {
      setLoading(false);
      return;
    }
    const { data: ev } = await supabase
      .from("eventos")
      .select("*")
      .eq("id", inv.evento_id)
      .single();
    setInvitado(inv);
    if (ev) setEvento(ev);
    setNumPersonas(inv.num_personas || 1);
    if (inv.estado === "confirmado") setStep("confirmado");
    if (inv.estado === "rechazado") setStep("rechazado");
    setLoading(false);
  }

  async function confirmarAsistencia() {
    if (!invitado) return;
    setConfirmando(true);
    const { data: lastConf } = await supabase
      .from("invitados")
      .select("numero_confirmacion")
      .eq("evento_id", invitado.evento_id)
      .eq("estado", "confirmado")
      .order("numero_confirmacion", { ascending: false })
      .limit(1);
    const siguiente =
      lastConf && lastConf.length > 0 && lastConf[0].numero_confirmacion
        ? lastConf[0].numero_confirmacion + 1
        : 1;
    const { data: updated } = await supabase
      .from("invitados")
      .update({
        estado: "confirmado",
        num_personas: numPersonas,
        numero_confirmacion: siguiente,
      })
      .eq("id", invitado.id)
      .select()
      .single();
    if (updated) setInvitado(updated);
    setConfirmando(false);
    setStep("confirmado");
  }

  async function rechazarAsistencia() {
    if (!invitado) return;
    await supabase
      .from("invitados")
      .update({ estado: "rechazado" })
      .eq("id", invitado.id);
    setStep("rechazado");
  }

  // Animación de destrucción + redirigir a WhatsApp
  function confirmarYCerrar() {
    setDestroying(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      redirigirWhatsApp();
      return;
    }
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      redirigirWhatsApp();
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particulas = crearParticulas();
    let frame = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particulas.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5;
        p.rotation += 6;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = Math.max(0, 1 - frame / 80);
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx!.restore();
      });
      frame++;
      if (frame < 80) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animRef.current);
        redirigirWhatsApp();
      }
    }
    animate();
  }

  function redirigirWhatsApp() {
    // Cerrar la pestaña / volver a WhatsApp
    window.close();
    // Si window.close() no funciona (algunos browsers), redirigir a WhatsApp
    setTimeout(() => {
      window.location.href = "whatsapp://";
    }, 300);
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}

    :root{
      --teal:#3AADA0;--teal-dark:#0f766e;--teal-mid:#1FA896;
      --teal-soft:#e0f5f2;--teal-border:rgba(58,173,160,0.22);
      --teal-border-mid:rgba(58,173,160,0.36);
      --text:#0A1E1C;--text2:#2D5A56;--text3:#7AAFA9;
      --surface:#FFFFFF;--bg:#F0FAF8;
      --shadow:0 8px 32px rgba(58,173,160,0.14);
      --shadow-lg:0 16px 48px rgba(58,173,160,0.22);
      --r:22px;--r-sm:14px;
    }

    .page{
      min-height:100dvh;
      background:var(--bg);
      background-image:
        radial-gradient(ellipse 90% 55% at 50% -5%, rgba(58,173,160,0.13) 0%, transparent 65%),
        radial-gradient(ellipse 50% 35% at 90% 95%, rgba(45,196,168,0.07) 0%, transparent 55%);
      padding-bottom:80px;
      opacity:0;transition:opacity .45s ease;
    }
    .page.vis{opacity:1}

    /* Topbar */
    .topbar{
      display:flex;align-items:center;gap:10px;
      padding:14px 18px;
      background:rgba(240,250,248,0.95);
      backdrop-filter:blur(18px);
      border-bottom:1px solid var(--teal-border);
      position:sticky;top:0;z-index:20;
    }
    .topbar-texts{display:flex;flex-direction:column;gap:1px}
    .topbar-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--teal);letter-spacing:-.3px;line-height:1}
    .topbar-sub{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px}

    /* Wrap */
    .wrap{max-width:430px;margin:0 auto;padding:22px 16px;display:flex;flex-direction:column;gap:18px}

    /* TARJETA INVITACIÓN */
    .inv-card{
      background:var(--surface);border-radius:var(--r);
      border:1px solid var(--teal-border-mid);
      box-shadow:var(--shadow-lg);
      overflow:hidden;
      animation:riseUp .55s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes riseUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}

    .inv-hero{
      background:linear-gradient(135deg,var(--teal) 0%,var(--teal-dark) 100%);
      padding:32px 24px 28px;
      text-align:center;
      position:relative;
      overflow:hidden;
    }
    .inv-hero::before{
      content:'';position:absolute;inset:0;
      background-image:radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px);
      background-size:22px 22px;
    }
    .inv-tipo-badge{
      display:inline-block;
      background:rgba(255,255,255,0.18);
      border:1px solid rgba(255,255,255,0.28);
      border-radius:99px;padding:5px 14px;
      font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);
      letter-spacing:.6px;text-transform:uppercase;
      margin-bottom:16px;
      position:relative;z-index:1;
    }
    .inv-saludo{
      position:relative;z-index:1;
      font-family:'Playfair Display',serif;
      font-size:32px;font-weight:700;color:#fff;
      letter-spacing:-.5px;line-height:1.15;
      margin-bottom:6px;
    }
    .inv-anfitrion{
      position:relative;z-index:1;
      font-size:13px;color:rgba(255,255,255,0.78);font-weight:500;
      margin-bottom:22px;
    }
    .inv-evento-nombre{
      position:relative;z-index:1;
      background:rgba(255,255,255,0.16);
      border:1px solid rgba(255,255,255,0.28);
      border-radius:var(--r-sm);
      padding:13px 18px;
      font-family:'Playfair Display',serif;
      font-size:20px;font-weight:700;color:#fff;
    }

    .inv-body{padding:20px 22px}
    .detalles{
      display:flex;flex-direction:column;gap:11px;
      background:var(--teal-soft);border:1px solid var(--teal-border-mid);
      border-radius:var(--r-sm);padding:16px 18px;margin-bottom:18px;
    }
    .detalle-fila{display:flex;align-items:center;gap:12px}
    .detalle-icono{
      width:32px;height:32px;border-radius:9px;
      background:var(--teal);
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;
    }
    .detalle-texto{font-size:13px;color:var(--text2);font-weight:500;text-transform:capitalize;line-height:1.3}
    .detalle-label{font-size:10px;color:var(--text3);font-weight:700;letter-spacing:.4px;text-transform:uppercase}

    /* Iconos SVG */
    .svg-ico{display:block}

    /* DECISIÓN */
    .pregunta{text-align:center;font-size:15px;font-weight:700;color:var(--text2);padding:4px 0}
    .grid-decision{display:grid;grid-template-columns:1fr 1fr;gap:10px}

    .btn-si{
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      color:#fff;border:none;border-radius:var(--r-sm);
      padding:16px 12px;font-size:14px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(58,173,160,0.38);
      transition:transform .18s,box-shadow .18s;
      animation:riseUp .5s .12s both;
    }
    .btn-si:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(58,173,160,0.46)}
    .btn-si:active{transform:scale(.97)}
    .btn-si:disabled{opacity:.65;cursor:wait}

    .btn-no{
      background:var(--surface);color:var(--text2);
      border:1.5px solid var(--teal-border-mid);border-radius:var(--r-sm);
      padding:16px 12px;font-size:13px;font-weight:700;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      transition:all .18s;
      animation:riseUp .5s .06s both;
    }
    .btn-no:hover{background:#fef2f2;color:#dc2626;border-color:#fca5a5}

    /* FORMULARIO PERSONAS */
    .form-card{
      background:var(--surface);border-radius:var(--r);
      border:1px solid var(--teal-border-mid);box-shadow:var(--shadow);
      padding:26px 22px;
      animation:riseUp .45s cubic-bezier(.22,1,.36,1) both;
    }
    .form-head{margin-bottom:22px}
    .form-titulo{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--teal);letter-spacing:-.3px}
    .form-sub{font-size:12px;color:var(--text3);font-weight:600;margin-top:3px;text-transform:uppercase;letter-spacing:.4px}

    .campo-label{font-size:11px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;display:block}

    .counter-row{display:flex;align-items:center;gap:16px;padding:2px 0}
    .cnt-btn{
      width:44px;height:44px;border-radius:50%;
      border:2px solid var(--teal-border-mid);background:var(--teal-soft);
      color:var(--teal);font-size:22px;font-weight:700;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:all .15s;user-select:none;line-height:1;
    }
    .cnt-btn:hover{background:rgba(58,173,160,0.18);border-color:var(--teal)}
    .cnt-val{font-size:32px;font-weight:800;color:var(--text);min-width:44px;text-align:center;font-variant-numeric:tabular-nums}

    .btn-confirmar-final{
      width:100%;margin-top:8px;
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      color:#fff;border:none;border-radius:var(--r-sm);
      padding:16px;font-size:15px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(58,173,160,0.36);
      transition:transform .18s,box-shadow .18s;
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .btn-confirmar-final:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(58,173,160,0.44)}
    .btn-confirmar-final:disabled{opacity:.65;cursor:wait}
    .spinner{
      width:18px;height:18px;border-radius:50%;
      border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;
      animation:spin .7s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg)}}

    /* CONFIRMADO */
    .conf-card{
      background:var(--surface);border-radius:var(--r);
      border:1px solid var(--teal-border-mid);box-shadow:var(--shadow-lg);
      overflow:hidden;
      animation:riseUp .5s cubic-bezier(.22,1,.36,1) both;
    }
    .conf-hero{
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      padding:32px 22px 26px;text-align:center;
      position:relative;overflow:hidden;
    }
    .conf-hero::before{
      content:'';position:absolute;inset:0;
      background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);
      background-size:22px 22px;
    }
    .conf-check{
      position:relative;z-index:1;
      width:68px;height:68px;border-radius:50%;
      background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.36);
      display:flex;align-items:center;justify-content:center;
      margin:0 auto 16px;
      animation:popIn .5s .1s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes popIn{from{transform:scale(0)}to{transform:scale(1)}}
    .conf-titulo{
      position:relative;z-index:1;
      font-family:'Playfair Display',serif;
      font-size:30px;font-weight:700;color:#fff;
      letter-spacing:-.4px;margin-bottom:6px;
    }
    .conf-sub{position:relative;z-index:1;font-size:13px;color:rgba(255,255,255,0.8);font-weight:500}

    .conf-body{padding:20px 22px;display:flex;flex-direction:column;gap:14px}

    .num-badge{
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      border-radius:var(--r-sm);padding:14px 18px;
      display:flex;align-items:center;gap:14px;
      box-shadow:0 4px 14px rgba(58,173,160,0.28);
    }
    .num-icono{
      width:44px;height:44px;border-radius:12px;
      background:rgba(255,255,255,0.18);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .num-label{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,0.75)}
    .num-val{font-size:26px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1}

    .resumen{
      background:var(--teal-soft);border:1px solid var(--teal-border-mid);
      border-radius:var(--r-sm);padding:15px 17px;
      display:flex;flex-direction:column;gap:10px;
    }
    .res-fila{display:flex;align-items:center;gap:10px}
    .res-icono{
      width:30px;height:30px;border-radius:9px;
      background:rgba(58,173,160,0.15);border:1px solid var(--teal-border-mid);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .res-texto{font-size:13px;color:var(--text2);font-weight:500;text-transform:capitalize}

    /* Acciones post-confirmación */
    .acciones-titulo{font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px}

    .grid-acciones{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .btn-accion{
      background:var(--surface);border:1.5px solid var(--teal-border-mid);
      border-radius:var(--r-sm);padding:15px 12px;
      display:flex;flex-direction:column;align-items:center;gap:8px;
      cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;
    }
    .btn-accion:hover{background:var(--teal-soft);border-color:var(--teal);transform:translateY(-2px);box-shadow:0 4px 14px rgba(58,173,160,0.16)}
    .btn-accion-icono{
      width:42px;height:42px;border-radius:12px;
      background:var(--teal-soft);border:1px solid var(--teal-border-mid);
      display:flex;align-items:center;justify-content:center;
    }
    .btn-accion-label{font-size:12px;font-weight:700;color:var(--text2);text-align:center;line-height:1.3}

    .btn-accion-full{
      width:100%;background:var(--surface);
      border:1.5px solid var(--teal-border-mid);border-radius:var(--r-sm);
      padding:14px 18px;
      display:flex;align-items:center;gap:12px;
      cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;
    }
    .btn-accion-full:hover{background:var(--teal-soft);border-color:var(--teal);box-shadow:0 3px 12px rgba(58,173,160,0.14)}

    .btn-cerrar{
      width:100%;
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      color:#fff;border:none;border-radius:var(--r-sm);
      padding:16px;font-size:15px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(58,173,160,0.36);
      transition:transform .18s,box-shadow .18s;
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .btn-cerrar:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(58,173,160,0.44)}

    /* RECHAZADO */
    .rech-card{
      background:var(--surface);border-radius:var(--r);
      border:1px solid var(--teal-border-mid);box-shadow:var(--shadow);
      padding:36px 24px;text-align:center;
      animation:riseUp .5s cubic-bezier(.22,1,.36,1) both;
    }
    .rech-titulo{font-family:'Playfair Display',serif;font-size:26px;color:var(--text);margin-bottom:10px}
    .rech-sub{font-size:14px;color:var(--text2);line-height:1.6}

    /* Loading */
    .loading-screen{
      min-height:100dvh;
      background:linear-gradient(135deg,#0C1A19,#0F2422);
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:18px;
    }
    .loading-spinner{
      width:38px;height:38px;border-radius:50%;
      border:3px solid rgba(58,173,160,0.2);border-top-color:#3AADA0;
      animation:spin .75s linear infinite;
    }

    /* Overlay destrucción */
    .destroy-overlay{
      position:fixed;inset:0;z-index:9999;
      background:rgba(240,250,248,0.0);
      pointer-events:none;
    }
    canvas#confetti-canvas{
      position:fixed;inset:0;z-index:9999;
      width:100%;height:100%;
      display:none;pointer-events:none;
    }
    .page.destroying{
      animation:shatter .6s ease forwards;
    }
    @keyframes shatter{
      0%{opacity:1;transform:scale(1) rotate(0deg)}
      30%{opacity:1;transform:scale(1.04) rotate(-.5deg)}
      60%{opacity:.5;transform:scale(.95) rotate(.5deg)}
      100%{opacity:0;transform:scale(.8) rotate(-1deg)}
    }
  `;

  // ─── SVG Icons ──────────────────────────────────────────────────────────────
  const CheckSvg = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path
        d="M7 16l7 7 11-11"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const CalSvg = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3AADA0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="12" cy="16" r="1.5" fill="#3AADA0" />
    </svg>
  );
  const CamSvg = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3AADA0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
  const HeartSvg = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3AADA0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
  const WaSvg = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3AADA0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
  const DateSvg = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
  const TimeSvg = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
  const PlaceSvg = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
  const PeopleSvg = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3AADA0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
  const TicketSvg = () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6" />
      <path d="M2 15a3 3 0 000 6h20a3 3 0 000-6" />
      <path d="M2 9h20M2 15h20" />
    </svg>
  );

  if (loading)
    return (
      <>
        <style>{styles}</style>
        <div className="loading-screen">
          <AppLogo size={56} />
          <div className="loading-spinner" />
          <p
            style={{
              color: "#3AADA0",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 1,
            }}
          >
            Cargando tu invitación...
          </p>
        </div>
      </>
    );

  if (!invitado || !evento)
    return (
      <>
        <style>{styles}</style>
        <div
          style={{
            minHeight: "100dvh",
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 22,
              border: "1px solid var(--teal-border-mid)",
              padding: "40px 28px",
              maxWidth: 340,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 22,
                color: "var(--teal)",
                marginBottom: 8,
              }}
            >
              Invitación no encontrada
            </p>
            <p style={{ fontSize: 13, color: "var(--text2)" }}>
              Este link no es válido o ya expiró.
            </p>
          </div>
        </div>
      </>
    );

  const tipoLabel = TIPO_LABEL[evento.tipo] || "Evento especial";
  const fechaFmt = evento.fecha ? formatFecha(evento.fecha) : null;
  const fechaCorta = evento.fecha ? formatFechaCorta(evento.fecha) : null;

  return (
    <>
      <style>{styles}</style>
      <canvas id="confetti-canvas" ref={canvasRef} />

      <div
        className={`page${mounted ? " vis" : ""}${destroying ? " destroying" : ""}`}
      >
        {/* Topbar */}
        <div className="topbar">
          <AppLogo size={30} />
          <div className="topbar-texts">
            <div className="topbar-name">Eventix</div>
            <div className="topbar-sub">Invitaciones digitales</div>
          </div>
        </div>

        {/* ─── PASO: VISTA INVITACIÓN ─────────────────────────────────────── */}
        {step === "vista" && (
          <div className="wrap">
            <div className="inv-card">
              {/* Hero */}
              <div className="inv-hero">
                <div className="inv-tipo-badge">{tipoLabel}</div>
                <h1 className="inv-saludo">¡Hola, {invitado.nombre}!</h1>
                <p className="inv-anfitrion">
                  Invitación de{" "}
                  <strong style={{ color: "white" }}>
                    {evento.anfitriones}
                  </strong>
                </p>
                <div className="inv-evento-nombre">{evento.nombre}</div>
              </div>

              {/* Detalles */}
              <div className="inv-body">
                {(fechaFmt || evento.hora || evento.lugar) && (
                  <div className="detalles">
                    {fechaFmt && (
                      <div className="detalle-fila">
                        <div className="detalle-icono">
                          <DateSvg />
                        </div>
                        <div>
                          <div className="detalle-label">Fecha</div>
                          <div className="detalle-texto">{fechaFmt}</div>
                        </div>
                      </div>
                    )}
                    {evento.hora && (
                      <div className="detalle-fila">
                        <div className="detalle-icono">
                          <TimeSvg />
                        </div>
                        <div>
                          <div className="detalle-label">Hora</div>
                          <div className="detalle-texto">{evento.hora}</div>
                        </div>
                      </div>
                    )}
                    {evento.lugar && (
                      <div className="detalle-fila">
                        <div className="detalle-icono">
                          <PlaceSvg />
                        </div>
                        <div>
                          <div className="detalle-label">Lugar</div>
                          <div className="detalle-texto">{evento.lugar}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="pregunta">¿Podrás asistir?</p>
            <div className="grid-decision">
              <button className="btn-no" onClick={rechazarAsistencia}>
                No podré ir
              </button>
              <button className="btn-si" onClick={() => setStep("form")}>
                Sí, voy
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO: FORM PERSONAS ────────────────────────────────────────── */}
        {step === "form" && (
          <div className="wrap">
            <div className="form-card">
              <div className="form-head">
                <div className="form-titulo">¡Qué alegría!</div>
                <div className="form-sub">Un dato más para confirmar</div>
              </div>

              <div>
                <span className="campo-label">
                  ¿Cuántas personas asistirán?
                </span>
                <div className="counter-row">
                  <button
                    className="cnt-btn"
                    onClick={() => setNumPersonas(Math.max(1, numPersonas - 1))}
                  >
                    −
                  </button>
                  <span className="cnt-val">{numPersonas}</span>
                  <button
                    className="cnt-btn"
                    onClick={() =>
                      setNumPersonas(Math.min(20, numPersonas + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn-confirmar-final"
                onClick={confirmarAsistencia}
                disabled={confirmando}
              >
                {confirmando ? (
                  <>
                    <div className="spinner" /> Confirmando...
                  </>
                ) : (
                  "Confirmar asistencia"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── PASO: CONFIRMADO ───────────────────────────────────────────── */}
        {step === "confirmado" && (
          <div className="wrap">
            <div className="conf-card">
              {/* Hero */}
              <div className="conf-hero">
                <div className="conf-check">
                  <CheckSvg />
                </div>
                <div className="conf-titulo">¡Confirmado!</div>
                <p className="conf-sub">
                  Nos vemos en{" "}
                  <strong style={{ color: "white" }}>{evento.nombre}</strong>
                </p>
              </div>

              <div className="conf-body">
                {/* Número de confirmación */}
                {invitado.numero_confirmacion && (
                  <div className="num-badge">
                    <div className="num-icono">
                      <TicketSvg />
                    </div>
                    <div>
                      <div className="num-label">Número de confirmación</div>
                      <div className="num-val">
                        #{String(invitado.numero_confirmacion).padStart(3, "0")}
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen */}
                <div className="resumen">
                  {fechaCorta && (
                    <div className="res-fila">
                      <div className="res-icono">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3AADA0"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </div>
                      <span className="res-texto">{fechaCorta}</span>
                    </div>
                  )}
                  {evento.hora && (
                    <div className="res-fila">
                      <div className="res-icono">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3AADA0"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </div>
                      <span className="res-texto">{evento.hora}</span>
                    </div>
                  )}
                  {evento.lugar && (
                    <div className="res-fila">
                      <div className="res-icono">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3AADA0"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span className="res-texto">{evento.lugar}</span>
                    </div>
                  )}
                  <div className="res-fila">
                    <div className="res-icono">
                      <PeopleSvg />
                    </div>
                    <span className="res-texto">
                      {invitado.num_personas}{" "}
                      {invitado.num_personas === 1 ? "persona" : "personas"}
                    </span>
                  </div>
                </div>

                {/* Acciones: foto y deseo */}
                <div>
                  <div className="acciones-titulo">Participa en el evento</div>
                  <div className="grid-acciones">
                    <button
                      className="btn-accion"
                      onClick={() => {
                        // Navegar al muro del evento con token
                        window.location.href = `/muro/${invitado.evento_id}?token=${invitado.token}&tab=fotos`;
                      }}
                    >
                      <div className="btn-accion-icono">
                        <CamSvg />
                      </div>
                      <span className="btn-accion-label">
                        Subir mi foto al muro
                      </span>
                    </button>
                    <button
                      className="btn-accion"
                      onClick={() => {
                        window.location.href = `/muro/${invitado.evento_id}?token=${invitado.token}&tab=deseos`;
                      }}
                    >
                      <div className="btn-accion-icono">
                        <HeartSvg />
                      </div>
                      <span className="btn-accion-label">Dejar mi deseo</span>
                    </button>
                  </div>
                </div>

                {/* Guardar en Google Calendar */}
                {evento.fecha && (
                  <button
                    className="btn-accion-full"
                    onClick={() => abrirGoogleCalendar(evento)}
                  >
                    <div className="btn-accion-icono">
                      <CalSvg />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text2)",
                        }}
                      >
                        Guardar en Google Calendar
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>
                        No te olvides del evento
                      </span>
                    </div>
                    <svg
                      style={{ marginLeft: "auto" }}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3AADA0"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                )}

                {/* Cerrar y volver a WhatsApp */}
                <button className="btn-cerrar" onClick={confirmarYCerrar}>
                  <WaSvg />
                  Listo, cerrar esta ventana
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PASO: RECHAZADO ────────────────────────────────────────────── */}
        {step === "rechazado" && (
          <div className="wrap">
            <div className="rech-card">
              <div style={{ fontSize: 52, marginBottom: 16 }}>😔</div>
              <div className="rech-titulo">Gracias por avisar</div>
              <p className="rech-sub">
                Lamentamos que no puedas asistir,{" "}
                <strong>{invitado.nombre}</strong>.<br />
                <br />
                Esperamos verte en otra ocasión.
              </p>
              <button
                onClick={confirmarYCerrar}
                style={{
                  marginTop: 22,
                  width: "100%",
                  background: "var(--teal-soft)",
                  color: "var(--teal)",
                  border: "1.5px solid var(--teal-border-mid)",
                  borderRadius: "var(--r-sm)",
                  padding: "14px",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <WaSvg /> Cerrar ventana
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

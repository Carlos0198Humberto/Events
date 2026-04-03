"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Head from "next/head";

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
  imagen_url?: string | null;
};

// ─── Logo Eventix (nuevo, solo modo claro) ────────────────────────────────────
function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="evx-conf-bg"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient
          id="evx-conf-glow"
          x1="12"
          y1="20"
          x2="52"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#evx-conf-bg)" />
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="16"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
      />
      <path
        d="M18 17 L30 32 L18 47"
        stroke="url(#evx-conf-glow)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M46 17 L34 32 L46 47"
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="32" cy="32" r="4" fill="white" opacity="0.95" />
      <circle cx="17" cy="13" r="2" fill="#5EEAD4" opacity="0.8" />
      <circle cx="47" cy="51" r="2" fill="#5EEAD4" opacity="0.8" />
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

function abrirGoogleCalendar(evento: Evento) {
  const titulo = encodeURIComponent(evento.nombre);
  const lugar = encodeURIComponent(evento.lugar || "");
  const desc = encodeURIComponent(
    `${TIPO_LABEL[evento.tipo] || "Evento"} de ${evento.anfitriones}`,
  );
  let fechaInicio = "",
    fechaFin = "";
  if (evento.fecha) {
    const [y, m, d] = evento.fecha.split("T")[0].split("-");
    if (evento.hora) {
      const [h, min] = evento.hora.replace(".", ":").split(":");
      const hPad = String(parseInt(h)).padStart(2, "0");
      const mPad = String(parseInt(min || "0")).padStart(2, "0");
      const hFin = String(parseInt(hPad) + 2).padStart(2, "0");
      fechaInicio = `${y}${m}${d}T${hPad}${mPad}00`;
      fechaFin = `${y}${m}${d}T${hFin}${mPad}00`;
    } else {
      fechaInicio = `${y}${m}${d}`;
      fechaFin = `${y}${m}${d}`;
    }
  }
  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${fechaInicio}/${fechaFin}&details=${desc}&location=${lugar}`,
    "_blank",
  );
}

function crearParticulas() {
  const colores = [
    "#0D9488",
    "#5EEAD4",
    "#ccfbf1",
    "#ffffff",
    "#fbbf24",
    "#f472b6",
  ];
  return Array.from({ length: 60 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
    color: colores[Math.floor(Math.random() * colores.length)],
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -14 - 4,
    size: Math.random() * 10 + 4,
    rotation: Math.random() * 360,
  }));
}

// ─── TARJETA WHATSAPP (se genera con canvas y se comparte) ───────────────────
// Esta función genera la URL de WhatsApp con el link de confirmación
// La tarjeta visual se muestra ANTES de abrir WhatsApp
function generarLinkWhatsApp(
  telefono: string,
  invitado: Invitado,
  evento: Evento,
): string {
  const link = `${window.location.origin}/confirmar/${invitado.token}`;
  const texto = encodeURIComponent(
    `🎉 *Invitación a ${evento.nombre}*\n\nHola *${invitado.nombre}*, te invitamos a un evento especial.\n\n📅 ${evento.fecha ? formatFechaCorta(evento.fecha) : ""}\n📍 ${evento.lugar || ""}\n\n👉 Confirma tu asistencia aquí:\n${link}`,
  );
  const tel = telefono.replace(/\D/g, "");
  return `https://wa.me/${tel}?text=${texto}`;
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
  // Estado para mostrar tarjeta WhatsApp
  const [mostrarTarjetaWA, setMostrarTarjetaWA] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    // Favicon dinámico con el logo de Eventix
    const setFavicon = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Fondo verde
      const grd = ctx.createLinearGradient(0, 0, 64, 64);
      grd.addColorStop(0, "#0F766E");
      grd.addColorStop(1, "#0D9488");
      ctx.fillStyle = grd;
      roundRect(ctx, 0, 0, 64, 64, 14);
      ctx.fill();
      // Chevron izquierdo
      ctx.strokeStyle = "#5EEAD4";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(18, 17);
      ctx.lineTo(30, 32);
      ctx.lineTo(18, 47);
      ctx.stroke();
      // Chevron derecho
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.moveTo(46, 17);
      ctx.lineTo(34, 32);
      ctx.lineTo(46, 47);
      ctx.stroke();
      // Punto central
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(32, 32, 4, 0, Math.PI * 2);
      ctx.fill();
      // Aplicar favicon
      const link =
        (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
        (document.createElement("link") as HTMLLinkElement);
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = canvas.toDataURL();
      document.getElementsByTagName("head")[0].appendChild(link);
    };
    function roundRect(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
    ) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
    setFavicon();
    document.title = "Eventix — Tu invitación";
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

  // Animación de confeti y redirigir
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
    window.close();
    setTimeout(() => {
      window.location.href = "whatsapp://";
    }, 300);
  }

  // ── Abrir tarjeta de invitación WhatsApp ──────────────────────────────────
  function abrirTarjetaWhatsApp() {
    setMostrarTarjetaWA(true);
  }
  function cerrarTarjetaWA() {
    setMostrarTarjetaWA(false);
  }
  function irWhatsApp() {
    if (!invitado || !evento || !evento.organizador_telefono) return;
    window.open(
      generarLinkWhatsApp(evento.organizador_telefono, invitado, evento),
      "_blank",
    );
    setMostrarTarjetaWA(false);
  }

  // ─── ESTILOS ────────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;background:#EFF9F7;color:#0A1A19}

    :root{
      --teal:#0D9488;--teal-dark:#0F766E;--teal-mid:#0a6b63;
      --teal-soft:#e0f5f2;--teal-border:rgba(13,148,136,0.18);
      --teal-border-mid:rgba(13,148,136,0.28);
      --text:#0A1A19;--text2:#1D5954;--text3:#5BA3A0;
      --surface:#FFFFFF;--bg:#EFF9F7;
      --shadow:0 8px 32px rgba(13,148,136,0.12);
      --shadow-lg:0 16px 48px rgba(13,148,136,0.18);
      --r:22px;--r-sm:14px;
    }

    .page{
      min-height:100dvh;background:var(--bg);
      background-image:
        radial-gradient(ellipse 90% 55% at 50% -5%, rgba(13,148,136,0.10) 0%, transparent 65%),
        radial-gradient(ellipse 50% 35% at 90% 95%, rgba(94,234,212,0.06) 0%, transparent 55%);
      padding-bottom:80px;
      opacity:0;transition:opacity .45s ease;
    }
    .page.vis{opacity:1}
    .page.destroying{animation:shatter .6s ease forwards;}
    @keyframes shatter{
      0%{opacity:1;transform:scale(1) rotate(0deg)}
      30%{opacity:1;transform:scale(1.04) rotate(-.5deg)}
      60%{opacity:.5;transform:scale(.95) rotate(.5deg)}
      100%{opacity:0;transform:scale(.8) rotate(-1deg)}
    }

    /* Topbar */
    .topbar{
      display:flex;align-items:center;gap:10px;
      padding:12px 16px;
      background:rgba(239,249,247,0.96);
      backdrop-filter:blur(18px);
      border-bottom:1px solid var(--teal-border);
      position:sticky;top:0;z-index:20;
      justify-content:space-between;
    }
    .topbar-left{display:flex;align-items:center;gap:10px}
    .topbar-texts{display:flex;flex-direction:column;gap:1px}
    .topbar-name{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--teal);letter-spacing:-.3px;line-height:1}
    .topbar-sub{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px}

    /* Botón dashboard */
    .btn-dashboard{
      display:flex;align-items:center;gap:6px;
      background:var(--surface);color:var(--text2);
      border:1.5px solid var(--teal-border-mid);border-radius:10px;
      padding:7px 12px;font-size:11px;font-weight:700;
      text-decoration:none;cursor:pointer;
      transition:all .18s;font-family:'DM Sans',sans-serif;
      white-space:nowrap;
    }
    .btn-dashboard:hover{background:var(--teal-soft);color:var(--teal);border-color:var(--teal)}

    /* Wrap */
    .wrap{max-width:430px;margin:0 auto;padding:22px 16px;display:flex;flex-direction:column;gap:18px}

    /* TARJETA INVITACIÓN */
    .inv-card{
      background:var(--surface);border-radius:var(--r);
      border:1px solid var(--teal-border-mid);
      box-shadow:var(--shadow-lg);overflow:hidden;
      animation:riseUp .55s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes riseUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}

    .inv-hero{
      background:linear-gradient(135deg,var(--teal) 0%,var(--teal-dark) 100%);
      padding:32px 24px 28px;text-align:center;
      position:relative;overflow:hidden;
    }
    .inv-hero::before{
      content:'';position:absolute;inset:0;
      background-image:radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px);
      background-size:22px 22px;
    }
    .inv-tipo-badge{
      display:inline-block;background:rgba(255,255,255,0.18);
      border:1px solid rgba(255,255,255,0.28);border-radius:99px;
      padding:5px 14px;font-size:11px;font-weight:700;
      color:rgba(255,255,255,0.9);letter-spacing:.6px;text-transform:uppercase;
      margin-bottom:16px;position:relative;z-index:1;
    }
    .inv-saludo{
      position:relative;z-index:1;font-family:'Playfair Display',serif;
      font-size:30px;font-weight:700;color:#fff;letter-spacing:-.5px;line-height:1.15;margin-bottom:6px;
    }
    .inv-anfitrion{position:relative;z-index:1;font-size:13px;color:rgba(255,255,255,0.78);font-weight:500;margin-bottom:22px}
    .inv-evento-nombre{
      position:relative;z-index:1;
      background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.28);
      border-radius:var(--r-sm);padding:13px 18px;
      font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;
    }

    .inv-body{padding:20px 22px}
    .detalles{
      display:flex;flex-direction:column;gap:11px;
      background:var(--teal-soft);border:1px solid var(--teal-border-mid);
      border-radius:var(--r-sm);padding:16px 18px;margin-bottom:18px;
    }
    .detalle-fila{display:flex;align-items:center;gap:12px}
    .detalle-icono{
      width:32px;height:32px;border-radius:9px;background:var(--teal);
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .detalle-texto{font-size:13px;color:var(--text2);font-weight:500;text-transform:capitalize;line-height:1.3}
    .detalle-label{font-size:10px;color:var(--text3);font-weight:700;letter-spacing:.4px;text-transform:uppercase}

    /* Decisión */
    .pregunta{text-align:center;font-size:15px;font-weight:700;color:var(--text2);padding:4px 0}
    .grid-decision{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .btn-si{
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      color:#fff;border:none;border-radius:var(--r-sm);
      padding:16px 12px;font-size:14px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(13,148,136,0.35);
      transition:transform .18s,box-shadow .18s;
    }
    .btn-si:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(13,148,136,0.44)}
    .btn-si:active{transform:scale(.97)}
    .btn-si:disabled{opacity:.65;cursor:wait}
    .btn-no{
      background:var(--surface);color:var(--text2);
      border:1.5px solid var(--teal-border-mid);border-radius:var(--r-sm);
      padding:16px 12px;font-size:13px;font-weight:700;
      font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .18s;
    }
    .btn-no:hover{background:#fef2f2;color:#dc2626;border-color:#fca5a5}

    /* Formulario personas */
    .form-card{
      background:var(--surface);border-radius:var(--r);
      border:1px solid var(--teal-border-mid);box-shadow:var(--shadow);
      padding:26px 22px;animation:riseUp .45s cubic-bezier(.22,1,.36,1) both;
    }
    .form-titulo{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--teal);letter-spacing:-.3px}
    .form-sub{font-size:12px;color:var(--text3);font-weight:600;margin-top:3px 0 22px;text-transform:uppercase;letter-spacing:.4px}
    .campo-label{font-size:11px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:.6px;margin:16px 0 10px;display:block}
    .counter-row{display:flex;align-items:center;gap:16px;padding:2px 0}
    .cnt-btn{
      width:44px;height:44px;border-radius:50%;
      border:2px solid var(--teal-border-mid);background:var(--teal-soft);
      color:var(--teal);font-size:22px;font-weight:700;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:all .15s;user-select:none;line-height:1;
    }
    .cnt-btn:hover{background:rgba(13,148,136,0.15);border-color:var(--teal)}
    .cnt-val{font-size:32px;font-weight:800;color:var(--text);min-width:44px;text-align:center;font-variant-numeric:tabular-nums}
    .btn-confirmar-final{
      width:100%;margin-top:18px;
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      color:#fff;border:none;border-radius:var(--r-sm);
      padding:16px;font-size:15px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(13,148,136,0.34);
      transition:transform .18s,box-shadow .18s;
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .btn-confirmar-final:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(13,148,136,0.44)}
    .btn-confirmar-final:disabled{opacity:.65;cursor:wait}
    .spinner{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:spin .7s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* Confirmado */
    .conf-card{
      background:var(--surface);border-radius:var(--r);
      border:1px solid var(--teal-border-mid);box-shadow:var(--shadow-lg);
      overflow:hidden;animation:riseUp .5s cubic-bezier(.22,1,.36,1) both;
    }
    .conf-hero{
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      padding:32px 22px 26px;text-align:center;position:relative;overflow:hidden;
    }
    .conf-hero::before{
      content:'';position:absolute;inset:0;
      background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);
      background-size:22px 22px;
    }
    .conf-check{
      position:relative;z-index:1;width:68px;height:68px;border-radius:50%;
      background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.36);
      display:flex;align-items:center;justify-content:center;margin:0 auto 16px;
      animation:popIn .5s .1s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes popIn{from{transform:scale(0)}to{transform:scale(1)}}
    .conf-titulo{position:relative;z-index:1;font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#fff;letter-spacing:-.4px;margin-bottom:6px}
    .conf-sub{position:relative;z-index:1;font-size:13px;color:rgba(255,255,255,0.8);font-weight:500}
    .conf-body{padding:20px 22px;display:flex;flex-direction:column;gap:14px}

    .num-badge{
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      border-radius:var(--r-sm);padding:14px 18px;
      display:flex;align-items:center;gap:14px;
      box-shadow:0 4px 14px rgba(13,148,136,0.26);
    }
    .num-icono{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .num-label{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,0.75)}
    .num-val{font-size:26px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1}

    .resumen{
      background:var(--teal-soft);border:1px solid var(--teal-border-mid);
      border-radius:var(--r-sm);padding:15px 17px;
      display:flex;flex-direction:column;gap:10px;
    }
    .res-fila{display:flex;align-items:center;gap:10px}
    .res-icono{width:30px;height:30px;border-radius:9px;background:rgba(13,148,136,0.12);border:1px solid var(--teal-border-mid);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .res-texto{font-size:13px;color:var(--text2);font-weight:500;text-transform:capitalize}

    .acciones-titulo{font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px}
    .grid-acciones{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .btn-accion{
      background:var(--surface);border:1.5px solid var(--teal-border-mid);
      border-radius:var(--r-sm);padding:15px 12px;
      display:flex;flex-direction:column;align-items:center;gap:8px;
      cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;
    }
    .btn-accion:hover{background:var(--teal-soft);border-color:var(--teal);transform:translateY(-2px);box-shadow:0 4px 14px rgba(13,148,136,0.14)}
    .btn-accion-icono{width:42px;height:42px;border-radius:12px;background:var(--teal-soft);border:1px solid var(--teal-border-mid);display:flex;align-items:center;justify-content:center}
    .btn-accion-label{font-size:12px;font-weight:700;color:var(--text2);text-align:center;line-height:1.3}
    .btn-accion-full{
      width:100%;background:var(--surface);
      border:1.5px solid var(--teal-border-mid);border-radius:var(--r-sm);
      padding:14px 18px;display:flex;align-items:center;gap:12px;
      cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;
    }
    .btn-accion-full:hover{background:var(--teal-soft);border-color:var(--teal);box-shadow:0 3px 12px rgba(13,148,136,0.12)}

    /* Botón WhatsApp - especial */
    .btn-wa-especial{
      width:100%;
      background:linear-gradient(135deg,#25D366,#128C7E);
      color:#fff;border:none;border-radius:var(--r-sm);
      padding:16px;font-size:15px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(37,211,102,0.35);
      transition:transform .18s,box-shadow .18s;
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .btn-wa-especial:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(37,211,102,0.44)}

    .btn-cerrar{
      width:100%;
      background:linear-gradient(135deg,var(--teal),var(--teal-dark));
      color:#fff;border:none;border-radius:var(--r-sm);
      padding:16px;font-size:15px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(13,148,136,0.34);
      transition:transform .18s,box-shadow .18s;
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .btn-cerrar:hover{transform:translateY(-1px);box-shadow:0 8px 26px rgba(13,148,136,0.42)}

    /* Rechazado */
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
      min-height:100dvh;background:var(--bg);
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
    }
    .loading-spinner{width:38px;height:38px;border-radius:50%;border:3px solid rgba(13,148,136,0.15);border-top-color:#0D9488;animation:spin .75s linear infinite}

    /* Canvas confeti */
    canvas#confetti-canvas{position:fixed;inset:0;z-index:9999;width:100%;height:100%;display:none;pointer-events:none}

    /* ══ MODAL TARJETA WHATSAPP ══ */
    .wa-overlay{
      position:fixed;inset:0;z-index:9000;
      background:rgba(10,26,25,0.55);
      backdrop-filter:blur(8px);
      display:flex;align-items:flex-end;justify-content:center;
      padding:0 0 env(safe-area-inset-bottom,0px);
      animation:fadeOverlay .22s ease;
    }
    @keyframes fadeOverlay{from{opacity:0}to{opacity:1}}
    .wa-sheet{
      width:100%;max-width:430px;
      background:#fff;border-radius:28px 28px 0 0;
      padding:28px 20px 32px;
      box-shadow:0 -10px 60px rgba(13,148,136,0.18);
      animation:slideSheet .32s cubic-bezier(.22,1,.36,1);
    }
    @keyframes slideSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}

    /* Tarjeta visual */
    .wa-card{
      background:linear-gradient(145deg,#0F766E 0%,#0D9488 55%,#0a8579 100%);
      border-radius:20px;padding:22px 20px 20px;margin-bottom:18px;
      position:relative;overflow:hidden;
      box-shadow:0 8px 32px rgba(13,148,136,0.30);
    }
    .wa-card::before{
      content:'';position:absolute;inset:0;
      background-image:radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px);
      background-size:20px 20px;
    }
    .wa-card-header{display:flex;align-items:center;gap:12px;margin-bottom:16px;position:relative;z-index:1}
    .wa-avatar{
      width:52px;height:52px;border-radius:50%;
      border:3px solid rgba(255,255,255,0.4);
      background:rgba(255,255,255,0.18);
      display:flex;align-items:center;justify-content:center;
      overflow:hidden;flex-shrink:0;
    }
    .wa-avatar img{width:100%;height:100%;object-fit:cover}
    .wa-avatar-placeholder{font-size:22px;font-weight:800;color:white}
    .wa-card-title{color:rgba(255,255,255,0.82);font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px}
    .wa-card-evento{color:#fff;font-family:'Playfair Display',serif;font-size:17px;font-weight:700;line-height:1.2;letter-spacing:-.2px}
    .wa-card-body{position:relative;z-index:1}
    .wa-invitado-nombre{
      color:#fff;font-family:'Playfair Display',serif;font-size:22px;font-weight:700;
      margin-bottom:4px;letter-spacing:-.3px;
    }
    .wa-info-row{display:flex;flex-direction:column;gap:5px;margin-top:10px}
    .wa-info-item{display:flex;align-items:center;gap:7px;color:rgba(255,255,255,0.82);font-size:12px;font-weight:500}
    .wa-footer{
      position:relative;z-index:1;
      display:flex;align-items:center;justify-content:space-between;
      margin-top:16px;padding-top:12px;
      border-top:1px solid rgba(255,255,255,0.18);
    }
    .wa-badge{
      background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.25);
      border-radius:99px;padding:4px 12px;
      font-size:10px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:.4px;text-transform:uppercase;
    }
    .wa-logo{opacity:.7}

    /* Botones de tarjeta */
    .wa-btns{display:flex;flex-direction:column;gap:9px}
    .wa-btn-confirmar{
      width:100%;background:linear-gradient(135deg,#25D366,#128C7E);
      color:#fff;border:none;border-radius:14px;
      padding:15px;font-size:14px;font-weight:800;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      box-shadow:0 5px 18px rgba(37,211,102,0.32);
      display:flex;align-items:center;justify-content:center;gap:9px;
      transition:transform .18s,box-shadow .18s;
    }
    .wa-btn-confirmar:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(37,211,102,0.44)}
    .wa-btn-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .wa-btn-sec{
      background:var(--teal-soft);color:var(--teal-dark);
      border:1.5px solid var(--teal-border-mid);border-radius:14px;
      padding:13px 10px;font-size:12.5px;font-weight:700;
      font-family:'DM Sans',sans-serif;cursor:pointer;
      display:flex;align-items:center;justify-content:center;gap:7px;
      transition:all .18s;
    }
    .wa-btn-sec:hover{background:var(--teal-soft);border-color:var(--teal);transform:translateY(-1px)}
    .wa-cancelar{
      width:100%;background:transparent;color:var(--text3);
      border:none;padding:10px;font-size:13px;font-weight:600;
      cursor:pointer;font-family:'DM Sans',sans-serif;
    }
    .wa-sheet-title{font-size:14px;font-weight:800;color:var(--text2);margin-bottom:14px;text-align:center}
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
      stroke="#0D9488"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="12" cy="16" r="1.5" fill="#0D9488" />
    </svg>
  );
  const CamSvg = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0D9488"
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
      stroke="#0D9488"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
  const WaSvg = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
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
      stroke="#0D9488"
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
  const CamCardSvg = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
  const WishCardSvg = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
  const BackSvg = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
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
              color: "#0D9488",
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

      {/* ══ MODAL TARJETA WHATSAPP ══ */}
      {mostrarTarjetaWA && (
        <div
          className="wa-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarTarjetaWA()}
        >
          <div className="wa-sheet">
            <p className="wa-sheet-title">Compartir invitación por WhatsApp</p>

            {/* Tarjeta Visual */}
            <div className="wa-card">
              <div className="wa-card-header">
                <div className="wa-avatar">
                  {evento.imagen_url ? (
                    <img src={evento.imagen_url} alt="" />
                  ) : (
                    <span className="wa-avatar-placeholder">
                      {evento.anfitriones?.charAt(0) || "E"}
                    </span>
                  )}
                </div>
                <div>
                  <div className="wa-card-title">Invitación de</div>
                  <div className="wa-card-evento">{evento.anfitriones}</div>
                </div>
              </div>

              <div className="wa-card-body">
                <div
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 12,
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  Para:
                </div>
                <div className="wa-invitado-nombre">{invitado.nombre} ✨</div>
                <div className="wa-info-row">
                  {evento.fecha && (
                    <div className="wa-info-item">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {fechaCorta}
                    </div>
                  )}
                  {evento.lugar && (
                    <div className="wa-info-item">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {evento.lugar}
                    </div>
                  )}
                </div>
                <div className="wa-footer">
                  <span className="wa-badge">{tipoLabel}</span>
                  <span className="wa-logo">
                    <AppLogo size={22} />
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Botones */}
            <div className="wa-btns">
              {/* Botón 1: Confirmar asistencia (va a WhatsApp) */}
              <button className="wa-btn-confirmar" onClick={irWhatsApp}>
                <WaSvg size={18} />
                Confirmar asistencia
              </button>

              {/* Botones 2 y 3 en grid */}
              <div className="wa-btn-grid">
                <button
                  className="wa-btn-sec"
                  onClick={() => {
                    cerrarTarjetaWA();
                    if (invitado && evento)
                      window.location.href = `/muro/${invitado.evento_id}?token=${invitado.token}&tab=fotos`;
                  }}
                >
                  <CamCardSvg />
                  Publicar foto
                </button>
                <button
                  className="wa-btn-sec"
                  onClick={() => {
                    cerrarTarjetaWA();
                    if (invitado && evento)
                      window.location.href = `/muro/${invitado.evento_id}?token=${invitado.token}&tab=deseos`;
                  }}
                >
                  <WishCardSvg />
                  Publicar deseo
                </button>
              </div>

              <button className="wa-cancelar" onClick={cerrarTarjetaWA}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`page${mounted ? " vis" : ""}${destroying ? " destroying" : ""}`}
      >
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <AppLogo size={30} />
            <div className="topbar-texts">
              <div className="topbar-name">Eventix</div>
              <div className="topbar-sub">Invitaciones digitales</div>
            </div>
          </div>
          <a href="/dashboard" className="btn-dashboard">
            <BackSvg /> Dashboard
          </a>
        </div>

        {/* ─── PASO: VISTA ─── */}
        {step === "vista" && (
          <div className="wrap">
            <div className="inv-card">
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

        {/* ─── PASO: FORM ─── */}
        {step === "form" && (
          <div className="wrap">
            <div className="form-card">
              <div className="form-titulo">¡Qué alegría!</div>
              <div className="form-sub">Un dato más para confirmar</div>
              <span className="campo-label">¿Cuántas personas asistirán?</span>
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
                  onClick={() => setNumPersonas(Math.min(20, numPersonas + 1))}
                >
                  +
                </button>
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

        {/* ─── PASO: CONFIRMADO ─── */}
        {step === "confirmado" && (
          <div className="wrap">
            <div className="conf-card">
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
                <div className="resumen">
                  {fechaCorta && (
                    <div className="res-fila">
                      <div className="res-icono">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#0D9488"
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
                          stroke="#0D9488"
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
                          stroke="#0D9488"
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

                {/* Google Calendar */}
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
                      stroke="#0D9488"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                )}

                {/* Botón WhatsApp → abre tarjeta visual */}
                <button
                  className="btn-wa-especial"
                  onClick={abrirTarjetaWhatsApp}
                >
                  <WaSvg size={18} />
                  Compartir por WhatsApp
                </button>

                {/* Cerrar ventana */}
                <button className="btn-cerrar" onClick={confirmarYCerrar}>
                  Listo, cerrar esta ventana
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PASO: RECHAZADO ─── */}
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
                Cerrar ventana
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

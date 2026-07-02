"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { AppLogo } from "@/app/components/AppLogo";

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type Foto = {
  id: string;
  url: string;
  created_at: string;
  invitado_id: string;
  caption: string | null;
  invitados: { nombre: string } | null;
};
type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  anfitriones: string;
  organizador_id: string;
  imagen_url?: string | null;
  frase_evento?: string | null;
  lugar?: string;
  muro_abierto?: boolean;
};
type Deseo = {
  id: string;
  evento_id: string;
  invitado_id: string | null;
  nombre_autor: string;
  mensaje: string;
  emoji_sticker: string;
  color_fondo: string;
  created_at: string;
  aprobado: boolean;
  audio_url?: string | null;
};

// ─── i18n ──────────────────────────────────────────────────────────────────────
const T = {
  es: {
    cargando: "Cargando muro...",
    eventoNoEncontrado: "Evento no encontrado",
    atras: "Atrás",
    dashboard: "Dashboard",
    fotos: "Fotos",
    albumes: "Álbumes",
    deseos: "Deseos",
    libro: "Libro",
    sinFotos: "Aún no hay fotos",
    sinFotosSub: "Sé el primero en compartir un momento",
    sinFotos2: "Los invitados pueden subir sus fotos",
    sinAlbumes: "Sin álbumes aún",
    sinAlbumesSub: "Las fotos de cada invitado aparecerán aquí",
    sinDeseos: "Aún no hay deseos",
    sinDeseosSub: "¡Sé el primero en dejar un mensaje!",
    sinDeseosSub2: "Sube tu foto primero, luego podrás dejar tu deseo",
    sinDeseosSub3: "Los invitados pueden escribir sus deseos",
    participantes: "participantes",
    paso3: "Paso 3: Comparte tu foto del evento",
    paso4: "Paso 4: Escribe tu deseo al anfitrión",
    completaste: "¡Completaste tu journey! Gracias,",
    modoOrganizador: "Modo organizador — puedes eliminar publicaciones",
    cerrar: "Cerrar",
    eliminar: "Eliminar",
    bendiciones: "Bendiciones",
    conAmor: "Con amor",
    felicidades: "Felicidades",
    comparteMomento: "Comparte un momento",
    yaCompartiste: "Ya compartiste tu foto",
    solamente1: "Solo 1 foto por invitado",
    selFoto: "Seleccionar foto",
    cambiarFoto: "Cambiar foto",
    descOpcional: "Añade una descripción (opcional)",
    publicarMuro: "Publicar en el muro",
    subiendo: "Subiendo...",
    tuFoto: "Tu foto ya está en el muro",
    tuFotoSub: "Ahora puedes dejar tu deseo en la sección de Deseos",
    escribirDeseo: "Escribir un deseo",
    tuDeseoPub: "Tu deseo ya fue enviado",
    solo1Deseo: "Solo se permite 1 deseo por invitado",
    tuMensaje: "Tu mensaje aparecerá en el muro",
    tuDeseoMuro: "Tu deseo ya está en el muro",
    graciasMsg: "Gracias por compartir tu mensaje especial",
    primeroFoto: "Primero sube tu foto",
    primeroFotoSub:
      "Para dejar un deseo, primero debes compartir tu foto del evento.",
    irFoto: "Ir a subir mi foto",
    tuMensajeLbl: "Tu mensaje *",
    escribeDeseo: "Escribe tu deseo, dedicatoria o mensaje especial...",
    elige: "Elige un sticker",
    colorTarjeta: "Color de tarjeta",
    publicarDeseo: "Publicar deseo",
    publicando: "Publicando...",
    deseosYDedicatorias: "Deseos & Dedicatorias",
    mensajesAmor: "Mensajes de amor y buenos deseos",
    deseoEnviado: "Deseo enviado",
    subeFoto: "Sube tu foto primero",
    escribirDeseoBtn: "Escribir deseo",
    verMuro: "Ver muro",
    subirMiFoto: "📸 Mi foto",
    miDeseo: "💌 Mi deseo",
    eliminarFoto: "¿Eliminar esta foto del muro?",
    eliminarDeseo: "¿Eliminar este deseo?",
    foto_s: "foto(s)",
    descargar: "Descargar",
    descargarDeseos: "Descargar deseos",
    descargarFotos: "Descargar fotos",
    descargarTodo: "Descargar todo",
    descargando: "Descargando...",
  },
  en: {
    cargando: "Loading wall...",
    eventoNoEncontrado: "Event not found",
    atras: "Back",
    dashboard: "Dashboard",
    fotos: "Photos",
    albumes: "Albums",
    deseos: "Wishes",
    libro: "Book",
    sinFotos: "No photos yet",
    sinFotosSub: "Be the first to share a moment",
    sinFotos2: "Guests can upload their photos",
    sinAlbumes: "No albums yet",
    sinAlbumesSub: "Each guest's photos will appear here",
    sinDeseos: "No wishes yet",
    sinDeseosSub: "Be the first to leave a message!",
    sinDeseosSub2: "Upload your photo first, then you can leave a wish",
    sinDeseosSub3: "Guests can write their wishes",
    participantes: "participants",
    paso3: "Step 3: Share your event photo",
    paso4: "Step 4: Write your wish to the host",
    completaste: "Journey complete! Thank you,",
    modoOrganizador: "Organizer mode — you can delete posts",
    cerrar: "Close",
    eliminar: "Delete",
    bendiciones: "Blessings",
    conAmor: "With love",
    felicidades: "Congratulations",
    comparteMomento: "Share a moment",
    yaCompartiste: "You already shared your photo",
    solamente1: "Only 1 photo per guest",
    selFoto: "Select photo",
    cambiarFoto: "Change photo",
    descOpcional: "Add a description (optional)",
    publicarMuro: "Post to wall",
    subiendo: "Uploading...",
    tuFoto: "Your photo is on the wall",
    tuFotoSub: "Now you can leave your wish in the Wishes section",
    escribirDeseo: "Write a wish",
    tuDeseoPub: "Your wish was sent",
    solo1Deseo: "Only 1 wish per guest",
    tuMensaje: "Your message will appear on the wall",
    tuDeseoMuro: "Your wish is on the wall",
    graciasMsg: "Thanks for sharing your special message",
    primeroFoto: "Upload your photo first",
    primeroFotoSub: "To leave a wish, you must first share your event photo.",
    irFoto: "Go upload my photo",
    tuMensajeLbl: "Your message *",
    escribeDeseo: "Write your wish, dedication or special message...",
    elige: "Choose a sticker",
    colorTarjeta: "Card color",
    publicarDeseo: "Publish wish",
    publicando: "Publishing...",
    deseosYDedicatorias: "Wishes & Dedications",
    mensajesAmor: "Messages of love and good wishes",
    deseoEnviado: "Wish sent",
    subeFoto: "Upload photo first",
    escribirDeseoBtn: "Write a wish",
    verMuro: "View wall",
    subirMiFoto: "📸 My photo",
    miDeseo: "💌 My wish",
    eliminarFoto: "Delete this photo from the wall?",
    eliminarDeseo: "Delete this wish?",
    foto_s: "photo(s)",
    descargar: "Download",
    descargarDeseos: "Download wishes",
    descargarFotos: "Download photos",
    descargarTodo: "Download all",
    descargando: "Downloading...",
  },
};

// ─── Constantes ────────────────────────────────────────────────────────────────
const COLORES_DESEO = [
  "#e8f8f5",
  "#fff9c4",
  "#fce4ec",
  "#E0E7FF",
  "#e3f2fd",
  "#f3e5f5",
  "#fff3e0",
  "#fbe9e7",
];
const STICKERS = ["🌸", "💖", "✨", "🌟", "🎊", "🦋", "🌹", "💫", "🎀", "🍀"];
const TIPO_EMOJI: Record<string, string> = {
  quinceañera: "👑",
  boda: "💍",
  graduacion: "🎓",
  cumpleaños: "🎂",
  otro: "✨",
};

// AppLogo viene del componente compartido — importado arriba

// ─── Íconos ────────────────────────────────────────────────────────────────────
const Ico = {
  camera: (s = 20, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  grid: (s = 18, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  folder: (s = 18, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  book: (s = 18, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  heart: (s = 18, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  x: (s = 18, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  chevL: (s = 20, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevR: (s = 20, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  trash: (s = 18, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  ),
  lock: (s = 15, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  check: (s = 15, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  download: (s = 16, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  wall: (s = 16, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  ),
  dashboard: (s = 16, c = "currentColor") => (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  nombre,
  size = 28,
  bg,
}: {
  nombre: string;
  size?: number;
  bg: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "2px solid rgba(255,255,255,0.6)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      }}
    >
      <span
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: size * 0.38,
          lineHeight: 1,
        }}
      >
        {(nombre ?? "?").charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

// ─── Helper descarga ───────────────────────────────────────────────────────────
async function descargarImagen(url: string, nombre: string) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
}

function descargarDeseosTxt(deseos: Deseo[], nombreEvento: string) {
  const lineas = deseos.map(
    (d) =>
      `${d.nombre_autor}\n"${d.mensaje}"\n${new Date(d.created_at).toLocaleDateString("es-ES")}\n`,
  );
  const contenido = `${nombreEvento}\nDeseos y dedicatorias\n${"─".repeat(40)}\n\n${lineas.join("\n")}`;
  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `deseos_${nombreEvento.replace(/\s/g, "_")}.txt`;
  a.click();
}

// Adornos decorativos que varían por foto
const FOTO_ADORNOS = ["✨", "💫", "🌟", "🎊", "💖", "🌸", "🎉", "🌈"];
const FOTO_TAPE_COLORS = [
  "rgba(79,70,229,0.18)",
  "rgba(99,102,241,0.16)",
  "rgba(139,92,246,0.15)",
  "rgba(16,185,129,0.14)",
  "rgba(245,158,11,0.14)",
  "rgba(236,72,153,0.14)",
];

// ─── Tiempo relativo ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Justo ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff/3600)}h`;
  if (diff < 604800) return `Hace ${Math.floor(diff/86400)} días`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day:"numeric", month:"short" });
}

// ─── FotoCard con reacciones y comentarios ────────────────────────────────────
const REACCIONES = [
  {
    key: "chivo", label: "¡Qué chivo!",
    icon: (active: boolean) => (
      <svg width="16" height="16" viewBox="0 0 20 20" fill={active?"#F59E0B":"none"} stroke={active?"#F59E0B":"currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l1.8 5.5H18l-4.9 3.5 1.9 5.7L10 13.2l-5 3.5 1.9-5.7L2 7.5h6.2z"/>
      </svg>
    ),
    activeColor: "#F59E0B",
  },
  {
    key: "lujo", label: "Foto de lujo",
    icon: (active: boolean) => (
      <svg width="16" height="16" viewBox="0 0 20 20" fill={active?"#6366F1":"none"} stroke={active?"#6366F1":"currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l2 4 4.5.5-3.3 3 .8 4.5L10 12l-4 2 .8-4.5L3.5 6.5 8 6z"/>
      </svg>
    ),
    activeColor: "#6366F1",
  },
  {
    key: "amor", label: "Me encanta",
    icon: (active: boolean) => (
      <svg width="16" height="16" viewBox="0 0 20 20" fill={active?"#EF4444":"none"} stroke={active?"#EF4444":"currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 17s-7-4.5-7-9a4 4 0 018 0 4 4 0 018 0c0 4.5-7 9-7 9z"/>
      </svg>
    ),
    activeColor: "#EF4444",
  },
];

function FotoCard({
  foto, acento, esOrg, onDelete, onClick, t, idx = 0, nombreInvitado = "",
}: {
  foto: Foto; acento: string; esOrg: boolean;
  onDelete: (id: string) => void; onClick: () => void;
  t: (typeof T)["es"]; idx?: number; nombreInvitado?: string;
}) {
  const nombre = foto.invitados?.nombre ?? "Invitado";
  const [reacciones, setReacciones] = useState<Record<string, string[]>>({ chivo:[], lujo:[], amor:[] });
  const [miReaccion, setMiReaccion] = useState<string|null>(null);
  const [comentarios, setComentarios] = useState<{nombre:string;texto:string;ts:string}[]>([]);
  const [showComentarios, setShowComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");

  function toggleReaccion(key: string) {
    const nombreReactor = nombreInvitado || "Invitado";
    setReacciones(prev => {
      const nueva = { ...prev };
      if (miReaccion === key) {
        nueva[key] = nueva[key].filter(n => n !== nombreReactor);
        setMiReaccion(null);
      } else {
        if (miReaccion) nueva[miReaccion] = nueva[miReaccion].filter(n => n !== nombreReactor);
        nueva[key] = [...(nueva[key]||[]), nombreReactor];
        setMiReaccion(key);
      }
      return nueva;
    });
  }

  function enviarComentario() {
    if (!nuevoComentario.trim()) return;
    setComentarios(prev => [...prev, { nombre: nombreInvitado||"Invitado", texto: nuevoComentario.trim(), ts: new Date().toISOString() }]);
    setNuevoComentario("");
  }

  const tapeColor = FOTO_TAPE_COLORS[idx % FOTO_TAPE_COLORS.length];
  const tapeRot = (idx % 2 === 0 ? -1 : 1) * (6 + (idx % 3) * 3);

  return (
    <div style={{ background:"white", borderRadius:18, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.10)", border:"1px solid rgba(0,0,0,0.06)", marginBottom:0 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px 10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <Avatar nombre={nombre} size={36} bg={acento}/>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#0F172A" }}>{nombre}</div>
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:1 }}>
              {foto.created_at ? timeAgo(foto.created_at) : ""}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={(e)=>{ e.stopPropagation(); descargarImagen(foto.url,`foto_${foto.id}.jpg`); }}
            style={{ background:"#F1F5F9", border:"none", borderRadius:99, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {Ico.download(13, "#64748B")}
          </button>
          {esOrg && (
            <button onClick={(e)=>{ e.stopPropagation(); onDelete(foto.id); }}
              style={{ background:"#FEE2E2", border:"none", borderRadius:99, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {Ico.trash(13,"#DC2626")}
            </button>
          )}
        </div>
      </div>

      {/* Imagen dinámica */}
      <div onClick={onClick} className="foto-img-wrap" style={{ cursor:"pointer", position:"relative", overflow:"hidden" }}>
        <style>{`.foto-img-wrap:hover .foto-img-inner{transform:scale(1.04) rotate(0.4deg)} .foto-img-inner{transition:transform .4s cubic-bezier(.22,1,.36,1);display:block;width:100%}`}</style>
        <div style={{ position:"absolute", top:8, left:"50%", transform:`translateX(-50%) rotate(${tapeRot}deg)`, width:50, height:16, background:tapeColor, borderRadius:3, zIndex:2, opacity:0.85 }}/>
        <Image src={foto.url} alt="" width={600} height={600} className="foto-img-inner" style={{ width:"100%", height:"auto", display:"block" }} unoptimized/>
        {/* Overlay sutil on hover */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,transparent 60%,rgba(0,0,0,0.18) 100%)", opacity:0, transition:"opacity .3s" }} className="foto-overlay"/>
      </div>

      {/* Caption */}
      {foto.caption && (
        <div style={{ padding:"10px 14px 6px", fontSize:13, color:"#374151", lineHeight:1.5 }}>{foto.caption}</div>
      )}

      {/* Reacciones */}
      <div style={{ padding:"10px 14px 0", display:"flex", gap:6, flexWrap:"wrap" }}>
        {REACCIONES.map(r => {
          const count = reacciones[r.key]?.length ?? 0;
          const activa = miReaccion === r.key;
          return (
            <button key={r.key} onClick={()=>toggleReaccion(r.key)}
              title={reacciones[r.key]?.join(", ")||r.label}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:20,
                border: activa ? `1.5px solid ${r.activeColor}` : "1.5px solid #E2E8F0",
                background: activa ? `${r.activeColor}14` : "#F8FAFC",
                cursor:"pointer", fontSize:12, fontWeight:600,
                color: activa ? r.activeColor : "#64748B",
                transition:"all .18s", transform: activa?"scale(1.06)":"scale(1)" }}>
              {r.icon(activa)}
              <span>{r.label}</span>
              {count > 0 && <span style={{ background: activa?r.activeColor:"#E2E8F0", color: activa?"white":"#64748B", borderRadius:99, padding:"1px 6px", fontSize:10, fontWeight:800 }}>{count}</span>}
            </button>
          );
        })}
        {/* Mostrar nombres de reacciones */}
        {Object.entries(reacciones).some(([,v])=>v.length>0) && (
          <div style={{ width:"100%", fontSize:10, color:"#94A3B8", marginTop:2 }}>
            {REACCIONES.filter(r=>reacciones[r.key]?.length).map(r=>
              `${r.emoji} ${reacciones[r.key].join(", ")}`
            ).join(" · ")}
          </div>
        )}
      </div>

      {/* Botón comentarios */}
      <div style={{ padding:"8px 14px 12px" }}>
        <button onClick={()=>setShowComentarios(!showComentarios)}
          style={{ background:"none", border:"none", fontSize:12, color:"#64748B", cursor:"pointer", fontWeight:600, padding:0 }}>
          💬 {comentarios.length > 0 ? `${comentarios.length} comentario${comentarios.length>1?"s":""}` : "Comentar"}
        </button>
        {showComentarios && (
          <div style={{ marginTop:10 }}>
            {comentarios.map((c,i) => (
              <div key={i} style={{ marginBottom:8, background:"#F8FAFC", borderRadius:10, padding:"8px 10px" }}>
                <div style={{ fontWeight:700, fontSize:12, color:"#0F172A" }}>{c.nombre}</div>
                <div style={{ fontSize:13, color:"#374151", marginTop:2 }}>{c.texto}</div>
                <div style={{ fontSize:10, color:"#94A3B8", marginTop:3 }}>{timeAgo(c.ts)}</div>
              </div>
            ))}
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <input
                value={nuevoComentario}
                onChange={e=>setNuevoComentario(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&enviarComentario()}
                placeholder="Escribir comentario..."
                style={{ flex:1, border:"1.5px solid #E2E8F0", borderRadius:10, padding:"8px 10px", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif" }}
              />
              <button onClick={enviarComentario}
                style={{ background:acento, border:"none", borderRadius:10, padding:"8px 12px", color:"white", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({
  foto,
  acento,
  esOrg,
  onClose,
  onDelete,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  t,
}: {
  foto: Foto;
  acento: string;
  esOrg: boolean;
  onClose: () => void;
  onDelete: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  t: (typeof T)["es"];
}) {
  const nombre = foto.invitados?.nombre ?? "Invitado";
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [hasPrev, hasNext]);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.90)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 22,
          overflow: "hidden",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Image
            src={foto.url}
            alt=""
            width={600}
            height={600}
            className="w-full h-auto object-cover"
            unoptimized
          />
          {hasPrev && (
            <button
              onClick={onPrev}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.94)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Ico.chevL(18, "#4F46E5")}
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.94)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Ico.chevR(18, "#4F46E5")}
            </button>
          )}
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar nombre={nombre} size={36} bg={acento} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
                  {nombre}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af" }}>
                  {new Date(foto.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button
                onClick={() => descargarImagen(foto.url, `foto_${foto.id}.jpg`)}
                title={t.descargar}
                style={{
                  background: "#E0E7FF",
                  color: "#4F46E5",
                  border: "none",
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {Ico.download(15, "#4F46E5")}
              </button>
              {esOrg && (
                <button
                  onClick={onDelete}
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: 10,
                    width: 34,
                    height: 34,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {Ico.trash(14, "#dc2626")}
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "none",
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {Ico.x(15, "#64748b")}
              </button>
            </div>
          </div>
          {foto.caption && (
            <p style={{ fontSize: 13, color: "#4b5563", fontStyle: "italic" }}>
              "{foto.caption}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal subir foto ──────────────────────────────────────────────────────────
function ModalSubirFoto({
  eventoId,
  invitadoId,
  onClose,
  onSubida,
  t,
}: {
  eventoId: string;
  invitadoId: string;
  onClose: () => void;
  onSubida: () => void;
  t: (typeof T)["es"];
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [yaSubio, setYaSubio] = useState(false);

  useEffect(() => {
    supabase
      .from("fotos")
      .select("id")
      .eq("invitado_id", invitadoId)
      .then(({ data }) => {
        if (data && data.length > 0) setYaSubio(true);
      });
  }, [invitadoId]);

  const seleccionar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setPreview(URL.createObjectURL(f));
  };

  const subir = async () => {
    if (!archivo) return;
    setSubiendo(true);
    const ext = archivo.name.split(".").pop();
    const path = `${eventoId}/${invitadoId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("fotos-eventos")
      .upload(path, archivo, { upsert: false });
    if (error) {
      alert("Error al subir. Intenta de nuevo.");
      setSubiendo(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("fotos-eventos")
      .getPublicUrl(path);
    await supabase
      .from("fotos")
      .insert({
        evento_id: eventoId,
        invitado_id: invitadoId,
        url: urlData.publicUrl,
        path,
        caption: caption.trim() || null,
      });
    setSubiendo(false);
    onSubida();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,0.60)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "22px 22px 0 0",
          width: "100%",
          maxWidth: 480,
          padding: "20px 20px 40px",
          boxShadow: "0 -6px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            background: "#CBD5E1",
            margin: "0 auto 18px",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: "#0f2422",
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {yaSubio ? t.yaCompartiste : t.comparteMomento}
            </p>
            {!yaSubio && (
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {t.solamente1}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#E0E7FF",
              border: "none",
              borderRadius: 99,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Ico.x(15, "#4F46E5")}
          </button>
        </div>
        {yaSubio ? (
          <div style={{ textAlign: "center", padding: "22px 0" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#E0E7FF",
                border: "2px solid #E0E7FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              {Ico.check(26, "#4F46E5")}
            </div>
            <p
              style={{
                fontWeight: 700,
                color: "#4F46E5",
                fontSize: 15,
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {t.tuFoto}
            </p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
              {t.tuFotoSub}
            </p>
          </div>
        ) : (
          <>
            {preview ? (
              <div style={{ marginBottom: 12 }}>
                <img
                  src={preview}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    maxHeight: 210,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <button
                  onClick={() => {
                    setPreview(null);
                    setArchivo(null);
                  }}
                  style={{
                    marginTop: 7,
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {Ico.x(12, "#9ca3af")} {t.cambiarFoto}
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  border: "2px dashed #E0E7FF",
                  borderRadius: 16,
                  padding: "28px 16px",
                  cursor: "pointer",
                  background: "#FAFBFF",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "#4F46E5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {Ico.camera(22, "white")}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#4F46E5",
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {t.selFoto}
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8" }}>
                  JPG, PNG · máx 10MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={seleccionar}
                  style={{ display: "none" }}
                />
              </label>
            )}
            {preview && (
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t.descOpcional}
                maxLength={120}
                style={{
                  width: "100%",
                  border: "1.5px solid #E0E7FF",
                  borderRadius: 12,
                  padding: "10px 13px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  background: "#FAFBFF",
                  marginBottom: 12,
                  color: "#0f2422",
                }}
              />
            )}
            {archivo && (
              <button
                onClick={subir}
                disabled={subiendo}
                style={{
                  width: "100%",
                  background: subiendo ? "#E0E7FF" : "#4F46E5",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: subiendo ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {Ico.camera(17, "white")}{" "}
                {subiendo ? t.subiendo : t.publicarMuro}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Modal deseo ───────────────────────────────────────────────────────────────
function ModalDeseo({
  invitadoNombre,
  yaDejoDeseo,
  yaSubioFoto,
  onClose,
  onPublicado,
  onIrAFoto,
  t,
}: {
  invitadoNombre: string;
  yaDejoDeseo: boolean;
  yaSubioFoto: boolean;
  onClose: () => void;
  onPublicado: (d: Partial<Deseo>) => void;
  onIrAFoto: () => void;
  t: (typeof T)["es"];
}) {
  const [mensaje, setMensaje] = useState("");
  const [sticker, setSticker] = useState(STICKERS[0]);
  const [color, setColor] = useState(COLORES_DESEO[0]);
  const [enviando, setEnviando] = useState(false);

  const publicar = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    onPublicado({
      mensaje: mensaje.trim(),
      emoji_sticker: sticker,
      color_fondo: color,
    });
    setEnviando(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,0.60)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "22px 22px 0 0",
          width: "100%",
          maxWidth: 480,
          padding: "20px 20px 40px",
          boxShadow: "0 -6px 32px rgba(0,0,0,0.18)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            background: "#CBD5E1",
            margin: "0 auto 18px",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: "#0f2422",
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {yaDejoDeseo ? t.tuDeseoPub : t.escribirDeseo}
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {yaDejoDeseo ? t.solo1Deseo : t.tuMensaje}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#E0E7FF",
              border: "none",
              borderRadius: 99,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Ico.x(15, "#4F46E5")}
          </button>
        </div>

        {yaDejoDeseo ? (
          <div style={{ textAlign: "center", padding: "22px 0" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#E0E7FF",
                border: "2px solid #E0E7FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              {Ico.heart(26, "#4F46E5")}
            </div>
            <p
              style={{
                fontWeight: 700,
                color: "#4F46E5",
                fontSize: 15,
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {t.tuDeseoMuro}
            </p>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>
              {t.graciasMsg}
            </p>
          </div>
        ) : !yaSubioFoto ? (
          // ── BLOQUE "primero sube tu foto" ──────────────────────────────────
          <div style={{ textAlign: "center", padding: "24px 14px" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#E0E7FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              {Ico.lock(26, "#4F46E5")}
            </div>
            <p
              style={{
                fontWeight: 700,
                color: "#0f2422",
                fontSize: 15,
                fontFamily: "'Playfair Display',serif",
                marginBottom: 7,
              }}
            >
              {t.primeroFoto}
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
              {t.primeroFotoSub}
            </p>
            {/* ── CORRECCIÓN: llama onIrAFoto en lugar de solo onClose ── */}
            <button
              onClick={() => {
                onClose();
                onIrAFoto();
              }}
              style={{
                marginTop: 18,
                background: "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "11px 22px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {t.irFoto}
            </button>
          </div>
        ) : (
          <>
            {/* Preview */}
            <div
              style={{
                background: color,
                borderRadius: 16,
                padding: "15px 13px 11px",
                marginBottom: 16,
                position: "relative",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 13,
                  fontSize: 24,
                }}
              >
                {sticker}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: mensaje ? "#2d3748" : "#cbd5e1",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  minHeight: 38,
                  paddingRight: 18,
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {mensaje ? `"${mensaje}"` : "Tu mensaje aparecerá aquí..."}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 9,
                }}
              >
                <Avatar nombre={invitadoNombre} size={20} bg="#4F46E5" />
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}
                >
                  {invitadoNombre}
                </span>
              </div>
            </div>
            {/* Textarea */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F46E5",
                  display: "block",
                  marginBottom: 5,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {t.tuMensajeLbl}
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder={t.escribeDeseo}
                maxLength={280}
                rows={3}
                style={{
                  width: "100%",
                  border: "1.5px solid #E0E7FF",
                  borderRadius: 12,
                  padding: "11px 13px",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Playfair Display',serif",
                  boxSizing: "border-box",
                  background: "#FAFBFF",
                  resize: "none",
                  lineHeight: 1.6,
                  color: "#0f2422",
                }}
              />
              <p
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 3,
                  textAlign: "right",
                }}
              >
                {mensaje.length}/280
              </p>
            </div>
            {/* Stickers */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F46E5",
                  display: "block",
                  marginBottom: 7,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {t.elige}
              </label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSticker(s)}
                    style={{
                      fontSize: 20,
                      background:
                        sticker === s ? "#E0E7FF" : "rgba(0,0,0,0.03)",
                      border:
                        sticker === s
                          ? "2px solid #E0E7FF"
                          : "2px solid transparent",
                      borderRadius: 9,
                      padding: "3px 7px",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Colores */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4F46E5",
                  display: "block",
                  marginBottom: 7,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {t.colorTarjeta}
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COLORES_DESEO.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c,
                      border:
                        color === c
                          ? "3px solid #4F46E5"
                          : "3px solid transparent",
                      cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
                      transform: color === c ? "scale(1.2)" : "scale(1)",
                      transition: "transform 0.15s",
                    }}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={publicar}
              disabled={enviando || !mensaje.trim()}
              style={{
                width: "100%",
                background: mensaje.trim() ? "#4F46E5" : "#e2e8f0",
                color: mensaje.trim() ? "white" : "#9ca3af",
                border: "none",
                borderRadius: 14,
                padding: "14px",
                fontSize: 15,
                fontWeight: 700,
                cursor: mensaje.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "'Playfair Display',serif",
              }}
            >
              {Ico.heart(17, mensaje.trim() ? "white" : "#9ca3af")}{" "}
              {enviando ? t.publicando : t.publicarDeseo}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── DeseoCard ─────────────────────────────────────────────────────────────────
function DeseoCard({
  deseo,
  esOrg,
  onDelete,
  onDescargar,
}: {
  deseo: Deseo;
  esOrg: boolean;
  onDelete: (id: string) => void;
  onDescargar: (deseo: Deseo) => void;
}) {
  const fecha = new Date(deseo.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
  return (
    <div
      style={{
        background: deseo.color_fondo,
        borderRadius: 18,
        padding: "17px 14px 13px",
        boxShadow: "0 3px 14px rgba(0,0,0,0.06)",
        position: "relative",
        border: "1px solid rgba(255,255,255,0.9)",
        animation: "popIn 0.3s ease",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        breakInside: "avoid",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -11,
          right: 13,
          fontSize: 24,
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.12))",
        }}
      >
        {deseo.emoji_sticker}
      </div>
      <p
        style={{
          fontSize: 13,
          color: "#2d3748",
          lineHeight: 1.65,
          fontStyle: "italic",
          paddingRight: 22,
          fontFamily: "'Playfair Display',serif",
        }}
      >
        "{deseo.mensaje}"
      </p>
      {/* Dedicatoria con voz */}
      {deseo.audio_url && (
        <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: 12, padding: "6px 8px", border: "1px solid rgba(79,70,229,0.15)" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#4F46E5", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
            🎤 Dedicatoria de voz
          </div>
          <audio controls src={deseo.audio_url} preload="none" style={{ width: "100%", height: 32 }} />
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 3,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar nombre={deseo.nombre_autor} size={24} bg="#4F46E5" />
          <div>
            <p style={{ fontWeight: 700, fontSize: 11, color: "#374151" }}>
              {deseo.nombre_autor}
            </p>
            <p style={{ fontSize: 10, color: "#9ca3af" }}>{fecha}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={() => onDescargar(deseo)}
            style={{
              background: "rgba(79, 70, 229,0.12)",
              color: "#4F46E5",
              border: "none",
              borderRadius: 8,
              width: 28,
              height: 28,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Ico.download(13, "#4F46E5")}
          </button>
          {esOrg && (
            <button
              onClick={() => onDelete(deseo.id)}
              style={{
                background: "rgba(220,38,38,0.10)",
                color: "#dc2626",
                border: "none",
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Ico.trash(12, "#dc2626")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tipos Boda Civil ──────────────────────────────────────────────────────────
type BodaCivilMeta = { video_url: string | null; fotos: string[]; nombres: string; reactions?: { nombre: string; ts: number }[] };

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
type Vista = "fotos" | "albumes" | "deseos" | "boda";

export default function MuroPublico() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.evento_id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [deseos, setDeseos] = useState<Deseo[]>([]);
  const [fotoActiva, setFotoActiva] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [esOrg, setEsOrg] = useState(false);
  const [vista, setVista] = useState<Vista>("fotos");
  const [invId, setInvId] = useState<string | null>(null);
  const [invNombre, setInvNombre] = useState("");
  const [modalSubir, setModalSubir] = useState(false);
  const [modalDeseo, setModalDeseo] = useState(false);
  const [yaFoto, setYaFoto] = useState(false);
  const [yaDeseo, setYaDeseo] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
  const [mounted, setMounted] = useState(false);
  const [bodaCivil, setBodaCivil] = useState<BodaCivilMeta | null>(null);
  const [bodaCarruselIdx, setBodaCarruselIdx] = useState(0);
  const [bodaLightbox, setBodaLightbox] = useState<string | null>(null);
  const [bodaConfettiKey, setBodaConfettiKey] = useState(0);
  const [bodaVideoActivo, setBodaVideoActivo] = useState(false);
  const [bodaReactions, setBodaReactions] = useState<{ nombre: string; ts: number }[]>([]);
  const [bodaYaReaccione, setBodaYaReaccione] = useState(false);
  const [bodaEnviandoReaccion, setBodaEnviandoReaccion] = useState(false);
  const [bodaRamoStep, setBodaRamoStep] = useState<"idle"|"nombre"|"estado"|"uniendo"|"espera"|"espera-rifa"|"mensaje"|"casada">("idle");
  const [bodaRamoNombre, setBodaRamoNombre] = useState("");
  const [bodaRamoPreselect, setBodaRamoPreselect] = useState<""|"soltera"|"casada">("");
  const [ramoData, setRamoData] = useState<{ activa: boolean; inicio: number; duracion: number; participantes: { nombre: string; ts: number }[]; ganadora: string | null } | null>(null);
  const [ramoTiempo, setRamoTiempo] = useState(0);
  const [ramoGiro, setRamoGiro] = useState<{ nombre: string; msg: string }>({ nombre: "", msg: "" });
  const ramoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ramoTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ramoGiroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const t = T[lang];

  useEffect(() => {
    setMounted(true);
    const token = new URLSearchParams(window.location.search).get("token");

    // ── Leer tab inicial desde URL ──────────────────────────────────────────
    const tabParam = new URLSearchParams(window.location.search).get(
      "tab",
    ) as Vista | null;
    if (tabParam && ["fotos", "albumes", "deseos", "boda"].includes(tabParam)) {
      setVista(tabParam as Vista);
    }

    if (token) {
      supabase
        .from("invitados")
        .select("id,nombre")
        .eq("token", token)
        .single()
        .then(({ data }) => {
          if (data) {
            setInvId(data.id);
            setInvNombre(data.nombre);
          }
        });
    }
    cargarDatos();
    verificarOrg();

    const cF = supabase
      .channel("muro-f")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fotos",
          filter: `evento_id=eq.${eventoId}`,
        },
        cargarFotos,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "fotos",
          filter: `evento_id=eq.${eventoId}`,
        },
        cargarFotos,
      )
      .subscribe();
    const cD = supabase
      .channel("muro-d")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deseos",
          filter: `evento_id=eq.${eventoId}`,
        },
        cargarDeseos,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(cF);
      supabase.removeChannel(cD);
    };
  }, []);

  useEffect(() => {
    if (invId) verificarJourney(invId);
  }, [invId]);

  async function verificarJourney(id: string) {
    const [{ data: fData }, { data: dData }] = await Promise.all([
      supabase.from("fotos").select("id").eq("invitado_id", id),
      supabase.from("deseos").select("id").eq("invitado_id", id),
    ]);
    if (fData && fData.length > 0) setYaFoto(true);
    if (dData && dData.length > 0) setYaDeseo(true);
  }

  async function verificarOrg() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ev } = await supabase
      .from("eventos")
      .select("organizador_id")
      .eq("id", eventoId)
      .single();
    if (ev && ev.organizador_id === user.id) setEsOrg(true);
  }

  async function cargarDatos() {
    const { data: ev } = await supabase
      .from("eventos")
      .select(
        "id,nombre,tipo,fecha,anfitriones,organizador_id,imagen_url,frase_evento,lugar,muro_abierto",
      )
      .eq("id", eventoId)
      .single();
    if (ev) setEvento(ev);
    await Promise.all([cargarFotos(), cargarDeseos()]);
    // Cargar boda civil si aplica
    if (ev?.tipo === "boda") {
      try {
        const res = await fetch(`/api/boda-civil/${eventoId}`);
        if (res.ok) {
          const data: BodaCivilMeta = await res.json();
          if (data.video_url || data.fotos.length >= 3) {
            setBodaCivil(data);
            setBodaReactions(data.reactions ?? []);
          }
        }
      } catch { /* boda civil no disponible */ }
    }
    setLoading(false);
  }

  async function cargarFotos() {
    const { data } = await supabase
      .from("fotos")
      .select("id,url,created_at,invitado_id,caption,invitados(nombre)")
      .eq("evento_id", eventoId)
      .eq("estado", "aprobada")
      .order("created_at", { ascending: true });
    if (data)
      setFotos(
        data.map((f) => ({
          ...f,
          invitados: Array.isArray(f.invitados)
            ? (f.invitados[0] ?? null)
            : f.invitados,
        })) as Foto[],
      );
  }

  async function cargarDeseos() {
    const { data } = await supabase
      .from("deseos")
      .select("*")
      .eq("evento_id", eventoId)
      .eq("aprobado", true)
      .order("created_at", { ascending: true });
    if (data) setDeseos(data as Deseo[]);
  }

  async function toggleMuro() {
    if (!evento) return;
    const nuevo = evento.muro_abierto === false ? true : false;
    await supabase
      .from("eventos")
      .update({ muro_abierto: nuevo })
      .eq("id", eventoId);
    setEvento({ ...evento, muro_abierto: nuevo });
  }

  async function descargarAlbumPersona(album: { label: string; fotos: Foto[] }) {
    // Genera un ZIP con carpeta nombrada por la persona
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const nombreCarpeta = album.label.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]/g, "").trim() || "Invitado";
    const carpeta = zip.folder(nombreCarpeta)!;

    for (let i = 0; i < album.fotos.length; i++) {
      try {
        const resp = await fetch(album.fotos[i].url);
        const blob = await resp.blob();
        const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
        carpeta.file(`foto_${String(i + 1).padStart(2, "0")}.${ext}`, blob);
      } catch {}
    }

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${nombreCarpeta}_fotos.zip`;
    a.click();
  }

  async function descargarTodasFotosZip() {
    if (albumes.length === 0) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const album of albumes) {
      const nombreCarpeta = album.label.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]/g, "").trim() || "Invitado";
      const carpeta = zip.folder(nombreCarpeta)!;
      for (let i = 0; i < album.fotos.length; i++) {
        try {
          const resp = await fetch(album.fotos[i].url);
          const blob = await resp.blob();
          const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
          carpeta.file(`foto_${String(i + 1).padStart(2, "0")}.${ext}`, blob);
        } catch {}
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${evento?.nombre ?? "evento"}_todas_las_fotos.zip`;
    a.click();
  }

  async function eliminarFoto(id: string) {
    if (!confirm(t.eliminarFoto)) return;
    await supabase.from("fotos").delete().eq("id", id);
    setFotos((prev) => prev.filter((f) => f.id !== id));
    if (fotoActiva !== null) setFotoActiva(null);
  }

  async function eliminarDeseo(id: string) {
    if (!confirm(t.eliminarDeseo)) return;
    await supabase.from("deseos").delete().eq("id", id);
    setDeseos((prev) => prev.filter((d) => d.id !== id));
  }

  async function publicarDeseo(parcial: Partial<Deseo>) {
    if (!invId || !yaFoto) return;
    const nuevo = {
      evento_id: eventoId,
      invitado_id: invId,
      nombre_autor: invNombre || "Anónimo",
      mensaje: parcial.mensaje!,
      emoji_sticker: parcial.emoji_sticker!,
      color_fondo: parcial.color_fondo!,
      aprobado: true,
    };
    const { data } = await supabase
      .from("deseos")
      .insert(nuevo)
      .select()
      .single();
    if (data) {
      setDeseos((prev) => [...prev, data as Deseo]);
      setYaDeseo(true);
    }
    setModalDeseo(false);
  }

  function descargarDeseoIndividual(deseo: Deseo) {
    const texto = `${deseo.nombre_autor}\n"${deseo.mensaje}"\n${new Date(deseo.created_at).toLocaleDateString("es-ES")}`;
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deseo_${deseo.nombre_autor.replace(/\s/g, "_")}.txt`;
    a.click();
  }

  const albumes = (() => {
    const map: Record<string, Foto[]> = {};
    for (const f of fotos) {
      if (!map[f.invitado_id]) map[f.invitado_id] = [];
      map[f.invitado_id].push(f);
    }
    return Object.entries(map).map(([id, fs]) => ({
      id,
      label: fs[0].invitados?.nombre ?? "Invitado",
      fotos: fs,
    })).sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  })();

  const tokenParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : "";
  const pasoJourney = !invId ? null : !yaFoto ? 3 : !yaDeseo ? 4 : 5;

  useEffect(() => {
    if (!evento) return;

    document.title = evento.nombre ? `${evento.nombre} · Evorix` : "Evorix";
  }, [evento]);

  // Confetti al entrar al tab de boda civil
  useEffect(() => {
    if (vista === "boda" && bodaCivil) {
      setBodaConfettiKey(k => k + 1);
      setBodaVideoActivo(false);
    }
  }, [vista, bodaCivil]);

  // ── Ramo: polling + giro + timer ──
  const MSGS_GIRO = [
    "Dios tiene algo hermoso preparado para ti, {n} 🙏",
    "La persona que Dios eligió para ti vale la espera, {n} 💕",
    "Tu tiempo llegará, {n}, Dios tiene planes perfectos ✨",
    "Confía en Dios, {n}, Él nunca llega tarde 🌸",
    "El amor de Dios te guía hacia algo especial, {n} 💫",
    "Dios conoce tu corazón, {n}, y tiene algo bello para ti 🤍",
    "Con fe y paciencia, {n}, lo mejor aún está por venir 🙌",
    "Dios prepara cosas maravillosas para quienes esperan, {n} 🌹",
    "No te preocupes, {n}, Dios ya escribió tu historia de amor 📖",
    "¡Eres bendecida, {n}! El plan de Dios es perfecto para ti 💐",
    "Dios te ama profundamente, {n}, y su timing es perfecto ⏳",
    "Mantén tu fe, {n}, porque Dios está obrando en tu vida 🙏",
    "Eres una mujer de valor, {n}, Proverbios 31 habla de ti 👑",
    "Dios tiene escritas todas tus lágrimas, {n}, y viene la alegría 🕊️",
    "¡Sé paciente, {n}! La espera de Dios siempre vale la pena 🌺",
    "El Señor pelea por ti, {n}, solo necesitas tener fe 💪",
    "Eres amada por Dios con amor eterno, {n} ✝️",
    "No te rindas, {n}, Él que prometió es fiel 🌟",
    "Tu historia de amor está siendo escrita por Dios, {n} 📜",
    "Cuando Dios da, {n}, da en abundancia y en el momento perfecto 🎁",
    "¡Tú vales muchísimo, {n}! Dios tiene a alguien especial para ti 💎",
    "Que tu corazón descanse en Dios, {n}, Él nunca falla 🕊️",
    "La espera con fe es semilla, {n}, pronto verás la cosecha 🌻",
    "Dios te ve, {n}, y tiene planes llenos de esperanza para ti 🌈",
  ];

  function calcGanadoraMuro(participantes: string[], inicio: number): string {
    if (!participantes.length) return "";
    let h = inicio;
    for (const p of participantes) {
      for (let i = 0; i < p.length; i++) { h = (Math.imul(31, h) + p.charCodeAt(i)) | 0; }
    }
    return participantes[Math.abs(h) % participantes.length];
  }

  async function fetchRamo() {
    try {
      const res = await fetch(`/api/boda-civil/${eventoId}`);
      const d = await res.json();
      const ramo = d.ramo ?? null;
      setRamoData(ramo);
      return ramo;
    } catch { return null; }
  }

  useEffect(() => {
    if (vista !== "boda") return;
    fetchRamo();
  }, [vista]);

  useEffect(() => {
    if (!ramoData?.activa) {
      if (ramoIntervalRef.current) { clearInterval(ramoIntervalRef.current); ramoIntervalRef.current = null; }
      if (ramoTickRef.current) { clearInterval(ramoTickRef.current); ramoTickRef.current = null; }
      if (ramoGiroRef.current) { clearInterval(ramoGiroRef.current); ramoGiroRef.current = null; }
      return;
    }
    // Polling
    ramoIntervalRef.current = setInterval(fetchRamo, 4000);
    // Countdown
    ramoTickRef.current = setInterval(() => {
      setRamoData(r => {
        if (!r) return r;
        const t = Math.max(0, r.duracion - Math.floor((Date.now() - r.inicio) / 1000));
        setRamoTiempo(t);
        return r;
      });
    }, 1000);
    // Giro animado
    ramoGiroRef.current = setInterval(() => {
      setRamoData(r => {
        if (!r?.participantes.length) { setRamoGiro({ nombre: "...", msg: "Esperando solteras..." }); return r; }
        const idx = Math.floor(Math.random() * r.participantes.length);
        const n = r.participantes[idx].nombre;
        const msgIdx = Math.floor(Math.random() * MSGS_GIRO.length);
        setRamoGiro({ nombre: n, msg: MSGS_GIRO[msgIdx].replace("{n}", n) });
        return r;
      });
    }, 2000);
    setRamoTiempo(Math.max(0, ramoData.duracion - Math.floor((Date.now() - ramoData.inicio) / 1000)));
    return () => {
      if (ramoIntervalRef.current) clearInterval(ramoIntervalRef.current);
      if (ramoTickRef.current) clearInterval(ramoTickRef.current);
      if (ramoGiroRef.current) clearInterval(ramoGiroRef.current);
    };
  }, [ramoData?.activa]);

  const acento = "#4F46E5";

  if (loading)
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFBFF",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 0 }}>
            <AppLogo size={72} />
          </div>
          <div style={{marginTop: 14, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 26, color: "#0F172A", letterSpacing: 3}}>Evorix</div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2.5px solid transparent",
              borderTopColor: "#4F46E5",
              animation: "spin 0.8s linear infinite",
              margin: "24px auto 0",
            }}
          />
          <p
            style={{
              color: "rgba(79, 70, 229,0.7)",
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 12,
            }}
          >
            Cargando...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </main>
    );

  if (!evento)
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#6b7280" }}>{t.eventoNoEncontrado}</p>
      </main>
    );

  // Si el muro está cerrado y el visitante no es el organizador
  if (evento.muro_abierto === false && !esOrg)
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFBFF", flexDirection: "column", gap: 16, padding: 24 }}>
        <AppLogo size={52} />
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: "#3730A3", textAlign: "center" }}>El muro está cerrado</h2>
        <p style={{ color: "#4b5563", fontSize: 14, textAlign: "center", maxWidth: 320 }}>
          El organizador ha cerrado temporalmente el muro de fotos y deseos. Vuelve pronto.
        </p>
      </main>
    );

  const _soloFechaMuro = (evento.fecha || "").split("T")[0];
  const [_yMuro, _mMuro, _dMuro] = _soloFechaMuro.split("-").map((n) => parseInt(n, 10));
  const fechaFmt = new Date(_yMuro, (_mMuro || 1) - 1, _dMuro || 1).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFBFF",
        paddingBottom: esOrg ? "calc(72px + env(safe-area-inset-bottom, 0px))" : 100,
        fontFamily: "'DM Sans',sans-serif",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;-webkit-text-size-adjust:100%;max-width:100vw}
        body{font-family:'DM Sans',sans-serif;background:#FAFBFF}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* ── Borde festivo de colores (top + bottom) ── */
        .confetti-top, .confetti-bottom {
          position: fixed; left: 0; right: 0; z-index: 9999;
          height: 7px; pointer-events: none;
          background: repeating-linear-gradient(90deg,
            #F44336 0px,#F44336 12px, #E91E63 12px,#E91E63 24px,
            #9C27B0 24px,#9C27B0 36px, #3F51B5 36px,#3F51B5 48px,
            #2196F3 48px,#2196F3 60px, #00BCD4 60px,#00BCD4 72px,
            #4CAF50 72px,#4CAF50 84px, #8BC34A 84px,#8BC34A 96px,
            #FFEB3B 96px,#FFEB3B 108px, #FF9800 108px,#FF9800 120px,
            #FF5722 120px,#FF5722 132px, #F44336 132px,#F44336 144px
          );
        }
        .confetti-top { top: 0; }
        .confetti-bottom { bottom: 0; }
        @keyframes popIn{from{opacity:0;transform:scale(0.93) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .foto-card{transition:transform 0.18s;} .foto-card:active{transform:scale(0.97)}

        /* ── Bottom nav nativa ── */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(79, 70, 229,0.18);
          box-shadow: 0 -4px 24px rgba(15,23,42,0.08);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .nav-guest-row {
          display: flex; gap: 8px; padding: 8px 12px 0;
          border-bottom: 1px solid rgba(79, 70, 229,0.10);
        }
        .nav-guest-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          border-radius: 12px; padding: 10px 8px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          border: none; font-family: 'DM Sans',sans-serif;
          -webkit-tap-highlight-color: transparent;
          transition: opacity .15s, transform .12s;
        }
        .nav-guest-btn:active { transform: scale(0.96); opacity: 0.85; }
        .nav-tabs {
          display: grid; grid-template-columns: repeat(4,1fr);
          padding: 4px 0 2px;
        }
        .nav-tab {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 2px; padding: 8px 4px 6px;
          border: none; background: transparent; cursor: pointer;
          font-family: 'DM Sans',sans-serif;
          -webkit-tap-highlight-color: transparent;
          transition: background .15s;
          text-decoration: none;
          position: relative;
        }
        .nav-tab:active { background: rgba(79, 70, 229,0.08); }
        .nav-tab-icon { line-height: 0; transition: transform .15s; }
        .nav-tab.active .nav-tab-icon { transform: scale(1.1); }
        .nav-tab-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.2px; }
        .nav-tab.active .nav-tab-label { color: #3730A3; }
        .nav-tab:not(.active) .nav-tab-label { color: #94a3b8; }
        .nav-tab:not(.active) .nav-tab-icon { color: #94a3b8; }
        .nav-tab.active .nav-tab-icon { color: #4F46E5; }
        .nav-tab-badge {
          position: absolute; top: 4px; right: calc(50% - 14px);
          background: #4F46E5; color: white;
          font-size: 8px; font-weight: 800; border-radius: 99px;
          padding: 1px 4px; min-width: 14px; text-align: center;
          border: 1.5px solid white;
        }

        /* ── Barra fija organizador ── */
        .org-bottom-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          height: calc(56px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(79,70,229,0.16);
          box-shadow: 0 -4px 20px rgba(79,70,229,0.07);
          display: flex; align-items: center; padding-left: 16px;
        }
        .org-btn-back {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; border: none;
          color: #4F46E5; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans',sans-serif; cursor: pointer; padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        /* ── Compact sticky header ── */
        .muro-header {
          position: sticky; top: env(safe-area-inset-top, 0px); z-index: 150;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(79, 70, 229,0.15);
          box-shadow: 0 2px 12px rgba(15,23,42,0.06);
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          box-sizing: border-box; width: 100%;
        }
        .muro-header-brand { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .muro-header-name { font-family: 'Playfair Display',serif; font-size: 15px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .muro-header-sub { font-size: 10px; color: #3730A3; font-weight: 600; letter-spacing: 0.3px; display: block; }
        .muro-header-btn {
          display: flex; align-items: center; gap: 5px;
          background: #FAFBFF; color: #3730A3;
          border: 1.5px solid rgba(79, 70, 229,0.28);
          border-radius: 10px; padding: 6px 10px;
          font-size: 11px; font-weight: 700;
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          font-family: 'DM Sans',sans-serif; text-decoration: none;
          -webkit-tap-highlight-color: transparent;
        }

        /* ── Org banner ── */
        .org-banner {
          background: rgba(79, 70, 229,0.10);
          border-bottom: 1px solid rgba(79, 70, 229,0.18);
          padding: 8px 16px;
          font-size: 11px; font-weight: 600; color: #3730A3;
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap;
        }

        /* ── Org content tabs (sticky strip, org mode only) ── */
        .org-tabs-strip {
          position: sticky; top: calc(env(safe-area-inset-top, 0px) + 52px); z-index: 140;
          background: rgba(255,255,255,0.97);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(79,70,229,0.12);
          display: grid; grid-template-columns: repeat(3, 1fr);
          padding: 4px 0 2px;
        }
        .org-tab {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 2px; padding: 8px 4px 6px;
          border: none; background: transparent; cursor: pointer;
          font-family: 'DM Sans',sans-serif;
          -webkit-tap-highlight-color: transparent;
          transition: background .15s;
          position: relative;
        }
        .org-tab:active { background: rgba(79,70,229,0.08); }
        .org-tab-icon { line-height: 0; transition: transform .15s; }
        .org-tab.active .org-tab-icon { transform: scale(1.1); color: #4F46E5; }
        .org-tab:not(.active) .org-tab-icon { color: #94a3b8; }
        .org-tab-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.2px; }
        .org-tab.active .org-tab-label { color: #3730A3; }
        .org-tab:not(.active) .org-tab-label { color: #94a3b8; }
        .org-tab-badge {
          position: absolute; top: 4px; right: calc(50% - 14px);
          background: #4F46E5; color: white;
          font-size: 8px; font-weight: 800; border-radius: 99px;
          padding: 1px 4px; min-width: 14px; text-align: center;
          border: 1.5px solid white;
        }
        /* ── Boda Civil ── */
        .boda-wrap { padding: 0 0 32px; }
        .boda-header { text-align: center; padding: 20px 16px 16px; }
        .boda-deco-row { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 12px; }
        .boda-nombres { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #1E1B4B; letter-spacing: -0.3px; margin-bottom: 2px; }
        .boda-frame-outer { position: relative; border-radius: 16px; overflow: hidden; background: #000; margin: 0 0 4px; box-shadow: 0 4px 24px rgba(79,70,229,0.12); }
        .boda-iframe-wrap { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; border-radius: 16px; background: #000; }
        .boda-iframe-wrap iframe { position: absolute; top: -44px; left: 0; width: 100%; height: calc(100% + 44px); border: none; }
        .boda-nombres-bar { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(15,14,23,0.88) 0%, transparent 100%); padding: 32px 16px 14px; z-index: 3; text-align: center; pointer-events: none; }
        .boda-nombres-text { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-style: italic; color: #fff; letter-spacing: 0.3px; }
        .boda-video { width: 100%; display: block; max-height: 380px; background: #000; border-radius: 16px; }
        .boda-sec-label { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; color: #1E1B4B; display: flex; align-items: center; gap: 8px; padding: 18px 16px 10px; }
        .boda-carousel { position: relative; overflow: hidden; background: #F8FAFF; }
        .boda-carousel-track { display: flex; transition: transform .4s cubic-bezier(.22,1,.36,1); }
        .boda-carousel-slide { flex-shrink: 0; width: 100%; }
        .boda-carousel-slide img { width: 100%; display: block; max-height: 420px; object-fit: contain; background: #F1F5FF; }
        .boda-carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.92); border: 1.5px solid rgba(79,70,229,0.18); color: #4F46E5; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 4; box-shadow: 0 2px 10px rgba(79,70,229,0.14); transition: background .15s; }
        .boda-carousel-btn:active { background: rgba(79,70,229,0.08); }
        .boda-carousel-prev { left: 10px; }
        .boda-carousel-next { right: 10px; }
        .boda-carousel-dots { display: flex; justify-content: center; gap: 5px; padding: 10px 0 4px; }
        .boda-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(79,70,229,0.2); cursor: pointer; transition: all .2s; border: none; padding: 0; }
        .boda-dot.active { background: #4F46E5; transform: scale(1.35); }
        .boda-reaction-area { margin: 16px 14px 0; background: #fff; border: 1.5px solid rgba(79,70,229,0.14); border-radius: 18px; padding: 16px; box-shadow: 0 2px 12px rgba(79,70,229,0.06); }
        .boda-reaction-btn { width: 100%; border: 1.5px solid rgba(236,72,153,0.35); background: rgba(236,72,153,0.06); border-radius: 14px; padding: 13px; font-size: 14px; font-weight: 700; color: #be185d; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'DM Sans', sans-serif; transition: all .15s; }
        .boda-reaction-btn:active { transform: scale(0.97); }
        .boda-reaction-btn.done { background: rgba(236,72,153,0.14); border-color: rgba(236,72,153,0.5); }
        .boda-reaction-list { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
        .boda-reaction-chip { background: #F8FAFF; border: 1px solid rgba(79,70,229,0.14); border-radius: 99px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #3730A3; display: flex; align-items: center; gap: 4px; }
        .boda-lightbox { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; padding: 16px; animation: fadeIn .18s ease; }
        .boda-lightbox img { max-width: 100%; max-height: 90dvh; object-fit: contain; border-radius: 12px; display: block; }
        .boda-lightbox-close { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .boda-carousel-slide img { cursor: zoom-in; }
        .boda-reaction-title { font-size: 12px; font-weight: 700; color: #be185d; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
        @keyframes bodaFall { 0% { transform: translateY(-40px) rotate(0deg) scale(1); opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity: 0; } }
        @keyframes bodaFloat { 0%,100% { transform: translateY(0) rotate(-8deg) scale(1); opacity:0.7; } 50% { transform: translateY(-18px) rotate(8deg) scale(1.08); opacity:1; } }
        .boda-confetti-layer { position: fixed; inset: 0; pointer-events: none; z-index: 8888; overflow: hidden; }
        .boda-confetti-piece { position: absolute; top: -50px; animation: bodaFall linear forwards; }
        /* ── Decoración marco video ── */
        .boda-video-deco { position: relative; padding: 10px; margin: 0 12px; }
        .boda-video-deco::before, .boda-video-deco::after { content: ''; position: absolute; width: 38px; height: 38px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M20 6 C16 2 10 2 8 6 C6 10 8 14 12 16 C8 17 6 20 8 24 C10 28 16 28 20 24 C24 28 30 28 32 24 C34 20 32 17 28 16 C32 14 34 10 32 6 C30 2 24 2 20 6Z' fill='%23f9a8d4' opacity='0.9'/%3E%3Ccircle cx='20' cy='32' r='3' fill='%23fbcfe8'/%3E%3Crect x='18.5' y='25' width='3' height='8' rx='1.5' fill='%2386efac'/%3E%3Cpath d='M15 28 C13 26 14 24 16 25' stroke='%2386efac' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3Cpath d='M25 28 C27 26 26 24 24 25' stroke='%2386efac' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
        .boda-video-deco::before { top: -2px; left: -2px; transform: rotate(-15deg); }
        .boda-video-deco::after { top: -2px; right: -2px; transform: rotate(15deg) scaleX(-1); }
        .boda-video-deco-b::before, .boda-video-deco-b::after { content: ''; position: absolute; width: 38px; height: 38px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M20 6 C16 2 10 2 8 6 C6 10 8 14 12 16 C8 17 6 20 8 24 C10 28 16 28 20 24 C24 28 30 28 32 24 C34 20 32 17 28 16 C32 14 34 10 32 6 C30 2 24 2 20 6Z' fill='%23f9a8d4' opacity='0.9'/%3E%3Ccircle cx='20' cy='32' r='3' fill='%23fbcfe8'/%3E%3Crect x='18.5' y='25' width='3' height='8' rx='1.5' fill='%2386efac'/%3E%3Cpath d='M15 28 C13 26 14 24 16 25' stroke='%2386efac' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3Cpath d='M25 28 C27 26 26 24 24 25' stroke='%2386efac' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
        .boda-video-deco-b::before { bottom: -2px; left: -2px; transform: rotate(15deg) scaleY(-1); }
        .boda-video-deco-b::after { bottom: -2px; right: -2px; transform: rotate(-15deg) scale(-1); }
        .boda-deco-ring-left { position: absolute; left: -14px; top: 50%; transform: translateY(-50%); }
        .boda-deco-ring-right { position: absolute; right: -14px; top: 50%; transform: translateY(-50%); }
        /* ── Botón ramo ── */
        .boda-ramo-section { margin: 20px 14px 0; background: linear-gradient(135deg,#fff0f6,#fdf2f8); border: 1.5px solid rgba(236,72,153,0.2); border-radius: 20px; padding: 18px 16px; text-align: center; }
        .boda-ramo-btn { width: 100%; border: none; background: linear-gradient(135deg,#ec4899,#be185d); border-radius: 16px; padding: 15px 16px; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px; font-family: 'DM Sans',sans-serif; box-shadow: 0 6px 24px rgba(236,72,153,0.35); transition: all .15s; -webkit-tap-highlight-color: transparent; }
        .boda-ramo-btn:active { transform: scale(0.97); }
        .boda-ramo-sub { font-size: 11px; color: #be185d; opacity: 0.8; margin-top: 8px; font-style: italic; }
        /* ── Animación ramo ── */
        @keyframes ramoFall { 0% { transform: translateY(-60px) rotate(0deg); opacity: 1; } 85% { opacity: 0.9; } 100% { transform: translateY(108vh) rotate(480deg); opacity: 0; } }
        @keyframes giroRamo { 0%{opacity:0;transform:translateY(-10px) scale(0.92)}20%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(10px) scale(0.92)} }
        .boda-ramo-layer { position: fixed; inset: 0; pointer-events: all; z-index: 8889; overflow: hidden; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; animation: fadeIn .2s ease; }
        .boda-ramo-piece { position: absolute; top: -70px; animation: ramoFall linear forwards; pointer-events: none; }
      `}</style>

      {/* ── Bordes festivos ── */}
      <div className="confetti-top" />
      <div className="confetti-bottom" />

      {/* ══ HERO ══ */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: evento.imagen_url
            ? "transparent"
            : "linear-gradient(135deg,#1E1B4B 0%,#3730A3 100%)",
          color: "white",
          padding: "18px 16px 20px",
          textAlign: "center",
          minHeight: evento.imagen_url ? 220 : undefined,
        }}
      >
        {/* Foto de fondo a pantalla completa */}
        {evento.imagen_url && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${evento.imagen_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        )}
        {/* Degradado oscuro para legibilidad del texto */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: evento.imagen_url
              ? "linear-gradient(180deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.72) 100%)"
              : "linear-gradient(180deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.28) 100%)",
          }}
        />

        {/* ── Top bar ── */}
        <div style={{ position:"relative", zIndex:5, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <AppLogo size={26}/>
            <span style={{ fontSize:13, fontWeight:800, letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>Evorix</span>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setLang(lang==="es"?"en":"es")} style={{ background:"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, padding:"5px 9px", fontSize:10, fontWeight:800, cursor:"pointer", letterSpacing:1 }}>
              {lang==="es"?"EN":"ES"}
            </button>
            {esOrg && (
              <Link href="/dashboard" style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.2)", color:"white", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, padding:"5px 9px", fontSize:10, fontWeight:700, textDecoration:"none" }}>
                {Ico.dashboard(12,"white")}
              </Link>
            )}
          </div>
        </div>

        {/* ── Evento info ── */}
        <div style={{ position:"relative", zIndex:1 }}>
          {/* Badge tipo evento */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.18)", backdropFilter:"blur(8px)", borderRadius:20, padding:"4px 12px", marginBottom:10, fontSize:10, fontWeight:700, letterSpacing:"1.2px", textTransform:"uppercase", border:"1px solid rgba(255,255,255,0.25)" }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 012-2h1.2l1.6-2h6.4l1.6 2H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"/><circle cx="10" cy="11" r="2.5"/></svg> Muro del evento
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, marginBottom:4, lineHeight:1.1, fontFamily:"'Playfair Display',serif", textShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
            {evento.nombre}
          </h1>
          {evento.anfitriones && (
            <p style={{ fontSize:13, opacity:0.9, marginBottom:2, fontWeight:500 }}>{evento.anfitriones}</p>
          )}
          {evento.frase_evento && (
            <p style={{ fontSize:12, fontStyle:"italic", opacity:0.78, fontFamily:"'Playfair Display',serif", marginBottom:6 }}>❝ {evento.frase_evento} ❞</p>
          )}
          <p style={{ fontSize:10.5, opacity:0.65, letterSpacing:"0.3px" }}>
            {fechaFmt}{evento.lugar ? ` · ${evento.lugar}` : ""}
          </p>

          {/* Stats */}
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:14 }}>
            {([
              { num:fotos.length, label:t.fotos, svg:(
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7a2 2 0 012-2h1.2l1.6-2h6.4l1.6 2H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"/>
                  <circle cx="10" cy="11" r="2.5"/>
                </svg>
              )},
              { num:deseos.length, label:t.deseos, svg:(
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V5a1 1 0 011-1z"/>
                </svg>
              )},
              { num:albumes.length, label:t.participantes, svg:(
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M13 15c0-2.2-1.3-4-3-4s-3 1.8-3 4M7 7a3 3 0 106 0 3 3 0 00-6 0M16 15c0-1.8-1-3.3-2.5-4M17 6.5a2.5 2.5 0 010 5"/>
                </svg>
              )},
            ] as const).map((s,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.16)", backdropFilter:"blur(8px)", borderRadius:14, padding:"8px 14px", textAlign:"center", border:"1px solid rgba(255,255,255,0.22)", minWidth:68 }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}>{s.svg}</div>
                <div style={{ fontSize:18, fontWeight:800, lineHeight:1, fontFamily:"'Playfair Display',serif" }}>{s.num}</div>
                <div style={{ fontSize:9, opacity:0.8, marginTop:2, letterSpacing:"0.3px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {invId && pasoJourney === 5 && (
            <div style={{ marginTop: 10, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600 }}>
              {Ico.check(12, "white")} <span>{t.completaste} {invNombre}</span>
            </div>
          )}
        </div>
      </div>


      {esOrg && (
        <div className="org-banner">
          {Ico.check(12, "#3730A3")} {t.modoOrganizador}
          <button
            onClick={toggleMuro}
            style={{
              background: evento.muro_abierto === false ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${evento.muro_abierto === false ? "#fca5a5" : "#86efac"}`,
              borderRadius: 8, padding: "5px 11px", fontSize: 11, fontWeight: 700,
              color: evento.muro_abierto === false ? "#dc2626" : "#16a34a",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
              marginLeft: "auto",
            }}
          >
            {evento.muro_abierto === false ? "🔒 Abrir muro" : "🔓 Cerrar muro"}
          </button>
        </div>
      )}

      {/* ── Org content tabs strip (visible solo en modo organizador) ── */}
      {esOrg && (
        <div className="org-tabs-strip">
          {([
            { key: "fotos" as Vista, icon: Ico.grid(18, vista === "fotos" ? "#4F46E5" : "#94a3b8"), label: t.fotos, count: fotos.length },
            { key: "albumes" as Vista, icon: Ico.folder(18, vista === "albumes" ? "#4F46E5" : "#94a3b8"), label: t.albumes, count: albumes.length },
            { key: "deseos" as Vista, icon: Ico.heart(18, vista === "deseos" ? "#4F46E5" : "#94a3b8"), label: t.deseos, count: deseos.length },
            ...(evento?.tipo === "boda" && bodaCivil
              ? [{ key: "boda" as Vista, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vista === "boda" ? "#4F46E5" : "#94a3b8"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, label: "Boda Civil", count: 0 }]
              : []),
          ] as { key: Vista; icon: React.ReactNode; label: string; count: number }[]).map((tab) => (
            <button
              key={tab.key}
              className={`org-tab${vista === tab.key ? " active" : ""}`}
              onClick={() => setVista(tab.key)}
            >
              {tab.count > 0 && <span className="org-tab-badge">{tab.count}</span>}
              <span className="org-tab-icon">{tab.icon}</span>
              <span className="org-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ══ CONTENIDO ══ */}
      <div style={{ padding: "12px 10px 0", maxWidth: 600, margin: "0 auto", paddingBottom: esOrg ? "var(--nav-total-height, 100px)" : invId ? "160px" : "100px", width: "100%", boxSizing: "border-box" }}>
        {/* ── FOTOS ── */}
        {vista === "fotos" &&
          (fotos.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                animation: "fadeUp 0.4s ease",
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: "#E0E7FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                {Ico.camera(34, "#E0E7FF")}
              </div>
              <p
                style={{
                  fontWeight: 700,
                  color: "#0f2422",
                  fontSize: 17,
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {t.sinFotos}
              </p>
              <p style={{ color: "#85B5B0", fontSize: 13, marginTop: 5 }}>
                {invId ? t.sinFotosSub : t.sinFotos2}
              </p>
            </div>
          ) : (
            <>
              <style>{`
                /* ── Entrada dramática ── */
                @keyframes fotoIn {
                  0%   { opacity:0; transform:translateY(40px) scale(0.88) rotate(var(--rot,0deg)); }
                  65%  { opacity:1; transform:translateY(-6px) scale(1.02) rotate(calc(var(--rot,0deg)*0.2)); }
                  100% { opacity:1; transform:translateY(0) scale(1) rotate(0deg); }
                }
                /* Foto reciente — brilla al entrar */
                @keyframes newGlow {
                  0%   { box-shadow:0 0 0 0 rgba(79,70,229,0.5); }
                  50%  { box-shadow:0 0 0 10px rgba(79,70,229,0); }
                  100% { box-shadow:0 0 0 0 rgba(79,70,229,0); }
                }
                /* Flotación continua suave por card */
                @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-0.4deg)} 50%{transform:translateY(-5px) rotate(0.4deg)} }
                @keyframes floatB { 0%,100%{transform:translateY(0) rotate(0.3deg)} 50%{transform:translateY(-4px) rotate(-0.3deg)} }
                @keyframes floatC { 0%,100%{transform:translateY(0) rotate(-0.2deg)} 50%{transform:translateY(-6px) rotate(0.2deg)} }

                .foto-fan { animation: fotoIn 0.58s cubic-bezier(0.22,1,0.36,1) both; }
                .foto-fan:hover { z-index:3; filter:drop-shadow(0 12px 28px rgba(0,0,0,0.22)); }
                .foto-float-a { animation: floatA 4.2s ease-in-out infinite; }
                .foto-float-b { animation: floatB 5.1s 0.6s ease-in-out infinite; }
                .foto-float-c { animation: floatC 3.8s 1.2s ease-in-out infinite; }
                .foto-new     { animation: fotoIn 0.58s cubic-bezier(0.22,1,0.36,1) both, newGlow 1.8s 0.6s ease-out; }
              `}</style>

              {/* ── Badge "Nueva foto" para la más reciente ── */}
              {fotos.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"6px 12px", background:"linear-gradient(135deg,#EEF2FF,#E0E7FF)", borderRadius:10, fontSize:11, fontWeight:700, color:"#3730A3", border:"1px solid rgba(79,70,229,0.18)" }}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7a2 2 0 012-2h1.2l1.6-2h6.4l1.6 2H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"/><circle cx="10" cy="11" r="2.5"/></svg>
                  {fotos.length} foto{fotos.length>1?"s":""} · La más reciente primero
                </div>
              )}

              <div style={{ columns:"2 170px", gap:14 }}>
                {[...fotos].reverse().map((foto, idx) => {
                  const floatClass = ["foto-float-a","foto-float-b","foto-float-c"][idx % 3];
                  const isNew = idx === 0;
                  return (
                    <div
                      key={foto.id}
                      className={`${isNew ? "foto-new" : "foto-fan"} ${floatClass}`}
                      style={{
                        "--rot": `${(idx % 2 === 0 ? -1 : 1) * (0.8 + (idx % 3) * 0.4)}deg`,
                        animationDelay: `${Math.min(idx * 0.07, 0.7)}s`,
                        breakInside:"avoid",
                        marginBottom:14,
                        borderRadius:18,
                        position:"relative",
                      } as React.CSSProperties}
                    >
                      {/* Badge "Nueva" en la foto más reciente */}
                      {isNew && (
                        <div style={{ position:"absolute", top:-8, left:10, zIndex:4, background:"linear-gradient(135deg,#4F46E5,#3730A3)", color:"white", fontSize:9, fontWeight:800, letterSpacing:"0.8px", textTransform:"uppercase", padding:"3px 8px", borderRadius:20, boxShadow:"0 2px 8px rgba(79,70,229,0.4)" }}>
                          ✨ Nueva
                        </div>
                      )}
                      <FotoCard
                        foto={foto}
                        acento={acento}
                        esOrg={esOrg}
                        onDelete={eliminarFoto}
                        onClick={() => setFotoActiva([...fotos].reverse().indexOf(foto))}
                        t={t}
                        idx={idx}
                        nombreInvitado={fotos.find(f=>f.invitado_id === invId)?.invitados?.nombre ?? ""}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ))}

        {/* ── Acceso rápido a Boda Civil desde muro de fotos (solo bodas) ── */}
        {vista === "fotos" && evento?.tipo === "boda" && bodaCivil && (
          <div style={{ padding: "12px 16px 32px", textAlign: "center" }}>
            <button
              onClick={() => setVista("boda" as Vista)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", color: "#be185d", border: "1.5px solid rgba(249,168,212,0.5)", borderRadius: 14, padding: "12px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(236,72,153,0.15)" }}
            >
              <span style={{ fontSize: 16 }}>💐</span> Ramo a las Solteras — ¡toca acá!
            </button>
          </div>
        )}

        {/* ── ÁLBUMES ── */}
        {vista === "albumes" &&
          (albumes.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                animation: "fadeUp 0.4s ease",
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: "#E0E7FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                {Ico.folder(34, "#E0E7FF")}
              </div>
              <p
                style={{
                  fontWeight: 700,
                  color: "#0f2422",
                  fontSize: 17,
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {t.sinAlbumes}
              </p>
              <p style={{ color: "#85B5B0", fontSize: 13, marginTop: 5 }}>
                {t.sinAlbumesSub}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Botón descargar TODAS las fotos como ZIP */}
              <button
                onClick={descargarTodasFotosZip}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "linear-gradient(135deg,#3730A3,#4F46E5)",
                  color: "white", border: "none", borderRadius: 14,
                  padding: "13px 20px", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 6px 20px rgba(79,70,229,0.28)",
                  width: "100%",
                }}
              >
                {Ico.download(16, "white")}
                {t.descargarTodo} (ZIP con carpetas por persona)
              </button>
              {albumes.map((album) => (
                <div
                  key={album.id}
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: 14,
                    border: "1px solid rgba(79, 70, 229,0.15)",
                    boxShadow: "0 2px 10px rgba(79, 70, 229,0.07)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 9 }}
                    >
                      <Avatar nombre={album.label} size={40} bg={acento} />
                      <div>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#0f2422",
                            fontFamily: "'Playfair Display',serif",
                          }}
                        >
                          {album.label}
                        </p>
                        <p style={{ fontSize: 11, color: "#85B5B0" }}>
                          {album.fotos.length} {t.foto_s}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => descargarAlbumPersona(album)}
                      title={t.descargarFotos}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#E0E7FF",
                        color: acento,
                        border: "none",
                        borderRadius: 10,
                        padding: "7px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {Ico.download(13, acento)} {t.descargar}
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 6,
                    }}
                  >
                    {album.fotos.map((foto) => {
                      const idx = fotos.findIndex((f) => f.id === foto.id);
                      return (
                        <div
                          key={foto.id}
                          style={{
                            position: "relative",
                            borderRadius: 11,
                            overflow: "hidden",
                            aspectRatio: "1",
                            cursor: "pointer",
                            boxShadow: "0 2px 7px rgba(0,0,0,0.09)",
                          }}
                        >
                          <Image
                            src={foto.url}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                            onClick={() => setFotoActiva(idx)}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              descargarImagen(foto.url, `foto_${foto.id}.jpg`);
                            }}
                            style={{
                              position: "absolute",
                              bottom: 4,
                              right: 4,
                              background: "rgba(255,255,255,0.92)",
                              color: acento,
                              border: "none",
                              borderRadius: "50%",
                              width: 24,
                              height: 24,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {Ico.download(11, acento)}
                          </button>
                          {esOrg && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarFoto(foto.id);
                              }}
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: "rgba(220,38,38,0.88)",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: 22,
                                height: 22,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {Ico.x(11, "white")}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* ── DESEOS ── */}
        {vista === "deseos" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#E0E7FF",
                  borderRadius: 99,
                  padding: "8px 16px",
                  border: "1px solid rgba(79, 70, 229,0.28)",
                }}
              >
                {Ico.heart(14, acento)}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: acento,
                    fontFamily: "'Playfair Display',serif",
                    letterSpacing: "0.3px",
                  }}
                >
                  {t.deseosYDedicatorias}
                </span>
              </div>
              {deseos.length > 0 && (
                <button
                  onClick={() => descargarDeseosTxt(deseos, evento.nombre)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#E0E7FF",
                    color: acento,
                    border: "1px solid rgba(79, 70, 229,0.28)",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {Ico.download(13, acento)} {t.descargarDeseos}
                </button>
              )}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#85B5B0",
                marginBottom: 16,
                marginTop: -8,
              }}
            >
              {t.mensajesAmor}
            </p>

            {deseos.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "44px 0",
                  animation: "fadeUp 0.4s ease",
                }}
              >
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background: "#E0E7FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  {Ico.heart(34, "#E0E7FF")}
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#0f2422",
                    fontSize: 17,
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {t.sinDeseos}
                </p>
                <p style={{ color: "#85B5B0", fontSize: 13, marginTop: 5 }}>
                  {invId
                    ? yaFoto
                      ? t.sinDeseosSub
                      : t.sinDeseosSub2
                    : t.sinDeseosSub3}
                </p>
              </div>
            ) : (
              <div style={{ columns: "2 180px", gap: 12 }}>
                {deseos.map((deseo) => (
                  <DeseoCard
                    key={deseo.id}
                    deseo={deseo}
                    esOrg={esOrg}
                    onDelete={eliminarDeseo}
                    onDescargar={descargarDeseoIndividual}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BODA CIVIL ── */}
        {vista === "boda" && bodaCivil && (
          <div className="boda-wrap">

            {/* Cabecera con decoración SVG */}
            <div className="boda-header">
              <div className="boda-deco-row">
                {/* Corazón outline — mismo estilo que iconos del dashboard */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {/* Anillo — igual al ícono del card "Mi Boda Civil" */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5"/><path d="M7 8.5l10 0" strokeWidth="1.2" opacity="0.5"/></svg>
                {/* Corazón outline */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              {bodaCivil.nombres && <div className="boda-nombres">{bodaCivil.nombres}</div>}
              <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Boda Civil</p>
            </div>

            {/* Video */}
            {bodaCivil.video_url && (
              <>
                <div className="boda-sec-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  Video de la boda civil
                </div>
                <div className="boda-video-deco boda-video-deco-b">
                  {/* Argollas laterales */}
                  <div className="boda-deco-ring-left">
                    <svg width="22" height="38" viewBox="0 0 22 38" fill="none">
                      <ellipse cx="11" cy="10" rx="8" ry="8" stroke="#f9a8d4" strokeWidth="2.5" fill="none"/>
                      <ellipse cx="11" cy="28" rx="8" ry="8" stroke="#c4b5fd" strokeWidth="2.5" fill="none"/>
                      <path d="M7 17 C7 19 15 19 15 21" stroke="#f9a8d4" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                  <div className="boda-deco-ring-right">
                    <svg width="22" height="38" viewBox="0 0 22 38" fill="none">
                      <ellipse cx="11" cy="10" rx="8" ry="8" stroke="#f9a8d4" strokeWidth="2.5" fill="none"/>
                      <ellipse cx="11" cy="28" rx="8" ry="8" stroke="#c4b5fd" strokeWidth="2.5" fill="none"/>
                      <path d="M7 17 C7 19 15 19 15 21" stroke="#c4b5fd" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </div>
                {(() => {
                  const url = bodaCivil.video_url;
                  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                  const isDrive = url.includes("drive.google.com") && !!driveMatch;
                  const isYouTube = url.includes("youtube.com/embed") || url.includes("youtu.be");
                  const isVimeo = url.includes("player.vimeo.com") || url.includes("vimeo.com");

                  if (isDrive && driveMatch) {
                    const fileId = driveMatch[1];
                    const thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
                    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
                    return (
                      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#0f0e17" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbUrl}
                          alt="Video de la boda civil"
                          style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "cover", opacity: 0.85 }}
                        />
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "linear-gradient(to bottom, rgba(10,9,20,0.25) 0%, rgba(10,9,20,0.55) 100%)" }}>
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textDecoration: "none" }}
                          >
                            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(79,70,229,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 28px rgba(79,70,229,0.55)", backdropFilter: "blur(4px)" }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.45)", borderRadius: 99, padding: "5px 14px", backdropFilter: "blur(4px)", letterSpacing: "0.3px" }}>
                              Reproducir video
                            </span>
                          </a>
                        </div>
                        {bodaCivil.nombres && (
                          <div className="boda-nombres-bar">
                            <div className="boda-nombres-text">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" style={{display:"inline",verticalAlign:"middle",marginRight:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              {bodaCivil.nombres}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" style={{display:"inline",verticalAlign:"middle",marginLeft:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isYouTube) {
                    const ytMatch = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                    const ytId = ytMatch ? ytMatch[1] : null;
                    const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
                    const ytSrc = ytId
                      ? `https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&color=white`
                      : url;
                    return (
                      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#0f0e17", aspectRatio: "16/9" }}>
                        {!bodaVideoActivo ? (
                          <>
                            {ytThumb && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ytThumb}
                                alt="Video de la boda civil"
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                                }}
                              />
                            )}
                            <div
                              onClick={() => setBodaVideoActivo(true)}
                              style={{ position: "absolute", inset: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(to bottom, rgba(10,9,20,0.15) 0%, rgba(10,9,20,0.5) 100%)" }}
                            >
                              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(79,70,229,0.90)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 32px rgba(79,70,229,0.6)", backdropFilter: "blur(4px)", transition: "transform .15s" }}>
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              </div>
                              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.40)", borderRadius: 99, padding: "5px 16px", backdropFilter: "blur(4px)", letterSpacing: "0.3px" }}>
                                Toca para reproducir
                              </span>
                            </div>
                            {bodaCivil.nombres && (
                              <div className="boda-nombres-bar">
                                <div className="boda-nombres-text">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" style={{display:"inline",verticalAlign:"middle",marginRight:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                  {bodaCivil.nombres}
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" style={{display:"inline",verticalAlign:"middle",marginLeft:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <iframe
                            src={ytSrc}
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                            allowFullScreen
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                          />
                        )}
                      </div>
                    );
                  }

                  if (isVimeo) {
                    return (
                      <div className="boda-frame-outer">
                        <div className="boda-iframe-wrap">
                          <iframe src={url} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
                        </div>
                        {bodaCivil.nombres && (
                          <div className="boda-nombres-bar">
                            <div className="boda-nombres-text">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" style={{display:"inline",verticalAlign:"middle",marginRight:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              {bodaCivil.nombres}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" style={{display:"inline",verticalAlign:"middle",marginLeft:6}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div style={{ borderRadius: 16, overflow: "hidden" }}>
                      <video src={url} controls className="boda-video" playsInline preload="metadata" />
                    </div>
                  );
                })()}
                </div>{/* /boda-video-deco */}
              </>
            )}

            {/* Carrusel de fotos */}
            {bodaCivil.fotos.length >= 3 && (
              <>
                <div className="boda-sec-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Momentos de nuestra boda
                </div>
                <div className="boda-carousel">
                  <div className="boda-carousel-track" style={{ transform: `translateX(-${bodaCarruselIdx * 100}%)` }}>
                    {bodaCivil.fotos.map((url, i) => (
                      <div key={url} className="boda-carousel-slide">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto boda ${i + 1}`} onClick={() => setBodaLightbox(url)} />
                      </div>
                    ))}
                  </div>
                  {bodaCivil.fotos.length > 1 && (
                    <>
                      <button className="boda-carousel-btn boda-carousel-prev" onClick={() => setBodaCarruselIdx(i => (i - 1 + bodaCivil!.fotos.length) % bodaCivil!.fotos.length)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                      <button className="boda-carousel-btn boda-carousel-next" onClick={() => setBodaCarruselIdx(i => (i + 1) % bodaCivil!.fotos.length)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </>
                  )}
                </div>
                <div className="boda-carousel-dots">
                  {bodaCivil.fotos.map((_, i) => (
                    <button key={i} className={`boda-dot${bodaCarruselIdx === i ? " active" : ""}`} onClick={() => setBodaCarruselIdx(i)} />
                  ))}
                </div>
                <p style={{ textAlign:"center", fontSize:11, color:"#94A3B8", marginTop:2, paddingBottom:4 }}>{bodaCarruselIdx + 1} / {bodaCivil.fotos.length}</p>
              </>
            )}

            {/* Me comparto tu felicidad */}
            <div className="boda-reaction-area">
              <button
                className={`boda-reaction-btn${bodaYaReaccione ? " done" : ""}`}
                disabled={bodaYaReaccione || bodaEnviandoReaccion}
                onClick={async () => {
                  setBodaEnviandoReaccion(true);
                  const nombreReact = (invNombre || "Un invitado").trim();
                  const fd = new FormData();
                  fd.append("type", "add_reaction");
                  fd.append("nombre", nombreReact);
                  const res = await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
                  const json = await res.json();
                  if (json.ok) { setBodaReactions(json.reactions ?? []); setBodaYaReaccione(true); setBodaConfettiKey(k => k + 1); }
                  setBodaEnviandoReaccion(false);
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill={bodaYaReaccione ? "#EC4899" : "none"} stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                {bodaYaReaccione ? "¡Compartiste tu felicidad!" : bodaEnviandoReaccion ? "Enviando…" : "Me comparto tu felicidad"}
              </button>
              {bodaReactions.length > 0 && (
                <div style={{marginTop:14}}>
                  <div className="boda-reaction-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#EC4899" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {bodaReactions.length} {bodaReactions.length === 1 ? "persona compartió" : "personas compartieron"} su felicidad
                  </div>
                  <div className="boda-reaction-list">
                    {bodaReactions.map((r, i) => (
                      <span key={i} className="boda-reaction-chip">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#EC4899" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        {r.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Ramo a las Solteras ── */}
            {(() => {
              const ramoFmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
              const pct = ramoData ? Math.max(0, ramoTiempo / ramoData.duracion) : 0;

              // Sin rifa activa y sin ganadora
              if (!ramoData && bodaRamoStep === "idle") return (
                <div className="boda-ramo-section">
                  <p style={{ fontSize: 11, color: "#be185d", opacity: 0.6, marginBottom: 10, fontStyle: "italic" }}>Ramo a las solteras</p>
                  <button className="boda-ramo-btn" onClick={() => { setBodaRamoPreselect(""); setBodaRamoStep("nombre"); }}>
                    <span style={{ fontSize: 18 }}>🤍</span>
                    Si eres soltera o casada, toca acá
                  </button>
                </div>
              );

              // Rifa activa — mostrar tambola en vivo
              if (ramoData?.activa) return (
                <div className="boda-ramo-section" style={{ padding: "0 0 4px" }}>
                  {/* Header */}
                  <div style={{ textAlign: "center", padding: "20px 16px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#be185d", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 8, opacity: 0.85 }}>💐 Rifa del Ramo en Vivo</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 600, color: ramoTiempo <= 10 ? "#ec4899" : "#9d174d", lineHeight: 1, marginBottom: 10, transition: "color .3s", letterSpacing: 2 }}>
                      {ramoFmt(ramoTiempo)}
                    </div>
                    <div style={{ height: 6, background: "rgba(236,72,153,0.12)", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${pct * 100}%`, background: ramoTiempo <= 10 ? "linear-gradient(90deg,#f43f5e,#ec4899)" : "linear-gradient(90deg,#ec4899,#be185d)", borderRadius: 99, transition: "width 1s linear" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#be185d", opacity: 0.5, marginBottom: 4 }}>tiempo restante</div>
                  </div>
                  {/* Tambola */}
                  <div style={{ background: "linear-gradient(135deg,#7e1038,#9d174d,#be185d)", margin: "0 10px", borderRadius: 22, padding: "28px 20px", textAlign: "center", minHeight: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 30px rgba(157,23,77,0.35)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {ramoData.participantes.length === 0 ? (
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>Esperando participantes...</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>girando...</div>
                        <div key={ramoGiro.nombre} style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 600, color: "#fff", animation: "giroRamo 0.75s ease", textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                          {ramoGiro.nombre || ramoData.participantes[0].nombre}
                        </div>
                        <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.25)", margin: "2px auto" }}/>
                        <div key={ramoGiro.msg} style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontStyle: "italic", animation: "giroRamo 0.75s ease", lineHeight: 1.5, maxWidth: 240 }}>
                          {ramoGiro.msg}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Participantes */}
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#be185d", opacity: 0.7, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ background: "#be185d", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 10 }}>{ramoData.participantes.length}</span>
                      participando
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ramoData.participantes.map((p, i) => (
                        <span key={i} style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 99, padding: "3px 10px", fontSize: 11, color: "#9d174d", fontWeight: 600 }}>
                          {p.nombre}
                        </span>
                      ))}
                    </div>
                    {/* Botón para unirse si no está participando */}
                    {bodaRamoStep === "idle" && (
                      <button className="boda-ramo-btn" style={{ marginTop: 12 }} onClick={() => { setBodaRamoPreselect(""); setBodaRamoStep("nombre"); }}>
                        <span style={{ fontSize: 16 }}>🤍</span>
                        ¡Quiero participar!
                      </button>
                    )}
                    {bodaRamoStep === "espera" && (
                      <div style={{ textAlign: "center", marginTop: 12, padding: "10px", background: "rgba(236,72,153,0.06)", borderRadius: 12, fontSize: 12, color: "#be185d", fontWeight: 600 }}>
                        ✅ ¡Estás participando, {bodaRamoNombre}! Cruza los dedos 🤞
                      </div>
                    )}
                  </div>
                </div>
              );

              // Ganadora revelada
              if (ramoData && !ramoData.activa && ramoData.ganadora) return (
                <div className="boda-ramo-section" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 8, animation: "bodaFloat 2s ease-in-out infinite" }}>💐</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, fontWeight: 600, color: "#be185d", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6, opacity: 0.7 }}>¡Y el ramo es para...</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: "#9d174d", marginBottom: 4 }}>
                    {ramoData.ganadora} 💐
                  </div>
                  <p style={{ fontSize: 12, color: "#be185d", opacity: 0.75, lineHeight: 1.7, marginTop: 8, fontStyle: "italic" }}>
                    La próxima en casarse, mi deseo es que seas tú ✨<br/>— Con amor, Alisson
                  </p>
                </div>
              );

              // Rifa terminada sin ganadora
              if (ramoData && !ramoData.activa && !ramoData.ganadora) return (
                <div className="boda-ramo-section" style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#be185d", opacity: 0.7 }}>La rifa terminó. ¡Espera la próxima! 🌸</p>
                </div>
              );

              return null;
            })()}

          </div>
        )}

        {/* ── Ramo: pedir nombre ── */}
        {bodaRamoStep === "nombre" && (
          <div className="boda-ramo-layer" onClick={e => e.target === e.currentTarget && setBodaRamoStep("idle")}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", textAlign: "center", maxWidth: 300, width: "88%", boxShadow: "0 16px 64px rgba(236,72,153,0.22)", border: "1.5px solid rgba(249,168,212,0.35)", animation: "wlPop 0.25s ease" }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", border: "1.5px solid rgba(249,168,212,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <span style={{ fontSize: 26 }}>🤍</span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: "#9d174d", marginBottom: 6 }}>¿Cuál es tu nombre?</p>
              <p style={{ fontSize: 12, color: "#be185d", opacity: 0.75, marginBottom: 18, lineHeight: 1.6 }}>
                {ramoData?.activa ? "¡La rifa está activa! Participa ahora 🎉" : "Dios tiene algo especial para ti ✨"}
              </p>
              <input
                type="text"
                value={bodaRamoNombre}
                onChange={e => setBodaRamoNombre(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && bodaRamoNombre.trim()) setBodaRamoStep(bodaRamoPreselect === "casada" ? "casada" : "estado");
                }}
                placeholder="Tu nombre"
                autoFocus
                style={{ width: "100%", border: "1.5px solid #fce7f3", borderRadius: 12, padding: "13px 14px", fontSize: 15, fontFamily: "inherit", background: "#fff9fb", color: "#1E1B4B", outline: "none", marginBottom: 12, textAlign: "center" }}
              />
              <button
                disabled={!bodaRamoNombre.trim()}
                onClick={() => { if (bodaRamoNombre.trim()) setBodaRamoStep(bodaRamoPreselect === "casada" ? "casada" : "estado"); }}
                style={{ width: "100%", background: bodaRamoNombre.trim() ? "linear-gradient(135deg,#ec4899,#be185d)" : "#E5E7EB", color: bodaRamoNombre.trim() ? "#fff" : "#9CA3AF", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: bodaRamoNombre.trim() ? "pointer" : "default", fontFamily: "inherit", boxShadow: bodaRamoNombre.trim() ? "0 6px 20px rgba(236,72,153,0.3)" : "none", transition: "all .2s" }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── Ramo: estado civil ── */}
        {bodaRamoStep === "estado" && (
          <div className="boda-ramo-layer" onClick={e => e.target === e.currentTarget && setBodaRamoStep("nombre")}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", textAlign: "center", maxWidth: 300, width: "88%", boxShadow: "0 16px 64px rgba(236,72,153,0.22)", border: "1.5px solid rgba(249,168,212,0.35)", animation: "wlPop 0.25s ease" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>💍</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: "#9d174d", marginBottom: 6 }}>Hola, {bodaRamoNombre} 🤍</p>
              <p style={{ fontSize: 12, color: "#be185d", opacity: 0.75, marginBottom: 22, lineHeight: 1.6 }}>¿Cuál es tu estado civil?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={async () => {
                    setBodaRamoStep("uniendo");
                    const latest = await fetchRamo();
                    if (latest?.activa) {
                      const fd = new FormData();
                      fd.append("type", "add_ramo_participante");
                      fd.append("nombre", bodaRamoNombre.trim());
                      await fetch(`/api/boda-civil/${eventoId}`, { method: "POST", body: fd });
                      await fetchRamo();
                      setBodaRamoStep("espera");
                    } else {
                      setBodaRamoStep("espera-rifa");
                    }
                  }}
                  style={{ background: "linear-gradient(135deg,#ec4899,#be185d)", color: "#fff", border: "none", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(236,72,153,0.3)" }}
                >
                  💐 Soltera
                </button>
                <button
                  onClick={() => setBodaRamoStep("casada")}
                  style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", color: "#be185d", border: "1.5px solid rgba(249,168,212,0.5)", borderRadius: 14, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  💑 Casada
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Ramo: soltera registrada, esperando que inicie la rifa ── */}
        {bodaRamoStep === "espera-rifa" && (
          <div className="boda-ramo-layer" onClick={e => e.target === e.currentTarget && setBodaRamoStep("idle")}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "32px 24px", textAlign: "center", maxWidth: 300, width: "88%", boxShadow: "0 16px 64px rgba(236,72,153,0.22)", border: "1.5px solid rgba(249,168,212,0.35)", animation: "wlPop 0.25s ease" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💐</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: "#9d174d", marginBottom: 8 }}>¡Listo, {bodaRamoNombre}!</p>
              <p style={{ fontSize: 13, color: "#be185d", opacity: 0.8, lineHeight: 1.7, marginBottom: 20 }}>
                La rifa aún no ha comenzado.<br/>Cuando inicie, toca el botón <strong>¡Quiero participar!</strong> que aparecerá en pantalla para unirte. 🙏
              </p>
              <button onClick={() => setBodaRamoStep("idle")} style={{ background: "linear-gradient(135deg,#ec4899,#be185d)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(236,72,153,0.3)" }}>
                Entendido 🌸
              </button>
            </div>
          </div>
        )}

        {/* ── Ramo: mensaje para casadas ── */}
        {bodaRamoStep === "casada" && (
          <div className="boda-ramo-layer" onClick={() => { setBodaRamoStep("idle"); setBodaRamoNombre(""); }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const sz = [16,20,24,28,18,22][i%6];
              return (
                <div key={i} className="boda-ramo-piece" style={{ left:`${(i*3.5+Math.sin(i)*15+50)%100}%`, animationDuration:`${2.2+(i%5)*0.35}s`, animationDelay:`${(i%8)*0.15}s`, pointerEvents:"none" }}>
                  <svg width={sz} height={sz} viewBox="0 0 30 30" fill="none">
                    <ellipse cx="15" cy="7" rx="4.5" ry="7" fill="white" opacity="0.95"/>
                    <ellipse cx="23" cy="12" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(60 23 12)"/>
                    <ellipse cx="21" cy="22" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(120 21 22)"/>
                    <ellipse cx="9" cy="22" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(-120 9 22)"/>
                    <ellipse cx="7" cy="12" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(-60 7 12)"/>
                    <circle cx="15" cy="15" r="3.5" fill="#fce7f3"/>
                  </svg>
                </div>
              );
            })}
            <div style={{ position:"relative", background:"rgba(255,255,255,0.97)", borderRadius:24, padding:"30px 24px", textAlign:"center", maxWidth:300, width:"88%", boxShadow:"0 20px 70px rgba(236,72,153,0.28)", border:"1.5px solid rgba(249,168,212,0.45)", animation:"wlPop 0.3s ease", zIndex:1 }} onClick={e=>e.stopPropagation()}>
              <div style={{ fontSize:36, marginBottom:10 }}>💑</div>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontWeight:600, color:"#be185d", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8, opacity:0.7 }}>Para {bodaRamoNombre} 🤍</p>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:"#9d174d", lineHeight:1.35, marginBottom:12 }}>
                Sigue amando<br/>a tu esposo 💍
              </p>
              <div style={{ width:40, height:1, background:"linear-gradient(90deg,transparent,#f9a8d4,transparent)", margin:"0 auto 12px" }}/>
              <p style={{ fontSize:12, color:"#be185d", lineHeight:1.75, marginBottom:16, opacity:0.85 }}>
                Que sigan construyendo ese matrimonio que honre a Dios cada día. Nosotros hoy iniciamos este camino, y su amor nos inspira. 🙏<br/><br/>
                <em>"Lo que Dios unió, que el hombre no lo separe." — Mc 10:9</em>
              </p>
              <p style={{ fontSize:12, color:"#9CA3AF", fontStyle:"italic", marginBottom:18 }}>— Con amor, Alisson</p>
              <button onClick={() => { setBodaRamoStep("idle"); setBodaRamoNombre(""); }} style={{ background:"linear-gradient(135deg,#fce7f3,#fdf2f8)", border:"1.5px solid rgba(249,168,212,0.5)", borderRadius:12, padding:"10px 22px", fontSize:13, fontWeight:600, color:"#be185d", cursor:"pointer", fontFamily:"inherit" }}>
                Cerrar 🌸
              </button>
            </div>
          </div>
        )}

        {/* ── Ramo: ganadora revelada en vivo (todos ven) ── */}
        {ramoData && !ramoData.activa && ramoData.ganadora && bodaRamoStep !== "mensaje" && (
          <div className="boda-ramo-layer" onClick={() => setRamoData(null)}>
            {Array.from({ length: 28 }).map((_, i) => {
              const sz = [16,20,24,28,18,22][i%6];
              return (
                <div key={i} className="boda-ramo-piece" style={{ left:`${(i*3.5+Math.sin(i)*15+50)%100}%`, animationDuration:`${2.2+(i%5)*0.35}s`, animationDelay:`${(i%8)*0.15}s`, pointerEvents:"none" }}>
                  <svg width={sz} height={sz} viewBox="0 0 30 30" fill="none">
                    <ellipse cx="15" cy="7" rx="4.5" ry="7" fill="white" opacity="0.95"/>
                    <ellipse cx="23" cy="12" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(60 23 12)"/>
                    <ellipse cx="21" cy="22" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(120 21 22)"/>
                    <ellipse cx="9" cy="22" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(-120 9 22)"/>
                    <ellipse cx="7" cy="12" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(-60 7 12)"/>
                    <circle cx="15" cy="15" r="3.5" fill="#fce7f3"/>
                  </svg>
                </div>
              );
            })}
            <div style={{ position:"relative", background:"rgba(255,255,255,0.97)", borderRadius:24, padding:"30px 20px 24px", textAlign:"center", maxWidth:320, width:"92%", maxHeight:"88vh", overflowY:"auto", boxShadow:"0 20px 70px rgba(236,72,153,0.28)", border:"1.5px solid rgba(249,168,212,0.45)", zIndex:1 }} onClick={e=>e.stopPropagation()}>
              <div style={{ fontSize:40, marginBottom:8 }}>💐</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, fontWeight:600, color:"#be185d", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8, opacity:0.7 }}>¡Y el ramo es para...</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:600, color:"#9d174d", marginBottom:8, animation:"winner .5s ease" }}>
                {ramoData.ganadora} 🎉
              </div>
              <div style={{ width:40, height:1, background:"linear-gradient(90deg,transparent,#f9a8d4,transparent)", margin:"0 auto 10px" }}/>
              <p style={{ fontSize:11, color:"#be185d", lineHeight:1.75, marginBottom:16, opacity:0.85 }}>
                La próxima en casarse, mi deseo es que seas tú ✨<br/>
                Que Dios guíe tu historia de amor y que cuando llegue ese día bendecido, sea tan especial como el nuestro. ¡Él tiene algo hermoso preparado para ti! 🙏💐<br/>
                <span style={{fontStyle:"italic"}}>— Con amor y bendiciones, Alisson</span>
              </p>
              {/* Mensaje de consolación para todas las demás participantes */}
              {ramoData.participantes.length > 1 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#be185d", letterSpacing:"1.5px", textTransform:"uppercase", opacity:0.6, marginBottom:10 }}>Un mensaje para cada una 🌸</div>
                  {ramoData.participantes.filter(p => p.nombre !== ramoData.ganadora).map((p, i) => {
                    const consolacion = [
                      "Dios tiene algo hermoso preparado para ti 🙏",
                      "La persona que Dios eligió para ti vale la espera 💕",
                      "Tu tiempo llegará, Dios tiene planes perfectos ✨",
                      "Confía en Dios, Él nunca llega tarde 🌸",
                      "Eres una mujer de valor, Dios te lo confirma 👑",
                      "Con fe y paciencia, lo mejor aún está por venir 🙌",
                      "No te rindas, Él que prometió es fiel 🌟",
                      "Dios te ama profundamente y su timing es perfecto ⏳",
                      "Tu historia de amor está siendo escrita por Dios 📖",
                      "¡Eres bendecida! El plan de Dios es perfecto para ti 💎",
                    ];
                    return (
                      <div key={i} style={{ background:"rgba(236,72,153,0.05)", border:"1px solid rgba(249,168,212,0.3)", borderRadius:12, padding:"10px 12px", marginBottom:8, textAlign:"left" }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, fontWeight:600, color:"#9d174d", marginBottom:3 }}>{p.nombre} 🤍</div>
                        <div style={{ fontSize:11, color:"#be185d", lineHeight:1.5, fontStyle:"italic", opacity:0.85 }}>{consolacion[i % consolacion.length]}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={() => setRamoData(null)} style={{ background:"linear-gradient(135deg,#fce7f3,#fdf2f8)", border:"1.5px solid rgba(249,168,212,0.5)", borderRadius:12, padding:"10px 22px", fontSize:13, fontWeight:600, color:"#be185d", cursor:"pointer", fontFamily:"inherit" }}>
                Cerrar 🌸
              </button>
            </div>
          </div>
        )}

        {/* ── Ramo step: mensaje sorpresa + flores blancas ── */}
        {bodaRamoStep === "mensaje" && (
          <div className="boda-ramo-layer" onClick={() => { setBodaRamoStep("idle"); setBodaRamoNombre(""); }}>
            {/* Flores blancas cayendo */}
            {Array.from({ length: 32 }).map((_, i) => {
              const szs = [16, 20, 24, 28, 18, 22];
              const sz = szs[i % szs.length];
              const rots = [0, 36, 72, 108, 144, 180];
              const rot = rots[i % rots.length];
              return (
                <div key={i} className="boda-ramo-piece" style={{ left: `${(i * 3.2 + Math.sin(i * 0.9) * 18 + 50) % 100}%`, animationDuration: `${2.2 + (i % 6) * 0.35}s`, animationDelay: `${(i % 9) * 0.15}s`, pointerEvents: "none" }}>
                  <svg width={sz} height={sz} viewBox="0 0 30 30" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
                    <ellipse cx="15" cy="7" rx="4.5" ry="7" fill="white" opacity="0.95"/>
                    <ellipse cx="23" cy="12" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(60 23 12)"/>
                    <ellipse cx="21" cy="22" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(120 21 22)"/>
                    <ellipse cx="9" cy="22" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(-120 9 22)"/>
                    <ellipse cx="7" cy="12" rx="4.5" ry="7" fill="white" opacity="0.9" transform="rotate(-60 7 12)"/>
                    <circle cx="15" cy="15" r="3.5" fill="#fce7f3"/>
                  </svg>
                </div>
              );
            })}
            {/* Tarjeta mensaje */}
            <div style={{ position: "relative", background: "rgba(255,255,255,0.97)", borderRadius: 24, padding: "30px 24px", textAlign: "center", maxWidth: 300, width: "88%", boxShadow: "0 20px 70px rgba(236,72,153,0.28)", border: "1.5px solid rgba(249,168,212,0.45)", animation: "wlPop 0.3s ease", zIndex: 1 }} onClick={e => e.stopPropagation()}>
              <svg width="54" height="54" viewBox="0 0 44 44" fill="none" style={{ display: "block", margin: "0 auto 12px" }}>
                <circle cx="22" cy="12" r="7" fill="white" stroke="#f9a8d4" strokeWidth="1.5"/>
                <circle cx="13" cy="19" r="6" fill="white" stroke="#fce7f3" strokeWidth="1.5"/>
                <circle cx="31" cy="19" r="6" fill="white" stroke="#fce7f3" strokeWidth="1.5"/>
                <circle cx="17" cy="29" r="6" fill="white" stroke="#fce7f3" strokeWidth="1.5"/>
                <circle cx="27" cy="29" r="6" fill="white" stroke="#fce7f3" strokeWidth="1.5"/>
                <rect x="20" y="32" width="4" height="10" rx="2" fill="#86efac"/>
                <path d="M16 37 C14 34 16 32 18 33" stroke="#86efac" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M28 37 C30 34 28 32 26 33" stroke="#86efac" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, fontWeight: 600, color: "#be185d", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8, opacity: 0.7 }}>Para {bodaRamoNombre} 🤍</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: "#9d174d", lineHeight: 1.35, marginBottom: 12 }}>
                Dios tiene algo<br/>hermoso para ti 🙏
              </p>
              <div style={{ width: 40, height: 1, background: "linear-gradient(90deg,transparent,#f9a8d4,transparent)", margin: "0 auto 12px" }}/>
              <p style={{ fontSize: 12, color: "#be185d", lineHeight: 1.75, marginBottom: 16, opacity: 0.85 }}>
                {bodaRamoNombre}, eres especial y Dios te ama profundamente.<br/>La persona que Él tiene para ti vale la espera. Confía en Sus tiempos perfectos y sigue adelante con fe. ✨
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 18 }}>— Con amor y bendiciones, Alisson</p>
              <button onClick={() => { setBodaRamoStep("idle"); setBodaRamoNombre(""); }} style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)", border: "1.5px solid rgba(249,168,212,0.5)", borderRadius: 12, padding: "10px 22px", fontSize: 13, fontWeight: 600, color: "#be185d", cursor: "pointer", fontFamily: "inherit" }}>
                Cerrar 🌸
              </button>
            </div>
          </div>
        )}

      </div>


      {/* Lightbox */}
      {fotoActiva !== null && fotos[fotoActiva] && (
        <Lightbox
          foto={fotos[fotoActiva]}
          acento={acento}
          t={t}
          onClose={() => setFotoActiva(null)}
          onPrev={() => setFotoActiva(i => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setFotoActiva(i => Math.min(fotos.length - 1, (i ?? 0) + 1))}
          hasPrev={fotoActiva > 0}
          hasNext={fotoActiva < fotos.length - 1}
          esOrg={esOrg}
          onDelete={() => eliminarFoto(fotos[fotoActiva].id)}
        />
      )}

      {/* Barra organizador fija */}
      {esOrg && (
        <div className="org-bottom-bar">
          <Link href="/dashboard" className="org-btn-back">
            {Ico.dashboard(16,"#4F46E5")} Dashboard
          </Link>
        </div>
      )}

      {/* Nav bottom invitados: Fotos / Deseos / Boda Civil (sin Albums) */}
      {!esOrg && invId && (
        <nav className="bottom-nav">
          <div className="nav-guest-row">
            <button
              className="nav-guest-btn"
              onClick={() => setModalSubir(true)}
              style={{
                background: yaFoto ? "rgba(22,163,74,0.10)" : "linear-gradient(135deg,#4F46E5,#3730A3)",
                color: yaFoto ? "#16a34a" : "white",
                border: yaFoto ? "1.5px solid rgba(22,163,74,0.28)" : "none",
                boxShadow: !yaFoto ? "0 3px 14px rgba(79,70,229,0.38)" : "none",
              }}
            >
              {yaFoto ? Ico.check(15,"#16a34a") : Ico.camera(15,"white")}
              {yaFoto ? t.yaCompartiste : t.comparteMomento}
              {yaFoto && <span style={{ fontSize:10, background:"#22c55e", color:"white", borderRadius:99, padding:"1px 5px", marginLeft:2 }}>{"\u2713"}</span>}
            </button>
            <button
              className="nav-guest-btn"
              onClick={() => setModalDeseo(true)}
              style={{
                background: yaDeseo ? "rgba(22,163,74,0.10)" : yaFoto ? "linear-gradient(135deg,#4F46E5,#3730A3)" : "#F3EDE4",
                color: yaDeseo ? "#16a34a" : yaFoto ? "white" : "#4F46E5",
                border: yaDeseo ? "1.5px solid rgba(22,163,74,0.28)" : yaFoto ? "none" : "1.5px solid rgba(79,70,229,0.28)",
                boxShadow: yaFoto && !yaDeseo ? "0 3px 14px rgba(79,70,229,0.38)" : "none",
              }}
            >
              {yaDeseo ? Ico.check(15,"#16a34a") : Ico.heart(15, yaFoto ? "white" : "#4F46E5")}
              {t.miDeseo}
              {yaDeseo && <span style={{ fontSize:10, background:"#22c55e", color:"white", borderRadius:99, padding:"1px 5px", marginLeft:2 }}>{"\u2713"}</span>}
            </button>
          </div>

          <div className="nav-tabs" style={{ gridTemplateColumns: evento?.tipo === "boda" && bodaCivil ? "repeat(3,1fr)" : "repeat(2,1fr)" }}>
            {([
              { key: "fotos" as Vista, icon: Ico.grid(20, vista === "fotos" ? "#4F46E5" : "#94a3b8"), label: t.fotos, count: fotos.length },
              { key: "deseos" as Vista, icon: Ico.heart(20, vista === "deseos" ? "#4F46E5" : "#94a3b8"), label: t.deseos, count: deseos.length },
              ...(evento?.tipo === "boda" && bodaCivil
                ? [{ key: "boda" as Vista, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={vista === "boda" ? "#4F46E5" : "#94a3b8"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, label: "Boda Civil", count: 0 }]
                : []),
            ] as { key: Vista; icon: React.ReactNode; label: string; count: number }[]).map((tab) => (
              <button
                className={`nav-tab${vista === tab.key ? " active" : ""}`}
                onClick={() => setVista(tab.key)}
              >
                {tab.count > 0 && <span className="nav-tab-badge">{tab.count}</span>}
                <span className="nav-tab-icon">{tab.icon}</span>
                <span className="nav-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {modalSubir && invId && (
        <ModalSubirFoto
          invitadoId={invId}
          eventoId={eventoId}
          onClose={() => setModalSubir(false)}
          onSubida={() => { setYaFoto(true); setModalSubir(false); cargarFotos(); }}
          t={t}
        />
      )}

      {modalDeseo && (
        <ModalDeseo
          invitadoNombre={invNombre}
          yaDejoDeseo={yaDeseo}
          yaSubioFoto={yaFoto}
          onClose={() => setModalDeseo(false)}
          onPublicado={() => { setYaDeseo(true); setModalDeseo(false); cargarDeseos(); }}
          onIrAFoto={() => { setModalDeseo(false); setModalSubir(true); }}
          t={t}
        />
      )}
      {/* Confetti boda civil */}
      {bodaConfettiKey > 0 && (
        <div key={bodaConfettiKey} className="boda-confetti-layer">
          {Array.from({length: 36}, (_, i) => {
            const pieces = ["❤️","🌸","💕","🌺","💗","🌷","💖","✨","🎊","💝","🌼","💫"];
            const e = pieces[i % pieces.length];
            const left = ((i * 31 + i * i * 0.7) % 98) + 1;
            const dur = 2.5 + (i % 6) * 0.35;
            const delay = (i % 9) * 0.15;
            const size = 18 + (i % 4) * 5;
            return <span key={i} className="boda-confetti-piece" style={{ left: `${left}%`, animationDuration: `${dur}s`, animationDelay: `${delay}s`, fontSize: size }}>{e}</span>;
          })}
        </div>
      )}
      {/* Lightbox fotos boda civil */}
      {bodaLightbox && (
        <div className="boda-lightbox" onClick={() => setBodaLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bodaLightbox} alt="Foto boda" onClick={e => e.stopPropagation()} />
          <button className="boda-lightbox-close" onClick={() => setBodaLightbox(null)}>×</button>
        </div>
      )}
    </main>
  );
}

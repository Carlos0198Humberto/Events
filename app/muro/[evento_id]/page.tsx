"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

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

// ─── Logo Eventix ──────────────────────────────────────────────────────────────
function AppLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={`ev-logo-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="#6366F1" /></linearGradient></defs><rect width="64" height="64" rx="18" fill={`url(#ev-logo-${size})`} /><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" /><rect x="13" y="14" width="6" height="36" rx="3" fill="#FFFFFF" /><rect x="13" y="14" width="24" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="29" width="18" height="6" rx="3" fill="#FFFFFF" /><rect x="13" y="44" width="24" height="6" rx="3" fill="#FFFFFF" /><path d="M48 11 L49.8 17.2 L56 19 L49.8 20.8 L48 27 L46.2 20.8 L40 19 L46.2 17.2 Z" fill="#E0E7FF" /><circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.7" /></svg>
  );
}

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

// ─── FotoCard ──────────────────────────────────────────────────────────────────
function FotoCard({
  foto,
  acento,
  esOrg,
  onDelete,
  onClick,
  t,
}: {
  foto: Foto;
  acento: string;
  esOrg: boolean;
  onDelete: (id: string) => void;
  onClick: () => void;
  t: (typeof T)["es"];
}) {
  const nombre = foto.invitados?.nombre ?? "Invitado";
  return (
    <div
      className="foto-card break-inside-avoid mb-3"
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 3px 14px rgba(0,0,0,0.10)",
      }}
    >
      <div
        onClick={onClick}
        style={{ cursor: "pointer", position: "relative" }}
      >
        <Image
          src={foto.url}
          alt=""
          width={400}
          height={400}
          className="w-full h-auto object-cover block"
          unoptimized
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 52%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "10px 10px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(255,255,255,0.96)",
              borderRadius: 99,
              padding: "3px 9px 3px 4px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
              alignSelf: "flex-start",
            }}
          >
            <Avatar nombre={nombre} size={20} bg={acento} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#374151",
                maxWidth: 90,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nombre}
            </span>
          </div>
          {foto.caption && (
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 10,
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              {foto.caption}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          descargarImagen(foto.url, `foto_${foto.id}.jpg`);
        }}
        title={t.descargar}
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "rgba(255,255,255,0.92)",
          color: acento,
          border: "none",
          borderRadius: 99,
          width: 30,
          height: 30,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
          zIndex: 10,
        }}
      >
        {Ico.download(13, acento)}
      </button>
      {esOrg && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(foto.id);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(220,38,38,0.88)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "5px 9px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          {Ico.trash(12, "white")}
        </button>
      )}
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

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
type Vista = "fotos" | "albumes" | "deseos";

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

  const t = T[lang];

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    const token = new URLSearchParams(window.location.search).get("token");

    // ── Leer tab inicial desde URL ──────────────────────────────────────────
    const tabParam = new URLSearchParams(window.location.search).get(
      "tab",
    ) as Vista | null;
    if (tabParam && ["fotos", "albumes", "deseos"].includes(tabParam)) {
      setVista(tabParam);
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
    // Descarga las fotos una por una con nombre de la persona
    for (let i = 0; i < album.fotos.length; i++) {
      const foto = album.fotos[i];
      try {
        const resp = await fetch(foto.url);
        const blob = await resp.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${album.label.replace(/\s/g, "_")}_foto${i + 1}.jpg`;
        a.click();
        await new Promise((r) => setTimeout(r, 400));
      } catch {}
    }
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
    }));
  })();

  const tokenParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : "";
  const pasoJourney = !invId ? null : !yaFoto ? 3 : !yaDeseo ? 4 : 5;

  useEffect(() => {
    if (!evento) return;
    const emoji = TIPO_EMOJI[evento.tipo] ?? "✨";
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#4F46E5";
      ctx.beginPath();
      ctx.roundRect(0, 0, 64, 64, 14);
      ctx.fill();
      ctx.font = "36px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, 32, 32);
    }
    const link =
      document.querySelector<HTMLLinkElement>("link[rel~='icon']") ||
      document.createElement("link");
    link.rel = "icon";
    link.href = canvas.toDataURL();
    document.head.appendChild(link);
    document.title = evento.nombre ? `${evento.nombre} · Eventix` : "Eventix";
  }, [evento]);

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
          <div style={{marginTop: 14, fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 26, color: "#0F172A", letterSpacing: 3}}>Eventix</div>
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

  const fechaFmt = new Date(evento.fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFBFF",
        paddingBottom: 100,
        fontFamily: "'DM Sans',sans-serif",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
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

        /* ── Compact sticky header ── */
        .muro-header {
          position: sticky; top: 7px; z-index: 150;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(79, 70, 229,0.15);
          box-shadow: 0 2px 12px rgba(15,23,42,0.06);
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
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
      `}</style>

      {/* ── Bordes festivos ── */}
      <div className="confetti-top" />
      <div className="confetti-bottom" />

      {/* ══ HERO ══ */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg,#3730A3 0%,#4F46E5 100%)",
          color: "white",
          padding: "18px 16px 20px",
          textAlign: "center",
        }}
      >
        {evento.imagen_url && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${evento.imagen_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.13,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg,rgba(0,0,0,0.06) 0%,rgba(0,0,0,0.32) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)",
            backgroundSize: "26px 26px",
            pointerEvents: "none",
          }}
        />

        {/* Header row dentro del hero */}
        <div style={{ position: "relative", zIndex: 5, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <AppLogo size={26} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.9, fontFamily: "'DM Sans',sans-serif" }}>Eventix</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setLang(lang === "es" ? "en" : "es")} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "5px 9px", fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}>
              {lang === "es" ? "EN" : "ES"}
            </button>
            {esOrg && (
              <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "5px 9px", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
                {Ico.dashboard(12, "white")}
              </Link>
            )}
          </div>
        </div>

        {/* Evento info */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 3, lineHeight: 1.15, fontFamily: "'Playfair Display',serif" }}>
            {evento.nombre}
          </h1>
          {evento.anfitriones && (
            <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 2 }}>{evento.anfitriones}</p>
          )}
          {evento.frase_evento && (
            <p style={{ fontSize: 12, fontStyle: "italic", opacity: 0.72, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>"{evento.frase_evento}"</p>
          )}
          <p style={{ fontSize: 10.5, opacity: 0.62, letterSpacing: "0.2px" }}>
            {fechaFmt}{evento.lugar ? ` · ${evento.lugar}` : ""}
          </p>

          {/* Stats compactos */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
            {[
              { num: fotos.length, label: t.fotos },
              { num: deseos.length, label: t.deseos },
              { num: albumes.length, label: t.participantes },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "5px 12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1, fontFamily: "'Playfair Display',serif" }}>{s.num}</div>
                <div style={{ fontSize: 9, opacity: 0.78, marginTop: 1, letterSpacing: "0.2px" }}>{s.label}</div>
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

      {/* ══ CONTENIDO ══ */}
      <div style={{ padding: "14px 14px 0", maxWidth: 640, margin: "0 auto", paddingBottom: invId ? "160px" : "100px" }}>
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
            <div style={{ columns: "2 150px", gap: 10 }}>
              {fotos.map((foto, idx) => (
                <FotoCard
                  key={foto.id}
                  foto={foto}
                  acento={acento}
                  esOrg={esOrg}
                  onDelete={eliminarFoto}
                  onClick={() => setFotoActiva(idx)}
                  t={t}
                />
              ))}
            </div>
          ))}

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
                      onClick={async () => {
                        for (let i = 0; i < album.fotos.length; i++) {
                          await descargarImagen(
                            album.fotos[i].url,
                            `${album.label}_foto${i + 1}.jpg`,
                          );
                          await new Promise((r) => setTimeout(r, 400));
                        }
                      }}
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
      </div>

      {/* ══ Lightbox ══ */}
      {fotoActiva !== null && fotos[fotoActiva] && (
        <Lightbox
          foto={fotos[fotoActiva]}
          acento={acento}
          esOrg={esOrg}
          onClose={() => setFotoActiva(null)}
          onDelete={() => eliminarFoto(fotos[fotoActiva].id)}
          onPrev={() => setFotoActiva((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() =>
            setFotoActiva((i) =>
              i !== null && i < fotos.length - 1 ? i + 1 : i,
            )
          }
          hasPrev={fotoActiva > 0}
          hasNext={fotoActiva < fotos.length - 1}
          t={t}
        />
      )}

      {/* ══ Modales ══ */}
      {modalSubir && invId && (
        <ModalSubirFoto
          eventoId={eventoId}
          invitadoId={invId}
          onClose={() => setModalSubir(false)}
          onSubida={async () => {
            await cargarFotos();
            setYaFoto(true);
          }}
          t={t}
        />
      )}
      {modalDeseo && invId && (
        <ModalDeseo
          invitadoNombre={invNombre}
          yaDejoDeseo={yaDeseo}
          yaSubioFoto={yaFoto}
          onClose={() => setModalDeseo(false)}
          onPublicado={publicarDeseo}
          onIrAFoto={() => {
            setModalDeseo(false);
            setModalSubir(true);
          }}
          t={t}
        />
      )}

      {/* ══ BOTTOM NAV ══ */}
      <nav className="bottom-nav">
        {/* Acciones del invitado */}
        {invId && (
          <div className="nav-guest-row">
            <button
              className="nav-guest-btn"
              onClick={() => setModalSubir(true)}
              style={{
                background: yaFoto ? "rgba(22,163,74,0.10)" : "linear-gradient(135deg,#4F46E5,#3730A3)",
                color: yaFoto ? "#16a34a" : "white",
                border: yaFoto ? "1.5px solid rgba(22,163,74,0.28)" : "none",
                boxShadow: yaFoto ? "none" : "0 3px 14px rgba(79, 70, 229,0.38)",
              }}
            >
              {yaFoto ? Ico.check(15, "#16a34a") : Ico.camera(15, "white")}
              {t.subirMiFoto}
              {yaFoto && <span style={{ fontSize: 10, background: "#22c55e", color: "white", borderRadius: 99, padding: "1px 5px", marginLeft: 2 }}>✓</span>}
            </button>
            <button
              className="nav-guest-btn"
              onClick={() => setModalDeseo(true)}
              style={{
                background: yaDeseo ? "rgba(22,163,74,0.10)" : yaFoto ? "linear-gradient(135deg,#4F46E5,#3730A3)" : "#F3EDE4",
                color: yaDeseo ? "#16a34a" : yaFoto ? "white" : "#4F46E5",
                border: yaDeseo ? "1.5px solid rgba(22,163,74,0.28)" : yaFoto ? "none" : "1.5px solid rgba(79, 70, 229,0.28)",
                boxShadow: yaFoto && !yaDeseo ? "0 3px 14px rgba(79, 70, 229,0.38)" : "none",
              }}
            >
              {yaDeseo ? Ico.check(15, "#16a34a") : Ico.heart(15, yaFoto ? "white" : "#4F46E5")}
              {t.miDeseo}
              {yaDeseo && <span style={{ fontSize: 10, background: "#22c55e", color: "white", borderRadius: 99, padding: "1px 5px", marginLeft: 2 }}>✓</span>}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="nav-tabs">
          {([
            { key: "fotos" as Vista, icon: Ico.grid(20, vista === "fotos" ? "#4F46E5" : "#94a3b8"), label: t.fotos, count: fotos.length },
            { key: "albumes" as Vista, icon: Ico.folder(20, vista === "albumes" ? "#4F46E5" : "#94a3b8"), label: t.albumes, count: albumes.length },
            { key: "deseos" as Vista, icon: Ico.heart(20, vista === "deseos" ? "#4F46E5" : "#94a3b8"), label: t.deseos, count: deseos.length },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              className={`nav-tab${vista === tab.key ? " active" : ""}`}
              onClick={() => setVista(tab.key)}
            >
              {tab.count > 0 && <span className="nav-tab-badge">{tab.count}</span>}
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          ))}
          <Link
            href={`/libro/${eventoId}${tokenParam ? `?token=${tokenParam}` : ""}`}
            className="nav-tab"
          >
            <span className="nav-tab-icon" style={{ color: "#94a3b8" }}>{Ico.book(20, "#94a3b8")}</span>
            <span className="nav-tab-label">{t.libro}</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}

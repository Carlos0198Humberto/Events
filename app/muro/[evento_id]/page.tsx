"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

// ─── Tipos ─────────────────────────────────────────────────
type Foto = {
  id: string;
  url: string;
  created_at: string;
  invitado_id: string;
  caption: string | null;
  invitados: { nombre: string } | null;
  reacciones?: ReaccionConteo[];
};

type ReaccionConteo = {
  emoji: string;
  count: number;
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

// ─── Constantes ────────────────────────────────────────────
const EMOJIS_REACCION = [
  { emoji: "🙏", label: "Bendiciones" },
  { emoji: "❤️", label: "Con amor" },
  { emoji: "🎉", label: "Felicidades" },
];

const COLORES_DESEO = [
  "#e8f8f5",
  "#fff9c4",
  "#fce4ec",
  "#e0f5f2",
  "#e3f2fd",
  "#f3e5f5",
  "#fff3e0",
  "#fbe9e7",
];

const STICKERS = ["🌸", "💖", "✨", "🌟", "🎊", "🦋", "🌹", "💫", "🎀", "🍀"];

// ─── Paleta por tipo de evento — acento menta en todos ────
const paleta: Record<
  string,
  {
    bg: string;
    texto: string;
    acento: string;
    claro: string;
    gradHero: string;
    gradHeroAlt: string;
  }
> = {
  quinceañera: {
    bg: "#f0faf8",
    texto: "#3AADA0",
    acento: "#7DD4C8",
    claro: "#e0f5f2",
    gradHero: "linear-gradient(135deg,#2e948a 0%,#3AADA0 100%)",
    gradHeroAlt:
      "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.45) 100%)",
  },
  boda: {
    bg: "#f0faf8",
    texto: "#3AADA0",
    acento: "#7DD4C8",
    claro: "#e0f5f2",
    gradHero: "linear-gradient(135deg,#2e948a 0%,#3AADA0 100%)",
    gradHeroAlt:
      "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.45) 100%)",
  },
  graduacion: {
    bg: "#f0faf8",
    texto: "#3AADA0",
    acento: "#7DD4C8",
    claro: "#e0f5f2",
    gradHero: "linear-gradient(135deg,#2e948a 0%,#3AADA0 100%)",
    gradHeroAlt:
      "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.45) 100%)",
  },
  cumpleaños: {
    bg: "#f0faf8",
    texto: "#3AADA0",
    acento: "#7DD4C8",
    claro: "#e0f5f2",
    gradHero: "linear-gradient(135deg,#2e948a 0%,#3AADA0 100%)",
    gradHeroAlt:
      "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.45) 100%)",
  },
  otro: {
    bg: "#f0faf8",
    texto: "#3AADA0",
    acento: "#7DD4C8",
    claro: "#e0f5f2",
    gradHero: "linear-gradient(135deg,#2e948a 0%,#3AADA0 100%)",
    gradHeroAlt:
      "linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0.45) 100%)",
  },
};

// ─── Logo SVG de la app ───────────────────────────────────
function AppLogo({
  size = 28,
  color = "white",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect
        x="3"
        y="8"
        width="26"
        height="18"
        rx="3"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.6"
      />
      <path
        d="M3 11l13 9 13-9"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 7c0 0-5-3.5-5 1.2C11 11 16 14 16 14s5-3 5-5.8C21 3.5 16 7 16 7z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Íconos SVG ──────────────────────────────────────────
function IconCamera({
  size = 20,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconGrid({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function IconFolder({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}
function IconBook({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}
function IconHeart({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
function IconX({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconChevronLeft({
  size = 20,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconChevronRight({
  size = 20,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function IconTrash({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}
function IconBack({
  size = 16,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function IconLock({
  size = 15,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
function IconCheck({
  size = 15,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Avatar ──────────────────────────────────────────────
function Avatar({
  nombre,
  size = 28,
  bgColor,
}: {
  nombre: string;
  size?: number;
  bgColor: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "2px solid white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
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

function MedallaFotografo({
  nombre,
  bgColor,
}: {
  nombre: string;
  bgColor: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,0.95)",
        borderRadius: 99,
        padding: "4px 10px 4px 4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <Avatar nombre={nombre} size={22} bgColor={bgColor} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#374151",
          maxWidth: 100,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {nombre}
      </span>
    </div>
  );
}

// ─── Tarjeta de foto ──────────────────────────────────────
function FotoCard({
  foto,
  col,
  esOrganizador,
  invitadoId,
  onDelete,
  onClick,
  onReaccionar,
}: {
  foto: Foto;
  col: (typeof paleta)[string];
  esOrganizador: boolean;
  invitadoId: string | null;
  onDelete: (id: string) => void;
  onClick: () => void;
  onReaccionar: (fotoId: string, emoji: string) => void;
}) {
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const nombre = foto.invitados?.nombre ?? "Invitado";

  return (
    <div
      className="break-inside-avoid mb-3"
      style={{
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}
    >
      <div
        onClick={onClick}
        style={{ cursor: "pointer", position: "relative" }}
      >
        <Image
          src={foto.url}
          alt={`Foto de ${nombre}`}
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
              "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "10px 12px",
          }}
        >
          {foto.reacciones && foto.reacciones.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                marginBottom: 6,
              }}
            >
              {foto.reacciones.map((r) => (
                <span
                  key={r.emoji}
                  style={{
                    background: "rgba(58,173,160,0.55)",
                    color: "white",
                    borderRadius: 99,
                    padding: "2px 7px",
                    fontSize: 11,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {r.emoji} {r.count}
                </span>
              ))}
            </div>
          )}
          <MedallaFotografo nombre={nombre} bgColor={col.texto} />
          {foto.caption && (
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 11,
                marginTop: 5,
                fontStyle: "italic",
              }}
            >
              {foto.caption}
            </p>
          )}
        </div>
      </div>

      {invitadoId && (
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}>
          {mostrarEmojis ? (
            <div
              style={{
                background: "rgba(255,255,255,0.97)",
                borderRadius: 14,
                padding: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 155,
              }}
            >
              {EMOJIS_REACCION.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReaccionar(foto.id, emoji);
                    setMostrarEmojis(false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 8,
                    textAlign: "left",
                    fontSize: 13,
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  {label}
                </button>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMostrarEmojis(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "#9ca3af",
                  textAlign: "center",
                  paddingTop: 4,
                }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMostrarEmojis(true);
              }}
              style={{
                background: "rgba(58,173,160,0.92)",
                border: "none",
                borderRadius: 99,
                padding: "5px 12px",
                fontSize: 12,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                fontWeight: 600,
                color: "white",
              }}
            >
              Reaccionar
            </button>
          )}
        </div>
      )}

      {esOrganizador && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(foto.id);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(220,38,38,0.9)",
            color: "white",
            border: "none",
            borderRadius: 99,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <IconTrash size={13} color="white" />
        </button>
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────
function Lightbox({
  foto,
  col,
  esOrganizador,
  invitadoId,
  onClose,
  onDelete,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onReaccionar,
}: {
  foto: Foto;
  col: (typeof paleta)[string];
  esOrganizador: boolean;
  invitadoId: string | null;
  onClose: () => void;
  onDelete: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onReaccionar: (fotoId: string, emoji: string) => void;
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
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(12px)",
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
          borderRadius: 24,
          overflow: "hidden",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Image
            src={foto.url}
            alt="Foto ampliada"
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
                background: "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: "50%",
                width: 38,
                height: 38,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconChevronLeft size={20} color="#3AADA0" />
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
                background: "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: "50%",
                width: 38,
                height: 38,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconChevronRight size={20} color="#3AADA0" />
            </button>
          )}
        </div>

        <div style={{ padding: "14px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar nombre={nombre} size={38} bgColor={col.texto} />
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
            <div style={{ display: "flex", gap: 8 }}>
              {esOrganizador && (
                <button
                  onClick={onDelete}
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: 12,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <IconTrash size={14} color="#dc2626" /> Eliminar
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "#e0f5f2",
                  color: "#3AADA0",
                  border: "none",
                  borderRadius: 12,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconX size={16} color="#3AADA0" />
              </button>
            </div>
          </div>

          {foto.caption && (
            <p
              style={{
                fontSize: 13,
                color: "#4b5563",
                fontStyle: "italic",
                marginBottom: 12,
              }}
            >
              "{foto.caption}"
            </p>
          )}

          {invitadoId && (
            <div style={{ borderTop: "1px solid #e0f5f2", paddingTop: 12 }}>
              <p
                style={{
                  fontSize: 10,
                  color: "#3AADA0",
                  fontWeight: 700,
                  marginBottom: 8,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                }}
              >
                Reacciona a esta foto
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {EMOJIS_REACCION.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => onReaccionar(foto.id, emoji)}
                    style={{
                      flex: 1,
                      background: "#f0faf8",
                      border: `1.5px solid #7DD4C8`,
                      borderRadius: 12,
                      padding: "8px 4px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "#3AADA0",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
              {foto.reacciones && foto.reacciones.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {foto.reacciones.map((r) => (
                    <span
                      key={r.emoji}
                      style={{
                        background: "#e0f5f2",
                        borderRadius: 99,
                        padding: "3px 10px",
                        fontSize: 12,
                        color: "#2e948a",
                      }}
                    >
                      {r.emoji} {r.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal subir foto ─────────────────────────────────────
function ModalSubirFoto({
  eventoId,
  invitadoId,
  col,
  onClose,
  onSubida,
}: {
  eventoId: string;
  invitadoId: string;
  col: (typeof paleta)[string];
  onClose: () => void;
  onSubida: () => void;
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
    await supabase.from("fotos").insert({
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
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxWidth: 480,
          padding: 24,
          paddingBottom: 40,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "#7DD4C8",
            margin: "0 auto 20px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: "#0f2422",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              {yaSubio ? "Ya compartiste tu foto" : "Comparte un momento"}
            </p>
            {!yaSubio && (
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                Solo 1 foto por invitado
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#e0f5f2",
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
            <IconX size={16} color="#3AADA0" />
          </button>
        </div>

        {yaSubio ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: col.claro,
                border: `2px solid ${col.acento}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <IconCheck size={28} color={col.texto} />
            </div>
            <p
              style={{
                fontWeight: 700,
                color: col.texto,
                fontSize: 16,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              Tu foto ya está en el muro
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              Ahora puedes dejar tu deseo en la sección de Deseos
            </p>
          </div>
        ) : (
          <>
            {preview ? (
              <div style={{ marginBottom: 14 }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    maxHeight: 220,
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
                    marginTop: 8,
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
                  <IconX size={13} color="#9ca3af" /> Cambiar foto
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  border: `2px dashed ${col.acento}`,
                  borderRadius: 18,
                  padding: "32px 20px",
                  cursor: "pointer",
                  background: col.claro,
                  marginBottom: 14,
                  transition: "border-color 0.2s",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: col.texto,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconCamera size={24} color="white" />
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: col.texto,
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  Seleccionar foto
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8" }}>
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
                placeholder="Añade una descripción (opcional)"
                maxLength={120}
                style={{
                  width: "100%",
                  border: `1.5px solid ${col.acento}`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  background: col.claro,
                  marginBottom: 14,
                }}
              />
            )}

            {archivo && (
              <button
                onClick={subir}
                disabled={subiendo}
                style={{
                  width: "100%",
                  background: subiendo ? col.acento : col.texto,
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
                  fontFamily: "'Cormorant Garamond', serif",
                  letterSpacing: "0.3px",
                }}
              >
                <IconCamera size={18} color="white" />
                {subiendo ? "Subiendo..." : "Publicar en el muro"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tarjeta de Deseo ─────────────────────────────────────
function DeseoCard({
  deseo,
  col,
  esOrganizador,
  onDelete,
}: {
  deseo: Deseo;
  col: (typeof paleta)[string];
  esOrganizador: boolean;
  onDelete: (id: string) => void;
}) {
  const fechaCorta = new Date(deseo.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
  return (
    <div
      style={{
        background: deseo.color_fondo,
        borderRadius: 20,
        padding: "18px 16px 14px",
        boxShadow: "0 4px 18px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
        position: "relative",
        border: "1px solid rgba(255,255,255,0.9)",
        animation: "popIn 0.3s ease",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        breakInside: "avoid",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
          right: 14,
          fontSize: 26,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
        }}
      >
        {deseo.emoji_sticker}
      </div>
      <p
        style={{
          fontSize: 14,
          color: "#2d3748",
          lineHeight: 1.65,
          fontStyle: "italic",
          paddingRight: 24,
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        "{deseo.mensaje}"
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Avatar nombre={deseo.nombre_autor} size={26} bgColor={col.texto} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 12, color: "#374151" }}>
              {deseo.nombre_autor}
            </p>
            <p style={{ fontSize: 10, color: "#9ca3af" }}>{fechaCorta}</p>
          </div>
        </div>
        {esOrganizador && (
          <button
            onClick={() => onDelete(deseo.id)}
            style={{
              background: "rgba(220,38,38,0.1)",
              color: "#dc2626",
              border: "none",
              borderRadius: 8,
              padding: "5px 9px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconTrash size={12} color="#dc2626" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Modal publicar Deseo ─────────────────────────────────
function ModalDeseo({
  col,
  invitadoNombre,
  yaDejoDeseo,
  yaSubioFoto,
  onClose,
  onPublicado,
}: {
  col: (typeof paleta)[string];
  invitadoNombre: string;
  yaDejoDeseo: boolean;
  yaSubioFoto: boolean;
  onClose: () => void;
  onPublicado: (deseo: Partial<Deseo>) => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [stickerSel, setStickerSel] = useState(STICKERS[0]);
  const [colorSel, setColorSel] = useState(COLORES_DESEO[0]);
  const [enviando, setEnviando] = useState(false);

  const publicar = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    onPublicado({
      mensaje: mensaje.trim(),
      emoji_sticker: stickerSel,
      color_fondo: colorSel,
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
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxWidth: 480,
          padding: 24,
          paddingBottom: 40,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.22)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "#7DD4C8",
            margin: "0 auto 20px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                fontWeight: 800,
                fontSize: 17,
                color: "#0f2422",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              {yaDejoDeseo ? "Tu deseo ya fue enviado" : "Escribir un deseo"}
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {yaDejoDeseo
                ? "Solo se permite 1 deseo por invitado"
                : "Tu mensaje aparecerá en el muro"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#e0f5f2",
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
            <IconX size={16} color="#3AADA0" />
          </button>
        </div>

        {yaDejoDeseo ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: col.claro,
                border: `2px solid ${col.acento}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <IconHeart size={28} color={col.texto} />
            </div>
            <p
              style={{
                fontWeight: 700,
                color: col.texto,
                fontSize: 16,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              Tu deseo ya está en el muro
            </p>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
              Gracias por compartir tu mensaje especial
            </p>
          </div>
        ) : !yaSubioFoto ? (
          <div style={{ textAlign: "center", padding: "28px 16px" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: col.claro,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <IconLock size={28} color={col.texto} />
            </div>
            <p
              style={{
                fontWeight: 700,
                color: "#374151",
                fontSize: 16,
                fontFamily: "'Cormorant Garamond', serif",
                marginBottom: 8,
              }}
            >
              Primero sube tu foto
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
              Para dejar un deseo, primero debes compartir tu foto del evento.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 20,
                background: col.texto,
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              Ir a subir mi foto
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                background: colorSel,
                borderRadius: 18,
                padding: "16px 14px 12px",
                marginBottom: 18,
                position: "relative",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 14,
                  fontSize: 24,
                }}
              >
                {stickerSel}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: mensaje ? "#2d3748" : "#cbd5e1",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  minHeight: 40,
                  paddingRight: 20,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {mensaje ? `"${mensaje}"` : "Tu mensaje aparecerá aquí..."}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 10,
                }}
              >
                <Avatar nombre={invitadoNombre} size={22} bgColor={col.texto} />
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}
                >
                  {invitadoNombre}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#3AADA0",
                  display: "block",
                  marginBottom: 6,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Tu mensaje *
              </label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe tu deseo, dedicatoria o mensaje especial..."
                maxLength={280}
                rows={3}
                style={{
                  width: "100%",
                  border: `1.5px solid ${col.acento}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "'Cormorant Garamond', serif",
                  boxSizing: "border-box",
                  background: col.claro,
                  resize: "none",
                  lineHeight: 1.6,
                }}
              />
              <p
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 4,
                  textAlign: "right",
                }}
              >
                {mensaje.length}/280
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#3AADA0",
                  display: "block",
                  marginBottom: 8,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Elige un sticker
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STICKERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStickerSel(s)}
                    style={{
                      fontSize: 22,
                      background: stickerSel === s ? col.claro : "#f9fafb",
                      border:
                        stickerSel === s
                          ? `2px solid ${col.acento}`
                          : "2px solid transparent",
                      borderRadius: 10,
                      padding: "4px 8px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#3AADA0",
                  display: "block",
                  marginBottom: 8,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Color de tarjeta
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COLORES_DESEO.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColorSel(c)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: c,
                      border:
                        colorSel === c
                          ? `3px solid #3AADA0`
                          : "3px solid transparent",
                      cursor: "pointer",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                      transition: "transform 0.15s",
                      transform: colorSel === c ? "scale(1.2)" : "scale(1)",
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
                background: mensaje.trim() ? col.texto : "#e2e8f0",
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
                transition: "background 0.2s",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              <IconHeart
                size={18}
                color={mensaje.trim() ? "white" : "#9ca3af"}
              />
              {enviando ? "Publicando..." : "Publicar deseo"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────
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
  const [esOrganizador, setEsOrganizador] = useState(false);
  const [vista, setVista] = useState<Vista>("fotos");
  const [invitadoId, setInvitadoId] = useState<string | null>(null);
  const [invitadoNombre, setInvitadoNombre] = useState<string>("");
  const [modalSubir, setModalSubir] = useState(false);
  const [modalDeseo, setModalDeseo] = useState(false);
  const [yaSubioFoto, setYaSubioFoto] = useState(false);
  const [yaDejoDeseo, setYaDejoDeseo] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      supabase
        .from("invitados")
        .select("id, nombre")
        .eq("token", token)
        .single()
        .then(({ data }) => {
          if (data) {
            setInvitadoId(data.id);
            setInvitadoNombre(data.nombre);
          }
        });
    }
    cargarDatos();
    verificarOrganizador();

    const canal = supabase
      .channel("muro-fotos")
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

    const canalReacciones = supabase
      .channel("muro-reacciones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reacciones" },
        cargarFotos,
      )
      .subscribe();

    const canalDeseos = supabase
      .channel("muro-deseos")
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
      supabase.removeChannel(canal);
      supabase.removeChannel(canalReacciones);
      supabase.removeChannel(canalDeseos);
    };
  }, []);

  useEffect(() => {
    if (!invitadoId) return;
    verificarJourney(invitadoId);
  }, [invitadoId]);

  async function verificarJourney(iId: string) {
    const [{ data: fotosData }, { data: deseosData }] = await Promise.all([
      supabase.from("fotos").select("id").eq("invitado_id", iId),
      supabase.from("deseos").select("id").eq("invitado_id", iId),
    ]);
    if (fotosData && fotosData.length > 0) setYaSubioFoto(true);
    if (deseosData && deseosData.length > 0) setYaDejoDeseo(true);
  }

  async function verificarOrganizador() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ev } = await supabase
      .from("eventos")
      .select("organizador_id")
      .eq("id", eventoId)
      .single();
    if (ev && ev.organizador_id === user.id) setEsOrganizador(true);
  }

  async function cargarDatos() {
    const { data: ev } = await supabase
      .from("eventos")
      .select(
        "id, nombre, tipo, fecha, anfitriones, organizador_id, imagen_url, frase_evento, lugar",
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
      .select(
        "id, url, created_at, invitado_id, caption, invitados(nombre), reacciones(emoji)",
      )
      .eq("evento_id", eventoId)
      .eq("estado", "aprobada")
      .order("created_at", { ascending: false });
    if (!data) return;
    const fotosConR = data.map((f: any) => {
      const conteo: Record<string, number> = {};
      (f.reacciones ?? []).forEach((r: { emoji: string }) => {
        conteo[r.emoji] = (conteo[r.emoji] || 0) + 1;
      });
      return {
        ...f,
        reacciones: Object.entries(conteo).map(([emoji, count]) => ({
          emoji,
          count,
        })),
      };
    });
    setFotos(fotosConR as Foto[]);
  }

  async function cargarDeseos() {
    const { data } = await supabase
      .from("deseos")
      .select("*")
      .eq("evento_id", eventoId)
      .eq("aprobado", true)
      .order("created_at", { ascending: false });
    if (data) setDeseos(data as Deseo[]);
  }

  async function eliminarFoto(id: string) {
    if (!confirm("¿Eliminar esta foto del muro?")) return;
    await supabase.from("fotos").delete().eq("id", id);
    setFotos((prev) => prev.filter((f) => f.id !== id));
    if (fotoActiva !== null) setFotoActiva(null);
  }

  async function eliminarDeseo(id: string) {
    if (!confirm("¿Eliminar este deseo?")) return;
    await supabase.from("deseos").delete().eq("id", id);
    setDeseos((prev) => prev.filter((d) => d.id !== id));
  }

  async function reaccionar(fotoId: string, emoji: string) {
    if (!invitadoId) return;
    await supabase
      .from("reacciones")
      .upsert(
        { foto_id: fotoId, invitado_id: invitadoId, emoji },
        { onConflict: "foto_id,invitado_id" },
      );
    cargarFotos();
  }

  async function publicarDeseo(parcial: Partial<Deseo>) {
    if (!invitadoId) return;
    if (!yaSubioFoto) return;
    const nuevo = {
      evento_id: eventoId,
      invitado_id: invitadoId,
      nombre_autor: invitadoNombre || "Anónimo",
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
      setDeseos((prev) => [data as Deseo, ...prev]);
      setYaDejoDeseo(true);
    }
    setModalDeseo(false);
  }

  async function alSubirFoto() {
    await cargarFotos();
    setYaSubioFoto(true);
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

  const pasoJourney = !invitadoId
    ? null
    : !yaSubioFoto
      ? 3
      : !yaDejoDeseo
        ? 4
        : 5;

  if (loading)
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0faf8",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "3px solid #7DD4C8",
              borderTopColor: "#3AADA0",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p
            style={{
              color: "#3AADA0",
              fontWeight: 600,
              fontSize: 15,
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            Cargando muro...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
        <p style={{ color: "#6b7280" }}>Evento no encontrado</p>
      </main>
    );

  const col = paleta[evento.tipo] || paleta.otro;
  const fechaFormateada = new Date(evento.fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: col.bg,
        paddingBottom: 110,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.93) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .tab-nav-btn { transition: background 0.18s, color 0.18s; }
        .tab-nav-btn:active { transform: scale(0.95); }
        .foto-card-wrap:hover { transform: translateY(-2px); transition: transform 0.2s; }
        .btn-flotante { transition: transform 0.15s, box-shadow 0.15s; }
        .btn-flotante:hover { transform: scale(1.07); }
        .btn-flotante:active { transform: scale(0.95); }
      `}</style>

      {/* ══ HERO ══ */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: col.gradHero,
          color: "white",
          padding: "48px 20px 36px",
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
              opacity: 0.18,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        <button
          onClick={() => router.back()}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(255,255,255,0.18)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 10,
            padding: "7px 13px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          <IconBack size={15} color="white" /> Atrás
        </button>

        <Link
          href="/dashboard"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(255,255,255,0.18)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 10,
            padding: "7px 13px",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            backdropFilter: "blur(8px)",
          }}
        >
          Dashboard
        </Link>

        <div style={{ position: "relative", zIndex: 1, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AppLogo size={26} color="white" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                opacity: 0.85,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              Events
            </span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 6,
              lineHeight: 1.2,
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "-0.3px",
            }}
          >
            {evento.nombre}
          </h1>

          {evento.anfitriones && (
            <p
              style={{
                fontSize: 14,
                opacity: 0.88,
                marginBottom: 4,
                fontWeight: 400,
                letterSpacing: "0.2px",
              }}
            >
              {evento.anfitriones}
            </p>
          )}

          {evento.frase_evento && (
            <p
              style={{
                fontSize: 13,
                fontStyle: "italic",
                opacity: 0.75,
                marginBottom: 6,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              "{evento.frase_evento}"
            </p>
          )}

          <p style={{ fontSize: 11, opacity: 0.65, letterSpacing: "0.3px" }}>
            {fechaFormateada}
            {evento.lugar ? ` · ${evento.lugar}` : ""}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 22,
              flexWrap: "wrap",
            }}
          >
            {[
              { num: fotos.length, label: "fotos" },
              { num: deseos.length, label: "deseos" },
              { num: albumes.length, label: "participantes" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 14,
                  padding: "8px 18px",
                  backdropFilter: "blur(8px)",
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.8,
                    marginTop: 2,
                    letterSpacing: "0.3px",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {invitadoId && pasoJourney !== null && pasoJourney < 5 && (
            <div
              style={{
                marginTop: 18,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.28)",
                borderRadius: 14,
                padding: "10px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {pasoJourney === 3 ? (
                <>
                  <IconCamera size={14} color="white" />
                  <span>Paso 3: Comparte tu foto del evento</span>
                </>
              ) : (
                <>
                  <IconHeart size={14} color="white" />
                  <span>Paso 4: Escribe tu deseo al anfitrión</span>
                </>
              )}
            </div>
          )}
          {invitadoId && pasoJourney === 5 && (
            <div
              style={{
                marginTop: 18,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.28)",
                borderRadius: 14,
                padding: "10px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <IconCheck size={14} color="white" />
              <span>¡Completaste tu journey! Gracias, {invitadoNombre}</span>
            </div>
          )}
        </div>
      </div>

      {/* ══ Tabs ══ */}
      <div
        style={{
          background: "rgba(255,255,255,0.98)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid #7DD4C860`,
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 16px rgba(58,173,160,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          {[
            {
              key: "fotos" as Vista,
              icon: (
                <IconGrid
                  size={14}
                  color={vista === "fotos" ? "white" : "#3AADA0"}
                />
              ),
              label: `Fotos (${fotos.length})`,
            },
            {
              key: "albumes" as Vista,
              icon: (
                <IconFolder
                  size={14}
                  color={vista === "albumes" ? "white" : "#3AADA0"}
                />
              ),
              label: `Álbumes (${albumes.length})`,
            },
            {
              key: "deseos" as Vista,
              icon: (
                <IconHeart
                  size={14}
                  color={vista === "deseos" ? "white" : "#3AADA0"}
                />
              ),
              label: `Deseos (${deseos.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              className="tab-nav-btn"
              onClick={() => setVista(tab.key)}
              style={{
                flex: 1,
                background: vista === tab.key ? "#3AADA0" : "transparent",
                color: vista === tab.key ? "white" : "#3AADA0",
                border: "none",
                padding: "12px 6px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                borderBottom:
                  vista === tab.key
                    ? `3px solid #2e948a`
                    : "3px solid transparent",
                letterSpacing: "0.2px",
              }}
            >
              {tab.icon}
              <span style={{ whiteSpace: "nowrap" }}>{tab.label}</span>
            </button>
          ))}

          <Link
            href={`/libro/${eventoId}${tokenParam ? `?token=${tokenParam}` : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: "#e0f5f2",
              color: "#3AADA0",
              border: "none",
              borderLeft: `1px solid #7DD4C850`,
              padding: "12px 14px",
              fontSize: 11,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <IconBook size={14} color="#3AADA0" /> Libro
          </Link>
        </div>
      </div>

      {esOrganizador && (
        <div
          style={{ padding: "10px 16px 0", maxWidth: 640, margin: "0 auto" }}
        >
          <div
            style={{
              background: "#e0f5f2",
              border: `1px solid #7DD4C8`,
              borderRadius: 10,
              padding: "7px 14px",
              fontSize: 11,
              fontWeight: 700,
              color: "#3AADA0",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              letterSpacing: "0.3px",
            }}
          >
            <IconCheck size={13} color="#3AADA0" /> Modo organizador — puedes
            eliminar publicaciones
          </div>
        </div>
      )}

      {/* ══ Contenido ══ */}
      <div style={{ padding: "16px", maxWidth: 640, margin: "0 auto" }}>
        {/* ── FOTOS ── */}
        {vista === "fotos" &&
          (fotos.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 0",
                animation: "fadeUp 0.4s ease",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "#e0f5f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <IconCamera size={36} color="#7DD4C8" />
              </div>
              <p
                style={{
                  fontWeight: 700,
                  color: "#374151",
                  fontSize: 18,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                Aún no hay fotos
              </p>
              <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 6 }}>
                {invitadoId
                  ? "Sé el primero en compartir un momento"
                  : "Los invitados pueden subir sus fotos"}
              </p>
            </div>
          ) : (
            <div style={{ columns: "2 150px", gap: 10 }}>
              {fotos.map((foto, idx) => (
                <FotoCard
                  key={foto.id}
                  foto={foto}
                  col={col}
                  esOrganizador={esOrganizador}
                  invitadoId={invitadoId}
                  onDelete={eliminarFoto}
                  onClick={() => setFotoActiva(idx)}
                  onReaccionar={reaccionar}
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
                padding: "64px 0",
                animation: "fadeUp 0.4s ease",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "#e0f5f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <IconFolder size={36} color="#7DD4C8" />
              </div>
              <p
                style={{
                  fontWeight: 700,
                  color: "#374151",
                  fontSize: 18,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                Sin álbumes aún
              </p>
              <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 6 }}>
                Las fotos de cada invitado aparecerán aquí
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {albumes.map((album) => (
                <div key={album.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Avatar
                      nombre={album.label}
                      size={38}
                      bgColor={col.texto}
                    />
                    <div>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: "#111",
                          fontFamily: "'Cormorant Garamond', serif",
                        }}
                      >
                        {album.label}
                      </p>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>
                        {album.fotos.length} foto(s)
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 6,
                    }}
                  >
                    {album.fotos.map((foto) => {
                      const idx = fotos.findIndex((f) => f.id === foto.id);
                      return (
                        <div
                          key={foto.id}
                          onClick={() => setFotoActiva(idx)}
                          style={{
                            position: "relative",
                            borderRadius: 12,
                            overflow: "hidden",
                            aspectRatio: "1",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          <Image
                            src={foto.url}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {esOrganizador && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarFoto(foto.id);
                              }}
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: "rgba(220,38,38,0.9)",
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
                              <IconX size={12} color="white" />
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
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#e0f5f2",
                  borderRadius: 99,
                  padding: "8px 18px",
                  border: `1px solid #7DD4C8`,
                }}
              >
                <IconHeart size={15} color="#3AADA0" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#3AADA0",
                    fontFamily: "'Cormorant Garamond', serif",
                    letterSpacing: "0.3px",
                  }}
                >
                  Deseos & Dedicatorias
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
                Mensajes de amor y buenos deseos
              </p>
            </div>

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
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#e0f5f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                  }}
                >
                  <IconHeart size={36} color="#7DD4C8" />
                </div>
                <p
                  style={{
                    fontWeight: 700,
                    color: "#374151",
                    fontSize: 18,
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  Aún no hay deseos
                </p>
                <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 6 }}>
                  {invitadoId
                    ? yaSubioFoto
                      ? "¡Sé el primero en dejar un mensaje!"
                      : "Sube tu foto primero, luego podrás dejar tu deseo"
                    : "Los invitados pueden escribir sus deseos"}
                </p>
              </div>
            ) : (
              <div style={{ columns: "2 180px", gap: 12 }}>
                {deseos.map((deseo) => (
                  <DeseoCard
                    key={deseo.id}
                    deseo={deseo}
                    col={col}
                    esOrganizador={esOrganizador}
                    onDelete={eliminarDeseo}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {fotoActiva !== null && fotos[fotoActiva] && (
        <Lightbox
          foto={fotos[fotoActiva]}
          col={col}
          esOrganizador={esOrganizador}
          invitadoId={invitadoId}
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
          onReaccionar={reaccionar}
        />
      )}

      {modalSubir && invitadoId && (
        <ModalSubirFoto
          eventoId={eventoId}
          invitadoId={invitadoId}
          col={col}
          onClose={() => setModalSubir(false)}
          onSubida={alSubirFoto}
        />
      )}

      {modalDeseo && invitadoId && (
        <ModalDeseo
          col={col}
          invitadoNombre={invitadoNombre}
          yaDejoDeseo={yaDejoDeseo}
          yaSubioFoto={yaSubioFoto}
          onClose={() => setModalDeseo(false)}
          onPublicado={publicarDeseo}
        />
      )}

      {invitadoId && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 20,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          {vista === "deseos" && (
            <button
              onClick={() => setModalDeseo(true)}
              className="btn-flotante"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: yaDejoDeseo
                  ? "#9ca3af"
                  : !yaSubioFoto
                    ? "#d1d5db"
                    : "#3AADA0",
                color: "white",
                border: "none",
                borderRadius: 99,
                padding: "13px 22px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  yaDejoDeseo || !yaSubioFoto
                    ? "0 4px 12px rgba(0,0,0,0.12)"
                    : `0 6px 24px rgba(58,173,160,0.45)`,
                whiteSpace: "nowrap",
              }}
            >
              {yaDejoDeseo ? (
                <>
                  <IconCheck size={16} color="white" /> Deseo enviado
                </>
              ) : !yaSubioFoto ? (
                <>
                  <IconLock size={15} color="white" /> Sube tu foto primero
                </>
              ) : (
                <>
                  <IconHeart size={16} color="white" /> Escribir deseo
                </>
              )}
            </button>
          )}

          {vista !== "deseos" && (
            <button
              onClick={() => setModalSubir(true)}
              className="btn-flotante"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: yaSubioFoto ? "#9ca3af" : "#3AADA0",
                border: yaSubioFoto ? "none" : `3px solid #e0f5f2`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: yaSubioFoto
                  ? "0 4px 12px rgba(0,0,0,0.12)"
                  : `0 6px 28px rgba(58,173,160,0.50)`,
                position: "relative",
              }}
            >
              <IconCamera size={26} color="white" />
              {yaSubioFoto && (
                <div
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#22c55e",
                    border: "2px solid white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconCheck size={10} color="white" />
                </div>
              )}
            </button>
          )}
        </div>
      )}
    </main>
  );
}

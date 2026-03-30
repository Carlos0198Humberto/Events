"use client";
// ══════════════════════════════════════════════════════════════
//  REEMPLAZA el componente SubirFoto en confirmar/[token]/page.tsx
//  Pega este componente completo en lugar del SubirFoto existente
// ══════════════════════════════════════════════════════════════

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type ColoresType = { texto: string; acento: string; claro: string };

// ─── Cámara en vivo ──────────────────────────────────────────
function CamaraViva({
  onCaptura,
  onCancelar,
  colores,
}: {
  onCaptura: (blob: Blob) => void;
  onCancelar: () => void;
  colores: ColoresType;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [listo, setListo] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [camaraFrontal, setCamaraFrontal] = useState(false);

  async function iniciarStream(frontal: boolean) {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: frontal ? "user" : "environment" },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => setListo(true);
      }
    } catch {
      alert("No se pudo acceder a la cámara. Usa el botón de galería.");
      onCancelar();
    }
  }

  // Iniciar al montar
  useState(() => {
    iniciarStream(false);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  });

  function detenerStream() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  function toggleCamara() {
    const nueva = !camaraFrontal;
    setCamaraFrontal(nueva);
    iniciarStream(nueva);
  }

  function capturar() {
    if (!videoRef.current || !listo) return;
    setCapturando(true);
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;
    if (camaraFrontal) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          detenerStream();
          onCaptura(blob);
        }
        setCapturando(false);
      },
      "image/jpeg",
      0.92,
    );
  }

  function cancelar() {
    detenerStream();
    onCancelar();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Viewfinder */}
      <div
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          background: "#000",
          aspectRatio: "4/3",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: camaraFrontal ? "scaleX(-1)" : "none",
          }}
        />

        {/* Mira */}
        {listo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                border: `2px solid ${colores.acento}`,
                borderRadius: 12,
                opacity: 0.7,
              }}
            />
          </div>
        )}

        {/* Toggle cámara */}
        <button
          onClick={toggleCamara}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(0,0,0,0.55)",
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 7H17l-2-3H9L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
              stroke="white"
              strokeWidth="1.5"
            />
            <path
              d="M15.5 13.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
              stroke="white"
              strokeWidth="1.5"
            />
            <path
              d="M17 4l2 3"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {!listo && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 13,
            }}
          >
            Iniciando cámara...
          </div>
        )}
      </div>

      {/* Botones */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
        <button
          onClick={cancelar}
          style={{
            padding: "12px",
            borderRadius: 16,
            border: "2px solid #e5e7eb",
            background: "white",
            color: "#6b7280",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={capturar}
          disabled={!listo || capturando}
          style={{
            padding: "12px",
            borderRadius: 16,
            border: "none",
            background: listo ? colores.texto : "#d1d5db",
            color: "white",
            fontWeight: 700,
            fontSize: 13,
            cursor: listo ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {capturando ? (
            "Capturando..."
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="white" />
                <path
                  d="M20 7H17l-2-3H9L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              Tomar foto
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Subir Foto (reemplaza el existente en confirmar/[token]/page.tsx) ────────
export default function SubirFoto({
  eventoId,
  invitadoId,
  colores,
}: {
  eventoId: string;
  invitadoId: string;
  colores: ColoresType;
}) {
  const [modo, setModo] = useState<"idle" | "camara" | "preview" | "galeria">(
    "idle",
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | Blob | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seleccionar desde galería
  function seleccionarGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La foto debe pesar menos de 10MB");
      return;
    }
    setError(null);
    setArchivo(file);
    setPreview(URL.createObjectURL(file));
    setModo("preview");
  }

  // Captura desde cámara
  function recibirCaptura(blob: Blob) {
    setArchivo(blob);
    setPreview(URL.createObjectURL(blob));
    setModo("preview");
  }

  async function subirFoto() {
    if (!archivo) return;
    setSubiendo(true);
    setError(null);

    const ext = archivo instanceof File ? archivo.name.split(".").pop() : "jpg";
    const path = `${eventoId}/${invitadoId}-${Date.now()}.${ext}`;
    const contentType = archivo instanceof File ? archivo.type : "image/jpeg";

    const { error: storageError } = await supabase.storage
      .from("fotos-eventos")
      .upload(path, archivo, { contentType });

    if (storageError) {
      setError("Error al subir la foto. Intenta de nuevo.");
      setSubiendo(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("fotos-eventos")
      .getPublicUrl(path);

    const { error: dbError } = await supabase.from("fotos").insert({
      evento_id: eventoId,
      invitado_id: invitadoId,
      url: urlData.publicUrl,
      path,
      estado: "aprobada",
    });

    if (dbError) {
      setError("Error al registrar la foto.");
      setSubiendo(false);
      return;
    }

    setSubiendo(false);
    setEnviada(true);
    setPreview(null);
    setArchivo(null);
    setModo("idle");
  }

  function cancelar() {
    setPreview(null);
    setArchivo(null);
    setError(null);
    setModo("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Estado: enviada ──
  if (enviada) {
    return (
      <div
        style={{
          borderRadius: 20,
          padding: 20,
          textAlign: "center",
          background: colores.claro,
        }}
      >
        <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
        <p style={{ fontWeight: 700, color: colores.texto, fontSize: 14 }}>
          ¡Foto publicada en el muro!
        </p>
        <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
          Ya pueden verla todos los invitados
        </p>
        <button
          onClick={() => setEnviada(false)}
          style={{
            marginTop: 12,
            fontSize: 12,
            fontWeight: 600,
            color: colores.texto,
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Subir otra foto
        </button>
      </div>
    );
  }

  // ── Estado: cámara ──
  if (modo === "camara") {
    return (
      <CamaraViva
        onCaptura={recibirCaptura}
        onCancelar={cancelar}
        colores={colores}
      />
    );
  }

  // ── Estado: preview ──
  if (modo === "preview" && preview) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#374151",
            textAlign: "center",
          }}
        >
          Vista previa
        </p>
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: 20,
            overflow: "hidden",
            aspectRatio: "1",
          }}
        >
          <Image
            src={preview}
            alt="Vista previa"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        {error && (
          <p style={{ color: "#dc2626", fontSize: 12, textAlign: "center" }}>
            {error}
          </p>
        )}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <button
            onClick={cancelar}
            style={{
              padding: "12px",
              borderRadius: 16,
              border: "2px solid #e5e7eb",
              background: "white",
              color: "#6b7280",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={subirFoto}
            disabled={subiendo}
            style={{
              padding: "12px",
              borderRadius: 16,
              border: "none",
              background: subiendo ? "#d1d5db" : colores.texto,
              color: "white",
              fontWeight: 700,
              fontSize: 13,
              cursor: subiendo ? "not-allowed" : "pointer",
            }}
          >
            {subiendo ? "Publicando..." : "📤 Publicar foto"}
          </button>
        </div>
      </div>
    );
  }

  // ── Estado: idle ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#374151",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        📸 Comparte un momento del evento
      </p>

      {/* Botón cámara */}
      <button
        onClick={() => setModo("camara")}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 18,
          border: "none",
          background: colores.texto,
          color: "white",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: `0 4px 14px ${colores.texto}40`,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 7H17l-2-3H9L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
            stroke="white"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="13" r="3.5" stroke="white" strokeWidth="1.8" />
        </svg>
        Tomar foto ahora
      </button>

      {/* Botón galería */}
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 18,
          border: `2px solid ${colores.acento}`,
          background: colores.claro,
          color: colores.texto,
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="3"
            stroke={colores.texto}
            strokeWidth="1.5"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill={colores.texto} />
          <path
            d="M21 15l-5-5L5 21"
            stroke={colores.texto}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Elegir de galería
      </button>

      {error && (
        <p style={{ color: "#dc2626", fontSize: 12, textAlign: "center" }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={seleccionarGaleria}
      />
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { exportarInvitadosExcel } from "@/app/utils/exportarInvitados";
import { openWhatsApp } from "@/app/utils/openWhatsApp";
import { armarDatosTarjeta, type ExtrasTarjeta } from "@/lib/tarjetaInvitacion";
import { generarTarjetaPNG, cargarFuentesTarjeta } from "@/lib/tarjetaCanvas";
import { armarMensajeDia, armarMensajeDistancia, armarMensajeInvitacion, armarMensajeRecordatorio, diasHasta } from "@/lib/mensajeInvitacion";
import { versiculoDe, type Versiculo } from "@/lib/versiculos";
import EnvioEnGrupo, { type MarcasEnvio, type TipoEnvio } from "./EnvioEnGrupo";
import VersiculoEvento from "./VersiculoEvento";
import { ETIQUETAS_TRATO, guardarTrato, nombreDePila, saludo, tratoDe, type Trato } from "@/lib/tratoInvitado";
import { PhoneInput } from "@/app/components/PhoneInput";
import { toast } from "@/app/components/Toast";
import { IcoCarta, IcoCelular, IcoCheck, IcoEnlace, IcoImpresora, IcoPapelera, IcoPersonas, IcoWhatsApp } from "@/app/components/Iconos";


type Invitado = {
  id?: string;
  nombre: string;
  token: string;
  telefono?: string;
  num_personas?: number;
  cupo_elije_invitado?: boolean;
  estado?: string;
  a_distancia?: boolean | null; // invitación especial de agradecimiento (supabase-distancia.sql)
};

type Evento = {
  nombre: string;
  tipo: string;
  anfitriones: string;
  fecha?: string | null;
  hora?: string | null;
  lugar?: string | null;
  imagen_url?: string | null;
  fecha_limite_confirmacion?: string | null;
  versiculo_texto?: string | null;
  versiculo_cita?: string | null;
  tarjeta?: ExtrasTarjeta | null;
};

const TIPO_LABEL: Record<string, string> = {
  quinceañera: "Quinceañera",
  boda: "Boda",
  graduacion: "Graduación",
  cumpleaños: "Cumpleaños",
  otro: "Evento especial",
};

export default function AgregarInvitados() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState(""); // E.164, ej: "+5491112345678"
  const [numPersonas, setNumPersonas] = useState("1");
  const storageKey = 'evorix_cupo_elije_' + (typeof window !== 'undefined' ? window.location.pathname : 'default');
  const [cupoElijeInvitado, setCupoElijeInvitado] = useState(false);
  // Invitado a distancia: no confirma; recibe la invitación de agradecimiento
  const [aDistancia, setADistancia] = useState(false);
  // false si todavía no se corrió supabase-distancia.sql
  const [distanciaOk, setDistanciaOk] = useState(true);
  // Leer localStorage solo en el cliente (evita hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'true') setCupoElijeInvitado(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [agregados, setAgregados] = useState<Invitado[]>([]);
  const [todosInvitados, setTodosInvitados] = useState<Invitado[]>([]);
  // Quiénes marcó cada invitado que van (columna de supabase-asistentes.sql)
  const [asistentesPorId, setAsistentesPorId] = useState<Record<string, string[]>>({});
  const [loadingInvitados, setLoadingInvitados] = useState(true);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<string | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  // Cuándo se le mandó invitación y recordatorio a cada uno (por token)
  const [marcas, setMarcas] = useState<MarcasEnvio>({});
  const [envioGrupo, setEnvioGrupo] = useState<{ tipo: TipoEnvio; preseleccion: string[] } | null>(null);
  const [editandoVersiculo, setEditandoVersiculo] = useState(false);
  const [exportando, setExportando] = useState(false);
  // Progreso del ZIP con todas las tarjetas ("12/40"); null = sin generar
  const [zipProgreso, setZipProgreso] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  // Tarjeta de invitación (imagen) del invitado que se está por enviar
  const [tarjeta, setTarjeta] = useState<{ inv: Invitado; trato: Trato; blob: Blob | null; url: string | null } | null>(null);
  // Mensaje de la tarjeta editado a mano (null = el armado automáticamente)
  const [textoEditado, setTextoEditado] = useState<string | null>(null);
  // Cada generación lleva un número: si el trato cambia o se cierra a mitad de
  // camino, la imagen vieja que termina después no pisa a la nueva
  const generacionRef = useRef(0);
  const [lastAdded, setLastAdded] = useState<string | null>(null); // token del último agregado (para animaciones)
  const [btnSuccess, setBtnSuccess] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "pro">("free");

  const PLAN_LIMIT_FREE = 10;

  useEffect(() => { cargarFuentesTarjeta(); }, []);

  // Genera los dots del confetti en el DOM (CSS puro, sin canvas)
  type ConfettiDot = {
    id: number; color: string; size: string; borderRadius: string;
    cx: string; cy: string; cr: string; delay: string; duration: string;
  };
  const [confettiDots, setConfettiDots] = useState<ConfettiDot[]>([]);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function spawnConfetti() {
    const colors = ["#4F46E5","#818CF8","#F472B6","#34D399","#FBBF24","#60A5FA","#F87171"];
    const dots: ConfettiDot[] = Array.from({ length: 18 }, (_, i) => {
      const angle = (i / 18) * 360 + Math.random() * 20;
      const dist  = 60 + Math.random() * 80;
      const rad   = (angle * Math.PI) / 180;
      return {
        id:           i,
        color:        colors[Math.floor(Math.random() * colors.length)],
        size:         `${4 + Math.random() * 5}px`,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        cx:           `${Math.cos(rad) * dist}px`,
        cy:           `${Math.sin(rad) * dist}px`,
        cr:           `${Math.random() * 540 - 270}deg`,
        delay:        `${Math.random() * 80}ms`,
        duration:     `${500 + Math.random() * 200}ms`,
      };
    });
    setConfettiDots(dots);
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => setConfettiDots([]), 900);
  }

  useEffect(() => {
    document.title = "Evorix — Gestionar invitados";
    setMounted(true);
    if (id) {
      (async () => {
        const { data } = await supabase
          .from("eventos")
          .select("nombre, tipo, anfitriones, fecha, hora, lugar, imagen_url, fecha_limite_confirmacion")
          .eq("id", id)
          .single();
        if (!data) return;
        // El versículo vive en columnas de supabase-envios.sql: si todavía no
        // existen, el evento carga igual, sin versículo
        const extra = await supabase.from("eventos").select("versiculo_texto, versiculo_cita").eq("id", id).single();
        // Igual con los datos de la tarjeta (supabase-tarjeta.sql)
        const tarjeta = await supabase.from("eventos").select("tarjeta").eq("id", id).single();
        setEvento({
          ...data,
          ...(extra.error || !extra.data ? {} : extra.data),
          ...(tarjeta.error || !tarjeta.data ? {} : tarjeta.data),
        });
      })();
      cargarTodosInvitados();
    }
    // Cargar plan del usuario
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.plan) setUserPlan(data.plan as "free" | "pro");
        });
    });
  }, [id]);

  async function cargarTodosInvitados() {
    setLoadingInvitados(true);
    // Con a_distancia (supabase-distancia.sql); sin la columna, la lista carga igual
    const columnas = "id, nombre, token, telefono, num_personas, cupo_elije_invitado, estado";
    const consulta = (cols: string) => supabase.from("invitados").select(cols).eq("evento_id", id).order("created_at", { ascending: true });
    let { data, error: errLista } = await consulta(`${columnas}, a_distancia`);
    setDistanciaOk(!errLista);
    if (errLista) ({ data } = await consulta(columnas));
    if (data) setTodosInvitados(data as unknown as Invitado[]);
    setLoadingInvitados(false);
    // Consulta aparte: si la columna todavía no existe, la lista de arriba no se rompe
    const { data: asist, error } = await supabase
      .from("invitados")
      .select("id, asistentes_nombres")
      .eq("evento_id", id)
      .not("asistentes_nombres", "is", null);
    if (!error && asist) {
      const mapa: Record<string, string[]> = {};
      asist.forEach((r: { id: string; asistentes_nombres: unknown }) => {
        if (Array.isArray(r.asistentes_nombres)) mapa[r.id] = r.asistentes_nombres.filter((n): n is string => typeof n === "string");
      });
      setAsistentesPorId(mapa);
    }
    // Marcas de enviado / recordado: las de la base (si existen las columnas)
    // y, de respaldo, las guardadas en este navegador
    const locales = marcasLocales();
    const { data: envios, error: errorEnvios } = await supabase
      .from("invitados")
      .select("token, enviado_at, recordatorio_at")
      .eq("evento_id", id);
    const unidas: MarcasEnvio = { ...locales };
    if (!errorEnvios && envios) {
      envios.forEach((r: { token: string; enviado_at: string | null; recordatorio_at: string | null }) => {
        unidas[r.token] = {
          enviado_at: r.enviado_at ?? locales[r.token]?.enviado_at ?? null,
          recordatorio_at: r.recordatorio_at ?? locales[r.token]?.recordatorio_at ?? null,
          dia_at: locales[r.token]?.dia_at ?? null, // solo existe en este navegador
        };
      });
    }
    setMarcas(unidas);
  }

  async function handleExportarExcel() {
    if (exportando || todosInvitados.length === 0) return;
    setExportando(true);
    try {
      const { data } = await supabase
        .from("invitados")
        .select("nombre, telefono, num_personas, estado, numero_confirmacion, mesa_id")
        .eq("evento_id", id)
        .order("estado", { ascending: true });
      const { data: mesas } = await supabase
        .from("mesas")
        .select("id, nombre")
        .eq("evento_id", id);
      const mesaMap: Record<string, string> = {};
      (mesas || []).forEach((m) => { mesaMap[m.id] = m.nombre; });
      const invData = (data || []).map((inv) => ({
        ...inv,
        mesa_nombre: inv.mesa_id ? (mesaMap[inv.mesa_id] ?? null) : null,
      }));
      await exportarInvitadosExcel(invData, evento?.nombre ?? "Evento");
    } finally {
      setExportando(false);
    }
  }

  async function handleEliminar(inv: Invitado) {
    if (!inv.id) return;
    setEliminando(inv.id);
    const { error } = await supabase.from("invitados").delete().eq("id", inv.id);
    if (!error) {
      setTodosInvitados((prev) => prev.filter((i) => i.id !== inv.id));
      setAgregados((prev) => prev.filter((i) => i.token !== inv.token));
    }
    setEliminando(null);
    setConfirmEliminar(null);
  }

  function buildLink(token: string) {
    return `${window.location.origin}/confirmar/${token}`;
  }

  // Cómo saludar a cada invitado: lo que corrigió el organizador o lo deducido del nombre
  function tratoInvitado(inv: Invitado): Trato {
    return tratoDe(inv.nombre, inv.token);
  }

  // ── Marcas de envío ────────────────────────────────────────────────────────
  // Se guardan en la base (supabase-envios.sql) y en este navegador: sin las
  // columnas, la cola igual sabe a quién ya se le mandó desde esta compu.
  const claveMarcas = `evorix_envios_${id}`;
  function marcasLocales(): MarcasEnvio {
    try { return JSON.parse(localStorage.getItem(claveMarcas) || "{}"); } catch { return {}; }
  }

  function marcarEnvio(inv: Invitado, tipo: TipoEnvio) {
    const campo = tipo === "invitacion" ? "enviado_at" : tipo === "recordatorio" ? "recordatorio_at" : "dia_at";
    const ahora = new Date().toISOString();
    if (tipo === "invitacion") setEnviados((prev) => new Set(prev).add(inv.token));
    setMarcas((prev) => {
      const nuevas = { ...prev, [inv.token]: { ...prev[inv.token], [campo]: ahora } };
      try { localStorage.setItem(claveMarcas, JSON.stringify(nuevas)); } catch { /* sin almacenamiento */ }
      return nuevas;
    });
    // Si la columna todavía no existe, falla en silencio: queda la marca local
    // (el mensaje del día no tiene columna: queda solo la marca local)
    if (inv.id && campo !== "dia_at") supabase.from("invitados").update({ [campo]: ahora }).eq("id", inv.id).then(() => {});
  }

  const yaEnviado = (inv: Invitado): boolean => enviados.has(inv.token) || !!marcas[inv.token]?.enviado_at;

  function buildMensaje(inv: Invitado, trato: Trato = tratoInvitado(inv)) {
    if (inv.a_distancia) return armarMensajeDistancia(evento ?? { nombre: "", tipo: "otro" }, inv.nombre, buildLink(inv.token), trato);
    // Si el invitado elige cuántos van, no se le dice un número de lugares
    const personas = inv.cupo_elije_invitado ? null : inv.num_personas ?? null;
    return armarMensajeInvitacion(evento ?? { nombre: "", tipo: "otro" }, inv.nombre, buildLink(inv.token), trato, new Date(), { personas });
  }

  function buildWhatsAppUrl(inv: Invitado, tipo: TipoEnvio = "invitacion", textoPropio?: string) {
    const texto = textoPropio ?? (tipo === "recordatorio"
      ? armarMensajeRecordatorio(evento ?? { nombre: "", tipo: "otro" }, inv.nombre, buildLink(inv.token), tratoInvitado(inv))
      : tipo === "dia"
      ? armarMensajeDia(evento ?? { nombre: "", tipo: "otro" }, inv.nombre, buildLink(inv.token), tratoInvitado(inv))
      : buildMensaje(inv));
    const msg = encodeURIComponent(texto);
    const rawPhone = inv.telefono ?? "";
    const phone = rawPhone.replace(/[^\d+]/g, "").replace(/(?!^\+)\+/g, "");
    return phone
      ? `https://wa.me/${phone.replace("+", "")}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  }

  async function alternarDistancia(inv: Invitado) {
    if (!inv.id) return;
    const nuevo = !inv.a_distancia;
    const { error } = await supabase.from("invitados").update({ a_distancia: nuevo }).eq("id", inv.id);
    if (error) {
      toast.error(/a_distancia/i.test(error.message || "") ? "Falta correr supabase-distancia.sql" : "No se pudo cambiar. Probá de nuevo.");
      return;
    }
    const cambiar = (lista: Invitado[]) => lista.map((i) => (i.id === inv.id ? { ...i, a_distancia: nuevo } : i));
    setTodosInvitados(cambiar);
    setAgregados(cambiar);
    toast.success(nuevo ? `${inv.nombre.split(" ")[0]} recibe ahora la invitación especial a distancia` : `${inv.nombre.split(" ")[0]} vuelve a la invitación normal`);
  }

  async function handleAgregar() {
    setLoading(true);
    setError("");
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      setLoading(false);
      return;
    }
    // ── Límite de plan ────────────────────────────────────────────────────────
    if (userPlan === "free" && todosInvitados.length >= PLAN_LIMIT_FREE) {
      setError(`Plan gratuito: máximo ${PLAN_LIMIT_FREE} invitados por evento. Contactá al administrador para activar el Plan Pro.`);
      setLoading(false);
      return;
    }
    // A distancia: un solo lugar y sin elegir cupo (no viene al evento)
    const elige = aDistancia ? false : cupoElijeInvitado;
    const personas = elige ? null : aDistancia ? 1 : Math.max(1, parseInt(numPersonas) || 1);
    const { data, error } = await supabase
      .from("invitados")
      .insert({
        evento_id: id,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        num_personas: personas ?? 1,
        cupo_elije_invitado: elige,
        ...(aDistancia ? { a_distancia: true } : {}),
      })
      .select()
      .single();

    if (error) {
      const falta = aDistancia && /a_distancia/i.test(error.message || "");
      setError(falta ? "Para invitados a distancia falta correr supabase-distancia.sql en Supabase." : "Error al agregar invitado. Intenta de nuevo.");
      toast.error(falta ? "Falta correr supabase-distancia.sql" : "No se pudo agregar. Intentá de nuevo.");
    } else {
      const nuevo: Invitado = {
        id: data.id,
        nombre: nombre.trim(),
        token: data.token,
        telefono: telefono || undefined,
        num_personas: personas ?? 1,
        cupo_elije_invitado: elige,
        estado: "pendiente",
        a_distancia: aDistancia,
      };
      setAgregados((prev) => [...prev, nuevo]);
      setTodosInvitados((prev) => [...prev, nuevo]);
      setNombre("");
      setTelefono("");
      setNumPersonas("1");
      setADistancia(false); // se marca invitado por invitado
      // cupoElijeInvitado se mantiene (persiste en localStorage hasta que el usuario lo cambie)
      // Feedback visual + háptico
      toast.success(`¡${nombre.trim()} agregado a la lista! 🎉`);
      if ("vibrate" in navigator) navigator.vibrate(80);
      setLastAdded(data.token);
      spawnConfetti();
      setBtnSuccess(true);
      setTimeout(() => setBtnSuccess(false), 600);
    }
    setLoading(false);
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(buildLink(token));
    setCopiado(token);
    setTimeout(() => setCopiado(null), 2200);
  }

  function enviarWhatsApp(inv: Invitado) {
    openWhatsApp(buildWhatsAppUrl(inv));
    marcarEnvio(inv, "invitacion");
  }

  // ── Invitación como tarjeta ──────────────────────────────────────────────
  // Una imagen no puede tener un enlace adentro, y un enlace wa.me solo lleva
  // texto. Por eso la tarjeta viaja con el mensaje, y en el mensaje va el
  // enlace que se toca para confirmar. En el celular se comparte con la hoja
  // nativa (imagen + mensaje); en la compu se copia la imagen y se abre el chat
  // para pegarla. Primero se muestra la tarjeta: el organizador ve lo que
  // manda, y el botón de enviar es un toque nuevo (compartir y copiar exigen un
  // gesto reciente del usuario).
  async function prepararTarjeta(inv: Invitado, trato: Trato = tratoInvitado(inv)) {
    if (!evento) return;
    const n = ++generacionRef.current;
    setTextoEditado(null);
    setTarjeta((previa) => {
      if (previa?.url) URL.revokeObjectURL(previa.url);
      return { inv, trato, blob: null, url: null };
    });
    const blob = await generarTarjetaPNG(armarDatosTarjeta(evento, inv.nombre, trato, { distancia: !!inv.a_distancia }));
    if (n !== generacionRef.current) return;
    if (!blob) {
      toast.error("No se pudo generar la tarjeta. Probá de nuevo.");
      setTarjeta(null);
      return;
    }
    setTarjeta({ inv, trato, blob, url: URL.createObjectURL(blob) });
  }

  function cambiarTrato(trato: Trato) {
    if (!tarjeta || trato === tarjeta.trato) return;
    guardarTrato(tarjeta.inv.token, trato);
    prepararTarjeta(tarjeta.inv, trato);
  }

  // El mensaje que acompaña a la tarjeta: el armado o el que editó el organizador
  function mensajeTarjeta() {
    return tarjeta ? textoEditado ?? buildMensaje(tarjeta.inv, tarjeta.trato) : "";
  }

  function cerrarTarjeta() {
    generacionRef.current++;
    setTextoEditado(null);
    if (tarjeta?.url) URL.revokeObjectURL(tarjeta.url);
    setTarjeta(null);
  }

  function enviarSoloMensaje() {
    if (!tarjeta) return;
    enviarWhatsApp(tarjeta.inv);
    cerrarTarjeta();
  }

  function archivoTarjeta(inv: Invitado, blob: Blob) {
    const nombre = inv.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_");
    return new File([blob], `invitacion_${nombre || "invitado"}.png`, { type: "image/png" });
  }

  // Compartir con la hoja del sistema es lo natural en un celular; en la compu
  // (mouse) esa hoja no suele ofrecer WhatsApp, ahí conviene copiar y pegar.
  function compartirEsLoPrincipal() {
    if (typeof navigator === "undefined" || !navigator.canShare) return false;
    const tactil = window.matchMedia("(pointer: coarse)").matches;
    return tactil && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] });
  }

  async function compartirTarjeta() {
    if (!tarjeta?.blob) return;
    const { inv, blob } = tarjeta;
    try {
      await navigator.share({ files: [archivoTarjeta(inv, blob)], text: mensajeTarjeta() });
      marcarEnvio(inv, "invitacion");
      cerrarTarjeta();
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("No se pudo compartir. Probá descargarla.");
    }
  }

  async function copiarYAbrirWhatsApp() {
    if (!tarjeta?.blob) return;
    const { inv, blob } = tarjeta;
    let copiada = false;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      copiada = true;
    } catch { /* este navegador no copia imágenes: se descarga */ }
    if (!copiada) descargarTarjeta();
    openWhatsApp(buildWhatsAppUrl(inv, "invitacion", mensajeTarjeta()));
    marcarEnvio(inv, "invitacion");
    toast.success(copiada ? "Tarjeta copiada: en el chat pegala con Ctrl+V" : "Tarjeta descargada: adjuntala en el chat");
  }

  // Enviar directo al chat del invitado: WhatsApp no deja que una página
  // adjunte una imagen, pero sí abrir el chat de un número con el mensaje
  // escrito. La tarjeta queda copiada para pegarla (mantener presionado →
  // Pegar), y la vista previa del enlace ya la muestra aunque no se pegue.
  // La copia NO se espera: iOS solo abre la ventana dentro del mismo toque.
  function enviarTarjetaAlChat() {
    if (!tarjeta?.blob) return;
    const { inv, blob } = tarjeta;
    let copia: Promise<boolean> = Promise.resolve(false);
    try {
      copia = navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => true, () => false);
    } catch { /* este navegador no copia imágenes */ }
    openWhatsApp(buildWhatsAppUrl(inv, "invitacion", mensajeTarjeta()));
    marcarEnvio(inv, "invitacion");
    const nombre = inv.nombre.split(" ")[0];
    copia.then((ok) => toast.success(ok
      ? `Chat de ${nombre} abierto. La tarjeta está copiada: en el chat, mantené presionado y Pegar.`
      : `Chat de ${nombre} abierto con el mensaje: el enlace ya muestra la tarjeta.`));
    cerrarTarjeta();
  }

  // Tarjeta para imprimir (5×7 pulgadas, con QR a la invitación): para abuelos
  // o quien no usa WhatsApp. Se abre lista para imprimir o guardar como PDF.
  async function imprimirTarjeta() {
    if (!evento || !tarjeta) return;
    // La ventana se abre en el toque; si no, el navegador la bloquea
    const ventana = window.open("", "_blank");
    if (!ventana) { toast.error("Permití las ventanas emergentes para imprimir."); return; }
    ventana.document.write("<p style='font-family:sans-serif;padding:24px;color:#475569'>Preparando la tarjeta para imprimir…</p>");
    const { inv, trato } = tarjeta;
    const blob = await generarTarjetaPNG(
      armarDatosTarjeta(evento, inv.nombre, trato, { distancia: !!inv.a_distancia }),
      "imprimir",
      { qr: buildLink(inv.token) },
    );
    if (!blob) { ventana.close(); toast.error("No se pudo preparar la tarjeta para imprimir."); return; }
    const src = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(blob); });
    const titulo = `Tarjeta de ${inv.nombre}`.replace(/[<>&"]/g, "");
    ventana.document.open();
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title>
<style>@page{size:5in 7in;margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block;width:5in;height:7in}
@media screen{body{display:flex;justify-content:center;padding:24px;background:#e2e8f0}img{width:min(100%,520px);height:auto;box-shadow:0 12px 32px rgba(0,0,0,.25)}}</style>
</head><body><img src="${src}" alt=""><script>document.querySelector("img").onload=function(){setTimeout(function(){print()},300)}<\/script></body></html>`);
    ventana.document.close();
  }

  // Todas las tarjetas personalizadas en un ZIP (una por invitado, con su
  // saludo y, si está lejos, la de agradecimiento)
  async function descargarTodasLasTarjetas() {
    if (!evento || zipProgreso || todosInvitados.length === 0) return;
    setZipProgreso(`0/${todosInvitados.length}`);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < todosInvitados.length; i++) {
        const inv = todosInvitados[i];
        setZipProgreso(`${i + 1}/${todosInvitados.length}`);
        const blob = await generarTarjetaPNG(armarDatosTarjeta(evento, inv.nombre, tratoInvitado(inv), { distancia: !!inv.a_distancia }));
        if (blob) zip.file(`${String(i + 1).padStart(3, "0")}_${archivoTarjeta(inv, blob).name}`, blob);
      }
      const contenido = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(contenido);
      a.download = `tarjetas_${(evento.nombre || "evento").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_")}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast.success(`Listo: ${todosInvitados.length} tarjeta${todosInvitados.length !== 1 ? "s" : ""} en el ZIP`);
    } catch {
      toast.error("No se pudieron generar las tarjetas. Probá de nuevo.");
    } finally {
      setZipProgreso(null);
    }
  }

  // Versión para estados de WhatsApp / Instagram (1080×1920): la ve todo el
  // mundo, así que va sin el nombre del invitado ni el llamado a confirmar
  const [generandoHistoria, setGenerandoHistoria] = useState(false);
  async function tarjetaParaEstados() {
    if (!evento || generandoHistoria) return;
    setGenerandoHistoria(true);
    const blob = await generarTarjetaPNG(armarDatosTarjeta(evento, ""), "historia");
    setGenerandoHistoria(false);
    if (!blob) { toast.error("No se pudo generar la versión para estados."); return; }
    const archivo = new File([blob], "invitacion_para_estados.png", { type: "image/png" });
    if (compartirEsLoPrincipal()) {
      try { await navigator.share({ files: [archivo] }); return; }
      catch (e) { if ((e as Error)?.name === "AbortError") return; /* sin gesto reciente: se descarga */ }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(archivo);
    a.download = archivo.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast.success("Listo: publicala en tu estado");
  }

  function descargarTarjeta() {
    if (!tarjeta?.blob) return;
    const archivo = archivoTarjeta(tarjeta.inv, tarjeta.blob);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(archivo);
    a.download = archivo.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // Enviar a varios: la cola abre WhatsApp de a uno, siempre por un toque del
  // organizador. El temporizador de antes solo lograba abrir el primero: los
  // navegadores bloquean las ventanas que no salen de un toque.
  function abrirEnvioGrupo(tipo: TipoEnvio, preseleccion: string[]) {
    setEnvioGrupo({ tipo, preseleccion });
  }

  const conTelefono = agregados.filter((inv) => inv.telefono);

  // Recordatorio: desde una semana antes del evento, para quien no confirmó
  const diasFaltan = evento?.fecha ? diasHasta(evento.fecha) : null;
  // Los invitados a distancia no confirman: no cuentan como pendientes ni reciben recordatorio
  const sinConfirmar = todosInvitados.filter((i) => !i.a_distancia && (!i.estado || i.estado === "pendiente"));
  const aDistanciaLista = todosInvitados.filter((i) => i.a_distancia);
  const sinRecordar = sinConfirmar.filter((i) => !marcas[i.token]?.recordatorio_at);
  const mostrarRecordatorio = diasFaltan !== null && diasFaltan >= 0 && diasFaltan <= 7 && sinConfirmar.length > 0;
  // La víspera y el mismo día: el mensaje con la hora y cómo llegar, para los confirmados
  const confirmados = todosInvitados.filter((i) => i.estado === "confirmado" && !i.a_distancia);
  const sinMensajeDia = confirmados.filter((i) => !marcas[i.token]?.dia_at);
  const mostrarMensajeDia = (diasFaltan === 0 || diasFaltan === 1) && confirmados.length > 0;

  const versiculoActual = versiculoDe(evento?.versiculo_texto, evento?.versiculo_cita);

  async function guardarVersiculo(v: Versiculo | null) {
    const { error } = await supabase
      .from("eventos")
      .update({ versiculo_texto: v?.texto ?? null, versiculo_cita: v?.cita ?? null })
      .eq("id", id);
    if (error) {
      toast.error("Para guardar el versículo falta correr supabase-envios.sql en Supabase.");
      return false;
    }
    setEvento((prev) => (prev ? { ...prev, versiculo_texto: v?.texto ?? null, versiculo_cita: v?.cita ?? null } : prev));
    toast.success(v ? "Versículo agregado a la invitación" : "Versículo quitado de la invitación");
    return true;
  }

  const invitadosFiltrados = busqueda.trim()
    ? todosInvitados.filter((inv) =>
        inv.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : todosInvitados;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #FAFBFF;
          --surface:      #FFFFFF;
          --surface2:     #F4F5FB;
          --border:       rgba(79,70,229,0.16);
          --border-hover: rgba(79,70,229,0.50);
          --border-input: rgba(79,70,229,0.28);
          --accent:       #4F46E5;
          --accent2:      #3730A3;
          --accent-soft:  rgba(79,70,229,0.08);
          --accent-soft2: rgba(79,70,229,0.16);
          --text:         #0F172A;
          --text2:        #475569;
          --text3:        #3730A3;
          --shadow:       0 4px 28px rgba(15,23,42,0.10);
          --shadow-sm:    0 2px 10px rgba(15,23,42,0.07);
          --shadow-btn:   0 6px 28px rgba(79,70,229,0.38);
          --wa-green:     #25D366;
          --wa-dark:      #128C7E;
          --transition:   all 0.36s cubic-bezier(.4,0,.2,1);
        }

        html, body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          width: 100%;
        }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .glow { position: fixed; pointer-events: none; z-index: 0; border-radius: 50%; filter: blur(90px); }
        .glow-1 { width: 320px; height: 320px; top: -80px; right: -60px; background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%); animation: glowDrift1 9s ease-in-out infinite; }
        .glow-2 { width: 260px; height: 260px; bottom: 80px; left: -80px; background: radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%); animation: glowDrift2 11s ease-in-out infinite; }
        @keyframes glowDrift1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-18px,28px)} 66%{transform:translate(14px,-18px)} }
        @keyframes glowDrift2 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(22px,-30px)} 70%{transform:translate(-8px,18px)} }

        /* ── Page ── */
        .page-wrap {
          min-height: calc(100dvh - env(safe-area-inset-top, 0px));
          background: var(--bg);
          position: relative;
        }

        /* ── Top bar ── */
        .top-bar {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
          padding: 0 16px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: sticky;
          top: env(safe-area-inset-top, 0px);
          z-index: 20;
          box-shadow: var(--shadow-sm);
        }
        .top-bar-event {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px; font-weight: 600; color: var(--text);
          letter-spacing: -0.2px; line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          text-align: center;
        }
        /* ── Barra inferior de regreso ── */
        .bottom-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 40;
          height: calc(56px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--border);
          display: flex; align-items: center;
          padding-left: 16px; padding-right: 16px;
          box-shadow: 0 -4px 20px rgba(79,70,229,0.07);
        }
        /* Con el teclado abierto la barra fija sube con él y tapa el formulario */
        html:has(input:not([type="checkbox"]):not([type="radio"]):focus, textarea:focus, select:focus) .bottom-bar { display: none; }
        .btn-back {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          color: var(--accent); cursor: pointer;
          padding: 10px 4px; border-radius: 10px;
          -webkit-tap-highlight-color: transparent;
          transition: opacity .15s;
          letter-spacing: .1px;
        }
        .btn-back:active { opacity: 0.6; }

        /* ── Scroll area ── */
        .scroll-area {
          padding: 20px 16px;
          padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* ── Cards ── */
        .card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 22px; padding: 22px 20px; box-shadow: var(--shadow); }
        .card-title { font-family: 'Cormorant Garamond', serif; font-size: 21px; font-weight: 600; color: var(--text); margin-bottom: 3px; letter-spacing: -0.3px; }
        .card-sub { font-size: 12.5px; color: var(--text3); margin-bottom: 20px; font-weight: 500; }
        .section-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 22px; padding: 20px 18px; box-shadow: var(--shadow); }

        /* ── Error box ── */
        .error-box { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 13px; padding: 10px 14px; border-radius: 12px; margin-bottom: 16px; font-weight: 500; }
        .plan-warn-banner { background: #fffbeb; border: 1.5px solid #fde68a; color: #92400e; font-size: 12.5px; font-weight: 600; padding: 10px 14px; border-radius: 12px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .plan-limit-banner { background: #eff6ff; border: 1.5px solid #bfdbfe; color: #1e40af; font-size: 13px; font-weight: 600; padding: 12px 16px; border-radius: 14px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px; }
        .plan-limit-banner-body { display: flex; flex-direction: column; gap: 2px; }
        .plan-limit-banner-title { font-size: 13px; font-weight: 700; }
        .plan-limit-banner-sub { font-size: 12px; font-weight: 400; opacity: .85; }

        /* ── Fields ── */
        .fields { display: flex; flex-direction: column; gap: 15px; }
        .field-label { font-size: 11px; font-weight: 600; color: var(--accent); display: block; margin-bottom: 7px; letter-spacing: 0.6px; text-transform: uppercase; }
        .field-input {
          width: 100%; border: 2px solid var(--border-input); border-radius: 14px;
          padding: 13px 15px; font-size: 15px;
          background: var(--accent-soft); color: var(--text);
          outline: none; transition: border-color .22s, box-shadow .22s, background .22s;
          font-family: 'DM Sans', sans-serif; -webkit-appearance: none;
          touch-action: manipulation;
        }
        .field-input::placeholder { color: var(--text3); }
        .field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,70,229,0.11); background: var(--surface); }

        /* ── Toggle switch ── */
        .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: var(--accent-soft); border-radius: 14px; border: 1px solid var(--border-input); }
        .toggle-label { font-size: 13px; font-weight: 500; color: var(--text); display: flex; align-items: center; gap: 6px; }
        .toggle-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }
        .toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-thumb { position: absolute; inset: 0; background: #CBD5E1; border-radius: 999px; cursor: pointer; transition: background .2s; }
        .toggle-thumb::after { content: ''; position: absolute; left: 3px; top: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
        input:checked + .toggle-thumb { background: var(--accent); }
        input:checked + .toggle-thumb::after { transform: translateX(20px); }

        /* ── Submit button ── */
        .btn-submit { width: 100%; padding: 15px; border-radius: 14px; border: none; background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%); color: #fff; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; letter-spacing: 0.3px; cursor: pointer; margin-top: 4px; box-shadow: var(--shadow-btn); transition: transform .2s ease, box-shadow .2s ease, opacity .2s; position: relative; overflow: hidden; -webkit-tap-highlight-color: transparent; touch-action: manipulation; min-height: 50px; }
        .btn-submit::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%); pointer-events: none; border-radius: inherit; }
        .btn-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.22) 50%, transparent 62%); background-size: 200% 100%; animation: shimmer 3.5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .btn-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 34px rgba(79,70,229,0.50); }
        .btn-submit:not(:disabled):active { transform: scale(0.97); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Search box ── */
        .search-wrap { position: relative; margin-bottom: 14px; }
        .search-input {
          width: 100%; border: 1.5px solid var(--border-input); border-radius: 14px;
          padding: 11px 14px 11px 38px; font-size: 14px;
          background: var(--surface2); color: var(--text);
          outline: none; transition: border-color .22s, box-shadow .22s;
          font-family: 'DM Sans', sans-serif; -webkit-appearance: none;
          touch-action: manipulation;
        }
        .search-input::placeholder { color: var(--text3); }
        .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,70,229,0.11); background: var(--surface); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text3); pointer-events: none; }

        /* ── Section header ── */
        .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .section-head-title { font-size: 13px; font-weight: 700; color: var(--accent2); text-transform: uppercase; letter-spacing: .6px; display: flex; align-items: center; gap: 6px; }
        .list-badge { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: white; border-radius: 99px; font-size: 11px; font-weight: 700; padding: 2px 9px; }

        /* ── Bulk button ── */
        .btn-bulk { width: 100%; padding: 13px 16px; border-radius: 14px; border: none; background: linear-gradient(135deg, var(--wa-green) 0%, var(--wa-dark) 100%); color: #fff; font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; margin-bottom: 14px; box-shadow: 0 6px 24px rgba(37,211,102,0.38); transition: transform .2s, box-shadow .2s, opacity .2s; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 8px; -webkit-tap-highlight-color: transparent; }
        .btn-bulk:not(:disabled):hover { transform: translateY(-2px); }
        .btn-bulk:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-bulk-shimmer { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.18) 50%,transparent 62%); background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }

        /* ── Inv row ── */
        .inv-row { display: flex; align-items: center; gap: 10px; padding: 11px 12px; background: var(--surface2); border-radius: 14px; border: 1px solid var(--border); margin-bottom: 8px; }
        .inv-row:last-child { margin-bottom: 0; }
        .inv-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 15px; flex-shrink: 0; }
        .inv-info { flex: 1; min-width: 0; }
        .inv-name { font-size: 14px; font-weight: 500; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .inv-phone { font-size: 11px; color: var(--text3); margin-top: 1px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .inv-cupo { font-size: 10.5px; color: var(--text3); margin-top: 2px; display: flex; align-items: center; gap: 4px; }
        .inv-no-phone { font-size: 11px; color: #fbbf24; margin-top: 1px; font-weight: 500; }
        .inv-actions { display: flex; gap: 6px; flex-shrink: 0; }

        .btn-action { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 32px; font-size: 11.5px; font-weight: 700; border-radius: 10px; padding: 6px 10px; cursor: pointer; transition: all .2s; font-family: 'DM Sans', sans-serif; -webkit-tap-highlight-color: transparent; white-space: nowrap; border: 1.5px solid; }
        .btn-action-txt { display: none; }
        .btn-copy-default { color: var(--accent); background: var(--surface); border-color: var(--border-input); }
        .btn-copy-done    { color: #16a34a; background: #f0fdf4; border-color: #86efac; }
        .btn-wa           { color: white; background: var(--wa-green); border-color: var(--wa-dark); }
        .btn-wa-done      { color: white; background: #16a34a; border-color: #15803d; }
        .btn-tarjeta      { color: #E2C46A; background: #2C3335; border-color: #1E2425; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
        .btn-tarjeta:disabled { opacity: .55; cursor: wait; }
        .btn-varios { display: flex; align-items: center; gap: 6px; background: rgba(37,211,102,0.10); border: 1px solid rgba(37,211,102,0.35); border-radius: 10px; padding: 6px 12px; font-size: 11px; font-weight: 700; color: #128C7E; cursor: pointer; font-family: inherit; }
        .inv-envio { font-size: 10.5px; color: #16a34a; margin-top: 2px; font-weight: 600; }
        .recordatorio-banner { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #1D1C20, #2A2620); border: 1px solid #B4873A; border-radius: 18px; padding: 14px 14px 14px 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
        .recordatorio-icono { font-size: 24px; }
        .recordatorio-cuerpo { flex: 1; min-width: 0; }
        .recordatorio-titulo { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 600; color: #E8CB82; }
        .recordatorio-sub { font-size: 12px; color: #DCCBA2; margin-top: 1px; }
        .recordatorio-btn { flex-shrink: 0; padding: 10px 14px; border-radius: 12px; border: none; background: linear-gradient(135deg, #E8CB82, #B4873A); color: #1D1C20; font-size: 13px; font-weight: 800; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .versiculo-fila { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; background: var(--surface); border: 1.5px solid var(--border); border-radius: 18px; padding: 13px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: var(--shadow); }
        .versiculo-icono { width: 36px; height: 36px; border-radius: 12px; background: #1D1C20; color: #E8CB82; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .versiculo-cuerpo { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .versiculo-titulo { font-size: 13.5px; font-weight: 700; color: var(--text); }
        .versiculo-sub { font-size: 11.5px; color: var(--text3); margin-top: 1px; }
        .versiculo-texto { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 15.5px; color: var(--text); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .versiculo-cita { font-size: 10.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #B4873A; margin-top: 3px; }
        .versiculo-accion { font-size: 12px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
        .btn-eliminar     { color: #dc2626; background: #fef2f2; border-color: #fecaca; }
        .btn-eliminar:hover { background: #fee2e2; }
        .btn-eliminar:disabled { opacity: .5; cursor: wait; }

        .estado-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
        .estado-confirmado { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
        .estado-pendiente  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
        .estado-rechazado  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

        .confirm-eliminar { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }

        /* ── Empty state ── */
        .empty-state { text-align: center; padding: 24px 0; color: var(--text3); font-size: 13px; }

        /* ── Confetti burst ── */
        @keyframes confetti-fly {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translate(var(--cx), var(--cy)) rotate(var(--cr)) scale(0.4); opacity: 0; }
        }
        .confetti-wrap {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden;
          z-index: 10; border-radius: inherit;
        }
        .confetti-dot {
          position: absolute; top: 50%; left: 50%;
          width: var(--cs, 6px); height: var(--cs, 6px);
          border-radius: var(--cbr, 50%);
          background: var(--cc, #4F46E5);
          animation: confetti-fly var(--cd, 600ms) cubic-bezier(.22,1,.36,1) both;
        }

        /* ── WA button wiggle (aparece nuevo) ── */
        @keyframes wa-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          55%  { transform: scale(1.12); }
          75%  { transform: scale(0.95); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .btn-wa-new { animation: wa-pop 400ms cubic-bezier(.22,1,.36,1) both; }

        /* ── Submit button success pulse ── */
        @keyframes submit-success {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.04); box-shadow: 0 0 0 6px rgba(79,70,229,0.18); }
          100% { transform: scale(1); }
        }
        .btn-success-pulse { animation: submit-success 500ms cubic-bezier(.22,1,.36,1) both; }

        /* ── Hero metrics card ── */
        .hero-card {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          border-radius: 22px;
          padding: 20px 20px 18px;
          color: #fff;
          box-shadow: 0 8px 32px rgba(79,70,229,0.38);
          position: relative;
          overflow: hidden;
        }
        .hero-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }
        .hero-card > * { position: relative; z-index: 1; }
        .hero-tipo {
          font-size: 10px; font-weight: 700; letter-spacing: 1.8px;
          text-transform: uppercase; color: rgba(255,255,255,0.70);
          margin-bottom: 6px;
        }
        .hero-nombre {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 600; line-height: 1.15;
          letter-spacing: -0.4px; color: #fff;
          margin-bottom: 4px;
        }
        .hero-anfitriones {
          font-size: 12px; color: rgba(255,255,255,0.70); margin-bottom: 18px;
        }
        .hero-pills {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }
        .hero-pill {
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.20);
          border-radius: 14px;
          padding: 10px 8px;
          text-align: center;
          backdrop-filter: blur(4px);
        }
        .hero-pill-num {
          font-size: 22px; font-weight: 700; line-height: 1;
          color: #fff; margin-bottom: 3px;
        }
        .hero-pill-label {
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.5px;
          color: rgba(255,255,255,0.72); text-transform: uppercase;
        }
        .hero-pill.pill-ok   .hero-pill-num { color: #86efac; }
        .hero-pill.pill-pend .hero-pill-num { color: #fde68a; }
        .hero-pill.pill-no   .hero-pill-num { color: #fca5a5; }

        /* ── Hero edit button ── */
        .hero-edit-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.35);
          color: #fff;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-decoration: none;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transition: background .2s, transform .2s;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        .hero-edit-btn:hover { background: rgba(255,255,255,0.28); transform: translateY(-1px); }
        .hero-edit-btn:active { transform: scale(0.97); }

        /* ── Overlay confirm ── */
        .overlay { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .confirm-card { background: var(--surface); border-radius: 24px; padding: 28px 24px; max-width: 340px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.22); border: 1.5px solid var(--border); text-align: center; }
        .confirm-icon { font-size: 36px; margin-bottom: 14px; }
        .confirm-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
        .confirm-body { font-size: 13.5px; color: var(--text2); line-height: 1.55; margin-bottom: 22px; }
        .confirm-actions { display: flex; gap: 10px; }
        .btn-cancel { flex: 1; padding: 13px; border-radius: 12px; border: 1.5px solid var(--border-input); background: var(--surface); color: var(--text2); font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .btn-confirm { flex: 1; padding: 13px; border-radius: 12px; border: none; background: linear-gradient(135deg, var(--wa-green), var(--wa-dark)); color: white; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(37,211,102,0.35); }

        /* ── Tarjeta de invitación ── */
        .tarjeta-card { background: var(--surface); border-radius: 24px; padding: 18px 18px 16px; max-width: 400px; width: 100%; max-height: calc(100dvh - 40px); overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.28); border: 1.5px solid var(--border); text-align: center; }
        .tarjeta-titulo { font-family: 'Cormorant Garamond', serif; font-size: 21px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
        .tarjeta-marco { position: relative; width: min(100%, calc(46dvh * 1080 / 1350)); aspect-ratio: 1080 / 1350; margin: 0 auto 12px; border-radius: 12px; overflow: hidden; background: #0D0D0F; box-shadow: 0 6px 22px rgba(0,0,0,0.25); }
        .tarjeta-marco img { display: block; width: 100%; height: 100%; object-fit: contain; }
        .tarjeta-cargando { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #E2C46A; font-size: 13px; font-weight: 600; }
        .tarjeta-giro { width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid rgba(226,196,106,0.25); border-top-color: #E2C46A; animation: tarjeta-gira .8s linear infinite; }
        @keyframes tarjeta-gira { to { transform: rotate(360deg); } }
        .tarjeta-ayuda { font-size: 12px; color: var(--text2); line-height: 1.5; margin-bottom: 14px; }
        .trato-fila { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .trato-label { font-size: 10.5px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: var(--text3); margin-right: 2px; }
        .trato-chip { font-size: 12px; font-weight: 600; padding: 6px 11px; border-radius: 999px; border: 1.5px solid var(--border-input); background: var(--surface); color: var(--text2); cursor: pointer; font-family: 'DM Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
        .trato-chip.activo { background: #1D1C20; border-color: #B4873A; color: #E8CB82; }
        .trato-chip:disabled { cursor: wait; }
        .trato-saludo { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; color: var(--text); margin-bottom: 8px; }
        .tarjeta-mensaje { text-align: left; margin-bottom: 12px; }
        .tarjeta-mensaje summary { cursor: pointer; text-align: center; font-size: 12px; font-weight: 700; color: var(--accent); }
        .tarjeta-mensaje-texto { display: block; width: 100%; resize: vertical; white-space: pre-wrap; font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.5; background: var(--surface2); border: 1px solid var(--border-input); border-radius: 12px; padding: 10px 12px; margin-top: 8px; color: var(--text); }
        .tarjeta-mensaje-texto:focus { outline: none; border-color: var(--accent); background: var(--surface); }
        .tarjeta-mensaje pre { white-space: pre-wrap; word-break: break-word; font-family: 'DM Sans', sans-serif; font-size: 12.5px; line-height: 1.5; background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; margin-top: 8px; color: var(--text); }
        .tarjeta-principal { width: 100%; padding: 13px; border-radius: 12px; border: none; background: linear-gradient(135deg, var(--wa-green), var(--wa-dark)); color: white; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 16px rgba(37,211,102,0.35); margin-bottom: 8px; }
        .tarjeta-principal:disabled { opacity: .5; cursor: wait; box-shadow: none; }
        .tarjeta-secundarias { display: flex; gap: 8px; }
        .hero-distancia { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; text-align: center; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); }
        .estado-distancia { background: #FDF2F8; color: #9D174D; border: 1px solid #FBCFE8; }
        .inv-distancia-btn { margin-top: 4px; padding: 0; border: none; background: none; font-size: 10.5px; font-weight: 700; color: var(--accent); cursor: pointer; font-family: inherit; text-decoration: underline; text-underline-offset: 2px; }
        .toggle-distancia { background: #FDF2F8; border-color: #FBCFE8; }
        .tarjeta-estados { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px; border-radius: 12px; border: 1.5px dashed rgba(79,70,229,0.35); background: rgba(79,70,229,0.05); color: #3730A3; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; margin-bottom: 8px; }
        .tarjeta-estados:disabled { opacity: .6; cursor: wait; }
        .tarjeta-link { display: block; width: 100%; margin: -2px 0 10px; padding: 4px; border: none; background: none; font-size: 12px; font-weight: 600; color: var(--accent2); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; font-family: inherit; }
        .tarjeta-secundarias .btn-cancel { padding: 11px 6px; font-size: 13px; }
        .tarjeta-secundarias .btn-cancel:disabled { opacity: .5; cursor: wait; }

        /* ── Animations ── */
        .anim-header { opacity: 0; transform: translateY(-10px); }
        .anim-card   { opacity: 0; transform: translateY(20px); }
        .anim-list   { opacity: 0; transform: translateY(14px); }
        .mounted .anim-header { animation: mountUp .5s cubic-bezier(.22,1,.36,1) .05s both; }
        .mounted .anim-card   { animation: mountUp .6s cubic-bezier(.22,1,.36,1) .15s both; }
        .mounted .anim-list   { animation: mountUp .5s cubic-bezier(.22,1,.36,1) .28s both; }
        @keyframes mountUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.65} }
        .pulsing { animation: pulse 1.2s ease-in-out infinite; }

        /* ── Responsive ── */
        @media (max-width: 420px) {
          .top-bar { padding: 11px 14px; gap: 9px; }
          .top-bar-name { font-size: 20px; }
          .scroll-area { padding: 16px 12px; padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px)); }
          .card, .section-card { padding: 18px 15px; border-radius: 18px; }
          .card-title { font-size: 19px; }
          .field-input { padding: 12px 13px; font-size: 14.5px; }
          .btn-submit { padding: 14px; font-size: 14.5px; }
          .inv-row { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; padding: 11px; gap: 4px 10px; }
          .inv-avatar { width: 32px; height: 32px; font-size: 13px; }
          .inv-actions { grid-column: 1 / -1; gap: 6px; margin-top: 8px; padding-top: 9px; border-top: 1px solid var(--border); }
          .inv-actions .btn-action { flex: 1; min-width: 0; font-size: 11.5px; padding: 6px; min-height: 36px; }
          .btn-action-txt { display: inline; }
          .inv-actions .btn-eliminar { flex: 0 0 40px; }
          .qn-link { padding: 8px 11px; font-size: 10px; }
        }
        @media (max-width: 340px) {
          .btn-action-txt, .btn-tarjeta-txt { display: none; }
        }
      `}</style>

      {/* Envío en grupo: invitación o recordatorio */}
      {envioGrupo && (
        <EnvioEnGrupo
          invitados={todosInvitados}
          tipoInicial={envioGrupo.tipo}
          preseleccion={envioGrupo.preseleccion}
          marcas={marcas}
          tratoDe={(inv) => tratoDe(inv.nombre, inv.token)}
          urlWhatsApp={(inv, tipo) => buildWhatsAppUrl(inv as Invitado, tipo)}
          onEnviado={(inv, tipo) => marcarEnvio(inv as Invitado, tipo)}
          onCerrar={() => setEnvioGrupo(null)}
        />
      )}

      {/* Versículo de la invitación */}
      {editandoVersiculo && evento && (
        <VersiculoEvento
          tipo={evento.tipo}
          actual={versiculoActual}
          onGuardar={guardarVersiculo}
          onCerrar={() => setEditandoVersiculo(false)}
        />
      )}

      {/* Vista previa de la tarjeta antes de enviarla */}
      {tarjeta && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) cerrarTarjeta(); }}>
          <div className="tarjeta-card" role="dialog" aria-modal="true" aria-label={`Tarjeta de invitación de ${tarjeta.inv.nombre}`}>
            <div className="tarjeta-titulo">Tarjeta para {tarjeta.inv.nombre}</div>
            <div className="tarjeta-marco">
              {tarjeta.url
                ? <img src={tarjeta.url} alt={`Tarjeta de invitación para ${tarjeta.inv.nombre}`} />
                : <div className="tarjeta-cargando"><div className="tarjeta-giro" />Preparando la tarjeta…</div>}
            </div>
            <div className="trato-fila" role="radiogroup" aria-label="Cómo saludar">
              <span className="trato-label">Saludo</span>
              {(["f", "m", "plural", "neutro"] as Trato[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={tarjeta.trato === t}
                  className={`trato-chip${tarjeta.trato === t ? " activo" : ""}`}
                  onClick={() => cambiarTrato(t)}
                  disabled={!tarjeta.blob}
                >
                  {ETIQUETAS_TRATO[t]}
                </button>
              ))}
            </div>
            <div className="trato-saludo">{saludo(nombreDePila(tarjeta.inv.nombre), tarjeta.trato)}:</div>
            <details className="tarjeta-mensaje" open={textoEditado !== null || undefined}>
              <summary>Ver o editar el mensaje que la acompaña</summary>
              <textarea
                className="tarjeta-mensaje-texto"
                aria-label="Mensaje que acompaña a la tarjeta"
                rows={10}
                value={mensajeTarjeta()}
                onChange={(e) => setTextoEditado(e.target.value)}
              />
              {textoEditado !== null && (
                <button type="button" className="tarjeta-link" onClick={() => setTextoEditado(null)}>Volver al mensaje original</button>
              )}
            </details>
            <div className="tarjeta-ayuda">
              {tarjeta.inv.telefono
                ? <>Se abre <strong>directo el chat de {tarjeta.inv.nombre.split(" ")[0]}</strong> con el mensaje. La tarjeta queda copiada: en el chat mantené presionado y <strong>Pegar</strong> (en la compu, Ctrl+V).</>
                : compartirEsLoPrincipal()
                ? <>Elegí <strong>WhatsApp</strong> y el contacto: la tarjeta va con el mensaje, y el enlace para confirmar se puede tocar.</>
                : <>Se copia la tarjeta y se abre el chat con el mensaje y el enlace para confirmar. En el chat pegala con <strong>Ctrl+V</strong> y enviá.</>}
            </div>
            {tarjeta.inv.telefono
              ? <button className="tarjeta-principal" onClick={enviarTarjetaAlChat} disabled={!tarjeta.blob} type="button">Enviar a {tarjeta.inv.nombre.split(" ")[0]} por WhatsApp</button>
              : compartirEsLoPrincipal()
              ? <button className="tarjeta-principal" onClick={compartirTarjeta} disabled={!tarjeta.blob} type="button">Enviar tarjeta</button>
              : <button className="tarjeta-principal" onClick={copiarYAbrirWhatsApp} disabled={!tarjeta.blob} type="button">Copiar y abrir WhatsApp</button>}
            {tarjeta.inv.telefono && compartirEsLoPrincipal() && (
              <button className="tarjeta-link" onClick={compartirTarjeta} disabled={!tarjeta.blob} type="button">o compartir la imagen eligiendo el contacto</button>
            )}
            <button className="tarjeta-estados" onClick={imprimirTarjeta} disabled={!tarjeta.blob} type="button">
              <IcoImpresora size={16} />Imprimir (5×7 con código QR)
            </button>
            <button className="tarjeta-estados" onClick={tarjetaParaEstados} disabled={generandoHistoria} type="button">
              {generandoHistoria ? "Preparando…" : "Versión para estados (sin nombre del invitado)"}
            </button>
            <div className="tarjeta-secundarias">
              <button className="btn-cancel" onClick={enviarSoloMensaje} type="button">Solo el mensaje</button>
              <button className="btn-cancel" onClick={descargarTarjeta} disabled={!tarjeta.blob} type="button">Descargar</button>
              <button className="btn-cancel" onClick={cerrarTarjeta} type="button">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div className={`page-wrap${mounted ? " mounted" : ""}`}>
        <div className="glow glow-1" />
        <div className="glow glow-2" />

        {/* ── Top bar ── */}
        <div className="top-bar anim-header">
          <div className="top-bar-event">
            {evento?.nombre ?? "Invitados"}
          </div>
        </div>

        {/* ── Barra inferior ── */}
        <div className="bottom-bar">
          <button className="btn-back" onClick={() => router.push("/dashboard")} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Regresar al dashboard
          </button>
        </div>

        {/* ── Content ── */}
        <div className="scroll-area">

          {/* ── Hero metrics card ── */}
          {evento && (
            <div className="hero-card anim-card">
              <div className="hero-tipo">
                {TIPO_LABEL[evento.tipo] ?? "Evento especial"}
              </div>
              <div className="hero-nombre">{evento.nombre}</div>
              <div className="hero-anfitriones">
                {evento.anfitriones}
              </div>
              <div className="hero-pills">
                <div className="hero-pill pill-ok">
                  <div className="hero-pill-num">
                    {todosInvitados.filter(i => i.estado === "confirmado").length}
                  </div>
                  <div className="hero-pill-label">Confirm.</div>
                </div>
                <div className="hero-pill pill-pend">
                  <div className="hero-pill-num">
                    {sinConfirmar.length}
                  </div>
                  <div className="hero-pill-label">Pendientes</div>
                </div>
                <div className="hero-pill pill-no">
                  <div className="hero-pill-num">
                    {todosInvitados.filter(i => i.estado === "rechazado").length}
                  </div>
                  <div className="hero-pill-label">Rechazaron</div>
                </div>
              </div>
              {aDistanciaLista.length > 0 && (
                <div className="hero-distancia"><IcoCarta size={14} />{aDistanciaLista.length} invitación{aDistanciaLista.length !== 1 ? "es" : ""} especial{aDistanciaLista.length !== 1 ? "es" : ""} a distancia</div>
              )}
            </div>
          )}

          {/* ── Recordatorio: falta una semana o menos ── */}
          {mostrarRecordatorio && (
            <div className="recordatorio-banner anim-card">
              <div className="recordatorio-icono" aria-hidden="true">⏳</div>
              <div className="recordatorio-cuerpo">
                <div className="recordatorio-titulo">
                  {diasFaltan === 0 ? "¡El evento es hoy!" : diasFaltan === 1 ? "El evento es mañana" : diasFaltan === 7 ? "Falta una semana" : `Faltan ${diasFaltan} días`}
                </div>
                <div className="recordatorio-sub">
                  {sinConfirmar.length} invitado{sinConfirmar.length !== 1 ? "s" : ""} todavía no confirm{sinConfirmar.length !== 1 ? "aron" : "ó"}
                  {sinRecordar.length < sinConfirmar.length && ` · ya recordaste a ${sinConfirmar.length - sinRecordar.length}`}
                </div>
              </div>
              <button
                className="recordatorio-btn"
                type="button"
                onClick={() => abrirEnvioGrupo("recordatorio", (sinRecordar.length > 0 ? sinRecordar : sinConfirmar).map((i) => i.token))}
              >
                Recordar
              </button>
            </div>
          )}

          {/* ── Mensaje del día: la víspera y el mismo día ── */}
          {mostrarMensajeDia && (
            <div className="recordatorio-banner anim-card">
              <div className="recordatorio-icono" aria-hidden="true">🎉</div>
              <div className="recordatorio-cuerpo">
                <div className="recordatorio-titulo">{diasFaltan === 0 ? "¡Hoy es el día!" : "Mañana es el día"}</div>
                <div className="recordatorio-sub">
                  Mandales a los {confirmados.length} confirmado{confirmados.length !== 1 ? "s" : ""} la hora y cómo llegar
                  {sinMensajeDia.length < confirmados.length && ` · ya enviaste ${confirmados.length - sinMensajeDia.length}`}
                </div>
              </div>
              <button
                className="recordatorio-btn"
                type="button"
                onClick={() => abrirEnvioGrupo("dia", (sinMensajeDia.length > 0 ? sinMensajeDia : confirmados).map((i) => i.token))}
              >
                Enviar
              </button>
            </div>
          )}

          {/* ── Versículo de la invitación ── */}
          {evento && (
            <button type="button" className="versiculo-fila anim-card" onClick={() => setEditandoVersiculo(true)}>
              <span className="versiculo-icono" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /><path d="M12 6v7M9.5 8.5h5" /></svg>
              </span>
              <span className="versiculo-cuerpo">
                {versiculoActual ? (
                  <>
                    <span className="versiculo-texto">«{versiculoActual.texto}»</span>
                    <span className="versiculo-cita">{versiculoActual.cita}</span>
                  </>
                ) : (
                  <>
                    <span className="versiculo-titulo">Agregar un versículo bíblico</span>
                    <span className="versiculo-sub">Va en la tarjeta y en el mensaje de invitación</span>
                  </>
                )}
              </span>
              <span className="versiculo-accion">{versiculoActual ? "Cambiar" : "Elegir"}</span>
            </button>
          )}

          {/* ── Banner de plan ── */}
          {userPlan === "free" && todosInvitados.length >= PLAN_LIMIT_FREE && (
            <div className="plan-limit-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <div className="plan-limit-banner-body">
                <div className="plan-limit-banner-title">Límite del Plan Gratuito alcanzado ({PLAN_LIMIT_FREE}/{PLAN_LIMIT_FREE} invitados)</div>
                <div className="plan-limit-banner-sub">Para agregar más invitados, contactá al administrador para activar el Plan Pro ($12 por evento).</div>
              </div>
            </div>
          )}
          {userPlan === "free" && todosInvitados.length >= PLAN_LIMIT_FREE - 2 && todosInvitados.length < PLAN_LIMIT_FREE && (
            <div className="plan-warn-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
              </svg>
              Quedán {PLAN_LIMIT_FREE - todosInvitados.length} invitado{PLAN_LIMIT_FREE - todosInvitados.length !== 1 ? "s" : ""} disponible{PLAN_LIMIT_FREE - todosInvitados.length !== 1 ? "s" : ""} en el Plan Gratuito.
            </div>
          )}

          {/* ── Agregar invitado ── */}
          <div className="card anim-card">
            <div className="card-title">Agregar invitado</div>
            <div className="card-sub">Completá los datos y compartí el link de confirmación</div>

            {error && <div className="error-box">{error}</div>}

            <div className="fields">
              <div>
                <label className="field-label">Nombre *</label>
                <input
                  className="field-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: María García"
                  autoComplete="off"
                  onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
                />
              </div>

              <div>
                <label className="field-label">Teléfono (WhatsApp)</label>
                <PhoneInput
                  value={telefono}
                  onChange={setTelefono}
                  defaultCountry="SV"
                />
              </div>

              {distanciaOk && (
                <div className="toggle-row toggle-distancia">
                  <div>
                    <div className="toggle-label"><IcoCarta size={15} style={{ color: "#9D174D", flexShrink: 0 }} />Invitación especial a distancia</div>
                    <div className="toggle-sub">Para quien está lejos: no confirma, ve las fotos y te deja su mensaje</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={aDistancia} onChange={(e) => setADistancia(e.target.checked)} />
                    <span className="toggle-thumb" />
                  </label>
                </div>
              )}

              {!cupoElijeInvitado && !aDistancia && (
                <div>
                  <label className="field-label">Cantidad de lugares</label>
                  <input
                    className="field-input"
                    type="number"
                    min="1"
                    max="20"
                    value={numPersonas}
                    onChange={(e) => setNumPersonas(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              )}

              {!aDistancia && <div className="toggle-row">
                <div>
                  <div className="toggle-label">El invitado elige cuántos van</div>
                  <div className="toggle-sub">No se asigna un cupo fijo</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={cupoElijeInvitado}
                    onChange={(e) => {
                      setCupoElijeInvitado(e.target.checked);
                      localStorage.setItem(storageKey, String(e.target.checked));
                    }}
                  />
                  <span className="toggle-thumb" />
                </label>
              </div>}

              <button
                className={`btn-submit${btnSuccess ? " btn-success-pulse" : ""}`}
                onClick={handleAgregar}
                disabled={loading || !nombre.trim()}
                type="button"
                style={{ position: "relative" }}
              >
                <span className="btn-shimmer" />
                {loading ? "Agregando..." : "Agregar invitado"}
                {/* Confetti burst */}
                {confettiDots.length > 0 && (
                  <div className="confetti-wrap" aria-hidden="true">
                    {confettiDots.map((d) => (
                      <div
                        key={d.id}
                        className="confetti-dot"
                        style={{
                          "--cc": d.color,
                          "--cs": d.size,
                          "--cbr": d.borderRadius,
                          "--cx": d.cx,
                          "--cy": d.cy,
                          "--cr": d.cr,
                          "--cd": d.duration,
                          animationDelay: d.delay,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* ── Recién agregados (esta sesión) ── */}
          {agregados.length > 0 && (
            <div className="section-card anim-list">
              <div className="section-head">
                <div className="section-head-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  Recién agregados
                  <span className="list-badge">{agregados.length}</span>
                </div>
              </div>

              {conTelefono.length > 0 && (
                <button
                  className="btn-bulk"
                  onClick={() => abrirEnvioGrupo("invitacion", conTelefono.map((i) => i.token))}
                  type="button"
                >
                  <span className="btn-bulk-shimmer" />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.946 0C5.344 0 0 5.268 0 11.772c0 2.077.556 4.027 1.526 5.716L.057 24l6.727-1.712a11.98 11.98 0 005.162 1.168h.005C18.549 23.456 24 18.188 24 11.684 24 5.268 18.549 0 11.946 0z"/></svg>
                  {`Enviar WhatsApp a todos (${conTelefono.length})`}
                </button>
              )}

              {agregados.map((inv) => (
                <div key={inv.id ?? inv.token} style={{ marginBottom: 8 }}>
                  <div className="inv-row" style={{ marginBottom: 0 }}>
                    <div className="inv-avatar">
                      {inv.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="inv-info">
                      <div className="inv-name">{inv.nombre}</div>
                      {inv.telefono
                        ? <div className="inv-phone"><IcoCelular size={12} />{inv.telefono}</div>
                        : <div className="inv-no-phone">Sin número</div>
                      }
                    </div>
                    <div className="inv-actions">
                      <button
                        className={`btn-action ${copiado === inv.token ? "btn-copy-done" : "btn-copy-default"}`}
                        onClick={() => copiarLink(inv.token)}
                        type="button"
                        title="Copiar link"
                      >
                        {copiado === inv.token ? <IcoCheck size={14} strokeWidth={2.4} /> : <IcoEnlace size={14} strokeWidth={2.2} />}
                        <span className="btn-action-txt">{copiado === inv.token ? "Copiado" : "Link"}</span>
                      </button>
                      <button
                        className="btn-action btn-tarjeta"
                        onClick={() => prepararTarjeta(inv)}
                        type="button"
                        title="Enviar como tarjeta"
                        aria-label={`Ver y enviar la tarjeta de invitación de ${inv.nombre}`}
                        disabled={!!tarjeta}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                        <span className="btn-tarjeta-txt">Tarjeta</span>
                      </button>
                      {inv.telefono && (
                        <button
                          className={`btn-action ${yaEnviado(inv) ? "btn-wa-done" : "btn-wa"}${lastAdded === inv.token && !yaEnviado(inv) ? " btn-wa-new" : ""}`}
                          onClick={() => enviarWhatsApp(inv)}
                          type="button"
                          aria-label={`Enviar WhatsApp a ${inv.nombre}`}
                        >
                          {yaEnviado(inv) ? <IcoCheck size={14} strokeWidth={2.4} /> : <IcoWhatsApp size={14} />}
                          <span className="btn-action-txt">{yaEnviado(inv) ? "Enviado" : "WhatsApp"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Gestionar todos ── */}
          <div className="section-card anim-list">
            <div className="section-head">
              <div className="section-head-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                Todos los invitados
                <span className="list-badge">{todosInvitados.length}</span>
              </div>
              {todosInvitados.length > 0 && (
                <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="btn-varios"
                  onClick={() => abrirEnvioGrupo("invitacion", sinConfirmar.filter((i) => !yaEnviado(i)).map((i) => i.token))}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  Enviar a varios
                </button>
                <button
                  onClick={handleExportarExcel}
                  disabled={exportando}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(79,70,229,0.10)",
                    border: "1px solid rgba(79,70,229,0.30)", borderRadius: 10,
                    padding: "6px 12px", fontSize: 11, fontWeight: 700,
                    color: "var(--accent2)", cursor: exportando ? "wait" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {exportando ? "..." : "Excel"}
                </button>
                <button
                  onClick={descargarTodasLasTarjetas}
                  disabled={!!zipProgreso || !evento}
                  title="Descargar la tarjeta de cada invitado en un ZIP"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(79,70,229,0.10)",
                    border: "1px solid rgba(79,70,229,0.30)", borderRadius: 10,
                    padding: "6px 12px", fontSize: 11, fontWeight: 700,
                    color: "var(--accent2)", cursor: zipProgreso ? "wait" : "pointer",
                    fontFamily: "inherit", whiteSpace: "nowrap",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                  {zipProgreso ? `Tarjetas ${zipProgreso}` : "Tarjetas (ZIP)"}
                </button>
                </div>
              )}
            </div>

            {/* Search */}
            {todosInvitados.length > 0 && (
              <div className="search-wrap">
                <span className="search-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  className="search-input"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre..."
                  autoComplete="off"
                />
              </div>
            )}

            {loadingInvitados ? (
              <div className="empty-state">Cargando invitados...</div>
            ) : todosInvitados.length === 0 ? (
              <div className="empty-state">Aún no hay invitados. Agrégalos arriba.</div>
            ) : invitadosFiltrados.length === 0 ? (
              <div className="empty-state">Sin resultados para "{busqueda}"</div>
            ) : (
              invitadosFiltrados.map((inv) => (
                <div key={inv.id ?? inv.token} style={{ marginBottom: 8 }}>
                  <div className="inv-row" style={{ marginBottom: 0 }}>
                    <div className="inv-avatar" style={{
                      background: inv.estado === "confirmado"
                        ? "linear-gradient(135deg,#16a34a,#15803d)"
                        : inv.estado === "rechazado"
                        ? "linear-gradient(135deg,#dc2626,#b91c1c)"
                        : "linear-gradient(135deg,var(--accent),var(--accent2))",
                    }}>
                      {inv.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="inv-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <div className="inv-name">{inv.nombre}</div>
                        {inv.a_distancia ? (
                          <span className="estado-badge estado-distancia"><IcoCarta size={11} strokeWidth={2.2} />A distancia</span>
                        ) : inv.estado && (
                          <span className={`estado-badge ${
                            inv.estado === "confirmado" ? "estado-confirmado"
                            : inv.estado === "rechazado" ? "estado-rechazado"
                            : "estado-pendiente"
                          }`}>
                            {inv.estado === "confirmado" ? "✓ Conf."
                              : inv.estado === "rechazado" ? "✗ Rechazó"
                              : "Pendiente"}
                          </span>
                        )}
                      </div>
                      {inv.telefono
                        ? <div className="inv-phone"><IcoCelular size={12} />{inv.telefono}</div>
                        : <div className="inv-no-phone">Sin número</div>
                      }
                      {!inv.a_distancia && (
                        <div className="inv-cupo">
                          <IcoPersonas size={12} />
                          {inv.cupo_elije_invitado
                            ? "Elige cuántos van"
                            : `${inv.num_personas ?? 1} lugar${(inv.num_personas ?? 1) !== 1 ? "es" : ""}`}
                        </div>
                      )}
                      {distanciaOk && inv.id && (
                        <button type="button" className="inv-distancia-btn" onClick={() => alternarDistancia(inv)}>
                          {inv.a_distancia ? "Volver a invitación normal" : "Marcar como a distancia"}
                        </button>
                      )}
                      {inv.estado === "confirmado" && inv.id && asistentesPorId[inv.id]?.length > 0 && (
                        <div style={{ fontSize: 10.5, color: "var(--text2)", marginTop: 2, fontWeight: 600 }}>
                          ✓ Van: {asistentesPorId[inv.id].join(", ")}
                        </div>
                      )}
                      {(marcas[inv.token]?.enviado_at || marcas[inv.token]?.recordatorio_at) && (
                        <div className="inv-envio">
                          {[marcas[inv.token]?.enviado_at && "Invitación enviada", marcas[inv.token]?.recordatorio_at && "Recordado"].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div className="inv-actions">
                      <button
                        className={`btn-action ${copiado === inv.token ? "btn-copy-done" : "btn-copy-default"}`}
                        onClick={() => copiarLink(inv.token)}
                        type="button"
                        title="Copiar link"
                      >
                        {copiado === inv.token ? <IcoCheck size={14} strokeWidth={2.4} /> : <IcoEnlace size={14} strokeWidth={2.2} />}
                        <span className="btn-action-txt">{copiado === inv.token ? "Copiado" : "Link"}</span>
                      </button>
                      <button
                        className="btn-action btn-tarjeta"
                        onClick={() => prepararTarjeta(inv)}
                        type="button"
                        title="Enviar como tarjeta"
                        aria-label={`Ver y enviar la tarjeta de invitación de ${inv.nombre}`}
                        disabled={!!tarjeta}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                        <span className="btn-tarjeta-txt">Tarjeta</span>
                      </button>
                      {inv.telefono && (
                        <button
                          className={`btn-action ${yaEnviado(inv) ? "btn-wa-done" : "btn-wa"}`}
                          onClick={() => enviarWhatsApp(inv)}
                          type="button"
                        >
                          {yaEnviado(inv) ? <IcoCheck size={14} strokeWidth={2.4} /> : <IcoWhatsApp size={14} />}
                          <span className="btn-action-txt">{yaEnviado(inv) ? "Enviado" : "WhatsApp"}</span>
                        </button>
                      )}
                      <button
                        className="btn-action btn-eliminar"
                        aria-label={`Eliminar a ${inv.nombre}`}
                        onClick={() => setConfirmEliminar(confirmEliminar === inv.id ? null : (inv.id ?? null))}
                        type="button"
                        disabled={eliminando === inv.id}
                      >
                        {eliminando === inv.id ? "…" : <IcoPapelera size={15} strokeWidth={2} />}
                      </button>
                    </div>
                  </div>

                  {confirmEliminar === inv.id && (
                    <div className="confirm-eliminar">
                      <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, flex: 1 }}>
                        ¿Eliminar a {inv.nombre}?
                      </span>
                      <button
                        className="btn-action btn-eliminar"
                        onClick={() => handleEliminar(inv)}
                        disabled={eliminando === inv.id}
                        type="button"
                        style={{ padding: "5px 12px" }}
                      >
                        Eliminar
                      </button>
                      <button
                        className="btn-action btn-copy-default"
                        onClick={() => setConfirmEliminar(null)}
                        type="button"
                        style={{ padding: "5px 12px" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </div>

    </>
  );
}

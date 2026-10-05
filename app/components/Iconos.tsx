// ─── Íconos de línea de toda la app ───────────────────────────────────────────
//
// Un solo trazo redondeado (estilo Lucide) que toma el color del texto. Van en
// lugar de los emojis en botones y rótulos: un emoji cambia de dibujo según el
// teléfono (el 📷 de Android no es el del iPhone) y desentona con el resto.

import type { ReactNode, SVGProps } from "react";

type Props = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function Linea({ size = 16, strokeWidth = 1.9, children, ...rest }: Props & { children: ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}
    >
      {children}
    </svg>
  );
}

export const IcoCamara = (p: Props) => (
  <Linea {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></Linea>
);
export const IcoImagen = (p: Props) => (
  <Linea {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></Linea>
);
export const IcoEnlace = (p: Props) => (
  <Linea {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Linea>
);
export const IcoCheck = (p: Props) => <Linea {...p}><path d="M20 6 9 17l-5-5" /></Linea>;
export const IcoCelular = (p: Props) => (
  <Linea {...p}><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></Linea>
);
export const IcoPersonas = (p: Props) => (
  <Linea {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Linea>
);
export const IcoPapelera = (p: Props) => (
  <Linea {...p}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></Linea>
);
export const IcoImpresora = (p: Props) => (
  <Linea {...p}><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></Linea>
);
/** Sobre: la invitación especial a distancia. */
export const IcoCarta = (p: Props) => (
  <Linea {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Linea>
);
export const IcoCorazon = (p: Props) => (
  <Linea {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></Linea>
);
export const IcoCalendario = (p: Props) => (
  <Linea {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Linea>
);
export const IcoUbicacion = (p: Props) => (
  <Linea {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Linea>
);
export const IcoMensaje = (p: Props) => <Linea {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Linea>;
export const IcoFlecha = (p: Props) => <Linea {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Linea>;

/** WhatsApp va relleno: es una marca, no un ícono de línea. */
export function IcoWhatsApp({ size = 16, ...rest }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

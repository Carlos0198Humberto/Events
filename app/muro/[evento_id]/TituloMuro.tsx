"use client";
// ─── El título del muro ───────────────────────────────────────────────────────
//
// Tipográfico, sin foto (la foto chica de antes no aportaba): arriba, en
// versalitas, qué es ("Deseos de graduación"); al centro, el nombre grande en
// cursiva; abajo, la promoción entre dos ramitas de laurel y lo que ya hay en
// el muro. En graduación va en azul noche y dorado, con un birrete de línea
// fina, un brillo detrás del nombre, grano fino y algunos destellos
// (FondoMuroGrad); en los demás eventos, sobre el fondo de siempre del tema.

import type { ReactNode } from "react";

type Props = {
  /** "Deseos de graduación" */
  kicker: string;
  /** "Carlos" */
  nombre: string;
  /** "Promoción 2026" (o la fecha); null = sin línea */
  linea: string | null;
  /** "12 fotos · 8 deseos" */
  cuenta: { numero: number; texto: string }[];
  grad: boolean;
  /** Lo que va debajo (el aviso del recorrido del invitado) */
  children?: ReactNode;
};

export default function TituloMuro({ kicker, nombre, linea, cuenta, grad, children }: Props) {
  return (
    <div className={`tm${grad ? " grad" : ""}`}>
      <style>{ESTILOS}</style>
      <h1 className="tm-h1">
        <span className="tm-kicker">
          <Destello tam={9} />
          <span>{kicker}</span>
          <Destello tam={9} />
        </span>
        {grad && <Birrete />}
        <span className={`tm-nombre${nombre.length > 12 ? " largo" : ""}`}>{nombre}</span>
      </h1>
      {linea && (
        <p className="tm-linea">
          {grad ? <Ramita /> : <i className="tm-raya" aria-hidden="true" />}
          <span>{linea}</span>
          {grad ? <Ramita espejo /> : <i className="tm-raya" aria-hidden="true" />}
        </p>
      )}
      <p className="tm-cuenta">
        {cuenta.map((c, i) => (
          <span key={c.texto} className="tm-dato">
            {i > 0 && <b className="tm-punto" aria-hidden="true" />}
            <strong>{c.numero}</strong> {c.texto}
          </span>
        ))}
      </p>
      {children}
    </div>
  );
}

/** El fondo del encabezado en graduación: brillo dorado, grano fino y destellos. */
export function FondoMuroGrad() {
  return (
    <div className="tmf" aria-hidden="true">
      <style>{ESTILOS_FONDO}</style>
      <div className="tmf-brillo" />
      <div className="tmf-grano" />
      {DESTELLOS.map((d, i) => (
        <span key={i} className="tmf-destello" style={{ left: `${d.x}%`, top: `${d.y}%`, animationDelay: `${d.retraso}s` }}>
          <Destello tam={d.tam} />
        </span>
      ))}
    </div>
  );
}

const DESTELLOS = [
  { x: 8, y: 30, tam: 10, retraso: 0 },
  { x: 90, y: 24, tam: 13, retraso: 1.3 },
  { x: 15, y: 78, tam: 7, retraso: 2.2 },
  { x: 85, y: 70, tam: 9, retraso: 0.7 },
  { x: 24, y: 50, tam: 5, retraso: 3.1 },
  { x: 76, y: 46, tam: 6, retraso: 1.9 },
  { x: 60, y: 88, tam: 5, retraso: 2.7 },
];

function Destello({ tam }: { tam: number }) {
  return (
    <svg className="tm-destello" width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C12.9 7.4 16.6 11.1 24 12 16.6 12.9 12.9 16.6 12 24 11.1 16.6 7.4 12.9 0 12 7.4 11.1 11.1 7.4 12 0Z" fill="currentColor" />
    </svg>
  );
}

/** Birrete de línea fina, dorado */
function Birrete() {
  return (
    <svg className="tm-birrete" width="40" height="28" viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M20 3 37 10 20 17 3 10Z" />
      <path d="M10 13.2v6.3c0 1.9 4.5 3.7 10 3.7s10-1.8 10-3.7v-6.3" />
      <path d="M37 10v8" />
      <path d="M37 18c-1.3 1.6-1.3 3.4 0 4.6 1.3-1.2 1.3-3 0-4.6Z" fill="currentColor" />
    </svg>
  );
}

/** Ramita de laurel: el tallo apenas curvo y hojas alternadas que se achican hacia la punta */
function Ramita({ espejo = false }: { espejo?: boolean }) {
  const hojas: { x: number; y: number; ang: number; rx: number }[] = [];
  // Tallo: curva cuadrática de (58,13) (junto al texto) a (4,8) (la punta)
  const P0 = [58, 13], C = [30, 16], P1 = [4, 8];
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P1[0];
    const y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P1[1];
    const dx = 2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P1[0] - C[0]);
    const dy = 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P1[1] - C[1]);
    const base = (Math.atan2(dy, dx) * 180) / Math.PI;
    const lado = i % 2 ? 1 : -1;
    hojas.push({ x, y, ang: base + lado * 34, rx: 6.2 - t * 2.6 });
  }
  return (
    <svg className={`tm-ramita${espejo ? " espejo" : ""}`} width="62" height="22" viewBox="0 0 62 22" aria-hidden="true">
      <path d="M58 13Q30 16 4 8" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {hojas.map((h, i) => (
        <ellipse
          key={i}
          cx={h.x.toFixed(1)}
          cy={h.y.toFixed(1)}
          rx={h.rx.toFixed(1)}
          ry={(h.rx * 0.4).toFixed(1)}
          transform={`rotate(${h.ang.toFixed(1)} ${h.x.toFixed(1)} ${h.y.toFixed(1)}) translate(${(h.rx * 0.85).toFixed(1)} 0)`}
          fill="currentColor"
        />
      ))}
      <ellipse cx="4" cy="8" rx="3.4" ry="1.4" transform="rotate(200 4 8) translate(2.6 0)" fill="currentColor" />
    </svg>
  );
}

const ESTILOS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap');
.tm{position:relative;z-index:1;padding:4px 4px 2px;text-align:center}
.tm-h1{margin:0;display:flex;flex-direction:column;align-items:center;font-weight:inherit}
.tm-kicker{display:inline-flex;align-items:center;gap:10px;font-family:'DM Sans',sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.38em;text-transform:uppercase;
  color:rgba(255,255,255,.86);padding-left:.38em}
.tm-kicker .tm-destello{color:rgba(255,255,255,.7);flex-shrink:0}
.tm-birrete{color:#E6CF8E;margin:16px 0 -2px;filter:drop-shadow(0 2px 8px rgba(0,0,0,.35))}
.tm-nombre{display:block;margin-top:8px;padding:0 .12em .06em;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:600;
  font-size:clamp(58px,19vw,84px);line-height:.98;letter-spacing:-.01em;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,.35)}
.tm-nombre.largo{font-size:clamp(34px,10vw,48px);line-height:1.08}
.tm-linea{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;
  font-size:19px;letter-spacing:.02em;color:rgba(255,255,255,.88)}
.tm-ramita{color:#D9BC72;flex-shrink:0}
.tm-ramita.espejo{transform:scaleX(-1)}
.tm-raya{display:block;width:34px;height:1px;background:rgba(255,255,255,.55)}
.tm-cuenta{display:inline-flex;align-items:center;gap:0;margin-top:16px;padding:7px 16px;border-radius:999px;background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.82)}
.tm-dato{display:inline-flex;align-items:baseline;gap:5px}
.tm-dato strong{font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:600;letter-spacing:0;color:#fff}
.tm-punto{display:inline-block;width:4px;height:4px;margin:0 12px 2px;transform:rotate(45deg);background:rgba(255,255,255,.6)}

/* Graduación: dorado */
.tm.grad .tm-kicker{color:#E6CF8E}
.tm.grad .tm-kicker .tm-destello{color:#E6CF8E}
.tm.grad .tm-nombre{background:linear-gradient(100deg,#C9A54C 0%,#F6E7B8 30%,#D4B062 50%,#F3DFA4 70%,#B8954A 100%);background-size:220% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 3px 14px rgba(0,0,0,.45));
  animation:tmBrillo 7s ease-in-out infinite}
.tm.grad .tm-cuenta{border-color:rgba(230,207,142,.38);background:rgba(230,207,142,.07)}
.tm.grad .tm-dato strong{color:#F3DFA4}
.tm.grad .tm-punto{background:#E6CF8E}
@keyframes tmBrillo{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@media (prefers-reduced-motion:reduce){.tm.grad .tm-nombre{animation:none}}
`;

const ESTILOS_FONDO = `
.tmf{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.tmf-brillo{position:absolute;left:50%;top:58%;width:min(520px,130vw);height:300px;transform:translate(-50%,-50%);
  background:radial-gradient(closest-side,rgba(201,165,76,.26),rgba(201,165,76,.08) 55%,transparent)}
.tmf-grano{position:absolute;inset:0;opacity:.16;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.tmf-destello{position:absolute;color:#F3DFA4;opacity:.75;animation:tmfTitila 4.2s ease-in-out infinite}
@keyframes tmfTitila{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:.9;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.tmf-destello{animation:none}}
`;

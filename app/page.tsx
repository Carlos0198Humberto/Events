import Link from "next/link";

export const metadata = {
  title: "Events — Tu evento, tu historia",
  description:
    "Invitaciones digitales, fotos en vivo y libro de recuerdos para tus eventos",
  icons: { icon: "/icon" },
};

function AppLogo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="10" fill="#3AADA0" />
      <rect
        x="5"
        y="10"
        width="24"
        height="16"
        rx="2.5"
        stroke="white"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M5 14.5l12 8 12-8"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 10c0 0-4-2.8-4 1 0 2.1 4 4.6 4 4.6s4-2.5 4-4.6C21 7.2 17 10 17 10z"
        fill="white"
      />
    </svg>
  );
}

const features = [
  {
    title: "Invitaciones",
    desc: "Link único por WhatsApp",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="1"
          y="4"
          width="16"
          height="11"
          rx="2.5"
          stroke="#3AADA0"
          strokeWidth="1.3"
        />
        <path
          d="M1 8l8 5 8-5"
          stroke="#3AADA0"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Confirmación",
    desc: "Un clic, sin registro",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="2"
          y="2"
          width="14"
          height="14"
          rx="2.5"
          stroke="#3AADA0"
          strokeWidth="1.3"
        />
        <path
          d="M6 2v2M12 2v2M2 7h14"
          stroke="#3AADA0"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M6 11l2.5 2.5 4.5-4"
          stroke="#3AADA0"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Muro de fotos",
    desc: "Fotos en tiempo real",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect
          x="1"
          y="4"
          width="16"
          height="12"
          rx="2.5"
          stroke="#3AADA0"
          strokeWidth="1.3"
        />
        <circle cx="6.5" cy="10" r="2.2" stroke="#3AADA0" strokeWidth="1.2" />
        <path
          d="M11 8h4M11 11h2.5"
          stroke="#3AADA0"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M5 4l1.2-1.5h5.6L13 4"
          stroke="#3AADA0"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Libro digital",
    desc: "Recuerdo para siempre",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M3 15A2 2 0 015 13H15"
          stroke="#3AADA0"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M5 1H15v17H5A2 2 0 013 16V3A2 2 0 015 1z"
          stroke="#3AADA0"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const steps = [
  { n: "1", label: "Invita" },
  { n: "2", label: "Confirma" },
  { n: "3", label: "Fotos" },
  { n: "4", label: "Recuerdo" },
];

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #f0faf8; }

        .wrap { max-width: 420px; margin: 0 auto; min-height: 100vh; background: #f0faf8; }

        /* NAV */
        .nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 22px;
          background: rgba(240,250,248,0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #cce8e4;
          position: sticky; top: 0; z-index: 10;
        }
        .nav-brand { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .nav-name { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 700; color: #0f2422; letter-spacing: -.3px; }
        .btn-nav {
          background: #3AADA0; color: white;
          font-size: 13px; font-weight: 600;
          padding: 9px 18px; border-radius: 10px;
          text-decoration: none;
          transition: background .15s, transform .12s;
        }
        .btn-nav:hover { background: #2e948a; transform: translateY(-1px); }

        /* HERO */
        .hero { padding: 36px 22px 28px; }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: #ddf5f1; color: #267d75;
          font-size: 10.5px; font-weight: 600; letter-spacing: .7px; text-transform: uppercase;
          padding: 5px 12px; border-radius: 100px;
          border: 1px solid #b0ddd9; margin-bottom: 18px;
        }
        .hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #3AADA0; }
        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(34px, 9vw, 42px);
          line-height: 1.12; letter-spacing: -.6px;
          color: #0a1e1c; margin-bottom: 14px;
        }
        .hero h1 em { font-style: italic; color: #3AADA0; }
        .hero-sub { font-size: 14px; color: #4e8880; line-height: 1.65; margin-bottom: 24px; }
        .hero-ctas { display: flex; gap: 10px; }
        .btn-primary {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          background: #3AADA0; color: white;
          font-size: 14px; font-weight: 600; text-decoration: none;
          padding: 13px 20px; border-radius: 13px;
          transition: background .15s, transform .12s, box-shadow .15s;
          box-shadow: 0 3px 16px rgba(58,173,160,.28);
        }
        .btn-primary:hover { background: #2e948a; transform: translateY(-2px); box-shadow: 0 6px 22px rgba(58,173,160,.36); }
        .btn-secondary {
          display: flex; align-items: center; justify-content: center;
          background: white; color: #3AADA0;
          font-size: 14px; font-weight: 500; text-decoration: none;
          padding: 13px 18px; border-radius: 13px;
          border: 1.5px solid #b0ddd9;
          transition: border-color .15s, background .15s;
        }
        .btn-secondary:hover { border-color: #3AADA0; background: #f0faf8; }

        /* STEPS */
        .steps {
          display: flex; align-items: flex-start;
          padding: 20px 22px 24px; gap: 0;
        }
        .step-wrap { flex: 1; display: flex; align-items: flex-start; }
        .step-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .step-circle {
          width: 32px; height: 32px; border-radius: 50%;
          background: white; border: 1.5px solid #b0ddd9;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #3AADA0;
        }
        .step-label { font-size: 10px; color: #7ab5b0; font-weight: 500; text-align: center; }
        .step-line { flex: 1; height: 1.5px; background: #b0ddd9; margin-top: 15px; }

        /* FEATURES */
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 16px 24px; }
        .feat-card {
          background: white; border-radius: 16px;
          border: 1px solid #ddf0ed; padding: 16px 14px;
          transition: border-color .18s, transform .18s;
        }
        .feat-card:hover { border-color: #8dd4cf; transform: translateY(-2px); }
        .feat-icon {
          width: 36px; height: 36px; background: #e8f8f5;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px;
        }
        .feat-title { font-size: 13px; font-weight: 600; color: #0f2422; margin-bottom: 4px; }
        .feat-desc { font-size: 11.5px; color: #7aada8; line-height: 1.4; }

        /* CTA BLOCK */
        .cta-block {
          margin: 4px 16px 24px;
          background: #0f2422; border-radius: 22px; padding: 30px 22px;
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-block::before {
          content: ''; position: absolute;
          top: -60px; right: -60px; width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(58,173,160,.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .cta-block h2 {
          font-family: 'Playfair Display', serif;
          font-size: 22px; color: white; letter-spacing: -.3px;
          margin-bottom: 8px; position: relative; z-index: 1;
        }
        .cta-block p { font-size: 13px; color: #6aada8; margin-bottom: 18px; position: relative; z-index: 1; }
        .btn-cta {
          display: inline-flex; align-items: center; gap: 7px;
          background: #3AADA0; color: white;
          font-size: 14px; font-weight: 600; text-decoration: none;
          padding: 13px 28px; border-radius: 12px;
          transition: background .15s; position: relative; z-index: 1;
        }
        .btn-cta:hover { background: #2e948a; }

        /* TRUST */
        .trust { display: flex; flex-direction: column; gap: 10px; padding: 0 22px 28px; }
        .trust-item { display: flex; align-items: center; gap: 9px; }
        .trust-check {
          width: 18px; height: 18px; border-radius: 50%;
          border: 1.5px solid #3AADA0; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .trust-text { font-size: 13px; color: #4e8880; font-weight: 400; }

        /* FOOTER */
        .footer {
          border-top: 1px solid #cce8e4;
          padding: 16px 22px 28px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-brand { display: flex; align-items: center; gap: 7px; text-decoration: none; }
        .footer-name { font-family: 'Playfair Display', serif; font-size: 14px; color: #0f2422; }
        .footer-copy { font-size: 11px; color: #9ac8c4; }
      `}</style>

      <div className="wrap">
        {/* NAV */}
        <nav className="nav">
          <Link href="/" className="nav-brand">
            <AppLogo size={32} />
            <span className="nav-name">Events</span>
          </Link>
          <Link href="/auth/registro" className="btn-nav">
            Crear evento
          </Link>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-tag">
            <span className="hero-dot" />
            Invitaciones · Fotos · Recuerdos
          </div>
          <h1>
            Cada evento,
            <br />
            una <em>historia</em>
            <br />
            especial
          </h1>
          <p className="hero-sub">
            Invitaciones digitales, confirmación de asistencia, muro de fotos en
            vivo y libro de recuerdos.
          </p>
          <div className="hero-ctas">
            <Link href="/auth/registro" className="btn-primary">
              Crear gratis
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/auth/login" className="btn-secondary">
              Iniciar sesión
            </Link>
          </div>
        </section>

        {/* STEPS */}
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.n} className="step-wrap">
              <div className="step-item">
                <div className="step-circle">{s.n}</div>
                <span className="step-label">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <div className="features">
          {features.map((f) => (
            <div key={f.title} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cta-block">
          <h2>Empieza hoy, gratis</h2>
          <p>Tu primer evento listo en 5 minutos</p>
          <Link href="/auth/registro" className="btn-cta">
            Crear mi evento
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* TRUST */}
        <div className="trust">
          {[
            "Sin registro para invitados",
            "Funciona en cualquier dispositivo",
            "Fotos en tiempo real",
            "Álbum digital al finalizar",
          ].map((t) => (
            <div key={t} className="trust-item">
              <div className="trust-check">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2 2 4-4"
                    stroke="#3AADA0"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="trust-text">{t}</span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="footer">
          <Link href="/" className="footer-brand">
            <AppLogo size={24} />
            <span className="footer-name">Events</span>
          </Link>
          <span className="footer-copy">© 2026 · Tu evento, tu historia</span>
        </footer>
      </div>
    </>
  );
}

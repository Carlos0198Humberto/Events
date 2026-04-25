"use client";
import { useState, useRef, useEffect } from "react";

// ─── Países (LATAM primero, luego resto) ─────────────────────────────────────

export type CountryCode = {
  code: string;   // "+54"
  iso:  string;   // "AR"
  flag: string;   // "🇦🇷"
  name: string;   // "Argentina"
};

const COUNTRIES: CountryCode[] = [
  // ── LATAM ──
  { code: "+54",  iso: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "+591", iso: "BO", flag: "🇧🇴", name: "Bolivia" },
  { code: "+55",  iso: "BR", flag: "🇧🇷", name: "Brasil" },
  { code: "+56",  iso: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "+57",  iso: "CO", flag: "🇨🇴", name: "Colombia" },
  { code: "+506", iso: "CR", flag: "🇨🇷", name: "Costa Rica" },
  { code: "+53",  iso: "CU", flag: "🇨🇺", name: "Cuba" },
  { code: "+593", iso: "EC", flag: "🇪🇨", name: "Ecuador" },
  { code: "+503", iso: "SV", flag: "🇸🇻", name: "El Salvador" },
  { code: "+502", iso: "GT", flag: "🇬🇹", name: "Guatemala" },
  { code: "+504", iso: "HN", flag: "🇭🇳", name: "Honduras" },
  { code: "+52",  iso: "MX", flag: "🇲🇽", name: "México" },
  { code: "+505", iso: "NI", flag: "🇳🇮", name: "Nicaragua" },
  { code: "+507", iso: "PA", flag: "🇵🇦", name: "Panamá" },
  { code: "+595", iso: "PY", flag: "🇵🇾", name: "Paraguay" },
  { code: "+51",  iso: "PE", flag: "🇵🇪", name: "Perú" },
  { code: "+1787", iso: "PR", flag: "🇵🇷", name: "Puerto Rico" },
  { code: "+1809", iso: "DO", flag: "🇩🇴", name: "Rep. Dominicana" },
  { code: "+598",  iso: "UY", flag: "🇺🇾", name: "Uruguay" },
  { code: "+58",   iso: "VE", flag: "🇻🇪", name: "Venezuela" },
  // ── España y EEUU ──
  { code: "+34", iso: "ES", flag: "🇪🇸", name: "España" },
  { code: "+1",  iso: "US", flag: "🇺🇸", name: "EE.UU." },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  /** Número completo en formato E.164, ej: "+5491112345678" */
  value: string;
  onChange: (fullNumber: string) => void;
  /** ISO del país default, ej: "AR". Default: "AR" */
  defaultCountry?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Separa un número E.164 en {country, local}. */
function parseE164(value: string): { country: CountryCode; local: string } {
  const defaultCountry = COUNTRIES[0]; // Argentina
  if (!value.startsWith("+")) return { country: defaultCountry, local: value };

  // Intenta matches desde el más largo al más corto (evita ambigüedades con +1)
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (value.startsWith(c.code)) {
      return { country: c, local: value.slice(c.code.length) };
    }
  }
  return { country: defaultCountry, local: value };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "AR",
  placeholder,
  className,
  disabled,
}: PhoneInputProps) {
  const { country: parsedCountry, local: parsedLocal } = parseE164(value);
  const initialCountry = COUNTRIES.find((c) => c.iso === defaultCountry) ?? COUNTRIES[0];

  const [country, setCountry] = useState<CountryCode>(
    value ? parsedCountry : initialCountry
  );
  const [local, setLocal] = useState(parsedLocal);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleLocalChange(raw: string) {
    // Solo dígitos, espacios y guiones
    const cleaned = raw.replace(/[^\d\s\-]/g, "");
    setLocal(cleaned);
    const digits = cleaned.replace(/\D/g, "");
    onChange(digits ? `${country.code}${digits}` : "");
  }

  function handleCountrySelect(c: CountryCode) {
    setCountry(c);
    setOpen(false);
    const digits = local.replace(/\D/g, "");
    onChange(digits ? `${c.code}${digits}` : "");
    // Focus en el número después de seleccionar país
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const placeholderText = placeholder ?? getPlaceholder(country.iso);

  return (
    <>
      <style>{`
        .phi-wrap {
          display: flex;
          gap: 0;
          width: 100%;
          position: relative;
        }
        .phi-selector {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 12px;
          background: var(--accent-soft, rgba(79,70,229,0.06));
          border: 2px solid var(--border-input, rgba(79,70,229,0.28));
          border-right: none;
          border-radius: 14px 0 0 14px;
          cursor: pointer;
          white-space: nowrap;
          font-size: 14px;
          font-family: inherit;
          min-width: 72px;
          transition: border-color .22s, background .22s;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
          height: 50px;
        }
        .phi-selector:focus { outline: none; border-color: var(--accent, #4F46E5); }
        .phi-selector:hover { border-color: var(--accent, #4F46E5); }
        .phi-code { font-size: 12px; font-weight: 600; color: var(--text-2, #475569); }
        .phi-chevron { color: var(--text-3, #64748b); font-size: 10px; }
        .phi-number {
          flex: 1;
          border: 2px solid var(--border-input, rgba(79,70,229,0.28));
          border-radius: 0 14px 14px 0;
          padding: 13px 15px;
          font-size: 15px;
          background: var(--accent-soft, rgba(79,70,229,0.06));
          color: var(--text, #0F172A);
          outline: none;
          font-family: inherit;
          -webkit-appearance: none;
          touch-action: manipulation;
          height: 50px;
          transition: border-color .22s, box-shadow .22s, background .22s;
          min-width: 0;
        }
        .phi-number::placeholder { color: var(--text-muted, #94A3B8); }
        .phi-number:focus {
          border-color: var(--accent, #4F46E5);
          box-shadow: 0 0 0 3px rgba(79,70,229,0.11);
          background: white;
        }
        .phi-number:focus ~ .phi-selector,
        .phi-selector:focus {
          border-color: var(--accent, #4F46E5);
        }
        .phi-number:disabled, .phi-selector:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        /* Dropdown */
        .phi-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 200;
          background: white;
          border: 1.5px solid var(--border, #E5E7F0);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(15,23,42,0.14);
          overflow-y: auto;
          max-height: 240px;
          min-width: 220px;
          scrollbar-width: thin;
          animation: phiDrop .18s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes phiDrop {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)   scale(1); }
        }
        .phi-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: background .15s;
          -webkit-tap-highlight-color: transparent;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .phi-option:hover, .phi-option[data-selected="true"] {
          background: var(--accent-light, #EEF2FF);
        }
        .phi-option-code { color: var(--text-3, #64748b); font-size: 11px; font-weight: 600; min-width: 36px; }
        .phi-option-name { color: var(--text, #0F172A); flex: 1; }
        .phi-hint {
          font-size: 11px;
          color: var(--text-3, #64748b);
          margin-top: 5px;
          padding-left: 2px;
        }
      `}</style>

      <div className={`phi-wrap ${className ?? ""}`} ref={dropdownRef}>
        {/* Selector de país */}
        <button
          type="button"
          className="phi-selector"
          onClick={() => setOpen((v) => !v)}
          aria-label={`País: ${country.name}`}
          aria-expanded={open}
          disabled={disabled}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{country.flag}</span>
          <span className="phi-code">{country.code}</span>
          <span className="phi-chevron">{open ? "▲" : "▼"}</span>
        </button>

        {/* Input de número local */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          className="phi-number"
          value={local}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder={placeholderText}
          autoComplete="tel-national"
          disabled={disabled}
        />

        {/* Dropdown de países */}
        {open && (
          <div className="phi-dropdown" role="listbox" aria-label="Seleccionar país">
            {COUNTRIES.map((c) => (
              <button
                key={c.iso}
                type="button"
                className="phi-option"
                role="option"
                data-selected={c.iso === country.iso ? "true" : undefined}
                onClick={() => handleCountrySelect(c)}
              >
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span className="phi-option-name">{c.name}</span>
                <span className="phi-option-code">{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      {local && (
        <p className="phi-hint">
          Se enviará como: {country.code}{local.replace(/\D/g, "")}
        </p>
      )}
    </>
  );
}

// ─── Placeholder por país ─────────────────────────────────────────────────────

function getPlaceholder(iso: string): string {
  const map: Record<string, string> = {
    AR: "11 1234-5678",
    BO: "7123 4567",
    BR: "11 9 1234-5678",
    CL: "9 1234 5678",
    CO: "310 123 4567",
    CR: "8312 3456",
    CU: "5 123 4567",
    EC: "99 123 4567",
    SV: "7123 4567",
    GT: "5123 4567",
    HN: "9123 4567",
    MX: "55 1234 5678",
    NI: "8123 4567",
    PA: "6123 4567",
    PY: "981 123 456",
    PE: "912 345 678",
    PR: "787 123 4567",
    DO: "809 123 4567",
    UY: "94 123 456",
    VE: "412 123 4567",
    ES: "612 34 56 78",
    US: "555 123 4567",
  };
  return map[iso] ?? "Número de teléfono";
}

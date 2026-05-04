import { Info, X } from "lucide-react";

function parseCurrencyInput(value) {
  const cleanValue = String(value ?? "").replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!cleanValue) return "";
  const [intPart = "", ...decimalParts] = cleanValue.split(".");
  const normalizedInt = intPart.replace(/^0+(?=\d)/, "") || "0";
  const withCommas = normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!decimalParts.length) return withCommas;
  return `${withCommas}.${decimalParts.join("").slice(0, 2)}`;
}

function toNumericCurrencyValue(value) {
  const numericValue = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

// ── CHIP ────────────────────────────────────────────────────
export function Chip({ tone = "gray", children, icon: Icon }) {
  return (
    <span className={`chip chip-${tone}`}>
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

// ── METRIC CARD ──────────────────────────────────────────────
export function MetricCard({ label, value, sub, tone = "default", icon: Icon }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-label">
        {label}
        {Icon && <Icon size={15} strokeWidth={2} />}
      </div>
      <div className="metric-value num">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

// ── PAGE HEADER ──────────────────────────────────────────────

export function PageHeader({ title, subtitle, actions, helper }) {
  return (
    <div className="page-header">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {helper && (
        <div className="page-helper">
          <Info size={15} style={{ color: "var(--teal)", marginTop: 2, flexShrink: 0 }} />
          <span>{helper}</span>
        </div>
      )}
    </div>
  );
}

// ── EMPTY STATE ──────────────────────────────────────────────
export function EmptyState({ title, body, action }) {
  return (
    <div className="card empty-state">
      <div className="empty-state-title">{title}</div>
      <p className="empty-state-body">{body}</p>
      {action}
    </div>
  );
}

// ── MODAL ────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, footer, wide }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button type="button" className="btn-ghost" style={{ padding: 6 }} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── FIELD ────────────────────────────────────────────────────
export function Field({ label, helper, children, col2 }) {
  return (
    <div className="field" style={col2 ? { gridColumn: "span 2" } : undefined}>
      {label && <label className="field-label">{label}</label>}
      {children}
      {helper && <p className="field-helper">{helper}</p>}
    </div>
  );
}

// ── CONFIRM BAR ──────────────────────────────────────────────
export function ConfirmBar({ onCancel, onSave, saveLabel = "Save", loading }) {
  return (
    <>
      <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      <button type="button" className="btn-primary" onClick={onSave} disabled={loading}>
        {loading ? "Saving…" : saveLabel}
      </button>
    </>
  );
}

// ── DISCLAIMER ───────────────────────────────────────────────
export function Disclaimer({ text }) {
  return (
    <div className="disclaimer-box">
      <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
      <span>{text}</span>
    </div>
  );
}

export function CurrencyInput({ value, onChange, placeholder = "0", min = 0, ...props }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={parseCurrencyInput(value)}
      onChange={(event) => onChange(toNumericCurrencyValue(event.target.value))}
      onBlur={(event) => {
        if (!event.target.value) onChange(0);
      }}
      min={min}
      {...props}
    />
  );
}

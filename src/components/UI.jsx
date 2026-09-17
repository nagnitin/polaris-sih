/*
  Small shared building blocks so every page speaks the same visual
  language as the Mission Control dashboard.
*/

import { STATUS } from "../data/assets";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  children,
}) {
  return (
    <header className="page-head">
      <div className="page-head-title">
        {Icon && (
          <div className="page-head-icon">
            <Icon size={22} />
          </div>
        )}

        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {children && <div className="page-head-actions">{children}</div>}
    </header>
  );
}

export function Panel({
  tone = "dark",
  title,
  subtitle,
  actions,
  className = "",
  children,
}) {
  return (
    <section className={`panel tone-${tone} ${className}`}>
      {(title || actions) && (
        <div className="panel-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>

          {actions && <div className="panel-actions">{actions}</div>}
        </div>
      )}

      {children}
    </section>
  );
}

export function StatusPill({ status, children }) {
  const meta = STATUS[status] || STATUS.offline;

  return (
    <span className="status-pill" style={{ background: meta.color }}>
      {children || meta.label}
    </span>
  );
}

export function StatusDot({ status }) {
  const meta = STATUS[status] || STATUS.offline;

  return (
    <i
      className="status-dot"
      style={{ background: meta.color }}
      title={meta.label}
    />
  );
}

export function Metric({ label, value, unit, hint, tone }) {
  return (
    <div className={`metric-tile ${tone ? `tone-${tone}` : ""}`}>
      <span className="metric-label">{label}</span>

      <strong className="metric-value">
        {value}
        {unit && <em>{unit}</em>}
      </strong>

      {hint && <small className="metric-hint">{hint}</small>}
    </div>
  );
}

export function Bar({ value, max = 100, tone = "green" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="bar-track">
      <div className={`bar-fill bar-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SimBadge({ label = "SIMULATED TELEMETRY" }) {
  return <span className="sim-badge">{label}</span>;
}

export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={26} />}
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  );
}

import { useEffect, type ReactNode } from 'react';
import type { ClientStatus } from '../types';
import { STATUS_META } from '../lib/constants';
import type { Urgency } from '../lib/sorting';

export function StatusBadge({ status }: { status: ClientStatus }) {
  const meta = STATUS_META[status];
  return <span className={`badge tone-${meta.tone}`}>{meta.label}</span>;
}

export function UrgencyDot({ urgency }: { urgency: Urgency }) {
  return <span className={`dot urgency-${urgency}`} aria-hidden />;
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return (
    <span className="avatar" style={{ ['--hue' as string]: hue }}>
      {initials || '?'}
    </span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function formatMoney(n: number | null): string {
  if (n == null) return '';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function budgetLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return '';
  if (min != null && max != null) return `${formatMoney(min)} – ${formatMoney(max)}`;
  return min != null ? `${formatMoney(min)} 이상` : `${formatMoney(max)} 이하`;
}

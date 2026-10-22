import type { Client } from '../types';
import { TYPE_LABEL } from '../lib/constants';
import { formatDate, relativeLabel, todayISO } from '../lib/dates';
import { urgencyOf } from '../lib/sorting';
import { Avatar, StatusBadge, UrgencyDot, budgetLabel } from './ui';

export function ClientList({
  clients,
  selectedId,
  onSelect,
}: {
  clients: Client[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const today = todayISO();

  if (clients.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">🏡</div>
        <p>조건에 맞는 손님이 없어요.</p>
      </div>
    );
  }

  return (
    <div className="list" role="list">
      <div className="list-head" aria-hidden>
        <span>손님</span>
        <span>상태</span>
        <span>다음 컨택</span>
        <span>마지막 컨택</span>
        <span>구매 예정일</span>
      </div>
      {clients.map((c) => {
        const urgency = urgencyOf(c, today);
        const lastNote = c.interactions[0]?.summary;
        return (
          <button
            key={c.id}
            role="listitem"
            className={`row ${selectedId === c.id ? 'selected' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="cell-name">
              <Avatar name={c.name} />
              <div className="name-block">
                <div className="name">
                  {c.name}
                  <span className="type">{TYPE_LABEL[c.type]}</span>
                </div>
                <div className="sub">
                  {[c.areas, budgetLabel(c.budgetMin, c.budgetMax)].filter(Boolean).join(' · ') ||
                    c.phone ||
                    c.email ||
                    ' '}
                </div>
                {lastNote && <div className="snippet">{lastNote}</div>}
              </div>
            </div>
            <div className="cell">
              <StatusBadge status={c.status} />
            </div>
            <div className={`cell date urgency-text-${urgency}`} title={formatDate(c.nextContactDate)}>
              <span className="m-label">다음</span>
              <UrgencyDot urgency={urgency} />
              {c.nextContactDate ? relativeLabel(c.nextContactDate, today) : '미정'}
            </div>
            <div className="cell date muted" title={formatDate(c.lastContactDate)}>
              <span className="m-label">마지막</span>
              {c.lastContactDate ? relativeLabel(c.lastContactDate, today) : '없음'}
            </div>
            <div className="cell date muted" title={formatDate(c.targetPurchaseDate)}>
              <span className="m-label">구매</span>
              {c.targetPurchaseDate ? formatDate(c.targetPurchaseDate) : '—'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

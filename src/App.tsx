import { useMemo, useRef, useState } from 'react';
import type { Client, ClientStatus } from './types';
import { useClients } from './data/useClients';
import { STATUS_META, STATUS_ORDER } from './lib/constants';
import { daysBetween, todayISO } from './lib/dates';
import { SORT_LABEL, isActive, sortClients, urgencyOf, type SortKey } from './lib/sorting';
import { ClientList } from './components/ClientList';
import { ClientDetail } from './components/ClientDetail';
import { ClientForm } from './components/ClientForm';

type Filter = 'open' | 'all' | ClientStatus;
type Focus = 'none' | 'overdue' | 'today' | 'week' | 'closing';

export default function App() {
  const store = useClients();
  const { clients } = store;
  const today = todayISO();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [focus, setFocus] = useState<Focus>('none');
  const [sortKey, setSortKey] = useState<SortKey>('smart');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formFor, setFormFor] = useState<Client | 'new' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const active = clients.filter(isActive);
    const closingSoon = (c: Client) => {
      if (!c.targetPurchaseDate) return false;
      const d = daysBetween(today, c.targetPurchaseDate);
      return d >= 0 && d <= 30;
    };
    return {
      overdue: active.filter((c) => urgencyOf(c, today) === 'overdue').length,
      today: active.filter((c) => urgencyOf(c, today) === 'today').length,
      week: active.filter((c) => urgencyOf(c, today) === 'soon').length,
      closing: active.filter(closingSoon).length,
      closingSoon,
    };
  }, [clients, today]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = clients.filter((c) => {
      if (filter === 'open' && !isActive(c)) return false;
      if (filter !== 'open' && filter !== 'all' && c.status !== filter) return false;
      if (focus !== 'none') {
        if (!isActive(c)) return false;
        const u = urgencyOf(c, today);
        if (focus === 'overdue' && u !== 'overdue') return false;
        if (focus === 'today' && u !== 'today') return false;
        if (focus === 'week' && u !== 'soon') return false;
        if (focus === 'closing' && !stats.closingSoon(c)) return false;
      }
      if (!q) return true;
      return [c.name, c.phone, c.email, c.areas, c.notes, c.source, ...c.interactions.map((i) => i.summary)]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    return sortClients(filtered, sortKey, today);
  }, [clients, query, filter, focus, sortKey, today, stats]);

  const counts = useMemo(() => {
    const m = new Map<Filter, number>([
      ['open', clients.filter(isActive).length],
      ['all', clients.length],
    ]);
    for (const s of STATUS_ORDER) m.set(s, clients.filter((c) => c.status === s).length);
    return m;
  }, [clients]);

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(clients, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtor-crm-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data)) throw new Error('not an array');
      if (confirm(`${data.length}명의 손님 데이터로 교체할까요? 현재 데이터는 덮어써집니다.`)) {
        store.replaceAll(data as Client[]);
        setSelectedId(null);
      }
    } catch {
      alert('백업 파일을 읽을 수 없어요.');
    }
  };

  const toggleFocus = (f: Focus) => setFocus((cur) => (cur === f ? 'none' : f));

  return (
    <div className={`app ${selected ? 'has-detail' : ''}`}>
      <main className="main">
        <header className="topbar">
          <div className="brand">
            <span className="logo">🏡</span>
            <div>
              <h1>My Clients</h1>
              <p className="muted small">{new Date().toLocaleDateString('ko-KR', { dateStyle: 'full' })}</p>
            </div>
          </div>
          <div className="top-actions">
            <details className="menu">
              <summary className="icon-btn" aria-label="메뉴">
                ⋯
              </summary>
              <div className="menu-pop">
                <button onClick={exportData}>백업 내보내기 (JSON)</button>
                <button onClick={() => fileInput.current?.click()}>백업 불러오기</button>
              </div>
            </details>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = '';
              }}
            />
            <button className="btn primary" onClick={() => setFormFor('new')}>
              + 새 손님
            </button>
          </div>
        </header>

        <section className="stats">
          <StatCard label="연락 지연" value={stats.overdue} tone="red" active={focus === 'overdue'} onClick={() => toggleFocus('overdue')} />
          <StatCard label="오늘 연락" value={stats.today} tone="blue" active={focus === 'today'} onClick={() => toggleFocus('today')} />
          <StatCard label="이번 주" value={stats.week} tone="teal" active={focus === 'week'} onClick={() => toggleFocus('week')} />
          <StatCard label="30일 내 구매 예정" value={stats.closing} tone="purple" active={focus === 'closing'} onClick={() => toggleFocus('closing')} />
        </section>

        <section className="toolbar">
          <div className="search">
            <span aria-hidden>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름, 전화번호, 지역, 대화 내용 검색"
            />
          </div>
          <label className="sort">
            <span className="muted small">정렬</span>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </section>

        <nav className="filters" aria-label="상태 필터">
          {(['open', 'all', ...STATUS_ORDER] as Filter[]).map((f) => (
            <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
              {f === 'open' ? '진행 중 전체' : f === 'all' ? '모두' : STATUS_META[f].label}
              <span className="count">{counts.get(f) ?? 0}</span>
            </button>
          ))}
        </nav>

        {focus !== 'none' && (
          <div className="focus-bar">
            필터 적용됨 ·{' '}
            <button className="link" onClick={() => setFocus('none')}>
              해제
            </button>
          </div>
        )}

        {store.loaded && <ClientList clients={visible} selectedId={selectedId} onSelect={setSelectedId} />}
      </main>

      {selected && (
        <ClientDetail
          client={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => setFormFor(selected)}
          onDelete={() => {
            store.deleteClient(selected.id);
            setSelectedId(null);
          }}
          onUpdate={(patch) => store.updateClient(selected.id, patch)}
          onAddInteraction={(input) => store.addInteraction(selected.id, input)}
          onDeleteInteraction={(iid) => store.deleteInteraction(selected.id, iid)}
        />
      )}

      {formFor && (
        <ClientForm
          client={formFor === 'new' ? undefined : formFor}
          onClose={() => setFormFor(null)}
          onSave={(draft) => {
            if (formFor === 'new') {
              const c = store.addClient(draft);
              setSelectedId(c.id);
            } else {
              store.updateClient(formFor.id, draft);
            }
            setFormFor(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`stat tone-${tone} ${active ? 'on' : ''}`} onClick={onClick} aria-pressed={active}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </button>
  );
}

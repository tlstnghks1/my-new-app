import { useState, type FormEvent } from 'react';
import type { Client, ClientDraft, ClientStatus, ClientType } from '../types';
import { STATUS_META, STATUS_ORDER, TYPE_LABEL } from '../lib/constants';
import { addDays, todayISO } from '../lib/dates';
import { Field, Modal } from './ui';

const EMPTY: ClientDraft = {
  name: '',
  phone: '',
  email: '',
  type: 'buyer',
  status: 'new',
  source: '',
  budgetMin: null,
  budgetMax: null,
  areas: '',
  lastContactDate: null,
  nextContactDate: null,
  targetPurchaseDate: null,
  notes: '',
};

function toDraft(c: Client): ClientDraft {
  const { id: _id, interactions: _i, createdAt: _c, updatedAt: _u, ...draft } = c;
  return draft;
}

const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(/[^\d.]/g, '')) || null);
const date = (v: string) => v || null;

export function ClientForm({
  client,
  onSave,
  onClose,
}: {
  client?: Client;
  onSave: (draft: ClientDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<ClientDraft>(() =>
    client ? toDraft(client) : { ...EMPTY, nextContactDate: addDays(todayISO(), 1) },
  );
  const set = <K extends keyof ClientDraft>(k: K, v: ClientDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!d.name.trim()) return;
    onSave({ ...d, name: d.name.trim() });
  };

  return (
    <Modal
      title={client ? '손님 정보 수정' : '새 손님 추가'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            취소
          </button>
          <button type="submit" form="client-form" className="btn primary" disabled={!d.name.trim()}>
            저장
          </button>
        </>
      }
    >
      <form id="client-form" className="form-grid" onSubmit={submit}>
        <Field label="이름 *">
          <input autoFocus value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="홍길동" />
        </Field>
        <Field label="구분">
          <select value={d.type} onChange={(e) => set('type', e.target.value as ClientType)}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="전화번호">
          <input type="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="이메일">
          <input type="email" value={d.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="상태">
          <select value={d.status} onChange={(e) => set('status', e.target.value as ClientStatus)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="유입 경로">
          <input value={d.source} onChange={(e) => set('source', e.target.value)} placeholder="지인 소개, Zillow…" />
        </Field>
        <Field label="예산 (최소)">
          <input
            inputMode="numeric"
            value={d.budgetMin ?? ''}
            onChange={(e) => set('budgetMin', num(e.target.value))}
            placeholder="500000"
          />
        </Field>
        <Field label="예산 (최대)">
          <input
            inputMode="numeric"
            value={d.budgetMax ?? ''}
            onChange={(e) => set('budgetMax', num(e.target.value))}
            placeholder="800000"
          />
        </Field>
        <Field label="희망 지역">
          <input value={d.areas} onChange={(e) => set('areas', e.target.value)} placeholder="Irvine, Tustin" />
        </Field>
        <Field label="구매 예정일">
          <input
            type="date"
            value={d.targetPurchaseDate ?? ''}
            onChange={(e) => set('targetPurchaseDate', date(e.target.value))}
          />
        </Field>
        <Field label="마지막 컨택">
          <input
            type="date"
            value={d.lastContactDate ?? ''}
            onChange={(e) => set('lastContactDate', date(e.target.value))}
          />
        </Field>
        <Field label="다음 컨택 예정">
          <input
            type="date"
            value={d.nextContactDate ?? ''}
            onChange={(e) => set('nextContactDate', date(e.target.value))}
          />
        </Field>
        <div className="span-2">
          <Field label="메모 (선호 조건, 가족 사항 등)">
            <textarea rows={3} value={d.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

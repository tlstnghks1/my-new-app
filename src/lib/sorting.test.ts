import { describe, expect, it } from 'vitest';
import type { Client } from '../types';
import { priorityScore, sortClients, urgencyOf } from './sorting';

const today = '2026-10-22';

function client(over: Partial<Client>): Client {
  return {
    id: over.name ?? 'x',
    name: 'x',
    phone: '',
    email: '',
    type: 'buyer',
    status: 'active',
    source: '',
    budgetMin: null,
    budgetMax: null,
    areas: '',
    lastContactDate: '2026-10-15',
    nextContactDate: null,
    targetPurchaseDate: null,
    notes: '',
    interactions: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('urgencyOf', () => {
  it('classifies next contact dates', () => {
    expect(urgencyOf(client({ nextContactDate: '2026-10-20' }), today)).toBe('overdue');
    expect(urgencyOf(client({ nextContactDate: today }), today)).toBe('today');
    expect(urgencyOf(client({ nextContactDate: '2026-10-27' }), today)).toBe('soon');
    expect(urgencyOf(client({ nextContactDate: '2026-12-01' }), today)).toBe('later');
    expect(urgencyOf(client({}), today)).toBe('none');
  });
});

describe('sortClients smart', () => {
  it('puts overdue first, then today, then upcoming, closed last', () => {
    const list = [
      client({ name: 'later', nextContactDate: '2026-11-30' }),
      client({ name: 'closed', status: 'closed', nextContactDate: '2026-10-01' }),
      client({ name: 'today', nextContactDate: today }),
      client({ name: 'overdue', nextContactDate: '2026-10-19' }),
      client({ name: 'tomorrow', nextContactDate: '2026-10-23' }),
    ];
    expect(sortClients(list, 'smart', today).map((c) => c.name)).toEqual([
      'overdue',
      'today',
      'tomorrow',
      'later',
      'closed',
    ]);
  });

  it('boosts hot clients and near purchase dates', () => {
    const plain = client({ name: 'a', nextContactDate: '2026-10-25' });
    const hot = client({ name: 'b', status: 'hot', nextContactDate: '2026-10-25', targetPurchaseDate: '2026-11-10' });
    expect(priorityScore(hot, today)).toBeGreaterThan(priorityScore(plain, today));
  });
});

describe('sortClients by date', () => {
  it('sorts ascending with empty dates last', () => {
    const list = [
      client({ name: 'none' }),
      client({ name: 'b', nextContactDate: '2026-11-01' }),
      client({ name: 'a', nextContactDate: '2026-10-01' }),
    ];
    expect(sortClients(list, 'nextContact', today).map((c) => c.name)).toEqual(['a', 'b', 'none']);
  });
});

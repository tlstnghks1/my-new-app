import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Client, ClientDraft, Interaction } from '../types';
import { LocalStorageRepository, newId, type ClientRepository } from './repository';
import { sampleClients } from './sample';

export interface NewInteraction {
  date: string;
  channel: Interaction['channel'];
  summary: string;
  /** Optionally reschedule the next contact at the same time. */
  nextContactDate?: string | null;
}

function latest(a: string | null, b: string): string {
  return !a || b > a ? b : a;
}

function sortInteractions(list: Interaction[]): Interaction[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

const defaultRepo = new LocalStorageRepository();

export function useClients(repo: ClientRepository = defaultRepo) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const firstRun = !LocalStorageRepository.hasData();
    repo.load().then((data) => {
      setClients(firstRun && data.length === 0 ? sampleClients() : data);
      setLoaded(true);
    });
  }, [repo]);

  useEffect(() => {
    if (loaded) repo.saveAll(clients);
  }, [clients, loaded, repo]);

  const touch = (c: Client): Client => ({ ...c, updatedAt: new Date().toISOString() });

  const addClient = useCallback((draft: ClientDraft): Client => {
    const now = new Date().toISOString();
    const client: Client = { ...draft, id: newId(), interactions: [], createdAt: now, updatedAt: now };
    setClients((prev) => [client, ...prev]);
    return client;
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? touch({ ...c, ...patch }) : c)));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addInteraction = useCallback((clientId: string, input: NewInteraction) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const interaction: Interaction = {
          id: newId(),
          date: input.date,
          channel: input.channel,
          summary: input.summary.trim(),
          createdAt: new Date().toISOString(),
        };
        return touch({
          ...c,
          interactions: sortInteractions([interaction, ...c.interactions]),
          lastContactDate: latest(c.lastContactDate, input.date),
          nextContactDate: input.nextContactDate !== undefined ? input.nextContactDate : c.nextContactDate,
          // A first conversation moves a brand-new lead into the pipeline.
          status: c.status === 'new' ? 'active' : c.status,
        });
      }),
    );
  }, []);

  const deleteInteraction = useCallback((clientId: string, interactionId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const removed = c.interactions.find((i) => i.id === interactionId);
        const interactions = c.interactions.filter((i) => i.id !== interactionId);
        // If that conversation was what set the last contact date, fall back to the newest remaining one.
        const lastContactDate =
          removed && removed.date === c.lastContactDate && !interactions.some((i) => i.date === removed.date)
            ? (interactions[0]?.date ?? null)
            : c.lastContactDate;
        return touch({ ...c, interactions, lastContactDate });
      }),
    );
  }, []);

  const replaceAll = useCallback((next: Client[]) => setClients(next), []);

  return useMemo(
    () => ({
      clients,
      loaded,
      addClient,
      updateClient,
      deleteClient,
      addInteraction,
      deleteInteraction,
      replaceAll,
    }),
    [clients, loaded, addClient, updateClient, deleteClient, addInteraction, deleteInteraction, replaceAll],
  );
}

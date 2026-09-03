import { getAllPending, updateSurveyStatus } from './db';

export const API_URL = 'https://vku-field-survey-api.example.workers.dev/api/surveys';
export async function processSyncQueue(onChange?: () => void) {
  for (const record of await getAllPending()) {
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await updateSurveyStatus(record.uuid, 'SYNCED');
      onChange?.();
    } catch (error) { console.warn('Sync failed; record remains pending', error); }
  }
}
export async function initSyncListeners(registration: ServiceWorkerRegistration | null, onChange?: () => void) {
  window.ononline = () => { void processSyncQueue(onChange); };
  if (registration && 'sync' in registration) {
    try { await (registration as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register('sync-surveys'); }
    catch (error) { console.warn('Background Sync unavailable', error); }
  }
  if (navigator.onLine) void processSyncQueue(onChange);
}
import type { Patient } from '../types';
import { broadcastDataSync } from './dataSync';

const PATIENT_QUEUE_EVENT = 'patient-queue-updated';
const PATIENT_QUEUE_STORAGE_KEY = 'patient-queue-updated';

export type PatientQueueUpdateDetail = {
  action?: 'enqueue' | 'dequeue' | 'refresh';
  patientId?: string;
  patient?: Patient;
  source?: string;
  timestamp: number;
};

function buildDetail(detail?: Omit<PatientQueueUpdateDetail, 'timestamp'>): PatientQueueUpdateDetail {
  return {
    ...detail,
    timestamp: Date.now(),
  };
}

export function broadcastPatientQueueUpdate(detail?: Omit<PatientQueueUpdateDetail, 'timestamp'>) {
  if (typeof window === 'undefined') return;

  const payload = buildDetail(detail);
  window.dispatchEvent(new CustomEvent<PatientQueueUpdateDetail>(PATIENT_QUEUE_EVENT, { detail: payload }));

  try {
    window.localStorage.setItem(PATIENT_QUEUE_STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.removeItem(PATIENT_QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error('Gagal broadcast sinkronisasi antrian pasien:', error);
  }

  broadcastDataSync({
    resources: ['patients', 'examinations', 'dashboard', 'reports'],
    source: payload.source,
    endpoint: payload.patientId ? `/patients/${payload.patientId}` : '/patients',
    method: 'SYNC',
  });
}

export function subscribePatientQueueUpdate(callback: (detail: PatientQueueUpdateDetail) => void) {
  if (typeof window === 'undefined') return () => undefined;

  const handleQueueUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<PatientQueueUpdateDetail>;
    callback(customEvent.detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== PATIENT_QUEUE_STORAGE_KEY || !event.newValue) return;

    try {
      callback(JSON.parse(event.newValue) as PatientQueueUpdateDetail);
    } catch (error) {
      console.error('Gagal membaca sinkronisasi antrian pasien:', error);
    }
  };

  window.addEventListener(PATIENT_QUEUE_EVENT, handleQueueUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(PATIENT_QUEUE_EVENT, handleQueueUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}

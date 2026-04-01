const PATIENT_QUEUE_EVENT = 'patient-queue-updated';
const PATIENT_QUEUE_STORAGE_KEY = 'patient-queue-updated';

type PatientQueueUpdateDetail = {
  patientId?: string;
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
  window.dispatchEvent(new CustomEvent(PATIENT_QUEUE_EVENT, { detail: payload }));

  try {
    window.localStorage.setItem(PATIENT_QUEUE_STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.removeItem(PATIENT_QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error('Gagal broadcast sinkronisasi antrian pasien:', error);
  }
}

export function subscribePatientQueueUpdate(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const handleQueueUpdate = () => {
    callback();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== PATIENT_QUEUE_STORAGE_KEY || !event.newValue) return;
    callback();
  };

  window.addEventListener(PATIENT_QUEUE_EVENT, handleQueueUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(PATIENT_QUEUE_EVENT, handleQueueUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}

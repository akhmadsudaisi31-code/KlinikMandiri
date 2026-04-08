export type SyncResource =
  | 'patients'
  | 'examinations'
  | 'medicines'
  | 'notifications'
  | 'visits'
  | 'admin-clinics'
  | 'dashboard'
  | 'reports'
  | 'auth';

type DataSyncDetail = {
  resources: SyncResource[];
  endpoint?: string;
  method?: string;
  source?: string;
  timestamp: number;
};

const DATA_SYNC_EVENT = 'app-data-sync';
const DATA_SYNC_STORAGE_KEY = 'app-data-sync';

function buildDetail(detail: Omit<DataSyncDetail, 'timestamp'>): DataSyncDetail {
  return {
    ...detail,
    timestamp: Date.now(),
  };
}

function hasIntersection(left: SyncResource[], right: SyncResource[]) {
  return left.some((resource) => right.includes(resource));
}

export function broadcastDataSync(detail: Omit<DataSyncDetail, 'timestamp'>) {
  if (typeof window === 'undefined') return;

  const payload = buildDetail(detail);
  window.dispatchEvent(new CustomEvent<DataSyncDetail>(DATA_SYNC_EVENT, { detail: payload }));

  try {
    window.localStorage.setItem(DATA_SYNC_STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.removeItem(DATA_SYNC_STORAGE_KEY);
  } catch (error) {
    console.error('Gagal broadcast sinkronisasi data:', error);
  }
}

export function subscribeDataSync(
  resources: SyncResource[],
  callback: (detail: DataSyncDetail) => void,
) {
  if (typeof window === 'undefined') return () => undefined;

  const handlePayload = (detail: DataSyncDetail | null) => {
    if (!detail) return;
    if (resources.length > 0 && !hasIntersection(resources, detail.resources)) return;
    callback(detail);
  };

  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<DataSyncDetail>;
    handlePayload(customEvent.detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== DATA_SYNC_STORAGE_KEY || !event.newValue) return;

    try {
      handlePayload(JSON.parse(event.newValue) as DataSyncDetail);
    } catch (error) {
      console.error('Gagal membaca payload sinkronisasi data:', error);
    }
  };

  window.addEventListener(DATA_SYNC_EVENT, handleEvent);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(DATA_SYNC_EVENT, handleEvent);
    window.removeEventListener('storage', handleStorage);
  };
}

export function inferSyncResources(endpoint: string): SyncResource[] {
  const normalizedEndpoint = endpoint.split('?')[0];

  if (normalizedEndpoint.startsWith('/notifications')) {
    return ['notifications'];
  }

  if (normalizedEndpoint.startsWith('/patients')) {
    return ['patients', 'dashboard', 'reports'];
  }

  if (normalizedEndpoint.startsWith('/visits')) {
    return ['visits', 'patients', 'reports'];
  }

  if (normalizedEndpoint.startsWith('/examinations')) {
    return ['examinations', 'patients', 'dashboard', 'reports'];
  }

  if (normalizedEndpoint.startsWith('/medicines')) {
    return ['medicines', 'dashboard'];
  }

  if (normalizedEndpoint.startsWith('/admin/system/reset')) {
    return ['admin-clinics', 'patients', 'examinations', 'medicines', 'visits', 'notifications', 'dashboard', 'reports'];
  }

  if (normalizedEndpoint.startsWith('/admin/clinics') || normalizedEndpoint.startsWith('/admin/')) {
    return ['admin-clinics'];
  }

  if (normalizedEndpoint.startsWith('/auth')) {
    return ['auth'];
  }

  return [];
}

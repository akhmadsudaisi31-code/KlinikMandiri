import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export interface EnabledFeatures {
    anc: boolean;
    kb: boolean;
    immunization: boolean;
    dental: boolean;
    lab: boolean;
    reports: boolean;
    [key: string]: boolean;
}

/**
 * Hook to manage and check feature availability for the current clinic.
 * Features are fetched from the clinic settings controlled by Super Admin.
 */
export function useFeatures() {
    const { user } = useAuth();

    const { data: features, isLoading } = useQuery<EnabledFeatures>({
        queryKey: ['clinic-features', user?.uid],
        queryFn: async () => {
            if (!user || user.isAdmin === 1) return {} as EnabledFeatures;
            try {
                // We fetch from the public settings endpoint which returns enabledFeatures
                const data: any = await api.get('/settings');
                return data.enabledFeatures || {};
            } catch (e) {
                console.error("Failed to fetch features:", e);
                return {} as EnabledFeatures;
            }
        },
        enabled: !!user && user.isAdmin !== 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    /**
     * Check if a specific feature is enabled.
     * Super Admins always have access to all system features (for preview/impersonation purposes).
     */
    const isFeatureEnabled = (featureKey: keyof EnabledFeatures | string): boolean => {
        if (user?.isAdmin === 1) return true;
        if (!features) return false;
        return !!features[featureKey];
    };

    return {
        features,
        isLoading,
        isFeatureEnabled
    };
}

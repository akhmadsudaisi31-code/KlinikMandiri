import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * Formats an ISO date string to Western Indonesia Time (WIB) with format: dd MMM yyyy HH:mm
 */
export function formatToWIB(dateStr?: string) {
    if (!dateStr) return '-';
    try {
        // SQLite CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" (UTC).
        // Browser new Date() might interpret this as local time.
        // We append 'Z' to force UTC interpretation if no timezone is present.
        let normalizedDate = dateStr;
        if (dateStr.includes(' ') && !dateStr.includes('Z') && !dateStr.includes('+')) {
            normalizedDate = dateStr.replace(' ', 'T') + 'Z';
        } else if (dateStr.length === 10 && !dateStr.includes('T')) {
            // YYYY-MM-DD -> keep as is (local date start)
        } else if (!dateStr.includes('Z') && !dateStr.includes('+') && dateStr.includes('T')) {
            normalizedDate = dateStr + 'Z';
        }

        const date = new Date(normalizedDate);
        return new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    } catch {
        return '-';
    }
}

/**
 * Formats an ISO date string to Western Indonesia Time (WIB) with custom date-fns format
 */
export function formatWibSafe(dateStr: string | undefined, formatStr: string = 'dd/MM/yyyy HH:mm') {
    if (!dateStr) return '-';
    try {
        let normalizedDate = dateStr;
        if (dateStr.includes(' ') && !dateStr.includes('Z') && !dateStr.includes('+')) {
            normalizedDate = dateStr.replace(' ', 'T') + 'Z';
        } else if (dateStr.length === 10 && !dateStr.includes('T')) {
             // pass
        } else if (!dateStr.includes('Z') && !dateStr.includes('+') && dateStr.includes('T')) {
            normalizedDate = dateStr + 'Z';
        }

        const date = new Date(normalizedDate);
        // Explicitly set to Asia/Jakarta for consistency
        const jakartaTimeStr = date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
        const jakartaTime = new Date(jakartaTimeStr);
        return format(jakartaTime, formatStr, { locale: localeId });
    } catch {
        return '-';
    }
}

/**
 * Gets the current date string (YYYY-MM-DD) strictly locked to WIB Timezone (Asia/Jakarta),
 * circumventing local browser timezone shifts.
 */
export function getWibCurrentDateString(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

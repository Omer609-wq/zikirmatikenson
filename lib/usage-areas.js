/**
 * Uygulama içi süre alanları (Samsung Digital Wellbeing benzeri rapor).
 * settings / premium toplama dahil; top-3 listesinde gösterilmez.
 */

export const USAGE_AREA_HOME = 'home';
export const USAGE_AREA_QURAN = 'quran';
export const USAGE_AREA_LIB_DUA = 'lib:dua';
export const USAGE_AREA_LIB_ZIKIR = 'lib:zikir';
export const USAGE_AREA_SETTINGS = 'settings';
export const USAGE_AREA_PREMIUM = 'premium';
export const USAGE_AREA_OTHER = 'other';

const HIDDEN_TOP_AREAS = new Set([USAGE_AREA_SETTINGS, USAGE_AREA_PREMIUM, USAGE_AREA_OTHER, USAGE_AREA_HOME]);

const FOLDER_PREFIX = 'folder:';

export function folderUsageAreaId(folderId) {
    const id = String(folderId || '').trim();
    return id ? `${FOLDER_PREFIX}${id}` : USAGE_AREA_HOME;
}

export function isFolderUsageArea(areaId) {
    return String(areaId || '').startsWith(FOLDER_PREFIX);
}

export function folderIdFromUsageArea(areaId) {
    if (!isFolderUsageArea(areaId)) return null;
    return String(areaId).slice(FOLDER_PREFIX.length);
}

export function isUsageAreaHiddenFromTopList(areaId) {
    return HIDDEN_TOP_AREAS.has(areaId);
}

export function sanitizeUsageAreasByDay(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = Object.create(null);
    Object.keys(src)
        .slice(0, 4000)
        .forEach((day) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
            const block = src[day];
            if (!block || typeof block !== 'object') return;
            const dayOut = Object.create(null);
            Object.keys(block)
                .slice(0, 80)
                .forEach((areaId) => {
                    const key = String(areaId || '').slice(0, 64);
                    if (!key) return;
                    const sec = Number(block[areaId]);
                    if (!Number.isFinite(sec) || sec <= 0) return;
                    dayOut[key] = Math.min(Math.round(sec), 86400);
                });
            if (Object.keys(dayOut).length) out[day] = dayOut;
        });
    return out;
}

export function dayAreaUsageSeconds(usageAreasByDay, dayKey, areaId) {
    const block = usageAreasByDay && usageAreasByDay[dayKey];
    const v = block && block[areaId];
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export function dayTotalFromAreas(usageAreasByDay, dayKey) {
    const block = usageAreasByDay && usageAreasByDay[dayKey];
    if (!block) return 0;
    return Object.values(block).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

/** Görünür alanlar için top-N (settings/premium hariç). */
export function getTopUsageAreasForDay(usageAreasByDay, dayKey, limit = 3) {
    const block = usageAreasByDay && usageAreasByDay[dayKey];
    if (!block) return [];
    return Object.keys(block)
        .filter((areaId) => !isUsageAreaHiddenFromTopList(areaId))
        .map((areaId) => ({ areaId, seconds: dayAreaUsageSeconds(usageAreasByDay, dayKey, areaId) }))
        .filter((row) => row.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds)
        .slice(0, limit);
}

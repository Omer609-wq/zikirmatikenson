/**
 * Özel gün / gece zikirleri — GitHub public/seasonal-content.json
 * Tarih aralığı: start ≤ now < end (ISO 8601, örn. Europe/Istanbul +03:00)
 * Test: SEASONAL_CONTENT_PREVIEW = true
 */
import { Capacitor } from '@capacitor/core';

export const SEASONAL_CONTENT_URL =
    'https://raw.githubusercontent.com/Omer609-wq/zikirmatikenson/main/public/seasonal-content.json';

export const SEASONAL_CONTENT_DISABLED = false;

/** TEST — örnek etkinliği her zaman göster */
export const SEASONAL_CONTENT_PREVIEW = false;

export const SEASONAL_FOLDER_PREFIX = 'f_seasonal_';
export const SEASONAL_ZIKIR_PREFIX = 'z_seasonal_';
const SEASONAL_ZIKIR_SEP = '__';

const REMOTE_CACHE_KEY = 'zikirmatik_seasonal_content_cache';
const COUNTS_STORAGE_KEY = 'zikirmatik_seasonal_counts_v1';

const PREVIEW_PAYLOAD = {
    version: 1,
    events: [
        {
            id: 'onizleme-ozel-gece',
            start: '2020-01-01T00:00:00+03:00',
            end: '2099-12-31T23:59:59+03:00',
            title: {
                tr: 'Özel Gece (Önizleme)',
                en: 'Special Night (Preview)'
            },
            subtitle: {
                tr: 'Bu geceye özel zikirler',
                en: 'Dhikr for this special night'
            },
            zikirs: [
                {
                    name: 'Estağfirullah',
                    arabic: 'أَسْتَغْفِرُ اللَّهَ',
                    meaning: {
                        tr: "Allah'tan bağışlanma dilerim.",
                        en: 'I seek forgiveness from Allah.'
                    },
                    target: 100
                },
                {
                    name: 'Salavat',
                    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
                    meaning: {
                        tr: 'Allah\'ım, Muhammed\'e salat et.',
                        en: 'O Allah, send blessings upon Muhammad.'
                    },
                    target: 100
                }
            ]
        }
    ]
};

let cachedConfig = null;
const folderMetaById = new Map();

export function isSeasonalFolderId(id) {
    return typeof id === 'string' && id.startsWith(SEASONAL_FOLDER_PREFIX);
}

export function isSeasonalZikirId(id) {
    return typeof id === 'string' && id.startsWith(SEASONAL_ZIKIR_PREFIX);
}

export function seasonalFolderId(eventId) {
    return `${SEASONAL_FOLDER_PREFIX}${eventId}`;
}

export function seasonalZikirId(eventId, key) {
    return `${SEASONAL_ZIKIR_PREFIX}${eventId}${SEASONAL_ZIKIR_SEP}${key}`;
}

export function parseSeasonalZikirId(id) {
    if (!isSeasonalZikirId(id)) return null;
    const rest = id.slice(SEASONAL_ZIKIR_PREFIX.length);
    const sep = rest.lastIndexOf(SEASONAL_ZIKIR_SEP);
    if (sep < 0) return null;
    const eventId = rest.slice(0, sep);
    const key = rest.slice(sep + SEASONAL_ZIKIR_SEP.length);
    if (!eventId || !key) return null;
    const index = /^\d+$/.test(key) ? parseInt(key, 10) : null;
    return { eventId, key, index };
}

export function resolveSeasonalText(field, locale) {
    if (field == null) return '';
    if (typeof field === 'string') return field.trim();
    if (typeof field === 'object') {
        const loc = locale || 'tr';
        return String(field[loc] || field.tr || field.en || Object.values(field)[0] || '').trim();
    }
    return '';
}

function readRemoteCache() {
    try {
        const raw = localStorage.getItem(REMOTE_CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data && typeof data === 'object' ? data : null;
    } catch {
        return null;
    }
}

function writeRemoteCache(data) {
    if (!data || typeof data !== 'object') return;
    localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(data));
}

function readSeasonalCounts() {
    try {
        const raw = localStorage.getItem(COUNTS_STORAGE_KEY);
        if (!raw) return {};
        const data = JSON.parse(raw);
        return data && typeof data === 'object' ? data : {};
    } catch {
        return {};
    }
}

function writeSeasonalCounts(data) {
    localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(data));
}

function resolveStableSeasonalText(field) {
    if (field == null) return '';
    if (typeof field === 'string') return field.trim();
    if (typeof field === 'object') {
        return String(field.tr || field.en || Object.values(field)[0] || '').trim();
    }
    return String(field).trim();
}

function stableHash(input) {
    let hash = 2166136261;
    const text = String(input || '');
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function normalizeSeasonalKey(raw) {
    const explicit = String(raw?.id || raw?.key || '').trim();
    if (/^[a-z0-9][a-z0-9_-]{0,80}$/i.test(explicit)) return explicit;
    const identity = [
        typeof raw?.arabic === 'string' ? raw.arabic.trim() : '',
        resolveStableSeasonalText(raw?.name),
        resolveStableSeasonalText(raw?.meaning),
        String(raw?.target ?? '').trim()
    ].join('|');
    return `h_${stableHash(identity)}`;
}

export function purgeSeasonalCountsExcept(activeEventIds) {
    const keep = new Set((activeEventIds || []).map(String));
    const all = readSeasonalCounts();
    let changed = false;
    Object.keys(all).forEach((eventId) => {
        if (!keep.has(eventId)) {
            delete all[eventId];
            changed = true;
        }
    });
    if (changed) writeSeasonalCounts(all);
}

export function persistSeasonalCountsFromZikirs(zikirs) {
    if (!Array.isArray(zikirs)) return;
    const all = readSeasonalCounts();
    let changed = false;

    zikirs.forEach((z) => {
        const parsed = parseSeasonalZikirId(z?.id);
        if (!parsed) return;
        const { eventId, index } = parsed;
        if (!all[eventId]) {
            all[eventId] = {};
            changed = true;
        }
        const key = parsed.key || String(index);
        const prev = all[eventId][key] || {};
        const next = {
            count: Number.isFinite(z.count) ? z.count : 0,
            lastClicked: Number.isFinite(z.lastClicked) ? z.lastClicked : 0
        };
        if (prev.count !== next.count || prev.lastClicked !== next.lastClicked) {
            all[eventId][key] = next;
            changed = true;
        }
    });

    if (changed) writeSeasonalCounts(all);
}

function normalizeZikir(raw, locale, eventId, index, key, savedCounts) {
    if (!raw || typeof raw !== 'object') return null;
    const saved = savedCounts?.[key] || savedCounts?.[String(index)] || {};
    const target = parseInt(String(raw.target ?? ''), 10);
    return {
        id: seasonalZikirId(eventId, key),
        folderId: seasonalFolderId(eventId),
        name: resolveSeasonalText(raw.name, locale) || 'Zikir',
        arabic: typeof raw.arabic === 'string' ? raw.arabic.trim() : '',
        meaning: resolveSeasonalText(raw.meaning, locale),
        fazilet: resolveSeasonalText(raw.fazilet, locale) || undefined,
        target: Number.isFinite(target) && target > 0 ? target : 33,
        count: Number.isFinite(saved.count) ? saved.count : 0,
        lastClicked: Number.isFinite(saved.lastClicked) ? saved.lastClicked : 0,
        order: index,
        favorite: false
    };
}

function isEventActive(event, now = new Date()) {
    if (!event || typeof event !== 'object') return false;
    if (event.active === false) return false;
    const start = Date.parse(String(event.start || ''));
    const end = Date.parse(String(event.end || ''));
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    const t = now.getTime();
    return t >= start && t < end;
}

function normalizeEvents(raw, locale) {
    const events = Array.isArray(raw?.events) ? raw.events : [];
    return events
        .filter((ev) => isEventActive(ev))
        .map((ev) => {
            const id = String(ev.id || '').trim();
            if (!id || !/^[a-z0-9][a-z0-9_-]*$/i.test(id)) return null;
            const seenKeys = new Map();
            const zikirs = (Array.isArray(ev.zikirs) ? ev.zikirs : [])
                .map((z, i) => {
                    const baseKey = normalizeSeasonalKey(z);
                    const seen = seenKeys.get(baseKey) || 0;
                    seenKeys.set(baseKey, seen + 1);
                    const key = seen ? `${baseKey}_${seen + 1}` : baseKey;
                    return normalizeZikir(z, locale, id, i, key, readSeasonalCounts()[id]);
                })
                .filter(Boolean);
            if (!zikirs.length) return null;
            return {
                id,
                title: resolveSeasonalText(ev.title || ev.titles, locale),
                subtitle: resolveSeasonalText(ev.subtitle || ev.subtitles, locale),
                zikirs
            };
        })
        .filter(Boolean);
}

export function getActiveSeasonalEvents() {
    return cachedConfig?.events || [];
}

export function getSeasonalFolderMeta(folderId) {
    return folderMetaById.get(folderId) || null;
}

function setCachedEvents(events) {
    cachedConfig = { events: Array.isArray(events) ? events : [] };
    folderMetaById.clear();
    cachedConfig.events.forEach((ev) => {
        const folderId = seasonalFolderId(ev.id);
        folderMetaById.set(folderId, {
            eventId: ev.id,
            subtitle: ev.subtitle || ''
        });
    });
}

export async function refreshSeasonalContent(locale = 'tr') {
    if (SEASONAL_CONTENT_DISABLED) {
        setCachedEvents([]);
        return [];
    }

    if (SEASONAL_CONTENT_PREVIEW) {
        const events = normalizeEvents(PREVIEW_PAYLOAD, locale);
        setCachedEvents(events);
        purgeSeasonalCountsExcept(events.map((e) => e.id));
        return events;
    }

    const urls = [];
    if (SEASONAL_CONTENT_URL) {
        urls.push(`${SEASONAL_CONTENT_URL}?t=${Date.now()}`);
    }
    if (Capacitor.isNativePlatform()) {
        urls.push(`./seasonal-content.json?t=${Date.now()}`);
    }

    for (const url of urls) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const raw = await res.json();
            if (raw && typeof raw === 'object') writeRemoteCache(raw);
            const events = normalizeEvents(raw, locale);
            setCachedEvents(events);
            purgeSeasonalCountsExcept(events.map((e) => e.id));
            return events;
        } catch (e) {
            console.warn('seasonal-content fetch', url, e);
        }
    }

    const saved = readRemoteCache();
    if (saved) {
        const events = normalizeEvents(saved, locale);
        setCachedEvents(events);
        purgeSeasonalCountsExcept(events.map((e) => e.id));
        return events;
    }

    setCachedEvents([]);
    return [];
}

export function removeSeasonalFromAppState(folders, zikirs) {
    if (Array.isArray(folders)) {
        for (let i = folders.length - 1; i >= 0; i--) {
            if (isSeasonalFolderId(folders[i]?.id)) folders.splice(i, 1);
        }
    }
    if (Array.isArray(zikirs)) {
        for (let i = zikirs.length - 1; i >= 0; i--) {
            if (isSeasonalZikirId(zikirs[i]?.id)) zikirs.splice(i, 1);
        }
    }
}

export function applySeasonalContentToAppState(folders, zikirs, locale = 'tr') {
    removeSeasonalFromAppState(folders, zikirs);
    const events = getActiveSeasonalEvents();
    if (!events.length) return;

    events.forEach((ev, idx) => {
        const folderId = seasonalFolderId(ev.id);
        folders.unshift({
            id: folderId,
            name: ev.title || ev.id,
            order: -1000 + idx
        });
        ev.zikirs.forEach((z) => {
            zikirs.push({ ...z });
        });
    });
}

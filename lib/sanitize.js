import { clampArabicSublineFontStep, normalizeAppLocale } from '../i18n.js';
import { normalizeQuranZikirDisplayMode, syncQuranSettingsForLocale } from '../quran.js';
import { isSeasonalFolderId, isSeasonalZikirId } from '../seasonal-content.js';
import { normalizeCounterTickSound } from './counter-tick-sounds.js';
import { normalizeCounterBackground } from './counter-backgrounds.js';
import { sanitizeSmartReminders } from './smart-reminders.js';
import { normalizeDailyZikirGoal, sanitizeUsageByDay } from './weekly-report.js';
import { sanitizeUsageAreasByDay } from './usage-areas.js';
import {
    clampNumber,
    coerceId,
    coerceString,
    isPlainObject,
    mintId
} from './coerce.js';

export { clampNumber, coerceId, coerceString, isPlainObject, mintId } from './coerce.js';

import { normalizeQuranCounterLayout } from './quran-counter-layout.js';

/** @returns {'navy'|'light'|'black'} */
function normalizeStoredTheme(theme) {
    if (theme === 'light') return 'light';
    if (theme === 'black') return 'black';
    return 'navy';
}

function normalizeStoredAccent(accent) {
    const v = String(accent || '').trim();
    const allowed = ['emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'pink', 'red', 'orange', 'amber', 'lime', 'sky'];
    return allowed.includes(v) ? v : 'emerald';
}

function normalizeStoredCounterNumberSize(v) {
    const s = String(v || '').trim();
    if (s === 's') return 's';
    if (s === 'l') return 'l';
    return 'm';
}

function normalizeStoredCounterTapScale(v) {
    const s = String(v || '').trim();
    if (s === 's') return 's';
    if (s === 'l') return 'l';
    return 'm';
}

function normalizeStoredCounterBackgroundCustomDataUrl(value) {
    const v = String(value || '').trim();
    if (!v) return '';
    if (!/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(v)) return '';
    return v.length <= 1500000 ? v : '';
}

export { normalizeQuranCounterLayout } from './quran-counter-layout.js';

export function sanitizeLoadedData(d) {
    const safe = isPlainObject(d) ? d : {};

    let fArr = Array.isArray(safe.folders) ? safe.folders : [];
    fArr = fArr
        .filter((x) => isPlainObject(x))
        .filter((f) => !isSeasonalFolderId(f.id))
        .slice(0, 5000)
        .map((f, idx) => ({
            id: coerceId(f.id, 'f'),
            name: coerceString(f.name || 'Klasör', 60) || `Klasör ${idx + 1}`,
            order: (typeof f.order === 'number' && Number.isFinite(f.order)) ? f.order : idx
        }));

    let zArr = Array.isArray(safe.zikirs) ? safe.zikirs : [];
    zArr = zArr
        .filter((x) => isPlainObject(x))
        .filter((z) => !isSeasonalZikirId(z.id))
        .slice(0, 200000)
        .map((z, idx) => ({
            id: coerceId(z.id, 'z'),
            folderId: coerceId(z.folderId || 'f_default', 'f'),
            name: coerceString(z.name || 'Zikir', 80) || `Zikir ${idx + 1}`,
            arabic: coerceString(z.arabic || '', 1200),
            target: clampNumber(z.target, { min: 1, max: 1000000, fallback: 33 }),
            meaning: coerceString(z.meaning || '', 1600),
            count: clampNumber(z.count, { min: 0, max: 1000000000, fallback: 0 }),
            lastClicked: clampNumber(z.lastClicked, { min: 0, max: 9e15, fallback: 0 }),
            order: (typeof z.order === 'number' && Number.isFinite(z.order)) ? z.order : idx,
            favorite: typeof z.favorite === 'boolean' ? z.favorite : false,
            fazilet: z.fazilet != null ? coerceString(z.fazilet, 2000) : undefined,
            libraryId: z.libraryId ? coerceId(z.libraryId, 'lib') : undefined,
            quranRef:
                z.quranRef && isPlainObject(z.quranRef)
                    ? {
                          s: clampNumber(z.quranRef.s, { min: 1, max: 114, fallback: 1 }),
                          a: clampNumber(z.quranRef.a, { min: 1, max: 300, fallback: 1 }),
                          ayahs: Array.isArray(z.quranRef.ayahs)
                              ? z.quranRef.ayahs
                                    .map((n) => clampNumber(n, { min: 1, max: 300, fallback: 0 }))
                                    .filter((n) => n > 0)
                                    .slice(0, 3)
                              : undefined
                      }
                    : undefined,
            quranDisplayMode:
                z.quranDisplayMode != null && String(z.quranDisplayMode).trim()
                    ? normalizeQuranZikirDisplayMode(z.quranDisplayMode)
                    : undefined,
            quranCounterLayout:
                z.quranCounterLayout != null && String(z.quranCounterLayout).trim()
                    ? normalizeQuranCounterLayout(z.quranCounterLayout)
                    : undefined
        }));

    const hist = isPlainObject(safe.history) ? safe.history : {};
    const historyOut = Object.create(null);
    Object.keys(hist).slice(0, 2000).forEach((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
        const block = hist[day];
        if (!isPlainObject(block)) return;
        const outBlock = Object.create(null);
        Object.keys(block).slice(0, 40000).forEach((zid) => {
            const id = coerceId(zid, 'z');
            const v = block[zid];
            const num = clampNumber(v, { min: 0, max: 1000000000, fallback: 0 });
            if (num > 0) outBlock[id] = num;
        });
        historyOut[day] = outBlock;
    });

    const s = isPlainObject(safe.settings) ? safe.settings : {};
    const oldVib = (typeof s.vibration === 'boolean') ? s.vibration : true;
    const counterBackgroundCustomDataUrl = normalizeStoredCounterBackgroundCustomDataUrl(s.counterBackgroundCustomDataUrl);
    let counterBackground = normalizeCounterBackground(s.counterBackground);
    if (counterBackground === 'custom' && !counterBackgroundCustomDataUrl) counterBackground = 'none';
    const settingsOut = {
        vibrationTap: (typeof s.vibrationTap === 'boolean') ? s.vibrationTap : oldVib,
        vibrationTarget: (typeof s.vibrationTarget === 'boolean') ? s.vibrationTarget : oldVib,
        sound: (typeof s.sound === 'boolean') ? s.sound : false,
        wakeLock: (typeof s.wakeLock === 'boolean') ? s.wakeLock : false,
        counterNativeNumerals: (typeof s.counterNativeNumerals === 'boolean') ? s.counterNativeNumerals : false,
        arabicSublineFontStep: clampArabicSublineFontStep(s.arabicSublineFontStep),
        theme: normalizeStoredTheme(s.theme),
        accent: normalizeStoredAccent(s.accent),
        counterRingWidth: clampNumber(s.counterRingWidth, { min: 8, max: 18, fallback: 12 }),
        counterNumberSize: normalizeStoredCounterNumberSize(s.counterNumberSize),
        counterShowTarget: typeof s.counterShowTarget === 'boolean' ? s.counterShowTarget : true,
        counterShowTotal: typeof s.counterShowTotal === 'boolean' ? s.counterShowTotal : true,
        counterShowRound: typeof s.counterShowRound === 'boolean' ? s.counterShowRound : true,
        counterTapScale: normalizeStoredCounterTapScale(s.counterTapScale),
        counterTickSound: normalizeCounterTickSound(s.counterTickSound),
        counterBackground,
        counterBackgroundCustomDataUrl,
        locale: normalizeAppLocale(s.locale),
        quranMeal: s.quranMeal,
        quranReadMode: s.quranReadMode,
        quranReaderLayout: s.quranReaderLayout,
        quranMushafRememberPage:
            typeof s.quranMushafRememberPage === 'boolean' ? s.quranMushafRememberPage : false,
        quranMushafSavedPage: clampNumber(s.quranMushafSavedPage, { min: 1, max: 604, fallback: 1 }),
        dailyZikirGoal: normalizeDailyZikirGoal(s.dailyZikirGoal),
        weeklyReportEnabled: typeof s.weeklyReportEnabled === 'boolean' ? s.weeklyReportEnabled : true
    };
    syncQuranSettingsForLocale(settingsOut);

    const r = isPlainObject(safe.reminders) ? safe.reminders : (isPlainObject(safe.reminderSettings) ? safe.reminderSettings : {});
    const remindersOut = {
        enabled: (typeof r.enabled === 'boolean') ? r.enabled : false,
        time: /^\d{2}:\d{2}$/.test(String(r.time || '')) ? String(r.time) : '21:00',
        lastFiredYmd: (typeof r.lastFiredYmd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.lastFiredYmd)) ? r.lastFiredYmd : null
    };

    const e = isPlainObject(safe.entitlements) ? safe.entitlements : {};
    const entOut = { premium: !!e.premium };

    const t = isPlainObject(safe.trash) ? safe.trash : {};
    const entries = Array.isArray(t.entries) ? t.entries : [];
    const trashOut = {
        v: 1,
        entries: entries
            .filter((x) => isPlainObject(x))
            .slice(0, 500)
            .map((x) => ({
                kind: x.kind === 'folder' ? 'folder' : 'zikir',
                deletedAt: clampNumber(x.deletedAt, { min: 0, max: 9e15, fallback: Date.now() }),
                folder: x.folder && isPlainObject(x.folder) ? { id: coerceId(x.folder.id, 'f'), name: coerceString(x.folder.name, 60), order: clampNumber(x.folder.order, { min: 0, max: 1e9, fallback: 0 }) } : undefined,
                zikirs: Array.isArray(x.zikirs)
                    ? x.zikirs.filter(isPlainObject).slice(0, 2000).map((z) => ({
                        id: coerceId(z.id, 'z'),
                        folderId: coerceId(z.folderId || 'f_default', 'f'),
                        name: coerceString(z.name || 'Zikir', 80),
                        arabic: coerceString(z.arabic || '', 1200),
                        target: clampNumber(z.target, { min: 1, max: 1000000, fallback: 33 }),
                        meaning: coerceString(z.meaning || '', 1600),
                        count: clampNumber(z.count, { min: 0, max: 1000000000, fallback: 0 }),
                        lastClicked: clampNumber(z.lastClicked, { min: 0, max: 9e15, fallback: 0 }),
                        order: clampNumber(z.order, { min: 0, max: 1e9, fallback: 0 })
                    }))
                    : undefined,
                zikir: x.zikir && isPlainObject(x.zikir)
                    ? {
                        id: coerceId(x.zikir.id, 'z'),
                        folderId: coerceId(x.zikir.folderId || 'f_default', 'f'),
                        name: coerceString(x.zikir.name || 'Zikir', 80),
                        arabic: coerceString(x.zikir.arabic || '', 1200),
                        target: clampNumber(x.zikir.target, { min: 1, max: 1000000, fallback: 33 }),
                        meaning: coerceString(x.zikir.meaning || '', 1600),
                        count: clampNumber(x.zikir.count, { min: 0, max: 1000000000, fallback: 0 }),
                        lastClicked: clampNumber(x.zikir.lastClicked, { min: 0, max: 9e15, fallback: 0 }),
                        order: clampNumber(x.zikir.order, { min: 0, max: 1e9, fallback: 0 })
                    }
                    : undefined,
                originalFolderId: x.originalFolderId != null ? coerceId(x.originalFolderId, 'f') : null
            }))
    };

    const seenF = new Set();
    fArr.forEach((f) => {
        if (seenF.has(f.id)) f.id = mintId('f');
        seenF.add(f.id);
    });
    const seenZ = new Set();
    zArr.forEach((z) => {
        if (seenZ.has(z.id)) z.id = mintId('z');
        seenZ.add(z.id);
    });

    const folderIds = new Set(fArr.map((f) => f.id));
    zArr.forEach((z) => {
        if (!folderIds.has(z.folderId)) z.folderId = 'f_default';
    });

    let favArr = Array.isArray(safe.quranAyahFavorites) ? safe.quranAyahFavorites : [];
    const favSeen = new Set();
    const quranFavOut = [];
    favArr.forEach((item) => {
        if (!isPlainObject(item)) return;
        const surah = clampNumber(item.s, { min: 1, max: 114, fallback: 0 });
        const ayah = clampNumber(item.a, { min: 1, max: 300, fallback: 0 });
        if (!surah || !ayah) return;
        const key = `${surah}:${ayah}`;
        if (favSeen.has(key)) return;
        favSeen.add(key);
        quranFavOut.push({
            s: surah,
            a: ayah,
            t: clampNumber(item.t, { min: 0, max: 9e15, fallback: Date.now() })
        });
    });
    quranFavOut.sort((x, y) => y.t - x.t);
    if (quranFavOut.length > 500) quranFavOut.length = 500;

    const meta = isPlainObject(safe.appMeta) ? safe.appMeta : {};
    const appMetaOut = {
        installedAt:
            typeof meta.installedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(meta.installedAt)
                ? meta.installedAt
                : null,
        smartRemindersIntroSeeded: meta.smartRemindersIntroSeeded === true,
        smartRemindersIntroMsgVersion: clampNumber(meta.smartRemindersIntroMsgVersion, {
            min: 0,
            max: 999,
            fallback: 0
        })
    };
    const cloudRaw = isPlainObject(meta.cloudBackup) ? meta.cloudBackup : null;
    if (cloudRaw) {
        const uid = typeof cloudRaw.uid === 'string' ? cloudRaw.uid.trim().slice(0, 128) : '';
        if (uid) {
            appMetaOut.cloudBackup = {
                uid,
                email: typeof cloudRaw.email === 'string' ? cloudRaw.email.trim().slice(0, 256) : '',
                lastBackupAt: clampNumber(cloudRaw.lastBackupAt, { min: 0, max: 9e15, fallback: 0 }),
                linkedAt: clampNumber(cloudRaw.linkedAt, { min: 0, max: 9e15, fallback: 0 })
            };
        }
    }

    const lbRaw = isPlainObject(safe.lifetimeByZikir) ? safe.lifetimeByZikir : {};
    const lifetimeByZikirOut = Object.create(null);
    Object.keys(lbRaw)
        .slice(0, 50000)
        .forEach((zid) => {
            const id = coerceId(zid, 'z');
            const v = clampNumber(lbRaw[zid], { min: 0, max: 1000000000, fallback: 0 });
            if (v > 0) lifetimeByZikirOut[id] = v;
        });

    let lifetimeTotalOut = clampNumber(safe.lifetimeTotal, { min: 0, max: 1000000000000, fallback: 0 });
    const sumByZikir = Object.values(lifetimeByZikirOut).reduce((acc, n) => acc + n, 0);
    if (sumByZikir > lifetimeTotalOut) lifetimeTotalOut = sumByZikir;

    const smartRemindersOut = sanitizeSmartReminders(safe.smartReminders);
    const usageByDayOut = sanitizeUsageByDay(safe.usageByDay);
    const usageAreasByDayOut = sanitizeUsageAreasByDay(safe.usageAreasByDay);

    return {
        folders: fArr,
        zikirs: zArr,
        history: historyOut,
        usageByDay: usageByDayOut,
        usageAreasByDay: usageAreasByDayOut,
        settings: settingsOut,
        reminders: remindersOut,
        smartReminders: smartRemindersOut,
        entitlements: entOut,
        trash: trashOut,
        quranAyahFavorites: quranFavOut,
        appMeta: appMetaOut,
        lifetimeTotal: lifetimeTotalOut,
        lifetimeByZikir: lifetimeByZikirOut
    };
}

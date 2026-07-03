import { formatDateKeyFromDate, parseDateKey } from './weekly-report.js';
import {
    USAGE_AREA_LIB_DUA,
    USAGE_AREA_LIB_ZIKIR,
    USAGE_AREA_PREMIUM,
    USAGE_AREA_QURAN,
    USAGE_AREA_SETTINGS,
    folderUsageAreaId
} from './usage-areas.js';

const PREVIEW_GOAL = 100;
const STREAK_DAYS = 29;

/**
 * Haftalık rapor UI testi için örnek geçmiş (12 günlük seri + 4 haftalık süre).
 * @param {string} todayKey YYYY-MM-DD
 */
export function buildWeeklyReportPreviewPatch(todayKey) {
    const history = Object.create(null);
    const usageByDay = Object.create(null);
    const usageAreasByDay = Object.create(null);
    const today = parseDateKey(todayKey);

    for (let i = 0; i < 35; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = formatDateKeyFromDate(d);

        if (i < STREAK_DAYS) {
            history[key] = {
                z_1: 42,
                z_2: 38,
                z_e_0: 28
            };
        } else if (i === STREAK_DAYS) {
            history[key] = { z_1: 24 };
        } else {
            history[key] = { z_1: 55 + (i % 15), z_2: 20 };
        }

        const dow = d.getDay();
        const weekdayMins = [32, 22, 28, 18, 45, 58, 38];
        const totalSec = (weekdayMins[dow] + (i % 4) * 4) * 60;

        const esma = Math.round(totalSec * 0.34);
        const def = Math.round(totalSec * 0.22);
        const dua = Math.round(totalSec * 0.11);
        const zikir = Math.round(totalSec * 0.07);
        const quran = Math.round(totalSec * 0.14);
        const settings = Math.round(totalSec * 0.06);
        const premium = Math.round(totalSec * 0.06);

        usageAreasByDay[key] = {
            [folderUsageAreaId('f_esma')]: esma,
            [folderUsageAreaId('f_default')]: def,
            [USAGE_AREA_LIB_DUA]: dua,
            [USAGE_AREA_LIB_ZIKIR]: zikir,
            [USAGE_AREA_QURAN]: quran,
            [USAGE_AREA_SETTINGS]: settings,
            [USAGE_AREA_PREMIUM]: premium
        };
        usageByDay[key] = esma + def + dua + zikir + quran + settings + premium;
    }

    const todayEsma = 46 * 60;
    const todayDefault = 31 * 60;
    const todayQuran = 19 * 60;
    const todayDua = 11 * 60;
    const todayZikir = 7 * 60;
    const todaySettings = 9 * 60;
    const todayPremium = 6 * 60;

    usageAreasByDay[todayKey] = {
        [folderUsageAreaId('f_esma')]: todayEsma,
        [folderUsageAreaId('f_default')]: todayDefault,
        [USAGE_AREA_LIB_DUA]: todayDua,
        [USAGE_AREA_LIB_ZIKIR]: todayZikir,
        [USAGE_AREA_QURAN]: todayQuran,
        [USAGE_AREA_SETTINGS]: todaySettings,
        [USAGE_AREA_PREMIUM]: todayPremium
    };
    usageByDay[todayKey] =
        todayEsma + todayDefault + todayQuran + todayDua + todayZikir + todaySettings + todayPremium;

    return {
        history,
        usageByDay,
        usageAreasByDay,
        settingsPatch: {
            dailyZikirGoal: PREVIEW_GOAL,
            weeklyReportEnabled: true
        },
        entitlementsPatch: { premium: true }
    };
}

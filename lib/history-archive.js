/**
 * Günlük geçmişin aylık özeti.
 *
 * Günlük tıklama geçmişi 400 günden sonra budanıyor (telefon hafızası şişmesin).
 * Beş yıllık "Yıllık" grafik yıl toplamını o günlerden hesapladığı için budanan
 * yıllar 0, yarısı budanan yıl eksik görünüyordu. Budanan gün silinmeden önce
 * buraya ay → zikir → adet olarak eklenir; ay/yıl toplamı günlük geçmiş + özet.
 * Bir gün ya günlük geçmişte ya özette durur, ikisinde birden değil: çift sayım yok.
 *
 * Biçim: { "2026-04": { "z_abc": 120, "z_e_3": 33 }, ... }
 */

import { coerceId } from './coerce.js';

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;
/** Ay başına zikir ve toplam ay sınırı: bozuk/şişmiş veri kayda girmesin. */
const MAX_ZIKIRS_PER_MONTH = 5000;
const MAX_MONTHS = 600;
const MAX_COUNT = 1000000000;

/**
 * `cutoffDay` öncesindeki geçerli günleri aylık özete ekler. Günleri SİLMEZ;
 * silme budayan tarafta kalır (geçersiz anahtarları da o siler).
 * @returns {boolean} özet değiştiyse true
 */
export function archiveDaysBefore(history, monthly, cutoffDay) {
    if (!history || typeof history !== 'object' || !monthly) return false;
    let changed = false;
    for (const day of Object.keys(history)) {
        if (!DAY_KEY_RE.test(day) || day >= cutoffDay) continue;
        const block = history[day];
        if (!block || typeof block !== 'object') continue;
        const ym = day.slice(0, 7);
        for (const zid of Object.keys(block)) {
            const n = Number(block[zid]);
            if (!Number.isFinite(n) || n <= 0) continue;
            if (!monthly[ym]) monthly[ym] = {};
            monthly[ym][zid] = Math.min(MAX_COUNT, (Number(monthly[ym][zid]) || 0) + Math.round(n));
            changed = true;
        }
    }
    return changed;
}

/** Kalıcı silinen zikirlerin özetteki adetleri (günlük geçmişle aynı davranış). */
export function removeZikirsFromMonthly(monthly, zidSet) {
    if (!monthly || !zidSet || zidSet.size === 0) return false;
    let changed = false;
    for (const ym of Object.keys(monthly)) {
        const block = monthly[ym];
        if (!block || typeof block !== 'object') continue;
        zidSet.forEach((zid) => {
            if (zid in block) {
                delete block[zid];
                changed = true;
            }
        });
        if (Object.keys(block).length === 0) delete monthly[ym];
    }
    return changed;
}

function blockTotal(block, zid) {
    if (!block || typeof block !== 'object') return 0;
    if (zid) return Number(block[zid]) || 0;
    let sum = 0;
    for (const k of Object.keys(block)) sum += Number(block[k]) || 0;
    return sum;
}

/** Özetteki bir ayın toplamı ("2025-03"); zid verilirse yalnız o zikir. */
export function monthlyArchiveTotal(monthly, ym, zid) {
    return blockTotal(monthly && monthly[ym], zid);
}

/** Özetteki bir yılın toplamı ("2025"); zid verilirse yalnız o zikir. */
export function yearArchiveTotal(monthly, year, zid) {
    if (!monthly || typeof monthly !== 'object') return 0;
    const prefix = `${year}-`;
    let sum = 0;
    for (const ym of Object.keys(monthly)) {
        if (ym.startsWith(prefix)) sum += blockTotal(monthly[ym], zid);
    }
    return sum;
}

/** Yüklenen/geri yüklenen veriden güvenli aylık özet. */
export function sanitizeHistoryMonthly(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    const months = Object.keys(raw)
        .filter((ym) => MONTH_KEY_RE.test(ym))
        .sort()
        .slice(-MAX_MONTHS);
    for (const ym of months) {
        const block = raw[ym];
        if (!block || typeof block !== 'object' || Array.isArray(block)) continue;
        const clean = {};
        for (const zid of Object.keys(block).slice(0, MAX_ZIKIRS_PER_MONTH)) {
            // Günlük geçmişle aynı kimlik kuralı (sanitize.js: coerceId).
            const id = coerceId(zid, 'z');
            const n = Number(block[zid]);
            if (!Number.isFinite(n) || n <= 0) continue;
            clean[id] = Math.min(MAX_COUNT, (clean[id] || 0) + Math.round(n));
        }
        if (Object.keys(clean).length) out[ym] = clean;
    }
    return out;
}

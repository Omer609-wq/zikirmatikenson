/**
 * Dini günler (şimdilik yalnızca Türkçe arayüzde).
 *
 * Tarihler hesaplanmaz, Diyanet'in yayımladığı listeden gelir
 * (data/special-days.json). Hicri takvim ülkeden ülkeye bir gün kayabiliyor;
 * Türkiye'de geçerli olan Diyanet'in tarihi. Hicri tarih de Diyanet'in
 * tablosundaki gibi, o miladi günün gündüzüne ait tarihtir.
 *
 * Kandiller ve Kadir Gecesi "gece"dir: Diyanet'in yazdığı miladi günün akşamı
 * kandil gecesidir. O gün boyunca ve gece sabaha kadar (ertesi gün
 * NIGHT_END_HOUR) etkin sayılır. Diğerleri (bayram, arefe, aşure…) yalnızca o
 * miladi gün boyunca.
 *
 * Uzaktan ekleme: public/seasonal-content.json'a aynı biçimde "specialDays"
 * dizisi konursa, orada bulunan yıllar gömülü listenin yerine geçer. Diyanet
 * yeni yılın listesini yayımlayınca uygulama güncellemesi beklemeden eklenir.
 */

/** Ekranda görünen adlar Türkçe; özellik yalnızca Türkçe arayüzde açık. */
export const SPECIAL_DAY_KINDS = Object.freeze({
    mirac: { name: 'Miraç Kandili', night: true },
    berat: { name: 'Berat Kandili', night: true },
    regaib: { name: 'Regaib Kandili', night: true },
    mevlid: { name: 'Mevlid Kandili', night: true },
    kadir: { name: 'Kadir Gecesi', night: true },
    ucAylar: { name: 'Üç Ayların Başlangıcı' },
    ramazanBaslangici: { name: 'Ramazan Başlangıcı' },
    arefe: { name: 'Arefe' },
    ramazanBayrami: { name: 'Ramazan Bayramı' },
    kurbanBayrami: { name: 'Kurban Bayramı' },
    hicriYilbasi: { name: 'Hicri Yılbaşı' },
    asure: { name: 'Aşure Günü' }
});

export const HIJRI_MONTHS_TR = Object.freeze([
    'Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir',
    'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'
]);

/** Gece olan dini günler ertesi sabah bu saate kadar etkin. */
export const NIGHT_END_HOUR = 6;

const DAY_MS = 86400000;

function parseDateKey(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''));
    if (!m) return null;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = new Date(y, mo - 1, d);
    // 2026-02-30 gibi taşan tarihleri ele.
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return { y, mo, d };
}

function normalizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const date = parseDateKey(raw.date);
    if (!date || !Object.prototype.hasOwnProperty.call(SPECIAL_DAY_KINDS, raw.id)) return null;
    const h = Array.isArray(raw.hijri) ? raw.hijri.map(Number) : [];
    const [hd, hm, hy] = h;
    if (h.length !== 3 || !h.every(Number.isInteger) || hd < 1 || hd > 30 || hm < 1 || hm > 12 || hy < 1400) {
        return null;
    }
    const entry = { date: raw.date, hijri: [hd, hm, hy], id: raw.id };
    const part = Number(raw.part);
    if (Number.isInteger(part) && part >= 1 && part <= 4) entry.part = part;
    return entry;
}

const byDate = (a, b) => a.date.localeCompare(b.date);

/**
 * Geçersiz girdileri atar, tarihe göre sıralar (aynı gün girdilerin sırası korunur).
 * @param {unknown} list
 * @returns {{ date: string, hijri: number[], id: string, part?: number }[]}
 */
export function normalizeSpecialDays(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeEntry).filter(Boolean).sort(byDate);
}

/**
 * Gömülü liste + uzaktan gelen: uzaktakinde bulunan her yıl gömülünün o yılının
 * yerine geçer (düzeltme ya da yeni yıl); diğer yıllar gömülüden.
 */
export function mergeSpecialDays(bundled, remote) {
    const base = normalizeSpecialDays(bundled);
    const extra = normalizeSpecialDays(remote);
    if (!extra.length) return base;
    const remoteYears = new Set(extra.map((e) => e.date.slice(0, 4)));
    return [...base.filter((e) => !remoteYears.has(e.date.slice(0, 4))), ...extra].sort(byDate);
}

function dayStart(entry) {
    const { y, mo, d } = parseDateKey(entry.date);
    return new Date(y, mo - 1, d);
}

/** Etkin olduğu aralık: [start, end). */
export function specialDayWindow(entry) {
    const { y, mo, d } = parseDateKey(entry.date);
    const night = !!SPECIAL_DAY_KINDS[entry.id]?.night;
    return {
        start: new Date(y, mo - 1, d),
        end: night ? new Date(y, mo - 1, d + 1, NIGHT_END_HOUR) : new Date(y, mo - 1, d + 1)
    };
}

export function isSpecialDayActive(entry, now = new Date()) {
    const { start, end } = specialDayWindow(entry);
    const t = now.getTime();
    return t >= start.getTime() && t < end.getTime();
}

/**
 * Şu an başlıkta gösterilecek dini gün; yoksa null.
 * Bugünün günü dünkü kandil gecesinin devamından önce gelir; aynı günde gece
 * olan önce gelir (Regaib Kandili, aynı güne düşen Üç Ayların Başlangıcı'ndan).
 */
export function activeSpecialDay(entries, now = new Date()) {
    const active = (entries || []).filter((e) => isSpecialDayActive(e, now));
    if (!active.length) return null;
    const night = (e) => (SPECIAL_DAY_KINDS[e.id]?.night ? 1 : 0);
    return active.sort((a, b) => b.date.localeCompare(a.date) || night(b) - night(a))[0];
}

/** [11, 3, 1448] → "11 Rebiülevvel 1448" */
export function formatHijriTr(hijri) {
    const [d, m, y] = hijri || [];
    return `${d} ${HIJRI_MONTHS_TR[m - 1] || ''} ${y}`;
}

/** "Ramazan Bayramı" (bayramın kaçıncı günü olduğu ayrı: specialDayPartLabel). */
export function specialDayName(entry) {
    return SPECIAL_DAY_KINDS[entry.id]?.name || '';
}

/** Bayram günleri için "1. Gün"; diğerlerinde boş. */
export function specialDayPartLabel(entry) {
    return entry.part ? `${entry.part}. Gün` : '';
}

export function specialDayYears(entries) {
    return [...new Set((entries || []).map((e) => Number(e.date.slice(0, 4))))].sort((a, b) => a - b);
}

export function specialDaysForYear(entries, year) {
    const prefix = `${year}-`;
    return (entries || []).filter((e) => e.date.startsWith(prefix));
}

/**
 * Listedeki durum. Etkin olan (kandil gecesinin sabaha kadarki kısmı dahil)
 * "active"; değilse bugüne göre kaç gün ötede.
 * @returns {{ state: 'active' | 'past' | 'upcoming', days: number }}
 */
export function specialDayStatus(entry, now = new Date()) {
    if (isSpecialDayActive(entry, now)) return { state: 'active', days: 0 };
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Yaz saati olan ülkelerde gün 23/25 saat olabilir; yuvarlama bunu yutar.
    const days = Math.round((dayStart(entry).getTime() - today.getTime()) / DAY_MS);
    return { state: days < 0 ? 'past' : 'upcoming', days };
}

export function specialDayStatusLabel(status) {
    if (status.state === 'active') return 'Bugün';
    if (status.state === 'past') return 'Geçti';
    if (status.days === 0) return 'Bugün';
    if (status.days === 1) return 'Yarın';
    return `${status.days} gün sonra`;
}

/** Liste açılınca gösterilecek yıl: etkin ya da sıradaki dini günün yılı. */
export function defaultSpecialDaysYear(entries, now = new Date()) {
    const next = (entries || []).find((e) => specialDayStatus(e, now).state !== 'past');
    if (next) return Number(next.date.slice(0, 4));
    const years = specialDayYears(entries);
    return years.length ? years[years.length - 1] : now.getFullYear();
}

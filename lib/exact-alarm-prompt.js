/**
 * Android'de "tam zamanlı alarm" (SCHEDULE_EXACT_ALARM) izni akışı.
 *
 * Neden gerekli: izin yokken @capacitor/local-notifications
 * setAndAllowWhileIdle dalına düşer (LocalNotificationManager.java). Inexact
 * alarmlar App Standby Bucket'a tabidir; uygulama birkaç gün açılmayınca
 * bucket "rare"a iner ve alarm saatlerce ertelenir. Kullanıcı uygulamayı
 * açtığında bucket "active"e çıkar ve biriken bildirim o an gelir — sahadan
 * gelen "bazen geç geliyor, bazen ben açınca geliyor" şikâyeti tam olarak bu.
 *
 * İzin targetSdk 33+ için varsayılan olarak KAPALI; yalnızca sistem ayar
 * ekranından açılabiliyor. Kullanıcıyı oraya göndermeden önce sebebini
 * anlatmak gerekiyor, ama her açılışta sormak da taciz olur: ne zaman
 * sorulacağı burada, saf fonksiyonda.
 *
 * Reddedilirse uygulama çalışmaya devam eder — bildirimler yine gelir, sadece
 * saati kayabilir. Bu yüzden akış hiçbir yerde zorlayıcı değil.
 */

const STORAGE_KEY = 'zikirmatik_exact_alarm_prompt_v1';

/** İki soru arası asgari gün — reddeden kullanıcı bir ay rahat bırakılır. */
export const MIN_DAYS_BETWEEN_PROMPTS = 30;
/**
 * Toplam soru üst sınırı. İki kez reddeden biri kararını vermiştir; üçüncüde
 * ısrar etmek uygulamayı ayar dilenen bir şeye çevirir.
 */
export const MAX_PROMPTS = 2;

const DAY_MS = 86400000;

/** @typedef {{ count: number, lastPromptedAt: number|null }} ExactAlarmPromptState */

/** @returns {ExactAlarmPromptState} */
export function normalizeExactAlarmPromptState(raw) {
    const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const count = Number(o.count);
    const lastPromptedAt = Number(o.lastPromptedAt);
    return {
        count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 0,
        lastPromptedAt: Number.isFinite(lastPromptedAt) && lastPromptedAt > 0 ? lastPromptedAt : null
    };
}

/**
 * İzin ekranına yönlendirmeyi önerelim mi? (saf — I/O yok)
 *
 * @param {{
 *   state: ExactAlarmPromptState,
 *   reminderEnabled: boolean,
 *   exactState: 'granted'|'denied'|'unsupported',
 *   now: number
 * }} ctx
 * @returns {boolean}
 */
export function shouldPromptForExactAlarm({ state, reminderEnabled, exactState, now }) {
    // Hatırlatıcı kapalıyken izin istemek anlamsız: kullanıcı bu özelliği
    // kullanmıyor, izin de yalnızca bu özellik için.
    if (!reminderEnabled) return false;

    // 'unsupported' = Android 12 öncesi ya da iOS: alarmlar zaten tam zamanlı,
    // istenecek bir izin yok.
    if (exactState !== 'denied') return false;

    const s = normalizeExactAlarmPromptState(state);
    if (s.count >= MAX_PROMPTS) return false;
    if (s.lastPromptedAt != null && now - s.lastPromptedAt < MIN_DAYS_BETWEEN_PROMPTS * DAY_MS) return false;

    return true;
}

/** Sorduktan sonraki yeni durum (saf — çağıran kaydeder). */
export function markExactAlarmPrompted(state, now) {
    const s = normalizeExactAlarmPromptState(state);
    return { count: s.count + 1, lastPromptedAt: now };
}

export function readExactAlarmPromptState() {
    try {
        return normalizeExactAlarmPromptState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch {
        return normalizeExactAlarmPromptState(null);
    }
}

export function writeExactAlarmPromptState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* kota / gizli mod */
    }
}

/**
 * Uygulama içi puanlama (Google Play In-App Review / iOS SKStoreReviewController).
 *
 * Google'ın kuralı: bu akış **butonla** tetiklenmemeli. Kota nedeniyle pencere
 * hiç açılmayabilir; "Bizi oylayın" diyen kullanıcı hiçbir şey görmeyince
 * kafası karışır. Bu yüzden:
 *   - Ayarlardaki "Bizi oylayın" → doğrudan mağaza sayfası (openPlayStore)
 *   - Bu modül → uygulama içinde doğal bir başarı anında (zikir hedefi tamamlandı)
 *
 * Politika saf fonksiyonda (shouldRequestReview) tutulur; test edilebilir.
 */

const STORAGE_KEY = 'zikirmatik_review_state_v1';

/** Kurulumdan sonra en az bu kadar gün geçmeden istenmez. */
export const MIN_DAYS_SINCE_INSTALL = 3;
/** Kullanıcı en az bu kadar tur tamamlamadan istenmez. */
export const MIN_COMPLETED_ROUNDS = 5;
/**
 * İki istek arası asgari gün.
 * Asıl spam freni Google'ın kotası; bu sayı yalnızca "Google'a ne sıklıkta
 * soralım"ı belirler. API pencerenin gerçekten açıldığını bildirmediği için
 * (kota yüzünden sessizce yutulmuş olabilir) fazla uzun tutmak fırsatı yakar.
 */
export const MIN_DAYS_BETWEEN_ASKS = 60;

const DAY_MS = 86400000;

/** @typedef {{ rounds: number, lastAskedAt: number|null }} ReviewState */

/** @returns {ReviewState} */
export function normalizeReviewState(raw) {
    const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const rounds = Number(o.rounds);
    const lastAskedAt = Number(o.lastAskedAt);
    return {
        rounds: Number.isFinite(rounds) && rounds > 0 ? Math.floor(rounds) : 0,
        lastAskedAt: Number.isFinite(lastAskedAt) && lastAskedAt > 0 ? lastAskedAt : null
    };
}

/**
 * Puanlama penceresi istenmeli mi? (saf — I/O yok)
 * @param {{ state: ReviewState, installedAt: string|null, now: number, isFirstSession: boolean }} ctx
 * @returns {boolean}
 */
export function shouldRequestReview({ state, installedAt, now, isFirstSession }) {
    if (isFirstSession) return false;

    const s = normalizeReviewState(state);
    if (s.rounds < MIN_COMPLETED_ROUNDS) return false;

    // Kurulum tarihi "YYYY-MM-DD"; okunamıyorsa güvenli tarafta kal (isteme).
    if (!installedAt) return false;
    const installMs = Date.parse(`${installedAt}T00:00:00`);
    if (!Number.isFinite(installMs)) return false;
    if (now - installMs < MIN_DAYS_SINCE_INSTALL * DAY_MS) return false;

    if (s.lastAskedAt != null && now - s.lastAskedAt < MIN_DAYS_BETWEEN_ASKS * DAY_MS) return false;

    return true;
}

function readState() {
    try {
        return normalizeReviewState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch {
        return normalizeReviewState(null);
    }
}

function writeState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* kota / gizli mod */
    }
}

/** Tamamlanan tur sayacını artırır (hedefe ulaşıldığında çağrılır). */
export function recordCompletedRound() {
    const s = readState();
    s.rounds += 1;
    writeState(s);
    return s.rounds;
}

/**
 * Uygun anda uygulama içi puanlama penceresini açar.
 * Sessizdir: kota/başarısızlık durumunda kullanıcıya hiçbir şey gösterilmez.
 * @param {{ installedAt: string|null, isFirstSession?: boolean, isNative: boolean }} opts
 * @returns {Promise<boolean>} istek yapıldıysa true
 */
export async function maybeRequestAppReview({ installedAt, isFirstSession = false, isNative }) {
    if (!isNative) return false;

    const state = readState();
    if (!shouldRequestReview({ state, installedAt, now: Date.now(), isFirstSession })) return false;

    try {
        const { InAppReview } = await import('@capacitor-community/in-app-review');
        // Not: API sonucu bildirmez (kullanıcı puanladı mı bilinmez) — bu normaldir.
        await InAppReview.requestReview();
        writeState({ ...state, lastAskedAt: Date.now() });
        return true;
    } catch (err) {
        console.warn('in-app review', err);
        // Başarısızsa da işaretle: her turda tekrar denemeyelim.
        writeState({ ...state, lastAskedAt: Date.now() });
        return false;
    }
}

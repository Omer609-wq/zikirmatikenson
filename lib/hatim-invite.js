/**
 * Hatim daveti — paylaş düğmesinin gönderdiği düz metin.
 *
 * WhatsApp, Telegram, SMS, not defteri: hepsi düz metin aldığı için mesaj
 * satırlardan kuruluyor, biçimlendirme yok. Metinlerin kendisi çağırandan
 * (locale) gelir; burada yalnız dizilim ve mağaza bağlantıları var.
 */

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.omerzikirmatik.app';

/**
 * iOS yayına girince doldurulur: https://apps.apple.com/app/id<Apple ID>
 * (App Store Connect → uygulama → App Information → Apple ID, 10 hane.)
 * Boş kaldığı sürece davette iPhone satırı çıkmaz — yayında olmayan bir
 * bağlantı paylaşmak, hiç bağlantı paylaşmamaktan kötü.
 */
export const APP_STORE_URL = '';

/**
 * @param {object} p
 * @param {string} p.invite      "… hatmine katıl" cümlesi
 * @param {string} p.codeLine    "Katılma kodu: ABC123"
 * @param {string} p.androidLabel
 * @param {string} p.iosLabel
 * @param {string} [p.playUrl]
 * @param {string} [p.appStoreUrl]
 * @returns {string} Boş parçalar atılmış, bloklar arası tek boş satır.
 */
export function buildHatimInvite({
    invite,
    codeLine,
    androidLabel,
    iosLabel,
    playUrl = PLAY_STORE_URL,
    appStoreUrl = APP_STORE_URL
}) {
    const links = [];
    if (playUrl) links.push(`${androidLabel}: ${playUrl}`);
    if (appStoreUrl) links.push(`${iosLabel}: ${appStoreUrl}`);
    return [invite, codeLine, links.join('\n')]
        .map((block) => String(block || '').trim())
        .filter(Boolean)
        .join('\n\n');
}

/** Kullanıcı paylaşım sayfasını kapattı mı? Kapattıysa panoya kopyalamak yersiz olur. */
export function isShareCancelled(err) {
    if (err?.name === 'AbortError') return true; // Web Share
    const msg = String(err?.message || err || '').toLowerCase();
    return msg.includes('cancel') || msg.includes('abort') || msg.includes('dismiss');
}

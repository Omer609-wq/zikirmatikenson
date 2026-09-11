/**
 * Kur'an okuyucusu: yeniden çizimden sonra "nereye inilsin?" kararları (saf).
 *
 * Okuyucu birçok yoldan yeniden çiziliyor — meal, okuma modu, dil, düzen (liste
 * ↔ mushaf), sure açma, sure atlama okları, Geri ile dönüş. Her yol kendi
 * kararını kodun içinde verdiği için tek tek kayıyordu: meal değişince başka
 * ayete, oklarla atladıktan sonra başka sureye, mushaf'tan dönünce Fatiha'ya
 * iniliyordu. Kararlar burada; quran.js / app.js yalnızca uyguluyor.
 */

const isSurah = (n) => Number.isFinite(n) && n >= 1 && n <= 114;
const isAyah = (n) => Number.isFinite(n) && n >= 1;

/**
 * Okunan sure: ekranda görünen varsa o, yoksa uygulama durumundaki.
 *
 * Sure atlama okları ve kaydırma showView çağırmaz, yalnızca kaydırır; uygulama
 * durumu açılıştaki surede kalır. Meal/mod/düzen değişimi o eski sureyle çizerse
 * kullanıcı atladığı sureden fırlatılır.
 *
 * @param {unknown} currentId
 * @param {unknown} visibleId
 * @returns {number} 1..114
 */
export function resolveQuranReaderSurahId(currentId, visibleId) {
    const v = Number(visibleId);
    if (isSurah(v)) return Math.trunc(v);
    const c = Number(currentId);
    if (isSurah(c)) return Math.trunc(c);
    return 1;
}

/**
 * Liste düzeninde yeniden çizim bitince konum nasıl geri gelsin?
 *
 *   'ayah'   : açıkça bir ayet istendi (ayete git, arama sonucu)
 *   'surah'  : sure açıldı (listeden / sure numarasıyla) → surenin başı
 *   'anchor' : yerinde yeniden çizim → ekrandaki ayete dön
 *   'pixel'  : çapa alınamadı ama eski kaydırma var → yedek
 *
 * Piksel son çare: meal değişince ayet blok yükseklikleri değişir ve aynı piksel
 * başka ayete denk gelir. Kayma mesafeyle büyür — 19 ayet yukarıda 1 ayet, sure
 * 5'te iki sure öteye atıyordu.
 *
 * @param {{
 *   scrollAyah?: unknown,
 *   forceSurahStart?: boolean,
 *   savedAnchor?: { surah?: unknown, ayah?: unknown } | null,
 *   savedReaderScrollTop?: number | null
 * }} opts
 * @returns {'ayah'|'surah'|'anchor'|'pixel'}
 */
export function resolveScrollPlaceRestore({
    scrollAyah = null,
    forceSurahStart = false,
    savedAnchor = null,
    savedReaderScrollTop = null
} = {}) {
    if (scrollAyah != null && isAyah(Number(scrollAyah))) return 'ayah';
    if (forceSurahStart) return 'surah';
    if (savedAnchor && isSurah(Number(savedAnchor.surah)) && isAyah(Number(savedAnchor.ayah))) {
        return 'anchor';
    }
    if (savedReaderScrollTop != null && savedReaderScrollTop > 0) return 'pixel';
    return 'surah';
}

/**
 * Listeden mushaf'a geçerken hedef: ekranda okunan ayet. Mushaf o ayetin
 * sayfasını açar. Yoksa null (çağıran surenin başına düşer).
 *
 * @param {{ surah?: unknown, ayah?: unknown } | null | undefined} anchor
 * @returns {{ surah: number, ayah: number } | null}
 */
export function resolveMushafTargetEnteringFromList(anchor) {
    const s = Number(anchor?.surah);
    const a = Number(anchor?.ayah);
    if (!isSurah(s) || !isAyah(a)) return null;
    return { surah: Math.trunc(s), ayah: Math.trunc(a) };
}

/**
 * Mushaf'tan listeye geçerken hedef: açık sayfanın ilk ayeti. Sayfa bilinmiyorsa
 * okunan surenin başı. (Eskiden sabit olarak Fatiha 1'e dönülüyordu.)
 *
 * @param {{ s: number, a: number } | null | undefined} pageStart getPageStartAyah sonucu
 * @param {unknown} fallbackSurahId
 * @returns {{ surah: number, ayah: number }}
 */
export function resolveScrollTargetLeavingMushaf(pageStart, fallbackSurahId = 1) {
    if (pageStart && isSurah(Number(pageStart.s)) && isAyah(Number(pageStart.a))) {
        return { surah: Number(pageStart.s), ayah: Number(pageStart.a) };
    }
    const f = Number(fallbackSurahId);
    return { surah: isSurah(f) ? Math.trunc(f) : 1, ayah: 1 };
}

/**
 * Mushaf'ta yerinde yeniden çizim (meal / okuma modu / dil) için sayfa tercihi.
 *
 * `preferSaved` yalnızca "kaldığım sayfa" açıkken anlamlı. Kapalıyken kayıtlı
 * sayfa hiç güncellenmiyor (varsayılan 1) ve meal değişince sayfa 1'e atıyordu.
 * Boş seçenek, çözümleyicinin "açık sayfada kal" dalına düşer.
 *
 * @param {string} readerLayout
 * @param {boolean} rememberPage
 */
export function getMushafNavOptsForRerender(readerLayout, rememberPage) {
    if (readerLayout !== 'mushaf') return {};
    return rememberPage ? { preferSaved: true } : {};
}

/**
 * Sure açılışı (listeden, sure numarasıyla; belirli ayet yok) için seçenekler.
 *
 * Listede eski kaydırmayı geri yüklemek açılan sureyi ezer — okuyucunun içinden
 * başka sureye geçince kullanıcı olduğu yerde kalıyordu. Mushaf'ta mevcut
 * davranış korunur ("kaldığım sayfa" açıksa oradan devam).
 *
 * @param {{ scrollAyah?: unknown, readerLayout: string, rememberPage: boolean }} opts
 */
export function getNavOptsForSurahOpen({ scrollAyah = null, readerLayout, rememberPage }) {
    if (scrollAyah != null && isAyah(Number(scrollAyah))) return {};
    if (readerLayout === 'mushaf') return rememberPage ? { preferSaved: true } : {};
    return { forceSurahStart: true };
}

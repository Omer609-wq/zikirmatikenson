/**
 * Uygulama içi overlay'lerin tek listesi.
 *
 * Eskiden iki ayrı elle yazılmış liste vardı — closeAllOverlays() (popstate'te
 * her şeyi kapatır) ve IN_APP_BACK_OVERLAY_IDS (Android Geri tuşu hangi overlay'i
 * kapatacağını buradan bulur). Yeni overlay eklendikçe biri güncellenip diğeri
 * unutuldu; Geri'ye basınca ekranda takılı kalan overlay'lerin (Kuran arama
 * rehberi, görünüm ayarı, hatim cüzü, akıllı hatırlatıcı düzenleme) hepsi bu
 * kaymadan çıktı. İkisi de artık buradan okuyor; overlay-registry.test.js
 * index.html'deki her overlay'in burada ya da SELF_MANAGED'de olmasını şart koşar.
 *
 * SIRA ÖNEMLİ: Geri tuşu listede ilk bulduğu AÇIK overlay'i kapatır. Üst üste
 * açılabilenlerde üstteki önce gelmeli (onay diyaloğu her şeyin üstünde; klasör
 * seçimi kütüphane detayının üstünde; premium teklifi zikir istatistiğinin
 * üstünde — kilitli sekmeye dokununca açılıyor).
 */
export const IN_APP_OVERLAY_IDS = Object.freeze([
    'appDialogOverlay',
    'premiumUpsellOverlay',
    'copyModalOverlay',
    'editModalOverlay',
    'addModalOverlay',
    'trashOverlay',
    'libraryFolderSelectOverlay',
    'libraryDetailOverlay',
    'zikirStatsOverlay',
    'specialDaysOverlay',
    'smartReminderEditOverlay',
    'reviseQuranDisplayOverlay',
    'hatimJuzOverlay',
    'hatimMembersOverlay',
    'quranSearchGuideOverlay'
]);

/**
 * Kapanışı kendi modülünde yan etki çalıştıran overlay'ler. app.js bunları
 * yalnızca 'active' sınıfını silerek kapatırsa o adımlar atlanır; bu yüzden
 * ortak listeye girmezler.
 */
export const SELF_MANAGED_OVERLAY_IDS = Object.freeze({
    // Kapanırken spot ışığı animasyonunu durdurur ve onDismiss'i çağırır (update-banner.js).
    updateBannerDetailOverlay: 'update-banner.js',
    // Bilinçli kapanışta "görüldü" işaretler; closeAllOverlays ayrıca
    // closeLocaleWelcomeIfOpen() çağırır (lib/locale-welcome.js).
    localeWelcomeOverlay: 'lib/locale-welcome.js'
});

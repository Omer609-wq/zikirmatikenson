/**
 * Asenkron görevleri tek sıraya dizer: aynı anda yalnızca biri çalışır (FIFO).
 * Sonraki çağrılar öncekinin bitmesini bekler; bir görevin hata vermesi sırayı
 * bozmaz.
 *
 * Neden: bildirim senkronu "iptal et → izni bekle → kur" adımlarından oluşuyor
 * ve adımlar arasında await var. İki çağrı üst üste gelirse araya girebilirler:
 *
 *   A (aç)   : iptal ── izin bekleniyor ─────────────── kur  ← kapalıyken kuruldu
 *   B (kapat):        iptal ── bitti
 *
 * Kullanıcı hatırlatıcıyı kapattığı halde alarmlar kurulu kalır. Sıraya dizince
 * B, A bitene kadar başlamaz ve son niyet her zaman kazanır.
 */
export function createAsyncSerial() {
    let chain = Promise.resolve();
    return function enqueue(task) {
        const run = chain.then(() => task());
        // Zincir hata yüzünden kopmasın; hatayı yalnızca çağıran görsün.
        chain = run.then(
            () => {},
            () => {}
        );
        return run;
    };
}

/**
 * Bilinen (uygulama kaynaklı) bir metinle birebir eşleşen veya onunla başlayan
 * kullanıcı metinlerini kanona günceller.
 *
 * Kullanıcı metne sonradan not eklediyse (ör. "Eski Anlam - her gün 100 kere"):
 * Eski hatalı metin öneki kanon metinle değiştirilir, kullanıcının eklediği son ek
 * (not/niyet) korunur.
 *
 * Kullanıcının sıfırdan yazdığı (bilinen bir metinle başlamayan) özel metinlere
 * dokunulmaz (null döner).
 *
 * Her açılışta yeniden çalışır; bir kez güncellenen metin bir daha değişmemeli.
 * Düzeltmelerin çoğu eski metni tamamlar (eski metin yeninin önekidir). Kanon aday
 * listesinde olmasaydı "kanon + not" kaydı eski önekle yine eşleşir ve kanonun devamı
 * her açılışta bir kez daha eklenirdi. Bu yüzden kanon da aday: en uzun eşleşen önek
 * kanonsa metin zaten günceldir.
 *
 * @param {string} curText Kullanıcının kaydındaki mevcut metin
 * @param {Set<string> | Iterable<string>} knownTexts Bilinen metinler kümesi (kanon + prev)
 * @param {string} canonicalText Güncellenecek hedef kanon metin
 * @returns {string | null} Değişiklik varsa yeni metin, yoksa null
 */
export function migrateKnownTextPrefix(curText, knownTexts, canonicalText) {
    const cur = String(curText ?? '').trim();
    const canon = String(canonicalText ?? '').trim();
    if (!cur || !canon || cur === canon) return null;

    // En uzunu önce: iç içe geçen metinlerde en özgül olan eşleşsin.
    const candidates = [...new Set([...(knownTexts || []), canon].map((t) => String(t ?? '').trim()))]
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

    const match = longestKnownPrefix(cur, candidates);
    if (!match || match === canon) return null;

    const next = (canon + cur.slice(match.length)).trim();
    // Döngü koruması: sonuç bir sonraki açılışta kanonla eşleşmeli, yoksa dokunma.
    return longestKnownPrefix(next, candidates) === canon ? next : null;
}

/** Kelime ortasından eşleşmeyi engelle; ek boşluk, noktalama veya parantezle başlamalı. */
const NOTE_SEPARATOR = /[\s\-_:;,.(/[{]/;

function longestKnownPrefix(text, candidates) {
    for (const known of candidates) {
        if (!text.startsWith(known)) continue;
        const firstChar = text.charAt(known.length);
        if (!firstChar || NOTE_SEPARATOR.test(firstChar)) return known;
    }
    return null;
}

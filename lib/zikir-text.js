import { coerceMultilineString, coerceString } from './coerce.js';

/**
 * Zikir metin alanlarının üst sınırları. Form (maxLength) ve kayıt (sanitizeLoadedData)
 * aynı değeri kullanır: eskiden formda sınır yoktu, kabul edilen metin yeniden açılışta
 * sessizce kesiliyordu.
 *
 * Ad: kütüphane okunuşları 348 karaktere kadar çıkıyor (tesbihat istiğfarının Arapçası).
 * Arapça ve anlam: üç ayetlik Kur'an zikri en uzun hâlinde ~2.550 (Arapça) ve ~6.800
 * (meal + okunuş) karakter; eski 1.200/1.600 sınırları uygulamanın kendi metnini kesiyordu.
 */
export const ZIKIR_TEXT_MAX = Object.freeze({
    name: 400,
    arabic: 3000,
    meaning: 8000,
    fazilet: 2000
});

export const FOLDER_NAME_MAX = 60;
export const ZIKIR_TARGET_MAX = 1000000;

/**
 * Zikir metnini kayıttaki biçimine getirir: ad tek satır; Arapça, not ve fazilette
 * satır sonları kalır. Form da bunu kullanır — ekranda görünen, yeniden açılışta gelenle aynı.
 * @param {'name'|'arabic'|'meaning'|'fazilet'} field
 */
export function normalizeZikirText(field, value) {
    const max = ZIKIR_TEXT_MAX[field];
    return field === 'name' ? coerceString(value, max) : coerceMultilineString(value, max);
}

export function normalizeFolderName(value) {
    return coerceString(value, FOLDER_NAME_MAX);
}

/**
 * Desteklenen dillerin rakamları → Latin rakam: Arapça (٠-٩), Urduca/Farsça (۰-۹),
 * Bengalce (০-৯). Bu dillerin klavyesi kendi rakamını yazar; sayı alanları yalnız
 * 0-9 tanıdığı için geçerli "١" (1) reddediliyordu.
 */
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x09e6];

export function toLatinDigits(text) {
    return String(text ?? '').replace(/[٠-٩۰-۹০-৯]/g, (ch) => {
        const code = ch.charCodeAt(0);
        const zero = DIGIT_ZEROS.find((z) => code >= z && code <= z + 9);
        return String(code - zero);
    });
}

/**
 * Yalnız rakamdan oluşan tam sayı (yerel rakamlar dahil); değilse NaN.
 * `Number()` "1.5", "1e2" ve " 0x1 " gibi girdileri sayı sayıyordu: var olmayan
 * ayet 1.5 kabul ediliyordu.
 */
export function parseWholeNumber(text) {
    const s = toLatinDigits(text).trim();
    return /^\d+$/.test(s) ? Number(s) : NaN;
}

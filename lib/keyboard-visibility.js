/**
 * Yazılım klavyesi açıkken <html>'e `keyboard-open` sınıfı koyar.
 *
 * Android pencereyi klavyeye göre küçültüyor; ekranın altına yapışık sekme
 * çubuğu klavyenin üstüne çıkıp Keşfet/Kur'an aramasında sonuçları kapatıyordu.
 * Klavye için eklenti yok: görünür yükseklik, aynı genişlikte görülen en büyük
 * yükseklikten belirgin kısaysa VE bir yazı alanı odaktaysa klavye açık sayılır.
 * Odak şartı bölünmüş ekran gibi klavyesiz küçülmeleri eler; yükseklik şartı da
 * odak yazı alanında kalıp klavye Geri ile indirildiğinde çubuğu geri getirir.
 */

/** Klavye sayılacak en az daralma (px); adres çubuğu oynaması bunun altında kalır. */
const KEYBOARD_MIN_SHRINK_PX = 120;

const NON_TEXT_INPUT_TYPES = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit'
]);

export function isTextEntryElement(el) {
    if (!el || el.disabled || el.readOnly) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    return !NON_TEXT_INPUT_TYPES.has(String(el.getAttribute('type') || 'text').toLowerCase());
}

/** Yakınlaştırmadan bağımsız görünür yükseklik. */
function viewportHeight() {
    const vv = window.visualViewport;
    return vv ? vv.height * (vv.scale || 1) : window.innerHeight;
}

/**
 * @param {number} maxHeight Bu genişlikte görülen en büyük yükseklik
 * @param {number} height Şu anki yükseklik
 */
export function isKeyboardShrink(maxHeight, height) {
    return maxHeight - height > Math.max(KEYBOARD_MIN_SHRINK_PX, maxHeight * 0.15);
}

let initialized = false;

export function initKeyboardVisibilityClass(root = document.documentElement) {
    if (initialized) return;
    initialized = true;
    // Döndürünce yükseklik değişir; tabanı genişliğe göre ayrı tut.
    const maxHeightByWidth = new Map();
    const update = () => {
        const width = window.innerWidth;
        const height = viewportHeight();
        const max = Math.max(maxHeightByWidth.get(width) || 0, height);
        maxHeightByWidth.set(width, max);
        const open = isKeyboardShrink(max, height) && isTextEntryElement(document.activeElement);
        root.classList.toggle('keyboard-open', open);
    };
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    // Odak bir alandan ötekine geçerken arada body'ye düşer; yerine oturunca bak.
    document.addEventListener('focusout', () => setTimeout(update, 0));
    update();
}

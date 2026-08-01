/**
 * Kütüphane metin düzeltmeleri (anlam / meal / bağlam / fazilet) — public/library-overrides.json
 * jsDelivr CDN üzerinden sunulur (kaynak: GitHub @main); `git push` ile güncellenir,
 * mağaza güncellemesi gerekmez. Yalnızca metin değişir, yeni madde eklenmez.
 * Acil purge:
 * https://purge.jsdelivr.net/gh/Omer609-wq/zikirmatikenson@main/public/library-overrides.json
 *
 * Şema, `prev` alanı ve editoryal notlar: lib/library-overrides.js + docs/I18N.md
 */
import { Capacitor } from '@capacitor/core';
import { normalizeLibraryOverrides } from './lib/library-overrides.js';
import { setLibraryOverrides } from './i18n.js';

export const LIBRARY_OVERRIDES_URL =
    'https://cdn.jsdelivr.net/gh/Omer609-wq/zikirmatikenson@main/public/library-overrides.json';

const LIBRARY_OVERRIDES_CACHE_KEY = 'zikirmatik_library_overrides_cache';

/** Uygulanmış yamanın imzası; her açılış/dönüşte gereksiz yeniden senkronu önler. */
let appliedSignature = '';

/** @returns {boolean} görünen metin değişmiş olabilir (yeniden senkron gerekir). */
function applyNormalized(normalized) {
    const signature = normalized ? JSON.stringify(normalized) : '';
    if (signature === appliedSignature) return false;
    appliedSignature = signature;
    setLibraryOverrides(normalized);
    return true;
}

function writeCache(raw) {
    try {
        localStorage.setItem(LIBRARY_OVERRIDES_CACHE_KEY, JSON.stringify(raw));
    } catch {
        /* quota / private mode */
    }
}

function clearCache() {
    try {
        localStorage.removeItem(LIBRARY_OVERRIDES_CACHE_KEY);
    } catch {
        /* private mode */
    }
}

/** Açılışta, ağ beklemeden: son indirilen düzeltmeleri önbellekten uygula. */
export function applyCachedLibraryOverrides() {
    try {
        const raw = localStorage.getItem(LIBRARY_OVERRIDES_CACHE_KEY);
        if (!raw) return false;
        return applyNormalized(normalizeLibraryOverrides(JSON.parse(raw)));
    } catch {
        return false;
    }
}

/**
 * CDN'den düzeltmeleri çek; başarısızsa önbellek/gömülü metinler kalır.
 * CDN'den geçerli ama boş (`items: {}`) dosya gelirse düzeltmeler geri alınır —
 * yanlış bir düzeltmeyi yayından kaldırmanın yolu budur (eski metni `prev`'e taşı).
 * @returns {Promise<boolean>} uygulanan yama değiştiyse true.
 */
export async function refreshLibraryOverrides() {
    const urls = [{ url: `${LIBRARY_OVERRIDES_URL}?t=${Date.now()}`, remote: true }];
    if (Capacitor.isNativePlatform()) {
        // Paketle gelen kopya: ilk kurulumda çevrimdışıyken bile build anındaki düzeltmeler.
        urls.push({ url: `./library-overrides.json?t=${Date.now()}`, remote: false });
    }

    for (const { url, remote } of urls) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const raw = await res.json();
            const normalized = normalizeLibraryOverrides(raw);
            if (normalized) {
                writeCache(raw);
                return applyNormalized(normalized);
            }
            // Boş/kullanılamaz dosya: yalnızca CDN yetkili. Paketli kopya eskidir,
            // ağ yokken geçerli önbelleği silmemeli.
            if (remote && raw && typeof raw === 'object' && !Array.isArray(raw) && raw.items) {
                clearCache();
                return applyNormalized(null);
            }
        } catch (e) {
            console.warn('library-overrides fetch', url, e);
        }
    }
    return false;
}

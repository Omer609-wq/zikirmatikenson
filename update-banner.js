/**
 * Güncelleme duyurusu (ana ekran / Klasörlerim).
 * Görünüm: style.css → .update-banner--teaser (altın kart, nabız, dokununca modal).
 * İçerik: public/update-banner.json (latestVersionCode, title, message).
 * jsDelivr CDN üzerinden sunulur (kaynak: GitHub @main); git push ile güncellenir.
 * Acil purge: https://purge.jsdelivr.net/gh/Omer609-wq/zikirmatikenson@main/public/update-banner.json
 * Test: `debug-flags.json` içinden `updateBannerPreview: true`.
 */
import { Capacitor } from '@capacitor/core';
import { getRuntimeFlags, loadRuntimeFlags } from './lib/runtime-flags.js';

export const UPDATE_BANNER_CONFIG_URL =
    'https://cdn.jsdelivr.net/gh/Omer609-wq/zikirmatikenson@main/public/update-banner.json';

export const UPDATE_BANNER_DISABLED = true;

const DISMISS_STORAGE_KEY = 'zikirmatik_dismissed_update_banners';
const REMOTE_CONFIG_CACHE_KEY = 'zikirmatik_update_banner_config_cache';
const DEFAULT_PLAY_STORE =
    'https://play.google.com/store/apps/details?id=com.omerzikirmatik.app';
const PLAY_STORE_APP_ID = 'com.omerzikirmatik.app';
export const UPDATE_BANNER_INLINE_FOLDER_THRESHOLD = 3;

/** Uzak JSON'dan gelen playStoreUrl — yalnızca bu uygulamanın Play Store sayfası kabul edilir. */
export function sanitizePlayStoreUrl(url, fallback = DEFAULT_PLAY_STORE) {
    const safeFallback = fallback || DEFAULT_PLAY_STORE;
    const raw = String(url || '').trim();
    if (!raw) return safeFallback;
    try {
        const parsed = new URL(raw);
        if (parsed.protocol !== 'https:') return safeFallback;
        if (parsed.hostname !== 'play.google.com') return safeFallback;
        if (!parsed.pathname.startsWith('/store/apps/details')) return safeFallback;
        if (parsed.searchParams.get('id') !== PLAY_STORE_APP_ID) return safeFallback;
        return parsed.toString();
    } catch {
        return safeFallback;
    }
}

const PREVIEW_PAYLOAD = {
    id: 'onizleme-android-studio',
    title: 'Yeni sürüm mevcut',
    message:
        '• Güncelleme kutusu tasarımı\n' +
        '• Dokununca yenilikler ve butonlar\n' +
        '• Nabız animasyonu (önizleme)',
    playStoreUrl: DEFAULT_PLAY_STORE
};

let cachedPayload = null;
let installedVersionCode = 0;
let detailOverlayWired = false;
let detailOnDismiss = null;
let spotlightStartTimer = null;

function readDismissedIds() {
    try {
        const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
        return [];
    }
}

function dismissBannerId(id) {
    if (!id) return;
    const list = readDismissedIds();
    if (list.includes(id)) return;
    list.push(id);
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(list));
}

function readRemoteConfigCache() {
    try {
        const raw = localStorage.getItem(REMOTE_CONFIG_CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data && typeof data === 'object' ? data : null;
    } catch {
        return null;
    }
}

function writeRemoteConfigCache(data) {
    if (!data || typeof data !== 'object') return;
    localStorage.setItem(REMOTE_CONFIG_CACHE_KEY, JSON.stringify(data));
}

function clearRemoteConfigCache() {
    localStorage.removeItem(REMOTE_CONFIG_CACHE_KEY);
}

function applyRemoteConfig(raw, installed) {
    cachedPayload = buildPayloadFromRemote(raw, installed);
    if (cachedPayload) return cachedPayload;

    const latest = parseInt(String(raw?.latestVersionCode ?? ''), 10);
    if (!raw?.active || (Number.isFinite(latest) && installed >= latest)) {
        clearRemoteConfigCache();
    }
    return null;
}

async function readInstalledVersionCode() {
    try {
        const { App } = await import('@capacitor/app');
        const info = await App.getInfo();
        const build = parseInt(String(info.build ?? ''), 10);
        if (Number.isFinite(build) && build >= 0) return build;
    } catch (e) {
        console.warn('update-banner version', e);
    }
    return 0;
}

function buildPayloadFromRemote(raw, installed) {
    if (!raw || typeof raw !== 'object' || !raw.active) return null;

    const latest = parseInt(String(raw.latestVersionCode ?? ''), 10);
    if (!Number.isFinite(latest) || latest < 1) return null;
    if (installed >= latest) return null;

    const id = String(raw.id || `release-${latest}`).trim();
    if (!id) return null;

    return {
        id,
        title: String(raw.title || 'Yeni sürüm mevcut').trim(),
        message: String(raw.message || '').trim(),
        playStoreUrl: sanitizePlayStoreUrl(raw.playStoreUrl)
    };
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function getUpdateBannerPayload() {
    return cachedPayload;
}

export function getInstalledAppVersionCode() {
    return installedVersionCode;
}

export function shouldShowUpdateBanner() {
    const p = cachedPayload;
    if (!p) return false;
    if (getRuntimeFlags().updateBannerPreview) return true;
    return !readDismissedIds().includes(p.id);
}

export async function refreshUpdateBannerConfig() {
    cachedPayload = null;
    if (UPDATE_BANNER_DISABLED) return null;
    await loadRuntimeFlags();

    installedVersionCode = await readInstalledVersionCode();

    if (getRuntimeFlags().updateBannerPreview) {
        cachedPayload = { ...PREVIEW_PAYLOAD };
        return cachedPayload;
    }

    const urls = [];
    if (UPDATE_BANNER_CONFIG_URL) {
        urls.push(`${UPDATE_BANNER_CONFIG_URL}?t=${Date.now()}`);
    }
    if (Capacitor.isNativePlatform()) {
        urls.push(`./update-banner.json?t=${Date.now()}`);
    }

    for (const url of urls) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const raw = await res.json();
            if (raw && typeof raw === 'object') {
                if (raw.active === false) {
                    clearRemoteConfigCache();
                    cachedPayload = null;
                    return null;
                }
                writeRemoteConfigCache(raw);
            }
            const payload = applyRemoteConfig(raw, installedVersionCode);
            if (payload) return payload;
            if (raw?.active) return null;
        } catch (e) {
            console.warn('update-banner fetch', url, e);
        }
    }

    const saved = readRemoteConfigCache();
    if (saved) return applyRemoteConfig(saved, installedVersionCode);

    return null;
}

export function openPlayStore(url) {
    const target = sanitizePlayStoreUrl(url);
    if (Capacitor.isNativePlatform()) {
        window.open(target, '_system');
        return;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
}

function formatMessageHtml(message) {
    const lines = String(message || '')
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (!lines.length) return '';
    return lines.map((line) => `<p class="update-banner__line">${escapeHtml(line)}</p>`).join('');
}

function ensureDetailOverlayWired() {
    if (detailOverlayWired) return;
    const overlay = document.getElementById('updateBannerDetailOverlay');
    const dismissBtn = document.getElementById('updateBannerDismissBtn');
    const updateBtn = document.getElementById('updateBannerUpdateBtn');
    if (!overlay || !dismissBtn || !updateBtn) return;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeUpdateBannerDetail();
    });

    dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = cachedPayload;
        if (p) dismissBannerId(p.id);
        closeUpdateBannerDetail();
        detailOnDismiss?.();
        detailOnDismiss = null;
    });

    updateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = cachedPayload;
        if (p) openPlayStore(p.playStoreUrl);
    });

    detailOverlayWired = true;
}

function openUpdateBannerDetail(opts = {}) {
    const p = cachedPayload;
    if (!p) return;

    ensureDetailOverlayWired();
    detailOnDismiss = opts.onDismiss ?? null;

    const overlay = document.getElementById('updateBannerDetailOverlay');
    const titleEl = document.getElementById('updateBannerDetailTitle');
    const msgEl = document.getElementById('updateBannerDetailMessage');
    if (!overlay || !titleEl || !msgEl) return;

    titleEl.textContent = p.title;
    msgEl.innerHTML = formatMessageHtml(p.message) || '<p class="update-banner__line">Yenilikleri görmek için mağazadan güncelleyebilirsiniz.</p>';

    overlay.classList.add('active');
    playUpdateBannerSpotlight();
}

function isBlackTheme() {
    return document.documentElement.getAttribute('data-theme') === 'black';
}

function positionUpdateBannerSpotlight() {
    const overlay = document.getElementById('updateBannerDetailOverlay');
    const modal = overlay?.querySelector('.update-banner-detail');
    if (!overlay || !modal) return;

    const measure = () => {
        const rect = modal.getBoundingClientRect();
        const end = Math.max(0, Math.ceil(rect.top));
        overlay.style.setProperty('--update-banner-spotlight-end', `${end}px`);
        const beamW = Math.min(rect.width + 24, window.innerWidth * 0.94);
        overlay.style.setProperty('--update-banner-spotlight-width', `${Math.ceil(beamW)}px`);
    };

    requestAnimationFrame(() => requestAnimationFrame(measure));
}

function playUpdateBannerSpotlight() {
    const overlay = document.getElementById('updateBannerDetailOverlay');
    const spotlight = overlay?.querySelector('.update-banner-spotlight');
    if (!overlay || !spotlight) return;

    clearTimeout(spotlightStartTimer);
    spotlightStartTimer = null;

    if (!isBlackTheme() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        spotlight.hidden = true;
        spotlight.classList.remove('update-banner-spotlight--play');
        return;
    }

    spotlight.hidden = false;
    spotlight.classList.remove('update-banner-spotlight--play');

    /* Modal translateY(0) animasyonu (~300ms) bitsin, ışık kutu üstüne otursun */
    spotlightStartTimer = setTimeout(() => {
        spotlightStartTimer = null;
        if (!overlay.classList.contains('active')) return;
        positionUpdateBannerSpotlight();
        void spotlight.offsetWidth;
        spotlight.classList.add('update-banner-spotlight--play');
    }, 300);
}

function stopUpdateBannerSpotlight() {
    clearTimeout(spotlightStartTimer);
    spotlightStartTimer = null;
    const overlay = document.getElementById('updateBannerDetailOverlay');
    const spotlight = overlay?.querySelector('.update-banner-spotlight');
    spotlight?.classList.remove('update-banner-spotlight--play');
    if (spotlight) spotlight.hidden = true;
}

function closeUpdateBannerDetail() {
    const overlay = document.getElementById('updateBannerDetailOverlay');
    overlay?.classList.remove('active');
    stopUpdateBannerSpotlight();
}

/**
 * Klasör kartı boyutunda özet; dokununca detay modalı açılır.
 * @param {{ onDismiss?: () => void }} opts
 */
export function createUpdateBannerElement(opts = {}) {
    const p = cachedPayload;
    if (!p) return null;

    const root = document.createElement('d' + 'iv');
    root.className = 'folder-card update-banner update-banner--teaser';
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');
    root.setAttribute('aria-label', `${p.title}. Yenilikleri görmek için dokunun.`);

    const icon = document.createElement('span');
    icon.className = 'update-banner__icon material-icons-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'system_update';

    const text = document.createElement('d' + 'iv');
    text.className = 'folder-card__text';

    const title = document.createElement('h3');
    title.textContent = p.title;

    const sub = document.createElement('p');
    sub.textContent = 'Yenilikler · dokunun';

    text.appendChild(title);
    text.appendChild(sub);
    root.appendChild(icon);
    root.appendChild(text);

    const openDetail = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openUpdateBannerDetail(opts);
    };

    root.addEventListener('click', openDetail);
    root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDetail(e);
        }
    });

    return root;
}

export function clearUpdateBannerDom(slotEl, gridEl) {
    closeUpdateBannerDetail();
    if (slotEl) {
        slotEl.innerHTML = '';
        slotEl.hidden = true;
    }
    if (gridEl) {
        gridEl.querySelectorAll('.update-banner').forEach((n) => n.remove());
    }
}

export function placeUpdateBanner(folderCount, folderGrid, slotEl, opts = {}) {
    clearUpdateBannerDom(slotEl, folderGrid);
    if (!shouldShowUpdateBanner() || !folderGrid || !slotEl) return;

    const el = createUpdateBannerElement(opts);
    if (!el) return;

    if (folderCount >= UPDATE_BANNER_INLINE_FOLDER_THRESHOLD) {
        const ref = folderGrid.children[1] || null;
        if (ref) folderGrid.insertBefore(el, ref);
        else folderGrid.appendChild(el);
        slotEl.hidden = true;
    } else {
        slotEl.hidden = false;
        slotEl.appendChild(el);
    }
}

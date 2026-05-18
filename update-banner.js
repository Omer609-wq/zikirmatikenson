/**
 * Güncelleme kutusu — Play yayınında GitHub update-banner.json güncellenir.
 * İlk açılışta internetle bir kez indirilir, telefona kaydedilir; sonra internetsiz de
 * aynı duyuru gösterilir. Yeni bir Play sürümü için JSON tekrar güncellenince
 * kullanıcının bir kez daha internete ihtiyacı olur (yeni duyuruyu almak için).
 */
import { Capacitor } from '@capacitor/core';

/** GitHub raw — her yayında yalnızca public/update-banner.json düzenle. */
export const UPDATE_BANNER_CONFIG_URL =
    'https://raw.githubusercontent.com/Omer609-wq/zikirmatikenson/main/public/update-banner.json';

/** true = özelliği tamamen kapat (acil durum). */
export const UPDATE_BANNER_DISABLED = false;

const DISMISS_STORAGE_KEY = 'zikirmatik_dismissed_update_banners';
const REMOTE_CONFIG_CACHE_KEY = 'zikirmatik_update_banner_config_cache';
const DEFAULT_PLAY_STORE =
    'https://play.google.com/store/apps/details?id=com.omerzikirmatik.app';
export const UPDATE_BANNER_INLINE_FOLDER_THRESHOLD = 3;

let cachedPayload = null;
let installedVersionCode = 0;

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

/**
 * @param {Record<string, unknown>} raw
 * @param {number} installed
 */
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
        playStoreUrl: String(raw.playStoreUrl || DEFAULT_PLAY_STORE).trim()
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
    return !readDismissedIds().includes(p.id);
}

/**
 * Telefonda kayıtlı duyuru varsa internetsiz kullanır.
 * Kayıt yoksa GitHub'dan bir kez indirir ve kaydeder.
 */
export async function refreshUpdateBannerConfig() {
    cachedPayload = null;
    if (UPDATE_BANNER_DISABLED) return null;

    installedVersionCode = await readInstalledVersionCode();

    const saved = readRemoteConfigCache();
    if (saved) {
        return applyRemoteConfig(saved, installedVersionCode);
    }

    const urls = [];
    if (UPDATE_BANNER_CONFIG_URL) urls.push(UPDATE_BANNER_CONFIG_URL);
    if (Capacitor.isNativePlatform()) {
        urls.push('./update-banner.json');
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
            return applyRemoteConfig(raw, installedVersionCode);
        } catch (e) {
            console.warn('update-banner fetch', url, e);
        }
    }

    return null;
}

export function openPlayStore(url) {
    const target = url || DEFAULT_PLAY_STORE;
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

/**
 * @param {{ onDismiss?: () => void }} opts
 */
export function createUpdateBannerElement(opts = {}) {
    const p = cachedPayload;
    if (!p) return null;

    const root = document.createElement('d' + 'iv');
    root.className = 'update-banner';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Uygulama güncellemesi');

    const icon = document.createElement('span');
    icon.className = 'update-banner__icon material-icons-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'system_update';

    const body = document.createElement('d' + 'iv');
    body.className = 'update-banner__body';

    const title = document.createElement('h3');
    title.className = 'update-banner__title';
    title.textContent = p.title;

    const msg = document.createElement('d' + 'iv');
    msg.className = 'update-banner__message';
    msg.innerHTML = formatMessageHtml(p.message);

    body.appendChild(title);
    if (p.message) body.appendChild(msg);

    const actions = document.createElement('d' + 'iv');
    actions.className = 'update-banner__actions';

    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'update-banner__btn update-banner__btn--ghost';
    dismissBtn.textContent = 'Bir daha gösterme';

    const updateBtn = document.createElement('button');
    updateBtn.type = 'button';
    updateBtn.className = 'update-banner__btn update-banner__btn--primary';
    updateBtn.textContent = 'Güncelle';

    dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissBannerId(p.id);
        opts.onDismiss?.();
    });
    updateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlayStore(p.playStoreUrl);
    });

    actions.appendChild(dismissBtn);
    actions.appendChild(updateBtn);

    const top = document.createElement('d' + 'iv');
    top.className = 'update-banner__top';
    top.appendChild(icon);
    top.appendChild(body);

    root.appendChild(top);
    root.appendChild(actions);

    return root;
}

export function clearUpdateBannerDom(slotEl, gridEl) {
    if (slotEl) {
        slotEl.innerHTML = '';
        slotEl.hidden = true;
    }
    if (gridEl) {
        gridEl.querySelectorAll('.update-banner').forEach((n) => n.remove());
    }
}

/**
 * @param {number} folderCount
 * @param {HTMLElement} folderGrid
 * @param {HTMLElement} slotEl
 * @param {{ onDismiss?: () => void }} opts
 */
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

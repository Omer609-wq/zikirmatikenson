import surahIndex from './data/quran/index.json';
import diyanetTefsirIndex from './data/quran/diyanet-tefsir-index.json';
import { Capacitor } from '@capacitor/core';
import { t, getLocale, normalizeAppLocale } from './i18n.js';

/** @typedef {{ id: string, labelKey: string, buildUrl: (ctx: { surah: number, ayah: number, nameTr: string }) => string | null }} TafsirBridgeSource */

function surahMeta(n) {
    return surahIndex.find((s) => s.n === n) || null;
}

function slugifyTrSurah(nameTr) {
    const map = {
        â: 'a',
        Â: 'a',
        î: 'i',
        Î: 'i',
        û: 'u',
        Û: 'u',
        ş: 's',
        Ş: 's',
        ğ: 'g',
        Ğ: 'g',
        ö: 'o',
        Ö: 'o',
        ü: 'u',
        Ü: 'u',
        ç: 'c',
        Ç: 'c',
        "'": '',
        '’': ''
    };
    let s = String(nameTr || '');
    Object.keys(map).forEach((ch) => {
        s = s.split(ch).join(map[ch]);
    });
    return s
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/** @type {TafsirBridgeSource[]} */
export const TAFSIR_BRIDGE_SOURCES = [
    {
        id: 'diyanet',
        labelKey: 'quran.tafsirSourceDiyanet',
        buildUrl: ({ surah, ayah }) => {
            const path = diyanetTefsirIndex[String(surah)]?.[String(ayah)];
            if (!path) return null;
            return `https://kuran.diyanet.gov.tr${path}`;
        }
    },
    {
        id: 'kuranvemeali-omer-celik',
        labelKey: 'quran.tafsirSourceOmerCelik',
        buildUrl: ({ surah, ayah, nameTr }) => {
            const slug = slugifyTrSurah(nameTr);
            if (!slug) return null;
            return `https://www.kuranvemeali.com/${slug}-suresi/${ayah}-ayeti-tefsiri`;
        }
    }
];

export function buildTafsirBridgeUrl(sourceId, surah, ayah) {
    const s = Number(surah);
    const a = Number(ayah);
    if (!Number.isFinite(s) || !Number.isFinite(a) || s < 1 || s > 114 || a < 1) return null;
    const meta = surahMeta(s);
    const source = TAFSIR_BRIDGE_SOURCES.find((x) => x.id === sourceId);
    if (!source) return null;
    const url = source.buildUrl({ surah: s, ayah: a, nameTr: meta?.nameTr || '' });
    if (!url || !/^https:\/\//i.test(url)) return null;
    return url;
}

export function openTafsirBridgeUrl(url) {
    if (!url) return;
    if (Capacitor.isNativePlatform()) {
        window.open(url, '_system');
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
}

function formatTafsirBridgeRef(nameTr, ayahN) {
    return t('quran.tafsirBridgeRef', { surah: nameTr, n: ayahN });
}

function setTafsirBridgeOpen(isOpen) {
    document.documentElement.classList.toggle('quran-tafsir-open', isOpen);
}

export function closeTafsirBridgeSheet() {
    const overlay = document.getElementById('quranTafsirBridgeOverlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    setTafsirBridgeOpen(false);
}

export function openTafsirBridgeSheet(surah, ayah) {
    if (normalizeAppLocale(getLocale()) !== 'tr') return;
    const overlay = document.getElementById('quranTafsirBridgeOverlay');
    const refEl = document.getElementById('quranTafsirBridgeRef');
    const listEl = document.getElementById('quranTafsirBridgeList');
    if (!overlay || !listEl) return;

    const s = Number(surah);
    const a = Number(ayah);
    const meta = surahMeta(s);
    const nameTr = meta?.nameTr || t('quran.surahFallback', { n: s });

    if (refEl) {
        refEl.textContent = formatTafsirBridgeRef(nameTr, a);
        refEl.removeAttribute('aria-hidden');
    }

    listEl.replaceChildren();
    TAFSIR_BRIDGE_SOURCES.forEach((source) => {
        const url = buildTafsirBridgeUrl(source.id, s, a);
        if (!url) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quran-tafsir-bridge__item';
        btn.textContent = t(source.labelKey);
        btn.addEventListener('click', () => {
            closeTafsirBridgeSheet();
            openTafsirBridgeUrl(url);
        });
        listEl.appendChild(btn);
    });

    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setTafsirBridgeOpen(true);
}

export function bindQuranTafsirBridgeOverlay() {
    const backdrop = document.getElementById('quranTafsirBridgeBackdrop');
    const overlay = document.getElementById('quranTafsirBridgeOverlay');
    if (backdrop && backdrop.dataset.bound !== '1') {
        backdrop.dataset.bound = '1';
        backdrop.addEventListener('click', () => closeTafsirBridgeSheet());
    }
    if (overlay && overlay.dataset.bound !== '1') {
        overlay.dataset.bound = '1';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeTafsirBridgeSheet();
        });
    }
}

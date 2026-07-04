const DEFAULT_RUNTIME_FLAGS = Object.freeze({
    premiumDevUnlock: false,
    counterBgPreviewUnlock: false,
    weeklyReportPreviewSample: false,
    updateBannerPreview: false,
    seasonalContentPreview: false
});

let runtimeFlags = { ...DEFAULT_RUNTIME_FLAGS };
let runtimeFlagsPromise = null;

export function getRuntimeFlags() {
    return runtimeFlags;
}

/**
 * Build-type specific runtime flags. Main/web assets stay locked by default;
 * Android debug builds can override this file from `src/debug/assets`.
 *
 * @returns {Promise<typeof DEFAULT_RUNTIME_FLAGS>}
 */
export async function loadRuntimeFlags() {
    if (runtimeFlagsPromise) return runtimeFlagsPromise;
    runtimeFlagsPromise = (async () => {
        try {
            const res = await fetch('./debug-flags.json', { cache: 'no-store' });
            if (!res.ok) return runtimeFlags;
            const raw = await res.json();
            if (!raw || typeof raw !== 'object') return runtimeFlags;
            runtimeFlags = {
                premiumDevUnlock: raw.premiumDevUnlock === true,
                counterBgPreviewUnlock: raw.counterBgPreviewUnlock === true,
                weeklyReportPreviewSample: raw.weeklyReportPreviewSample === true,
                updateBannerPreview: raw.updateBannerPreview === true,
                seasonalContentPreview: raw.seasonalContentPreview === true
            };
        } catch {
            runtimeFlags = { ...DEFAULT_RUNTIME_FLAGS };
        }
        return runtimeFlags;
    })();
    return runtimeFlagsPromise;
}

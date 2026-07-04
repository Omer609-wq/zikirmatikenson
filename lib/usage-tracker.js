/**
 * Uygulama ön plandayken geçen süreyi saniye olarak biriktirir.
 */
export function createUsageTracker({ getTodayKey, getContext, onFlush }) {
    let active = false;
    let lastTs = 0;
    let pendingSec = 0;

    function flushPending() {
        if (pendingSec <= 0) return;
        const day = getTodayKey();
        const ctx = typeof getContext === 'function' ? getContext() : 'other';
        onFlush(day, pendingSec, ctx);
        pendingSec = 0;
    }

    function tick() {
        if (!active || !lastTs) return;
        const now = Date.now();
        const elapsed = now - lastTs;
        const deltaSec = Math.floor(elapsed / 1000);
        if (deltaSec > 0) {
            pendingSec += deltaSec;
            lastTs += deltaSec * 1000;
        }
    }

    function resume() {
        if (active) return;
        active = true;
        lastTs = Date.now();
    }

    function pause() {
        if (!active) return;
        tick();
        active = false;
        lastTs = 0;
        flushPending();
    }

    function forceFlush() {
        tick();
        flushPending();
    }

    return { resume, pause, tick, forceFlush, isActive: () => active };
}

export function isPlainObject(v) {
    if (!v || typeof v !== 'object') return false;
    const p = Object.getPrototypeOf(v);
    return p === Object.prototype || p === null;
}

export function coerceString(v, maxLen = 240) {
    if (v == null) return '';
    const s = String(v).replace(/\s+/g, ' ').trim();
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen);
}

export function mintId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function coerceId(v, fallbackPrefix) {
    const raw = coerceString(v, 64);
    const ok = /^[a-zA-Z0-9_-]+$/.test(raw);
    if (ok) return raw;
    return mintId(fallbackPrefix);
}

export function clampNumber(v, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = 0 } = {}) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

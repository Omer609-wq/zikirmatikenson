/** @typedef {'classic'|'soft'|'wood'|'bead'|'tasbih'|'digital'} CounterTickSoundId */

export const COUNTER_TICK_SOUND_IDS = /** @type {const} */ ([
    'classic',
    'soft',
    'wood',
    'bead',
    'tasbih',
    'digital'
]);

/** @returns {CounterTickSoundId} */
export function normalizeCounterTickSound(v) {
    const s = String(v || '').trim();
    if (s === 'chime') return 'classic';
    if (COUNTER_TICK_SOUND_IDS.includes(/** @type {CounterTickSoundId} */ (s))) return /** @type {CounterTickSoundId} */ (s);
    return 'classic';
}

let audioCtx = null;

function ensureAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
}

/**
 * @param {OscillatorType} type
 * @param {number} freq
 * @param {number} start
 * @param {number} dur
 * @param {number} gainPeak
 * @param {number} [freqEnd]
 */
function tone(ctx, type, freq, start, dur, gainPeak, freqEnd) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd != null && freqEnd !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), start + dur);
    }
    gain.gain.setValueAtTime(gainPeak, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
}

/**
 * Kısa gürültü darbesi — boncuk çarpma hissi
 * @param {AudioContext} ctx
 * @param {number} start
 * @param {{ dur?: number, gainPeak?: number, centerFreq?: number, q?: number }} opts
 */
function noiseClack(ctx, start, opts = {}) {
    const dur = opts.dur ?? 0.02;
    const gainPeak = opts.gainPeak ?? 0.34;
    const centerFreq = opts.centerFreq ?? 2100;
    const q = opts.q ?? 2.1;
    const bufferSize = Math.max(2, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        const env = Math.exp(-i / (bufferSize * 0.2));
        data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFreq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    src.stop(start + dur + 0.01);
}

/** @param {AudioContext} ctx @param {number} t @param {boolean} isTarget */
function playTasbihClack(ctx, t, isTarget) {
    if (isTarget) {
        noiseClack(ctx, t, { centerFreq: 1650, gainPeak: 0.42, dur: 0.022 });
        noiseClack(ctx, t + 0.014, { centerFreq: 2380, gainPeak: 0.38, dur: 0.018 });
        noiseClack(ctx, t + 0.028, { centerFreq: 1920, gainPeak: 0.34, dur: 0.016 });
        noiseClack(ctx, t + 0.04, { centerFreq: 2750, gainPeak: 0.28, dur: 0.014, q: 2.6 });
        return;
    }
    noiseClack(ctx, t, { centerFreq: 1780, gainPeak: 0.36, dur: 0.019 });
    noiseClack(ctx, t + 0.011, { centerFreq: 2480, gainPeak: 0.3, dur: 0.016, q: 2.4 });
}

/** @param {CounterTickSoundId} profile @param {boolean} isTarget */
function playProfile(profile, isTarget) {
    const ctx = ensureAudioCtx();
    const t = ctx.currentTime;

    if (profile === 'soft') {
        if (isTarget) tone(ctx, 'sine', 520, t, 0.12, 0.32, 780);
        else tone(ctx, 'sine', 420, t, 0.07, 0.22);
        return;
    }
    if (profile === 'wood') {
        if (isTarget) tone(ctx, 'triangle', 160, t, 0.09, 0.45, 280);
        else tone(ctx, 'triangle', 190, t, 0.045, 0.38);
        return;
    }
    if (profile === 'bead') {
        if (isTarget) {
            tone(ctx, 'sine', 1350, t, 0.022, 0.28);
            tone(ctx, 'sine', 1580, t + 0.028, 0.028, 0.32);
        } else {
            tone(ctx, 'sine', 1180, t, 0.02, 0.26);
        }
        return;
    }
    if (profile === 'tasbih') {
        playTasbihClack(ctx, t, isTarget);
        return;
    }
    if (profile === 'digital') {
        if (isTarget) tone(ctx, 'square', 720, t, 0.09, 0.14, 1440);
        else tone(ctx, 'square', 980, t, 0.028, 0.1);
        return;
    }

    // classic (varsayılan)
    if (isTarget) tone(ctx, 'sine', 600, t, 0.1, 0.55, 1200);
    else tone(ctx, 'sine', 800, t, 0.05, 0.28);
}

/**
 * @param {CounterTickSoundId} profile
 * @param {boolean} isTarget
 */
export function playCounterTickSound(profile, isTarget) {
    try {
        playProfile(normalizeCounterTickSound(profile), isTarget);
    } catch {
        // Sessiz başarısızlık — sayaç akışını bozma
    }
}

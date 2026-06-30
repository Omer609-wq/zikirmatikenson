/** Launcher / ikon yeşil zemin — prepare + patch + cap:icons aynı renk */
/** Ek keskinleştirme — kaynak zaten netse kapalı */
const SHARPEN_ENABLED = false;

const SHARPEN = {
    /** Hafif ince ayar — karşılaştırma / isteğe bağlı üretim */
    light1024: { sigma: 0.42, m1: 0.45, m2: 2.0 },
    light512: { sigma: 0.48, m1: 0.47, m2: 2.15 },
    /** Play Console 512 — hafif + son küçültme sonrası */
    play512: { sigma: 0.44, m1: 0.46, m2: 2.05 },
    /** Kaynak ölçeklendirmeden sonra (1024 kanvas) */
    composite: { sigma: 0.72, m1: 0.5, m2: 2.6 },
    /** 1024 / 1920 dışa aktarım */
    export1024: { sigma: 0.82, m1: 0.52, m2: 2.7 },
    /** Play Console 512 ikon */
    export512: { sigma: 1.0, m1: 0.58, m2: 3.0 },
    /** Özellik grafiği orta logo */
    featureLogo: { sigma: 0.95, m1: 0.55, m2: 2.9 },
    /** Özellik grafiği son çıktı */
    featureFinal: { sigma: 0.62, m1: 0.48, m2: 2.3 },
};

module.exports = {
    BG_HEX: '#122a1c',
    BG_RGB: { r: 18, g: 42, b: 28 },
    SHARPEN_ENABLED,
    SHARPEN,
};

function applySharpen(pipeline, opts) {
    return SHARPEN_ENABLED ? pipeline.sharpen(opts) : pipeline;
}

module.exports.applySharpen = applySharpen;

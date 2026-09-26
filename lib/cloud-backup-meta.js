/**
 * Bulut yedeklemenin Firebase'siz kısmı: durum kontrolü, meta ve kurallar.
 *
 * Ayrı dosyada, çünkü uygulama bunları açılışta ve ayarlar ekranında
 * eşzamanlı kullanıyor. Firebase'e dokunan kısım (lib/cloud-backup.js) ana
 * pakette değil — yalnız gerçekten giriş/yedekleme yapılırken yüklenir;
 * yedeklemeyi hiç açmayan kullanıcı ~400 KB'lık SDK'yı derlemek zorunda kalmaz.
 */
import { isCloudBackupPlatform, isWebFirebaseAppConfig, loadFirebaseConfig } from './firebase-app.js';

export const BACKUP_SCHEMA_VERSION = 1;
export const WEEKLY_BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Firestore rejects nested `undefined` values, while localStorage JSON writes
 * silently drop them. Round-tripping through JSON keeps backup payloads aligned
 * across both storage targets.
 *
 * @param {Record<string, unknown>} payload
 * @returns {Record<string, unknown>}
 */
export function toFirestoreBackupPayload(payload) {
    return JSON.parse(JSON.stringify(payload || {}));
}

/**
 * Bulutta geri yüklenebilir bir yedek var mı? (saf)
 *
 * İlk bağlantıda bu kontrol yapılmadan yükleme yapılıyordu: yeni telefonda
 * uygulamayı boş veriyle açıp buluta bağlanan kullanıcının gerçek yedeği boş
 * veriyle eziliyordu. Nesne taşıyan her payload kullanıcı verisi sayılır —
 * içinde az veri var diye "önemsiz" kabul etmek tahmin olurdu.
 *
 * @param {unknown} remote downloadBackupPayload sonucu
 * @returns {boolean}
 */
export function hasRestorableCloudBackup(remote) {
    const payload = /** @type {{ payload?: unknown } | null | undefined} */ (remote)?.payload;
    return !!payload && typeof payload === 'object' && !Array.isArray(payload);
}

/**
 * @param {unknown} meta
 * @returns {{ uid: string, email: string, lastBackupAt: number, linkedAt: number } | null}
 */
export function normalizeCloudBackupMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const raw = /** @type {Record<string, unknown>} */ (meta);
    const uid = typeof raw.uid === 'string' ? raw.uid.trim() : '';
    if (!uid) return null;
    const email = typeof raw.email === 'string' ? raw.email.trim().slice(0, 256) : '';
    const lastBackupAt =
        typeof raw.lastBackupAt === 'number' && Number.isFinite(raw.lastBackupAt)
            ? Math.max(0, raw.lastBackupAt)
            : 0;
    const linkedAt =
        typeof raw.linkedAt === 'number' && Number.isFinite(raw.linkedAt) ? Math.max(0, raw.linkedAt) : 0;
    return { uid, email, lastBackupAt, linkedAt };
}

/**
 * @param {number} lastBackupAtMs
 * @param {number} [nowMs]
 */
export function shouldRunWeeklyBackup(lastBackupAtMs, nowMs = Date.now()) {
    if (!lastBackupAtMs || lastBackupAtMs <= 0) return true;
    return nowMs - lastBackupAtMs >= WEEKLY_BACKUP_INTERVAL_MS;
}

/**
 * @returns {Promise<'ready' | 'unsupported' | 'unconfigured'>}
 */
export async function getCloudBackupAvailability() {
    if (!isCloudBackupPlatform()) return 'unsupported';
    const cfg = await loadFirebaseConfig();
    if (!cfg) return 'unconfigured';
    if (!isWebFirebaseAppConfig(cfg)) return 'needs_web_app';
    return 'ready';
}

/**
 * @param {unknown} err
 * @param {(key: string) => string} t
 */
export function resolveCloudBackupSignInErrorKey(err) {
    const msg = String(/** @type {{ message?: string }} */ (err)?.message || err || '');
    const code = String(/** @type {{ code?: string }} */ (err)?.code || '');
    const blob = `${code} ${msg}`.toLowerCase();
    if (/cancel|12501|user canceled|user cancelled/.test(blob)) return 'cloudBackup.errorSignInCancelled';
    if (
        /developer_error|\b10\b|oauth|sha|app-not-authorized|invalid-credential|invalid-api-key|configuration|not configured|google_signin_failed/.test(
            blob
        )
    ) {
        return 'cloudBackup.errorSignInSetup';
    }
    return 'cloudBackup.errorSignIn';
}

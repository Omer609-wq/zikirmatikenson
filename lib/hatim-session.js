/**
 * Paylaşımlı hatim için oturum ve platform kapısı — uygulamayla Firebase
 * arasındaki ince katman. İş kuralları lib/hatim-remote.js'te; burada yalnızca
 * "bu cihazda açık mı" ve lib/hatim-remote.js'in beklediği `{ db, uid }` bağlamı var.
 *
 * Tasarım: docs/HATIM_GROUPS_DESIGN.md §1, §2.
 */
import { Capacitor } from '@capacitor/core';
import { isCapacitorNative } from '../native-reminders.js';
import {
    ensureJsAuthFromNative,
    resolveCloudBackupSignInErrorKey,
    signInWithGoogleForBackup
} from './cloud-backup.js';
import {
    ensureFirebaseReady,
    getFirebaseFirestore,
    isWebFirebaseAppConfig,
    loadFirebaseConfig
} from './firebase-app.js';

/**
 * Paylaşımlı hatimin açık olduğu platform. iOS, Apple ile Giriş gelene kadar
 * kapalı: Google girişi sunan uygulamada App Store bunu şart koşuyor (§2).
 * Apple girişi eklenince yalnızca bu fonksiyon değişir.
 */
export function isHatimSyncPlatform() {
    return isCapacitorNative() && Capacitor.getPlatform() === 'android';
}

/** @returns {Promise<'ready' | 'unsupported' | 'unconfigured' | 'needs_web_app'>} */
export async function getHatimSyncAvailability() {
    if (!isHatimSyncPlatform()) return 'unsupported';
    const cfg = await loadFirebaseConfig();
    if (!cfg) return 'unconfigured';
    // JS SDK Web appId ister; Android appId ile giriş sessizce başarısız olur.
    if (!isWebFirebaseAppConfig(cfg)) return 'needs_web_app';
    return 'ready';
}

/**
 * Cihazda Google oturumu varsa sessizce, yoksa `interactive` iken giriş ekranıyla
 * bağlam kurar. Oturum yok ve etkileşim istenmediyse NOT_SIGNED_IN atar.
 *
 * @returns {Promise<{ db: import('firebase/firestore').Firestore, uid: string, email: string }>}
 */
export async function getHatimContext({ interactive = false } = {}) {
    const ready = await ensureFirebaseReady();
    if (!ready) throw new Error('FIREBASE_NOT_CONFIGURED');
    const db = getFirebaseFirestore();
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED');

    try {
        const user = await ensureJsAuthFromNative();
        return { db, uid: user.uid, email: user.email || '' };
    } catch (err) {
        if (!interactive) throw err;
    }
    const account = await signInWithGoogleForBackup();
    return { db, uid: account.uid, email: account.email };
}

/**
 * Giriş hatasının metin anahtarı; null ise kullanıcı vazgeçti, bir şey gösterme.
 * Yedeklemenin giriş metinleri yeniden kullanılıyor — aynı Google girişi.
 */
export function hatimSignInErrorKey(err) {
    const key = resolveCloudBackupSignInErrorKey(err);
    return key === 'cloudBackup.errorSignInCancelled' ? null : key;
}

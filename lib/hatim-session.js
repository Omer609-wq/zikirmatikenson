/**
 * Paylaşımlı hatim için oturum ve platform kapısı — uygulamayla Firebase
 * arasındaki ince katman. İş kuralları lib/hatim-remote.js'te; burada yalnızca
 * "bu cihazda açık mı" ve lib/hatim-remote.js'in beklediği `{ db, uid }` bağlamı var.
 *
 * Kimlik anonim Firebase oturumu: kullanıcı giriş ekranı görmez, kimlik bu
 * kurulumla yaşar. Uygulama silinirse ya da cihaz değişirse kimlik de gider.
 * Tasarım: docs/HATIM_GROUPS_DESIGN.md §1, §2.
 */
import { isCapacitorNative } from '../native-reminders.js';
import { ensureHatimFirebase, isWebFirebaseAppConfig, loadFirebaseConfig } from './firebase-app.js';

/** Paylaşımlı hatimin açık olduğu platform: Android ve iOS uygulaması. */
export function isHatimSyncPlatform() {
    return isCapacitorNative();
}

/** @returns {Promise<'ready' | 'unsupported' | 'unconfigured' | 'needs_web_app'>} */
export async function getHatimSyncAvailability() {
    if (!isHatimSyncPlatform()) return 'unsupported';
    const cfg = await loadFirebaseConfig();
    if (!cfg) return 'unconfigured';
    // JS SDK Web appId ister; Android appId ile oturum açılmaz.
    if (!isWebFirebaseAppConfig(cfg)) return 'needs_web_app';
    return 'ready';
}

/** @type {Promise<import('firebase/auth').UserCredential> | null} */
let signInPromise = null;

/**
 * Cihazda kalan anonim oturumu açar, yoksa yenisini kurar.
 *
 * @returns {Promise<{ db: import('firebase/firestore').Firestore, uid: string }>}
 */
export async function getHatimContext() {
    const fb = await ensureHatimFirebase();
    if (!fb) throw new Error('FIREBASE_NOT_CONFIGURED');
    const { auth, db } = fb;

    // Kayıtlı oturum IndexedDB'den eşzamansız yüklenir. Beklemeden bakılırsa
    // currentUser boş görünür ve her açılışta yeni kimlik açılır: kişi
    // gruplarını ve yöneticiliğini kaybeder.
    await auth.authStateReady();
    if (auth.currentUser) return { db, uid: auth.currentUser.uid };

    // İlk açılışta arka plan eşlemesi ve kullanıcı eylemi aynı anda gelebilir;
    // iki ayrı signInAnonymously iki kimlik üretir, ikincisi birincinin yerine geçer.
    if (!signInPromise) {
        signInPromise = import('firebase/auth')
            .then(({ signInAnonymously }) => signInAnonymously(auth))
            .finally(() => {
                signInPromise = null;
            });
    }
    const { user } = await signInPromise;
    return { db, uid: user.uid };
}

/** Oturum açılamadığında gösterilecek metnin anahtarı. */
export function hatimSessionErrorKey(err) {
    const code = String(err?.code || err?.message || '');
    if (code.includes('network-request-failed')) return 'community.syncOffline';
    return 'community.syncNotConfigured';
}

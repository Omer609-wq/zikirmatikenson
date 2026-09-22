import { Capacitor } from '@capacitor/core';
import { isCapacitorNative } from '../native-reminders.js';

let configPromise = null;
let cachedConfig = null;
/** @type {import('firebase/app').FirebaseApp | null} */
let firebaseApp = null;
/** @type {import('firebase/auth').Auth | null} */
let firebaseAuth = null;
/** @type {import('firebase/firestore').Firestore | null} */
let firebaseDb = null;

export function isCloudBackupPlatform() {
    return isCapacitorNative() && Capacitor.getPlatform() === 'android';
}

/**
 * @returns {Promise<Record<string, string> | null>}
 */
export async function loadFirebaseConfig() {
    if (configPromise) return configPromise;
    configPromise = (async () => {
        try {
            const res = await fetch('./firebase-config.json', { cache: 'no-store' });
            if (!res.ok) return null;
            const cfg = await res.json();
            if (!cfg || typeof cfg !== 'object') return null;
            if (!cfg.apiKey || !cfg.projectId) return null;
            cachedConfig = cfg;
            return cfg;
        } catch {
            return null;
        }
    })();
    return configPromise;
}

export function getCachedFirebaseConfig() {
    return cachedConfig;
}

/** Firebase JS SDK (skipNativeAuth) için Web app appId gerekir; Android appId yetmez. */
export function isWebFirebaseAppConfig(cfg) {
    const appId = String(cfg?.appId || '');
    return appId.includes(':web:');
}

/**
 * @returns {Promise<boolean>}
 */
export async function ensureFirebaseReady() {
    const cfg = await loadFirebaseConfig();
    if (!cfg) return false;
    if (firebaseApp) return true;

    const { initializeApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');

    firebaseApp = initializeApp(cfg);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    return true;
}

const HATIM_APP_NAME = 'hatim';
/** @type {Promise<{ auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore } | null> | null} */
let hatimFirebasePromise = null;

/**
 * Paylaşımlı hatimin ayrı, adlandırılmış Firebase uygulaması. Anonim oturumu
 * yedeklemenin Google oturumundan ayırır: aynı Auth örneğini paylaşsalardı
 * yedeklemeye bağlanmak anonim kimliğin yerine geçer, kişi gruplarını ve
 * yöneticiliğini kaybederdi.
 *
 * getAuth yerine initializeAuth: tarayıcı varsayılanı açılır pencere çözücüsünü
 * de kurar, iOS WebView'da (capacitor://) oturumun hiç açılmamasına yol
 * açabiliyor. Anonim giriş ona ihtiyaç duymaz.
 *
 * Söz önbellekte: iki eşzamanlı çağrı aynı adla iki kez initializeApp çağırırsa
 * ikincisi hata atar.
 */
export function ensureHatimFirebase() {
    if (!hatimFirebasePromise) {
        hatimFirebasePromise = (async () => {
            const cfg = await loadFirebaseConfig();
            if (!cfg) return null;

            const { getApps, initializeApp } = await import('firebase/app');
            const { initializeAuth, indexedDBLocalPersistence } = await import('firebase/auth');
            const { getFirestore } = await import('firebase/firestore');

            const app =
                getApps().find((a) => a.name === HATIM_APP_NAME) || initializeApp(cfg, HATIM_APP_NAME);
            return {
                auth: initializeAuth(app, { persistence: indexedDBLocalPersistence }),
                db: getFirestore(app)
            };
        })().catch((err) => {
            hatimFirebasePromise = null;
            throw err;
        });
    }
    return hatimFirebasePromise;
}

export function getFirebaseAuth() {
    return firebaseAuth;
}

export function getFirebaseFirestore() {
    return firebaseDb;
}

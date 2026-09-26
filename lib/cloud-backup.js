/**
 * Bulut yedeklemenin Firebase'e dokunan kısmı: Google girişi, yükleme, indirme.
 * Ana pakette değil; app.js ilk gerçek yedekleme işleminde yükler.
 * Firebase'siz yardımcılar lib/cloud-backup-meta.js'te.
 */
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential, signOut as firebaseJsSignOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ensureFirebaseReady, getFirebaseAuth, getFirebaseFirestore } from './firebase-app.js';
import {
    BACKUP_SCHEMA_VERSION,
    normalizeCloudBackupMeta,
    shouldRunWeeklyBackup,
    toFirestoreBackupPayload
} from './cloud-backup-meta.js';

const BACKUP_DOC_ID = 'main';

/** Cihazdaki yerel Google oturumundan JS SDK oturumu kurar. */
export async function ensureJsAuthFromNative() {
    const ready = await ensureFirebaseReady();
    if (!ready) throw new Error('FIREBASE_NOT_CONFIGURED');

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('FIREBASE_NOT_CONFIGURED');
    if (auth.currentUser) return auth.currentUser;

    const native = await FirebaseAuthentication.getCurrentUser();
    if (!native.user?.uid) throw new Error('NOT_SIGNED_IN');

    const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
    const idToken = tokenResult.token;
    if (!idToken) throw new Error('NOT_SIGNED_IN');

    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(auth, credential);
    return userCred.user;
}

function backupDocRef(uid) {
    const db = getFirebaseFirestore();
    if (!db) throw new Error('FIREBASE_NOT_CONFIGURED');
    return doc(db, 'users', uid, 'backups', BACKUP_DOC_ID);
}

/**
 * @returns {Promise<{ uid: string, email: string }>}
 */
export async function signInWithGoogleForBackup() {
    const ready = await ensureFirebaseReady();
    if (!ready) throw new Error('FIREBASE_NOT_CONFIGURED');

    const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    const idToken = result.credential?.idToken;
    const accessToken = result.credential?.accessToken || undefined;
    if (!idToken) throw new Error('GOOGLE_SIGNIN_FAILED');

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('FIREBASE_NOT_CONFIGURED');

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    // With skipNativeAuth, the native plugin can return a null user on Android.
    // The JS SDK sign-in is the reliable source of the Firebase user record here.
    const userCred = await signInWithCredential(auth, credential);
    const signedInUser = userCred.user || result.user;
    if (!signedInUser?.uid) throw new Error('GOOGLE_SIGNIN_FAILED');

    return {
        uid: signedInUser.uid,
        email: signedInUser.email || ''
    };
}

/**
 * @param {string} uid
 * @param {Record<string, unknown>} payload
 */
export async function uploadBackupPayload(uid, payload) {
    if (!uid) throw new Error('NOT_SIGNED_IN');
    await ensureJsAuthFromNative();

    const ref = backupDocRef(uid);
    const firestorePayload = toFirestoreBackupPayload(payload);
    await setDoc(ref, {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        updatedAt: serverTimestamp(),
        updatedAtMs: Date.now(),
        payload: firestorePayload
    });
    return Date.now();
}

/**
 * @param {string} uid
 * @returns {Promise<{ payload: Record<string, unknown>, updatedAtMs: number } | null>}
 */
export async function downloadBackupPayload(uid) {
    if (!uid) throw new Error('NOT_SIGNED_IN');
    await ensureJsAuthFromNative();

    const snap = await getDoc(backupDocRef(uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    const payload = data?.payload;
    if (!payload || typeof payload !== 'object') return null;

    const updatedAtMs =
        typeof data.updatedAtMs === 'number' && Number.isFinite(data.updatedAtMs)
            ? data.updatedAtMs
            : 0;

    return {
        payload: /** @type {Record<string, unknown>} */ (payload),
        updatedAtMs
    };
}

export async function signOutCloudBackup() {
    try {
        await FirebaseAuthentication.signOut();
    } catch {
        // ignore
    }
    try {
        const auth = getFirebaseAuth();
        if (auth) await firebaseJsSignOut(auth);
    } catch {
        // ignore
    }
}

/**
 * @param {object} options
 * @param {() => Record<string, unknown>} options.getPayload
 * @param {{ uid: string, email: string, lastBackupAt?: number, linkedAt?: number } | null} options.cloudMeta
 * @param {boolean} [options.force]
 * @param {(patch: { lastBackupAt: number }) => void} [options.onMetaPatch]
 */
export async function maybeUploadCloudBackup({ getPayload, cloudMeta, force = false, onMetaPatch }) {
    const meta = normalizeCloudBackupMeta(cloudMeta);
    if (!meta?.uid) return { ran: false, reason: 'not_linked' };

    if (!force && !shouldRunWeeklyBackup(meta.lastBackupAt)) {
        return { ran: false, reason: 'recent' };
    }

    const payload = getPayload();
    const lastBackupAt = await uploadBackupPayload(meta.uid, payload);
    onMetaPatch?.({ lastBackupAt });
    return { ran: true, lastBackupAt };
}

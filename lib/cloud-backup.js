import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential, signOut as firebaseJsSignOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
    ensureFirebaseReady,
    getFirebaseAuth,
    getFirebaseFirestore,
    isCloudBackupPlatform,
    loadFirebaseConfig
} from './firebase-app.js';

export const BACKUP_SCHEMA_VERSION = 1;
export const WEEKLY_BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const BACKUP_DOC_ID = 'main';

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
    return 'ready';
}

async function ensureJsAuthFromNative() {
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
    const user = result.user;
    if (!idToken || !user?.uid) throw new Error('GOOGLE_SIGNIN_FAILED');

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('FIREBASE_NOT_CONFIGURED');

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    await signInWithCredential(auth, credential);

    return {
        uid: user.uid,
        email: user.email || ''
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
    await setDoc(ref, {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        updatedAt: serverTimestamp(),
        updatedAtMs: Date.now(),
        payload
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

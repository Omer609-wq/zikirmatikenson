import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { isCapacitorNative } from '../native-reminders.js';

/**
 * Firebase ilk kurulum doğrulaması: true iken uygulama açıldıktan ~8 sn sonra test crash atar.
 * Firebase Console’da crash göründükten sonra false yap ve yeniden build al.
 */
export const CRASHLYTICS_VERIFICATION_CRASH = false;

const CRASHLYTICS_VERIFICATION_DELAY_MS = 8000;

let crashReportingReady = false;

function isAndroidNative() {
    return isCapacitorNative() && Capacitor.getPlatform() === 'android';
}

function stackFramesFromError(err) {
    const stack = err?.stack;
    if (!stack || typeof stack !== 'string') return undefined;
    return stack
        .split('\n')
        .slice(1, 14)
        .map((line) => {
            const trimmed = line.trim();
            const withFn = trimmed.match(/^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/);
            if (withFn) {
                return {
                    functionName: withFn[1],
                    fileName: withFn[2],
                    lineNumber: Number(withFn[3]) || 0
                };
            }
            const simple = trimmed.match(/^at\s+(.+):(\d+):(\d+)$/);
            if (simple) {
                return {
                    functionName: 'anonymous',
                    fileName: simple[1],
                    lineNumber: Number(simple[2]) || 0
                };
            }
            return { functionName: trimmed, fileName: '', lineNumber: 0 };
        })
        .filter((frame) => frame.fileName || frame.functionName);
}

async function recordJsError(source, errOrMessage, context = {}) {
    if (!crashReportingReady) return;
    const err = errOrMessage instanceof Error ? errOrMessage : new Error(String(errOrMessage || 'Unknown error'));
    const stacktrace = stackFramesFromError(err);
    const keysAndValues = Object.entries(context)
        .slice(0, 8)
        .map(([key, value]) => ({
            key: String(key).slice(0, 64),
            value: String(value).slice(0, 256),
            type: 'string'
        }));

    try {
        await FirebaseCrashlytics.recordException({
            message: `[${source}] ${err.message}`.slice(0, 500),
            stacktrace,
            keysAndValues: keysAndValues.length ? keysAndValues : undefined
        });
    } catch {
        // ignore — reporting must not break the app
    }
}

/**
 * Native Android Crashlytics + JS error hooks. Requires android/app/google-services.json.
 */
export async function setupCrashReporting() {
    if (!isAndroidNative()) return;

    try {
        await FirebaseCrashlytics.setEnabled({ enabled: true });
        const info = await App.getInfo();
        await FirebaseCrashlytics.setCustomKey({
            key: 'app_version',
            value: info.version || 'unknown',
            type: 'string'
        });
        await FirebaseCrashlytics.setCustomKey({
            key: 'build',
            value: String(info.build ?? ''),
            type: 'string'
        });
        crashReportingReady = true;
    } catch (e) {
        console.warn('Crashlytics başlatılamadı (google-services.json eksik olabilir):', e);
        return;
    }

    window.addEventListener('error', (event) => {
        const loc = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : '';
        void recordJsError('window.error', event.error || event.message, {
            location: loc,
            type: event.type
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const err = reason instanceof Error ? reason : new Error(String(reason));
        void recordJsError('unhandledrejection', err);
    });

    try {
        const { crashed } = await FirebaseCrashlytics.didCrashOnPreviousExecution();
        if (crashed) {
            await FirebaseCrashlytics.log({ message: 'App restarted after native crash' });
        }
    } catch {
        // ignore
    }

    if (CRASHLYTICS_VERIFICATION_CRASH) {
        scheduleCrashlyticsVerificationCrash();
    }
}

function scheduleCrashlyticsVerificationCrash() {
    window.setTimeout(() => {
        void (async () => {
            try {
                await FirebaseCrashlytics.log({
                    message: 'Crashlytics verification crash scheduled'
                });
                await FirebaseCrashlytics.crash({
                    message: 'Crashlytics verification crash — remove CRASHLYTICS_VERIFICATION_CRASH after Firebase confirms'
                });
            } catch (e) {
                console.warn('Crashlytics verification crash failed:', e);
            }
        })();
    }, CRASHLYTICS_VERIFICATION_DELAY_MS);
}

/** Geliştirme/test: Firebase Console’da non-fatal görünür */
export async function reportCrashlyticsTestError() {
    if (!isAndroidNative()) return false;
    await recordJsError('manual-test', new Error('Crashlytics test (non-fatal)'));
    return true;
}

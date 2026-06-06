import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const STORAGE_KEY = 'zikirmatik_data_v2';

function makeElement() {
    return {
        hidden: false,
        value: '',
        checked: false,
        textContent: '',
        innerHTML: '',
        dataset: {},
        style: {
            setProperty() {},
            removeProperty() {}
        },
        classList: {
            add() {},
            remove() {},
            toggle() {},
            contains() {
                return false;
            }
        },
        setAttribute() {},
        getAttribute() {
            return null;
        },
        addEventListener() {},
        removeEventListener() {},
        appendChild() {},
        prepend() {},
        querySelector() {
            return makeElement();
        },
        querySelectorAll() {
            return [];
        },
        focus() {},
        select() {}
    };
}

function makeDocument() {
    const root = makeElement();
    return {
        documentElement: root,
        visibilityState: 'visible',
        querySelector() {
            return makeElement();
        },
        querySelectorAll() {
            return [];
        },
        getElementById() {
            return makeElement();
        },
        createElement() {
            return makeElement();
        },
        addEventListener() {},
        removeEventListener() {}
    };
}

function makeLocalStorage(initial = {}) {
    const store = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        },
        removeItem(key) {
            store.delete(String(key));
        },
        dump() {
            return Object.fromEntries(store.entries());
        }
    };
}

function loadStorageHarness(initialStorage = {}) {
    const appSource = fs
        .readFileSync(new URL('../app.js', import.meta.url), 'utf8')
        .replace(/^\s*import[\s\S]*?;\s*\n/gm, '');
    const document = makeDocument();
    const localStorage = makeLocalStorage(initialStorage);
    const context = vm.createContext({
        console: {
            error() {},
            warn() {},
            log() {}
        },
        document,
        localStorage,
        navigator: {
            vibrate() {},
            serviceWorker: {
                register() {
                    return Promise.resolve();
                }
            }
        },
        window: {
            document,
            localStorage,
            navigator: {},
            addEventListener() {},
            removeEventListener() {},
            alert() {},
            confirm() {
                return true;
            },
            prompt(_message, defaultValue) {
                return defaultValue;
            },
            history: {
                replaceState() {},
                pushState() {}
            },
            location: {
                href: 'https://example.test/'
            }
        },
        requestAnimationFrame(callback) {
            return setTimeout(callback, 0);
        },
        cancelAnimationFrame: clearTimeout,
        setTimeout,
        clearTimeout,
        Date,
        Math,
        structuredClone,
        applyNativeBottomInsetVar() {},
        isCapacitorNative() {
            return false;
        },
        syncNativeDailyReminder() {
            return Promise.resolve({ ok: true });
        },
        clearUpdateBannerDom() {},
        placeUpdateBanner() {},
        refreshUpdateBannerConfig() {
            return Promise.resolve(null);
        },
        applyNativeStatusBarTheme() {
            return Promise.resolve();
        },
        runCounterVibration() {},
        runDragReorderNudge() {},
        pickRandomQuote() {
            return 'quote';
        },
        REMINDER_FIXED_BODY: 'reminder',
        ESMA_DEFAULT_FAZILET: []
    });

    vm.runInContext(
        `${appSource}
globalThis.__storageTestApi = {
    loadData,
    saveData,
    getState: () => ({ folders, zikirs, history, appSettings, reminderSettings, entitlements, trash }),
    setState: (next) => {
        if (Object.prototype.hasOwnProperty.call(next, 'folders')) folders = next.folders;
        if (Object.prototype.hasOwnProperty.call(next, 'zikirs')) zikirs = next.zikirs;
        if (Object.prototype.hasOwnProperty.call(next, 'history')) history = next.history;
        if (Object.prototype.hasOwnProperty.call(next, 'appSettings')) appSettings = next.appSettings;
        if (Object.prototype.hasOwnProperty.call(next, 'reminderSettings')) reminderSettings = next.reminderSettings;
        if (Object.prototype.hasOwnProperty.call(next, 'entitlements')) entitlements = next.entitlements;
        if (Object.prototype.hasOwnProperty.call(next, 'trash')) trash = next.trash;
    }
};`,
        context,
        { filename: 'app.js' }
    );

    return {
        api: context.__storageTestApi,
        localStorage
    };
}

test('corrupt persisted data is not overwritten after a load failure', () => {
    const corruptPayload = '{"folders":[{"id":"f_user","name":"Mine"}],"zikirs":[{"id":"z_custom"';
    const { api, localStorage } = loadStorageHarness({ [STORAGE_KEY]: corruptPayload });

    api.loadData();
    api.setState({
        folders: [{ id: 'f_new', name: 'New' }],
        zikirs: [{ id: 'z_new', folderId: 'f_new', name: 'New', target: 33, count: 1 }]
    });
    api.saveData();

    assert.equal(localStorage.getItem(STORAGE_KEY), corruptPayload);
});

test('valid JSON with a malformed zikirs collection is kept recoverable', () => {
    const malformedPayload = JSON.stringify({
        folders: [{ id: 'f_user', name: 'Mine' }],
        zikirs: null,
        history: { '2026-06-06': { z_custom: 120 } }
    });
    const { api, localStorage } = loadStorageHarness({ [STORAGE_KEY]: malformedPayload });

    api.loadData();
    api.saveData();

    assert.equal(localStorage.getItem(STORAGE_KEY), malformedPayload);
});

test('an intentionally empty zikirs array remains empty and writable', () => {
    const emptyPayload = JSON.stringify({
        folders: [
            { id: 'f_default', name: 'Default' },
            { id: 'f_esma', name: 'Esma' }
        ],
        zikirs: [],
        history: {},
        settings: { theme: 'navy' }
    });
    const { api, localStorage } = loadStorageHarness({ [STORAGE_KEY]: emptyPayload });

    api.loadData();
    api.saveData();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    assert.equal(api.getState().zikirs.length, 0);
    assert.deepEqual(saved.zikirs, []);
});

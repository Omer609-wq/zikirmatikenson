import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const APP_PATH = new URL('../app.js', import.meta.url);
const STORAGE_KEY = 'zikirmatik_data_v2';

function createElement(id = '') {
    const classes = new Set();
    return {
        id,
        hidden: false,
        innerHTML: '',
        textContent: '',
        value: '',
        checked: false,
        style: {
            setProperty() {},
            removeProperty() {}
        },
        classList: {
            add: (...names) => names.forEach((name) => classes.add(name)),
            remove: (...names) => names.forEach((name) => classes.delete(name)),
            contains: (name) => classes.has(name),
            toggle(name, force) {
                const shouldAdd = force === undefined ? !classes.has(name) : !!force;
                if (shouldAdd) classes.add(name);
                else classes.delete(name);
                return shouldAdd;
            }
        },
        setAttribute() {},
        removeAttribute() {},
        getAttribute() {
            return null;
        },
        appendChild() {},
        insertBefore() {},
        addEventListener() {},
        removeEventListener() {},
        querySelector: () => createElement(),
        querySelectorAll: () => [],
        focus() {},
        select() {},
        getBoundingClientRect() {
            return { top: 0, width: 0 };
        }
    };
}

function makeDocument() {
    const elements = new Map();
    return {
        documentElement: createElement('html'),
        visibilityState: 'visible',
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, createElement(id));
            return elements.get(id);
        },
        querySelector: () => createElement(),
        querySelectorAll: () => [],
        createElement: (tag) => createElement(tag),
        addEventListener() {},
        removeEventListener() {}
    };
}

function loadAppHarness(initialStorageValue) {
    const writes = [];
    const store = new Map();
    if (initialStorageValue !== undefined) store.set(STORAGE_KEY, initialStorageValue);

    const document = makeDocument();
    const window = {
        document,
        history: {
            state: null,
            pushState(state) {
                this.state = state;
            },
            replaceState(state) {
                this.state = state;
            },
            back() {}
        },
        addEventListener() {},
        removeEventListener() {},
        matchMedia: () => ({ matches: false }),
        open() {},
        innerWidth: 390,
        visualViewport: null
    };

    const context = {
        console: { error() {}, warn() {}, log() {} },
        window,
        document,
        localStorage: {
            getItem(key) {
                return store.has(key) ? store.get(key) : null;
            },
            setItem(key, value) {
                writes.push({ key, value });
                store.set(key, value);
            },
            removeItem(key) {
                store.delete(key);
            }
        },
        navigator: {},
        Date,
        Math,
        Number,
        String,
        Object,
        Array,
        Set,
        Map,
        Promise,
        JSON,
        RegExp,
        parseInt,
        parseFloat,
        setTimeout: () => 0,
        clearTimeout() {},
        requestAnimationFrame: (cb) => cb(),
        structuredClone: (value) => JSON.parse(JSON.stringify(value)),
        applyNativeBottomInsetVar() {},
        isCapacitorNative: () => false,
        syncNativeDailyReminder: async () => ({ ok: true }),
        clearUpdateBannerDom() {},
        placeUpdateBanner() {},
        refreshUpdateBannerConfig: async () => null,
        applyNativeStatusBarTheme: async () => {},
        runCounterVibration() {},
        runDragReorderNudge() {},
        pickRandomQuote: () => 'quote',
        REMINDER_FIXED_BODY: 'reminder',
        ESMA_DEFAULT_FAZILET: []
    };
    context.globalThis = context;
    context.window.window = window;
    context.window.localStorage = context.localStorage;
    context.window.navigator = context.navigator;

    let source = fs.readFileSync(APP_PATH, 'utf8');
    source = source.replace(/^import[\s\S]*?;\n/gm, '');
    source = source.replace("window.addEventListener('DOMContentLoaded', init);", '');
    source += '\nglobalThis.__storageTestHooks = { loadData, saveData, isBlocked: () => blockStorageWrites };\n';

    vm.createContext(context);
    new vm.Script(source, { filename: 'app.js' }).runInContext(context);

    return { context, store, writes, hooks: context.__storageTestHooks };
}

{
    const corruptRaw = '{"folders":[{"id":"f_custom","name":"Saved data"}],"zikirs":[';
    const { store, writes, hooks } = loadAppHarness(corruptRaw);

    hooks.loadData();
    assert.equal(hooks.isBlocked(), true);

    hooks.saveData();
    assert.equal(writes.length, 0);
    assert.equal(store.get(STORAGE_KEY), corruptRaw);
}

{
    const validRaw = JSON.stringify({
        folders: [
            { id: 'f_default', name: 'Default', order: 0 },
            { id: 'f_esma', name: 'Esma', order: 1 }
        ],
        zikirs: [{ id: 'z_custom', folderId: 'f_default', name: 'Custom', target: 33, count: 7, order: 0 }],
        history: {},
        settings: { theme: 'navy' },
        reminders: { enabled: false, time: '21:00', lastFiredYmd: null },
        entitlements: { premium: false },
        trash: { v: 1, entries: [] }
    });
    const { store, hooks } = loadAppHarness(validRaw);

    hooks.loadData();
    assert.equal(hooks.isBlocked(), false);

    hooks.saveData();
    assert.doesNotThrow(() => JSON.parse(store.get(STORAGE_KEY)));
}

{
    const source = fs.readFileSync(APP_PATH, 'utf8');
    const unqualifiedHistoryCalls = source.match(/(?:^|[^.])\bhistory\.(?:pushState|replaceState|back|state)\b/g) || [];

    assert.equal(unqualifiedHistoryCalls.length, 0);
    assert.match(source, /window\.history\.pushState/);
    assert.match(source, /window\.history\.replaceState/);
    assert.match(source, /window\.history\.back/);
}

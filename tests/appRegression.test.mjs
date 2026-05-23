import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataKey = 'zikirmatik_data_v2';

function stripImports(source) {
    const lines = source.split('\n');
    const out = [];
    let skipping = false;
    for (const line of lines) {
        if (!skipping && line.startsWith('import ')) {
            if (!line.includes(';')) skipping = true;
            continue;
        }
        if (skipping) {
            if (line.includes(';')) skipping = false;
            continue;
        }
        out.push(line);
    }
    return out.join('\n');
}

class TestClassList {
    constructor() {
        this.items = new Set();
    }
    add(...names) {
        names.forEach((name) => this.items.add(name));
    }
    remove(...names) {
        names.forEach((name) => this.items.delete(name));
    }
    contains(name) {
        return this.items.has(name);
    }
    toggle(name, force) {
        const shouldAdd = force === undefined ? !this.items.has(name) : !!force;
        if (shouldAdd) this.items.add(name);
        else this.items.delete(name);
        return shouldAdd;
    }
}

function createElement(id = '') {
    return {
        id,
        classList: new TestClassList(),
        style: {
            setProperty() {},
            removeProperty() {}
        },
        dataset: {},
        children: [],
        hidden: false,
        value: '',
        checked: false,
        textContent: '',
        innerHTML: '',
        setAttribute(name, value) {
            this[name] = value;
        },
        removeAttribute(name) {
            delete this[name];
        },
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        remove() {},
        addEventListener() {},
        removeEventListener() {},
        querySelector() {
            return createElement();
        },
        querySelectorAll() {
            return [];
        },
        focus() {},
        select() {},
        closest() {
            return null;
        }
    };
}

function createLocalStorage(initial) {
    const store = new Map(Object.entries(initial || {}));
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        },
        removeItem(key) {
            store.delete(key);
        }
    };
}

function loadApp(initialStorage = {}) {
    const source = readFileSync(path.join(rootDir, 'app.js'), 'utf8');
    const appSource = stripImports(source);
    const elements = new Map();
    const getElement = (id) => {
        if (!elements.has(id)) elements.set(id, createElement(id));
        return elements.get(id);
    };
    const views = ['homeView', 'folderDetailView', 'counterView', 'statsView', 'stealthView', 'libraryView']
        .map(getElement);
    const errors = [];
    const historyCalls = { pushes: [], replaces: [], backs: 0 };
    const browserHistory = {
        state: null,
        pushes: historyCalls.pushes,
        replaces: historyCalls.replaces,
        back() {
            historyCalls.backs += 1;
        },
        pushState(state) {
            this.state = state;
            this.pushes.push(state);
        },
        replaceState(state) {
            this.state = state;
            this.replaces.push(state);
        }
    };

    const context = {
        console: {
            error: (...args) => errors.push(args),
            warn() {},
            log() {}
        },
        localStorage: createLocalStorage(initialStorage),
        document: {
            documentElement: createElement('html'),
            body: createElement('body'),
            getElementById: getElement,
            querySelector(selector) {
                if (selector === 'meta[name="apple-mobile-web-app-status-bar-style"]') return null;
                return null;
            },
            querySelectorAll(selector) {
                if (selector === '.view') return views;
                return [];
            },
            createElement,
            addEventListener() {},
            removeEventListener() {}
        },
        window: {
            history: browserHistory,
            addEventListener() {},
            removeEventListener() {},
            matchMedia() {
                return { matches: false, addEventListener() {}, removeEventListener() {} };
            }
        },
        navigator: {},
        CSS: { escape: (value) => String(value) },
        requestAnimationFrame: (cb) => {
            cb();
            return 1;
        },
        cancelAnimationFrame() {},
        setTimeout,
        clearTimeout,
        Promise,
        Date,
        Math,
        Number,
        String,
        Object,
        Array,
        Map,
        Set,
        JSON,
        RegExp
    };
    context.globalThis = context;

    const stubs = `
        const applyNativeBottomInsetVar = () => {};
        const isCapacitorNative = () => false;
        const syncNativeDailyReminder = async () => ({ ok: true });
        const clearUpdateBannerDom = () => {};
        const placeUpdateBanner = () => {};
        const refreshUpdateBannerConfig = async () => {};
        const applyNativeStatusBarTheme = async () => {};
        const runCounterVibration = async () => {};
        const runDragReorderNudge = () => {};
        const pickRandomQuote = () => 'quote';
        const REMINDER_FIXED_BODY = 'body';
        const ESMA_DEFAULT_FAZILET = Array(99).fill('');
    `;
    const exports = `
        globalThis.__testApi = {
            loadData,
            saveData,
            ensureInitialHistoryState,
            openOverlay,
            get zikirs() { return zikirs; },
            get clickHistory() { return clickHistory; },
            get dataStoreWriteBlocked() { return dataStoreWriteBlocked; }
        };
    `;
    vm.runInNewContext(`${stubs}\n${appSource}\n${exports}`, context, {
        filename: 'app.js'
    });
    context.__errors = errors;
    context.__historyCalls = historyCalls;
    return context;
}

function testBrowserHistoryUsesWindowHistory() {
    const ctx = loadApp();
    ctx.__testApi.ensureInitialHistoryState();
    assert.deepEqual(ctx.window.history.replaces[0], { viewId: 'homeView', param: null });

    ctx.__testApi.openOverlay('settingsOverlay');
    assert.deepEqual(ctx.window.history.pushes[0], { overlayId: 'settingsOverlay' });
}

function testCorruptStorageIsNotOverwritten() {
    const corruptRaw = '{"folders":';
    const ctx = loadApp({ [dataKey]: corruptRaw });
    ctx.__testApi.loadData();
    const saved = ctx.__testApi.saveData();

    assert.equal(saved, false);
    assert.equal(ctx.__testApi.dataStoreWriteBlocked, true);
    assert.equal(ctx.localStorage.getItem(dataKey), corruptRaw);
}

function testOldEsmaIdsRemapByName() {
    const day = '2026-05-22';
    const oldData = {
        folders: [
            { id: 'f_default', name: 'Varsayılan Zikirler', order: 0 },
            { id: 'f_esma', name: "Esma'ül Hüsna", order: 1 }
        ],
        zikirs: [
            {
                id: 'z_e_0',
                folderId: 'f_esma',
                name: 'Yâ Rahman',
                target: 298,
                meaning: 'old rahman',
                count: 7,
                lastClicked: 10,
                order: 0
            },
            {
                id: 'z_e_1',
                folderId: 'f_esma',
                name: 'Yâ Rahîm',
                target: 258,
                meaning: 'old rahim',
                count: 3,
                lastClicked: 20,
                order: 1
            }
        ],
        history: {
            [day]: {
                z_e_0: 5,
                z_e_1: 2
            }
        },
        settings: { theme: 'navy' },
        reminders: { enabled: false, time: '21:00', lastFiredYmd: null },
        entitlements: { premium: false },
        trash: { v: 1, entries: [] }
    };

    const ctx = loadApp({ [dataKey]: JSON.stringify(oldData) });
    ctx.__testApi.loadData();
    const stored = JSON.parse(ctx.localStorage.getItem(dataKey));
    const esmaById = new Map(stored.zikirs.filter((z) => z.folderId === 'f_esma').map((z) => [z.id, z]));

    assert.equal(esmaById.get('z_e_0').name, 'Yâ Allah');
    assert.equal(esmaById.get('z_e_1').name, 'Yâ Rahman');
    assert.equal(esmaById.get('z_e_1').count, 7);
    assert.equal(esmaById.get('z_e_2').name, 'Yâ Rahîm');
    assert.equal(esmaById.get('z_e_2').count, 3);
    assert.equal(stored.history[day].z_e_1, 5);
    assert.equal(stored.history[day].z_e_2, 2);
    assert.equal(stored.history[day].z_e_0, undefined);
}

testBrowserHistoryUsesWindowHistory();
testCorruptStorageIsNotOverwritten();
testOldEsmaIdsRemapByName();

console.log('app regression tests passed');

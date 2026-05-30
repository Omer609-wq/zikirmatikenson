import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA_KEY = 'zikirmatik_data_v2';

function stripImports(source) {
    return source.replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];\s*/g, '');
}

function createElement(id = 'el') {
    const classes = new Set();
    return {
        id,
        hidden: false,
        value: '',
        textContent: '',
        innerHTML: '',
        dataset: {},
        children: [],
        style: { setProperty() {}, removeProperty() {} },
        classList: {
            add: (...names) => names.forEach((name) => classes.add(name)),
            remove: (...names) => names.forEach((name) => classes.delete(name)),
            toggle: (name, force) => {
                const shouldAdd = force ?? !classes.has(name);
                if (shouldAdd) classes.add(name);
                else classes.delete(name);
                return shouldAdd;
            },
            contains: (name) => classes.has(name)
        },
        setAttribute(name, value) {
            this[name] = String(value);
        },
        getAttribute(name) {
            return this[name] ?? null;
        },
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        insertBefore(child) {
            this.children.push(child);
            return child;
        },
        remove() {},
        addEventListener() {},
        querySelector() {
            return createElement(`${id}:child`);
        },
        querySelectorAll() {
            return [];
        },
        getBoundingClientRect() {
            return { top: 0, width: 0 };
        },
        focus() {}
    };
}

function createDocument() {
    const elements = new Map();
    const get = (id) => {
        if (!elements.has(id)) elements.set(id, createElement(id));
        return elements.get(id);
    };
    return {
        documentElement: createElement('html'),
        getElementById: get,
        createElement,
        querySelector: (selector) => get(`selector:${selector}`),
        querySelectorAll: () => [],
        addEventListener() {}
    };
}

function createLocalStorage(initialEntries = {}) {
    const store = new Map(Object.entries(initialEntries));
    return {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => {
            store.set(key, String(value));
        },
        removeItem: (key) => {
            store.delete(key);
        }
    };
}

function loadAppWithStorage(initialEntries) {
    const source = stripImports(readFileSync(join(ROOT, 'app.js'), 'utf8'));
    const localStorage = createLocalStorage(initialEntries);
    const document = createDocument();
    const window = {
        addEventListener() {},
        open() {},
        matchMedia: () => ({ matches: false }),
        location: { href: 'https://example.test/', origin: 'https://example.test' },
        innerWidth: 390
    };

    const context = vm.createContext({
        console: { error() {}, warn() {}, log() {} },
        localStorage,
        document,
        window,
        navigator: {},
        requestAnimationFrame: (fn) => fn(),
        setTimeout,
        clearTimeout,
        URL,
        Date,
        Math,
        Number,
        String,
        Object,
        Array,
        Set,
        Map,
        JSON,
        RegExp,
        parseInt,
        parseFloat,
        structuredClone,
        applyNativeBottomInsetVar() {},
        isCapacitorNative: () => false,
        syncNativeDailyReminder: async () => ({ ok: true }),
        clearUpdateBannerDom() {},
        placeUpdateBanner() {},
        refreshUpdateBannerConfig: async () => null,
        applyNativeStatusBarTheme: async () => {},
        runCounterVibration: async () => {},
        runDragReorderNudge: async () => {},
        pickRandomQuote: () => 'quote',
        REMINDER_FIXED_BODY: 'reminder',
        ESMA_DEFAULT_FAZILET: []
    });

    new vm.Script(source, { filename: 'app.js' }).runInContext(context);
    return { context, localStorage };
}

test('saveData preserves unreadable persisted data instead of overwriting defaults', () => {
    const corruptPayload = '{"folders":[{"id":"f_user","name":"User data"}],"zikirs":[';
    const { context, localStorage } = loadAppWithStorage({ [DATA_KEY]: corruptPayload });

    context.loadData();
    context.saveData();

    assert.equal(localStorage.getItem(DATA_KEY), corruptPayload);
});

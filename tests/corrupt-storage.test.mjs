import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const DATA_STORAGE_KEY = 'zikirmatik_data_v2';

function stripImports(source) {
    const out = [];
    let skipping = false;
    for (const line of source.split('\n')) {
        if (!skipping && line.startsWith('import ')) {
            skipping = !line.includes(';');
            continue;
        }
        if (skipping) {
            skipping = !line.includes(';');
            continue;
        }
        out.push(line);
    }
    return out.join('\n');
}

function createClassList() {
    const classes = new Set();
    return {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        toggle: (name, force) => {
            const shouldAdd = force === undefined ? !classes.has(name) : !!force;
            if (shouldAdd) classes.add(name);
            else classes.delete(name);
            return shouldAdd;
        },
        contains: (name) => classes.has(name)
    };
}

class FakeElement {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.options = this.children;
        this.attributes = new Map();
        this.classList = createClassList();
        this.dataset = {};
        this.style = {
            setProperty: (key, value) => {
                this.style[key] = value;
            },
            removeProperty: (key) => {
                delete this.style[key];
            }
        };
        this.hidden = false;
        this.checked = false;
        this.disabled = false;
        this.value = '';
        this.textContent = '';
        this.innerHTML = '';
    }

    addEventListener() {}
    removeEventListener() {}
    focus() {}
    remove() {}

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    insertBefore(child, ref) {
        const idx = this.children.indexOf(ref);
        if (idx === -1) this.children.push(child);
        else this.children.splice(idx, 0, child);
        return child;
    }

    querySelector() {
        return null;
    }

    querySelectorAll() {
        return [];
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    getAttribute(name) {
        return this.attributes.get(name) ?? null;
    }
}

function createLocalStorage(initial = {}) {
    const store = new Map(Object.entries(initial));
    const writes = [];
    return {
        writes,
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => {
            writes.push({ key, value: String(value) });
            store.set(key, String(value));
        },
        removeItem: (key) => store.delete(key)
    };
}

function createDocument() {
    const elements = new Map();
    const documentElement = new FakeElement('html');
    return {
        documentElement,
        body: new FakeElement('body'),
        addEventListener() {},
        createElement: (tag) => new FakeElement(tag),
        getElementById: (id) => {
            if (!elements.has(id)) elements.set(id, new FakeElement('div'));
            return elements.get(id);
        },
        querySelector: () => null,
        querySelectorAll: () => []
    };
}

function loadAppForTest(localStorage) {
    const document = createDocument();
    const window = {
        document,
        localStorage,
        navigator: {},
        innerHeight: 800,
        visualViewport: null,
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
        matchMedia: () => ({
            matches: false,
            addEventListener() {},
            removeEventListener() {}
        }),
        open() {}
    };

    const context = {
        console,
        document,
        window,
        localStorage,
        navigator: window.navigator,
        setTimeout,
        clearTimeout,
        requestAnimationFrame: (cb) => setTimeout(cb, 0),
        applyNativeBottomInsetVar() {},
        isCapacitorNative: () => false,
        syncNativeDailyReminder: async () => ({ ok: true }),
        clearUpdateBannerDom() {},
        placeUpdateBanner() {},
        refreshUpdateBannerConfig: async () => null,
        applyNativeStatusBarTheme: async () => {},
        runCounterVibration: async () => {},
        runDragReorderNudge: async () => {},
        pickRandomQuote: () => 'test quote',
        REMINDER_FIXED_BODY: 'test reminder',
        ESMA_DEFAULT_FAZILET: Array.from({ length: 99 }, () => '')
    };
    context.globalThis = context;

    const source = stripImports(fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8'));
    vm.runInNewContext(
        `${source}\nglobalThis.__testApi = { loadData, saveData, logClick };`,
        context,
        { filename: 'app.js' }
    );
    return context.__testApi;
}

{
    const corruptRaw = '{"folders":';
    const localStorage = createLocalStorage({ [DATA_STORAGE_KEY]: corruptRaw });
    const app = loadAppForTest(localStorage);

    app.loadData();
    app.saveData();
    app.logClick('z_1');

    assert.equal(
        localStorage.getItem(DATA_STORAGE_KEY),
        corruptRaw,
        'malformed persisted app data must not be overwritten by default in-memory data'
    );
    assert.equal(
        localStorage.writes.filter((w) => w.key === DATA_STORAGE_KEY).length,
        0,
        'save paths should be blocked for zikirmatik_data_v2 after a parse failure'
    );
}

{
    const validRaw = JSON.stringify({
        folders: [{ id: 'f_default', name: 'Varsayılan Zikirler' }],
        zikirs: [{ id: 'z_1', folderId: 'f_default', name: 'Subhanallah', target: 33, count: 0 }],
        history: {},
        settings: { theme: 'navy' }
    });
    const localStorage = createLocalStorage({ [DATA_STORAGE_KEY]: validRaw });
    const app = loadAppForTest(localStorage);

    app.loadData();
    app.logClick('z_1');

    const saved = JSON.parse(localStorage.getItem(DATA_STORAGE_KEY));
    assert.equal(saved.history[new Date().toISOString().slice(0, 10)].z_1, 1);
    assert.ok(
        localStorage.writes.some((w) => w.key === DATA_STORAGE_KEY),
        'valid persisted app data should continue to save normally'
    );
}

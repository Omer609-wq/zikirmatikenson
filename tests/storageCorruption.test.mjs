import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const DATA_KEY = 'zikirmatik_data_v2';

function createElement(tagName = 'div') {
    return {
        tagName: tagName.toUpperCase(),
        style: { setProperty() {} },
        classList: {
            add() {},
            remove() {},
            toggle() {},
            contains() { return false; }
        },
        dataset: {},
        children: [],
        hidden: false,
        checked: false,
        value: '',
        textContent: '',
        innerHTML: '',
        appendChild(child) {
            this.children.push(child);
            return child;
        },
        insertBefore(child) {
            this.children.push(child);
            return child;
        },
        remove() {},
        setAttribute() {},
        getAttribute() { return null; },
        addEventListener() {},
        removeEventListener() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
        focus() {},
        select() {}
    };
}

function loadAppWithStorage(initialStorage = {}) {
    const storage = new Map(Object.entries(initialStorage));
    const writes = [];
    const documentElement = createElement('html');
    const body = createElement('body');

    const context = {
        console: {
            log() {},
            warn() {},
            error() {}
        },
        localStorage: {
            getItem(key) {
                return storage.has(key) ? storage.get(key) : null;
            },
            setItem(key, value) {
                writes.push({ key, value });
                storage.set(key, value);
            },
            removeItem(key) {
                storage.delete(key);
            }
        },
        document: {
            documentElement,
            body,
            getElementById() { return createElement('div'); },
            querySelector() { return null; },
            querySelectorAll() { return []; },
            createElement,
            addEventListener() {}
        },
        window: {
            addEventListener() {},
            matchMedia() {
                return { matches: false, addEventListener() {}, removeEventListener() {} };
            },
            open() {},
            innerWidth: 390,
            history: {
                replaceState() {},
                pushState() {},
                back() {}
            },
            location: { pathname: '/', search: '', hash: '' }
        },
        navigator: {},
        requestAnimationFrame(callback) {
            return setTimeout(callback, 0);
        },
        cancelAnimationFrame(id) {
            clearTimeout(id);
        },
        setTimeout,
        clearTimeout,
        Date,
        Math,
        JSON,
        Number,
        String,
        parseInt,
        parseFloat,
        structuredClone: globalThis.structuredClone
    };
    context.globalThis = context;

    const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8')
        .replace(/^\s*import[\s\S]*?;\n/gm, '')
        .replace(/\nwindow\.addEventListener\('DOMContentLoaded', init\);\s*$/, '');

    const stubs = `
        const applyNativeBottomInsetVar = () => {};
        const isCapacitorNative = () => false;
        const syncNativeDailyReminder = async () => {};
        const clearUpdateBannerDom = () => {};
        const placeUpdateBanner = () => {};
        const refreshUpdateBannerConfig = async () => null;
        const applyNativeStatusBarTheme = async () => {};
        const runCounterVibration = () => {};
        const runDragReorderNudge = () => {};
        const pickRandomQuote = () => ({ text: '', source: '' });
        const REMINDER_FIXED_BODY = '';
        const ESMA_DEFAULT_FAZILET = {};
    `;

    const expose = `
        globalThis.__appTestApi = {
            loadData,
            saveData,
            getFolderIds: () => folders.map((folder) => folder.id)
        };
    `;

    vm.runInNewContext(`${stubs}\n${source}\n${expose}`, context, { filename: 'app.js' });

    return { api: context.__appTestApi, storage, writes };
}

{
    const corruptRaw = '{"folders":[{"id":"f_user","name":"Kullanıcı klasörü"}]';
    const { api, storage, writes } = loadAppWithStorage({ [DATA_KEY]: corruptRaw });

    api.loadData();
    assert.deepEqual(api.getFolderIds(), ['f_default', 'f_esma']);

    api.saveData();
    assert.equal(storage.get(DATA_KEY), corruptRaw);
    assert.equal(writes.length, 0);
}

{
    const { api, storage, writes } = loadAppWithStorage();

    api.loadData();
    api.saveData();

    assert.equal(writes.length, 1);
    const saved = JSON.parse(storage.get(DATA_KEY));
    assert.ok(Array.isArray(saved.folders));
    assert.equal(saved.folders[0].id, 'f_default');
}

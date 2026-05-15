const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createElement(id) {
    const el = {
        id,
        style: {},
        dataset: {},
        hidden: false,
        checked: false,
        value: '',
        textContent: '',
        innerHTML: '',
        options: [],
        classList: {
            add() {},
            remove() {},
            toggle() {},
            contains() { return false; }
        },
        addEventListener() {},
        appendChild(child) {
            if (this.options && child && child.tagName === 'option') this.options.push(child);
        },
        remove() {},
        setAttribute() {},
        getAttribute() { return null; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        closest() { return null; },
        getBoundingClientRect() {
            return { top: 0, left: 0, width: 0, height: 0 };
        }
    };
    return el;
}

function createDocument() {
    const elements = new Map();
    return {
        documentElement: createElement('html'),
        body: createElement('body'),
        createElement(tagName) {
            const el = createElement(tagName);
            el.tagName = tagName;
            return el;
        },
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, createElement(id));
            return elements.get(id);
        },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        addEventListener() {},
        removeEventListener() {}
    };
}

function createLocalStorage(initial) {
    const store = new Map(Object.entries(initial));
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

const oldStorage = {
    folders: [
        { id: 'f_default', name: 'Varsayılan Zikirler', order: 0 },
        { id: 'f_esma', name: 'Esma\'ül Hüsna', order: 1 }
    ],
    zikirs: [
        { id: 'z_e_0', folderId: 'f_esma', name: 'Yâ Rahman', target: 298, count: 7, lastClicked: 100, order: 0 },
        { id: 'z_e_1', folderId: 'f_esma', name: 'Yâ Rahîm', target: 258, count: 11, lastClicked: 200, favorite: true, order: 1 },
        { id: 'z_e_19', folderId: 'f_esma', name: 'Yâ Kâbıd', target: 903, count: 13, lastClicked: 300, order: 19 },
        { id: 'z_e_20', folderId: 'f_esma', name: 'Yâ Kâbıd', target: 903, count: 5, lastClicked: 400, order: 20 }
    ],
    history: {
        '2026-04-10': {
            z_e_0: 2,
            z_e_1: 4,
            z_e_19: 6,
            z_e_20: 8
        }
    },
    settings: { vibration: true }
};

const localStorage = createLocalStorage({
    zikirmatik_data_v2: JSON.stringify(oldStorage)
});
const context = {
    console,
    localStorage,
    document: createDocument(),
    window: {
        addEventListener() {},
        removeEventListener() {}
    },
    navigator: {},
    Notification: { permission: 'denied', requestPermission: () => Promise.resolve('denied') },
    setTimeout,
    clearTimeout
};

vm.createContext(context);
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
vm.runInContext(source, context);

context.loadData();

const migrated = JSON.parse(localStorage.getItem('zikirmatik_data_v2'));
const byId = new Map(migrated.zikirs.map((z) => [z.id, z]));
const migratedHistory = migrated.history['2026-04-10'];

assert.strictEqual(byId.get('z_e_0').name, 'Yâ Allah');
assert.strictEqual(byId.get('z_e_0').count, 0);
assert.strictEqual(byId.get('z_e_1').name, 'Yâ Rahman');
assert.strictEqual(byId.get('z_e_1').count, 7);
assert.strictEqual(byId.get('z_e_2').name, 'Yâ Rahîm');
assert.strictEqual(byId.get('z_e_2').count, 11);
assert.strictEqual(byId.get('z_e_2').favorite, true);
assert.strictEqual(byId.get('z_e_20').name, 'Yâ Kâbıd');
assert.strictEqual(byId.get('z_e_20').count, 18);
assert.strictEqual(byId.get('z_e_20').lastClicked, 400);

assert.strictEqual(migratedHistory.z_e_1, 2);
assert.strictEqual(migratedHistory.z_e_2, 4);
assert.strictEqual(migratedHistory.z_e_20, 14);
assert.ok(!Object.prototype.hasOwnProperty.call(migratedHistory, 'z_e_0'));
assert.ok(!Object.prototype.hasOwnProperty.call(migratedHistory, 'z_e_19'));

console.log('Esma migration preserves shifted counters and history.');

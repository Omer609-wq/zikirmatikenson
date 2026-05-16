const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function runLoadData(payload) {
    const store = {
        zikirmatik_data_v2: JSON.stringify(payload)
    };
    const context = {
        console,
        navigator: {},
        window: { addEventListener() {} },
        document: {
            addEventListener() {},
            getElementById() { return null; },
            querySelectorAll() { return []; }
        },
        localStorage: {
            getItem(key) {
                return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
            },
            setItem(key, value) {
                store[key] = value;
            }
        },
        setTimeout,
        clearTimeout
    };

    vm.createContext(context);
    vm.runInContext(`${appCode}\n;globalThis.__test = { loadData, state: () => ({ folders, zikirs, history }) };`, context);
    context.__test.loadData();
    return {
        state: context.__test.state(),
        saved: JSON.parse(store.zikirmatik_data_v2)
    };
}

function basePayload(zikirs, history) {
    return {
        folders: [
            { id: 'f_default', name: 'Varsayılan Zikirler' },
            { id: 'f_esma', name: 'Esma\'ül Hüsna' }
        ],
        zikirs: [
            { id: 'z_1', folderId: 'f_default', name: 'Subhanallah', target: 33, meaning: '', count: 2, lastClicked: 1 },
            ...zikirs
        ],
        history,
        settings: { vibration: true, sound: false, wakeLock: false }
    };
}

{
    const { state, saved } = runLoadData(basePayload(
        [
            { id: 'z_e_0', folderId: 'f_esma', name: 'Yâ Rahman', target: 298, meaning: 'old', count: 7, lastClicked: 100, favorite: true },
            { id: 'z_e_18', folderId: 'f_esma', name: 'Yâ Alîm', target: 150, meaning: 'old', count: 18, lastClicked: 180 },
            { id: 'z_e_19', folderId: 'f_esma', name: 'Yâ Kâbıd', target: 903, meaning: 'old', count: 19, lastClicked: 190 }
        ],
        {
            '2026-05-16': { z_e_0: 3, z_e_18: 4, z_e_19: 5, z_1: 2 }
        }
    ));

    const esma = state.zikirs.filter(z => z.folderId === 'f_esma');
    assert.strictEqual(esma.length, 99);
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_0').name, 'Yâ Allah');
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_0').count, 0);
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_1').name, 'Yâ Rahman');
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_1').count, 7);
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_1').favorite, true);
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_19').name, 'Yâ Alîm');
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_19').count, 18);
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_20').name, 'Yâ Kâbıd');
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_20').count, 19);

    assert.strictEqual(state.history['2026-05-16'].z_e_1, 3);
    assert.strictEqual(state.history['2026-05-16'].z_e_19, 4);
    assert.strictEqual(state.history['2026-05-16'].z_e_20, 5);
    assert.strictEqual(state.history['2026-05-16'].z_e_0, undefined);
    assert.strictEqual(state.history['2026-05-16'].z_e_18, undefined);
    assert.strictEqual(saved.zikirs.filter(z => z.folderId === 'f_esma').length, 99);
}

{
    const { state } = runLoadData(basePayload(
        [
            { id: 'z_e_19', folderId: 'f_esma', name: 'Yâ Kâbıd', target: 903, meaning: 'old duplicate', count: 10, lastClicked: 10 },
            { id: 'z_e_20', folderId: 'f_esma', name: 'Yâ Kâbıd', target: 903, meaning: 'new duplicate', count: 2, lastClicked: 20 }
        ],
        {
            '2026-05-16': { z_e_19: 4, z_e_20: 1 }
        }
    ));

    const kabid = state.zikirs.find(z => z.id === 'z_e_20');
    assert.strictEqual(kabid.name, 'Yâ Kâbıd');
    assert.strictEqual(kabid.count, 12);
    assert.strictEqual(kabid.lastClicked, 20);
    assert.strictEqual(state.history['2026-05-16'].z_e_20, 5);
    assert.strictEqual(state.history['2026-05-16'].z_e_19, undefined);
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_19').name, 'Yâ Alîm');
    assert.strictEqual(state.zikirs.find(z => z.id === 'z_e_19').count, 0);
}

console.log('esmaMigration.test.js passed');

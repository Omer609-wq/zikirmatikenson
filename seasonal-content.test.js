import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getActiveSeasonalEvents,
    persistSeasonalCountsFromZikirs,
    refreshSeasonalContent
} from './seasonal-content.js';

function installLocalStorage() {
    const store = new Map();
    globalThis.localStorage = {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        },
        removeItem(key) {
            store.delete(key);
        },
        clear() {
            store.clear();
        }
    };
    return store;
}

function seasonalPayload(zikirs) {
    return {
        version: 1,
        events: [
            {
                id: 'test-event',
                start: '2020-01-01T00:00:00+03:00',
                end: '2099-12-31T23:59:59+03:00',
                title: { tr: 'Test Event' },
                zikirs
            }
        ]
    };
}

test('seasonal counts follow stable zikir identity after remote reorder', async () => {
    installLocalStorage();
    const originalFetch = globalThis.fetch;
    const firstZikir = {
        name: 'Estağfirullah',
        arabic: 'أَسْتَغْفِرُ اللَّهَ',
        meaning: { tr: "Allah'tan bağışlanma dilerim." },
        target: 100
    };
    const secondZikir = {
        name: 'Salavat',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
        meaning: { tr: "Allah'ım, Muhammed'e salat et." },
        target: 100
    };

    try {
        let payload = seasonalPayload([firstZikir, secondZikir]);
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => payload
        });

        await refreshSeasonalContent('tr');
        const initialItems = getActiveSeasonalEvents()[0].zikirs;
        persistSeasonalCountsFromZikirs([{ ...initialItems[0], count: 500, lastClicked: 123 }]);

        payload = seasonalPayload([secondZikir, firstZikir]);
        await refreshSeasonalContent('tr');
        const reorderedItems = getActiveSeasonalEvents()[0].zikirs;
        const counted = reorderedItems.find((z) => z.name === 'Estağfirullah');
        const uncounted = reorderedItems.find((z) => z.name === 'Salavat');

        assert.equal(counted.count, 500);
        assert.equal(counted.lastClicked, 123);
        assert.equal(uncounted.count, 0);
    } finally {
        globalThis.fetch = originalFetch;
        delete globalThis.localStorage;
    }
});

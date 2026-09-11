import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { IN_APP_OVERLAY_IDS, SELF_MANAGED_OVERLAY_IDS } from './overlay-registry.js';

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
const html = read('index.html');
const appJs = read('app.js');

/** index.html'deki her .modal-overlay öğesinin id'si. */
function htmlOverlayIds() {
    const ids = new Set();
    for (const m of html.matchAll(/<div\b[^>]*>/g)) {
        const tag = m[0];
        if (!/\bclass="[^"]*\bmodal-overlay\b/.test(tag)) continue;
        const id = tag.match(/\bid="([A-Za-z0-9_-]+)"/);
        if (id) ids.add(id[1]);
    }
    return ids;
}

const listed = new Set(IN_APP_OVERLAY_IDS);
const selfManaged = new Set(Object.keys(SELF_MANAGED_OVERLAY_IDS));

test('index.htmldeki her overlay ya ortak listede ya da kendi modülünde yönetiliyor', () => {
    const ids = htmlOverlayIds();
    assert.ok(ids.size >= 10, `beklenenden az overlay bulundu (${ids.size}); ayrıştırıcı bozulmuş olabilir`);
    const missing = [...ids].filter((id) => !listed.has(id) && !selfManaged.has(id));
    assert.deepEqual(
        missing,
        [],
        'Bu overlay Geri tuşuyla kapanmaz ve popstate onu kapatmaz; lib/overlay-registry.js listesine ekle'
    );
});

test('listede index.htmlde olmayan (bayat) kayıt yok', () => {
    const ids = htmlOverlayIds();
    const stale = [...listed, ...selfManaged].filter((id) => !ids.has(id));
    assert.deepEqual(stale, []);
});

test('openOverlay ile açılan her overlay ortak listede', () => {
    // openOverlay geçmişe durum ekler; kapanışta popstate -> closeAllOverlays onu
    // kapatmalı. Listede değilse X butonu history.back() çağırır ama overlay kapanmaz.
    const opened = new Set([...appJs.matchAll(/openOverlay\(\s*'([A-Za-z0-9_-]+)'/g)].map((m) => m[1]));
    assert.ok(opened.size > 0, 'openOverlay çağrısı bulunamadı; ayrıştırıcı bozulmuş olabilir');
    const notListed = [...opened].filter((id) => !listed.has(id));
    assert.deepEqual(notListed, []);
});

test('tekrar eden ya da iki listede birden olan kayıt yok', () => {
    assert.equal(listed.size, IN_APP_OVERLAY_IDS.length, 'ortak listede tekrar var');
    const both = [...selfManaged].filter((id) => listed.has(id));
    assert.deepEqual(both, []);
});

test('üst üste açılabilenlerde üstteki önce gelir (Geri önce onu kapatsın)', () => {
    const at = (id) => IN_APP_OVERLAY_IDS.indexOf(id);
    assert.equal(at('appDialogOverlay'), 0, 'onay diyaloğu her şeyin üstünde');
    assert.ok(at('libraryFolderSelectOverlay') < at('libraryDetailOverlay'), 'klasör seçimi detayın üstünde');
    assert.ok(at('premiumUpsellOverlay') < at('zikirStatsOverlay'), 'premium teklifi istatistiğin üstünde');
});

test('app.js overlay listelerini elle tutmuyor, ortak listeden okuyor', () => {
    // Yukarıdaki testler listenin kendisini denetler; app.js onu kullanmayıp
    // eski elle yazılmış dizilerini tutsaydı yine geçerlerdi ve kayma sürerdi.
    assert.match(appJs, /from '\.\/lib\/overlay-registry\.js'/);
    assert.doesNotMatch(appJs, /const IN_APP_BACK_OVERLAY_IDS\s*=\s*\[/);
    const closeAll = appJs.match(/function closeAllOverlays\(\) \{([\s\S]*?)\n\}/);
    assert.ok(closeAll, 'closeAllOverlays bulunamadı');
    assert.match(closeAll[1], /IN_APP_OVERLAY_IDS/);
    assert.doesNotMatch(closeAll[1], /getElementById\('[A-Za-z]+Overlay'\)/, 'closeAllOverlays yine elle liste tutuyor');
});

test('Geri kararı history.length’e değil uygulamanın kendi yığınına dayanıyor', () => {
    // history.length uygulama öncesi sayfaları ve ileri kayıtları da sayar.
    // Ona güvenen dal ana ekranda tarayıcıda sayfadan çıkarıyor, Android'de ise
    // canNavigateBackInApp'i true yapıp Geri'yi hiçbir şey yapmaz hale getiriyordu
    // (kullanıcı Geri ile uygulamadan çıkamıyordu).
    for (const fn of ['canNavigateBackInApp', 'goBackInApp']) {
        const body = appJs.match(new RegExp(`function ${fn}\\([^)]*\\) \\{([\\s\\S]*?)\\n\\}`));
        assert.ok(body, `${fn} bulunamadı`);
        // Yalnızca kodu denetle; bu kuralı açıklayan yorumlar da "history.length" içeriyor.
        const code = body[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        assert.doesNotMatch(code, /history\.length/, `${fn} history.length kullanmamalı`);
    }
});

test('app.js tarayıcı History API’sini window.history ile çağırıyor', () => {
    // app.js'te `let history = {}` (sayaç geçmişi) global History'yi gölgeler.
    // Niteliksiz history.pushState TypeError atar, try/catch yutar ve geri
    // gezinme sessizce ölür — bu yıllarca fark edilmedi.
    assert.match(appJs, /^let history = /m, 'gölgeleyen değişken kalktıysa bu test gözden geçirilmeli');
    const bare = [
        ...appJs.matchAll(/(^|[^.\w])history\.(pushState|replaceState|back|go|forward|state|length)\b/gm)
    ].map((m) => m[0].trim());
    assert.deepEqual(bare, []);
});

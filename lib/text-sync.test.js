import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateKnownTextPrefix } from './text-sync.js';

test('migrateKnownTextPrefix tam eşleşmede kanon metne çeker', () => {
    const known = new Set([
        'Dilediğine darlık veren, daraltan',
        'Dilediğine darlık verme gücü olan'
    ]);
    const canon = 'Dilediğine darlık veren, daraltan';

    assert.equal(
        migrateKnownTextPrefix('Dilediğine darlık verme gücü olan', known, canon),
        'Dilediğine darlık veren, daraltan'
    );
});

test('migrateKnownTextPrefix kullanıcı ekini koruyarak eski öneki günceller', () => {
    const known = new Set([
        'Dilediğine darlık veren, daraltan',
        'Dilediğine darlık verme gücü olan'
    ]);
    const canon = 'Dilediğine darlık veren, daraltan';

    // Tire ile eklenen not
    assert.equal(
        migrateKnownTextPrefix('Dilediğine darlık verme gücü olan - her gün 100 defa', known, canon),
        'Dilediğine darlık veren, daraltan - her gün 100 defa'
    );

    // Parantez ile eklenen not
    assert.equal(
        migrateKnownTextPrefix('Dilediğine darlık verme gücü olan (şifa niyetine)', known, canon),
        'Dilediğine darlık veren, daraltan (şifa niyetine)'
    );

    // Satırbaşı ile eklenen not
    assert.equal(
        migrateKnownTextPrefix('Dilediğine darlık verme gücü olan\nNot: yatsıdan sonra', known, canon),
        'Dilediğine darlık veren, daraltan\nNot: yatsıdan sonra'
    );
});

test('migrateKnownTextPrefix kullanıcının sıfırdan yazdığı özel metne dokunmaz (null)', () => {
    const known = new Set([
        'Dilediğine darlık veren, daraltan',
        'Dilediğine darlık verme gücü olan'
    ]);
    const canon = 'Dilediğine darlık veren, daraltan';

    assert.equal(
        migrateKnownTextPrefix('Özel duam: Rabbim beni affet', known, canon),
        null
    );
});

test('migrateKnownTextPrefix zaten güncel metne dokunmaz (null)', () => {
    const known = new Set([
        'Dilediğine darlık veren, daraltan',
        'Dilediğine darlık verme gücü olan'
    ]);
    const canon = 'Dilediğine darlık veren, daraltan';

    assert.equal(
        migrateKnownTextPrefix('Dilediğine darlık veren, daraltan', known, canon),
        null
    );
    assert.equal(
        migrateKnownTextPrefix('Dilediğine darlık veren, daraltan - her gün 100 defa', known, canon),
        null
    );
});

test('migrateKnownTextPrefix boş metinlerde dokunmaz (null)', () => {
    const known = new Set(['Kanon Metin']);
    assert.equal(migrateKnownTextPrefix('', known, 'Kanon Metin'), null);
    assert.equal(migrateKnownTextPrefix(null, known, 'Kanon Metin'), null);
    assert.equal(migrateKnownTextPrefix('   ', known, 'Kanon Metin'), null);
});

/** Senkron her açılışta çalışır: n kez uygula, son hâli döndür. */
function acilislar(cur, known, canon, n = 5) {
    for (let i = 0; i < n; i++) {
        const next = migrateKnownTextPrefix(cur, known, canon);
        if (next == null) break;
        cur = next;
    }
    return cur;
}

test('eski metin yeninin önekiyse: notlu kayıt bir kez güncellenir, sonra sabit kalır', () => {
    const eski = "Elhamdülillâhillezî et'amenâ ve sekânâ";
    const canon = "Elhamdülillâhillezî et'amenâ ve sekânâ ve ce'alenâ müslimîn";
    const known = new Set([eski, canon]);

    assert.equal(acilislar(eski + ' (aile sofrası)', known, canon), canon + ' (aile sofrası)');
    // Güncel metne not ekleyen kullanıcı: hiç dokunulmaz (eskiden devamı her açılışta ekleniyordu)
    assert.equal(migrateKnownTextPrefix(canon + ' (aile sofrası)', known, canon), null);
    assert.equal(migrateKnownTextPrefix(canon + ', her yemekte', known, canon), null);
});

test('kısaltılan metin: eski metin kanonla başlasa da not korunur ve sabit kalır', () => {
    const eski = 'Tek ve benzersiz olduğunu hatırlatır; şirkten ve çoğaltmaktan sakınır.';
    const canon = 'Tek ve benzersiz olduğunu hatırlatır';
    const known = new Set([eski, canon]);

    assert.equal(acilislar(eski + ' - notum', known, canon), canon + ' - notum');
    assert.equal(acilislar(eski, known, canon), canon);
});

test('gerçek düzeltme dosyası: her eski metin + not tek açılışta güncellenir, sonra değişmez', async () => {
    const fs = await import('node:fs');
    const raw = JSON.parse(fs.readFileSync(new URL('../public/library-overrides.json', import.meta.url), 'utf8'));
    let denenen = 0;
    for (const [id, item] of Object.entries(raw.items)) {
        const alanlar = [
            ['meaning', item.tr && item.tr.meaning, [item.en && item.en.meaning]],
            ['fazilet', item.tr && item.tr.context, []]
        ];
        for (const [alan, canon, digerKanonlar] of alanlar) {
            const prev = (item.prev && item.prev[alan]) || [];
            if (!canon || !prev.length) continue;
            const known = new Set([canon, ...digerKanonlar.filter(Boolean), ...prev]);
            for (const eski of prev) {
                const ilk = migrateKnownTextPrefix(eski + ' (notum)', known, canon);
                if (eski === canon) {
                    assert.equal(ilk, null, `${id}.${alan}: güncel metin + not değişmemeli`);
                    continue;
                }
                assert.equal(ilk, canon + ' (notum)', `${id}.${alan}: not korunarak güncellenmeli`);
                assert.equal(migrateKnownTextPrefix(ilk, known, canon), null, `${id}.${alan}: ikinci açılışta değişmemeli`);
                denenen++;
            }
        }
    }
    assert.ok(denenen > 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
    applyQuranZikirAutoContent,
    applyQuranZikirFormEdits,
    normalizeQuranCustom,
    releaseQuranCustomFields
} from './quran-zikir-fields.js';

function quranZikir(extra = {}) {
    return {
        id: 'z_q',
        name: 'Fâtiha 1',
        arabic: 'بِسْمِ اللَّهِ',
        meaning: 'Rahmân ve Rahîm olan Allah’ın adıyla',
        quranRef: { s: 1, a: 1, ayahs: [1] },
        ...extra
    };
}

test('senkron, kullanıcının değiştirdiği adı ve notu korur', () => {
    const z = quranZikir();
    applyQuranZikirFormEdits(
        z,
        { name: 'Fâtiha 1', arabic: z.arabic, meaning: z.meaning },
        { name: 'Sabah ayetim', arabic: z.arabic, meaning: 'Her sabah oku' }
    );
    assert.deepEqual(z.quranCustom, { name: true, meaning: true });

    const changed = applyQuranZikirAutoContent(z, {
        name: 'Al-Fatiha 1',
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ',
        meaning: 'In the name of Allah'
    });
    assert.equal(changed, true);
    assert.equal(z.name, 'Sabah ayetim');
    assert.equal(z.meaning, 'Her sabah oku');
    // Dokunulmayan alan uygulamanın kalır
    assert.equal(z.arabic, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ');
});

test('formda değişmeyen alan yazılmaz ve kullanıcıya geçmez', () => {
    const z = quranZikir();
    // Arapça arayüzde ad kutusuna ayetin Arapçası gelir; dokunulmazsa ad değişmemeli
    applyQuranZikirFormEdits(
        z,
        { name: z.arabic, arabic: z.arabic, meaning: z.meaning },
        { name: z.arabic, arabic: z.arabic, meaning: z.meaning }
    );
    assert.equal(z.name, 'Fâtiha 1');
    assert.equal(z.quranCustom, undefined);
});

test('kullanıcının boşalttığı not boş kalır', () => {
    const z = quranZikir();
    applyQuranZikirFormEdits(z, { meaning: z.meaning }, { meaning: '' });
    applyQuranZikirAutoContent(z, { meaning: 'Rahmân ve Rahîm olan Allah’ın adıyla' });
    assert.equal(z.meaning, '');
});

test('okuma modu değişince Arapça ve not yeniden uygulamaya geçer, ad kalır', () => {
    const z = quranZikir({ quranCustom: { name: true, arabic: true, meaning: true } });
    releaseQuranCustomFields(z, ['arabic', 'meaning']);
    assert.deepEqual(z.quranCustom, { name: true });
    releaseQuranCustomFields(z, ['name']);
    assert.equal('quranCustom' in z, false);
});

test('kopya ile özgün aynı işaret nesnesini paylaşsa da biri diğerini değiştirmez', () => {
    const original = quranZikir({ quranCustom: { name: true } });
    const copy = { ...original, id: 'z_copy' };
    applyQuranZikirFormEdits(copy, { meaning: copy.meaning }, { meaning: 'Kopyanın notu' });
    releaseQuranCustomFields(copy, ['name']);
    assert.deepEqual(original.quranCustom, { name: true });
    assert.deepEqual(copy.quranCustom, { meaning: true });
});

test('işaretler kayıttan yalnız bilinen alanlar olarak okunur', () => {
    assert.deepEqual(normalizeQuranCustom({ name: true, meaning: 'evet', target: true }), { name: true });
    assert.equal(normalizeQuranCustom({}), undefined);
    assert.equal(normalizeQuranCustom(null), undefined);
});

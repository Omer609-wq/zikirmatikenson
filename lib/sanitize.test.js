import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeStoredZikir } from './zikir-sanitize-fields.js';

test('sanitizeStoredZikir preserves rich fields used by trash restore', () => {
    const trashedZikir = sanitizeStoredZikir({
        id: 'z_quran',
        folderId: 'f_default',
        name: 'Quran counter',
        arabic: 'Arabic text',
        target: 33,
        meaning: 'Meaning text',
        count: 7,
        lastClicked: 456,
        order: 2,
        favorite: true,
        fazilet: 'User note',
        libraryId: 'lib_d_sample',
        quranRef: { s: 2, a: 255, ayahs: [255, 256] },
        quranDisplayMode: 'translit-ar',
        quranCounterLayout: 'compact'
    }, 0);

    const folderZikir = sanitizeStoredZikir({
        id: 'z_library',
        folderId: 'f_saved',
        name: 'Library item',
        arabic: 'Arabic text',
        target: 99,
        meaning: 'Meaning text',
        count: 11,
        favorite: true,
        fazilet: 'Folder note',
        libraryId: 'lib_z_sample',
        quranRef: { s: 1, a: 1, ayahs: [1] },
        quranDisplayMode: 'ar-only',
        quranCounterLayout: 'text-only'
    });

    assert.equal(trashedZikir.favorite, true);
    assert.equal(trashedZikir.fazilet, 'User note');
    assert.equal(trashedZikir.libraryId, 'lib_d_sample');
    assert.deepEqual(trashedZikir.quranRef, { s: 2, a: 255, ayahs: [255, 256] });
    assert.equal(trashedZikir.quranDisplayMode, 'translit-ar');
    assert.equal(trashedZikir.quranCounterLayout, 'compact');

    assert.equal(folderZikir.favorite, true);
    assert.equal(folderZikir.fazilet, 'Folder note');
    assert.equal(folderZikir.libraryId, 'lib_z_sample');
    assert.deepEqual(folderZikir.quranRef, { s: 1, a: 1, ayahs: [1] });
    assert.equal(folderZikir.quranDisplayMode, 'ar-only');
    assert.equal(folderZikir.quranCounterLayout, 'text-only');
});

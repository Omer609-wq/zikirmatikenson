import test from 'node:test';
import assert from 'node:assert/strict';
import { getFoldersForLibraryItem, formatFolderNames } from './library-folders.js';

const FOLDERS = [
    { id: 'f_default', name: 'Varsayılan Zikirler' },
    { id: 'f_esma', name: "Esma'ül Hüsna" },
    { id: 'f_sabah', name: 'Sabah' }
];

test('maddenin bulunduğu klasörleri döndürür', () => {
    const zikirs = [
        { libraryId: 'lib_1', folderId: 'f_default' },
        { libraryId: 'lib_2', folderId: 'f_sabah' }
    ];
    const out = getFoldersForLibraryItem('lib_1', zikirs, FOLDERS);
    assert.deepEqual(out.map((f) => f.id), ['f_default']);
});

test('aynı madde birden fazla klasörde olabilir', () => {
    const zikirs = [
        { libraryId: 'lib_1', folderId: 'f_sabah' },
        { libraryId: 'lib_1', folderId: 'f_default' }
    ];
    const out = getFoldersForLibraryItem('lib_1', zikirs, FOLDERS);
    // klasör sırası korunur (zikir ekleme sırası değil)
    assert.deepEqual(out.map((f) => f.id), ['f_default', 'f_sabah']);
});

test('aynı klasöre iki kez eklenmişse tek kez sayılır', () => {
    const zikirs = [
        { libraryId: 'lib_1', folderId: 'f_default' },
        { libraryId: 'lib_1', folderId: 'f_default' }
    ];
    assert.equal(getFoldersForLibraryItem('lib_1', zikirs, FOLDERS).length, 1);
});

test('silinmiş klasöre bağlı artık kayıt elenir', () => {
    const zikirs = [{ libraryId: 'lib_1', folderId: 'f_silinmis' }];
    assert.deepEqual(getFoldersForLibraryItem('lib_1', zikirs, FOLDERS), []);
});

test('hiç eklenmemişse boş döner', () => {
    const zikirs = [{ libraryId: 'lib_2', folderId: 'f_default' }];
    assert.deepEqual(getFoldersForLibraryItem('lib_1', zikirs, FOLDERS), []);
});

test('libraryId olmayan zikirler (kullanıcının kendi ekledikleri) sayılmaz', () => {
    const zikirs = [
        { folderId: 'f_default' },
        { libraryId: '', folderId: 'f_default' },
        { libraryId: null, folderId: 'f_default' }
    ];
    assert.deepEqual(getFoldersForLibraryItem('lib_1', zikirs, FOLDERS), []);
});

test('bozuk/eksik girdide çökmez', () => {
    assert.deepEqual(getFoldersForLibraryItem('lib_1', null, FOLDERS), []);
    assert.deepEqual(getFoldersForLibraryItem('lib_1', [], null), []);
    assert.deepEqual(getFoldersForLibraryItem('', [], FOLDERS), []);
    assert.deepEqual(getFoldersForLibraryItem(null, [{ libraryId: 'x' }], FOLDERS), []);
    assert.deepEqual(getFoldersForLibraryItem('lib_1', [null, undefined], FOLDERS), []);
});

test('klasör adları birleştirilir', () => {
    assert.equal(formatFolderNames([{ name: 'Sabah' }]), 'Sabah');
    assert.equal(formatFolderNames([{ name: 'Sabah' }, { name: 'Akşam' }]), 'Sabah · Akşam');
});

test('çok klasör varsa kısaltılır', () => {
    const many = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }];
    assert.equal(formatFolderNames(many, 3), 'A · B · C +2');
});

test('boş/bozuk adlar elenir', () => {
    assert.equal(formatFolderNames([]), '');
    assert.equal(formatFolderNames(null), '');
    assert.equal(formatFolderNames([{ name: '  ' }, { name: null }]), '');
    assert.equal(formatFolderNames([{ name: ' Sabah ' }, { name: '' }]), 'Sabah');
});

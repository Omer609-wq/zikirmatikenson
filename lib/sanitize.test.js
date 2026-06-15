import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeLoadedData } from './sanitize.js';

test('sanitizeLoadedData preserves user-authored zikir body text', () => {
    const longMeaning = `  first line\nsecond   line\n${'x'.repeat(1700)}  `;
    const arabic = '  سُبْحَانَ اللَّهِ\nالْحَمْدُ لِلَّهِ  ';
    const fazilet = `note with\n\nparagraphs ${'y'.repeat(2100)}`;

    const data = sanitizeLoadedData({
        folders: [{ id: 'f_default', name: 'Default', order: 0 }],
        zikirs: [
            {
                id: 'z_custom',
                folderId: 'f_default',
                name: 'Custom',
                arabic,
                target: 33,
                meaning: longMeaning,
                count: 0,
                lastClicked: 0,
                order: 0,
                fazilet
            }
        ],
        trash: {
            v: 1,
            entries: [
                {
                    kind: 'zikir',
                    deletedAt: 1,
                    zikir: {
                        id: 'z_deleted',
                        folderId: 'f_default',
                        name: 'Deleted',
                        arabic,
                        target: 33,
                        meaning: longMeaning,
                        count: 0,
                        lastClicked: 0,
                        order: 0
                    }
                }
            ]
        }
    });

    assert.equal(data.zikirs[0].arabic, arabic);
    assert.equal(data.zikirs[0].meaning, longMeaning);
    assert.equal(data.zikirs[0].fazilet, fazilet);
    assert.equal(data.trash.entries[0].zikir.arabic, arabic);
    assert.equal(data.trash.entries[0].zikir.meaning, longMeaning);
});

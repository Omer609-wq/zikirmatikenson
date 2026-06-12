import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, escapeAttr } from './html.js';

test('escapeHtml escapes markup', () => {
    assert.equal(escapeHtml('<b>"a"&</b>'), '&lt;b&gt;&quot;a&quot;&amp;&lt;/b&gt;');
    assert.equal(escapeHtml(''), '');
    assert.equal(escapeHtml(null), '');
});

test('escapeAttr strips control chars', () => {
    assert.equal(escapeAttr('a\u0000b'), 'ab');
    assert.equal(escapeAttr(`it's`), 'it&#39;s');
});

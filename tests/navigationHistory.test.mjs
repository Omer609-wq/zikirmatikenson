import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const appSource = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function extractFunction(name) {
    const start = appSource.indexOf(`function ${name}`);
    assert.notEqual(start, -1, `function ${name} not found`);

    const signatureStart = appSource.indexOf('(', start);
    let parenDepth = 0;
    let signatureEnd = -1;
    for (let i = signatureStart; i < appSource.length; i += 1) {
        const ch = appSource[i];
        if (ch === '(') parenDepth += 1;
        if (ch === ')') parenDepth -= 1;
        if (parenDepth === 0) {
            signatureEnd = i;
            break;
        }
    }

    const bodyStart = appSource.indexOf('{', signatureEnd);
    let depth = 0;
    for (let i = bodyStart; i < appSource.length; i += 1) {
        const ch = appSource[i];
        if (ch === '{') depth += 1;
        if (ch === '}') depth -= 1;
        if (depth === 0) return appSource.slice(start, i + 1);
    }
    throw new Error(`function ${name} was not closed`);
}

function makeClassList() {
    const values = new Set();
    return {
        add(name) {
            values.add(name);
        },
        remove(name) {
            values.delete(name);
        },
        contains(name) {
            return values.has(name);
        }
    };
}

test('overlay navigation uses window.history when click history shadows the global name', () => {
    let browserState = null;
    const replaceStates = [];
    const pushStates = [];
    let backCalls = 0;
    const overlay = { classList: makeClassList() };

    const context = {
        window: {
            history: {
                get state() {
                    return browserState;
                },
                replaceState(state) {
                    browserState = state;
                    replaceStates.push(state);
                },
                pushState(state) {
                    browserState = state;
                    pushStates.push(state);
                },
                back() {
                    backCalls += 1;
                }
            }
        },
        document: {
            getElementById(id) {
                return id === 'settingsOverlay' ? overlay : null;
            }
        }
    };

    vm.createContext(context);
    vm.runInContext(
        `
        let history = {};
        ${extractFunction('getBrowserHistory')}
        ${extractFunction('viewStateEquals')}
        ${extractFunction('getViewState')}
        ${extractFunction('isOverlayState')}
        ${extractFunction('getOverlayState')}
        ${extractFunction('isOverlayActive')}
        ${extractFunction('ensureInitialHistoryState')}
        ${extractFunction('openOverlay')}
        ${extractFunction('closeOverlayPreferHistory')}
        `,
        context
    );

    context.openOverlay('settingsOverlay');

    assert.equal(replaceStates.length, 1);
    assert.equal(replaceStates[0].viewId, 'homeView');
    assert.equal(replaceStates[0].param, null);
    assert.equal(pushStates.length, 1);
    assert.equal(pushStates[0].overlayId, 'settingsOverlay');
    assert.equal(overlay.classList.contains('active'), true);

    context.closeOverlayPreferHistory('settingsOverlay');
    assert.equal(backCalls, 1);
});

test('navigation functions do not call the click-history object as the browser History API', () => {
    const start = appSource.indexOf('function openOverlay');
    const end = appSource.indexOf('function renderPremium', start);
    assert.notEqual(start, -1, 'navigation function block start not found');
    assert.notEqual(end, -1, 'navigation function block end not found');

    const navigationSource = appSource.slice(start, end);
    assert.match(navigationSource, /getBrowserHistory\(\)/);
    assert.doesNotMatch(navigationSource, /\bhistory\.(?:pushState|replaceState|back|state)\b/);
});

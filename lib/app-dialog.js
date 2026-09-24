import { t } from '../i18n.js';

let appDialogKind = 'alert';
let appDialogResolve = null;

function getDialogElements() {
    return {
        overlay: document.getElementById('appDialogOverlay'),
        title: document.getElementById('appDialogTitle'),
        body: document.getElementById('appDialogBody'),
        inputWrap: document.getElementById('appDialogInputWrap'),
        inputLabel: document.getElementById('appDialogInputLabel'),
        input: document.getElementById('appDialogInput'),
        cancelBtn: document.getElementById('appDialogCancelBtn'),
        okBtn: document.getElementById('appDialogOkBtn')
    };
}

function onAppDialogOk() {
    if (!appDialogResolve) return;
    const res = appDialogResolve;
    appDialogResolve = null;
    const { overlay, input } = getDialogElements();
    overlay?.classList.remove('active');
    if (appDialogKind === 'prompt') res(input ? input.value : '');
    else if (appDialogKind === 'confirm') res(true);
    else res();
}

function onAppDialogCancel() {
    if (!appDialogResolve) return;
    const res = appDialogResolve;
    appDialogResolve = null;
    getDialogElements().overlay?.classList.remove('active');
    if (appDialogKind === 'prompt') res(null);
    else if (appDialogKind === 'confirm') res(false);
    else res();
}

function onAppDialogBackdrop() {
    if (appDialogKind === 'alert') onAppDialogOk();
    else onAppDialogCancel();
}

function onAppDialogKeydown(e) {
    const { overlay } = getDialogElements();
    if (!overlay || !overlay.classList.contains('active')) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        onAppDialogBackdrop();
    }
}

let transientNoteTimer = 0;

/**
 * Kısa bilgi: ekranda belirir, kendiliğinden söner.
 *
 * Diyalog değil — onay istemeyen, akışı kesmemesi gereken "şu an olmaz"
 * durumları için. Art arda çağrılırsa metin değişir, süre baştan başlar.
 */
export function showTransientNote(message, ms = 2600) {
    const text = String(message || '').trim();
    if (!text) return;
    let note = document.getElementById('appTransientNote');
    if (!note) {
        note = document.createElement('div');
        note.id = 'appTransientNote';
        note.className = 'app-note';
        note.setAttribute('role', 'status');
        note.setAttribute('aria-live', 'polite');
        document.body.appendChild(note);
    }
    note.textContent = text;
    note.classList.remove('app-note--in');
    void note.offsetWidth; // aynı düğmeye tekrar basınca animasyon baştan başlasın
    note.classList.add('app-note--in');
    clearTimeout(transientNoteTimer);
    transientNoteTimer = setTimeout(() => note.classList.remove('app-note--in'), ms);
}

export function showAppAlert(message, options = {}) {
    return new Promise((resolve) => {
        const { overlay, title, body, inputWrap, cancelBtn, okBtn } = getDialogElements();
        if (!overlay || !okBtn) {
            window.alert(message);
            resolve();
            return;
        }
        appDialogKind = 'alert';
        title.textContent = options.title || t('dialog.info');
        body.textContent = message;
        if (inputWrap) inputWrap.hidden = true;
        if (cancelBtn) cancelBtn.hidden = true;
        okBtn.textContent = options.okLabel || t('dialog.ok');
        appDialogResolve = resolve;
        overlay.classList.add('active');
        requestAnimationFrame(() => okBtn.focus());
    });
}

export function showAppConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const { overlay, title, body, inputWrap, cancelBtn, okBtn } = getDialogElements();
        if (!overlay || !okBtn) {
            resolve(window.confirm(message));
            return;
        }
        appDialogKind = 'confirm';
        title.textContent = options.title || t('dialog.confirm');
        body.textContent = message;
        if (inputWrap) inputWrap.hidden = true;
        if (cancelBtn) {
            cancelBtn.hidden = false;
            cancelBtn.textContent = options.cancelLabel || t('dialog.cancel');
        }
        okBtn.textContent = options.confirmLabel || t('dialog.ok');
        appDialogResolve = resolve;
        overlay.classList.add('active');
        requestAnimationFrame(() => okBtn.focus());
    });
}

export function showAppPrompt(message, defaultValue = '', options = {}) {
    return new Promise((resolve) => {
        const { overlay, title, body, inputWrap, inputLabel, input, cancelBtn, okBtn } = getDialogElements();
        if (!overlay || !okBtn || !input) {
            resolve(window.prompt(message, defaultValue));
            return;
        }
        appDialogKind = 'prompt';
        title.textContent = options.title || t('dialog.prompt');
        body.textContent = message;
        if (inputWrap) inputWrap.hidden = false;
        if (inputLabel) inputLabel.textContent = options.inputLabel || t('dialog.inputLabelName');
        input.value = defaultValue ?? '';
        // Sınır her çağrıda yeniden kurulur; aksi hâlde bir sonraki isteme sızar.
        if (options.maxLength > 0) input.maxLength = options.maxLength;
        else input.removeAttribute('maxlength');
        if (cancelBtn) {
            cancelBtn.hidden = false;
            cancelBtn.textContent = options.cancelLabel || t('dialog.cancel');
        }
        okBtn.textContent = options.okLabel || t('dialog.ok');
        appDialogResolve = resolve;
        overlay.classList.add('active');
        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });
    });
}

export function setupAppDialog() {
    const { overlay, okBtn, cancelBtn, input } = getDialogElements();
    if (!overlay || !okBtn || !cancelBtn) return;
    okBtn.addEventListener('click', onAppDialogOk);
    cancelBtn.addEventListener('click', onAppDialogCancel);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) onAppDialogBackdrop();
    });
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onAppDialogOk();
            }
        });
    }
    document.addEventListener('keydown', onAppDialogKeydown);
}

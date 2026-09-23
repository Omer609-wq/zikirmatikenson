import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAY_STORE_URL, buildHatimInvite, isShareCancelled } from './hatim-invite.js';

const BASE = {
    invite: 'Zikirmatik\'te "Mahalle Camii" hatmine katıl.',
    codeLine: 'Katılma kodu: K7M2QP',
    androidLabel: 'Android',
    iosLabel: 'iPhone'
};

test('davet: cümle, kod ve mağaza bağlantıları tek metinde', () => {
    const text = buildHatimInvite({ ...BASE, appStoreUrl: 'https://apps.apple.com/app/id123' });
    assert.equal(
        text,
        [
            'Zikirmatik\'te "Mahalle Camii" hatmine katıl.',
            '',
            'Katılma kodu: K7M2QP',
            '',
            'Android: https://play.google.com/store/apps/details?id=com.omerzikirmatik.app',
            'iPhone: https://apps.apple.com/app/id123'
        ].join('\n')
    );
});

test('App Store bağlantısı yoksa iPhone satırı çıkmaz', () => {
    // iOS yayına girene kadarki hâl: ölü bağlantı paylaşılmasın.
    const text = buildHatimInvite(BASE);
    assert.ok(text.includes(PLAY_STORE_URL));
    assert.equal(text.includes('iPhone'), false);
    assert.equal(text.includes('apps.apple.com'), false);
});

test('boş parça fazladan boş satır bırakmaz', () => {
    const text = buildHatimInvite({ ...BASE, invite: '  ', playUrl: '', appStoreUrl: '' });
    assert.equal(text, 'Katılma kodu: K7M2QP');
    assert.equal(buildHatimInvite({ ...BASE, codeLine: '' }).includes('\n\n\n'), false);
});

test('paylaşımdan vazgeçme gerçek hatadan ayrılır', () => {
    // Vazgeçince panoya kopyalayıp "kopyalandı" demek yanlış olurdu.
    assert.equal(isShareCancelled({ name: 'AbortError' }), true);
    assert.equal(isShareCancelled(new Error('Share canceled')), true);
    assert.equal(isShareCancelled(new Error('Abort due to cancellation of share.')), true);
    assert.equal(isShareCancelled(new Error('Share API not available')), false);
    assert.equal(isShareCancelled(null), false);
});

import { t } from '../i18n.js';

export const PREMIUM_PRICE_MONTHLY_TRY = 34.99;
export const PREMIUM_PRICE_YEARLY_TRY = 279.99;

/**
 * @returns {{ saved: number, percent: number, monthsFree: number, annualMonthly: number }}
 */
export function computePremiumYearlySavings(
    monthly = PREMIUM_PRICE_MONTHLY_TRY,
    yearly = PREMIUM_PRICE_YEARLY_TRY
) {
    const annualMonthly = Math.round(monthly * 12 * 100) / 100;
    const saved = Math.round((annualMonthly - yearly) * 100) / 100;
    const percent = annualMonthly > 0 ? Math.round((saved / annualMonthly) * 100) : 0;
    const monthsFree = monthly > 0 ? Math.max(0, Math.round(saved / monthly)) : 0;
    return { saved, percent, monthsFree, annualMonthly };
}

export function formatTryPrice(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '₺0,00';
    return `₺${n.toFixed(2).replace('.', ',')}`;
}

/**
 * Play Store faturalandırması bağlandığında buradan başlatılır.
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function requestPremiumPurchase(plan = 'monthly') {
    void plan;
    // TODO: Capacitor / Google Play Billing entegrasyonu
    return { ok: false, reason: 'not_implemented' };
}

function getSelectedPremiumPlan() {
    const input = document.querySelector('input[name="premiumPlan"]:checked');
    return input && input.value === 'yearly' ? 'yearly' : 'monthly';
}

export function renderPremiumPurchase() {
    const title = document.getElementById('premiumPurchaseHeading');
    const lead = document.getElementById('premiumPurchaseLead');
    const note = document.getElementById('premiumPurchaseStubNote');
    const btn = document.getElementById('premiumPurchaseSubscribeBtn');
    const priceMonthly = document.getElementById('premiumPurchasePriceMonthly');
    const priceYearly = document.getElementById('premiumPurchasePriceYearly');
    const yearlyBadge = document.getElementById('premiumPurchaseYearlyBadge');
    if (title) title.textContent = t('premiumPurchase.title');
    if (lead) lead.textContent = t('premiumPurchase.lead');
    if (note) note.textContent = t('premiumPurchase.stubNote');
    if (btn) btn.textContent = t('premiumPurchase.subscribeBtn');

    if (priceMonthly) priceMonthly.textContent = formatTryPrice(PREMIUM_PRICE_MONTHLY_TRY);
    if (priceYearly) priceYearly.textContent = formatTryPrice(PREMIUM_PRICE_YEARLY_TRY);

    const { percent, monthsFree } = computePremiumYearlySavings();
    if (yearlyBadge) {
        yearlyBadge.textContent = t('premiumPurchase.yearlyBadge', { percent, count: monthsFree });
    }
}

export function setupPremiumPurchase({ onSubscribe } = {}) {
    const plansHost = document.getElementById('premiumPurchasePlans');
    if (plansHost && plansHost.dataset.bound !== '1') {
        plansHost.dataset.bound = '1';
        plansHost.addEventListener('change', (e) => {
            if (!(e.target instanceof HTMLInputElement) || e.target.name !== 'premiumPlan') return;
        });
    }

    const btn = document.getElementById('premiumPurchaseSubscribeBtn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
        const plan = getSelectedPremiumPlan();
        const result = await requestPremiumPurchase(plan);
        if (typeof onSubscribe === 'function') onSubscribe(result, plan);
    });
}

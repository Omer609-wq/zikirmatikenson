import { Capacitor } from '@capacitor/core';
import { t } from '../i18n.js';

/* ===================== RevenueCat yapılandırması =====================
 * PUBLIC API anahtarları RevenueCat panelinden alınır (Project → API keys).
 * Boş bırakıldığında satın alma "unavailable" döner ve ekran stub modda
 * kalır (mevcut davranış) — yayın öncesi doldurulması yeterlidir.
 * Kurulum adımları: docs/REVENUECAT_SETUP.md
 */
const REVENUECAT_API_KEY_ANDROID = ''; // goog_ ile başlar
const REVENUECAT_API_KEY_IOS = ''; // appl_ ile başlar (App Store'a çıkarken)

/** RevenueCat panelinde tanımlanacak entitlement kimliği. */
const PREMIUM_ENTITLEMENT_ID = 'premium';

/** Mağaza fiyatı henüz yüklenmemişken gösterilecek yedek fiyatlar (TRY). */
export const PREMIUM_PRICE_MONTHLY_TRY = 34.99;
export const PREMIUM_PRICE_YEARLY_TRY = 279.99;

let Purchases = null;
let purchasesReady = false;
let currentOffering = null;
let entitlementCallback = null;

function getApiKey() {
    return Capacitor.getPlatform() === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
}

function isBillingConfigured() {
    return Capacitor.isNativePlatform() && !!getApiKey();
}

function isPremiumActive(customerInfo) {
    return !!customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID];
}

function notifyEntitlement(customerInfo) {
    if (entitlementCallback) entitlementCallback(isPremiumActive(customerInfo));
}

async function loadOffering() {
    const { current } = await Purchases.getOfferings();
    currentOffering = current || null;
}

function getPackageForPlan(plan) {
    if (!currentOffering) return null;
    return plan === 'yearly' ? currentOffering.annual || null : currentOffering.monthly || null;
}

/**
 * RevenueCat'i başlatır: yapılandırma, abonelik durumu dinleyicisi ve paketler.
 * Anahtar boşsa veya native değilsek sessizce atlanır (stub mod).
 * @param {{ onEntitlementChange?: (active: boolean) => void }} opts
 */
export async function initPremiumPurchases({ onEntitlementChange } = {}) {
    entitlementCallback = typeof onEntitlementChange === 'function' ? onEntitlementChange : null;
    if (!isBillingConfigured()) return false;
    try {
        const mod = await import('@revenuecat/purchases-capacitor');
        Purchases = mod.Purchases;
        await Purchases.configure({ apiKey: getApiKey() });
        await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
            notifyEntitlement(customerInfo);
        });
        const { customerInfo } = await Purchases.getCustomerInfo();
        notifyEntitlement(customerInfo);
        await loadOffering();
        purchasesReady = true;
        renderPremiumPurchase(); // mağaza fiyatları geldi; ekran açıksa tazele
        return true;
    } catch (err) {
        console.error('RevenueCat init başarısız:', err);
        return false;
    }
}

function isCancelError(err) {
    if (!err) return false;
    if (err.userCancelled === true) return true;
    const msg = String(err.message || err.code || '').toLowerCase();
    return msg.includes('cancel');
}

/**
 * Seçilen planı satın alır.
 * @returns {Promise<{ ok: boolean, reason?: 'unavailable'|'cancelled'|'pending'|'error' }>}
 */
export async function requestPremiumPurchase(plan = 'monthly') {
    if (!isBillingConfigured() || !purchasesReady) return { ok: false, reason: 'unavailable' };
    let pkg = getPackageForPlan(plan);
    if (!pkg) {
        try {
            await loadOffering();
        } catch {
            /* aşağıda tekrar bakılır */
        }
        pkg = getPackageForPlan(plan);
    }
    if (!pkg) return { ok: false, reason: 'unavailable' };
    try {
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
        if (isPremiumActive(customerInfo)) return { ok: true };
        // Ödeme alındı ama entitlement henüz aktif değil (örn. beklemedeki ödeme).
        return { ok: false, reason: 'pending' };
    } catch (err) {
        if (isCancelError(err)) return { ok: false, reason: 'cancelled' };
        console.error('Satın alma hatası:', err);
        return { ok: false, reason: 'error' };
    }
}

/**
 * Önceki satın alımları geri yükler (cihaz/hesap değişimi).
 * @returns {Promise<{ ok: boolean, reason?: 'unavailable'|'nothing_to_restore'|'error' }>}
 */
export async function requestPremiumRestore() {
    if (!isBillingConfigured() || !purchasesReady) return { ok: false, reason: 'unavailable' };
    try {
        const { customerInfo } = await Purchases.restorePurchases();
        if (isPremiumActive(customerInfo)) return { ok: true };
        return { ok: false, reason: 'nothing_to_restore' };
    } catch (err) {
        console.error('Geri yükleme hatası:', err);
        return { ok: false, reason: 'error' };
    }
}

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
 * Ekranda gösterilecek fiyatlar: mağazadan geldiyse yerel para birimiyle
 * (Google/Apple zorunluluğu), gelmediyse TRY yedek değerleri.
 */
export function getPremiumDisplayPrices() {
    const monthlyPkg = getPackageForPlan('monthly');
    const yearlyPkg = getPackageForPlan('yearly');
    const monthlyStore = monthlyPkg?.product?.priceString || null;
    const yearlyStore = yearlyPkg?.product?.priceString || null;
    const monthlyAmount = Number(monthlyPkg?.product?.price);
    const yearlyAmount = Number(yearlyPkg?.product?.price);
    const savings =
        Number.isFinite(monthlyAmount) && Number.isFinite(yearlyAmount) && monthlyAmount > 0
            ? computePremiumYearlySavings(monthlyAmount, yearlyAmount)
            : computePremiumYearlySavings();
    return {
        monthly: monthlyStore || formatTryPrice(PREMIUM_PRICE_MONTHLY_TRY),
        yearly: yearlyStore || formatTryPrice(PREMIUM_PRICE_YEARLY_TRY),
        savings
    };
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
    if (note) {
        note.textContent = t('premiumPurchase.stubNote');
        note.hidden = purchasesReady; // faturalandırma canlıysa stub notu gizle
    }
    if (btn) btn.textContent = t('premiumPurchase.subscribeBtn');
    const restoreBtn = document.getElementById('premiumPurchaseRestoreBtn');
    if (restoreBtn) restoreBtn.textContent = t('premiumPurchase.restoreBtn');

    const prices = getPremiumDisplayPrices();
    if (priceMonthly) priceMonthly.textContent = prices.monthly;
    if (priceYearly) priceYearly.textContent = prices.yearly;
    if (yearlyBadge) {
        const { percent, monthsFree } = prices.savings;
        yearlyBadge.textContent = t('premiumPurchase.yearlyBadge', { percent, count: monthsFree });
    }
}

export function setupPremiumPurchase({ onSubscribe, onRestore } = {}) {
    const plansHost = document.getElementById('premiumPurchasePlans');
    if (plansHost && plansHost.dataset.bound !== '1') {
        plansHost.dataset.bound = '1';
        plansHost.addEventListener('change', (e) => {
            if (!(e.target instanceof HTMLInputElement) || e.target.name !== 'premiumPlan') return;
        });
    }

    const subscribeBtn = document.getElementById('premiumPurchaseSubscribeBtn');
    if (subscribeBtn && subscribeBtn.dataset.bound !== '1') {
        subscribeBtn.dataset.bound = '1';
        subscribeBtn.addEventListener('click', async () => {
            if (subscribeBtn.disabled) return;
            const plan = getSelectedPremiumPlan();
            subscribeBtn.disabled = true; // çift dokunuş / mükerrer akış koruması
            try {
                const result = await requestPremiumPurchase(plan);
                if (typeof onSubscribe === 'function') onSubscribe(result, plan);
            } finally {
                subscribeBtn.disabled = false;
            }
        });
    }

    const restoreBtn = document.getElementById('premiumPurchaseRestoreBtn');
    if (restoreBtn && restoreBtn.dataset.bound !== '1') {
        restoreBtn.dataset.bound = '1';
        restoreBtn.addEventListener('click', async () => {
            if (restoreBtn.disabled) return;
            restoreBtn.disabled = true;
            try {
                const result = await requestPremiumRestore();
                if (typeof onRestore === 'function') onRestore(result);
            } finally {
                restoreBtn.disabled = false;
            }
        });
    }
}

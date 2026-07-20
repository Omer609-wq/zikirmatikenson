import {
    applyModalOverlayBottomInset,
    applyNativeBottomInsetVar,
    bindNativeReminderNotificationLaunch,
    isCapacitorNative,
    refreshNativeBottomInsetVar,
    syncNativeDailyReminder,
    syncNativeSmartReminders
} from './native-reminders.js';
import {
    clearUpdateBannerDom,
    openPlayStore,
    placeUpdateBanner,
    refreshUpdateBannerConfig
} from './update-banner.js';
import {
    applySeasonalContentToAppState,
    getSeasonalFolderMeta,
    isSeasonalFolderId,
    isSeasonalZikirId,
    persistSeasonalCountsFromZikirs,
    refreshSeasonalContent
} from './seasonal-content.js';
import { escapeHtml, escapeAttr } from './lib/html.js';
import { isBaseLibraryItemPremiumLocked } from './lib/library-access.js';
import { playCounterTickSound, normalizeCounterTickSound } from './lib/counter-tick-sounds.js';
import {
    COUNTER_BG_PRESETS,
    counterBgPresetUrl,
    findCounterBgPreset,
    normalizeCounterBackground
} from './lib/counter-backgrounds.js';
import { sanitizeLoadedData, mintId } from './lib/sanitize.js';
import {
    MAX_SMART_REMINDERS,
    MAX_MESSAGES_PER_RULE,
    SMART_REMINDER_MESSAGE_MAX_LEN,
    buildSmartReminderSlots,
    createDefaultSmartReminder,
    INTRO_SAMPLE_REMINDER_ID,
    INTRO_SAMPLE_SURAH,
    INTRO_SAMPLE_AYAH
} from './lib/smart-reminders.js';
import { createUsageTracker } from './lib/usage-tracker.js';
import {
    USAGE_AREA_HOME,
    USAGE_AREA_LIB_DUA,
    USAGE_AREA_LIB_ZIKIR,
    USAGE_AREA_PREMIUM,
    USAGE_AREA_QURAN,
    USAGE_AREA_SETTINGS,
    USAGE_AREA_OTHER,
    folderUsageAreaId,
    getTopUsageAreasForDay,
    isFolderUsageArea,
    folderIdFromUsageArea
} from './lib/usage-areas.js';
import { syncNativeWeeklyReport } from './lib/weekly-report-notify.js';
import { getRuntimeFlags, loadRuntimeFlags } from './lib/runtime-flags.js';
import { buildWeeklyReportPreviewPatch } from './lib/weekly-report-preview.js';
import {
    buildWeekReport,
    computeFourWeekDailyAverage,
    computeGoalStreak,
    computeWeekUsageStats,
    formatUsageDuration,
    getDailyUsageSeries,
    getFlameTier,
    FLAME_TIER_IDS,
    getNextMondayAt,
    getReportWeekForMonday,
    getSelectableWeekRanges,
    normalizeDailyZikirGoal,
    parseDateKey,
    percentChange
} from './lib/weekly-report.js';
import { showAppAlert, showAppConfirm, showAppPrompt, setupAppDialog } from './lib/app-dialog.js';
import { setupLocaleWelcome, maybeShowLocaleWelcome, closeLocaleWelcomeIfOpen } from './lib/locale-welcome.js';
import {
    closePremiumUpsell,
    setPremiumPurchaseNavigator,
    setupPremiumUpsell,
    showPremiumLimitUpsell,
    showPremiumFeatureUpsell,
    showPremiumLibraryUpsell
} from './lib/premium-upsell.js';
import {
    initPremiumPurchases,
    renderPremiumPurchase,
    setupPremiumPurchase
} from './lib/premium-purchase.js';
import {
    applyPremiumPreviewEntitlement,
    installPremiumPreviewConsoleHelper,
    resolvePremiumPreviewFlags
} from './lib/premium-preview.js';
import { applyNativeStatusBarTheme } from './status-bar-theme.js';
import { runCounterVibration, runDragReorderNudge } from './haptics.js';
import { setupCrashReporting } from './lib/crash-reporting.js';
import {
    downloadBackupPayload,
    getCloudBackupAvailability,
    resolveCloudBackupSignInErrorKey,
    maybeUploadCloudBackup,
    normalizeCloudBackupMeta,
    signInWithGoogleForBackup,
    signOutCloudBackup,
    uploadBackupPayload
} from './lib/cloud-backup.js';
import { App } from '@capacitor/app';
import {
    pickRandomQuoteEntry,
    getReminderQuoteNotificationPayload,
    applyCachedRemoteDailyQuotes,
    refreshRemoteDailyQuotes
} from './quotes.js';
import { ESMA_DEFAULT_FAZILET } from './esma-fazilet.js';
import { ESMA_MEANING_EN } from './esma-meanings-en.js';
import { ESMA_NAME_EN } from './esma-names-en.js';
import { ESMA_NAME_BN } from './esma-names-bn.js';
import {
    applyLocaleToDocument,
    tForLocale,
    getLocale,
    getLocaleTag,
    getZikirLibrary,
    getZikirLibraryPremiumOnly,
    getKnownLibraryFaziletTexts,
    getKnownLibraryMeaningTexts,
    getKnownLibraryNameTexts,
    getLibraryFaziletForLocale,
    getLibraryMeaningForLocale,
    getLibraryNameForLocale,
    inferLibraryIdForZikir,
    ensurePremiumLibraryLoaded,
    initI18n,
    localeUsesEnglishMeals,
    localeUsesArabicScript,
    localeUsesRtlUiScript,
    localeSupportsNativeNumerals,
    formatCounterNumber,
    clampArabicSublineFontStep,
    applyArabicSublineFontStep,
    ARABIC_SUBLINE_FONT_STEP_MIN,
    ARABIC_SUBLINE_FONT_STEP_MAX,
    normalizeAppLocale,
    resolveLocaleFromSystem,
    SUPPORTED_LOCALES,
    t
} from './i18n.js';
import { closeTafsirBridgeSheet } from './tafsir-bridge.js';
import {
    bindQuranAyahExpandOverlay,
    bindQuranTafsirBridgeOverlay,
    closeAyahExpandView,
    bindQuranMealSelect,
    bindQuranReaderMenu,
    bindQuranSearchInput,
    bindQuranSearchGuide,
    bindQuranViewTabs,
    clearQuranSearch,
    closeQuranReaderDrawer,
    normalizeQuranMeal,
    normalizeQuranReadModeForLocale,
    normalizeQuranZikirDisplayMode,
    normalizeQuranReaderLayout,
    isQuranMushafDomActive,
    syncQuranSettingsForLocale,
    clearQuranSurahCache,
    guardQuranReaderSettingsChange,
    localeHasQuranMeal,
    getDefaultQuranReadModeForLocale,
    getQuranViewTab,
    renderQuranFavoritesList,
    renderQuranSurahDetail,
    renderQuranSurahList,
    setQuranAyahFavoritesApi,
    setQuranViewTab,
    teardownQuranReader,
    setQuranMealChangeHandler,
    setQuranNavigateToSurah,
    setQuranReadModeChangeHandler,
    setQuranReaderLayoutChangeHandler,
    setMushafSettingsApi,
    fetchSurahAyahs,
    getSurahLocalizedName,
    resolveQuranSurahInput,
    syncQuranAyahFavoriteButtons,
    syncQuranTabVisibility
} from './quran.js';

function mushafNavOptsForRerender() {
    return appSettings.quranReaderLayout === 'mushaf' ? { preferSaved: true } : {};
}

/** Sure listesinden veya sure numarasıyla açılış (belirli ayet hariç). */
function mushafNavOptsForSurahOpen(scrollAyah) {
    if (scrollAyah != null && Number.isFinite(Number(scrollAyah))) return {};
    if (appSettings.quranReaderLayout === 'mushaf' && appSettings.quranMushafRememberPage) {
        return { preferSaved: true };
    }
    return {};
}

// ===================== DATA MODELS =====================
function getDefaultFolders() {
    return [
        { id: 'f_default', name: t('defaults.folderDefault') },
        { id: 'f_esma', name: t('defaults.folderEsma') }
    ];
}

const ESMA_LIST = [
    // Meanings: https://www.esmaulhusna.gen.tr/esmaul-husna.html
    // Targets (ebced/zikir adedi): https://www.esmaulhusna.gen.tr/ebced-hesabi-esmaul-husna.html
    { name: "Yâ Allah", target: 66, meaning: "Eşi benzeri olmayan, Tek ilah, isimlerin sultanı" },
    { name: "Yâ Rahman", target: 298, meaning: "Tüm yaratılanlara merhamet eden" },
    { name: "Yâ Rahîm", target: 258, meaning: "Ahirette inananlara sonsuz ihsan, ikram ve lütufta bulunan" },
    { name: "Yâ Melik", target: 91, meaning: "Tüm evrenin sahibi, saltanatı ve mülkü sürekli olan" },
    { name: "Yâ Kuddûs", target: 170, meaning: "Tüm eksikliklerden uzak" },
    { name: "Yâ Selâm", target: 131, meaning: "Tüm tehlikelerden selamete çıkaran" },
    { name: "Yâ Mü'min", target: 137, meaning: "Koruyan, Güvenilen" },
    { name: "Yâ Müheymin", target: 145, meaning: "Her şeyi gören ve gözeten" },
    { name: "Yâ Azîz", target: 94, meaning: "Her şeyin galibi ve izzet sahibi olan" },
    { name: "Yâ Cebbâr", target: 206, meaning: "Kudret sahibi olan" },
    { name: "Yâ Mütekebbir", target: 662, meaning: "Eşi benzeri olmayan büyüklükte olan" },
    { name: "Yâ Hâlik", target: 731, meaning: "Yaratan" },
    { name: "Yâ Bârî", target: 214, meaning: "Kusursuz ve eksiksiz yaratan" },
    { name: "Yâ Musavvir", target: 336, meaning: "Tüm varlıklara şekil veren" },
    { name: "Yâ Gaffâr", target: 1281, meaning: "Mağfireti bol olan" },
    { name: "Yâ Kahhâr", target: 306, meaning: "Her şeye hâkim olan" },
    { name: "Yâ Vehhâb", target: 196, meaning: "Karşılıksız veren" },
    { name: "Yâ Rezzâk", target: 308, meaning: "Rızık veren" },
    { name: "Yâ Fettâh", target: 489, meaning: "Dardan kurtaran" },
    { name: "Yâ Alîm", target: 150, meaning: "Her şeyi bilen ve gören" },
    { name: "Yâ Kâbıd", target: 903, meaning: "Dilediğine darlık verme gücü olan" },
    { name: "Yâ Bâsıt", target: 72, meaning: "İstediğine bolluk veren" },
    { name: "Yâ Hâfıd", target: 1481, meaning: "Kafirleri alçaltan" },
    { name: "Yâ Râfi'", target: 351, meaning: "İnananları yükselten" },
    { name: "Yâ Mu'izz", target: 117, meaning: "Aziz kılan, dilediğini yücelten" },
    { name: "Yâ Müzill", target: 770, meaning: "Dilediğini değersiz kılan" },
    { name: "Yâ Semî'", target: 180, meaning: "Her şeyi duyan" },
    { name: "Yâ Basîr", target: 112, meaning: "Her şeyi gören" },
    { name: "Yâ Hakem", target: 68, meaning: "Mutlak hakimiyete sahip olan" },
    { name: "Yâ 'Adl", target: 104, meaning: "Adil olan" },
    { name: "Yâ Latîf", target: 129, meaning: "Kullarına değer veren" },
    { name: "Yâ Habîr", target: 812, meaning: "Her şeyi bilen" },
    { name: "Yâ Halîm", target: 88, meaning: "Ceza verirken acele etmeyen" },
    { name: "Yâ Azîm", target: 1020, meaning: "Tek Yüce olan" },
    { name: "Yâ Gafûr", target: 1286, meaning: "Affedici olan" },
    { name: "Yâ Şekûr", target: 526, meaning: "Az amelde bile çok sevap veren" },
    { name: "Yâ Aliyy", target: 110, meaning: "Derecesi en Yüce olan" },
    { name: "Yâ Kebîr", target: 232, meaning: "Büyük olan" },
    { name: "Yâ Hafîz", target: 998, meaning: "Koruyan" },
    { name: "Yâ Mukît", target: 550, meaning: "Yaratılana rızkını veren" },
    { name: "Yâ Hasîb", target: 80, meaning: "Hesaba alan" },
    { name: "Yâ Celîl", target: 5329, meaning: "Yüksek sıfatları olan" },
    { name: "Yâ Kerîm", target: 270, meaning: "İkram eden" },
    { name: "Yâ Rakîb", target: 312, meaning: "Gören ve gözeten" },
    { name: "Yâ Mücîb", target: 3025, meaning: "Dualarını kabul eden" },
    { name: "Yâ Vâsi'", target: 137, meaning: "Rahmeti ve ilmi bol olan" },
    { name: "Yâ Hakîm", target: 6084, meaning: "Hikmetli" },
    { name: "Yâ Vedûd", target: 400, meaning: "Kullarını seven" },
    { name: "Yâ Mecîd", target: 3249, meaning: "Şerefi yüksek olan" },
    { name: "Yâ Bâ'is", target: 573, meaning: "Ölmüş olanları dirilten" },
    { name: "Yâ Şehîd", target: 319, meaning: "Her zaman ve her yerde hazır olan" },
    { name: "Yâ Hakk", target: 108, meaning: "Hakkı gösteren" },
    { name: "Yâ Vekîl", target: 66, meaning: "Tevekkül edenlerin işlerini yoluna koyan" },
    { name: "Yâ Kaviyy", target: 116, meaning: "Kudretli" },
    { name: "Yâ Metîn", target: 500, meaning: "Güçlü olan" },
    { name: "Yâ Veliyy", target: 2116, meaning: "İnananlara dost olan" },
    { name: "Yâ Hamîd", target: 3844, meaning: "Övgüye layık olan" },
    { name: "Yâ Muhsî", target: 148, meaning: "Tüm varlıkların sayısını bilen" },
    { name: "Yâ Mübdî", target: 57, meaning: "Yoktan var eden" },
    { name: "Yâ Mu'îd", target: 124, meaning: "Öldüren ve sonrasında tekrar dirilten" },
    { name: "Yâ Muhyî", target: 68, meaning: "Dirilten, can veren" },
    { name: "Yâ Mümît", target: 490, meaning: "Öldüren" },
    { name: "Yâ Hayy", target: 324, meaning: "Sonsuz hayata sahip olan" },
    { name: "Yâ Kayyûm", target: 156, meaning: "Varlıkları ayakta tutan" },
    { name: "Yâ Vâcid", target: 196, meaning: "İstediğini her zaman bulan" },
    { name: "Yâ Mâcid", target: 2304, meaning: "Şanı yüce olan" },
    { name: "Yâ Vâhid", target: 3669, meaning: "Eşi benzeri olmayan" },
    { name: "Yâ Samed", target: 134, meaning: "Muhtaç olunan" },
    { name: "Yâ Kâdir", target: 305, meaning: "Kudretli" },
    { name: "Yâ Muktedir", target: 774, meaning: "Her şeye gücü yeten" },
    { name: "Yâ Mukaddim", target: 184, meaning: "İstediğini yükselten" },
    { name: "Yâ Mu'ahhir", target: 847, meaning: "Dilediğini geri bırakan" },
    { name: "Yâ Evvel", target: 37, meaning: "Ezeli" },
    { name: "Yâ Âhir", target: 801, meaning: "Ebedi" },
    { name: "Yâ Zâhir", target: 1106, meaning: "Varlığı açık olan" },
    { name: "Yâ Bâtın", target: 62, meaning: "Mahiyeti gizli olan" },
    { name: "Yâ Vâlî", target: 47, meaning: "Sahip olan" },
    { name: "Yâ Müteâlî", target: 551, meaning: "Yüce" },
    { name: "Yâ Berr", target: 202, meaning: "İyiliği bol olan" },
    { name: "Yâ Tevvâb", target: 409, meaning: "Günahları affeden" },
    { name: "Yâ Müntekîm", target: 630, meaning: "İntikam alan" },
    { name: "Yâ Afüvv", target: 156, meaning: "Affeden" },
    { name: "Yâ Raûf", target: 287, meaning: "Merhametli olan" },
    { name: "Yâ Mâlikü'l-Mülk", target: 212, meaning: "Tüm varlıkların sahibi olan" },
    { name: "Yâ Zü'l-Celâli ve'l-İkrâm", target: 1155, meaning: "Celal ve ikram sahibi" },
    { name: "Yâ Muksit", target: 209, meaning: "Adaletli olan" },
    { name: "Yâ Câmi'", target: 114, meaning: "Mahşer günü bir araya toplayan" },
    { name: "Yâ Ganî", target: 1060, meaning: "Kimseye muhtaç olmayan" },
    { name: "Yâ Muğnî", target: 1100, meaning: "Müstahni" },
    { name: "Yâ Mâni'", target: 161, meaning: "İstediği bir şeye mâni olan" },
    { name: "Yâ Dârr", target: 1001, meaning: "İstediğine zarar veren" },
    { name: "Yâ Nâfi'", target: 201, meaning: "İstediğine fayda veren" },
    { name: "Yâ Nûr", target: 256, meaning: "Alemi aydınlatan" },
    { name: "Yâ Hâdî", target: 400, meaning: "Hidayet sahibi" },
    { name: "Yâ Bedî'", target: 86, meaning: "Benzersiz yaratan" },
    { name: "Yâ Bâkî", target: 113, meaning: "Ebedi" },
    { name: "Yâ Vâris", target: 707, meaning: "Tüm her şeyin tek sahibi" },
    { name: "Yâ Reşîd", target: 514, meaning: "Yol gösteren" },
    { name: "Yâ Sabûr", target: 298, meaning: "Ceza vermek için acele etmeyen" }
];

/** Esma sırası ESMA_LIST ile birebir aynı olmalı (99 adet). */
const ESMA_ARABIC = [].concat(
    ["يَا اللَّهُ", "يَا رَحْمَنُ", "يَا رَحِيمُ", "يَا مَلِكُ", "يَا قُدُّوسُ", "يَا سَلَامُ", "يَا مُؤْمِنُ", "يَا مُهَيْمِنُ", "يَا عَزِيزُ", "يَا جَبَّارُ", "يَا مُتَكَبِّرُ", "يَا خَالِقُ", "يَا بَارِئُ", "يَا مُصَوِّرُ", "يَا غَفَّارُ", "يَا قَهَّارُ", "يَا وَهَّابُ", "يَا رَزَّاقُ", "يَا فَتَّاحُ", "يَا عَلِيمُ"],
    ["يَا قَابِضُ", "يَا بَاسِطُ", "يَا خَافِضُ", "يَا رَافِعُ", "يَا مُعِزُّ", "يَا مُذِلُّ", "يَا سَمِيعُ", "يَا بَصِيرُ", "يَا حَكَمُ", "يَا عَدْلُ", "يَا لَطِيفُ", "يَا خَبِيرُ", "يَا حَلِيمُ", "يَا عَظِيمُ", "يَا غَفُورُ", "يَا شَكُورُ", "يَا عَلِيُّ", "يَا كَبِيرُ", "يَا حَفِيظُ", "يَا مُقِيتُ"],
    ["يَا حَسِيبُ", "يَا جَلِيلُ", "يَا كَرِيمُ", "يَا رَقِيبُ", "يَا مُجِيبُ", "يَا وَاسِعُ", "يَا حَكِيمُ", "يَا وَدُودُ", "يَا مَجِيدُ", "يَا بَاعِثُ", "يَا شَهِيدُ", "يَا حَقُّ", "يَا وَكِيلُ", "يَا قَوِيُّ", "يَا مَتِينُ", "يَا وَلِيُّ", "يَا حَمِيدُ", "يَا مُحْصِي", "يَا مُبْدِئُ", "يَا مُعِيدُ"],
    ["يَا مُحْيِي", "يَا مُمِيتُ", "يَا حَيُّ", "يَا قَيُّومُ", "يَا وَاجِدُ", "يَا مَاجِدُ", "يَا وَاحِدُ", "يَا صَمَدُ", "يَا قَادِرُ", "يَا مُقْتَدِرُ", "يَا مُقَدِّمُ", "يَا مُؤَخِّرُ", "يَا أَوَّلُ", "يَا آخِرُ", "يَا ظَاهِرُ", "يَا بَاطِنُ", "يَا وَالِي", "يَا مُتَعَالِي", "يَا بَرُّ", "يَا تَوَّابُ"],
    ["يَا مُنْتَقِمُ", "يَا عَفُوُّ", "يَا رَؤُوفُ", "يَا مَالِكَ الْمُلْكِ", "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", "يَا مُقْسِطُ", "يَا جَامِعُ", "يَا غَنِيُّ", "يَا مُغْنِي", "يَا مَانِعُ", "يَا ضَارُّ", "يَا نَافِعُ", "يَا نُورُ", "يَا هَادِي", "يَا بَدِيعُ", "يَا بَاقِي", "يَا وَارِثُ", "يَا رَشِيدُ", "يَا صَبُورُ"]
);
ESMA_LIST.forEach((e, i) => { e.arabic = ESMA_ARABIC[i] || ''; });
ESMA_DEFAULT_FAZILET.forEach((text, i) => {
    if (ESMA_LIST[i]) ESMA_LIST[i].fazilet = text;
});

const DEFAULT_ZIKIR_ARABIC_BY_ID = {
    z_1: 'سُبْحَانَ اللَّهِ',
    z_2: 'الْحَمْدُ لِلَّهِ',
    z_3: 'اللَّهُ أَكْبَرُ',
    z_4: 'لَا إِلَهَ إِلَّا اللَّهُ'
};

const CLASSIC_ZIKIR_IDS = ['z_1', 'z_2', 'z_3', 'z_4'];

function classicZikirMeaningKey(zid) {
    return `defaults.zikirMeaning.${zid}`;
}

function classicZikirNameKey(zid) {
    return `defaults.zikirName.${zid}`;
}

function getKnownClassicZikirNames(zid) {
    const known = new Set();
    const ar = DEFAULT_ZIKIR_ARABIC_BY_ID[zid];
    if (ar && String(ar).trim()) known.add(String(ar).trim());
    for (const loc of SUPPORTED_LOCALES) {
        const text = tForLocale(loc.code, classicZikirNameKey(zid));
        if (text) known.add(text.trim());
    }
    return known;
}

function getLocalizedClassicZikirName(zid) {
    if (localeUsesArabicScript(appSettings.locale)) {
        return DEFAULT_ZIKIR_ARABIC_BY_ID[zid] || '';
    }
    const text = t(classicZikirNameKey(zid));
    const key = classicZikirNameKey(zid);
    return text !== key ? text : (tForLocale('tr', key) || '');
}

function shouldShowZikirArabicSubline(z, displayName) {
    const ar = z && z.arabic && String(z.arabic).trim();
    if (!ar) return false;
    return ar !== String(displayName || '').trim();
}

function applyArabicTextAttrs(el, on) {
    if (!el) return;
    if (on) {
        const code = normalizeAppLocale(appSettings.locale);
        el.classList.add('arabic-text');
        el.setAttribute('dir', 'rtl');
        el.setAttribute('lang', code === 'ur' ? 'ur' : 'ar');
    } else {
        el.classList.remove('arabic-text');
        el.removeAttribute('dir');
        el.removeAttribute('lang');
    }
}

function resolveLibraryBackedName(z) {
    if (!z || !z.libraryId) return null;
    const cur = String(z.name || '').trim();
    const known = getKnownLibraryNameTexts(z.libraryId);
    const canonical = getLibraryNameForLocale(z.libraryId, appSettings.locale);
    if (!cur || known.has(cur)) return canonical;
    return cur;
}

/** Görüntüleme adı: kütüphane/klasik 4 locale okunuşu; kullanıcı zikirleri saklanan ad. */
function getZikirDisplayName(z) {
    if (!z) return '';
    const fromLib = resolveLibraryBackedName(z);
    if (fromLib != null) return fromLib;
    if (CLASSIC_ZIKIR_IDS.includes(z.id)) {
        return getLocalizedClassicZikirName(z.id);
    }
    const esmaIdx = parseEsmaZikirIndex(z);
    if (esmaIdx >= 0) {
        const cur = String(z.name || '').trim();
        const known = getKnownEsmaNames(esmaIdx);
        const canonical = getEsmaNameForLocale(esmaIdx);
        if (!cur || known.has(cur)) return canonical;
        return cur;
    }
    if (localeUsesArabicScript(appSettings.locale)) {
        const ar = String(z.arabic || '').trim();
        if (ar) return ar;
    }
    return String(z.name || '').trim();
}

function getKnownClassicZikirMeanings(zid) {
    const known = new Set();
    for (const loc of SUPPORTED_LOCALES) {
        const text = tForLocale(loc.code, classicZikirMeaningKey(zid));
        if (text) known.add(text.trim());
    }
    return known;
}

function getLocalizedClassicZikirMeaning(zid) {
    const text = t(classicZikirMeaningKey(zid));
    const key = classicZikirMeaningKey(zid);
    return text !== key ? text : (tForLocale('tr', key) || '');
}

function getKnownEsmaMeanings(index) {
    const known = new Set();
    const tr = ESMA_LIST[index] && ESMA_LIST[index].meaning;
    const en = ESMA_MEANING_EN[index];
    if (tr && String(tr).trim()) known.add(String(tr).trim());
    if (en && String(en).trim()) known.add(String(en).trim());
    return known;
}

function getKnownEsmaNames(index) {
    const known = new Set();
    const tr = ESMA_LIST[index] && ESMA_LIST[index].name;
    const ar = ESMA_ARABIC[index];
    const en = ESMA_NAME_EN[index];
    const bn = ESMA_NAME_BN[index];
    if (tr && String(tr).trim()) known.add(String(tr).trim());
    if (ar && String(ar).trim()) known.add(String(ar).trim());
    if (en && String(en).trim()) known.add(String(en).trim());
    if (bn && String(bn).trim()) known.add(String(bn).trim());
    return known;
}

function getEsmaMeaningForLocale(index, locale) {
    if (normalizeAppLocale(locale ?? appSettings.locale) === 'tr') {
        return (ESMA_LIST[index] && ESMA_LIST[index].meaning) || '';
    }
    return ESMA_MEANING_EN[index] || '';
}

function getEsmaNameForLocale(index, locale) {
    const code = normalizeAppLocale(locale ?? appSettings.locale);
    if (code === 'tr') {
        return (ESMA_LIST[index] && ESMA_LIST[index].name) || '';
    }
    if (code === 'ar') {
        return ESMA_ARABIC[index] || '';
    }
    if (code === 'bn') {
        return ESMA_NAME_BN[index] || ESMA_NAME_EN[index] || (ESMA_LIST[index] && ESMA_LIST[index].name) || '';
    }
    return ESMA_NAME_EN[index] || (ESMA_LIST[index] && ESMA_LIST[index].name) || '';
}

function parseEsmaZikirIndex(z) {
    const m = /^z_e_(\d+)$/.exec(z && z.id != null ? String(z.id) : '');
    return m ? parseInt(m[1], 10) : -1;
}

function resolveLibraryBackedMeaning(z) {
    if (!z || !z.libraryId) return null;
    const cur = String(z.meaning || '').trim();
    const known = getKnownLibraryMeaningTexts(z.libraryId);
    const canonical = getLibraryMeaningForLocale(z.libraryId, appSettings.locale);
    if (!cur || known.has(cur)) return canonical;
    return cur;
}

/** Görüntüleme mealı: kütüphane kaynaklı → locale kanonu; klasik 4 dil başına; Esma EN; diğerleri saklanan. */
function getZikirDisplayMeaning(z) {
    if (!z) return '';
    const fromLib = resolveLibraryBackedMeaning(z);
    if (fromLib != null) return fromLib;
    if (!localeUsesEnglishMeals(appSettings.locale)) {
        return String(z.meaning || '').trim();
    }
    if (CLASSIC_ZIKIR_IDS.includes(z.id)) {
        return getLocalizedClassicZikirMeaning(z.id);
    }
    const m = /^z_e_(\d+)$/.exec(z.id || '');
    if (m) {
        const idx = parseInt(m[1], 10);
        const en = ESMA_MEANING_EN[idx];
        if (en) return en;
    }
    return String(z.meaning || '').trim();
}

function syncLocalizedDefaults({ persist = false } = {}) {
    const df = folders.find((f) => f.id === 'f_default');
    if (df) df.name = t('defaults.folderDefault');
    const esma = folders.find((f) => f.id === 'f_esma');
    if (esma) esma.name = t('defaults.folderEsma');

    const localeIsTr = normalizeAppLocale(appSettings.locale) === 'tr';

    for (const zid of CLASSIC_ZIKIR_IDS) {
        const z = zikirs.find((x) => x.id === zid);
        if (!z) continue;
        const curM = String(z.meaning || '').trim();
        const knownM = getKnownClassicZikirMeanings(zid);
        if (!curM || knownM.has(curM)) {
            z.meaning = getLocalizedClassicZikirMeaning(zid);
        }
        const curN = String(z.name || '').trim();
        const knownN = getKnownClassicZikirNames(zid);
        if (!curN || knownN.has(curN)) {
            z.name = getLocalizedClassicZikirName(zid);
        }
    }

    for (const z of zikirs) {
        const idx = parseEsmaZikirIndex(z);
        if (idx < 0) continue;
        const curM = String(z.meaning || '').trim();
        const knownM = getKnownEsmaMeanings(idx);
        const nextM = getEsmaMeaningForLocale(idx);
        if (!curM || knownM.has(curM)) z.meaning = nextM;
        const curN = String(z.name || '').trim();
        const knownN = getKnownEsmaNames(idx);
        const nextN = getEsmaNameForLocale(idx);
        if (!curN || knownN.has(curN)) z.name = nextN;
    }

    for (const z of zikirs) {
        if (!z.libraryId) continue;
        const curM = String(z.meaning || '').trim();
        const knownM = getKnownLibraryMeaningTexts(z.libraryId);
        const nextM = getLibraryMeaningForLocale(z.libraryId, appSettings.locale);
        if (!curM || knownM.has(curM)) z.meaning = nextM;

        const curN = String(z.name || '').trim();
        const knownN = getKnownLibraryNameTexts(z.libraryId);
        const nextN = getLibraryNameForLocale(z.libraryId, appSettings.locale);
        if (!curN || knownN.has(curN)) z.name = nextN;

        const knownF = getKnownLibraryFaziletTexts(z.libraryId);
        const nextF = localeIsTr ? getLibraryFaziletForLocale(z.libraryId) : '';
        const curF = z.fazilet != null ? String(z.fazilet).trim() : '';
        if (localeIsTr) {
            if (nextF && (!curF || knownF.has(curF))) z.fazilet = nextF;
        } else if (curF && knownF.has(curF)) {
            delete z.fazilet;
        }
    }

    if (persist) saveData();

    const home = document.getElementById('homeView');
    if (home && home.classList.contains('active')) renderFolders();
    const fd = document.getElementById('folderDetailView');
    if (fd && fd.classList.contains('active')) renderFolderDetail();
    const cv = document.getElementById('counterView');
    if (cv && cv.classList.contains('active')) updateCounterUI();
}

const DEFAULT_ZIKIRS = [
    { id: 'z_1', folderId: 'f_default', name: 'Subhanallah', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_1, target: 33, meaning: getLocalizedClassicZikirMeaning('z_1'), count: 0, lastClicked: 0 },
    { id: 'z_2', folderId: 'f_default', name: 'Elhamdülillah', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_2, target: 33, meaning: getLocalizedClassicZikirMeaning('z_2'), count: 0, lastClicked: 0 },
    { id: 'z_3', folderId: 'f_default', name: 'Allahü Ekber', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_3, target: 33, meaning: getLocalizedClassicZikirMeaning('z_3'), count: 0, lastClicked: 0 },
    { id: 'z_4', folderId: 'f_default', name: 'La ilahe illallah', arabic: DEFAULT_ZIKIR_ARABIC_BY_ID.z_4, target: 100, meaning: getLocalizedClassicZikirMeaning('z_4'), count: 0, lastClicked: 0 }
];

ESMA_LIST.forEach((esma, index) => {
    DEFAULT_ZIKIRS.push({
        id: 'z_e_' + index, folderId: 'f_esma',
        name: esma.name, arabic: esma.arabic || '', target: esma.target, meaning: esma.meaning,
        count: 0, lastClicked: 0
    });
});

// Kütüphane: data/library/*.json — editoryal kurallar docs/I18N.md

function createDefaultAppSettings() {
    const settings = {
        vibrationTap: true,
        vibrationTarget: true,
        sound: false,
        wakeLock: false,
        counterNativeNumerals: false,
        arabicSublineFontStep: 0,
        theme: 'navy',
        accent: 'emerald',
        counterRingWidth: 12,
        counterNumberSize: 'm',
        counterShowTarget: true,
        counterShowTotal: true,
        counterShowRound: true,
        counterTapScale: 'm',
        counterTickSound: 'classic',
        counterBackground: 'none',
        counterBackgroundCustomDataUrl: '',
        locale: resolveLocaleFromSystem(),
        quranMeal: 'diyanet',
        quranReadMode: 'meal-ar',
        quranReaderLayout: 'scroll',
        quranMushafRememberPage: false,
        quranMushafSavedPage: 1,
        dailyZikirGoal: 0,
        weeklyReportEnabled: true
    };
    syncQuranSettingsForLocale(settings);
    return settings;
}

// State
let folders = [];
let zikirs = [];
let history = {};
let usageByDay = {};
let usageAreasByDay = {};
let appSettings = createDefaultAppSettings();
let reminderSettings = { enabled: false, time: '21:00', lastFiredYmd: null };
/** @type {import('./lib/smart-reminders.js').SmartReminderRule[]} */
let smartReminders = [];
let smartReminderEditId = null;
let entitlements = { premium: false };
let trash = { v: 1, entries: [] }; // soft-deleted items
let appMeta = { installedAt: null };
let lifetimeTotal = 0;
let lifetimeByZikir = {};
let allTimeSelectedZid = null;
/** @type {ReturnType<typeof createUsageTracker> | null} */
let usageTracker = null;
let weeklyReportWeekIndex = 3;

let currentFolderId = null;
let currentZikirId = null;
let currentQuranSurahId = null;
let quranAyahFavorites = [];
import { QURAN_COUNTER_LAYOUTS, normalizeQuranCounterLayout } from './lib/quran-counter-layout.js';

function isQuranZikir(z) {
    return !!(z?.quranRef && Number.isFinite(Number(z.quranRef.s)));
}

function getQuranRefAyahNums(ref) {
    if (!ref) return [];
    if (Array.isArray(ref.ayahs) && ref.ayahs.length) {
        return [...new Set(ref.ayahs.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 1))].sort(
            (a, b) => a - b
        );
    }
    const a = Number(ref.a);
    return Number.isFinite(a) && a >= 1 ? [a] : [];
}

/** Kur'an kaynaklı zikirlerin adı, Arapça metni ve meal/okunuşu locale + meal ile yenilenir. */
async function syncQuranZikirLocalizedContent() {
    const quranZikirs = zikirs.filter(isQuranZikir);
    if (!quranZikirs.length) return false;

    const mealId = normalizeQuranMeal(appSettings.quranMeal, appSettings.locale);
    const locale = appSettings.locale;
    const surahNums = [
        ...new Set(
            quranZikirs
                .map((z) => Number(z.quranRef?.s))
                .filter((n) => Number.isFinite(n) && n >= 1 && n <= 114)
        )
    ];

    const surahCache = new Map();
    await Promise.all(
        surahNums.map(async (surahN) => {
            try {
                surahCache.set(surahN, await fetchSurahAyahs(surahN, mealId, locale));
            } catch {
                surahCache.set(surahN, null);
            }
        })
    );

    let changed = false;
    for (const z of quranZikirs) {
        const surahN = Number(z.quranRef?.s);
        const ayahNums = getQuranRefAyahNums(z.quranRef);
        if (!Number.isFinite(surahN) || !ayahNums.length) continue;

        const surah = surahCache.get(surahN);
        if (!surah?.ayahs?.length) continue;

        const rows = ayahNums.map((n) => surah.ayahs.find((a) => a.n === n)).filter(Boolean);
        if (!rows.length) continue;

        const displayMode = normalizeQuranZikirDisplayMode(
            z.quranDisplayMode || getDefaultQuranReadModeForLocale(locale),
            locale
        );
        const { arabic, meaning } = buildQuranZikirContent(rows, displayMode);
        const surahName =
            getSurahLocalizedName(surah.n || surahN, locale) || t('quran.surahFallback', { n: surahN });
        const nextName = formatQuranZikirName(surahName, ayahNums);

        if (z.name !== nextName) {
            z.name = nextName;
            changed = true;
        }
        if (z.arabic !== arabic) {
            z.arabic = arabic;
            changed = true;
        }
        if (z.meaning !== meaning) {
            z.meaning = meaning;
            changed = true;
        }
    }
    return changed;
}

function refreshViewsAfterLocalizedZikirSync() {
    const fd = document.getElementById('folderDetailView');
    if (fd && fd.classList.contains('active')) renderFolderDetail();
    const cv = document.getElementById('counterView');
    if (cv && cv.classList.contains('active')) updateCounterUI();
    if (zikirStatsOverlay && zikirStatsOverlay.classList.contains('active')) renderZikirStats();
    const statsView = document.getElementById('statsView');
    if (statsView && !statsView.classList.contains('hidden')) renderStats();
}
let activeStatTab = 'daily';
let activeZikirStatTab = 'daily';
let folderSearchQuery = '';
let folderFavOnly = false;
let suppressListNavigation = false;

/** Tur tamamlama parlaması; arka arkaya forced reflow + animasyon titremesin */
let lastCounterGlowBurstAt = 0;
const COUNTER_GLOW_BURST_MIN_MS = 420;

let folderSelectMode = false;
let folderSelectBarVisible = false;
let selectedFolderIds = new Set();
let zikirSelectMode = false;
let zikirSelectBarVisible = false;
let selectedZikirIds = new Set();

/** Sürükle tutamacı: üç yatay çizgi */
const GRIP_3LINES_HTML =
    '<span class="grip-lines" aria-hidden="true"><span></span><span></span><span></span></span>';

// Limits (ücretsiz: 3 klasör toplam — varsayılan 2 + 1 ekleme; klasör başına 5 zikir)
const MAX_FOLDERS = 3;
const MAX_ZIKIRS_PER_FOLDER = 5;

/** Ücretsiz kütüphanede gösterilecek kilitli premium önizleme kartı sayısı. */
const LIBRARY_PREMIUM_PREVIEW_COUNT = 3;

/**
 * Premium test build'i: proje kökünde .env.local dosyasına VITE_PREMIUM_PREVIEW=1
 * yazınca (dosya commit'lenmez) yerel/telefon build'lerinde premium açılır.
 * Yayın build'i almadan önce bu dosyayı sil; cap:release:android zaten
 * verify adımında kontrol edip açıksa build'i durdurur.
 */
const PREMIUM_PREVIEW_BUILD = import.meta.env.VITE_PREMIUM_PREVIEW === '1';
const _premiumPreviewFlags = resolvePremiumPreviewFlags(PREMIUM_PREVIEW_BUILD);

/** false = limit yok, kütüphane tam açık (lansman öncesi). true = limitler + kilitli özellikler. */
const PREMIUM_LIVE = _premiumPreviewFlags.mode ? _premiumPreviewFlags.live : false;

/** Premium sekmesi + ayarlardaki çöp kutusu. Preview kapalıyken gizli. */
const PREMIUM_UI_VISIBLE = _premiumPreviewFlags.mode ? _premiumPreviewFlags.uiVisible : false;

/** Premium sekmesinden açılan özellikler → düzenleme ekranı / yönlendirme (PREMIUM_LIVE iken) */
const PREMIUM_FEATURE_VIEW_IDS = new Set([
    'premiumFeatureThemeView',
    'premiumFeatureCounterCustomizeView',
    'premiumFeatureCounterBackgroundView',
    'premiumFeatureRemindersView',
    'premiumFeatureWeeklyView'
]);

/* Yedekleme artık ayrı bir görünüm değil; premium sekmesinin üstündeki
   hesap kartında yaşıyor (premiumAccountSection). */
const PREMIUM_HUB_FEATURES = {
    theme: { viewId: 'premiumFeatureThemeView', locked: true },
    reminders: { viewId: 'premiumFeatureRemindersView', locked: true },
    weekly: { viewId: 'premiumFeatureWeeklyView', locked: true },
    trash: { overlayId: 'trashOverlay', locked: true },
    stats: { viewId: 'statsView', locked: false },
    library: { viewId: 'libraryView', locked: false }
};

const PREMIUM_STAT_TABS = new Set(['monthly', 'yearly', 'allTime']);

const ALL_TIME_SLICE_COLORS = [
    '#2ecc71',
    '#3498db',
    '#9b59b6',
    '#e67e22',
    '#1abc9c',
    '#e74c3c',
    '#f1c40f',
    '#95a5a6',
    '#16a085',
    '#636e72'
];

function getMaxFolders() {
    if (!PREMIUM_LIVE) return Infinity;
    return isPremium() ? Infinity : MAX_FOLDERS;
}

function getMaxZikirsPerFolder() {
    if (!PREMIUM_LIVE) return Infinity;
    return isPremium() ? Infinity : MAX_ZIKIRS_PER_FOLDER;
}

/** Limitler yalnızca yeni eklemeyi engeller; mevcut fazla klasör/zikir silinmez (grandfather). */
function countZikirsInFolder(folderId) {
    return zikirs.filter((z) => z.folderId === folderId).length;
}

function canAddFolder() {
    const max = getMaxFolders();
    return !Number.isFinite(max) || folders.length < max;
}

function canAddZikirToFolder(folderId) {
    const max = getMaxZikirsPerFolder();
    return !Number.isFinite(max) || countZikirsInFolder(folderId) < max;
}

function handleFolderLimitBlocked() {
    if (!canAddFolder()) {
        if (isPremiumOnlyFeatureLocked()) showPremiumLimitUpsell('folder');
        return true;
    }
    return false;
}

async function handleZikirLimitBlocked(folderId) {
    if (canAddZikirToFolder(folderId)) return false;
    if (isPremiumOnlyFeatureLocked()) {
        showPremiumLimitUpsell('zikir');
    } else {
        const maxPerFolder = getMaxZikirsPerFolder();
        await showAppAlert(t('confirm.destFolderFullMsg', { max: maxPerFolder }), {
            title: t('confirm.destFolderFullTitle')
        });
    }
    return true;
}

function navigateToPremiumPurchase() {
    closePremiumUpsell();
    closeAllOverlays();
    showView('premiumPurchaseView');
}

/** Bu klasörler silinemez (varsayılan içerik). */
const PROTECTED_FOLDER_IDS = new Set(['f_default', 'f_esma']);

// Circle Constants
const CIRCLE_RADIUS = 130;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// ===================== DOM ELEMENTS =====================
const views = document.querySelectorAll('.view');
// Home View
const folderGrid = document.getElementById('folderGrid');
const updateBannerSlot = document.getElementById('updateBannerSlot');
const newFolderBtn = document.getElementById('newFolderBtn');
const folderLimitWarning = document.getElementById('folderLimitWarning');
const homeQuoteFooter = document.getElementById('homeQuoteFooter');
let currentDailyQuoteEntry = null;
let dailyQuoteExpanded = false;
const folderMultiSelectBar = document.getElementById('folderMultiSelectBar');
const folderSelectCancelBtn = document.getElementById('folderSelectCancelBtn');
const folderSelectDeleteBtn = document.getElementById('folderSelectDeleteBtn');
const folderSelectCountEl = document.getElementById('folderSelectCount');
const folderHomeDragHint = document.getElementById('folderHomeDragHint');
const zikirMultiSelectBar = document.getElementById('zikirMultiSelectBar');
const zikirSelectCancelBtn = document.getElementById('zikirSelectCancelBtn');
const zikirSelectDeleteBtn = document.getElementById('zikirSelectDeleteBtn');
const zikirSelectCountEl = document.getElementById('zikirSelectCount');
// Folder Detail View
const folderDetailTitle = document.getElementById('folderDetailTitle');
const folderZikirList = document.getElementById('folderZikirList');
const zikirLimitWarning = document.getElementById('zikirLimitWarning');
const openAddZikirModalBtn = document.getElementById('openAddZikirModalBtn');
const folderSearchInput = document.getElementById('folderSearchInput');
const folderFavoritesOnly = document.getElementById('folderFavoritesOnly');
const folderZikirDragHint = document.getElementById('folderZikirDragHint');
// Counter View
const countDisplay = document.getElementById('countDisplay');
const targetDisplay = document.getElementById('targetDisplay');
const totalDisplay = document.getElementById('totalDisplay');
const roundDisplay = document.getElementById('roundDisplay');
const zikirTitle = document.getElementById('zikirTitle');
const zikirArabicHeader = document.getElementById('zikirArabic');
const zikirNote = document.getElementById('zikirNote');
const progressCircle = document.getElementById('progressCircle');
const mainCounterBtn = document.getElementById('mainCounterBtn');
const decrementBtn = document.getElementById('decrementBtn');
const resetBtn = document.getElementById('resetBtn');
const openZikirStatsBtn = document.getElementById('openZikirStatsBtn');
const zikirStatsOverlay = document.getElementById('zikirStatsOverlay');
const zikirActivityChart = document.getElementById('zikirActivityChart');
const zikirChartYAxis = document.getElementById('zikirChartYAxis');
const zikirStatsTitle = document.getElementById('zikirStatsTitle');
const zikirStatsSummaryLabel = document.getElementById('zikirStatsSummaryLabel');
const zikirStatsSummaryValue = document.getElementById('zikirStatsSummaryValue');
const zikirStatsSummarySub = document.getElementById('zikirStatsSummarySub');
const zikirStatsChartHeading = document.getElementById('zikirStatsChartHeading');
const zikirStatTabBtns = document.querySelectorAll('#zikirStatsOverlay .zikir-stats-tabs .tab-btn');

// Stats View
const statTabBtns = document.querySelectorAll('#statsView .stats-tabs .tab-btn');
const statMostClicked = document.getElementById('statMostClicked');
const statMostClickedCount = document.getElementById('statMostClickedCount');
const statLastClicked = document.getElementById('statLastClicked');
const statBestDayDate = document.getElementById('statBestDayDate');
const statBestDayCount = document.getElementById('statBestDayCount');
const activityChart = document.getElementById('activityChart');
const statsPeriodPanel = document.getElementById('statsPeriodPanel');
const statsAllTimePanel = document.getElementById('statsAllTimePanel');
const allTimeTotalEl = document.getElementById('allTimeTotal');
const allTimeSinceEl = document.getElementById('allTimeSince');
const allTimeDaysEl = document.getElementById('allTimeDays');
const allTimeAvgEl = document.getElementById('allTimeAvg');
const allTimeDonutEl = document.getElementById('allTimeDonut');
const allTimeDonutFocusEl = document.getElementById('allTimeDonutFocus');
const allTimeListEl = document.getElementById('allTimeList');

// Stealth View
const enterStealthBtn = document.getElementById('enterStealthBtn');
const stealthZikirName = document.getElementById('stealthZikirName');
const stealthCounter = document.getElementById('stealthCounter');
const stealthClickArea = document.getElementById('stealthClickArea');
const exitStealthBtn = document.getElementById('exitStealthBtn');

// Library View
const libraryGrid = document.getElementById('libraryGrid');
const libraryCategoryTabs = document.querySelectorAll('#libraryCategoryTabs .tab-btn');
const librarySearchInput = document.getElementById('librarySearchInput');
const libraryDetailOverlay = document.getElementById('libraryDetailOverlay');
const libDetailName = document.getElementById('libDetailName');
const libDetailArabic = document.getElementById('libDetailArabic');
const libDetailMeaning = document.getElementById('libDetailMeaning');
const libDetailContextWrap = document.getElementById('libDetailContextWrap');
const libDetailContext = document.getElementById('libDetailContext');
const libDetailContextLabel = document.getElementById('libDetailContextLabel');
const prepLibraryAddBtn = document.getElementById('prepLibraryAddBtn');
const libraryFolderSelectOverlay = document.getElementById('libraryFolderSelectOverlay');
const libDestFolder = document.getElementById('libDestFolder');
const confirmLibraryAddBtn = document.getElementById('confirmLibraryAddBtn');

let selectedLibraryItem = null;
let activeLibraryCat = 'dua';
let librarySearchQuery = '';

// Settings
const openSettingsBtn = document.getElementById('openSettingsBtn');
const trashOverlay = document.getElementById('trashOverlay');
const cbVibrationTap = document.getElementById('settingVibrationTap');
const cbVibrationTarget = document.getElementById('settingVibrationTarget');
const cbSound = document.getElementById('settingSound');
const tickSoundSetting = document.getElementById('tickSoundSetting');
const tickSoundPickerToggle = document.getElementById('tickSoundPickerToggle');
const tickSoundOptionsPanel = document.getElementById('tickSoundOptionsPanel');
const cbWakeLock = document.getElementById('settingWakeLock');
const cbCounterNativeNumerals = document.getElementById('settingCounterNativeNumerals');
const nativeNumeralsSetting = document.getElementById('nativeNumeralsSetting');
const arabicFontSetting = document.getElementById('arabicFontSetting');
const arabicFontStepDown = document.getElementById('arabicFontStepDown');
const arabicFontStepUp = document.getElementById('arabicFontStepUp');
const openPrivacyBtn = document.getElementById('openPrivacyBtn');
const cbReminderEnabled = document.getElementById('settingReminderEnabled');
const reminderTimeInput = document.getElementById('settingReminderTime');
const bottomNav = document.getElementById('bottomNav');
const themeChoiceBtns = document.querySelectorAll('[data-theme-choice]');
const localeSetting = document.getElementById('localeSetting');
const localeToggleBtn = document.getElementById('localeToggleBtn');
const localeOptionsPanel = document.getElementById('localeOptionsPanel');
const localeOptionsList = document.getElementById('localeOptionsList');
const localeCurrentLabel = document.getElementById('localeCurrentLabel');
const localeCurrentFlag = document.getElementById('localeCurrentFlag');
const localeChoiceBtns = document.querySelectorAll('.locale-setting__option[data-locale-choice]');

function localeFlagUrl(flagCode) {
    return new URL(`assets/flags/${flagCode}.svg`, document.baseURI).href;
}

function setLocaleFlagElement(el, flagCode) {
    if (!el || !flagCode) return;
    let img = el.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        el.appendChild(img);
    }
    const next = localeFlagUrl(flagCode);
    if (img.getAttribute('src') !== next) img.src = next;
}

function initLocaleOptionFlags() {
    localeChoiceBtns.forEach((btn) => {
        const code = btn.getAttribute('data-locale-choice');
        const meta = SUPPORTED_LOCALES.find((l) => l.code === code);
        const flagEl = btn.querySelector('.locale-setting__flag');
        if (meta && flagEl) setLocaleFlagElement(flagEl, meta.flag);
    });
}
const THEME_META_COLORS = { navy: '#0a0e16', light: '#faf8f5', black: '#000000' };

/** @returns {'navy'|'light'|'black'} */
function normalizeAppTheme(theme) {
    if (theme === 'light') return 'light';
    if (theme === 'black') return 'black';
    return 'navy';
}

/** @returns {'emerald'|'teal'|'cyan'|'blue'|'indigo'|'violet'|'pink'|'red'|'orange'|'amber'|'lime'|'sky'} */
function normalizeAppAccent(accent) {
    const v = String(accent || '').trim();
    if (v === 'teal') return 'teal';
    if (v === 'cyan') return 'cyan';
    if (v === 'blue') return 'blue';
    if (v === 'indigo') return 'indigo';
    if (v === 'violet') return 'violet';
    if (v === 'pink') return 'pink';
    if (v === 'red') return 'red';
    if (v === 'orange') return 'orange';
    if (v === 'amber') return 'amber';
    if (v === 'lime') return 'lime';
    if (v === 'sky') return 'sky';
    return 'emerald';
}

function normalizeCounterRingWidth(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 12;
    return Math.min(18, Math.max(8, Math.round(n)));
}

/** @returns {'s'|'m'|'l'} */
function normalizeCounterNumberSize(v) {
    const s = String(v || '').trim();
    if (s === 's') return 's';
    if (s === 'l') return 'l';
    return 'm';
}

/** @returns {'s'|'m'|'l'} */
function normalizeCounterTapScale(v) {
    const s = String(v || '').trim();
    if (s === 's') return 's';
    if (s === 'l') return 'l';
    return 'm';
}

const COUNTER_TAP_SCALE_VALUES = { s: 0.88, m: 1, l: 1.14 };

const COUNTER_CUSTOMIZE_PREVIEW = {
    roundCount: 12,
    target: 33,
    total: 45,
    completedRounds: 1
};

const counterCustomizeView = document.getElementById('premiumFeatureCounterCustomizeView');
const counterCustomizeSheet = document.getElementById('counterCustomizeSheet');
const counterCustomizeSheetDrag = document.getElementById('counterCustomizeSheetDrag');

function getCounterCustomizeSheetBounds() {
    const vh = window.innerHeight || 640;
    const peek = Math.min(Math.round(vh * 0.42), 320);
    const expanded = Math.max(peek + 80, Math.round(vh * 0.88));
    return { peek, expanded };
}

function setCounterCustomizeSheetHeight(px, { animate = true } = {}) {
    if (!counterCustomizeView) return;
    if (counterCustomizeSheet) {
        counterCustomizeSheet.classList.toggle('is-dragging', !animate);
    }
    counterCustomizeView.style.setProperty('--counter-sheet-height', `${Math.round(px)}px`);
}

function resetCounterCustomizeSheet({ expanded = false } = {}) {
    const { peek, expanded: maxH } = getCounterCustomizeSheetBounds();
    setCounterCustomizeSheetHeight(expanded ? maxH : peek, { animate: false });
    if (counterCustomizeView) {
        counterCustomizeView.dataset.sheetExpanded = expanded ? 'true' : 'false';
    }
    if (counterCustomizeSheet) counterCustomizeSheet.classList.remove('is-dragging');
}

function snapCounterCustomizeSheet(height) {
    const { peek, expanded } = getCounterCustomizeSheetBounds();
    const open = height > (peek + expanded) / 2;
    setCounterCustomizeSheetHeight(open ? expanded : peek, { animate: true });
    if (counterCustomizeView) {
        counterCustomizeView.dataset.sheetExpanded = open ? 'true' : 'false';
    }
    if (counterCustomizeSheet) counterCustomizeSheet.classList.remove('is-dragging');
}

let counterSheetDragState = null;

function initCounterCustomizeSheetDrag() {
    if (!counterCustomizeSheet || !counterCustomizeSheetDrag) return;

    const onPointerDown = (e) => {
        if (e.button != null && e.button !== 0) return;
        counterSheetDragState = {
            pointerId: e.pointerId,
            startY: e.clientY,
            startH: counterCustomizeSheet.offsetHeight
        };
        counterCustomizeSheet.classList.add('is-dragging');
        counterCustomizeSheetDrag.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!counterSheetDragState || e.pointerId !== counterSheetDragState.pointerId) return;
        const dy = counterSheetDragState.startY - e.clientY;
        const { peek, expanded } = getCounterCustomizeSheetBounds();
        const next = Math.min(expanded, Math.max(peek, counterSheetDragState.startH + dy));
        setCounterCustomizeSheetHeight(next, { animate: false });
    };

    const endDrag = (e) => {
        if (!counterSheetDragState || e.pointerId !== counterSheetDragState.pointerId) return;
        try {
            counterCustomizeSheetDrag.releasePointerCapture(e.pointerId);
        } catch {
            // ignore
        }
        snapCounterCustomizeSheet(counterCustomizeSheet.offsetHeight);
        counterSheetDragState = null;
    };

    counterCustomizeSheetDrag.addEventListener('pointerdown', onPointerDown);
    counterCustomizeSheetDrag.addEventListener('pointermove', onPointerMove);
    counterCustomizeSheetDrag.addEventListener('pointerup', endDrag);
    counterCustomizeSheetDrag.addEventListener('pointercancel', endDrag);
}

// Modals
const addModalOverlay = document.getElementById('addModalOverlay');
const saveZikirBtn = document.getElementById('saveZikirBtn');
const editModalOverlay = document.getElementById('editModalOverlay');
const saveEditBtn = document.getElementById('saveEditBtn');
const editZikirNameInp = document.getElementById('editZikirName');
const editZikirTargetInp = document.getElementById('editZikirTarget');
const editZikirMeaningInp = document.getElementById('editZikirMeaning');
const editZikirFaziletInp = document.getElementById('editZikirFazilet');
const editZikirArabicInp = document.getElementById('editZikirArabic');
let editingZikirIdMap = null; // tracking edit

const copyModalOverlay = document.getElementById('copyModalOverlay');
const copyDestFolder = document.getElementById('copyDestFolder');
const saveCopyBtn = document.getElementById('saveCopyBtn');
const saveMoveBtn = document.getElementById('saveMoveBtn');
let copyingZikirId = null;

// ===================== INIT =====================
async function init() {
    await loadRuntimeFlags();
    if (progressCircle) {
        progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    }
    if (ccvProgressCircle) {
        ccvProgressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        ccvProgressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    }

    applyNativeBottomInsetVar();
    if (isCapacitorNative()) {
        void setupCrashReporting();
        setTimeout(() => void refreshNativeBottomInsetVar(), 200);
        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                void refreshNativeBottomInsetVar();
                usageTracker?.resume();
                ensureWeeklyReportSchedule().catch(console.error);
                void maybeRunAutoCloudBackup();
            } else {
                usageTracker?.pause();
                flushSave(); // arka plana atılırken bekleyen sayaç yazmasını kaybetme
            }
        });
        App.addListener('backButton', () => {
            if (canNavigateBackInApp()) goBackInApp();
            else void App.exitApp();
        });
    }
    loadData();
    installPremiumPreviewConsoleHelper(PREMIUM_PREVIEW_BUILD);
    applyWeeklyReportPreviewSample();
    initUsageTracker();
    bindNativeReminderNotificationLaunch(openAppFromReminderNotification);
    applyCachedRemoteDailyQuotes(); // ağ beklemeden: son indirilen söz listesi
    setDailyQuote();
    setupEventListeners();
    setupSmartRemindersUI();
    setupWeeklyReportUI();
    setupBackupUI();
    setPremiumPurchaseNavigator(navigateToPremiumPurchase);
    setupPremiumUpsell();
    // RevenueCat: abonelik durumu değişince entitlement'ı güncelle (satın alma,
    // yenileme, iptal/süre dolumu — hepsi bu tek dinleyiciden akar).
    void initPremiumPurchases({
        onEntitlementChange: (active) => {
            if (entitlements.premium === active) return;
            entitlements.premium = active;
            saveData();
            syncPremiumLockedControls();
        }
    });
    setupPremiumPurchase({
        onSubscribe: (result) => {
            if (result?.ok) {
                entitlements.premium = true;
                saveData();
                syncPremiumLockedControls();
                void showAppAlert(t('premiumPurchase.purchaseSuccess'), {
                    title: t('premiumPurchase.title')
                });
                return;
            }
            if (result?.reason === 'cancelled') return; // kullanıcı vazgeçti; sessiz
            if (result?.reason === 'pending') {
                void showAppAlert(t('premiumPurchase.purchasePending'), {
                    title: t('premiumPurchase.title')
                });
                return;
            }
            if (result?.reason === 'unavailable') {
                void showAppAlert(t('premiumPurchase.stubNote'), { title: t('premiumPurchase.title') });
                return;
            }
            void showAppAlert(t('premiumPurchase.purchaseError'), {
                title: t('premiumPurchase.title')
            });
        },
        onRestore: (result) => {
            if (result?.ok) {
                entitlements.premium = true;
                saveData();
                syncPremiumLockedControls();
                void showAppAlert(t('premiumPurchase.restoreSuccess'), { title: t('premiumPurchase.title') });
                return;
            }
            if (result?.reason === 'nothing_to_restore') {
                void showAppAlert(t('premiumPurchase.restoreNothing'), { title: t('premiumPurchase.title') });
                return;
            }
            void showAppAlert(t('premiumPurchase.restoreUnavailable'), { title: t('premiumPurchase.title') });
        }
    });
    setMultiSelectBarShown(folderMultiSelectBar, false);
    setMultiSelectBarShown(zikirMultiSelectBar, false);
    // Do not push on first paint; set the baseline history state.
    showView('homeView', null, { push: false });
    ensureInitialHistoryState();
    setInAppStackTo(getViewState('homeView', null));
    syncPremiumLockedControls();
    if (!isCapacitorNative() && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }
    if (reminderSettings && reminderSettings.enabled) {
        if (!isCapacitorNative()) maybeRequestNotificationPermission();
        ensureReminderSchedule().catch(console.error);
    }
    ensureSmartReminderSchedule().catch(console.error);
    ensureWeeklyReportSchedule().catch(console.error);
    void maybeRunAutoCloudBackup();
    document.addEventListener('visibilitychange', onAppBecameVisibleForReminders);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') {
            usageTracker?.pause();
            flushSave(); // sekme gizlenince bekleyen sayaç yazmasını diske işle
            return;
        }
        usageTracker?.resume();
        ensureWeeklyReportSchedule().catch(console.error);
        void maybeRunAutoCloudBackup();
        refreshRemoteHomeContent();
    });
    window.addEventListener('pagehide', () => {
        usageTracker?.pause();
        flushSave();
    });
    window.addEventListener('pageshow', onPageShowForReminders);
    // Make Android/iOS/WebView back follow in-app navigation.
    window.addEventListener('popstate', (e) => {
        const st = e && e.state ? e.state : null;
        closeAllOverlays();
        if (isOverlayState(st)) {
            const el = document.getElementById(st.overlayId);
            if (el) el.classList.add('active');
            if (st.overlayId === 'zikirStatsOverlay') renderZikirStats();
            return;
        }
        if (!st || typeof st !== 'object' || typeof st.viewId !== 'string') {
            const home = getViewState('homeView', null);
            setInAppStackTo(home);
            showView('homeView', null, { push: false });
            return;
        }
        syncInAppStackToHistoryState(st);
        showView(st.viewId, st.param ?? null, { push: false });
    });
    // Some WebViews don't produce reliable history for internal tabs; keep a robust fallback stack.
    document.addEventListener('keydown', (e) => {
        // Desktop browsers sometimes map Backspace to back-navigation; don't steal when typing.
        if (e.key !== 'Backspace') return;
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        // Prevent browser default back and use in-app back instead.
        e.preventDefault();
        goBackInApp();
    });
    if (ESMA_LIST.length !== ESMA_ARABIC.length) {
        console.warn('Zikirmatik: ESMA_LIST ile ESMA_ARABIC uzunlukları eşleşmiyor.');
    }
    if (ESMA_LIST.length !== ESMA_NAME_EN.length || ESMA_LIST.length !== ESMA_NAME_BN.length) {
        console.warn('Zikirmatik: Esma isim dizileri ESMA_LIST ile eşleşmiyor.');
    }

    refreshRemoteHomeContent();
    // Dil id/ms/bn/ur ise ilk kez samimi çeviri notu (home boyandıktan sonra).
    requestAnimationFrame(() => {
        maybeShowLocaleWelcome(appSettings.locale);
    });
}

async function refreshRemoteHomeContent() {
    await Promise.all([
        refreshUpdateBannerConfig(),
        refreshSeasonalContent(appSettings.locale),
        refreshRemoteDailyQuotes()
    ]);
    applySeasonalContentToAppState(folders, zikirs, appSettings.locale);
    if (document.getElementById('homeView')?.classList.contains('active')) renderFolders();
    const fd = document.getElementById('folderDetailView');
    if (fd?.classList.contains('active') && isSeasonalFolderId(currentFolderId)) {
        renderFolderDetail();
    }
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function safeZikirTarget(z) {
    const t = parseInt(z && z.target, 10);
    return Number.isFinite(t) && t > 0 ? t : 33;
}

function isQuranAyahFavorite(surahN, ayahN) {
    const s = Number(surahN);
    const a = Number(ayahN);
    return quranAyahFavorites.some((f) => f.s === s && f.a === a);
}

function toggleQuranAyahFavorite(surahN, ayahN) {
    const s = Number(surahN);
    const a = Number(ayahN);
    if (!Number.isFinite(s) || !Number.isFinite(a)) return false;
    const idx = quranAyahFavorites.findIndex((f) => f.s === s && f.a === a);
    if (idx >= 0) {
        quranAyahFavorites.splice(idx, 1);
        saveData();
        syncQuranAyahFavoriteButtons();
        if (getQuranViewTab() === 'favorites') void renderQuranFavoritesList(appSettings.quranMeal, quranAyahFavorites);
        return false;
    }
    quranAyahFavorites.unshift({ s, a, t: Date.now() });
    if (quranAyahFavorites.length > 500) quranAyahFavorites.length = 500;
    saveData();
    syncQuranAyahFavoriteButtons();
    if (getQuranViewTab() === 'favorites') void renderQuranFavoritesList(appSettings.quranMeal, quranAyahFavorites);
    return true;
}

function setQuranDrawerFolderError(message) {
    const el = document.getElementById('quranDrawerFolderError');
    if (!el) return;
    if (message) {
        el.textContent = message;
        el.hidden = false;
    } else {
        el.textContent = '';
        el.hidden = true;
    }
}

function syncQuranDrawerFolderModeUI(mode) {
    const hasMeal = localeHasQuranMeal(appSettings.locale);
    document.querySelectorAll('#quranDrawerFolderModeList .quran-folder-add__mode').forEach((btn) => {
        const readModeId = btn.getAttribute('data-read-mode');
        if (readModeId === 'meal-ar' || readModeId === 'meal-translit-ar') btn.hidden = !hasMeal;
        const on = normalizeQuranZikirDisplayMode(readModeId, appSettings.locale) === mode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
}

function getQuranDrawerFolderSelectedMode() {
    const active = document.querySelector('#quranDrawerFolderModeList .quran-folder-add__mode.active');
    return normalizeQuranZikirDisplayMode(
        active?.getAttribute('data-read-mode') || getDefaultQuranReadModeForLocale(appSettings.locale),
        appSettings.locale
    );
}

function syncQuranDrawerCounterLayoutUI(layout) {
    document.querySelectorAll('#quranDrawerFolderLayoutList .quran-folder-add__mode').forEach((btn) => {
        const on = normalizeQuranCounterLayout(btn.getAttribute('data-counter-layout')) === layout;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
}

function getQuranDrawerCounterLayoutSelected() {
    const active = document.querySelector('#quranDrawerFolderLayoutList .quran-folder-add__mode.active');
    return normalizeQuranCounterLayout(active?.getAttribute('data-counter-layout') || 'classic');
}

function setReviseQuranDisplayError(msg) {
    const el = document.getElementById('reviseQuranDisplayError');
    if (!el) return;
    const text = String(msg || '').trim();
    if (text) {
        el.textContent = text;
        el.hidden = false;
    } else {
        el.textContent = '';
        el.hidden = true;
    }
}

function syncReviseQuranDisplayModeUI(mode) {
    const hasMeal = localeHasQuranMeal(appSettings.locale);
    document.querySelectorAll('#reviseQuranDisplayModeList .quran-folder-add__mode').forEach((btn) => {
        const readModeId = btn.getAttribute('data-read-mode');
        if (readModeId === 'meal-ar' || readModeId === 'meal-translit-ar') btn.hidden = !hasMeal;
        const on = normalizeQuranZikirDisplayMode(readModeId, appSettings.locale) === mode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
}

function getReviseQuranDisplaySelectedMode() {
    const active = document.querySelector('#reviseQuranDisplayModeList .quran-folder-add__mode.active');
    return normalizeQuranZikirDisplayMode(
        active?.getAttribute('data-read-mode') || getDefaultQuranReadModeForLocale(appSettings.locale),
        appSettings.locale
    );
}

function syncReviseQuranDisplayLayoutUI(layout) {
    document.querySelectorAll('#reviseQuranDisplayLayoutList .quran-folder-add__mode').forEach((btn) => {
        const on = normalizeQuranCounterLayout(btn.getAttribute('data-counter-layout')) === layout;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
}

function getReviseQuranDisplaySelectedLayout() {
    const active = document.querySelector('#reviseQuranDisplayLayoutList .quran-folder-add__mode.active');
    return normalizeQuranCounterLayout(active?.getAttribute('data-counter-layout') || 'classic');
}

function openReviseQuranDisplayModal() {
    const zikir = zikirs.find((z) => z.id === currentZikirId);
    if (!isQuranZikir(zikir)) return;
    const mode = normalizeQuranZikirDisplayMode(
        zikir.quranDisplayMode || getDefaultQuranReadModeForLocale(appSettings.locale),
        appSettings.locale
    );
    const layout = normalizeQuranCounterLayout(zikir.quranCounterLayout);
    setReviseQuranDisplayError('');
    syncReviseQuranDisplayModeUI(mode);
    syncReviseQuranDisplayLayoutUI(layout);
    openOverlay('reviseQuranDisplayOverlay');
}

async function applyReviseQuranDisplay() {
    const zikir = zikirs.find((z) => z.id === currentZikirId);
    if (!isQuranZikir(zikir)) return false;

    const displayMode = getReviseQuranDisplaySelectedMode();
    const counterLayout = getReviseQuranDisplaySelectedLayout();
    const surahN = Number(zikir.quranRef?.s);
    const ayahNums = getQuranRefAyahNums(zikir.quranRef);
    if (!Number.isFinite(surahN) || !ayahNums.length) {
        setReviseQuranDisplayError(t('counter.reviseDisplayError'));
        return false;
    }

    const mealId = normalizeQuranMeal(appSettings.quranMeal, appSettings.locale);
    let surah;
    try {
        surah = await fetchSurahAyahs(surahN, mealId, appSettings.locale);
    } catch {
        setReviseQuranDisplayError(t('counter.reviseDisplayError'));
        return false;
    }
    const rows = ayahNums.map((n) => surah?.ayahs?.find((a) => a.n === n)).filter(Boolean);
    if (!rows.length) {
        setReviseQuranDisplayError(t('counter.reviseDisplayError'));
        return false;
    }

    const { arabic, meaning } = buildQuranZikirContent(rows, displayMode);
    zikir.quranDisplayMode = displayMode;
    zikir.quranCounterLayout = counterLayout;
    zikir.arabic = arabic;
    zikir.meaning = meaning;
    saveData();
    updateCounterUI();
    closeOverlayPreferHistory('reviseQuranDisplayOverlay');
    return true;
}

function parseQuranDrawerAyahSelection(ayahCount) {
    const raw = String(document.getElementById('quranDrawerFolderAyahsInput')?.value || '').trim();
    if (!raw) throw new Error(t('quran.folderAddNeedAyah'));
    const nums = [];
    raw.split(/[,،\s]+/).forEach((part) => {
        const token = String(part || '').trim();
        if (!token) return;
        const n = Number(token);
        if (!Number.isFinite(n) || n < 1 || n > ayahCount) {
            throw new Error(t('quran.folderAddInvalidAyah', { max: ayahCount }));
        }
        if (!nums.includes(n)) nums.push(n);
    });
    if (!nums.length) throw new Error(t('quran.folderAddNeedAyah'));
    if (nums.length > 3) throw new Error(t('quran.folderAddMaxAyahs'));
    nums.sort((a, b) => a - b);
    return nums;
}

function populateQuranDrawerFolderSelect() {
    const select = document.getElementById('quranDrawerFolderDestSelect');
    if (!select) return false;
    select.innerHTML = '';
    folders.forEach((f) => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        select.appendChild(opt);
    });
    return select.options.length > 0;
}

function resetQuranDrawerFolderForm() {
    const surahInp = document.getElementById('quranDrawerFolderSurahInput');
    const ayahsInp = document.getElementById('quranDrawerFolderAyahsInput');
    if (surahInp) surahInp.value = '';
    if (ayahsInp) ayahsInp.value = '';
    setQuranDrawerFolderError('');
    syncQuranDrawerFolderModeUI(getDefaultQuranReadModeForLocale(appSettings.locale));
    syncQuranDrawerCounterLayoutUI('classic');
}

function setQuranDrawerFolderPanelOpen(open) {
    const panel = document.getElementById('quranDrawerFolderPanel');
    const toggle = document.getElementById('quranDrawerFolderToggle');
    if (!panel || !toggle) return;
    const isOpen = !!open;
    panel.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.classList.toggle('quran-drawer-folder-toggle--open', isOpen);
    if (isOpen) populateQuranDrawerFolderSelect();
    else resetQuranDrawerFolderForm();
}

function ayahArabicForZikir(ayah) {
    const bism = ayah.bismillah && String(ayah.bismillah).trim();
    const ar = String(ayah.ar || '').trim();
    if (bism && ar) return `${bism}\n${ar}`;
    return bism || ar;
}

function buildQuranZikirContent(ayahRows, displayMode) {
    const sep = '\n\n';
    const arabicParts = [];
    const subParts = [];
    ayahRows.forEach((ayah) => {
        const ar = ayahArabicForZikir(ayah);
        if (ar) arabicParts.push(ar);
        if (displayMode === 'meal-ar') {
            const tr = String(ayah.tr || '').trim();
            if (tr) subParts.push(tr);
        } else if (displayMode === 'translit-ar') {
            const lat = String(ayah.lat || '').trim();
            if (lat) subParts.push(lat);
        } else if (displayMode === 'meal-translit-ar') {
            const tr = String(ayah.tr || '').trim();
            const lat = String(ayah.lat || '').trim();
            const bits = [lat, tr].filter(Boolean);
            if (bits.length) subParts.push(bits.join('\n'));
        }
    });
    return {
        arabic: arabicParts.join(sep),
        meaning: subParts.join(sep)
    };
}

function formatQuranZikirName(nameTr, ayahNums) {
    if (ayahNums.length === 1) return `${nameTr} ${ayahNums[0]}`;
    return `${nameTr} ${ayahNums.join(', ')}`;
}

function addQuranAyahsBatchToFolder(destId, batch, ayahNums, displayMode, counterLayout) {
    if (!destId || !batch) return false;
    const rows = ayahNums
        .map((n) => batch.ayahs.find((a) => a.n === n))
        .filter(Boolean);
    if (!rows.length) return false;

    const { arabic, meaning } = buildQuranZikirContent(rows, displayMode);
    const newZ = {
        id: 'z_' + Date.now(),
        folderId: destId,
        name: formatQuranZikirName(batch.nameTr, ayahNums),
        arabic,
        target: 33,
        meaning,
        count: 0,
        lastClicked: 0,
        quranRef: { s: batch.surah, a: ayahNums[0], ayahs: ayahNums },
        quranDisplayMode: displayMode,
        quranCounterLayout: normalizeQuranCounterLayout(counterLayout),
        order:
            zikirs
                .filter((x) => x.folderId === destId)
                .reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1) + 1
    };
    zikirs.push(newZ);
    saveData();
    return true;
}

async function saveQuranDrawerFolderAdd() {
    const surahRaw = document.getElementById('quranDrawerFolderSurahInput')?.value;
    const surahResult = resolveQuranSurahInput(surahRaw);
    if (!surahResult.ok) {
        setQuranDrawerFolderError(surahResult.message);
        return false;
    }

    const mealId = normalizeQuranMeal(appSettings.quranMeal, appSettings.locale);
    const surah = await fetchSurahAyahs(surahResult.surah, mealId, appSettings.locale);
    if (!surah) {
        setQuranDrawerFolderError(t('quran.loadError'));
        return false;
    }

    const ayahCount = surah.ayahCount || surah.ayahs?.length || 1;
    let ayahNums;
    try {
        ayahNums = parseQuranDrawerAyahSelection(ayahCount);
    } catch (err) {
        setQuranDrawerFolderError(err.message || t('quran.folderAddNeedAyah'));
        return false;
    }

    if (!populateQuranDrawerFolderSelect()) {
        setQuranDrawerFolderError('');
        await showAppAlert('Lütfen önce bir klasör oluşturun.', { title: 'Klasör yok' });
        return false;
    }
    const resolvedDestId = document.getElementById('quranDrawerFolderDestSelect')?.value;
    if (!resolvedDestId) return false;

    if (!canAddZikirToFolder(resolvedDestId)) {
        await handleZikirLimitBlocked(resolvedDestId);
        return false;
    }

    const batch = {
        surah: surahResult.surah,
        nameTr:
            getSurahLocalizedName(surah.n || surahResult.surah, appSettings.locale) ||
            t('quran.surahFallback', { n: surahResult.surah }),
        ayahs: surah.ayahs || []
    };
    const displayMode = getQuranDrawerFolderSelectedMode();
    const counterLayout = getQuranDrawerCounterLayoutSelected();
    addQuranAyahsBatchToFolder(resolvedDestId, batch, ayahNums, displayMode, counterLayout);
    setQuranDrawerFolderPanelOpen(false);
    closeQuranReaderDrawer();
    await showAppAlert(t('quran.addedToFolder'), { title: t('quran.addToFolder') });
    showView('folderDetailView', resolvedDestId);
    return true;
}

// Günlük tıklama geçmişi: istatistik ~1 yıl (günlük/haftalık/aylık/yıllık); localStorage şişmesin diye budarız.
const HISTORY_RETENTION_DAYS = 400;

// ===================== DATA =====================
function pruneHistory() {
    if (!history || typeof history !== 'object') return false;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - HISTORY_RETENTION_DAYS);
    const cy = cutoff.getFullYear();
    const cm = String(cutoff.getMonth() + 1).padStart(2, '0');
    const cd = String(cutoff.getDate()).padStart(2, '0');
    const cutoffStr = `${cy}-${cm}-${cd}`;
    let changed = false;
    Object.keys(history).forEach((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < cutoffStr) {
            delete history[day];
            changed = true;
        }
    });
    if (usageByDay && typeof usageByDay === 'object') {
        Object.keys(usageByDay).forEach((day) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < cutoffStr) {
                delete usageByDay[day];
                changed = true;
            }
        });
    }
    if (usageAreasByDay && typeof usageAreasByDay === 'object') {
        Object.keys(usageAreasByDay).forEach((day) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < cutoffStr) {
                delete usageAreasByDay[day];
                changed = true;
            }
        });
    }
    return changed;
}

function sanitizeHistory() {
    if (!history || typeof history !== 'object') return false;
    let changed = false;
    Object.keys(history).forEach((day) => {
        const block = history[day];
        if (!block || typeof block !== 'object') {
            delete history[day];
            changed = true;
            return;
        }
        Object.keys(block).forEach((zid) => {
            let v = block[zid];
            if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
                delete block[zid];
                changed = true;
            } else if (v === 0) {
                delete block[zid];
                changed = true;
            }
        });
        if (Object.keys(block).length === 0) {
            delete history[day];
            changed = true;
        }
    });
    return changed;
}

function applyAppTheme(theme) {
    const t = normalizeAppTheme(theme);
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.getElementById('metaThemeColor');
    if (meta) meta.setAttribute('content', THEME_META_COLORS[t]);
    const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatus) {
        appleStatus.setAttribute('content', t === 'light' ? 'default' : 'black-translucent');
    }
    void applyNativeStatusBarTheme(t);
}

function applyAppAccent(accent) {
    const a = normalizeAppAccent(accent);
    document.documentElement.setAttribute('data-accent', a);
}

function applyCounterAppearanceFromSettings() {
    const ring = normalizeCounterRingWidth(appSettings.counterRingWidth);
    const bg = Math.max(6, ring - 4);
    document.documentElement.style.setProperty('--counter-ring-width', String(ring));
    document.documentElement.style.setProperty('--counter-ring-bg-width', String(bg));
    const size = normalizeCounterNumberSize(appSettings.counterNumberSize);
    document.documentElement.setAttribute('data-counter-number-size', size);
    const tap = normalizeCounterTapScale(appSettings.counterTapScale);
    document.documentElement.setAttribute('data-counter-tap-scale', tap);
    document.documentElement.style.setProperty('--counter-tap-scale', String(COUNTER_TAP_SCALE_VALUES[tap]));
    document.documentElement.setAttribute(
        'data-counter-show-target',
        appSettings.counterShowTarget ? 'true' : 'false'
    );
    document.documentElement.setAttribute(
        'data-counter-show-total',
        appSettings.counterShowTotal ? 'true' : 'false'
    );
    document.documentElement.setAttribute(
        'data-counter-show-round',
        appSettings.counterShowRound ? 'true' : 'false'
    );
}

function applyCounterBackgroundFromSettings() {
    if (isCounterBackgroundLocked()) {
        document.documentElement.setAttribute('data-counter-background', 'none');
        document.documentElement.style.removeProperty('--counter-bg-image');
        return;
    }
    const bg = normalizeCounterBackground(appSettings.counterBackground);
    const customDataUrl = String(appSettings.counterBackgroundCustomDataUrl || '').trim();
    if (bg === 'custom') {
        if (!customDataUrl) {
            document.documentElement.setAttribute('data-counter-background', 'none');
            document.documentElement.style.removeProperty('--counter-bg-image');
            return;
        }
        document.documentElement.setAttribute('data-counter-background', 'on');
        document.documentElement.style.setProperty('--counter-bg-image', `url("${customDataUrl}")`);
        return;
    }
    document.documentElement.setAttribute('data-counter-background', bg === 'none' ? 'none' : 'on');
    const preset = findCounterBgPreset(bg);
    if (preset) {
        document.documentElement.style.setProperty('--counter-bg-image', `url("${counterBgPresetUrl(preset)}")`);
        return;
    }
    document.documentElement.style.removeProperty('--counter-bg-image');
}

const openCounterCustomizeBtn = document.getElementById('openCounterCustomizeBtn');
const openCounterBackgroundBtn = document.getElementById('openCounterBackgroundBtn');
const counterBgNoneBtn = document.getElementById('counterBgNoneBtn');
const counterBgPresetGrid = document.getElementById('counterBgPresetGrid');
const counterBgPresetsEmpty = document.getElementById('counterBgPresetsEmpty');
const counterBgGalleryBtn = document.getElementById('counterBgGalleryBtn');
const counterBgGalleryInput = document.getElementById('counterBgGalleryInput');
const COUNTER_BG_CUSTOM_MAX_EDGE_STEPS = [1440, 1200, 960, 768];
const COUNTER_BG_CUSTOM_JPEG_QUALITY = 0.8;
const COUNTER_BG_CUSTOM_DATA_URL_SOFT_LIMIT = 450000;

function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('counter background image load failed'));
        img.src = url;
    });
}

function drawCounterBackgroundToCanvas(img, maxEdge) {
    const longestEdge = Math.max(img.naturalWidth || img.width || 1, img.naturalHeight || img.height || 1);
    const scale = longestEdge > maxEdge ? maxEdge / longestEdge : 1;
    const width = Math.max(1, Math.round((img.naturalWidth || img.width || 1) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height || 1) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('counter background canvas unavailable');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
}

async function buildCounterBackgroundCustomDataUrl(file) {
    if (!file || !String(file.type || '').startsWith('image/')) {
        throw new Error('counter background file is not an image');
    }
    const objectUrl = URL.createObjectURL(file);
    try {
        const img = await loadImageFromUrl(objectUrl);
        let fallbackDataUrl = '';
        for (const maxEdge of COUNTER_BG_CUSTOM_MAX_EDGE_STEPS) {
            const canvas = drawCounterBackgroundToCanvas(img, maxEdge);
            const nextDataUrl = canvas.toDataURL('image/jpeg', COUNTER_BG_CUSTOM_JPEG_QUALITY);
            fallbackDataUrl = nextDataUrl;
            if (nextDataUrl.length <= COUNTER_BG_CUSTOM_DATA_URL_SOFT_LIMIT) return nextDataUrl;
        }
        return fallbackDataUrl;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function renderCounterBackgroundPresetGrid() {
    if (!counterBgPresetGrid) return;
    counterBgPresetGrid.replaceChildren();
    const active = normalizeCounterBackground(appSettings.counterBackground);
    COUNTER_BG_PRESETS.forEach((preset) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'counter-bg-preset-btn';
        btn.setAttribute('data-counter-bg-choice', `preset:${preset.id}`);
        btn.setAttribute('role', 'radio');
        const on = active === `preset:${preset.id}`;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', preset.labelKey ? t(preset.labelKey) : preset.id);
        const thumb = document.createElement('span');
        thumb.className = 'counter-bg-preset-btn__thumb';
        thumb.style.backgroundImage = `url("${counterBgPresetUrl(preset)}")`;
        btn.appendChild(thumb);
        counterBgPresetGrid.appendChild(btn);
    });
    if (counterBgPresetsEmpty) {
        counterBgPresetsEmpty.hidden = COUNTER_BG_PRESETS.length > 0;
    }
}

function syncCounterBackgroundEditorUI() {
    const active = normalizeCounterBackground(appSettings.counterBackground);
    if (counterBgNoneBtn) {
        const on = active === 'none';
        counterBgNoneBtn.classList.toggle('active', on);
        counterBgNoneBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    renderCounterBackgroundPresetGrid();
    if (counterBgGalleryBtn) {
        const onCustom = active === 'custom';
        counterBgGalleryBtn.classList.toggle('active', onCustom);
    }
    if (openCounterBackgroundBtn) {
        syncPremiumLockStar(openCounterBackgroundBtn, isCounterBackgroundLocked());
    }
}

function setCounterBackground(next) {
    const normalized = normalizeCounterBackground(next);
    if (appSettings.counterBackground === normalized) return;
    appSettings.counterBackground = normalized;
    applyCounterBackgroundFromSettings();
    syncCounterBackgroundEditorUI();
    saveData();
}

function setCustomCounterBackgroundDataUrl(dataUrl) {
    const normalized = String(dataUrl || '').trim();
    if (!normalized) return;
    const changed =
        appSettings.counterBackground !== 'custom' ||
        appSettings.counterBackgroundCustomDataUrl !== normalized;
    if (!changed) return;
    appSettings.counterBackground = 'custom';
    appSettings.counterBackgroundCustomDataUrl = normalized;
    applyCounterBackgroundFromSettings();
    syncCounterBackgroundEditorUI();
    saveData();
}

const ccvProgressCircle = document.getElementById('ccvProgressCircle');
const counterCustomizeRingRange = document.getElementById('counterCustomizeRingRange');
const counterShowTargetToggle = document.getElementById('counterShowTargetToggle');
const counterShowTotalToggle = document.getElementById('counterShowTotalToggle');
const counterShowRoundToggle = document.getElementById('counterShowRoundToggle');
const counterCustomizeNumSizeBtns = document.querySelectorAll('[data-counter-customize-num-size]');
const counterTapScaleBtns = document.querySelectorAll('[data-counter-tap-scale]');

function syncCounterCustomizeEditorUI() {
    if (counterCustomizeRingRange) {
        counterCustomizeRingRange.value = String(normalizeCounterRingWidth(appSettings.counterRingWidth));
    }
    const activeSize = normalizeCounterNumberSize(appSettings.counterNumberSize);
    counterCustomizeNumSizeBtns.forEach((btn) => {
        const on = (btn.getAttribute('data-counter-customize-num-size') || '') === activeSize;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const activeTap = normalizeCounterTapScale(appSettings.counterTapScale);
    counterTapScaleBtns.forEach((btn) => {
        const on = (btn.getAttribute('data-counter-tap-scale') || '') === activeTap;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (counterShowTargetToggle) counterShowTargetToggle.checked = !!appSettings.counterShowTarget;
    if (counterShowTotalToggle) counterShowTotalToggle.checked = !!appSettings.counterShowTotal;
    if (counterShowRoundToggle) counterShowRoundToggle.checked = !!appSettings.counterShowRound;
}

function renderCounterCustomizeEditor() {
    syncCounterCustomizeEditorUI();
    applyCounterAppearanceFromSettings();
    resetCounterCustomizeSheet({ expanded: counterCustomizeView?.dataset.sheetExpanded === 'true' });

    const preview = COUNTER_CUSTOMIZE_PREVIEW;
    const ccvCountDisplay = document.getElementById('ccvCountDisplay');
    const ccvTargetDisplay = document.getElementById('ccvTargetDisplay');
    const ccvTotalDisplay = document.getElementById('ccvTotalDisplay');
    const ccvRoundDisplay = document.getElementById('ccvRoundDisplay');

    if (ccvCountDisplay) ccvCountDisplay.textContent = formatCounterDisplay(preview.roundCount);
    if (ccvTargetDisplay) ccvTargetDisplay.textContent = formatCounterDisplay(preview.target);
    if (ccvTotalDisplay) ccvTotalDisplay.textContent = formatCounterDisplay(preview.total);
    if (ccvRoundDisplay) {
        ccvRoundDisplay.textContent = formatCounterDisplay(preview.completedRounds);
        ccvRoundDisplay.classList.add('visible');
    }

    if (ccvProgressCircle) {
        const circleProgress = preview.roundCount / preview.target;
        const offset = CIRCLE_CIRCUMFERENCE - circleProgress * CIRCLE_CIRCUMFERENCE;
        ccvProgressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        ccvProgressCircle.style.strokeDashoffset = String(offset);
    }
}

function syncThemeUI() {
    const theme = normalizeAppTheme(appSettings.theme);
    themeChoiceBtns.forEach((btn) => {
        const on = btn.getAttribute('data-theme-choice') === theme;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

const accentChoiceBtns = document.querySelectorAll('[data-accent-choice]');
const tickSoundChoiceBtns = document.querySelectorAll('[data-tick-sound-choice]');
function syncAccentUI() {
    const a = normalizeAppAccent(appSettings.accent);
    accentChoiceBtns.forEach((btn) => {
        const on = btn.getAttribute('data-accent-choice') === a;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

function syncTickSoundUI() {
    const active = normalizeCounterTickSound(appSettings.counterTickSound);
    const locked = isPremiumOnlyFeatureLocked();
    tickSoundChoiceBtns.forEach((btn) => {
        const id = normalizeCounterTickSound(btn.getAttribute('data-tick-sound-choice'));
        const isClassic = id === 'classic';
        const isLocked = locked && !isClassic;
        const on = id === active;
        btn.classList.toggle('active', on);
        btn.classList.toggle('is-premium-locked', isLocked);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        syncPremiumLockStar(btn, isLocked);
    });
}

function setTickSoundPickerOpen(open) {
    if (!tickSoundSetting || !tickSoundPickerToggle || !tickSoundOptionsPanel) return;
    const isOpen = !!open;
    tickSoundSetting.classList.toggle('is-open', isOpen);
    tickSoundPickerToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    tickSoundOptionsPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function syncTickSoundSettingVisibility() {
    if (!tickSoundSetting) return;
    const show = PREMIUM_LIVE && !!appSettings.sound;
    setSettingsBlockHidden(tickSoundSetting, !show);
    if (!show) setTickSoundPickerOpen(false);
}

function applyAppLocale(locale) {
    appSettings.locale = normalizeAppLocale(locale);
    applyLocaleToDocument(appSettings.locale);
    syncLocalizedDefaults({ persist: true });
    syncQuranSettingsForLocale(appSettings);
    syncQuranTabVisibility();
    clearQuranSurahCache();
    syncQuranDrawerFolderModeUI(appSettings.quranReadMode);
    const libView = document.getElementById('libraryView');
    if (libView && !libView.classList.contains('hidden')) renderLibrary();
    const qv = document.getElementById('quranView');
    if (qv && qv.classList.contains('active')) {
        if (getQuranViewTab() === 'favorites') {
            void renderQuranFavoritesList(appSettings.quranMeal, quranAyahFavorites);
        } else {
            renderQuranSurahList();
        }
    }
    const qsv = document.getElementById('quranSurahView');
    if (qsv && qsv.classList.contains('active') && currentQuranSurahId != null) {
        void renderQuranSurahDetail(
            currentQuranSurahId,
            appSettings.quranMeal,
            appSettings.quranReadMode,
            null,
            appSettings.quranReaderLayout,
            mushafNavOptsForRerender()
        );
    }
    const statsView = document.getElementById('statsView');
    if (statsView && !statsView.classList.contains('hidden')) renderStats();
    if (zikirStatsOverlay && zikirStatsOverlay.classList.contains('active')) renderZikirStats();
    syncPremiumLockedControls();
    const purchaseView = document.getElementById('premiumPurchaseView');
    if (purchaseView && !purchaseView.classList.contains('hidden')) renderPremiumPurchase();
    updateFolderSelectChrome();
    updateZikirSelectChrome();
    void refreshSeasonalContent(appSettings.locale).then(() => {
        applySeasonalContentToAppState(folders, zikirs, appSettings.locale);
        const hv = document.getElementById('homeView');
        if (hv && hv.classList.contains('active')) renderFolders();
        const fd = document.getElementById('folderDetailView');
        if (fd && fd.classList.contains('active')) renderFolderDetail();
    });
    const premiumView = document.getElementById('premiumView');
    if (premiumView && premiumView.classList.contains('active')) renderPremium();

    void syncQuranZikirLocalizedContent().then((changed) => {
        if (!changed) return;
        saveData();
        refreshViewsAfterLocalizedZikirSync();
    });
}

function setLocalePickerOpen(open) {
    if (!localeSetting || !localeToggleBtn || !localeOptionsPanel) return;
    const isOpen = !!open;
    localeSetting.classList.toggle('is-open', isOpen);
    localeToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    localeOptionsPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function syncLocaleUI() {
    const loc = normalizeAppLocale(appSettings.locale);
    const current = SUPPORTED_LOCALES.find((l) => l.code === loc);
    if (localeCurrentLabel && current) {
        localeCurrentLabel.textContent = t(current.labelKey);
    }
    if (localeCurrentFlag && current) {
        setLocaleFlagElement(localeCurrentFlag, current.flag);
    }
    localeChoiceBtns.forEach((btn) => {
        const on = btn.getAttribute('data-locale-choice') === loc;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    syncNativeNumeralsSettingVisibility();
    syncArabicFontSettingVisibility();
}

function formatCounterDisplay(value) {
    return formatCounterNumber(value, appSettings.locale, !!appSettings.counterNativeNumerals);
}

function setSettingsBlockHidden(el, hidden) {
    if (!el) return;
    el.hidden = hidden;
    if (hidden) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
}

function syncNativeNumeralsSettingVisibility() {
    if (!nativeNumeralsSetting) return;
    const show = localeSupportsNativeNumerals(appSettings.locale);
    setSettingsBlockHidden(nativeNumeralsSetting, !show);
    if (cbCounterNativeNumerals) cbCounterNativeNumerals.checked = !!appSettings.counterNativeNumerals;
}

function syncArabicFontSettingVisibility() {
    if (!arabicFontSetting) return;
    const show = !localeUsesArabicScript(appSettings.locale);
    setSettingsBlockHidden(arabicFontSetting, !show);
}

function syncArabicFontSettingUI() {
    const step = applyArabicSublineFontStep(appSettings.arabicSublineFontStep);
    appSettings.arabicSublineFontStep = step;
    if (arabicFontStepDown) {
        arabicFontStepDown.disabled = step <= ARABIC_SUBLINE_FONT_STEP_MIN;
    }
    if (arabicFontStepUp) {
        arabicFontStepUp.disabled = step >= ARABIC_SUBLINE_FONT_STEP_MAX;
    }
    syncArabicFontSettingVisibility();
}

function syncSettingsUI() {
    initLocaleOptionFlags();
    if (cbVibrationTap) cbVibrationTap.checked = !!appSettings.vibrationTap;
    if (cbVibrationTarget) cbVibrationTarget.checked = !!appSettings.vibrationTarget;
    if (cbSound) cbSound.checked = !!appSettings.sound;
    if (cbWakeLock) cbWakeLock.checked = !!appSettings.wakeLock;
    syncNativeNumeralsSettingVisibility();
    syncArabicFontSettingUI();
    if (cbReminderEnabled) cbReminderEnabled.checked = !!reminderSettings.enabled;
    if (reminderTimeInput) reminderTimeInput.value = reminderSettings.time || '21:00';
    applyAppTheme(appSettings.theme);
    applyAppAccent(appSettings.accent);
    applyCounterAppearanceFromSettings();
    applyCounterBackgroundFromSettings();
    applyAppLocale(appSettings.locale);
    syncThemeUI();
    syncAccentUI();
    syncTickSoundUI();
    syncTickSoundSettingVisibility();
    syncCounterBackgroundEditorUI();
    syncLocaleUI();
}

function loadData() {
    const sv = localStorage.getItem('zikirmatik_data_v2');
    if (sv) {
        let d;
        try {
            d = JSON.parse(sv);
        } catch (e) {
            console.error('zikirmatik_data_v2 okunamadı, varsayılan veri:', e);
            folders = [...getDefaultFolders()];
            zikirs = [...DEFAULT_ZIKIRS];
            history = {};
            usageByDay = {};
            usageAreasByDay = {};
            appSettings = createDefaultAppSettings();
            reminderSettings = { enabled: false, time: '21:00', lastFiredYmd: null };
            entitlements = { premium: false };
            trash = { v: 1, entries: [] };
            appMeta = { installedAt: getTodayString() };
            lifetimeTotal = 0;
            lifetimeByZikir = {};
            syncSettingsUI();
            return;
        }
        const sanitized = sanitizeLoadedData(d);
        folders = sanitized.folders.length ? sanitized.folders : [...getDefaultFolders()];
        zikirs = sanitized.zikirs.length ? sanitized.zikirs : [...DEFAULT_ZIKIRS];
        zikirs.forEach((z) => {
            const inferred = inferLibraryIdForZikir(z);
            if (inferred) z.libraryId = inferred;
        });
        history = sanitized.history || {};
        usageByDay = sanitized.usageByDay || {};
        usageAreasByDay = sanitized.usageAreasByDay || {};
        appSettings = sanitized.settings || appSettings;
        syncQuranSettingsForLocale(appSettings);
        reminderSettings = {
            enabled: false,
            time: '21:00',
            lastFiredYmd: null,
            ...(sanitized.reminders || {})
        };
        smartReminders = Array.isArray(sanitized.smartReminders) ? sanitized.smartReminders : [];
        entitlements = sanitized.entitlements || { premium: false };
        trash = sanitized.trash || { v: 1, entries: [] };
        quranAyahFavorites = sanitized.quranAyahFavorites || [];
        appMeta = sanitized.appMeta || { installedAt: null };
        lifetimeTotal = sanitized.lifetimeTotal || 0;
        lifetimeByZikir = sanitized.lifetimeByZikir || {};

        // Ordering (folders + zikirs)
        let touched = false;
        if (ensureInstalledAt()) touched = true;
        folders.forEach((f, idx) => {
            if (typeof f.order !== 'number') { f.order = idx; touched = true; }
        });
        const perFolderCounters = {};
        zikirs.forEach((z) => {
            if (typeof z.order === 'number') return;
            const key = z.folderId || '_';
            perFolderCounters[key] = (perFolderCounters[key] ?? 0) + 1;
            z.order = perFolderCounters[key];
            touched = true;
        });
        if (touched) saveData();

        // Migration for Esma folder (for existing users)
        if (!folders.find(f => f.id === 'f_esma')) {
            folders.push({ id: 'f_esma', name: 'Esma\'ül Hüsna' });
            ESMA_LIST.forEach((esma, index) => {
                zikirs.push({
                    id: 'z_e_' + index, folderId: 'f_esma',
                    name: esma.name, arabic: esma.arabic || '', target: esma.target, meaning: esma.meaning,
                    count: 0, lastClicked: 0
                });
            });
            saveData();
        } else {
            // Ensure all Esma items exist (if ESMA_LIST was expanded in later versions)
            let changed = false;
            ESMA_LIST.forEach((esma, index) => {
                const id = 'z_e_' + index;
                if (!zikirs.find(z => z.id === id)) {
                    zikirs.push({
                        id,
                        folderId: 'f_esma',
                        name: esma.name,
                        arabic: esma.arabic || '',
                        target: esma.target,
                        meaning: esma.meaning,
                        count: 0,
                        lastClicked: 0
                    });
                    changed = true;
                }
            });
            if (changed) saveData();
        }

        // Arapça metin yoksa Esma / varsayılan zikirlere doldur (eski kayıtlar)
        let arFix = false;
        zikirs.forEach((z) => {
            if (z.arabic && String(z.arabic).trim()) return;
            const m = /^z_e_(\d+)$/.exec(z.id);
            if (m) {
                const idx = parseInt(m[1], 10);
                if (ESMA_LIST[idx] && ESMA_LIST[idx].arabic) {
                    z.arabic = ESMA_LIST[idx].arabic;
                    arFix = true;
                }
            } else if (DEFAULT_ZIKIR_ARABIC_BY_ID[z.id]) {
                z.arabic = DEFAULT_ZIKIR_ARABIC_BY_ID[z.id];
                arFix = true;
            }
        });
        if (arFix) saveData();

        if (sanitizeHistory() || pruneHistory()) saveData();
    } else {
        folders = [...getDefaultFolders()];
        zikirs = [...DEFAULT_ZIKIRS];
        history = {};
        usageByDay = {};
        usageAreasByDay = {};
        trash = { v: 1, entries: [] };
        appSettings = createDefaultAppSettings();
        appMeta = { installedAt: getTodayString() };
        lifetimeTotal = 0;
        lifetimeByZikir = {};
    }

    applyPremiumPreviewEntitlement(_premiumPreviewFlags.mode, entitlements);
    syncSettingsUI();
}

function applyWeeklyReportPreviewSample() {
    if (!getRuntimeFlags().weeklyReportPreviewSample) return;
    const patch = buildWeeklyReportPreviewPatch(getTodayString());
    Object.keys(patch.history).forEach((day) => {
        history[day] = patch.history[day];
    });
    Object.keys(patch.usageByDay).forEach((day) => {
        usageByDay[day] = patch.usageByDay[day];
    });
    Object.keys(patch.usageAreasByDay).forEach((day) => {
        usageAreasByDay[day] = patch.usageAreasByDay[day];
    });
    appSettings.dailyZikirGoal = patch.settingsPatch.dailyZikirGoal;
    appSettings.weeklyReportEnabled = patch.settingsPatch.weeklyReportEnabled;
    entitlements.premium = patch.entitlementsPatch.premium;
    saveData();
    console.info('[weekly-report] Önizleme örnek verisi yüklendi (29 gün seri — usta alev).');
}
// Sayaç gibi sık tetiklenen işlemlerde diske yazmayı ertelemek için debounce.
// Tık anında sadece RAM'deki state güncellenir; yazma SAVE_DEBOUNCE_MS sonra olur.
const SAVE_DEBOUNCE_MS = 800;
let _saveTimer = null;

function scheduleSave() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        _saveTimer = null;
        saveData();
    }, SAVE_DEBOUNCE_MS);
}

// Bekleyen ertelenmiş yazmayı hemen diske işler (uygulama arka plana atılırken vb.).
function flushSave() {
    if (!_saveTimer) return;
    clearTimeout(_saveTimer);
    _saveTimer = null;
    saveData();
}

function saveData() {
    // Gerçek yazma olduğunda bekleyen ertelenmiş yazma gereksizdir.
    if (_saveTimer) {
        clearTimeout(_saveTimer);
        _saveTimer = null;
    }
    const payload = buildBackupPayload();
    try {
        localStorage.setItem('zikirmatik_data_v2', JSON.stringify(payload));
    } catch (e) {
        const isQuota =
            e &&
            (e.name === 'QuotaExceededError' ||
                e.code === 22 ||
                e.code === 1014);
        if (isQuota && (pruneHistory() || sanitizeHistory())) {
            try {
                localStorage.setItem('zikirmatik_data_v2', JSON.stringify(buildBackupPayload()));
            } catch (e2) {
                console.error('saveData: kota dolu, eski geçmiş budandıktan sonra da yazılamadı.', e2);
            }
        } else {
            console.error('saveData', e);
        }
    }
}

function buildBackupPayload() {
    persistSeasonalCountsFromZikirs(zikirs);
    return {
        folders: folders.filter((f) => !isSeasonalFolderId(f.id)),
        zikirs: zikirs.filter((z) => !isSeasonalZikirId(z.id)),
        history,
        usageByDay,
        usageAreasByDay,
        settings: appSettings,
        reminders: reminderSettings,
        smartReminders,
        entitlements,
        trash,
        quranAyahFavorites,
        appMeta,
        lifetimeTotal,
        lifetimeByZikir
    };
}

function ensureInstalledAt() {
    if (!appMeta || typeof appMeta !== 'object') appMeta = { installedAt: null };
    if (appMeta.installedAt && /^\d{4}-\d{2}-\d{2}$/.test(appMeta.installedAt)) return false;
    appMeta.installedAt = getTodayString();
    return true;
}

function daysSinceInstalled() {
    const installed = appMeta && appMeta.installedAt;
    if (!installed || !/^\d{4}-\d{2}-\d{2}$/.test(installed)) return 1;
    const start = new Date(`${installed}T12:00:00`);
    const end = new Date(`${getTodayString()}T12:00:00`);
    const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(1, diff);
}

function formatStatsDateKey(ymd) {
    const d = new Date(`${ymd}T12:00:00`);
    return d.toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'long', year: 'numeric' });
}

function bumpLifetimeClick(zId) {
    lifetimeTotal = (lifetimeTotal || 0) + 1;
    if (!lifetimeByZikir || typeof lifetimeByZikir !== 'object') lifetimeByZikir = {};
    lifetimeByZikir[zId] = (lifetimeByZikir[zId] || 0) + 1;
}

function bumpLifetimeDecrement(zId) {
    if (!lifetimeByZikir || !lifetimeByZikir[zId]) return;
    lifetimeByZikir[zId]--;
    if (lifetimeByZikir[zId] <= 0) delete lifetimeByZikir[zId];
    lifetimeTotal = Math.max(0, (lifetimeTotal || 0) - 1);
}

function resolveLifetimeZikirLabel(zid) {
    if (zid === '__other__') return t('stats.allTimeOther');
    const z = zikirs.find((x) => x.id === zid);
    if (z) return getZikirDisplayName(z);
    return t('stats.unknown');
}

function getAllTimeRenderContext() {
    return {
        total: lifetimeTotal || 0,
        byZikir: lifetimeByZikir || {},
        installedAt: appMeta && appMeta.installedAt,
        days: daysSinceInstalled()
    };
}

function buildLifetimeSlices(byZikirSource) {
    const entries = Object.entries(byZikirSource || lifetimeByZikir || {})
        .filter(([, n]) => (Number(n) || 0) > 0)
        .sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 9);
    const rest = entries.slice(9);
    const otherSum = rest.reduce((sum, [, n]) => sum + (Number(n) || 0), 0);
    const slices = top.map(([zid, count], idx) => ({
        zid,
        count: Number(count) || 0,
        label: resolveLifetimeZikirLabel(zid),
        color: ALL_TIME_SLICE_COLORS[idx % ALL_TIME_SLICE_COLORS.length]
    }));
    if (otherSum > 0) {
        slices.push({
            zid: '__other__',
            count: otherSum,
            label: t('stats.allTimeOther'),
            color: ALL_TIME_SLICE_COLORS[9]
        });
    }
    return slices;
}

function polarToXY(cx, cy, r, angleRad) {
    return {
        x: cx + r * Math.cos(angleRad),
        y: cy + r * Math.sin(angleRad)
    };
}

function donutSlicePath(cx, cy, rOuter, rInner, startAngle, endAngle) {
    let sweep = endAngle - startAngle;
    if (sweep >= 2 * Math.PI - 1e-6) sweep = 2 * Math.PI - 1e-6;
    const end = startAngle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const p1 = polarToXY(cx, cy, rOuter, startAngle);
    const p2 = polarToXY(cx, cy, rOuter, end);
    const p3 = polarToXY(cx, cy, rInner, end);
    const p4 = polarToXY(cx, cy, rInner, startAngle);
    return [
        `M ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`,
        `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`,
        `L ${p3.x.toFixed(3)} ${p3.y.toFixed(3)}`,
        `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x.toFixed(3)} ${p4.y.toFixed(3)}`,
        'Z'
    ].join(' ');
}

function isPremium() {
    if (getRuntimeFlags().premiumDevUnlock) return true;
    return !!(entitlements && entitlements.premium);
}

/** Premium satışı aktifken ücretsiz kullanıcıya kilitli özellikler (çöp, aylık/yıllık istatistik). */
function isPremiumOnlyFeatureLocked() {
    if (!PREMIUM_LIVE) return false;
    return !isPremium();
}

function isCounterBackgroundLocked() {
    if (getRuntimeFlags().counterBgPreviewUnlock) return false;
    return isPremiumOnlyFeatureLocked();
}

function isPremiumStatTab(tab) {
    return PREMIUM_STAT_TABS.has(tab);
}

function ensureUnlockedStatTab(tab) {
    if (tab === 'allTime' && !PREMIUM_LIVE) return 'daily';
    if (isPremiumOnlyFeatureLocked() && isPremiumStatTab(tab)) return 'daily';
    return tab;
}

function closeAllPremiumLockHints() {
    document.querySelectorAll('.premium-lock-hint').forEach((h) => {
        h.hidden = true;
    });
}

function togglePremiumLockHint(starEl) {
    const hint = starEl && starEl.querySelector('.premium-lock-hint');
    if (!hint) return;
    const willOpen = hint.hidden;
    closeAllPremiumLockHints();
    hint.hidden = !willOpen;
}

function ensurePremiumLockStar(hostEl) {
    if (!hostEl) return null;
    let star = hostEl.querySelector(':scope > .premium-lock-star');
    if (!star) {
        hostEl.classList.add('premium-lock-host');
        star = document.createElement('button');
        star.type = 'button';
        star.className = 'premium-lock-star';
        star.setAttribute('aria-label', t('premium.exclusiveAria'));
        star.innerHTML =
            '<span class="premium-lock-star__glyph" aria-hidden="true">*</span>' +
            '<span class="premium-lock-hint" hidden></span>';
        const hint = star.querySelector('.premium-lock-hint');
        if (hint) hint.textContent = t('premium.exclusiveLabel');
        star.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePremiumLockHint(star);
        });
        hostEl.appendChild(star);
    } else {
        const hint = star.querySelector('.premium-lock-hint');
        if (hint) hint.textContent = t('premium.exclusiveLabel');
        star.setAttribute('aria-label', t('premium.exclusiveAria'));
    }
    return star;
}

function syncPremiumLockStar(hostEl, locked) {
    if (!hostEl) return;
    hostEl.classList.toggle('is-premium-locked', locked);
    if (locked) {
        ensurePremiumLockStar(hostEl);
        return;
    }
    hostEl.querySelector(':scope > .premium-lock-star')?.remove();
    hostEl.classList.remove('premium-lock-host');
    closeAllPremiumLockHints();
}

function syncTrashButtonUI() {
    const btn = document.getElementById('openTrashBtn');
    if (!btn) return;
    if (!PREMIUM_UI_VISIBLE) {
        btn.hidden = true;
        btn.classList.add('hidden');
        return;
    }
    btn.hidden = false;
    btn.classList.remove('hidden');
    const locked = isPremiumOnlyFeatureLocked();
    btn.classList.toggle('is-locked', locked);
    btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
    btn.title = locked ? t('premium.trashBtnLocked') : t('premium.trashBtn');
    btn.setAttribute('aria-label', btn.title);
    syncPremiumLockStar(btn, locked);
}

function syncPremiumStatTabsUI() {
    const locked = isPremiumOnlyFeatureLocked();
    const syncBtn = (btn, tabAttr) => {
        if (!btn) return;
        const tab = btn.getAttribute(tabAttr) || '';
        // "Tüm zamanlar" premium lansmanında kilitli satılacak; lansman öncesi
        // sürümde ücretsiz verip sonra geri almamak için sekme hiç gösterilmez.
        if (tab === 'allTime') {
            const hideAllTime = !PREMIUM_LIVE;
            btn.hidden = hideAllTime;
            btn.classList.toggle('hidden', hideAllTime);
            if (hideAllTime) return;
        }
        const tabLocked = locked && isPremiumStatTab(tab);
        btn.classList.toggle('is-premium-locked', tabLocked);
        btn.setAttribute('aria-disabled', tabLocked ? 'true' : 'false');
        syncPremiumLockStar(btn, tabLocked);
    };
    statTabBtns.forEach((btn) => syncBtn(btn, 'data-tab'));
    zikirStatTabBtns.forEach((btn) => syncBtn(btn, 'data-zikir-stat-tab'));
}

function syncPremiumHubUI() {
    if (!PREMIUM_LIVE) return;
    const locked = isPremiumOnlyFeatureLocked();
    const lockedPanel = document.getElementById('premiumHubLockedPanel');
    const managePanel = document.getElementById('premiumHubManagePanel');
    if (lockedPanel) lockedPanel.classList.toggle('hidden', !locked);
    if (managePanel) {
        managePanel.classList.toggle('hidden', locked);
        managePanel.hidden = locked;
    }

    const pillText = document.getElementById('premiumStatusPillText');
    if (pillText) pillText.textContent = locked ? t('premium.statusUpgrade') : t('premium.statusActive');

    const subscribeBtn = document.getElementById('premiumHubSubscribeBtn');
    if (subscribeBtn) subscribeBtn.classList.toggle('hidden', !locked);

    const premiumViewTitle = document.getElementById('premiumViewTitle');
    if (premiumViewTitle) premiumViewTitle.textContent = locked ? t('premium.title') : t('premium.manageTitle');
}

function openPremiumHubFeature(featureId) {
    if (!PREMIUM_LIVE) return;
    const def = PREMIUM_HUB_FEATURES[featureId];
    if (!def) return;
    const isEditorView = def.viewId && PREMIUM_FEATURE_VIEW_IDS.has(def.viewId);
    if (def.locked && isPremiumOnlyFeatureLocked() && !isEditorView) {
        showPremiumFeatureUpsell();
        return;
    }
    if (def.overlayId) {
        if (def.locked && isPremiumOnlyFeatureLocked()) {
            showPremiumFeatureUpsell();
            return;
        }
        openOverlay(def.overlayId, { onOpen: renderTrashOverlay });
        return;
    }
    showView(def.viewId);
}

/** Play Console / uygulama içi tam gizlilik politikası (GitHub Pages org). */
const PRIVACY_POLICY_BASE_URL = 'https://zikirmatikapp.github.io/gizlilik';

function getPrivacyPolicyUrl() {
    const loc = typeof getLocale === 'function' ? getLocale() : 'tr';
    return loc === 'tr' ? `${PRIVACY_POLICY_BASE_URL}/` : `${PRIVACY_POLICY_BASE_URL}/en.html`;
}

function isAllowedPrivacyPolicyUrl(url) {
    try {
        const u = new URL(String(url || ''));
        if (u.protocol !== 'https:') return false;
        // Org Pages: https://ORG.github.io/gizlilik/  — hostname kişisel kullanıcı adı olmayabilir
        if (!u.hostname.endsWith('.github.io')) return false;
        return u.pathname.startsWith('/gizlilik');
    } catch {
        return false;
    }
}

function openPrivacyPolicyPage() {
    const url = getPrivacyPolicyUrl();
    if (!isAllowedPrivacyPolicyUrl(url)) return;
    if (isCapacitorNative()) {
        window.open(url, '_system');
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
}

function syncPrivacyViewUI() {
    const billingCard = document.getElementById('privacyBillingCard');
    if (billingCard) {
        const showBilling = !!PREMIUM_LIVE;
        billingCard.hidden = !showBilling;
        billingCard.classList.toggle('hidden', !showBilling);
    }
}

function syncPremiumNavUI() {
    const premiumNavBtn = document.querySelector('.bottom-nav__btn--premium');
    if (premiumNavBtn) {
        premiumNavBtn.hidden = !PREMIUM_UI_VISIBLE;
        premiumNavBtn.classList.toggle('hidden', !PREMIUM_UI_VISIBLE);
    }
}

function syncPremiumLockedControls() {
    syncPremiumNavUI();
    syncTrashButtonUI();
    syncPrivacyViewUI();
    syncPremiumStatTabsUI();
    syncPremiumHubUI();
    syncTickSoundUI();
    syncCounterBackgroundEditorUI();
    ensureWeeklyReportSchedule().catch(console.error);
}

function deepClone(obj) {
    try {
        if (typeof structuredClone === 'function') return structuredClone(obj);
    } catch {
        // ignore
    }
    return JSON.parse(JSON.stringify(obj));
}

function formatRelativeTime(ts) {
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'az önce';
    if (min < 60) return `${min} dk önce`;
    const h = Math.floor(min / 60);
    if (h < 48) return `${h} sa önce`;
    const d = Math.floor(h / 24);
    return `${d} gün önce`;
}

function ensureRestoredFolder() {
    const id = 'f_restored';
    let f = folders.find((x) => x.id === id);
    if (!f) {
        const maxOrder = folders.reduce((m, ff) => Math.max(m, typeof ff.order === 'number' ? ff.order : -1), -1);
        f = { id, name: 'Geri Yüklenenler', order: maxOrder + 1 };
        folders.push(f);
    }
    return id;
}

function capTrashEntries() {
    if (!trash || !Array.isArray(trash.entries)) return;
    const MAX_TRASH = 500;
    if (trash.entries.length > MAX_TRASH) trash.entries.length = MAX_TRASH;
}

function restoreTrashEntry(index) {
    const e = trash && Array.isArray(trash.entries) ? trash.entries[index] : null;
    if (!e) return false;

    if (e.kind === 'zikir' && e.zikir) {
        const z = deepClone(e.zikir);
        if (zikirs.find((x) => x.id === z.id)) z.id = mintId('z');
        const targetFolder = (z.folderId && folders.find((f) => f.id === z.folderId)) ? z.folderId : ensureRestoredFolder();
        z.folderId = targetFolder;
        // Put at end of folder order.
        const maxOrder = zikirs
            .filter((x) => x.folderId === targetFolder)
            .reduce((m, x) => Math.max(m, typeof x.order === 'number' ? x.order : -1), -1);
        z.order = maxOrder + 1;
        zikirs.push(z);
        trash.entries.splice(index, 1);
        saveData();
        return true;
    }

    if (e.kind === 'folder' && e.folder && Array.isArray(e.zikirs)) {
        const f = deepClone(e.folder);
        if (folders.find((x) => x.id === f.id)) f.id = mintId('f');
        // Ensure order at end.
        const maxOrder = folders.reduce((m, ff) => Math.max(m, typeof ff.order === 'number' ? ff.order : -1), -1);
        f.order = maxOrder + 1;
        folders.push(f);

        const existingZIds = new Set(zikirs.map((x) => x.id));
        let maxZOrder = zikirs
            .filter((x) => x.folderId === f.id)
            .reduce((m, x) => Math.max(m, typeof x.order === 'number' ? x.order : -1), -1);
        e.zikirs.forEach((orig) => {
            const z = deepClone(orig);
            z.folderId = f.id;
            if (existingZIds.has(z.id)) z.id = mintId('z');
            maxZOrder += 1;
            z.order = maxZOrder;
            zikirs.push(z);
        });

        trash.entries.splice(index, 1);
        saveData();
        return true;
    }

    return false;
}

function deleteTrashEntry(index) {
    const e = trash && Array.isArray(trash.entries) ? trash.entries[index] : null;
    if (!e) return false;
    // Now it's a permanent delete: remove history for the affected zikir ids.
    const zIds = new Set();
    if (e.kind === 'zikir' && e.zikir && e.zikir.id) zIds.add(e.zikir.id);
    if (e.kind === 'folder' && Array.isArray(e.zikirs)) {
        e.zikirs.forEach((z) => {
            if (z && z.id) zIds.add(z.id);
        });
    }
    if (zIds.size) removeHistoryForZikirIds(zIds);
    trash.entries.splice(index, 1);
    saveData();
    return true;
}

async function clearTrashAll() {
    const n = trash && Array.isArray(trash.entries) ? trash.entries.length : 0;
    if (n === 0) return;
    if (!(await showAppConfirm('Çöp kutusundaki her şey kalıcı olarak silinsin mi? Bu işlem geri alınamaz.', { title: 'Çöp kutusunu boşalt', confirmLabel: 'Boşalt' }))) {
        return;
    }
    const zIds = new Set();
    trash.entries.forEach((e) => {
        if (e.kind === 'zikir' && e.zikir && e.zikir.id) zIds.add(e.zikir.id);
        if (e.kind === 'folder' && Array.isArray(e.zikirs)) e.zikirs.forEach((z) => z && z.id && zIds.add(z.id));
    });
    if (zIds.size) removeHistoryForZikirIds(zIds);
    trash.entries = [];
    saveData();
}

function renderPremiumTrash() {
    // Backwards-compat (old ids): no-op if elements removed from DOM.
    const list = document.getElementById('premiumTrashList');
    const empty = document.getElementById('premiumTrashEmpty');
    const clearBtn = document.getElementById('premiumTrashClearBtn');
    if (!list || !empty) return;
    const entries = trash && Array.isArray(trash.entries) ? trash.entries : [];
    list.innerHTML = '';
    empty.hidden = entries.length !== 0;
    if (clearBtn) clearBtn.disabled = entries.length === 0;

    entries.slice(0, 60).forEach((e, i) => {
        const title =
            e.kind === 'zikir' ? (e.zikir ? getZikirDisplayName(e.zikir) || 'Zikir' : 'Zikir') :
            e.kind === 'folder' ? (e.folder && e.folder.name ? e.folder.name : 'Klasör') :
            'Öğe';
        const sub =
            e.kind === 'zikir'
                ? `Zikir • ${formatRelativeTime(e.deletedAt)}`
                : `Klasör (${Array.isArray(e.zikirs) ? e.zikirs.length : 0} zikir) • ${formatRelativeTime(e.deletedAt)}`;

        const row = document.createElement('div');
        row.className = 'premium-trash-item';
        row.innerHTML = `
            <div class="premium-trash-item__main">
                <div class="premium-trash-item__title">${escapeHtml(title)}</div>
                <div class="premium-trash-item__meta">${escapeHtml(sub)}</div>
            </div>
            <div class="premium-trash-item__actions">
                <button type="button" class="premium-mini-btn premium-mini-btn--restore" data-trash-action="restore" data-trash-index="${i}">
                    <span class="material-icons-outlined">restore</span>
                    Geri al
                </button>
                <button type="button" class="premium-mini-btn premium-mini-btn--delete" data-trash-action="delete" data-trash-index="${i}">
                    <span class="material-icons-outlined">delete_forever</span>
                    Sil
                </button>
            </div>
        `;
        list.appendChild(row);
    });
}

function renderTrashOverlay() {
    const list = document.getElementById('trashList');
    const empty = document.getElementById('trashEmpty');
    const clearBtn = document.getElementById('trashClearBtn');
    const clearActions = document.getElementById('trashClearActions');
    if (!list || !empty) return;
    const entries = trash && Array.isArray(trash.entries) ? trash.entries : [];
    list.innerHTML = '';
    empty.hidden = entries.length !== 0;
    const hasEntries = entries.length > 0;
    if (clearActions) clearActions.hidden = !hasEntries;
    if (clearBtn) {
        clearBtn.hidden = !hasEntries;
        clearBtn.disabled = !hasEntries;
    }

    entries.slice(0, 80).forEach((e, i) => {
        const title =
            e.kind === 'zikir' ? (e.zikir ? getZikirDisplayName(e.zikir) || 'Zikir' : 'Zikir') :
            e.kind === 'folder' ? (e.folder && e.folder.name ? e.folder.name : 'Klasör') :
            'Öğe';
        const sub =
            e.kind === 'zikir'
                ? `Zikir • ${formatRelativeTime(e.deletedAt)}`
                : `Klasör (${Array.isArray(e.zikirs) ? e.zikirs.length : 0} zikir) • ${formatRelativeTime(e.deletedAt)}`;

        const row = document.createElement('div');
        row.className = 'premium-trash-item';
        row.innerHTML = `
            <div class="premium-trash-item__main">
                <div class="premium-trash-item__title">${escapeHtml(title)}</div>
                <div class="premium-trash-item__meta">${escapeHtml(sub)}</div>
            </div>
            <div class="premium-trash-item__actions">
                <button type="button" class="premium-mini-btn premium-mini-btn--restore" data-trash-action="restore" data-trash-index="${i}">
                    <span class="material-icons-outlined">restore</span>
                    Geri al
                </button>
                <button type="button" class="premium-mini-btn premium-mini-btn--delete" data-trash-action="delete" data-trash-index="${i}">
                    <span class="material-icons-outlined">delete_forever</span>
                    Sil
                </button>
            </div>
        `;
        list.appendChild(row);
    });
}

function maybeRequestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
    }
}

function openAppFromReminderNotification(extra) {
    if (extra && extra.openApp === false) return;
    closeAllOverlays();
    if (extra && extra.view === 'premiumFeatureWeeklyView') {
        showView('premiumFeatureWeeklyView', null, { push: false });
        return;
    }
    const view = extra && extra.view === 'counterView' && extra.zikirId ? 'counterView' : 'homeView';
    const param = view === 'counterView' ? extra.zikirId : null;
    if (view === 'counterView' && param && !zikirs.some((z) => z.id === param)) {
        showView('homeView', null, { push: false });
        return;
    }
    showView(view, param, { push: false });
}

function reminderNotificationPayload() {
    const base = new URL('assets/icons/icon-192.webp', document.baseURI).href;
    const locale = getLocale();
    const quote = getReminderQuoteNotificationPayload(locale);
    return {
        title: '',
        options: {
            body: quote.body,
            icon: base,
            badge: base,
            tag: 'zikir-gunluk-hatir',
            renotify: false,
            lang: getLocaleTag(),
            data: { url: './', openApp: true, view: 'homeView' }
        }
    };
}

/** Mobil/PWA: service worker bildirimi genelde sayfadaki new Notification’dan daha güvenilir */
function showDailyReminderNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const { title, options } = reminderNotificationPayload();
    const markFired = () => {
        reminderSettings.lastFiredYmd = getTodayString();
        saveData();
    };
    const fallback = () => {
        try {
            new Notification(title, options);
            markFired();
        } catch (e) {
            console.error('Zikirmatik: bildirim gösterilemedi', e);
        }
    };
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((reg) => {
                if (reg && typeof reg.showNotification === 'function') {
                    const ret = reg.showNotification(title, options);
                    if (ret && typeof ret.then === 'function') {
                        return ret.then(() => markFired()).catch(fallback);
                    }
                    markFired();
                    return;
                }
                fallback();
            })
            .catch(fallback);
    } else {
        fallback();
    }
}

/** Uygulama kapalıyken zamanlayıcı çalışmaz; hatır saatinden sonra açılırsa bir kez telafi */
function maybeCatchUpMissedReminder() {
    if (!('Notification' in window)) return;
    if (!reminderSettings.enabled) return;
    if (Notification.permission !== 'granted') return;
    const today = getTodayString();
    if (reminderSettings.lastFiredYmd === today) return;
    const [hh, mm] = String(reminderSettings.time || '21:00').split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(hh, mm, 0, 0);
    if (now.getTime() <= deadline.getTime()) return;
    showDailyReminderNotification();
}

let reminderTimeoutId = null;

function clearInAppReminderTick() {
    if (reminderTimeoutId != null) {
        clearTimeout(reminderTimeoutId);
        reminderTimeoutId = null;
    }
}

function scheduleInAppReminderTick() {
    /* Tam saatinde yalnızca sekme/PWA açıkken tetiklenir; arka planda OS genelde zamanlayıcıyı durdurur. */
    clearInAppReminderTick();
    if (!('Notification' in window)) return;
    if (!reminderSettings.enabled) return;
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const [hh, mm] = String(reminderSettings.time || '21:00').split(':').map((x) => parseInt(x, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const ms = Math.min(target.getTime() - now.getTime(), 2147483647); // setTimeout limit
    reminderTimeoutId = setTimeout(() => {
        reminderTimeoutId = null;
        if (reminderSettings.lastFiredYmd === getTodayString()) {
            scheduleInAppReminderTick();
            return;
        }
        showDailyReminderNotification();
        scheduleInAppReminderTick();
    }, ms);
}

async function ensureReminderSchedule() {
    if (isCapacitorNative()) {
        clearInAppReminderTick();
        const r = await syncNativeDailyReminder(reminderSettings.enabled, reminderSettings.time, getLocale());
        if (reminderSettings.enabled && !r.ok && r.reason === 'denied') {
            await showAppAlert(t('reminderDialog.notificationPermDeniedNative'), {
                title: t('reminderDialog.notificationPermTitle')
            });
        } else if (reminderSettings.enabled && !r.ok && r.reason === 'schedule') {
            await showAppAlert(t('reminderDialog.scheduleFailedBody'), {
                title: t('reminderDialog.scheduleFailedTitle')
            });
        }
        return;
    }
    if (!reminderSettings.enabled) {
        clearInAppReminderTick();
        return;
    }
    maybeCatchUpMissedReminder();
    scheduleInAppReminderTick();
}

function onAppBecameVisibleForReminders() {
    if (document.visibilityState !== 'visible') return;
    if (reminderSettings.enabled) {
        ensureReminderSchedule().catch(console.error);
    }
    ensureSmartReminderSchedule().catch(console.error);
    ensureWeeklyReportSchedule().catch(console.error);
}

function onPageShowForReminders() {
    if (reminderSettings.enabled) {
        ensureReminderSchedule().catch(console.error);
    }
    ensureSmartReminderSchedule().catch(console.error);
    ensureWeeklyReportSchedule().catch(console.error);
}

function initUsageTracker() {
    usageTracker = createUsageTracker({
        getTodayKey: getTodayString,
        getContext: resolveUsageAreaFromAppState,
        onFlush: (dayKey, deltaSec, areaId) => {
            if (!deltaSec) return;
            usageByDay[dayKey] = (usageByDay[dayKey] || 0) + deltaSec;
            if (!usageAreasByDay[dayKey]) usageAreasByDay[dayKey] = Object.create(null);
            const area = areaId || USAGE_AREA_OTHER;
            usageAreasByDay[dayKey][area] = (usageAreasByDay[dayKey][area] || 0) + deltaSec;
            scheduleSave();
        }
    });
    if (document.visibilityState === 'visible') usageTracker.resume();
}

const USAGE_PREMIUM_VIEWS = new Set([
    'premiumView',
    'premiumPurchaseView',
    'premiumFeatureThemeView',
    'premiumFeatureCounterCustomizeView',
    'premiumFeatureCounterBackgroundView',
    'premiumFeatureRemindersView',
    'premiumFeatureWeeklyView',
    'statsView'
]);

function resolveUsageAreaFromAppState() {
    const viewId = currentViewId || 'homeView';
    if (viewId === 'homeView') return USAGE_AREA_HOME;
    if (viewId === 'folderDetailView' && currentFolderId) return folderUsageAreaId(currentFolderId);
    if (viewId === 'counterView' || viewId === 'stealthView') {
        const zid = currentZikirId;
        const z = zid ? zikirs.find((x) => x.id === zid) : null;
        return z ? folderUsageAreaId(z.folderId) : USAGE_AREA_HOME;
    }
    if (viewId === 'libraryView') {
        return activeLibraryCat === 'zikir' ? USAGE_AREA_LIB_ZIKIR : USAGE_AREA_LIB_DUA;
    }
    if (viewId === 'quranView' || viewId === 'quranSurahView') return USAGE_AREA_QURAN;
    if (USAGE_PREMIUM_VIEWS.has(viewId)) return USAGE_AREA_PREMIUM;
    if (viewId === 'settingsView' || viewId === 'privacyView') return USAGE_AREA_SETTINGS;
    return USAGE_AREA_OTHER;
}

function getUsageAreaDisplayName(areaId) {
    if (isFolderUsageArea(areaId)) {
        const folderId = folderIdFromUsageArea(areaId);
        const folder = folders.find((f) => f.id === folderId);
        if (folder) return folder.name;
        if (folderId === 'f_esma') return t('defaults.folderEsma');
        if (folderId === 'f_default') return t('defaults.folderDefault');
        return folderId || '—';
    }
    if (areaId === USAGE_AREA_LIB_DUA) return t('library.tabDua');
    if (areaId === USAGE_AREA_LIB_ZIKIR) return t('library.tabZikir');
    if (areaId === USAGE_AREA_QURAN) return t('quran.title');
    if (areaId === USAGE_AREA_HOME) return t('weeklyReport.areaHome');
    return areaId;
}

function weeklyReportFeatureUnlocked() {
    return PREMIUM_LIVE && !isPremiumOnlyFeatureLocked();
}

function weeklyReportActiveForUser() {
    return weeklyReportFeatureUnlocked() && appSettings.weeklyReportEnabled !== false;
}

function getWeeklyReportDurationUnits() {
    const loc = getLocale();
    if (loc === 'tr') return { hourUnit: 'sa', minuteUnit: 'dk' };
    if (loc === 'fr') return { hourUnit: 'h', minuteUnit: 'min' };
    return { hourUnit: 'h', minuteUnit: 'm' };
}

function formatWeekRangeLabel(startKey, endKey) {
    const s = parseDateKey(startKey);
    const e = parseDateKey(endKey);
    const opts = { day: 'numeric', month: 'short' };
    const tag = getLocaleTag();
    return `${s.toLocaleDateString(tag, opts)} – ${e.toLocaleDateString(tag, opts)}`;
}

function getWeekdayShortLabel(dayKey) {
    const dow = parseDateKey(dayKey).getDay();
    return t(`smartReminders.weekdayShort${dow}`);
}

function buildWeeklyReportTrendText(delta) {
    if (delta.direction === 'up') return t('weeklyReport.trendUp', { percent: delta.percent });
    if (delta.direction === 'down') return t('weeklyReport.trendDown', { percent: delta.percent });
    return t('weeklyReport.trendSame');
}

function buildWeeklyReportNotificationBody() {
    const nextMon = getNextMondayAt();
    const reportWeek = getReportWeekForMonday(nextMon);
    const prevMon = new Date(nextMon);
    prevMon.setDate(prevMon.getDate() - 7);
    const prevWeek = getReportWeekForMonday(prevMon);
    const goal = normalizeDailyZikirGoal(appSettings.dailyZikirGoal);
    const report = buildWeekReport(history, usageByDay, reportWeek.dayKeys, goal, getTodayString());
    const prevUsage = computeWeekUsageStats(usageByDay, prevWeek.dayKeys);
    const delta = percentChange(report.usage.avgSecondsPerDay, prevUsage.avgSecondsPerDay);
    const trend = buildWeeklyReportTrendText(delta);
    let goalPart = '';
    if (goal > 0) {
        goalPart = t('weeklyReport.notifyGoalPart', {
            flame: report.flame.emoji,
            hit: report.goalDays.hit,
            total: report.goalDays.total
        });
    }
    return t('weeklyReport.notifyBody', {
        avg: report.usage.avgMinutesPerDay,
        trend,
        goal: goalPart
    }).replace(/\s+/g, ' ').trim();
}

async function ensureWeeklyReportSchedule() {
    if (!weeklyReportActiveForUser()) {
        if (isCapacitorNative()) await syncNativeWeeklyReport({ enabled: false });
        return;
    }
    if (!isCapacitorNative()) {
        maybeRequestNotificationPermission();
        return;
    }
    const at = getNextMondayAt();
    const body = buildWeeklyReportNotificationBody();
    const r = await syncNativeWeeklyReport({
        enabled: true,
        at,
        title: t('weeklyReport.notifyTitle'),
        body,
        extra: { openApp: true, view: 'premiumFeatureWeeklyView' }
    });
    if (!r.ok && r.reason === 'denied') {
        await showAppAlert(t('weeklyReport.permDenied'), { title: t('reminderDialog.notificationPermTitle') });
    }
}

function syncWeeklyReportEditorControls() {
    const toggle = document.getElementById('weeklyReportEnabledToggle');
    const goalInput = document.getElementById('dailyZikirGoalInput');
    const note = document.getElementById('weeklyReportPremiumNote');
    const unlocked = weeklyReportFeatureUnlocked();
    if (toggle) {
        toggle.checked = appSettings.weeklyReportEnabled !== false;
        toggle.disabled = !unlocked;
    }
    if (goalInput) {
        goalInput.value = String(normalizeDailyZikirGoal(appSettings.dailyZikirGoal));
        goalInput.disabled = !unlocked;
    }
    if (note) {
        const show = PREMIUM_LIVE && isPremiumOnlyFeatureLocked();
        note.hidden = !show;
        note.classList.toggle('hidden', !show);
        if (show) note.textContent = t('weeklyReport.premiumNote');
    }
}

function renderWeeklyReportTopAreas(todayKey, units) {
    const list = document.getElementById('weeklyReportTopAreas');
    if (!list) return;
    const top = getTopUsageAreasForDay(usageAreasByDay, todayKey, 3);
    if (!top.length) {
        list.innerHTML = `<li class="wr-top-area wr-top-area--empty">${escapeHtml(t('weeklyReport.noAreaUsage'))}</li>`;
        return;
    }
    list.innerHTML = top
        .map(
            (row) => `<li class="wr-top-area">
                <span class="wr-top-area__name">${escapeHtml(getUsageAreaDisplayName(row.areaId))}</span>
                <span class="wr-top-area__time">${escapeHtml(formatUsageDuration(row.seconds, units))}</span>
            </li>`
        )
        .join('');
}

function renderWeeklyReportChart(weekRange, units) {
    const chart = document.getElementById('weeklyReportChart');
    const metric = document.getElementById('weeklyReportChartMetric');
    if (!chart || !metric || !weekRange) return;

    const stats = computeWeekUsageStats(usageByDay, weekRange.dayKeys);
    const todayKey = getTodayString();

    if (weekRange.isCurrent) {
        metric.textContent = t('weeklyReport.dailyAvgMetric', {
            value: formatUsageDuration(stats.avgSecondsPerDay, units)
        });
        const series = getDailyUsageSeries(usageByDay, weekRange.dayKeys);
        const maxSec = Math.max(...series.map((d) => d.seconds), 1);
        chart.classList.remove('wr-chart--past');
        chart.innerHTML = series
            .map((row) => {
                const h = Math.max(4, Math.round((row.seconds / maxSec) * 100));
                const val = row.seconds > 0 ? formatUsageDuration(row.seconds, units) : '';
                const isFuture = row.day > todayKey;
                const barStyle = isFuture ? 'opacity:0.22' : '';
                return `<div class="wr-chart-bar-wrap">
                    <span class="wr-chart-bar-value">${escapeHtml(val)}</span>
                    <div class="wr-chart-bar" style="height:${h}%;${barStyle}"></div>
                    <span class="wr-chart-bar-label">${escapeHtml(getWeekdayShortLabel(row.day))}</span>
                </div>`;
            })
            .join('');
        return;
    }

    metric.textContent = t('weeklyReport.weeklyAvgMetric', {
        value: formatUsageDuration(stats.avgSecondsPerDay, units)
    });
    chart.classList.add('wr-chart--past');
    chart.innerHTML = `<div class="wr-chart-past">
        <div class="wr-chart-past__value">${escapeHtml(formatUsageDuration(stats.totalSeconds, units))}</div>
        <div class="wr-chart-past__label">${escapeHtml(t('weeklyReport.weekTotalLabel'))}</div>
    </div>`;
}

function renderWeeklyReportView() {
    syncWeeklyReportEditorControls();
    const units = getWeeklyReportDurationUnits();
    const goal = normalizeDailyZikirGoal(appSettings.dailyZikirGoal);
    const todayKey = getTodayString();
    const weekRanges = getSelectableWeekRanges(4);
    if (weeklyReportWeekIndex < 0 || weeklyReportWeekIndex >= weekRanges.length) {
        weeklyReportWeekIndex = weekRanges.length - 1;
    }
    const selectedWeek = weekRanges[weeklyReportWeekIndex];

    const streak = computeGoalStreak(history, goal, todayKey);
    const flame = getFlameTier(streak);
    const streakTile = document.getElementById('weeklyReportStreakTile');
    const streakCount = document.getElementById('weeklyReportStreakCount');
    const flameEmoji = document.getElementById('weeklyReportFlameEmoji');
    const streakSub = document.getElementById('weeklyReportStreakSub');
    const flameTierClasses = FLAME_TIER_IDS.map((id) => `wr-tile--flame-${id}`);
    const flameColorClasses = FLAME_TIER_IDS.map((id) => `wr-tile__flame--${id}`);
    if (streakTile) {
        streakTile.classList.remove(...flameTierClasses);
        const activeTier = goal > 0 && streak > 0 ? flame.tier : 'none';
        streakTile.classList.add(`wr-tile--flame-${activeTier}`);
    }
    if (streakCount) streakCount.textContent = String(streak);
    if (flameEmoji) {
        flameEmoji.classList.remove(...flameColorClasses);
        const activeTier = goal > 0 && streak > 0 ? flame.tier : 'none';
        flameEmoji.classList.add(`wr-tile__flame--${activeTier}`);
    }
    if (streakSub) {
        streakSub.textContent = goal > 0 ? t('weeklyReport.streakDaysShort') : t('weeklyReport.goalOff');
    }

    const todayTime = document.getElementById('weeklyReportTodayTime');
    if (todayTime) {
        const sec = Number(usageByDay[todayKey]) || 0;
        todayTime.textContent = formatUsageDuration(sec, units);
    }
    renderWeeklyReportTopAreas(todayKey, units);

    const weekLabel = document.getElementById('weeklyReportWeekLabel');
    if (weekLabel && selectedWeek) {
        weekLabel.textContent = selectedWeek.isCurrent
            ? t('weeklyReport.thisWeek')
            : formatWeekRangeLabel(selectedWeek.startKey, selectedWeek.endKey);
    }

    const prevBtn = document.getElementById('weeklyReportWeekPrev');
    const nextBtn = document.getElementById('weeklyReportWeekNext');
    if (prevBtn) prevBtn.disabled = weeklyReportWeekIndex <= 0;
    if (nextBtn) nextBtn.disabled = weeklyReportWeekIndex >= weekRanges.length - 1;

    renderWeeklyReportChart(selectedWeek, units);

    const fourAvg = document.getElementById('weeklyReportFourWeekAvg');
    if (fourAvg) {
        const avgSec = computeFourWeekDailyAverage(usageByDay, weekRanges);
        fourAvg.innerHTML = t('weeklyReport.fourWeekAvg', {
            value: formatUsageDuration(avgSec, units)
        });
    }
}

let cloudBackupBusy = false;

function cloudBackupActiveForUser() {
    return PREMIUM_LIVE && !isPremiumOnlyFeatureLocked();
}

function setHiddenState(el, hidden) {
    if (!el) return;
    el.hidden = !!hidden;
    el.classList.toggle('hidden', !!hidden);
}

function getCloudBackupMetaFromApp() {
    return normalizeCloudBackupMeta(appMeta?.cloudBackup);
}

function patchCloudBackupMeta(patch) {
    if (!appMeta || typeof appMeta !== 'object') appMeta = { installedAt: null };
    const prev = getCloudBackupMetaFromApp();
    if (!prev && !patch?.uid) return;
    appMeta.cloudBackup = {
        uid: patch.uid ?? prev?.uid ?? '',
        email: patch.email ?? prev?.email ?? '',
        lastBackupAt: patch.lastBackupAt ?? prev?.lastBackupAt ?? 0,
        linkedAt: patch.linkedAt ?? prev?.linkedAt ?? 0
    };
    saveData();
}

function clearCloudBackupMeta() {
    if (!appMeta || typeof appMeta !== 'object') return;
    delete appMeta.cloudBackup;
    saveData();
}

function formatCloudBackupTimestamp(ms) {
    if (!ms || ms <= 0) return '';
    try {
        return new Date(ms).toLocaleString(getLocaleTag(), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
}

function setCloudBackupBusy(busy, statusText = '') {
    cloudBackupBusy = busy;
    const panel = document.getElementById('cloudBackupPanel');
    const statusEl = document.getElementById('cloudBackupStatus');
    if (panel) panel.classList.toggle('is-busy', busy);
    if (statusEl) {
        if (busy && statusText) {
            setHiddenState(statusEl, false);
            statusEl.textContent = statusText;
        } else {
            setHiddenState(statusEl, true);
            statusEl.textContent = '';
        }
    }
}

async function renderBackupView() {
    const unavailableNote = document.getElementById('cloudBackupUnavailableNote');
    const panel = document.getElementById('cloudBackupPanel');
    const disconnected = document.getElementById('cloudBackupDisconnected');
    const connected = document.getElementById('cloudBackupConnected');
    const emailEl = document.getElementById('cloudBackupEmail');
    const lastAtEl = document.getElementById('cloudBackupLastAt');

    const availability = await getCloudBackupAvailability();
    const canUse = cloudBackupActiveForUser() && availability === 'ready';

    if (unavailableNote) {
        const showUnavailable = cloudBackupActiveForUser() && availability !== 'ready';
        setHiddenState(unavailableNote, !showUnavailable);
        if (showUnavailable) {
            unavailableNote.textContent =
                availability === 'unsupported'
                    ? t('cloudBackup.unavailable')
                    : availability === 'needs_web_app'
                      ? t('cloudBackup.needsWebApp')
                      : t('cloudBackup.notConfigured');
        }
    }

    setHiddenState(panel, !canUse);
    if (!canUse) {
        if (panel) panel.classList.remove('premium-manage-account-box--connected');
        return;
    }

    const meta = getCloudBackupMetaFromApp();
    const isLinked = !!meta?.uid;

    setHiddenState(disconnected, isLinked);
    setHiddenState(connected, !isLinked);

    if (isLinked) {
        if (emailEl) emailEl.textContent = meta.email || meta.uid;
        if (lastAtEl) {
            const formatted = formatCloudBackupTimestamp(meta.lastBackupAt);
            lastAtEl.textContent = formatted || t('cloudBackup.neverBackedUp');
        }
    }

    if (panel) panel.classList.toggle('premium-manage-account-box--connected', isLinked);
}

function setupBackupUI() {
    const connectBtn = document.getElementById('cloudBackupConnectBtn');
    if (connectBtn && connectBtn.dataset.bound !== '1') {
        connectBtn.dataset.bound = '1';
        connectBtn.addEventListener('click', () => void handleCloudBackupConnect());
    }

    const backupBtn = document.getElementById('cloudBackupBackupNowBtn');
    if (backupBtn && backupBtn.dataset.bound !== '1') {
        backupBtn.dataset.bound = '1';
        backupBtn.addEventListener('click', () => void handleCloudBackupNow(true));
    }

    const restoreBtn = document.getElementById('cloudBackupRestoreBtn');
    if (restoreBtn && restoreBtn.dataset.bound !== '1') {
        restoreBtn.dataset.bound = '1';
        restoreBtn.addEventListener('click', () => void handleCloudBackupRestore());
    }

    const disconnectBtn = document.getElementById('cloudBackupDisconnectBtn');
    if (disconnectBtn && disconnectBtn.dataset.bound !== '1') {
        disconnectBtn.dataset.bound = '1';
        disconnectBtn.addEventListener('click', () => void handleCloudBackupDisconnect());
    }
}

async function handleCloudBackupConnect() {
    if (!cloudBackupActiveForUser()) {
        showPremiumFeatureUpsell();
        return;
    }
    if (cloudBackupBusy) return;
    if ((await getCloudBackupAvailability()) !== 'ready') {
        await showAppAlert(t('cloudBackup.notConfigured'));
        return;
    }

    setCloudBackupBusy(true, t('cloudBackup.signingIn'));
    try {
        const account = await signInWithGoogleForBackup();
        const now = Date.now();
        patchCloudBackupMeta({
            uid: account.uid,
            email: account.email,
            linkedAt: now,
            lastBackupAt: 0
        });
        setCloudBackupBusy(true, t('cloudBackup.backingUp'));
        const lastBackupAt = await uploadBackupPayload(account.uid, buildBackupPayload());
        patchCloudBackupMeta({ lastBackupAt });
        await showAppAlert(t('cloudBackup.connectSuccess'));
        await renderBackupView();
    } catch (e) {
        console.error('cloudBackup connect', e);
        await showAppAlert(t(resolveCloudBackupSignInErrorKey(e)));
    } finally {
        setCloudBackupBusy(false);
    }
}

async function handleCloudBackupNow(showSuccess = true) {
    if (!cloudBackupActiveForUser()) {
        showPremiumFeatureUpsell();
        return;
    }
    const meta = getCloudBackupMetaFromApp();
    if (!meta?.uid) return;
    if (cloudBackupBusy) return;

    setCloudBackupBusy(true, t('cloudBackup.backingUp'));
    try {
        const lastBackupAt = await uploadBackupPayload(meta.uid, buildBackupPayload());
        patchCloudBackupMeta({ lastBackupAt });
        await renderBackupView();
        if (showSuccess) await showAppAlert(t('cloudBackup.backupSuccess'));
    } catch (e) {
        console.error('cloudBackup upload', e);
        if (showSuccess) await showAppAlert(t('cloudBackup.errorBackup'));
    } finally {
        setCloudBackupBusy(false);
    }
}

async function handleCloudBackupRestore() {
    if (!cloudBackupActiveForUser()) {
        showPremiumFeatureUpsell();
        return;
    }
    const meta = getCloudBackupMetaFromApp();
    if (!meta?.uid) return;
    if (cloudBackupBusy) return;

    const ok = await showAppConfirm(t('cloudBackup.restoreConfirm'), { title: t('cloudBackup.restoreBtn') });
    if (!ok) return;

    setCloudBackupBusy(true, t('cloudBackup.restoring'));
    try {
        const remote = await downloadBackupPayload(meta.uid);
        if (!remote?.payload) {
            await showAppAlert(t('cloudBackup.errorNotFound'));
            return;
        }
        applySanitizedBackupToApp(sanitizeLoadedData(remote.payload));
        await showAppAlert(t('cloudBackup.restoreSuccess'));
        await renderBackupView();
    } catch (e) {
        console.error('cloudBackup restore', e);
        await showAppAlert(t('cloudBackup.errorRestore'));
    } finally {
        setCloudBackupBusy(false);
    }
}

async function handleCloudBackupDisconnect() {
    const meta = getCloudBackupMetaFromApp();
    if (!meta?.uid || cloudBackupBusy) return;

    const ok = await showAppConfirm(t('cloudBackup.disconnectConfirm'));
    if (!ok) return;

    setCloudBackupBusy(true);
    try {
        await signOutCloudBackup();
        clearCloudBackupMeta();
        await renderBackupView();
    } catch (e) {
        console.error('cloudBackup disconnect', e);
        clearCloudBackupMeta();
        await renderBackupView();
    } finally {
        setCloudBackupBusy(false);
    }
}

function applySanitizedBackupToApp(sanitized) {
    const localEntitlements = entitlements;
    const localCloudBackup = getCloudBackupMetaFromApp();

    folders = sanitized.folders.length ? sanitized.folders : [...getDefaultFolders()];
    zikirs = sanitized.zikirs.length ? sanitized.zikirs : [...DEFAULT_ZIKIRS];
    zikirs.forEach((z) => {
        const inferred = inferLibraryIdForZikir(z);
        if (inferred) z.libraryId = inferred;
    });
    history = sanitized.history || {};
    usageByDay = sanitized.usageByDay || {};
    usageAreasByDay = sanitized.usageAreasByDay || {};
    appSettings = sanitized.settings || appSettings;
    syncQuranSettingsForLocale(appSettings);
    reminderSettings = {
        enabled: false,
        time: '21:00',
        lastFiredYmd: null,
        ...(sanitized.reminders || {})
    };
    smartReminders = Array.isArray(sanitized.smartReminders) ? sanitized.smartReminders : [];
    trash = sanitized.trash || { v: 1, entries: [] };
    quranAyahFavorites = sanitized.quranAyahFavorites || [];
    appMeta = sanitized.appMeta || { installedAt: null };
    lifetimeTotal = sanitized.lifetimeTotal || 0;
    lifetimeByZikir = sanitized.lifetimeByZikir || {};
    entitlements = localEntitlements;
    if (localCloudBackup) patchCloudBackupMeta(localCloudBackup);

    saveData();
    syncSettingsUI();
    syncPremiumLockedControls();
    setDailyQuote();
    ensureReminderSchedule().catch(console.error);
    ensureSmartReminderSchedule().catch(console.error);
    ensureWeeklyReportSchedule().catch(console.error);

    const viewId = currentViewId || 'homeView';
    showView(viewId, null, { push: false });
}

async function maybeRunAutoCloudBackup() {
    if (!cloudBackupActiveForUser()) return;
    if ((await getCloudBackupAvailability()) !== 'ready') return;
    const meta = getCloudBackupMetaFromApp();
    if (!meta?.uid || cloudBackupBusy) return;

    try {
        await maybeUploadCloudBackup({
            getPayload: buildBackupPayload,
            cloudMeta: meta,
            force: false,
            onMetaPatch: (patch) => patchCloudBackupMeta(patch)
        });
    } catch (e) {
        console.warn('auto cloud backup failed', e);
    }
}

function setupWeeklyReportUI() {
    const toggle = document.getElementById('weeklyReportEnabledToggle');
    if (toggle && toggle.dataset.bound !== '1') {
        toggle.dataset.bound = '1';
        toggle.addEventListener('change', () => {
            if (!weeklyReportFeatureUnlocked()) {
                toggle.checked = appSettings.weeklyReportEnabled !== false;
                showPremiumFeatureUpsell();
                return;
            }
            appSettings.weeklyReportEnabled = !!toggle.checked;
            saveData();
            ensureWeeklyReportSchedule().catch(console.error);
        });
    }

    const goalInput = document.getElementById('dailyZikirGoalInput');
    if (goalInput && goalInput.dataset.bound !== '1') {
        goalInput.dataset.bound = '1';
        const commitGoal = () => {
            if (!weeklyReportFeatureUnlocked()) {
                goalInput.value = String(normalizeDailyZikirGoal(appSettings.dailyZikirGoal));
                showPremiumFeatureUpsell();
                return;
            }
            appSettings.dailyZikirGoal = normalizeDailyZikirGoal(goalInput.value);
            goalInput.value = String(appSettings.dailyZikirGoal);
            saveData();
            renderWeeklyReportView();
            ensureWeeklyReportSchedule().catch(console.error);
        };
        goalInput.addEventListener('change', commitGoal);
        goalInput.addEventListener('blur', commitGoal);
    }

    const prevBtn = document.getElementById('weeklyReportWeekPrev');
    if (prevBtn && prevBtn.dataset.bound !== '1') {
        prevBtn.dataset.bound = '1';
        prevBtn.addEventListener('click', () => {
            if (weeklyReportWeekIndex <= 0) return;
            weeklyReportWeekIndex -= 1;
            renderWeeklyReportView();
        });
    }

    const nextBtn = document.getElementById('weeklyReportWeekNext');
    if (nextBtn && nextBtn.dataset.bound !== '1') {
        nextBtn.dataset.bound = '1';
        nextBtn.addEventListener('click', () => {
            const ranges = getSelectableWeekRanges(4);
            if (weeklyReportWeekIndex >= ranges.length - 1) return;
            weeklyReportWeekIndex += 1;
            renderWeeklyReportView();
        });
    }
}

function smartRemindersActiveForUser() {
    return PREMIUM_LIVE && !isPremiumOnlyFeatureLocked();
}

const INTRO_SAMPLE_MSG_VERSION = 3;

function formatIntroSampleMealForLocale(text, locale) {
    let out = String(text || '').trim();
    if (!out) return out;
    if (normalizeAppLocale(locale) === 'tr') {
        out = out.replace(/sabah akşam an\b/gi, 'sabah akşam zikret');
    }
    return out;
}

function stripIntroSampleAyahRefSuffix(text) {
    return String(text || '')
        .trim()
        .replace(/\s*\([^)]*205[^)]*\)\s*$/u, '')
        .trim();
}

function getIntroSampleAyahRefLabel() {
    return t('smartReminders.sampleAyahRef');
}

function appendIntroSampleAyahRef(mealText, locale = getLocale()) {
    const meal = stripIntroSampleAyahRefSuffix(formatIntroSampleMealForLocale(mealText, locale));
    const ref = getIntroSampleAyahRefLabel();
    if (!meal) return ref;
    return `${meal} ${ref}`;
}

function readSmartReminderMessageValue(el) {
    if (!el) return '';
    return String(el.value ?? el.textContent ?? '').trim();
}

async function loadIntroSampleMealText() {
    const locale = getLocale();
    const mealId = normalizeQuranMeal(appSettings.quranMeal, locale);
    try {
        const surah = await fetchSurahAyahs(INTRO_SAMPLE_SURAH, mealId, locale);
        const ayah = (surah?.ayahs || []).find((a) => a.n === INTRO_SAMPLE_AYAH);
        const meal = formatIntroSampleMealForLocale(ayah?.tr, locale);
        if (meal) return appendIntroSampleAyahRef(meal, locale).slice(0, SMART_REMINDER_MESSAGE_MAX_LEN);
    } catch {
        /* locale fallback */
    }
    return appendIntroSampleAyahRef(t('smartReminders.sampleMessage'), locale).slice(0, SMART_REMINDER_MESSAGE_MAX_LEN);
}

function isIntroSampleRule(ruleOrId) {
    const id = typeof ruleOrId === 'string' ? ruleOrId : ruleOrId?.id;
    return id === INTRO_SAMPLE_REMINDER_ID;
}

function isLikelyLegacyIntroSampleRule(rule) {
    if (!rule || rule.id === INTRO_SAMPLE_REMINDER_ID) return false;
    if (rule.enabled) return false;
    if (rule.scheduleMode !== 'count' || rule.timesPerDay !== 3) return false;
    const msg = String(rule.messages?.[0] || '').trim();
    const name = String(rule.name || '').trim();
    const sampleName = t('smartReminders.sampleName');
    const sampleNameTr = tForLocale('tr', 'smartReminders.sampleName') || 'Hatırlatıcı 1';
    if ((name === sampleName || name === sampleNameTr) && !msg) return true;
    if (!msg) return false;
    return /a['\u2019]?raf|al-?a['\u2019]?raf|205|verse 205|ayat 205|سورة الأعراف|سورۃ الأعراف/i.test(msg)
        || msg === t('smartReminders.sampleMessage')
        || msg === tForLocale('tr', 'smartReminders.sampleMessage')
        || msg === "A'raf suresi 205. ayet";
}

function bindIntroSampleReminderId(rule) {
    if (!rule || rule.id === INTRO_SAMPLE_REMINDER_ID) return rule;
    rule.id = INTRO_SAMPLE_REMINDER_ID;
    return rule;
}

async function refreshIntroSampleSmartReminder() {
    if (!appMeta.smartRemindersIntroSeeded) return false;

    let rule = smartReminders.find((r) => r.id === INTRO_SAMPLE_REMINDER_ID);
    if (!rule) {
        rule = smartReminders.find((r) => isLikelyLegacyIntroSampleRule(r));
        if (rule) bindIntroSampleReminderId(rule);
    }

    if (!rule) return false;

    const version = appMeta.smartRemindersIntroMsgVersion || 0;
    if (version >= INTRO_SAMPLE_MSG_VERSION) return false;

    const mealText = await loadIntroSampleMealText();
    const sampleName = t('smartReminders.sampleName');

    rule.name = sampleName;
    rule.messages = [mealText];
    rule.enabled = false;
    rule.scheduleMode = 'count';
    rule.timesPerDay = 3;
    rule.tapAction = rule.tapAction || 'app';
    appMeta.smartRemindersIntroMsgVersion = INTRO_SAMPLE_MSG_VERSION;
    saveData();
    return true;
}

function createSampleSmartReminderRule() {
    const rule = createDefaultSmartReminder();
    return {
        ...rule,
        id: INTRO_SAMPLE_REMINDER_ID,
        enabled: false,
        name: t('smartReminders.sampleName'),
        messages: [appendIntroSampleAyahRef(t('smartReminders.sampleMessage'), getLocale())],
        scheduleMode: 'count',
        timesPerDay: 3,
        tapAction: 'app',
        openZikirId: null
    };
}

/** İlk hatırlatıcı ekranı ziyaretinde örnek kural ekler (bir kez). @returns {Promise<boolean>} */
async function ensureSmartReminderSampleIfNeeded() {
    if (appMeta.smartRemindersIntroSeeded) {
        await refreshIntroSampleSmartReminder();
        return false;
    }
    appMeta.smartRemindersIntroSeeded = true;
    if (smartReminders.length > 0) {
        saveData();
        return false;
    }
    const rule = createSampleSmartReminderRule();
    rule.messages = [await loadIntroSampleMealText()];
    smartReminders.push(rule);
    appMeta.smartRemindersIntroMsgVersion = INTRO_SAMPLE_MSG_VERSION;
    saveData();
    return true;
}

function getSmartReminderById(id) {
    return smartReminders.find((r) => r.id === id) || null;
}

function getSmartReminderWeekdayDisplayOrder() {
    if (getLocale() === 'tr') return [1, 2, 3, 4, 5, 6, 0];
    return [0, 1, 2, 3, 4, 5, 6];
}

function getSmartReminderDisplayName(rule) {
    const name = String(rule.name || '').trim();
    if (name) return name;
    return t('smartReminders.untitled');
}

function formatSmartReminderWeekdays(rule) {
    const days = rule.weekdays && rule.weekdays.length ? rule.weekdays : [0, 1, 2, 3, 4, 5, 6];
    if (days.length === 7) return t('smartReminders.everyDay');
    const order = getSmartReminderWeekdayDisplayOrder();
    return days
        .slice()
        .sort((a, b) => order.indexOf(a) - order.indexOf(b))
        .map((d) => t(`smartReminders.weekdayShort${d}`))
        .join(' · ');
}

function formatSmartReminderListLabel(rule) {
    return getSmartReminderDisplayName(rule);
}

function formatSmartReminderTimeColumn(rule) {
    if (rule.scheduleMode === 'count') {
        const n = rule.timesPerDay || 1;
        return {
            html: escapeHtml(t('smartReminders.timesPerDayShort', { count: n })),
            countMode: true
        };
    }
    return { html: escapeHtml(rule.time || '09:00'), countMode: false };
}

function syncSmartReminderEditTitleUI(rule, isNew) {
    const titleEl = document.getElementById('smartReminderEditTitle');
    if (!titleEl) return;

    const name = String(rule.name || '').trim();
    if (isNew && !name) {
        titleEl.textContent = t('smartReminders.newTitle');
        titleEl.classList.add('is-placeholder');
    } else {
        titleEl.textContent = name || getSmartReminderDisplayName(rule);
        titleEl.classList.toggle('is-placeholder', !name);
    }
}

function readSmartReminderNameFromEditor() {
    const titleEl = document.getElementById('smartReminderEditTitle');
    if (!titleEl || titleEl.classList.contains('is-placeholder')) return '';
    return String(titleEl.textContent || '').trim().slice(0, 60);
}

function normalizeSmartReminderTitleOnBlur() {
    const titleEl = document.getElementById('smartReminderEditTitle');
    if (!titleEl) return;
    const name = String(titleEl.textContent || '').trim();
    if (name) {
        titleEl.textContent = name;
        titleEl.classList.remove('is-placeholder');
        return;
    }
    titleEl.textContent = smartReminderEditId ? t('smartReminders.untitled') : t('smartReminders.newTitle');
    titleEl.classList.add('is-placeholder');
}

function getSmartReminderPrimaryMessage(rule) {
    const msgs = Array.isArray(rule?.messages) ? rule.messages : [];
    return msgs.map((m) => String(m || '').trim()).find(Boolean) || '';
}

function formatSmartReminderRowMetaHtml(rule) {
    const preview = getSmartReminderPrimaryMessage(rule);
    const days = formatSmartReminderWeekdays(rule);
    const daysPart = `<span class="smart-reminder-row__days">${escapeHtml(days)}</span>`;
    const previewPart = preview
        ? `<span class="smart-reminder-row__preview">${escapeHtml(preview)}</span>`
        : '';
    return `<span class="smart-reminder-row__meta-line">${daysPart}${previewPart}</span>`;
}
function formatSmartReminderCharCountLabel(length) {
    return t('smartReminders.charCount', {
        current: Math.min(length, SMART_REMINDER_MESSAGE_MAX_LEN),
        max: SMART_REMINDER_MESSAGE_MAX_LEN
    });
}

function syncSmartReminderCharCounts() {
    document.querySelectorAll('#smartReminderMessagesList [data-smart-message-idx]').forEach((el) => {
        const row = el.closest('.smart-reminder-message-row');
        const counter = row ? row.querySelector('[data-smart-char-count]') : null;
        if (!counter) return;
        const len = readSmartReminderMessageValue(el).length;
        counter.textContent = formatSmartReminderCharCountLabel(len);
        counter.classList.toggle('is-near-limit', len >= SMART_REMINDER_MESSAGE_MAX_LEN - 24);
        counter.classList.toggle('is-at-limit', len >= SMART_REMINDER_MESSAGE_MAX_LEN);
    });
}

async function renderSmartReminderList() {
    await ensureSmartReminderSampleIfNeeded();
    const list = document.getElementById('smartReminderList');
    const empty = document.getElementById('smartRemindersEmpty');
    const note = document.getElementById('smartRemindersPremiumNote');
    if (!list) return;
    list.innerHTML = '';

    if (note) {
        note.hidden = smartRemindersActiveForUser();
        if (!note.hidden) note.textContent = t('smartReminders.previewNote');
    }

    if (empty) empty.classList.toggle('hidden', smartReminders.length > 0);

    smartReminders.forEach((rule) => {
        const timeCol = formatSmartReminderTimeColumn(rule);
        const row = document.createElement('div');
        row.className = 'smart-reminder-row' + (rule.enabled ? '' : ' is-disabled');
        row.dataset.smartReminderId = rule.id;
        row.setAttribute('role', 'button');
        row.tabIndex = 0;

        row.innerHTML = `
            <div class="smart-reminder-row__time${timeCol.countMode ? ' smart-reminder-row__time--count' : ''}">${timeCol.html}</div>
            <div class="smart-reminder-row__body">
                <div class="smart-reminder-row__label">${escapeHtml(formatSmartReminderListLabel(rule))}</div>
                <div class="smart-reminder-row__meta">${formatSmartReminderRowMetaHtml(rule)}</div>
            </div>
            <div class="smart-reminder-row__toggle" data-smart-reminder-toggle-wrap="${escapeAttr(rule.id)}">
                <label class="switch">
                    <input type="checkbox" class="smart-reminder-toggle-input" data-reminder-id="${escapeAttr(rule.id)}" ${rule.enabled ? 'checked' : ''} aria-label="${escapeAttr(formatSmartReminderListLabel(rule))}">
                    <span class="slider round"></span>
                </label>
            </div>
        `;
        list.appendChild(row);
    });
}

function populateSmartReminderZikirSelect(rule) {
    const sel = document.getElementById('smartReminderOpenZikir');
    if (!sel) return;
    const tapAction = rule.tapAction || (rule.openZikirId ? 'zikir' : 'app');
    sel.innerHTML = `
        <option value="_none">${escapeHtml(t('smartReminders.openNothing'))}</option>
        <option value="_app">${escapeHtml(t('smartReminders.openAppOnly'))}</option>
    `;
    zikirs
        .slice()
        .sort((a, b) => getZikirDisplayName(a).localeCompare(getZikirDisplayName(b), getLocale()))
        .forEach((z) => {
            const opt = document.createElement('option');
            opt.value = z.id;
            opt.textContent = t('smartReminders.openZikirOption', { name: getZikirDisplayName(z) });
            sel.appendChild(opt);
        });
    if (tapAction === 'none') sel.value = '_none';
    else if (tapAction === 'zikir' && rule.openZikirId && zikirs.some((z) => z.id === rule.openZikirId)) {
        sel.value = rule.openZikirId;
    } else {
        sel.value = '_app';
    }
}

function renderSmartReminderWeekdayChips(selected) {
    const host = document.getElementById('smartReminderWeekdays');
    if (!host) return;
    const set = new Set(Array.isArray(selected) ? selected : [0, 1, 2, 3, 4, 5, 6]);
    host.innerHTML = '';
    getSmartReminderWeekdayDisplayOrder().forEach((d) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'smart-reminder-weekday' + (set.has(d) ? ' is-active' : '');
        btn.dataset.weekday = String(d);
        btn.textContent = t(`smartReminders.weekdayShort${d}`);
        btn.setAttribute('aria-pressed', set.has(d) ? 'true' : 'false');
        host.appendChild(btn);
    });
}

function renderSmartReminderMessageInputs(messages) {
    const host = document.getElementById('smartReminderMessagesList');
    if (!host) return;
    const list = messages.length ? messages : [''];
    const maxLen = SMART_REMINDER_MESSAGE_MAX_LEN;
    host.innerHTML = '';
    list.forEach((text, idx) => {
        const row = document.createElement('div');
        row.className = 'form-group smart-reminder-message-row';
        const len = String(text || '').length;
        const counterLabel = formatSmartReminderCharCountLabel(len);
        row.innerHTML = `
            <div class="smart-reminder-message-field">
                <textarea rows="2" data-smart-message-idx="${idx}" maxlength="${maxLen}" placeholder="${escapeAttr(t('smartReminders.messagePlaceholder'))}">${escapeHtml(text || '')}</textarea>
                <span class="smart-reminder-char-count${len >= maxLen - 24 ? ' is-near-limit' : ''}${len >= maxLen ? ' is-at-limit' : ''}" data-smart-char-count aria-live="polite">${counterLabel}</span>
            </div>
            <button type="button" class="icon-btn smart-reminder-remove-message" data-smart-message-remove="${idx}" aria-label="Sil" ${list.length <= 1 ? 'hidden' : ''}>
                <span class="material-icons-outlined">close</span>
            </button>
        `;
        host.appendChild(row);
    });
    syncSmartReminderCharCounts();
}

function syncSmartReminderScheduleModeUI(mode) {
    const fixedGroup = document.getElementById('smartReminderFixedTimeGroup');
    const countGroup = document.getElementById('smartReminderCountGroup');
    const isCount = mode === 'count';
    if (fixedGroup) fixedGroup.hidden = isCount;
    if (countGroup) countGroup.hidden = !isCount;
}

function openSmartReminderEditor(ruleId) {
    const isNew = !ruleId;
    const rule = isNew ? createDefaultSmartReminder() : getSmartReminderById(ruleId);
    if (!rule) return;
    smartReminderEditId = isNew ? null : rule.id;

    syncSmartReminderEditTitleUI(rule, isNew);

    const delBtn = document.getElementById('smartReminderDeleteBtn');
    if (delBtn) delBtn.classList.toggle('hidden', isNew);

    renderSmartReminderMessageInputs(rule.messages);
    renderSmartReminderWeekdayChips(rule.weekdays);
    populateSmartReminderZikirSelect(rule);

    document.querySelectorAll('input[name="smartReminderScheduleMode"]').forEach((input) => {
        input.checked = input.value === rule.scheduleMode;
    });
    syncSmartReminderScheduleModeUI(rule.scheduleMode);

    const fixedTime = document.getElementById('smartReminderFixedTime');
    if (fixedTime) fixedTime.value = rule.time || '09:00';
    const timesPerDay = document.getElementById('smartReminderTimesPerDay');
    if (timesPerDay) timesPerDay.value = String(rule.timesPerDay || 1);
    const winStart = document.getElementById('smartReminderWindowStart');
    if (winStart) winStart.value = rule.windowStart || '08:00';
    const winEnd = document.getElementById('smartReminderWindowEnd');
    if (winEnd) winEnd.value = rule.windowEnd || '22:00';
    const vibrate = document.getElementById('smartReminderVibrate');
    if (vibrate) vibrate.checked = !!rule.vibrate;

    openOverlay('smartReminderEditOverlay');
}

function readSmartReminderEditorForm(baseRule) {
    const messages = [];
    document.querySelectorAll('#smartReminderMessagesList [data-smart-message-idx]').forEach((el) => {
        const v = readSmartReminderMessageValue(el);
        if (v) messages.push(v.slice(0, SMART_REMINDER_MESSAGE_MAX_LEN));
    });

    const weekdays = [];
    document.querySelectorAll('#smartReminderWeekdays .smart-reminder-weekday.is-active').forEach((btn) => {
        const d = parseInt(btn.getAttribute('data-weekday') || '', 10);
        if (Number.isFinite(d) && d >= 0 && d <= 6) weekdays.push(d);
    });

    const modeInput = document.querySelector('input[name="smartReminderScheduleMode"]:checked');
    const scheduleMode = modeInput && modeInput.value === 'count' ? 'count' : 'fixed';

    const openSel = document.getElementById('smartReminderOpenZikir');
    const openVal = openSel ? openSel.value : '_app';
    let tapAction = 'app';
    let openZikirId = null;
    if (openVal === '_none') tapAction = 'none';
    else if (openVal === '_app') tapAction = 'app';
    else if (openVal && zikirs.some((z) => z.id === openVal)) {
        tapAction = 'zikir';
        openZikirId = openVal;
    }

    return {
        ...baseRule,
        name: readSmartReminderNameFromEditor(),
        messages,
        weekdays: weekdays.length ? weekdays.sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6],
        scheduleMode,
        time: document.getElementById('smartReminderFixedTime')?.value || '09:00',
        timesPerDay: parseInt(document.getElementById('smartReminderTimesPerDay')?.value || '1', 10) || 1,
        windowStart: document.getElementById('smartReminderWindowStart')?.value || '08:00',
        windowEnd: document.getElementById('smartReminderWindowEnd')?.value || '22:00',
        vibrate: !!document.getElementById('smartReminderVibrate')?.checked,
        tapAction,
        openZikirId
    };
}

async function saveSmartReminderFromEditor() {
    normalizeSmartReminderTitleOnBlur();
    const isNew = !smartReminderEditId;
    if (isNew && smartReminders.length >= MAX_SMART_REMINDERS) {
        await showAppAlert(t('smartReminders.maxReached', { max: MAX_SMART_REMINDERS }), { title: t('premium.cardRemindersTitle') });
        return;
    }

    const base = isNew ? createDefaultSmartReminder() : { ...getSmartReminderById(smartReminderEditId) };
    if (!base) return;

    const next = readSmartReminderEditorForm(base);
    if (isIntroSampleRule(next.id) && next.messages[0]) {
        next.messages[0] = appendIntroSampleAyahRef(next.messages[0]).slice(0, SMART_REMINDER_MESSAGE_MAX_LEN);
    }
    if (!next.messages.length) {
        await showAppAlert(t('smartReminders.needMessage'), { title: t('premium.cardRemindersTitle') });
        return;
    }
    if (!next.weekdays.length) {
        await showAppAlert(t('smartReminders.needWeekday'), { title: t('premium.cardRemindersTitle') });
        return;
    }

    if (isNew) {
        smartReminders.push(next);
    } else {
        const idx = smartReminders.findIndex((r) => r.id === smartReminderEditId);
        if (idx >= 0) smartReminders[idx] = next;
    }

    saveData();
    renderSmartReminderList();
    closeOverlayPreferHistory('smartReminderEditOverlay');
    smartReminderEditId = null;
    await ensureSmartReminderSchedule();
}

async function deleteSmartReminderFromEditor() {
    if (!smartReminderEditId) return;
    if (!(await showAppConfirm(t('smartReminders.deleteConfirm'), {
        title: t('smartReminders.delete'),
        confirmLabel: t('confirm.deleteLabel')
    }))) return;
    smartReminders = smartReminders.filter((r) => r.id !== smartReminderEditId);
    smartReminderEditId = null;
    saveData();
    renderSmartReminderList();
    closeOverlayPreferHistory('smartReminderEditOverlay');
    await ensureSmartReminderSchedule();
}

function setSmartReminderEnabled(ruleId, enabled) {
    const rule = getSmartReminderById(ruleId);
    if (!rule) return;
    rule.enabled = !!enabled;
    saveData();
    renderSmartReminderList();
    ensureSmartReminderSchedule().catch(console.error);
}

async function ensureSmartReminderSchedule() {
    if (!smartRemindersActiveForUser()) {
        if (isCapacitorNative()) await syncNativeSmartReminders([]);
        return;
    }

    const hasActive = smartReminders.some((r) => r.enabled && r.messages.some((m) => String(m || '').trim()));
    if (!hasActive) {
        if (isCapacitorNative()) await syncNativeSmartReminders([]);
        return;
    }

    if (!isCapacitorNative()) {
        maybeRequestNotificationPermission();
        return;
    }

    const slots = buildSmartReminderSlots(smartReminders);
    const r = await syncNativeSmartReminders(slots);
    if (!r.ok && r.reason === 'denied') {
        await showAppAlert(t('smartReminders.permDenied'), { title: t('reminderDialog.notificationPermTitle') });
    } else if (!r.ok && r.reason === 'schedule') {
        await showAppAlert(t('reminderDialog.scheduleFailedBody'), {
            title: t('reminderDialog.scheduleFailedTitle')
        });
    }
}

function setupSmartRemindersUI() {
    const titleEl = document.getElementById('smartReminderEditTitle');
    if (titleEl && titleEl.dataset.bound !== '1') {
        titleEl.dataset.bound = '1';
        titleEl.addEventListener('focus', () => {
            if (titleEl.classList.contains('is-placeholder')) {
                titleEl.textContent = '';
                titleEl.classList.remove('is-placeholder');
            }
        });
        titleEl.addEventListener('blur', () => normalizeSmartReminderTitleOnBlur());
        titleEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleEl.blur();
            }
        });
        titleEl.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
            document.execCommand('insertText', false, text.replace(/\n/g, ' ').slice(0, 60));
        });
    }

    const list = document.getElementById('smartReminderList');
    if (list && list.dataset.bound !== '1') {
        list.dataset.bound = '1';
        list.addEventListener('change', (e) => {
            const input = e.target;
            if (!(input instanceof HTMLInputElement) || !input.classList.contains('smart-reminder-toggle-input')) return;
            e.stopPropagation();
            const id = input.getAttribute('data-reminder-id');
            if (id) setSmartReminderEnabled(id, input.checked);
        });
        list.addEventListener('click', (e) => {
            if (e.target.closest('.smart-reminder-row__toggle')) {
                e.stopPropagation();
                return;
            }
            const row = e.target && e.target.closest ? e.target.closest('[data-smart-reminder-id]') : null;
            if (!row) return;
            openSmartReminderEditor(row.getAttribute('data-smart-reminder-id'));
        });
        list.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const row = e.target && e.target.closest ? e.target.closest('[data-smart-reminder-id]') : null;
            if (!row || e.target.closest('.smart-reminder-row__toggle')) return;
            e.preventDefault();
            openSmartReminderEditor(row.getAttribute('data-smart-reminder-id'));
        });
    }

    const addBtn = document.getElementById('smartReminderAddBtn');
    if (addBtn && addBtn.dataset.bound !== '1') {
        addBtn.dataset.bound = '1';
        addBtn.addEventListener('click', () => {
            if (smartReminders.length >= MAX_SMART_REMINDERS) {
                void showAppAlert(t('smartReminders.maxReached', { max: MAX_SMART_REMINDERS }), { title: t('premium.cardRemindersTitle') });
                return;
            }
            openSmartReminderEditor(null);
        });
    }

    const saveBtn = document.getElementById('smartReminderSaveBtn');
    if (saveBtn && saveBtn.dataset.bound !== '1') {
        saveBtn.dataset.bound = '1';
        saveBtn.addEventListener('click', () => { void saveSmartReminderFromEditor(); });
    }

    const delBtn = document.getElementById('smartReminderDeleteBtn');
    if (delBtn && delBtn.dataset.bound !== '1') {
        delBtn.dataset.bound = '1';
        delBtn.addEventListener('click', () => { void deleteSmartReminderFromEditor(); });
    }

    const addMsgBtn = document.getElementById('smartReminderAddMessageBtn');
    if (addMsgBtn && addMsgBtn.dataset.bound !== '1') {
        addMsgBtn.dataset.bound = '1';
        addMsgBtn.addEventListener('click', () => {
            const current = [];
            document.querySelectorAll('#smartReminderMessagesList [data-smart-message-idx]').forEach((el) => {
                current.push(readSmartReminderMessageValue(el));
            });
            if (current.length >= MAX_MESSAGES_PER_RULE) return;
            current.push('');
            renderSmartReminderMessageInputs(current);
        });
    }

    const msgList = document.getElementById('smartReminderMessagesList');
    if (msgList && msgList.dataset.bound !== '1') {
        msgList.dataset.bound = '1';
        msgList.addEventListener('input', (e) => {
            const el = e.target && e.target.closest ? e.target.closest('[data-smart-message-idx]') : null;
            if (!el) return;
            syncSmartReminderCharCounts();
        });
        msgList.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('[data-smart-message-remove]') : null;
            if (!btn) return;
            const idx = parseInt(btn.getAttribute('data-smart-message-remove') || '', 10);
            const current = [];
            document.querySelectorAll('#smartReminderMessagesList [data-smart-message-idx]').forEach((el) => {
                current.push(readSmartReminderMessageValue(el));
            });
            if (current.length <= 1) return;
            current.splice(idx, 1);
            renderSmartReminderMessageInputs(current);
        });
    }

    const weekdays = document.getElementById('smartReminderWeekdays');
    if (weekdays && weekdays.dataset.bound !== '1') {
        weekdays.dataset.bound = '1';
        weekdays.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('.smart-reminder-weekday') : null;
            if (!btn) return;
            btn.classList.toggle('is-active');
            btn.setAttribute('aria-pressed', btn.classList.contains('is-active') ? 'true' : 'false');
        });
    }

    document.querySelectorAll('input[name="smartReminderScheduleMode"]').forEach((input) => {
        if (input.dataset.bound === '1') return;
        input.dataset.bound = '1';
        input.addEventListener('change', () => {
            syncSmartReminderScheduleModeUI(input.value);
        });
    });
}

function logClick(zId) {
    const today = getTodayString();
    if (!history[today]) history[today] = {};
    if (!history[today][zId]) history[today][zId] = 0;
    history[today][zId]++;
    bumpLifetimeClick(zId);

    // Update lastClicked
    const z = zikirs.find(x => x.id === zId);
    if (z) z.lastClicked = Date.now();

    scheduleSave();
}

function logDecrement(zId) {
    const today = getTodayString();
    if (history[today] && history[today][zId] > 0) {
        history[today][zId]--;
        bumpLifetimeDecrement(zId);
        if (history[today][zId] <= 0) delete history[today][zId];
        if (Object.keys(history[today]).length === 0) delete history[today];
    }
    scheduleSave();
}

function removeHistoryForZikirIds(zidSet) {
    if (!history || !zidSet || zidSet.size === 0) return;
    Object.keys(history).forEach((day) => {
        const block = history[day];
        if (!block || typeof block !== 'object') return;
        zidSet.forEach((zid) => {
            delete block[zid];
        });
        if (Object.keys(block).length === 0) delete history[day];
    });
}

function updateFolderSelectChrome() {
    if (folderSelectCountEl) {
        folderSelectCountEl.textContent =
            selectedFolderIds.size === 0
                ? t('home.selectNone')
                : t('home.selectedFolders', { count: selectedFolderIds.size });
    }
    if (folderSelectDeleteBtn) {
        folderSelectDeleteBtn.disabled = selectedFolderIds.size === 0;
    }
}

function updateZikirSelectChrome() {
    if (zikirSelectCountEl) {
        zikirSelectCountEl.textContent =
            selectedZikirIds.size === 0
                ? t('home.selectNone')
                : t('home.selectedZikirs', { count: selectedZikirIds.size });
    }
    if (zikirSelectDeleteBtn) {
        zikirSelectDeleteBtn.disabled = selectedZikirIds.size === 0;
    }
}

/** Android WebView: yalnızca .hidden bazen yeterli olmuyor; [hidden] + !important CSS ile eşle */
function setMultiSelectBarShown(barEl, show) {
    if (!barEl) return;
    if (show) {
        barEl.removeAttribute('hidden');
        barEl.hidden = false;
    } else {
        barEl.hidden = true;
        barEl.setAttribute('hidden', '');
    }
}

function exitFolderSelectMode(skipRender) {
    folderSelectMode = false;
    folderSelectBarVisible = false;
    selectedFolderIds.clear();
    const hv = document.getElementById('homeView');
    if (hv) hv.classList.remove('home-view--select-mode');
    if (folderGrid) folderGrid.classList.remove('folder-grid--select-mode');
    setMultiSelectBarShown(folderMultiSelectBar, false);
    if (homeQuoteFooter) homeQuoteFooter.hidden = false;
    updateFolderSelectChrome();
    if (!skipRender && hv && hv.classList.contains('active')) renderFolders();
}

function exitZikirSelectMode(skipRender) {
    zikirSelectMode = false;
    zikirSelectBarVisible = false;
    selectedZikirIds.clear();
    const fd = document.getElementById('folderDetailView');
    if (fd) fd.classList.remove('folder-detail--select-mode');
    if (folderZikirList) folderZikirList.classList.remove('zikir-list--select-mode');
    setMultiSelectBarShown(zikirMultiSelectBar, false);
    updateZikirSelectChrome();
    if (!skipRender && fd && fd.classList.contains('active')) renderFolderDetail();
}

function onFolderLongPressSelect(id) {
    if (activeListDrag) return;
    if (!folderSelectMode) {
        folderSelectMode = true;
        selectedFolderIds = new Set([id]);
    } else if (selectedFolderIds.has(id)) {
        selectedFolderIds.delete(id);
    } else {
        selectedFolderIds.add(id);
    }
    folderSelectBarVisible = true;
    const hv = document.getElementById('homeView');
    if (hv) hv.classList.add('home-view--select-mode');
    if (folderGrid) folderGrid.classList.add('folder-grid--select-mode');
    setMultiSelectBarShown(folderMultiSelectBar, true);
    if (homeQuoteFooter) homeQuoteFooter.hidden = folderSelectMode;
    updateFolderSelectChrome();
    renderFolders();
}

function onZikirLongPressSelect(id) {
    if (activeListDrag) return;
    if (!zikirSelectMode) {
        zikirSelectMode = true;
        selectedZikirIds = new Set([id]);
    } else if (selectedZikirIds.has(id)) {
        selectedZikirIds.delete(id);
    } else {
        selectedZikirIds.add(id);
    }
    zikirSelectBarVisible = true;
    const fd = document.getElementById('folderDetailView');
    if (fd) fd.classList.add('folder-detail--select-mode');
    if (folderZikirList) folderZikirList.classList.add('zikir-list--select-mode');
    setMultiSelectBarShown(zikirMultiSelectBar, true);
    updateZikirSelectChrome();
    renderFolderDetail();
}

function toggleFolderSelected(id) {
    if (selectedFolderIds.has(id)) selectedFolderIds.delete(id);
    else selectedFolderIds.add(id);
    /* Sil çubuğu seçim yaparken açık kalsın; kapanış: İptal veya silme tamamlanınca */
    folderSelectBarVisible = true;
    setMultiSelectBarShown(folderMultiSelectBar, true);
    updateFolderSelectChrome();
    renderFolders();
}

function toggleZikirSelected(id) {
    if (selectedZikirIds.has(id)) selectedZikirIds.delete(id);
    else selectedZikirIds.add(id);
    zikirSelectBarVisible = true;
    setMultiSelectBarShown(zikirMultiSelectBar, true);
    updateZikirSelectChrome();
    renderFolderDetail();
}

async function deleteSelectedFolders() {
    const ids = [...selectedFolderIds];
    if (ids.length === 0) return;
    const blocked = ids.filter((fid) => PROTECTED_FOLDER_IDS.has(fid) || isSeasonalFolderId(fid));
    if (blocked.length > 0) {
        await showAppAlert(t('confirm.protectedFoldersMsg'), {
            title: t('confirm.protectedFoldersTitle')
        });
        folderSelectBarVisible = false;
        setMultiSelectBarShown(folderMultiSelectBar, false);
        renderFolders();
        return;
    }
    const zikirIdsToRemove = new Set(
        zikirs.filter((z) => ids.includes(z.folderId)).map((z) => z.id)
    );
    const nFolders = ids.length;
    const nZikirs = zikirIdsToRemove.size;
    const msg = t('confirm.deleteFoldersMsg', { folderCount: nFolders, zikirCount: nZikirs });
    if (!(await showAppConfirm(msg, {
        title: t('confirm.deleteFoldersTitle'),
        confirmLabel: t('confirm.deleteLabel')
    }))) {
        exitFolderSelectMode(false);
        return;
    }
    if (isPremium()) {
        // Soft-delete into Trash (Premium).
        const deletedAt = Date.now();
        const deletedFolders = folders.filter((f) => ids.includes(f.id));
        const deletedZikirs = zikirs.filter((z) => ids.includes(z.folderId));
        deletedFolders.forEach((f) => {
            trash.entries.unshift({
                kind: 'folder',
                deletedAt,
                folder: deepClone(f),
                zikirs: deletedZikirs
                    .filter((z) => z.folderId === f.id)
                    .map((z) => deepClone(z))
            });
        });
        capTrashEntries();
    } else {
        // Non-premium: permanent delete (old behavior).
        removeHistoryForZikirIds(zikirIdsToRemove);
    }
    zikirs = zikirs.filter((z) => !ids.includes(z.folderId));
    folders = folders.filter((f) => !ids.includes(f.id));
    exitFolderSelectMode(false);
    saveData();
    renderFolders();
}

async function deleteSelectedZikirs() {
    const ids = [...selectedZikirIds];
    if (ids.length === 0) return;
    if (ids.some((id) => isSeasonalZikirId(id))) {
        await showAppAlert(t('confirm.protectedSeasonalZikirsMsg'), {
            title: t('confirm.protectedFoldersTitle')
        });
        exitZikirSelectMode(false);
        return;
    }
    const msg = t('confirm.deleteZikirsMsg', { count: ids.length });
    if (!(await showAppConfirm(msg, {
        title: t('confirm.deleteZikirsTitle'),
        confirmLabel: t('confirm.deleteLabel')
    }))) {
        exitZikirSelectMode(false);
        return;
    }
    if (isPremium()) {
        // Soft-delete into Trash (Premium).
        const deletedAt = Date.now();
        const deleted = zikirs.filter((z) => ids.includes(z.id));
        deleted.forEach((z) => {
            trash.entries.unshift({
                kind: 'zikir',
                deletedAt,
                zikir: deepClone(z),
                originalFolderId: z.folderId ?? null
            });
        });
        capTrashEntries();
    } else {
        // Non-premium: permanent delete (old behavior).
        removeHistoryForZikirIds(new Set(ids));
    }
    zikirs = zikirs.filter((z) => !ids.includes(z.id));
    if (currentZikirId && ids.includes(currentZikirId)) {
        currentZikirId = null;
    }
    exitZikirSelectMode(false);
    saveData();
    renderFolderDetail();
}

// ===================== ROUTING =====================
function clearFolderSearch() {
    folderSearchQuery = '';
    if (folderSearchInput) folderSearchInput.value = '';
}

function clearLibrarySearch() {
    librarySearchQuery = '';
    if (librarySearchInput) librarySearchInput.value = '';
}

function resetLibraryCategoryTab() {
    libraryCategoryTabs.forEach((b) => {
        const cat = b.getAttribute('data-cat');
        b.classList.toggle('active', cat === activeLibraryCat);
    });
}

let currentViewId = null;
let inAppViewStack = [];

function viewStateEquals(a, b) {
    if (!a || !b) return false;
    return a.viewId === b.viewId && (a.param ?? null) === (b.param ?? null);
}

function getViewState(viewId, param = null) {
    const p = param ?? null;
    return { viewId, param: p };
}

function isOverlayState(st) {
    return !!(st && typeof st === 'object' && typeof st.overlayId === 'string');
}

function getOverlayState(overlayId) {
    return { overlayId: String(overlayId) };
}

function isOverlayActive(el) {
    return !!(el && el.classList && el.classList.contains('active'));
}

function closeAllOverlays() {
    closeLocaleWelcomeIfOpen();
    [
        document.getElementById('appDialogOverlay'),
        copyModalOverlay,
        editModalOverlay,
        addModalOverlay,
        trashOverlay,
        document.getElementById('premiumUpsellOverlay'),
        libraryFolderSelectOverlay,
        libraryDetailOverlay,
        zikirStatsOverlay,
        document.getElementById('smartReminderEditOverlay')
    ].forEach((el) => {
        if (el) el.classList.remove('active');
    });
}

const SCROLLABLE_OVERLAY_IDS = new Set(['trashOverlay', 'smartReminderEditOverlay', 'reviseQuranDisplayOverlay']);

function openOverlay(overlayId, { onOpen } = {}) {
    const el = document.getElementById(overlayId);
    if (!el) return;
    ensureInitialHistoryState();
    try {
        const cur = history && history.state ? history.state : null;
        const next = getOverlayState(overlayId);
        if (!isOverlayState(cur) || cur.overlayId !== next.overlayId) history.pushState(next, '');
    } catch (_) {
        // ignore
    }
    el.classList.add('active');
    if (SCROLLABLE_OVERLAY_IDS.has(overlayId)) {
        void applyModalOverlayBottomInset(el);
    }
    if (typeof onOpen === 'function') onOpen();
}

function closeOverlayPreferHistory(overlayId) {
    const el = document.getElementById(overlayId);
    if (!el) return false;
    if (!isOverlayActive(el)) return false;
    try {
        const st = history && history.state ? history.state : null;
        if (isOverlayState(st) && st.overlayId === overlayId) {
            history.back();
            return true;
        }
    } catch (_) {
        // ignore
    }
    el.classList.remove('active');
    return true;
}

function ensureInitialHistoryState() {
    try {
        const st = history && history.state ? history.state : null;
        // If we already have an in-app state (view or overlay), don't clobber it.
        if (st && typeof st === 'object') {
            if (typeof st.viewId === 'string') return;
            if (typeof st.overlayId === 'string') return;
        }
        history.replaceState(getViewState('homeView', null), '');
    } catch (_) {
        // ignore: some WebViews may block history state
    }
}

function setInAppStackTo(state) {
    inAppViewStack = [state];
}

function pushInAppStack(state) {
    const last = inAppViewStack.length ? inAppViewStack[inAppViewStack.length - 1] : null;
    if (last && viewStateEquals(last, state)) return;
    inAppViewStack.push(state);
}

function syncInAppStackToHistoryState(st) {
    if (!st || typeof st.viewId !== 'string') return;
    const idx = inAppViewStack.findIndex((entry) => viewStateEquals(entry, st));
    if (idx >= 0) {
        inAppViewStack = inAppViewStack.slice(0, idx + 1);
        return;
    }
    if (inAppViewStack.length) inAppViewStack[inAppViewStack.length - 1] = st;
    else inAppViewStack = [st];
}

const IN_APP_BACK_OVERLAY_IDS = [
    'appDialogOverlay',
    'copyModalOverlay',
    'editModalOverlay',
    'addModalOverlay',
    'trashOverlay',
    'libraryFolderSelectOverlay',
    'libraryDetailOverlay',
    'zikirStatsOverlay'
];

function canNavigateBackInApp() {
    const ayahExpand = document.getElementById('quranAyahExpandOverlay');
    if (ayahExpand && !ayahExpand.hidden) return true;

    const tafsirOverlay = document.getElementById('quranTafsirBridgeOverlay');
    if (tafsirOverlay && !tafsirOverlay.hidden) return true;

    const drawer = document.getElementById('quranReaderDrawer');
    if (drawer && drawer.classList.contains('quran-reader-drawer--open')) return true;

    for (const oid of IN_APP_BACK_OVERLAY_IDS) {
        if (isOverlayActive(document.getElementById(oid))) return true;
    }

    if (inAppViewStack.length >= 2) return true;

    try {
        if (history.length > 1) return true;
    } catch (_) {
        /* ignore */
    }
    return false;
}

function goBackInApp({ fallbackViewId = 'homeView' } = {}) {
    const ayahExpand = document.getElementById('quranAyahExpandOverlay');
    if (ayahExpand && !ayahExpand.hidden) {
        closeAyahExpandView();
        return;
    }

    const tafsirOverlay = document.getElementById('quranTafsirBridgeOverlay');
    if (tafsirOverlay && !tafsirOverlay.hidden) {
        closeTafsirBridgeSheet();
        return;
    }

    const drawer = document.getElementById('quranReaderDrawer');
    if (drawer && drawer.classList.contains('quran-reader-drawer--open')) {
        closeQuranReaderDrawer();
        return;
    }

    for (const oid of IN_APP_BACK_OVERLAY_IDS) {
        const el = document.getElementById(oid);
        if (isOverlayActive(el)) {
            closeOverlayPreferHistory(oid);
            return;
        }
    }

    if (inAppViewStack.length >= 2) {
        try {
            history.back();
            return;
        } catch (_) {
            inAppViewStack.pop();
            const prev = inAppViewStack[inAppViewStack.length - 1];
            showView(prev.viewId, prev.param ?? null, { push: false });
            return;
        }
    }

    try {
        if (history.length > 1 && history.state && typeof history.state.viewId === 'string') {
            history.back();
            return;
        }
    } catch (_) {
        /* ignore */
    }

    const fallback = fallbackViewId || 'homeView';
    setInAppStackTo(getViewState(fallback, null));
    showView(fallback, null, { push: false });
}

function showView(viewId, param = null, options = {}) {
    const { push = true } = options || {};
    usageTracker?.forceFlush();
    if (viewId === 'premiumView' && !PREMIUM_UI_VISIBLE) {
        viewId = 'homeView';
        param = null;
    }
    if (PREMIUM_FEATURE_VIEW_IDS.has(viewId) && !PREMIUM_LIVE) {
        viewId = 'premiumView';
        param = null;
    }
    const nextState = getViewState(viewId, param);
    const prevState = currentViewId ? getViewState(currentViewId, (
        currentViewId === 'folderDetailView' ? currentFolderId :
        currentViewId === 'counterView' ? currentZikirId :
        currentViewId === 'quranSurahView' ? currentQuranSurahId :
        null
    )) : null;

    if (push) ensureInitialHistoryState();
    // Push new state BEFORE UI switch so Android back always has an entry.
    if (push) {
        try {
            const cur = history && history.state ? history.state : null;
            // Avoid pushing duplicates (e.g., tapping the same bottom tab).
            if (!viewStateEquals(cur, nextState)) history.pushState(nextState, '');
        } catch (_) {
            // ignore
        }
        pushInAppStack(nextState);
    }

    if (viewId !== 'settingsView') {
        setLocalePickerOpen(false);
        setTickSoundPickerOpen(false);
    }

    if (viewId !== 'counterView' && zikirStatsOverlay) zikirStatsOverlay.classList.remove('active');

    if (viewId !== 'homeView') exitFolderSelectMode(true);
    if (viewId !== 'folderDetailView') exitZikirSelectMode(true);

    if (viewId !== 'folderDetailView') {
        clearFolderSearch();
    } else if (param != null && param !== currentFolderId) {
        clearFolderSearch();
    }

    if (viewId !== 'libraryView') {
        clearLibrarySearch();
    }
    if (viewId !== 'quranView' && viewId !== 'quranSurahView') {
        clearQuranSearch();
    }
    if (viewId !== 'quranSurahView') {
        closeQuranReaderDrawer();
        if (currentViewId === 'quranSurahView') teardownQuranReader();
    }

    views.forEach(v => {
        if (v.id === viewId) {
            v.classList.remove('hidden');
            v.classList.add('active');
        } else {
            v.classList.remove('active');
            v.classList.add('hidden');
        }
    });

    if (bottomNav) {
        const stealth = viewId === 'stealthView';
        const counterCustomize = viewId === 'premiumFeatureCounterCustomizeView';
        document.documentElement.classList.toggle('counter-customize-open', counterCustomize);
        if (stealth || counterCustomize) {
            bottomNav.hidden = true;
            bottomNav.setAttribute('hidden', '');
            bottomNav.classList.toggle('bottom-nav--stealth', stealth);
            bottomNav.setAttribute('aria-hidden', 'true');
        } else {
            bottomNav.hidden = false;
            bottomNav.removeAttribute('hidden');
            bottomNav.classList.remove('bottom-nav--stealth');
            bottomNav.removeAttribute('aria-hidden');
        }
        bottomNav.querySelectorAll('.bottom-nav__btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = bottomNav.querySelector(`.bottom-nav__btn[data-view="${viewId}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (viewId !== 'counterView') {
        void releaseWakeLock();
    }

    if (viewId !== 'homeView') {
        setDailyQuoteExpanded(false);
    }

    if (viewId === 'homeView') {
        setDailyQuote();
        renderFolders();
    }
    else if (viewId === 'folderDetailView') {
        currentFolderId = param;
        renderFolderDetail();
    } else if (viewId === 'counterView') {
        currentZikirId = param;
        updateCounterUI();
        if (appSettings.wakeLock) void requestWakeLock();
    } else if (viewId === 'statsView') {
        activeStatTab = ensureUnlockedStatTab(activeStatTab);
        statTabBtns.forEach((b) => {
            b.classList.toggle('active', (b.getAttribute('data-tab') || 'daily') === activeStatTab);
        });
        syncPremiumStatTabsUI();
        renderStats();
    } else if (viewId === 'libraryView') {
        resetLibraryCategoryTab();
        renderLibrary();
    } else if (viewId === 'quranView') {
        if (getQuranViewTab() === 'favorites') {
            void renderQuranFavoritesList(appSettings.quranMeal, quranAyahFavorites);
        } else {
            renderQuranSurahList();
        }
    } else if (viewId === 'quranSurahView') {
        const scrollAyah =
            param != null && typeof param === 'object' && param.ayah != null
                ? Number(param.ayah)
                : Number.isFinite(Number(param?.scrollAyah))
                  ? Number(param.scrollAyah)
                  : null;
        currentQuranSurahId = Number(
            param != null && typeof param === 'object' ? param.surah : param
        );
        if (!Number.isFinite(currentQuranSurahId)) currentQuranSurahId = 1;
        const mushafNav =
            typeof param === 'object' && param != null
                ? {
                      ...(param.preferSaved ? { preferSaved: true } : {}),
                      ...(param.forceSurahStart ? { forceSurahStart: true } : {})
                  }
                : mushafNavOptsForSurahOpen(scrollAyah);
        void renderQuranSurahDetail(
            currentQuranSurahId,
            appSettings.quranMeal,
            appSettings.quranReadMode,
            scrollAyah,
            appSettings.quranReaderLayout,
            mushafNav
        );
    } else if (viewId === 'premiumView') {
        renderPremium();
        void renderBackupView();
    } else if (viewId === 'premiumFeatureRemindersView') {
        renderSmartReminderList();
    } else if (viewId === 'premiumFeatureWeeklyView') {
        weeklyReportWeekIndex = getSelectableWeekRanges(4).length - 1;
        renderWeeklyReportView();
    } else if (viewId === 'premiumFeatureCounterCustomizeView') {
        renderCounterCustomizeEditor();
    } else if (viewId === 'premiumFeatureCounterBackgroundView') {
        syncCounterBackgroundEditorUI();
    } else if (viewId === 'premiumPurchaseView') {
        renderPremiumPurchase();
    } else if (viewId === 'settingsView') {
        setLocalePickerOpen(false);
        syncSettingsUI();
        syncPremiumLockedControls();
    } else if (viewId === 'privacyView') {
        syncPrivacyViewUI();
    }

    currentViewId = viewId;
}

function renderPremium() {
    const teaserPanel = document.getElementById('premiumTeaserPanel');
    const lockedPanel = document.getElementById('premiumHubLockedPanel');
    const managePanel = document.getElementById('premiumHubManagePanel');
    if (teaserPanel) teaserPanel.classList.toggle('hidden', PREMIUM_LIVE);
    if (lockedPanel) lockedPanel.classList.toggle('hidden', !PREMIUM_LIVE);
    if (managePanel) {
        managePanel.classList.toggle('hidden', !PREMIUM_LIVE);
        if (!PREMIUM_LIVE) managePanel.hidden = true;
    }

    if (!PREMIUM_LIVE) {
        const el = document.getElementById('premiumTeaserLine');
        if (el) {
            const teaserKeys = [
                'premium.teaser0',
                'premium.teaser1',
                'premium.teaser2',
                'premium.teaser3'
            ];
            const pick = teaserKeys[Math.floor(Math.random() * teaserKeys.length)];
            el.textContent = t(pick);
        }
        return;
    }
    syncPremiumHubUI();
}

// ===================== VIEWS =====================
function syncDailyQuoteFooterUI() {
    if (!homeQuoteFooter) return;
    const expandable = !!(currentDailyQuoteEntry && currentDailyQuoteEntry.expandable);
    homeQuoteFooter.classList.toggle('quote-footer--expandable', expandable);
    homeQuoteFooter.classList.toggle('quote-footer--compact', expandable && !dailyQuoteExpanded);
    homeQuoteFooter.classList.toggle('quote-footer--expanded', dailyQuoteExpanded);
    if (expandable) {
        homeQuoteFooter.setAttribute('role', 'button');
        homeQuoteFooter.tabIndex = 0;
        homeQuoteFooter.setAttribute(
            'aria-label',
            dailyQuoteExpanded ? t('home.quoteCollapseAria') : t('home.quoteExpandAria')
        );
        homeQuoteFooter.setAttribute('aria-expanded', dailyQuoteExpanded ? 'true' : 'false');
    } else {
        homeQuoteFooter.setAttribute('role', 'presentation');
        homeQuoteFooter.removeAttribute('tabindex');
        homeQuoteFooter.removeAttribute('aria-label');
        homeQuoteFooter.removeAttribute('aria-expanded');
    }
}

function syncDailyQuoteText() {
    const el = document.getElementById('dailyQuoteText');
    if (!el || !currentDailyQuoteEntry) return;
    el.textContent = dailyQuoteExpanded ? currentDailyQuoteEntry.full : currentDailyQuoteEntry.preview;
}

function setDailyQuoteExpanded(expanded) {
    dailyQuoteExpanded = !!expanded;
    syncDailyQuoteFooterUI();
    syncDailyQuoteText();
}

function toggleDailyQuoteExpand() {
    if (!currentDailyQuoteEntry?.expandable) return;
    setDailyQuoteExpanded(!dailyQuoteExpanded);
}

function setDailyQuote() {
    currentDailyQuoteEntry = pickRandomQuoteEntry(getLocale());
    dailyQuoteExpanded = false;
    syncDailyQuoteFooterUI();
    syncDailyQuoteText();
}

// ——— Liste sıralama: uzun bas + sürükle (mobil) ———
const LIST_DRAG_LONG_MS = 520;
const LIST_DRAG_MOVE_CANCEL_PX_MOUSE = 22;
const LIST_DRAG_MOVE_CANCEL_PX_TOUCH = 72;
let activeListDrag = null;
/** Sıralama tutamacından başlayan dokunuşlar; uzun basımla seçim moduna girmeyi engeller. */
const listDragHandlePointerIds = new Set();

function setDragReorderLock(on) {
    document.documentElement.classList.toggle('drag-reorder-lock', !!on);
}

function getFolderSortedIds() {
    return [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(f => f.id);
}

function applyFolderOrder(orderedIds) {
    orderedIds.forEach((id, i) => {
        const f = folders.find(x => x.id === id);
        if (f) f.order = i;
    });
    saveData();
    renderFolders();
}

function getZikirSortedIdsInCurrentFolder() {
    return zikirs
        .filter(z => z.folderId === currentFolderId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(z => z.id);
}

function applyZikirOrder(orderedIds) {
    orderedIds.forEach((id, i) => {
        const z = zikirs.find(x => x.id === id);
        if (z) z.order = i;
    });
    saveData();
    renderFolderDetail();
}

function computeListDropIndex(container, clientY, dragSourceEl) {
    const items = [...container.querySelectorAll('[data-drag-order-item]')].filter(el => el !== dragSourceEl);
    for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (clientY < mid) return i;
    }
    return items.length;
}

/** Bir satır + aralık kadar dikey kaydırma (flex gap veya margin) */
function getReorderShiftHeight(el, container) {
    if (!el || !container) return 48;
    const rect = el.getBoundingClientRect();
    const next = el.nextElementSibling;
    if (next && container.contains(next) && next.matches('[data-drag-order-item]')) {
        return Math.max(1, next.getBoundingClientRect().top - rect.top);
    }
    const prev = el.previousElementSibling;
    if (prev && container.contains(prev) && prev.matches('[data-drag-order-item]')) {
        return Math.max(1, rect.top - prev.getBoundingClientRect().bottom);
    }
    const st = getComputedStyle(el);
    const mb = parseFloat(st.marginBottom) || 0;
    const cg = getComputedStyle(container);
    const gap = parseFloat(cg.rowGap || cg.gap) || 0;
    return Math.max(1, rect.height + Math.max(mb, gap));
}

function clearListDragTransforms(container) {
    if (!container) return;
    container.querySelectorAll('[data-drag-order-item]').forEach((el) => {
        el.style.transform = '';
    });
}

function updateListDragShifts(clientY) {
    if (!activeListDrag) return;
    const { container, sourceEl, sourceIndex, shiftHeight } = activeListDrag;
    if (sourceIndex < 0) return;
    const insertAt = computeListDropIndex(container, clientY, sourceEl);
    const nodes = [...container.querySelectorAll('[data-drag-order-item]')];
    nodes.forEach((el, i) => {
        if (el === sourceEl) {
            el.style.transform = '';
            return;
        }
        let ty = 0;
        if (insertAt < sourceIndex && i >= insertAt && i < sourceIndex) ty = shiftHeight;
        else if (insertAt > sourceIndex && i > sourceIndex && i <= insertAt) ty = -shiftHeight;
        el.style.transform = ty === 0 ? '' : `translateY(${ty}px)`;
    });
}

function moveListDragGhost(clientY) {
    if (!activeListDrag) return;
    const { ghost, ghostLeft, ghostWidth, ghostHeight, offsetY } = activeListDrag;
    ghost.style.top = `${clientY - offsetY}px`;
    ghost.style.left = `${ghostLeft}px`;
    ghost.style.width = `${ghostWidth}px`;
    if (typeof ghostHeight === 'number') {
        ghost.style.minHeight = `${ghostHeight}px`;
    }
    updateListDragShifts(clientY);
}

function teardownListDrag() {
    if (!activeListDrag) return;
    const { removeDocListeners, ghost, sourceEl, container, pointerId } = activeListDrag;
    clearListDragTransforms(container);
    removeDocListeners();
    ghost.remove();
    sourceEl.classList.remove('drag-reorder-source', 'drag-reorder-pending');
    listDragHandlePointerIds.delete(pointerId);
    setDragReorderLock(false);
    activeListDrag = null;
}

function completeListDrag(clientY) {
    if (!activeListDrag) return;
    const { id, sourceEl, container, getSortedIds, onCommit, ghost, removeDocListeners, pointerId } = activeListDrag;
    removeDocListeners();
    clearListDragTransforms(container);
    const sortedIds = getSortedIds();
    const insertAt = computeListDropIndex(container, clientY, sourceEl);
    const sans = sortedIds.filter(x => x !== id);
    const at = Math.max(0, Math.min(insertAt, sans.length));
    sans.splice(at, 0, id);
    const changed = sortedIds.length !== sans.length || sortedIds.some((x, i) => x !== sans[i]);

    ghost.remove();
    sourceEl.classList.remove('drag-reorder-source', 'drag-reorder-pending');
    listDragHandlePointerIds.delete(pointerId);
    setDragReorderLock(false);
    activeListDrag = null;
    suppressListNavigation = true;
    if (changed) onCommit(sans);
}

function beginListDrag(sourceEl, id, container, getSortedIds, onCommit, pointerId, clientY) {
    if (activeListDrag) teardownListDrag();
    sourceEl.classList.remove('drag-reorder-pending');
    const rect = sourceEl.getBoundingClientRect();
    const ghost = sourceEl.cloneNode(true);
    ghost.classList.add('drag-reorder-ghost');
    ghost.querySelectorAll('button').forEach((b) => {
        b.disabled = true;
        b.style.pointerEvents = 'none';
    });
    ghost.querySelectorAll('input[type="checkbox"]').forEach((inp, idx) => {
        const srcList = sourceEl.querySelectorAll('input[type="checkbox"]');
        if (srcList[idx]) inp.checked = srcList[idx].checked;
        inp.disabled = true;
        inp.style.pointerEvents = 'none';
    });
    const inSelectMode =
        container.classList.contains('folder-grid--select-mode') ||
        container.classList.contains('zikir-list--select-mode');
    if (inSelectMode) {
        ghost.classList.add('drag-reorder-ghost--select');
    } else {
        ghost.querySelectorAll('.folder-card__check, .zikir-row__check').forEach((node) => node.remove());
    }
    document.body.appendChild(ghost);

    const allOrderEls = [...container.querySelectorAll('[data-drag-order-item]')];
    const sourceIndex = allOrderEls.indexOf(sourceEl);
    const shiftHeight = getReorderShiftHeight(sourceEl, container);

    sourceEl.classList.add('drag-reorder-source');
    setDragReorderLock(true);

    function docMove(e) {
        if (e.pointerId !== pointerId || !activeListDrag) return;
        moveListDragGhost(e.clientY);
        e.preventDefault();
    }
    function docEnd(e) {
        if (e.pointerId !== pointerId || !activeListDrag) return;
        if (e.type === 'pointercancel') {
            teardownListDrag();
            suppressListNavigation = true;
        } else {
            completeListDrag(e.clientY);
        }
        e.preventDefault();
    }

    document.addEventListener('pointermove', docMove, { capture: true, passive: false });
    document.addEventListener('pointerup', docEnd, { capture: true });
    document.addEventListener('pointercancel', docEnd, { capture: true });

    activeListDrag = {
        id,
        sourceEl,
        ghost,
        container,
        getSortedIds,
        onCommit,
        pointerId, // hangi işaretçi; docMove/docEnd ile eşleştirmek için
        ghostLeft: rect.left,
        ghostWidth: rect.width,
        ghostHeight: rect.height,
        offsetY: clientY - rect.top,
        sourceIndex,
        shiftHeight,
        removeDocListeners() {
            document.removeEventListener('pointermove', docMove, { capture: true });
            document.removeEventListener('pointerup', docEnd, { capture: true });
            document.removeEventListener('pointercancel', docEnd, { capture: true });
        }
    };

    moveListDragGhost(clientY);
    runDragReorderNudge();
}

function attachListDragLongPress(el, { id, container, getSortedIds, onCommit, shouldIgnoreDown, rowElement }) {
    const rowEl = rowElement || el;
    el.addEventListener(
        'pointerdown',
        (e) => {
            if (shouldIgnoreDown && shouldIgnoreDown(e.target)) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.stopPropagation();

            const pid = e.pointerId;
            listDragHandlePointerIds.add(pid);
            const ptrKind = e.pointerType;
            const startX = e.clientX;
            const startY = e.clientY;
            let lastClientY = startY;
            let longTimer = null;
            const cancelMovePx =
                ptrKind === 'touch' || ptrKind === 'pen'
                    ? LIST_DRAG_MOVE_CANCEL_PX_TOUCH
                    : LIST_DRAG_MOVE_CANCEL_PX_MOUSE;

            rowEl.classList.add('drag-reorder-pending');

            function clearDragHandlePointer() {
                listDragHandlePointerIds.delete(pid);
            }

            function removePending(keepHandlePointer = false) {
                rowEl.classList.remove('drag-reorder-pending');
                if (!keepHandlePointer) clearDragHandlePointer();
                if (longTimer) {
                    clearTimeout(longTimer);
                    longTimer = null;
                }
                document.removeEventListener('pointermove', onPendingMove, true);
                document.removeEventListener('pointerup', onPendingUp, true);
                document.removeEventListener('pointercancel', onPendingUp, true);
            }

            function onPendingMove(ev) {
                if (ev.pointerId !== pid) return;
                lastClientY = ev.clientY;
                const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY);
                if (moved > cancelMovePx) {
                    removePending();
                    return;
                }
                /* Dokunmatikte liste kaydırması uzun basımı iptal ediyor; küçük hareketlerde scroll'u durdur */
                if (ptrKind === 'touch' || ptrKind === 'pen') {
                    ev.preventDefault();
                }
            }

            function onPendingUp(ev) {
                if (ev.pointerId !== pid) return;
                removePending();
            }

            longTimer = setTimeout(() => {
                longTimer = null;
                removePending(true);
                beginListDrag(rowEl, id, container, getSortedIds, onCommit, pid, lastClientY);
            }, LIST_DRAG_LONG_MS);

            document.addEventListener('pointermove', onPendingMove, { passive: false, capture: true });
            document.addEventListener('pointerup', onPendingUp, { capture: true });
            document.addEventListener('pointercancel', onPendingUp, { capture: true });
        },
        { capture: true, passive: true }
    );
}

function shouldIgnoreSelectLongPressTarget(target) {
    if (!target || !target.closest) return true;
    return !!target.closest(
        '.row-drag-handle, .folder-card__check, .zikir-row__check, button, a, input, label.switch, .fav-btn, .edit-target-btn'
    );
}

function isListDragHandlePointerEvent(e) {
    if (shouldIgnoreSelectLongPressTarget(e.target)) return true;
    if (typeof e.composedPath === 'function') {
        return e.composedPath().some((node) => node?.classList?.contains?.('row-drag-handle'));
    }
    return false;
}

/** Çoklu silme: seçim moduna geçirir veya seçimi günceller. */
function attachLongPressSelect(el, id, { onEnter }) {
    el.addEventListener(
        'pointerdown',
        (e) => {
            if (isListDragHandlePointerEvent(e)) return;
            if (listDragHandlePointerIds.has(e.pointerId)) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            const pid = e.pointerId;
            const ptrKind = e.pointerType;
            const startX = e.clientX;
            const startY = e.clientY;
            let longTimer = null;
            const cancelMovePx =
                ptrKind === 'touch' || ptrKind === 'pen'
                    ? LIST_DRAG_MOVE_CANCEL_PX_TOUCH
                    : LIST_DRAG_MOVE_CANCEL_PX_MOUSE;

            el.classList.add('drag-reorder-pending');

            function removePending() {
                el.classList.remove('drag-reorder-pending');
                if (longTimer) {
                    clearTimeout(longTimer);
                    longTimer = null;
                }
                document.removeEventListener('pointermove', onPendingMove, true);
                document.removeEventListener('pointerup', onPendingUp, true);
                document.removeEventListener('pointercancel', onPendingUp, true);
            }

            function onPendingMove(ev) {
                if (ev.pointerId !== pid) return;
                const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY);
                if (moved > cancelMovePx) {
                    removePending();
                    return;
                }
                if (ptrKind === 'touch' || ptrKind === 'pen') {
                    ev.preventDefault();
                }
            }

            function onPendingUp(ev) {
                if (ev.pointerId !== pid) return;
                removePending();
            }

            longTimer = setTimeout(() => {
                longTimer = null;
                if (listDragHandlePointerIds.has(pid) || activeListDrag) {
                    removePending();
                    return;
                }
                removePending();
                onEnter(id);
            }, LIST_DRAG_LONG_MS);

            document.addEventListener('pointermove', onPendingMove, { passive: false, capture: true });
            document.addEventListener('pointerup', onPendingUp, { capture: true });
            document.addEventListener('pointercancel', onPendingUp, { capture: true });
        },
        { passive: true }
    );
}

function renderFolders() {
    if (!folderSelectMode) folderSelectBarVisible = false;
    folderGrid.innerHTML = '';
    if (folderSelectMode) {
        folderGrid.classList.add('folder-grid--select-mode');
        document.getElementById('homeView')?.classList.add('home-view--select-mode');
        setMultiSelectBarShown(folderMultiSelectBar, folderSelectBarVisible);
        if (homeQuoteFooter) homeQuoteFooter.hidden = true;
    } else {
        folderGrid.classList.remove('folder-grid--select-mode');
        document.getElementById('homeView')?.classList.remove('home-view--select-mode');
        setMultiSelectBarShown(folderMultiSelectBar, false);
        if (homeQuoteFooter) homeQuoteFooter.hidden = false;
    }
    updateFolderSelectChrome();

    if (folderHomeDragHint) {
        folderHomeDragHint.textContent = folderSelectMode
            ? t('home.folderDragHintSelect')
            : t('home.folderDragHint');
    }

    const sortedFolders = [...folders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedFolders.forEach((f) => {
        const count = zikirs.filter(z => z.folderId === f.id).length;
        const seasonalMeta = getSeasonalFolderMeta(f.id);
        const card = document.createElement('div');
        card.className = seasonalMeta ? 'folder-card folder-card--seasonal' : 'folder-card';
        card.dataset.folderId = f.id;
        card.dataset.dragOrderItem = 'folder';
        const checked = selectedFolderIds.has(f.id) ? 'checked' : '';
        const seasonalIcon = seasonalMeta
            ? `<span class="folder-card__seasonal-icon material-icons-outlined" aria-hidden="true">auto_awesome</span>`
            : '';
        const countLine = seasonalMeta
            ? (seasonalMeta.subtitle || t('home.seasonalZikirCount', { count }))
            : `${count} Zikir`;
        card.innerHTML = `
            <button type="button" class="row-drag-handle icon-btn" aria-label="${escapeAttr(t('zikir.dragAria'))}">
                ${GRIP_3LINES_HTML}
            </button>
            <label class="folder-card__check" aria-hidden="true">
                <input type="checkbox" class="folder-select-cb" data-folder-id="${escapeAttr(f.id)}" ${checked} />
            </label>
            ${seasonalIcon}
            <div class="folder-card__text">
                <h3>${escapeHtml(f.name)}</h3>
                <p>${escapeHtml(countLine)}</p>
            </div>
        `;
        const dragHandle = card.querySelector('.row-drag-handle');
        attachListDragLongPress(dragHandle, {
            id: f.id,
            rowElement: card,
            container: folderGrid,
            getSortedIds: getFolderSortedIds,
            onCommit: applyFolderOrder,
            shouldIgnoreDown: () => false
        });
        attachLongPressSelect(card, f.id, {
            onEnter: onFolderLongPressSelect
        });

        const cb = card.querySelector('.folder-select-cb');
        const folderCheckLabel = card.querySelector('.folder-card__check');
        if (folderCheckLabel) {
            folderCheckLabel.addEventListener('click', (ev) => ev.stopPropagation());
            folderCheckLabel.addEventListener('pointerdown', (ev) => ev.stopPropagation(), { passive: true });
        }
        if (cb) {
            let folderCbSyncScheduled = false;
            const syncFolderCheckbox = () => {
                if (folderCbSyncScheduled) return;
                folderCbSyncScheduled = true;
                queueMicrotask(() => {
                    folderCbSyncScheduled = false;
                    if (cb.checked) selectedFolderIds.add(f.id);
                    else selectedFolderIds.delete(f.id);
                    folderSelectBarVisible = true;
                    setMultiSelectBarShown(folderMultiSelectBar, true);
                    updateFolderSelectChrome();
                    renderFolders();
                });
            };
            cb.addEventListener('change', (ev) => {
                ev.stopPropagation();
                syncFolderCheckbox();
            });
            cb.addEventListener('input', (ev) => {
                ev.stopPropagation();
                syncFolderCheckbox();
            });
            cb.addEventListener('click', (ev) => ev.stopPropagation());
        }

        card.addEventListener('click', (e) => {
            if (suppressListNavigation) {
                e.preventDefault();
                e.stopPropagation();
                suppressListNavigation = false;
                return;
            }
            if (folderSelectMode) {
                if (e.target.closest('.row-drag-handle') || e.target.closest('.folder-card__check')) return;
                toggleFolderSelected(f.id);
                return;
            }
            showView('folderDetailView', f.id);
        });
        folderGrid.appendChild(card);
    });

    const atFolderLimit = !canAddFolder();
    if (newFolderBtn) {
        newFolderBtn.style.display = folderSelectMode ? 'none' : 'flex';
        newFolderBtn.classList.toggle('is-premium-locked', atFolderLimit && isPremiumOnlyFeatureLocked());
    }
    if (folderLimitWarning) {
        folderLimitWarning.classList.toggle('visible', !folderSelectMode && atFolderLimit);
    }

    if (folderSelectMode) {
        clearUpdateBannerDom(updateBannerSlot, folderGrid);
    } else {
        placeUpdateBanner(sortedFolders.length, folderGrid, updateBannerSlot, {
            onDismiss: () => renderFolders()
        });
    }
}

function getEsmaListEntryForZikir(z) {
    const m = /^z_e_(\d+)$/.exec(z && z.id != null ? String(z.id) : '');
    if (!m) return null;
    const idx = parseInt(m[1], 10);
    return ESMA_LIST[idx] || null;
}

function getEsmaDefaultFaziletForZikir(z) {
    const e = getEsmaListEntryForZikir(z);
    return e && e.fazilet ? String(e.fazilet) : '';
}

function getEffectiveFazilet(z) {
    if (!z) return '';
    if (localeUsesEnglishMeals(appSettings.locale)) return '';
    if (z.libraryId) {
        const knownF = getKnownLibraryFaziletTexts(z.libraryId);
        const curF = z.fazilet != null ? String(z.fazilet).trim() : '';
        if (curF && !knownF.has(curF)) return curF;
        return getLibraryFaziletForLocale(z.libraryId);
    }
    if (z.fazilet != null && String(z.fazilet).trim()) return String(z.fazilet).trim();
    return getEsmaDefaultFaziletForZikir(z);
}

function renderFolderDetail() {
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    if (!zikirSelectMode) zikirSelectBarVisible = false;
    folderDetailTitle.textContent = folder.name;

    const q = (folderSearchQuery || '').trim().toLocaleLowerCase(getLocaleTag());
    const fZikirsAll = zikirs.filter(z => z.folderId === currentFolderId);
    const fZikirs = fZikirsAll.filter(z => {
        if (folderFavOnly && !z.favorite) return false;
        if (!q) return true;
        const name = getZikirDisplayName(z).toLocaleLowerCase(getLocaleTag());
        const meaning = getZikirDisplayMeaning(z).toLocaleLowerCase(getLocaleTag());
        const arabic = (z.arabic || '');
        const fz = getEffectiveFazilet(z).toLocaleLowerCase(getLocaleTag());
        return name.includes(q) || meaning.includes(q) || arabic.includes(q) || fz.includes(q);
    }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const canDragZikir = !q && !folderFavOnly && !isSeasonalFolderId(currentFolderId);

    if (folderZikirDragHint) {
        if (isSeasonalFolderId(currentFolderId)) {
            folderZikirDragHint.classList.add('drag-hint--muted');
            folderZikirDragHint.textContent = t('folder.seasonalDragHint');
        } else if (canDragZikir) {
            folderZikirDragHint.classList.remove('drag-hint--muted');
            folderZikirDragHint.textContent = zikirSelectMode
                ? t('folder.zikirDragHintSelect')
                : t('folder.zikirDragHint');
        } else {
            if (zikirSelectMode) {
                folderZikirDragHint.classList.remove('drag-hint--muted');
                folderZikirDragHint.textContent = t('folder.zikirDragHintSelectNoReorder');
            } else {
                folderZikirDragHint.textContent = t('folder.zikirDragHintReorderDisabled');
                folderZikirDragHint.classList.add('drag-hint--muted');
            }
        }
    }

    folderZikirList.innerHTML = '';
    if (zikirSelectMode) {
        folderZikirList.classList.add('zikir-list--select-mode');
        document.getElementById('folderDetailView')?.classList.add('folder-detail--select-mode');
        setMultiSelectBarShown(zikirMultiSelectBar, zikirSelectBarVisible);
    } else {
        folderZikirList.classList.remove('zikir-list--select-mode');
        document.getElementById('folderDetailView')?.classList.remove('folder-detail--select-mode');
        setMultiSelectBarShown(zikirMultiSelectBar, false);
    }
    updateZikirSelectChrome();

    fZikirs.forEach((z) => {
        const li = document.createElement('li');
        li.dataset.zikirId = z.id;
        const favIcon = z.favorite ? 'star' : 'star_border';
        const favTitle = z.favorite ? t('zikir.favRemove') : t('zikir.favAdd');
        const displayMeaning = getZikirDisplayMeaning(z);
        const meaningPrev = displayMeaning
            ? displayMeaning.length > 40
                ? displayMeaning.substring(0, 40) + '…'
                : displayMeaning
            : '';
        const meaningBlock = meaningPrev ? `<p>${escapeHtml(meaningPrev)}</p>` : '';
        const displayName = getZikirDisplayName(z);
        const arabicLine = shouldShowZikirArabicSubline(z, displayName)
            ? `<p class="zikir-arabic" dir="rtl" lang="ar">${escapeHtml(String(z.arabic).trim())}</p>`
            : '';
        const zChecked = selectedZikirIds.has(z.id) ? 'checked' : '';
        const dragBtnHtml = canDragZikir
            ? `<button type="button" class="row-drag-handle icon-btn" aria-label="${escapeAttr(t('zikir.dragAria'))}">${GRIP_3LINES_HTML}</button>`
            : '';
        li.innerHTML = `
            ${dragBtnHtml}
            <label class="zikir-row__check" aria-hidden="true">
                <input type="checkbox" class="zikir-select-cb" data-zikir-id="${escapeAttr(z.id)}" ${zChecked} />
            </label>
            <div class="zikir-row__inner">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap: 12px;">
                    <div style="min-width:0; flex:1;">
                        <h3 style="margin:0;" class="${localeUsesRtlUiScript(appSettings.locale) ? 'arabic-text' : ''}"${localeUsesRtlUiScript(appSettings.locale) ? ` dir="rtl" lang="${normalizeAppLocale(appSettings.locale) === 'ur' ? 'ur' : 'ar'}"` : ''}>${escapeHtml(displayName)}</h3>
                        ${arabicLine}
                    </div>
                    <button class="icon-btn fav-btn" data-id="${escapeAttr(z.id)}" aria-label="${escapeAttr(favTitle)}" title="${escapeAttr(favTitle)}" style="padding:0.25rem; flex-shrink:0;">
                        <span class="material-icons-outlined" style="color: ${z.favorite ? 'var(--primary-green)' : 'var(--text-gray)'}">${favIcon}</span>
                    </button>
                </div>
                ${meaningBlock}
                <div class="meta">
                    <span>${escapeHtml(t('zikir.metaTarget'))} ${z.target} 
                        <button class="edit-target-btn" data-id="${escapeAttr(z.id)}" aria-label="${escapeAttr(t('zikir.editAria'))}" title="${escapeAttr(t('zikir.editAria'))}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>
                        <button class="edit-target-btn copy-btn" data-id="${escapeAttr(z.id)}" aria-label="${escapeAttr(t('zikir.copyAria'))}" title="${escapeAttr(t('zikir.copyAria'))}"><span class="material-icons-outlined" style="font-size:16px;">content_copy</span></button>
                    </span>
                    <span>${escapeHtml(t('zikir.metaRead'))} ${z.count}</span>
                </div>
            </div>
        `;

        if (canDragZikir) {
            li.dataset.dragOrderItem = 'zikir';
            const zDrag = li.querySelector('.row-drag-handle');
            if (zDrag) {
                attachListDragLongPress(zDrag, {
                    id: z.id,
                    rowElement: li,
                    container: folderZikirList,
                    getSortedIds: getZikirSortedIdsInCurrentFolder,
                    onCommit: applyZikirOrder,
                    shouldIgnoreDown: () => false
                });
            }
        }

        attachLongPressSelect(li, z.id, { onEnter: onZikirLongPressSelect });

        const zcb = li.querySelector('.zikir-select-cb');
        const zikirCheckLabel = li.querySelector('.zikir-row__check');
        if (zikirCheckLabel) {
            zikirCheckLabel.addEventListener('click', (ev) => ev.stopPropagation());
            zikirCheckLabel.addEventListener('pointerdown', (ev) => ev.stopPropagation(), { passive: true });
        }
        if (zcb) {
            let zikirCbSyncScheduled = false;
            const syncZikirCheckbox = () => {
                if (zikirCbSyncScheduled) return;
                zikirCbSyncScheduled = true;
                queueMicrotask(() => {
                    zikirCbSyncScheduled = false;
                    if (zcb.checked) selectedZikirIds.add(z.id);
                    else selectedZikirIds.delete(z.id);
                    zikirSelectBarVisible = true;
                    setMultiSelectBarShown(zikirMultiSelectBar, true);
                    updateZikirSelectChrome();
                    renderFolderDetail();
                });
            };
            zcb.addEventListener('change', (ev) => {
                ev.stopPropagation();
                syncZikirCheckbox();
            });
            zcb.addEventListener('input', (ev) => {
                ev.stopPropagation();
                syncZikirCheckbox();
            });
            zcb.addEventListener('click', (ev) => ev.stopPropagation());
        }

        li.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.fav-btn');
            if (favBtn) {
                const id = favBtn.getAttribute('data-id');
                const item = zikirs.find(x => x.id === id);
                if (item) {
                    item.favorite = !item.favorite;
                    saveData();
                    renderFolderDetail();
                }
                return;
            }
            if (e.target.closest('.edit-target-btn') && !e.target.closest('.copy-btn')) {
                openEditModal(z.id);
                return;
            }
            if (e.target.closest('.copy-btn')) {
                openCopyModal(z.id);
                return;
            }
            if (suppressListNavigation) {
                e.preventDefault();
                e.stopPropagation();
                suppressListNavigation = false;
                return;
            }
            if (zikirSelectMode) {
                if (e.target.closest('.row-drag-handle') || e.target.closest('.zikir-row__check')) return;
                toggleZikirSelected(z.id);
                return;
            }
            showView('counterView', z.id);
        });
        folderZikirList.appendChild(li);
    });

    const maxPerFolder = getMaxZikirsPerFolder();
    const atZikirLimit =
        Number.isFinite(maxPerFolder) && fZikirsAll.length >= maxPerFolder;
    if (isSeasonalFolderId(currentFolderId)) {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.remove('visible');
    } else if (currentFolderId === 'f_esma') {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.remove('visible');
    } else {
        openAddZikirModalBtn.style.display = zikirSelectMode ? 'none' : 'flex';
        openAddZikirModalBtn.classList.toggle(
            'is-premium-locked',
            atZikirLimit && isPremiumOnlyFeatureLocked()
        );
        zikirLimitWarning.classList.toggle(
            'visible',
            atZikirLimit && !isPremiumOnlyFeatureLocked()
        );
    }
}

function applyQuranCounterLayout(zikir) {
    const counterViewEl = document.getElementById('counterView');
    const quranBody = document.getElementById('quranZikirBody');
    const quranAr = document.getElementById('quranZikirArabic');
    const quranSub = document.getElementById('quranZikirMeaning');
    const isQuran = isQuranZikir(zikir);
    const layout = isQuran ? normalizeQuranCounterLayout(zikir.quranCounterLayout) : 'classic';
    const readMode = normalizeQuranZikirDisplayMode(
        zikir.quranDisplayMode || getDefaultQuranReadModeForLocale(appSettings.locale),
        appSettings.locale
    );

    counterViewEl?.classList.toggle('counter-view--quran', isQuran);
    QURAN_COUNTER_LAYOUTS.forEach((name) => {
        counterViewEl?.classList.remove(`counter-view--quran-${name}`);
    });
    if (isQuran) counterViewEl?.classList.add(`counter-view--quran-${layout}`);

    if (!isQuran || layout === 'classic') {
        if (quranBody) quranBody.hidden = true;
        return { useHeaderAyahText: isQuran };
    }

    const ar = String(zikir.arabic || '').trim();
    const sub = String(zikir.meaning || '').trim();
    if (quranAr) quranAr.textContent = ar;
    if (quranSub) {
        quranSub.textContent = sub;
        quranSub.hidden = readMode === 'ar-only' || !sub;
    }
    if (quranBody) {
        quranBody.hidden = false;
        quranBody.scrollTop = 0;
    }
    return { useHeaderAyahText: false };
}

// Sayaç değerleri: her tıkta değişen ve hafif olması gereken kısım.
// Başlık/Arapça/anlam gibi sabit öğeler updateCounterUI'da, yalnızca ekran açılışında güncellenir.
function updateCounterValues(zikir, target) {
    // Mevcut turdaki okuma: tam tur sonrası (33, 66…) yeni turun başı → 0 göster;
    // geri alınca önce 0, bir basım daha önceki turun son adımına düşer.
    let currentRoundDisplay = 0;
    if (zikir.count > 0) {
        const r = zikir.count % target;
        currentRoundDisplay = r === 0 ? 0 : r;
    }

    if (countDisplay) countDisplay.textContent = formatCounterDisplay(currentRoundDisplay);
    if (totalDisplay) totalDisplay.textContent = formatCounterDisplay(zikir.count);
    if (stealthCounter) stealthCounter.textContent = formatCounterDisplay(zikir.count);

    const completedRounds = Math.floor(zikir.count / target);
    if (roundDisplay) {
        if (completedRounds > 0) {
            roundDisplay.textContent = formatCounterDisplay(completedRounds);
            roundDisplay.classList.toggle('round-badge--compact', completedRounds >= 1000);
            roundDisplay.classList.add('visible');
        } else {
            roundDisplay.classList.remove('visible', 'round-badge--compact');
        }
    }

    let circleProgress = 0;
    if (zikir.count > 0 && zikir.count % target !== 0) {
        circleProgress = (zikir.count % target) / target;
    }
    const offset = CIRCLE_CIRCUMFERENCE - circleProgress * CIRCLE_CIRCUMFERENCE;

    if (zikir.count > 0 && zikir.count % target === 0) {
        if (mainCounterBtn) {
            const now = performance.now();
            if (now - lastCounterGlowBurstAt >= COUNTER_GLOW_BURST_MIN_MS) {
                lastCounterGlowBurstAt = now;
                mainCounterBtn.classList.remove('glow-burst');
                void mainCounterBtn.offsetWidth;
                mainCounterBtn.classList.add('glow-burst');
            }
        }
        /* Titreşim: yalnızca incrementCounter içinde (çift tetiklenmesin) */
    }
    if (progressCircle) progressCircle.style.strokeDashoffset = offset;
}

function updateCounterUI() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir) return;

    const target = safeZikirTarget(zikir);
    if (zikir.target !== target) {
        zikir.target = target;
        saveData();
    }

    const { useHeaderAyahText } = applyQuranCounterLayout(zikir);
    const isQuran = isQuranZikir(zikir);
    const reviseQuranDisplayBtn = document.getElementById('reviseQuranDisplayBtn');
    if (reviseQuranDisplayBtn) reviseQuranDisplayBtn.hidden = !isQuran;
    const showHeaderZikirMeta = !isQuran || useHeaderAyahText;
    const counterDisplayName = getZikirDisplayName(zikir);
    const rtlUiScript = localeUsesRtlUiScript(appSettings.locale);
    const headerTitles = zikirTitle?.closest('.header-titles');
    if (headerTitles) headerTitles.classList.toggle('header-titles--rtl-ui', rtlUiScript);
    if (zikirTitle) {
        zikirTitle.textContent = counterDisplayName;
        applyArabicTextAttrs(zikirTitle, rtlUiScript);
    }
    if (zikirArabicHeader) {
        const ar = zikir.arabic && String(zikir.arabic).trim();
        if (showHeaderZikirMeta && shouldShowZikirArabicSubline(zikir, counterDisplayName)) {
            zikirArabicHeader.textContent = ar;
            zikirArabicHeader.style.display = 'block';
        } else {
            zikirArabicHeader.textContent = '';
            zikirArabicHeader.style.display = 'none';
        }
    }
    if (zikirNote) {
        const m = showHeaderZikirMeta ? getZikirDisplayMeaning(zikir) : '';
        const fz = showHeaderZikirMeta ? getEffectiveFazilet(zikir) : '';
        zikirNote.textContent = m && fz ? `${m}\n\n${fz}` : m || fz;
        zikirNote.classList.toggle('zikir-note--esma-detail', !!fz);
    }
    const zikirHeaderScroll = document.getElementById('zikirHeaderScroll');
    if (zikirHeaderScroll) zikirHeaderScroll.scrollTop = 0;

    // Sabit öğeler (hedef sayısı, gizli mod başlığı) — tık başına değişmez, burada kalır.
    if (targetDisplay) targetDisplay.textContent = formatCounterDisplay(target);
    if (stealthZikirName) stealthZikirName.textContent = counterDisplayName;

    // Tık başına değişen değerler ortak hafif fonksiyonda.
    updateCounterValues(zikir, target);
}

// ===================== HARDWARE LOGIC =====================

let wakeLockRef = null;

async function nativeKeepScreenAwake(on) {
    if (!isCapacitorNative()) return;
    try {
        const { KeepAwake } = await import('@capacitor-community/keep-awake');
        if (on) await KeepAwake.keepAwake();
        else await KeepAwake.allowSleep();
    } catch (err) {
        console.warn('KeepAwake:', err);
    }
}

async function requestWakeLock() {
    if (!appSettings.wakeLock) return;
    if (isCapacitorNative()) {
        await nativeKeepScreenAwake(true);
        return;
    }
    try {
        if ('wakeLock' in navigator && !wakeLockRef) {
            wakeLockRef = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('WakeLock error:', err);
    }
}

async function releaseWakeLock() {
    if (isCapacitorNative()) {
        await nativeKeepScreenAwake(false);
        wakeLockRef = null;
        return;
    }
    if (wakeLockRef) {
        wakeLockRef.release().then(() => { wakeLockRef = null; }).catch(() => { wakeLockRef = null; });
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !appSettings.wakeLock) return;
    const counterView = document.getElementById('counterView');
    if (counterView && counterView.classList.contains('active')) void requestWakeLock();
});

function getEffectiveCounterTickSound() {
    if (!PREMIUM_LIVE || !isPremium()) return 'classic';
    return normalizeCounterTickSound(appSettings.counterTickSound);
}

function playTickSound(isTarget, { force = false, profile } = {}) {
    if (!force && !appSettings.sound) return;
    const sound = profile || getEffectiveCounterTickSound();
    playCounterTickSound(sound, isTarget);
}

function handleVibration(isTarget) {
    runCounterVibration(isTarget, {
        vibrationTap: appSettings.vibrationTap,
        vibrationTarget: appSettings.vibrationTarget
    });
}

function incrementCounter() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir) return;

    zikir.count++;
    logClick(zikir.id);
    const target = safeZikirTarget(zikir);
    updateCounterValues(zikir, target);
    maybeRefreshZikirStatsModal();

    const isTargetHit = zikir.count % target === 0;
    handleVibration(isTargetHit);
    playTickSound(isTargetHit);
}

function decrementCounter() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir || zikir.count <= 0) return;

    zikir.count--;
    logDecrement(zikir.id);
    updateCounterValues(zikir, safeZikirTarget(zikir));
    maybeRefreshZikirStatsModal();
}

function maybeRefreshZikirStatsModal() {
    if (zikirStatsOverlay && zikirStatsOverlay.classList.contains('active')) renderZikirStats();
}

// ===================== LIBRARY LOGIC =====================
function libraryItemSearchHaystack(z) {
    const kw = (z.keywords != null ? String(z.keywords) : '');
    return `${z.name} ${z.meaning} ${z.context} ${z.source} ${kw}`.toLocaleLowerCase(getLocaleTag());
}

const LIBRARY_CARD_CONTEXT_MAX = 120;

function libraryCardSubtitle(z) {
    if (z.category === 'zikir') {
        const m = (z.meaning && String(z.meaning).trim()) || '';
        if (m.length > 52) return m.substring(0, 49) + '…';
        return m;
    }
    const raw = (z.context && String(z.context).trim()) || '';
    if (raw.length > LIBRARY_CARD_CONTEXT_MAX) return raw.substring(0, LIBRARY_CARD_CONTEXT_MAX - 1) + '…';
    if (raw) return raw;
    if (z.meaning && z.meaning.length > 52) return z.meaning.substring(0, 49) + '…';
    return z.meaning || '';
}

/** Arama metnindeki her kelime yığında geçmeli (boşlukla ayrılmış). */
function libraryMatchesSearch(z, rawQuery) {
    const q = (rawQuery || '').trim();
    if (!q) return true;
    const hay = libraryItemSearchHaystack(z);
    const tokens = q.toLocaleLowerCase(getLocaleTag()).split(/\s+/).filter(Boolean);
    return tokens.every(t => hay.includes(t));
}

function appendLibraryCard(parent, z, { locked = false } = {}) {
    const card = document.createElement(locked ? 'button' : 'div');
    if (locked) card.type = 'button';
    card.className = 'library-card' + (locked ? ' library-card--premium-locked' : '');

    const body = document.createElement('div');
    body.className = locked ? 'library-card__blur' : 'library-card__body';

    if (locked) {
        const star = document.createElement('span');
        star.className = 'library-card__premium-star';
        star.setAttribute('aria-hidden', 'true');
        star.textContent = '*';
        card.appendChild(star);
    }

    const h3 = document.createElement('h3');
    h3.textContent = z.name;
    applyArabicTextAttrs(h3, localeUsesRtlUiScript(appSettings.locale));
    const p = document.createElement('p');
    p.textContent = libraryCardSubtitle(z);
    body.appendChild(h3);
    body.appendChild(p);
    card.appendChild(body);

    if (locked) {
        card.setAttribute('aria-label', t('library.premiumLockedAria'));
        card.addEventListener('click', () => showPremiumLibraryUpsell());
    } else {
        card.addEventListener('click', () => openLibraryDetail(z));
    }

    parent.appendChild(card);
}

function getLockedLibraryItemsForCategory(category) {
    const locked = [];
    getZikirLibrary(false)
        .filter((z) => z.category === category)
        .forEach((z) => {
            if (isBaseLibraryItemPremiumLocked(z.id, { premiumLive: PREMIUM_LIVE, isPremium: false })) {
                locked.push(z);
            }
        });
    locked.push(...getZikirLibraryPremiumOnly().filter((z) => z.category === category));
    return locked;
}

function appendLibraryPremiumTeaser(parent, category) {
    const lockedLib = getLockedLibraryItemsForCategory(category);
    if (!lockedLib.length) return;

    const preview = lockedLib.slice(0, LIBRARY_PREMIUM_PREVIEW_COUNT);
    const remaining = Math.max(0, lockedLib.length - preview.length);

    preview.forEach((z) => appendLibraryCard(parent, z, { locked: true }));

    if (remaining > 0) {
        const dots = document.createElement('div');
        dots.className = 'library-premium-continued';
        dots.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dots.appendChild(dot);
        }
        parent.appendChild(dots);

        const more = document.createElement('p');
        more.className = 'library-premium-more';
        more.textContent = t('library.premiumMore', {
            count: remaining.toLocaleString(getLocaleTag())
        });
        parent.appendChild(more);
    }
}

function isLibraryCardLocked(z, premiumUser) {
    if (premiumUser) return false;
    if (!PREMIUM_LIVE) return false;
    if (String(z.id).startsWith('plib_')) return true;
    return isBaseLibraryItemPremiumLocked(z.id, { premiumLive: PREMIUM_LIVE, isPremium: premiumUser });
}

function renderLibrary() {
    void ensurePremiumLibraryLoaded().then(() => renderLibraryContent());
}

function renderLibraryContent() {
    libraryGrid.innerHTML = '';
    const q = (librarySearchQuery || '').trim();
    const searchActive = q.length > 0;
    const premiumUser = isPremium();
    const sourceLib = getZikirLibrary(premiumUser);
    const filteredBase = searchActive
        ? sourceLib
        : sourceLib.filter((z) => z.category === activeLibraryCat);
    const filtered = filteredBase.filter((z) => libraryMatchesSearch(z, q));

    filtered.forEach((z) => {
        const locked = isLibraryCardLocked(z, premiumUser);
        if (!premiumUser && !searchActive && isPremiumOnlyFeatureLocked() && locked) return;
        appendLibraryCard(libraryGrid, z, { locked });
    });

    if (!premiumUser && !searchActive && isPremiumOnlyFeatureLocked()) {
        appendLibraryPremiumTeaser(libraryGrid, activeLibraryCat);
    }
}

function openLibraryDetail(z) {
    selectedLibraryItem = z;
    const detailName = z.name || '';
    libDetailName.textContent = detailName;
    applyArabicTextAttrs(libDetailName, localeUsesRtlUiScript(appSettings.locale));
    const ar = z.arabic && String(z.arabic).trim();
    if (libDetailArabic) {
        if (shouldShowZikirArabicSubline(z, detailName) && ar) {
            libDetailArabic.textContent = ar;
            libDetailArabic.hidden = false;
        } else {
            libDetailArabic.textContent = '';
            libDetailArabic.hidden = true;
        }
    }
    const meaning = z.meaning && String(z.meaning).trim();
    if (libDetailMeaning) {
        libDetailMeaning.textContent = meaning || '';
        libDetailMeaning.hidden = !meaning;
    }
    const ctx = z.context && String(z.context).trim();
    if (libDetailContextLabel) {
        const localeIsTr = normalizeAppLocale(appSettings.locale) === 'tr';
        if (z.category === 'zikir') {
            libDetailContextLabel.textContent = t('library.detailVirtueZikir');
        } else {
            libDetailContextLabel.textContent = t(
                localeIsTr ? 'library.detailVirtueDua' : 'library.detailWhenDua'
            );
        }
    }
    if (libDetailContext) libDetailContext.textContent = ctx || '';
    if (libDetailContextWrap) libDetailContextWrap.hidden = !ctx;
    openOverlay('libraryDetailOverlay');
}

// ===================== STATS LOGIC =====================
const CHART_INNER_HEIGHT_PX = 104;

function dayHistoryTotal(dayKey) {
    const block = history && history[dayKey];
    if (!block || typeof block !== 'object') return 0;
    return Object.values(block).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function formatDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLastNDayKeys(n) {
    const keys = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        keys.push(formatDateKey(d));
    }
    return keys;
}

function getDaysInYear(year = new Date().getFullYear()) {
    const keys = [];
    const cur = new Date(year, 0, 1);
    const end = year === new Date().getFullYear() ? new Date() : new Date(year, 11, 31);
    while (cur <= end) {
        keys.push(formatDateKey(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return keys;
}

function getYearMonthKeys(year = new Date().getFullYear()) {
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

function zikirClicksOnDay(dayKey, zid) {
    const v = history && history[dayKey] && history[dayKey][zid];
    return v ? Number(v) || 0 : 0;
}

function totalClicksForMonth(ym, zid) {
    let sum = 0;
    const prefix = `${ym}-`;
    if (!history || typeof history !== 'object') return 0;
    Object.keys(history).forEach((day) => {
        if (!day.startsWith(prefix)) return;
        sum += zid ? zikirClicksOnDay(day, zid) : dayHistoryTotal(day);
    });
    return sum;
}

function totalClicksForYear(year, zid) {
    let sum = 0;
    const prefix = `${year}-`;
    if (!history || typeof history !== 'object') return 0;
    Object.keys(history).forEach((day) => {
        if (!day.startsWith(prefix)) return;
        sum += zid ? zikirClicksOnDay(day, zid) : dayHistoryTotal(day);
    });
    return sum;
}

/** Yıllık grafik: son 5 takvim yılı (ör. 2022–2026). */
function getHistoryYearRange(count = 5) {
    const current = new Date().getFullYear();
    const start = current - (count - 1);
    const out = [];
    for (let y = start; y <= current; y++) out.push(String(y));
    return out;
}

function getStatPeriodDayKeys(tab) {
    if (tab === 'daily') return [getTodayString()];
    if (tab === 'weekly') return getLastNDayKeys(7);
    return getDaysInYear();
}

function sumClicksInDayKeys(dayKeys, zid) {
    return dayKeys.reduce((acc, ds) => acc + (zid ? zikirClicksOnDay(ds, zid) : dayHistoryTotal(ds)), 0);
}

function buildChartBuckets(tab, zid) {
    const today = getTodayString();
    const locale = getLocaleTag();

    if (tab === 'daily' || tab === 'weekly') {
        const days = getLastNDayKeys(7);
        return {
            density: 'default',
            headingKey: 'stats.chartLast7Days',
            buckets: days.map((ds) => {
                const d = new Date(`${ds}T12:00:00`);
                return {
                    label: d.toLocaleDateString(locale, { weekday: 'short' }),
                    val: zid ? zikirClicksOnDay(ds, zid) : dayHistoryTotal(ds),
                    highlight: ds === today
                };
            })
        };
    }
    if (tab === 'monthly') {
        const months = getYearMonthKeys();
        const curMonth = today.slice(0, 7);
        return {
            density: 'months',
            headingKey: 'stats.chartYearMonths',
            buckets: months.map((ym) => {
                const d = new Date(`${ym}-01T12:00:00`);
                return {
                    label: d.toLocaleDateString(locale, { month: 'short' }),
                    val: totalClicksForMonth(ym, zid),
                    highlight: ym === curMonth
                };
            })
        };
    }

    const years = getHistoryYearRange();
    const curYear = String(new Date().getFullYear());
    return {
        density: 'years',
        headingKey: 'stats.chartByYear',
        buckets: years.map((year) => ({
            label: year,
            val: totalClicksForYear(year, zid),
            highlight: year === curYear
        }))
    };
}

/** Sol eksen üst sınırı: veriye göre yukarı yuvarla (6849 → 6900). */
function ceilToChartTop(n) {
    const v = Number(n) || 0;
    if (v <= 0) return 100;
    return Math.ceil(v / 100) * 100;
}

function chartScaleMax(values) {
    return ceilToChartTop(Math.max(...values, 0));
}

function computeBarHeightPx(val, scaleMax) {
    if (!val || val <= 0) return 4;
    const max = scaleMax > 0 ? scaleMax : 100;
    const floorPx = 6;
    const t = Math.min(1, val / max);
    return Math.max(floorPx, Math.round(floorPx + t * (CHART_INNER_HEIGHT_PX - floorPx)));
}

function chartYAxisLabels(values, scaleMax) {
    const top = scaleMax > 0 ? scaleMax : chartScaleMax(values);
    if (top <= 0) return { top: 100, mid: 50, bottom: 0 };
    const mid = Math.max(50, Math.round(top / 2 / 100) * 100);
    return { top, mid, bottom: 0 };
}

function renderBarChart(chartEl, yAxisEl, buckets, density) {
    const values = buckets.map((b) => b.val);
    const scaleMax = chartScaleMax(values);
    const axis = chartYAxisLabels(values, scaleMax);

    if (yAxisEl) {
        yAxisEl.innerHTML = `
            <span>${axis.top}</span>
            <span>${axis.mid}</span>
            <span>${axis.bottom}</span>
        `;
    }
    if (!chartEl) return;

    chartEl.innerHTML = '';
    chartEl.classList.remove('css-chart--dense', 'css-chart--months', 'css-chart--years', 'css-chart--week');
    if (density === 'dense') chartEl.classList.add('css-chart--dense');
    if (density === 'months') chartEl.classList.add('css-chart--months');
    if (density === 'years') chartEl.classList.add('css-chart--years');
    if (density === 'default') chartEl.classList.add('css-chart--week');

    buckets.forEach((dt) => {
        const group = document.createElement('div');
        group.className = 'chart-bar-group';
        const barH = computeBarHeightPx(dt.val, scaleMax);
        const col = dt.val === 0 ? 'var(--glass-border)' : 'var(--primary-green)';
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.dataset.tooltip = t('stats.chartTooltip', { count: dt.val });
        bar.style.height = `${barH}px`;
        bar.style.background = col;
        const lab = document.createElement('div');
        lab.className = 'chart-label';
        if (dt.highlight) lab.classList.add('chart-label--current');
        lab.textContent = dt.label;
        group.appendChild(bar);
        group.appendChild(lab);
        chartEl.appendChild(group);
    });
}

function renderStats() {
    activeStatTab = ensureUnlockedStatTab(activeStatTab);
    statTabBtns.forEach((b) => {
        b.classList.toggle('active', (b.getAttribute('data-tab') || 'daily') === activeStatTab);
    });
    syncPremiumStatTabsUI();

    const isAllTime = activeStatTab === 'allTime';
    if (statsPeriodPanel) statsPeriodPanel.classList.toggle('hidden', isAllTime);
    if (statsAllTimePanel) statsAllTimePanel.classList.toggle('hidden', !isAllTime);
    if (isAllTime) {
        renderAllTimeStats();
        return;
    }

    if (!statMostClicked || !statMostClickedCount || !statLastClicked || !activityChart) return;
    const targetDays = getStatPeriodDayKeys(activeStatTab);

    // 1) En Çok Çekilen ve Son çekilen
    let totalClicksPerZikir = {};
    targetDays.forEach(day => {
        if(history[day]) {
            Object.keys(history[day]).forEach(zid => {
                totalClicksPerZikir[zid] = (totalClicksPerZikir[zid]||0) + history[day][zid];
            });
        }
    });

    let topZikirId = null;
    let topZikirCount = 0;
    for (const zid in totalClicksPerZikir) {
        if (totalClicksPerZikir[zid] > topZikirCount) {
            topZikirCount = totalClicksPerZikir[zid];
            topZikirId = zid;
        }
    }

    if (topZikirId) {
        const z = zikirs.find(x => x.id === topZikirId);
        statMostClicked.textContent = z ? getZikirDisplayName(z) : t('stats.unknown');
        statMostClickedCount.textContent = t('stats.clicksUnit', { count: topZikirCount });
    } else {
        statMostClicked.textContent = '-';
        statMostClickedCount.textContent = t('stats.noData');
    }

    // Son çekilen (genel)
    let lastZikir = [...zikirs].sort((a,b) => b.lastClicked - a.lastClicked)[0];
    if (lastZikir && lastZikir.lastClicked > 0) {
        statLastClicked.textContent = getZikirDisplayName(lastZikir);
    } else {
        statLastClicked.textContent = '-';
    }

    // Seçili dönemde en yüksek gün
    let bestDayKey = null;
    let bestDayTotal = 0;
    targetDays.forEach((dayKey) => {
        const tot = dayHistoryTotal(dayKey);
        if (tot > bestDayTotal) {
            bestDayTotal = tot;
            bestDayKey = dayKey;
        } else if (tot === bestDayTotal && tot > 0 && bestDayKey != null && dayKey > bestDayKey) {
            bestDayKey = dayKey;
        }
    });
    if (statBestDayDate && statBestDayCount) {
        if (bestDayKey && bestDayTotal > 0) {
            const bd = new Date(`${bestDayKey}T12:00:00`);
            statBestDayDate.textContent = bd.toLocaleDateString(getLocaleTag(), {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            statBestDayCount.textContent = t('stats.dayTotal', {
                count: bestDayTotal.toLocaleString(getLocaleTag())
            });
        } else {
            statBestDayDate.textContent = '-';
            statBestDayCount.textContent = t('stats.noData');
        }
    }

    const chartPack = buildChartBuckets(activeStatTab);
    const statsChartHeading = document.getElementById('statsChartHeading');
    if (statsChartHeading) statsChartHeading.textContent = t(chartPack.headingKey);
    renderBarChart(activityChart, document.getElementById('chartYAxis'), chartPack.buckets, chartPack.density);
}

function renderAllTimeStats() {
    const locale = getLocaleTag();
    const ctx = getAllTimeRenderContext();
    const total = ctx.total || 0;
    const days = ctx.days;
    const avg = days > 0 ? Math.round(total / days) : 0;
    const installed = ctx.installedAt;

    if (allTimeTotalEl) {
        allTimeTotalEl.textContent = total.toLocaleString(locale);
    }
    if (allTimeSinceEl) {
        allTimeSinceEl.textContent =
            installed && /^\d{4}-\d{2}-\d{2}$/.test(installed)
                ? t('stats.allTimeSince', { date: formatStatsDateKey(installed) })
                : '';
    }
    if (allTimeDaysEl) {
        allTimeDaysEl.textContent = t('stats.allTimeDays', { count: days.toLocaleString(locale) });
    }
    if (allTimeAvgEl) {
        allTimeAvgEl.textContent = t('stats.allTimeAvg', { count: avg.toLocaleString(locale) });
    }

    const slices = buildLifetimeSlices(ctx.byZikir);
    const sliceIds = new Set(slices.map((s) => s.zid));
    if (!allTimeSelectedZid || !sliceIds.has(allTimeSelectedZid)) {
        allTimeSelectedZid = slices.length ? slices[0].zid : null;
    }
    const selectedSlice = slices.find((s) => s.zid === allTimeSelectedZid) || null;

    if (allTimeDonutEl) {
        allTimeDonutEl.replaceChildren();
        if (total <= 0 || !slices.length) {
            allTimeDonutEl.classList.add('all-time-donut--empty');
            const empty = document.createElement('div');
            empty.className = 'all-time-donut__empty';
            empty.textContent = t('stats.allTimeEmpty');
            allTimeDonutEl.appendChild(empty);
        } else {
            allTimeDonutEl.classList.remove('all-time-donut--empty');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 100 100');
            svg.setAttribute('class', 'all-time-donut__svg');
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', t('stats.allTimeDonutAria', { count: total.toLocaleString(locale) }));

            const cx = 50;
            const cy = 50;
            const rOuter = 42;
            const rInner = 28;
            let angle = -Math.PI / 2;

            slices.forEach((slice) => {
                const sweep = (slice.count / total) * 2 * Math.PI;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', donutSlicePath(cx, cy, rOuter, rInner, angle, angle + sweep));
                path.setAttribute('fill', slice.color);
                path.setAttribute('class', 'all-time-donut__slice');
                if (slice.zid === allTimeSelectedZid) path.classList.add('is-selected');
                path.dataset.zid = slice.zid;
                path.addEventListener('click', () => {
                    allTimeSelectedZid = slice.zid;
                    renderAllTimeStats();
                });
                svg.appendChild(path);
                angle += sweep;
            });
            allTimeDonutEl.appendChild(svg);
        }
    }

    if (allTimeDonutFocusEl) {
        if (selectedSlice && total > 0) {
            const pct = (selectedSlice.count / total) * 100;
            const pctStr = pct.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            allTimeDonutFocusEl.hidden = false;
            allTimeDonutFocusEl.innerHTML =
                `<span class="all-time-donut-focus__name">${escapeHtml(selectedSlice.label)}</span>` +
                `<span class="all-time-donut-focus__meta">${escapeHtml(
                    t('stats.allTimeSliceMeta', {
                        count: selectedSlice.count.toLocaleString(locale),
                        pct: pctStr
                    })
                )}</span>`;
        } else {
            allTimeDonutFocusEl.hidden = true;
            allTimeDonutFocusEl.textContent = '';
        }
    }

    if (allTimeListEl) {
        allTimeListEl.replaceChildren();
        if (!slices.length) {
            const empty = document.createElement('p');
            empty.className = 'all-time-list__empty';
            empty.textContent = t('stats.allTimeEmpty');
            allTimeListEl.appendChild(empty);
        } else {
            slices.forEach((slice) => {
                const pct = total > 0 ? (slice.count / total) * 100 : 0;
                const pctStr = pct.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'all-time-list__row';
                if (slice.zid === allTimeSelectedZid) row.classList.add('is-selected');
                row.dataset.zid = slice.zid;
                row.innerHTML =
                    `<span class="all-time-list__dot" style="background:${escapeAttr(slice.color)}"></span>` +
                    `<span class="all-time-list__name">${escapeHtml(slice.label)}</span>` +
                    `<span class="all-time-list__count">${escapeHtml(slice.count.toLocaleString(locale))}</span>` +
                    `<span class="all-time-list__pct">${escapeHtml(pctStr)}%</span>`;
                row.addEventListener('click', () => {
                    allTimeSelectedZid = slice.zid;
                    renderAllTimeStats();
                });
                allTimeListEl.appendChild(row);
            });
        }
    }
}

function renderZikirStats() {
    const zid = currentZikirId;
    if (!zid || !zikirActivityChart) return;
    activeZikirStatTab = ensureUnlockedStatTab(activeZikirStatTab);
    zikirStatTabBtns.forEach((b) => {
        b.classList.toggle('active', (b.getAttribute('data-zikir-stat-tab') || 'daily') === activeZikirStatTab);
    });
    syncPremiumStatTabsUI();
    const z = zikirs.find((x) => x.id === zid);
    if (zikirStatsTitle) {
        zikirStatsTitle.textContent = z ? getZikirDisplayName(z) : t('stats.titleFallback');
    }

    const periodKeys = getStatPeriodDayKeys(activeZikirStatTab);
    const periodSum = sumClicksInDayKeys(periodKeys, zid);

    if (zikirStatsSummaryLabel && zikirStatsSummaryValue && zikirStatsSummarySub) {
        const labelKeys = {
            daily: 'stats.summaryToday',
            weekly: 'stats.summaryWeek',
            monthly: 'stats.summaryMonth',
            yearly: 'stats.summaryYear'
        };
        zikirStatsSummaryLabel.textContent = t(labelKeys[activeZikirStatTab] || labelKeys.daily);
        zikirStatsSummaryValue.textContent = String(
            activeZikirStatTab === 'daily' ? zikirClicksOnDay(getTodayString(), zid) : periodSum
        );
        zikirStatsSummarySub.textContent =
            activeZikirStatTab === 'daily' ? t('stats.summarySubRecord') : t('stats.summarySubTotal');
    }

    const chartPack = buildChartBuckets(activeZikirStatTab, zid);
    if (zikirStatsChartHeading) {
        zikirStatsChartHeading.textContent = `${t(chartPack.headingKey)} — ${t('stats.chartZikirSuffix')}`;
    }
    renderBarChart(zikirActivityChart, zikirChartYAxis, chartPack.buckets, chartPack.density);
}

// ===================== EVENT LISTENERS & MODALS =====================
function setupEventListeners() {
    setupAppDialog();
    setupLocaleWelcome();

    if (document.documentElement.dataset.premiumLockDismissBound !== '1') {
        document.documentElement.dataset.premiumLockDismissBound = '1';
        document.addEventListener('click', (e) => {
            if (e.target.closest('.premium-lock-star')) return;
            closeAllPremiumLockHints();
        });
    }

    if (homeQuoteFooter && homeQuoteFooter.dataset.bound !== '1') {
        homeQuoteFooter.dataset.bound = '1';
        homeQuoteFooter.addEventListener('click', () => toggleDailyQuoteExpand());
        homeQuoteFooter.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            toggleDailyQuoteExpand();
        });
    }

    // Back Buttons
    document.querySelectorAll('.backBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Always prefer in-app stack so back returns to the last screen, not a hard-coded target.
            goBackInApp({ fallbackViewId: btn.getAttribute('data-target') || 'homeView' });
        });
    });

    // Stealth Mode Listeners (buton mainCounterBtn içinde; kabarcıklanmayı kes — sayaç artmasın)
    if (enterStealthBtn) enterStealthBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateCounterUI();
        showView('stealthView');
    });
    if(stealthClickArea) stealthClickArea.addEventListener('click', incrementCounter);
    // Exiting stealth should NOT push a new history entry; otherwise Back can bounce into stealth again.
    if (exitStealthBtn) exitStealthBtn.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        goBackInApp({ fallbackViewId: 'counterView' });
    });

    // Bottom navigation
    if (bottomNav) {
        bottomNav.querySelectorAll('.bottom-nav__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                const view = btn.getAttribute('data-view');
                if (view) showView(view);
            });
        });
    }

    const weeklyReportStarBtn = document.getElementById('weeklyReportStarBtn');
    const weeklyReportDetails = document.getElementById('weeklyReportDetails');
    if (weeklyReportStarBtn && weeklyReportDetails && weeklyReportStarBtn.dataset.bound !== '1') {
        weeklyReportStarBtn.dataset.bound = '1';
        weeklyReportStarBtn.addEventListener('click', () => {
            const expanded = weeklyReportStarBtn.getAttribute('aria-expanded') === 'true';
            const next = !expanded;
            weeklyReportStarBtn.setAttribute('aria-expanded', next ? 'true' : 'false');
            weeklyReportDetails.hidden = !next;
        });
    }

    const premiumFeatureList = document.getElementById('premiumFeatureList');
    if (premiumFeatureList) premiumFeatureList.dataset.bound = '1';

    const premiumManageFeatureList = document.getElementById('premiumManageFeatureList');
    if (premiumManageFeatureList && premiumManageFeatureList.dataset.bound !== '1') {
        premiumManageFeatureList.dataset.bound = '1';
        premiumManageFeatureList.addEventListener('click', (e) => {
            const row = e.target && e.target.closest ? e.target.closest('[data-premium-feature]') : null;
            if (!row) return;
            openPremiumHubFeature(row.getAttribute('data-premium-feature'));
        });
    }

    const premiumHubSubscribeBtn = document.getElementById('premiumHubSubscribeBtn');
    if (premiumHubSubscribeBtn && premiumHubSubscribeBtn.dataset.bound !== '1') {
        premiumHubSubscribeBtn.dataset.bound = '1';
        premiumHubSubscribeBtn.addEventListener('click', () => showView('premiumPurchaseView'));
    }

    const openTrashBtn = document.getElementById('openTrashBtn');
    if (openTrashBtn && openTrashBtn.dataset.bound !== '1') {
        openTrashBtn.dataset.bound = '1';
        openTrashBtn.addEventListener('click', async () => {
            if (isPremiumOnlyFeatureLocked()) {
                await showAppAlert(t('premium.trashLockedAlert'), { title: t('premium.title') });
                if (PREMIUM_UI_VISIBLE) showView('premiumView');
                return;
            }
            openOverlay('trashOverlay', { onOpen: renderTrashOverlay });
        });
    }

    const trashClearBtn = document.getElementById('trashClearBtn');
    if (trashClearBtn && trashClearBtn.dataset.bound !== '1') {
        trashClearBtn.dataset.bound = '1';
        trashClearBtn.addEventListener('click', () => {
            if (!isPremium()) return;
            void clearTrashAll().then(() => renderTrashOverlay());
        });
    }

    const trashListEl = document.getElementById('trashList');
    if (trashListEl && trashListEl.dataset.bound !== '1') {
        trashListEl.dataset.bound = '1';
        trashListEl.addEventListener('click', async (e) => {
            if (!isPremium()) return;
            const btn = e.target && e.target.closest ? e.target.closest('[data-trash-action]') : null;
            if (!btn) return;
            const action = btn.getAttribute('data-trash-action');
            const idx = parseInt(btn.getAttribute('data-trash-index') || '', 10);
            if (!Number.isFinite(idx)) return;
            if (action === 'restore') {
                restoreTrashEntry(idx);
                renderTrashOverlay();
                return;
            }
            if (action === 'delete') {
                if (!(await showAppConfirm(t('trash.deletePermanentConfirm'), {
                    title: t('trash.deletePermanentTitle'),
                    confirmLabel: t('confirm.deleteLabel')
                }))) return;
                deleteTrashEntry(idx);
                renderTrashOverlay();
            }
        });
    }

    libraryCategoryTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            usageTracker?.forceFlush();
            const cat = btn.getAttribute('data-cat');
            if (cat === 'quran') {
                libraryCategoryTabs.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                showView('quranView');
                return;
            }
            libraryCategoryTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeLibraryCat = cat || 'dua';
            renderLibrary();
        });
    });

    bindQuranSearchInput();
    bindQuranSearchGuide();
    bindQuranMealSelect();
    bindQuranAyahExpandOverlay();
    bindQuranTafsirBridgeOverlay();

    document.addEventListener('quran-reader-drawer-close', () => setQuranDrawerFolderPanelOpen(false));

    const quranDrawerFolderToggle = document.getElementById('quranDrawerFolderToggle');
    if (quranDrawerFolderToggle && quranDrawerFolderToggle.dataset.bound !== '1') {
        quranDrawerFolderToggle.dataset.bound = '1';
        quranDrawerFolderToggle.addEventListener('click', () => {
            const panel = document.getElementById('quranDrawerFolderPanel');
            setQuranDrawerFolderPanelOpen(panel?.hidden !== false);
        });
    }
    const quranDrawerFolderModeList = document.getElementById('quranDrawerFolderModeList');
    if (quranDrawerFolderModeList && quranDrawerFolderModeList.dataset.bound !== '1') {
        quranDrawerFolderModeList.dataset.bound = '1';
        quranDrawerFolderModeList.querySelectorAll('.quran-folder-add__mode').forEach((btn) => {
            btn.addEventListener('click', () => {
                syncQuranDrawerFolderModeUI(
                    normalizeQuranZikirDisplayMode(btn.getAttribute('data-read-mode'), appSettings.locale)
                );
            });
        });
    }
    const quranDrawerFolderLayoutList = document.getElementById('quranDrawerFolderLayoutList');
    if (quranDrawerFolderLayoutList && quranDrawerFolderLayoutList.dataset.bound !== '1') {
        quranDrawerFolderLayoutList.dataset.bound = '1';
        quranDrawerFolderLayoutList.querySelectorAll('.quran-folder-add__mode').forEach((btn) => {
            btn.addEventListener('click', () => {
                syncQuranDrawerCounterLayoutUI(normalizeQuranCounterLayout(btn.getAttribute('data-counter-layout')));
            });
        });
    }
    ['quranDrawerFolderSurahInput', 'quranDrawerFolderAyahsInput'].forEach((id) => {
        const inp = document.getElementById(id);
        if (inp && inp.dataset.bound !== '1') {
            inp.dataset.bound = '1';
            inp.addEventListener('input', () => setQuranDrawerFolderError(''));
        }
    });
    const quranDrawerFolderSaveBtn = document.getElementById('quranDrawerFolderSaveBtn');
    if (quranDrawerFolderSaveBtn && quranDrawerFolderSaveBtn.dataset.bound !== '1') {
        quranDrawerFolderSaveBtn.dataset.bound = '1';
        quranDrawerFolderSaveBtn.addEventListener('click', () => {
            void saveQuranDrawerFolderAdd();
        });
    }
    const quranZikirBody = document.getElementById('quranZikirBody');
    if (quranZikirBody && quranZikirBody.dataset.bound !== '1') {
        quranZikirBody.dataset.bound = '1';
        quranZikirBody.addEventListener('click', (e) => {
            const counterViewEl = document.getElementById('counterView');
            if (!counterViewEl?.classList.contains('counter-view--quran-text-only')) return;
            if (e.target.closest('button')) return;
            incrementCounter();
        });
    }

    bindQuranViewTabs((tab) => {
        if (tab === 'favorites') {
            void renderQuranFavoritesList(appSettings.quranMeal, quranAyahFavorites);
        } else {
            renderQuranSurahList();
        }
    });
    setQuranAyahFavoritesApi({
        isFavorite: isQuranAyahFavorite,
        toggleFavorite: toggleQuranAyahFavorite
    });
    setMushafSettingsApi({
        getRemember: () => !!appSettings.quranMushafRememberPage,
        getSavedPage: () => Number(appSettings.quranMushafSavedPage) || 1,
        setRemember: (on) => {
            appSettings.quranMushafRememberPage = !!on;
            saveData();
        },
        onPageSaved: (page) => {
            const p = Math.max(1, Math.min(604, Number(page) || 1));
            appSettings.quranMushafSavedPage = p;
            saveData();
        }
    });
    setQuranNavigateToSurah((n, ayahN, mealId) => {
        if (mealId) {
            appSettings.quranMeal = normalizeQuranMeal(mealId, appSettings.locale);
            saveData();
        }
        if (ayahN != null && Number.isFinite(Number(ayahN))) {
            showView('quranSurahView', { surah: n, ayah: Number(ayahN) });
            return;
        }
        showView('quranSurahView', n);
    });
    setQuranMealChangeHandler((mealId) => {
        appSettings.quranMeal = normalizeQuranMeal(mealId, appSettings.locale);
        saveData();
        if (currentQuranSurahId != null) {
            void renderQuranSurahDetail(
                currentQuranSurahId,
                appSettings.quranMeal,
                appSettings.quranReadMode,
                null,
                appSettings.quranReaderLayout,
                mushafNavOptsForRerender()
            );
        }
    });
    setQuranReadModeChangeHandler((readMode) => {
        guardQuranReaderSettingsChange();
        appSettings.quranReadMode = normalizeQuranReadModeForLocale(readMode, appSettings.locale);
        saveData();
        if (currentQuranSurahId != null) {
            void renderQuranSurahDetail(
                currentQuranSurahId,
                appSettings.quranMeal,
                appSettings.quranReadMode,
                null,
                appSettings.quranReaderLayout,
                mushafNavOptsForRerender()
            );
        }
    });
    setQuranReaderLayoutChangeHandler((readerLayout, opts = {}) => {
        const nextLayout = normalizeQuranReaderLayout(readerLayout);
        const wasMushaf = !!opts.wasMushaf || appSettings.quranReaderLayout === 'mushaf';
        appSettings.quranReaderLayout = nextLayout;
        saveData();

        const qsv = document.getElementById('quranSurahView');
        if (!qsv || qsv.classList.contains('hidden')) return;

        let surahN = currentQuranSurahId ?? 1;
        let scrollAyah = null;
        let mushafNav = nextLayout === 'mushaf' ? mushafNavOptsForRerender() : {};

        if (nextLayout === 'scroll' && wasMushaf) {
            surahN = 1;
            scrollAyah = 1;
            currentQuranSurahId = 1;
            mushafNav = { leavingMushaf: true };
        }

        void renderQuranSurahDetail(
            surahN,
            appSettings.quranMeal,
            appSettings.quranReadMode,
            scrollAyah,
            nextLayout,
            mushafNav
        );
    });
    bindQuranReaderMenu(appSettings.quranReadMode, appSettings.quranReaderLayout);
    syncQuranTabVisibility();

    if (librarySearchInput) librarySearchInput.addEventListener('input', () => {
        librarySearchQuery = librarySearchInput.value || '';
        renderLibrary();
    });

    if(prepLibraryAddBtn) prepLibraryAddBtn.addEventListener('click', async () => {
        if(!selectedLibraryItem) return;
        closeOverlayPreferHistory('libraryDetailOverlay');
        
        libDestFolder.innerHTML = '';
        folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            libDestFolder.appendChild(opt);
        });

        if(libDestFolder.options.length === 0) {
            await showAppAlert('Lütfen önce bir klasör oluşturun.', { title: 'Klasör yok' });
            return;
        }
        openOverlay('libraryFolderSelectOverlay');
    });

    if(confirmLibraryAddBtn) confirmLibraryAddBtn.addEventListener('click', async () => {
        const destId = libDestFolder.value;
        if(!destId) return;
        if (!canAddZikirToFolder(destId)) {
            await handleZikirLimitBlocked(destId);
            return;
        }

        const libZ = selectedLibraryItem;
        const newZ = {
            id: 'z_' + Date.now(),
            folderId: destId,
            libraryId: libZ.id,
            name: getLibraryNameForLocale(libZ.id, 'tr'),
            arabic: (libZ.arabic && String(libZ.arabic).trim()) || getLibraryNameForLocale(libZ.id, 'ar') || '',
            target: libZ.target,
            meaning: libZ.meaning,
            count: 0,
            lastClicked: 0,
            order:
                zikirs
                    .filter((x) => x.folderId === destId)
                    .reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1) + 1
        };
        if (
            !localeUsesEnglishMeals(appSettings.locale) &&
            libZ.category === 'zikir' &&
            libZ.context &&
            String(libZ.context).trim()
        ) {
            newZ.fazilet = String(libZ.context).trim();
        }
        zikirs.push(newZ);
        saveData();
        libraryFolderSelectOverlay.classList.remove('active');
        showView('folderDetailView', destId);
    });

    if (folderSelectCancelBtn) {
        folderSelectCancelBtn.addEventListener('click', () => exitFolderSelectMode(false));
    }
    if (folderSelectDeleteBtn) {
        folderSelectDeleteBtn.addEventListener('click', () => deleteSelectedFolders());
    }
    if (zikirSelectCancelBtn) {
        zikirSelectCancelBtn.addEventListener('click', () => exitZikirSelectMode(false));
    }
    if (zikirSelectDeleteBtn) {
        zikirSelectDeleteBtn.addEventListener('click', () => deleteSelectedZikirs());
    }

    // Custom Folders
    newFolderBtn.addEventListener('click', async () => {
        if (folderSelectMode) return;
        if (handleFolderLimitBlocked()) return;
        const name = await showAppPrompt('Yeni klasör için bir ad yazın.', '', {
            title: 'Yeni klasör',
            inputLabel: 'Klasör adı'
        });
        if (name != null && name.trim()) {
            const maxOrder = folders.reduce((m, f) => Math.max(m, typeof f.order === 'number' ? f.order : -1), -1);
            folders.push({ id: 'f_' + Date.now(), name: name.trim(), order: maxOrder + 1 });
            saveData();
            renderFolders();
        }
    });

    // ZikirmatiK Counter
    mainCounterBtn.addEventListener('click', (e) => {
        if (e.target.closest('#enterStealthBtn')) return;
        incrementCounter();
    });
    if(decrementBtn) decrementBtn.addEventListener('click', decrementCounter);
    if (openZikirStatsBtn && zikirStatsOverlay) {
        openZikirStatsBtn.addEventListener('click', () => {
            activeZikirStatTab = 'daily';
            zikirStatTabBtns.forEach((b) => {
                b.classList.toggle('active', b.getAttribute('data-zikir-stat-tab') === 'daily');
            });
            openOverlay('zikirStatsOverlay', { onOpen: renderZikirStats });
        });
    }
    const reviseQuranDisplayBtn = document.getElementById('reviseQuranDisplayBtn');
    if (reviseQuranDisplayBtn && reviseQuranDisplayBtn.dataset.bound !== '1') {
        reviseQuranDisplayBtn.dataset.bound = '1';
        reviseQuranDisplayBtn.addEventListener('click', () => openReviseQuranDisplayModal());
    }
    const reviseQuranDisplayModeList = document.getElementById('reviseQuranDisplayModeList');
    if (reviseQuranDisplayModeList && reviseQuranDisplayModeList.dataset.bound !== '1') {
        reviseQuranDisplayModeList.dataset.bound = '1';
        reviseQuranDisplayModeList.querySelectorAll('.quran-folder-add__mode').forEach((btn) => {
            btn.addEventListener('click', () => {
                syncReviseQuranDisplayModeUI(
                    normalizeQuranZikirDisplayMode(btn.getAttribute('data-read-mode'), appSettings.locale)
                );
            });
        });
    }
    const reviseQuranDisplayLayoutList = document.getElementById('reviseQuranDisplayLayoutList');
    if (reviseQuranDisplayLayoutList && reviseQuranDisplayLayoutList.dataset.bound !== '1') {
        reviseQuranDisplayLayoutList.dataset.bound = '1';
        reviseQuranDisplayLayoutList.querySelectorAll('.quran-folder-add__mode').forEach((btn) => {
            btn.addEventListener('click', () => {
                syncReviseQuranDisplayLayoutUI(
                    normalizeQuranCounterLayout(btn.getAttribute('data-counter-layout'))
                );
            });
        });
    }
    const saveReviseQuranDisplayBtn = document.getElementById('saveReviseQuranDisplayBtn');
    if (saveReviseQuranDisplayBtn && saveReviseQuranDisplayBtn.dataset.bound !== '1') {
        saveReviseQuranDisplayBtn.dataset.bound = '1';
        saveReviseQuranDisplayBtn.addEventListener('click', () => {
            void applyReviseQuranDisplay();
        });
    }
    zikirStatTabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-zikir-stat-tab') || 'daily';
            if (isPremiumOnlyFeatureLocked() && isPremiumStatTab(tab)) {
                showPremiumFeatureUpsell();
                return;
            }
            zikirStatTabBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            activeZikirStatTab = tab;
            renderZikirStats();
        });
    });
    resetBtn.addEventListener('click', async () => {
        const z = zikirs.find(x => x.id === currentZikirId);
        if (
            z &&
            (await showAppConfirm(t('confirm.resetCounterMsg', { name: getZikirDisplayName(z) }), {
                title: t('confirm.resetCounterTitle'),
                confirmLabel: t('confirm.resetLabel')
            }))
        ) {
            z.count = 0;
            saveData();
            updateCounterUI();
        }
    });

    // Settings
    if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => {
        showView('settingsView');
    });
    
    const updateSettings = () => {
        if(cbVibrationTap) appSettings.vibrationTap = cbVibrationTap.checked;
        if(cbVibrationTarget) appSettings.vibrationTarget = cbVibrationTarget.checked;
        if(cbSound) appSettings.sound = cbSound.checked;
        if (cbWakeLock) {
            appSettings.wakeLock = cbWakeLock.checked;
            const counterView = document.getElementById('counterView');
            if (counterView && counterView.classList.contains('active')) {
                if (appSettings.wakeLock) void requestWakeLock();
                else void releaseWakeLock();
            }
        }
        if (cbCounterNativeNumerals) {
            appSettings.counterNativeNumerals = cbCounterNativeNumerals.checked;
            updateCounterUI();
        }
        syncTickSoundSettingVisibility();
        saveData();
    };
    if(cbVibrationTap) cbVibrationTap.addEventListener('change', updateSettings);
    if(cbVibrationTarget) cbVibrationTarget.addEventListener('change', updateSettings);
    if(cbSound) cbSound.addEventListener('change', updateSettings);
    if(cbWakeLock) cbWakeLock.addEventListener('change', updateSettings);
    if (cbCounterNativeNumerals) cbCounterNativeNumerals.addEventListener('change', updateSettings);

    const bumpArabicFontStep = (delta) => {
        const next = clampArabicSublineFontStep(appSettings.arabicSublineFontStep + delta);
        if (next === appSettings.arabicSublineFontStep) return;
        appSettings.arabicSublineFontStep = next;
        syncArabicFontSettingUI();
        saveData();
    };
    if (arabicFontStepDown) {
        arabicFontStepDown.addEventListener('click', () => bumpArabicFontStep(-1));
    }
    if (arabicFontStepUp) {
        arabicFontStepUp.addEventListener('click', () => bumpArabicFontStep(1));
    }

    themeChoiceBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const choice = btn.getAttribute('data-theme-choice');
            if (choice !== 'light' && choice !== 'black' && choice !== 'navy') return;
            if (appSettings.theme === choice) return;
            appSettings.theme = choice;
            applyAppTheme(choice);
            syncThemeUI();
            saveData();
        });
    });

    accentChoiceBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const choice = btn.getAttribute('data-accent-choice');
            const normalized = normalizeAppAccent(choice);
            if (appSettings.accent === normalized) return;
            appSettings.accent = normalized;
            applyAppAccent(normalized);
            syncAccentUI();
            saveData();
        });
    });

    // Premium → Sayaç görünümü düzenleyici
    if (openCounterCustomizeBtn) {
        openCounterCustomizeBtn.addEventListener('click', () => {
            showView('premiumFeatureCounterCustomizeView');
        });
    }

    if (openCounterBackgroundBtn) {
        openCounterBackgroundBtn.addEventListener('click', (e) => {
            if (e.target.closest('.premium-lock-star')) return;
            if (isCounterBackgroundLocked()) {
                showPremiumFeatureUpsell();
                return;
            }
            showView('premiumFeatureCounterBackgroundView');
        });
    }

    if (counterBgNoneBtn) {
        counterBgNoneBtn.addEventListener('click', () => setCounterBackground('none'));
    }

    if (counterBgPresetGrid) {
        counterBgPresetGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-counter-bg-choice]');
            if (!btn) return;
            setCounterBackground(btn.getAttribute('data-counter-bg-choice'));
        });
    }

    if (counterBgGalleryBtn) {
        counterBgGalleryBtn.addEventListener('click', (e) => {
            if (e.target.closest('.premium-lock-star')) return;
            if (isCounterBackgroundLocked()) {
                showPremiumFeatureUpsell();
                return;
            }
            if (!counterBgGalleryInput) return;
            counterBgGalleryInput.value = '';
            if (typeof counterBgGalleryInput.showPicker === 'function') {
                try {
                    counterBgGalleryInput.showPicker();
                    return;
                } catch (err) {
                    console.warn('counter background showPicker failed, falling back to click()', err);
                }
            }
            counterBgGalleryInput.click();
        });
    }

    if (counterBgGalleryInput) {
        counterBgGalleryInput.addEventListener('change', async () => {
            const file = counterBgGalleryInput.files?.[0];
            counterBgGalleryInput.value = '';
            if (!file) return;
            try {
                const dataUrl = await buildCounterBackgroundCustomDataUrl(file);
                setCustomCounterBackgroundDataUrl(dataUrl);
            } catch (err) {
                console.error('counter background gallery pick failed', err);
                await showAppAlert(t('premium.counterBgGalleryError'), { title: t('dialog.info') });
            }
        });
    }

    initCounterCustomizeSheetDrag();
    window.addEventListener('resize', () => {
        if (currentViewId !== 'premiumFeatureCounterCustomizeView') return;
        const expanded = counterCustomizeView?.dataset.sheetExpanded === 'true';
        resetCounterCustomizeSheet({ expanded });
    });

    if (counterCustomizeRingRange) {
        counterCustomizeRingRange.addEventListener('input', () => {
            appSettings.counterRingWidth = normalizeCounterRingWidth(counterCustomizeRingRange.value);
            applyCounterAppearanceFromSettings();
        });
        counterCustomizeRingRange.addEventListener('change', () => {
            saveData();
        });
    }

    counterCustomizeNumSizeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = normalizeCounterNumberSize(btn.getAttribute('data-counter-customize-num-size'));
            if (appSettings.counterNumberSize === next) return;
            appSettings.counterNumberSize = next;
            applyCounterAppearanceFromSettings();
            syncCounterCustomizeEditorUI();
            saveData();
        });
    });

    counterTapScaleBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = normalizeCounterTapScale(btn.getAttribute('data-counter-tap-scale'));
            if (appSettings.counterTapScale === next) return;
            appSettings.counterTapScale = next;
            applyCounterAppearanceFromSettings();
            syncCounterCustomizeEditorUI();
            saveData();
        });
    });

    const syncCounterShowToggle = (key, checked) => {
        if (key === 'target') appSettings.counterShowTarget = checked;
        else if (key === 'total') appSettings.counterShowTotal = checked;
        else if (key === 'round') appSettings.counterShowRound = checked;
        applyCounterAppearanceFromSettings();
        saveData();
    };

    [counterShowTargetToggle, counterShowTotalToggle, counterShowRoundToggle].forEach((el) => {
        if (!el) return;
        el.addEventListener('change', () => {
            const key = el.getAttribute('data-counter-show-toggle') || '';
            syncCounterShowToggle(key, el.checked);
        });
    });

    tickSoundChoiceBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = normalizeCounterTickSound(btn.getAttribute('data-tick-sound-choice'));
            const isClassic = next === 'classic';
            if (!isClassic && isPremiumOnlyFeatureLocked()) {
                showPremiumFeatureUpsell();
                return;
            }
            if (appSettings.counterTickSound === next) {
                playTickSound(false, { force: true, profile: next });
                return;
            }
            appSettings.counterTickSound = next;
            syncTickSoundUI();
            playTickSound(false, { force: true, profile: next });
            saveData();
        });
    });

    if (localeToggleBtn) {
        localeToggleBtn.addEventListener('click', () => {
            const isOpen = localeSetting && localeSetting.classList.contains('is-open');
            setLocalePickerOpen(!isOpen);
        });
    }

    if (tickSoundPickerToggle) {
        tickSoundPickerToggle.addEventListener('click', () => {
            const isOpen = tickSoundSetting && tickSoundSetting.classList.contains('is-open');
            setTickSoundPickerOpen(!isOpen);
        });
    }

    localeChoiceBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const choice = btn.getAttribute('data-locale-choice');
            if (!SUPPORTED_LOCALES.some((l) => l.code === choice)) return;
            if (appSettings.locale === choice) {
                setLocalePickerOpen(false);
                return;
            }
            applyAppLocale(choice);
            syncLocaleUI();
            updateCounterUI();
            setDailyQuote();
            saveData();
            if (reminderSettings.enabled) {
                ensureReminderSchedule().catch(console.error);
            }
            setLocalePickerOpen(false);
            maybeShowLocaleWelcome(choice);
        });
    });

    const updateReminders = () => {
        if (cbReminderEnabled) reminderSettings.enabled = cbReminderEnabled.checked;
        if (reminderTimeInput) reminderSettings.time = reminderTimeInput.value || '21:00';
        saveData();
        (async () => {
            if (reminderSettings.enabled && !isCapacitorNative()) {
                if (!('Notification' in window)) {
                    await showAppAlert(t('reminderDialog.unsupportedBody'), {
                        title: t('reminderDialog.unsupportedTitle')
                    });
                    return;
                }
                let perm = Notification.permission;
                if (perm === 'default') {
                    perm = await Notification.requestPermission();
                }
                if (perm !== 'granted') {
                    if (perm === 'denied') {
                        await showAppAlert(t('reminderDialog.deniedWebBody'), {
                            title: t('reminderDialog.notificationPermTitle')
                        });
                    }
                    clearInAppReminderTick();
                    return;
                }
            }
            await ensureReminderSchedule();
        })().catch(console.error);
    };
    if (cbReminderEnabled) cbReminderEnabled.addEventListener('change', updateReminders);
    if (reminderTimeInput) reminderTimeInput.addEventListener('change', updateReminders);

    if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', () => {
        showView('privacyView');
    });

    const settingsRateUsBtn = document.getElementById('settingsRateUsBtn');
    if (settingsRateUsBtn && settingsRateUsBtn.dataset.bound !== '1') {
        settingsRateUsBtn.dataset.bound = '1';
        settingsRateUsBtn.addEventListener('click', () => openPlayStore());
    }

    const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
    if (privacyPolicyBtn && privacyPolicyBtn.dataset.bound !== '1') {
        privacyPolicyBtn.dataset.bound = '1';
        privacyPolicyBtn.addEventListener('click', () => openPrivacyPolicyPage());
    }

    if (folderSearchInput) folderSearchInput.addEventListener('input', () => {
        folderSearchQuery = folderSearchInput.value || '';
        renderFolderDetail();
    });
    if (folderFavoritesOnly) folderFavoritesOnly.addEventListener('change', () => {
        folderFavOnly = folderFavoritesOnly.checked;
        renderFolderDetail();
    });

    // Modals Handling
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mid = btn.getAttribute('data-modal');
            if (mid) {
                if (closeOverlayPreferHistory(mid)) return;
                const el = document.getElementById(mid);
                if (el) el.classList.remove('active');
            }
        });
    });

    openAddZikirModalBtn.addEventListener('click', async () => {
        if (await handleZikirLimitBlocked(currentFolderId)) return;
        openOverlay('addModalOverlay');
    });

    saveZikirBtn.addEventListener('click', async () => {
        const n = document.getElementById('newZikirName').value.trim();
        const targetVal = parseInt(document.getElementById('newZikirTarget').value, 10);
        const m = document.getElementById('newZikirMeaning').value.trim();
        const ar = document.getElementById('newZikirArabic').value.trim();
        
        if(!n) {
            await showAppAlert(t('confirm.nameRequired'), { title: t('confirm.missingNameTitle') });
            return;
        }
        if(isNaN(targetVal) || targetVal < 1) {
            await showAppAlert(t('confirm.invalidTarget'), { title: t('confirm.invalidTargetTitle') });
            return;
        }

        if (await handleZikirLimitBlocked(currentFolderId)) return;

        const maxOrder = zikirs
            .filter(x => x.folderId === currentFolderId)
            .reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1);
        zikirs.push({
            id: 'z_' + Date.now(),
            folderId: currentFolderId,
            name: n,
            arabic: ar,
            target: targetVal, meaning: m, count: 0, lastClicked: 0,
            order: maxOrder + 1
        });
        saveData();
        addModalOverlay.classList.remove('active');
        renderFolderDetail();

        // clear
        document.getElementById('newZikirName').value = '';
        document.getElementById('newZikirTarget').value = '33';
        document.getElementById('newZikirMeaning').value = '';
        document.getElementById('newZikirArabic').value = '';
    });

    // Edit Target Handle
    saveEditBtn.addEventListener('click', async () => {
        if (!editingZikirIdMap) return;
        const nameVal = editZikirNameInp ? editZikirNameInp.value.trim() : '';
        if (!nameVal) {
            await showAppAlert(t('confirm.nameEmpty'), { title: t('confirm.missingNameTitle') });
            return;
        }
        const val = parseInt(editZikirTargetInp.value, 10);
        if (isNaN(val) || val < 1) {
            await showAppAlert(t('confirm.invalidTargetNumber'), { title: t('confirm.invalidTargetTitle') });
            return;
        }
        const z = zikirs.find((x) => x.id === editingZikirIdMap);
        if (!z) return;
        z.name = nameVal;
        z.target = val;
        z.meaning = editZikirMeaningInp.value.trim();
        if (editZikirArabicInp) z.arabic = editZikirArabicInp.value.trim();
        if (!localeUsesEnglishMeals(appSettings.locale)) {
            const fzVal = editZikirFaziletInp ? editZikirFaziletInp.value.trim() : '';
            const defF = getEsmaDefaultFaziletForZikir(z);
            if (getEsmaListEntryForZikir(z)) {
                if (!fzVal || fzVal === defF) delete z.fazilet;
                else z.fazilet = fzVal;
            } else if (fzVal) {
                z.fazilet = fzVal;
            } else {
                delete z.fazilet;
            }
        }
        saveData();
        renderFolderDetail();
        if (currentZikirId === z.id) updateCounterUI();
        editModalOverlay.classList.remove('active');
        editingZikirIdMap = null;
    });

    // Copy / Move
    saveCopyBtn.addEventListener('click', () => void processCopyMove('copy'));
    saveMoveBtn.addEventListener('click', () => void processCopyMove('move'));

    statTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab') || 'daily';
            if (isPremiumOnlyFeatureLocked() && isPremiumStatTab(tab)) {
                showPremiumFeatureUpsell();
                return;
            }
            statTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeStatTab = tab;
            renderStats();
        });
    });
}

function syncEditFaziletFieldForLocale(z) {
    const group = editZikirFaziletInp && editZikirFaziletInp.closest('.form-group');
    const localeIsTr = !localeUsesEnglishMeals(appSettings.locale);
    if (group) group.hidden = !localeIsTr;
    if (!editZikirFaziletInp) return;
    if (!localeIsTr) {
        editZikirFaziletInp.value = '';
        return;
    }
    const stored = z.fazilet != null && String(z.fazilet).trim();
    editZikirFaziletInp.value = stored ? String(z.fazilet).trim() : getEsmaDefaultFaziletForZikir(z);
}

function openEditModal(zId) {
    const z = zikirs.find(x => x.id === zId);
    if (!z) return;
    editingZikirIdMap = zId;
    if (editZikirNameInp) editZikirNameInp.value = getZikirDisplayName(z) || '';
    editZikirTargetInp.value = z.target;
    editZikirMeaningInp.value = getZikirDisplayMeaning(z) || '';
    if (editZikirArabicInp) editZikirArabicInp.value = z.arabic || '';
    syncEditFaziletFieldForLocale(z);
    openOverlay('editModalOverlay');
}

async function openCopyModal(zId) {
    copyingZikirId = zId;
    copyDestFolder.innerHTML = '';
    folders.forEach(f => {
        if(f.id !== currentFolderId) {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            copyDestFolder.appendChild(opt);
        }
    });

    if(copyDestFolder.options.length === 0) {
        await showAppAlert('Hedeflenecek başka klasör yok. Lütfen önce yeni bir klasör oluşturun.', {
            title: 'Klasör yok'
        });
        return;
    }
    
    openOverlay('copyModalOverlay');
}

async function processCopyMove(actionType) {
    if(!copyingZikirId) return;
    const destFolderId = copyDestFolder.value;
    if(!destFolderId) return;

    if (await handleZikirLimitBlocked(destFolderId)) return;

    const z = zikirs.find(x => x.id === copyingZikirId);
    if(z) {
        if(actionType === 'copy') {
            const maxOrder = zikirs
                .filter(x => x.folderId === destFolderId)
                .reduce((m2, x) => Math.max(m2, typeof x.order === 'number' ? x.order : -1), -1);
            zikirs.push({
                ...z,
                id: 'z_' + Date.now(),
                folderId: destFolderId,
                count: 0,
                order: maxOrder + 1
            });
        } else if (actionType === 'move') {
            z.folderId = destFolderId;
        }
        saveData();
        renderFolderDetail();
        copyModalOverlay.classList.remove('active');
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

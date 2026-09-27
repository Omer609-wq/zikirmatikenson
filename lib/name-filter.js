/**
 * Başkalarının gördüğü adlar için süzgeç: grup adı ve grupta görünen kişi adı.
 *
 * App Store kullanıcı içeriği kuralı (1.2) uygunsuz içeriğin yazılırken
 * süzülmesini istiyor; şikâyet ve yöneticinin üye çıkarması yazıldıktan sonrası
 * için. Kişisel hatim adı süzülmez: onu kimse görmüyor.
 *
 * Asıl zorluk yanlış alarm. Normalleştirmeden sonra Türkçe "sık" ile kaba kelime
 * aynı yazılıyor, "Amina" yaygın bir isim, "Nigeria" bir ülke. Bu yüzden iki tür:
 *   - word: kısa ve belirsiz olanlar yalnız tam kelime olarak eşleşir,
 *   - part: uzun, tek anlamlı kökler kelime içinde de aranır (boşluk/nokta ile
 *     bölünmüş yazımı da yakalar: "s.i.k.t.i.r").
 * Yinelenen harfler sıkıştırılır ("fuuuck"); sıkıştırınca masum bir kelimeye
 * dönüşen terimde (nigger → niger → Nigeria) sıkıştırma kapalı.
 *
 * Sunucu kuralı kelime listesi denetlemiyor: süzgeç istemcide. Atlatılırsa
 * şikâyet ve yöneticinin üye çıkarması devrede.
 */

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };

// Arapça/Urduca: hareke ve uzatma atılır, aynı sesin farklı yazımları birleşir.
const ARABIC_MARKS = /[ً-ٰٟـ]/g;
const ARABIC_FOLD = {
    'أ': 'ا',
    'إ': 'ا',
    'آ': 'ا',
    'ٱ': 'ا',
    'ة': 'ه',
    'ۃ': 'ه',
    'ہ': 'ه',
    'ھ': 'ه',
    'ى': 'ي',
    'ی': 'ي',
    'ئ': 'ي',
    'ؤ': 'و'
};

/** Karşılaştırma biçimi: küçük harf, aksansız, Türkçe ve Arapça harfler birleşik, leet çözülmüş. */
export function foldForFilter(value) {
    let s = String(value ?? '').toLocaleLowerCase('tr');
    // Latin aksanları (é → e, ş → s, ğ → g, ö → o, ü → u, ç → c); ı ayrışmaz, elle.
    s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
    s = s.replace(ARABIC_MARKS, '');
    s = s.replace(/[أإآٱةۃہھىیئؤ]/g, (ch) => ARABIC_FOLD[ch] || ch);
    s = s.replace(/[013457@$]/g, (ch) => LEET[ch] || ch);
    return s;
}

/** Yinelenen harfleri teke indirir: "siiiktir" → "siktir". */
function squeeze(s) {
    return s.replace(/(.)\1+/gu, '$1');
}

function tokensOf(folded) {
    // Harf ve harf işaretleri kelimeye dahil (Bengalce ünlü işaretleri \p{M}).
    return folded.split(/[^\p{L}\p{M}]+/u).filter(Boolean);
}

/**
 * Yasaklı terimler. Liste bilerek kısa: yaygın küfür ve hakaretler, ırkçı
 * sözler. Masum kelimelerle çakışma testlerde (name-filter.test.js) sınanıyor.
 * { t: terim, m: 'word' | 'part', sq: sıkıştırılsın mı (varsayılan evet) }
 */
const RAW_TERMS = [
    // Türkçe — kelime içinde
    { t: 'orospu', m: 'part' },
    { t: 'siktir', m: 'part' },
    { t: 'sikeyim', m: 'part' },
    { t: 'sikerim', m: 'part' },
    { t: 'amcık', m: 'part' },
    { t: 'amınakoy', m: 'part' },
    { t: 'yarrak', m: 'part' },
    { t: 'pezevenk', m: 'part' },
    { t: 'kahpe', m: 'part' },
    { t: 'kaltak', m: 'part' },
    { t: 'yavşak', m: 'part' },
    { t: 'sürtük', m: 'part' },
    { t: 'ibnelik', m: 'part' },
    // Türkçe — tam kelime
    { t: 'amk', m: 'word' },
    { t: 'aq', m: 'word' },
    { t: 'ibne', m: 'word' },
    { t: 'gavat', m: 'word' },
    { t: 'piç', m: 'word' },
    { t: 'godoş', m: 'word' },

    // İngilizce
    { t: 'fuck', m: 'part' },
    { t: 'bitch', m: 'part' },
    { t: 'asshole', m: 'part' },
    { t: 'bastard', m: 'part' },
    { t: 'whore', m: 'part' },
    { t: 'bullshit', m: 'part' },
    { t: 'nigger', m: 'part', sq: false },
    { t: 'nigga', m: 'part', sq: false },
    { t: 'faggot', m: 'part', sq: false },
    { t: 'shit', m: 'word' },
    { t: 'cunt', m: 'word' },
    { t: 'slut', m: 'word' },
    { t: 'pussy', m: 'word' },
    { t: 'fag', m: 'word' },

    // Arapça
    { t: 'شرموط', m: 'part' },
    { t: 'قحبة', m: 'part' },
    { t: 'منيوك', m: 'part' },
    { t: 'عاهرة', m: 'part' },
    { t: 'كسامك', m: 'part' },
    { t: 'كس', m: 'word' },
    { t: 'زب', m: 'word' },
    { t: 'طيز', m: 'word' },
    { t: 'خول', m: 'word' },

    // Fransızca
    { t: 'putain', m: 'part' },
    { t: 'salope', m: 'part' },
    { t: 'connard', m: 'part' },
    { t: 'enculé', m: 'part' },
    { t: 'enfoiré', m: 'part' },
    { t: 'pute', m: 'word' },
    { t: 'merde', m: 'word' },

    // Endonezce / Malayca
    { t: 'bangsat', m: 'part' },
    { t: 'kontol', m: 'part' },
    { t: 'memek', m: 'part' },
    { t: 'ngentot', m: 'part' },
    { t: 'jancok', m: 'part' },
    { t: 'jancuk', m: 'part' },
    { t: 'pukimak', m: 'part' },
    { t: 'puki', m: 'word' },

    // Urduca / Hintçe (Latin harfli yazım yaygın)
    { t: 'madarchod', m: 'part' },
    { t: 'behenchod', m: 'part' },
    { t: 'bhenchod', m: 'part' },
    { t: 'chutiya', m: 'part' },
    { t: 'bhosdi', m: 'part' },
    { t: 'gandu', m: 'word' },
    { t: 'harami', m: 'word' },
    // Urduca (Arap harfli)
    { t: 'بہنچود', m: 'part' },
    { t: 'مادرچود', m: 'part' },
    { t: 'رنڈی', m: 'word' },
    { t: 'گانڈو', m: 'word' },
    { t: 'حرامی', m: 'word' },

    // Bengalce
    { t: 'খানকি', m: 'word' },
    { t: 'মাগি', m: 'word' },
    { t: 'khanki', m: 'word' }
];

const TERMS = RAW_TERMS.map(({ t, m, sq = true }) => {
    const folded = tokensOf(foldForFilter(t)).join('');
    return { mode: m, squeezeIt: sq, term: sq ? squeeze(folded) : folded };
});

/**
 * Ad başkalarına gösterilebilir mi?
 * @param {unknown} name
 * @returns {boolean} false: yasaklı bir terim içeriyor.
 */
export function isNameAllowed(name) {
    const tokens = tokensOf(foldForFilter(name));
    if (!tokens.length) return true;
    const joined = tokens.join('');
    const squeezedJoined = squeeze(joined);
    const words = new Set(tokens);
    const squeezedWords = new Set(tokens.map(squeeze));

    for (const { mode, squeezeIt, term } of TERMS) {
        if (mode === 'word') {
            if ((squeezeIt ? squeezedWords : words).has(term)) return false;
        } else if ((squeezeIt ? squeezedJoined : joined).includes(term)) {
            return false;
        }
    }
    return true;
}

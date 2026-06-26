/**
 * quotes-quran.json kalite düzeltmeleri (tek seferlik / tekrar çalıştırılabilir).
 */
const fs = require('fs');
const path = require('path');

const FILES = [
    path.join(__dirname, '..', 'data', 'quotes-quran.json'),
    path.join(__dirname, '..', 'public', 'data', 'quotes-quran.json')
];

const TEXT_FIXES = {
    en: {
        '13:28':
            'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.',
        '14:7':
            "And [remember] when your Lord proclaimed, 'If you are grateful, I will surely increase you [in favor]; but if you deny, indeed, My punishment is severe.'",
        '2:222':
            'And they ask you about menstruation. Say, "It is harm, so keep away from wives during menstruation. And do not approach them until they are pure. And when they have purified themselves, then come to them from where Allah has ordained for you. Indeed, Allah loves those who are constantly repentant and loves those who purify themselves."',
        '39:53':
            'Say, "O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful."'
    },
    fr: {
        '13:28':
            "Ceux qui ont cru et dont les cœurs se tranquillisent à l'évocation d'Allah. Certes, c'est par l'évocation d'Allah que les cœurs se tranquillisent."
    },
    id: {
        '13:28':
            '(yaitu) orang-orang yang beriman dan hati mereka menjadi tenteram dengan mengingat Allah. Ingatlah, hanya dengan mengingati Allah-lah hati menjadi tenteram.'
    },
    ms: {
        '13:28':
            '(Iaitu) orang-orang yang beriman dan hati mereka menjadi tenang tenteram dengan mengingati Allah. Ketahuilah, hanya dengan mengingati Allah hati menjadi tenang tenteram.'
    }
};

function applyFixes(data) {
    let changed = 0;
    for (const [loc, byRef] of Object.entries(TEXT_FIXES)) {
        const rows = data.quotes?.[loc];
        if (!rows) continue;
        for (const row of rows) {
            const key = `${row[0]}:${row[1]}`;
            const next = byRef[key];
            if (!next || row[2] === next) continue;
            row[2] = next;
            changed += 1;
        }
    }
    return changed;
}

for (const filePath of FILES) {
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const n = applyFixes(data);
    fs.writeFileSync(filePath, JSON.stringify(data) + '\n', 'utf8');
    console.log(path.relative(process.cwd(), filePath), '—', n, 'satır güncellendi');
}

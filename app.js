// ===================== DATA MODELS =====================
const APP_QUOTES = [
    "Ölmeden önce tövbe etmekte acele ediniz. (Hadis-i Şerif)",
    "Kalpler ancak Allah'ı anmakla mutmain olur. (Rad Suresi 28)",
    "Dua, müminin silahıdır. (Hadis-i Şerif)",
    "Kim bir iyilik yaparsa ona on katı vardır. (Enam Suresi 160)",
    "Zorlukla beraber şüphesiz bir kolaylık vardır. (İnşirah Suresi 5)",
    "Sizin en hayırlınız Kuran'ı öğrenen ve öğretendir. (Hadis-i Şerif)",
    "Namaz dinin direğidir. (Hadis-i Şerif)"
];

const DEFAULT_FOLDERS = [
    { id: 'f_default', name: 'Varsayılan Zikirler' },
    { id: 'f_esma', name: 'Esma\'ül Hüsna' }
];

const ESMA_LIST = [
    { name: "Yâ Rahman", target: 298, meaning: "Bütün mahlûkata merhamet eden." },
    { name: "Yâ Rahîm", target: 258, meaning: "Ahirette müminlere sonsuz ikramda bulunan." },
    { name: "Yâ Melik", target: 90, meaning: "Mülkün, kâinatın sahibi." },
    { name: "Yâ Kuddûs", target: 170, meaning: "Her noksanlıktan münezzeh olan." },
    { name: "Yâ Selâm", target: 131, meaning: "Tehlikelerden selamete çıkaran." },
    { name: "Yâ Mü'min", target: 136, meaning: "Güven veren, koruyan." },
    { name: "Yâ Müheymin", target: 145, meaning: "Her şeyi görüp gözeten." },
    { name: "Yâ Azîz", target: 94, meaning: "İzzet sahibi, her şeye galip olan." },
    { name: "Yâ Cebbâr", target: 206, meaning: "Dilediğini yapan ve yaptıran." },
    { name: "Yâ Mütekebbir", target: 662, meaning: "Büyüklükte eşi olmayan." },
    { name: "Yâ Hâlik", target: 731, meaning: "Yoktan var eden." },
    { name: "Yâ Bâri'", target: 214, meaning: "Kusursuz ve mütenasip yaratan." },
    { name: "Yâ Musavvir", target: 336, meaning: "Varlıklara şekil veren." },
    { name: "Yâ Gaffâr", target: 1281, meaning: "Günahları örten ve bağışlayan." },
    { name: "Yâ Kahhâr", target: 306, meaning: "Her şeye galip ve hakim olan." },
    { name: "Yâ Vehhâb", target: 14, meaning: "Karşılıksız nimetler veren." },
    { name: "Yâ Rezzâk", target: 308, meaning: "Her varlığın rızkını veren." },
    { name: "Yâ Fettâh", target: 489, meaning: "Her türlü sıkıntıları gideren." },
    { name: "Yâ Alîm", target: 150, meaning: "Geçmiş gelecek her şeyi bilen." },
    { name: "Yâ Kâbıd", target: 903, meaning: "Dilediğinin rızkını daraltan, ruhları alan." }
];

const DEFAULT_ZIKIRS = [
    { id: 'z_1', folderId: 'f_default', name: 'Subhanallah', target: 33, meaning: 'Allah her türlü eksiklikten münezzehtir.', count: 0, lastClicked: 0 },
    { id: 'z_2', folderId: 'f_default', name: 'Elhamdülillah', target: 33, meaning: "Hamd Allah'adır.", count: 0, lastClicked: 0 },
    { id: 'z_3', folderId: 'f_default', name: 'Allahü Ekber', target: 33, meaning: 'Allah en büyüktür.', count: 0, lastClicked: 0 },
    { id: 'z_4', folderId: 'f_default', name: 'La ilahe illallah', target: 100, meaning: "Allah'tan başka ilah yoktur.", count: 0, lastClicked: 0 }
];

ESMA_LIST.forEach((esma, index) => {
    DEFAULT_ZIKIRS.push({
        id: 'z_e_' + index, folderId: 'f_esma',
        name: esma.name, target: esma.target, meaning: esma.meaning,
        count: 0, lastClicked: 0
    });
});

const ZIKIR_LIBRARY = [
    {
        id: 'lib_1', category: 'gunluk',
        name: 'Sübhanallahi ve bihamdihi',
        meaning: 'Allah\'ı noksan sıfatlardan tenzih eder, O\'na hamdederim',
        context: 'Günde 100 defa söyleyenin günahları deniz köpüğü kadar olsa bile bağışlanır.',
        source: 'Buhari, Daavat 65; Müslim, Zikir 28',
        target: 100
    },
    {
        id: 'lib_2', category: 'sikinti',
        name: 'Hasbünallahü ve ni\'mel vekil',
        meaning: 'Allah bize yeter; O ne güzel vekildir.',
        context: 'Sıkıntı, dert ve zor bir durumla karşılaşıldığında okunması tavsiye edilir.',
        source: 'Kur\'an-ı Kerim, Al-i İmran: 173',
        target: 100
    },
    {
        id: 'lib_3', category: 'sukur',
        name: 'Elhamdülillah',
        meaning: 'Hamd (şükür ve övgü) Allah\'a mahsustur.',
        context: 'Allah\'ın verdiği nimetlere şükretmek amacıyla her an okunabilir. Mizanı doldurur.',
        source: 'Müslim, Taharet 1',
        target: 33
    },
    {
        id: 'lib_4', category: 'gunluk',
        name: 'Lâ ilâhe illallah',
        meaning: 'Allah\'tan başka ilah yoktur.',
    }
];

// State
let folders = [];
let zikirs = [];
let history = {};
let appSettings = { vibration: true, sound: false, wakeLock: false }; // { 'YYYY-MM-DD': { 'z_1': 15, 'z_2': 5 } }

let currentFolderId = null;
let currentZikirId = null;
let activeStatTab = 'daily';

// Limits
const MAX_FOLDERS = 3;
const MAX_ZIKIRS_PER_FOLDER = 6;

// Circle Constants
const CIRCLE_RADIUS = 130;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// ===================== DOM ELEMENTS =====================
const views = document.querySelectorAll('.view');
// Home View
const folderGrid = document.getElementById('folderGrid');
const folderLimitWarning = document.getElementById('folderLimitWarning');
const newFolderBtn = document.getElementById('newFolderBtn');
const dailyQuoteText = document.getElementById('dailyQuoteText');
// Folder Detail View
const folderDetailTitle = document.getElementById('folderDetailTitle');
const folderZikirList = document.getElementById('folderZikirList');
const zikirLimitWarning = document.getElementById('zikirLimitWarning');
const openAddZikirModalBtn = document.getElementById('openAddZikirModalBtn');
// Counter View
const countDisplay = document.getElementById('countDisplay');
const targetDisplay = document.getElementById('targetDisplay');
const totalDisplay = document.getElementById('totalDisplay');
const roundDisplay = document.getElementById('roundDisplay');
const zikirTitle = document.getElementById('zikirTitle');
const zikirNote = document.getElementById('zikirNote');
const progressCircle = document.getElementById('progressCircle');
const mainCounterBtn = document.getElementById('mainCounterBtn');
const decrementBtn = document.getElementById('decrementBtn');
const resetBtn = document.getElementById('resetBtn');

// Stats View
const tabBtns = document.querySelectorAll('.tab-btn');
const statMostClicked = document.getElementById('statMostClicked');
const statMostClickedCount = document.getElementById('statMostClickedCount');
const statLastClicked = document.getElementById('statLastClicked');
const activityChart = document.getElementById('activityChart');

// Stealth View
const enterStealthBtn = document.getElementById('enterStealthBtn');
const stealthZikirName = document.getElementById('stealthZikirName');
const stealthCounter = document.getElementById('stealthCounter');
const stealthClickArea = document.getElementById('stealthClickArea');
const exitStealthBtn = document.getElementById('exitStealthBtn');

// Library View
const openLibraryBtn = document.getElementById('openLibraryBtn');
const libraryGrid = document.getElementById('libraryGrid');
const libraryCategoryTabs = document.querySelectorAll('#libraryCategoryTabs .tab-btn');
const libraryDetailOverlay = document.getElementById('libraryDetailOverlay');
const libDetailName = document.getElementById('libDetailName');
const libDetailMeaning = document.getElementById('libDetailMeaning');
const libDetailContext = document.getElementById('libDetailContext');
const libDetailSource = document.getElementById('libDetailSource');
const prepLibraryAddBtn = document.getElementById('prepLibraryAddBtn');
const libraryFolderSelectOverlay = document.getElementById('libraryFolderSelectOverlay');
const libDestFolder = document.getElementById('libDestFolder');
const confirmLibraryAddBtn = document.getElementById('confirmLibraryAddBtn');

let selectedLibraryItem = null;
let activeLibraryCat = 'all';

// Settings
const openSettingsBtn = document.getElementById('openSettingsBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const cbVibration = document.getElementById('settingVibration');
const cbSound = document.getElementById('settingSound');
const cbWakeLock = document.getElementById('settingWakeLock');

// Modals
const addModalOverlay = document.getElementById('addModalOverlay');
const saveZikirBtn = document.getElementById('saveZikirBtn');
const editModalOverlay = document.getElementById('editModalOverlay');
const saveEditBtn = document.getElementById('saveEditBtn');
const editZikirTargetInp = document.getElementById('editZikirTarget');
const editZikirMeaningInp = document.getElementById('editZikirMeaning');
let editingZikirIdMap = null; // tracking edit

const copyModalOverlay = document.getElementById('copyModalOverlay');
const copyDestFolder = document.getElementById('copyDestFolder');
const saveCopyBtn = document.getElementById('saveCopyBtn');
const saveMoveBtn = document.getElementById('saveMoveBtn');
let copyingZikirId = null;


// ===================== INIT =====================
function init() {
    progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
    progressCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;

    loadData();
    setupEventListeners();
    setDailyQuote();
    showView('homeView');

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ===================== DATA =====================
function loadData() {
    const sv = localStorage.getItem('zikirmatik_data_v2');
    if (sv) {
        const d = JSON.parse(sv);
        folders = d.folders || [];
        zikirs = d.zikirs || [];
        history = d.history || {};
        appSettings = d.settings || { vibration: true, sound: false, wakeLock: false };

        // Migration for Esma folder (for existing users)
        if (!folders.find(f => f.id === 'f_esma')) {
            folders.push({ id: 'f_esma', name: 'Esma\'ül Hüsna' });
            ESMA_LIST.forEach((esma, index) => {
                zikirs.push({
                    id: 'z_e_' + index, folderId: 'f_esma',
                    name: esma.name, target: esma.target, meaning: esma.meaning,
                    count: 0, lastClicked: 0
                });
            });
            saveData();
        }

    } else {
        folders = [...DEFAULT_FOLDERS];
        zikirs = [...DEFAULT_ZIKIRS];
        history = {};
    }
    
    // Apply loaded settings to checkboxes
    if(cbVibration) cbVibration.checked = appSettings.vibration;
    if(cbSound) cbSound.checked = appSettings.sound;
    if(cbWakeLock) cbWakeLock.checked = appSettings.wakeLock;
}
function saveData() {
    localStorage.setItem('zikirmatik_data_v2', JSON.stringify({ folders, zikirs, history, settings: appSettings }));
}

function logClick(zId) {
    const today = getTodayString();
    if (!history[today]) history[today] = {};
    if (!history[today][zId]) history[today][zId] = 0;
    history[today][zId]++;
    
    // Update lastClicked
    const z = zikirs.find(x => x.id === zId);
    if (z) z.lastClicked = Date.now();
    
    saveData();
}

function logDecrement(zId) {
    const today = getTodayString();
    if (history[today] && history[today][zId] > 0) {
        history[today][zId]--;
    }
    saveData();
}

// ===================== ROUTING =====================
function showView(viewId, param = null) {
    views.forEach(v => {
        if (v.id === viewId) {
            v.classList.remove('hidden');
            v.classList.add('active');
        } else {
            v.classList.remove('active');
            v.classList.add('hidden');
        }
    });

    if (viewId !== 'counterView') {
        releaseWakeLock();
    }

    if (viewId === 'homeView') renderFolders();
    else if (viewId === 'folderDetailView') {
        currentFolderId = param;
        renderFolderDetail();
    } else if (viewId === 'counterView') {
        currentZikirId = param;
        updateCounterUI();
        if (appSettings.wakeLock) requestWakeLock();
    } else if (viewId === 'statsView') {
        renderStats();
    } else if (viewId === 'libraryView') {
        renderLibrary();
    }
}

// ===================== VIEWS =====================
function setDailyQuote() {
    const randomQuote = APP_QUOTES[Math.floor(Math.random() * APP_QUOTES.length)];
    dailyQuoteText.textContent = randomQuote;
}

function renderFolders() {
    folderGrid.innerHTML = '';
    folders.forEach(f => {
        const count = zikirs.filter(z => z.folderId === f.id).length;
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.innerHTML = `
            <span class="material-icons-outlined">folder</span>
            <h3>${f.name}</h3>
            <p>${count} Zikir</p>
        `;
        card.addEventListener('click', () => showView('folderDetailView', f.id));
        folderGrid.appendChild(card);
    });

    if (folders.length >= MAX_FOLDERS) {
        newFolderBtn.style.display = 'none';
        folderLimitWarning.classList.add('visible');
    } else {
        newFolderBtn.style.display = 'flex';
        folderLimitWarning.classList.remove('visible');
    }
}

function renderFolderDetail() {
    const folder = folders.find(f => f.id === currentFolderId);
    if (!folder) return;
    folderDetailTitle.textContent = folder.name;
    
    const fZikirs = zikirs.filter(z => z.folderId === currentFolderId);
    folderZikirList.innerHTML = '';
    
    fZikirs.forEach(z => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h3>${z.name}</h3>
            ${z.meaning ? `<p>${z.meaning.substring(0,40)}</p>` : ''}
            <div class="meta">
                <span>Hedef: ${z.target} 
                    <button class="edit-target-btn" data-id="${z.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>
                    <button class="edit-target-btn copy-btn" data-id="${z.id}"><span class="material-icons-outlined" style="font-size:16px;">content_copy</span></button>
                </span>
                <span>Okunan: ${z.count}</span>
            </div>
        `;
        
        li.addEventListener('click', (e) => {
            if(e.target.closest('.edit-target-btn') && !e.target.closest('.copy-btn')) {
                openEditModal(z.id, z.target, z.meaning);
                return;
            }
            if(e.target.closest('.copy-btn')) {
                openCopyModal(z.id);
                return;
            }
            showView('counterView', z.id);
        });
        folderZikirList.appendChild(li);
    });

    if (currentFolderId === 'f_esma') {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.remove('visible');
    } else if (fZikirs.length >= MAX_ZIKIRS_PER_FOLDER) {
        openAddZikirModalBtn.style.display = 'none';
        zikirLimitWarning.classList.add('visible');
    } else {
        openAddZikirModalBtn.style.display = 'flex';
        zikirLimitWarning.classList.remove('visible');
    }
}

function updateCounterUI() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir) return;

    zikirTitle.textContent = zikir.name;
    zikirNote.textContent = zikir.meaning || '';
    
    // Yalnızca mevcut turun sayısını hesapla
    let currentRoundDisplay = zikir.count % zikir.target;
    if (currentRoundDisplay === 0 && zikir.count > 0) currentRoundDisplay = zikir.target;
    if (zikir.count === 0) currentRoundDisplay = 0;
    
    countDisplay.textContent = currentRoundDisplay;
    targetDisplay.textContent = zikir.target;
    totalDisplay.textContent = zikir.count;
    
    // Stealth Update
    stealthZikirName.textContent = zikir.name;
    stealthCounter.textContent = zikir.count;

    const completedRounds = Math.floor(zikir.count / zikir.target);
    if (completedRounds > 0) {
        roundDisplay.textContent = completedRounds;
        roundDisplay.classList.add('visible');
    } else {
        roundDisplay.classList.remove('visible');
    }

    const progress = Math.min((zikir.count % zikir.target) / zikir.target, 1);
    let offset = CIRCLE_CIRCUMFERENCE - (progress * CIRCLE_CIRCUMFERENCE);
    
    if (zikir.count > 0 && zikir.count % zikir.target === 0) {
        offset = 0;
        mainCounterBtn.classList.remove('glow-burst');
        void mainCounterBtn.offsetWidth;
        mainCounterBtn.classList.add('glow-burst');
        if (navigator.vibrate) navigator.vibrate(200);
    }
    progressCircle.style.strokeDashoffset = offset;
}

// ===================== HARDWARE LOGIC =====================

let wakeLockRef = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator && appSettings.wakeLock && !wakeLockRef) {
            wakeLockRef = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log('WakeLock error:', err);
    }
}
function releaseWakeLock() {
    if (wakeLockRef) {
        wakeLockRef.release().then(() => wakeLockRef = null);
    }
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && appSettings.wakeLock && (views[2].classList.contains('active'))) {
        requestWakeLock();
    }
});

let audioCtx = null;
function playTickSound(isTarget) {
    if (!appSettings.sound) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (isTarget) {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else {
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start(); osc.stop(audioCtx.currentTime + 0.05);
        }
    } catch(e) {}
}

function handleVibration(isTarget) {
    if (!appSettings.vibration || !navigator.vibrate) return;
    if (isTarget) {
        navigator.vibrate([100, 50, 100]); // Uzun çift titreşim
    } else {
        navigator.vibrate(40); // Kısa titreşim
    }
}

function incrementCounter() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir) return;

    zikir.count++;
    logClick(zikir.id);
    updateCounterUI();
    
    const isTargetHit = (zikir.count % zikir.target === 0);
    handleVibration(isTargetHit);
    playTickSound(isTargetHit);
}

function decrementCounter() {
    const zikir = zikirs.find(z => z.id === currentZikirId);
    if (!zikir || zikir.count <= 0) return;

    zikir.count--;
    logDecrement(zikir.id);
    updateCounterUI();
}

// ===================== LIBRARY LOGIC =====================
function renderLibrary() {
    libraryGrid.innerHTML = '';
    const filtered = activeLibraryCat === 'all' ? ZIKIR_LIBRARY : ZIKIR_LIBRARY.filter(z => z.category === activeLibraryCat);
    
    filtered.forEach(z => {
        const card = document.createElement('div');
        card.className = 'library-card';
        card.innerHTML = `
            <span class="material-icons-outlined lib-badge" title="Onaylı Kaynak">verified</span>
            <h3>${z.name}</h3>
            <p>${z.meaning.substring(0,40)}...</p>
        `;
        card.addEventListener('click', () => openLibraryDetail(z));
        libraryGrid.appendChild(card);
    });
}

function openLibraryDetail(z) {
    selectedLibraryItem = z;
    libDetailName.textContent = z.name;
    libDetailMeaning.textContent = z.meaning;
    libDetailContext.textContent = z.context;
    libDetailSource.textContent = z.source;
    libraryDetailOverlay.classList.add('active');
}

// ===================== STATS LOGIC =====================
function renderStats() {
    let targetDays = [];
    if (activeStatTab === 'daily') {
        targetDays = [getTodayString()];
    } else {
        // Last 7 days
        for(let i=6; i>=0; i--){
            const d = new Date();
            d.setDate(d.getDate() - i);
            targetDays.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        }
    }

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
        statMostClicked.textContent = z ? z.name : 'Bilinmeyen';
        statMostClickedCount.textContent = `${topZikirCount} kez`;
    } else {
        statMostClicked.textContent = '-';
        statMostClickedCount.textContent = 'Veri yok';
    }

    // Son çekilen (genel)
    let lastZikir = [...zikirs].sort((a,b) => b.lastClicked - a.lastClicked)[0];
    if (lastZikir && lastZikir.lastClicked > 0) {
        statLastClicked.textContent = lastZikir.name;
    } else {
        statLastClicked.textContent = '-';
    }

    // 2) Grafik Render
    // Son 7 Günlük basit veri oluştur
    activityChart.innerHTML = '';
    const last7Days = [];
    for(let i=6; i>=0; i--){
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d);
    }

    let maxDayCount = 1;
    let dayTotals = last7Days.map(d => {
        const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        let tot = 0;
        if(history[ds]) Object.values(history[ds]).forEach(v => tot += v);
        if(tot > maxDayCount) maxDayCount = tot;
        return { label: d.toLocaleDateString('tr-TR', {weekday: 'short'}), val: tot };
    });

    // Determine nice Y-axis max (e.g. nearest 10, 50, 100, 500)
    let yMax = 10;
    if(maxDayCount > 10) yMax = Math.ceil(maxDayCount / 10) * 10;
    if(maxDayCount > 100) yMax = Math.ceil(maxDayCount / 100) * 100;
    if(maxDayCount > 1000) yMax = Math.ceil(maxDayCount / 500) * 500;

    const chartYAxis = document.getElementById('chartYAxis');
    if (chartYAxis) {
        chartYAxis.innerHTML = `
            <span>${yMax}</span>
            <span>${Math.floor(yMax / 2)}</span>
            <span>0</span>
        `;
    }

    dayTotals.forEach(dt => {
        const group = document.createElement('div');
        group.className = 'chart-bar-group';
        const hPct = Math.max((dt.val / yMax)*100, 3); // min 3% height to show it exists if 0 is 0
        const barH = dt.val === 0 ? '4px' : `${hPct}%`;
        const col = dt.val === 0 ? 'var(--glass-border)' : 'var(--primary-green)';
        group.innerHTML = `
            <div class="chart-bar" data-tooltip="${dt.val} Zikir" style="height: ${barH}; background: ${col}"></div>
            <div class="chart-label">${dt.label}</div>
        `;
        activityChart.appendChild(group);
    });
}

// ===================== EVENT LISTENERS & MODALS =====================
function setupEventListeners() {
    // Back Buttons
    document.querySelectorAll('.backBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            showView(btn.getAttribute('data-target'), currentFolderId);
        });
    });

    document.getElementById('openStatsBtn').addEventListener('click', () => showView('statsView'));

    // Stealth Mode Listeners
    if(enterStealthBtn) enterStealthBtn.addEventListener('click', () => showView('stealthView'));
    if(stealthClickArea) stealthClickArea.addEventListener('click', incrementCounter);
    if(exitStealthBtn) exitStealthBtn.addEventListener('click', () => showView('counterView', currentZikirId));

    // Library Integration
    if(openLibraryBtn) openLibraryBtn.addEventListener('click', () => showView('libraryView'));
    
    libraryCategoryTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            libraryCategoryTabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeLibraryCat = btn.getAttribute('data-cat');
            renderLibrary();
        });
    });

    if(prepLibraryAddBtn) prepLibraryAddBtn.addEventListener('click', () => {
        if(!selectedLibraryItem) return;
        libraryDetailOverlay.classList.remove('active');
        
        libDestFolder.innerHTML = '';
        folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            libDestFolder.appendChild(opt);
        });

        if(libDestFolder.options.length === 0) return alert("Lütfen önce bir klasör oluşturun.");
        libraryFolderSelectOverlay.classList.add('active');
    });

    if(confirmLibraryAddBtn) confirmLibraryAddBtn.addEventListener('click', () => {
        const destId = libDestFolder.value;
        if(!destId) return;
        const destCount = zikirs.filter(x => x.folderId === destId).length;
        if(destCount >= MAX_ZIKIRS_PER_FOLDER) return alert("Hedef klasör dolu (Maks 6 zikir).");

        zikirs.push({
            id: 'z_' + Date.now(),
            folderId: destId,
            name: selectedLibraryItem.name,
            target: selectedLibraryItem.target,
            meaning: selectedLibraryItem.meaning,
            count: 0, lastClicked: 0
        });
        saveData();
        libraryFolderSelectOverlay.classList.remove('active');
        showView('folderDetailView', destId);
    });

    // Custom Folders
    newFolderBtn.addEventListener('click', () => {
        const name = prompt('Yeni Klasör Adı:');
        if (name && name.trim()) {
            folders.push({ id: 'f_' + Date.now(), name: name.trim() });
            saveData();
            renderFolders();
        }
    });

    // ZikirmatiK Counter
    mainCounterBtn.addEventListener('click', incrementCounter);
    if(decrementBtn) decrementBtn.addEventListener('click', decrementCounter);
    resetBtn.addEventListener('click', () => {
        const z = zikirs.find(x => x.id === currentZikirId);
        if (z && confirm(`'${z.name}' sıfırlanacak. Onaylıyor musunuz?`)) {
            z.count = 0;
            saveData();
            updateCounterUI();
        }
    });

    // Settings
    if(openSettingsBtn) openSettingsBtn.addEventListener('click', () => settingsOverlay.classList.add('active'));
    
    const updateSettings = () => {
        if(cbVibration) appSettings.vibration = cbVibration.checked;
        if(cbSound) appSettings.sound = cbSound.checked;
        if(cbWakeLock) appSettings.wakeLock = cbWakeLock.checked;
        saveData();
    };
    if(cbVibration) cbVibration.addEventListener('change', updateSettings);
    if(cbSound) cbSound.addEventListener('change', updateSettings);
    if(cbWakeLock) cbWakeLock.addEventListener('change', updateSettings);

    // Modals Handling
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById(btn.getAttribute('data-modal')).classList.remove('active');
        });
    });

    openAddZikirModalBtn.addEventListener('click', () => {
        addModalOverlay.classList.add('active');
    });

    saveZikirBtn.addEventListener('click', () => {
        const n = document.getElementById('newZikirName').value.trim();
        const t = parseInt(document.getElementById('newZikirTarget').value);
        const m = document.getElementById('newZikirMeaning').value.trim();
        
        if(!n) return alert('Zikir adı gerekli.');
        if(isNaN(t) || t < 1) return alert('Geçerli hedef yazın.');

        zikirs.push({
            id: 'z_' + Date.now(),
            folderId: currentFolderId,
            name: n, target: t, meaning: m, count: 0, lastClicked: 0
        });
        saveData();
        addModalOverlay.classList.remove('active');
        renderFolderDetail();

        // clear
        document.getElementById('newZikirName').value = '';
        document.getElementById('newZikirTarget').value = '33';
        document.getElementById('newZikirMeaning').value = '';
    });

    // Edit Target Handle
    saveEditBtn.addEventListener('click', () => {
        const val = parseInt(editZikirTargetInp.value);
        if(!isNaN(val) && val > 0 && editingZikirIdMap) {
            const z = zikirs.find(x => x.id === editingZikirIdMap);
            if(z) {
                z.target = val;
                z.meaning = editZikirMeaningInp.value.trim();
                saveData();
                renderFolderDetail();
            }
            editModalOverlay.classList.remove('active');
            editingZikirIdMap = null;
        }
    });

    // Copy / Move
    saveCopyBtn.addEventListener('click', () => processCopyMove('copy'));
    saveMoveBtn.addEventListener('click', () => processCopyMove('move'));

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeStatTab = btn.getAttribute('data-tab');
            renderStats();
        });
    });
}

function openEditModal(zId, t, m) {
    editingZikirIdMap = zId;
    editZikirTargetInp.value = t;
    editZikirMeaningInp.value = m || '';
    editModalOverlay.classList.add('active');
}

function openCopyModal(zId) {
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
        alert("Hedeflenecek başka klasör yok. Lütfen önce yeni bir klasör oluşturun.");
        return;
    }
    
    copyModalOverlay.classList.add('active');
}

function processCopyMove(actionType) {
    if(!copyingZikirId) return;
    const destFolderId = copyDestFolder.value;
    if(!destFolderId) return;

    // Limit check in destination
    const destCount = zikirs.filter(z => z.folderId === destFolderId).length;
    if(destCount >= MAX_ZIKIRS_PER_FOLDER) {
        alert("Hedef klasör dolu (Maks 6 zikir).");
        return;
    }

    const z = zikirs.find(x => x.id === copyingZikirId);
    if(z) {
        if(actionType === 'copy') {
            zikirs.push({
                ...z,
                id: 'z_' + Date.now(),
                folderId: destFolderId,
                count: 0 // Reset in new folder
            });
        } else if (actionType === 'move') {
            z.folderId = destFolderId;
        }
        saveData();
        renderFolderDetail();
        copyModalOverlay.classList.remove('active');
    }
}

window.addEventListener('DOMContentLoaded', init);

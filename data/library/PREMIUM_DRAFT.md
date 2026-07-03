# Premium kütüphane — taslak (çalışma dosyası)

Kaynak: `premium-tr.draft.json` · **Sıradaki id:** `plib_64` · **Taslak toplam:** 50 dua

**Shipped:** `premium-tr.json` ← 50 madde.

**EN overlay:** `premium-id.json` ← 50 madde (`name` Latin + `meaning`/`context` EN).

**BN / UR okunuş:** `bn.json` / `ur.json` ← 50 premium `name`.

**AR okunuş:** `ar.json` ← 50 premium `name`.

**Mükerrer:** Yalnızca **aynı okunuş** (`name`); meal/bağlam/fazilet aynı olabilir.

**Namaz/ezan partisi (ertelendi):** `plib_47`, `plib_49`, `plib_50` id'leri boş — ezan, istihare, tahiyyetü'l-mescid sonra özel pakette.

**Batch kuralı:** Her 10 yeni dua/zikirde çeviriler (EN + BN + UR + AR) tamamlanmadan merge veya sonraki partiye geçilmez → `.cursor/rules/library-batch-i18n.mdc`.

**Mükerrer:** Yalnızca **aynı okunuş** (`name`) tekrarında geçerli; meal/bağlam/fazilet aynı olabilir, farklı cümleler kalır.

---

## Ücretsiz kütüphanede zaten olanlar (aynı metin — premium’a tekrar eklenmedi)

| id (ücretsiz) | Metin | Not |
|---------------|--------|-----|
| `lib_d_uyaninca` | *Elhamdülillâhillezî ahyânâ ba'de mâ emâtenâ…* | Buhari/Müslim (sahih) |
| `lib_d_uyku` | *Bismike Allahümme ehya ve emût* | **Çözüldü:** yalnız ücretsizde; `plib_08` premium’dan kaldırıldı |
| `lib_d_yeni_elbise` | *Elhamdülillâhillezî kezâni hâzâ ve mâ kuntu muahhıran…* | **plib_11 ile yakın** (farklı rivayet); ücretsizde kalsın, premium’da 4023 metni |
| `lib_d_evden_cikis` | *Bismillâhi tevekkeltü alallâhi…* | Evden **çıkış**; `plib_15` eve **giriş** |
| `lib_d_tuvalet_cikis` | *Ğufreâneke* | Tuvalet **çıkışı** (Aişe, sahih); `plib_16` hamd duası — ikisi birlikte okunabilir |
| `lib_d_yemek_once` | *Bismillâh* | **plib_29** yemek önünde bereket; **plib_28** besmele unutulunca |
| `lib_d_yemek_sonra` | *Elhamdülillâhillezî et'amenâ…* (kısa) | **plib_31** tam form (mağfiret rivayeti, hasen) |
| `lib_d_arac` | *Sübhânellezî sehhara lenâ hâzâ* (kısa) | **plib_33** tam form + dönüş cümlesi |
| `lib_d_evden_cikis` | *Bismillâhi tevekkeltü…* (kısa) | **plib_32** tam form (sığınma duası ekli) |
| `lib_d_cami_cikis` | *Allâhümme innî es'elüke min fadlik* | **plib_41 kaldırıldı** — aynı metin; `plib_19` (farklı metin, aynı bağlam) duruyor |

---

## Taslak listesi

| # | id | Tür | Ad (kısa) | Kaynak | Ne zaman |
|---|-----|-----|-----------|--------|----------|
| 1 | `plib_07` | dua | Uyanınca hamd (afiyet, ruh) | Tirmizi 3401 (hasen) | Uykudan uyanınca |
| 2 | `plib_09` | dua | La ilâhe illâ ente… (gece uyanınca) | Ebu Davud 5061 (hasen) | Gece uykudan uyanınca |
| 4 | `plib_10` | dua | Allahümme lekel hamdü ente kesevtenîhi… | Ebu Davud 4020; Tirmizi 1767 | Yeni elbise giyince |
| 5 | `plib_11` | dua | Elhamdülillâh… kesânî hâzâs-sevbe… | Ebu Davud 4023 (hasen) | Elbise giyince (günlük/yeni) |
| 6 | `plib_12` | dua | Elhamdülillâh… mâ ûrî bihi avretî… | Tirmizi 3560 (hasen garîb) | Yeni elbise giyince |
| 7 | `plib_13` | dua | Tüblî ve yuhlifullâhu teâlâ | Ebu Davud 4020; Tirmizi 1767 | Yeni elbise giyene **karşı** söylenir |
| 8 | `plib_14` | dua | Bismillâhillezî lâ ilâhe illâ Hû | İbnü's-Sünni 273; El-Ezkar | Elbise çıkarırken (yıkanma/uyku) |
| 9 | `plib_15` | dua | Allahümme innî es'elüke hayrel mevlic… | Ebu Davud 5096 (hasen) | Eve girerken |
| 10 | `plib_16` | dua | Elhamdülillâhillezî ezhebe anniel-ezâ… | İbn Mace 301; El-Ezkar | Tuvalet/heladan çıkarken |
| 11 | `plib_17` | dua | Allahümme'c'al fî kalbî nûran… | Buhari 6316; Müslim; Ebu Davud 1353 | Mescide giderken |
| 12 | `plib_18` | dua | Bismillâh… salli alâ Muhammed… rahmetik | İbn Mace 771 (sahih) | Mescide girerken |
| 13 | `plib_19` | dua | Bismillâh… salli alâ Muhammed… fadlik | İbn Mace 771 (sahih) | Mescidden çıkarken |
| 14 | `plib_20` | dua | Estağfirullah… Hayyul-Kayyûm… | Tirmizi 3397 (hasen); El-Ezkar | Yatarken ×3 |
| 15 | `plib_21` | dua | Seyyidü'l-istiğfar | Buhari 6306; Müslim (sahih) | Sabah / yatarken |
| 16 | `plib_22` | dua | Hammi vel hazen… | Buhari 6369; Müslim (sahih) | Kaygı, sıkıntı |
| 17 | `plib_23` | dua | Abdest sonrası şehadet | Müslim 559 (sahih) | Abdest bitince |
| 18 | `plib_24` | dua | Zehebez-zama'… | Ebu Davud 2357; İbn Mace (sahih) | İftar |
| 19 | `plib_25` | dua | Rüzgar duası | Müslim 899 (sahih) | Rüzgar / fırtına |
| 20 | `plib_26` | dua | Asbahna… | Müslim 2723 (sahih) | Sabah |
| 21 | `plib_27` | dua | Amsayna… | Müslim 2723 (sahih) | Akşam |
| 22 | `plib_29` | dua | Allahümme bârik lenâ fîhi… | Ebu Davud 3730 (hasen) | Yemeğe başlarken |
| 23 | `plib_28` | dua | Bismillahi evvelahu ve âhirahu | Ebu Davud; Nesâî (sahih) | Besmele unutulunca |
| 24 | `plib_31` | dua | Elhamdülillâh… et'amani hadha… | Tirmizi 3458 (hasen) | Yemekten sonra (mağfiret) |
| 25 | `plib_30` | dua | Allahümme ecirnî minen-nâr ×3 | Tirmizi 2572 (sahih) | Gün içinde (ateşten sığınma) |
| 26 | `plib_32` | dua | Evden çıkış (tam form) | Ebu Davud 5095 (sahih) | Evden çıkarken |
| 27 | `plib_33` | dua | Sübhânellezî sehhara… (tam) | Müslim 1342 (sahih) | Araca binince |
| 28 | `plib_34` | dua | Yolculuk duası | Müslim 1342 (sahih) | Seyahat başlarken |
| 29 | `plib_35` | dua | Gök gürültüsü tesbihi | Buhari 611 (sahih) | Gök gürleyince |
| 30 | `plib_36` | dua | Af ve afiyet duası | İbn Mace 3845 (hasen sahih) | Sabah-akşam / gün içi |
| 31 | `plib_37` | dua | Çarşı/pazara girerken | Müslim 1469 (sahih) | Pazar, çarşı girişi |
| 32 | `plib_39` | dua | Musibet gören (afiyette) | Tirmizi 3432 (hasen sahih) | Felç, körlük vb. gören |
| 33 | `plib_40` | dua | Yağmur yağınca | Buhari/Müslim (sahih) | Yağmur başlayınca |
| 34 | `plib_42` | dua | İstiâze (şeytandan sığınma) | Kur'an 16:98; Buhari/Müslim (sahih) | Kur'an öncesi, öfke, vesvese |
| 35 | `plib_43` | dua | İki secde arası | Müslim 484 (sahih) | Namazda secde arası oturuş |
| 36 | `plib_44` | dua | Ayetel Kürsi (yatmadan) | Buhari 5010/Müslim (sahih) | Uyumadan önce |
| 37 | `plib_45` | dua | Hasta ziyareti teselli | Buhari/Müslim (sahih) | Hasta ziyaretinde |
| 38 | `plib_46` | dua | Hasta için şifa duası | Tirmizi 3538 (sahih) | Hasta ziyaretinde şifa |
| 39 | `plib_48` | dua | Selamdan sonra istiğfar ×3 | Müslim 591 (sahih) | Farz namaz sonrası |
| 40 | `plib_51` | dua | Zikir ve şükür duası | Ebu Davud/Nesâî (sahih) | Namaz sonrası |
| 41 | `plib_52` | dua | Helal rızık duası | Tirmizi 3563 (hasen sahih) | Rızık, borç sıkıntısı |
| 42 | `plib_53` | dua | Nikah tebrik | Ebu Davud/Tirmizi (hasen sahih) | Düğün, nikah |
| 43 | `plib_54` | dua | Cenaze duası | Müslim/Ebu Davud (sahih) | Cenaze namazı |
| 44 | `plib_55` | dua | Küfür ve fakirlikten sığınma | Ebu Davud/İbn Mace/Tirmizi (sahih) | Gün içi siğaye |
| 45 | `plib_56` | dua | Hapşırma cevabı | Buhari/Müslim (sahih) | Yerhamükallah → Yahdikumullah |
| 46 | `plib_57` | dua | Anne-baba duası | Kur'an 17:24 | Ebeveyn için |
| 47 | `plib_58` | dua | Maşallah (beğeni) | Müslim/Tirmizi (sahih) | Beğenilen şey görünce |
| 48 | `plib_60` | dua | Yeni doğan tebrik | Tirmizi 1443 (hasen sahih) | Doğum müjdesi |
| 49 | `plib_61` | dua | Evlilik siğayesi | Buhari/Müslim (sahih) | Nikah hayatı |
| 50 | `plib_62` | dua | Sabah-akşam koruma ×3 | Ebu Davud/Tirmizi (sahih) | Sabah ve akşam |
| 51 | `plib_63` | dua | Yehdina ve yehdikümullah | Buhari/Müslim (sahih) | Yerhamükallah cevabı (2. cümle) |

**Not (batch 5):** `plib_56` + `plib_63` hapşırma adabı (farklı okunuş, aynı bağlam). `plib_59` (misafir / birleşik metin) kaldırıldı; `id` boş.

**Not (batch 4):** `plib_48`, `plib_51`–`plib_54`; ezan/istihare/tahiyyet (`plib_47`, `49`, `50`) ertelendi. `plib_55` eklendi.

---

### plib_07 — uyanınca

- **Arapça:** الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي وَرَدَّ عَلَيَّ رُوحِي وَأَذِنَ لِي بِذِكْرِهِ
- **Bağlam:** Ebu Hüreyre (r.a.) → uyandığında okurdu.
- **Kaynak:** Tirmizi, hasen.

### plib_08 — (kaldırıldı)

Yatağa girince duası (`Bismike Allahümme ehya ve emût`) **ücretsiz** `lib_d_uyku` olarak kalır; premium’da **aynı metin** olduğu için `plib_08` silindi. `id` boş bırakıldı (yeniden kullanılmaz).

### plib_09 — gece uykudan uyanınca

- **Okunuş:** La ilâhe illâ ente sübhâneke Allahümme estağfiruke li zenbi ve es'elüke rahmeteke Allahümme zidnî ilmen ve lâ tuziğ kalbî ba'de iz hedeytenî ve heb lî min ledünke rahmeten inneke entel-Vehhâb
- **Arapça:** لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ اللَّهُمَّ أَسْتَغْفِرُكَ لِذَنْبِي وَأَسْأَلُكَ رَحْمَتَكَ اللَّهُمَّ زِدْنِي عِلْمًا وَلَا تُزِغْ قَلْبِي بَعْدَ إِذْ هَدَيْتَنِي وَهَبْ لِي مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ
- **Bağlam:** Hz. Aişe (r.a.) → gece uykudan uyandığında okurdu (yatağa yatarken değil).
- **Kaynak:** Ebu Davud 5061, hasen; El-Ezkar’da uyku/uyanma bölümünde.

### plib_10 — yeni elbise (hayır-şer duası)

- **Okunuş:** Allahümme lekel hamdü ente kesevtenîhi es'elüke hayrahu ve hayra mâ suni'a lehu ve eûzü bike min şerrihi ve şerri mâ suni'a lehu
- **Bağlam:** Ebu Saîd el-Hudrî (r.a.) → yeni elbise giyince önce adını söyler (gömlek/sarık/ridâ), sonra okurdu.
- **Kaynak:** Ebu Davud 4020; Tirmizi 1767, hasen.

### plib_11 — elbise giyince (magfire)

- **Okunuş:** Elhamdülillâhillezî kesânî hâzâs-sevbe ve rezekanîhi min gayri havlin minnî ve lâ kuvveh
- **Bağlam:** Muaz b. Enes (r.a.) → okuyanın günahları affedilir.
- **Not:** Ücretsiz `lib_d_yeni_elbise` benzer ama farklı rivayet metni.

### plib_12 — yeni elbise (avret örtüsü)

- **Okunuş:** Elhamdülillâhillezî kesânî mâ ûrî bihi avretî ve etecemmelu bihi fî hayâtî
- **Bağlam:** Hz. Ömer (r.a.) → yeni elbise giyince; Nevevî El-Ezkar’da da geçer.
- **Kaynak:** Tirmizi 3560, hasen garîb.

### plib_13 — yeni elbise giyene tebrik (karşı taraf)

- **Okunuş:** Tüblî ve yuhlifullâhu teâlâ
- **Arapça:** تُبْلِي وَيُخْلِفُ اللَّهُ تَعَالَى
- **Bağlam:** Ebu Saîd el-Hudrî (r.a.) → Sahabe yeni elbise giyene böyle derdi. **Giyen değil, karşıdaki söyler.**
- **Kaynak:** Ebu Davud 4020; Tirmizi 1767 (plib_10 ile aynı hadisin devamı).

### plib_14 — elbise çıkarırken

- **Okunuş:** Bismillâhillezî lâ ilâhe illâ Hû
- **Arapça:** بِسْمِ اللَّهِ الَّذِي لَا إِلَهَ إِلَّا هُوَ
- **Bağlam:** Enes (r.a.) → çıkarmadan önce okuyanın avreti ile cin arasında perde olur. Yıkanma, uyku, elbise çıkarma.
- **Kaynak:** İbnü's-Sünni 273; Taberânî; Nevevî El-Ezkar. Kısa metin: *Bismillah* — Tirmizi 606.

### plib_15 — eve girerken

- **Okunuş:** Allahümme innî es'elüke hayrel mevlic ve hayrel mahrec. Bismillâhi velecna ve bismillâhi haracna ve alallâhi rabbina tevekkelna
- **Arapça:** اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا
- **Bağlam:** Ebu Mâlik el-Eş'arî (r.a.) → eve girince okur, sonra ailesine selam verir.
- **Kaynak:** Ebu Davud 5096, hasen; El-Ezkar.

### plib_16 — tuvalet/heladan çıkarken

- **Okunuş:** Elhamdülillâhillezî ezhebe anniel-ezâ ve âfânî
- **Arapça:** الْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنِّي الأَذَى وَعَافَانِي
- **Bağlam:** Enes (r.a.) → heladan çıkınca okurdu.
- **Not:** Ücretsiz `lib_d_tuvalet_cikis` (*Ğufreâneke*, Aişe rivayeti) ile birlikte okunabilir.

### plib_17 — mescide giderken (nur duası)

- **Okunuş:** Allahümme'c'al fî kalbî nûran ve fî lisânî nûran… ve a'zim lî nûran
- **Bağlam:** İbn Abbas (r.a.) → namaza/mescide çıkarken okurdu.
- **Kaynak:** Buhari 6316; Müslim 763; Ebu Davud 1353; El-Ezkar.
- **Not:** Ücretsiz `lib_d_cami_giris` camiye **giriş** içindir; bu dua **yolda**.

### plib_18 — mescide girerken

- **Okunuş:** Bismillâh. Allâhümme salli alâ Muhammed. Allâhümme'ğfir lî zünûbî veftah lî ebvâbe rahmetik
- **Arapça hadis:** بِسْمِ اللَّهِ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ … أَبْوَابَ رَحْمَتِكَ
- **Bağlam:** Fatıma bint Resûlillah (r.a.) → mescide girince.
- **Not:** Ücretsiz `lib_d_cami_giris` yalnızca *Allâhümmeftah li ebvâbe rahmetik* (kısa).

### plib_19 — mescidden çıkarken

- **Okunuş:** Bismillâh. Allâhümme salli alâ Muhammed. Allâhümme'ğfir lî zünûbî veftah lî ebvâbe fadlik
- **Arapça hadis:** … وَافْتَحْ لِي أَبْوَابَ فَضْلِكَ (girişten farkı: **fadl**)
- **Bağlam:** Fatıma bint Resûlillah (r.a.) → mescidden çıkınca.
- **Not:** Ücretsiz `lib_d_cami_cikis` yalnızca *Allâhümme innî es'elüke min fadlik* (kısa).

### plib_20 — Hayy-Kayyum istiğfar duası

- **Okunuş:** Estağfirullahellezî lâ ilâhe illâ Hûvel-Hayyul-Kayyûmu ve etûbu ileyh
- **Arapça:** أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ
- **Bağlam:** Ebu Saîd (r.a.) → yatağa yatarken 3×; günahların affı (Tirmizi 3397, hasen). Cuma gününde istiğfarı artırma (El-Ezkar).
- **Kaynak:** Tirmizi 3397; Nevevî, El-Ezkar.
- **Hedef:** `target: 3` (hadis: yatarken üç kez)

### plib_21 — seyyidü'l-istiğfar

- **Kaynak:** Buhari 6306; Müslim 2702 (sahih). Sabah veya yatarken.

### plib_22 — kaygı ve keder

- **Kaynak:** Buhari 6369; Müslim 2707 (sahih). Hamd, hazan, acizlik, borç vb.

### plib_23 — abdest sonrası

- **Kaynak:** Müslim 559 (sahih). Şehadet + tövbe edenlerden eyle.

### plib_24 — iftar

- **Kaynak:** Ebu Davud 2357; İbn Mace 1752 (sahih).

### plib_25 — rüzgar

- **Kaynak:** Müslim 899 (sahih).

### plib_26 — sabah

- **Kaynak:** Müslim 2723 (sahih). Asbahna…

### plib_27 — akşam

- **Okunuş:** Amsayna ve amsal-mulku lillâhi velhamdü lillâhi, lâ ilâhe illallâhu vahdehû lâ şerîke leh
- **Bağlam:** plib_26'nın akşam karşılığı; Abdullah b. Mes'ud rivayeti.
- **Kaynak:** Müslim 2723 (sahih).

### plib_28 — yemekte besmele unutulunca

- **Kaynak:** Ebu Davud; Nesâî (sahih). Ücretsiz `lib_d_yemek_once` yalnızca *Bismillâh*.

### plib_29 — yemeğe başlarken (bereket)

- **Okunuş:** Allâhümme bârik lenâ fîhi ve at'imnâ hayran minhu
- **Bağlam:** İbn Abbas rivayeti; yemeğe başlarken. Liste sırasında plib_28'den önce (önce → unutma → sonra).
- **Kaynak:** Ebu Davud 3730; Tirmizi 3455 (hasen).

### plib_30 — ateşten sığınma (×3)

- **Hedef:** `target: 3`
- **Bağlam:** Yemekle özel bağlı değil; gün içinde herhangi bir zamanda.
- **Kaynak:** Tirmizi 2572; Nesâî 5521 (sahih).

### plib_31 — yemekten sonra (mağfiret)

- **Kaynak:** Tirmizi 3458 (hasen garîb); Muaz b. Enes rivayeti. Ücretsiz `lib_d_yemek_sonra` kısa metin.

### plib_32 — evden çıkış (tam)

- **Not:** Ücretsiz `lib_d_evden_cikis` kısa form; bu hadisin tam duası (sığınma cümleleri ekli).
- **Kaynak:** Ebu Davud 5095; Tirmizi 3427 (sahih).

### plib_33 — araca binince (tam)

- **Not:** Ücretsiz `lib_d_arac` yalnızca ilk cümle; bu tam form (*ve innâ ilâ rabbina le munkalibûn*).
- **Kaynak:** Müslim 1342 (sahih).

### plib_34 — yolculuk duası

- **Bağlam:** plib_33'ten sonra veya seyahat başında; birlikte okunur.
- **Kaynak:** Müslim 1342 (sahih).

### plib_35 — gök gürültüsü

- **Kaynak:** Buhari 611; Müslim 2081 (sahih). plib_25 rüzgar duasından farklı (gök gürlemesi).

### plib_36 — af ve afiyet

- **Okunuş:** Allâhümme innî es'elükel-afve vel-âfiyete fid-dünyâ vel-âhirah…
- **Bağlam:** İbn Ömer rivayeti; sabah ve akşam okunur. Eski hasta-görünce metni (Tirmizi 3431, zayıf sened) kaldırıldı.
- **Kaynak:** İbn Mace 3845; Ebu Davud 5090 (hasen sahih).

### plib_37 — çarşı/pazara girerken

- **Okunuş:** Allahümme innî es'elüke hayra hâzihis-sûki ve hayra mâ fîhâ ve es'elüke min şerri hâzihis-sûki ve şerri mâ fîhâ
- **Bağlam:** Selman-ı Farisî (r.a.) → Hz. Peygamber çarşı/pazara girerken.
- **Kaynak:** Müslim, Büyû' 23 (nr. 1469); sahih.

### plib_38 — (kaldırıldı → ileride zikir adayı)

**Metin:** *Lâ ilâhe illallâhu vahdehu lâ şerîke leh, lehul-mulku ve lehul-hamdu yuhyî ve yumîtu ve huve Hayyun lâ yemûtu bi yedihil-hayr ve huve alâ külli şey'in Kadîr*

Premium duadan çıkarıldı. Çarşıdan çıkış bağlamı (Müslim, Büyû' 1469) bu zikrin asıl faziletini yansıtmıyor; kullanıcı notu: en faziletli zikirlerden biri olarak bilinir.

**İleride zikir olarak eklerken** (ayrı `id`, `category: zikir`, hedef sayı ve fazilet metni):
- **Tirmizi 3465** (sahih): Günde 100 kez → on köle azat etme sevabı, yüz hasene, yüz günah silinmesi, o gün şeytandan korunma vb.
- **Müslim 2691** ve sabah-akşam zikir rivayetleri (aynı tevhid cümlesi ailesi)
- Müslim 1469 yalnızca **isteğe bağlı bağlam notu**; ana meal/fazilet yukarıdaki kaynaklardan
- `fazilet` alanı TR locale'de gösterilir; non-TR politikasına uygun şekilde

`id` boş bırakıldı (yeniden kullanılmaz).

### plib_39 — musibet gören (afiyette)

- **Okunuş:** Elhamdülillâhillezî âfânî mimmâbtelâke bihî ve faddalanî alâ kesîrin mimmen halaka tafdîlâ
- **Bağlam:** Ebu'd-Derdâ (r.a.) → musibet gören birine gizlice/içinden okunur; okuyan musibete uğramaz denir.
- **Kaynak:** Tirmizi, Daavât 86 (nr. 3432); hasen sahih.

### plib_40 — yağmur yağınca

- **Okunuş:** Mutirnâ bi fadlillâhi ve rahmetih
- **Bağlam:** Abdullah b. Zübeyr (r.a.) → yağmur yağınca Hz. Peygamber söylerdi.
- **Kaynak:** Buhari, Vudu 73; Müslim, Istiska 4 (sahih).

### plib_41 — (kaldırıldı)

**Metin:** *Allahümme innî es'elüke min fadlike* — ücretsiz `lib_d_cami_cikis` ile **aynı metin** (mükerrer). `plib_19` aynı bağlamda farklı metin olduğu için duruyor.

`id` boş bırakıldı (yeniden kullanılmaz).

### plib_42 — istiâze (şeytandan sığınma)

- **Okunuş:** E'ûzu billâhi mineş-şeytânirracîm
- **Bağlam:** Kur'an okumadan önce (Nahl 16/98), öfke ve vesvesede.
- **Kaynak:** Kur'an 16:98; Buhari 6114 (sahih).

### plib_43 — iki secde arası

- **Okunuş:** Rabbigfir lî, Rabbigfir lî
- **Bağlam:** Huzeyfe b. Yaman (r.a.) → namazda iki secde arasında.
- **Kaynak:** Müslim, Mesâcid 88 (nr. 484); sahih.

### plib_44 — Ayetel Kürsi (yatmadan)

- **Okunuş:** Allâhu lâ ilâhe illâ huvel-Hayyul-Kayyûm… (Bakara 255 tam metin)
- **Bağlam:** Ebu Hüreyre (r.a.) → yatağa yatarken; sabaha kadar koruyucu tayin edilir.
- **Not:** Ücretsiz `lib_d_uyku` (*Bismike Allahümme ehya ve emût*) farklı dua; mükerrer değil.
- **Kaynak:** Buhari, Veda 39 (nr. 5010); Müslim, Müsafirin 212 (sahih).

### plib_45 — hasta ziyareti teselli

- **Okunuş:** Lâ be'se tahûrun inşâallah
- **Bağlam:** Usâme b. Zeyd (r.a.) → hasta ziyaretinde teselli.
- **Kaynak:** Buhari, Merda 17; Müslim, Birr 46 (sahih).

### plib_46 — hasta için şifa duası

- **Okunuş:** Es'elullâhel-Azîme Rabbel-Arşil-Azîmi en yeşfiyek
- **Bağlam:** Sa'd b. Ebi Vakkas (r.a.) → hasta ziyaretinde şifa duası.
- **Kaynak:** Tirmizi, Daavât 111 (nr. 3538); Ebu Davud 3106; Tirmizi: sahih.

### plib_47 — (ertelendi → namaz/ezan paketi)

Ezan duası. Sonra özel pakette; `id` boş.

### plib_49 — (ertelendi → namaz/ezan paketi)

İstihare duası. Sonra özel pakette; `id` boş.

### plib_50 — (ertelendi → namaz/ezan paketi)

Tahiyyetü'l-mescid duası. Sonra özel pakette; `id` boş.

### plib_48 — selamdan sonra istiğfar

- **Hedef:** `target: 3`
- **Bağlam:** Farz namaz selamından hemen sonra.
- **Kaynak:** Müslim 591 (sahih).

### plib_51 — zikir ve şükür

- **Bağlam:** Namaz sonrası; Muaz b. Cebel'e öğretilen dua.
- **Kaynak:** Ebu Davud 1522; Nesâî; Tirmizi 3551 (sahih).

### plib_52 — helal rızık

- **Bağlam:** Rızık, borç ve helal kazanç için.
- **Kaynak:** Tirmizi 3563 (hasen sahih).

### plib_53 — nikah tebrik

- **Bağlam:** Nikah/düğünde damada tebrik.
- **Kaynak:** Ebu Davud 2130; Tirmizi 1091 (hasen sahih).

### plib_54 — cenaze duası

- **Bağlam:** Cenaze namazında ölen Müslüman için.
- **Kaynak:** Müslim 963; Ebu Davud 3221 (sahih).

### plib_55 — küfür ve fakirlikten sığınma

- **Okunuş:** Allahümme innî eûzü bike minel küfri vel fakri
- **Bağlam:** Enes b. Malik rivayetinde Hz. Peygamberin sıkça okuduğu siğaye; iman ve geçim için.
- **Kaynak:** Ebu Davud 5085; İbn Mace 3830; Tirmizi 3499 (sahih).

### plib_56 — hapşırma cevabı

- **Okunuş:** Yahdikumullâhu ve yuslihu bâlekum
- **Bağlam:** “Yerhamükallah” denilince karşıdakilere hidayet ve ıslah dileği.
- **Kaynak:** Buhari, Et'ime 28; Müslim, Zikir 31 (sahih).

### plib_57 — anne-baba duası

- **Kaynak:** Kur'an 17:24.

### plib_58 — beğeni (maşallah)

- **Kaynak:** Müslim 1315; Tirmizi 3459 (sahih).

### plib_59 — (kaldırıldı)

Misafir duası ve birleşik hapşırma metni burada tutulmadı; `id` boş.

### plib_60 — yeni doğan tebrik

- **Not:** `plib_53` nikah tebrikinden farklı metin (mevhûb = bağışlanan çocuk).
- **Kaynak:** Tirmizi 1443 (hasen sahih).

### plib_61 — evlilik siğayesi

- **Kaynak:** Buhari 141; Müslim 1434 (sahih).

### plib_62 — sabah-akşam koruma

- **Hedef:** `target: 3` (sabah ve akşam)
- **Kaynak:** Ebu Davud 5088; Tirmizi 3388 (sahih).

### plib_63 — yehdina ve yehdikümullah

- **Okunuş:** Yehdina ve yehdikümullah
- **Bağlam:** “Yerhamükallah”dan sonra hem kendine hem duanı yapanlara hidayet dileği.
- **Kaynak:** Buhari, Et'ime 28; Müslim, Zikir 31 (sahih).

---

## Önizleme

```bash
npm run draft:preview
```

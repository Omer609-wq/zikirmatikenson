# Dua/Zikir Referans Korpusları

Bu klasör, kütüphaneye **yeni dua/zikir eklerken** Arapça metni ve kaynak künyesini
doğrulamak için kullanılan referans veridir. **Uygulamaya dahil değildir** —
`data/library/*` gibi import edilmez, pakete girmez; yalnızca yazım/doğrulama aşamasında
başvurulur.

Amaç: içeriği hafızadan üretmek yerine **doğrulanmış metinden kopyalamak**. İki bağımsız
korpus bir arada tutulur; yeni madde eklerken ikisi de referans alınır
(bkz. `.cursor/rules/dua-source-verification.mdc`).

---

## 1) `fitrahive-dua-dhikr/`

- **Kaynak:** https://github.com/fitrahive/dua-dhikr (`data/dua-dhikr/<kategori>/en.json`)
- **İndirme:** 2026-10-08, dal `main`
- **Lisans:** MIT (© 2023 Fitrahive)
- **Kapsam:** 97 madde — `daily-dua` (38), `dhikr-after-salah` (13), `evening-dhikr` (19),
  `morning-dhikr` (19), `selected-dua` (8). (Yalnız EN dosyaları alındı; ID de mevcut.)
- **Alanlar:** `title`, `arabic`, `latin` (transliterasyon), `translation`, `notes`,
  `benefits`/`fawaid`, `source`.
- **Soy:** Endonezya dua/zikir geleneği; derecelendirme büyük ölçüde **Elbânî** tahkiki
  (Sahîhu't-Terğîb, Sahîhu'l-Câmi', es-Sahîha, el-İrvâ). Adı konmuş tek bir eser yok;
  künyeler **doğrudan birincil hadis kaynaklarına** (Buhari, Müslim, Ebû Dâvûd, Tirmizî,
  Nesâî, Ahmed, İbn Mâce, Edebü'l-Müfred, Amelü'l-Yevm) verilir.
- **Güçlü yanı:** Kaynak künyesi var → "hangi kitapta" bilgisi.
- **Dikkat:** Numaralar standart/matbu (sunnah.com uyumlu) şema; künye yazımı yer yer
  tutarsız ("HR." = Endonezce "rivayet etti", "al-Bukari" gibi dizgi hataları);
  3 maddede `source` boş. Alan adı bazen `benefits` bazen `fawaid`.

## 2) `hisnul-muslim-qahtani/`

- **Kaynak:** https://github.com/rn0x/hisnmuslim_app (`public/json/hisnmuslim.json`)
- **İndirme:** 2026-10-08
- **Lisans:** MIT (kod). Metin: Saîd b. Ali b. Vehf **el-Kahtânî**'nin *Hısnu'l-Müslim*
  eseri (serbest dağıtım geleneği); ses dosyaları hisnmuslim.com.
- **Kapsam:** Tam kitap — 132 bölüm, 267 madde.
- **Alanlar:** `category`, `array[].text` (Arapça), `count` (tekrar sayısı), `audio`,
  `filename`. **Çeviri ve kaynak künyesi YOK.**
- **Soy:** Doğrudan el-Kahtânî'nin Hüsnü'l-Müslim'i — fitrahive'den **bağımsız soy**.
- **Güçlü yanı:** Tam kapsam + otantik Arapça + resmi ses.
- **Dikkat:** Sadece Arapça; kaynak doğrulaması için fitrahive/hadis kaynağı gerekir.

---

## İki korpus neden birlikte?

Farklı soydan geldikleri için **Arapça metinde anlaşmaları anlamlıdır**:

| | fitrahive | Hüsnü'l-Müslim (rn0x) |
|---|---|---|
| Kapsam | 97 (seçki) | 267 (tam kitap) |
| Arapça | ✓ | ✓ |
| Kaynak künyesi | ✓ | ✗ |
| Çeviri/translit | ✓ (EN/ID) | ✗ |
| Soy | Endonezya + Elbânî | el-Kahtânî doğrudan |

## Yapılan doğrulama (2026-10-08)

- **fitrahive künyeleri bağımsız teyit:** 6 madde (Buhari/Müslim/Ebû Dâvûd/Tirmizî),
  Arapça metin ilgili koleksiyonda **%100** bulundu (fawazahmed0 hadith-api Arapça
  nüshalarına karşı, harekesiz normalize). Numara şeması veritabanları arası farklı;
  repo standart şemayı izliyor.
- **İki korpus arası Arapça uyumu:** ortak 5 duada **5/5** (harekesiz).

## Türkçe meal notu

Hiçbir referans Türkçe meal içermez. Türkçe meal ve ton **projeye özgü yazılır**
(bkz. `.cursor/rules/i18n-religious-content.mdc`); referanslar yalnızca Arapça + kaynak
+ kapsam için kullanılır. Fazilet politikası değişmedi (zayıf-popüler fazilet bu
korpuslarda zaten yoktur).

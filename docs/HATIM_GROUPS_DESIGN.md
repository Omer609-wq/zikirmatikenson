# Paylaşımlı hatim grupları — tasarım notu

`COMMUNITY_DESIGN.md` sonundaki "Hatim grupları (sonraki tur)" bölümünde park edilen
kararların açılmış hâli. Amaç kodu iki kez yazmamak: veri modeli ve kurallar arayüzü
değil, arayüz zaten bitti — burada karara bağlanan şey backend.

**Durum (12 Eylül 2026):** arayüz, 8 dil çevirisi ve yerel model bitti
(`lib/hatim-groups.js`, `lib/hatim-juz.js`, `lib/hatim-dua.js`). Eksik olan tek şey
grupların cihazlar arasında paylaşılması.

---

## 1. Kapsam kararı: Android ve iOS birlikte, 1 Ekim 2026

| | |
|---|---|
| Android | Kişisel + paylaşımlı hatim |
| iOS | Kişisel + paylaşımlı hatim — **uygulamanın ilk App Store lansmanı** |

İlk taslak v1'i Android'e kesiyordu; 13 Eylül'de karar değişti, iki platform birlikte
çıkar. iOS tarafı hatim kodundan bağımsız, kendi başına bir lansman işi ve takvimin
kritik yolu orası:

- Windows'tan build hattı (GitHub Actions macOS runner + imzalama) — şu an hiç CI yok
- CocoaPods + Firebase iOS (`GoogleService-Info.plist`, `includePlugins`)
- **Apple ile Giriş** — Google girişi olan uygulamada App Store şartı
- **Uygulama içi hesap silme** — hesap açtıran uygulamada App Store şartı
- İlk gönderim paketi (ekran görüntüleri, App Privacy, yaş derecelendirmesi) ve ilk inceleme

İlk incelemede bir ret turu olağan; bu yüzden **gönderim en geç 26-27 Eylül.**

> **Topluluk, backend hazır olana kadar yayınlanan sürümlerde gizli kalır**
> (`COMMUNITY_UI_VISIBLE`, `app.js`).
> Bu yalnızca kullanıcı deneyimi kararı değil: sekme yayınlanırsa kullanıcılar
> buluta hiç ulaşmamış, cihaza gömülü "paylaşımlı" gruplar oluşturur ve backend
> gelince elimizde bir **göç problemi** olur. Sekme hiç açılmazsa o problem hiç doğmaz.

---

## 2. Kimlik

Bugün `appMeta.memberId` cihaza özel rastgele bir dize (`app.js` → `getLocalMemberId`).
Hesap değil: cihaz değişince kimlik kaybolur, kimse kimseye atfedilemez.

**Karar:** paylaşımlı hatim **hesap ister** — Android'de Google girişi, iOS'ta Google +
**Apple ile Giriş** (App Store şartı). `memberId` yerine Firebase `uid` kullanılır.
Android'de altyapı zaten var — `lib/cloud-backup.js` içindeki
`signInWithGoogleForBackup()` ve `@capacitor-firebase/authentication`.

Kişisel hatim girişsiz çalışmaya devam eder. Giriş yalnızca gruba girerken istenir;
uygulamanın geri kalanı hesapsız kullanılabilir olmayı sürdürür.

`byName` (cüz altında görünen ad) hesaptan bağımsız kalır: kullanıcı gruba istediği adla
katılır, Google hesabındaki ad zorlanmaz.

---

## 3. Veri modeli

```
hatimCodes/{code}                 ← kod → hatim araması (6 hane)
    hatimId: string

hatims/{hatimId}
    name: string (≤40)            ← kullanıcı içeriği, bkz. §7
    code: string
    ownerUid: string
    createdAt: timestamp
    rev: number                   ← cüz tablosu her değiştiğinde artar
    memberCount: number

hatims/{hatimId}/members/{uid}
    name: string (≤20)            ← kullanıcı içeriği
    joinedAt: timestamp

hatims/{hatimId}/juz/{n}          ← n: "1".."30"
    state: 'free' | 'claimed' | 'done'
    by: uid | null
    byName: string | null
    claimedAt / completedAt: timestamp | null
```

**Neden ayrı `members` koleksiyonu:** üyelik cüz sahipliğinden ayrı tutulur. Aksi hâlde
10 kişilik bir grupta 3 kişi cüz almışsa grup 3 kişilik görünür — yanlış ve moral bozucu.
Katılımcı listesi, engelleme ve `memberCount` bu koleksiyona dayanır.

**Neden `hatimCodes` ayrı bir indeks:** gruba henüz üye olmayan biri, gruba sorgu atma
yetkisine sahip olmamalı. Küçük ve okunabilir bir indeks dokümanı standart çözüm.
Kodun uzayı 31⁶ ≈ 887 milyon; tarama pratik değil.

### Tek doküman mı, alt koleksiyon mu — Temmuz kararının revizyonu

`COMMUNITY_DESIGN.md` "30 cüz tek dokümanda dizi olarak tutulur" diyordu; gerekçe tek
okumada tüm tablonun gelmesiydi. **Burada alt koleksiyon öneriliyor.** Sebep:

Firestore güvenlik kurallarında bir **dizi elemanının** değişimini kısıtlamak
(«yalnızca `juz[5]`, yalnızca `free`→`claimed`, yalnızca kendi adına») pratikte
yazılamaz. Alt koleksiyonda aynı kural üç satır ve test edilebilir. Yazılamayan kural,
yazılmamış kuraldır.

Okuma maliyeti `rev` alanıyla kapatılır: açılışta önce ana doküman okunur (1 okuma);
`rev` yerel önbellekle aynıysa 30 okuma hiç yapılmaz. Tablo yalnızca gerçekten
değiştiğinde çekilir.

Ek fayda: her cüz kendi dokümanı olduğu için doküman başına yazma çekişmesi ortadan
kalkar.

---

## 4. Cüz kapma — transaction

Aynı cüzü iki kişinin alması yalnızca transaction ile önlenir:

```
transaction:
  oku  hatims/{id}/juz/{n}
  eğer state !== 'free' → hata 'taken'   (arayüzde zaten karşılığı var)
  yaz  state='claimed', by=uid, byName=ad, claimedAt=now
  yaz  hatims/{id}.rev += 1
```

`bitirdim` ve `bırak` da aynı yolu kullanır. Yerel model (`lib/hatim-groups.js`) zaten
`{ok:false, reason:'taken'}` dönüyor ve arayüz bunu gösteriyor — sunucu tarafı aynı
sözleşmeyi konuşacak, arayüzde değişiklik gerekmiyor.

---

## 5. Güvenlik kuralları

| Yol | Okuma | Yazma |
|---|---|---|
| `hatimCodes/{code}` | giriş yapmış herkes | yalnızca oluşturma, kod boştaysa |
| `hatims/{id}` | üyeler | yalnızca sahibi (ad), `rev` transaction içinden |
| `hatims/{id}/members/{uid}` | üyeler | kişi kendi kaydını yazar; sahibi silebilir |
| `hatims/{id}/juz/{n}` | üyeler | üye, yalnızca `free`→`claimed` kendi adına; kendi cüzünde `claimed`↔`done`; sahibi zorla boşaltabilir |

Sahibin zorla boşaltması yerel modelde zaten var: `releaseJuz(group, n, uid, {force:true})`.
Kayıp üyenin üstünde kalan cüz hatmi kilitliyor; bu kaçış yolu korunur.

**Kural testleri v1'de kesilmez** — `COMMUNITY_DESIGN.md` §11 "kesilmeyecekler"
listesindeki gerekçe burada da geçerli: yazılmamış kural sessizce yanlış olur.

**App Check** gün birinde **izleme kipinde** açılır, zorlama sonra. Zorlamayı sonradan
açmak eski sürüm kullanıcılarını kırar; izleme kipi kimseyi kırmaz ama veriyi toplar.

---

## 6. Çevrimdışı

Uygulama bugün tamamen çevrimdışı çalışıyor; grup çalışmayacak. Karar:

- Cüz tablosu son görülen hâliyle **okunur** gösterilir (önbellekten).
- Kapma/bitirme çevrimdışıyken **denenmez**, kullanıcıya bağlantı gerektiği söylenir.
  Kuyruğa alınmaz: kuyruktaki bir kapma, çevrimiçi olunduğunda çoktan alınmış bir cüze
  düşer ve kullanıcı "aldım" sandığı cüzü kaybeder.
- Kişisel hatim çevrimdışı çalışmaya devam eder, hiçbir şey değişmez.

---

## 7. Kullanıcı içeriği (UGC)

Grup adı (≤40) ve takma ad (≤20) başka kullanıcıların ekranında görünür. Bu, Google Play
UGC politikasını tetikler. Gereken **mekanizmalardır**, sürekli moderasyon operasyonu
değil — gruplar kapalı, kod olmadan kimse göremiyor.

| Gereken | v1 karşılığı |
|---|---|
| Şikâyet | Grup ekranında "Şikâyet et" → `reports` koleksiyonuna kayıt |
| Engelleme | Sahibi üyeyi gruptan çıkarır; cüzleri `force` ile serbest kalır |
| Hızlı kaldırma | Şikâyet edilen grubu kapatabilecek bir yol (konsol yeterli) |
| Kullanım şartları | `docs/gizlilik-pages` yanına yayımlanır, uygulamadan bağlantı |

Ayrıca Play Console'da **Data Safety** ve **içerik derecelendirme anketi** güncellenir
(beyan, başvuru değil — anında kaydedilir).

---

## 8. Maliyet

Grup açılışı: 1 okuma (`rev` kontrolü), tablo değiştiyse +30. Yazma: cüz başına 2
(cüz + `rev`). Hatim sınırı kip başına 5 (`HATIM_LIMIT_PER_KIND`), yani üst sınır dar.

Halkaların §4.3'teki "özet okuma" maliyet problemi burada **yok**: hatim tablosu
Ramazan'da bile dakikada değil, günde birkaç kez değişir.

---

## 9. v1 dışı

- Katılımcı adlarının listelenmesi (veri modeli hazır, arayüz sonra)
- Mesajlaşma — ayrıca tartışıldı, serbest metin moderasyon yükü getiriyor
- Sabit ifadeli tepkiler ("Allah kabul etsin")
- Alınıp bitirilmeyen cüz için "hatırlat"
- Derin bağlantı (App Links) — v1'de düz kod + mağaza linki, ilk güncellemede
- Yöneticiliği devretme — v1'de yönetici ayrılamaz, yalnızca siler (bkz. §10)

---

## 10. Üyelik yaşam döngüsü

| Rol | Yapabildiği |
|---|---|
| Yönetici (grubu kuran) | Grubu siler. **Ayrılamaz.** |
| Katılımcı | Gruptan ayrılır. Silemez. |

**Sınır dolunca** yeni grup kurma ve katılma kapanır; kullanıcı önce bir gruptan ayrılır
ya da yöneticisi olduğu bir grubu siler. Mevcut `groupLimitWarning` metni zaten bunu
söylüyor.

**Ayrılınca cüzler:** yalnızca *alınmış ama bitmemiş* cüzler boşa düşer. *Bitmiş* cüzler
bitmiş kalır — okuma yapılmıştır, bir üyenin ayrılması hatmi geri götürmemeli.

**Yönetici neden ayrılamaz:** ayrılırsa grubun sahibi kalmaz; kimse grubu silemez,
kaybolan üyenin cüzünü `releaseJuz(force)` ile kimse boşaltamaz ve hatim kilitlenir.
Bedeli: yönetici grubu başkasına devredip çıkamaz. Devretme v1 dışı.

**Silme onayı diğer katılımcıları da söyler.** Grup herkesten gider. Mevcut `deleteConfirm`
("…cüz kayıtların da silinir") yalnızca kişinin kendisini anıyor; paylaşımlı grup için
katılımcı sayısını söyleyen yeni metin gerekir.

**Hayalet grup — sınır kilitlenmesin diye şart.** Yönetici grubu silince katılımcının
cihazında grup listede kalabilir: hem sınırı işgal eder hem de artık var olmayan bir
gruptan ayrılmak mümkün olmaz. İstemci listeyi yenilerken sunucuda bulunmayan grubu
yerelden kendisi siler ve yeri boşaltır.

**12 ay kuralı sınırla ilgili değil.** Kimsenin dokunmadığı grup 12 ay sonra sunucudan
silinir — bu Data Safety'deki veri saklama beyanı içindir. Kullanıcının sınırı hiçbir
zaman 12 ay beklemez; her an ayrılarak yer açar.

---

## 11. Karara bağlananlar

1. **Davet bağlantısı:** v1'de App Links yok; paylaşım metni kod + mağaza linki taşır.
   Bedeli: davet edilen kişi kodu nereye yazacağını arar. İlk güncellemede eklenir.
2. **Silme ve ayrılma:** §10.
3. **Veri saklama:** 12 ay hareketsiz grup sunucudan silinir.
4. **Giriş:** grup kurmak ve katılmak hesap ister (§2); kişisel hatim girişsiz.
5. **Program:** Android + iOS birlikte 1 Ekim 2026. Halkaların yürüyen iskeleti bundan
   sonraya kaydı; `COMMUNITY_DESIGN.md` §11 takvimi buna göre kayar.

## 12. Açık sorular

1. **Cloud Functions gerekir mi?** Bu tasarım gerektirmiyor (kurallar + transaction
   yetiyor). Gerekirse Firebase **Blaze planı** şart — kredi kartı ister.
2. **Giriş zorunluluğu kullanıcıyı kaçırır mı?** Ölçmeden bilinmez.

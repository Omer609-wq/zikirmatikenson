# Paylaşımlı hatim grupları — tasarım notu

`COMMUNITY_DESIGN.md` sonundaki "Hatim grupları (sonraki tur)" bölümünde park edilen
kararların açılmış hâli. Amaç kodu iki kez yazmamak: veri modeli ve kurallar arayüzü
değil, arayüz zaten bitti — burada karara bağlanan şey backend.

**Durum (12 Eylül 2026):** arayüz, 8 dil çevirisi ve yerel model bitti
(`lib/hatim-groups.js`, `lib/hatim-juz.js`, `lib/hatim-dua.js`). Eksik olan tek şey
grupların cihazlar arasında paylaşılması.

---

## 1. Kapsam kararı: v1 yalnızca Android

| | |
|---|---|
| Android | Kişisel + paylaşımlı hatim |
| iOS | Yalnızca kişisel hatim, Grupla sekmesi gizli |

Gerekçe: iOS henüz yayında değil (yalnızca geliştirici hesabı açıldı),
`capacitor.config.json` içindeki iOS `includePlugins` listesinde Firebase yok, ve iOS'ta
hesap gerekirse **Apple ile Giriş mağaza şartı** olur (Google girişi mevcut olduğu için).
Bu üç iş v1'in en pahalı kalemi ve şu an hiçbir kullanıcıyı etkilemiyor.

Emsal var: bulut yedekleme de `isCloudBackupPlatform()` ile Android'e özel.

> **Grupla sekmesi, backend hazır olana kadar yayınlanan sürümlerde gizli kalır.**
> Bu yalnızca kullanıcı deneyimi kararı değil: sekme yayınlanırsa kullanıcılar
> buluta hiç ulaşmamış, cihaza gömülü "paylaşımlı" gruplar oluşturur ve backend
> gelince elimizde bir **göç problemi** olur. Sekme hiç açılmazsa o problem hiç doğmaz.

---

## 2. Kimlik

Bugün `appMeta.memberId` cihaza özel rastgele bir dize (`app.js` → `getLocalMemberId`).
Hesap değil: cihaz değişince kimlik kaybolur, kimse kimseye atfedilemez.

**Karar:** paylaşımlı hatim **Google girişi ister**, `memberId` yerine Firebase `uid`
kullanılır. Altyapı zaten var — `lib/cloud-backup.js` içindeki
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
- Derin bağlantı (App Links) — bkz. §10

---

## 10. Açık sorular

1. **Davet bağlantısı.** Firebase Dynamic Links kapandı. Kendi alan adında açılış sayfası
   + Android App Links gerekir. Olmadan huni şu: kodu paylaş → kur → kodu nereye
   yazacağını ara. Kayıp yüksek. v1'e girsin mi, yoksa ilk turda düz kod mu?
2. **Cloud Functions gerekir mi?** Bu tasarım gerektirmiyor (kurallar + transaction
   yetiyor). Gerekirse Firebase **Blaze planı** şart — kredi kartı ister.
3. **Grup silinince ne olur?** Sahibi silince tüm üyelerden mi gider, yoksa terk mi
   edilir? Veri saklama süresi (terk edilmiş gruplar) ayrıca kararlaştırılmalı.
4. **Giriş zorunluluğu kullanıcıyı kaçırır mı?** Gruba katılmak için Google girişi
   isteniyor; ölçmeden bilinmez.

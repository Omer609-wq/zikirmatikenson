# RevenueCat Kurulum Rehberi (Premium Abonelik)

Kod tarafı hazır (`lib/premium-purchase.js`). Faturalandırmayı canlıya almak için
aşağıdaki panel adımları tamamlanmalı. API anahtarı boş kaldığı sürece uygulama
mevcut "stub" davranışında kalır — hiçbir şey bozulmaz.

## Yerel yapılandırma (.env.local)

Anahtarları repoya yazmayın. Proje kökünde `.env.local` oluşturun (gitignore'da):

```env
VITE_PREMIUM_PREVIEW=1
VITE_REVENUECAT_API_KEY_ANDROID=goog_...
```

Şablon: `.env.local.example` → kopyala, değerleri doldur, `npm run cap:sync`.

Build sonrası Vite bu değerleri bundle'a gömer; `cap:release:android` çalıştırırken
`.env.local` içinde `VITE_PREMIUM_PREVIEW=1` açıksa verify script build'i durdurur
(yanlışlıkla premium'lu store build'i önlemek için).

---

## 1) Google Play Console (önce bu)

1. **Ödeme profili:** Play Console → Setup → Payments profile → banka + vergi
   bilgileri. Doğrulama birkaç gün sürebilir; en erken bunu başlat.
2. **Abonelik ürünü:** Monetize → Subscriptions → Create subscription
   - Product ID: `premium`
   - Base plan 1: `monthly` (1 ay, otomatik yenilenen) → fiyat ₺34,99
   - Base plan 2: `yearly` (1 yıl, otomatik yenilenen) → fiyat ₺279,99
3. **%15 komisyon:** Monetize → Program subscriptions → küçük geliştirici
   programına (yıllık <$1M) kayıt ol.
4. **Lisanslı test hesabı:** Play Console → Settings → License testing →
   kendi Gmail adresini ekle (test satın alımları para çekmez).
5. AAB'yi en az **Internal testing** kanalına bir kez yükle (faturalandırma
   izni Play'e tanıtılır; ürünler ancak bundan sonra aktifleşir).

## 2) RevenueCat paneli (app.revenuecat.com)

1. Hesap + proje aç (ücretsiz plan yeterli — aylık ~$2.500 gelire kadar).
2. **Google Play bağlantısı:** Project → Apps → Google Play uygulaması ekle
   (paket adı: `com.omerzikirmatik.app`). Play Console servis hesabı
   anahtarını (JSON) RevenueCat'in yönergesiyle oluşturup yükle.
3. **Entitlement:** Project → Entitlements → yeni entitlement, kimlik: `premium`
   (koddaki `PREMIUM_ENTITLEMENT_ID` ile aynı olmalı).
4. **Products:** Play'deki `premium:monthly` ve `premium:yearly` ürünlerini içe
   aktar, ikisini de `premium` entitlement'ına bağla.
5. **Offering:** `default` offering içine iki paket ekle:
   - `$rc_monthly` → aylık ürün
   - `$rc_annual` → yıllık ürün
   (Kod, `current` offering'in `monthly`/`annual` paketlerini okur.)
6. **API anahtarı:** Project → API keys → Google Play public key (`goog_...`)
   → `.env.local` içindeki `VITE_REVENUECAT_API_KEY_ANDROID`.

## 3) Test (Internal testing üzerinden)

USB debug build'de gerçek faturalandırma ÇALIŞMAZ; Play'den kurulmalı.

1. `.env.local`: `VITE_PREMIUM_PREVIEW=1` + `VITE_REVENUECAT_API_KEY_ANDROID`
2. `npm run cap:sync` → AAB → Internal testing'e yükle
3. Test hesabıyla telefonda:
   - Satın al → premium açıldı mı?
   - Play'den iptal et → süre bitince kapandı mı?
   - "Satın alımı geri yükle" çalışıyor mu?
   - Stub notu gizlendi mi, fiyatlar mağazadan geliyor mu?
4. Test bitince `.env.local`'ı sil veya `VITE_PREMIUM_PREVIEW`'ı kapat

## 4) iOS (App Store'a çıkarken)

1. App Store Connect'te aynı abonelikleri oluştur.
2. RevenueCat'e App Store uygulaması ekle, ürünleri bağla.
3. `.env.local` → `VITE_REVENUECAT_API_KEY_IOS` (`appl_...`)

---

## Lansman checklist (production)

Store'a abonelikli sürüm çıkmadan önce:

### Panel ve hesaplar
- [ ] Play ödeme profili onaylı
- [ ] Abonelik `premium` + planlar `monthly` / `yearly` **Active**
- [ ] RevenueCat ↔ Play servis hesabı bağlı, ürünler senkron
- [ ] RC entitlement `premium`, offering `default` + `$rc_monthly` / `$rc_annual`
- [ ] Lisanslı test hesabıyla Internal testing'de uçtan uca test tamam

### Kod ve build
- [ ] `.env.local` → `VITE_REVENUECAT_API_KEY_ANDROID` dolu (release build'de bundle'a girer)
- [ ] `app.js`: `PREMIUM_LIVE = true` (lansman commit'i; preview bayrağına güvenme)
- [ ] `PREMIUM_UI_VISIBLE = true` (Premium sekmesi görünür)
- [ ] `.env.local` silindi veya `VITE_PREMIUM_PREVIEW` kapalı → `npm run cap:release:android` geçiyor
- [ ] `npm test` geçiyor

### Play Console inceleme
- [ ] **App access:** abonelik var → **Evet** + test hesabı / satın alma adımları
- [ ] Gizlilik politikası URL'si (web) RevenueCat / Play billing'i kapsıyor
- [ ] Uygulama içi: otomatik yenileme metni (`autoRenewNote`) + gizlilik ekranı billing bölümü

### Lansman sonrası izleme
- [ ] RevenueCat dashboard: ilk satın almalar görünüyor mu?
- [ ] İptal / süre dolumu → `entitlements.premium` false oluyor mu?
- [ ] Destek: "Geri yükle" butonu yeterli mi?

---

## Notlar

- Fiyatlar canlıda **mağazadan** gelir (ülkeye göre yerel para birimi);
  koddaki TRY değerleri yalnızca mağaza yüklenene kadarki yedektir.
- Satın alma onayı (acknowledge) ve abonelik yaşam döngüsü (yenileme, iptal,
  ödeme bekleme) RevenueCat tarafından yönetilir; uygulama tek dinleyiciden
  (`onEntitlementChange`) beslenir.
- API anahtarı public key'dir; yine de repoya commit etmeyin — `.env.local` kullanın.

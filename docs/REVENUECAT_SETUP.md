# RevenueCat Kurulum Rehberi (Premium Abonelik)

Kod tarafı hazır (`lib/premium-purchase.js`). Faturalandırmayı canlıya almak için
aşağıdaki panel adımları tamamlanmalı. API anahtarı boş kaldığı sürece uygulama
mevcut "stub" davranışında kalır — hiçbir şey bozulmaz.

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
   → `lib/premium-purchase.js` içindeki `REVENUECAT_API_KEY_ANDROID` sabitine
   yapıştır.

## 3) Test (Internal testing üzerinden)

USB debug build'de gerçek faturalandırma ÇALIŞMAZ; Play'den kurulmalı.

1. Bayrakları geçici aç (`PREMIUM_LIVE`, `PREMIUM_UI_VISIBLE` → true),
   AAB üret, Internal testing'e yükle.
2. Test hesabıyla telefonda: satın al → premium açıldı mı? → Play'den iptal
   et → süre bitince kapandı mı? → "Satın alımı geri yükle" çalışıyor mu?
3. Test bitince bayrakları tekrar kapat (yayın 4-5 ay sonra).

## 4) iOS (App Store'a çıkarken)

1. App Store Connect'te aynı abonelikleri oluştur.
2. RevenueCat'e App Store uygulaması ekle, ürünleri bağla.
3. `REVENUECAT_API_KEY_IOS` (`appl_...`) sabitini doldur — kod aynen çalışır.

## Notlar

- Fiyatlar canlıda **mağazadan** gelir (ülkeye göre yerel para birimi);
  koddaki TRY değerleri yalnızca mağaza yüklenene kadarki yedektir.
- Satın alma onayı (acknowledge) ve abonelik yaşam döngüsü (yenileme, iptal,
  ödeme bekleme) RevenueCat tarafından yönetilir; uygulama tek dinleyiciden
  (`onEntitlementChange`) beslenir.

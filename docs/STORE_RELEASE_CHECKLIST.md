# Store'a güvenli bugfix build (billing / premium kapalı)

Premium lansmanından **önce** normal güncelleme (bugfix, içerik, UI) gönderirken
bu listeyi izle. Amaç: Play incelemesine billing'siz, limitler kapalı bir sürüm gitmesi.

---

## Önce (kod)

- [ ] `app.js`: `PREMIUM_LIVE = false || PREMIUM_PREVIEW_BUILD` (sabit `true` yok)
- [ ] `app.js`: `PREMIUM_UI_VISIBLE = false || PREMIUM_PREVIEW_BUILD` (sabit `true` yok)
- [ ] Commit'e `.env.local` **girmiyor** (`.gitignore`'da)
- [ ] `lib/premium-purchase.js`: RC anahtarı repoda yok (env'den okunuyor; boş kalabilir)
- [ ] `npm test` geçiyor

## Yerel ortam (release build öncesi)

- [ ] `.env.local` **silindi** **veya** içinde `VITE_PREMIUM_PREVIEW=1` satırı yok
  - Açık bırakırsan `npm run cap:release:android` verify adımında **durur** (kasıtlı)
- [ ] RC anahtarı olmasa da sorun değil; stub mod store build'inde zararsız

## Sürüm numarası

- [ ] `android/app/build.gradle` → `versionCode` bir artırıldı (şu anki +1)
- [ ] `versionName` anlamlı güncellendi (ör. 1.2.7 → 1.2.8)

## Build

```powershell
cd c:\z2\zikirmaitk
npm run cap:release:android
```

- [ ] Verify çıktısı: `OK www` ve `OK android assets`
- [ ] `VITE_PREMIUM_PREVIEW` FAIL mesajı **yok**
- [ ] AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Play Console (panel — billing dokunma)

- [ ] **Monetize → Subscriptions:** yeni ürün **açma** (lansman öncesi gerek yok)
- [ ] **App content → App access:** uygulama giriş/abonelik sunmuyorsa **Hayır** (mevcut hali koru)
- [ ] Production → **Yeni sürüm oluştur** → AAB yükle → sürüm notları (kullanıcı dilinde, kısa)
- [ ] İnceleme notlarında billing/premium **bahsetme** (henüz yok)

## Yüklemeden sonra hızlı kontrol (Internal veya kapalı test, isteğe bağlı)

Production'a göndermeden önce istersen Internal testing'e aynı AAB:

- [ ] Premium sekmesi: tanıtım / “çok yakında” (limit yok, satın alma zorunlu değil)
- [ ] Klasör/zikir **sınırı yok** (PREMIUM_LIVE kapalı)
- [ ] Satın alma ekranı açılırsa stub notu görünebilir — sorun değil, ödeme çalışmaz

## Yapma (lansman öncesi)

- Play'de abonelik ürünü oluşturup aktif etme
- RevenueCat hesabı / servis hesabı JSON
- `PREMIUM_LIVE = true` commit
- `.env.local` ile `VITE_PREMIUM_PREVIEW=1` açıkken release build
- App access'i abonelik varmış gibi **Evet** yapma

---

## Lansman günü

Premium açılacaksa: `docs/REVENUECAT_SETUP.md` → **Lansman checklist** bölümü.

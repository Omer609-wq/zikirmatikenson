# Firebase bulut yedek — kurulum (geliştirici)

Bu rehber, Premium **Yedek & Senkron** özelliğini Android’de çalıştırmak için Firebase tarafında yapman gereken adımları listeler. Kod tarafı hazır; aşağıdakiler olmadan uygulamada “Bulut yedekleme henüz yapılandırılmadı” görünür.

## Özet davranış

| Olay | Davranış |
|------|----------|
| İlk Google bağlantısı | Otomatik ilk yedek (ayrı onay kutusu yok; buton altında açıklama var) |
| Sonrası | Uygulama açıkken haftada 1 otomatik yedek |
| Geri yükle | Her zaman manuel + onay diyaloğu |

---

## 1. Firebase projesi

Crashlytics için kullandığın **aynı Firebase projesi** yeterli.

1. [Firebase Console](https://console.firebase.google.com/) → projen
2. **Authentication** → **Sign-in method** → **Google** → Etkinleştir
3. Destek e-postası seç → Kaydet

---

## 2. Firestore

1. **Firestore Database** → Veritabanı oluştur
2. Konum: `europe-west1` veya kullanıcı kitlene yakın bir bölge
3. **Production** modunda başlayabilirsin; kuralları hemen güncelle

### Güvenlik kuralları

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/backups/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Yedek doküman yolu: `users/{uid}/backups/main`

### Faturalandırma

Firestore kullanımı için projede **Blaze (kullandıkça öde)** planı gerekir. Haftalık yedek + makul kullanıcı sayısında maliyet genelde düşük kalır; Firebase Console → Usage ile izle.

---

## 3. Android uygulaması (SHA + google-services.json)

### SHA-1 / SHA-256

Firebase Console → **Project settings** → **Your apps** → Android (`com.omerzikirmatik.app`):

- **Debug** keystore SHA-1 ve SHA-256 (geliştirme cihazı)
- **Play App Signing** SHA-1 ve SHA-256 (yayın)

Debug SHA almak (Windows, JDK gerekir):

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

### google-services.json

1. Firebase’den **`google-services.json`** indir
2. `android/app/google-services.json` konumuna koy (git’e **commit etme**; `.gitignore`’da)
3. Örnek: `android/app/google-services.json.example`

---

## 4. Web Firebase config (Firestore JS SDK)

1. Firebase Console → Project settings → **General** → **Your apps** → **Web app** ekle (yoksa)
2. Config objesini kopyala
3. Repoda:

```powershell
copy public\firebase-config.json.example public\firebase-config.json
```

4. `public/firebase-config.json` içindeki değerleri doldur (`apiKey`, `projectId`, …)
5. Bu dosya da git’e **commit edilmez** (`.gitignore`)

Build sırasında `public/` → `www/` kopyalanır.

---

## 5. Capacitor sync ve Android build

```powershell
npm run cap:sync
```

Bu komut `@capacitor-firebase/authentication` eklentisini Android projesine ekler.

`capacitor.config.json` içinde:

```json
"FirebaseAuthentication": {
  "skipNativeAuth": true,
  "providers": ["google.com"]
}
```

---

## 6. Cihazda test

1. Premium’u simüle et (geliştirme):  
   `localStorage` → `zikirmatik_data_v2` → `entitlements.premium: true`
2. Premium → **Yedek & Senkron**
3. **Google ile bağlan** → ilk yedek otomatik
4. Firestore Console’da `users/{uid}/backups/main` dokümanını kontrol et
5. Geri yükle → onay → verinin geldiğini doğrula

---

## 7. Play Store / gizlilik

- Gizlilik politikasında: Google hesabı, bulut yedek, saklanan veri türleri
- Play Console **Data safety**: hesap bilgisi, uygulama verisi yedekleme
- Kullanıcı verisi yalnızca kendi `uid` altında; sunucuda birleştirilmiş analitik yok

---

## Sorun giderme

| Belirti | Olası neden |
|---------|-------------|
| Google giriş hatası | SHA-1/256 Firebase’e eklenmemiş veya yanlış keystore |
| `notConfigured` mesajı | `public/firebase-config.json` eksik veya hatalı |
| Firestore permission denied | Kurallar / Auth etkin değil |
| Crashlytics çalışıyor ama Auth yok | Authentication’da Google kapalı |

---

## Dosya checklist

- [ ] `android/app/google-services.json` (yerel, git dışı)
- [ ] `public/firebase-config.json` (yerel, git dışı)
- [ ] Firebase Auth → Google açık
- [ ] Firestore + kurallar
- [ ] SHA-1/256 (debug + release)
- [ ] `npm run cap:sync` + cihazda test

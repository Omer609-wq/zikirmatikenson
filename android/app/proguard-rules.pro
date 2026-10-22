# R8 kuralları (release'te minifyEnabled true ile çalışır).
#
# Buradaki her kural "R8 bunu silmesin / adını değiştirmesin" demektir. Gereksiz
# keep eklemek karartma oranını düşürür ve Play'in eşiğinden uzaklaştırır; o
# yüzden yalnızca gerçekten gerekli olanlar var. Capacitor, Firebase, Play
# Services ve RevenueCat kendi kurallarını AAR'larıyla birlikte gönderiyor
# (consumerProguardFiles), onları burada tekrarlamaya gerek yok.

# --- Crashlytics: okunabilir yığın izleri ---
# Karartmadan sonra çökme raporları a.b(Unknown Source) gibi görünür. Bu iki
# satır dosya adı + satır numarasını korur; mapping dosyasıyla birleşince rapor
# yine okunabilir olur. Kaynak dosya adı yine de karartılır (ikinci satır).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- WebView köprüsü ---
# Capacitor JS <-> native çağrılarını @JavascriptInterface ile açar. Bu metotlar
# JS'ten ADIYLA çağrılır; adları değişirse köprü sessizce kopar.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Kullanmadığımız giriş sağlayıcıları ---
# @capacitor-firebase/authentication Facebook/Apple/Twitter işleyicilerini de
# içeriyor ama Facebook SDK'sı bağımlılıklarımızda yok; R8 çözemediği bu
# referanslar yüzünden derlemeyi durduruyor.
#
# Güvenli: işleyici yalnızca yapılandırmada o sağlayıcı listeliyse oluşturuluyor
# (FirebaseAuthentication.initAuthProviderHandlers). capacitor.config.json yalnız
# "google.com" diyor, yani sınıf çalışma anında hiç yüklenmiyor. Facebook ile
# giriş eklenirse SDK bağımlılığı gelir ve bu satırlar gereksizleşir.
-dontwarn com.facebook.CallbackManager
-dontwarn com.facebook.CallbackManager$Factory
-dontwarn com.facebook.FacebookCallback
-dontwarn com.facebook.login.LoginManager
-dontwarn com.facebook.login.widget.LoginButton

# --- Kendi native eklentimiz ---
# Capacitor'ın kendi kuralı (-keep public class * extends com.getcapacitor.Plugin)
# bunu zaten kapsıyor. Yine de açıkça yazıyoruz: eklenti sınıfı JS tarafından
# @CapacitorPlugin adıyla ("SystemChrome") bulunuyor ve bu kural Capacitor
# sürümünün kendi dosyasına bağlı kalmasın.
-keep @com.getcapacitor.annotation.CapacitorPlugin public class com.omerzikirmatik.app.** {
    @com.getcapacitor.PluginMethod public <methods>;
}

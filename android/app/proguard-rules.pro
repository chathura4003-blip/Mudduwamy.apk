# ProGuard & R8 Configuration for Sri Sumana Maha Pirivena ERP

# 1. Preserve JavaScript Interfaces for Android Native Bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class lk.srisumana.erp.MainActivity$* { *; }

# 2. Preserve Capacitor Core & Cordova Plugins
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# 3. Preserve OneSignal & Google Play Services
-keep class com.onesignal.** { *; }
-dontwarn com.onesignal.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# 4. Preserve Capgo LiveUpdater & Preferences Plugins
-keep class com.capgo.** { *; }
-dontwarn com.capgo.**

# 5. Preserve AndroidX FileProvider & Core Components
-keep class androidx.core.content.FileProvider { *; }
-keepattributes *Annotation*,JavascriptInterface,EnclosingMethod,InnerClasses,Signature
-dontwarn androidx.**


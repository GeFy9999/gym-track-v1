# GymsTrack release build is shrunk and obfuscated with R8 (see build.gradle).
# Capacitor (capacitor-android) and every plugin library ship consumer rules
# for what they load by reflection; these are only the app-level extras.

# Keep line numbers in stack traces (the mapping file uploaded to Play turns
# obfuscated names back into real ones), but hide the original file names.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Anything the WebView calls from JavaScript.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor plugin classes and their annotated methods are looked up by
# reflection — repeated here so the app never depends on a plugin's own
# consumer rules being present.
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }

# Capacitor reads plugin annotations at runtime (@CapacitorPlugin's
# permissions/aliases, callbacks). R8 full mode strips annotation types and
# their members unless kept, which made LocalNotifications.schedule() hang
# silently in release (no rest-timer notification).
-keepattributes RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations,AnnotationDefault
-keep @interface com.getcapacitor.** { *; }
-keep @interface com.getcapacitor.annotation.** { *; }

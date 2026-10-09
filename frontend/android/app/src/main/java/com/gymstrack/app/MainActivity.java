package com.gymstrack.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    SplashScreen.installSplashScreen(this);
    // Edge-to-edge on every Android version, not only where Android 15+
    // forces it — Play Console flags SDK 35+ apps that don't opt in. The
    // system bar insets are handled by Capacitor's SystemBars (CSS insets).
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
  }
}

package com.omerzikirmatik.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // WebView içeriği sistem gezinme çubuğunun (3 tuş / hareket) altına kaçmasın.
        // Bazı API 35 / edge-to-edge kombinasyonlarında alt sekme alanı tıklanamaz olabiliyordu.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        super.onCreate(savedInstanceState);
    }
}

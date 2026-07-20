package com.omerzikirmatik.app;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Sistem çubukları (üst durum + alt gezinme) rengi ve ikon kontrastı. */
@CapacitorPlugin(name = "SystemChrome")
public class SystemChromePlugin extends Plugin {

    private static int colorForTheme(String theme) {
        if ("light".equals(theme)) {
            return Color.parseColor("#faf8f5");
        }
        if ("black".equals(theme)) {
            return Color.parseColor("#000000");
        }
        return Color.parseColor("#0a0e16");
    }

    @PluginMethod
    public void applyNavigationBarTheme(PluginCall call) {
        String theme = call.getString("theme", "navy");
        boolean lightBars = "light".equals(theme);
        int barColor = colorForTheme(theme);

        getBridge().getActivity().runOnUiThread(() -> {
            try {
                Window window = getActivity().getWindow();
                View decor = window.getDecorView();

                window.setNavigationBarColor(barColor);
                window.setStatusBarColor(barColor);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    window.setNavigationBarContrastEnforced(false);
                    window.setStatusBarContrastEnforced(false);
                }

                WindowInsetsControllerCompat controller =
                        WindowCompat.getInsetsController(window, decor);
                if (controller != null) {
                    // true = koyu ikonlar (açık zemin); false = açık ikonlar (koyu zemin)
                    controller.setAppearanceLightStatusBars(lightBars);
                    controller.setAppearanceLightNavigationBars(lightBars);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void getSafeAreaInsets(PluginCall call) {
        getBridge().getActivity().runOnUiThread(() -> {
            try {
                View decor = getActivity().getWindow().getDecorView();
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
                int top = 0;
                int bottom = 0;
                if (insets != null) {
                    top = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                    bottom = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                }
                JSObject ret = new JSObject();
                ret.put("top", top);
                ret.put("bottom", bottom);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage(), e);
            }
        });
    }
}

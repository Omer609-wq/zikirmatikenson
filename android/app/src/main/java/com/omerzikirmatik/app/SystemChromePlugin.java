package com.omerzikirmatik.app;

import android.graphics.Color;
import android.view.View;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Alt gezinme çubuğu rengi ve sistem güvenli alan (inset) ölçümü. */
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
        boolean lightNavBar = "light".equals(theme);

        getBridge().getActivity().runOnUiThread(() -> {
            try {
                var window = getActivity().getWindow();
                window.setNavigationBarColor(colorForTheme(theme));
                WindowInsetsControllerCompat controller =
                        WindowCompat.getInsetsController(window, window.getDecorView());
                if (controller != null) {
                    controller.setAppearanceLightNavigationBars(lightNavBar);
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

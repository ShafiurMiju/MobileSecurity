package com.monitoringapp;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AppUsageModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "AppUsageModule";
    private final ReactApplicationContext reactContext;

    public AppUsageModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void checkUsageStatsPermission(Promise promise) {
        try {
            boolean granted = hasUsageStatsPermission();
            promise.resolve(granted);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void requestUsageStatsPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            
            WritableArray appList = Arguments.createArray();
            
            for (ApplicationInfo appInfo : packages) {
                // Filter out system apps if needed (optional)
                WritableMap appMap = Arguments.createMap();
                appMap.putString("packageName", appInfo.packageName);
                appMap.putString("appName", pm.getApplicationLabel(appInfo).toString());
                appMap.putBoolean("isSystemApp", (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                
                // Get app icon as base64 (optional, can be heavy)
                try {
                    Drawable icon = pm.getApplicationIcon(appInfo);
                    String iconBase64 = drawableToBase64(icon);
                    appMap.putString("icon", iconBase64);
                } catch (Exception e) {
                    appMap.putString("icon", "");
                }
                
                appList.pushMap(appMap);
            }
            
            promise.resolve(appList);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getAppUsageStats(double startTime, double endTime, Promise promise) {
        try {
            if (!hasUsageStatsPermission()) {
                promise.reject("PERMISSION_DENIED", "Usage stats permission not granted");
                return;
            }

            UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext
                    .getSystemService(Context.USAGE_STATS_SERVICE);
            
            if (usageStatsManager == null) {
                promise.reject("ERROR", "UsageStatsManager not available");
                return;
            }

            long start = (long) startTime;
            long end = (long) endTime;
            
            Map<String, UsageStats> usageStatsMap = usageStatsManager.queryAndAggregateUsageStats(start, end);
            PackageManager pm = reactContext.getPackageManager();
            
            WritableArray usageList = Arguments.createArray();
            
            // Convert to list and sort by total time in foreground
            List<UsageStats> statsList = new ArrayList<>(usageStatsMap.values());
            Collections.sort(statsList, new Comparator<UsageStats>() {
                @Override
                public int compare(UsageStats o1, UsageStats o2) {
                    return Long.compare(o2.getTotalTimeInForeground(), o1.getTotalTimeInForeground());
                }
            });
            
            for (UsageStats stats : statsList) {
                if (stats.getTotalTimeInForeground() > 0) {
                    WritableMap usageMap = Arguments.createMap();
                    usageMap.putString("packageName", stats.getPackageName());
                    
                    try {
                        ApplicationInfo appInfo = pm.getApplicationInfo(stats.getPackageName(), 0);
                        usageMap.putString("appName", pm.getApplicationLabel(appInfo).toString());
                    } catch (PackageManager.NameNotFoundException e) {
                        usageMap.putString("appName", stats.getPackageName());
                    }
                    
                    usageMap.putDouble("totalTimeInForeground", stats.getTotalTimeInForeground());
                    usageMap.putDouble("lastTimeUsed", stats.getLastTimeUsed());
                    usageMap.putDouble("firstTimeStamp", stats.getFirstTimeStamp());
                    usageMap.putDouble("lastTimeStamp", stats.getLastTimeStamp());
                    
                    usageList.pushMap(usageMap);
                }
            }
            
            promise.resolve(usageList);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getTodayUsageStats(Promise promise) {
        try {
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            
            long startTime = calendar.getTimeInMillis();
            long endTime = System.currentTimeMillis();
            
            getAppUsageStats(startTime, endTime, promise);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    private boolean hasUsageStatsPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AppOpsManager appOps = (AppOpsManager) reactContext
                        .getSystemService(Context.APP_OPS_SERVICE);
                int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                        android.os.Process.myUid(), reactContext.getPackageName());
                return mode == AppOpsManager.MODE_ALLOWED;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private String drawableToBase64(Drawable drawable) {
        try {
            Bitmap bitmap = Bitmap.createBitmap(64, 64, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
            drawable.draw(canvas);
            
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 80, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            
            return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP);
        } catch (Exception e) {
            return "";
        }
    }
}

package com.monitoringapp

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.util.Log
import com.facebook.react.bridge.*

class ScreenshotModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "ScreenshotModule"
        private const val REQUEST_MEDIA_PROJECTION = 1001
        private const val PREFS_NAME = "MonitoringPrefs"
    }
    
    private var startPromise: Promise? = null
    private var deviceId: String = ""
    private var deviceName: String = ""
    private var apiUrl: String = ""
    
    private val activityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            Log.d(TAG, "onActivityResult: requestCode=$requestCode, resultCode=$resultCode, data=$data")
            
            if (requestCode == REQUEST_MEDIA_PROJECTION) {
                if (resultCode == Activity.RESULT_OK && data != null) {
                    Log.d(TAG, "Screen capture permission granted, starting service")
                    
                    // Save device settings for auto-start on boot
                    saveDeviceSettings(deviceId, deviceName, apiUrl, resultCode, data)
                    
                    // Start the foreground service
                    val serviceIntent = Intent(reactContext, ScreenshotService::class.java).apply {
                        action = ScreenshotService.ACTION_START
                        putExtra(ScreenshotService.EXTRA_RESULT_CODE, resultCode)
                        putExtra(ScreenshotService.EXTRA_RESULT_DATA, data)
                        putExtra(ScreenshotService.EXTRA_DEVICE_ID, deviceId)
                        putExtra(ScreenshotService.EXTRA_DEVICE_NAME, deviceName)
                        putExtra(ScreenshotService.EXTRA_API_URL, apiUrl)
                    }
                    
                    Log.d(TAG, "Starting foreground service with deviceId=$deviceId, apiUrl=$apiUrl")
                    reactContext.startForegroundService(serviceIntent)
                    startPromise?.resolve(true)
                } else {
                    Log.e(TAG, "Screen capture permission denied")
                    startPromise?.reject("PERMISSION_DENIED", "Screen capture permission denied")
                }
                startPromise = null
            }
        }
    }
    
    init {
        reactContext.addActivityEventListener(activityEventListener)
    }
    
    override fun getName(): String = "ScreenshotModule"
    
    private fun saveDeviceSettings(deviceId: String, deviceName: String, apiUrl: String, resultCode: Int, data: Intent) {
        val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("deviceId", deviceId)
            putString("deviceName", deviceName)
            putString("apiUrl", apiUrl)
            putInt("resultCode", resultCode)
            putBoolean("isRegistered", true)
            putBoolean("autoStartEnabled", true)
            putBoolean("hasMediaProjectionPermission", true)
            apply()
        }
        Log.d(TAG, "Device settings saved for auto-start")
    }
    
    @ReactMethod
    fun startBackgroundCapture(deviceId: String, deviceName: String, apiUrl: String, promise: Promise) {
        Log.d(TAG, "startBackgroundCapture called: deviceId=$deviceId, deviceName=$deviceName, apiUrl=$apiUrl")
        
        this.deviceId = deviceId
        this.deviceName = deviceName
        this.apiUrl = apiUrl
        this.startPromise = promise
        
        val activity = reactContext.currentActivity
        if (activity == null) {
            Log.e(TAG, "Activity not available")
            promise.reject("NO_ACTIVITY", "Activity not available")
            return
        }
        
        Log.d(TAG, "Requesting screen capture permission...")
        // Request screen capture permission
        val mediaProjectionManager = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val captureIntent = mediaProjectionManager.createScreenCaptureIntent()
        activity.startActivityForResult(captureIntent, REQUEST_MEDIA_PROJECTION)
    }
    
    @ReactMethod
    fun saveRegistrationStatus(isRegistered: Boolean, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().apply {
                putBoolean("isRegistered", isRegistered)
                apply()
            }
            Log.d(TAG, "Registration status saved: $isRegistered")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error saving registration status", e)
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun stopBackgroundCapture(promise: Promise) {
        Log.d(TAG, "stopBackgroundCapture called")
        
        try {
            val serviceIntent = Intent(reactContext, ScreenshotService::class.java).apply {
                action = ScreenshotService.ACTION_STOP
            }
            reactContext.stopService(serviceIntent)
            Log.d(TAG, "Service stop intent sent")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping service", e)
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        val running = ScreenshotService.isRunning
        Log.d(TAG, "isServiceRunning: $running")
        promise.resolve(running)
    }
}

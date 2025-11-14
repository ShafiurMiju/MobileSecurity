package com.monitoringapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.util.Log
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class UnlockReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "UnlockReceiver"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val eventType = when (intent.action) {
            Intent.ACTION_SCREEN_OFF -> "lock"
            Intent.ACTION_SCREEN_ON -> "screen_on"
            Intent.ACTION_USER_PRESENT -> "unlock"
            else -> return
        }

        Log.d(TAG, "Screen event detected: $eventType")

        // Get saved device info and API URL
        val prefs = context.getSharedPreferences("MonitoringPrefs", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("deviceId", "") ?: ""
        val deviceName = prefs.getString("deviceName", "") ?: ""
        val apiUrl = prefs.getString("apiUrl", "") ?: ""

        if (deviceId.isEmpty() || apiUrl.isEmpty()) {
            Log.w(TAG, "Device not configured, skipping event")
            return
        }

        // Send event to backend
        sendEventToBackend(context, deviceId, deviceName, eventType, apiUrl)
    }

    private fun sendEventToBackend(context: Context, deviceId: String, deviceName: String, eventType: String, apiUrl: String) {
        Thread {
            try {
                Log.d(TAG, "Sending $eventType event for device: $deviceId")

                // Get battery information
                val batteryStatus = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
                val batteryLevel = batteryStatus?.let {
                    val level = it.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                    val scale = it.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                    (level * 100 / scale.toFloat()).toInt()
                } ?: -1
                
                val isCharging = batteryStatus?.let {
                    val status = it.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                    status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
                } ?: false

                val json = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("eventType", eventType)
                    put("metadata", JSONObject().apply {
                        put("timestamp", System.currentTimeMillis())
                        put("deviceName", deviceName)
                        put("batteryLevel", batteryLevel)
                        put("isCharging", isCharging)
                    })
                }

                val client = OkHttpClient()
                val mediaType = "application/json; charset=utf-8".toMediaType()
                val body = json.toString().toRequestBody(mediaType)

                val request = Request.Builder()
                    .url("$apiUrl/api/events/monitoring")
                    .post(body)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.d(TAG, "Event sent successfully: ${response.body?.string()}")
                    } else {
                        Log.e(TAG, "Event send failed: ${response.code} - ${response.message}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending event", e)
            }
        }.start()
    }
}
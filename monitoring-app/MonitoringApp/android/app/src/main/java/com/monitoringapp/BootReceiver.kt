package com.monitoringapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "BootReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received broadcast: ${intent.action}")
        
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || 
            intent.action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            
            Log.d(TAG, "Device boot detected, checking if should auto-start monitoring")
            
            // Check if device is registered and monitoring was enabled
            val prefs = context.getSharedPreferences("MonitoringPrefs", Context.MODE_PRIVATE)
            val isRegistered = prefs.getBoolean("isRegistered", false)
            val autoStartEnabled = prefs.getBoolean("autoStartEnabled", true)
            
            Log.d(TAG, "isRegistered: $isRegistered, autoStartEnabled: $autoStartEnabled")
            
            if (isRegistered && autoStartEnabled) {
                // Launch the main activity to trigger auto-start
                val launchIntent = Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    putExtra("AUTO_START_MONITORING", true)
                }
                context.startActivity(launchIntent)
                
                Log.d(TAG, "Launching MainActivity for auto-start monitoring")
            }
        }
    }
}

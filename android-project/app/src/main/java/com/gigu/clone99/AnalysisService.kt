package com.gigu.clone99

import android.accessibilityservice.AccessibilityService
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Vibrator
import android.os.VibrationEffect
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.gigu.clone99.databinding.OverlayLayoutBinding
import java.util.regex.Pattern

/**
 * Serviço de Acessibilidade principal do 99 Copilot.
 * Lê e analisa automaticamente ofertas de corridas recebidas no celular do motorista,
 * calculando a viabilidade operacional e expondo o semáforo/overlay flutuante.
 */
class AnalysisService : AccessibilityService() {

    private val TAG = "99CopilotService"
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var overlayBinding: OverlayLayoutBinding? = null
    private val handler = Handler(Looper.getMainLooper())
    private var lastExtractedRide: RideData? = null
    private var lastExtractionTime = 0L

    private val NOTIFICATION_ID = 991
    private val CHANNEL_ID = "copilot_ride_alerts"

    // Runnable para sumir com o overlay automaticamente após 7 segundos
    private val hideOverlayRunnable = Runnable {
        removeOverlay()
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Serviço de Acessibilidade 99 Copilot conectado com sucesso!")
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        // Monitorar apenas mudanças de tela e conteúdo
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED ||
            event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            
            val rootNode = rootInActiveWindow ?: return
            
            // 1. Extrair de forma recursiva todo o texto contido nos nós da tela do usuário
            val texts = ArrayList<String>()
            extractAllTexts(rootNode, texts)
            
            if (texts.isEmpty()) return
            
            val rawScreenText = texts.joinToString("\n")
            
            // 2. Filtrar e extrair dados da 99 se houver padrões de corrida
            val rideData = parseRideData(rawScreenText)
            
            if (rideData != null) {
                // Evitar reprocessar corridas repetidas em intervalo menor que 8 segundos
                val currentTime = System.currentTimeMillis()
                if (lastExtractedRide == null || 
                    lastExtractedRide!!.value != rideData.value || 
                    lastExtractedRide!!.distance != rideData.distance || 
                    (currentTime - lastExtractionTime > 8000)) {
                    
                    lastExtractedRide = rideData
                    lastExtractionTime = currentTime
                    
                    Log.d(TAG, "Nova corrida da 99 detectada: R$ ${rideData.value} | ${rideData.distance} km | r: ${rideData.region}")
                    
                    // 3. Executar cálculos financeiros e registrar no banco local
                    showOverlayForRide(rideData)
                }
            }
        }
    }

    /**
     * Varre a árvore de layout de forma ordenada acumulando textos visíveis.
     */
    private fun extractAllTexts(node: AccessibilityNodeInfo?, texts: MutableList<String>) {
        if (node == null) return
        
        node.text?.let {
            if (it.isNotBlank()) {
                texts.add(it.toString().trim())
            }
        }
        
        for (i in 0 until node.childCount) {
            extractAllTexts(node.getChild(i), texts)
        }
    }

    /**
     * Extrai dados de corrida (Valor, Distância, Tempo) do texto bruto usando Expressões Regulares (Regex).
     */
    private fun parseRideData(rawText: String): RideData? {
        try {
            // Regexes dedicadas para o padrão brasileiro de ofertas do app da 99
            val pricePattern = Pattern.compile("R\\$\\s*(\\d+[,.]\\d{2})")
            val distPattern = Pattern.compile("(\\d+[,.]?\\d*)\\s*(?:km|KM)")
            val durationPattern = Pattern.compile("(\\d+)\\s*(?:min|minutos)")

            val priceMatcher = pricePattern.matcher(rawText)
            val distMatcher = distPattern.matcher(rawText)
            val durationMatcher = durationPattern.matcher(rawText)

            if (priceMatcher.find() && distMatcher.find()) {
                val valueStr = priceMatcher.group(1)?.replace(",", ".") ?: return null
                val distanceStr = distMatcher.group(1)?.replace(",", ".") ?: return null
                
                val value = valueStr.toDoubleOrNull() ?: 0.0
                val distance = distanceStr.toDoubleOrNull() ?: 0.0
                
                var duration = 12
                if (durationMatcher.find()) {
                    duration = durationMatcher.group(1)?.toIntOrNull() ?: 12
                } else {
                    duration = max(1, (distance * 2.5).toInt())
                }

                // Tentar capturar bônus de região ou nome de destino se presente na tela
                var region = "Zona Principal"
                val lines = rawText.split("\n")
                for (line in lines) {
                    if (line.contains("Destino:", ignoreCase = true) || line.contains("Para:", ignoreCase = true)) {
                        region = line.replace("Destino:", "").replace("Para:", "").trim()
                        break
                    }
                }

                // Estimar distância de deslocamento até o embarque (geralmente entre 0.8 e 2.5 km)
                var searchDistance = 1.2
                // Se a tela indicar "Embarque a X m" ou "X km", podemos atualizar
                if (rawText.contains("embarque", ignoreCase = true)) {
                    searchDistance = 1.6
                }

                if (value > 0.0 && distance > 0.0) {
                    return RideData(
                        value = value,
                        distance = distance,
                        duration = duration,
                        region = region,
                        searchDistance = searchDistance,
                        rawText = rawText
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao parsear dados estruturados no loop: ${e.message}")
        }
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "99 Copilot Alertas"
            val descriptionText = "Informa motoristas instantaneamente se a corrida do app 99 compensa"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showNotificationForRide(ride: RideData, label: RideData.Classification, score: Int, textFeedback: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent, 
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val emoji = when (label) {
            RideData.Classification.EXCELENTE -> "🟢"
            RideData.Classification.ACEITAVEL -> "🟡"
            RideData.Classification.RUIM -> "🔴"
        }

        val title = "$emoji Nota $score/100 - $textFeedback"
        val bodyText = String.format("R$ %.2f (%.1fkm) • R$/km: R$ %.2f", ride.value, ride.distance, ride.valuePerKm)

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(bodyText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        try {
            notificationManager.notify(NOTIFICATION_ID, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar notificação da corrida: ${e.message}")
        }
    }

    /**
     * Calcula dados corporativos e renderiza o semáforo flutuante.
     */
    private fun showOverlayForRide(ride: RideData) {
        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        
        val minKmGood = sharedPref.getFloat("min_km_good", 2.20f).toDouble()
        val minKmMedium = sharedPref.getFloat("min_km_medium", 1.50f).toDouble()
        val minHour = sharedPref.getFloat("min_hour", 45.0f).toDouble()
        val kmPerLitre = sharedPref.getFloat("km_per_litre", 10.0f).toDouble()
        val fuelPrice = sharedPref.getFloat("fuel_price", 5.50f).toDouble()
        val isVibrateEnabled = sharedPref.getBoolean("vibrate_on_new", true)
        val isOverlayEnabled = sharedPref.getBoolean("enable_overlay", true)

        val classification = ride.getClassification(minKmGood, minKmMedium)
        val score = ride.calculateScore(minKmGood, minKmMedium, minHour, kmPerLitre, fuelPrice)
        val scoreFeedback = ride.getScoreFeedback(score)

        // Registrar no banco de dados local assincronamente (Room)
        val fuelCost = ride.calculateFuelCost(kmPerLitre, fuelPrice)
        val netProfit = ride.calculateNetProfit(kmPerLitre, fuelPrice)
        
        Thread {
            try {
                val db = RideDatabase.getDatabase(this)
                val entity = RideEntity(
                    value = ride.value,
                    distance = ride.distance,
                    duration = ride.duration,
                    region = ride.region,
                    classification = classification.name,
                    score = score,
                    fuelCost = fuelCost,
                    netProfit = netProfit,
                    isAccepted = score >= 50, // Auto aceitar heuristica no simulador
                    timestamp = System.currentTimeMillis()
                )
                db.rideDao().insertRide(entity)
                Log.d(TAG, "Corrida salva no histórico do Room Database com sucesso!")
            } catch (ex: Exception) {
                Log.e(TAG, "Erro ao persistir no Room: ${ex.message}")
            }
        }.start()

        // Notificar o usuário
        showNotificationForRide(ride, classification, score, scoreFeedback.second)

        if (!isOverlayEnabled) {
            Log.d(TAG, "Overlay de janela flutuante inibido nas configurações.")
            return
        }

        // Remover timers pendentes
        handler.removeCallbacks(hideOverlayRunnable)

        // Haptic Feedback
        if (isVibrateEnabled) {
            vibrateDevice(classification)
        }

        // Criar ou atualizar overlay na thread do UI
        handler.post {
            try {
                if (overlayView == null) {
                    overlayBinding = OverlayLayoutBinding.inflate(LayoutInflater.from(this))
                    overlayView = overlayBinding!!.root

                    val params = WindowManager.LayoutParams(
                        WindowManager.LayoutParams.WRAP_CONTENT,
                        WindowManager.LayoutParams.WRAP_CONTENT,
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                        } else {
                            @Suppress("DEPRECATION")
                            WindowManager.LayoutParams.TYPE_PHONE
                        },
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or 
                                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                        PixelFormat.TRANSLUCENT
                    ).apply {
                        gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
                        y = 120
                    }

                    setupDragListener(overlayView!!, params)

                    overlayBinding!!.btnCloseOverlay.setOnClickListener {
                        removeOverlay()
                    }

                    windowManager?.addView(overlayView, params)
                }

                // Atualizar strings e dados
                val binding = overlayBinding!!
                binding.tvRideValue.text = String.format("R$ %.2f", ride.value)
                binding.tvRideDistTime.text = String.format("%.1f km (+%.1fkm embarque)", ride.distance, ride.searchDistance)
                binding.tvRateKm.text = String.format("R$ %.2f / km", ride.valuePerKm)
                binding.tvRateHour.text = String.format("R$ %.0f / hora", ride.valuePerHour)
                binding.tvNetProfit.text = String.format("Lucro líq: R$ %.2f", netProfit)
                binding.tvRideScore.text = String.format("Nota: %d/100 %s", score, scoreFeedback.first)
                
                when (classification) {
                    RideData.Classification.EXCELENTE -> {
                        binding.tvSemaphore.text = "🟢"
                        binding.tvRecommendation.text = "CORRIDA RECOMENDADA"
                        binding.tvRecommendation.setTextColor(0xFF1B5E20.toInt())
                        binding.overlayContainer.setBackgroundColor(0xFFE8F5E9.toInt())
                    }
                    RideData.Classification.ACEITAVEL -> {
                        binding.tvSemaphore.text = "🟡"
                        binding.tvRecommendation.text = "CORRIDA RAZOÁVEL"
                        binding.tvRecommendation.setTextColor(0xFFE65100.toInt())
                        binding.overlayContainer.setBackgroundColor(0xFFFFFDE7.toInt())
                    }
                    RideData.Classification.RUIM -> {
                        binding.tvSemaphore.text = "🔴"
                        binding.tvRecommendation.text = "RECUSAR (PREJUÍZO!)"
                        binding.tvRecommendation.setTextColor(0xFFB71C1C.toInt())
                        binding.overlayContainer.setBackgroundColor(0xFFFFEBEE.toInt())
                    }
                }

                // Agendar sumiço do balão flutuante em 7 segundos
                handler.postDelayed(hideOverlayRunnable, 7000)

            } catch (e: Exception) {
                Log.e(TAG, "Erro fatal ao renderizar ou expor overlay flutuante: ${e.message}")
            }
        }
    }

    private fun setupDragListener(view: View, params: WindowManager.LayoutParams) {
        view.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                if (event == null) return false
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager?.updateViewLayout(view, params)
                        return true
                    }
                }
                return false
            }
        })
    }

    private fun removeOverlay() {
        handler.removeCallbacks(hideOverlayRunnable)
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao remover overlay da janela: ${e.message}")
            }
            overlayView = null
            overlayBinding = null
        }
    }

    private fun vibrateDevice(classification: RideData.Classification) {
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
        val duration = when (classification) {
            RideData.Classification.EXCELENTE -> 150L
            RideData.Classification.ACEITAVEL -> 300L
            RideData.Classification.RUIM -> 600L
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration)
        }
    }

    override fun onInterrupt() {
        removeOverlay()
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }
}

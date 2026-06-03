package com.gigu.clone99

import android.accessibilityservice.AccessibilityService
import android.content.Context
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
import com.gigu.clone99.databinding.OverlayLayoutBinding
import java.util.regex.Pattern

/**
 * Serviço de Acessibilidade principal que monitora o aplicativo da 99,
 * extrai dados das corridas mostradas e gerencia o overlay flutuante (semáforo).
 */
class AnalysisService : AccessibilityService() {

    private val TAG = "AnalysisService99"
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var overlayBinding: OverlayLayoutBinding? = null
    private val handler = Handler(Looper.getMainLooper())
    private var lastExtractedRide: RideData? = null
    private var lastExtractionTime = 0L

    // Runnable para sumir com o overlay automaticamente após 5 segundos
    private val hideOverlayRunnable = Runnable {
        removeOverlay()
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Serviço de acessibilidade conectado com sucesso!")
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        // Monitorar apenas mudanças de tela e conteúdo
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED ||
            event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            
            val rootNode = rootInActiveWindow ?: return
            
            // 1. Extrair todos os textos visíveis no nó atual de forma recursiva
            val texts = ArrayList<String>()
            extractAllTexts(rootNode, texts)
            
            if (texts.isEmpty()) return
            
            val rawScreenText = texts.joinToString("\n")
            
            // 2. Tentar extrair dados de uma possível corrida
            val rideData = parseRideData(rawScreenText)
            
            if (rideData != null) {
                // Evitar processar repetidamente a mesma corrida no intervalo de 6 segundos
                val currentTime = System.currentTimeMillis()
                if (lastExtractedRide == null || 
                    lastExtractedRide!!.value != rideData.value || 
                    lastExtractedRide!!.distance != rideData.distance || 
                    (currentTime - lastExtractionTime > 6000)) {
                    
                    lastExtractedRide = rideData
                    lastExtractionTime = currentTime
                    
                    Log.d(TAG, "Nova corrida capturada: R$ ${rideData.value} | ${rideData.distance} km | ${rideData.duration} min")
                    
                    // 3. Executar cálculos e exibir no overlay flutuante
                    showOverlayForRide(rideData)
                }
            }
        }
    }

    /**
     * Extrai de forma recursiva todo o texto presente na árvore de views visível.
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
            // Regexes dedicadas para o padrão brasileiro da 99
            // Ex matches: "R$ 12,50", "R$15.00", "R$ 8,00"
            val pricePattern = Pattern.compile("R\\$\\s*(\\d+[,.]\\d{2})")
            
            // Ex matches: "4,5 km", "4.5km", "12 km"
            val distPattern = Pattern.compile("(\\d+[,.]?\\d*)\\s*(?:km|KM)")
            
            // Ex matches: "8min", "10 minutos", "12 min"
            val durationPattern = Pattern.compile("(\\d+)\\s*(?:min|minutos)")

            val priceMatcher = pricePattern.matcher(rawText)
            val distMatcher = distPattern.matcher(rawText)
            val durationMatcher = durationPattern.matcher(rawText)

            if (priceMatcher.find() && distMatcher.find()) {
                val valueStr = priceMatcher.group(1)?.replace(",", ".") ?: return null
                val distanceStr = distMatcher.group(1)?.replace(",", ".") ?: return null
                
                val value = valueStr.toDoubleOrNull() ?: 0.0
                val distance = distanceStr.toDoubleOrNull() ?: 0.0
                
                // Duração é opcional para o cálculo por km, mas obrigatória para o cálculo por hora
                var duration = 12 // default prevent fallback crash
                if (durationMatcher.find()) {
                    duration = durationMatcher.group(1)?.toIntOrNull() ?: 12
                } else {
                    // Tenta encontrar apenas números que precedam palavras de tempo se necessário, ou estima baseada na distancia
                    duration = Math.max(1, (distance * 2.5).toInt())
                }

                if (value > 0.0 && distance > 0.0) {
                    return RideData(value, distance, duration, rawText)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar regex na tela: ${e.message}")
        }
        return null
    }

    /**
     * Instancia e exibe o overlay flutuante na tela usando WindowManager.
     */
    private fun showOverlayForRide(ride: RideData) {
        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        
        // Verifica se o motorista ativou a exibição do overlay nas configurações
        val isOverlayEnabled = sharedPref.getBoolean("enable_overlay", true)
        if (!isOverlayEnabled) {
            Log.d(TAG, "Overlay desativado pelo interruptor principal.")
            return
        }

        val minKmGood = sharedPref.getFloat("min_km_good", 3.0f).toDouble()
        val minKmMedium = sharedPref.getFloat("min_km_medium", 2.0f).toDouble()
        val minHour = sharedPref.getFloat("min_hour", 50.0f).toDouble()
        val vibrate = sharedPref.getBoolean("vibrate_on_new", true)

        val classification = ride.getClassification(minKmGood, minKmMedium, minHour)

        // Cancelar timer de sumiço pendente anterior
        handler.removeCallbacks(hideOverlayRunnable)

        // Vibrar se ativado nas configurações
        if (vibrate) {
            vibrateDevice()
        }

        // Criar ou atualizar overlay garantindo thread principal
        handler.post {
            try {
                if (overlayView == null) {
                    // Inicializa binding
                    overlayBinding = OverlayLayoutBinding.inflate(LayoutInflater.from(this))
                    overlayView = overlayBinding!!.root

                    // Definição estrita dos parâmetros do WindowManager exigidos pelo Android O+
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
                        y = 150 // posição vertical inicial
                    }

                    // Configura detecção de arraste (Drag e Drop)
                    setupDragListener(overlayView!!, params)

                    // Configura botão de fechar manual integrado
                    overlayBinding!!.btnCloseOverlay.setOnClickListener {
                        removeOverlay()
                    }

                    windowManager?.addView(overlayView, params)
                }

                // Atualizar dados e cores do overlay do semáforo
                updateOverlayContent(ride, classification)

                // Agendar remoção automática após 5 segundos
                handler.postDelayed(hideOverlayRunnable, 5000)

            } catch (e: Exception) {
                Log.e(TAG, "Erro ao expor overlay flutuante: ${e.message}")
            }
        }
    }

    /**
     * Aplica as cores correspondentes ao semáforo nas views do overlay.
     */
    private fun updateOverlayContent(ride: RideData, label: RideData.Classification) {
        val binding = overlayBinding ?: return

        binding.tvRideValue.text = String.format("R$ %.2f", ride.value)
        binding.tvRideDistTime.text = String.format("%.1f km • %d min", ride.distance, ride.duration)
        binding.tvRateKm.text = String.format("R$ %.2f / km", ride.valuePerKm)
        binding.tvRateHour.text = String.format("R$ %.0f / hora", ride.valuePerHour)

        when (label) {
            RideData.Classification.GOOD -> {
                binding.tvSemaphore.text = "🟢"
                // Verde suave para leitura confortável do motorista
                binding.overlayContainer.setBackgroundColor(0xFFE8F5E9.toInt())
            }
            RideData.Classification.MEDIUM -> {
                binding.tvSemaphore.text = "🟡"
                // Amarelo suave
                binding.overlayContainer.setBackgroundColor(0xFFFFFDE7.toInt())
            }
            RideData.Classification.BAD -> {
                binding.tvSemaphore.text = "🔴"
                // Vermelho suave
                binding.overlayContainer.setBackgroundColor(0xFFFFEBEE.toInt())
            }
        }
    }

    /**
     * Torna o overlay flutuante arrastável para qualquer posição da tela.
     */
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
                Log.e(TAG, "Erro ao remover overlay da tela: ${e.message}")
            }
            overlayView = null
            overlayBinding = null
        }
    }

    private fun vibrateDevice() {
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(250, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(250)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Serviço de acessibilidade interrompido.")
        removeOverlay()
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }
}

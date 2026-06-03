export interface AndroidFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const androidFiles: AndroidFile[] = [
  {
    name: "RideData.kt",
    path: "app/src/main/java/com/gigu/clone99/RideData.kt",
    language: "kotlin",
    description: "Data class em Kotlin que encapsula as métricas de valores da corrida e realiza os cálculos de ganho por Km e por Hora, além de categorizar a qualidade da oferta (Verde, Amarelo ou Vermelho).",
    content: `package com.gigu.clone99

/**
 * Representa os dados extraídos de uma corrida da 99.
 * 
 * @param value Valor total da corrida em Reais (R$)
 * @param distance Distância em Quilômetros (km)
 * @param duration Duração estimada em minutos (min)
 * @param rawText Texto completo capturado para fins de depuração
 */
data class RideData(
    val value: Double,
    val distance: Double,
    val duration: Int,
    val rawText: String
) {
    // Calcula o valor por quilômetro (R$/km)
    val valuePerKm: Double
        get() = if (distance > 0.0) value / distance else 0.0

    // Calcula o valor por hora de corrida (R$/h)
    val valuePerHour: Double
        get() = if (duration > 0) value / (duration / 60.0) else 0.0

    enum class Classification {
        GOOD,       // Verde (Boa)
        MEDIUM,     // Amarelo (Aceitável)
        BAD         // Vermelho (Ruim)
    }

    /**
     * Retorna a classificação da corrida com base nas configurações do usuário.
     */
    fun getClassification(minKmGood: Double, minKmMedium: Double, minHour: Double): Classification {
        val kmRate = valuePerKm
        val hourRate = valuePerHour

        return when {
            kmRate >= minKmGood && hourRate >= minHour -> Classification.GOOD
            kmRate >= minKmMedium -> Classification.MEDIUM
            else -> Classification.BAD
        }
    }
}`
  },
  {
    name: "AnalysisService.kt",
    path: "app/src/main/java/com/gigu/clone99/AnalysisService.kt",
    language: "kotlin",
    description: "Serviço de Acessibilidade principal que é chamado dinamicamente ao receber chamadas da 99 para processar a tela inteira em segundo plano usando DFS, extrair dados por Regex e gerenciar o overlay com WindowManager.",
    content: `package com.gigu.clone99

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
            
            val rawScreenText = texts.joinToString("\\n")
            
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
                    
                    Log.d(TAG, "Nova corrida capturada: R$ \${rideData.value} | \${rideData.distance} km | \${rideData.duration} min")
                    
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
            val pricePattern = Pattern.compile("R\\\\$\\\\s*(\\\\d+[,.]\\\\d{2})")
            
            // Ex matches: "4,5 km", "4.5km", "12 km"
            val distPattern = Pattern.compile("(\\\\d+[,.]?\\\\d*)\\\\s*(?:km|KM)")
            
            // Ex matches: "8min", "10 minutos", "12 min"
            val durationPattern = Pattern.compile("(\\\\d+)\\\\s*(?:min|minutos)")

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
            Log.e(TAG, "Erro ao processar regex na tela: \${e.message}")
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
                Log.e(TAG, "Erro ao expor overlay flutuante: \${e.message}")
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
                Log.e(TAG, "Erro ao remover overlay da tela: \${e.message}")
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
}`
  },
  {
    name: "MainActivity.kt",
    path: "app/src/main/java/com/gigu/clone99/MainActivity.kt",
    language: "kotlin",
    description: "Classe de entrada do aplicativo configuradora do status de ativação do serviço de acessibilidade e da permissão de overlay, com triggers para abrir painéis do sistema para autenticação.",
    content: `package com.gigu.clone99

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import android.view.accessibility.AccessibilityManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.gigu.clone99.databinding.ActivityMainBinding

/**
 * Tela principal do app GigU Clone.
 * Fornece interface amigável para ativar permissões, configurar metas de ganhos
 * e exibir o status do serviço.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    override fun onResume() {
        super.onResume()
        updateServiceStatus()
    }

    private fun setupListeners() {
        // Redireciona para configurações de acessibilidade
        binding.btnAccessibilityPerm.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(this, "Encontre '\${getString(R.string.accessibility_service_label)}' e ative-o.", Toast.LENGTH_LONG).show()
        }

        // Redireciona para permissão de sobreposição de app (Overlay / Mostrar sobre outros apps)
        binding.btnOverlayPerm.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:\$packageName")
                )
                startActivity(intent)
            } else {
                Toast.makeText(this, "Permissão de Sobreposição de Tela já CONCEDIDA!", Toast.LENGTH_SHORT).show()
            }
        }

        // Abre a tela de Configuração das metas de ganhos
        binding.btnConfigure.setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }

        // Carrega estado e salvar estado do switch de Janela Flutuante direto no SharedPreferences
        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        binding.switchOverlay.isChecked = sharedPref.getBoolean("enable_overlay", true)
        
        binding.switchOverlay.setOnCheckedChangeListener { _, isChecked ->
            sharedPref.edit().putBoolean("enable_overlay", isChecked).apply()
            Toast.makeText(
                this, 
                if (isChecked) "Janela Flutuante ATIVADA" else "Janela Flutuante DESATIVADA", 
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    /**
     * Verifica e atualiza o estado de ativação do AccessibilityService e Overlay na tela.
     */
    private fun updateServiceStatus() {
        val isServiceRunning = isAccessibilityServiceEnabled(this, AnalysisService::class.java)
        val hasOverlayPermission = Settings.canDrawOverlays(this)

        if (isServiceRunning && hasOverlayPermission) {
            binding.tvServiceStatus.text = getString(R.string.status_enabled)
            binding.tvServiceStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark))
        } else {
            var statusStr = getString(R.string.status_disabled)
            if (!isServiceRunning) statusStr += "\\n• Falta ativar Acessibilidade"
            if (!hasOverlayPermission) statusStr += "\\n• Falta permissão de Janela Flutuante"
            
            binding.tvServiceStatus.text = statusStr
            binding.tvServiceStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
        }
    }

    /**
     * Método seguro para verificar se um serviço de acessibilidade específico está ativo.
     */
    private fun isAccessibilityServiceEnabled(context: Context, serviceClass: Class<*>): Boolean {
        val expectedComponentName = "\${context.packageName}/\${serviceClass.canonicalName}"
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC)
        
        for (enabledService in enabledServices) {
            val id = enabledService.id
            if (id.equals(expectedComponentName, ignoreCase = true)) {
                return true
            }
        }

        // Fallback de verificação através de string de configurações do sistema
        val enabledServicesSetting = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServicesSetting)
        while (colonSplitter.hasNext()) {
            val componentNameString = colonSplitter.next()
            if (componentNameString.equals(expectedComponentName, ignoreCase = true)) {
                return true
            }
        }
        return false
    }
}`
  },
  {
    name: "SettingsActivity.kt",
    path: "app/src/main/java/com/gigu/clone99/SettingsActivity.kt",
    language: "kotlin",
    description: "Gerencia a exibição e salvamento das preferências de faturamento bruto do motorista (mínimo de R$/km para verde e amarelo e faturamento por hora desejado).",
    content: `package com.gigu.clone99

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.gigu.clone99.databinding.ActivitySettingsBinding

/**
 * Tela de configurações de metas de ganhos para o motorista de aplicativo.
 * Salva as preferências de valores mínimos ideais (R$/km e R$/h).
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Ativar suporte a botão "voltar" na ActionBar se existente
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = getString(R.string.title_settings)

        loadSettings()

        binding.btnSave.setOnClickListener {
            saveSettings()
        }
    }

    private fun loadSettings() {
        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        
        // Valores default coerentes com mercado nacional
        val kmGood = sharedPref.getFloat("min_km_good", 3.0f)
        val kmMedium = sharedPref.getFloat("min_km_medium", 2.0f)
        val hourGood = sharedPref.getFloat("min_hour", 50.0f)
        val vibrate = sharedPref.getBoolean("vibrate_on_new", true)

        binding.etKmGood.setText(kmGood.toString())
        binding.etKmMedium.setText(kmMedium.toString())
        binding.etHourGood.setText(hourGood.toString())
        binding.cbVibrate.isChecked = vibrate
    }

    private fun saveSettings() {
        val kmGoodStr = binding.etKmGood.text.toString()
        val kmMediumStr = binding.etKmMedium.text.toString()
        val hourGoodStr = binding.etHourGood.text.toString()
        val vibrate = binding.cbVibrate.isChecked

        val kmGood = kmGoodStr.toFloatOrNull() ?: 3.0f
        val kmMedium = kmMediumStr.toFloatOrNull() ?: 2.0f
        val hourGood = hourGoodStr.toFloatOrNull() ?: 50.0f

        // Validação simples
        if (kmMedium > kmGood) {
            Toast.makeText(this, "O valor aceitável não deve ser maior que o excelente!", Toast.LENGTH_LONG).show()
            return
        }

        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putFloat("min_km_good", kmGood)
            putFloat("min_km_medium", kmMedium)
            putFloat("min_hour", hourGood)
            putBoolean("vibrate_on_new", vibrate)
            apply()
        }

        Toast.makeText(this, getString(R.string.toast_settings_saved), Toast.LENGTH_SHORT).show()
        finish() // fecha a tela retornando à principal
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}`
  },
  {
    name: "activity_main.xml",
    path: "app/src/main/res/layout/activity_main.xml",
    language: "xml",
    description: "Layout XML principal utilizando ScrollView, CardViews e SwitchMaterial para conceder permissões e guiar de forma limpa o motorista sobre o funcionamento.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fillViewport="true"
    android:background="#f8f9fa">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="20dp">

        <!-- Logo/Header -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:gravity="center"
            android:orientation="horizontal"
            android:layout_marginBottom="24dp">
            
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="🚦"
                android:textSize="36sp"
                android:layout_marginEnd="8dp"/>
                
            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="@string/app_name"
                android:textSize="22sp"
                android:textColor="#2d3748"
                android:textStyle="bold"/>
        </LinearLayout>

        <!-- Status Card -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="12dp"
            app:cardElevation="2dp"
            android:layout_marginBottom="16dp">
            
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/status_label"
                    android:textSize="14sp"
                    android:textColor="#718096"
                    android:textStyle="bold"/>

                <TextView
                    android:id="@+id/tv_service_status"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/status_disabled"
                    android:textSize="18sp"
                    android:textColor="#e53e3e"
                    android:textStyle="bold"
                    android:layout_marginTop="4dp"/>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Permissions Card -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="12dp"
            app:cardElevation="2dp"
            android:layout_marginBottom="16dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/title_permissions"
                    android:textSize="16sp"
                    android:textColor="#2d3748"
                    android:textStyle="bold"
                    android:layout_marginBottom="8dp"/>

                <TextView
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:text="@string/desc_permissions"
                    android:textSize="14sp"
                    android:textColor="#4a5568"
                    android:layout_marginBottom="14dp"/>

                <Button
                    android:id="@+id/btn_accessibility_perm"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:text="@string/btn_acc_permission"
                    android:backgroundTint="#4a5568"
                    android:textColor="#ffffff"
                    android:layout_marginBottom="10dp"/>

                <Button
                    android:id="@+id/btn_overlay_perm"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:text="@string/btn_overlay_permission"
                    android:backgroundTint="#4a5568"
                    android:textColor="#ffffff"/>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Settings toggle and button -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="12dp"
            app:cardElevation="2dp"
            android:layout_marginBottom="16dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <RelativeLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginBottom="14dp">

                    <LinearLayout
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:orientation="vertical"
                        android:layout_toStartOf="@+id/switch_overlay"
                        android:layout_alignParentStart="true">
                        
                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="@string/overlay_toggle_title"
                            android:textSize="15sp"
                            android:textColor="#2d3748"
                            android:textStyle="bold"/>
                            
                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="@string/overlay_toggle_desc"
                            android:textSize="12sp"
                            android:textColor="#718096"
                            android:layout_marginTop="2dp"/>
                    </LinearLayout>

                    <com.google.android.material.switchmaterial.SwitchMaterial
                        android:id="@+id/switch_overlay"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:layout_alignParentEnd="true"
                        android:layout_centerVertical="true"
                        android:checked="true"/>
                </RelativeLayout>

                <Button
                    android:id="@+id/btn_configure"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:text="@string/btn_open_settings"
                    android:backgroundTint="#3182ce"
                    android:textColor="#ffffff"
                    android:textStyle="bold"/>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Instructions Card -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="12dp"
            app:cardElevation="2dp"
            android:layout_marginBottom="24dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp"
                android:background="#ebf8ff">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/instructions_title"
                    android:textSize="15sp"
                    android:textColor="#2b6cb0"
                    android:textStyle="bold"
                    android:layout_marginBottom="8dp"/>

                <TextView
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:text="@string/instructions_text"
                    android:textSize="13sp"
                    android:textColor="#2d3748"
                    android:lineSpacingExtra="4dp"/>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

    </LinearLayout>
</ScrollView>`
  },
  {
    name: "activity_settings.xml",
    path: "app/src/main/res/layout/activity_settings.xml",
    language: "xml",
    description: "Layout XML de configurações de fácil preenchimento numérico para os limites de tarifas e objetivos por hora.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fillViewport="true"
    android:background="#f8f9fa">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="20dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/title_settings"
            android:textSize="20sp"
            android:textColor="#2d3748"
            android:textStyle="bold"
            android:layout_marginBottom="24dp"/>

        <!-- Km Rates Group -->
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/group_rates"
            android:textSize="14sp"
            android:textColor="#4a5568"
            android:textStyle="bold"
            android:layout_marginBottom="12dp"/>

        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="12dp"
            app:cardElevation="2dp"
            android:layout_marginBottom="20dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <!-- 🟢 Green rate (GOOD) -->
                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/lbl_km_good"
                    android:textSize="14sp"
                    android:textColor="#4a5568"/>

                <EditText
                    android:id="@+id/et_km_good"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:inputType="numberDecimal"
                    android:hint="Ex: 3.00"
                    android:textSize="16sp"
                    android:layout_marginTop="6dp"
                    android:layout_marginBottom="16dp"
                    android:background="@android:drawable/editbox_background_normal"
                    android:padding="12dp"/>

                <!-- 🟡 Yellow rate (MEDIUM) -->
                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/lbl_km_medium"
                    android:textSize="14sp"
                    android:textColor="#4a5568"/>

                <EditText
                    android:id="@+id/et_km_medium"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:inputType="numberDecimal"
                    android:hint="Ex: 2.00"
                    android:textSize="16sp"
                    android:layout_marginTop="6dp"
                    android:background="@android:drawable/editbox_background_normal"
                    android:padding="12dp"/>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Hour Rate Group -->
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/group_hours"
            android:textSize="14sp"
            android:textColor="#4a5568"
            android:textStyle="bold"
            android:layout_marginBottom="12dp"/>

        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="12dp"
            app:cardElevation="2dp"
            android:layout_marginBottom="20dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="@string/lbl_hour_good"
                    android:textSize="14sp"
                    android:textColor="#4a5568"/>

                <EditText
                    android:id="@+id/et_hour_good"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:inputType="numberDecimal"
                    android:hint="Ex: 50.00"
                    android:textSize="16sp"
                    android:layout_marginTop="6dp"
                    android:background="@android:drawable/editbox_background_normal"
                    android:padding="12dp"/>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Extras Group -->
        <androidx.cardview.widget.CardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="12dp"
            app:cardElevation="2dp"
            android:layout_marginBottom="24dp">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="16dp">

                <com.google.android.material.checkbox.MaterialCheckBox
                    android:id="@+id/cb_vibrate"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:text="@string/lbl_vibration"
                    android:checked="true"
                    android:textSize="14sp"/>
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- Save Button -->
        <Button
            android:id="@+id/btn_save"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="@string/btn_save_settings"
            android:backgroundTint="#38a169"
            android:textColor="#ffffff"
            android:textSize="16sp"
            android:textStyle="bold"
            android:padding="12dp"/>

    </LinearLayout>
</ScrollView>`
  },
  {
    name: "overlay_layout.xml",
    path: "app/src/main/res/layout/overlay_layout.xml",
    language: "xml",
    description: "Estrutura XML que renderiza a janela flutuante arrastável (overlay) com estilo arredondado elegante e os indicadores de semáforo colorido.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.cardview.widget.CardView 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:id="@+id/overlay_card"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    app:cardCornerRadius="16dp"
    app:cardElevation="8dp"
    app:cardUseCompatPadding="true"
    android:foreground="?android:attr/selectableItemBackground">

    <LinearLayout
        android:id="@+id/overlay_container"
        android:layout_width="220dp"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:padding="12dp"
        android:background="#E0F2F1"> <!-- Cor inicial neutra, mudada programaticamente -->

        <TextView
            android:id="@+id/tv_semaphore"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_gravity="center_vertical"
            android:text="🟢"
            android:textSize="32sp"
            android:layout_marginEnd="12dp"/>

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:orientation="vertical"
            android:layout_gravity="center_vertical">

            <TextView
                android:id="@+id/tv_ride_value"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="R$ 15,80"
                android:textSize="18sp"
                android:textStyle="bold"
                android:textColor="#111111"/>

            <TextView
                android:id="@+id/tv_ride_dist_time"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="4.2 km • 12 min"
                android:textSize="12sp"
                android:textColor="#555555"
                android:layout_marginTop="2dp"/>

            <TextView
                android:id="@+id/tv_rate_km"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="R$ 3,76 / km"
                android:textSize="13sp"
                android:textStyle="bold"
                android:textColor="#333333"
                android:layout_marginTop="4dp"/>

            <TextView
                android:id="@+id/tv_rate_hour"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="R$ 79,00 / hora"
                android:textSize="13sp"
                android:textStyle="bold"
                android:textColor="#333333"/>
        </LinearLayout>
        
        <ImageView
            android:id="@+id/btn_close_overlay"
            android:layout_width="20dp"
            android:layout_height="20dp"
            android:layout_gravity="top|end"
            android:src="@android:drawable/ic_menu_close_clear_cancel"
            android:contentDescription="Fechar"
            android:alpha="0.6"/>
    </LinearLayout>
</androidx.cardview.widget.CardView>`
  },
  {
    name: "accessibility_config.xml",
    path: "app/src/main/res/xml/accessibility_config.xml",
    language: "xml",
    description: "Configurações de binds e privilégios para o AccessibilityService ler janelas interativas do app da 99 somente.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeWindowContentChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagIncludeNotImportantViews"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_desc"
    android:packageNames="com.taxis99.driver,com.taxis99"
    android:notificationTimeout="100"/>`
  },
  {
    name: "strings.xml",
    path: "app/src/main/res/values/strings.xml",
    language: "xml",
    description: "Dicionário de strings do Android em Português-BR para internacionalização segura.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">99 Ride Analyzer (GigU Clone)</string>
    <string name="accessibility_service_label">99 Ride Analyzer - Assistente de Ganhos</string>
    <string name="accessibility_service_desc">Lê automaticamente as informações de corridas da tela do app da 99 para calcular o ganho por km e por hora em tempo real, sem automação de cliques.</string>
    
    <!-- Main Activity -->
    <string name="title_permissions">Permissões Necessárias</string>
    <string name="desc_permissions">Para o app funcionar, você precisa conceder duas permissões cruciais:</string>
    <string name="btn_acc_permission">Ativar Acessibilidade</string>
    <string name="btn_overlay_permission">Permitir Janela Flutuante</string>
    <string name="status_label">Status do Serviço:</string>
    <string name="status_disabled">INATIVO</string>
    <string name="status_enabled">ATIVO (Monitorando 99)</string>
    
    <string name="overlay_toggle_title">Exibir Semáforo Flutuante</string>
    <string name="overlay_toggle_desc">Mostra um balão flutuante na tela ao receber chamadas de corrida</string>
    
    <string name="btn_open_settings">Configurações de Ganhos</string>
    <string name="instructions_title">Como usar:</string>
    <string name="instructions_text">1. Ative a permissão de Acessibilidade e de Janela Flutuante acima.\\n2. Defina os seus valores mínimos aceitáveis no botão de Configurações.\\n3. Abra o aplicativo da 99 para Motoristas.\\n4. Ao receber uma oferta de corrida, um balão flutuante indicará se a viagem é Verde 🟢 (Excelente), Amarela 🟡 (Aceitável) ou Vermelha 🔴 (Ruim) com base em seus objetivos!</string>

    <!-- Settings Activity -->
    <string name="title_settings">Configurar Metas de Corrida</string>
    <string name="group_rates">Valores por Quilômetro (R$/km)</string>
    <string name="lbl_km_good">Mínimo para Corrida Excelente (🟢 Verde):</string>
    <string name="lbl_km_medium">Mínimo para Corrida Aceitável (🟡 Amarela):</string>
    <string name="group_hours">Valores por Hora (R$/h)</string>
    <string name="lbl_hour_good">Faturamento por hora desejado (Mínimo):</string>
    <string name="btn_save_settings">Salvar Configurações</string>
    <string name="toast_settings_saved">Configurações salvas com sucesso!</string>
    <string name="lbl_vibration">Vibrar ao receber nova corrida</string>
</resources>`
  },
  {
    name: "AndroidManifest.xml",
    path: "app/src/main/AndroidManifest.xml",
    language: "xml",
    description: "Configuração global do Manifesto Android declarando permissões de acessibilidade, window overlay, foreground service e vibração.",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.gigu.clone99">

    <!-- Permissões Obrigatórias requeridas pelo applet -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application
        android:allowBackup="true"
        android:icon="@android:mipmap/sym_def_app_icon"
        android:label="@string/app_name"
        android:roundIcon="@android:mipmap/sym_def_app_icon"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.DarkActionBar">

        <!-- Tela Principal -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Tela de Configurações das Metas de Ganhos -->
        <activity
            android:name=".SettingsActivity"
            android:label="@string/title_settings"
            android:parentActivityName=".MainActivity"
            android:exported="false" />

        <!-- Serviço de Acessibilidade que escuta o App da 99 -->
        <service
            android:name=".AnalysisService"
            android:label="@string/accessibility_service_label"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.view.accessibility.AccessibilityService" />
            </intent-filter>

            <!-- Aponta para a configuração XML do comportamento de leitura -->
            <meta-data
                android:name="android.view.accessibility.AccessibilityService"
                android:resource="@xml/accessibility_config" />
        </service>

    </application>

</manifest>`
  }
];

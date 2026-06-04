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
    description: "Classe de dados em Kotlin que encapsula as métricas de valores da corrida e realiza os cálculos de ganho por Km e por Hora, custo estimado de combustível, lucro líquido real, classificação visual por metas (Excelente, Aceitável ou Ruim) e o Score de 0 a 100 de faturamento operacional.",
    content: `package com.gigu.clone99

import kotlin.math.max
import kotlin.math.min

/**
 * Representa os dados extraídos de uma corrida da 99 e realiza os cálculos
 * de rentabilidade financeira corporativa para motoristas de aplicativos.
 */
data class RideData(
    val value: Double,
    val distance: Double,
    val duration: Int,
    val region: String = "Centro",
    val searchDistance: Double = 1.2,
    val rawText: String = ""
) {
    // Calcula o valor por quilômetro (R$/km) - total rodado incluindo o deslocamento
    val valuePerKm: Double
        get() = if (distance > 0.0) value / (distance + searchDistance) else 0.0

    // Calcula o valor por hora de corrida (R$/h)
    val valuePerHour: Double
        get() = if (duration > 0) value / (duration / 60.0) else 0.0

    enum class Classification {
        EXCELENTE,       // Verde (Boa)
        ACEITAVEL,       // Amarelo (Aceitável)
        RUIM             // Vermelho (Ruim)
    }

    /**
     * Calcula o custo estimado do combustível gasto na corrida.
     */
    fun calculateFuelCost(kmPerLitre: Double, fuelPrice: Double): Double {
        val totalDistance = distance + searchDistance
        return if (kmPerLitre > 0.0) (totalDistance / kmPerLitre) * fuelPrice else 0.0
    }

    /**
     * Calcula o lucro líquido estimado (Ganhos brutos - custo do combustível).
     */
    fun calculateNetProfit(kmPerLitre: Double, fuelPrice: Double): Double {
        val fuelCost = calculateFuelCost(kmPerLitre, fuelPrice)
        return max(0.0, value - fuelCost)
    }

    /**
     * Retorna a classificação da corrida com base nas metas do usuário.
     */
    fun getClassification(minKmGood: Double, minKmMedium: Double): Classification {
        val kmRate = valuePerKm
        return when {
            kmRate >= minKmGood -> Classification.EXCELENTE
            kmRate >= minKmMedium -> Classification.ACEITAVEL
            else -> Classification.RUIM
        }
    }

    /**
     * Sistema de Pontuação Inteligente que gera uma nota de 0 a 100 para a corrida.
     */
    fun calculateScore(
        minKmGood: Double,
        minKmMedium: Double,
        minHour: Double,
        kmPerLitre: Double,
        fuelPrice: Double
    ): Int {
        if (value <= 0.0 || distance <= 0.0) return 0

        var points = 0.0

        // 1. Componente de Valor por Km (Max 45 pontos)
        val rPerKm = valuePerKm
        val kmRatio = rPerKm / minKmGood
        points += min(45.0, kmRatio * 40.0)
        if (rPerKm >= minKmGood) points += 5.0

        // 2. Componente de Ganho por Hora (Max 35 pontos)
        val rPerHour = valuePerHour
        val hourRatio = rPerHour / minHour
        points += min(35.0, hourRatio * 30.0)
        if (rPerHour >= minHour) points += 5.0

        // 3. Componente de Distância de Busca (Max 10 pontos)
        val searchScore = when {
            searchDistance <= 1.0 -> 10.0
            searchDistance <= 2.0 -> 7.0
            searchDistance <= 3.0 -> 4.0
            else -> 0.0
        }
        points += searchScore

        // 4. Margem de Lucro líquido (Max 10 pontos)
        val netProfit = calculateNetProfit(kmPerLitre, fuelPrice)
        val profitMarginRatio = if (value > 0) netProfit / value else 0.0
        points += min(10.0, profitMarginRatio * 12.0)

        return min(100, max(0, points.toInt()))
    }

    /**
     * Retorna o feedback textual e a classificação de estrelas baseada na nota.
     */
    fun getScoreFeedback(score: Int): Pair<String, String> {
        return when {
            score >= 90 -> Pair("⭐⭐⭐⭐⭐", "Vale muito a pena!")
            score >= 75 -> Pair("⭐⭐⭐⭐", "Excelente oportunidade!")
            score >= 60 -> Pair("⭐⭐⭐", "Aceitável. Vale rodar.")
            score >= 45 -> Pair("⭐⭐", "Analise com cautela.")
            else -> Pair("⭐", "Recuse imediatamente. Prejuízo!")
        }
    }
}`
  },
  {
    name: "AnalysisService.kt",
    path: "app/src/main/java/com/gigu/clone99/AnalysisService.kt",
    language: "kotlin",
    description: "Serviço de Acessibilidade principal que é acionado automaticamente a cada nova oferta de viagem na 99, extrai os textos úteis por Regex, gera notificações do sistema, persiste os dados no Room Database de estatísticas e projeta a janela flutuante arrastável (Overlay).",
    content: `package com.gigu.clone99

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
import androidx.core.app.NotificationCompat
import com.gigu.clone99.databinding.OverlayLayoutBinding
import java.util.regex.Pattern

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

    private val hideOverlayRunnable = Runnable { removeOverlay() }

    override fun onServiceConnected() {
        super.onServiceConnected()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED ||
            event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            
            val rootNode = rootInActiveWindow ?: return
            val texts = ArrayList<String>()
            extractAllTexts(rootNode, texts)
            
            if (texts.isEmpty()) return
            val rawScreenText = texts.joinToString("\n")
            val rideData = parseRideData(rawScreenText)
            
            if (rideData != null) {
                val currentTime = System.currentTimeMillis()
                if (lastExtractedRide == null || 
                    lastExtractedRide!!.value != rideData.value || 
                    lastExtractedRide!!.distance != rideData.distance || 
                    (currentTime - lastExtractionTime > 8000)) {
                    
                    lastExtractedRide = rideData
                    lastExtractionTime = currentTime
                    showOverlayForRide(rideData)
                }
            }
        }
    }

    private fun extractAllTexts(node: AccessibilityNodeInfo?, texts: MutableList<String>) {
        if (node == null) return
        node.text?.let {
            if (it.isNotBlank()) texts.add(it.toString().trim())
        }
        for (i in 0 until node.childCount) {
            extractAllTexts(node.getChild(i), texts)
        }
    }

    private fun parseRideData(rawText: String): RideData? {
        try {
            val pricePattern = Pattern.compile("R\\$\\s*(\\d+[,.]\\d{2})")
            val distPattern = Pattern.compile("(\\d+[,.]?\\d*)\\s*(?:km|KM)")
            val durationPattern = Pattern.compile("(\\d+)\\s*(?:min|minutos)")

            val priceMatcher = pricePattern.matcher(rawText)
            val distMatcher = distPattern.matcher(rawText)
            val durationMatcher = durationPattern.matcher(rawText)

            if (priceMatcher.find() && distMatcher.find()) {
                val value = priceMatcher.group(1)?.replace(",", ".")?.toDoubleOrNull() ?: 0.0
                val distance = distMatcher.group(1)?.replace(",", ".")?.toDoubleOrNull() ?: 0.0
                val duration = if (durationMatcher.find()) durationMatcher.group(1)?.toIntOrNull() ?: 12 else Math.max(1, (distance * 2.5).toInt())

                var region = "Zona Principal"
                val lines = rawText.split("\n")
                for (line in lines) {
                    if (line.contains("Destino:") || line.contains("Para:")) {
                        region = line.replace("Destino:", "").replace("Para:", "").trim()
                        break
                    }
                }
                if (value > 0.0 && distance > 0.0) {
                    return RideData(value, distance, duration, region, 1.2, rawText)
                }
            }
        } catch (e: Exception) { Log.e(TAG, e.message ?: "") }
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "99 Copilot", NotificationManager.IMPORTANCE_HIGH)
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun showOverlayForRide(ride: RideData) {
        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        val minKmGood = sharedPref.getFloat("min_km_good", 2.20f).toDouble()
        val minKmMedium = sharedPref.getFloat("min_km_medium", 1.50f).toDouble()
        val minHour = sharedPref.getFloat("min_hour", 45.0f).toDouble()
        val kmPerLitre = sharedPref.getFloat("km_per_litre", 10.0f).toDouble()
        val fuelPrice = sharedPref.getFloat("fuel_price", 5.50f).toDouble()
        val isOverlayEnabled = sharedPref.getBoolean("enable_overlay", true)

        val classification = ride.getClassification(minKmGood, minKmMedium)
        val score = ride.calculateScore(minKmGood, minKmMedium, minHour, kmPerLitre, fuelPrice)
        val feedback = ride.getScoreFeedback(score)

        val fuelCost = ride.calculateFuelCost(kmPerLitre, fuelPrice)
        val netProfit = ride.calculateNetProfit(kmPerLitre, fuelPrice)
        
        Thread {
            try {
                val db = RideDatabase.getDatabase(this)
                db.rideDao().insertRide(RideEntity(
                    value = ride.value, distance = ride.distance, duration = ride.duration,
                    region = ride.region, classification = classification.name, score = score,
                    fuelCost = fuelCost, netProfit = netProfit, isAccepted = score >= 50,
                    timestamp = System.currentTimeMillis()
                ))
            } catch (ex: Exception) { Log.e(TAG, ex.message ?: "") }
        }.start()

        if (!isOverlayEnabled) return

        handler.post {
            try {
                if (overlayView == null) {
                    overlayBinding = OverlayLayoutBinding.inflate(LayoutInflater.from(this))
                    overlayView = overlayBinding!!.root
                    val params = WindowManager.LayoutParams(
                        WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else 2003,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                        PixelFormat.TRANSLUCENT
                    ).apply { gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL; y = 120 }
                    setupDragListener(overlayView!!, params)
                    overlayBinding!!.btnCloseOverlay.setOnClickListener { removeOverlay() }
                    windowManager?.addView(overlayView, params)
                }

                val binding = overlayBinding!!
                binding.tvRideValue.text = String.format("R$ %.2f", ride.value)
                binding.tvRideDistTime.text = String.format("%.1f km (+%.1fkm embarque)", ride.distance, ride.searchDistance)
                binding.tvRateKm.text = String.format("R$ %.2f / km", ride.valuePerKm)
                binding.tvRateHour.text = String.format("R$ %.0f / hora", ride.valuePerHour)
                binding.tvNetProfit.text = String.format("Lucro líq: R$ %.2f", netProfit)
                binding.tvRideScore.text = String.format("Nota: %d/100 %s", score, feedback.first)

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
                handler.removeCallbacks(hideOverlayRunnable)
                handler.postDelayed(hideOverlayRunnable, 7000)
            } catch (e: Exception) { Log.e(TAG, e.message ?: "") }
        }
    }

    private fun setupDragListener(view: View, params: WindowManager.LayoutParams) {
        view.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0; private var initialY = 0
            private var initialTouchX = 0f; private var initialTouchY = 0f
            override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                if (event == null) return false
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x; initialY = params.y
                        initialTouchX = event.rawX; initialTouchY = event.rawY
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
        overlayView?.let { windowManager?.removeView(it) }
        overlayView = null; overlayBinding = null
    }

    override fun onInterrupt() {}
}`
  },
  {
    name: "MainActivity.kt",
    path: "app/src/main/java/com/gigu/clone99/MainActivity.kt",
    language: "kotlin",
    description: "Classe de entrada do 99 Copilot de monitoração estruturada do status, permissões, e do painel de rendimentos locais de dados lidos.",
    content: `package com.gigu.clone99

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.text.TextUtils
import android.view.accessibility.AccessibilityManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.gigu.clone99.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
    }

    override fun onResume() {
        super.onResume()
        updateServiceStatus()
        loadDashboardStats()
    }

    private fun setupListeners() {
        binding.btnAccessibilityPerm.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        }
        binding.btnOverlayPerm.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:\$packageName"))
                startActivity(intent)
            }
        }
        binding.btnConfigure.setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }
        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        binding.switchOverlay.isChecked = sharedPref.getBoolean("enable_overlay", true)
        binding.switchOverlay.setOnCheckedChangeListener { _, isChecked ->
            sharedPref.edit().putBoolean("enable_overlay", isChecked).apply()
        }
    }

    private fun loadDashboardStats() {
        Thread {
            try {
                val dao = RideDatabase.getDatabase(this).rideDao()
                val totalNetProfit = dao.getTotalNetProfit()
                val avgGainPerKm = dao.getAverageGainPerKm()
                val accepted = dao.getAcceptedCount()
                val refused = dao.getRefusedCount()
                val bestRegStat = dao.getBestRegion()
                val bestRegionText = bestRegStat?.region ?: "Nenhuma"

                mainHandler.post {
                    binding.tvDashNetProfit.text = String.format("R$ %.2f", totalNetProfit)
                    binding.tvDashAvgKm.text = if (avgGainPerKm > 0) String.format("R$ %.2f/km", avgGainPerKm) else "R$ 0,00/km"
                    binding.tvDashCounts.text = "\$accepted aceitas • \$refused rec"
                    binding.tvDashBestRegion.text = bestRegionText
                }
            } catch (ex: Exception) { ex.printStackTrace() }
        }.start()
    }

    private fun updateServiceStatus() {
        val isServiceRunning = isAccessibilityServiceEnabled(this, AnalysisService::class.java)
        val hasOverlayPermission = Settings.canDrawOverlays(this)

        if (isServiceRunning && hasOverlayPermission) {
            binding.tvServiceStatus.text = "ATIVO (99 Copilot Operacional 🚦)"
            binding.tvServiceStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark))
        } else {
            binding.tvServiceStatus.text = "INATIVO (Habilitar Acessibilidade / Sobreposição)"
            binding.tvServiceStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
        }
    }

    private fun isAccessibilityServiceEnabled(context: Context, serviceClass: Class<*>): Boolean {
        val expectedComponentName = "\${context.packageName}/\${serviceClass.canonicalName}"
        val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC)
        for (enabledService in enabledServices) {
            if (enabledService.id.equals(expectedComponentName, ignoreCase = true)) return true
        }
        return false
    }
}`
  },
  {
    name: "RideRoomConfig.kt",
    path: "app/src/main/java/com/gigu/clone99/RideRoomConfig.kt",
    language: "kotlin",
    description: "Configuração do Room Database (Entity, Dao e Database) para permitir a persistência local do histórico detalhado de corridas analisadas de maneira 100% offline, privada e de baixo processamento.",
    content: `package com.gigu.clone99

import android.content.Context
import androidx.room.*

@Entity(tableName = "rides_history")
data class RideEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val value: Double,
    val distance: Double,
    val duration: Int,
    val region: String,
    val classification: String,
    val score: Int,
    val fuelCost: Double,
    val netProfit: Double,
    val isAccepted: Boolean,
    val timestamp: Long
)

@Dao
interface RideDao {
    @Query("SELECT * FROM rides_history ORDER BY timestamp DESC")
    fun getAllRides(): List<RideEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertRide(ride: RideEntity): Long

    @Query("DELETE FROM rides_history")
    fun clearAllHistory()

    @Query("SELECT COUNT(*) FROM rides_history WHERE isAccepted = 1")
    fun getAcceptedCount(): Int

    @Query("SELECT COUNT(*) FROM rides_history WHERE isAccepted = 0")
    fun getRefusedCount(): Int

    @Query("SELECT AVG(value / CASE WHEN distance > 0 THEN distance ELSE 1.0 END) FROM rides_history")
    fun getAverageGainPerKm(): Double

    @Query("SELECT SUM(netProfit) FROM rides_history WHERE isAccepted = 1")
    fun getTotalNetProfit(): Double

    @Query("SELECT region, COUNT(*) as count FROM rides_history GROUP BY region ORDER BY count DESC LIMIT 1")
    fun getBestRegion(): RegionStatistics?
}

data class RegionStatistics(val region: String, val count: Int)

@Database(entities = [RideEntity::class], version = 1, exportSchema = false)
abstract class RideDatabase : RoomDatabase() {
    abstract fun rideDao(): RideDao
    companion object {
        @Volatile private var INSTANCE: RideDatabase? = null
        fun getDatabase(context: Context): RideDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(context.applicationContext, RideDatabase::class.java, "copilot_99_database")
                    .fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  }
];

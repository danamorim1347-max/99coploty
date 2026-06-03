package com.gigu.clone99

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
            Toast.makeText(this, "Encontre '${getString(R.string.accessibility_service_label)}' e ative-o.", Toast.LENGTH_LONG).show()
        }

        // Redireciona para permissão de sobreposição de app (Overlay / Mostrar sobre outros apps)
        binding.btnOverlayPerm.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
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
            if (!isServiceRunning) statusStr += "\n• Falta ativar Acessibilidade"
            if (!hasOverlayPermission) statusStr += "\n• Falta permissão de Janela Flutuante"
            
            binding.tvServiceStatus.text = statusStr
            binding.tvServiceStatus.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_dark))
        }
    }

    /**
     * Método seguro para verificar se um serviço de acessibilidade específico está ativo.
     */
    private fun isAccessibilityServiceEnabled(context: Context, serviceClass: Class<*>): Boolean {
        val expectedComponentName = "${context.packageName}/${serviceClass.canonicalName}"
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
}

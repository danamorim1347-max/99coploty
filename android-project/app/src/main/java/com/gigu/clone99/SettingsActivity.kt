package com.gigu.clone99

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
}

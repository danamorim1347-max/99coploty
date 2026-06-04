package com.gigu.clone99

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.gigu.clone99.databinding.ActivitySettingsBinding

/**
 * Tela de configurações de metas de ganhos para o motorista de aplicativo.
 * Salva as preferências de valores mínimos ideais (R$/km e R$/h) e dados de consumo de combustível.
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Configurações"

        loadSettings()

        binding.btnSave.setOnClickListener {
            saveSettings()
        }
    }

    private fun loadSettings() {
        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        
        // Carrega valores ou define padrões coerentes
        val kmGood = sharedPref.getFloat("min_km_good", 2.20f)
        val kmMedium = sharedPref.getFloat("min_km_medium", 1.50f)
        val hourGood = sharedPref.getFloat("min_hour", 45.0f)
        val kmPerLitre = sharedPref.getFloat("km_per_litre", 10.0f)
        val fuelPrice = sharedPref.getFloat("fuel_price", 5.50f)
        val vibrate = sharedPref.getBoolean("vibrate_on_new", true)

        binding.etKmGood.setText(kmGood.toString())
        binding.etKmMedium.setText(kmMedium.toString())
        binding.etHourGood.setText(hourGood.toString())
        binding.etKmPerLitre.setText(kmPerLitre.toString())
        binding.etFuelPrice.setText(fuelPrice.toString())
        binding.cbVibrate.isChecked = vibrate
    }

    private fun saveSettings() {
        val kmGoodStr = binding.etKmGood.text.toString()
        val kmMediumStr = binding.etKmMedium.text.toString()
        val hourGoodStr = binding.etHourGood.text.toString()
        val kmPerLitreStr = binding.etKmPerLitre.text.toString()
        val fuelPriceStr = binding.etFuelPrice.text.toString()
        val vibrate = binding.cbVibrate.isChecked

        val kmGood = kmGoodStr.toFloatOrNull() ?: 2.20f
        val kmMedium = kmMediumStr.toFloatOrNull() ?: 1.50f
        val hourGood = hourGoodStr.toFloatOrNull() ?: 45.0f
        val kmPerLitre = kmPerLitreStr.toFloatOrNull() ?: 10.0f
        val fuelPrice = fuelPriceStr.toFloatOrNull() ?: 5.50f

        // Validação
        if (kmMedium > kmGood) {
            Toast.makeText(this, "O valor aceitável não deve exceder o excelente!", Toast.LENGTH_LONG).show()
            return
        }

        if (kmPerLitre <= 0f || fuelPrice <= 0f) {
            Toast.makeText(this, "Insira valores válidos para combustível e consumo!", Toast.LENGTH_LONG).show()
            return
        }

        val sharedPref = getSharedPreferences("Gigu99Preferences", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putFloat("min_km_good", kmGood)
            putFloat("min_km_medium", kmMedium)
            putFloat("min_hour", hourGood)
            putFloat("km_per_litre", kmPerLitre)
            putFloat("fuel_price", fuelPrice)
            putBoolean("vibrate_on_new", vibrate)
            apply()
        }

        Toast.makeText(this, "Configurações do 99 Copilot gravadas!", Toast.LENGTH_SHORT).show()
        finish()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}

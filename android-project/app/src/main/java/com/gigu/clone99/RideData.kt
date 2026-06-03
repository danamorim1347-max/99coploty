package com.gigu.clone99

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
}

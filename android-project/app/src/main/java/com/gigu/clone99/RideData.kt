package com.gigu.clone99

import kotlin.math.max
import kotlin.math.min

/**
 * Representa os dados extraídos de uma corrida da 99 e realiza os cálculos
 * de rentabilidade financeira corporativa para motoristas de aplicativos.
 * 
 * @param value Valor bruto da corrida em Reais (R$)
 * @param distance Distância total em Quilômetros (km)
 * @param duration Duração estimada em minutos (min)
 * @param region Região ou bairro de destino da corrida
 * @param searchDistance Distância de deslocamento até o passageiro (km) - padrão 1.5km
 * @param rawText Texto completo capturado para fins de depuração
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
     * Custo = (Distância total de deslocamento + viagem / consumo do veículo) * valor do combustível
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
     * Baseia-se em:
     * - Valor por km (peso 45)
     * - Ganho por hora (peso 35)
     * - Distância de busca de embarque (peso 10)
     * - Fatores de região de periculosidade ou trânsito (peso 10)
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
        points += min(45.0, kmRatio * 40.0) // escala proporcional atingindo max
        if (rPerKm >= minKmGood) points += 5.0

        // 2. Componente de Ganho por canhora (Max 35 pontos)
        val rPerHour = valuePerHour
        val hourRatio = rPerHour / minHour
        points += min(35.0, hourRatio * 30.0)
        if (rPerHour >= minHour) points += 5.0

        // 3. Componente de Distância de Busca (Max 10 pontos)
        // Embarques muito distantes (> 3.0km) perdem pontos, embarques curtos (< 1.0km) ganham bônus
        val searchScore = when {
            searchDistance <= 1.0 -> 10.0
            searchDistance <= 2.0 -> 7.0
            searchDistance <= 3.0 -> 4.0
            else -> 0.0
        }
        points += searchScore

        // 4. Margem de Lucro líquido (Max 10 pontos)
        // Baseada na porcentagem de lucro que sobre comparado ao gasto de combustivel
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
}

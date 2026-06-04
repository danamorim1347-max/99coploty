package com.gigu.clone99

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entidade Room Database representando o histórico de corridas analisadas.
 */
@Entity(tableName = "rides_history")
data class RideEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val value: Double,
    val distance: Double,
    val duration: Int,
    val region: String,
    val classification: String,  // GOOD, MEDIUM, BAD
    val score: Int,              // 0 - 100
    val fuelCost: Double,
    val netProfit: Double,
    val isAccepted: Boolean,     // Se o motorista aceitou ou recusou
    val timestamp: Long          // Data e hora em millis
)

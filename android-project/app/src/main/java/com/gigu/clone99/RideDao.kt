package com.gigu.clone99

import androidx.room.*

@Dao
interface RideDao {
    @Query("SELECT * FROM rides_history ORDER BY timestamp DESC")
    fun getAllRides(): List<RideEntity>

    @Query("SELECT * FROM rides_history ORDER BY timestamp DESC LIMIT :limit")
    fun getLatestRides(limit: Int): List<RideEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertRide(ride: RideEntity): Long

    @Update
    fun updateRide(ride: RideEntity)

    @Delete
    fun deleteRide(ride: RideEntity)

    @Query("DELETE FROM rides_history")
    fun clearAllHistory()

    // Query para Estatísticas do Dashboard
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

data class RegionStatistics(
    val region: String,
    val count: Int
)

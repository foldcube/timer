/**
 * Analytics Engine
 * Calculates statistics and trends from session data
 */

class AnalyticsEngine {
  constructor() {}

  /**
   * Calculate daily statistics
   */
  calculateDailyStats(sessions) {
    // Filter out invalid sessions first
    const validSessions = sessions.filter(s => {
      return s && s.startTime && !isNaN(s.startTime) && s.startTime > 0;
    });
    
    if (validSessions.length === 0) {
      return [];
    }
    
    // Group sessions by day
    const sessionsByDay = this.groupByDay(validSessions);
    
    const stats = [];
    
    for (const [dateKey, daySessions] of Object.entries(sessionsByDay)) {
      stats.push({
        date: dateKey,
        count: daySessions.length,
        totalDuration: this.sum(daySessions.map(s => s.duration)),
        avgDuration: this.mean(daySessions.map(s => s.duration)),
        successRate: this.calculateSuccessRate(daySessions),
        totalCycles: this.sum(daySessions.map(s => s.cyclesCompleted || 0)),
        totalPauses: this.sum(daySessions.map(s => s.pauseCount || 0)),
        avgRating: this.mean(daySessions.filter(s => s.rating).map(s => s.rating))
      });
    }
    
    return stats.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Calculate weekly statistics
   */
  calculateWeeklyStats(sessions) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeekSessions = sessions.filter(s => s.startTime >= weekAgo.getTime());
    const previousWeekStart = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekSessions = sessions.filter(s => 
      s.startTime >= previousWeekStart.getTime() && s.startTime < weekAgo.getTime()
    );
    
    return {
      thisWeek: this.calculatePeriodStats(thisWeekSessions),
      previousWeek: this.calculatePeriodStats(previousWeekSessions),
      change: this.calculateChange(thisWeekSessions.length, previousWeekSessions.length)
    };
  }

  /**
   * Calculate monthly statistics
   */
  calculateMonthlyStats(sessions) {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const thisMonthSessions = sessions.filter(s => s.startTime >= monthAgo.getTime());
    
    return this.calculatePeriodStats(thisMonthSessions);
  }

  /**
   * Calculate time of day patterns
   */
  calculateTimeOfDayPatterns(sessions) {
    // Group by hour of day
    const hourlyData = {};
    
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = {
        hour: hour,
        count: 0,
        successRate: 0,
        avgDuration: 0,
        sessions: []
      };
    }
    
    sessions.forEach(session => {
      const hour = session.hour !== undefined ? session.hour : new Date(session.startTime).getHours();
      if (hourlyData[hour]) {
        hourlyData[hour].sessions.push(session);
      }
    });
    
    // Calculate statistics for each hour
    Object.keys(hourlyData).forEach(hour => {
      const data = hourlyData[hour];
      if (data.sessions.length > 0) {
        data.count = data.sessions.length;
        data.successRate = this.calculateSuccessRate(data.sessions);
        data.avgDuration = this.mean(data.sessions.map(s => s.duration));
      }
      delete data.sessions; // Remove raw sessions from output
    });
    
    return Object.values(hourlyData);
  }

  /**
   * Calculate pause patterns
   */
  calculatePausePatterns(sessions) {
    const sessionsWithPauses = sessions.filter(s => s.pauseCount && s.pauseCount > 0);
    
    if (sessionsWithPauses.length === 0) {
      return {
        avgPausesPerSession: 0,
        avgPauseDuration: 0,
        totalPauses: 0,
        pauseFrequency: 0
      };
    }
    
    const allPauses = sessionsWithPauses.flatMap(s => s.pauses || []);
    
    return {
      avgPausesPerSession: this.mean(sessionsWithPauses.map(s => s.pauseCount)),
      avgPauseDuration: this.mean(allPauses.map(p => p.duration)),
      totalPauses: allPauses.length,
      pauseFrequency: (sessionsWithPauses.length / sessions.length) * 100, // % of sessions with pauses
      pauseDurationDistribution: this.calculateDistribution(allPauses.map(p => p.duration))
    };
  }

  /**
   * Calculate phase distribution statistics
   */
  calculatePhaseStats(sessions) {
    const sessionsWithPhases = sessions.filter(s => s.phaseDistribution);
    
    if (sessionsWithPhases.length === 0) {
      return { flow: 0, transition: 0, crunch: 0 };
    }
    
    return {
      flow: this.mean(sessionsWithPhases.map(s => s.phaseDistribution.flow || 0)),
      transition: this.mean(sessionsWithPhases.map(s => s.phaseDistribution.transition || 0)),
      crunch: this.mean(sessionsWithPhases.map(s => s.phaseDistribution.crunch || 0))
    };
  }

  /**
   * Get personal bests
   */
  getPersonalBests(sessions) {
    if (sessions.length === 0) {
      return {
        longestSession: null,
        mostCycles: null,
        longestStreak: 0,
        highestRating: null
      };
    }
    
    return {
      longestSession: sessions.reduce((max, s) => s.duration > (max?.duration || 0) ? s : max, null),
      mostCycles: sessions.reduce((max, s) => (s.cyclesCompleted || 0) > (max?.cyclesCompleted || 0) ? s : max, null),
      longestStreak: this.calculateLongestStreak(sessions),
      highestRating: sessions.filter(s => s.rating).reduce((max, s) => s.rating > (max?.rating || 0) ? s : max, null)
    };
  }

  /**
   * Calculate trend (improving/declining/stable)
   */
  calculateTrend(timeSeries) {
    if (timeSeries.length < 2) return 'stable';
    
    const firstHalf = timeSeries.slice(0, Math.floor(timeSeries.length / 2));
    const secondHalf = timeSeries.slice(Math.floor(timeSeries.length / 2));
    
    const firstAvg = this.mean(firstHalf);
    const secondAvg = this.mean(secondHalf);
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 5) return 'improving';
    if (changePercent < -5) return 'declining';
    return 'stable';
  }

  // ===== Helper Functions =====

  /**
   * Group sessions by day
   */
  groupByDay(sessions) {
    const grouped = {};
    
    sessions.forEach(session => {
      // Extra validation (sessions should already be validated by caller)
      if (!session || !session.startTime || isNaN(session.startTime)) {
        return;
      }
      
      const date = new Date(session.startTime);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Skipping session with invalid date:', session);
        return;
      }
      
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    
    return grouped;
  }

  /**
   * Calculate statistics for a period
   */
  calculatePeriodStats(sessions) {
    if (sessions.length === 0) {
      return {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        successRate: 0,
        totalCycles: 0
      };
    }
    
    return {
      count: sessions.length,
      totalDuration: this.sum(sessions.map(s => s.duration)),
      avgDuration: this.mean(sessions.map(s => s.duration)),
      successRate: this.calculateSuccessRate(sessions),
      totalCycles: this.sum(sessions.map(s => s.cyclesCompleted || 0))
    };
  }

  /**
   * Calculate success rate (% of sessions without pauses)
   */
  calculateSuccessRate(sessions) {
    if (sessions.length === 0) return 0;
    const successfulSessions = sessions.filter(s => s.wasSuccessful).length;
    return (successfulSessions / sessions.length) * 100;
  }

  /**
   * Calculate longest streak of successful sessions
   */
  calculateLongestStreak(sessions) {
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Sort by start time
    const sortedSessions = [...sessions].sort((a, b) => a.startTime - b.startTime);
    
    sortedSessions.forEach(session => {
      if (session.wasSuccessful) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return longestStreak;
  }

  /**
   * Calculate percentage change
   */
  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Calculate distribution (min, max, median, percentiles)
   */
  calculateDistribution(values) {
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: this.median(values),
      p25: this.percentile(sorted, 25),
      p75: this.percentile(sorted, 75)
    };
  }

  /**
   * Calculate mean (average)
   */
  mean(values) {
    if (values.length === 0) return 0;
    return this.sum(values) / values.length;
  }

  /**
   * Calculate median
   */
  median(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  /**
   * Calculate percentile
   */
  percentile(sortedValues, percentile) {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Sum array of numbers
   */
  sum(values) {
    return values.reduce((acc, val) => acc + (val || 0), 0);
  }

  /**
   * Format duration to human readable string
   */
  formatDuration(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// Export for use in app
window.AnalyticsEngine = AnalyticsEngine;

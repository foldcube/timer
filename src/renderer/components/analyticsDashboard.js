/**
 * Analytics Dashboard Visualization
 * Handles Chart.js charts and session history table rendering
 */

class AnalyticsDashboard {
  constructor(analyticsEngine) {
    this.analyticsEngine = analyticsEngine;
    this.charts = {};
    this.sessions = [];
    this.filteredSessions = [];
  }

  /**
   * Load and render analytics dashboard
   */
  async loadDashboard() {
    // Get all session data
    const sessions = await window.horizon.getAllSessions();
    this.sessions = sessions;
    this.filteredSessions = sessions;

    // Update overview stats
    this.updateOverviewStats(sessions);

    // Render activity heatmap
    this.renderActivityHeatmap(sessions);

    // Render charts (only the 2 essential ones)
    if (sessions.length > 0) {
      this.renderDailySessionsChart(sessions);
      this.renderPhaseDistributionChart(sessions);
    }

    // Session history removed for minimal design
  }

  /**
   * Update overview statistics cards
   */
  updateOverviewStats(sessions) {
    const totalSessions = sessions.length;
    const totalTime = this.analyticsEngine.sum(sessions.map(s => s.duration));
    const avgDuration = totalSessions > 0 ? this.analyticsEngine.mean(sessions.map(s => s.duration)) : 0;
    const successRate = this.analyticsEngine.calculateSuccessRate(sessions);
    const currentStreak = this.analyticsEngine.calculateLongestStreak(sessions);
    
    // Calculate this week sessions
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekSessions = sessions.filter(s => s.startTime >= weekAgo.getTime());

    document.getElementById('stat-sessions').textContent = totalSessions;
    document.getElementById('stat-total-time').textContent = this.formatDuration(totalTime);
    document.getElementById('stat-avg-duration').textContent = totalSessions > 0 ? this.formatDuration(avgDuration) : '--';
    document.getElementById('stat-success-rate').textContent = totalSessions > 0 ? `${successRate.toFixed(0)}%` : '--';
    document.getElementById('stat-streak').textContent = currentStreak;
    document.getElementById('stat-week-sessions').textContent = thisWeekSessions.length;
  }

  /**
   * Render daily sessions bar chart
   */
  renderDailySessionsChart(sessions) {
    const dailyStats = this.analyticsEngine.calculateDailyStats(sessions);
    
    // Get last 30 days
    const last30Days = dailyStats.slice(-30);
    
    const ctx = document.getElementById('chart-daily-sessions');
    if (!ctx) return;

    // Destroy existing chart
    if (this.charts.dailySessions) {
      this.charts.dailySessions.destroy();
    }

    this.charts.dailySessions = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: last30Days.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Sessions',
          data: last30Days.map(d => d.count),
          backgroundColor: '#14b8a6',
          borderColor: '#14b8a6',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  /**
   * Render phase distribution doughnut chart
   */
  renderPhaseDistributionChart(sessions) {
    const phaseStats = this.analyticsEngine.calculatePhaseStats(sessions);
    
    const ctx = document.getElementById('chart-phase-distribution');
    if (!ctx) return;

    // Destroy existing chart
    if (this.charts.phaseDistribution) {
      this.charts.phaseDistribution.destroy();
    }

    this.charts.phaseDistribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Flow', 'Transition', 'Crunch'],
        datasets: [{
          data: [phaseStats.flow, phaseStats.transition, phaseStats.crunch],
          backgroundColor: ['#14b8a6', '#f59e0b', '#f43f5e'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                return `${context.label}: ${this.formatDuration(value)}`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Render time of day productivity line chart
   */
  renderTimeOfDayChart(sessions) {
    const timeOfDayData = this.analyticsEngine.calculateTimeOfDayPatterns(sessions);
    
    const ctx = document.getElementById('chart-time-of-day');
    if (!ctx) return;

    // Destroy existing chart
    if (this.charts.timeOfDay) {
      this.charts.timeOfDay.destroy();
    }

    this.charts.timeOfDay = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeOfDayData.map(d => `${d.hour}:00`),
        datasets: [{
          label: 'Success Rate',
          data: timeOfDayData.map(d => d.successRate),
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        }
      }
    });
  }

  /**
   * Render session duration trend line chart
   */
  renderDurationTrendChart(sessions) {
    // Get last 30 sessions
    const recentSessions = sessions.slice(-30);
    
    const ctx = document.getElementById('chart-duration-trend');
    if (!ctx) return;

    // Destroy existing chart
    if (this.charts.durationTrend) {
      this.charts.durationTrend.destroy();
    }

    this.charts.durationTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: recentSessions.map((s, i) => `#${i + 1}`),
        datasets: [{
          label: 'Duration (min)',
          data: recentSessions.map(s => s.duration / 60000),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `${value}m`
            }
          }
        }
      }
    });
  }

  /**
   * Render session history table
   */
  renderSessionHistory(sessions) {
    const tbody = document.getElementById('sessions-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Sort by most recent first
    const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

    // Show first 20 sessions
    const displaySessions = sortedSessions.slice(0, 20);

    displaySessions.forEach(session => {
      const row = document.createElement('tr');
      row.className = 'session-row';

      // Date
      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(session.startTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      row.appendChild(dateCell);

      // Duration
      const durationCell = document.createElement('td');
      durationCell.textContent = this.formatDuration(session.duration);
      row.appendChild(durationCell);

      // Cycles
      const cyclesCell = document.createElement('td');
      cyclesCell.textContent = session.cyclesCompleted || 0;
      row.appendChild(cyclesCell);

      // Pauses
      const pausesCell = document.createElement('td');
      pausesCell.textContent = session.pauseCount || 0;
      if (session.pauseCount > 0) {
        pausesCell.style.color = '#f59e0b';
      }
      row.appendChild(pausesCell);

      // Success
      const successCell = document.createElement('td');
      successCell.textContent = session.wasSuccessful ? '✓' : '✗';
      successCell.style.color = session.wasSuccessful ? '#14b8a6' : '#f43f5e';
      row.appendChild(successCell);

      // Rating
      const ratingCell = document.createElement('td');
      if (session.rating) {
        ratingCell.textContent = '★'.repeat(session.rating) + '☆'.repeat(5 - session.rating);
        ratingCell.style.color = '#fbbf24';
      } else {
        ratingCell.textContent = '--';
      }
      row.appendChild(ratingCell);

      // Expand button
      const expandCell = document.createElement('td');
      const expandBtn = document.createElement('button');
      expandBtn.textContent = '▼';
      expandBtn.className = 'expand-btn';
      expandBtn.addEventListener('click', () => this.toggleSessionDetails(session, row));
      expandCell.appendChild(expandBtn);
      row.appendChild(expandCell);

      tbody.appendChild(row);
    });

    // Update table info
    const tableInfo = document.getElementById('table-info');
    if (tableInfo) {
      tableInfo.textContent = `Showing ${displaySessions.length} of ${sortedSessions.length} sessions`;
    }
  }

  /**
   * Toggle session detail row
   */
  toggleSessionDetails(session, row) {
    // Check if details row already exists
    const nextRow = row.nextElementSibling;
    if (nextRow && nextRow.classList.contains('details-row')) {
      nextRow.remove();
      return;
    }

    // Create details row
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'details-row';

    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 7;

    // Build details content
    let detailsHTML = '<div class="session-details">';

    // Phase distribution
    if (session.phaseDistribution) {
      const total = session.phaseDistribution.flow + session.phaseDistribution.transition + session.phaseDistribution.crunch;
      if (total > 0) {
        const flowPct = ((session.phaseDistribution.flow / total) * 100).toFixed(0);
        const transPct = ((session.phaseDistribution.transition / total) * 100).toFixed(0);
        const crunchPct = ((session.phaseDistribution.crunch / total) * 100).toFixed(0);
        detailsHTML += `<div><strong>Phase Distribution:</strong> Flow ${flowPct}% • Transition ${transPct}% • Crunch ${crunchPct}%</div>`;
      }
    }

    // Pauses
    if (session.pauses && session.pauses.length > 0) {
      detailsHTML += '<div><strong>Pauses:</strong> ';
      session.pauses.forEach((pause, i) => {
        const time = new Date(pause.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const duration = Math.floor(pause.duration / 1000);
        detailsHTML += `${time} (${duration}s)`;
        if (i < session.pauses.length - 1) detailsHTML += ', ';
      });
      detailsHTML += '</div>';
    }

    // Cycles
    if (session.cycleHistory && session.cycleHistory.length > 0) {
      detailsHTML += `<div><strong>Cycles:</strong> ${session.cycleHistory.length} completed</div>`;
    }

    detailsHTML += '</div>';
    detailsCell.innerHTML = detailsHTML;
    detailsRow.appendChild(detailsCell);

    row.after(detailsRow);
  }

  /**
   * Filter sessions by period
   */
  filterByPeriod(period) {
    const now = new Date();
    let filtered;

    switch (period) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        filtered = this.sessions.filter(s => s.startTime >= todayStart);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        filtered = this.sessions.filter(s => s.startTime >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
        filtered = this.sessions.filter(s => s.startTime >= monthAgo);
        break;
      default:
        filtered = this.sessions;
    }

    this.filteredSessions = filtered;
    this.renderSessionHistory(filtered);
  }

  /**
   * Filter sessions by success
   */
  filterBySuccess(successType) {
    let filtered;

    switch (successType) {
      case 'successful':
        filtered = this.filteredSessions.filter(s => s.wasSuccessful);
        break;
      case 'interrupted':
        filtered = this.filteredSessions.filter(s => !s.wasSuccessful);
        break;
      default:
        filtered = this.filteredSessions;
    }

    this.renderSessionHistory(filtered);
  }

  /**
   * Export session data
   */
  async exportData(format = 'csv') {
    const data = await window.horizon.exportSessions(format);
    
    // Create download
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ` horizon-timer-sessions-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Format duration to readable string
   */
  formatDuration(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Render activity heatmap (8 weeks, GitHub-style with labels)
   */
  renderActivityHeatmap(sessions) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    container.innerHTML = '';

    // Calculate 8 weeks of data (56 days)
    const today = new Date();
    const weeks = 8;
    const daysPerWeek = 7;
    
    // Group sessions by date
    const sessionsByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      const dateKey = date.toDateString();
      sessionsByDate[dateKey] = (sessionsByDate[dateKey] || 0) + 1;
    });

    // Create wrapper with labels
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    
    // Add month labels
    const monthsDiv = document.createElement('div');
    monthsDiv.className = 'heatmap-months';
    
    const monthsMap = new Map();
    for (let weekIndex = weeks - 1; weekIndex >= 0; weekIndex--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (weekIndex * daysPerWeek));
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      if (!monthsMap.has(monthName)) {
        monthsMap.set(monthName, 1);
        const monthLabel = document.createElement('div');
        monthLabel.className = 'heatmap-month';
        monthLabel.textContent = monthName;
        monthsDiv.appendChild(monthLabel);
      }
    }
    wrapper.appendChild(monthsDiv);
    
    // Create row with day labels and grid
    const contentRow = document.createElement('div');
    contentRow.className = 'heatmap-wrapper';
    
    // Add day-of-week labels (M, W, F)
    const daysLabel = document.createElement('div');
    daysLabel.className = 'heatmap-days-label';
    ['M', '', 'W', '', 'F', '', ''].forEach(day => {
      const label = document.createElement('div');
      label.className = 'heatmap-day-label';
      label.textContent = day;
      daysLabel.appendChild(label);
    });
    contentRow.appendChild(daysLabel);
    
    // Create heatmap grid
    const gridDiv = document.createElement('div');
    gridDiv.className = 'heatmap-grid';

    // Create heatmap grid (8 weeks)
    for (let weekIndex = weeks - 1; weekIndex >= 0; weekIndex--) {
      const weekDiv = document.createElement('div');
      weekDiv.className = 'heatmap-week';

      for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex++) {
        const daysAgo = weekIndex * daysPerWeek + dayIndex;
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(0, 0, 0, 0);

        const dateKey = date.toDateString();
        const count = sessionsByDate[dateKey] || 0;

        const dayDiv = document.createElement('div');
        dayDiv.className = 'heatmap-day';
        
        // Determine intensity level (0-4)
        let level = 0;
        if (count > 0) level = 1;
        if (count >= 2) level = 2;
        if (count >= 4) level = 3;
        if (count >= 6) level = 4;
        
        dayDiv.classList.add(`level-${level}`);
        dayDiv.dataset.date = dateKey;
        dayDiv.dataset.count = count;

        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'heatmap-tooltip';
        tooltip.textContent = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count} session${count !== 1 ? 's' : ''}`;
        dayDiv.appendChild(tooltip);

        // Click handler to filter sessions by date
        dayDiv.addEventListener('click', () => {
          this.filterByDate(dateKey);
        });

        weekDiv.appendChild(dayDiv);
      }

      gridDiv.appendChild(weekDiv);
    }
    
    contentRow.appendChild(gridDiv);
    wrapper.appendChild(contentRow);
    container.appendChild(wrapper);
  }

  /**
   * Filter sessions by specific date
   */
  filterByDate(dateKey) {
    const filtered = this.sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate.toDateString() === dateKey;
    });

    this.filteredSessions = filtered;
    this.renderSessionHistory(filtered);
  }

  /**
   * Destroy all charts
   */
  destroyCharts() {
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
  }
}

// Export for use in app
window.AnalyticsDashboard = AnalyticsDashboard;

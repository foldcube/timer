const electron = require('electron');
const path = require('path');
const fs = require('fs');

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Error writing to store:', err);
    }
  }

  /**
   * Get all session analytics data
   */
  getAllSessions() {
    return this.data.sessions || [];
  }

  /**
   * Save a new session to analytics history
   */
  saveSessionData(sessionData) {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }
    
    this.data.sessions.push(sessionData);
    
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
      return true;
    } catch (err) {
      console.error('Error saving session data:', err);
      return false;
    }
  }

  /**
   * Get sessions within a date range
   */
  getSessionsByDateRange(startDate, endDate) {
    const sessions = this.getAllSessions();
    
    return sessions.filter(session => {
      const sessionDate = session.startTime;
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  /**
   * Export sessions to specified format
   */
  exportSessions(format = 'json') {
    const sessions = this.getAllSessions();
    
    if (format === 'json') {
      return JSON.stringify(sessions, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(sessions);
    }
    
    return null;
  }

  /**
   * Convert sessions to CSV format
   */
  convertToCSV(sessions) {
    if (sessions.length === 0) return '';
    
    const headers = [
      'ID', 'Start Time', 'End Time', 'Duration (min)', 'Cycles', 
      'Pauses', 'Total Pause Time (min)', 'Success', 'Rating',
      'Flow Time (min)', 'Transition Time (min)', 'Crunch Time (min)',
      'Captures', 'Hour', 'Day of Week'
    ];
    
    const rows = sessions.map(s => [
      s.id,
      new Date(s.startTime).toISOString(),
      new Date(s.endTime).toISOString(),
      (s.duration / 60000).toFixed(2),
      s.cyclesCompleted || 0,
      s.pauseCount || 0,
      ((s.totalPauseTime || 0) / 60000).toFixed(2),
      s.wasSuccessful ? 'Yes' : 'No',
      s.rating || '',
      ((s.phaseDistribution?.flow || 0) / 60000).toFixed(2),
      ((s.phaseDistribution?.transition || 0) / 60000).toFixed(2),
      ((s.phaseDistribution?.crunch || 0) / 60000).toFixed(2),
      s.captureCount || 0,
      s.hour || '',
      s.dayOfWeek || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
}

function parseDataFile(filePath, defaults) {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (error) {
    return defaults;
  }
}

module.exports = Store;

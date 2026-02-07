/**
 * Sample Data Generator for Session Analytics
 * Run this once to populate the analytics dashboard with test data
 */

(async function generateSampleData() {
  console.log('🎲 Generating sample session data...');
  
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sampleSessions = [];
  
  // Generate 30 days of sample sessions
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const sessionsPerDay = Math.floor(Math.random() * 4) + 1; // 1-4 sessions per day
    
    for (let sessionNum = 0; sessionNum < sessionsPerDay; sessionNum++) {
      const sessionDate = now - (dayOffset * oneDay);
      const hour = 9 + Math.floor(Math.random() * 10); // Sessions between 9am-7pm
      const startTime = sessionDate + (hour * 60 * 60 * 1000);
      
      // Random session duration (15-45 minutes)
      const duration = (15 + Math.random() * 30) * 60 * 1000;
      
      // Random number of pauses (0-3)
      const pauseCount = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;
      const pauses = [];
      let totalPauseTime = 0;
      
      for (let i = 0; i < pauseCount; i++) {
        const pauseStart = startTime + (Math.random() * duration);
        const pauseDuration = (10 + Math.random() * 50) * 1000; // 10-60 seconds
        pauses.push({
          startTime: pauseStart,
          endTime: pauseStart + pauseDuration,
          duration: pauseDuration
        });
        totalPauseTime += pauseDuration;
      }
      
      // Random cycles (1-4)
      const cyclesCompleted = Math.floor(Math.random() * 4) + 1;
      const cycleHistory = [];
      for (let i = 0; i < cyclesCompleted; i++) {
        cycleHistory.push({
          cycleNumber: i,
          startTime: startTime + (i * 25 * 60 * 1000),
          endTime: startTime + ((i + 1) * 25 * 60 * 1000),
          duration: 25 * 60 * 1000
        });
      }
      
      // Phase distribution (typical: 80% flow, 15% transition, 5% crunch)
      const flowTime = duration * (0.75 + Math.random() * 0.1);
      const transitionTime = duration * (0.10 + Math.random() * 0.1);
      const crunchTime = duration - flowTime - transitionTime;
      
      // Random captures (0-5)
      const captureCount = Math.floor(Math.random() * 6);
      const captures = [];
      for (let i = 0; i < captureCount; i++) {
        captures.push({
          timestamp: startTime + (Math.random() * duration),
          text: `Sample thought #${i + 1}`
        });
      }
      
      // Random rating (3-5 stars, or null)
      const rating = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 3 : null;
      
      const session = {
        id: `sample-${sessionDate}-${sessionNum}`,
        startTime: startTime,
        endTime: startTime + duration,
        duration: duration,
        
        cyclesCompleted: cyclesCompleted,
        cycleHistory: cycleHistory,
        
        phaseDistribution: {
          flow: flowTime,
          transition: transitionTime,
          crunch: crunchTime
        },
        
        pauseCount: pauseCount,
        pauses: pauses,
        totalPauseTime: totalPauseTime,
        
        captureCount: captureCount,
        captures: captures,
        
        wasSuccessful: pauseCount === 0,
        rating: rating,
        
        hour: hour,
        dayOfWeek: new Date(startTime).getDay(),
        
        bonusTime: 0,
        notes: ''
      };
      
      sampleSessions.push(session);
    }
  }
  
  console.log(`✅ Generated ${sampleSessions.length} sample sessions`);
  
  // Save to store
  for (const session of sampleSessions) {
    await window.horizon.saveSessionAnalytics(session);
  }
  
  console.log('💾 Sample data saved! Click the Stats button to view analytics.');
  alert(`Generated ${sampleSessions.length} sample sessions!\n\nClick the Stats (📊) button to view your analytics dashboard.`);
})();

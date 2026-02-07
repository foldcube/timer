/**
 * Direct Sample Data Injector
 * Run with: node inject-sample-data.js
 * This adds sample sessions directly to the data store
 */

const fs = require('fs');
const path = require('path');

function generateSampleSessions() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sessions = [];
  
  // Generate 30 days of sessions
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const sessionsPerDay = Math.floor(Math.random() * 4) + 1;
    
    for (let sessionNum = 0; sessionNum < sessionsPerDay; sessionNum++) {
      const sessionDate = now - (dayOffset * oneDay);
      const hour = 9 + Math.floor(Math.random() * 10);
      const startTime = sessionDate + (hour * 60 * 60 * 1000);
      const duration = (15 + Math.random() * 30) * 60 * 1000;
      
      const pauseCount = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;
      const pauses = [];
      let totalPauseTime = 0;
      
      for (let i = 0; i < pauseCount; i++) {
        const pauseStart = startTime + (Math.random() * duration);
        const pauseDuration = (10 + Math.random() * 50) * 1000;
        pauses.push({
          startTime: pauseStart,
          endTime: pauseStart + pauseDuration,
          duration: pauseDuration
        });
        totalPauseTime += pauseDuration;
      }
      
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
      
      const flowTime = duration * (0.75 + Math.random() * 0.1);
      const transitionTime = duration * (0.10 + Math.random() * 0.1);
      const crunchTime = duration - flowTime - transitionTime;
      
      const captureCount = Math.floor(Math.random() * 6);
      const captures = [];
      for (let i = 0; i < captureCount; i++) {
        captures.push({
          timestamp: startTime + (Math.random() * duration),
          text: `Sample thought #${i + 1}`
        });
      }
      
      const rating = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 3 : null;
      
      sessions.push({
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
      });
    }
  }
  
  return sessions;
}

// Find the data file
const userDataPath = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
const dataFilePath = path.join(userDataPath, 'horizon-timer', 'horizon-data.json');

console.log('🔍 Looking for data file at:', dataFilePath);

let data = {};
if (fs.existsSync(dataFilePath)) {
  console.log('✅ Found existing data file');
  const content = fs.readFileSync(dataFilePath, 'utf8');
  data = JSON.parse(content);
} else {
  console.log('📝 Creating new data file');
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  data = {
    captures: [],
    sessions: [],
    settings: {}
  };
}

// Generate and add sample sessions
console.log('🎲 Generating sample sessions...');
const sampleSessions = generateSampleSessions();

// Add to data (avoid duplicates)
if (!data.sessions) {
  data.sessions = [];
}

data.sessions = data.sessions.concat(sampleSessions);

console.log(`✅ Generated ${sampleSessions.length} sample sessions`);
console.log(`📊 Total sessions in store: ${data.sessions.length}`);

// Save the data
fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
console.log('💾 Sample data saved successfully!');
console.log('\n🎉 All done! Start your app and click the Stats button to view analytics.\n');

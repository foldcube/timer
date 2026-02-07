# Session Analytics - Quick Start Guide

## The Issue
The analytics dashboard is built but needs a few quick integration steps to work. The stats button doesn't show anything because:
1. Missing IPC handlers in main.js and preload.js
2. No session data exists yet

## Quick Fix (5 minutes)

### Option A: Automated Guided Setup

1. Run the setup script:
   ```bash
   setup-analytics.bat
   ```

2. Follow the on-screen instructions to apply the patches

### Option B: Manual Setup

#### Step 1: Add IPC Handlers to main.js

Open `src/main/main.js` and add this code after line 218:

```javascript
// New session analytics handlers
ipcMain.handle('save-session-analytics', (event, sessionData) => {
  return store.saveSessionData(sessionData);
});

ipcMain.handle('get-all-sessions', () => {
  return store.getAllSessions();
});

ipcMain.handle('get-sessions-by-date-range', (event, startDate, endDate) => {
  return store.getSessionsByDateRange(startDate, endDate);
});

ipcMain.handle('export-sessions', (event, format) => {
  return store.exportSessions(format);
});
```

#### Step 2: Expose IPC Methods in preload.js

Open `src/main/preload.js` and add these lines after line 26 (in the analytics section):

```javascript
  // Session Analytics
  saveSessionAnalytics: (sessionData) => ipcRenderer.invoke('save-session-analytics', sessionData),
  getAllSessions: () => ipcRenderer.invoke('get-all-sessions'),
  getSessionsByDateRange: (startDate, endDate) => ipcRenderer.invoke('get-sessions-by-date-range', startDate, endDate),
  exportSessions: (format) => ipcRenderer.invoke('export-sessions', format),
```

#### Step 3: Wire Up Dashboard in app.js

Open `src/renderer/app.js`:

**3a.** After line 14 (after `const analyticsEngine = new AnalyticsEngine();`), add:
```javascript
const analyticsDashboard = new AnalyticsDashboard(analyticsEngine);
```

**3b.** Find the `btnAnalytics` click handler (around line 310) and replace it with:
```javascript
btnAnalytics.addEventListener('click', async () => {
  try {
    await analyticsDashboard.loadDashboard();
    analyticsPanel.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading analytics:', error);
    alert('Error loading analytics. Check console for details.');
  }
});
```

**3c.** Add filter and export handlers after the analytics button handler:
```javascript
// Export data button
if (btnExportData) {
  btnExportData.addEventListener('click', async () => {
    await analyticsDashboard.exportData('csv');
  });
}

// Period filter
if (filterPeriod) {
  filterPeriod.addEventListener('change', (e) => {
    analyticsDashboard.filterByPeriod(e.target.value);
  });
}

// Success filter
if (filterSuccess) {
  filterSuccess.addEventListener('change', (e) => {
    analyticsDashboard.filterBySuccess(e.target.value);
  });
}
```

#### Step 4: Generate Sample Data

1. Start the app:
   ```bash
   npm start
   ```

2. Open Developer Tools (Ctrl+Shift+I or F12)

3. Go to the Console tab

4. Paste this command and press Enter:
   ```javascript
   const script = document.createElement('script');
   script.src = '../generate-sample-data.js';
   document.body.appendChild(script);
   ```

5. Wait for the alert: "Generated X sample sessions!"

6. Click the **📊 Stats** button

## What You'll See

Once sample data is generated, the analytics dashboard will show:

- **6 Overview Cards**: Total sessions, total time, avg session, success rate, streak, this week
- **4 Interactive Charts**: 
  - Sessions per day (bar chart)
  - Phase distribution (doughnut chart)
  - Time of day productivity (line chart)
  - Session length trend (line chart)
- **Session History Table**: Sortable/filterable list with expandable details
- **Export Button**: Download data as CSV

## Files Created

- ✅ `generate-sample-data.js` - Sample data generator
- ✅ `PATCH-main-js.txt` - Code to add to main.js
- ✅ `PATCH-preload-js.txt` - Code to add to preload.js
- ✅ `PATCH-app-js.txt` - Code to add to app.js
- ✅ `setup-analytics.bat` - Automated setup guide
- ✅ `QUICKSTART.md` - This file!

## Troubleshooting

**"Nothing shows when I click Stats"**
- Make sure you completed all 4 steps above
- Open console (F12) and check for errors
- Verify Chart.js is installed: `npm list chart.js`

**"Cannot find module chart.js"**
- Run: `npm install chart.js`

**"Method not found" errors**
- Double-check the IPC handlers were added to main.js and preload.js correctly

## Next Steps

After seeing the sample data dashboard:
1. Run real timer sessions to generate your own data
2. Explore the charts and filters
3. Export data to analyze trends
4. Customize the visualizations as needed

Questions? Check the [comprehensive walkthrough](file:///C:/Users/PT/.gemini/antigravity/brain/6b44456d-0e70-4f34-96d8-2ef22b3538a8/walkthrough.md) for full details!

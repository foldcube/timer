# Horizon Timer v0.1.0 - Release Notes

## Overview

First working release of Horizon Timer, an **"Invisible Support"** productivity tool for the neurodivergent brain.

## Features

- **Horizon Line**: Pixel-thin visual timer with phase-based colors
  - Flow (Teal): 0-80% elapsed
  - Transition (Amber): 80-95% elapsed
  - Crunch (Rose): 95-100% elapsed
  - Bonus (Gold): Overtime tracking

- **Ghost Interaction**: Click-through window with 400ms hover activation
- **Quick Capture**: `Alt+Space` or `Ctrl+J` for instant thought capture
- **Flow-Modoro**: Bonus time tracking rewards hyperfocus
- **Brown Noise**: Built-in Web Audio synthesized focus audio
- **Psychoacoustic Alarms**: Gentle 12-second fade-in sine wave alerts
- **Compassionate Analytics**: Session ratings and capture tracking

## Build Artifacts

The following artifacts were built for this release:

| File | Platform | Size |
|------|----------|------|
| `Horizon-0.1.0.AppImage` | Linux (AppImage) | ~99 MB |
| `horizon-timer_0.1.0_amd64.snap` | Linux (Snap) | ~84 MB |
| `linux-unpacked/` | Linux (unpacked) | Directory |

## Installation

### Linux (AppImage)
```bash
chmod +x Horizon-0.1.0.AppImage
./Horizon-0.1.0.AppImage
```

### Linux (Snap)
```bash
sudo snap install horizon-timer_0.1.0_amd64.snap --dangerous
```

### From Source
```bash
git clone <repo-url>
cd timer
npm install
npm start
```

## Building for Other Platforms

To build for Windows or macOS:

```bash
# Windows
npm run build -- --win

# macOS
npm run build -- --mac

# All platforms
npm run build -- --win --mac --linux
```

## Changelog

### v0.1.0 (Initial Release)
- Complete Electron application with all core features
- Timer with visual phases and bonus time tracking
- Click-through ghost interaction with hover controls
- Quick Capture global hotkey system
- Brown noise audio generator
- Psychoacoustic gentle alarms
- Local-only analytics and session tracking
- 12 unit tests passing

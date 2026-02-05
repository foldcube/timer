# CLAUDE.md - Horizon Timer

## Project Overview

**Horizon** is a Windows-based productivity tool designed specifically for the neurodivergent brain. The core philosophy is **"Invisible Support"** - the app provides a quiet, persistent temporal anchor and a lightning-fast mechanism to offload distracting thoughts, allowing users to remain in flow state.

This is **not** a traditional task manager or notification system. Horizon does not "manage" the user; it provides passive visual cues and zero-friction interactions.

## Repository Status

This repository is in early development. The project will be built as a Windows desktop application.

## Core Features

### 1. The Horizon Line (Visual Timer)
- **Pixel-thin timeline** (1-3px) rendered at the top edge of the monitor
- Spans screen width: 100% = Start, 0% = End (recedes right to left)
- **Color temperature phases:**
  - **Flow (Teal/Cyan):** 0-80% time remaining - calm, cool colors
  - **Transition (Amber):** 80-95% time remaining - gentle warning
  - **Crunch (Soft Rose):** 95-100% - high visibility, non-aggressive

### 2. Ghost Interaction (Zero Friction)
- **Click-through by default** - mouse clicks pass through the timeline
- **Hover activation** - controls appear only after 400ms intentional hover
- Prevents accidental interactions while maintaining accessibility

### 3. Brain Dump / Quick Capture
- **Global hotkey** (Alt+Space or Ctrl+J) triggers instant capture
- Minimalist dark text bar overlays current work
- Type thought → Enter → vanishes with animation
- 2-second loop to offload thoughts without context switching

### 4. Flow-Modoro (Flexible Pomodoro)
- **Soft endings** - no jarring alarms at timer completion
- Timer counts UP (turns Gold) after reaching 0%
- Visual shifts from "Time Remaining" to "Bonus Time Earned"
- Rewards hyperfocus rather than punishing it

### 5. Soundscape & Audio
- **Built-in Brown Noise generator** - auditory blanket for focus
- **Psychoacoustic alarms** - sine waves with slow attack envelope (10-15s fade-in)
- Gently pulls user out of focus without startling

### 6. Compassionate Analytics
- **Distraction Offload Count** - tracks Quick Capture usage as victories
- **Session Quality** - 1-click rating (1-5 stars) at session end
- **Chronotype mapping** - correlates ratings with time of day
- No surveillance metrics (mouse tracking, etc.)

## Architecture Guidelines

### Technology Stack (Planned)
- **Platform:** Windows desktop application
- **Recommended frameworks:** Electron, Tauri, or native Windows (WPF/WinUI)
- **Audio:** Web Audio API or native audio synthesis for brown noise
- **Storage:** Local-first, privacy-focused (no cloud sync required)

### Design Principles

1. **Zero Friction** - Every interaction should take <2 seconds
2. **Peripheral Awareness** - Use visual periphery, not center of attention
3. **Privacy First** - All data stays local, no surveillance metrics
4. **Positive Reinforcement** - Frame distractions caught as victories
5. **Flexibility Over Rigidity** - Adapt to user's flow, don't interrupt it

### Code Conventions

When implementing:
- Prefer simple, readable code over clever abstractions
- Use descriptive variable names (e.g., `timeRemainingPercent`, `isHovering`)
- Keep components small and focused on single responsibilities
- Document non-obvious behavior, especially timing-sensitive code

### Color Palette Reference

```
Flow Phase:      Teal/Cyan   - #00CED1 or similar
Transition:      Amber       - #FFB347 or similar
Crunch Phase:    Soft Rose   - #FFB6C1 or similar
Bonus Time:      Gold        - #FFD700 or similar
UI Background:   Dark        - #1a1a1a or similar
```

### Critical UX Constraints

- **Click-through must work perfectly** - Users will click top of screen for browser tabs
- **Hover delay must be exactly 400ms** - Shorter = accidental triggers, longer = frustration
- **Quick Capture must be instant** - Any lag breaks the "2-second loop"
- **No aggressive sounds** - All audio must fade in gently

## Development Workflow

### Getting Started
```bash
# Clone the repository
git clone <repo-url>
cd timer

# Install dependencies (once package.json exists)
npm install

# Start development server
npm run dev
```

### Branch Naming
- Feature branches: `feature/<description>`
- Bug fixes: `fix/<description>`
- Claude branches: `claude/<session-id>`

### Commit Messages
- Use clear, descriptive messages
- Format: `<type>: <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Testing Approach
- Unit tests for timer logic and calculations
- Integration tests for hotkey handling
- Manual testing for visual/UX components

## Files Structure (Planned)

```
timer/
├── src/
│   ├── main/           # Main process (Electron) or app entry
│   ├── renderer/       # UI components
│   │   ├── HorizonLine/    # Timeline visualization
│   │   ├── QuickCapture/   # Brain dump overlay
│   │   └── Analytics/      # Compassionate analytics
│   ├── audio/          # Brown noise & alarm synthesis
│   ├── hotkeys/        # Global hotkey registration
│   └── storage/        # Local data persistence
├── tests/
├── assets/
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## Key Implementation Notes

### Timer Logic
- Time remaining percentage: `(endTime - currentTime) / totalDuration * 100`
- Bonus time: When percentage goes negative, display as positive "bonus"
- Phase thresholds are configurable but default to 80% and 95%

### Window Behavior
- Timeline window must be **always on top** but **click-through**
- Use Windows APIs: `WS_EX_TRANSPARENT` and `WS_EX_LAYERED` flags
- For Electron: `setIgnoreMouseEvents(true)` with forward option

### Quick Capture Storage
- Store captures in simple JSON or SQLite
- Include timestamp for each capture
- No complex categorization - just raw thought dump

### Analytics Privacy
- All data stored locally only
- No telemetry or external reporting
- User can export/delete their data at any time

## Common Tasks for AI Assistants

1. **Implementing features** - Follow the UX constraints strictly
2. **Bug fixes** - Prioritize timer accuracy and click-through behavior
3. **Testing** - Focus on timing-sensitive code and edge cases
4. **Documentation** - Keep this file updated as the project evolves

## Resources

- ADHD and Pomodoro research: Flexible intervals work better than rigid 25/5
- Brown noise benefits: Lower frequency = better for sustained focus
- Psychoacoustic alarm design: Sine waves + slow attack = gentle alerts

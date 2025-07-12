# 🐼 Panda Battle Royale

A multiplayer 3D browser game built with Three.js where players control low-poly pandas in an arena battle with rocket launchers!

## Features

- **3rd Person Gameplay**: Control your panda character from behind with smooth camera movement
- **WASD Movement**: Use W/A/S/D keys to move around the map
- **Jump & Duck**: Space bar to jump, Ctrl to duck/crouch
- **Mouse Look**: Use mouse to look around and aim freely
- **Rocket Launcher**: Click to shoot rockets at other players
- **Real-time Multiplayer**: Play online against other players
- **Character Selection**: Choose from different colored panda characters
- **Scoreboard**: Track kills, deaths, and damage dealt
- **Kill Feed**: See real-time kill notifications
- **Respawn System**: Automatic respawn after being eliminated

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   - Navigate to `http://localhost:3000`
   - Enter your player name
   - Choose your panda character color
   - Click "Join Game"

## Controls

- **W/A/S/D**: Move your panda
- **Mouse**: Look around and aim
- **Space**: Jump
- **Ctrl**: Duck/Crouch
- **Left Click**: Shoot rocket launcher
- **Click on game area**: Lock mouse for looking around

## Game Rules

- Start with 100 health
- Rocket launchers deal 25 damage per hit
- Respawn automatically after 3 seconds when eliminated
- Scoreboard tracks:
  - Kills (eliminating other players)
  - Deaths (being eliminated)
  - Total damage dealt

## Map Features

- Large open arena with walls as boundaries
- Random cover objects for tactical gameplay
- Spawn points distributed around the map

## Multiplayer

- Real-time synchronization across all players
- Server-side hit detection and game logic
- Spectate other players when dead
- Live scoreboard updates

## Technical Details

- **Frontend**: Three.js for 3D graphics, Socket.IO for real-time communication
- **Backend**: Node.js with Express and Socket.IO
- **Physics**: Basic gravity and collision detection
- **Networking**: Real-time multiplayer with 60 FPS server tick rate

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Browser Requirements

- Modern browser with WebGL support
- Mouse and keyboard for controls
- Stable internet connection for multiplayer

Enjoy the panda mayhem! 🎮🐼🚀

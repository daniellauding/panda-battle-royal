# 🐼 Panda Battle Royale

A multiplayer 3D browser game featuring adorable pandas with rocket launchers in an explosive battle royale!

![Game Preview](https://img.shields.io/badge/Game-Live%20Multiplayer-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-blue) ![Three.js](https://img.shields.io/badge/Three.js-3D%20Graphics-orange)

## 🎮 Features

- **🐼 10 Colorful Pandas**: Choose from Red, Blue, Green, Purple, Pink, Orange, Golden, Cyan, Brown, or Classic pandas
- **🏃 Animated Characters**: Realistic walking and running animations with arm swinging and body bobbing
- **🌍 Rich 3D Environment**: Explore maps with low-poly trees, wooden bridges, and fence areas
- **💥 Spectacular Explosions**: Enhanced explosion effects with particles when shooting objects and players
- **🚀 Physics-Based Combat**: Rocket jumping, collision detection, and explosive gameplay
- **🎯 Real-time Multiplayer**: Battle other players in real-time using Socket.IO
- **💬 In-Game Chat**: Communicate with other players (press Enter)
- **📊 Live Scoreboard**: Track kills, deaths, and damage in real-time
- **🎪 Multiple Camera Modes**: Switch between first and third person views
- **🏗️ Solid Collision**: Can't walk through trees, bridges, or other objects

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

## 🌐 Deployment

**⚠️ Important**: This is a Node.js server application and **cannot** be deployed to static hosting services like Netlify or GitHub Pages.

### Recommended FREE Hosting Platforms:

1. **[Render](https://render.com)** ⭐ (Recommended)
2. **[Railway](https://railway.app)**
3. **[Heroku](https://heroku.com)** (No longer free)

### Quick Deploy to Render (FREE):
1. Push your code to GitHub
2. Connect Render to your GitHub repo  
3. Render will auto-detect Node.js and deploy using `render.yaml`
4. Your game will be live at `https://your-repo-name.onrender.com`

📖 **Detailed deployment instructions**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## 🛠️ Technology Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Three.js for 3D graphics
- **Real-time**: WebSocket communication for multiplayer
- **Deployment**: Docker, Render, Railway, Heroku ready

Enjoy the panda mayhem! 🎮🐼🚀

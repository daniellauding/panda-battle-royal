const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Game state
const players = new Map();
const projectiles = new Map();
const gameStats = {
    totalKills: 0,
    totalDeaths: 0,
    totalDamage: 0
};

// Game constants
const GAME_CONFIG = {
    mapSize: 100,
    playerSpeed: 5,
    projectileSpeed: 50,
    projectileDamage: 25,
    playerHealth: 100,
    respawnTime: 3000
};

// Player class
class Player {
    constructor(id, name, character) {
        this.id = id;
        this.name = name;
        this.character = character;
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.isCrouching = false;
        this.health = GAME_CONFIG.playerHealth;
        this.kills = 0;
        this.deaths = 0;
        this.damage = 0;
        this.alive = true;
        this.lastShot = 0;
        this.respawnTimer = null;
    }

    takeDamage(damage, attackerId) {
        this.health -= damage;
        if (this.health <= 0) {
            this.die();
            if (attackerId && players.has(attackerId)) {
                players.get(attackerId).kills++;
                players.get(attackerId).damage += damage;
            }
        }
        return this.health <= 0;
    }

    die() {
        this.alive = false;
        this.deaths++;
        this.health = 0;
        gameStats.totalDeaths++;
        
        // Respawn after delay
        this.respawnTimer = setTimeout(() => {
            this.respawn();
        }, GAME_CONFIG.respawnTime);
    }

    respawn() {
        this.health = GAME_CONFIG.playerHealth;
        this.alive = true;
        this.position = this.getRandomSpawnPosition();
        this.respawnTimer = null;
        
        // Broadcast respawn to all clients
        io.emit('player-respawned', {
            id: this.id,
            name: this.name,
            character: this.character,
            position: this.position,
            rotation: this.rotation,
            health: this.health,
            alive: this.alive,
            kills: this.kills,
            deaths: this.deaths,
            damage: this.damage
        });
        
        console.log(`Player ${this.name} respawned at:`, this.position);
    }

    getRandomSpawnPosition() {
        const mapSize = GAME_CONFIG.mapSize;
        return {
            x: (Math.random() - 0.5) * mapSize,
            y: 5, // Spawn above ground
            z: (Math.random() - 0.5) * mapSize
        };
    }
}

// Projectile class
class Projectile {
    constructor(id, playerId, position, direction) {
        this.id = id;
        this.playerId = playerId;
        this.position = { ...position };
        this.direction = { ...direction };
        this.speed = GAME_CONFIG.projectileSpeed;
        this.damage = GAME_CONFIG.projectileDamage;
        this.lifetime = 5000; // 5 seconds
        this.startTime = Date.now();
    }

    update(deltaTime) {
        // Move projectile
        this.position.x += this.direction.x * this.speed * deltaTime;
        this.position.y += this.direction.y * this.speed * deltaTime;
        this.position.z += this.direction.z * this.speed * deltaTime;

        // Check if expired
        return Date.now() - this.startTime < this.lifetime;
    }

    checkCollision(player) {
        const distance = Math.sqrt(
            Math.pow(this.position.x - player.position.x, 2) +
            Math.pow(this.position.y - player.position.y, 2) +
            Math.pow(this.position.z - player.position.z, 2)
        );
        return distance < 2; // Hit radius
    }

    checkWallCollision() {
        const mapBounds = GAME_CONFIG.mapSize / 2;
        
        // Check map boundaries
        if (Math.abs(this.position.x) > mapBounds || 
            Math.abs(this.position.z) > mapBounds ||
            this.position.y <= 0 || // Hit ground
            this.position.y > 20) { // Hit ceiling
            return true;
        }
        
        return false;
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Handle player joining
    socket.on('join-game', (data) => {
        const { name, character } = data;
        const player = new Player(socket.id, name, character);
        player.position = player.getRandomSpawnPosition();
        players.set(socket.id, player);

        // Send initial game state to new player including ALL existing players
        const allPlayers = Array.from(players.values()).map(p => ({
            id: p.id,
            name: p.name,
            character: p.character,
            position: p.position,
            rotation: p.rotation,
            velocity: p.velocity || { x: 0, y: 0, z: 0 },
            isCrouching: p.isCrouching || false,
            health: p.health,
            alive: p.alive
        }));
        
        socket.emit('game-joined', {
            playerId: socket.id,
            config: GAME_CONFIG,
            players: allPlayers
        });
        
        console.log(`Sending ${allPlayers.length} existing players to new player ${name}`);

        // Notify other players
        console.log('Broadcasting new player to others:', player.name);
        socket.broadcast.emit('player-joined', {
            id: player.id,
            name: player.name,
            character: player.character,
            position: player.position,
            rotation: player.rotation,
            velocity: player.velocity,
            isCrouching: player.isCrouching,
            health: player.health,
            alive: player.alive
        });

        console.log(`Player ${name} joined the game`);
    });

    // Handle player movement
    socket.on('player-move', (data) => {
        const player = players.get(socket.id);
        if (player && player.alive) {
            // Update server player state
            player.position = data.position;
            player.rotation = data.rotation;
            
            // Store additional state if provided
            if (data.velocity) player.velocity = data.velocity;
            if (data.isCrouching !== undefined) player.isCrouching = data.isCrouching;
            
            // Broadcast complete movement data to ALL other players
            socket.broadcast.emit('player-moved', {
                id: socket.id,
                name: player.name,
                position: data.position,
                rotation: data.rotation,
                velocity: data.velocity || { x: 0, y: 0, z: 0 },
                isCrouching: data.isCrouching || false,
                alive: player.alive,
                health: player.health
            });
            console.log('Broadcasting movement for player:', player.name);
        }
    });

    // Handle shooting
    socket.on('player-shoot', (data) => {
        const player = players.get(socket.id);
        if (player && player.alive) {
            const now = Date.now();
            const cooldown = 500; // 500ms between shots
            
            if (now - player.lastShot > cooldown) {
                player.lastShot = now;
                
                const projectileId = data.id || uuidv4();
                const projectile = new Projectile(
                    projectileId,
                    socket.id,
                    data.position,
                    data.direction
                );
                
                projectiles.set(projectileId, projectile);
                console.log('Server created projectile:', projectileId, 'from player:', player.name);
                
                // Broadcast projectile to ALL players (including sender)
                io.emit('projectile-fired', {
                    id: projectileId,
                    playerId: socket.id,
                    position: data.position,
                    direction: data.direction
                });
                console.log('Broadcasted projectile to all players');
            }
        }
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
        const player = players.get(socket.id);
        if (player && data.message && data.message.trim()) {
            const message = data.message.trim().substring(0, 150); // Limit message length
            
            // Broadcast message to all players
            io.emit('chat-message', {
                playerId: socket.id,
                playerName: player.name,
                message: message,
                timestamp: Date.now()
            });
            
            console.log(`Chat message from ${player.name}: ${message}`);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`Player ${player.name} disconnected`);
            if (player.respawnTimer) {
                clearTimeout(player.respawnTimer);
            }
            players.delete(socket.id);
            socket.broadcast.emit('player-left', socket.id);
        }
    });
});

// Game loop
const gameLoop = () => {
    const deltaTime = 1/60; // 60 FPS
    
    // Update projectiles
    for (const [projectileId, projectile] of projectiles.entries()) {
        if (!projectile.update(deltaTime)) {
            projectiles.delete(projectileId);
            io.emit('projectile-expired', projectileId);
            continue;
        }
        
        // Check collision with walls/ground first
        if (projectile.checkWallCollision()) {
            // Create explosion at projectile position
            const explosionPosition = projectile.position;
            const explosionRadius = 8;
            const explosionDamage = projectile.damage;
            
            // Remove projectile
            projectiles.delete(projectileId);
            
            // Broadcast explosion
            io.emit('projectile-exploded', {
                id: projectileId,
                position: explosionPosition,
                radius: explosionRadius
            });
            
            // Apply explosion damage to all nearby players
            for (const [nearbyPlayerId, nearbyPlayer] of players.entries()) {
                if (nearbyPlayer.alive) {
                    const distance = Math.sqrt(
                        Math.pow(explosionPosition.x - nearbyPlayer.position.x, 2) +
                        Math.pow(explosionPosition.y - nearbyPlayer.position.y, 2) +
                        Math.pow(explosionPosition.z - nearbyPlayer.position.z, 2)
                    );
                    
                    if (distance < explosionRadius) {
                        // Calculate damage based on distance (closer = more damage)
                        const damageMultiplier = 1 - (distance / explosionRadius);
                        const actualDamage = Math.floor(explosionDamage * damageMultiplier);
                        
                        if (actualDamage > 0) {
                            const killed = nearbyPlayer.takeDamage(actualDamage, projectile.playerId);
                            
                            // Rocket jumping effect - apply upward force if it's the shooter
                            if (nearbyPlayerId === projectile.playerId && distance < explosionRadius * 0.5) {
                                // Apply rocket jump force
                                io.emit('rocket-jump', {
                                    playerId: nearbyPlayerId,
                                    force: {
                                        x: (nearbyPlayer.position.x - explosionPosition.x) * 2,
                                        y: 15, // Strong upward force
                                        z: (nearbyPlayer.position.z - explosionPosition.z) * 2
                                    }
                                });
                            }
                            
                            // Broadcast hit
                            io.emit('player-hit', {
                                playerId: nearbyPlayerId,
                                damage: actualDamage,
                                health: nearbyPlayer.health,
                                killed: killed,
                                attackerId: projectile.playerId,
                                explosion: true
                            });
                            
                            if (killed) {
                                gameStats.totalKills++;
                                gameStats.totalDamage += actualDamage;

                                // Broadcast kill
                                io.emit('player-killed', {
                                    playerId: nearbyPlayerId,
                                    killerId: projectile.playerId
                                });
                            }
                        }
                    }
                }
            }
            
            continue;
        }
        
        // Check collisions with players
        for (const [playerId, player] of players.entries()) {
            if (player.alive && playerId !== projectile.playerId) {
                if (projectile.checkCollision(player)) {
                    // Create explosion at projectile position
                    const explosionPosition = projectile.position;
                    const explosionRadius = 8;
                    const explosionDamage = projectile.damage;
                    
                    // Remove projectile
                    projectiles.delete(projectileId);
                    
                    // Broadcast explosion
                    io.emit('projectile-exploded', {
                        id: projectileId,
                        position: explosionPosition,
                        radius: explosionRadius
                    });
                    
                    // Apply explosion damage to all nearby players
                    for (const [nearbyPlayerId, nearbyPlayer] of players.entries()) {
                        if (nearbyPlayer.alive) {
                            const distance = Math.sqrt(
                                Math.pow(explosionPosition.x - nearbyPlayer.position.x, 2) +
                                Math.pow(explosionPosition.y - nearbyPlayer.position.y, 2) +
                                Math.pow(explosionPosition.z - nearbyPlayer.position.z, 2)
                            );
                            
                            if (distance < explosionRadius) {
                                // Calculate damage based on distance (closer = more damage)
                                const damageMultiplier = 1 - (distance / explosionRadius);
                                const actualDamage = Math.floor(explosionDamage * damageMultiplier);
                                
                                if (actualDamage > 0) {
                                    const killed = nearbyPlayer.takeDamage(actualDamage, projectile.playerId);
                                    
                                    // Rocket jumping effect - apply upward force if it's the shooter
                                    if (nearbyPlayerId === projectile.playerId && distance < explosionRadius * 0.5) {
                                        // Apply rocket jump force
                                        io.emit('rocket-jump', {
                                            playerId: nearbyPlayerId,
                                            force: {
                                                x: (nearbyPlayer.position.x - explosionPosition.x) * 2,
                                                y: 15, // Strong upward force
                                                z: (nearbyPlayer.position.z - explosionPosition.z) * 2
                                            }
                                        });
                                    }
                                    
                                    // Broadcast hit
                                    io.emit('player-hit', {
                                        playerId: nearbyPlayerId,
                                        damage: actualDamage,
                                        health: nearbyPlayer.health,
                                        killed: killed,
                                        attackerId: projectile.playerId,
                                        explosion: true
                                    });
                                    
                                    if (killed) {
                                        gameStats.totalKills++;
                                        gameStats.totalDamage += actualDamage;

                                        // Broadcast kill
                                        io.emit('player-killed', {
                                            playerId: nearbyPlayerId,
                                            killerId: projectile.playerId
                                        });
                                    }
                                }
                            }
                        }
                    }
                    
                    break;
                }
            }
        }
    }
    
    // Broadcast scoreboard update periodically
    if (Date.now() % 1000 < 16) { // roughly every second
        const scoreboard = Array.from(players.values())
            .map(p => ({
                name: p.name,
                kills: p.kills,
                deaths: p.deaths,
                damage: p.damage
            }))
            .sort((a, b) => b.kills - a.kills);
        
        io.emit('scoreboard-update', scoreboard);
    }
};

// Start game loop
setInterval(gameLoop, 1000/60); // 60 FPS

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Panda Battle Royale server running on port ${PORT}`);
});

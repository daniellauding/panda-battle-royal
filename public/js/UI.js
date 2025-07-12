class UI {
    constructor(game) {
        this.game = game;
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.scoreboardContent = document.getElementById('scoreboard-content');
        this.killFeed = document.getElementById('kill-feed');
        this.respawnScreen = document.getElementById('respawn-screen');
        this.respawnTimer = document.getElementById('respawn-timer');
        this.crosshair = document.querySelector('.crosshair');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatInputContainer = document.getElementById('chat-input-container');
        this.chatMessageTimeouts = [];
        this.lockMessage = null;
        this.cameraModeIndicator = null;
        this.createLockMessage();
        this.createCameraModeIndicator();
    }

    updateHealth(health) {
        this.healthFill.style.width = `${health}%`;
        this.healthText.innerText = health;
    }

    updateScoreboard(scoreboard) {
        this.scoreboardContent.innerHTML = '';
        scoreboard.forEach((player, index) => {
            const entry = document.createElement('div');
            entry.className = 'scoreboard-entry';
            entry.innerHTML = `${index + 1}. ${player.name} - Kills: ${player.kills} | Deaths: ${player.deaths} | Damage: ${player.damage}`;
            this.scoreboardContent.appendChild(entry);
        });
    }

    showKillNotification(killerName, victimName) {
        const notification = document.createElement('div');
        notification.className = 'kill-notification';
        notification.innerText = `${killerName} killed ${victimName}`;
        this.killFeed.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            this.killFeed.removeChild(notification);
        }, 5000);
    }

    showRespawnScreen() {
        this.respawnScreen.style.display = 'flex';
        let countdown = 3;
        this.respawnTimer.innerText = countdown;

        const interval = setInterval(() => {
            countdown -= 1;
            this.respawnTimer.innerText = countdown;
            if (countdown <= 0) {
                clearInterval(interval);
                this.respawnScreen.style.display = 'none';
                this.game.localPlayer.respawn();
            }
        }, 1000);
    }

    updateNotifications(type, data) {
        if (type === 'rocket-jump') {
            const player = this.game.players.get(data.playerId);
            if (player) {
                player.velocity.y += data.force.y;
                player.velocity.x += data.force.x;
                player.velocity.z += data.force.z;
                console.log('Rocket jump applied: ', data.force);
            }
        }
    }
    setCrosshairReady() {
        if (this.crosshair) {
            this.crosshair.className = 'crosshair ready';
        }
    }

    setCrosshairCooldown() {
        if (this.crosshair) {
            this.crosshair.className = 'crosshair cooldown';
        }
    }
    
    setCrosshairAiming() {
        if (this.crosshair) {
            this.crosshair.className = 'crosshair aiming';
        }
    }
    
    setCrosshairNormal() {
        if (this.crosshair) {
            this.crosshair.className = 'crosshair ready';
        }
    }

    showChatInput() {
        this.chatInputContainer.style.display = 'block';
        this.chatInput.focus();
        this.chatInput.value = '';
    }

    hideChatInput() {
        this.chatInputContainer.style.display = 'none';
        this.chatInput.blur();
    }

    sendChatMessage() {
        const message = this.chatInput.value.trim();
        if (message) {
            this.game.sendChatMessage(message);
            this.chatInput.value = '';
        }
    }

    addChatMessage(playerName, message, isOwnMessage = false) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = playerName + ': ';
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'message-text';
        messageSpan.textContent = message;
        
        messageElement.appendChild(nameSpan);
        messageElement.appendChild(messageSpan);
        
        this.chatMessages.appendChild(messageElement);
        
        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Remove message after 8 seconds
        const timeout = setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 8000);
        
        this.chatMessageTimeouts.push(timeout);
        
        // Keep only last 50 messages
        while (this.chatMessages.children.length > 50) {
            this.chatMessages.removeChild(this.chatMessages.firstChild);
        }
    }

    clearChatMessages() {
        this.chatMessages.innerHTML = '';
        this.chatMessageTimeouts.forEach(timeout => clearTimeout(timeout));
        this.chatMessageTimeouts = [];
    }

    createLockMessage() {
        this.lockMessage = document.createElement('div');
        this.lockMessage.id = 'lock-message';
        this.lockMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            text-align: center;
            z-index: 1000;
            display: none;
        `;
        this.lockMessage.innerHTML = `
            <div>Click to aim with mouse</div>
            <div style="font-size: 14px; margin-top: 10px;">Press WASD to move, SPACE to jump</div>
        `;
        document.body.appendChild(this.lockMessage);
    }

    showLockMessage() {
        if (this.lockMessage) {
            this.lockMessage.style.display = 'block';
        }
    }

    hideLockMessage() {
        if (this.lockMessage) {
            this.lockMessage.style.display = 'none';
        }
    }
    
    createCameraModeIndicator() {
        this.cameraModeIndicator = document.createElement('div');
        this.cameraModeIndicator.id = 'camera-mode-indicator';
        this.cameraModeIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-size: 14px;
            font-family: monospace;
            z-index: 999;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        this.cameraModeIndicator.textContent = 'Third Person';
        document.body.appendChild(this.cameraModeIndicator);
    }
    
    updateCameraModeIndicator(mode) {
        if (this.cameraModeIndicator) {
            if (mode === 'first-person') {
                this.cameraModeIndicator.textContent = 'First Person';
                this.cameraModeIndicator.style.background = 'rgba(0, 100, 0, 0.7)';
            } else {
                this.cameraModeIndicator.textContent = 'Third Person';
                this.cameraModeIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
            }
        }
    }
}
